<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCA\OpsSuite\Db\Asset;
use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\Deficiency;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\ImportJob;
use OCA\OpsSuite\Db\ImportJobMapper;
use OCA\OpsSuite\Db\ShopMapper;
use OCP\Files\IRootFolder;
use OCP\IUserSession;

class ImportService {

    // ── Asset target fields ───────────────────────────────────────────────
    public const ASSET_FIELDS = [
        'name'           => ['label' => 'Asset Name',              'required' => true],
        'asset_type'     => ['label' => 'Asset Type',              'required' => false, 'default' => 'hardware'],
        'manufacturer'   => ['label' => 'Manufacturer',            'required' => false],
        'model'          => ['label' => 'Model',                   'required' => false],
        'serial_number'  => ['label' => 'Serial Number',           'required' => false],
        'version'        => ['label' => 'Version / Build',         'required' => false],
        'location'       => ['label' => 'Location',                'required' => false],
        'ip_address'     => ['label' => 'IP Address',              'required' => false],
        'install_date'   => ['label' => 'Install Date',            'required' => false],
        'warranty_expiry'=> ['label' => 'Warranty Expiry',         'required' => false],
        'status'         => ['label' => 'Status',                  'required' => false, 'default' => 'operational'],
        'notes'          => ['label' => 'Notes',                   'required' => false],
        'tags'           => ['label' => 'Tags',                    'required' => false],
        'criticality_code' => ['label' => 'Criticality Code',      'required' => false],
        'hsc_code'       => ['label' => 'HSC / ESWBS Code (3M)',   'required' => false],
        'shop_code'      => ['label' => 'Shop / Work Center Code', 'required' => false],
        'uii'            => ['label' => 'UII',                     'required' => false],
        'cage_code'      => ['label' => 'CAGE Code',               'required' => false],
        'iuid_compliant' => ['label' => 'IUID Compliant',          'required' => false],
        'asset_code'     => ['label' => 'Asset Code (JCN/existing)','required' => false],
        '_skip'          => ['label' => '— Skip this column —',    'required' => false],
    ];

    // ── Deficiency target fields ──────────────────────────────────────────
    public const DEFICIENCY_FIELDS = [
        'asset_ref'         => ['label' => 'Asset Reference (name, serial, code, or ASSET-NNNN)', 'required' => true],
        'summary'           => ['label' => 'Summary / Title',              'required' => true],
        'description'       => ['label' => 'Description / Details',        'required' => false],
        'severity'          => ['label' => 'Severity (SEV-1 … SEV-5)',     'required' => false, 'default' => 'SEV-3'],
        'status'            => ['label' => 'Status',                       'required' => false, 'default' => 'open'],
        'discovery_method'  => ['label' => 'Discovery Method',             'required' => false],
        'assigned_to'       => ['label' => 'Assigned To',                  'required' => false],
        'target_completion' => ['label' => 'Target Completion Date',       'required' => false],
        'est_parts_cost'    => ['label' => 'Est. Parts Cost ($)',          'required' => false],
        'est_labor_cost'    => ['label' => 'Est. Labor Cost ($)',          'required' => false],
        'man_days_internal' => ['label' => 'Man-Days (Internal)',          'required' => false],
        'man_days_external' => ['label' => 'Man-Days (External)',          'required' => false],
        '_skip'             => ['label' => '— Skip this column —',         'required' => false],
    ];

    // ── Generic asset column aliases ──────────────────────────────────────
    private const ASSET_ALIASES = [
        'asset name'       => 'name',
        'name'             => 'name',
        'item name'        => 'name',
        'description'      => 'name',
        'type'             => 'asset_type',
        'asset type'       => 'asset_type',
        'category'         => 'asset_type',
        'make'             => 'manufacturer',
        'manufacturer'     => 'manufacturer',
        'mfr'              => 'manufacturer',
        'model'            => 'model',
        'model number'     => 'model',
        'model #'          => 'model',
        'serial'           => 'serial_number',
        'serial number'    => 'serial_number',
        'serial #'         => 'serial_number',
        's/n'              => 'serial_number',
        'sn'               => 'serial_number',
        'version'          => 'version',
        'firmware'         => 'version',
        'sw version'       => 'version',
        'software version' => 'version',
        'location'         => 'location',
        'room'             => 'location',
        'building'         => 'location',
        'site'             => 'location',
        'ip'               => 'ip_address',
        'ip address'       => 'ip_address',
        'ip addr'          => 'ip_address',
        'install date'     => 'install_date',
        'installation date'=> 'install_date',
        'installed'        => 'install_date',
        'warranty'         => 'warranty_expiry',
        'warranty expiry'  => 'warranty_expiry',
        'warranty exp'     => 'warranty_expiry',
        'warranty date'    => 'warranty_expiry',
        'status'           => 'status',
        'condition'        => 'status',
        'notes'            => 'notes',
        'comments'         => 'notes',
        'remarks'          => 'notes',
        'tags'             => 'tags',
        'criticality'      => 'criticality_code',
        'criticality code' => 'criticality_code',
        'crit'             => 'criticality_code',
        'hsc'              => 'hsc_code',
        'hsc code'         => 'hsc_code',
        'eswbs'            => 'hsc_code',
        'swbs'             => 'hsc_code',
        'sys code'         => 'hsc_code',
        'shop'             => 'shop_code',
        'shop code'        => 'shop_code',
        'work center'      => 'shop_code',
        'wc'               => 'shop_code',
        'uii'              => 'uii',
        'cage'             => 'cage_code',
        'cage code'        => 'cage_code',
        'iuid'             => 'iuid_compliant',
        'asset code'       => 'asset_code',
        'asset #'          => 'asset_code',
        'jcn'              => 'asset_code',
        'job control number' => 'asset_code',
    ];

    // ── MB0001 / 3M CSMP asset column aliases ────────────────────────────
    private const MB0001_ASSET_ALIASES = [
        'nomenclature'     => 'name',
        'equipment name'   => 'name',
        'equip name'       => 'name',
        'eswbs'            => 'hsc_code',
        'hsc'              => 'hsc_code',
        'swbs'             => 'hsc_code',
        'sys'              => 'hsc_code',
        'work center'      => 'shop_code',
        'wc'               => 'shop_code',
        'shop'             => 'shop_code',
        'mfr'              => 'manufacturer',
        'manufacturer'     => 'manufacturer',
        'model no'         => 'model',
        'model number'     => 'model',
        'model'            => 'model',
        'serial'           => 'serial_number',
        'serial number'    => 'serial_number',
        'ser no'           => 'serial_number',
        's/n'              => 'serial_number',
        'sn'               => 'serial_number',
        'location'         => 'location',
        'compartment'      => 'location',
        'frame'            => 'location',
        'jcn'              => 'asset_code',
        'job control number' => 'asset_code',
        'status'           => 'status',
        'install date'     => 'install_date',
        'installation date'=> 'install_date',
        'type'             => 'asset_type',
        'category'         => 'asset_type',
        'uic'              => '_skip',
        'hull'             => '_skip',
        'ship'             => '_skip',
    ];

    // ── Generic deficiency column aliases ─────────────────────────────────
    private const DEFICIENCY_ALIASES = [
        'asset'                  => 'asset_ref',
        'asset ref'              => 'asset_ref',
        'asset reference'        => 'asset_ref',
        'asset name'             => 'asset_ref',
        'equipment'              => 'asset_ref',
        'equipment name'         => 'asset_ref',
        'nomenclature'           => 'asset_ref',
        'serial'                 => 'asset_ref',
        'serial number'          => 'asset_ref',
        'jcn'                    => 'asset_ref',
        'job control number'     => 'asset_ref',
        'summary'                => 'summary',
        'title'                  => 'summary',
        'deficiency'             => 'summary',
        'deficiency description' => 'summary',
        'discrepancy'            => 'summary',
        'work description'       => 'summary',
        'description'            => 'description',
        'details'                => 'description',
        'remarks'                => 'description',
        'severity'               => 'severity',
        'priority'               => 'severity',
        'urgency'                => 'severity',
        'status'                 => 'status',
        'condition'              => 'status',
        'discovery method'       => 'discovery_method',
        'found by'               => 'discovery_method',
        'assigned to'            => 'assigned_to',
        'assignee'               => 'assigned_to',
        'work center'            => 'assigned_to',
        'wc'                     => 'assigned_to',
        'target completion'      => 'target_completion',
        'target completion date' => 'target_completion',
        'required completion date' => 'target_completion',
        'rcd'                    => 'target_completion',
        'due date'               => 'target_completion',
        'est parts cost'         => 'est_parts_cost',
        'parts cost'             => 'est_parts_cost',
        'est labor cost'         => 'est_labor_cost',
        'labor cost'             => 'est_labor_cost',
        'man days'               => 'man_days_internal',
        'man-days'               => 'man_days_internal',
        'internal man days'      => 'man_days_internal',
        'external man days'      => 'man_days_external',
    ];

    // ── MB0001 / 3M CSMP deficiency column aliases ───────────────────────
    private const MB0001_DEFICIENCY_ALIASES = [
        'jcn'                      => 'asset_ref',
        'job control number'       => 'asset_ref',
        'nomenclature'             => 'asset_ref',
        'equipment'                => 'asset_ref',
        'equip name'               => 'asset_ref',
        'work description'         => 'summary',
        'discrepancy'              => 'summary',
        'description'              => 'description',
        'remarks'                  => 'description',
        'priority'                 => 'severity',
        'urgency'                  => 'severity',
        'work center'              => 'assigned_to',
        'wc'                       => 'assigned_to',
        'rcd'                      => 'target_completion',
        'required completion date' => 'target_completion',
        'status'                   => 'status',
        'uic'                      => '_skip',
        'hull'                     => '_skip',
        'ship'                     => '_skip',
        'eswbs'                    => '_skip',
    ];

    public function __construct(
        private readonly ImportJobMapper   $jobMapper,
        private readonly AssetMapper       $assetMapper,
        private readonly DeficiencyMapper  $deficiencyMapper,
        private readonly ShopMapper        $shopMapper,
        private readonly IRootFolder       $rootFolder,
        private readonly IUserSession      $userSession,
    ) {}

    // ── Public interface ──────────────────────────────────────────────────

    /**
     * Parse file, detect headers, auto-map columns, store preview.
     * Branches alias selection on import_type (includes profile suffix).
     */
    public function analyzeFile(ImportJob $job): ImportJob {
        $content = $this->readFile($job->getFilePath());
        $format  = strtolower($job->getFileFormat());

        [$headers, $rows] = $format === 'json'
            ? $this->parseJson($content)
            : $this->parseCsv($content);

        $job->setDetectedHeaders(json_encode($headers));
        $job->setPreviewRows(json_encode(array_slice($rows, 0, 5)));
        $job->setColumnMap(json_encode($this->autoMap($headers, $job->getImportType())));
        $job->setTotalRows(count($rows));
        $job->setStatus('mapping');
        $job->setUpdatedAt(date('Y-m-d H:i:s'));

        return $this->jobMapper->update($job);
    }

    /**
     * Validate the confirmed column map. Stores per-row errors.
     */
    public function validate(ImportJob $job): ImportJob {
        $content = $this->readFile($job->getFilePath());
        $format  = strtolower($job->getFileFormat());
        $colMap  = json_decode($job->getColumnMap() ?? '{}', true) ?: [];

        [, $rows] = $format === 'json'
            ? $this->parseJson($content)
            : $this->parseCsv($content);

        $baseType = $this->baseType($job->getImportType());
        $errors   = [];
        $validCnt = 0;
        $errCnt   = 0;

        foreach ($rows as $i => $row) {
            $rowErrors = $baseType === 'deficiencies'
                ? $this->validateDeficiencyRow($row, $colMap, $i + 1)
                : $this->validateAssetRow($row, $colMap, $i + 1);

            if ($rowErrors) {
                $errors = array_merge($errors, $rowErrors);
                $errCnt++;
            } else {
                $validCnt++;
            }
        }

        $job->setValidRows($validCnt);
        $job->setErrorRows($errCnt);
        $job->setValidationErrors(json_encode($errors));
        $job->setStatus('ready');
        $job->setUpdatedAt(date('Y-m-d H:i:s'));

        return $this->jobMapper->update($job);
    }

    /**
     * Execute the import. Skips rows that failed validation.
     */
    public function execute(ImportJob $job): ImportJob {
        $baseType = $this->baseType($job->getImportType());

        $job->setStatus('importing');
        $job->setUpdatedAt(date('Y-m-d H:i:s'));
        $this->jobMapper->update($job);

        return $baseType === 'deficiencies'
            ? $this->executeDeficiencies($job)
            : $this->executeAssets($job);
    }

    // ── Asset execution ───────────────────────────────────────────────────

    private function executeAssets(ImportJob $job): ImportJob {
        $uid     = $this->userSession->getUser()?->getUID() ?? '';
        $content = $this->readFile($job->getFilePath());
        $format  = strtolower($job->getFileFormat());
        $colMap  = json_decode($job->getColumnMap() ?? '{}', true) ?: [];

        [, $rows] = $format === 'json'
            ? $this->parseJson($content)
            : $this->parseCsv($content);

        $badRows  = $this->badRowNumbers($job);
        $now      = date('Y-m-d H:i:s');
        $imported = 0;
        $skipped  = 0;
        $insertedIds = [];

        // Pre-load shop code → id map for this platform
        $shopCodeMap = $this->buildShopCodeMap($job->getPlatformId());

        foreach ($rows as $i => $row) {
            $rowNum = $i + 1;
            if (in_array($rowNum, $badRows, true)) { $skipped++; continue; }

            $mapped = $this->mapRow($row, $colMap);
            if (empty($mapped['name'])) { $skipped++; continue; }

            try {
                $asset = new Asset();
                $asset->setName($mapped['name']);
                $asset->setAssetType($mapped['asset_type'] ?? 'hardware');
                $asset->setManufacturer($mapped['manufacturer'] ?? '');
                $asset->setModel($mapped['model'] ?? '');
                $asset->setSerialNumber($mapped['serial_number'] ?? '');
                $asset->setVersion($mapped['version'] ?? '');
                $asset->setLocation($mapped['location'] ?? '');
                $asset->setIpAddress($mapped['ip_address'] ?? '');
                $asset->setInstallDate($mapped['install_date'] ?: null);
                $asset->setWarrantyExpiry($mapped['warranty_expiry'] ?: null);
                $asset->setStatus($mapped['status'] ?? 'operational');
                $asset->setNotes($mapped['notes'] ?? '');
                $asset->setTags($mapped['tags'] ?? '');
                $asset->setCriticalityCode($mapped['criticality_code'] ?: null);
                $asset->setHscCode($mapped['hsc_code'] ?: null);
                $asset->setUii($mapped['uii'] ?? '');
                $asset->setCageCode($mapped['cage_code'] ?? '');
                $asset->setIuidCompliant((int)($mapped['iuid_compliant'] ?? 0));
                $asset->setAssetCode($mapped['asset_code'] ?: null);
                $asset->setPlatformId($job->getPlatformId());

                // Resolve shop code → shop_id
                if (!empty($mapped['shop_code'])) {
                    $code = strtoupper(trim($mapped['shop_code']));
                    $asset->setShopId($shopCodeMap[$code] ?? null);
                }

                $asset->setBypassState(0);
                $asset->setRedundancyAvailable(0);
                $asset->setBypassPossible(0);
                $asset->setIsSystemNode(0);
                $asset->setSortOrder(0);
                $asset->setCreatedBy($uid);
                $asset->setCreatedAt($now);
                $asset->setUpdatedAt($now);

                if (empty($asset->getUii())) {
                    $cage   = strtoupper($asset->getCageCode());
                    $serial = strtoupper($asset->getSerialNumber());
                    $uii    = (!empty($cage) && !empty($serial))
                        ? '//' . $cage . '/' . $serial
                        : '//ALTO/' . strtoupper(substr(bin2hex(random_bytes(8)), 0, 16));
                    $asset->setUii($uii);
                }

                $inserted = $this->assetMapper->insert($asset);
                $insertedIds[] = $inserted->getId();
                $imported++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        // Build HSC hierarchy among newly inserted assets
        if (!empty($insertedIds)) {
            $this->buildHscHierarchy($job->getPlatformId());
        }

        $job->setImportedRows($imported);
        $job->setStatus('done');
        $job->setCompletedAt(date('Y-m-d H:i:s'));
        $job->setUpdatedAt(date('Y-m-d H:i:s'));
        return $this->jobMapper->update($job);
    }

    // ── Deficiency execution ──────────────────────────────────────────────

    private function executeDeficiencies(ImportJob $job): ImportJob {
        $uid     = $this->userSession->getUser()?->getUID() ?? '';
        $content = $this->readFile($job->getFilePath());
        $format  = strtolower($job->getFileFormat());
        $colMap  = json_decode($job->getColumnMap() ?? '{}', true) ?: [];

        [, $rows] = $format === 'json'
            ? $this->parseJson($content)
            : $this->parseCsv($content);

        $badRows  = $this->badRowNumbers($job);
        $now      = date('Y-m-d H:i:s');
        $imported = 0;
        $skipped  = 0;

        // Pre-build asset lookup maps for the platform
        $assetMaps = $this->buildAssetLookupMaps($job->getPlatformId());

        foreach ($rows as $i => $row) {
            $rowNum = $i + 1;
            if (in_array($rowNum, $badRows, true)) { $skipped++; continue; }

            $mapped = $this->mapRow($row, $colMap);
            $ref    = trim($mapped['asset_ref'] ?? '');
            if (empty($ref)) { $skipped++; continue; }

            $assetId = $this->resolveAssetId($ref, $assetMaps);
            if ($assetId === null) { $skipped++; continue; }

            try {
                $def = new Deficiency();
                $def->setAssetId($assetId);
                $def->setSummary(trim($mapped['summary'] ?? 'Imported deficiency'));
                $def->setDescription(trim($mapped['description'] ?? ''));
                $def->setSeverity($this->normalizeSeverity($mapped['severity'] ?? 'SEV-3'));
                $def->setStatus($this->normalizeDefStatus($mapped['status'] ?? 'open'));
                $def->setDiscoveryMethod($mapped['discovery_method'] ?? 'walkdown');
                $def->setAssignedTo($mapped['assigned_to'] ?? '');
                $def->setTargetCompletion($mapped['target_completion'] ?: null);
                $def->setEstPartsCost((float)($mapped['est_parts_cost'] ?? 0));
                $def->setEstLaborCost((float)($mapped['est_labor_cost'] ?? 0));
                $def->setManDaysInternal((float)($mapped['man_days_internal'] ?? 0));
                $def->setManDaysExternal((float)($mapped['man_days_external'] ?? 0));
                $def->setPlatformId($job->getPlatformId());
                $def->setCreatedBy($uid);
                $def->setCreatedAt($now);
                $def->setUpdatedAt($now);

                $this->deficiencyMapper->insert($def);
                $imported++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        $job->setImportedRows($imported);
        $job->setStatus('done');
        $job->setCompletedAt(date('Y-m-d H:i:s'));
        $job->setUpdatedAt(date('Y-m-d H:i:s'));
        return $this->jobMapper->update($job);
    }

    // ── Validation ────────────────────────────────────────────────────────

    private function validateAssetRow(array $row, array $colMap, int $rowNum): array {
        $errors = [];
        $mapped = $this->mapRow($row, $colMap);

        if (empty(trim($mapped['name'] ?? ''))) {
            $errors[] = ['row' => $rowNum, 'field' => 'name', 'message' => 'Asset Name is required'];
        }
        $validTypes = ['hardware', 'software', 'firmware'];
        if (!empty($mapped['asset_type']) && !in_array(strtolower($mapped['asset_type']), $validTypes, true)) {
            $errors[] = ['row' => $rowNum, 'field' => 'asset_type', 'message' => 'Asset Type must be hardware, software, or firmware'];
        }
        $validCrit = ['', 'CR', 'DE', 'RD', 'SP', 'AD'];
        if (!empty($mapped['criticality_code']) && !in_array(strtoupper($mapped['criticality_code']), $validCrit, true)) {
            $errors[] = ['row' => $rowNum, 'field' => 'criticality_code', 'message' => 'Criticality Code must be CR, DE, RD, SP, or AD'];
        }
        return $errors;
    }

    private function validateDeficiencyRow(array $row, array $colMap, int $rowNum): array {
        $errors = [];
        $mapped = $this->mapRow($row, $colMap);

        if (empty(trim($mapped['asset_ref'] ?? ''))) {
            $errors[] = ['row' => $rowNum, 'field' => 'asset_ref', 'message' => 'Asset Reference is required to link deficiency to an asset'];
        }
        if (empty(trim($mapped['summary'] ?? ''))) {
            $errors[] = ['row' => $rowNum, 'field' => 'summary', 'message' => 'Summary / Title is required'];
        }
        return $errors;
    }

    // ── HSC Hierarchy building ────────────────────────────────────────────

    /**
     * After asset import, wire up parent_id for all assets in the platform
     * that have hsc_code set, using longest-prefix matching.
     * e.g. "4610" → parent is "461", which has parent "46".
     */
    private function buildHscHierarchy(?int $platformId): void {
        $assets = $this->assetMapper->findAllWithHsc($platformId);
        if (count($assets) < 2) return;

        // Build map: hsc_code → asset_id
        $codeToId = [];
        foreach ($assets as $a) {
            $code = $a->getHscCode();
            if ($code !== null && $code !== '') {
                $codeToId[$code] = $a->getId();
            }
        }

        foreach ($assets as $a) {
            $code = $a->getHscCode();
            if ($code === null || strlen($code) <= 1) continue;

            // Try progressively shorter prefixes
            $parentId = null;
            for ($len = strlen($code) - 1; $len >= 1; $len--) {
                $prefix = substr($code, 0, $len);
                if (isset($codeToId[$prefix])) {
                    $parentId = $codeToId[$prefix];
                    break;
                }
            }

            if ($parentId !== null && $parentId !== $a->getParentId()) {
                $a->setParentId($parentId);
                $this->assetMapper->update($a);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /** Returns the base type: 'assets' or 'deficiencies' (strips /profile suffix) */
    private function baseType(string $importType): string {
        return explode('/', $importType, 2)[0];
    }

    /** Returns the profile suffix or null (e.g. 'mb0001') */
    private function profile(string $importType): ?string {
        $parts = explode('/', $importType, 2);
        return $parts[1] ?? null;
    }

    /** Auto-map headers to fields using appropriate alias set */
    private function autoMap(array $headers, string $importType): array {
        $baseType = $this->baseType($importType);
        $profile  = $this->profile($importType);

        if ($profile === 'mb0001') {
            $aliases = $baseType === 'deficiencies'
                ? self::MB0001_DEFICIENCY_ALIASES
                : self::MB0001_ASSET_ALIASES;
        } else {
            $aliases = $baseType === 'deficiencies'
                ? self::DEFICIENCY_ALIASES
                : self::ASSET_ALIASES;
        }

        $map = [];
        foreach ($headers as $h) {
            $key     = strtolower(trim($h));
            $map[$h] = $aliases[$key] ?? '_skip';
        }
        return $map;
    }

    /** Build shop code → shop_id map for the current platform */
    private function buildShopCodeMap(?int $platformId): array {
        $map = [];
        try {
            $shops = $this->shopMapper->findAll($platformId);
            foreach ($shops as $shop) {
                if ($shop->getCode()) {
                    $map[strtoupper(trim($shop->getCode()))] = $shop->getId();
                }
            }
        } catch (\Throwable) {}
        return $map;
    }

    /**
     * Build lookup maps for asset resolution during deficiency import.
     * Returns ['name'=>[name=>id], 'serial'=>[sn=>id], 'code'=>[code=>id], 'uii'=>[uii=>id], 'id'=>[id=>id]]
     */
    private function buildAssetLookupMaps(?int $platformId): array {
        $maps = ['name' => [], 'serial' => [], 'code' => [], 'uii' => []];
        try {
            // findAll with optional platform filter
            $assets = $this->assetMapper->findAll(platformIds: $platformId ? [$platformId] : []);
            foreach ($assets as $a) {
                $id = $a->getId();
                if ($a->getName())         $maps['name'][strtolower($a->getName())] = $id;
                if ($a->getSerialNumber()) $maps['serial'][strtolower($a->getSerialNumber())] = $id;
                if ($a->getAssetCode())    $maps['code'][strtolower($a->getAssetCode())] = $id;
                if ($a->getUii())          $maps['uii'][strtolower($a->getUii())] = $id;
            }
        } catch (\Throwable) {}
        return $maps;
    }

    /** Resolve a ref string to an asset ID using pre-built lookup maps */
    private function resolveAssetId(string $ref, array $maps): ?int {
        // ASSET-NNNN
        if (preg_match('/^ASSET-(\d+)$/i', $ref, $m)) {
            return (int)$m[1];
        }
        $lower = strtolower(trim($ref));
        return $maps['serial'][$lower]
            ?? $maps['code'][$lower]
            ?? $maps['uii'][$lower]
            ?? $maps['name'][$lower]
            ?? null;
    }

    /** Normalize severity: '1', 'P1', 'Priority 1', 'Critical' → 'SEV-1' */
    private function normalizeSeverity(string $val): string {
        $v = strtoupper(trim($val));
        // Already correct
        if (preg_match('/^SEV-[1-5]$/', $v)) return $v;
        // Extract numeric part
        if (preg_match('/(\d)/', $v, $m)) {
            $n = (int)$m[1];
            if ($n >= 1 && $n <= 5) return 'SEV-' . $n;
        }
        // Text keywords
        if (str_contains($v, 'CRIT')) return 'SEV-1';
        if (str_contains($v, 'HIGH')) return 'SEV-2';
        if (str_contains($v, 'LOW'))  return 'SEV-4';
        return 'SEV-3';
    }

    /** Normalize deficiency status value */
    private function normalizeDefStatus(string $val): string {
        $v = strtolower(trim($val));
        $map = [
            'open'        => 'open',
            'new'         => 'open',
            'in progress' => 'in_progress',
            'in-progress' => 'in_progress',
            'wip'         => 'in_progress',
            'deferred'    => 'deferred',
            'defer'       => 'deferred',
            'closed'      => 'closed',
            'complete'    => 'closed',
            'completed'   => 'closed',
            'cancelled'   => 'cancelled',
            'canceled'    => 'cancelled',
        ];
        return $map[$v] ?? 'open';
    }

    /** Bad row numbers (1-based) from stored validation errors */
    private function badRowNumbers(ImportJob $job): array {
        $errors = json_decode($job->getValidationErrors() ?? '[]', true) ?: [];
        return array_unique(array_column($errors, 'row'));
    }

    private function readFile(string $filePath): string {
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $user = $this->rootFolder->getUserFolder($uid);
        $rel  = ltrim($filePath, '/');
        $node = $user->get($rel);
        return $node->getContent();
    }

    private function parseCsv(string $content): array {
        $lines   = preg_split('/\r\n|\r|\n/', trim($content));
        $headers = [];
        $rows    = [];
        foreach ($lines as $i => $line) {
            if (trim($line) === '') continue;
            $cells = str_getcsv($line);
            if ($i === 0) {
                $headers = array_map('trim', $cells);
            } else {
                while (count($cells) < count($headers)) $cells[] = '';
                $rows[] = array_combine($headers, array_map('trim', $cells));
            }
        }
        return [$headers, $rows];
    }

    private function parseJson(string $content): array {
        $data = json_decode($content, true);
        if (!is_array($data) || empty($data)) return [[], []];
        if (!isset($data[0]) && is_array(reset($data))) {
            $data = reset($data);
        }
        $headers = array_keys($data[0] ?? []);
        $rows    = array_map(fn($r) => array_map('strval', $r), $data);
        return [$headers, $rows];
    }

    private function mapRow(array $row, array $colMap): array {
        $out = [];
        foreach ($colMap as $srcCol => $targetField) {
            if ($targetField === '_skip' || $targetField === '') continue;
            $val = $row[$srcCol] ?? '';
            if (!isset($out[$targetField])) {
                $out[$targetField] = $val;
            }
        }
        return $out;
    }
}
