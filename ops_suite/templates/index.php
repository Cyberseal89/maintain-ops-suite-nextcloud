<?php
/** @var \OCP\IL10N $l */
/** @var array $_ */
\OCP\Util::addScript('ops_suite',  'ops_suite-main');
\OCP\Util::addStyle('ops_suite',   'ops_suite-style');
$swUrl       = \OC::$server->getURLGenerator()->linkToRoute('ops_suite.page.swJs');
$manifestUrl = \OC::$server->getURLGenerator()->linkToRoute('ops_suite.page.manifest');
$appScope    = \OC::$server->getURLGenerator()->linkTo('ops_suite', '');
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
<link rel="manifest" href="<?php echo htmlspecialchars($manifestUrl); ?>">
<div id="mos-offline-banner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:99999;background:#f59e0b;color:#000;text-align:center;padding:7px 16px;font-size:12px;font-weight:600;letter-spacing:0.3px;">
    Offline &mdash; showing cached data &mdash; <span id="mos-offline-age"></span>
</div>
<script nonce="<?php echo p(\OC::$server->getContentSecurityPolicyNonceManager()->getNonce()); ?>">
(function() {
    var swUrl    = '<?php echo htmlspecialchars($swUrl); ?>';
    var appScope = '<?php echo htmlspecialchars($appScope); ?>';
    var banner   = document.getElementById('mos-offline-banner');
    var ageEl    = document.getElementById('mos-offline-age');

    function fmtAge(ts) {
        if (!ts) return '';
        var mins = Math.round((Date.now() - ts) / 60000);
        if (mins < 1) return 'synced just now';
        if (mins < 60) return 'last synced ' + mins + 'm ago';
        var hrs = Math.round(mins / 60);
        return 'last synced ' + hrs + 'h ago';
    }

    function getLastSync(cb) {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) { cb(null); return; }
        var ch = new MessageChannel();
        ch.port1.onmessage = function(e) { cb(e.data); };
        navigator.serviceWorker.controller.postMessage('getLastSync', [ch.port2]);
    }

    function showBanner() {
        banner.style.display = 'block';
        document.body.style.paddingTop = '32px';
        getLastSync(function(ts) { if (ageEl) ageEl.textContent = fmtAge(ts); });
    }

    function hideBanner() {
        banner.style.display = 'none';
        document.body.style.paddingTop = '';
    }

    window.addEventListener('offline', showBanner);
    window.addEventListener('online',  function() {
        hideBanner();
        // Reload data silently when connection restores
        if (window.__mosRefreshData) window.__mosRefreshData();
    });

    if (!navigator.onLine) showBanner();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(swUrl, { scope: appScope })
            .catch(function(e) { console.warn('[MOS SW]', e); });
    }
})();
</script>
