<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method int     getDashboardId()    @method void setDashboardId(int $v)
 * @method string  getTitle()          @method void setTitle(string $v)
 * @method string  getMetric()         @method void setMetric(string $v)
 * @method string  getChartType()      @method void setChartType(string $v)
 * @method string  getTimeRange()      @method void setTimeRange(string $v)
 * @method ?string getGroupBy()        @method void setGroupBy(?string $v)
 * @method ?string getFilters()        @method void setFilters(?string $v)
 * @method int     getPosX()           @method void setPosX(int $v)
 * @method int     getPosY()           @method void setPosY(int $v)
 * @method int     getWidth()          @method void setWidth(int $v)
 * @method int     getHeight()         @method void setHeight(int $v)
 * @method ?string getCreatedAt()      @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()      @method void setUpdatedAt(?string $v)
 */
class ReportWidget extends Entity implements \JsonSerializable {

    // Valid metric keys — enforced in controller
    public const METRICS = [
        'readiness_trend',
        'pm_compliance',
        'cve_severity_trend',
        'deficiency_aging',
        'budget_variance',
        'fleet_node_health',
        'patch_compliance',
        'vulnerability_score',
        'software_tier_compliance',
    ];

    public const CHART_TYPES = ['line', 'bar', 'donut', 'heatmap', 'sparkline', 'gauge'];
    public const TIME_RANGES  = ['7d', '30d', '90d', '1y', 'all'];

    protected int     $dashboardId = 0;
    protected string  $title       = '';
    protected string  $metric      = '';
    protected string  $chartType   = 'bar';
    protected string  $timeRange   = '30d';
    protected ?string $groupBy     = null;
    protected ?string $filters     = null;
    protected int     $posX        = 0;
    protected int     $posY        = 0;
    protected int     $width       = 2;
    protected int     $height      = 2;
    protected ?string $createdAt   = null;
    protected ?string $updatedAt   = null;

    public function getFiltersArray(): array {
        return $this->filters ? (json_decode($this->filters, true) ?? []) : [];
    }

    public function jsonSerialize(): array {
        return [
            'id'           => $this->id,
            'dashboard_id' => $this->dashboardId,
            'title'        => $this->title,
            'metric'       => $this->metric,
            'chart_type'   => $this->chartType,
            'time_range'   => $this->timeRange,
            'group_by'     => $this->groupBy,
            'filters'      => $this->getFiltersArray(),
            'pos_x'        => $this->posX,
            'pos_y'        => $this->posY,
            'width'        => $this->width,
            'height'       => $this->height,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }
}
