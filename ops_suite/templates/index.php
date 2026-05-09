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
    </div>
    <div id="ops-main">
        <div id="ops-content"></div>
    </div>
</div>
