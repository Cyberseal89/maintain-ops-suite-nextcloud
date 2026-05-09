<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\ProcedureMapper;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class DashboardController extends Controller {
    public function __construct(
        string          $appName,
        IRequest        $request,
        private readonly AssetMapper       $assetMapper,
        private readonly ProcedureMapper   $procedureMapper,
        private readonly DeficiencyMapper  $deficiencyMapper
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function stats(): DataResponse {
        $overdueProcs = $this->procedureMapper->findOverdue(6);
        $criticalDefs = $this->deficiencyMapper->findCritical(6);

        return new DataResponse([
            'assets' => [
                'total'  => $this->assetMapper->countAll(),
                'byType' => $this->assetMapper->countByType(),
            ],
            'procedures' => [
                'total'     => $this->procedureMapper->countAll(),
                'overdue'   => $this->procedureMapper->countOverdue(),
                'dueSoon'   => $this->procedureMapper->countDueThisWeek(),
                'completed30d' => $this->procedureMapper->countCompletedLast30Days(),
            ],
            'deficiencies' => [
                'open'       => $this->deficiencyMapper->countOpen(),
                'bySeverity' => $this->deficiencyMapper->countBySeverity(),
            ],
            'overdue_list'  => array_map(fn($p) => $p->jsonSerialize(), $overdueProcs),
            'critical_defs' => array_map(fn($d) => $d->jsonSerialize(), $criticalDefs),
        ]);
    }

    /** @NoAdminRequired */
    public function myStats(): DataResponse {
        // Try session first, then Basic Auth header, then uid query param
        $user = $this->userSession->getUser();
        $uid  = $user ? $user->getUID() : '';
        if ($uid === '') {
            $authHeader = $this->request->getHeader('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Basic ')) {
                $decoded = base64_decode(substr($authHeader, 6));
                $uid = explode(':', $decoded, 2)[0];
            }
        }
        if ($uid === '') {
            $uid = $this->request->getParam('uid') ?: '';
        }
        return new DataResponse([
            'uid'                  => $uid,
            'my_open_deficiencies' => $this->deficiencyMapper->countOpenAssignedTo($uid),
            'my_overdue_pm'        => $this->procedureMapper->countOverdueAssignedTo($uid),
            'my_total_pm'          => $this->procedureMapper->countAssignedTo($uid),
        ]);
    }
}
