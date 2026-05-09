<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IGroupManager;
use OCP\IRequest;
use OCP\IUserManager;

class UserController extends Controller {
    public function __construct(
        string              $appName,
        IRequest            $request,
        private readonly IUserManager  $userManager,
        private readonly IGroupManager $groupManager
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $users = [];
        $this->userManager->callForSeenUsers(function (\OCP\IUser $user) use (&$users) {
            $users[] = [
                'uid'         => $user->getUID(),
                'displayName' => $user->getDisplayName(),
                'email'       => $user->getEMailAddress() ?? '',
            ];
        });
        usort($users, fn($a, $b) => strcmp($a['displayName'], $b['displayName']));
        return new DataResponse($users);
    }

    /** @NoAdminRequired */
    public function groups(): DataResponse {
        $groups = [];
        foreach ($this->groupManager->search('') as $group) {
            $groups[] = [
                'gid'         => $group->getGID(),
                'displayName' => $group->getDisplayName(),
            ];
        }
        usort($groups, fn($a, $b) => strcmp($a['displayName'], $b['displayName']));
        return new DataResponse($groups);
    }
}
