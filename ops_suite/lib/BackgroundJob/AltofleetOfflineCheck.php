<?php
declare(strict_types=1);

namespace OCA\OpsSuite\BackgroundJob;

use OCA\OpsSuite\Db\AltofleetNodeMapper;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;
use OCP\IGroupManager;
use OCP\Notification\IManager as INotificationManager;

/**
 * Runs every 2 minutes via Nextcloud cron.
 * Marks nodes stale → offline and notifies admin group.
 */
class AltofleetOfflineCheck extends TimedJob {

    // A node that hasn't been seen in 3 minutes is considered offline
    private const STALE_SECONDS = 180;

    public function __construct(
        ITimeFactory                        $time,
        private readonly AltofleetNodeMapper   $nodeMapper,
        private readonly INotificationManager  $notificationManager,
        private readonly IGroupManager         $groupManager,
    ) {
        parent::__construct($time);
        $this->setInterval(120); // run every 2 minutes
    }

    protected function run(mixed $argument): void {
        $staleNodes = $this->nodeMapper->findStale(self::STALE_SECONDS);
        $adminUids  = $this->getAdminUids();
        $now        = date('Y-m-d H:i:s');

        foreach ($staleNodes as $node) {
            $minutesOffline = (int)round((time() - strtotime($node->getLastSeen())) / 60);
            $node->setStatus('offline');
            $node->setUpdatedAt($now);
            $this->nodeMapper->update($node);

            foreach ($adminUids as $uid) {
                $notification = $this->notificationManager->createNotification();
                $notification
                    ->setApp('ops_suite')
                    ->setUser($uid)
                    ->setDateTime(new \DateTime())
                    ->setObject('altofleet_node', (string)$node->getId())
                    ->setSubject('node_offline', [
                        'hostname'  => $node->getHostname(),
                        'ip'        => $node->getIpAddress(),
                        'minutes'   => (string)$minutesOffline,
                        'last_seen' => $node->getLastSeen(),
                    ]);
                $this->notificationManager->notify($notification);
            }
        }
    }

    /** @return string[] */
    private function getAdminUids(): array {
        $group = $this->groupManager->get('admin');
        if (!$group) return [];
        return array_map(fn($u) => $u->getUID(), $group->getUsers());
    }
}
