<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class ReqTraceability extends Entity implements \JsonSerializable {
    protected int     $reqId          = 0;
    protected string  $tracedToType   = '';
    protected int     $tracedToId     = 0;
    protected string  $traceType      = 'satisfies';
    protected string  $notes          = '';
    protected string  $createdBy      = '';
    protected string  $createdAt      = '';

    public function getReqId(): int               { return $this->reqId; }
    public function setReqId(int $v): void        { $this->reqId = $v; $this->markFieldUpdated('reqId'); }
    public function getTracedToType(): string     { return $this->tracedToType; }
    public function setTracedToType(string $v): void { $this->tracedToType = $v; $this->markFieldUpdated('tracedToType'); }
    public function getTracedToId(): int          { return $this->tracedToId; }
    public function setTracedToId(int $v): void   { $this->tracedToId = $v; $this->markFieldUpdated('tracedToId'); }
    public function getTraceType(): string        { return $this->traceType; }
    public function setTraceType(string $v): void { $this->traceType = $v; $this->markFieldUpdated('traceType'); }
    public function getNotes(): string            { return $this->notes; }
    public function setNotes(string $v): void     { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getCreatedBy(): string        { return $this->createdBy; }
    public function setCreatedBy(string $v): void { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string        { return $this->createdAt; }
    public function setCreatedAt(string $v): void { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'req_id'         => $this->reqId,
            'traced_to_type' => $this->tracedToType,
            'traced_to_id'   => $this->tracedToId,
            'trace_type'     => $this->traceType,
            'notes'          => $this->notes,
            'created_by'     => $this->createdBy,
            'created_at'     => $this->createdAt,
        ];
    }
}
