<?php
declare(strict_types=1);

namespace OCA\OpsSuite\AppInfo;

use OCA\OpsSuite\BackgroundJob\AltofleetOfflineCheck;
use OCA\OpsSuite\Migration\SeedFailureModes;
use OCA\OpsSuite\Notification\Notifier;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\BackgroundJob\IJobList;
use OCP\Files\IRootFolder;
use OCP\IUserSession;

class Application extends App implements IBootstrap {
    public const APP_ID    = 'ops_suite';
    public const SOP_FOLDER = 'PMS Procedures';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        // NC33 renamed registerNotifier → registerNotifierService
        if (method_exists($context, 'registerNotifierService')) {
            $context->registerNotifierService(Notifier::class);
        } else {
            $context->registerNotifier(Notifier::class);
        }

        // NC33 removed registerBackgroundJob; fallback handled in boot() via IJobList
        if (method_exists($context, 'registerBackgroundJob')) {
            $context->registerBackgroundJob(AltofleetOfflineCheck::class);
        }

        // NC33 removed registerRepairStep; SeedFailureModes is a one-time seed already applied
        if (method_exists($context, 'registerRepairStep')) {
            $context->registerRepairStep(SeedFailureModes::class);
        }
    }

    public function boot(IBootContext $context): void {
        // NC33+: background job registration moved out of IRegistrationContext
        if (!method_exists(IRegistrationContext::class, 'registerBackgroundJob')) {
            try {
                $context->getServerContainer()->get(IJobList::class)->add(AltofleetOfflineCheck::class);
            } catch (\Throwable $e) {}
        }

        $server = $context->getServerContainer();
        try {
            $userSession = $server->get(IUserSession::class);
            $userSession->listen('\OC\User', 'postLogin', function () use ($server) {
                try {
                    $user = $server->get(IUserSession::class)->getUser();
                    if (!$user) return;
                    $userFolder = $server->get(IRootFolder::class)->getUserFolder($user->getUID());
                    if (!$userFolder->nodeExists(self::SOP_FOLDER)) {
                        $userFolder->newFolder(self::SOP_FOLDER);
                    }
                } catch (\Throwable $e) {}
            });
        } catch (\Throwable $e) {}
    }
}
