<?php
/** @var \OCP\IL10N $l */
/** @var array $_ */
\OCP\Util::addScript('ops_suite',  'ops_suite-main');
\OCP\Util::addStyle('ops_suite',   'ops_suite-style');
?>
<div id="ops-suite-wrapper">
    <div id="ops-sidebar">
        <div class="ops-logo">
            <span class="ops-logo-mark">Ops Suite</span>
            <span class="ops-logo-sub">Configuration · PM · Deficiencies</span>
        </div>
        <div style="padding:8px 12px 4px 12px;">
            <span id="ops-role-badge" class="ops-badge badge-gray" style="font-size:11px;">Loading…</span>
        </div>
    </div>
    <div id="ops-main">
        <div id="ops-content"></div>
    </div>
</div>
