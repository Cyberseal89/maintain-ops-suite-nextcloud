<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IConfig;
use OCP\IRequest;

class SettingsController extends Controller {
    public const APP_ID = 'ops_suite';

    public function __construct(
        string              $appName,
        IRequest            $request,
        private readonly IConfig $config
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * Returns current app settings visible to all users.
     */
    public function get(): DataResponse {
        return new DataResponse([
            'editor_group' => $this->config->getAppValue(self::APP_ID, 'editor_group', ''),
            'sop_folder'   => 'PMS Procedures',
        ]);
    }

    /**
     * @NoAdminRequired — but enforced in JS; actual write requires admin check here
     */
    public function save(): DataResponse {
        $group = trim($this->request->getParam('editor_group', ''));
        $this->config->setAppValue(self::APP_ID, 'editor_group', $group);
        return new DataResponse(['editor_group' => $group]);
    }
}
