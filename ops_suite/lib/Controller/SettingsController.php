<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Migration\SeedFailureModes;
use OCA\OpsSuite\Service\DocumentationSeeder;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IConfig;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\Migration\IOutput;

class SettingsController extends Controller {
    public const APP_ID = 'ops_suite';

    private const ORG_KEYS = ['org_name','org_address','org_city','org_phone','org_email','org_website'];

    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly IConfig     $config,
        private readonly PermissionService $permission,
        private readonly IDBConnection $db
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function get(): DataResponse {
        $data = ['sop_folder' => 'PMS Procedures'];
        foreach (self::ORG_KEYS as $k) {
            $data[$k] = $this->config->getAppValue(self::APP_ID, $k, '');
        }
        foreach (PermissionService::ROLES as $role) {
            $data['role_group_'.$role] = $this->config->getAppValue(self::APP_ID, 'role_group_'.$role, '');
        }
        // Legacy key — keep for backwards compat
        $data['editor_group'] = $this->config->getAppValue(self::APP_ID, 'editor_group', '');
        // Section visibility
        $enabledRaw = $this->config->getAppValue(self::APP_ID, 'enabled_sections', '');
        $data['enabled_sections'] = $enabledRaw ? json_decode($enabledRaw, true) : null;
        return new DataResponse($data);
    }

    /** @NoAdminRequired */
    public function me(): DataResponse {
        return new DataResponse($this->permission->getPermissionSummary());
    }

    /** @NoAdminRequired */
    public function save(): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], 403);
        }
        foreach (self::ORG_KEYS as $k) {
            $this->config->setAppValue(self::APP_ID, $k, trim($this->request->getParam($k, '')));
        }
        foreach (PermissionService::ROLES as $role) {
            $key = 'role_group_'.$role;
            $val = trim($this->request->getParam($key, ''));
            $this->config->setAppValue(self::APP_ID, $key, $val);
        }
        // Legacy
        $editorGroup = trim($this->request->getParam('editor_group', ''));
        $this->config->setAppValue(self::APP_ID, 'editor_group', $editorGroup);

        // Section visibility
        $enabledSections = $this->request->getParam('enabled_sections', null);
        if ($enabledSections !== null) {
            $val = is_array($enabledSections) ? json_encode($enabledSections) : $enabledSections;
            $this->config->setAppValue(self::APP_ID, 'enabled_sections', $val);
        }

        return $this->get();
    }

    /** @NoAdminRequired */
    public function seed(): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], 403);
        }
        $step = new SeedFailureModes($this->db);
        $step->run(new class implements IOutput {
            public function info($message) {}
            public function warning($message) {}
            public function startProgress($max = 0) {}
            public function advance($step = 1, $description = '') {}
            public function finishProgress() {}
        });
        return new DataResponse(['message' => 'Seeded']);
    }

    /** @NoAdminRequired */
    public function seedDocs(): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], 403);
        }
        $uid = \OC::$server->getUserSession()->getUser()?->getUID() ?? 'system';
        $seeder = new DocumentationSeeder($this->db);
        try {
            $result = $seeder->seed($uid);
            return new DataResponse($result);
        } catch (\Throwable $e) {
            return new DataResponse(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
