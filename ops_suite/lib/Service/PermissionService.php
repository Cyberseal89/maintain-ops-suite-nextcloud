<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCP\IConfig;
use OCP\IGroupManager;
use OCP\IUserSession;

/**
 * Determines whether the current user can make write operations.
 *
 * Rules:
 *  - NC admins can always write.
 *  - If no editor_group is configured, everyone can write (open mode).
 *  - If an editor_group is configured, only members of that group can write.
 */
class PermissionService {
    public function __construct(
        private readonly IConfig       $config,
        private readonly IGroupManager $groupManager,
        private readonly IUserSession  $userSession
    ) {}

    public function canWrite(): bool {
        $user = $this->userSession->getUser();
        if (!$user) return false;

        // NC admins always have write access
        if ($this->groupManager->isAdmin($user->getUID())) return true;

        $editorGroup = $this->config->getAppValue('ops_suite', 'editor_group', '');

        // No group configured — everyone can write
        if ($editorGroup === '') return true;

        // Check group membership
        $group = $this->groupManager->get($editorGroup);
        if (!$group) return true; // Group was deleted — fail open

        return $group->inGroup($user);
    }
}
