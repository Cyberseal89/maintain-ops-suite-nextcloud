<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\IGroupManager;

class PlatformMapper extends QBMapper {
    public function __construct(
        IDBConnection $db,
        private readonly IGroupManager $groupManager
    ) {
        parent::__construct($db, 'ops_platforms', Platform::class);
    }

    public function find(int $id): Platform {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->orderBy('name', 'ASC');
        return $this->findEntities($qb);
    }

    /**
     * Find platforms the user belongs to via group membership
     */
    public function findForUser(string $uid): array {
        $all = $this->findAll();
        if (empty($all)) return [];

        $userGroups = array_keys($this->groupManager->getUserIdGroups($uid));

        return array_values(array_filter($all, function($platform) use ($userGroups) {
            // If no group set, platform is accessible to all
            if (empty($platform->getGroupName())) return true;
            return in_array($platform->getGroupName(), $userGroups);
        }));
    }

    /**
     * Get platform IDs for a user
     */
    public function getPlatformIdsForUser(string $uid): array {
        $platforms = $this->findForUser($uid);
        return array_map(fn($p) => $p->getId(), $platforms);
    }
}
