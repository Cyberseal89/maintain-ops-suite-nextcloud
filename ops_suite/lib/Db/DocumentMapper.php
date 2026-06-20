<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class DocumentMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_documents', Document::class);
    }

    public function find(int $id): Document {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @throws DoesNotExistException */
    public function findByLocalUuid(string $uuid): Document {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('local_uuid', $qb->createNamedParameter($uuid)));
        return $this->findEntity($qb);
    }

    /** @throws DoesNotExistException */
    public function findByDocNumber(string $docNumber): Document {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('doc_number', $qb->createNamedParameter($docNumber)));
        return $this->findEntity($qb);
    }

    /**
     * @return Document[]
     */
    public function findAll(
        ?int    $assetId         = null,
        ?string $category        = null,
        ?string $status          = null,
        array   $platformIds     = [],
        ?int    $modernizationId = null
    ): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($assetId !== null) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        }
        if ($category) {
            $qb->andWhere($qb->expr()->eq('category', $qb->createNamedParameter($category)));
        }
        if ($status) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        if ($modernizationId !== null) {
            $qb->andWhere($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modernizationId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('doc_number', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return Document[] */
    public function findForAsset(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)))
           ->orderBy('doc_number', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return Document[] */
    public function findForModernization(int $modId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modId, IQueryBuilder::PARAM_INT)))
           ->orderBy('doc_number', 'ASC');
        return $this->findEntities($qb);
    }
}
