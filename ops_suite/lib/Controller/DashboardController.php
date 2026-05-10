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
        // Optional platform filter — comma-separated platform IDs
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds   = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];

        $overdueProcs = $this->procedureMapper->findOverdue(6, $platformIds);
        $criticalDefs = $this->deficiencyMapper->findCritical(6, $platformIds);
        return new DataResponse([
            'assets' => [
                'total'  => $this->assetMapper->countAll($platformIds),
                'byType' => $this->assetMapper->countByType($platformIds),
            ],
            'procedures' => [
                'total'        => $this->procedureMapper->countAll($platformIds),
                'overdue'      => $this->procedureMapper->countOverdue($platformIds),
                'dueSoon'      => $this->procedureMapper->countDueThisWeek($platformIds),
                'completed30d' => $this->procedureMapper->countCompletedLast30Days($platformIds),
            ],
            'deficiencies' => [
                'open'       => $this->deficiencyMapper->countOpen($platformIds),
                'bySeverity' => $this->deficiencyMapper->countBySeverity($platformIds),
            ],
            'overdue_list'  => array_map(fn($p) => $p->jsonSerialize(), $overdueProcs),
            'critical_defs' => array_map(fn($d) => $d->jsonSerialize(), $criticalDefs),
        ]);
    }
    /** @NoAdminRequired */
    public function myStats(): DataResponse {
        $uid = trim($this->request->getParam('uid') ?: '');
        return new DataResponse([
            'my_open_deficiencies' => (int)$this->deficiencyMapper->countOpenAssignedTo($uid),
            'my_overdue_pm'        => (int)$this->procedureMapper->countOverdueAssignedTo($uid),
            'my_total_pm'          => (int)$this->procedureMapper->countAssignedTo($uid),
        ]);
    }
}
