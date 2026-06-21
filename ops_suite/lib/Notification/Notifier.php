<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Notification;

use OCP\IURLGenerator;
use OCP\L10N\IFactory;
use OCP\Notification\INotification;
use OCP\Notification\INotifier;

class Notifier implements INotifier {

    public function __construct(
        private readonly IFactory      $l10nFactory,
        private readonly IURLGenerator $urlGenerator,
    ) {}

    public function getID(): string   { return 'ops_suite'; }
    public function getName(): string { return 'Maintain Ops Suite'; }

    public function prepare(INotification $notification, string $languageCode): INotification {
        if ($notification->getApp() !== 'ops_suite') {
            throw new \InvalidArgumentException('Not an ops_suite notification');
        }

        $p = $notification->getSubjectParameters();

        match ($notification->getSubject()) {
            'node_offline' => $notification
                ->setParsedSubject('Fleet Node Offline: ' . ($p['hostname'] ?? 'unknown'))
                ->setParsedMessage(
                    'Node ' . ($p['hostname'] ?? '?') . ' (' . ($p['ip'] ?? '?') . ') '
                    . 'has not checked in for over ' . ($p['minutes'] ?? '?') . ' minutes. '
                    . 'Last seen: ' . ($p['last_seen'] ?? 'never') . '.'
                ),
            'node_online' => $notification
                ->setParsedSubject('Fleet Node Back Online: ' . ($p['hostname'] ?? 'unknown'))
                ->setParsedMessage(
                    'Node ' . ($p['hostname'] ?? '?') . ' has reconnected after being offline.'
                ),
            'node_alert' => $notification
                ->setParsedSubject('Fleet Alert: ' . ($p['hostname'] ?? 'unknown'))
                ->setParsedMessage($p['message'] ?? ''),
            default => throw new \InvalidArgumentException('Unknown subject: ' . $notification->getSubject()),
        };

        $notification->setIcon(
            $this->urlGenerator->getAbsoluteURL(
                $this->urlGenerator->imagePath('ops_suite', 'app.svg')
            )
        );

        return $notification;
    }
}
