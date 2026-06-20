<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\IDBConnection;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2050Date20260618000000 extends SimpleMigrationStep {

    public function __construct(private readonly IDBConnection $db) {}

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_modernizations: add CCB fields ───────────────────────
        if ($schema->hasTable('ops_modernizations')) {
            $t = $schema->getTable('ops_modernizations');
            if (!$t->hasColumn('mod_code'))             $t->addColumn('mod_code',             'string',  ['length'=>50, 'notnull'=>false]);
            if (!$t->hasColumn('shop_id'))              $t->addColumn('shop_id',              'integer', ['notnull'=>false]);
            if (!$t->hasColumn('mod_type'))             $t->addColumn('mod_type',             'string',  ['length'=>50, 'default'=>'modification']);
            if (!$t->hasColumn('priority'))             $t->addColumn('priority',             'string',  ['length'=>20, 'default'=>'routine']);
            if (!$t->hasColumn('initiator_uid'))        $t->addColumn('initiator_uid',        'string',  ['length'=>64, 'notnull'=>false]);
            if (!$t->hasColumn('linked_def_id'))        $t->addColumn('linked_def_id',        'integer', ['notnull'=>false]);
            if (!$t->hasColumn('linked_req_id'))        $t->addColumn('linked_req_id',        'integer', ['notnull'=>false]);
            if (!$t->hasColumn('impact_analysis_json')) $t->addColumn('impact_analysis_json', 'text',    ['notnull'=>false]);
            if (!$t->hasColumn('training_delta'))       $t->addColumn('training_delta',       'text',    ['notnull'=>false]);
            if (!$t->hasColumn('completed_at'))         $t->addColumn('completed_at',         'datetime',['notnull'=>false]);
        }

        // ── ops_requirements: add modernization_id ───────────────────
        if ($schema->hasTable('ops_requirements')) {
            $t = $schema->getTable('ops_requirements');
            if (!$t->hasColumn('modernization_id'))
                $t->addColumn('modernization_id', 'integer', ['notnull'=>false]);
        }

        // ── ops_interfaces: add modernization_id ─────────────────────
        if ($schema->hasTable('ops_interfaces')) {
            $t = $schema->getTable('ops_interfaces');
            if (!$t->hasColumn('modernization_id'))
                $t->addColumn('modernization_id', 'integer', ['notnull'=>false]);
        }

        // ── ops_documents: add modernization_id ──────────────────────
        if ($schema->hasTable('ops_documents')) {
            $t = $schema->getTable('ops_documents');
            if (!$t->hasColumn('modernization_id'))
                $t->addColumn('modernization_id', 'integer', ['notnull'=>false]);
        }

        // ── ops_mod_assets: affected assets per modernization ─────────
        if (!$schema->hasTable('ops_mod_assets')) {
            $t = $schema->createTable('ops_mod_assets');
            $t->addColumn('id',             'integer', ['autoincrement'=>true,'notnull'=>true]);
            $t->addColumn('mod_id',         'integer', ['notnull'=>true]);
            $t->addColumn('asset_id',       'integer', ['notnull'=>true]);
            $t->addColumn('action',         'string',  ['length'=>20,'default'=>'modify']);
            $t->addColumn('before_version', 'string',  ['length'=>100,'notnull'=>false]);
            $t->addColumn('after_version',  'string',  ['length'=>100,'notnull'=>false]);
            $t->addColumn('notes',          'text',    ['default'=>'']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['mod_id'],   'ops_mod_assets_mod_idx');
            $t->addIndex(['asset_id'], 'ops_mod_assets_asset_idx');
        }

        // ── Drop obsolete tables ──────────────────────────────────────
        if ($schema->hasTable('ops_mod_docs'))      $schema->dropTable('ops_mod_docs');
        if ($schema->hasTable('ops_changes'))       $schema->dropTable('ops_changes');
        if ($schema->hasTable('ops_change_assets')) $schema->dropTable('ops_change_assets');

        return $schema;
    }

    public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {
        // Migrate existing stage values to CCB stage names
        $map = [
            'design'   => 'drafting',
            'planning' => 'impact_analysis',
            'approval' => 'ccb_review',
        ];
        foreach ($map as $old => $new) {
            $qb = $this->db->getQueryBuilder();
            $qb->update('ops_modernizations')
               ->set('status', $qb->createNamedParameter($new))
               ->where($qb->expr()->eq('status', $qb->createNamedParameter($old)));
            $qb->executeStatement();
        }
    }
}
