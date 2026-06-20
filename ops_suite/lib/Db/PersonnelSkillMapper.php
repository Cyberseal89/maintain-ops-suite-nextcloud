<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class PersonnelSkillMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_personnel_skills', PersonnelSkill::class);
    }

    public function find(int $id): PersonnelSkill {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return PersonnelSkill[] */
    public function findByPersonnel(int $personnelId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('personnel_id', $qb->createNamedParameter($personnelId, IQueryBuilder::PARAM_INT)))
           ->orderBy('skill_id', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return PersonnelSkill[] */
    public function findBySkill(int $skillId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('skill_id', $qb->createNamedParameter($skillId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    public function deleteByPersonnel(int $personnelId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('personnel_id', $qb->createNamedParameter($personnelId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
