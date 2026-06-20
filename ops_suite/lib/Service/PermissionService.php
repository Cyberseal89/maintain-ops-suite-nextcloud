<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCP\IConfig;
use OCP\IDBConnection;
use OCP\IGroupManager;
use OCP\IUserSession;

/**
 * Role hierarchy (highest wins):
 *   admin > multi_site_manager > platform_manager > shop_supervisor >
 *   lead_technician > technician > quality_inspector > safety_officer >
 *   logistics_coordinator > maintenance_planner > contractor > read_only
 *
 * Each role maps to a Nextcloud group stored in appconfig as role_group_{role}.
 * NC admins always resolve to 'admin' regardless of group config.
 * If no groups are configured the system is open — everyone gets technician access.
 *
 * Shop scoping: users assigned to specific shops via ops_shop_users table.
 * Roles at shop_supervisor and below are shop-scoped when assignments exist.
 */
class PermissionService {

    public const ROLES = [
        'admin',
        'multi_site_manager',
        'platform_manager',
        'shop_supervisor',
        'lead_technician',
        'technician',
        'quality_inspector',
        'safety_officer',
        'logistics_coordinator',
        'maintenance_planner',
        'contractor',
        'read_only',
    ];

    public const ROLE_LABELS = [
        'admin'                 => 'Administrator',
        'multi_site_manager'    => 'Multi-Site Manager',
        'platform_manager'      => 'Platform Manager',
        'shop_supervisor'       => 'Shop Supervisor',
        'lead_technician'       => 'Lead Technician',
        'technician'            => 'Technician',
        'quality_inspector'     => 'Quality Inspector',
        'safety_officer'        => 'Safety Officer',
        'logistics_coordinator' => 'Logistics Coordinator',
        'maintenance_planner'   => 'Maintenance Planner',
        'contractor'            => 'Contractor',
        'read_only'             => 'Read Only',
    ];

    // Roles that have write access
    private const WRITE_ROLES = [
        'admin', 'multi_site_manager', 'platform_manager', 'shop_supervisor',
        'lead_technician', 'technician', 'quality_inspector', 'safety_officer',
        'logistics_coordinator', 'maintenance_planner',
    ];

    // Roles that can approve CCB transitions
    private const APPROVE_ROLES = ['admin', 'multi_site_manager', 'platform_manager'];

    // Roles that can access admin settings
    private const ADMIN_ROLES = ['admin', 'multi_site_manager'];

    // Roles that are shop-scoped (list endpoints filter by assigned shops)
    private const SHOP_SCOPED_ROLES = [
        'shop_supervisor', 'lead_technician', 'technician',
        'quality_inspector', 'safety_officer', 'contractor',
    ];

    private ?string $cachedRole    = null;
    private ?array  $cachedShopIds = null;

    public function __construct(
        private readonly IConfig       $config,
        private readonly IGroupManager $groupManager,
        private readonly IUserSession  $userSession,
        private readonly IDBConnection $db,
    ) {}

    /** Returns the user's highest role string, or 'read_only' if not authenticated. */
    public function getRole(): string {
        if ($this->cachedRole !== null) return $this->cachedRole;

        $user = $this->userSession->getUser();
        if (!$user) return $this->cachedRole = 'read_only';

        $uid = $user->getUID();

        if ($this->groupManager->isAdmin($uid)) {
            return $this->cachedRole = 'admin';
        }

        foreach (self::ROLES as $role) {
            $groupName = $this->config->getAppValue('ops_suite', 'role_group_'.$role, '');
            if ($groupName === '') continue;
            $group = $this->groupManager->get($groupName);
            if ($group && $group->inGroup($user)) {
                return $this->cachedRole = $role;
            }
        }

        $anyConfigured = false;
        foreach (self::ROLES as $role) {
            if ($this->config->getAppValue('ops_suite', 'role_group_'.$role, '') !== '') {
                $anyConfigured = true;
                break;
            }
        }

        return $this->cachedRole = $anyConfigured ? 'read_only' : 'technician';
    }

    public function canWrite(): bool {
        return in_array($this->getRole(), self::WRITE_ROLES, true);
    }

    public function canAdmin(): bool {
        return in_array($this->getRole(), self::ADMIN_ROLES, true);
    }

    public function canApprove(): bool {
        return in_array($this->getRole(), self::APPROVE_ROLES, true);
    }

    /** True for roles that are shop-scoped (list endpoints should filter by assigned shops). */
    public function isShopScoped(): bool {
        return in_array($this->getRole(), self::SHOP_SCOPED_ROLES, true);
    }

    /**
     * Returns the shop IDs this user is explicitly assigned to.
     * Empty array means no assignments — behaves as unscoped (sees all) for non-shop-scoped roles,
     * or sees nothing for shop-scoped roles with no assignments.
     * @return int[]
     */
    public function getUserShopIds(): array {
        if ($this->cachedShopIds !== null) return $this->cachedShopIds;

        $user = $this->userSession->getUser();
        if (!$user) return $this->cachedShopIds = [];

        $qb = $this->db->getQueryBuilder();
        $qb->select('shop_id')->from('ops_shop_users')
           ->where($qb->expr()->eq('user_uid', $qb->createNamedParameter($user->getUID())));

        $result = $qb->executeQuery();
        $ids = [];
        while ($row = $result->fetch()) {
            $ids[] = (int)$row['shop_id'];
        }
        $result->closeCursor();
        return $this->cachedShopIds = $ids;
    }

    /**
     * Returns shop IDs to filter list queries by, or null meaning "no filter" (show all).
     * @return int[]|null
     */
    public function getShopFilter(): ?array {
        if (!$this->isShopScoped()) return null;
        $ids = $this->getUserShopIds();
        return $ids ?: null; // null = no assignments yet, show nothing vs. unscoped
    }

    public function getPermissionSummary(): array {
        $role    = $this->getRole();
        $shopIds = $this->getUserShopIds();
        return [
            'role'          => $role,
            'label'         => self::ROLE_LABELS[$role] ?? $role,
            'can_write'     => $this->canWrite(),
            'can_admin'     => $this->canAdmin(),
            'can_approve'   => $this->canApprove(),
            'is_shop_scoped'=> $this->isShopScoped(),
            'shop_ids'      => $shopIds,
        ];
    }
}
