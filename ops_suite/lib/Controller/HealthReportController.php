<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Service\HealthReportService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class HealthReportController extends Controller {

    public function __construct(
        string                         $appName,
        IRequest                       $request,
        private readonly HealthReportService $reportService,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * GET /api/health-report — Day 1 readiness report, optionally scoped to a platform.
     */
    public function generate(): DataResponse {
        $platformId = $this->request->getParam('platform_id');
        $platformId = ($platformId !== null && $platformId !== '') ? (int)$platformId : null;

        try {
            return new DataResponse($this->reportService->generate($platformId));
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 500);
        }
    }
}
