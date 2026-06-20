<?php
declare(strict_types=1);

namespace OCA\OpsSuite\AppInfo;

use OCA\OpsSuite\Migration\SeedFailureModes;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Files\IRootFolder;
use OCP\IUserSession;

class Application extends App implements IBootstrap {
    public const APP_ID    = 'ops_suite';
    public const SOP_FOLDER = 'PMS Procedures';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        $context->registerRepairStep(SeedFailureModes::class);
    }

    public function boot(IBootContext $context): void {
        // When a user logs in, ensure their PMS Procedures folder exists
        $server = $context->getServerContainer();
        $userSession = $server->get(IUserSession::class);

        $userSession->listen('\OC\User', 'postLogin', function () use ($server) {
            try {
                $session    = $server->get(IUserSession::class);
                $user       = $session->getUser();
                if (!$user) return;

                $rootFolder = $server->get(IRootFolder::class);
                $userFolder = $rootFolder->getUserFolder($user->getUID());

                if (!$userFolder->nodeExists(self::SOP_FOLDER)) {
                    $userFolder->newFolder(self::SOP_FOLDER);
                }
            } catch (\Throwable $e) {
                // Non-fatal — folder will be created on first SOP picker access
            }
        });
    }
}
