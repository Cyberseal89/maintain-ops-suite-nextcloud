<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Personnel;
use OCA\OpsSuite\Db\PersonnelMapper;
use OCA\OpsSuite\Db\PersonnelSkill;
use OCA\OpsSuite\Db\PersonnelSkillMapper;
use OCA\OpsSuite\Db\SkillsCatalog;
use OCA\OpsSuite\Db\SkillsCatalogMapper;
use OCA\OpsSuite\Db\ManpowerRequirement;
use OCA\OpsSuite\Db\ManpowerRequirementMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class ManpowerController extends Controller {

    public function __construct(
        string                           $appName,
        IRequest                         $request,
        private readonly PersonnelMapper            $personnelMapper,
        private readonly PersonnelSkillMapper       $skillLinkMapper,
        private readonly SkillsCatalogMapper        $catalogMapper,
        private readonly ManpowerRequirementMapper  $reqMapper,
        private readonly PermissionService          $permission
    ) {
        parent::__construct($appName, $request);
    }

    // ── Personnel ─────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexPersonnel(): DataResponse {
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $shopId     = $this->request->getParam('shop_id')     ? (int)$this->request->getParam('shop_id')     : null;
        $status     = $this->request->getParam('status')     ?: null;
        return new DataResponse(array_map(
            fn($p) => $p->jsonSerialize(),
            $this->personnelMapper->findAll($platformId, $shopId, $status)
        ));
    }

    /** @NoAdminRequired */
    public function showPersonnel(int $id): DataResponse {
        try {
            $p = $this->personnelMapper->find($id)->jsonSerialize();
            // Attach skills
            $links  = $this->skillLinkMapper->findByPersonnel($id);
            $skills = [];
            foreach ($links as $link) {
                $row = $link->jsonSerialize();
                try {
                    $row['skill'] = $this->catalogMapper->find($link->getSkillId())->jsonSerialize();
                } catch (\Throwable) {
                    $row['skill'] = null;
                }
                $skills[] = $row;
            }
            $p['skills'] = $skills;
            return new DataResponse($p);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createPersonnel(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $p = new Personnel();
        $p->setNextcloudUid($d['nextcloud_uid'] ?: null);
        $p->setFirstName($d['first_name'] ?? '');
        $p->setLastName($d['last_name'] ?? '');
        $p->setRole($d['role'] ?: null);
        $p->setShopId(isset($d['shop_id']) && $d['shop_id'] ? (int)$d['shop_id'] : null);
        $p->setPlatformId(isset($d['platform_id']) && $d['platform_id'] ? (int)$d['platform_id'] : null);
        $p->setEmail($d['email'] ?: null);
        $p->setPhone($d['phone'] ?: null);
        $p->setStatus($d['status'] ?? 'active');
        $p->setNotes($d['notes'] ?: null);
        $p->setCreatedAt($now);
        $p->setUpdatedAt($now);

        return new DataResponse($this->personnelMapper->insert($p)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updatePersonnel(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $p = $this->personnelMapper->find($id);
            $d = $this->request->getParams();

            if (array_key_exists('nextcloud_uid', $d)) $p->setNextcloudUid($d['nextcloud_uid'] ?: null);
            if (array_key_exists('first_name',    $d)) $p->setFirstName($d['first_name'] ?? '');
            if (array_key_exists('last_name',     $d)) $p->setLastName($d['last_name'] ?? '');
            if (array_key_exists('role',          $d)) $p->setRole($d['role'] ?: null);
            if (array_key_exists('shop_id',       $d)) $p->setShopId($d['shop_id'] ? (int)$d['shop_id'] : null);
            if (array_key_exists('platform_id',   $d)) $p->setPlatformId($d['platform_id'] ? (int)$d['platform_id'] : null);
            if (array_key_exists('email',         $d)) $p->setEmail($d['email'] ?: null);
            if (array_key_exists('phone',         $d)) $p->setPhone($d['phone'] ?: null);
            if (array_key_exists('status',        $d)) $p->setStatus($d['status'] ?? 'active');
            if (array_key_exists('notes',         $d)) $p->setNotes($d['notes'] ?: null);
            $p->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->personnelMapper->update($p)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroyPersonnel(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->skillLinkMapper->deleteByPersonnel($id);
            $this->personnelMapper->delete($this->personnelMapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Personnel skills ──────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexPersonnelSkills(int $id): DataResponse {
        $links = $this->skillLinkMapper->findByPersonnel($id);
        $out = [];
        foreach ($links as $link) {
            $row = $link->jsonSerialize();
            try { $row['skill'] = $this->catalogMapper->find($link->getSkillId())->jsonSerialize(); }
            catch (\Throwable) { $row['skill'] = null; }
            $out[] = $row;
        }
        return new DataResponse($out);
    }

    /** @NoAdminRequired */
    public function addPersonnelSkill(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $ps = new PersonnelSkill();
        $ps->setPersonnelId($id);
        $ps->setSkillId((int)($d['skill_id'] ?? 0));
        $ps->setProficiencyLevel((int)($d['proficiency_level'] ?? 1));
        $ps->setCertifiedDate($d['certified_date'] ?: null);
        $ps->setExpiryDate($d['expiry_date'] ?: null);
        $ps->setNotes($d['notes'] ?: null);
        $ps->setCreatedAt($now);
        $ps->setUpdatedAt($now);

        return new DataResponse($this->skillLinkMapper->insert($ps)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updatePersonnelSkill(int $id, int $skillLinkId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ps = $this->skillLinkMapper->find($skillLinkId);
            $d  = $this->request->getParams();

            if (array_key_exists('proficiency_level', $d)) $ps->setProficiencyLevel((int)$d['proficiency_level']);
            if (array_key_exists('certified_date',    $d)) $ps->setCertifiedDate($d['certified_date'] ?: null);
            if (array_key_exists('expiry_date',       $d)) $ps->setExpiryDate($d['expiry_date'] ?: null);
            if (array_key_exists('notes',             $d)) $ps->setNotes($d['notes'] ?: null);
            $ps->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->skillLinkMapper->update($ps)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function removePersonnelSkill(int $id, int $skillLinkId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->skillLinkMapper->delete($this->skillLinkMapper->find($skillLinkId));
            return new DataResponse(['deleted' => $skillLinkId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Skills Catalog ────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexSkills(): DataResponse {
        $category = $this->request->getParam('category') ?: null;
        return new DataResponse(array_map(
            fn($s) => $s->jsonSerialize(),
            $this->catalogMapper->findAll($category)
        ));
    }

    /** @NoAdminRequired */
    public function showSkill(int $skillId): DataResponse {
        try {
            $skill = $this->catalogMapper->find($skillId)->jsonSerialize();
            $links = $this->skillLinkMapper->findBySkill($skillId);
            $skill['qualified_count'] = count($links);
            // Attach qualified personnel names for roster display
            $qualified = [];
            foreach ($links as $link) {
                try {
                    $p = $this->personnelMapper->find($link->getPersonnelId())->jsonSerialize();
                    $qualified[] = [
                        'personnel_id'      => $p['id'],
                        'full_name'         => $p['full_name'],
                        'nextcloud_uid'     => $p['nextcloud_uid'],
                        'proficiency_level' => $link->getProficiencyLevel(),
                        'certified_date'    => $link->getCertifiedDate(),
                        'expiry_date'       => $link->getExpiryDate(),
                    ];
                } catch (\Throwable) {}
            }
            $skill['qualified_personnel'] = $qualified;
            return new DataResponse($skill);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createSkill(): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $s = new SkillsCatalog();
        $s->setCode(strtoupper(trim($d['code'] ?? '')));
        $s->setName($d['name'] ?? '');
        $s->setCategory($d['category'] ?: null);
        $s->setDescription($d['description'] ?: null);
        $s->setCreatedAt($now);
        $s->setUpdatedAt($now);

        try {
            return new DataResponse($this->catalogMapper->insert($s)->jsonSerialize(), Http::STATUS_CREATED);
        } catch (\Throwable) {
            return new DataResponse(['message' => 'Skill code already exists'], Http::STATUS_CONFLICT);
        }
    }

    /** @NoAdminRequired */
    public function updateSkill(int $skillId): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $s = $this->catalogMapper->find($skillId);
            $d = $this->request->getParams();

            if (array_key_exists('code',        $d)) $s->setCode(strtoupper(trim($d['code'] ?? '')));
            if (array_key_exists('name',        $d)) $s->setName($d['name'] ?? '');
            if (array_key_exists('category',    $d)) $s->setCategory($d['category'] ?: null);
            if (array_key_exists('description', $d)) $s->setDescription($d['description'] ?: null);
            $s->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->catalogMapper->update($s)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroySkill(int $skillId): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->catalogMapper->delete($this->catalogMapper->find($skillId));
            return new DataResponse(['deleted' => $skillId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Manpower Requirements ─────────────────────────────────────

    /** @NoAdminRequired */
    public function indexRequirements(): DataResponse {
        $sourceType = $this->request->getParam('source_type') ?: null;
        $sourceId   = $this->request->getParam('source_id')   ? (int)$this->request->getParam('source_id') : null;
        $reqs = $this->reqMapper->findAll($sourceType, $sourceId);
        $out  = [];
        foreach ($reqs as $req) {
            $row = $req->jsonSerialize();
            if ($req->getSkillId()) {
                try { $row['skill'] = $this->catalogMapper->find($req->getSkillId())->jsonSerialize(); }
                catch (\Throwable) { $row['skill'] = null; }
                // Coverage: how many active personnel hold this skill
                $links = $this->skillLinkMapper->findBySkill($req->getSkillId());
                $row['qualified_count'] = count($links);
            } else {
                $row['skill'] = null;
                $row['qualified_count'] = 0;
            }
            $out[] = $row;
        }
        return new DataResponse($out);
    }

    /** @NoAdminRequired */
    public function createRequirement(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $r = new ManpowerRequirement();
        $r->setSourceType($d['source_type'] ?? '');
        $r->setSourceId((int)($d['source_id'] ?? 0));
        $r->setSkillId(isset($d['skill_id']) && $d['skill_id'] ? (int)$d['skill_id'] : null);
        $r->setQtyRequired((int)($d['qty_required'] ?? 1));
        $r->setDurationHours(isset($d['duration_hours']) && $d['duration_hours'] !== '' ? (string)(float)$d['duration_hours'] : null);
        $r->setNotes($d['notes'] ?: null);
        $r->setCreatedAt($now);
        $r->setUpdatedAt($now);

        return new DataResponse($this->reqMapper->insert($r)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateRequirement(int $reqId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $r = $this->reqMapper->find($reqId);
            $d = $this->request->getParams();

            if (array_key_exists('skill_id',       $d)) $r->setSkillId($d['skill_id'] ? (int)$d['skill_id'] : null);
            if (array_key_exists('qty_required',   $d)) $r->setQtyRequired((int)$d['qty_required']);
            if (array_key_exists('duration_hours', $d)) $r->setDurationHours($d['duration_hours'] !== '' ? (string)(float)$d['duration_hours'] : null);
            if (array_key_exists('notes',          $d)) $r->setNotes($d['notes'] ?: null);
            $r->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->reqMapper->update($r)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroyRequirement(int $reqId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->reqMapper->delete($this->reqMapper->find($reqId));
            return new DataResponse(['deleted' => $reqId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
