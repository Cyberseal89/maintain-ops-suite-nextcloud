<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AvailProjectMapper;
use OCA\OpsSuite\Db\ProjectItemMapper;
use OCA\OpsSuite\Db\ProcedureMapper;
use OCA\OpsSuite\Db\ModernizationMapper;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\AvailProject;
use OCA\OpsSuite\Db\ProjectItem;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class AvailProjectController extends Controller {
    public function __construct(
        string                      $appName,
        IRequest                    $request,
        private readonly AvailProjectMapper  $mapper,
        private readonly ProjectItemMapper   $itemMapper,
        private readonly ProcedureMapper     $procMapper,
        private readonly ModernizationMapper $modMapper,
        private readonly DeficiencyMapper    $defMapper,
        private readonly PermissionService   $permission,
        private readonly IUserSession        $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $status = $this->request->getParam('status') ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];
        $projects = $this->mapper->findAll($status, $platformIds);
        return new DataResponse(array_map(fn($p) => $p->jsonSerialize(), $projects));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $project = $this->mapper->find($id);
            $items   = $this->itemMapper->findForProject($id);
            $data    = $project->jsonSerialize();
            $data['items'] = array_map(fn($i) => $i->jsonSerialize(), $items);
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $proj = new AvailProject();
        $proj->setTitle($data['title'] ?? '');
        $proj->setDescription($data['description'] ?? '');
        $proj->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $proj->setStatus($data['status'] ?? 'planning');
        $proj->setStartDate($data['start_date'] ?: null);
        $proj->setEndDate($data['end_date'] ?: null);
        $proj->setAssignedTo($data['assigned_to'] ?? '');
        $proj->setApprover($data['approver'] ?? '');
        $proj->setCreatedBy($uid);
        $proj->setCreatedAt($now);
        $proj->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($proj)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $proj = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('title', $data))       $proj->setTitle($data['title']);
        if (array_key_exists('description', $data)) $proj->setDescription($data['description']);
        if (array_key_exists('platform_id', $data)) $proj->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('status', $data))      $proj->setStatus($data['status']);
        if (array_key_exists('start_date', $data))  $proj->setStartDate($data['start_date'] ?: null);
        if (array_key_exists('end_date', $data))    $proj->setEndDate($data['end_date'] ?: null);
        if (array_key_exists('assigned_to', $data)) $proj->setAssignedTo($data['assigned_to']);
        if (array_key_exists('approver', $data))    $proj->setApprover($data['approver']);
        $proj->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($proj)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->deleteForProject($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Item endpoints ────────────────────────────────────────────

    /** @NoAdminRequired */
    public function addItem(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $project = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data    = $this->request->getParams();
        $uid     = $this->userSession->getUser()?->getUID() ?? '';
        $itemType = $data['item_type'] ?? 'milestone';
        $itemId   = isset($data['item_id']) && $data['item_id'] ? (int)$data['item_id'] : null;

        // Pull dates from linked item
        $plannedStart = $data['planned_start'] ?: null;
        $plannedEnd   = $data['planned_end']   ?: null;
        $title        = $data['title'] ?? '';

        if ($itemId) {
            try {
                if ($itemType === 'pm') {
                    $linked = $this->procMapper->find($itemId);
                    if (!$plannedStart) $plannedStart = $linked->getNextDue();
                    if (!$title)        $title        = $linked->getName();
                } elseif ($itemType === 'modernization') {
                    $linked = $this->modMapper->find($itemId);
                    if (!$plannedStart) $plannedStart = $linked->getStartDate();
                    if (!$plannedEnd)   $plannedEnd   = $linked->getTargetCompletion();
                    if (!$title)        $title        = $linked->getTitle();
                } elseif ($itemType === 'deficiency') {
                    $linked = $this->defMapper->find($itemId);
                    if (!$plannedEnd)   $plannedEnd   = $linked->getTargetCompletion();
                    if (!$title)        $title        = $linked->getSummary();
                }
            } catch (\Exception $e) {}
        }

        // Warn if outside project window
        $warnings = [];
        if ($project->getStartDate() && $plannedStart && $plannedStart < $project->getStartDate()) {
            $warnings[] = 'Item start date is before project window.';
        }
        if ($project->getEndDate() && $plannedEnd && $plannedEnd > $project->getEndDate()) {
            $warnings[] = 'Item end date is after project window.';
        }

        $item = new ProjectItem();
        $item->setProjectId($id);
        $item->setItemType($itemType);
        $item->setItemId($itemId);
        $item->setTitle($title);
        $item->setPlannedStart($plannedStart);
        $item->setPlannedEnd($plannedEnd);
        $item->setSequence((int)($data['sequence'] ?? 0));
        $item->setDependsOn($data['depends_on'] ?? '[]');
        $item->setStatus($data['status'] ?? 'pending');
        $item->setNotes($data['notes'] ?? '');
        $item->setCreatedBy($uid);
        $item->setCreatedAt(date('Y-m-d H:i:s'));

        $created = $this->itemMapper->insert($item);
        $result  = $created->jsonSerialize();
        if (!empty($warnings)) $result['warnings'] = $warnings;
        return new DataResponse($result, Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateItem(int $id, int $itemId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $item = $this->itemMapper->find($itemId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('title', $data))         $item->setTitle($data['title']);
        if (array_key_exists('planned_start', $data)) $item->setPlannedStart($data['planned_start'] ?: null);
        if (array_key_exists('planned_end', $data))   $item->setPlannedEnd($data['planned_end'] ?: null);
        if (array_key_exists('actual_start', $data))  $item->setActualStart($data['actual_start'] ?: null);
        if (array_key_exists('actual_end', $data))    $item->setActualEnd($data['actual_end'] ?: null);
        if (array_key_exists('sequence', $data))      $item->setSequence((int)$data['sequence']);
        if (array_key_exists('depends_on', $data))    $item->setDependsOn($data['depends_on']);
        if (array_key_exists('status', $data))        $item->setStatus($data['status']);
        if (array_key_exists('notes', $data))         $item->setNotes($data['notes']);
        return new DataResponse($this->itemMapper->update($item)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function deleteItem(int $id, int $itemId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->delete($this->itemMapper->find($itemId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
