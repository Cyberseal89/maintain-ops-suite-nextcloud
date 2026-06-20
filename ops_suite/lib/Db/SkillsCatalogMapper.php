<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class SkillsCatalogMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_skills_catalog', SkillsCatalog::class);
    }

    public function find(int $id): SkillsCatalog {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return SkillsCatalog[] */
    public function findAll(?string $category = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($category !== null) {
            $qb->andWhere($qb->expr()->eq('category', $qb->createNamedParameter($category)));
        }
        $qb->orderBy('category', 'ASC')->addOrderBy('name', 'ASC');
        return $this->findEntities($qb);
    }
}
