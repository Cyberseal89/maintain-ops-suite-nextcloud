<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Controller;
use OCA\OpsSuite\Db\TrainingRequirementMapper;
use OCA\OpsSuite\Db\TrainingRequirement;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OCP\IRequest;
use OCP\IUserSession;

class TrainingController extends Controller {
    public function __construct(
        string $AppName,
        IRequest $request,
        private TrainingRequirementMapper $mapper,
        private IUserSession $userSession,
        private RoleController $roleCtrl,
    ) {
        parent::__construct($AppName, $request);
    }

    private function canWrite(): bool {
        $r = $this->roleCtrl->myRole();
        return isset($r['can_write']) && $r['can_write'];
    }

    private function now(): string { return date('Y-m-d\TH:i:s'); }

    /**
     * @NoAdminRequired
     * GET /api/training — list all requirements
     */
    public function index(): DataResponse {
        $status     = $this->request->getParam('status')      ?: null;
        $assignedTo = $this->request->getParam('assigned_to') ?: null;
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $sourceType = $this->request->getParam('source_type') ?: null;
        $sourceId   = $this->request->getParam('source_id')   ? (int)$this->request->getParam('source_id')   : null;

        if ($sourceType && $sourceId) {
            $items = $this->mapper->findBySource($sourceType, $sourceId);
        } else {
            $items = $this->mapper->findAll($status, $assignedTo, $platformId);
        }

        // Attach user display names for assigned_to
        $users = null;
        return new DataResponse(array_map(function($tr) use (&$users) {
            $d = $tr->jsonSerialize();
            return $d;
        }, $items));
    }

    /**
     * @NoAdminRequired
     * GET /api/training/{id}
     */
    public function show(int $id): DataResponse {
        return new DataResponse($this->mapper->find($id)->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * POST /api/training
     */
    public function create(): DataResponse {
        if (!$this->canWrite()) return new DataResponse(['error'=>'Forbidden'], 403);
        $tr = new TrainingRequirement();
        $tr->setSourceType($this->request->getParam('source_type') ?: 'standalone');
        $tr->setSourceId($this->request->getParam('source_id') ? (int)$this->request->getParam('source_id') : null);
        $tr->setTitle(trim($this->request->getParam('title') ?? ''));
        $tr->setDescription($this->request->getParam('description') ?: null);
        $tr->setTrainingType($this->request->getParam('training_type') ?: 'initial');
        $tr->setS6000tTaskCode($this->request->getParam('s6000t_task_code') ?: null);
        $tr->setS6000tWuc($this->request->getParam('s6000t_wuc') ?: null);
        $tr->setSkillLevel($this->request->getParam('skill_level') ? (int)$this->request->getParam('skill_level') : null);
        $tr->setManHours($this->request->getParam('man_hours') ?: null);
        $tr->setRequiredByDate($this->request->getParam('required_by_date') ?: null);
        $tr->setStatus($this->request->getParam('status') ?: 'pending');
        $tr->setAssignedTo($this->request->getParam('assigned_to') ?: null);
        $tr->setCompletedDate($this->request->getParam('completed_date') ?: null);
        $tr->setPlatformId($this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null);
        $tr->setNotes($this->request->getParam('notes') ?: null);
        $tr->setCreatedAt($this->now());
        $tr->setUpdatedAt($this->now());
        return new DataResponse($this->mapper->insert($tr)->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * PUT /api/training/{id}
     */
    public function update(int $id): DataResponse {
        if (!$this->canWrite()) return new DataResponse(['error'=>'Forbidden'], 403);
        $tr = $this->mapper->find($id);
        $p  = fn($k) => $this->request->getParam($k);
        if ($p('title')            !== null) $tr->setTitle(trim($p('title')));
        if ($p('description')      !== null) $tr->setDescription($p('description') ?: null);
        if ($p('training_type')    !== null) $tr->setTrainingType($p('training_type'));
        if ($p('s6000t_task_code') !== null) $tr->setS6000tTaskCode($p('s6000t_task_code') ?: null);
        if ($p('s6000t_wuc')       !== null) $tr->setS6000tWuc($p('s6000t_wuc') ?: null);
        if ($p('skill_level')      !== null) $tr->setSkillLevel($p('skill_level') ? (int)$p('skill_level') : null);
        if ($p('man_hours')        !== null) $tr->setManHours($p('man_hours') ?: null);
        if ($p('required_by_date') !== null) $tr->setRequiredByDate($p('required_by_date') ?: null);
        if ($p('status')           !== null) $tr->setStatus($p('status'));
        if ($p('assigned_to')      !== null) $tr->setAssignedTo($p('assigned_to') ?: null);
        if ($p('completed_date')   !== null) $tr->setCompletedDate($p('completed_date') ?: null);
        if ($p('platform_id')      !== null) $tr->setPlatformId($p('platform_id') ? (int)$p('platform_id') : null);
        if ($p('notes')            !== null) $tr->setNotes($p('notes') ?: null);
        $tr->setUpdatedAt($this->now());
        return new DataResponse($this->mapper->update($tr)->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * DELETE /api/training/{id}
     */
    public function destroy(int $id): DataResponse {
        if (!$this->canWrite()) return new DataResponse(['error'=>'Forbidden'], 403);
        $this->mapper->delete($this->mapper->find($id));
        return new DataResponse(['ok'=>true]);
    }
}
