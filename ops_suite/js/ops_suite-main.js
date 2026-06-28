/**
 * OpsSuite v3.30.2
 */
(function () {
'use strict';

// null = all sections visible; array of keys = only those keys visible
var _enabledSections = null;

/* ── DOM ready ───────────────────────────────────────────────── */
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* ── Nextcloud helpers ───────────────────────────────────────── */
function ncUrl(path) {
  return (window.OC && typeof window.OC.generateUrl === 'function')
    ? window.OC.generateUrl('/apps/ops_suite' + path)
    : '/index.php/apps/ops_suite' + path;
}
function ncToken() {
  if (window.OC && window.OC.requestToken) return window.OC.requestToken;
  var head = document.querySelector('head[data-requesttoken]');
  return head ? (head.getAttribute('data-requesttoken') || '') : '';
}
function isAdmin() {
  return !!(window.OC && window.OC.isUserAdmin && window.OC.isUserAdmin());
}

/* ── API ─────────────────────────────────────────────────────── */
async function req(method, path, body) {
  var opts = {
    method, credentials: 'same-origin',
    headers: { 'Content-Type':'application/json', 'requesttoken':ncToken(), 'OCS-APIREQUEST':'true' }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  var r = await fetch(ncUrl(path), opts);
  var txt = await r.text();
  if (!r.ok) throw new Error('HTTP '+r.status+': '+txt.slice(0,300));
  try { return JSON.parse(txt); } catch(e) { return txt; }
}
function qs(p) {
  if (!p) return '';
  var s = Object.entries(p).filter(kv=>kv[1]!==undefined&&kv[1]!==null&&kv[1]!=='')
    .map(kv=>encodeURIComponent(kv[0])+'='+encodeURIComponent(kv[1])).join('&');
  return s ? '?'+s : '';
}

var API = {
  dashboard:    { stats:      (pids)  => req('GET',  '/api/dashboard/stats' + (pids&&pids.length ? '?platform_ids='+pids.join(',') : '')) },
  assets:       { list:       p       => req('GET',  '/api/assets'+qs(p)),
                  get:        id      => req('GET',  '/api/assets/'+id),
                  create:     d       => req('POST', '/api/assets', d),
                  update:     (id,d)  => req('PUT',  '/api/assets/'+id, d),
                  del:        id      => req('DELETE','/api/assets/'+id) },
  procedures:   { list:       p       => req('GET',  '/api/procedures'+qs(p)),
                  get:        id      => req('GET',  '/api/procedures/'+id),
                  create:     d       => req('POST', '/api/procedures', d),
                  update:     (id,d)  => req('PUT',  '/api/procedures/'+id, d),
                  complete:   (id, data) => req('POST', '/api/procedures/'+id+'/complete', data||{}),
                  del:        id      => req('DELETE','/api/procedures/'+id) },
  deficiencies: { list:       p       => req('GET',  '/api/deficiencies'+qs(p)),
                  get:        id      => req('GET',  '/api/deficiencies/'+id),
                  create:     d       => req('POST', '/api/deficiencies', d),
                  update:     (id,d)  => req('PUT',  '/api/deficiencies/'+id, d),
                  del:        id      => req('DELETE','/api/deficiencies/'+id),
                  addNote:    (id,t)  => req('POST', '/api/deficiencies/'+id+'/history', {entry_text:t}) },
  users:        { list:       ()      => req('GET',  '/api/users'),
                  groups:     ()      => req('GET',  '/api/groups') },
  settings:     { get:        ()      => req('GET',  '/api/settings'),
                  me:         ()      => req('GET',  '/api/settings/me'),
                  save:       d       => req('POST', '/api/settings', d),
                  seed:       ()      => req('POST', '/api/settings/seed',      {}),
                  seedDocs:   ()      => req('POST', '/api/settings/seed-docs', {}) },
  supply: {
                  requests: {
                    list:       p         => req('GET',    '/api/supply/requests'+qs(p)),
                    get:        id        => req('GET',    '/api/supply/requests/'+id),
                    create:     d         => req('POST',   '/api/supply/requests', d),
                    update:     (id,d)    => req('PUT',    '/api/supply/requests/'+id, d),
                    destroy:    id        => req('DELETE', '/api/supply/requests/'+id),
                    addItem:    (id,d)    => req('POST',   '/api/supply/requests/'+id+'/items', d),
                    updateItem: (id,iid,d)=> req('PUT',    '/api/supply/requests/'+id+'/items/'+iid, d),
                    deleteItem: (id,iid)  => req('DELETE', '/api/supply/requests/'+id+'/items/'+iid),
                  },
                  inventory: {
                    list:     p       => req('GET',  '/api/supply/inventory'+qs(p)),
                    get:      id      => req('GET',  '/api/supply/inventory/'+id),
                    create:   d       => req('POST', '/api/supply/inventory', d),
                    update:   (id,d)  => req('PUT',  '/api/supply/inventory/'+id, d),
                    transact: (id,d)  => req('POST', '/api/supply/inventory/'+id+'/transact', d),
                  },
                },
  workPackages: {
                  list:         p           => req('GET',    '/api/work-packages'+qs(p)),
                  get:          id          => req('GET',    '/api/work-packages/'+id),
                  create:       d           => req('POST',   '/api/work-packages', d),
                  update:       (id,d)      => req('PUT',    '/api/work-packages/'+id, d),
                  destroy:      id          => req('DELETE', '/api/work-packages/'+id),
                  addItem:      (id,d)      => req('POST',   '/api/work-packages/'+id+'/items', d),
                  removeItem:   (id,iid)    => req('DELETE', '/api/work-packages/'+id+'/items/'+iid),
                  listQuotes:   id          => req('GET',    '/api/work-packages/'+id+'/quotes'),
                  createQuote:  (id,d)      => req('POST',   '/api/work-packages/'+id+'/quotes', d),
                  updateQuote:  (id,qid,d)  => req('PUT',    '/api/work-packages/'+id+'/quotes/'+qid, d),
                  destroyQuote: (id,qid)    => req('DELETE', '/api/work-packages/'+id+'/quotes/'+qid),
                  award:        (id,d)      => req('POST',   '/api/work-packages/'+id+'/award', d),
                },
  availProjects: {
                  list:       p         => req('GET',    '/api/avail-projects'+qs(p)),
                  get:        id        => req('GET',    '/api/avail-projects/'+id),
                  create:     d         => req('POST',   '/api/avail-projects', d),
                  update:     (id,d)    => req('PUT',    '/api/avail-projects/'+id, d),
                  destroy:    id        => req('DELETE', '/api/avail-projects/'+id),
                  addItem:    (id,d)    => req('POST',   '/api/avail-projects/'+id+'/items', d),
                  updateItem: (id,iid,d)=> req('PUT',    '/api/avail-projects/'+id+'/items/'+iid, d),
                  deleteItem: (id,iid)  => req('DELETE', '/api/avail-projects/'+id+'/items/'+iid),
                },
  modernizations: {
                  list:        p           => req('GET',    '/api/modernizations'+qs(p)),
                  get:         id          => req('GET',    '/api/modernizations/'+id),
                  create:      d           => req('POST',   '/api/modernizations', d),
                  update:      (id,d)      => req('PUT',    '/api/modernizations/'+id, d),
                  destroy:     id          => req('DELETE', '/api/modernizations/'+id),
                  addAsset:    (id,d)      => req('POST',   '/api/modernizations/'+id+'/assets', d),
                  updateAsset: (id,aid,d)  => req('PUT',    '/api/modernizations/'+id+'/assets/'+aid, d),
                  removeAsset: (id,aid)    => req('DELETE', '/api/modernizations/'+id+'/assets/'+aid),
                },
  platforms:    { list:       ()      => req('GET',  '/api/platforms'),
                  mine:       uid     => req('GET',  '/api/platforms/mine' + (uid ? '?uid='+uid : '')),
                  get:        id      => req('GET',  '/api/platforms/'+id),
                  create:     d       => req('POST', '/api/platforms', d),
                  update:     (id,d)  => req('PUT',  '/api/platforms/'+id, d),
                  destroy:    id      => req('DELETE','/api/platforms/'+id) },
  shops:        { list:         p       => req('GET',    '/api/shops'+qs(p)),
                  get:          id      => req('GET',    '/api/shops/'+id),
                  create:       d       => req('POST',   '/api/shops', d),
                  update:       (id,d)  => req('PUT',    '/api/shops/'+id, d),
                  destroy:      id      => req('DELETE', '/api/shops/'+id) },
  requirements: { list:    p       => req('GET',    '/api/requirements'+qs(p)),
                  get:     id      => req('GET',    '/api/requirements/'+id),
                  create:  d       => req('POST',   '/api/requirements', d),
                  update:  (id,d)  => req('PUT',    '/api/requirements/'+id, d),
                  destroy: id      => req('DELETE', '/api/requirements/'+id),
                  addTrace:    (id,d)      => req('POST',   '/api/requirements/'+id+'/traces', d),
                  deleteTrace: (id,trid)   => req('DELETE', '/api/requirements/'+id+'/traces/'+trid),
                },
  interfaces:   { list:    p       => req('GET',    '/api/interfaces'+qs(p)),
                  get:     id      => req('GET',    '/api/interfaces/'+id),
                  create:  d       => req('POST',   '/api/interfaces', d),
                  update:  (id,d)  => req('PUT',    '/api/interfaces/'+id, d),
                  destroy: id      => req('DELETE', '/api/interfaces/'+id),
                },
  documents:    { list:           p         => req('GET',    '/api/documents'+qs(p)),
                  get:            id        => req('GET',    '/api/documents/'+id),
                  create:         d         => req('POST',   '/api/documents', d),
                  update:         (id,d)    => req('PUT',    '/api/documents/'+id, d),
                  destroy:        id        => req('DELETE', '/api/documents/'+id),
                  getRevisions:   id        => req('GET',    '/api/documents/'+id+'/revisions'),
                  addRevision:    (id,d)    => req('POST',   '/api/documents/'+id+'/revisions', d),
                  updateRevision: (id,rid,d)=> req('PUT',    '/api/documents/'+id+'/revisions/'+rid, d),
                  deleteRevision: (id,rid)  => req('DELETE', '/api/documents/'+id+'/revisions/'+rid),
                  dmSteps:        id        => req('GET',    '/api/documents/'+id+'/steps'),
                  saveSteps:      (id,d)    => req('POST',   '/api/documents/'+id+'/steps', d),
                  listPubDms:     id        => req('GET',    '/api/documents/'+id+'/pub-dms'),
                  addPubDm:       (id,d)    => req('POST',   '/api/documents/'+id+'/pub-dms', d),
                  updatePubDm:    (id,did,d)=> req('PUT',    '/api/documents/'+id+'/pub-dms/'+did, d),
                  removePubDm:    (id,did)  => req('DELETE', '/api/documents/'+id+'/pub-dms/'+did),
                  reorderPubDms:  (id,d)    => req('POST',   '/api/documents/'+id+'/pub-dms/reorder', d),
                  releasePub:     id        => req('POST',   '/api/documents/'+id+'/release', {}),
                },
  files:        { sopFolder:     ()      => req('GET',  '/api/files/sop'),
                  listFolder:    p       => req('GET',  '/api/files/list'+qs(p)),
                  ensureFolders: ()      => req('POST', '/api/files/ensure-folders', {}),
                  getTdp:    (assetId, assetName) => req('GET',  '/api/files/tdp?asset_id='+assetId+'&asset_name='+encodeURIComponent(assetName)),
                  createTdp: (assetId, assetName) => req('POST', '/api/files/tdp', {asset_id: assetId, asset_name: assetName}) },
  loto:         { list:          p     => req('GET',    '/api/loto'+qs(p)),
                  get:           id    => req('GET',    '/api/loto/'+id),
                  create:        d     => req('POST',   '/api/loto', d),
                  update:        (id,d)=> req('PUT',    '/api/loto/'+id, d),
                  release:       (id,d)=> req('POST',   '/api/loto/'+id+'/release', d||{}),
                  verify:        id    => req('POST',   '/api/loto/'+id+'/verify', {}),
                  destroy:       id    => req('DELETE', '/api/loto/'+id),
                  listDevices:   p     => req('GET',    '/api/loto/devices'+qs(p)),
                  getDevice:     id    => req('GET',    '/api/loto/devices/'+id),
                  createDevice:  d     => req('POST',   '/api/loto/devices', d),
                  updateDevice:  (id,d)=> req('PUT',    '/api/loto/devices/'+id, d),
                  destroyDevice: id    => req('DELETE', '/api/loto/devices/'+id) },
  imports:      { list:    ()    => req('GET',    '/api/imports'),
                  get:     id    => req('GET',    '/api/imports/'+id),
                  create:  d     => req('POST',   '/api/imports', d),
                  map:     (id,d)=> req('PUT',    '/api/imports/'+id+'/map', d),
                  execute: id    => req('POST',   '/api/imports/'+id+'/execute', {}),
                  destroy: id    => req('DELETE', '/api/imports/'+id),
                  fields:  p     => req('GET',    '/api/imports/fields'+qs(p)),
                  profiles:()    => req('GET',    '/api/imports/profiles') },
  healthReport: { generate: p    => req('GET',    '/api/health-report'+qs(p)) },
  budget: { list:      p       => req('GET',    '/api/budget'+qs(p)),
             get:      id      => req('GET',    '/api/budget/'+id),
             create:   d       => req('POST',   '/api/budget', d),
             update:   (id,d)  => req('PUT',    '/api/budget/'+id, d),
             destroy:  id      => req('DELETE', '/api/budget/'+id),
             summary:  p       => req('GET',    '/api/budget/summary'+qs(p)),
             ufrExport:p       => req('GET',    '/api/budget/ufr-export'+qs(p)),
             drilldown:p       => req('GET',    '/api/budget/drilldown'+qs(p)),
             listLines:(id)    => req('GET',    '/api/budget/'+id+'/lines'),
             createLine:(id,d) => req('POST',   '/api/budget/'+id+'/lines', d),
             updateLine:(id,lid,d)=>req('PUT',  '/api/budget/'+id+'/lines/'+lid, d),
             destroyLine:(id,lid)=>req('DELETE','/api/budget/'+id+'/lines/'+lid) },
  manpower: {
    personnel: {
      list:       p         => req('GET',    '/api/manpower/personnel'+qs(p)),
      get:        id        => req('GET',    '/api/manpower/personnel/'+id),
      create:     d         => req('POST',   '/api/manpower/personnel', d),
      update:     (id,d)    => req('PUT',    '/api/manpower/personnel/'+id, d),
      destroy:    id        => req('DELETE', '/api/manpower/personnel/'+id),
      listSkills: id        => req('GET',    '/api/manpower/personnel/'+id+'/skills'),
      addSkill:   (id,d)    => req('POST',   '/api/manpower/personnel/'+id+'/skills', d),
      updateSkill:(id,slid,d)=>req('PUT',   '/api/manpower/personnel/'+id+'/skills/'+slid, d),
      removeSkill:(id,slid) => req('DELETE', '/api/manpower/personnel/'+id+'/skills/'+slid),
    },
    skills: {
      list:    p      => req('GET',    '/api/manpower/skills'+qs(p)),
      get:     id     => req('GET',    '/api/manpower/skills/'+id),
      create:  d      => req('POST',   '/api/manpower/skills', d),
      update:  (id,d) => req('PUT',    '/api/manpower/skills/'+id, d),
      destroy: id     => req('DELETE', '/api/manpower/skills/'+id),
    },
    requirements: {
      list:    p      => req('GET',    '/api/manpower/requirements'+qs(p)),
      create:  d      => req('POST',   '/api/manpower/requirements', d),
      update:  (id,d) => req('PUT',    '/api/manpower/requirements/'+id, d),
      destroy: id     => req('DELETE', '/api/manpower/requirements/'+id),
    },
  },
  training: {
    list:    p      => req('GET',    '/api/training'+qs(p)),
    get:     id     => req('GET',    '/api/training/'+id),
    create:  d      => req('POST',   '/api/training', d),
    update:  (id,d) => req('PUT',    '/api/training/'+id, d),
    destroy: id     => req('DELETE', '/api/training/'+id),
  },
  energySources: { list:   p     => req('GET',    '/api/energy-sources'+qs(p)),
                   get:    id    => req('GET',    '/api/energy-sources/'+id),
                   create: d     => req('POST',   '/api/energy-sources', d),
                   update: (id,d)=> req('PUT',    '/api/energy-sources/'+id, d),
                   destroy:id    => req('DELETE', '/api/energy-sources/'+id) },
  canvases:     { list:    p     => req('GET',    '/api/canvases'+qs(p)),
                  get:     id    => req('GET',    '/api/canvases/'+id),
                  create:  d     => req('POST',   '/api/canvases', d),
                  update:  (id,d)=> req('PUT',    '/api/canvases/'+id, d),
                  destroy: id    => req('DELETE', '/api/canvases/'+id),
                  status:  id    => req('GET',    '/api/canvases/'+id+'/status'),
                  publish: (id,d)=> req('POST',   '/api/canvases/'+id+'/publish', d) },
  rcm:          { list:       p  => req('GET',    '/api/rcm/decisions'+qs(p)),
                  get:        id => req('GET',    '/api/rcm/decisions/'+id),
                  upsert:     d  => req('POST',   '/api/rcm/decisions', d),
                  destroy:    id => req('DELETE', '/api/rcm/decisions/'+id),
                  generatePm: (id, docId) => req('POST', '/api/rcm/decisions/'+id+'/generate-pm', docId ? {document_id: docId} : {}) },
  componentLib: { list:    p     => req('GET',    '/api/component-library'+qs(p)),
                  get:     id    => req('GET',    '/api/component-library/'+id),
                  create:  d     => req('POST',   '/api/component-library', d),
                  update:  (id,d)=> req('PUT',    '/api/component-library/'+id, d),
                  destroy: id    => req('DELETE', '/api/component-library/'+id) },
  fmea:         { listWorksheets:  p           => req('GET',    '/api/fmea/worksheets'+qs(p)),
                  getWorksheet:    id          => req('GET',    '/api/fmea/worksheets/'+id),
                  findOrCreate:    d           => req('POST',   '/api/fmea/worksheets/find-or-create', d),
                  updateWorksheet: (id,d)      => req('PUT',    '/api/fmea/worksheets/'+id, d),
                  destroyWorksheet:id          => req('DELETE', '/api/fmea/worksheets/'+id),
                  publishWorksheet:(id,d)      => req('POST',   '/api/fmea/worksheets/'+id+'/publish', d),
                  listEntries:     wsId        => req('GET',    '/api/fmea/worksheets/'+wsId+'/entries'),
                  createEntry:     (wsId,d)    => req('POST',   '/api/fmea/worksheets/'+wsId+'/entries', d),
                  updateEntry:     (wsId,id,d) => req('PUT',    '/api/fmea/worksheets/'+wsId+'/entries/'+id, d),
                  destroyEntry:    (wsId,id)   => req('DELETE', '/api/fmea/worksheets/'+wsId+'/entries/'+id),
                  syncFromDm:      id          => req('POST',   '/api/fmea/worksheets/'+id+'/sync-from-dm', {}) },
  photos:       { list:          (assetId,p)   => req('GET',    '/api/assets/'+assetId+'/photos'+qs(p)),
                  create:        (assetId,d)   => req('POST',   '/api/assets/'+assetId+'/photos', d),
                  update:        (assetId,id,d)=> req('PUT',    '/api/assets/'+assetId+'/photos/'+id, d),
                  destroy:       (assetId,id)  => req('DELETE', '/api/assets/'+assetId+'/photos/'+id) },
  models:       { list:          assetId       => req('GET',    '/api/assets/'+assetId+'/models'),
                  get:           (assetId,id)  => req('GET',    '/api/assets/'+assetId+'/models/'+id),
                  create:        (assetId,d)   => req('POST',   '/api/assets/'+assetId+'/models', d),
                  update:        (assetId,id,d)=> req('PUT',    '/api/assets/'+assetId+'/models/'+id, d),
                  destroy:       (assetId,id)  => req('DELETE', '/api/assets/'+assetId+'/models/'+id),
                  addHotspot:    (assetId,modelId,d)       => req('POST',   '/api/assets/'+assetId+'/models/'+modelId+'/hotspots', d),
                  updateHotspot: (assetId,modelId,hsId,d)  => req('PUT',    '/api/assets/'+assetId+'/models/'+modelId+'/hotspots/'+hsId, d),
                  deleteHotspot: (assetId,modelId,hsId)    => req('DELETE', '/api/assets/'+assetId+'/models/'+modelId+'/hotspots/'+hsId) },
  altofleet:    { list:           p     => req('GET',    '/api/altofleet/nodes'+qs(p)),
                  get:            id    => req('GET',    '/api/altofleet/nodes/'+id),
                  update:         (id,d)=> req('PUT',    '/api/altofleet/nodes/'+id, d),
                  destroy:        id    => req('DELETE', '/api/altofleet/nodes/'+id),
                  cves:           id    => req('GET',    '/api/altofleet/nodes/'+id+'/cves'),
                  forceScan:      id    => req('POST',   '/api/altofleet/nodes/'+id+'/force-scan'),
                  scheduleUpdate: id    => req('POST',   '/api/altofleet/nodes/'+id+'/schedule-update') },
  reports:      { listDashboards:  ()    => req('GET',    '/api/reports/dashboards'),
                  createDashboard: d    => req('POST',   '/api/reports/dashboards', d),
                  getDashboard:   id    => req('GET',    '/api/reports/dashboards/'+id),
                  updateDashboard:(id,d)=> req('PUT',    '/api/reports/dashboards/'+id, d),
                  destroyDashboard:id   => req('DELETE', '/api/reports/dashboards/'+id),
                  createWidget:  (did,d)=> req('POST',   '/api/reports/dashboards/'+did+'/widgets', d),
                  updateWidget:(did,wid,d)=>req('PUT',   '/api/reports/dashboards/'+did+'/widgets/'+wid, d),
                  destroyWidget:(did,wid) =>req('DELETE','/api/reports/dashboards/'+did+'/widgets/'+wid),
                  data:      (metric,p) => req('GET',    '/api/reports/data/'+metric+qs(p)),
                  cyber:            ()  => req('GET',    '/api/reports/cyber-readiness'),
                  fields:           ()  => req('GET',    '/api/reports/fields'),
                  query:           (p)  => req('GET',    '/api/reports/query'+qs(p)) },
  software:     { catalog:         p     => req('GET',    '/api/software/catalog'+qs(p)),
                  createCatalog:   d     => req('POST',   '/api/software/catalog', d),
                  updateCatalog:   (id,d)=> req('PUT',    '/api/software/catalog/'+id, d),
                  deleteCatalog:   id    => req('DELETE', '/api/software/catalog/'+id),
                  requests:        p     => req('GET',    '/api/software/requests'+qs(p)),
                  createRequest:   d     => req('POST',   '/api/software/requests', d),
                  customRequest:   d     => req('POST',   '/api/software/requests/custom', d),
                  approve:         id    => req('POST',   '/api/software/requests/'+id+'/approve'),
                  reject:          (id,d)=> req('POST',   '/api/software/requests/'+id+'/reject', d) } };

/* ── Cache ───────────────────────────────────────────────────── */
var _cache = { assets:null, users:null, settings:null, shops:null };
var _selectedPlatformIds = []; // empty = all platforms

// Current user role — fetched once on boot
var _userRole = { role:'technician', label:'Technician', can_write:true, can_admin:false, can_approve:false };
async function getUserRole() {
  if (_userRole._loaded) return _userRole;
  try { _userRole = Object.assign(await API.settings.me(), {_loaded:true}); } catch(e) {}
  return _userRole;
}

async function getAssets()   { if (!_cache.assets)   _cache.assets   = await API.assets.list();    return _cache.assets; }
async function getUsers()    { if (!_cache.users)    _cache.users    = await API.users.list();   return _cache.users; }
async function getGroups()   { if (!_cache.groups)   _cache.groups   = await API.users.groups(); return _cache.groups; }
async function getSettings() { if (!_cache.settings) _cache.settings = await API.settings.get(); return _cache.settings; }
async function getShops()    { if (!_cache.shops)    _cache.shops    = await API.shops.list();   return _cache.shops; }
function clearCache(k)       { if (k) _cache[k]=null; else { _cache.assets=null; _cache.users=null; _cache.shops=null; } }

/* ── Permission helper ───────────────────────────────────────── */
var _canWrite = null;
var _currentUser = (typeof OC !== 'undefined' && OC.currentUser) ? OC.currentUser : '';
var _orgSettings = { org_name: 'Alto Technologies LLC', org_address: '', org_city: '', org_phone: '', org_email: '', org_website: '' };
async function canWrite() {
  if (_canWrite !== null) return _canWrite;
  var role = await getUserRole();
  _canWrite = role.can_write;
  return _canWrite;
}

/* ── DOM helpers ─────────────────────────────────────────────── */
function escH(s) { return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function el(tag, props, kids) {
  var e = document.createElement(tag);
  Object.entries(props||{}).forEach(([k,v]) => {
    if (k==='cls') e.className=v;
    else if (k==='html') e.innerHTML=v;
    else if (k==='text') e.textContent=v;
    else if (k==='style') e.style.cssText=v;
    else if (k.slice(0,2)==='on') e.addEventListener(k.slice(2),v);
    else e.setAttribute(k,v);
  });
  (kids||[]).forEach(k => { if(k!=null) e.appendChild(typeof k==='string'?document.createTextNode(k):k); });
  return e;
}
var div  = (cls,kids) => el('div',{cls:cls||''},Array.isArray(kids)?kids:(kids?[kids]:[]));
var span = (cls,txt)  => el('span',{cls,text:txt||''});
var btn  = (cls,txt,h)=> el('button',{cls:'ops-btn '+(cls||''),text:txt,onclick:h});

function inp(ph,val,type) {
  var i=el('input',{cls:'ops-input',type:type||'text',placeholder:ph||''});
  i.value=val||''; return i;
}
function sel(opts,val) {
  var s=el('select',{cls:'ops-select'});
  opts.forEach(o=>{
    var opt=el('option',{value:String(o[0]),text:o[1]});
    if(String(o[0])===String(val)) opt.selected=true;
    s.appendChild(opt);
  });
  return s;
}
function ta(ph,val,rows) {
  var t=el('textarea',{cls:'ops-textarea',placeholder:ph||''});
  t.value=val||''; t.rows=rows||3; return t;
}
function fg(label,inputEl,full,hint) {
  var g=div('ops-form-group'+(full?' ops-form-full':''));
  g.appendChild(el('label',{cls:'ops-form-label',text:label}));
  g.appendChild(inputEl);
  if(hint) g.appendChild(span('ops-form-hint',hint));
  return g;
}
function setContent(node) {
  var c=document.getElementById('ops-content');
  if(!c) return; c.innerHTML=''; c.appendChild(node);
}

/* ── Asset dropdown builder ──────────────────────────────────── */
async function assetDropdown(val) {
  var assets = await getAssets();
  var s = el('select',{cls:'ops-select'});
  s.appendChild(el('option',{value:'',text:'— Select Asset —'}));
  assets.forEach(a => {
    var opt=el('option',{value:String(a.id),text:a.asset_id_label+' — '+a.name+' ('+a.asset_type+')'});
    if(String(a.id)===String(val)) opt.selected=true;
    s.appendChild(opt);
  });
  return s;
}
// Sync version using pre-loaded assets array
function assetDropdownSync(assets, val) {
  var s = el('select',{cls:'ops-select'});
  s.appendChild(el('option',{value:'',text:'— Select Asset —'}));
  assets.forEach(a => {
    var opt=el('option',{value:String(a.id),text:a.asset_id_label+' — '+a.name+' ('+a.asset_type+')'});
    if(String(a.id)===String(val)) opt.selected=true;
    s.appendChild(opt);
  });
  return s;
}

/* ── Multi-asset picker ──────────────────────────────────────── */
function multiAssetPicker(assets, selectedIds) {
  // selectedIds: comma-separated string like "3,7,12"
  var selected = (selectedIds||'').split(',').map(s=>s.trim()).filter(Boolean);
  var wrap = div('ops-multi-asset');
  wrap.style.cssText = 'border:1px solid #2e3650;border-radius:8px;padding:10px;max-height:160px;overflow-y:auto;background:#1a1f2e;';
  assets.forEach(a => {
    var id = String(a.id);
    var row = div('');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;';
    var cb = el('input',{type:'checkbox',value:id});
    cb.checked = selected.includes(id);
    var lbl = el('label',{text:a.asset_id_label+' — '+a.name,style:'font-size:13px;color:#cbd5e1;cursor:pointer;'});
    row.appendChild(cb); row.appendChild(lbl); wrap.appendChild(row);
  });
  wrap.getValue = function() {
    return Array.from(wrap.querySelectorAll('input[type=checkbox]:checked'))
      .map(c=>c.value).join(',');
  };
  return wrap;
}

/* ── User dropdown ───────────────────────────────────────────── */
function userDropdown(users, val, includeBlank) {
  var s = el('select',{cls:'ops-select'});
  if(includeBlank!==false) s.appendChild(el('option',{value:'',text:' — Unassigned — '}));
  users.forEach(u => {
    var opt=el('option',{value:u.uid,text:u.displayName});
    if(u.uid===val) opt.selected=true;
    s.appendChild(opt);
  });
  return s;
}

/* ── SOP File Picker ─────────────────────────────────────────── */
// Generic Nextcloud file browser — starts at rootPath, calls onSelect(davPath, name) on pick
function showFileBrowser(onSelect, opts) {
  opts = opts || {};
  // Default starting folder: 'Maintain Ops Suite' app folder
  var rootPath   = opts.rootPath   !== undefined ? opts.rootPath : 'Maintain Ops Suite';
  var title      = opts.title      || '📂 Browse Files';
  var hint       = opts.hint       || 'Click a file to attach it';
  var allowTypes = opts.allowTypes || null; // e.g. ['pdf','png','jpg'] — null = all

  var overlay = el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'});
  var box = el('div',{style:'background:#1e2540;border:1px solid #3e4a65;border-radius:16px;width:720px;max-width:calc(100vw - 40px);max-height:calc(100vh - 80px);display:flex;flex-direction:column;overflow:hidden;'});

  var hdr = el('div',{style:'padding:16px 20px;border-bottom:1px solid #2e3650;display:flex;align-items:center;gap:12px;background:#161d30;flex-shrink:0;'});
  hdr.appendChild(el('span',{style:'font-size:15px;font-weight:700;color:#e2e8f0;',text:title}));
  var pathDisplay = el('span',{style:'flex:1;font-size:12px;color:#7dd3fc;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',text:'/'+(rootPath||'')});
  var xb = el('button',{style:'background:none;border:none;cursor:pointer;color:#64748b;font-size:20px;',text:'✕',onclick:()=>overlay.remove()});
  hdr.appendChild(pathDisplay); hdr.appendChild(xb);

  var body = el('div',{style:'flex:1;overflow-y:auto;padding:12px;min-height:200px;'});

  // Path stack relative to user root
  var pathStack = rootPath ? rootPath.split('/').filter(Boolean) : [];

  async function loadPath() {
    var relPath = pathStack.join('/') || '';
    pathDisplay.textContent = '/' + (relPath || '(root)');
    body.innerHTML = '';
    body.appendChild(el('div',{style:'padding:20px;text-align:center;color:#64748b;font-style:italic;',text:'Loading…'}));

    // req() throws on any non-2xx; wrap in a fallback that auto-creates folders on 404
    async function fetchListing(path) {
      try {
        return await API.files.listFolder({path: path});
      } catch(e) {
        if (e.message.indexOf('404') !== -1 || e.message.toLowerCase().indexOf('not found') !== -1) {
          return null; // signals not-found
        }
        throw e; // re-throw genuine server errors
      }
    }

    try {
      var data = await fetchListing(relPath);
      if (data === null) {
        // Folder doesn't exist yet — create standard app structure and retry
        await API.files.ensureFolders().catch(function(){});
        data = await fetchListing(relPath);
        if (data === null) {
          // Still missing (e.g. a subfolder the user navigated into manually)
          // Fall back to the app root
          pathStack.splice(0, pathStack.length, ...(rootPath ? rootPath.split('/').filter(Boolean) : []));
          data = await fetchListing(pathStack.join('/'));
        }
      }
      body.innerHTML = '';
      var files = (data && data.files) || [];
      if (!files.length) {
        var emptyMsg = el('div',{style:'padding:20px;text-align:center;color:#64748b;'});
        emptyMsg.innerHTML = 'Empty folder.<br><span style="font-size:11px;">Upload files to <b>Nextcloud Files → '+(relPath||'/')+'</b> to see them here.</span>';
        body.appendChild(emptyMsg);
        return;
      }
      files.forEach(function(f) {
        var ext = (f.name||'').split('.').pop().toLowerCase();
        var blocked = allowTypes && f.type !== 'folder' && !allowTypes.includes(ext);
        if (blocked) return;

        var row = el('div',{style:'display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:7px;cursor:pointer;transition:background .12s;'});
        row.addEventListener('mouseenter',function(){ row.style.background='#2d3548'; });
        row.addEventListener('mouseleave',function(){ row.style.background=''; });
        var icon  = el('span',{style:'font-size:18px;flex-shrink:0;',text:f.type==='folder'?'📁':getFileIcon(f.mime)});
        var nameEl = el('span',{style:'flex:1;font-size:13px;color:#e2e8f0;',text:f.name});
        var sizeEl = el('span',{style:'font-size:11px;color:#64748b;',text:f.type==='folder'?'':fmtSize(f.size||0)});
        row.appendChild(icon); row.appendChild(nameEl); row.appendChild(sizeEl);

        if (f.type === 'folder') {
          row.addEventListener('click', function(){ pathStack.push(f.name); loadPath(); });
        } else {
          row.addEventListener('click', function(){ onSelect(f.rel || f.path || '', f.name); overlay.remove(); });
        }
        body.appendChild(row);
      });
    } catch(e) {
      body.innerHTML = '';
      var errDiv = el('div',{style:'padding:20px;text-align:center;color:#f87171;'});
      errDiv.innerHTML = '⚠ Could not load folder.<br><span style="font-size:11px;color:#64748b;">'+e.message+'</span>';
      body.appendChild(errDiv);
    }
  }

  var footer = el('div',{style:'padding:12px 20px;border-top:1px solid #2e3650;display:flex;justify-content:space-between;align-items:center;background:#161d30;flex-shrink:0;'});
  var upBtn = el('button',{style:'padding:6px 14px;border-radius:7px;border:1px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:12px;cursor:pointer;',text:'↑ Up',onclick:()=>{
    if (pathStack.length > (rootPath ? rootPath.split('/').filter(Boolean).length : 0)) {
      pathStack.pop(); loadPath();
    }
  }});
  footer.appendChild(upBtn);
  footer.appendChild(el('span',{style:'font-size:11px;color:#64748b;',text:hint}));

  box.appendChild(hdr); box.appendChild(body); box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  loadPath();
}

function showSopPicker(onSelect) {
  var overlay = el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'});
  var box = el('div',{style:'background:#1e2540;border:1px solid #3e4a65;border-radius:16px;width:680px;max-width:calc(100vw - 40px);max-height:calc(100vh - 80px);display:flex;flex-direction:column;overflow:hidden;'});

  var hdr = el('div',{style:'padding:16px 20px;border-bottom:1px solid #2e3650;display:flex;align-items:center;gap:12px;background:#161d30;flex-shrink:0;'});
  var pathDisplay = el('span',{style:'flex:1;font-size:13px;color:#7dd3fc;font-family:monospace;',text:'/PMS Procedures'});
  var xb = el('button',{style:'background:none;border:none;cursor:pointer;color:#64748b;font-size:20px;',text:'✕',onclick:()=>overlay.remove()});
  hdr.appendChild(el('span',{style:'font-size:15px;font-weight:700;color:#e2e8f0;',text:'📂 PMS Procedures'}));
  hdr.appendChild(pathDisplay);
  hdr.appendChild(xb);

  var body = el('div',{style:'flex:1;overflow-y:auto;padding:12px;'});
  var status = el('div',{style:'padding:20px;text-align:center;color:#64748b;font-style:italic;',text:'Loading files…'});
  body.appendChild(status);

  // Breadcrumb stack
  var pathStack = ['PMS Procedures'];

  async function loadPath(relPath) {
    body.innerHTML=''; body.appendChild(el('div',{style:'padding:20px;text-align:center;color:#64748b;font-style:italic;',text:'Loading…'}));
    pathDisplay.textContent = '/'+pathStack.join('/');
    try {
      var data = await API.files.listFolder({path: relPath});
      body.innerHTML='';
      if (!data.files || !data.files.length) {
        body.appendChild(el('div',{style:'padding:20px;text-align:center;color:#64748b;',text:'No files in this folder.'}));
        return;
      }
      data.files.forEach(f => {
        var row = el('div',{style:'display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:7px;cursor:pointer;transition:background .12s;'});
        row.addEventListener('mouseenter',()=>row.style.background='#2d3548');
        row.addEventListener('mouseleave',()=>row.style.background='');
        var icon = el('span',{style:'font-size:18px;flex-shrink:0;',text:f.type==='folder'?'📁':getFileIcon(f.mime)});
        var nameEl = el('span',{style:'flex:1;font-size:13px;color:#e2e8f0;',text:f.name});
        var sizeEl = el('span',{style:'font-size:11px;color:#64748b;',text:f.type==='folder'?'':fmtSize(f.size)});
        row.appendChild(icon); row.appendChild(nameEl); row.appendChild(sizeEl);
        if (f.type==='folder') {
          row.addEventListener('click',()=>{
            pathStack.push(f.name);
            loadPath(pathStack.join('/'));
          });
        } else {
          row.addEventListener('click',()=>{
            onSelect(f.rel, f.name);
            overlay.remove();
          });
        }
        body.appendChild(row);
      });
    } catch(e) {
      body.innerHTML='';
      body.appendChild(el('div',{style:'padding:20px;text-align:center;color:#f87171;',text:'Error: '+e.message}));
    }
  }

  var footer = el('div',{style:'padding:12px 20px;border-top:1px solid #2e3650;display:flex;justify-content:space-between;align-items:center;background:#161d30;flex-shrink:0;'});
  var upBtn = el('button',{style:'padding:6px 14px;border-radius:7px;border:1px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:12px;cursor:pointer;',text:'↑ Up',onclick:()=>{
    if(pathStack.length>1){ pathStack.pop(); loadPath(pathStack.join('/')); }
  }});
  footer.appendChild(upBtn);
  footer.appendChild(el('span',{style:'font-size:11px;color:#64748b;',text:'Click a file to select it as the SOP document'}));

  box.appendChild(hdr); box.appendChild(body); box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  // Ensure SOP folder exists then load it
  API.files.sopFolder().then(()=>loadPath('PMS Procedures')).catch(()=>loadPath('PMS Procedures'));
}

function getFileIcon(mime) {
  if (!mime) return '📄';
  if (mime.includes('pdf'))  return '📋';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel'))  return '📊';
  if (mime.includes('image')) return '🖼';
  if (mime.includes('video')) return '🎬';
  return '📄';
}
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return bytes+'B';
  if (bytes < 1048576)    return Math.round(bytes/1024)+'KB';
  return (bytes/1048576).toFixed(1)+'MB';
}

/* ── Table helper ────────────────────────────────────────────── */
function makeTable(headers, rows, onRowClick) {
  var t=el('table',{cls:'ops-table'+(onRowClick?' ops-table-hover':'')});
  var thead=el('thead'),hr=el('tr');
  headers.forEach(h=>hr.appendChild(el('th',{text:h})));
  thead.appendChild(hr); t.appendChild(thead);
  var tbody=el('tbody');
  if(!rows.length){
    var er=el('tr'),ec=el('td',{cls:'ops-empty',text:'No records found.'});
    ec.colSpan=headers.length; er.appendChild(ec); tbody.appendChild(er);
  } else {
    rows.forEach((cells,i)=>{
      var row=el('tr');
      cells.forEach(c=>{
        var td=el('td');
        if(c==null) td.textContent='—';
        else if(c instanceof Node) td.appendChild(c);
        else td.textContent=String(c);
        row.appendChild(td);
      });
      if(onRowClick){ row.style.cursor='pointer'; row.onclick=()=>onRowClick(i); }
      tbody.appendChild(row);
    });
  }
  t.appendChild(tbody); return t;
}

/* ── Modal helper ────────────────────────────────────────────── */
function modal(title, bodyNode, onSave, saveLabel) {
  var overlay=el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'});
  var box=el('div',{style:'background:#1e2540;border:1px solid #3e4a65;border-radius:16px;width:740px;max-width:calc(100vw - 40px);max-height:calc(100vh - 60px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.9);'});
  var hdr=el('div',{style:'display:flex;align-items:center;padding:20px 24px;border-bottom:1px solid #2e3650;flex-shrink:0;background:#161d30;'});
  var h2=el('h2',{style:'font-size:17px;font-weight:800;margin:0;flex:1;color:#e2e8f0;font-family:inherit;',text:title});
  var xb=el('button',{style:'background:none;border:none;cursor:pointer;font-size:20px;color:#64748b;',text:'✕',onclick:()=>overlay.remove()});
  hdr.appendChild(h2); hdr.appendChild(xb);
  var body=el('div',{style:'padding:24px;overflow-y:auto;flex:1;'});
  body.appendChild(bodyNode);
  var footer=el('div',{style:'padding:16px 24px;border-top:1px solid #2e3650;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#161d30;'});
  var cancelBtn=el('button',{style:'padding:8px 18px;border-radius:8px;border:1.5px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;',text:onSave?'Cancel':'Close',onclick:()=>overlay.remove()});
  footer.appendChild(cancelBtn);
  if (onSave) {
    var saveBtn=el('button',{style:'padding:8px 18px;border-radius:8px;border:1.5px solid #0284c7;background:#0284c7;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;',text:saveLabel||'Save'});
    saveBtn.onclick=async()=>{
      saveBtn.disabled=true; saveBtn.textContent='Saving…';
      try { await onSave(); overlay.remove(); }
      catch(e){ alert('Error: '+e.message); saveBtn.disabled=false; saveBtn.textContent=saveLabel||'Save'; }
    };
    footer.appendChild(saveBtn);
  }
  box.appendChild(hdr); box.appendChild(body); box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// Multi-button modal — actions: [{label, cls, action: function(close){}}]
function showModal(title, bodyNode, actions) {
  var overlay=el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'});
  var box=el('div',{style:'background:#1e2540;border:1px solid #3e4a65;border-radius:16px;width:740px;max-width:calc(100vw - 40px);max-height:calc(100vh - 60px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.9);'});
  var hdr=el('div',{style:'display:flex;align-items:center;padding:20px 24px;border-bottom:1px solid #2e3650;flex-shrink:0;background:#161d30;'});
  hdr.appendChild(el('h2',{style:'font-size:17px;font-weight:800;margin:0;flex:1;color:#e2e8f0;font-family:inherit;',text:title}));
  var close=function(){ overlay.remove(); };
  hdr.appendChild(el('button',{style:'background:none;border:none;cursor:pointer;font-size:20px;color:#64748b;',text:'✕',onclick:close}));
  var bodyWrap=el('div',{style:'padding:24px;overflow-y:auto;flex:1;'});
  bodyWrap.appendChild(bodyNode);
  var footer=el('div',{style:'padding:16px 24px;border-top:1px solid #2e3650;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#161d30;'});
  (actions||[]).forEach(function(a){
    var b=el('button',{text:a.label,style:'padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;'});
    if (a.cls==='primary') b.style.cssText+=';border:1.5px solid #0284c7;background:#0284c7;color:#fff;';
    else if (a.cls==='ops-btn-danger') b.style.cssText+=';border:1.5px solid #dc2626;background:#dc2626;color:#fff;';
    else b.style.cssText+=';border:1.5px solid #3e4a65;background:#2d3548;color:#cbd5e1;';
    b.onclick=async function(){
      b.disabled=true; var orig=b.textContent; b.textContent='…';
      try{ await a.action(close); }
      catch(e){ alert('Error: '+e.message); b.disabled=false; b.textContent=orig; }
    };
    footer.appendChild(b);
  });
  box.appendChild(hdr); box.appendChild(bodyWrap); box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener('click',function(ev){ if(ev.target===overlay) close(); });
  document.body.appendChild(overlay);
}

/* ── Badges / formatters ─────────────────────────────────────── */
function sevBadge(s) {
  var m={'SEV-1':['ops-sev ops-sev-sev1'],'SEV-2':['ops-sev ops-sev-sev2'],
    'SEV-3':['ops-sev ops-sev-sev3'],'SEV-4':['ops-sev ops-sev-sev4'],'SEV-5':['ops-sev ops-sev-sev5']};
  return span((m[s]||['ops-sev ops-sev-sev3'])[0], s||'SEV-?');
}
function statusBadge(st) {
  var cls={open:'badge-red',in_work:'badge-orange',waiting_parts:'badge-orange',
    waiting_approval:'badge-orange',scheduled:'badge-blue',closed:'badge-gray',
    cancelled:'badge-gray',operational:'badge-green',degraded:'badge-orange',offline:'badge-red',maintenance:'badge-blue'};
  var lbl={open:'Open',in_work:'In Work',waiting_parts:'Waiting Parts',waiting_approval:'Waiting Approval',
    scheduled:'Scheduled',closed:'Closed',cancelled:'Cancelled',operational:'Operational',
    degraded:'Degraded',offline:'Offline',maintenance:'In Maintenance'};
  return span('ops-badge '+(cls[st]||'badge-gray'), lbl[st]||st||'—');
}
function assetStatusBadge(asset) {
  var sev = asset.worst_open_severity;
  if (sev === 'SEV-1') {
    var b = span('ops-badge badge-red', 'Non-Operational');
    b.title = 'Derived from open SEV-1 deficiency — stored status: '+(asset.status||'unknown');
    return b;
  }
  if (sev === 'SEV-2') {
    var b = span('ops-badge badge-orange', 'Degraded');
    b.title = 'Derived from open SEV-2 deficiency — stored status: '+(asset.status||'unknown');
    return b;
  }
  if (sev === 'SEV-3') {
    var b = span('ops-badge badge-yellow', 'Degraded');
    b.title = 'Derived from open SEV-3 deficiency — stored status: '+(asset.status||'unknown');
    return b;
  }
  return statusBadge(asset.status);
}
function typeBadge(t) { return span('ops-tag ops-tag-'+(t||''), (t||'').toUpperCase().slice(0,2)); }
function critBadge(c) {
  if(!c) return null;
  var cls={CR:'badge-red',DE:'badge-orange',RD:'badge-yellow',SP:'badge-blue',AD:'badge-gray'};
  var lbl={CR:'Mission Critical',DE:'Direct Effect',RD:'Readiness Degrader',SP:'Support',AD:'Administrative'};
  return span('ops-badge '+(cls[c]||'badge-gray'), c+' — '+(lbl[c]||c));
}
function readinessBadge(code) {
  if(!code) return null;
  var cls={'FULL-OP':'badge-green','DEG-OP-MIN':'badge-orange','DEG-OP-BEL':'badge-orange',
           'DOWN-OP':'badge-red','DOWN-MX':'badge-blue','DOWN-UNS':'badge-red'};
  return span('ops-badge '+(cls[code]||'badge-gray'), code);
}
function dueBadge(d) {
  if(!d) return span('ops-badge badge-gray','—');
  var diff=Math.floor((new Date(d)-new Date())/86400000);
  if(diff<0)   return span('ops-badge badge-red',    Math.abs(diff)+'d overdue');
  if(diff===0) return span('ops-badge badge-orange', 'Due today');
  if(diff<=7)  return span('ops-badge badge-orange', d.slice(0,10));
  return span('ops-badge badge-green', d.slice(0,10));
}
function fmtDate(d)  { return d?String(d).slice(0,10):'—'; }
function fmtDT(d)    { return d?String(d).slice(0,16).replace('T',' '):'—'; }
function fmt$(v)     { return (v&&parseFloat(v))?'$'+parseFloat(v).toLocaleString():'$0'; }
function initials(u) { return u?u.slice(0,2).toUpperCase():'?'; }
function overdueDays(d){ return d?Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/86400000)):0; }

/* ════════════════════════════════════════════════════════════════
   ASSET FORM
════════════════════════════════════════════════════════════════ */
async function buildAssetForm(data) {
  data = data||{};
  var assets = await getAssets();
  var [platforms, shops] = await Promise.all([API.platforms.list(), getShops()]);
  var wrap = div('ops-form-grid');
  function add(l,i,full,hint){ wrap.appendChild(fg(l,i,full,hint)); return i; }
  var f = {};
  f.name     = add('Asset Name *',    inp('e.g., Core Switch Rack-A', data.name));
  f.type     = add('Asset Type *',    sel([['hardware','Hardware'],['software','Software'],['firmware','Firmware']], data.asset_type||'hardware'));
  f.mfr      = add('Manufacturer',   inp('e.g., Cisco', data.manufacturer));
  f.model    = add('Model',          inp('e.g., Catalyst 9300-48P', data.model));
  f.serial   = add('Serial Number',  inp('Serial / asset tag', data.serial_number));
  f.version  = add('Version / Build',inp('e.g., 17.9.4a', data.version));
  f.location = add('Location',       inp('e.g., Bldg 2 — IDF-1 — U12', data.location));
  f.ip       = add('IP Address',     inp('e.g., 10.0.4.1', data.ip_address));
  f.install  = add('Install Date',   inp('','','date'));
  if(data.install_date) f.install.value=data.install_date;
  f.warranty = add('Warranty Expiry',inp('','','date'));
  if(data.warranty_expiry) f.warranty.value=data.warranty_expiry;
  f.status   = add('Status', sel([['operational','Operational'],['degraded','Degraded'],
    ['offline','Offline'],['maintenance','In Maintenance'],['decommissioned','Decommissioned']], data.status||'operational'));
  var platOpts = [['','— No Platform —']].concat(platforms.map(p=>[String(p.id), p.name + (p.location ? ' ('+p.location+')' : '')]));
  f.platform = add('Platform', sel(platOpts, data.platform_id ? String(data.platform_id) : ''));

  // Shop assignment — drives asset code generation
  var shopOpts = [['','— No Shop —']].concat(shops.map(s=>[String(s.id), s.code+' — '+s.name]));
  f.shop = add('Shop', sel(shopOpts, data.shop_id ? String(data.shop_id) : ''), false, 'Assigns the asset to a shop and auto-generates its asset code.');

  // Parent asset (creates hierarchy depth)
  var parentOpts = [['','— Root Asset (no parent) —']].concat(assets.filter(a=>a.id!==(data.id||0)).map(a=>[String(a.id), (a.asset_code||('#'+a.id))+' — '+a.name]));
  f.parent = add('Parent Asset', sel(parentOpts, data.parent_id ? String(data.parent_id) : ''), false, 'Set to make this a child asset in the hierarchy.');

  // Criticality & bypass
  f.criticality  = add('Criticality', sel([['','— Unclassified —'],['CR','CR — Critical'],['DE','DE — Degraded Mode'],['RD','RD — Redundant'],['SP','SP — Support'],['AD','AD — Administrative']], data.criticality_code||''), false, 'MOS-REQ-002 §3.2 — drives readiness calculations.');
  f.redundancy   = add('Redundant Path', sel([['0','No'],['1','Yes']], data.redundancy_available ? '1' : '0'));
  f.bypassPoss   = add('Bypass Available', sel([['0','No'],['1','Yes']], data.bypass_possible ? '1' : '0'));
  f.bypassMethod = add('Bypass Method', ta('Describe how to bypass this component…', data.bypass_method||'', 2), true);
  f.degradedCap  = add('Degraded Capability %', inp('e.g., 75', data.degraded_capability||''), false, 'Capability % when operating in bypass/degraded mode.');
  f.degradedNotes= add('Degraded Notes', ta('What is lost / what remains when bypassed…', data.degraded_notes||'', 2), true);

  // Redundancy / failover
  var failoverOpts = [['','— None —']].concat(assets.filter(a=>a.id!==(data.id||0)).map(a=>[String(a.id),(a.asset_code||('#'+a.id))+' — '+a.name]));
  f.failoverAsset= add('Failover Asset', sel(failoverOpts, data.failover_asset_id ? String(data.failover_asset_id) : ''), false, 'The redundant asset this fails over to (RD components).');
  f.redundancyType= add('Redundancy Type', sel([['','— N/A —'],['auto','Auto'],['standby','Standby'],['spare','Spare'],['procedure','Procedure']],data.redundancy_type||''));
  f.failoverTime = add('Failover Time (mins)', inp('e.g., 5', data.failover_time_mins||''));
  f.failoverProc = add('Failover Procedure', ta('Steps to switch to backup…', data.failover_procedure||'', 2), true);
  f.isSystemNode = add('System Node (Root)', sel([['0','No'],['1','Yes — this is the top-level system asset']], data.is_system_node ? '1' : '0'));

  // Multi-asset picker for linked assets
  var linkedPicker = multiAssetPicker(assets.filter(a=>a.id!==(data.id||0)), data.linked_assets||'');
  var linkedWrap = div('ops-form-group ops-form-full');
  linkedWrap.appendChild(el('label',{cls:'ops-form-label',text:'Linked Assets (Digital Twin Cross-References)'}));
  linkedWrap.appendChild(el('div',{cls:'ops-form-hint',text:'Check all related hardware, software, or firmware assets'}));
  linkedWrap.appendChild(linkedPicker);
  wrap.appendChild(linkedWrap);

  var tdpSourceOpts = [['','— Own TDP folder —']].concat(assets.filter(a=>a.id!==(data.id||0)).map(a=>[String(a.id), a.asset_id_label+' — '+a.name]));
  f.tdpSource = add('TDP Source Asset', sel(tdpSourceOpts, data.tdp_source_asset_id ? String(data.tdp_source_asset_id) : ''), false, 'Link to another assets TDP folder. Use for identical equipment sharing the same documentation.');
  f.uii      = add('UII (ISO 15459)', inp('Unique Item Identifier', data.uii||''));
  f.cageCode = add('CAGE Code', inp('5-character CAGE code', data.cage_code||''));
  f.iuid     = add('IUID Compliant', sel([['0','No'],['1','Yes']], String(data.iuid_compliant ? '1' : '0')));
  f.tags  = add('Tags', inp('Comma-separated tags', data.tags||''), true);
  f.notes = add('Notes', ta('Technical details, configuration notes…', data.notes||'',3), true);

  f.collect = () => ({
    name:f.name.value, asset_type:f.type.value,
    manufacturer:f.mfr.value, model:f.model.value, serial_number:f.serial.value,
    version:f.version.value, location:f.location.value, ip_address:f.ip.value,
    install_date:f.install.value||'', warranty_expiry:f.warranty.value||'',
    status:f.status.value, linked_assets:linkedPicker.getValue(),
    tags:f.tags.value, notes:f.notes.value,
    platform_id: f.platform.value ? parseInt(f.platform.value) : null,
    shop_id: f.shop.value ? parseInt(f.shop.value) : null,
    parent_id: f.parent.value ? parseInt(f.parent.value) : null,
    criticality_code:   f.criticality.value || null,
    redundancy_available: parseInt(f.redundancy.value),
    bypass_possible:    parseInt(f.bypassPoss.value),
    bypass_method:      f.bypassMethod.value.trim() || null,
    degraded_capability:f.degradedCap.value ? parseFloat(f.degradedCap.value) : null,
    degraded_notes:     f.degradedNotes.value.trim() || null,
    failover_asset_id:  f.failoverAsset.value ? parseInt(f.failoverAsset.value) : null,
    redundancy_type:    f.redundancyType.value || null,
    failover_time_mins: f.failoverTime.value ? parseInt(f.failoverTime.value) : null,
    failover_procedure: f.failoverProc.value.trim() || null,
    is_system_node:     parseInt(f.isSystemNode.value),
    tdp_source_asset_id: f.tdpSource ? (f.tdpSource.value ? parseInt(f.tdpSource.value) : null) : null,
    uii: f.uii.value,
    cage_code: f.cageCode.value,
    iuid_compliant: parseInt(f.iuid.value),
  });
  f.wrap = wrap;
  return f;
}

/* ════════════════════════════════════════════════════════════════
   PROCEDURE FORM
════════════════════════════════════════════════════════════════ */
async function buildProcedureForm(data, fixedAssetId) {
  data = data||{};
  var [assets, users] = await Promise.all([getAssets(), getUsers()]);
  var wrap = div('ops-form-grid');
  function add(l,i,full,hint){ wrap.appendChild(fg(l,i,full,hint)); return i; }
  var f = {};
  f.name = add('Procedure Name *', inp('e.g., Quarterly Antenna Alignment Check', data.name), true);

  // Asset dropdown
  if (!fixedAssetId) {
    f.assetSel = assetDropdownSync(assets, data.asset_id||'');
    wrap.appendChild(fg('Linked Asset *', f.assetSel, false, 'Every PM procedure must link to a configuration asset'));
  }

  f.category = add('Category', sel([['Mechanical','Mechanical'],['Electrical','Electrical'],
    ['RF/Comms','RF/Comms'],['Structural','Structural'],['Cybersecurity','Cybersecurity'],
    ['Patching','Patching'],['User Management','User Management'],['Backup/DR','Backup/DR'],
    ['Environmental','Environmental'],['Other','Other']], data.category||'Mechanical'));

  // ── Trigger type ────────────────────────────────────────────────────────────
  f.triggerType = add('Trigger Type', sel([
    ['calendar','📅 Calendar Schedule'],
    ['meter','🔢 Meter-Based (odometer / hours / cycles)'],
    ['as_required','⚡ As Required / Condition-Based'],
  ], data.trigger_type||'calendar'));

  // Calendar scheduling fields (shown when trigger_type = calendar or meter)
  var calFields = div('ops-form-grid'); calFields.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px;';
  var periodSel = sel([['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],
    ['quarterly','Quarterly'],['semi_annual','Semi-Annual (6mo)'],['annual','Annual']], data.periodicity||'monthly');
  var lastDoneInp = inp('','','date');
  if (data.last_completed) lastDoneInp.value = data.last_completed;
  calFields.appendChild(fg('Periodicity', periodSel));
  calFields.appendChild(fg('Last Completed', lastDoneInp));
  f.period = periodSel; f.lastDone = lastDoneInp;
  wrap.appendChild(calFields);

  // Meter-based fields
  var meterFields = div('ops-form-grid'); meterFields.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:14px;margin-top:2px;';
  meterFields.appendChild(el('div',{style:'grid-column:1/-1;font-size:10px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;',text:'🔢 Meter Configuration'}));
  f.meterType = sel([
    ['odometer','Odometer'],['flight_hours','Flight Hours'],['engine_hours','Engine Hours'],
    ['operating_hours','Operating Hours'],['cycles','Cycles'],['custom','Custom'],
  ], data.meter_type||'odometer');
  f.meterUnit = inp('e.g., miles, km, hours, FH, cycles', data.meter_unit||'');
  f.meterInterval = inp('e.g., 3000', data.meter_interval||'','number');
  f.meterLastValue = inp('Current reading', data.meter_last_value||'','number');
  var meterNextDue = el('div',{style:'padding:8px 10px;background:#0f172a;border:1px solid #1e2540;border-radius:6px;font-size:12px;color:#64748b;',text:'—'});
  function refreshMeterNextDue() {
    var last = parseFloat(f.meterLastValue.value); var intv = parseFloat(f.meterInterval.value);
    var unit = f.meterUnit.value||'units';
    meterNextDue.textContent = (!isNaN(last)&&!isNaN(intv)) ? 'Due at: '+(last+intv).toLocaleString()+' '+unit : '—';
  }
  f.meterLastValue.oninput=refreshMeterNextDue; f.meterInterval.oninput=refreshMeterNextDue; f.meterUnit.oninput=refreshMeterNextDue;
  if (data.meter_last_value||data.meter_interval) refreshMeterNextDue();
  meterFields.appendChild(fg('Meter Type', f.meterType));
  meterFields.appendChild(fg('Unit', f.meterUnit));
  meterFields.appendChild(fg('Interval (every N units)', f.meterInterval));
  meterFields.appendChild(fg('Last Known Reading', f.meterLastValue));
  meterFields.appendChild(fg('Next Due At', meterNextDue));
  meterFields.appendChild(el('div',{style:'font-size:10px;color:#475569;align-self:flex-end;padding-bottom:6px;',text:'Meter check-in uses the periodicity above. Record reading on completion.'}));
  wrap.appendChild(meterFields);

  // As-required / condition-based fields
  var asrFields = div('ops-form-grid'); asrFields.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:14px;margin-top:2px;';
  asrFields.appendChild(el('div',{style:'grid-column:1/-1;font-size:10px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;',text:'⚡ Condition / Trigger Setup'}));
  f.triggerCondition = ta('e.g., Oil change triggered when odometer check shows ≥3,000 miles since last service', data.trigger_condition||'', 2);
  f.triggerSourceId = sel([['','— None (manual trigger only) —']], data.trigger_source_id||'');
  f.triggerThreshold = inp('e.g., 3000', data.trigger_threshold||'','number');
  // Populate trigger source dropdown with meter PMs for this asset (loaded async)
  (async function(){
    var assetIdForTrigger = fixedAssetId || (data.asset_id||null);
    if (!assetIdForTrigger) return;
    try {
      var meterPms = (await API.procedures.list({asset_id:assetIdForTrigger})).filter(function(p){ return p.trigger_type==='meter'; });
      meterPms.forEach(function(pm){
        var o = document.createElement('option');
        o.value = String(pm.id); o.text = pm.proc_id_label+' — '+pm.name+(pm.meter_unit?' ('+pm.meter_unit+')':'');
        if (String(pm.id)===String(data.trigger_source_id)) o.selected=true;
        f.triggerSourceId.appendChild(o);
      });
    } catch(e){}
  })();
  asrFields.appendChild(fg('Trigger Condition (description)', f.triggerCondition, true));
  asrFields.appendChild(fg('Linked Meter PM (auto-trigger source)', f.triggerSourceId));
  asrFields.appendChild(fg('Trigger Threshold (meter units)', f.triggerThreshold));
  asrFields.appendChild(el('div',{style:'font-size:10px;color:#475569;align-self:flex-end;padding-bottom:6px;',text:'When linked meter PM records a reading ≥ threshold, this PM is flagged due.'}));
  wrap.appendChild(asrFields);

  // Show/hide field groups based on trigger type
  function syncTriggerType() {
    var t = f.triggerType.value;
    calFields.style.display   = (t==='calendar'||t==='meter') ? '' : 'none';
    meterFields.style.display = (t==='meter') ? '' : 'none';
    asrFields.style.display   = (t==='as_required') ? '' : 'none';
    // Make periodicity label contextual
    var pLabel = calFields.querySelector('label');
    if (pLabel && t==='meter') pLabel.textContent='Check-in Periodicity';
    else if (pLabel) pLabel.textContent='Periodicity';
  }
  f.triggerType.onchange = syncTriggerType;
  syncTriggerType();

  f.assigned = add('Assign To', userDropdown(users, data.assigned_to||''));

  // SOP file picker
  var sopWrap = div('ops-form-group ops-form-full');
  sopWrap.appendChild(el('label',{cls:'ops-form-label',text:'SOP Document (PMS Procedures folder)'}));
  var sopRow = div('');
  sopRow.style.cssText='display:flex;gap:8px;align-items:center;';
  f.sopInput = inp('No file selected — click Browse to pick from PMS Procedures', data.document_ref||'');
  f.sopInput.style.flex='1';
  f.sopInput.readOnly=false; // allow manual path entry too
  var browseBtn = el('button',{style:'padding:7px 14px;border-radius:7px;border:1.5px solid #38bdf8;background:rgba(56,189,248,0.1);color:#38bdf8;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;',
    text:'📂 Browse',
    onclick:()=>showSopPicker((path,name)=>{ f.sopInput.value=path; })});
  sopRow.appendChild(f.sopInput); sopRow.appendChild(browseBtn);
  sopWrap.appendChild(sopRow);
  if(data.document_ref) {
    var viewLink=el('a',{href:'#',style:'font-size:11px;color:#38bdf8;margin-top:4px;display:block;',text:'↗ Open current SOP'});
    viewLink.onclick=e=>{e.preventDefault(); window.open('/apps/files/?dir='+encodeURIComponent(data.document_ref.replace(/\/[^/]+$/,'')), '_blank');};
    sopWrap.appendChild(viewLink);
  }
  wrap.appendChild(sopWrap);

  f.desc    = add('Description / Scope', ta('Tools required, safety considerations, pass/fail criteria…', data.description||'',3), true);
  f.hours   = add('Estimated Hours', inp('e.g., 2.5', String(data.est_hours||''),'number'));
  f.autoLog = add('Auto-create Deficiency if overdue?',
    sel([[0,'No — manual log only'],[1,'Yes — auto-log']], data.create_deficiency_on_fail||0));

  // S1000D DM linkage — 200/720/730 procedure DM for this PM
  var dmLinkWrap = div('ops-form-group ops-form-full');
  dmLinkWrap.appendChild(el('label',{cls:'ops-form-label',text:'S1000D Procedure DM (200 / 720 / 730)'}));
  var dmLinkRow = div(''); dmLinkRow.style.cssText='display:flex;gap:8px;align-items:center;';
  f._dmId = data.document_id || null;
  var dmLinkDisplay = el('span',{style:'flex:1;font-size:12px;color:#64748b;padding:7px 10px;background:#0f172a;border:1px solid #1e2540;border-radius:6px;',text:'No DM linked'});
  var dmLinkBtn = el('button',{style:'padding:7px 14px;border-radius:7px;border:1.5px solid #38bdf8;background:rgba(56,189,248,0.1);color:#38bdf8;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;',text:'🔗 Link DM'});
  var dmClearBtn = el('button',{style:'padding:7px 10px;border-radius:7px;border:1px solid #475569;background:transparent;color:#64748b;font-size:12px;cursor:pointer;',text:'✕'});
  function refreshDmDisplay(docId) {
    if (!docId) { dmLinkDisplay.textContent='No DM linked'; dmClearBtn.style.display='none'; return; }
    dmClearBtn.style.display='';
    API.documents.get(docId).then(dm=>{ dmLinkDisplay.textContent=(S1000D_IC_LABELS[dm.info_code]||dm.info_code)+' — '+dm.title+' ('+dm.doc_number+')'; }).catch(()=>{ dmLinkDisplay.textContent='DM #'+docId; });
  }
  var assetIdForDm = fixedAssetId || (data.asset_id || null);
  dmLinkBtn.onclick = ()=>showDmPicker('Link Procedure DM', assetIdForDm, ['200','720','730'], f._dmId, dm=>{ f._dmId=dm?dm.id:null; refreshDmDisplay(f._dmId); });
  dmClearBtn.onclick = ()=>{ f._dmId=null; refreshDmDisplay(null); };
  refreshDmDisplay(f._dmId);
  dmLinkRow.appendChild(dmLinkDisplay); dmLinkRow.appendChild(dmLinkBtn); dmLinkRow.appendChild(dmClearBtn);
  dmLinkWrap.appendChild(dmLinkRow);
  dmLinkWrap.appendChild(el('div',{text:'Optional — links this PM to the authoritative S1000D maintenance procedure DM.',style:'font-size:11px;color:#475569;margin-top:4px;'}));
  wrap.appendChild(dmLinkWrap);

  // T/S DM linkage — 520 Troubleshooting DM; auto-populates deficiency when PM logs an issue
  var tsLinkWrap = div('ops-form-group ops-form-full');
  tsLinkWrap.appendChild(el('label',{cls:'ops-form-label',text:'🔍 T/S Procedure DM (520 — Troubleshooting)'}));
  var tsLinkRow = div(''); tsLinkRow.style.cssText='display:flex;gap:8px;align-items:center;';
  f._tsDmId = data.ts_document_id || null;
  var tsLinkDisplay = el('span',{style:'flex:1;font-size:12px;color:#64748b;padding:7px 10px;background:#0f172a;border:1px solid #1e2540;border-radius:6px;',text:'No T/S DM linked'});
  var tsLinkBtn = el('button',{style:'padding:7px 14px;border-radius:7px;border:1.5px solid #fbbf24;background:rgba(251,191,36,0.08);color:#fbbf24;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;',text:'🔍 Link T/S DM'});
  var tsClearBtn = el('button',{style:'padding:7px 10px;border-radius:7px;border:1px solid #475569;background:transparent;color:#64748b;font-size:12px;cursor:pointer;',text:'✕'});
  function refreshTsDisplay(docId) {
    if (!docId) { tsLinkDisplay.textContent='No T/S DM linked'; tsClearBtn.style.display='none'; return; }
    tsClearBtn.style.display='';
    API.documents.get(docId).then(function(dm){ tsLinkDisplay.textContent='🔍 520 — '+dm.title+' ('+dm.doc_number+')'; }).catch(function(){ tsLinkDisplay.textContent='DM #'+docId; });
  }
  var assetIdForTs = fixedAssetId || (data.asset_id || null);
  tsLinkBtn.onclick = function(){ showDmPicker('Link T/S Procedure DM (520)', assetIdForTs, ['520'], f._tsDmId, function(dm){ f._tsDmId=dm?dm.id:null; refreshTsDisplay(f._tsDmId); }); };
  tsClearBtn.onclick = function(){ f._tsDmId=null; refreshTsDisplay(null); };
  refreshTsDisplay(f._tsDmId);
  tsLinkRow.appendChild(tsLinkDisplay); tsLinkRow.appendChild(tsLinkBtn); tsLinkRow.appendChild(tsClearBtn);
  tsLinkWrap.appendChild(tsLinkRow);
  tsLinkWrap.appendChild(el('div',{text:'When linked, completing this PM with an issue auto-populates the deficiency with this T/S procedure as the fault isolation reference.',style:'font-size:11px;color:#475569;margin-top:4px;'}));
  wrap.appendChild(tsLinkWrap);

  f.collect = () => {
    var t = f.triggerType.value;
    var base = {
      name:f.name.value,
      asset_id:fixedAssetId||(f.assetSel?parseInt(f.assetSel.value)||0:0),
      category:f.category.value,
      periodicity: (t==='calendar'||t==='meter') ? f.period.value : 'monthly',
      last_completed: (t==='calendar'||t==='meter') ? (f.lastDone.value||'') : '',
      assigned_to:f.assigned.value||'',
      document_ref:f.sopInput.value||'', description:f.desc.value||'',
      est_hours:parseFloat(f.hours.value)||0,
      create_deficiency_on_fail:parseInt(f.autoLog.value)||0,
      document_id:    f._dmId || null,
      ts_document_id: f._tsDmId || null,
      trigger_type: t,
    };
    if (t==='meter') {
      base.meter_type       = f.meterType.value||null;
      base.meter_unit       = f.meterUnit.value.trim()||null;
      base.meter_interval   = f.meterInterval.value!=='' ? parseFloat(f.meterInterval.value) : null;
      base.meter_last_value = f.meterLastValue.value!=='' ? parseFloat(f.meterLastValue.value) : null;
    }
    if (t==='as_required') {
      base.trigger_condition = f.triggerCondition.value.trim()||null;
      base.trigger_source_id = f.triggerSourceId.value ? parseInt(f.triggerSourceId.value) : null;
      base.trigger_threshold = f.triggerThreshold.value!=='' ? parseFloat(f.triggerThreshold.value) : null;
    }
    return base;
  };
  f.wrap = wrap;
  return f;
}

/* ════════════════════════════════════════════════════════════════
   DEFICIENCY FORM
════════════════════════════════════════════════════════════════ */
async function buildDeficiencyForm(data, fixedAssetId) {
  data = data||{};
  var [assets, users] = await Promise.all([getAssets(), getUsers()]);
  var wrap = div('ops-form-grid');
  function add(l,i,full){ wrap.appendChild(fg(l,i,full)); return i; }
  var f = {};
  f.summary  = add('Summary * (one line)', inp('e.g., Valve V-12 leaking hydraulic fluid', data.summary||''), true);
  if(!fixedAssetId) {
    f.assetSel = assetDropdownSync(assets, data.asset_id||'');
    wrap.appendChild(fg('Linked Asset *', f.assetSel));
  }
  f.severity  = add('Severity *', sel([['SEV-1','SEV-1 — Critical / Safety / Mission Impact'],
    ['SEV-2','SEV-2 — High / Significant Degradation'],['SEV-3','SEV-3 — Medium / Workaround Available'],
    ['SEV-4','SEV-4 — Low / Non-Urgent'],['SEV-5','SEV-5 — Informational']], data.severity||'SEV-3'));
  f.discovery = add('How Discovered', sel([['walkdown','Walkdown / Visual Inspection'],
    ['pm_procedure','PM Procedure'],['automated_alert','Automated Alert'],
    ['user_report','User Report'],['cve_scan','CVE / Vulnerability Scan'],
    ['incident_response','Incident Response']], data.discovery_method||'walkdown'));
  // Failure mode — static grouped list
  var fmOpts = [['','— Unknown / Unclassified —']];
  FM_CATEGORIES.forEach(function(cat){ (FM_SUBCATEGORIES[cat[0]]||[]).forEach(function(sub){ fmOpts.push([cat[0]+': '+sub, cat[1].replace(/^[^ ]+ /,'')+': '+sub]); }); });
  f.failureMode = add('Failure Mode', sel(fmOpts, data.failure_mode||''), false, 'Tag this deficiency to a failure mode for fleet trending.');
  f.assigned  = add('Assign To', userDropdown(users, data.assigned_to||''));
  f.reviewer  = add('Reviewer / Lead', userDropdown(users, data.reviewed_by||''));
  f.desc      = add('Description', ta('Condition description, location, symptoms, operational impact…', data.description||'',4), true);
  f.reqs      = add('Requirements to Resolve', ta('Parts needed, outside entities, access restrictions…', data.requirements_to_resolve||'',3), true);
  f.outside   = add('Outside Entity Required', inp('e.g., OEM Field Engineer, Certified Contractor', data.outside_entity_required||''), true);
  f.costParts = add('Est. Parts Cost ($)',   inp('0.00', String(data.est_parts_cost||''),'number'));
  f.costLabor = add('Est. Labor Cost ($)',   inp('0.00', String(data.est_labor_cost||''),'number'));
  f.mdInt     = add('Man-Days (Internal)',   inp('0.5',  String(data.man_days_internal||''),'number'));
  f.mdExt     = add('Man-Days (External)',   inp('0.0',  String(data.man_days_external||''),'number'));
  f.outage    = add('Scheduled Outage Hrs',  inp('0.0',  String(data.scheduled_outage_hours||''),'number'));
  f.target    = add('Target Completion',     inp('','','date'));
  if(data.target_completion) f.target.value=data.target_completion;
  f.procLink  = add('Linked PM Procedure ID (if found during PM)', inp('0', String(data.linked_procedure_id||''),'number'));

  f.collect = () => ({
    summary:f.summary.value,
    asset_id:fixedAssetId||(f.assetSel?parseInt(f.assetSel.value)||0:0),
    severity:f.severity.value, discovery_method:f.discovery.value,
    assigned_to:f.assigned.value||'', reviewed_by:f.reviewer.value||'',
    description:f.desc.value||'', requirements_to_resolve:f.reqs.value||'',
    outside_entity_required:f.outside.value||'',
    est_parts_cost:parseFloat(f.costParts.value)||0,
    est_labor_cost:parseFloat(f.costLabor.value)||0,
    man_days_internal:parseFloat(f.mdInt.value)||0,
    man_days_external:parseFloat(f.mdExt.value)||0,
    scheduled_outage_hours:parseFloat(f.outage.value)||0,
    target_completion:f.target.value||'',
    linked_procedure_id:parseInt(f.procLink.value)||0,
    failure_mode:       f.failureMode?.value || null,
  });
  f.wrap = wrap;
  return f;
}

/* ════════════════════════════════════════════════════════════════
   VIEWS
════════════════════════════════════════════════════════════════ */

/* ── Dashboard ── */
async function viewDashboard(initialTab) {
  var wrap = div('');
  var hdr  = div('ops-page-header',[el('h2',{text:'Dashboard'})]);

  // Shared platform selector
  var platforms = await API.platforms.list().catch(()=>[]);
  if (platforms.length > 0) {
    var platWrap = div('');
    platWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;';
    platWrap.appendChild(el('label',{text:'Platform:',style:'font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.7px;white-space:nowrap;'}));
    var platDrop = el('select',{cls:'ops-select ops-select-sm'});
    platDrop.style.cssText = 'min-width:180px;';
    platDrop.appendChild(el('option',{value:'',text:'All Platforms'}));
    platforms.forEach(function(p){
      var o = el('option',{value:String(p.id),text:p.name});
      if (_selectedPlatformIds.length===1 && _selectedPlatformIds[0]===p.id) o.selected=true;
      platDrop.appendChild(o);
    });
    platDrop.addEventListener('change',function(){
      _selectedPlatformIds = platDrop.value ? [parseInt(platDrop.value)] : [];
      renderTab();
    });
    platWrap.appendChild(platDrop);
    hdr.appendChild(platWrap);
  }

  wrap.appendChild(hdr);

  // Tabs
  var activeTab = initialTab || 'overview';
  var tabDefs = [['overview','📊 Overview'],['readiness','🩺 Readiness Report']];
  var tabs = div('ops-tabs');
  tabDefs.forEach(function(td){
    var t = el('button',{cls:'ops-tab'+(td[0]===activeTab?' active':''),text:td[1]});
    t.onclick = function(){
      activeTab = td[0];
      tabs.querySelectorAll('.ops-tab').forEach(function(x){ x.classList.remove('active'); });
      t.classList.add('active');
      renderTab();
    };
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);

  var body = div(''); wrap.appendChild(body);
  setContent(wrap);

  async function renderTab() {
    body.innerHTML = '';
    body.appendChild(el('div',{cls:'ops-empty',text:'Loading…'}));
    if (activeTab === 'overview') {
      await renderOverview();
    } else {
      await renderReadiness();
    }
  }

  async function renderOverview() {
    body.innerHTML = '';
    var stats;
    try { stats = await API.dashboard.stats(_selectedPlatformIds); }
    catch(e) { body.innerHTML=''; body.appendChild(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return; }

    var a=stats.assets||{},pr=stats.procedures||{},df=stats.deficiencies||{},sev=df.bySeverity||{};
    var grid=div('stats-grid');
    [[a.total||0,'Total Assets',(a.byType?.hardware||0)+' HW · '+(a.byType?.software||0)+' SW · '+(a.byType?.firmware||0)+' FW','stat-teal'],
     [pr.dueSoon||0,'PM Due This Week','Procedures coming up','stat-blue'],
     [pr.overdue||0,'PM Overdue',(pr.completed30d||0)+' completed in last 30d','stat-orange'],
     [df.open||0,'Open Deficiencies','SEV-1: '+(sev['SEV-1']||0)+' · SEV-2: '+(sev['SEV-2']||0),'stat-red'],
    ].forEach(function(row){
      var c=div('stat-card '+row[3]);
      c.appendChild(el('div',{cls:'stat-label',text:row[1]}));
      c.appendChild(el('div',{cls:'stat-value',text:String(row[0])}));
      c.appendChild(el('div',{cls:'stat-sub',  text:row[2]}));
      grid.appendChild(c);
    });
    body.appendChild(grid);

    var two=div('ops-two-col');
    var pmC=div('ops-card');
    pmC.appendChild(div('ops-card-header',[el('h3',{text:'⚠ Overdue PM'}),btn('','View All →',()=>navigate('pm-procedures'))]));
    pmC.appendChild(makeTable(['Procedure','Asset','Overdue By','Assigned'],
      (stats.overdue_list||[]).map(function(p){ return [el('strong',{text:p.name}),span('ops-link-chip','#'+p.asset_id),
        span('ops-badge badge-red',overdueDays(p.next_due)+'d'),p.assigned_to||span('ops-danger ops-small','Unassigned')]; }),
      function(){ navigate('pm-procedures'); }));
    two.appendChild(pmC);

    var defC=div('ops-card');
    defC.appendChild(div('ops-card-header',[el('h3',{text:'Critical Deficiencies'}),btn('','View All →',()=>navigate('deficiencies'))]));
    var cd=stats.critical_defs||[];
    defC.appendChild(makeTable(['ID','Summary','SEV','Status'],
      cd.map(function(d){ return [span('ops-muted',d.def_id_label),el('strong',{text:d.summary}),sevBadge(d.severity),statusBadge(d.status)]; }),
      function(i){ if(cd[i]) navigate('def-detail',cd[i].id); }));
    two.appendChild(defC);
    body.appendChild(two);
  }

  async function renderReadiness() {
    body.innerHTML = '';
    var platformId = _selectedPlatformIds.length === 1 ? _selectedPlatformIds[0] : null;
    var r;
    try { r = await API.healthReport.generate(platformId ? {platform_id: platformId} : {}); }
    catch(e) { body.appendChild(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return; }
    // Reuse the health report rendering helper
    renderHealthReportBody(body, r);
  }

  await renderTab();
}

/* ── Asset List ── */
async function viewAssets() {
  var wrap=div(''); setContent(wrap);
  var hdr=div('ops-page-header',[el('h2',{text:'Configuration Registry'})]);
  var searchEl=el('input',{cls:'ops-input',placeholder:'Search…',style:'width:180px'});
  hdr.appendChild(searchEl);
  var newBtn=btn('primary','+ New Asset',async()=>{
    var f=await buildAssetForm({});
    modal('Register New Asset',f.wrap,async()=>{
      var d=f.collect(); if(!d.name.trim()) throw new Error('Asset name required.');
      await API.assets.create(d); clearCache('assets'); load();
    },'Register Asset');
  });
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  var tabs=div('ops-tabs'); var activeType='';
  [['','All'],['hardware','HW'],['software','SW'],['firmware','FW']].forEach(td=>{
    var t=el('button',{cls:'ops-tab'+(td[0]===activeType?' active':''),text:td[1]});
    t.onclick=()=>{ activeType=td[0]; tabs.querySelectorAll('.ops-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); load(); };
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);
  var cardEl=div('ops-card'); wrap.appendChild(cardEl);
  var assets=[];

  async function load(){
    cardEl.innerHTML=''; cardEl.appendChild(span('ops-muted','  Loading…'));
    try{ var ap=activeType?{type:activeType}:{}; if(_selectedPlatformIds.length) ap.platform_ids=_selectedPlatformIds.join(','); assets=await API.assets.list(ap); clearCache('assets'); _cache.assets=assets; }
    catch(e){ cardEl.innerHTML='<div class="ops-empty" style="color:#f87171">⚠ '+e.message+'</div>'; return; }
    var search=(searchEl.value||'').toLowerCase();
    var filtered=search?assets.filter(a=>(a.name+a.manufacturer+a.model+a.location).toLowerCase().includes(search)):assets;
    cardEl.innerHTML='';
    cardEl.appendChild(makeTable(
      ['Code','Name','Type','Criticality','Manufacturer / Model','Location','Status',''],
      filtered.map(a=>{
        var codeEl = a.asset_code ? span('ops-mono',a.asset_code) : span('ops-muted',a.asset_id_label);
        var critEl = critBadge(a.criticality_code) || span('ops-muted','—');
        return [codeEl,el('strong',{text:a.name}),typeBadge(a.asset_type),critEl,
          (a.manufacturer?a.manufacturer+' ':'')+a.model,a.location||'—',
          assetStatusBadge(a),editAssetBtn(a)];
      }),
      i=>{ if(filtered[i]) navigate('asset-detail',filtered[i].id); }
    ));
  }

  function editAssetBtn(a) {
    var b=el('button',{cls:'ops-btn ops-btn-sm',text:'Edit',style:'flex-shrink:0;'});
    b.onclick=async e=>{ e.stopPropagation();
      var f=await buildAssetForm(a);
      modal('Edit Asset — '+a.asset_id_label,f.wrap,async()=>{
        await API.assets.update(a.id,f.collect()); clearCache('assets'); load();
      },'Save Changes');
    };
    return b;
  }

  var debounce; searchEl.addEventListener('input',()=>{ clearTimeout(debounce); debounce=setTimeout(load,300); });
  await load();
}

/* ── Asset Detail ── */
async function viewAssetDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading asset…'}));
  var [asset,users,procs,defs] = await Promise.all([
    API.assets.get(id), getUsers(),
    API.procedures.list({asset_id:id}),
    API.deficiencies.list({asset_id:id,status:'open_all'})
  ]).catch(e=>{ setContent(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return []; });
  if(!asset) return;

  var wrap=div('');
  var hdr=div('ops-page-header');
  hdr.appendChild(btn('','← Assets',()=>navigate('assets')));
  hdr.appendChild(el('h2',{text:asset.asset_id_label+' — '+asset.name}));
  hdr.appendChild(assetStatusBadge(asset));
  var editBtn=btn('','✏ Edit Asset',async()=>{
    var f=await buildAssetForm(asset);
    modal('Edit Asset — '+asset.asset_id_label,f.wrap,async()=>{
      await API.assets.update(id,f.collect()); clearCache('assets'); viewAssetDetail(id);
    },'Save Changes');
  });
  var logDefBtn=btn('','+ Log Deficiency',async()=>{
    var f=await buildDeficiencyForm({},asset.id);
    modal('Log New Deficiency',f.wrap,async()=>{
      var d=f.collect(); if(!d.summary.trim()) throw new Error('Summary required.');
      await API.deficiencies.create(d); navigate('asset-detail',id);
    },'Log Deficiency');
  });
  var addPmBtn=btn('primary','+ PM Procedure',async()=>{
    var f=await buildProcedureForm({},asset.id);
    modal('Add PM Procedure',f.wrap,async()=>{
      var d=f.collect(); if(!d.name.trim()) throw new Error('Name required.');
      await API.procedures.create(d); navigate('asset-detail',id);
    },'Create Procedure');
  });
  var modBtn = btn('', '🔧 Create Modernization', () => {
    showModernizationForm(null, () => navigate('modernizations'), {
      title: 'Modernization — ' + asset.name,
      asset_ids: JSON.stringify([asset.id]),
      platform_id: asset.platform_id,
    });
  });
  var verifyBtn = btn('success', '✓ Verify Asset', async () => {
    if (!confirm('Mark this asset as verified today?')) return;
    await API.assets.update(id, {verify: 1});
    viewAssetDetail(id);
  });
  hdr.appendChild(editBtn); hdr.appendChild(logDefBtn); hdr.appendChild(addPmBtn); hdr.appendChild(modBtn); hdr.appendChild(verifyBtn);
  wrap.appendChild(hdr);

  var two=div('ops-two-col');
  var left=div('');
  // Asset details card
  var dc=div('ops-card ops-detail-card');
  dc.appendChild(div('ops-section-label',[document.createTextNode('Asset Information')]));
  var kvg=div('ops-kv-grid');
  var fields=[['Asset ID',span('ops-mono',asset.asset_id_label)],['Type',typeBadge(asset.asset_type)],
    ['Manufacturer',asset.manufacturer||'—'],['Model',asset.model||'—'],
    ['Serial #',span('ops-mono',asset.serial_number||'—')],['Version',span('ops-mono',asset.version||'—')],
    ['Location',asset.location||'—'],['IP Address',span('ops-mono',asset.ip_address||'—')],
    ['Install Date',fmtDate(asset.install_date)],
    ['Last Verified', (()=>{
      if (!asset.last_verified_at) return span('ops-danger', 'Never verified');
      var daysAgo = Math.floor((new Date() - new Date(asset.last_verified_at)) / 86400000);
      var overdue = daysAgo > 548;
      var txt = asset.last_verified_at.slice(0,10) + ' by ' + (asset.verified_by||'unknown') + ' (' + daysAgo + 'd ago)';
      return span(overdue ? 'ops-danger' : 'ops-success', txt + (overdue ? ' ⚠ OVERDUE' : ' ✓'));
    })()],
    ['UII', asset.uii ? span('ops-mono ops-small', asset.uii) : span('ops-muted','—')],
    ['IUID Compliant', asset.iuid_compliant ? span('ops-success','✓ Yes') : span('ops-muted','No')],
    ['CAGE Code', asset.cage_code || span('ops-muted','—')],
    ['Warranty Exp',(()=>{ if(!asset.warranty_expiry) return '—';
      var exp=new Date(asset.warranty_expiry)<new Date();
      return span(exp?'ops-danger':'',fmtDate(asset.warranty_expiry)+(exp?' (expired)':'')); })()]];
  fields.forEach(row=>{
    var kv=div('ops-kv'); kv.appendChild(span('ops-kv-key',row[0]));
    if(typeof row[1]==='string') kv.appendChild(span('',row[1])); else kv.appendChild(row[1]);
    kvg.appendChild(kv);
  });
  dc.appendChild(kvg);
  if(asset.linked_assets){
    var ll=div('ops-section-label',[document.createTextNode('Linked Assets')]); ll.style.marginTop='14px'; dc.appendChild(ll);
    var lw=div('ops-tags');
    asset.linked_assets.split(',').map(s=>s.trim()).filter(Boolean).forEach(lid=>{
      var chip=span('ops-link-chip','⬡ '+lid);
      chip.onclick=()=>navigate('asset-detail',parseInt(lid));
      lw.appendChild(chip);
    });
    dc.appendChild(lw);
  }
  if(asset.tags){ var tl=div('ops-section-label',[document.createTextNode('Tags')]); tl.style.marginTop='14px'; dc.appendChild(tl);
    var tw=div('ops-tags'); asset.tags.split(',').map(s=>s.trim()).filter(Boolean).forEach(t=>tw.appendChild(span('ops-tag',t))); dc.appendChild(tw); }
  if(asset.notes){ var nl=div('ops-section-label',[document.createTextNode('Notes')]); nl.style.marginTop='14px'; dc.appendChild(nl); dc.appendChild(el('p',{cls:'ops-notes',text:asset.notes})); }
  left.appendChild(dc);

  // PM table
  var pmC=div('ops-card'); pmC.style.marginTop='16px';
  pmC.appendChild(div('ops-card-header',[el('h3',{text:'Linked PM Procedures ('+procs.length+')'})]));
  pmC.appendChild(makeTable(['Procedure','Periodicity','Last Done','Next Due','SOP','Assigned'],
    procs.map(p=>[el('strong',{text:p.name}),p.periodicity,span('ops-muted',fmtDate(p.last_completed)),
      dueBadge(p.next_due),
      p.document_ref?sopLink(p.document_ref):span('ops-muted','—'),
      p.assigned_to||'—']),
    ()=>navigate('pm-procedures')));
  left.appendChild(pmC);
  two.appendChild(left);

  // Deficiencies
  var right=div('');
  var defC=div('ops-card');
  defC.appendChild(div('ops-card-header',[el('h3',{text:'Open Deficiencies ('+defs.length+')'})]));
  defC.appendChild(makeTable(['ID','Summary','SEV','Status'],
    defs.map(d=>[span('ops-muted',d.def_id_label),el('strong',{text:d.summary}),sevBadge(d.severity),statusBadge(d.status)]),
    i=>{ if(defs[i]) navigate('def-detail',defs[i].id); }));
  right.appendChild(defC);

  // Documents card — grouped by type, including inherited TDP source docs
  var docCard = div('ops-card'); docCard.style.marginTop = '16px';
  var docHdr = div('ops-card-header');
  docHdr.appendChild(el('h3', {text: '📄 Technical Document Package'}));
  var addDocBtn = btn('ops-btn-sm', '+ New Document', () => showDocumentForm(null, id, () => navigate('asset-detail', id)));
  docHdr.appendChild(addDocBtn);
  docCard.appendChild(docHdr);

  var DOC_CAT_ICONS   = {drawing:'📐',tech_manual:'📖',spec:'📋',sop:'🔧',test_plan:'🧪',training:'🎓',other:'📄'};
  var DOC_CAT_LABELS  = {drawing:'Drawings',tech_manual:'Tech Manuals',spec:'Specifications',sop:'SOPs',test_plan:'Test Plans',training:'Training',other:'Other'};
  var DOC_CAT_ORDER   = ['drawing','tech_manual','spec','sop','test_plan','training','other'];

  // Fetch direct docs + inherited docs from tdp_source_asset if set
  var docFetches = [API.documents.list({asset_id: id})];
  var tdpSourceId = asset.tdp_source_asset_id || null;
  if (tdpSourceId && tdpSourceId !== id) docFetches.push(API.documents.list({asset_id: tdpSourceId}));
  var docResults = await Promise.all(docFetches.map(p => p.catch(() => [])));
  var ownDocs       = docResults[0] || [];
  var inheritedDocs = (docResults[1] || []).filter(function(d){ return !ownDocs.find(function(o){ return o.id===d.id; }); });

  // Show inherited-TDP banner if applicable
  if (tdpSourceId && tdpSourceId !== id) {
    var srcAsset = await API.assets.get(tdpSourceId).catch(()=>null);
    var banner = div('');
    banner.style.cssText = 'padding:7px 16px;background:#1a2538;border-top:1px solid #2e3650;font-size:11px;color:#7dd3fc;';
    banner.textContent = '📎 Inherited TDP from: ' + (srcAsset ? (srcAsset.asset_id_label + ' — ' + srcAsset.name) : 'Asset #' + tdpSourceId);
    docCard.appendChild(banner);
  }

  var allDocs = ownDocs.concat(inheritedDocs);
  var byCategory = {};
  allDocs.forEach(function(d){ var c = d.category||'other'; if(!byCategory[c]) byCategory[c]=[]; byCategory[c].push(d); });

  DOC_CAT_ORDER.forEach(function(cat) {
    var docs = byCategory[cat] || [];
    var secHdr = div('');
    secHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#0f172a;border-top:1px solid #2e3650;cursor:pointer;user-select:none;';
    var secLabel = el('span',{text:(DOC_CAT_ICONS[cat]||'📄')+' '+(DOC_CAT_LABELS[cat]||cat),style:'color:#e2e8f0;font-weight:600;font-size:13px;'});
    var secCount = el('span',{text: docs.length ? docs.length+' doc'+(docs.length!==1?'s':'') : 'empty',style:'color:#64748b;font-size:11px;'});
    secHdr.appendChild(secLabel); secHdr.appendChild(secCount);
    docCard.appendChild(secHdr);

    if (!docs.length) {
      var emptyRow = div('');
      emptyRow.style.cssText = 'padding:6px 16px 10px 32px;font-size:12px;color:#475569;border-bottom:1px solid #1a2035;';
      emptyRow.textContent = 'No ' + (DOC_CAT_LABELS[cat]||cat).toLowerCase() + ' attached.';
      docCard.appendChild(emptyRow);
      return;
    }

    docs.forEach(function(d) {
      var isInherited = inheritedDocs.indexOf(d) !== -1;
      var drow = div('');
      drow.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid #1e2540;cursor:pointer;'+(isInherited?'background:#141c2e;':'');
      drow.addEventListener('mouseenter',function(){ drow.style.background='#2d3548'; });
      drow.addEventListener('mouseleave',function(){ drow.style.background=isInherited?'#141c2e':''; });
      drow.onclick = function(){ navigate('doc-detail', d.id); };
      var info = div(''); info.style.cssText = 'flex:1;min-width:0;';
      info.appendChild(el('span',{text:d.title,style:'color:#e2e8f0;font-size:13px;font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}));
      var meta = d.doc_number + (d.current_rev ? ' · Rev ' + d.current_rev : '') + (isInherited ? ' · inherited' : '');
      info.appendChild(el('span',{text:meta,style:'color:#64748b;font-size:11px;'}));
      drow.appendChild(info);
      drow.appendChild(docStatusBadge(d.status));
      docCard.appendChild(drow);
    });
  });
  right.appendChild(docCard);
  two.appendChild(right);
  wrap.appendChild(two);

  // ── Hierarchy & Criticality card ──────────────────────────────
  var CRIT_COLORS = {CR:'badge-red',DE:'badge-orange',RD:'badge-blue',SP:'badge-gray',AD:'badge-gray'};
  var CRIT_LABELS = {CR:'Critical',DE:'Degraded',RD:'Redundant',SP:'Support',AD:'Administrative'};
  if (asset.asset_code || asset.criticality_code || asset.parent_id || asset.depth > 0) {
    var hierCard = div('ops-card'); wrap.appendChild(hierCard);
    hierCard.appendChild(div('ops-card-header', [el('h3', {text:'⬡ Asset Hierarchy & Criticality'})]));
    var hg = div('ops-kv-grid'); hierCard.appendChild(hg);
    function hkv(l,v){ var g=div('');g.appendChild(el('dt',{cls:'ops-kv-label',text:l}));var dd=el('dd',{cls:'ops-kv-value'});if(typeof v==='string')dd.textContent=v;else dd.appendChild(v);hg.appendChild(g.appendChild(dd)&&g); }
    if (asset.asset_code)      hkv('Asset Code',    span('ops-mono', asset.asset_code));
    if (asset.display_id)      hkv('Display ID',    span('ops-mono', asset.display_id));
    hkv('Hierarchy Depth',     asset.depth > 0 ? 'Depth '+asset.depth : 'System Node (Root)');
    if (asset.system_position) hkv('Position Code', span('ops-mono', asset.system_position));
    if (asset.hierarchy_path)  hkv('Path',          span('ops-mono ops-small', asset.hierarchy_path));
    if (asset.is_system_node)  hkv('System Node',   span('ops-badge badge-blue', '✓ System Root'));
    if (asset.criticality_code) {
      var cc = asset.criticality_code;
      hkv('Criticality', span('ops-badge '+(CRIT_COLORS[cc]||'badge-gray'), cc+' — '+(CRIT_LABELS[cc]||cc)));
    }
    if (asset.bypass_possible) {
      hkv('Bypass', span('ops-badge badge-orange', '⚡ Bypass Available'));
      if (asset.bypass_method) hkv('Bypass Method', asset.bypass_method);
      if (asset.degraded_capability != null) hkv('Degraded Capability', asset.degraded_capability + '% when bypassed');
    }
    if (asset.redundancy_type) {
      hkv('Redundancy Type', asset.redundancy_type);
      if (asset.failover_asset_id) hkv('Failover Asset', 'Asset #'+asset.failover_asset_id);
      if (asset.failover_time_mins) hkv('Failover Time', asset.failover_time_mins+' min');
    }
    if (asset.sync_status && asset.sync_status !== 'confirmed') {
      hkv('Sync Status', span('ops-badge badge-orange', asset.sync_status));
    }
  }

  // ── S1000D Data Modules ───────────────────────────────────────
  var dmCard = div('ops-card'); wrap.appendChild(dmCard);
  var dmCardHdr = div('ops-card-header');
  dmCardHdr.appendChild(el('h3',{text:'📘 S1000D Data Modules'}));
  dmCardHdr.appendChild(btn('ops-btn-sm','+ New DM', ()=>showDocumentForm(null, id, ()=>navigate('asset-detail',id), 'data_module')));
  dmCard.appendChild(dmCardHdr);

  var S1000D_DM_SECTIONS = [
    {codes:['040'], icon:'📘', label:'Description & Operation',   color:'#38bdf8', hint:'System description, tech characteristics, theory of operation'},
    {codes:['200','720','730'], icon:'🔧', label:'Maintenance Procedures', color:'#4ade80', hint:'Maintenance, removal, and installation procedures (links to PM)'},
    {codes:['300'], icon:'📦', label:'Illustrated Parts Data',    color:'#fb923c', hint:'Parts list with NSN, part numbers, and quantities'},
    {codes:['520'], icon:'🔍', label:'Troubleshooting',          color:'#fbbf24', hint:'Fault isolation procedures (links to Deficiencies)'},
    {codes:['900'], icon:'⚡', label:'Fault Description',        color:'#a78bfa', hint:'Fault reference data (links to FMEA)'},
  ];

  (async () => {
    var assetDms = (await API.documents.list({asset_id: id}).catch(()=>[])).filter(d=>d.doc_type==='data_module');
    S1000D_DM_SECTIONS.forEach(sec => {
      var secDms = assetDms.filter(d=>sec.codes.includes(d.info_code));
      var secDiv = div(''); secDiv.style.cssText='border-top:1px solid #1e2540;';

      var secHdr = div(''); secHdr.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 16px;';
      secHdr.appendChild(el('span',{text:sec.icon+' '+sec.label, style:'font-size:12px;font-weight:700;color:'+sec.color+';flex:1;'}));
      secHdr.appendChild(el('span',{text:sec.hint, style:'font-size:11px;color:#475569;'}));
      if (secDms.length) secHdr.appendChild(span('ops-badge badge-blue', String(secDms.length)));
      secDiv.appendChild(secHdr);

      if (secDms.length) {
        secDms.forEach(dm=>{
          var row = div(''); row.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 16px 6px 32px;cursor:pointer;border-top:1px solid #0f172a;';
          row.appendChild(el('span',{text:S1000D_IC_LABELS[dm.info_code]||dm.info_code, style:'font-size:10px;color:'+sec.color+';font-weight:700;min-width:100px;'}));
          row.appendChild(el('span',{text:dm.title, style:'font-size:12px;color:#e2e8f0;flex:1;'}));
          row.appendChild(el('span',{text:dm.dmc||dm.doc_number, style:'font-family:monospace;font-size:10px;color:#475569;'}));
          row.appendChild(span('ops-badge '+(dm.in_work_number>0?'badge-orange':'badge-green'), dm.in_work_number>0?'In-Work':'Released'));
          row.onclick = ()=>navigate('doc-detail', dm.id);
          secDiv.appendChild(row);
        });
      }
      dmCard.appendChild(secDiv);
    });
    if (!assetDms.length) {
      dmCard.appendChild(el('div',{text:'No Data Modules yet. Click "+ New DM" to author S1000D technical documentation for this asset.',style:'color:#475569;font-size:12px;padding:12px 16px;'}));
    }
  })();

  // ── Photo Gallery ─────────────────────────────────────────────
  var photoCard = div('ops-card'); wrap.appendChild(photoCard);
  var photoHdr = div('ops-card-header');
  photoHdr.appendChild(el('h3', {text:'📷 Photo Gallery'}));
  photoHdr.appendChild(btn('ops-btn-sm', '+ Add Photo', () => showAddPhotoForm(id, () => refreshPhotoGallery())));
  photoCard.appendChild(photoHdr);
  var photoBody = div(''); photoCard.appendChild(photoBody);

  async function refreshPhotoGallery() {
    photoBody.innerHTML = '';
    var photos = await API.photos.list(id).catch(() => []);
    if (!photos.length) {
      photoBody.appendChild(el('p', {cls:'ops-empty', text:'No photos yet. Add installation, condition, or deficiency photos.'}));
      return;
    }
    var PHOTO_TYPE_LABELS = {install:'Install',condition:'Condition',deficiency:'Deficiency',pre_maint:'Pre-Maintenance',post_maint:'Post-Maintenance',scan:'Scan Source',damage:'Damage'};
    var PHOTO_TYPE_COLORS = {install:'badge-green',condition:'badge-blue',deficiency:'badge-red',pre_maint:'badge-orange',post_maint:'badge-green',scan:'badge-gray',damage:'badge-red'};
    var grid = div(''); grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;padding:8px 0;';
    photos.forEach(ph => {
      var tile = div(''); tile.style.cssText = 'background:#1a1f2e;border-radius:10px;overflow:hidden;border:1px solid #2e3650;cursor:pointer;';
      // Preview — use serve endpoint; if no thumbnail, show icon placeholder
      var imgSrc = ph.file_path ? '/apps/ops_suite/api/files/serve?path='+encodeURIComponent(ph.file_path) : null;
      var preview = div(''); preview.style.cssText = 'width:100%;height:110px;background:#0f172a;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;';
      if (imgSrc) {
        var img = el('img', {style:'width:100%;height:110px;object-fit:cover;'});
        img.src = imgSrc;
        img.onerror = () => { img.remove(); preview.textContent = '📷'; };
        preview.appendChild(img);
      } else {
        preview.textContent = '📷';
      }
      var info = div(''); info.style.cssText = 'padding:8px;';
      info.appendChild(span('ops-badge '+(PHOTO_TYPE_COLORS[ph.photo_type]||'badge-gray'), PHOTO_TYPE_LABELS[ph.photo_type]||ph.photo_type));
      if (ph.is_primary) info.appendChild(span('ops-badge badge-green', '★ Primary'));
      if (ph.caption) { var cap = el('p', {style:'font-size:11px;color:#94a3b8;margin:4px 0 0;', text:ph.caption}); info.appendChild(cap); }
      var acts = div(''); acts.style.cssText = 'display:flex;gap:4px;margin-top:6px;';
      if (!ph.is_primary) acts.appendChild(btn('ops-btn-sm', '★ Set Primary', async () => { await API.photos.update(id, ph.id, {is_primary:1}); refreshPhotoGallery(); }));
      acts.appendChild(btn('ops-btn-sm ops-btn-danger', '✕', async () => { if(confirm('Delete photo?')) { await API.photos.destroy(id, ph.id); refreshPhotoGallery(); } }));
      info.appendChild(acts);
      tile.appendChild(preview); tile.appendChild(info);
      tile.onclick = e => { if(e.target.tagName==='BUTTON') return; showPhotoViewer(ph); };
      grid.appendChild(tile);
    });
    photoBody.appendChild(grid);
  }
  await refreshPhotoGallery();

  // ── 3D Models ────────────────────────────────────────────────
  var modelCard = div('ops-card'); wrap.appendChild(modelCard);
  var modelHdr = div('ops-card-header');
  modelHdr.appendChild(el('h3', {text:'🧊 3D Models'}));
  modelHdr.appendChild(btn('ops-btn-sm', '+ Link Model', () => showAddModelForm(id, () => refreshModels())));
  modelCard.appendChild(modelHdr);
  var modelBody = div(''); modelCard.appendChild(modelBody);

  async function refreshModels() {
    modelBody.innerHTML = '';
    var models = await API.models.list(id).catch(() => []);
    if (!models.length) {
      modelBody.appendChild(el('p', {cls:'ops-empty', text:'No 3D models linked. Link a GLTF/GLB file from the Nextcloud file picker.'}));
      return;
    }
    var FMT_COLORS = {GLTF:'badge-green',GLB:'badge-green',STEP:'badge-blue',OBJ:'badge-blue',FBX:'badge-orange',STL:'badge-gray',PLY:'badge-gray'};
    var STATUS_COLORS = {ready:'badge-green',pending:'badge-orange',processing:'badge-blue',failed:'badge-red'};
    models.forEach(m => {
      var mRow = div('ops-card'); mRow.style.cssText = 'margin:8px 0;border:1px solid #2e3650;';
      var mHdr2 = div(''); mHdr2.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;';
      mHdr2.appendChild(el('span', {style:'font-size:22px;', text:'🧊'}));
      var mInfo = div(''); mInfo.style.cssText = 'flex:1;';
      mInfo.appendChild(el('div', {style:'font-weight:700;font-size:13px;color:#e2e8f0;', text: m.description || 'Model #'+m.id}));
      var badges = div(''); badges.style.cssText = 'display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;';
      badges.appendChild(span('ops-badge '+(FMT_COLORS[m.source_format]||'badge-gray'), m.source_format));
      badges.appendChild(span('ops-badge '+(STATUS_COLORS[m.conversion_status]||'badge-gray'), m.conversion_status));
      badges.appendChild(span('ops-badge badge-gray', 'v'+(m.model_version||'1.0')));
      if (m.hotspots?.length) badges.appendChild(span('ops-badge badge-blue', m.hotspots.length+' hotspot'+(m.hotspots.length>1?'s':'')));
      mInfo.appendChild(badges);
      mHdr2.appendChild(mInfo);
      var mActs = div(''); mActs.style.cssText = 'display:flex;gap:6px;';
      if (m.conversion_status === 'ready') {
        mActs.appendChild(btn('ops-btn-sm', '▶ View 3D', () => open3DViewer(m, asset)));
        mActs.appendChild(btn('ops-btn-sm', '+ Hotspot', () => showAddHotspotForm(id, m, () => refreshModels())));
      }
      mActs.appendChild(btn('ops-btn-sm ops-btn-danger', '✕ Remove', async () => {
        if (!confirm('Remove this 3D model?')) return;
        await API.models.destroy(id, m.id); refreshModels();
      }));
      mHdr2.appendChild(mActs);
      mRow.appendChild(mHdr2);
      // Hotspot list
      if (m.hotspots?.length) {
        var hsList = div(''); hsList.style.cssText = 'padding:0 14px 10px;';
        m.hotspots.forEach(h => {
          var hsRow = div(''); hsRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px solid #1e2540;font-size:12px;';
          var dot = div(''); dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:'+(h.hotspot_color||'#38bdf8')+';flex-shrink:0;';
          hsRow.appendChild(dot);
          hsRow.appendChild(el('span', {style:'flex:1;color:#e2e8f0;', text: h.label}));
          if (h.linked_type) hsRow.appendChild(span('ops-badge badge-gray', h.linked_type+' #'+h.linked_id));
          hsRow.appendChild(el('span', {style:'color:#64748b;', text:'('+[h.position_x,h.position_y,h.position_z].map(v=>Number(v).toFixed(2)).join(', ')+')'}));
          hsRow.appendChild(btn('ops-btn-sm ops-btn-danger', '✕', async () => { await API.models.deleteHotspot(id,m.id,h.id); refreshModels(); }));
          hsList.appendChild(hsRow);
        });
        mRow.appendChild(hsList);
      }
      modelBody.appendChild(mRow);
    });
  }
  await refreshModels();

  // ── QR Code & Label ──────────────────────────────────────────
  var qrCard = div('ops-card'); wrap.appendChild(qrCard);
  var qrHdr = div('ops-card-header');
  qrHdr.appendChild(el('h3', {text:'🔲 QR Code & Label'}));
  var printLabelBtn = btn('ops-btn-sm', '🖨 Print Label', function() { printAssetLabel(asset); });
  qrHdr.appendChild(printLabelBtn);
  qrCard.appendChild(qrHdr);
  var qrBody = div(''); qrBody.style.cssText = 'display:flex;align-items:flex-start;gap:24px;padding:16px;flex-wrap:wrap;';
  var qrTarget = div(''); qrTarget.style.cssText = 'background:#fff;padding:8px;border-radius:8px;flex-shrink:0;';
  var qrUrl = window.location.origin + window.location.pathname.replace(/\/index\.php.*/,'') + '/index.php/apps/ops_suite#asset-detail/' + id;
  makeQRCanvas(qrUrl, 160, function(canvas) { qrTarget.appendChild(canvas); });
  var qrMeta = div(''); qrMeta.style.cssText = 'flex:1;min-width:200px;';
  var qrFields = [
    ['Asset ID', asset.asset_id_label],
    ['Name', asset.name],
    ['Serial #', asset.serial_number || '—'],
    ['Location', asset.location || '—'],
  ];
  if (asset.uii) qrFields.push(['IUID/UII', asset.uii]);
  qrFields.forEach(function(f) {
    var row = div(''); row.style.cssText = 'margin-bottom:6px;';
    row.appendChild(el('span',{text:f[0]+': ',style:'color:#64748b;font-size:12px;'}));
    row.appendChild(el('span',{text:f[1],style:'color:#e2e8f0;font-size:13px;font-weight:600;font-family:monospace;'}));
    qrMeta.appendChild(row);
  });
  var qrHint = el('p',{text:'Scan to open this asset in Maintain Ops Suite.',style:'font-size:11px;color:#475569;margin-top:12px;'});
  qrMeta.appendChild(qrHint);
  qrBody.appendChild(qrTarget); qrBody.appendChild(qrMeta);
  qrCard.appendChild(qrBody);

  setContent(wrap);
}

// ── QR Code helpers ──────────────────────────────────────────────

function makeQRCanvas(text, size, callback) {
  // Minimal QR code generator — byte mode, error correction L, auto version
  // Encodes text into a QR matrix and draws it on a canvas element
  (function() {
    var PAD = [0xEC,0x11];
    var GF_EXP=[]; var GF_LOG=[]; var v=1;
    for(var i=0;i<256;i++){GF_EXP[i]=v;GF_LOG[v]=i;v=v<<1;if(v&256)v^=285;v&=255;}
    GF_EXP[255]=GF_EXP[0]; GF_LOG[0]=0;
    function gfMul(a,b){return(!a||!b)?0:GF_EXP[(GF_LOG[a]+GF_LOG[b])%255];}
    function rsGen(n){var g=[1];for(var i=0;i<n;i++){var t=[1,GF_EXP[i]];var p=[];for(var a=0;a<=g.length;a++)for(var b=0;b<=1;b++){var x=(a<g.length?g[a]:0),y=(b<t.length?t[b]:0);p[a+b]=(p[a+b]||0)^gfMul(x,y);}g=p;}return g.slice(1);}
    function rsEncode(msg,n){var gen=rsGen(n);var res=msg.concat(new Array(n).fill(0));for(var i=0;i<msg.length;i++){var c=res[i];if(c)for(var j=0;j<gen.length;j++)res[i+1+j]^=gfMul(gen[j],c);}return res.slice(msg.length);}
    var EC={L:{1:[7,19],2:[10,34],3:[15,55],4:[20,80],5:[26,108],6:[18,136],7:[20,156],8:[24,194],9:[30,232],10:[18,274]}};
    function getVer(len){for(var v=1;v<=10;v++){if(EC.L[v]&&len<=EC.L[v][1])return v;}return 10;}
    var bytes=[];for(var i=0;i<text.length;i++)bytes.push(text.charCodeAt(i)&0xff);
    var ver=getVer(bytes.length);
    var ecInfo=EC.L[ver];
    var totalDC=ecInfo[1];
    var ecPerBlock=ecInfo[0];
    var dataCap=totalDC-ecPerBlock;
    // Build data codewords
    var bits=[];
    function addBits(val,len){for(var i=len-1;i>=0;i--)bits.push((val>>i)&1);}
    addBits(4,4); addBits(bytes.length,8);
    bytes.forEach(function(b){addBits(b,8);});
    addBits(0,4);
    while(bits.length%8)bits.push(0);
    var cw=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];cw.push(b);}
    var pi=0;while(cw.length<dataCap)cw.push(PAD[pi++%2]);
    var ec=rsEncode(cw,ecPerBlock);
    var allCW=cw.concat(ec);
    // Build matrix
    var sz=ver*4+17;
    var M=[]; for(var i=0;i<sz;i++){M[i]=new Int8Array(sz).fill(-1);}
    function setM(r,c,v){if(r>=0&&r<sz&&c>=0&&c<sz)M[r][c]=v;}
    function finder(r,c){for(var dr=-1;dr<=7;dr++)for(var dc=-1;dc<=7;dc++){var nr=r+dr,nc=c+dc;if(nr<0||nr>=sz||nc<0||nc>=sz)continue;setM(nr,nc,(dr>=0&&dr<=6&&dc>=0&&dc<=6)&&(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4))?1:0);}}
    finder(0,0);finder(0,sz-7);finder(sz-7,0);
    // Timing
    for(var i=8;i<sz-8;i++){setM(6,i,i%2===0?1:0);setM(i,6,i%2===0?1:0);}
    // Format (just write zeros — simplified)
    [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]].forEach(function(p){setM(p[0],p[1],0);setM(p[1],p[0],0);});
    setM(sz-8,8,1);
    // Place data bits
    var bitIdx=0;
    var allBits=[];allCW.forEach(function(b){for(var i=7;i>=0;i--)allBits.push((b>>i)&1);});
    var col=sz-1,goUp=true;
    while(col>0){if(col===6)col--;for(var ri=0;ri<sz;ri++){var r=goUp?sz-1-ri:ri;for(var d=0;d<2;d++){var c=col-d;if(M[r][c]===-1){M[r][c]=bitIdx<allBits.length?allBits[bitIdx++]:0;}}}col-=2;goUp=!goUp;}
    // Draw on canvas
    var canvas=document.createElement('canvas');
    canvas.width=size;canvas.height=size;
    var ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,size,size);
    var cell=size/(sz+2);
    ctx.fillStyle='#000000';
    for(var r=0;r<sz;r++)for(var c=0;c<sz;c++)if(M[r][c]===1)ctx.fillRect((c+1)*cell,(r+1)*cell,cell,cell);
    callback(canvas);
  })();
}

function printAssetLabel(asset) {
  var qrUrl = window.location.origin + window.location.pathname.replace(/\/index\.php.*/,'') + '/index.php/apps/ops_suite#asset-detail/' + asset.id;
  var canvas = document.createElement('canvas');
  makeQRCanvas(qrUrl, 200, function(c) {
    var win = window.open('','_blank','width=420,height=320');
    if (!win) return;
    win.document.write(
      '<!DOCTYPE html><html><head><title>Asset Label — '+asset.asset_id_label+'</title>'+
      '<style>body{margin:0;padding:16px;font-family:monospace;background:#fff;color:#000;display:flex;gap:16px;align-items:flex-start;}'+
      '.info{flex:1;}h2{margin:0 0 4px;font-size:15px;}p{margin:2px 0;font-size:12px;}'+
      '.uid{font-size:11px;color:#555;border-top:1px solid #ccc;margin-top:8px;padding-top:6px;}'+
      '@media print{body{padding:0;}}</style></head><body>'+
      '<img src="'+c.toDataURL()+'" width="120" height="120" style="border:1px solid #ddd;">'+
      '<div class="info">'+
      '<h2>'+asset.asset_id_label+'</h2>'+
      '<p><b>'+asset.name+'</b></p>'+
      (asset.manufacturer?'<p>'+asset.manufacturer+(asset.model?' — '+asset.model:'')+'</p>':'')+
      (asset.serial_number?'<p>S/N: '+asset.serial_number+'</p>':'')+
      (asset.location?'<p>Location: '+asset.location+'</p>':'')+
      (asset.uii?'<p class="uid">IUID: '+asset.uii+'</p>':'')+
      '</div>'+
      '<script>window.onload=function(){window.print();}<\/script>'+
      '</body></html>'
    );
    win.document.close();
  });
}

async function viewQrScan() {
  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'🔲 QR / Asset Scan'}));
  wrap.appendChild(hdr);

  var card = div('ops-card'); card.style.maxWidth='480px';
  var cardHdr = div('ops-card-header'); cardHdr.appendChild(el('h3',{text:'Find Asset by ID or Scan'}));
  card.appendChild(cardHdr);
  var body = div(''); body.style.padding = '20px';

  var hint = el('p',{text:'Enter an Asset ID label (e.g. AST-0042) or scan a QR code — the scanner keyboard shortcut pastes the URL automatically.',style:'color:#94a3b8;font-size:13px;margin-bottom:16px;'});
  body.appendChild(hint);

  var searchInp = inp('Asset ID or URL', '');
  searchInp.style.cssText = 'width:100%;box-sizing:border-box;font-size:15px;padding:10px 12px;';
  body.appendChild(searchInp);

  var resultDiv = div(''); resultDiv.style.marginTop='16px';
  body.appendChild(resultDiv);

  var goBtn = btn('primary','Search / Go', doSearch);
  goBtn.style.marginTop='10px';
  body.appendChild(goBtn);

  searchInp.addEventListener('keydown', function(e){ if(e.key==='Enter') doSearch(); });

  async function doSearch() {
    var raw = searchInp.value.trim();
    if (!raw) return;
    // If it's a URL with #asset-detail/N, extract the ID
    var urlMatch = raw.match(/#asset-detail\/(\d+)/);
    if (urlMatch) { navigate('asset-detail', parseInt(urlMatch[1])); return; }
    // Otherwise search by asset_id_label
    resultDiv.textContent = 'Searching…';
    var assets = await API.assets.list({search: raw}).catch(()=>[]);
    resultDiv.innerHTML = '';
    if (!assets.length) { resultDiv.appendChild(el('p',{cls:'ops-empty',text:'No asset found for "'+raw+'"'})); return; }
    assets.slice(0,5).forEach(function(a) {
      var row = div(''); row.style.cssText='display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #1e2540;cursor:pointer;';
      row.addEventListener('mouseenter',function(){row.style.background='#1e2a3a';});
      row.addEventListener('mouseleave',function(){row.style.background='';});
      row.onclick=function(){navigate('asset-detail',a.id);};
      row.appendChild(span('ops-mono',a.asset_id_label));
      row.appendChild(el('span',{text:a.name,style:'color:#e2e8f0;flex:1;'}));
      resultDiv.appendChild(row);
    });
  }

  card.appendChild(body);
  wrap.appendChild(card);
  setContent(wrap);
}

// ── Photo helpers ────────────────────────────────────────────────
var PHOTO_TYPES = [['condition','Condition'],['install','Install'],['deficiency','Deficiency'],['pre_maint','Pre-Maintenance'],['post_maint','Post-Maintenance'],['scan','Scan Source'],['damage','Damage']];

function showAddPhotoForm(assetId, onDone) {
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }
  var typeSel   = add('Photo Type *', sel(PHOTO_TYPES, 'condition'));
  var captionInp = add('Caption', inp('Describe what is shown', ''), true);

  // File picker
  var fileWrap = div('ops-form-full');
  fileWrap.appendChild(el('label', {cls:'ops-form-label', text:'File (Nextcloud path) *'}));
  var fileInp = inp('/path/to/photo.jpg', '');
  var pickBtn = btn('ops-btn-sm', '📂 Browse', () => {
    showFileBrowser(path => { fileInp.value = path; }, {
      title: '📷 Select Photo',
      allowTypes: ['jpg','jpeg','png','webp','heic','heif'],
    });
  });
  var fpRow = div(''); fpRow.style.cssText = 'display:flex;gap:8px;';
  fpRow.appendChild(fileInp); fpRow.appendChild(pickBtn);
  fileWrap.appendChild(fpRow);
  body.appendChild(fileWrap);

  var primaryCb = el('input', {type:'checkbox'}); primaryCb.id = 'ph-primary-cb';
  var cbWrap = div('ops-form-full'); cbWrap.style.cssText = 'display:flex;align-items:center;gap:8px;';
  cbWrap.appendChild(primaryCb);
  cbWrap.appendChild(el('label', {text:'Set as primary photo', style:'font-size:13px;color:#e2e8f0;cursor:pointer;', for:'ph-primary-cb'}));
  body.appendChild(cbWrap);

  modal('Add Photo', body, async () => {
    if (!fileInp.value.trim()) throw new Error('File path is required.');
    await API.photos.create(assetId, {
      photo_type:  typeSel.value,
      caption:     captionInp.value.trim(),
      file_path:   fileInp.value.trim(),
      is_primary:  primaryCb.checked ? 1 : 0,
    });
    if (onDone) onDone();
  }, 'Add Photo');
}

function showPhotoViewer(ph) {
  var PHOTO_TYPE_LABELS = {install:'Install',condition:'Condition',deficiency:'Deficiency',pre_maint:'Pre-Maintenance',post_maint:'Post-Maintenance',scan:'Scan Source',damage:'Damage'};
  var imgSrc = '/apps/ops_suite/api/files/serve?path='+encodeURIComponent(ph.file_path);
  var overlay = el('div', {style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;'});
  overlay.onclick = () => overlay.remove();
  var img = el('img', {style:'max-width:90vw;max-height:80vh;object-fit:contain;border-radius:8px;'});
  img.src = imgSrc;
  var caption = div(''); caption.style.cssText = 'color:#e2e8f0;font-size:13px;text-align:center;';
  caption.textContent = (PHOTO_TYPE_LABELS[ph.photo_type]||ph.photo_type) + (ph.caption ? ' — '+ph.caption : '') + (ph.taken_at ? ' · '+ph.taken_at.slice(0,10) : '');
  var closeHint = el('span', {style:'color:#64748b;font-size:11px;', text:'Click anywhere to close'});
  overlay.appendChild(img); overlay.appendChild(caption); overlay.appendChild(closeHint);
  document.body.appendChild(overlay);
}

// ── 3D Model helpers ─────────────────────────────────────────────
var MODEL_FORMATS = [['GLTF','GLTF'],['GLB','GLB'],['STEP','STEP (queued conversion)'],['OBJ','OBJ'],['FBX','FBX'],['STL','STL'],['PLY','PLY']];
var HOTSPOT_LINK_TYPES = [['','— No link —'],['deficiency','Deficiency'],['asset','Asset'],['interface','Interface'],['document','Document'],['requirement','Requirement']];

function showAddModelForm(assetId, onDone) {
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }
  var fmtSel  = add('Format *', sel(MODEL_FORMATS, 'GLTF'));
  var verInp  = add('Version', inp('v1.0', 'v1.0'));
  var descInp = add('Description', inp('e.g., AN/PRC-152 Radio Unit exterior', ''), true);

  var fileWrap = div('ops-form-full');
  fileWrap.appendChild(el('label', {cls:'ops-form-label', text:'File (Nextcloud path) *'}));
  var fileInp = inp('/path/to/model.gltf', '');
  var pickBtn = btn('ops-btn-sm', '📂 Browse', () => {
    showFileBrowser(path => { fileInp.value = path; }, {
      title: '🧊 Select 3D Model File',
      allowTypes: ['gltf','glb','step','stp','obj','fbx'],
    });
  });
  var fpRow = div(''); fpRow.style.cssText = 'display:flex;gap:8px;';
  fpRow.appendChild(fileInp); fpRow.appendChild(pickBtn);
  fileWrap.appendChild(fpRow);
  body.appendChild(fileWrap);

  modal('Link 3D Model', body, async () => {
    if (!fileInp.value.trim()) throw new Error('File path is required.');
    await API.models.create(assetId, {
      source_format:    fmtSel.value,
      source_file_path: fileInp.value.trim(),
      model_version:    verInp.value.trim() || 'v1.0',
      description:      descInp.value.trim(),
    });
    if (onDone) onDone();
  }, 'Link Model');
}

function showAddHotspotForm(assetId, model, onDone) {
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }
  var labelInp = add('Label *', inp('e.g., PA Amplifier', ''));
  var xInp = add('Position X', inp('0.0', '0'));
  var yInp = add('Position Y', inp('0.0', '0'));
  var zInp = add('Position Z', inp('0.0', '0'));
  var linkTypeSel = add('Link To', sel(HOTSPOT_LINK_TYPES, ''));
  var linkIdInp   = add('Linked Record ID', inp('e.g., 42', ''));
  var colorInp    = add('Color', inp('#38bdf8', '#38bdf8'));
  var notesInp    = add('Tooltip Notes', inp('Short description shown on hover', ''), true);

  modal('Add Hotspot — '+model.description||'Model #'+model.id, body, async () => {
    if (!labelInp.value.trim()) throw new Error('Label is required.');
    await API.models.addHotspot(assetId, model.id, {
      label:        labelInp.value.trim(),
      position_x:   parseFloat(xInp.value)||0,
      position_y:   parseFloat(yInp.value)||0,
      position_z:   parseFloat(zInp.value)||0,
      linked_type:  linkTypeSel.value || null,
      linked_id:    linkIdInp.value ? parseInt(linkIdInp.value) : null,
      hotspot_color:colorInp.value || '#38bdf8',
      notes:        notesInp.value.trim(),
    });
    if (onDone) onDone();
  }, 'Add Hotspot');
}

function open3DViewer(model, asset) {
  var filePath = model.gltf_file_path || model.source_file_path;
  var fileUrl  = '/apps/ops_suite/api/files/serve?path='+encodeURIComponent(filePath);
  var hotspots = model.hotspots || [];
  var title    = (model.description || 'Model #'+model.id) + (asset ? ' — '+asset.name : '');

  var hotspotsJson = JSON.stringify(hotspots.map(h => ({
    x: h.position_x, y: h.position_y, z: h.position_z,
    label: h.label, color: h.hotspot_color||'#38bdf8', notes: h.notes||''
  })));

  var html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>${title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0f172a;color:#e2e8f0;font-family:Arial,sans-serif;overflow:hidden;height:100vh;}
  #canvas-wrap{width:100%;height:calc(100vh - 48px);}
  #toolbar{height:48px;background:#1e2540;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid #2e3650;}
  .title{font-size:14px;font-weight:700;flex:1;}
  .tbtn{padding:6px 14px;border-radius:6px;border:1px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:12px;cursor:pointer;}
  .tbtn:hover{background:#374160;}
  #hotspot-panel{position:absolute;top:60px;right:12px;background:rgba(30,37,64,0.95);border:1px solid #3e4a65;border-radius:8px;padding:12px;width:220px;font-size:12px;display:none;}
  #hotspot-panel h4{color:#38bdf8;margin-bottom:8px;}
  .hs-item{padding:6px 0;border-bottom:1px solid #2e3650;cursor:pointer;}
  .hs-item:hover{color:#38bdf8;}
  .hs-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;}
  #loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#64748b;}
</style>
<script src="https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.163.0/examples/js/loaders/GLTFLoader.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/three@0.163.0/examples/js/controls/OrbitControls.js"><\/script>
</head><body>
<div id="toolbar">
  <span class="title">🧊 ${title}</span>
  <button class="tbtn" onclick="resetCamera()">⟳ Reset</button>
  <button class="tbtn" onclick="toggleHotspots()">📍 Hotspots (${hotspots.length})</button>
  <button class="tbtn" onclick="document.getElementById('canvas-wrap').requestFullscreen?.()">⛶ Fullscreen</button>
  <button class="tbtn" onclick="window.close()">✕ Close</button>
</div>
<div id="canvas-wrap"></div>
<div id="loading">⏳ Loading model…</div>
<div id="hotspot-panel">
  <h4>📍 Hotspots</h4>
  <div id="hs-list"></div>
</div>
<script>
var HOTSPOTS = ${hotspotsJson};
var scene, camera, renderer, controls, model;

function init() {
  var wrap = document.getElementById('canvas-wrap');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  var dLight = new THREE.DirectionalLight(0xffffff, 1);
  dLight.position.set(5,10,7);
  scene.add(dLight);

  camera = new THREE.PerspectiveCamera(60, wrap.clientWidth/wrap.clientHeight, 0.01, 1000);
  camera.position.set(0, 1, 3);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  wrap.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  var loader = new THREE.GLTFLoader();
  loader.load('${fileUrl}', function(gltf) {
    model = gltf.scene;
    // Auto-center and scale
    var box = new THREE.Box3().setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var scale = 2 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    scene.add(model);
    document.getElementById('loading').style.display='none';

    // Place hotspot markers
    HOTSPOTS.forEach(function(h) {
      var geo = new THREE.SphereGeometry(0.04,12,12);
      var mat = new THREE.MeshBasicMaterial({color: new THREE.Color(h.color), opacity:0.9, transparent:true});
      var sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(h.x*scale-center.x*scale, h.y*scale-center.y*scale, h.z*scale-center.z*scale);
      sphere.userData = h;
      scene.add(sphere);
    });

    // Populate hotspot panel
    var list = document.getElementById('hs-list');
    HOTSPOTS.forEach(function(h) {
      var item = document.createElement('div');
      item.className = 'hs-item';
      item.innerHTML = '<span class="hs-dot" style="background:'+h.color+'"></span>'+h.label+(h.notes?'<div style="color:#94a3b8;font-size:11px;margin-top:2px;">'+h.notes+'</div>':'');
      list.appendChild(item);
    });

    resetCamera();
    controls.target.set(0,0,0);
    controls.update();
  }, undefined, function(err) {
    document.getElementById('loading').textContent = '⚠ Failed to load model. Check that the file is a valid GLTF/GLB.';
  });

  window.addEventListener('resize', function() {
    camera.aspect = wrap.clientWidth/wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function resetCamera() {
  camera.position.set(0,1,3);
  controls.target.set(0,0,0);
  controls.update();
}

function toggleHotspots() {
  var p = document.getElementById('hotspot-panel');
  p.style.display = p.style.display==='none' ? 'block' : 'none';
}

init();
<\/script>
</body></html>`;

  var w = window.open('', '_blank', 'width=1100,height=750');
  w.document.write(html);
  w.document.close();
}

function sopLink(path) {
  if(!path) return span('ops-muted','—');
  var a=el('a',{href:'#',cls:'ops-link-chip',text:'📋 SOP'});
  a.onclick=e=>{ e.preventDefault(); e.stopPropagation();
    var dir=path.replace(/\/[^/]+$/,'');
    window.open('/apps/files/?dir='+encodeURIComponent(dir), '_blank'); };
  return a;
}

/* ── Document Registry ─────────────────────────────────────────── */

var DOC_CATEGORIES = ['mil_std_drawing','fmea','drawing','tech_manual','spec','sop','test_plan','training','other'];
var DOC_CAT_ICONS  = {mil_std_drawing:'📐',fmea:'⚠',drawing:'📐',tech_manual:'📖',spec:'📋',sop:'🔧',test_plan:'🧪',training:'🎓',other:'📄'};

// S1000D Information Codes — determines DM type and drives category suggestion
var S1000D_INFO_CODES = [
  ['040','📘 040 — Description and Operation'],
  ['200','🔧 200 — Maintenance Procedure'],
  ['300','📦 300 — Illustrated Parts Data'],
  ['520','🔍 520 — Troubleshooting'],
  ['720','🔩 720 — Removal Procedure'],
  ['730','🔩 730 — Installation Procedure'],
  ['900','⚡ 900 — Fault Isolation'],
];
// Auto-suggest category from info code when tech writer picks a DM type
var S1000D_INFO_TO_CATEGORY = {'040':'tech_manual','200':'sop','300':'other','520':'test_plan','720':'sop','730':'sop','900':'fmea'};

var S1000D_IC_LABELS = {
  '040':'📘 Description & Operation',
  '200':'🔧 Maintenance Procedure',
  '300':'📦 Illustrated Parts Data',
  '520':'🔍 Troubleshooting',
  '720':'🔩 Removal Procedure',
  '730':'🔩 Installation Procedure',
  '900':'⚡ Fault Description',
};

/**
 * Reusable DM picker modal. Shows DMs for a given asset filtered to allowed info codes.
 * onPick(dm) called with the selected document object.
 * If assetId is null, shows all DMs of the given info codes across the platform.
 */
function showDmPicker(title, assetId, infoCodes, currentDocId, onPick) {
  API.documents.list(assetId ? {asset_id: assetId} : {}).then(allDocs => {
    var dms = allDocs.filter(d => d.doc_type === 'data_module' && infoCodes.includes(d.info_code));
    var wrap = div('');
    if (!dms.length) {
      wrap.appendChild(el('div',{text:'No '+infoCodes.map(c=>S1000D_IC_LABELS[c]||c).join(' / ')+' Data Modules found'+(assetId?' for this asset':'')+'.',style:'color:#64748b;font-size:13px;padding:8px 0;'}));
    } else {
      var list = div(''); list.style.cssText='display:flex;flex-direction:column;gap:6px;max-height:360px;overflow-y:auto;';
      dms.forEach(dm=>{
        var row = div('ops-card'); row.style.cssText='padding:10px 14px;cursor:pointer;border:1px solid '+(dm.id===currentDocId?'#38bdf8':'#1e2540')+';';
        row.appendChild(el('div',{text:(S1000D_IC_LABELS[dm.info_code]||dm.info_code)+' — '+dm.title,style:'font-size:13px;font-weight:700;color:#e2e8f0;'}));
        row.appendChild(el('div',{text:dm.dmc||dm.doc_number,style:'font-family:monospace;font-size:11px;color:#64748b;margin-top:2px;'}));
        if (dm.id===currentDocId) row.appendChild(span('ops-badge badge-blue','Currently Linked'));
        row.onclick = ()=>{ closeModal(); onPick(dm); };
        list.appendChild(row);
      });
      wrap.appendChild(list);
    }
    if (currentDocId) {
      var clearBtn = btn('ops-btn-sm','✕ Remove Link',()=>{ closeModal(); onPick(null); });
      clearBtn.style.marginTop='10px';
      wrap.appendChild(clearBtn);
    }
    modal(title, wrap, null, null, true);
  }).catch(()=>showToast('Could not load Data Modules.'));
}

// ── DM Checklist viewer ───────────────────────────────────────────────────────
// Opens a technician-facing interactive checklist modal for a procedure DM (200/720/730).
async function openDmChecklist(docId, pmTitle) {
  var doc, steps, mpReqs;
  try {
    [doc, steps, mpReqs] = await Promise.all([
      API.documents.get(docId),
      API.documents.dmSteps(docId),
      API.manpower.requirements.list({source_type:'document', source_id:docId}).catch(()=>[]),
    ]);
  } catch(e) { alert('Could not load procedure: '+e.message); return; }

  // Track checked state per step index (session-only)
  var checked = {};

  var overlay = el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:999999;display:flex;flex-direction:column;overflow:hidden;'});

  // Header
  var hdr = el('div',{style:'background:#0f172a;border-bottom:1px solid #1e293b;padding:14px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0;'});
  hdr.appendChild(el('div',{style:'flex:1;'},));
  var titleWrap = el('div',{style:'flex:1;'});
  titleWrap.appendChild(el('div',{text:'📋 '+pmTitle,style:'font-size:15px;font-weight:800;color:#e2e8f0;'}));
  titleWrap.appendChild(el('div',{text:(doc.dmc||doc.doc_number||'')+' — '+(doc.title||''),style:'font-size:11px;color:#475569;margin-top:2px;'}));
  hdr.appendChild(titleWrap);

  // Progress counter
  var progressEl = el('div',{style:'font-size:12px;font-weight:700;color:#4ade80;white-space:nowrap;'});

  function updateProgress() {
    var actionSteps = steps.filter(function(s){ return s.step_type==='action'||s.step_type==='substep'; });
    var done = actionSteps.filter(function(s,i){ return checked[s.id||i]; }).length;
    progressEl.textContent = done+' / '+actionSteps.length+' steps';
    progressEl.style.color = done===actionSteps.length&&actionSteps.length>0 ? '#4ade80' : '#64748b';
  }

  hdr.appendChild(progressEl);
  var printBtn = el('button',{text:'🖨 Print',style:'padding:6px 14px;border-radius:6px;border:1px solid #475569;background:transparent;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;'});
  printBtn.onclick = function(){ printDmProcedure(docId, pmTitle); };
  hdr.appendChild(printBtn);
  var closeBtn = el('button',{text:'✕ Close',style:'padding:6px 14px;border-radius:6px;border:1px solid #475569;background:transparent;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;'});
  closeBtn.onclick = function(){ overlay.remove(); };
  hdr.appendChild(closeBtn);
  overlay.appendChild(hdr);

  // Step list
  var body = el('div',{style:'flex:1;overflow-y:auto;padding:20px;max-width:820px;width:100%;margin:0 auto;'});
  overlay.appendChild(body);

  // Preliminary requirements banner (if personnel requirements are defined on this DM)
  if (mpReqs && mpReqs.length) {
    var prelim = el('div',{style:'background:#0f1f30;border:1px solid #1e3a5f;border-radius:10px;padding:14px 18px;margin-bottom:20px;'});
    prelim.appendChild(el('div',{text:'👷 Personnel Requirements',style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'}));
    var mpGrid = el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;'});
    mpReqs.forEach(function(r){
      var skillName = r.skill ? r.skill.code+' — '+r.skill.name : (r.notes||'General Labor');
      var chip = el('div',{style:'background:#0a1929;border:1px solid #1e3a5f;border-radius:6px;padding:8px 12px;'});
      chip.appendChild(el('div',{text:r.qty_required+'× '+skillName,style:'font-size:12px;font-weight:700;color:#e2e8f0;'}));
      if (r.duration_hours) chip.appendChild(el('div',{text:'Est. '+r.duration_hours+'h per person',style:'font-size:10px;color:#64748b;margin-top:2px;'}));
      if (r.notes && r.skill) chip.appendChild(el('div',{text:r.notes,style:'font-size:10px;color:#475569;margin-top:2px;font-style:italic;'}));
      var qualified = r.qualified_count||0;
      var needed = r.qty_required||1;
      var covColor = qualified>=needed?'#4ade80':qualified>0?'#f59e0b':'#ef4444';
      chip.appendChild(el('div',{text:qualified>=needed?'✓ Coverage met':'⚠ '+qualified+'/'+needed+' qualified',style:'font-size:10px;color:'+covColor+';font-weight:700;margin-top:4px;'}));
      mpGrid.appendChild(chip);
    });
    prelim.appendChild(mpGrid);
    body.appendChild(prelim);
  }

  var actionIdx = 0;
  steps.forEach(function(s, i) {
    var st = s.step_type || 'action';
    var content = s.content || '';

    if (st === 'title') {
      var sec = el('div',{text:content,style:'font-size:14px;font-weight:800;color:#e2e8f0;border-bottom:1px solid #1e293b;padding:20px 0 8px;margin-top:8px;letter-spacing:.03em;'});
      body.appendChild(sec); return;
    }
    if (st === 'warning') {
      var w = el('div',{style:'background:#7f1d1d33;border:1px solid #f8717180;border-radius:8px;padding:12px 16px;margin:10px 0;display:flex;gap:10px;align-items:flex-start;'});
      w.appendChild(el('span',{text:'⚠',style:'font-size:18px;flex-shrink:0;'}));
      w.appendChild(el('span',{text:content,style:'color:#fca5a5;font-weight:600;font-size:13px;line-height:1.5;'}));
      body.appendChild(w); return;
    }
    if (st === 'caution') {
      var c = el('div',{style:'background:#78350f33;border:1px solid #fb923c80;border-radius:8px;padding:12px 16px;margin:10px 0;display:flex;gap:10px;align-items:flex-start;'});
      c.appendChild(el('span',{text:'⚡',style:'font-size:18px;flex-shrink:0;'}));
      c.appendChild(el('span',{text:content,style:'color:#fdba74;font-weight:600;font-size:13px;line-height:1.5;'}));
      body.appendChild(c); return;
    }
    if (st === 'note') {
      var n = el('div',{style:'background:#0c1a2e;border:1px solid #1e3a5f;border-radius:8px;padding:10px 14px;margin:8px 0;display:flex;gap:10px;align-items:flex-start;'});
      n.appendChild(el('span',{text:'ℹ',style:'font-size:15px;flex-shrink:0;color:#38bdf8;'}));
      n.appendChild(el('span',{text:content,style:'color:#7dd3fc;font-size:12px;line-height:1.6;'}));
      body.appendChild(n); return;
    }
    if (st === 'expected_result') {
      var er = el('div',{style:'display:flex;gap:8px;padding:6px 0 6px 36px;align-items:flex-start;'});
      er.appendChild(el('span',{text:'↳',style:'color:#4ade80;font-size:14px;flex-shrink:0;'}));
      er.appendChild(el('span',{text:content,style:'color:#4ade80;font-size:12px;font-style:italic;line-height:1.5;'}));
      body.appendChild(er); return;
    }

    // Action / substep — interactive checkbox row
    var isSubstep = st === 'substep';
    actionIdx++;
    var stepNum = actionIdx;
    var stepId = s.id || i;
    var row = el('div',{style:'display:flex;gap:12px;align-items:flex-start;padding:'+(isSubstep?'8px 0 8px 32px':'12px 0')+';border-bottom:1px solid #0f172a;cursor:pointer;'+(isSubstep?'':'')});

    var cb = el('div',{style:'width:22px;height:22px;border-radius:5px;border:2px solid #334155;background:transparent;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .15s;'});
    var numEl = el('div',{text:isSubstep?'':String(stepNum)+'.',style:'min-width:28px;font-size:12px;font-weight:700;color:#475569;flex-shrink:0;padding-top:2px;'+(isSubstep?'display:none;':'')});
    var txtEl = el('div',{text:content,style:'flex:1;font-size:13px;line-height:1.6;color:#e2e8f0;'+(isSubstep?'font-size:12px;color:#94a3b8;':'')});

    function applyState() {
      if (checked[stepId]) {
        cb.style.background = '#16a34a';
        cb.style.borderColor = '#4ade80';
        cb.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
        txtEl.style.textDecoration = 'line-through';
        txtEl.style.color = '#475569';
        row.style.opacity = '0.6';
      } else {
        cb.style.background = 'transparent';
        cb.style.borderColor = '#334155';
        cb.innerHTML = '';
        txtEl.style.textDecoration = 'none';
        txtEl.style.color = isSubstep ? '#94a3b8' : '#e2e8f0';
        row.style.opacity = '1';
      }
    }
    applyState();

    row.onclick = function(){
      checked[stepId] = !checked[stepId];
      applyState();
      updateProgress();
    };
    row.appendChild(cb); row.appendChild(numEl); row.appendChild(txtEl);
    body.appendChild(row);
  });

  updateProgress();
  document.body.appendChild(overlay);
}

// ── DM Print / PDF ────────────────────────────────────────────────────────────
async function printDmProcedure(docId, pmTitle) {
  var doc, steps, mpReqs;
  try {
    [doc, steps, mpReqs] = await Promise.all([
      API.documents.get(docId),
      API.documents.dmSteps(docId),
      API.manpower.requirements.list({source_type:'document', source_id:docId}).catch(()=>[]),
    ]);
  } catch(e) { alert('Could not load procedure: '+e.message); return; }

  var stepHtml = '';
  var actionNum = 0;
  steps.forEach(function(s){
    var st = s.step_type || 'action';
    var content = (s.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (st==='title')           { stepHtml += '<h3 class="sec">'+content+'</h3>'; }
    else if (st==='warning')    { stepHtml += '<div class="warning"><b>⚠ WARNING</b><br>'+content+'</div>'; }
    else if (st==='caution')    { stepHtml += '<div class="caution"><b>⚡ CAUTION</b><br>'+content+'</div>'; }
    else if (st==='note')       { stepHtml += '<div class="note"><b>NOTE:</b> '+content+'</div>'; }
    else if (st==='expected_result') { stepHtml += '<div class="result">↳ '+content+'</div>'; }
    else if (st==='substep')    { stepHtml += '<div class="substep"><span class="cb"></span>'+content+'</div>'; }
    else { actionNum++; stepHtml += '<div class="step"><span class="cb"></span><span class="num">'+actionNum+'.</span><span class="txt">'+content+'</span></div>'; }
  });

  // Personnel requirements table for print
  var personnelHtml = '';
  if (mpReqs && mpReqs.length) {
    personnelHtml = '<h3 style="font-size:11pt;font-weight:bold;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #999;padding-bottom:4px;">Personnel Requirements</h3>'
      +'<table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:10pt;">'
      +'<thead><tr style="background:#f0f0f0;"><th style="padding:5px 8px;text-align:left;border:1px solid #ccc;">Skill / Certification</th><th style="padding:5px 8px;text-align:center;border:1px solid #ccc;">Qty</th><th style="padding:5px 8px;text-align:center;border:1px solid #ccc;">Est. Hours</th><th style="padding:5px 8px;text-align:left;border:1px solid #ccc;">Notes</th></tr></thead><tbody>';
    mpReqs.forEach(function(r){
      var skillName = r.skill ? r.skill.code+' — '+r.skill.name : (r.notes||'General Labor');
      personnelHtml += '<tr><td style="padding:5px 8px;border:1px solid #ccc;">'+skillName+'</td>'
        +'<td style="padding:5px 8px;text-align:center;border:1px solid #ccc;font-weight:bold;">'+r.qty_required+'</td>'
        +'<td style="padding:5px 8px;text-align:center;border:1px solid #ccc;">'+(r.duration_hours?r.duration_hours+'h':'—')+'</td>'
        +'<td style="padding:5px 8px;border:1px solid #ccc;color:#555;font-size:9pt;">'+(r.skill&&r.notes?r.notes:'—')+'</td></tr>';
    });
    personnelHtml += '</tbody></table>';
  }

  var today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+pmTitle+'</title><style>'
    +'body{font-family:Arial,sans-serif;font-size:12pt;color:#000;margin:0;padding:0;}'
    +'@page{size:letter;margin:1in 0.85in;}'
    +'.page{max-width:6.5in;margin:0 auto;}'
    +'.header{border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}'
    +'.header h1{font-size:15pt;margin:0 0 4px;}'
    +'.header .meta{font-size:9pt;color:#555;display:flex;gap:24px;}'
    +'.sec{font-size:12pt;font-weight:bold;border-bottom:1px solid #999;padding:14px 0 4px;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.04em;}'
    +'.step{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #eee;align-items:flex-start;page-break-inside:avoid;}'
    +'.substep{display:flex;gap:10px;padding:5px 0 5px 30px;align-items:flex-start;}'
    +'.cb{width:14px;height:14px;border:1.5px solid #333;border-radius:2px;flex-shrink:0;margin-top:2px;display:inline-block;}'
    +'.num{min-width:22px;font-weight:bold;flex-shrink:0;}'
    +'.txt{flex:1;line-height:1.5;}'
    +'.result{color:#1a6b33;padding:3px 0 3px 36px;font-style:italic;font-size:11pt;}'
    +'.warning{border:1.5px solid #c00;border-radius:4px;padding:8px 12px;margin:10px 0;color:#900;background:#fff5f5;page-break-inside:avoid;}'
    +'.caution{border:1.5px solid #e07000;border-radius:4px;padding:8px 12px;margin:10px 0;color:#7a3800;background:#fffbf0;page-break-inside:avoid;}'
    +'.note{border:1.5px solid #0066cc;border-radius:4px;padding:8px 12px;margin:10px 0;color:#004499;background:#f0f6ff;page-break-inside:avoid;}'
    +'.footer{position:fixed;bottom:0;left:0.85in;right:0.85in;border-top:1px solid #999;font-size:8pt;color:#666;display:flex;justify-content:space-between;padding-top:4px;}'
    +'</style></head><body>'
    +'<div class="page">'
    +'<div class="header"><h1>'+pmTitle+'</h1>'
    +'<div class="meta"><span><b>DMC:</b> '+(doc.dmc||doc.doc_number||'—')+'</span><span><b>Issue:</b> '+(doc.issue_number||1)+'</span><span><b>Date:</b> '+today+'</span></div></div>'
    +personnelHtml
    +stepHtml
    +'</div>'
    +'<div class="footer"><span>'+(doc.dmc||doc.doc_number||'')+'</span><span>Printed: '+today+'</span></div>'
    +'</body></html>';

  var win = window.open('','_blank');
  if (!win) { alert('Allow pop-ups to open print view.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function(){ win.print(); }, 400);
}

// S1000D starter templates — seeded automatically when a new DM is created
var S1000D_TEMPLATES = {
  '040': [
    {step_type:'title',   content:'1. General Description',                          sort_order:1},
    {step_type:'action',  content:'[Describe the purpose, function, and operational role of this equipment or system.]', sort_order:2},
    {step_type:'title',   content:'2. Equipment Overview',                            sort_order:3},
    {step_type:'action',  content:'[Describe major assemblies, subsystems, and how they interconnect.]', sort_order:4},
    {step_type:'title',   content:'3. Technical Characteristics',                     sort_order:5},
    {step_type:'tech_char',content:'Operating Voltage|[value]',                       sort_order:6},
    {step_type:'tech_char',content:'Operating Frequency|[value]',                     sort_order:7},
    {step_type:'tech_char',content:'Dimensions (L × W × H)|[value]',                 sort_order:8},
    {step_type:'tech_char',content:'Weight|[value]',                                  sort_order:9},
    {step_type:'tech_char',content:'Operating Temperature Range|[value]',             sort_order:10},
    {step_type:'title',   content:'4. Theory of Operation',                           sort_order:11},
    {step_type:'action',  content:'[Describe how the system operates under normal conditions, including signal flow or process flow.]', sort_order:12},
    {step_type:'note',    content:'[Add any operational notes, limitations, or special conditions here.]', sort_order:13},
  ],
  '200': [
    {step_type:'title',   content:'1. Safety Requirements',                           sort_order:1},
    {step_type:'warning', content:'WARNING: [State the specific hazard, the consequence if ignored, and the action to avoid it.]', sort_order:2},
    {step_type:'caution', content:'CAUTION: [State equipment or data risk and how to avoid it.]', sort_order:3},
    {step_type:'title',   content:'2. Tools and Materials Required',                  sort_order:4},
    {step_type:'action',  content:'[List all tools, materials, and support equipment needed before starting.]', sort_order:5},
    {step_type:'title',   content:'3. Initial Conditions',                            sort_order:6},
    {step_type:'action',  content:'[Describe the required starting state — system powered down, valves closed, area cleared, etc.]', sort_order:7},
    {step_type:'title',   content:'4. Procedure',                                     sort_order:8},
    {step_type:'action',  content:'Step 1 — [Describe the first action the technician performs.]', sort_order:9},
    {step_type:'expected_result',content:'[Describe what the technician should observe after this step.]', sort_order:10},
    {step_type:'action',  content:'Step 2 — [Describe the next action.]',             sort_order:11},
    {step_type:'expected_result',content:'[Describe the expected result.]',           sort_order:12},
    {step_type:'action',  content:'Step 3 — [Continue as needed.]',                   sort_order:13},
    {step_type:'title',   content:'5. Close-Out',                                     sort_order:14},
    {step_type:'action',  content:'Verify all tools and materials are accounted for and removed from the work area.', sort_order:15},
    {step_type:'action',  content:'Restore the system to normal operating configuration.', sort_order:16},
    {step_type:'note',    content:'Record completion, technician name, and any anomalies in the maintenance log.', sort_order:17},
  ],
  '300': [
    {step_type:'part_item',content:JSON.stringify({item:'1',nsn:'',part_num:'[TBD]',nomenclature:'[Component Name]',qty:1,unit:'EA',remarks:''}), sort_order:1},
    {step_type:'part_item',content:JSON.stringify({item:'2',nsn:'',part_num:'[TBD]',nomenclature:'[Component Name]',qty:1,unit:'EA',remarks:''}), sort_order:2},
  ],
  '520': [
    {step_type:'symptom',          content:'Symptom 1 — [Describe the observed abnormal condition or fault indication.]', sort_order:1},
    {step_type:'probable_cause',   content:'Probable Cause A — [First most likely root cause.]',                         sort_order:2},
    {step_type:'corrective_action',content:'Corrective Action — [Steps to isolate and correct this cause.]',             sort_order:3},
    {step_type:'probable_cause',   content:'Probable Cause B — [Second most likely root cause.]',                        sort_order:4},
    {step_type:'corrective_action',content:'Corrective Action — [Steps to isolate and correct this cause.]',             sort_order:5},
    {step_type:'symptom',          content:'Symptom 2 — [Describe the next observed fault indication.]',                 sort_order:6},
    {step_type:'probable_cause',   content:'Probable Cause A — [Most likely root cause.]',                               sort_order:7},
    {step_type:'corrective_action',content:'Corrective Action — [Steps to isolate and correct this cause.]',             sort_order:8},
  ],
  '720': [
    {step_type:'title',   content:'1. Safety Requirements',                                                               sort_order:1},
    {step_type:'warning', content:'WARNING: [State specific hazard before removal — electrical, hydraulic, thermal, etc.]', sort_order:2},
    {step_type:'title',   content:'2. Prerequisites',                                                                     sort_order:3},
    {step_type:'action',  content:'De-energize and isolate all energy sources per applicable LOTO procedure.',            sort_order:4},
    {step_type:'action',  content:'[List any additional prerequisite conditions or tasks.]',                              sort_order:5},
    {step_type:'title',   content:'3. Tools and Materials Required',                                                      sort_order:6},
    {step_type:'action',  content:'[List all tools, materials, and support equipment needed.]',                           sort_order:7},
    {step_type:'title',   content:'4. Removal Procedure',                                                                 sort_order:8},
    {step_type:'action',  content:'Step 1 — [Disconnect or detach the first securing element — connector, fastener, fitting, etc.]', sort_order:9},
    {step_type:'caution', content:'CAUTION: [Note any fragile interfaces, weight limits, or support requirements.]',     sort_order:10},
    {step_type:'action',  content:'Step 2 — [Continue removal steps in order.]',                                         sort_order:11},
    {step_type:'action',  content:'Step 3 — [Remove the component and set it aside in a protected area.]',               sort_order:12},
    {step_type:'note',    content:'Tag and bag all removed hardware. Record part numbers and quantities.',                 sort_order:13},
  ],
  '730': [
    {step_type:'title',   content:'1. Safety Requirements',                                                               sort_order:1},
    {step_type:'warning', content:'WARNING: [State specific hazard before installation.]',                                sort_order:2},
    {step_type:'title',   content:'2. Prerequisites',                                                                     sort_order:3},
    {step_type:'action',  content:'Verify replacement component is the correct part number and condition.',               sort_order:4},
    {step_type:'action',  content:'Verify all mating interfaces are clean and undamaged.',                                sort_order:5},
    {step_type:'title',   content:'3. Installation Procedure',                                                            sort_order:6},
    {step_type:'action',  content:'Step 1 — [Position the component and align with mating interface.]',                  sort_order:7},
    {step_type:'caution', content:'CAUTION: [Note torque limits, orientation requirements, or fragile interfaces.]',     sort_order:8},
    {step_type:'action',  content:'Step 2 — [Secure all fasteners, connectors, or fittings.]',                           sort_order:9},
    {step_type:'action',  content:'Step 3 — [Continue installation steps in order.]',                                    sort_order:10},
    {step_type:'title',   content:'4. Functional Check',                                                                  sort_order:11},
    {step_type:'action',  content:'Restore energy sources and perform a functional check per [reference applicable DM].', sort_order:12},
    {step_type:'expected_result',content:'System operates normally with no anomalies.',                                   sort_order:13},
    {step_type:'note',    content:'Record installation, part number installed, technician, and date in the maintenance log.', sort_order:14},
  ],
  '900': [
    {step_type:'title',   content:'Fault 1 — [Fault code or description]',                                              sort_order:1},
    {step_type:'warning', content:'WARNING: [Any hazard associated with diagnosing this fault.]',                        sort_order:2},
    {step_type:'action',  content:'Check 1 — [First diagnostic check to perform.]',                                     sort_order:3},
    {step_type:'substep', content:'Result: Normal → Proceed to Check 2.',                                               sort_order:4},
    {step_type:'substep', content:'Result: Abnormal → [Corrective action or refer to fault isolation step.]',            sort_order:5},
    {step_type:'action',  content:'Check 2 — [Next diagnostic check.]',                                                 sort_order:6},
    {step_type:'substep', content:'Result: Normal → [Continue or escalate to depot.]',                                  sort_order:7},
    {step_type:'substep', content:'Result: Abnormal → [Corrective action.]',                                            sort_order:8},
    {step_type:'title',   content:'Fault 2 — [Fault code or description]',                                              sort_order:9},
    {step_type:'action',  content:'Check 1 — [First diagnostic check to perform.]',                                     sort_order:10},
    {step_type:'substep', content:'Result: Normal → [Continue.]',                                                       sort_order:11},
    {step_type:'substep', content:'Result: Abnormal → [Corrective action.]',                                            sort_order:12},
  ],
};

// Build a client-side DMC preview from asset label + info code (uniqueness checked server-side on save)
function previewDmc(assetLabel, infoCode, variant) {
  if (!assetLabel || !infoCode) return '';
  var sns = assetLabel.toUpperCase().replace(/[^A-Z0-9\-]/g,'');
  return 'DMC-ALTO-A-'+sns+'-00-'+infoCode+(variant||'A')+'-A';
}
var DOC_CAT_LABELS = {mil_std_drawing:'MIL-STD Drawing',fmea:'FMEA Worksheet',drawing:'Drawing',tech_manual:'Tech Manual',spec:'Specification',sop:'SOP',test_plan:'Test Plan',training:'Training',other:'Other'};
var DOC_STATUSES   = ['draft','active','superseded','obsolete'];

function docStatusBadge(s) {
  var map = {draft:'badge-gray',active:'badge-green',superseded:'badge-yellow',obsolete:'badge-red'};
  return span('ops-badge '+(map[s]||'badge-gray'), s);
}

async function viewDocuments() {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var [docs, assets] = await Promise.all([
    API.documents.list(),
    getAssets().catch(()=>[]),
  ]);

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'📄 The Library'}));
  var hdrBtns = div(''); hdrBtns.style.cssText='display:flex;gap:8px;';
  hdrBtns.appendChild(btn('primary ops-btn-sm','+ Add to Library', () => showLibraryPicker(null, () => viewDocuments())));
  hdr.appendChild(hdrBtns);
  wrap.appendChild(hdr);

  // Quick-access publication pills at top
  var pubs = docs.filter(d=>d.doc_type==='publication');
  if (pubs.length) {
    var pubBar = div('');
    pubBar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;';
    pubs.forEach(p=>{
      var pill = el('span',{text:'📖 '+p.title, cls:'ops-link-chip',
        style:'cursor:pointer;color:#a78bfa;border-color:#a78bfa44;font-weight:600;font-size:12px;'});
      pill.onclick = ()=>navigate('doc-detail', p.id);
      pubBar.appendChild(pill);
    });
    wrap.appendChild(pubBar);
  }

  // Filters
  var fbar = div('ops-filter-bar');
  var laneSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Documents'],['external','📎 External'],['data_module','📘 Data Modules'],['publication','📖 Publications']].forEach(([v,l])=>{
    var o=el('option',{value:v,text:l}); laneSel.appendChild(o);
  });
  var catSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Categories'],...DOC_CATEGORIES.map(c=>[c,DOC_CAT_ICONS[c]+' '+c])].forEach(([v,l])=>{
    var o=el('option',{value:v,text:l}); catSel.appendChild(o);
  });
  var statSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Statuses'],...DOC_STATUSES.map(s=>[s,s])].forEach(([v,l])=>{
    var o=el('option',{value:v,text:l}); statSel.appendChild(o);
  });
  fbar.appendChild(span('ops-filter-label','Lane:'));     fbar.appendChild(laneSel);
  fbar.appendChild(span('ops-filter-label','Category:')); fbar.appendChild(catSel);
  fbar.appendChild(span('ops-filter-label','Status:'));   fbar.appendChild(statSel);
  wrap.appendChild(fbar);

  var tableWrap = div('');
  wrap.appendChild(tableWrap);

  function render() {
    var lane = laneSel.value;
    var cat  = catSel.value;
    var stat = statSel.value;
    var filtered = docs.filter(d =>
      (!lane || (d.doc_type||'external') === lane) &&
      (!cat  || d.category === cat) &&
      (!stat || d.status   === stat)
    );
    var assetMap = {};
    assets.forEach(a => { assetMap[a.id] = a; });

    var card = div('ops-card');
    card.appendChild(makeTable(
      ['Lane','Doc #','Title / DMC','Category','Asset','Rev / Issue','Status',''],
      filtered.map(d => {
        var isDm  = (d.doc_type === 'data_module');
        var isPub = (d.doc_type === 'publication');
        // Lane badge
        var laneBadge = isDm  ? el('span',{text:'📘 DM',  style:'background:#1e3a5f;color:#38bdf8;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;'})
                      : isPub ? el('span',{text:'📖 PUB', style:'background:#1e1a3f;color:#a78bfa;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;'})
                              : el('span',{text:'📎 Ext', style:'background:#1a2035;color:#64748b;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;'});
        // Title cell
        var titleCell = div('');
        var lnk = el('strong',{text:d.title,style:'cursor:pointer;color:#38bdf8;display:block;'});
        lnk.onclick = ()=>navigate('doc-detail',d.id);
        titleCell.appendChild(lnk);
        if (isDm && d.dmc) {
          var dmcEl = el('span',{text:d.dmc,style:'font-size:10px;color:#475569;font-family:monospace;'});
          if (d.dmc_review_flag) dmcEl.style.color='#fbbf24';
          titleCell.appendChild(dmcEl);
        }
        if (isPub && d.pub_code) {
          var pubEl = div(''); pubEl.style.cssText='display:flex;gap:6px;align-items:center;margin-top:2px;';
          pubEl.appendChild(el('span',{text:d.pub_code,style:'font-size:10px;color:#a78bfa;font-family:monospace;'}));
          if (d.pub_type) pubEl.appendChild(pubTypeBadge(d.pub_type));
          if (d.re_issue_required) pubEl.appendChild(el('span',{text:'⚠ Re-Issue',style:'font-size:10px;color:#fbbf24;font-weight:700;'}));
          titleCell.appendChild(pubEl);
        }
        // Rev / Issue cell
        var revCell = isDm
          ? (()=>{
              var iss = el('span',{text:'Issue '+d.issue_number,style:'font-family:monospace;font-size:11px;color:#94a3b8;'});
              if (d.in_work_number > 0) {
                var iw = el('span',{text:' (In-Work)',style:'font-size:10px;color:#fbbf24;margin-left:4px;'});
                var wrap2=div(''); wrap2.appendChild(iss); wrap2.appendChild(iw); return wrap2;
              }
              return iss;
            })()
          : (d.current_rev ? span('ops-mono ops-small','Rev '+d.current_rev) : span('ops-muted','—'));
        // Actions
        var eb = btn('ops-btn-sm','✏',()=>showDocumentForm(d,d.asset_id,()=>viewDocuments()));
        var db = btn('ops-btn-sm ops-btn-danger','✕',async()=>{
          if(!confirm('Delete "'+d.doc_number+'"?')) return;
          await API.documents.destroy(d.id); viewDocuments();
        });
        var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db);
        return [
          laneBadge,
          span('ops-mono ops-small', d.doc_number),
          titleCell,
          span('ops-badge badge-blue', (DOC_CAT_ICONS[d.category]||'📄') + ' ' + (DOC_CAT_LABELS[d.category]||d.category)),
          d.asset_id && assetMap[d.asset_id] ? span('ops-mono ops-small', assetMap[d.asset_id].asset_id_label||('#'+d.asset_id)) : span('ops-muted','—'),
          revCell,
          docStatusBadge(d.status),
          g,
        ];
      }),
      i => { if (filtered[i]) navigate('doc-detail', filtered[i].id); }
    ));
    tableWrap.innerHTML='';
    tableWrap.appendChild(card);
  }

  laneSel.onchange = render;
  catSel.onchange  = render;
  statSel.onchange = render;
  render();
  setContent(wrap);
}

async function viewDocDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading document…'}));
  var doc = await API.documents.get(id).catch(()=>null);
  if (!doc) { setContent(el('div',{cls:'ops-empty',text:'Document not found.'})); return; }

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Documents',()=>navigate('documents')));
  var titleParts = div(''); titleParts.style.cssText='display:flex;align-items:center;gap:10px;flex:1;';
  if (doc.doc_type==='publication') {
    titleParts.appendChild(pubTypeBadge(doc.pub_type));
    if (doc.pub_code) titleParts.appendChild(el('span',{text:doc.pub_code,style:'font-family:monospace;font-size:12px;color:#38bdf8;background:#1e3a5f22;padding:2px 8px;border-radius:4px;'}));
  }
  titleParts.appendChild(el('h2',{text:doc.title,style:'margin:0;'}));
  hdr.appendChild(titleParts);
  hdr.appendChild(docStatusBadge(doc.status));
  var editLabel = doc.doc_type==='publication' ? '✏ Edit Publication' : '✏ Edit & Advance Revision';
  var editBtn = btn('primary',editLabel,()=>showDocumentForm(doc, doc.asset_id, ()=>viewDocDetail(id)));
  hdr.appendChild(editBtn);
  wrap.appendChild(hdr);

  // ── Publication layout ─────────────────────────────────────────────────────
  if (doc.doc_type === 'publication') {
    await renderPublicationDetail(doc, wrap, () => viewDocDetail(id));
    setContent(wrap);
    return;
  }

  var two = div('ops-two-col');
  var left = div('');

  // Detail card
  var dc = div('ops-card ops-detail-card');
  dc.appendChild(div('ops-section-label',[document.createTextNode('Document Information')]));
  var kvg = div('ops-kv-grid');
  var isDm = doc.doc_type === 'data_module';

  // DM review flag banner
  if (isDm && doc.dmc_review_flag) {
    var reviewBanner = div('');
    reviewBanner.style.cssText='background:#78350f33;border:1px solid #fbbf2444;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;';
    reviewBanner.appendChild(el('span',{text:'⚠',style:'font-size:18px;'}));
    var bannerText = div('');
    bannerText.appendChild(el('div',{text:'This Data Module has been updated',style:'font-weight:700;color:#fbbf24;font-size:13px;'}));
    bannerText.appendChild(el('div',{text:'Issue '+doc.issue_number+' was released. Review linked PMs and publications to clear this flag.',style:'color:#94a3b8;font-size:11px;margin-top:2px;'}));
    reviewBanner.appendChild(bannerText);
    dc.appendChild(reviewBanner);
  }

  var fields = [
    ['Doc Number', span('ops-mono', doc.doc_number)],
    ['Title',      doc.title],
    ['Type',       isDm
      ? el('span',{text:'📘 Data Module (S1000D)',style:'color:#38bdf8;font-size:11px;font-weight:700;'})
      : el('span',{text:'📎 External Document',  style:'color:#64748b;font-size:11px;font-weight:700;'})],
    ['Category',   span('ops-badge badge-blue', (DOC_CAT_ICONS[doc.category]||'📄')+' '+(DOC_CAT_LABELS[doc.category]||doc.category))],
    ['Status',     docStatusBadge(doc.status)],
    ...(isDm ? [
      ['DMC',        doc.dmc ? el('span',{text:doc.dmc,style:'font-family:monospace;font-size:12px;color:#38bdf8;'}) : span('ops-muted','—')],
      ['Info Code',  doc.info_code ? el('span',{text:doc.info_code+' — '+(S1000D_INFO_CODES.find(x=>x[0]===doc.info_code)?.[1]?.replace(/^[^\s]+\s/,'')||doc.info_code),style:'font-size:12px;color:#94a3b8;'}) : span('ops-muted','—')],
      ['Issue',      el('span',{text:'Issue '+doc.issue_number+(doc.in_work_number>0?' (In-Work '+doc.in_work_number+')':' — Released'),style:'font-family:monospace;font-size:12px;color:#94a3b8;'})],
    ] : [
      ['Current Rev',doc.current_rev ? span('ops-mono','Rev '+doc.current_rev) : span('ops-muted','—')],
      ['Applicability', doc.applicability || span('ops-muted','—')],
    ]),
    ['Notes',      doc.notes || span('ops-muted','—')],
  ];
  if (doc.asset_id) {
    var linkedAsset = await API.assets.get(doc.asset_id).catch(()=>null);
    if (linkedAsset) {
      var al = el('span',{style:'cursor:pointer;color:#38bdf8;',text:linkedAsset.asset_id_label+' — '+linkedAsset.name});
      al.onclick = ()=>navigate('asset-detail', linkedAsset.id);
      fields.splice(2, 0, ['Linked Asset', al]);
    }
  }
  if (doc.canvas_id) {
    var cl = el('span',{style:'cursor:pointer;color:#38bdf8;',text:'Open Source Canvas →'});
    cl.onclick = ()=>navigate('canvas-detail', doc.canvas_id);
    fields.splice(2, 0, ['Source Canvas', cl]);
  }

  // ── S1000D reverse linkage chips — show what this DM serves ──────────────
  if (isDm) {
    var ic = doc.info_code;
    var linkChips = div(''); linkChips.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px;';
    var addedAny = false;

    if (ic === '040' && doc.asset_id) {
      // 040 DMs describe an asset — asset link already shown above; add a direct chip
      var c040 = span('ops-link-chip','📘 Description DM for this Asset');
      linkChips.appendChild(c040); addedAny = true;
    }
    if (ic === '300' && doc.asset_id) {
      var c300 = span('ops-link-chip','📦 Parts List for this Asset');
      linkChips.appendChild(c300); addedAny = true;
    }
    if (['200','720','730'].includes(ic)) {
      // Find PMs that link to this DM
      API.procedures.list({asset_id: doc.asset_id}).then(procs => {
        var linked = procs.filter(p=>p.document_id===doc.id);
        linked.forEach(p=>{
          var chip = el('span',{text:'⚙ PM: '+p.title,cls:'ops-link-chip',style:'cursor:pointer;'});
          chip.onclick = ()=>navigate('pm-procedures');
          linkChips.appendChild(chip);
        });
        if (linked.length) dc.appendChild(linkChips);
      }).catch(()=>{});
      addedAny = false; // defer to async above
    }
    if (ic === '520') {
      // Show linked PMs and deficiencies for this T/S DM
      Promise.all([
        API.deficiencies.list({asset_id: doc.asset_id}).catch(()=>([]) ),
        API.procedures.list({asset_id: doc.asset_id}).catch(()=>([]) ),
      ]).then(function(results) {
        var defs  = results[0]; var dList = defs.items||defs||[];
        var procs = results[1];
        var linkedDefs  = dList.filter(function(d){ return d.document_id===doc.id; });
        var linkedProcs = procs.filter(function(p){ return p.ts_document_id===doc.id; });

        // Linked PM chips with a "Link to PM" button
        var pmHdr = el('div',{style:'font-size:10px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;margin-top:2px;',text:'🔗 Linked PMs (this T/S DM is used when PM logs an issue)'});
        dc.appendChild(pmHdr);

        var pmChipRow = div(''); pmChipRow.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;';
        if (linkedProcs.length) {
          linkedProcs.forEach(function(pm){
            var c = el('span',{text:'⚙ '+pm.proc_id_label+' — '+pm.name,cls:'ops-link-chip',style:'cursor:pointer;color:#fbbf24;border-color:#fbbf2444;'});
            c.onclick = function(){ viewProcedureDetail(pm); };
            pmChipRow.appendChild(c);
          });
        } else {
          pmChipRow.appendChild(el('span',{text:'No PMs linked yet',style:'font-size:11px;color:#475569;font-style:italic;'}));
        }

        var linkPmBtn = el('button',{text:'+ Link to PM',style:'padding:4px 12px;border-radius:6px;border:1px dashed #fbbf24;background:rgba(251,191,36,0.08);color:#fbbf24;font-size:11px;font-weight:600;cursor:pointer;'});
        linkPmBtn.onclick = async function(){
          // Show a picker of PMs for this asset that don't already have a T/S DM linked
          var allProcs = await API.procedures.list({asset_id: doc.asset_id}).catch(function(){ return []; });
          var unlinked = allProcs.filter(function(p){ return !p.ts_document_id || p.ts_document_id===doc.id; });
          if (!unlinked.length) { alert('All PMs for this asset already have a T/S DM linked.'); return; }
          // Build simple picker
          var pSel = sel(unlinked.map(function(pm){ return [String(pm.id), pm.proc_id_label+' — '+pm.name]; }), '');
          showModal('Link T/S DM to PM', pSel, [
            {label:'Link', cls:'primary', action: async function(close){
              var pmId = parseInt(pSel.value);
              if (!pmId) throw new Error('Select a PM first.');
              await API.procedures.update(pmId, {ts_document_id: doc.id});
              showToast('✓ T/S DM linked to '+pSel.options[pSel.selectedIndex].text);
              close();
              viewDocDetail(id);
            }},
            {label:'Cancel', cls:'', action: async function(close){ close(); }},
          ]);
        };
        pmChipRow.appendChild(linkPmBtn);
        dc.appendChild(pmChipRow);

        // Linked deficiency chips
        if (linkedDefs.length) {
          var defHdr = el('div',{style:'font-size:10px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;',text:'⚠ Deficiencies referencing this T/S DM'});
          dc.appendChild(defHdr);
          var defChips = div(''); defChips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;';
          linkedDefs.forEach(function(d){
            var chip = el('span',{text:'⚠ DEF-'+String(d.id).padStart(4,'0')+': '+d.summary,cls:'ops-link-chip',style:'cursor:pointer;color:#f87171;border-color:#f8717144;'});
            chip.onclick = function(){ navigate('def-detail', d.id); };
            defChips.appendChild(chip);
          });
          dc.appendChild(defChips);
        }
      }).catch(function(){});
      addedAny = false;
    }
    if (ic === '900') {
      // Find FMEA worksheets that reference this 900 DM and add a Push Faults button
      API.fmea.listWorksheets({asset_id: doc.asset_id}).then(wsList => {
        var linked = wsList.filter(w => w.document_id == doc.id); // eslint-disable-line eqeqeq
        linked.forEach(w=>{
          var chip = el('span',{text:'⚡ FMEA Worksheet: '+w.title, cls:'ops-link-chip',
            style:'cursor:pointer;color:#a78bfa;border-color:#a78bfa44;font-weight:700;'});
          chip.onclick = ()=>navigate('fmea-worksheet', w.id);
          linkChips.appendChild(chip);

          var pushBtn = btn('ops-btn-sm','🔄 Merge into FMEA', async ()=>{
            pushBtn.disabled = true; pushBtn.textContent = 'Merging…';
            try {
              var r = await API.fmea.syncFromDm(w.id);
              var parts = [];
              if (r.created) parts.push(r.created+' created');
              if (r.updated) parts.push(r.updated+' enriched');
              showToast('✓ '+r.message);
              pushBtn.textContent = parts.length ? '✓ '+parts.join(', ') : '✓ Up to date';
            } catch(e) {
              showToast('Merge failed: '+(e.message||'Error'));
              pushBtn.disabled = false; pushBtn.textContent = '🔄 Merge into FMEA';
            }
          });
          pushBtn.style.cssText = 'margin-left:10px;background:#2d1f52;color:#a78bfa;border:1px solid #a78bfa44;font-size:12px;padding:3px 10px;border-radius:6px;cursor:pointer;';
          linkChips.appendChild(pushBtn);
        });
        if (linked.length) dc.appendChild(linkChips);
      }).catch(()=>{});
      addedAny = false;
    }
    if (addedAny) dc.appendChild(linkChips);
  }
  fields.forEach(row=>{
    var kv=div('ops-kv'); kv.appendChild(span('ops-kv-key',row[0]));
    if(typeof row[1]==='string') kv.appendChild(span('',row[1])); else kv.appendChild(row[1]);
    kvg.appendChild(kv);
  });
  dc.appendChild(kvg);
  left.appendChild(dc);
  two.appendChild(left);

  // Revision history
  var right = div('');
  var revCard = div('ops-card');
  revCard.appendChild(div('ops-card-header',[el('h3',{text:'Revision History ('+((doc.revisions||[]).length)+')'})]));
  if (!doc.revisions || !doc.revisions.length) {
    var nr=div(''); nr.style.cssText='padding:12px;color:#64748b;font-size:13px;text-align:center;';
    nr.textContent='No revisions yet.'; revCard.appendChild(nr);
  } else {
    revCard.appendChild(makeTable(
      ['Rev','Change Description','File','Author','Approved By','Approved At'],
      doc.revisions.map(r => [
        span('ops-mono ops-badge badge-blue','Rev '+r.revision),
        r.change_desc || span('ops-muted','—'),
        r.file_path ? (()=>{
          var fname = r.file_path.split('/').pop();
          var wrap2 = div(''); wrap2.style.cssText='display:flex;gap:4px;align-items:center;';
          var vBtn = el('a',{href:'#',cls:'ops-link-chip',text:'📄 '+fname});
          vBtn.onclick = e=>{ e.preventDefault(); showFileViewer({name:fname, path:r.file_path, mime:''}); };
          wrap2.appendChild(vBtn);
          return wrap2;
        })() : span('ops-muted','—'),
        r.author || span('ops-muted','—'),
        r.approved_by || span('ops-muted','pending'),
        r.approved_at ? fmtDate(r.approved_at) : span('ops-muted','—'),
      ]),
      null
    ));
  }
  right.appendChild(revCard);
  two.appendChild(right);
  wrap.appendChild(two);

  // ── DM Content Editor (Data Modules only) ────────────────────────────────
  if (isDm) {
    var contentCard = div('ops-card'); contentCard.style.marginTop='16px';
    var contentHdr = div('ops-card-header');
    contentHdr.appendChild(el('h3',{text:'📝 Module Content'}));
    var editContentBtn = btn('ops-btn-sm','✏ Edit Content',()=>{});
    var focusBtn = btn('ops-btn-sm','⛶ Focus Mode', ()=>{});
    contentHdr.appendChild(editContentBtn);
    contentHdr.appendChild(focusBtn);
    contentCard.appendChild(contentHdr);
    var contentBody = div(''); contentBody.style.padding='16px';
    contentCard.appendChild(contentBody);
    wrap.appendChild(contentCard);

    // Load steps then render
    var steps = await API.documents.dmSteps(doc.id).catch(()=>[]);
    renderDmContent(doc, steps, contentBody, editContentBtn, id);
    focusBtn.onclick = () => showFocusEditor(doc, steps, (saved) => {
      steps = saved;
      renderDmContent(doc, steps, contentBody, editContentBtn, id);
    });

    // Personnel / skills requirements — shown for procedure DMs (200/720/730)
    if (['200','720','730'].indexOf(doc.info_code) >= 0) {
      var mpCard = div('ops-card'); mpCard.style.marginTop='16px';
      var mpHdr = div('ops-card-header');
      mpHdr.appendChild(el('h3',{text:'👷 Personnel Requirements'}));
      mpHdr.appendChild(el('span',{text:'S1000D Preliminary Requirements — skills and certs needed to perform this procedure',style:'font-size:11px;color:#475569;margin-left:8px;'}));
      mpCard.appendChild(mpHdr);
      var mpBody = div(''); mpBody.style.padding='16px';
      mpCard.appendChild(mpBody);
      wrap.appendChild(mpCard);
      var dmCanWrite = !!(await canWrite().catch(function(){ return false; }));
      renderManpowerSection('document', doc.id, mpBody, dmCanWrite);
    }
  }

  setContent(wrap);
}

// ── Focus Mode Editor ─────────────────────────────────────────────────────────
function showFocusEditor(doc, initialSteps, onSave) {
  var stepList = initialSteps.map(s => ({...s}));
  var autoSaveTimer = null;
  var dirty = false;
  var lastSaved = null;

  // ── Overlay shell ──────────────────────────────────────────────────────────
  var overlay = div('');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#080d1a;z-index:9999;display:flex;flex-direction:column;font-family:inherit;';

  // ── Top bar ────────────────────────────────────────────────────────────────
  var topBar = div('');
  topBar.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 20px;background:#0d1225;border-bottom:1px solid #1e2540;flex-shrink:0;';

  var exitBtn = btn('', '← Exit Focus', () => closeEditor(false));
  exitBtn.style.cssText = 'background:transparent;border:1px solid #2e3650;color:#64748b;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:12px;';
  exitBtn.onmouseover = () => exitBtn.style.borderColor = '#38bdf8';
  exitBtn.onmouseout  = () => exitBtn.style.borderColor = '#2e3650';

  var dmcLabel = el('span',{text: doc.dmc || 'DMC pending', style:'font-family:monospace;font-size:12px;color:#38bdf8;background:#1e3a5f33;padding:4px 10px;border-radius:4px;border:1px solid #38bdf822;'});
  var issueLabel = el('span',{text:'Issue '+(doc.issue_number||1)+(doc.in_work_number>0?' · In-Work':' · Released'), style:'font-size:11px;color:#475569;'});
  var infoLabel = el('span',{text:(doc.info_code||'')+(doc.info_code?' — ':'')+doc.title, style:'font-size:13px;color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'});

  var saveStatusEl = el('span',{text:'', style:'font-size:11px;color:#475569;min-width:120px;text-align:right;'});

  var saveBtn = btn('', '💾 Save', async () => { await doSave(); });
  saveBtn.style.cssText = 'background:#1e3a5f;border:1px solid #38bdf844;color:#38bdf8;padding:5px 14px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;';

  [exitBtn, dmcLabel, issueLabel, infoLabel, saveStatusEl, saveBtn].forEach(e => topBar.appendChild(e));
  overlay.appendChild(topBar);

  // ── Body ───────────────────────────────────────────────────────────────────
  var body = div('');
  body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

  // ── Left outline panel ─────────────────────────────────────────────────────
  var outline = div('');
  outline.style.cssText = 'width:220px;flex-shrink:0;background:#0d1225;border-right:1px solid #1e2540;overflow-y:auto;padding:16px 0;';
  var outlineTitle = el('div',{text:'OUTLINE', style:'font-size:9px;font-weight:800;letter-spacing:1px;color:#334155;padding:0 16px 10px;'});
  outline.appendChild(outlineTitle);

  // ── Main editor area ───────────────────────────────────────────────────────
  var main = div('');
  main.style.cssText = 'flex:1;overflow-y:auto;padding:32px 48px 80px;max-width:900px;margin:0 auto;width:100%;box-sizing:border-box;';

  body.appendChild(outline);
  body.appendChild(main);
  overlay.appendChild(body);
  document.body.appendChild(overlay);

  // ── Step type config (same families as renderDmContent) ───────────────────
  var TYPE_FAMILIES = {
    proced: {
      types:[
        {v:'title',          l:'Section',         icon:'§',  style:'color:#e2e8f0;font-weight:800;font-size:18px;border:none;background:transparent;width:100%;padding:4px 0;border-bottom:1px solid #1e2540;margin-bottom:4px;'},
        {v:'warning',        l:'Warning',         icon:'⚠',  style:'background:#7f1d1d22;border:1px solid #f8717155;border-radius:6px;padding:10px 14px;color:#f87171;font-weight:600;width:100%;'},
        {v:'caution',        l:'Caution',         icon:'⚡', style:'background:#78350f22;border:1px solid #fb923c55;border-radius:6px;padding:10px 14px;color:#fb923c;font-weight:600;width:100%;'},
        {v:'note',           l:'Note',            icon:'ℹ',  style:'background:#1e3a5f22;border:1px solid #38bdf855;border-radius:6px;padding:10px 14px;color:#38bdf8;width:100%;'},
        {v:'action',         l:'Action',          icon:'▸',  style:'color:#e2e8f0;width:100%;background:transparent;border:none;padding:4px 0;font-size:14px;'},
        {v:'substep',        l:'Sub-step',        icon:'◦',  style:'color:#94a3b8;width:100%;background:transparent;border:none;padding:4px 0 4px 28px;font-size:13px;'},
        {v:'expected_result',l:'Expected Result', icon:'✓',  style:'color:#4ade80;width:100%;background:transparent;border:none;padding:4px 0 4px 16px;font-size:13px;font-style:italic;'},
      ],
    },
    descr: {
      types:[
        {v:'title',    l:'Section Heading', icon:'§', style:'color:#e2e8f0;font-weight:800;font-size:18px;border:none;background:transparent;width:100%;padding:4px 0;border-bottom:1px solid #1e2540;margin-bottom:4px;'},
        {v:'action',   l:'Paragraph',       icon:'¶', style:'color:#94a3b8;width:100%;background:transparent;border:none;padding:4px 0;font-size:14px;line-height:1.8;'},
        {v:'note',     l:'Note',            icon:'ℹ', style:'background:#1e3a5f22;border:1px solid #38bdf855;border-radius:6px;padding:10px 14px;color:#38bdf8;width:100%;'},
        {v:'tech_char',l:'Tech Spec (label|value)', icon:'≡', style:'color:#94a3b8;width:100%;background:transparent;border:none;padding:4px 0;font-family:monospace;font-size:13px;'},
      ],
    },
    parts:   { types:[{v:'part_item',l:'Part Entry',icon:'📦',style:'color:#94a3b8;font-family:monospace;font-size:12px;width:100%;background:transparent;border:none;padding:4px 0;'}] },
    trouble: { types:[
        {v:'symptom',          l:'Symptom',          icon:'⚑',style:'color:#f87171;font-weight:600;width:100%;background:transparent;border:none;padding:4px 0;font-size:14px;'},
        {v:'probable_cause',   l:'Probable Cause',   icon:'→',style:'color:#fbbf24;width:100%;background:transparent;border:none;padding:4px 0 4px 20px;font-size:13px;'},
        {v:'corrective_action',l:'Corrective Action',icon:'✔',style:'color:#4ade80;width:100%;background:transparent;border:none;padding:4px 0 4px 20px;font-size:13px;'},
    ]},
    fault:   { types:[
        {v:'title',  l:'Fault',       icon:'⚑',style:'color:#f87171;font-weight:800;font-size:16px;width:100%;background:transparent;border:none;padding:4px 0;'},
        {v:'warning',l:'Warning',     icon:'⚠',style:'background:#7f1d1d22;border:1px solid #f8717155;border-radius:6px;padding:10px 14px;color:#f87171;font-weight:600;width:100%;'},
        {v:'action', l:'Check/Test',  icon:'▸',style:'color:#e2e8f0;width:100%;background:transparent;border:none;padding:4px 0;font-size:14px;'},
        {v:'substep',l:'Result→Action',icon:'◦',style:'color:#94a3b8;width:100%;background:transparent;border:none;padding:4px 0 4px 28px;font-size:13px;'},
    ]},
  };
  function familyFor(ic) {
    if (['200','720','730'].includes(ic)) return TYPE_FAMILIES.proced;
    if (ic==='040') return TYPE_FAMILIES.descr;
    if (ic==='300') return TYPE_FAMILIES.parts;
    if (ic==='520') return TYPE_FAMILIES.trouble;
    if (ic==='900') return TYPE_FAMILIES.fault;
    return TYPE_FAMILIES.proced;
  }
  var family = familyFor(doc.info_code||'040');
  var defaultType = family.types.find(t=>t.v==='action')?.v || family.types[0].v;

  // ── Outline rebuild ────────────────────────────────────────────────────────
  function rebuildOutline() {
    outline.innerHTML = '';
    outline.appendChild(outlineTitle);
    var headings = stepList.filter(s => s.step_type === 'title');
    if (!headings.length) {
      outline.appendChild(el('div',{text:'No sections yet',style:'font-size:11px;color:#334155;padding:0 16px;'}));
      return;
    }
    headings.forEach((s, i) => {
      var link = el('div',{text:(i+1)+'. '+(s.content||'Untitled Section')});
      link.style.cssText = 'font-size:12px;color:#64748b;padding:6px 16px;cursor:pointer;border-left:2px solid transparent;transition:all .15s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      link.onmouseover = () => { link.style.color='#38bdf8'; link.style.borderLeftColor='#38bdf8'; };
      link.onmouseout  = () => { link.style.color='#64748b'; link.style.borderLeftColor='transparent'; };
      link.onclick = () => {
        var rows = main.querySelectorAll('.focus-step-row');
        var targetIdx = stepList.indexOf(s);
        if (rows[targetIdx]) rows[targetIdx].scrollIntoView({behavior:'smooth',block:'start'});
      };
      outline.appendChild(link);
    });
  }

  // ── Main editor render ─────────────────────────────────────────────────────
  function rebuildEditor() {
    main.innerHTML = '';
    var actionCount = 0;

    stepList.forEach((s, i) => {
      var typeCfg = family.types.find(t=>t.v===s.step_type) || family.types[0];
      var row = div('focus-step-row');
      row.style.cssText = 'display:flex;gap:10px;align-items:flex-start;margin-bottom:6px;group;position:relative;';
      row.dataset.index = i;

      // Gutter: step number or icon
      var gutter = el('div',{text: ['action','substep'].includes(s.step_type) ? String(++actionCount) : typeCfg.icon});
      gutter.style.cssText = 'min-width:28px;text-align:center;padding-top:8px;font-size:11px;color:#334155;flex-shrink:0;font-weight:700;';

      // Content textarea — auto-expands
      var ta2 = el('textarea',{});
      ta2.value = s.content || '';
      ta2.style.cssText = typeCfg.style + ';resize:none;overflow:hidden;min-height:32px;box-sizing:border-box;line-height:1.7;outline:none;font-family:inherit;transition:background .15s;';
      ta2.rows = 1;
      function autoResize() { ta2.style.height='auto'; ta2.style.height=ta2.scrollHeight+'px'; }
      ta2.addEventListener('input', () => {
        stepList[i].content = ta2.value;
        autoResize();
        markDirty();
        if (s.step_type === 'title') rebuildOutline();
      });
      ta2.addEventListener('focus', () => { row.style.background='#0d122533'; });
      ta2.addEventListener('blur',  () => { row.style.background='transparent'; });

      // Keyboard: Enter = new step below, Shift+Enter = newline, Backspace on empty = delete
      ta2.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          var newType = s.step_type === 'title' ? defaultType : s.step_type;
          stepList.splice(i+1, 0, {step_type:newType, content:'', tool_refs:[], part_refs:[]});
          rebuildEditor();
          rebuildOutline();
          // Focus the new row
          setTimeout(() => {
            var rows = main.querySelectorAll('.focus-step-row textarea');
            if (rows[i+1]) rows[i+1].focus();
          }, 0);
        }
        if (e.key === 'Backspace' && !ta2.value && stepList.length > 1) {
          e.preventDefault();
          stepList.splice(i, 1);
          rebuildEditor();
          rebuildOutline();
          setTimeout(() => {
            var rows = main.querySelectorAll('.focus-step-row textarea');
            var prev = Math.max(0, i-1);
            if (rows[prev]) { rows[prev].focus(); var len=rows[prev].value.length; rows[prev].setSelectionRange(len,len); }
          }, 0);
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          // Cycle type forward (shift = backward)
          var idx = family.types.findIndex(t=>t.v===s.step_type);
          var next = e.shiftKey
            ? (idx-1+family.types.length) % family.types.length
            : (idx+1) % family.types.length;
          stepList[i].step_type = family.types[next].v;
          rebuildEditor();
          setTimeout(() => {
            var rows = main.querySelectorAll('.focus-step-row textarea');
            if (rows[i]) rows[i].focus();
          }, 0);
        }
      });

      setTimeout(autoResize, 0);

      // Controls (show on hover)
      var controls = div('');
      controls.style.cssText = 'display:flex;flex-direction:column;gap:2px;opacity:0;transition:opacity .15s;flex-shrink:0;padding-top:6px;';
      row.onmouseover = () => controls.style.opacity='1';
      row.onmouseout  = () => controls.style.opacity='0';

      var typeSel = el('select');
      typeSel.style.cssText = 'background:#0d1225;border:1px solid #1e2540;border-radius:3px;color:#475569;font-size:10px;padding:2px 4px;cursor:pointer;';
      family.types.forEach(t => {
        var o = el('option',{value:t.v, text:t.icon+' '+t.l});
        if (t.v === s.step_type) o.selected = true;
        typeSel.appendChild(o);
      });
      typeSel.onchange = () => { stepList[i].step_type=typeSel.value; rebuildEditor(); setTimeout(()=>{ var rs=main.querySelectorAll('.focus-step-row textarea'); if(rs[i]) rs[i].focus(); },0); };

      var upBtn  = el('button',{text:'↑'}); upBtn.style.cssText='background:transparent;border:none;color:#334155;cursor:pointer;font-size:11px;padding:1px 4px;';
      var dnBtn  = el('button',{text:'↓'}); dnBtn.style.cssText='background:transparent;border:none;color:#334155;cursor:pointer;font-size:11px;padding:1px 4px;';
      var delBtn = el('button',{text:'✕'}); delBtn.style.cssText='background:transparent;border:none;color:#7f1d1d;cursor:pointer;font-size:11px;padding:1px 4px;';

      upBtn.onclick  = () => { if(i>0){[stepList[i-1],stepList[i]]=[stepList[i],stepList[i-1]]; rebuildEditor(); rebuildOutline();} };
      dnBtn.onclick  = () => { if(i<stepList.length-1){[stepList[i+1],stepList[i]]=[stepList[i],stepList[i+1]]; rebuildEditor(); rebuildOutline();} };
      delBtn.onclick = () => { if(stepList.length>0){stepList.splice(i,1); rebuildEditor(); rebuildOutline(); markDirty();} };

      [typeSel, upBtn, dnBtn, delBtn].forEach(b => controls.appendChild(b));

      // Tool/part refs — procedural only, shown below textarea
      var refsRow = null;
      if (['200','720','730'].includes(doc.info_code) && ['action','substep'].includes(s.step_type)) {
        refsRow = div('');
        refsRow.style.cssText = 'display:flex;gap:8px;margin-top:3px;padding-left:38px;';
        var trInp = inp('🔧 Tools…', (s.tool_refs||[]).join(', '));
        var prInp = inp('📦 Parts…', (s.part_refs||[]).join(', '));
        [trInp,prInp].forEach(x=>{ x.style.cssText='flex:1;background:#0d1225;border:1px solid #1e2540;border-radius:4px;padding:3px 8px;color:#64748b;font-size:11px;'; });
        trInp.oninput = () => { stepList[i].tool_refs=trInp.value.split(',').map(x=>x.trim()).filter(Boolean); markDirty(); };
        prInp.oninput = () => { stepList[i].part_refs=prInp.value.split(',').map(x=>x.trim()).filter(Boolean); markDirty(); };
        refsRow.appendChild(trInp); refsRow.appendChild(prInp);
      }

      var contentWrap = div(''); contentWrap.style.cssText='flex:1;';
      contentWrap.appendChild(ta2);
      if (refsRow) contentWrap.appendChild(refsRow);

      row.appendChild(gutter);
      row.appendChild(contentWrap);
      row.appendChild(controls);
      main.appendChild(row);
    });

    // Add step button at bottom
    var addRow = div('');
    addRow.style.cssText = 'display:flex;gap:8px;padding-top:20px;border-top:1px solid #0f172a;margin-top:16px;';
    family.types.forEach(t => {
      var b = btn('', t.icon+' '+t.l, () => {
        stepList.push({step_type:t.v, content:'', tool_refs:[], part_refs:[]});
        rebuildEditor();
        rebuildOutline();
        markDirty();
        setTimeout(() => {
          var rows = main.querySelectorAll('.focus-step-row textarea');
          if (rows[stepList.length-1]) rows[stepList.length-1].focus();
        }, 0);
      });
      b.style.cssText = 'background:#0d1225;border:1px solid #1e2540;color:#475569;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:11px;';
      b.onmouseover=()=>{ b.style.borderColor='#38bdf8'; b.style.color='#38bdf8'; };
      b.onmouseout =()=>{ b.style.borderColor='#1e2540'; b.style.color='#475569'; };
      addRow.appendChild(b);
    });
    main.appendChild(addRow);

    // Keyboard shortcut hint
    var hint = el('div',{text:'Enter = new step  ·  Shift+Enter = line break  ·  Tab = cycle type  ·  Backspace on empty = delete step'});
    hint.style.cssText='font-size:10px;color:#1e2540;margin-top:24px;text-align:center;letter-spacing:.3px;';
    main.appendChild(hint);
  }

  // ── Save logic ─────────────────────────────────────────────────────────────
  function markDirty() {
    dirty = true;
    saveStatusEl.textContent = '● unsaved changes';
    saveStatusEl.style.color = '#f87171';
  }

  async function doSave() {
    saveBtn.disabled = true;
    saveStatusEl.textContent = 'Saving…';
    saveStatusEl.style.color = '#64748b';
    try {
      var payload = stepList.map((s,i) => ({
        step_order:  (i+1)*10,
        step_type:   s.step_type || defaultType,
        content:     s.content || '',
        tool_refs:   JSON.stringify(s.tool_refs||[]),
        part_refs:   JSON.stringify(s.part_refs||[]),
      }));
      var saved = await API.documents.saveSteps(doc.id, {steps: payload});
      stepList = saved.map(s=>({...s}));
      dirty = false;
      lastSaved = new Date();
      saveStatusEl.textContent = '✓ Saved ' + lastSaved.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      saveStatusEl.style.color = '#4ade80';
      if (onSave) onSave(stepList);
    } catch(e) {
      saveStatusEl.textContent = '✕ Save failed';
      saveStatusEl.style.color = '#f87171';
    }
    saveBtn.disabled = false;
  }

  // Auto-save every 45 seconds if dirty
  autoSaveTimer = setInterval(() => { if (dirty) doSave(); }, 45000);

  // ── Close ──────────────────────────────────────────────────────────────────
  function closeEditor(skipDirtyCheck) {
    if (!skipDirtyCheck && dirty) {
      if (!confirm('You have unsaved changes. Save before exiting?')) {
        clearInterval(autoSaveTimer);
        document.body.removeChild(overlay);
        return;
      }
      doSave().then(() => { clearInterval(autoSaveTimer); document.body.removeChild(overlay); });
      return;
    }
    clearInterval(autoSaveTimer);
    document.body.removeChild(overlay);
  }

  // Escape key exits
  var escHandler = e => { if (e.key === 'Escape') closeEditor(false); };
  document.addEventListener('keydown', escHandler);
  overlay.addEventListener('remove', () => document.removeEventListener('keydown', escHandler));

  // Ctrl+S saves
  document.addEventListener('keydown', function ctrlS(e) {
    if ((e.ctrlKey||e.metaKey) && e.key==='s') {
      e.preventDefault();
      doSave();
    }
  });

  // Initial render
  rebuildEditor();
  rebuildOutline();

  // Focus first empty or last textarea
  setTimeout(() => {
    var rows = main.querySelectorAll('.focus-step-row textarea');
    var target = stepList.findIndex(s=>!s.content);
    if (target >= 0 && rows[target]) rows[target].focus();
    else if (rows.length) rows[rows.length-1].focus();
  }, 50);
}

// ── DM Content Renderer & Editor ─────────────────────────────────────────────
function renderDmContent(doc, steps, container, editBtn, docId) {
  container.innerHTML = '';

  var ic = doc.info_code || '200';

  // ── Step type config per info code family ─────────────────────────────────
  var STEP_CONFIG = {
    proced: { // 200, 720, 730
      types: [
        {v:'title',          l:'Section Title',    style:'color:#e2e8f0;font-weight:800;font-size:14px;border-bottom:1px solid #1e2540;padding-bottom:4px;margin:16px 0 8px;'},
        {v:'warning',        l:'Warning',          style:'background:#7f1d1d33;border:1px solid #f8717166;border-radius:6px;padding:8px 12px;color:#f87171;font-weight:600;'},
        {v:'caution',        l:'Caution',          style:'background:#78350f33;border:1px solid #fb923c66;border-radius:6px;padding:8px 12px;color:#fb923c;font-weight:600;'},
        {v:'note',           l:'Note',             style:'background:#1e3a5f33;border:1px solid #38bdf866;border-radius:6px;padding:8px 12px;color:#38bdf8;'},
        {v:'action',         l:'Action Step',      style:'color:#e2e8f0;'},
        {v:'substep',        l:'Sub-Step',         style:'color:#94a3b8;padding-left:24px;'},
        {v:'expected_result',l:'Expected Result',  style:'color:#4ade80;padding-left:12px;font-style:italic;'},
      ],
      addLabel: '+ Add Step',
    },
    descr: { // 040
      types: [
        {v:'title',    l:'Section Heading', style:'color:#e2e8f0;font-weight:800;font-size:14px;border-bottom:1px solid #1e2540;padding-bottom:4px;margin:16px 0 8px;'},
        {v:'action',   l:'Paragraph',       style:'color:#94a3b8;line-height:1.7;'},
        {v:'note',     l:'Note',            style:'background:#1e3a5f33;border:1px solid #38bdf866;border-radius:6px;padding:8px 12px;color:#38bdf8;'},
        {v:'tech_char',l:'Tech Characteristic (label|value)', style:'color:#94a3b8;font-family:monospace;font-size:12px;'},
      ],
      addLabel: '+ Add Section / Paragraph',
    },
    parts: { // 300 — each step_type='part_item', content = JSON {item,nsn,part_num,nomenclature,qty,unit,remarks}
      types: [{v:'part_item',l:'Part Entry',style:''}],
      addLabel: '+ Add Part',
    },
    trouble: { // 520
      types: [
        {v:'symptom',          l:'Symptom',          style:'color:#f87171;font-weight:600;'},
        {v:'probable_cause',   l:'Probable Cause',   style:'color:#fbbf24;padding-left:16px;'},
        {v:'corrective_action',l:'Corrective Action',style:'color:#4ade80;padding-left:16px;'},
      ],
      addLabel: '+ Add Symptom Group',
    },
    fault: { // 900
      types: [
        {v:'title',    l:'Fault Description',style:'color:#e2e8f0;font-weight:800;font-size:14px;'},
        {v:'warning',  l:'Warning',          style:'background:#7f1d1d33;border:1px solid #f8717166;border-radius:6px;padding:8px 12px;color:#f87171;font-weight:600;'},
        {v:'action',   l:'Check / Test',     style:'color:#e2e8f0;'},
        {v:'substep',  l:'Result → Action',  style:'color:#94a3b8;padding-left:24px;'},
      ],
      addLabel: '+ Add Step',
    },
  };

  function cfgFor(infoCode) {
    if (['200','720','730'].includes(infoCode)) return STEP_CONFIG.proced;
    if (infoCode === '040') return STEP_CONFIG.descr;
    if (infoCode === '300') return STEP_CONFIG.parts;
    if (infoCode === '520') return STEP_CONFIG.trouble;
    if (infoCode === '900') return STEP_CONFIG.fault;
    return STEP_CONFIG.proced;
  }
  var cfg = cfgFor(ic);

  // ── VIEW MODE ─────────────────────────────────────────────────────────────
  function renderView() {
    container.innerHTML = '';
    if (!steps.length) {
      container.appendChild(el('div',{text:'No content yet. Click "✏ Edit Content" to start authoring.',style:'color:#475569;font-size:13px;text-align:center;padding:24px 0;'}));
      return;
    }

    if (ic === '300') {
      // Parts table
      var tbl = makeTable(
        ['Item','NSN','Part Number','Nomenclature','Qty','Unit','Remarks'],
        steps.map((s,i) => {
          var p = {}; try { p=JSON.parse(s.content||'{}'); } catch(e){}
          return [String(i+1), p.nsn||'—', p.part_num||'—', p.nomenclature||'—', p.qty||'—', p.unit||'—', p.remarks||'—'];
        }), null
      );
      container.appendChild(tbl);
      return;
    }

    if (ic === '520') {
      // Troubleshooting three-column table
      var rows = [];
      var cur = {};
      steps.forEach(s => {
        if (s.step_type==='symptom')           { cur={symptom:s.content}; }
        else if (s.step_type==='probable_cause')  { cur.cause=s.content; }
        else if (s.step_type==='corrective_action') { cur.action=s.content; rows.push(cur); cur={}; }
      });
      var tbl2 = makeTable(['Symptom','Probable Cause','Corrective Action'],
        rows.map(r=>[r.symptom||'—',r.cause||'—',r.action||'—']), null);
      container.appendChild(tbl2);
      return;
    }

    // Procedural / Descriptive / Fault — sequential step rendering
    var actionCount = 0;
    steps.forEach(s => {
      var typeCfg = cfg.types.find(t=>t.v===s.step_type) || cfg.types[0];
      var row = div(''); row.style.cssText='display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;';

      // Step number badge for action/substep types
      if (['action','substep','check'].includes(s.step_type)) {
        actionCount++;
        var badge = el('span',{text:String(actionCount),style:'min-width:22px;height:22px;border-radius:50%;background:#1e3a5f;color:#38bdf8;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;'});
        row.appendChild(badge);
      } else if (['warning','caution'].includes(s.step_type)) {
        var icon = el('span',{text:s.step_type==='warning'?'⚠':'⚡',style:'font-size:16px;flex-shrink:0;'});
        row.appendChild(icon);
      } else {
        row.appendChild(el('span',{style:'min-width:22px;'}));
      }

      var txt = div(''); txt.style.cssText=typeCfg.style+';flex:1;font-size:13px;line-height:1.6;';

      if (ic==='040' && s.step_type==='tech_char') {
        // Render as label|value table row
        var parts = (s.content||'').split('|');
        txt.style.cssText='flex:1;display:grid;grid-template-columns:180px 1fr;gap:8px;font-size:12px;color:#94a3b8;border-bottom:1px solid #1e2540;padding:4px 0;';
        txt.appendChild(el('span',{text:parts[0]||'',style:'color:#64748b;'}));
        txt.appendChild(el('span',{text:parts[1]||'',style:'color:#e2e8f0;font-family:monospace;'}));
      } else {
        txt.textContent = s.content || '';
      }
      // Tool/part refs — append txt directly or wrap it; decide before touching the DOM
      if (s.tool_refs?.length || s.part_refs?.length) {
        var refs = div(''); refs.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;';
        (s.tool_refs||[]).forEach(t=>refs.appendChild(el('span',{text:'🔧 '+t,style:'background:#1e2540;color:#94a3b8;font-size:10px;padding:2px 6px;border-radius:4px;'})));
        (s.part_refs||[]).forEach(p=>refs.appendChild(el('span',{text:'📦 '+p,style:'background:#1e2540;color:#94a3b8;font-size:10px;padding:2px 6px;border-radius:4px;'})));
        var withRefs=div(''); withRefs.style.flex='1';
        withRefs.appendChild(txt); withRefs.appendChild(refs);
        row.appendChild(withRefs);
      } else {
        row.appendChild(txt);
      }

      container.appendChild(row);
    });
  }

  // ── EDIT MODE ─────────────────────────────────────────────────────────────
  function renderEdit() {
    container.innerHTML = '';
    var stepList = steps.map(s=>({...s}));  // working copy

    function rebuildEditor() {
      container.innerHTML = '';

      if (ic === '300') {
        // Parts table editor
        var partsGrid = div(''); partsGrid.style.cssText='display:flex;flex-direction:column;gap:6px;';
        stepList.forEach((s,i) => {
          var p = {}; try { p=JSON.parse(s.content||'{}'); } catch(e){}
          var row = div(''); row.style.cssText='display:grid;grid-template-columns:50px 1fr 1fr 2fr 60px 60px 1fr 32px;gap:6px;align-items:center;';
          function pi(ph,val) { var x=inp(ph,val||''); x.style.cssText='background:#0f172a;border:1px solid #2e3650;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px;width:100%;'; return x; }
          var nsn=pi('NSN',p.nsn), pnum=pi('Part #',p.part_num), nom=pi('Nomenclature',p.nomenclature), qty=pi('Qty',p.qty), unit=pi('Unit',p.unit), rmk=pi('Remarks',p.remarks);
          row.appendChild(el('span',{text:String(i+1),style:'color:#475569;font-size:11px;text-align:center;'}));
          [nsn,pnum,nom,qty,unit,rmk].forEach(x=>row.appendChild(x));
          var delB=btn('ops-btn-sm ops-btn-danger','✕',()=>{ stepList.splice(i,1); rebuildEditor(); });
          row.appendChild(delB);
          [nsn,pnum,nom,qty,unit,rmk].forEach(x=>{ x.oninput=()=>{ stepList[i].content=JSON.stringify({nsn:nsn.value,part_num:pnum.value,nomenclature:nom.value,qty:qty.value,unit:unit.value,remarks:rmk.value}); }; });
          partsGrid.appendChild(row);
        });
        var addRow=div(''); addRow.style.cssText='display:grid;grid-template-columns:50px 1fr 1fr 2fr 60px 60px 1fr 32px;gap:6px;align-items:center;font-size:10px;color:#475569;padding:4px 0;';
        addRow.appendChild(el('span',{text:'NSN'})); addRow.appendChild(el('span',{text:'Part #'})); addRow.appendChild(el('span',{text:'Nomenclature'})); addRow.appendChild(el('span',{text:'Qty'})); addRow.appendChild(el('span',{text:'Unit'})); addRow.appendChild(el('span',{text:'Remarks'}));
        partsGrid.appendChild(addRow);
        container.appendChild(partsGrid);

      } else if (ic === '520') {
        // Troubleshooting editor — groups of 3
        var groups = [];
        for (var gi=0; gi<stepList.length; gi+=3) groups.push(stepList.slice(gi,gi+3));
        groups.forEach((grp,gi) => {
          var grpDiv = div(''); grpDiv.style.cssText='border:1px solid #2e3650;border-radius:8px;padding:12px;margin-bottom:10px;';
          ['Symptom','Probable Cause','Corrective Action'].forEach((lbl,li) => {
            var s = grp[li] || {step_type:['symptom','probable_cause','corrective_action'][li],content:''};
            var ta2 = el('textarea',{text:s.content||''}); ta2.rows=2; ta2.style.cssText='width:100%;background:#0f172a;border:1px solid #2e3650;border-radius:4px;padding:6px 8px;color:#e2e8f0;font-size:12px;resize:vertical;margin-bottom:6px;';
            ta2.oninput=()=>{ stepList[gi*3+li]=(stepList[gi*3+li]||{}); stepList[gi*3+li].content=ta2.value; stepList[gi*3+li].step_type=['symptom','probable_cause','corrective_action'][li]; };
            grpDiv.appendChild(el('div',{text:lbl,style:'font-size:10px;font-weight:700;text-transform:uppercase;color:#475569;margin-bottom:3px;'}));
            grpDiv.appendChild(ta2);
          });
          var delGrp=btn('ops-btn-sm ops-btn-danger','✕ Remove',()=>{ stepList.splice(gi*3,3); rebuildEditor(); });
          grpDiv.appendChild(delGrp);
          container.appendChild(grpDiv);
        });

      } else {
        // Procedural / Descriptive / Fault step list
        stepList.forEach((s,i) => {
          var typeCfg = cfg.types.find(t=>t.v===s.step_type)||cfg.types[0];
          var row = div(''); row.style.cssText='display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;background:#0d1117;border:1px solid #1e2540;border-radius:6px;padding:8px 10px;';

          // Type selector
          var typeSel = el('select'); typeSel.style.cssText='background:#0f172a;border:1px solid #2e3650;border-radius:4px;color:#94a3b8;font-size:11px;padding:3px 6px;flex-shrink:0;';
          cfg.types.forEach(t=>{ var o=el('option',{value:t.v,text:t.l}); if(t.v===s.step_type) o.selected=true; typeSel.appendChild(o); });
          typeSel.onchange=()=>{ stepList[i].step_type=typeSel.value; };

          // Content area
          var contentEl = el('textarea',{}); contentEl.rows=2;
          contentEl.style.cssText='flex:1;background:#0f172a;border:1px solid #2e3650;border-radius:4px;padding:6px 8px;color:#e2e8f0;font-size:12px;resize:vertical;line-height:1.5;';
          contentEl.value = s.content||'';
          contentEl.oninput=()=>{ stepList[i].content=contentEl.value; };

          // Tool/part refs (procedural only)
          var refsSection = div(''); refsSection.style.cssText='display:flex;flex-direction:column;gap:4px;min-width:140px;';
          if (['200','720','730'].includes(ic)) {
            var trInp = inp('Tools (comma-sep)', (s.tool_refs||[]).join(', ')); trInp.style.cssText='background:#0f172a;border:1px solid #1e2540;border-radius:4px;padding:3px 6px;color:#94a3b8;font-size:10px;';
            var prInp = inp('Parts (comma-sep)', (s.part_refs||[]).join(', ')); prInp.style.cssText='background:#0f172a;border:1px solid #1e2540;border-radius:4px;padding:3px 6px;color:#94a3b8;font-size:10px;';
            trInp.oninput=()=>{ stepList[i].tool_refs=trInp.value.split(',').map(x=>x.trim()).filter(Boolean); };
            prInp.oninput=()=>{ stepList[i].part_refs=prInp.value.split(',').map(x=>x.trim()).filter(Boolean); };
            refsSection.appendChild(el('span',{text:'Tools',style:'font-size:9px;color:#334155;text-transform:uppercase;'})); refsSection.appendChild(trInp);
            refsSection.appendChild(el('span',{text:'Parts',style:'font-size:9px;color:#334155;text-transform:uppercase;'})); refsSection.appendChild(prInp);
          }

          // Up/Down/Delete controls
          var ctrls = div(''); ctrls.style.cssText='display:flex;flex-direction:column;gap:3px;flex-shrink:0;';
          var upB=btn('ops-btn-sm','↑',()=>{ if(i>0){[stepList[i-1],stepList[i]]=[stepList[i],stepList[i-1]]; rebuildEditor();} });
          var dnB=btn('ops-btn-sm','↓',()=>{ if(i<stepList.length-1){[stepList[i+1],stepList[i]]=[stepList[i],stepList[i+1]]; rebuildEditor();} });
          var dlB=btn('ops-btn-sm ops-btn-danger','✕',()=>{ stepList.splice(i,1); rebuildEditor(); });
          [upB,dnB,dlB].forEach(b=>{ b.style.padding='2px 6px'; ctrls.appendChild(b); });

          row.appendChild(typeSel);
          row.appendChild(contentEl);
          if (['200','720','730'].includes(ic)) row.appendChild(refsSection);
          row.appendChild(ctrls);
          container.appendChild(row);
        });
      }

      // Add step / add group / add part button
      var addBtn = btn('ops-btn-sm','+ '+(cfg.addLabel||'Add Step'), () => {
        if (ic==='300') {
          stepList.push({step_type:'part_item',content:'{}',tool_refs:[],part_refs:[]});
        } else if (ic==='520') {
          stepList.push({step_type:'symptom',content:'',tool_refs:[],part_refs:[]});
          stepList.push({step_type:'probable_cause',content:'',tool_refs:[],part_refs:[]});
          stepList.push({step_type:'corrective_action',content:'',tool_refs:[],part_refs:[]});
        } else {
          stepList.push({step_type:cfg.types.find(t=>t.v==='action')?.v||cfg.types[0].v,content:'',tool_refs:[],part_refs:[]});
        }
        rebuildEditor();
      });
      addBtn.style.marginTop='10px';
      container.appendChild(addBtn);

      // Save / Cancel
      var actRow = div(''); actRow.style.cssText='display:flex;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid #1e2540;';
      var saveB = btn('primary ops-btn-sm','💾 Save Content', async () => {
        saveB.disabled=true; saveB.textContent='Saving…';
        try {
          var payload = stepList.map((s,i)=>({
            step_order:  (i+1)*10,
            step_type:   s.step_type||cfg.types[0].v,
            content:     s.content||'',
            tool_refs:   JSON.stringify(s.tool_refs||[]),
            part_refs:   JSON.stringify(s.part_refs||[]),
          }));
          steps = await API.documents.saveSteps(docId, {steps: payload});
          editBtn.textContent='✏ Edit Content';
          editBtn.onclick=()=>{ renderEdit(); editBtn.textContent='← View'; editBtn.onclick=()=>{ renderView(); editBtn.textContent='✏ Edit Content'; editBtn.onclick=()=>renderEdit(); }; };
          renderView();
        } catch(e) { saveB.disabled=false; saveB.textContent='💾 Save Content'; alert('Save failed: '+e.message); }
      });
      var cancelB = btn('ops-btn-sm','Cancel', ()=>{
        steps = steps;  // revert working copy on cancel
        stepList.length=0; steps.forEach(s=>stepList.push({...s}));
        renderView();
        editBtn.textContent='✏ Edit Content';
        editBtn.onclick=()=>renderEdit();
      });
      actRow.appendChild(saveB); actRow.appendChild(cancelB);
      container.appendChild(actRow);
    }

    rebuildEditor();
  }

  // Wire edit button
  editBtn.onclick = () => {
    renderEdit();
    editBtn.textContent = '← View';
    editBtn.onclick = () => { renderView(); editBtn.textContent='✏ Edit Content'; editBtn.onclick=()=>renderEdit(); };
  };

  renderView();
}

// ── Publication constants ─────────────────────────────────────────────────────
var PUB_TYPES = [
  ['MM',  '📘 MM — Maintenance Manual'],
  ['FM',  '🪖 FM — Field Manual'],
  ['IPD', '📦 IPD — Illustrated Parts Data'],
  ['OM',  '🎛 OM — Operator\'s Manual'],
  ['SM',  '📐 SM — Service Manual'],
];
var PUB_TYPE_COLORS = {MM:'badge-blue', FM:'badge-green', IPD:'badge-amber', OM:'badge-purple', SM:'badge-gray'};
function pubTypeBadge(t) { return span('ops-badge '+(PUB_TYPE_COLORS[t]||'badge-gray'), t||'—'); }

// ── Library picker — three-card entry point ────────────────────────────────────
function showLibraryPicker(defaultAssetId, onSave) {
  var overlay = div(''); overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:3000;display:flex;align-items:center;justify-content:center;';
  var dialog = div(''); dialog.style.cssText='background:#0f172a;border:1px solid #1e2540;border-radius:14px;padding:32px;width:640px;max-width:96vw;';
  dialog.appendChild(el('h3',{text:'Add to Library',style:'margin:0 0 8px;font-size:18px;color:#e2e8f0;'}));
  dialog.appendChild(el('p',{text:'What would you like to create?',style:'margin:0 0 24px;color:#64748b;font-size:13px;'}));

  var cards = div(''); cards.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:14px;';

  function card(icon, title, sub, docType, accent) {
    var c = div(''); c.style.cssText='background:#1a1f2e;border:2px solid #1e2540;border-radius:10px;padding:20px 16px;cursor:pointer;transition:all .15s;text-align:center;';
    c.appendChild(el('div',{text:icon,style:'font-size:28px;margin-bottom:10px;'}));
    c.appendChild(el('div',{text:title,style:'font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:5px;'}));
    c.appendChild(el('div',{text:sub,style:'font-size:11px;color:#475569;line-height:1.4;'}));
    c.onmouseover=()=>{ c.style.borderColor=accent; c.style.background='#1e2540'; };
    c.onmouseout =()=>{ c.style.borderColor='#1e2540'; c.style.background='#1a1f2e'; };
    c.onclick = () => {
      document.body.removeChild(overlay);
      if (docType === 'publication') {
        showDocumentForm(null, defaultAssetId, onSave, 'publication');
      } else {
        showDocumentForm(null, defaultAssetId, onSave, docType);
      }
    };
    return c;
  }

  cards.appendChild(card('📎','External Document','PDF, drawing, SOP, spec, or any reference file','external','#64748b'));
  cards.appendChild(card('📘','Data Module','Author an S1000D DM — procedures, descriptions, parts data','data_module','#38bdf8'));
  cards.appendChild(card('📖','Publication','Assemble Data Modules into a complete technical manual (MM, FM, IPD, OM)','publication','#a78bfa'));

  var closeRow = div(''); closeRow.style.cssText='margin-top:20px;text-align:right;';
  closeRow.appendChild(btn('','Cancel',()=>document.body.removeChild(overlay)));
  dialog.appendChild(cards);
  dialog.appendChild(closeRow);
  overlay.appendChild(dialog);
  overlay.onclick = e => { if(e.target===overlay) document.body.removeChild(overlay); };
  document.body.appendChild(overlay);
}

// ── Publication builder (embedded in viewDocDetail for doc_type='publication') ──
async function renderPublicationDetail(doc, wrap, reload) {
  var pubId = doc.id;

  // Load state
  var pubDms   = await API.documents.listPubDms(pubId).catch(()=>[]);
  var assetDms = doc.asset_id
    ? (await API.documents.list({asset_id: doc.asset_id}).catch(()=>[])).filter(d=>d.doc_type==='data_module')
    : [];

  // Chapters state — derived from existing DMs, always at least §1
  var chaptersState = [];
  var seen = new Set();
  pubDms.sort((a,b)=>a.chapter-b.chapter).forEach(e=>{
    if (!seen.has(e.chapter)) { seen.add(e.chapter); chaptersState.push({num:e.chapter, title:e.chapter_title||'Chapter '+e.chapter}); }
  });
  if (!chaptersState.length) chaptersState = [{num:1,title:'Chapter 1'}];

  var armedChapter = null; // number while user is picking a DM to add

  // ── Re-issue banner ────────────────────────────────────────────────────────
  if (doc.re_issue_required) {
    var riBanner = div(''); riBanner.style.cssText='background:#78350f33;border:1px solid #fbbf2444;border-radius:8px;padding:10px 16px;display:flex;align-items:center;gap:10px;margin-bottom:14px;';
    riBanner.appendChild(el('span',{text:'⚠',style:'font-size:18px;'}));
    var riTxt = div('');
    riTxt.appendChild(el('div',{text:'Re-Issue Required',style:'font-weight:700;color:#fbbf24;font-size:13px;'}));
    riTxt.appendChild(el('div',{text:'One or more constituent Data Modules have advanced to a new issue. Review and release a new issue of this publication.',style:'color:#94a3b8;font-size:11px;margin-top:2px;'}));
    riBanner.appendChild(riTxt);
    wrap.appendChild(riBanner);
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────
  var tabBar = div(''); tabBar.style.cssText='display:flex;gap:0;border-bottom:2px solid #1e2540;margin-bottom:16px;';
  var tabContent = div('');
  function makeTab(label, key) {
    var t = el('button',{text:label}); t.dataset.key=key;
    t.style.cssText='padding:8px 22px;font-size:12px;font-weight:600;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;';
    t.onclick=()=>{ showTab(key); };
    tabBar.appendChild(t); return t;
  }
  var userCanEdit = await (async()=>{ try{return await canWrite();}catch(e){return false;} })();
  var tabIetm    = makeTab('📖 IETM View','ietm');
  var tabBuilder = userCanEdit ? makeTab('🔧 Builder','builder') : null;
  function showTab(key) {
    [tabIetm, tabBuilder].filter(Boolean).forEach(t=>{
      var a=t.dataset.key===key;
      t.style.borderBottomColor=a?'#38bdf8':'transparent';
      t.style.color=a?'#38bdf8':'#64748b';
    });
    renderTabContent(key);
  }
  wrap.appendChild(tabBar);
  wrap.appendChild(tabContent);

  // ── Builder tab ────────────────────────────────────────────────────────────
  function renderTabContent(key) {
    tabContent.innerHTML='';
    if (key==='builder') renderBuilder();
    else renderIetmTab();
  }

  function renderBuilder() {
    var grid = div(''); grid.style.cssText='display:grid;grid-template-columns:270px 1fr;gap:14px;height:calc(100vh - 240px);';
    tabContent.appendChild(grid);

    // ── Left: Available DMs ──────────────────────────────────────────────────
    var leftCard = div('ops-card'); leftCard.style.cssText='display:flex;flex-direction:column;overflow:hidden;';
    leftCard.appendChild(div('ops-card-header',[el('h3',{text:'Data Modules'})]));
    var icFilter = sel([['','All types']].concat(S1000D_INFO_CODES.map(x=>[x[0],x[0]+' — '+x[1].replace(/^[^\s]+\s/,'')])), '');
    icFilter.style.cssText='flex:1;background:#0f172a;border:1px solid #2e3650;border-radius:4px;color:#94a3b8;font-size:11px;padding:4px;';
    var filterRow=div(''); filterRow.style.cssText='padding:8px 12px;border-bottom:1px solid #1e2540;';
    filterRow.appendChild(icFilter);
    leftCard.appendChild(filterRow);

    var armedBanner = div(''); armedBanner.style.cssText='display:none;padding:6px 12px;background:#1e3a5f;border-bottom:1px solid #38bdf844;font-size:11px;color:#38bdf8;';
    leftCard.appendChild(armedBanner);

    var dmList = div(''); dmList.style.cssText='flex:1;overflow-y:auto;padding:6px;';
    leftCard.appendChild(dmList);
    grid.appendChild(leftCard);

    // ── Right: Chapter structure ─────────────────────────────────────────────
    var rightCard = div('ops-card'); rightCard.style.cssText='display:flex;flex-direction:column;overflow:hidden;';
    var rightHdr = div('ops-card-header');
    rightHdr.appendChild(el('h3',{text:'Publication Structure'}));
    var addChapBtn = btn('ops-btn-sm','+ Chapter',addChapter);
    var releaseBtn = btn('ops-btn-sm','🚀 Release Issue '+doc.issue_number, releasePub);
    releaseBtn.style.cssText+='margin-left:auto;';
    rightHdr.appendChild(addChapBtn);
    rightHdr.appendChild(releaseBtn);
    rightCard.appendChild(rightHdr);

    var chapList = div(''); chapList.style.cssText='flex:1;overflow-y:auto;padding:12px;';
    rightCard.appendChild(chapList);
    grid.appendChild(rightCard);

    function refreshDms() { pubDms.sort((a,b)=> a.chapter!==b.chapter ? a.chapter-b.chapter : a.sequence-b.sequence); }

    function renderLeft() {
      dmList.innerHTML='';
      var inPub = new Set(pubDms.map(e=>e.document_id));
      var filtered = assetDms.filter(d => !icFilter.value || d.info_code===icFilter.value);

      if (!filtered.length) {
        dmList.appendChild(el('div',{text: assetDms.length ? 'No DMs match filter' : 'No Data Modules linked to this asset.',style:'color:#475569;font-size:12px;padding:12px;text-align:center;'}));
        return;
      }

      if (armedChapter !== null) {
        armedBanner.style.display='';
        armedBanner.textContent = '→ Click a DM to add to §'+armedChapter+' — or click the chapter again to cancel';
      } else {
        armedBanner.style.display='none';
      }

      filtered.forEach(d => {
        var already = inPub.has(d.id);
        var row = div(''); row.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin-bottom:3px;cursor:pointer;border:1px solid transparent;transition:all .15s;background:#0d1225;';
        var tag = el('span',{text:d.info_code||'?',style:'font-size:10px;font-weight:800;font-family:monospace;color:#38bdf8;background:#1e3a5f33;padding:2px 5px;border-radius:3px;flex-shrink:0;'});
        var nameEl = div(''); nameEl.style.cssText='flex:1;min-width:0;';
        nameEl.appendChild(el('div',{text:d.title,style:'font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}));
        if (d.dmc) nameEl.appendChild(el('div',{text:d.dmc,style:'font-size:10px;color:#334155;font-family:monospace;'}));
        var indicator = el('span',{text: armedChapter!==null && !already ? '→ Add' : already ? '✓' : '+ Add',
          style:'font-size:10px;flex-shrink:0;color:'+(already?'#4ade80':armedChapter!==null?'#a78bfa':'#38bdf8')+';font-weight:700;'});
        row.appendChild(tag); row.appendChild(nameEl); row.appendChild(indicator);

        if (!already && armedChapter !== null) {
          row.onmouseover=()=>{ row.style.borderColor='#a78bfa44'; row.style.background='#1e2540'; };
          row.onmouseout =()=>{ row.style.borderColor='transparent'; row.style.background='#0d1225'; };
          row.onclick = async () => {
            var chapNum = armedChapter;
            armedChapter = null;
            var newEntry = await API.documents.addPubDm(pubId, {
              document_id: d.id, chapter: chapNum,
              chapter_title: chaptersState.find(c=>c.num===chapNum)?.title || 'Chapter '+chapNum
            });
            pubDms.push(Object.assign(newEntry, {doc_title:d.title,info_code:d.info_code,dmc:d.dmc,issue_number:d.issue_number,in_work_number:d.in_work_number,dmc_review_flag:d.dmc_review_flag}));
            renderLeft(); renderRight();
          };
        } else if (!already) {
          row.onclick = () => { showToast('Click "+ Chapter" to create a chapter, then click "+ Add DM" on that chapter.'); };
        }
        dmList.appendChild(row);
      });
    }
    icFilter.onchange = renderLeft;

    function renderRight() {
      chapList.innerHTML='';
      refreshDms();
      if (!chaptersState.length) {
        chapList.appendChild(el('div',{text:'No chapters yet. Click "+ Chapter" to begin.',style:'color:#475569;font-size:13px;text-align:center;padding:24px;'}));
        return;
      }

      chaptersState.forEach((chap, ci) => {
        var inChap = pubDms.filter(e=>e.chapter===chap.num);
        var isArmed = armedChapter === chap.num;

        var chapDiv = div(''); chapDiv.style.cssText='margin-bottom:14px;';

        // Chapter header
        var chapHdr = div(''); chapHdr.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:6px 6px 0 0;border:1px solid '+(isArmed?'#a78bfa':'#1e2540')+';border-bottom:none;background:'+(isArmed?'#1e1a3f':'#0d1225')+';transition:all .15s;';
        var chapNumEl = el('span',{text:'§'+chap.num,style:'font-size:11px;font-weight:800;font-family:monospace;color:'+(isArmed?'#a78bfa':'#38bdf8')+';flex-shrink:0;'});
        var chapTitleEl = el('span',{text:chap.title,style:'font-size:13px;font-weight:700;color:#e2e8f0;flex:1;cursor:text;outline:none;'});
        chapTitleEl.contentEditable='true';
        chapTitleEl.onblur = async () => {
          var newTitle = chapTitleEl.textContent.trim() || 'Chapter '+chap.num;
          chap.title = newTitle;
          var updates = pubDms.filter(e=>e.chapter===chap.num).map(e=>({id:e.id,chapter:e.chapter,section:e.section,sequence:e.sequence,chapter_title:newTitle}));
          if (updates.length) await API.documents.reorderPubDms(pubId, {dms: updates});
        };
        var addDmBtn = btn('ops-btn-sm', isArmed ? '✕ Cancel' : '+ Add DM', () => {
          armedChapter = isArmed ? null : chap.num;
          renderLeft(); renderRight();
        });
        addDmBtn.style.cssText='font-size:10px;padding:2px 8px;'+(isArmed?'color:#f87171;border-color:#f8717144;':'');
        var remChapBtn = btn('ops-btn-sm','✕', async () => {
          if (inChap.length && !confirm('Remove §'+chap.num+' and all its DMs from the publication?')) return;
          for (var e of inChap) await API.documents.removePubDm(pubId, e.id);
          pubDms = pubDms.filter(e=>e.chapter!==chap.num);
          chaptersState.splice(ci,1);
          if (!chaptersState.length) chaptersState=[{num:1,title:'Chapter 1'}];
          renderLeft(); renderRight();
        });
        remChapBtn.style.cssText='font-size:10px;padding:2px 6px;color:#f87171;border-color:#f8717133;';
        chapHdr.appendChild(chapNumEl); chapHdr.appendChild(chapTitleEl);
        chapHdr.appendChild(addDmBtn); chapHdr.appendChild(remChapBtn);
        chapDiv.appendChild(chapHdr);

        // DM rows
        var chapBody = div(''); chapBody.style.cssText='border:1px solid '+(isArmed?'#a78bfa':'#1e2540')+';border-radius:0 0 6px 6px;overflow:hidden;transition:all .15s;';
        if (!inChap.length) {
          var emptyRow = div(''); emptyRow.style.cssText='padding:10px 16px;color:#334155;font-size:12px;font-style:italic;text-align:center;background:#080d1a;';
          emptyRow.textContent = isArmed ? '← Select a Data Module from the left panel' : 'Empty — click "+ Add DM" to populate';
          chapBody.appendChild(emptyRow);
        } else {
          inChap.forEach((e,ei) => {
            var row = div(''); row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid #0f172a;background:'+(ei%2===0?'#0d1225':'#080d1a')+';';
            var seqEl = el('span',{text:chap.num+'.'+String(ei+1),style:'font-size:10px;color:#334155;font-family:monospace;min-width:28px;font-weight:700;flex-shrink:0;'});
            var tag   = el('span',{text:e.info_code||'—',style:'font-size:10px;font-weight:800;font-family:monospace;color:#38bdf8;background:#1e3a5f33;padding:2px 5px;border-radius:3px;flex-shrink:0;'});
            var tEl   = div(''); tEl.style.cssText='flex:1;min-width:0;';
            tEl.appendChild(el('div',{text:e.doc_title||'—',style:'font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}));
            if (e.dmc) tEl.appendChild(el('div',{text:e.dmc,style:'font-size:10px;color:#334155;font-family:monospace;'}));
            if (e.dmc_review_flag) tEl.appendChild(el('span',{text:'⚠ Updated',style:'font-size:10px;color:#fbbf24;font-weight:700;margin-left:4px;'}));
            var isRel = !e.in_work_number;
            var issueEl = el('span',{text:'I'+e.issue_number+(isRel?'':' WIP'),style:'font-size:10px;font-family:monospace;color:'+(isRel?'#4ade80':'#fbbf24')+';flex-shrink:0;'});
            var ctrls = div(''); ctrls.style.cssText='display:flex;gap:2px;flex-shrink:0;';
            var upB = btn('ops-btn-sm','↑',async()=>{await moveEntry(e,-1);});
            var dnB = btn('ops-btn-sm','↓',async()=>{await moveEntry(e,1);});
            var vwB = btn('ops-btn-sm','👁',()=>navigate('doc-detail',e.document_id));
            var rmB = btn('ops-btn-sm','✕',async()=>{
              await API.documents.removePubDm(pubId,e.id);
              pubDms=pubDms.filter(x=>x.id!==e.id);
              renderLeft(); renderRight();
            });
            [upB,dnB,vwB,rmB].forEach(b=>{ b.style.padding='2px 5px'; ctrls.appendChild(b); });
            rmB.style.color='#f87171';
            row.appendChild(seqEl); row.appendChild(tag); row.appendChild(tEl); row.appendChild(issueEl); row.appendChild(ctrls);
            chapBody.appendChild(row);
          });
        }
        chapDiv.appendChild(chapBody);
        chapList.appendChild(chapDiv);
      });
    }

    async function moveEntry(entry, dir) {
      var inChap = pubDms.filter(e=>e.chapter===entry.chapter).sort((a,b)=>a.sequence-b.sequence);
      var idx = inChap.findIndex(e=>e.id===entry.id);
      var swapIdx = idx + dir;
      if (swapIdx<0||swapIdx>=inChap.length) return;
      var tmp = inChap[idx].sequence; inChap[idx].sequence=inChap[swapIdx].sequence; inChap[swapIdx].sequence=tmp;
      await API.documents.reorderPubDms(pubId, {dms: inChap.map(e=>({id:e.id,chapter:e.chapter,section:e.section,sequence:e.sequence,chapter_title:e.chapter_title}))});
      renderRight();
    }

    function addChapter() {
      var maxNum = chaptersState.length ? Math.max(...chaptersState.map(c=>c.num)) : 0;
      var nextNum = maxNum+1;
      var title = prompt('Chapter '+nextNum+' title:', 'Chapter '+nextNum);
      if (title===null) return;
      chaptersState.push({num:nextNum, title:title||'Chapter '+nextNum});
      renderRight();
    }

    async function releasePub() {
      if (!confirm('Release Issue '+doc.issue_number+' of this publication? The issue number will advance and status set to Released.')) return;
      await API.documents.releasePub(pubId);
      reload();
    }

    renderLeft();
    renderRight();
  }

  // ── IETM tab ───────────────────────────────────────────────────────────────
  function renderIetmTab() {
    var bar = div(''); bar.style.cssText='display:flex;gap:10px;align-items:center;margin-bottom:16px;';
    bar.appendChild(el('span',{text:'Rendered view of the full technical manual.',style:'color:#64748b;font-size:12px;flex:1;'}));
    bar.appendChild(btn('primary','🖨 Print / Save PDF', async()=>{
      var freshDms = await API.documents.listPubDms(pubId).catch(()=>[]);
      await openIetmWindow(doc, freshDms);
    }));
    tabContent.appendChild(bar);

    if (!pubDms.length) {
      var emptyMsg = userCanEdit ? 'No Data Modules added yet. Switch to the Builder tab to assemble the manual.' : 'This publication has no content yet.';
      tabContent.appendChild(el('div',{text:emptyMsg,style:'color:#475569;font-size:13px;text-align:center;padding:32px;'}));
      return;
    }

    // Grouped inline preview
    var chapters = {};
    pubDms.forEach(e=>{ var ch=e.chapter||1; if(!chapters[ch]) chapters[ch]=[]; chapters[ch].push(e); });
    Object.keys(chapters).sort((a,b)=>a-b).forEach(ch=>{
      var entries = chapters[ch].sort((a,b)=>a.sequence-b.sequence);
      var chTitle = entries.find(e=>e.chapter_title)?.chapter_title || 'Chapter '+ch;
      var chDiv = div(''); chDiv.style.cssText='margin-bottom:24px;';
      var chH = div(''); chH.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:2px solid #1e2540;margin-bottom:10px;';
      chH.appendChild(el('span',{text:'§'+ch,style:'font-size:11px;font-weight:800;color:#38bdf8;font-family:monospace;'}));
      chH.appendChild(el('span',{text:chTitle,style:'font-size:15px;font-weight:700;color:#e2e8f0;'}));
      chDiv.appendChild(chH);
      entries.forEach((e,ei)=>{
        var dmRow = div(''); dmRow.style.cssText='display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:5px;margin-bottom:4px;background:#0d1225;cursor:pointer;';
        dmRow.appendChild(el('span',{text:ch+'.'+(ei+1),style:'font-size:10px;font-family:monospace;color:#334155;min-width:24px;font-weight:700;'}));
        dmRow.appendChild(el('span',{text:e.info_code||'—',style:'font-size:10px;font-weight:800;font-family:monospace;color:#38bdf8;background:#1e3a5f33;padding:2px 5px;border-radius:3px;'}));
        var tEl=div(''); tEl.style.cssText='flex:1;';
        tEl.appendChild(el('div',{text:e.doc_title||'—',style:'font-size:13px;color:#e2e8f0;'}));
        if (e.dmc) tEl.appendChild(el('div',{text:e.dmc,style:'font-size:10px;color:#334155;font-family:monospace;'}));
        dmRow.appendChild(tEl);
        dmRow.appendChild(el('span',{text:'→ View',style:'font-size:11px;color:#38bdf8;'}));
        dmRow.onclick=()=>navigate('doc-detail',e.document_id);
        chDiv.appendChild(dmRow);
      });
      tabContent.appendChild(chDiv);
    });
  }

  showTab('ietm');
}

/**
 * Opens the IETM for the publication that contains a given document_id,
 * jumping straight to that DM section. Called from PM and Deficiency detail.
 */
async function openIetmForDm(documentId) {
  // Find all publications that contain this DM
  var allDocs  = await API.documents.list({doc_type:'publication'}).catch(()=>[]);
  var pubForDm = null;
  var pubDms   = [];
  for (var pub of allDocs) {
    var dms = await API.documents.listPubDms(pub.id).catch(()=>[]);
    if (dms.some(e=>e.document_id===documentId)) { pubForDm=pub; pubDms=dms; break; }
  }
  if (!pubForDm) { showToast('This Data Module is not part of any published manual yet.'); return; }
  await openIetmWindow(pubForDm, pubDms, documentId);
}

async function openIetmWindow(pub, dms, jumpToDocId) {
  var dmSteps = {};
  await Promise.all(dms.map(async e => {
    try { dmSteps[e.document_id] = await API.documents.dmSteps(e.document_id); }
    catch(err) { dmSteps[e.document_id] = []; }
  }));
  var html = buildIetmHtml(pub, dms, dmSteps, jumpToDocId);
  var w = window.open('', '_blank', 'width=1100,height=850');
  if (!w) { showToast('Popup blocked — allow popups for this site to open the IETM.'); return; }
  w.document.write(html);
  w.document.close();
  // Delay matches LOTO print pattern — gives the document time to render
  setTimeout(() => w.print(), 600);
}

function buildIetmHtml(pub, dms, dmSteps, jumpToDocId) {
  var pubLabel = (pub.pub_type||'') + (pub.pub_code ? ' / '+pub.pub_code : '');
  var issueLabel = 'Issue '+(pub.issue_number||1);
  var chapters = {};
  dms.forEach(e=>{ var ch=e.chapter||1; if(!chapters[ch]) chapters[ch]=[]; chapters[ch].push(e); });
  var chapNums = Object.keys(chapters).sort((a,b)=>a-b);

  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderSteps(steps) {
    if (!steps||!steps.length) return '<p style="color:#64748b;font-style:italic;">No content authored yet.</p>';
    var html=''; var actionNum=0;
    steps.forEach(s=>{
      var t=s.step_type||'action'; var c=esc(s.content||'').replace(/\n/g,'<br>');
      if (t==='title')     html+='<h4 style="font-size:15px;font-weight:700;color:#1e293b;margin:20px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">'+c+'</h4>';
      else if(t==='warning') html+='<div class="ietm-adm ietm-warning"><strong>⚠ WARNING</strong><br>'+c+'</div>';
      else if(t==='caution') html+='<div class="ietm-adm ietm-caution"><strong>⛔ CAUTION</strong><br>'+c+'</div>';
      else if(t==='note')    html+='<div class="ietm-adm ietm-note"><strong>ℹ NOTE</strong><br>'+c+'</div>';
      else { actionNum++; html+='<div class="ietm-step"><span class="ietm-step-num">'+actionNum+'.</span><span class="ietm-step-txt">'+c+'</span></div>'; }
    });
    return html;
  }

  // Left nav
  var nav = '';
  chapNums.forEach(ch=>{
    var entries = chapters[ch].sort((a,b)=>a.sequence-b.sequence);
    var chTitle = entries.find(e=>e.chapter_title)?.chapter_title||'Chapter '+ch;
    nav += '<div class="nav-ch">§'+ch+'&nbsp;&nbsp;'+esc(chTitle)+'</div>';
    entries.forEach((e,i)=>{ nav+='<a class="nav-dm" href="#dm-'+e.id+'">'+ch+'.'+(i+1)+'&nbsp;'+esc(e.doc_title||'—')+'</a>'; });
  });

  // TOC
  var toc='<div class="toc"><h3 class="toc-hdr">Table of Contents</h3>';
  chapNums.forEach(ch=>{
    var entries = chapters[ch].sort((a,b)=>a.sequence-b.sequence);
    var chTitle = entries.find(e=>e.chapter_title)?.chapter_title||'Chapter '+ch;
    toc+='<div class="toc-ch">§'+ch+'&nbsp;&nbsp;<strong>'+esc(chTitle)+'</strong></div>';
    entries.forEach((e,i)=>{ toc+='<div class="toc-dm"><a href="#dm-'+e.id+'">'+ch+'.'+(i+1)+'&nbsp;&nbsp;'+esc(e.doc_title||'—')+'</a></div>'; });
  });
  toc+='</div>';

  // Body chapters
  var body='';
  chapNums.forEach(ch=>{
    var entries = chapters[ch].sort((a,b)=>a.sequence-b.sequence);
    var chTitle = entries.find(e=>e.chapter_title)?.chapter_title||'Chapter '+ch;
    body+='<section class="chapter" id="ch-'+ch+'"><div class="ch-num">Chapter '+ch+'</div><h2 class="ch-title">'+esc(chTitle)+'</h2>';
    entries.forEach((e,i)=>{
      var steps = dmSteps[e.document_id]||[];
      var isRel = !e.in_work_number;
      body+=`<article class="dm-section" id="dm-${e.id}" data-doc-id="${e.document_id}">
        <a id="dm-doc-${e.document_id}" style="position:absolute;top:-56px;display:block;"></a>
        <div class="dm-hdr">
          <span class="dm-code">${esc(e.info_code||'—')}</span>
          <div>
            <div class="dm-title">${ch}.${i+1}&nbsp;&nbsp;${esc(e.doc_title||'—')}</div>
            ${e.dmc?`<div class="dm-dmc">${esc(e.dmc)}</div>`:''}
            <div class="dm-issue">${isRel?'Released':'In-Work'} — Issue ${e.issue_number||1}${e.dmc_review_flag?' &nbsp;<span class="dm-flag">⚠ Updated since last publication</span>':''}</div>
          </div>
        </div>
        <div class="dm-content">${renderSteps(steps)}</div>
      </article>`;
    });
    body+='</section>';
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pub.pub_code||'')} — ${esc(pub.title||'')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#1e293b;display:flex;}
/* Nav */
.ietm-nav{width:260px;min-height:100vh;background:#0f172a;color:#94a3b8;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;padding-bottom:40px;}
.nav-brand{padding:18px 16px;background:#080d1a;border-bottom:1px solid #1e2540;}
.nav-pub{font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:1px;text-transform:uppercase;font-family:monospace;}
.nav-title{font-size:13px;font-weight:700;color:#e2e8f0;margin-top:4px;line-height:1.3;}
.nav-issue{font-size:10px;color:#475569;margin-top:3px;}
.nav-ch{padding:10px 16px 4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#38bdf8;}
.nav-dm{display:block;padding:5px 16px 5px 28px;font-size:11px;color:#64748b;text-decoration:none;transition:all .12s;}
.nav-dm:hover{color:#e2e8f0;background:#1e2540;}
/* Toolbar */
.toolbar{position:fixed;top:0;left:260px;right:0;background:#fff;border-bottom:1px solid #e2e8f0;padding:8px 32px;display:flex;align-items:center;gap:12px;z-index:100;box-shadow:0 1px 4px rgba(0,0,0,.06);}
.toolbar-pub{font-size:12px;font-family:monospace;color:#64748b;flex:1;}
.print-btn{background:#1d4ed8;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;}
.print-btn:hover{background:#1e40af;}
/* Main */
.ietm-main{margin-left:260px;margin-top:48px;padding:0 56px 80px;max-width:960px;background:#fff;min-height:100vh;}
/* Cover */
.cover{padding:64px 0 48px;border-bottom:2px solid #1e293b;margin-bottom:48px;}
.cover-type{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#1d4ed8;}
.cover-title{font-size:36px;font-weight:800;color:#0f172a;margin:10px 0 6px;line-height:1.1;}
.cover-code{font-family:monospace;font-size:13px;color:#64748b;letter-spacing:1px;}
.cover-meta{display:flex;gap:32px;margin-top:28px;flex-wrap:wrap;}
.meta-item{}
.meta-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;}
.meta-value{font-size:15px;font-weight:700;color:#1e293b;margin-top:3px;}
/* TOC */
.toc{background:#f1f5f9;border-radius:10px;padding:24px 28px;margin-bottom:48px;}
.toc-hdr{font-size:16px;font-weight:800;color:#0f172a;margin-bottom:16px;}
.toc-ch{font-size:13px;font-weight:700;color:#1e293b;margin-top:12px;margin-bottom:2px;}
.toc-dm{padding-left:20px;font-size:12px;margin-bottom:2px;}
.toc-dm a{color:#1d4ed8;text-decoration:none;}
.toc-dm a:hover{text-decoration:underline;}
/* Chapter */
.chapter{margin-bottom:0;padding-top:64px;}
.ch-num{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#1d4ed8;}
.ch-title{font-size:26px;font-weight:800;color:#0f172a;margin:6px 0 28px;padding-bottom:12px;border-bottom:2px solid #1e293b;}
/* DM */
.dm-section{margin-bottom:36px;padding:20px 24px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;}
.dm-hdr{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f1f5f9;}
.dm-code{background:#dbeafe;color:#1d4ed8;font-family:monospace;font-size:11px;font-weight:800;padding:3px 8px;border-radius:4px;flex-shrink:0;margin-top:3px;}
.dm-title{font-size:17px;font-weight:700;color:#0f172a;}
.dm-dmc{font-family:monospace;font-size:10px;color:#94a3b8;margin-top:2px;}
.dm-issue{font-size:10px;color:#64748b;margin-top:3px;}
.dm-flag{color:#d97706;font-weight:700;}
/* Steps */
.ietm-step{display:flex;gap:14px;margin-bottom:10px;align-items:flex-start;}
.ietm-step-num{min-width:22px;font-weight:800;color:#1d4ed8;font-size:13px;text-align:right;flex-shrink:0;padding-top:1px;}
.ietm-step-txt{flex:1;font-size:14px;line-height:1.65;color:#1e293b;}
.ietm-adm{margin:12px 0;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;line-height:1.5;}
.ietm-warning{background:#fef9c3;border-left:4px solid #ca8a04;color:#713f12;}
.ietm-caution{background:#fff7ed;border-left:4px solid #ea580c;color:#7c2d12;}
.ietm-note{background:#eff6ff;border-left:4px solid #3b82f6;color:#1e3a5f;}
/* Print */
@media print{
  .ietm-nav,.toolbar{display:none!important;}
  .ietm-main{margin-left:0;margin-top:0;padding:0 2cm;}
  .chapter{page-break-before:always;}
  .chapter:first-of-type{page-break-before:auto;}
  .dm-section{page-break-inside:avoid;border:1px solid #ccc;}
  @page{margin:2.5cm;size:A4;}
}
</style>
</head>
<body>
<nav class="ietm-nav">
  <div class="nav-brand">
    <div class="nav-pub">${esc(pubLabel)}</div>
    <div class="nav-title">${esc(pub.title||'')}</div>
    <div class="nav-issue">${issueLabel}</div>
  </div>
  ${nav}
</nav>
<div class="toolbar">
  <div class="toolbar-pub">${esc(pub.pub_code||'')} — ${esc(pub.title||'')} &nbsp;|&nbsp; ${issueLabel}</div>
  <button class="print-btn" id="ietm-print-btn">🖨 Print / Save PDF</button>
</div>
<main class="ietm-main">
  <div class="cover">
    <div class="cover-type">${esc(pub.pub_type||'')}</div>
    <h1 class="cover-title">${esc(pub.title||'')}</h1>
    <div class="cover-code">${esc(pub.pub_code||'')}</div>
    <div class="cover-meta">
      <div class="meta-item"><div class="meta-label">Issue</div><div class="meta-value">${pub.issue_number||1}</div></div>
      <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${esc(pub.status||'draft')}</div></div>
      <div class="meta-item"><div class="meta-label">Data Modules</div><div class="meta-value">${dms.length}</div></div>
    </div>
  </div>
  ${toc}
  ${body}
</main>
<script>
document.getElementById('ietm-print-btn').onclick = function(){ window.print(); };
${jumpToDocId ? 'window.onload=function(){var el=document.getElementById("dm-doc-'+jumpToDocId+'");if(el)el.scrollIntoView({behavior:"smooth"});};' : ''}
</script>
</body>
</html>`;
}

// Auto-increment revision label: A→B, Z→AA, AA→AB, AZ→BA etc.
function nextRevision(current) {
  if (!current) return 'A';
  var chars = current.toUpperCase().split('');
  for (var i = chars.length - 1; i >= 0; i--) {
    if (chars[i] < 'Z') { chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1); return chars.join(''); }
    chars[i] = 'A';
  }
  return 'A' + chars.join('');
}

async function showDocumentForm(existing, defaultAssetId, onSave, forceDocType) {
  var assets = await getAssets().catch(() => []);
  var assetMap = {}; assets.forEach(a=>{ assetMap[a.id]=a; });

  var initialType = forceDocType || existing?.doc_type || 'external';
  var activeLane  = initialType;   // tracked explicitly — never inferred from button style
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  // ── Lane toggle (locked on edit) ─────────────────────────────────────────
  var laneRow = div('ops-form-group ops-form-full');
  laneRow.style.cssText='margin-bottom:14px;';
  var laneLabel = el('div',{text:'Document Type',style:'font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:6px;font-weight:700;'});
  var laneToggle = div(''); laneToggle.style.cssText='display:flex;gap:0;border:1px solid #2e3650;border-radius:6px;overflow:hidden;width:fit-content;';
  function laneBtn(type, label) {
    var b = el('button',{text:label});
    b.style.cssText='padding:6px 18px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:background .15s;';
    b.dataset.lane = type;
    if (existing) { b.disabled=true; b.style.opacity='0.6'; b.title='Lane cannot change on edit'; }
    laneToggle.appendChild(b); return b;
  }
  var btnExt = laneBtn('external',     '📎 External');
  var btnDm  = laneBtn('data_module',  '📘 Data Module');
  var btnPub = laneBtn('publication',  '📖 Publication');
  function setLane(type) {
    activeLane = type;
    [btnExt, btnDm, btnPub].forEach(b => {
      var active = b.dataset.lane === type;
      b.style.background = active ? (type==='publication'?'#1e1a3f':type==='data_module'?'#1e3a5f':'#1e2a1e') : '#0f172a';
      b.style.color      = active ? (type==='publication'?'#a78bfa':type==='data_module'?'#38bdf8':'#4ade80') : '#64748b';
    });
    extSection.style.display = type === 'external'    ? '' : 'none';
    dmSection.style.display  = type === 'data_module' ? '' : 'none';
    pubSection.style.display = type === 'publication' ? '' : 'none';
    updateDmcPreview();
  }
  if (!existing) {
    btnExt.onclick = () => setLane('external');
    btnDm.onclick  = () => setLane('data_module');
    btnPub.onclick = () => setLane('publication');
  }
  laneRow.appendChild(laneLabel); laneRow.appendChild(laneToggle);
  fWrap.appendChild(laneRow);

  // ── Shared fields ─────────────────────────────────────────────────────────
  if (!existing) f.docNumber = add('Doc Number', inp('Auto-generated if blank', ''));
  f.title    = add('Title *',  inp('e.g., Engine Oil Change Procedure', existing?.title||''), true);
  f.category = add('Category', sel(DOC_CATEGORIES.map(c=>[c,(DOC_CAT_ICONS[c]||'')+' '+(DOC_CAT_LABELS[c]||c)]), existing?.category||'other'));
  f.status   = add('Status',   sel(DOC_STATUSES.map(s=>[s,s]), existing?.status||'draft'));
  f.notes    = add('Notes', ta('Additional context…', existing?.notes||'', 2), true);

  // Shared asset options — used in both lanes
  var assetOpts = [['','— No linked asset —']].concat(assets.map(a=>[String(a.id),(a.asset_code||a.asset_id_label)+' — '+a.name]));
  var preselect = existing?.asset_id ? String(existing.asset_id) : (defaultAssetId ? String(defaultAssetId) : '');

  // ── External lane section ─────────────────────────────────────────────────
  var extSection = div('ops-form-full'); extSection.style.cssText='display:grid;grid-column:1/-1;gap:0;';

  // Optional asset link for external docs (TDP association)
  f.assetIdExt = (()=>{ var s=sel(assetOpts, preselect); extSection.appendChild(fg('Linked Asset',s,true,'Optionally attach this document to an asset for TDP display.')); return s; })();

  var fileRow = div('ops-form-group ops-form-full');
  fileRow.appendChild(el('label',{cls:'ops-form-label',text: existing ? 'Attach File (this revision)' : 'Attach File (Rev A)'}));
  var filePathInp = inp('No file attached — click Browse to pick from Nextcloud', '');
  filePathInp.readOnly=true; filePathInp.style.cssText='flex:1;cursor:pointer;background:#0f172a;';
  var browseBtn = btn('','📂 Browse',()=>{
    showFileBrowser((path)=>{ filePathInp.value=path; filePathInp.title=path; },
      {title:'📂 Attach Document File',hint:'Click a file to attach it to this revision',rootPath:'Maintain Ops Suite/Documents'});
  });
  browseBtn.style.marginTop='4px';
  var clearFileBtn = btn('','✕ Clear',()=>{ filePathInp.value=''; });
  clearFileBtn.style.cssText='margin-top:4px;margin-left:4px;';
  var fiWrap=div(''); fiWrap.style.cssText='display:flex;gap:6px;align-items:center;';
  fiWrap.appendChild(filePathInp); fiWrap.appendChild(browseBtn); fiWrap.appendChild(clearFileBtn);
  fileRow.appendChild(fiWrap); extSection.appendChild(fileRow);
  if (existing && (existing.doc_type||'external')==='external') {
    f.changeDesc = (()=>{
      var i=ta('Describe the changes made in this revision…','',2);
      extSection.appendChild(fg('What changed? *',i,true,'Saving advances the revision from '+(existing.current_rev||'(none)')+' → '+nextRevision(existing.current_rev)));
      return i;
    })();
  }
  fWrap.appendChild(extSection);

  // ── Data Module lane section ──────────────────────────────────────────────
  var dmSection = div('ops-form-full'); dmSection.style.cssText='display:grid;grid-column:1/-1;gap:0;';

  // Required asset selector — FIRST in DM section since DMC can't be generated without it
  var dmAssetSel = sel(assetOpts, preselect);
  dmAssetSel.style.cssText='border-color:#38bdf844;';  // subtle blue border to signal importance
  dmSection.appendChild(fg('Asset *', dmAssetSel, true, 'Required — the asset SNS is used to generate the Data Module Code (DMC).'));
  f.assetId = dmAssetSel;

  // Info code selector — drives category suggestion + DMC
  var infoCodeSel = sel(S1000D_INFO_CODES, existing?.info_code||'200');
  dmSection.appendChild(fg('Information Code *', infoCodeSel, false, 'S1000D info code determines the DM type and auto-suggests the category.'));

  // In-Work toggle
  var inWorkChk = el('input',{type:'checkbox'});
  inWorkChk.checked = existing ? (existing.in_work_number > 0) : true;
  var inWorkWrap = div(''); inWorkWrap.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 0;';
  inWorkWrap.appendChild(inWorkChk);
  inWorkWrap.appendChild(el('span',{text:'In-Work (draft in progress — not yet released)',style:'font-size:12px;color:#94a3b8;'}));
  dmSection.appendChild(fg('Draft Status', inWorkWrap, false, ''));

  // DMC preview — read-only, auto-updates when asset or info code changes
  var dmcPreview = inp('Select an asset and info code to generate DMC', existing?.dmc||'');
  dmcPreview.readOnly=true; dmcPreview.style.cssText='flex:1;background:#0d1117;color:#38bdf8;font-family:monospace;font-size:12px;';
  dmSection.appendChild(fg('Data Module Code', dmcPreview, true, 'Auto-generated from the linked asset SNS and information code. Finalized on save.'));

  // Issue number display (read-only — managed server-side)
  if (existing && existing.doc_type==='data_module') {
    var issDisplay = inp('', 'Issue '+existing.issue_number+(existing.in_work_number>0?' (In-Work '+existing.in_work_number+')':' (Released)'));
    issDisplay.readOnly=true; issDisplay.style.background='#0d1117';
    dmSection.appendChild(fg('Current Issue', issDisplay, false, 'Saving will advance to Issue '+(existing.issue_number+1)+' and flag linked PMs for review.'));
    f.dmChangeDesc = (()=>{
      var i=ta('Describe what changed in this issue…','',2);
      dmSection.appendChild(fg('Reason for Update *',i,true,'Required — recorded in the DM change history.'));
      return i;
    })();
  }
  fWrap.appendChild(dmSection);

  // ── Publication lane section ──────────────────────────────────────────────────
  var pubSection = div('ops-form-full'); pubSection.style.cssText='display:grid;grid-column:1/-1;gap:0;';
  var pubAssetOpts = [['','— Assign to an asset —']].concat(assets.map(a=>[String(a.id),(a.asset_code||a.asset_id_label)+' — '+a.name]));
  f.pubAssetId = (()=>{ var s=sel(pubAssetOpts, preselect); pubSection.appendChild(fg('Linked Asset',s,true,'Required — used to show available Data Modules for assembly.')); return s; })();
  f.pubType    = (()=>{ var s=sel(PUB_TYPES, existing?.pub_type||'MM'); pubSection.appendChild(fg('Publication Type *',s,false,'')); return s; })();
  f.pubCode    = (()=>{ var i=inp('Auto-generated (e.g. MM-ABC123)',existing?.pub_code||''); pubSection.appendChild(fg('Publication Code',i,false,'Leave blank to auto-generate.')); return i; })();
  fWrap.appendChild(pubSection);

  // DMC preview update wired to asset + info code selectors
  function updateDmcPreview() {
    if (dmSection.style.display==='none') return;
    var aid = f.assetId.value ? parseInt(f.assetId.value) : null;
    var ic  = infoCodeSel.value;
    if (!aid || !ic) { dmcPreview.value=''; return; }
    var a = assetMap[aid];
    dmcPreview.value = a ? previewDmc(a.asset_id_label||a.asset_code, ic, 'A') : '';
  }
  f.assetId.onchange  = updateDmcPreview;
  infoCodeSel.onchange = () => {
    // Auto-suggest category
    var suggested = S1000D_INFO_TO_CATEGORY[infoCodeSel.value];
    if (suggested && f.category) f.category.value = suggested;
    updateDmcPreview();
  };

  // Set initial lane state
  setLane(initialType);

  var isEdit    = !!existing;
  var docTypeFn = () => existing ? (existing.doc_type||'external') : activeLane;
  var modalTitle = isEdit
    ? (existing.doc_type==='data_module' ? 'Edit Data Module — Issue '+(existing.issue_number+1)
      : existing.doc_type==='publication' ? 'Edit Publication'
      : 'Edit Document — Rev '+nextRevision(existing?.current_rev))
    : (initialType==='data_module' ? 'New Data Module' : initialType==='publication' ? 'New Publication' : 'New External Document');

  modal(modalTitle, fWrap, async () => {
    if (!f.title.value.trim()) throw new Error('Title is required.');
    var docType = docTypeFn();

    var assetIdVal = docType === 'data_module' ? (f.assetId.value ? parseInt(f.assetId.value) : null)
                   : docType === 'publication'  ? (f.pubAssetId?.value ? parseInt(f.pubAssetId.value) : null)
                   : (f.assetIdExt.value ? parseInt(f.assetIdExt.value) : null);

    var d = {
      title:    f.title.value,
      category: f.category.value,
      status:   f.status.value,
      notes:    f.notes.value,
      asset_id: assetIdVal,
      doc_type: docType,
    };

    if (docType === 'publication') {
      if (!assetIdVal) throw new Error('A linked asset is required for Publications.');
      d.pub_type = f.pubType?.value || 'MM';
      d.pub_code = f.pubCode?.value.trim() || (d.pub_type+'-'+Math.random().toString(36).slice(-6).toUpperCase());
      d.issue_number = existing?.issue_number || 1;
      d.re_issue_required = false;
      if (isEdit) {
        await API.documents.update(existing.id, d);
      } else {
        var created = await API.documents.create(d);
        if (onSave) onSave();
        navigate('doc-detail', created.id);
        return;
      }
    } else if (docType === 'data_module') {
      if (!assetIdVal) throw new Error('A linked asset is required for Data Modules.');
      if (isEdit && !f.dmChangeDesc?.value.trim()) throw new Error('Reason for Update is required.');
      d.info_code        = infoCodeSel.value;
      d.info_code_variant= existing?.info_code_variant || 'A';
      d.in_work_number   = inWorkChk.checked ? 1 : 0;
      if (isEdit) {
        d.issue_number    = existing.issue_number + 1;
        d.dmc_review_flag = true;
        d.reason_for_update = f.dmChangeDesc.value;
        await API.documents.update(existing.id, d);
      } else {
        d.issue_number = 1;
        var created = await API.documents.create(d);
        await API.documents.addRevision(created.id, {revision:'1',change_desc:'Initial Data Module creation — Issue 1.',file_path:null,approved_by:null});
        var tpl = S1000D_TEMPLATES[d.info_code];
        if (tpl) await API.documents.saveSteps(created.id, {steps: tpl}).catch(()=>{});
      }
    } else {
      // External document lane
      d.applicability = f.applicability?.value || '';
      if (isEdit) {
        if (!f.changeDesc?.value.trim()) throw new Error('Please describe what changed.');
        var newRev = nextRevision(existing.current_rev);
        d.current_rev = newRev;
        await API.documents.update(existing.id, d);
        await API.documents.addRevision(existing.id, {revision:newRev,change_desc:f.changeDesc.value,file_path:filePathInp.value||null,approved_by:null});
      } else {
        if (f.docNumber?.value.trim()) d.doc_number = f.docNumber.value.trim();
        d.current_rev = 'A';
        var created = await API.documents.create(d);
        await API.documents.addRevision(created.id, {revision:'A',change_desc:'Initial document creation.',file_path:filePathInp.value||null,approved_by:null});
      }
    }
    if (onSave) onSave();
  }, isEdit ? 'Save & Advance' : 'Create');
}

/* ════════════════════════════════════════════════════════════════
   MBSE — REQUIREMENTS & INTERFACES  (Sprint 0D)
════════════════════════════════════════════════════════════════ */

var REQ_TYPES    = ['functional','performance','interface','environmental','reliability'];
var REQ_STATUSES = ['untested','met','degraded','not_met'];
var REQ_PRIORITIES = ['P1','P2','P3'];
var IF_TYPES     = ['data','network','power','rf','control','pneumatic','hydraulic','mechanical','hvac'];
var IF_STATUSES  = ['active','bypassed','open','terminated'];

var REQ_STATUS_COLORS = {met:'badge-green', degraded:'badge-orange', not_met:'badge-red', untested:'badge-gray'};
var IF_STATUS_COLORS  = {active:'badge-green', bypassed:'badge-orange', open:'badge-yellow', terminated:'badge-gray'};
var IF_TYPE_ICONS = {data:'💾',network:'🌐',power:'⚡',rf:'📡',control:'🎛',pneumatic:'💨',hydraulic:'💧',mechanical:'⚙',hvac:'❄'};

function reqStatusBadge(s)  { return span('ops-badge '+(REQ_STATUS_COLORS[s]||'badge-gray'), s); }
function ifStatusBadge(s)   { return span('ops-badge '+(IF_STATUS_COLORS[s]||'badge-gray'), s); }

async function viewRequirements() {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var [reqs, assets] = await Promise.all([API.requirements.list(), getAssets().catch(()=>[])]);
  var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'Requirements'}));
  hdr.appendChild(btn('primary','+ New Requirement', () => showRequirementForm(null, null, () => viewRequirements())));
  wrap.appendChild(hdr);

  // Filters
  var fbar = div('ops-filter-bar');
  var typeSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Types'],...REQ_TYPES.map(t=>[t,t])].forEach(([v,l])=>{ var o=el('option',{value:v,text:l}); typeSel.appendChild(o); });
  var statSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Statuses'],...REQ_STATUSES.map(s=>[s,s])].forEach(([v,l])=>{ var o=el('option',{value:v,text:l}); statSel.appendChild(o); });
  fbar.appendChild(span('ops-filter-label','Type:')); fbar.appendChild(typeSel);
  fbar.appendChild(span('ops-filter-label','Status:')); fbar.appendChild(statSel);
  wrap.appendChild(fbar);

  var tableWrap = div(''); wrap.appendChild(tableWrap);

  function render() {
    var t = typeSel.value, s = statSel.value;
    var filtered = reqs.filter(r => (!t || r.req_type===t) && (!s || r.status===s));
    var card = div('ops-card');
    if (!filtered.length) {
      card.appendChild(el('div',{cls:'ops-empty',text:'No requirements found.'}));
    } else {
      card.appendChild(makeTable(
        ['Req Code','Title','Type','Asset','Priority','Status',''],
        filtered.map(r => [
          span('ops-mono ops-small', r.req_code),
          (()=>{ var lnk=el('strong',{text:r.title,style:'cursor:pointer;color:#38bdf8;'}); lnk.onclick=()=>navigate('req-detail',r.id); return lnk; })(),
          span('ops-badge badge-blue', r.req_type),
          assetMap[r.asset_id] ? span('ops-mono ops-small', assetMap[r.asset_id].asset_code||('#'+r.asset_id)) : span('ops-muted','—'),
          span('ops-badge badge-gray', r.priority),
          reqStatusBadge(r.status),
          (()=>{
            var eb = btn('ops-btn-sm','✏', ()=>showRequirementForm(r, r.asset_id, ()=>viewRequirements()));
            var db = btn('ops-btn-sm ops-btn-danger','✕', async()=>{
              if(!confirm('Delete requirement '+r.req_code+'?')) return;
              await API.requirements.destroy(r.id); viewRequirements();
            });
            var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db); return g;
          })(),
        ]),
        i => { if(filtered[i]) navigate('req-detail', filtered[i].id); }
      ));
    }
    tableWrap.innerHTML=''; tableWrap.appendChild(card);
  }

  typeSel.onchange = render; statSel.onchange = render;
  render();
  setContent(wrap);
}

async function viewReqDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var req = await API.requirements.get(id).catch(()=>null);
  if (!req) { setContent(el('div',{cls:'ops-empty',text:'Not found.'})); return; }

  var assets = await getAssets().catch(()=>[]);
  var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Requirements',()=>navigate('requirements')));
  hdr.appendChild(el('h2',{text:req.req_code+' — '+req.title}));
  hdr.appendChild(reqStatusBadge(req.status));
  hdr.appendChild(span('ops-badge badge-gray', req.priority));
  hdr.appendChild(btn('','✏ Edit',()=>showRequirementForm(req, req.asset_id, ()=>viewReqDetail(id))));
  hdr.appendChild(btn('primary','+ Add Trace',()=>showTraceForm(id, ()=>viewReqDetail(id))));
  wrap.appendChild(hdr);

  var two = div('ops-two-col');
  var left = div('');

  var dc = div('ops-card ops-detail-card');
  dc.appendChild(div('ops-section-label',[document.createTextNode('Requirement')]));
  var kvg = div('ops-kv-grid');
  var linkedAsset = assetMap[req.asset_id];
  var fields = [
    ['Req Code',    span('ops-mono', req.req_code)],
    ['Type',        span('ops-badge badge-blue', req.req_type)],
    ['System Node', linkedAsset ? (()=>{ var lnk=el('span',{style:'cursor:pointer;color:#38bdf8;',text:(linkedAsset.asset_code||linkedAsset.asset_id_label)+' — '+linkedAsset.name}); lnk.onclick=()=>navigate('asset-detail',linkedAsset.id); return lnk; })() : span('ops-muted','—')],
    ['Description', req.description || span('ops-muted','—')],
    ['Threshold',   req.threshold ? req.threshold + (req.unit?' '+req.unit:'') : span('ops-muted','—')],
    ['Objective',   req.objective  ? req.objective  + (req.unit?' '+req.unit:'') : span('ops-muted','—')],
    ['Status',      reqStatusBadge(req.status)],
    ['Last Verified', req.last_verified_at ? fmtDate(req.last_verified_at) + (req.last_verified_value?' — '+req.last_verified_value:'') : span('ops-muted','—')],
    ['Notes',       req.notes || span('ops-muted','—')],
  ];
  fields.forEach(row=>{
    var kv=div('ops-kv'); kv.appendChild(span('ops-kv-key',row[0]));
    if(typeof row[1]==='string') kv.appendChild(span('',row[1])); else kv.appendChild(row[1]);
    kvg.appendChild(kv);
  });
  dc.appendChild(kvg);
  left.appendChild(dc);
  two.appendChild(left);

  // Traceability panel
  var right = div('');
  var tracCard = div('ops-card');
  tracCard.appendChild(div('ops-card-header',[el('h3',{text:'Traceability ('+((req.traceability||[]).length)+')'})]));
  if (!req.traceability || !req.traceability.length) {
    var nt=div(''); nt.style.cssText='padding:12px;color:#64748b;font-size:13px;text-align:center;';
    nt.textContent='No traceability links yet.'; tracCard.appendChild(nt);
  } else {
    tracCard.appendChild(makeTable(
      ['Links To','Type','ID','Trace Type','Notes',''],
      req.traceability.map(t => [
        span('ops-badge badge-blue', t.traced_to_type),
        t.traced_to_type,
        span('ops-mono ops-small', '#'+t.traced_to_id),
        span('ops-badge badge-gray', t.trace_type),
        t.notes || span('ops-muted','—'),
        btn('ops-btn-sm ops-btn-danger','✕', async()=>{
          if(!confirm('Remove trace link?')) return;
          await API.requirements.deleteTrace(id, t.id); viewReqDetail(id);
        }),
      ]),
      null
    ));
  }
  right.appendChild(tracCard);
  two.appendChild(right);
  wrap.appendChild(two);
  setContent(wrap);
}

function showRequirementForm(existing, defaultAssetId, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  // Asset selector (system node)
  getAssets().then(assets => {
    var assetOpts = [['','— Select System Node —']].concat(
      assets.map(a=>[String(a.id),(a.asset_code||a.asset_id_label)+' — '+a.name])
    );
    var presel = existing?.asset_id ? String(existing.asset_id) : (defaultAssetId ? String(defaultAssetId) : '');
    f.assetId = add('System Node *', sel(assetOpts, presel), true, 'The top-level asset this requirement belongs to.');
    f.title   = add('Title *',       inp('Short requirement statement', existing?.title||''), true);
    f.reqType = add('Type',          sel(REQ_TYPES.map(t=>[t,t]), existing?.req_type||'functional'));
    f.priority= add('Priority',      sel(REQ_PRIORITIES.map(p=>[p,p]), existing?.priority||'P1'));
    f.status  = add('Status',        sel(REQ_STATUSES.map(s=>[s,s]), existing?.status||'untested'));
    f.desc    = add('Full Description', ta('Complete requirement statement…', existing?.description||'', 3), true);
    f.threshold = add('Threshold',   inp('Minimum acceptable value', existing?.threshold||''));
    f.objective = add('Objective',   inp('Goal/target value', existing?.objective||''));
    f.unit      = add('Unit',        inp('Watts, km, %, dB…', existing?.unit||''));
    f.notes   = add('Notes',         ta('', existing?.notes||'', 2), true);
  });

  modal(
    existing ? 'Edit Requirement' : 'New Requirement',
    fWrap,
    async () => {
      if (!f.title?.value.trim()) throw new Error('Title is required.');
      if (!f.assetId?.value)      throw new Error('System node is required.');
      var d = {
        asset_id:    parseInt(f.assetId.value),
        title:       f.title.value,
        req_type:    f.reqType.value,
        priority:    f.priority.value,
        status:      f.status.value,
        description: f.desc.value,
        threshold:   f.threshold.value || null,
        objective:   f.objective.value || null,
        unit:        f.unit.value || null,
        notes:       f.notes.value,
      };
      if (existing) await API.requirements.update(existing.id, d);
      else          await API.requirements.create(d);
      if (onSave) onSave();
    },
    existing ? 'Save Changes' : 'Create Requirement'
  );
}

function showTraceForm(reqId, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  f.tracedToType = add('Record Type', sel(
    [['asset','Asset'],['interface','Interface'],['procedure','Procedure'],
     ['deficiency','Deficiency'],['document','Document']],
    'asset'
  ));
  f.tracedToId   = add('Record ID *', inp('Numeric ID of the linked record', ''));
  f.traceType    = add('Trace Type',  sel(
    [['satisfies','satisfies'],['verified_by','verified_by'],
     ['allocated_to','allocated_to'],['derived_from','derived_from'],['breaks','breaks']],
    'satisfies'
  ));
  f.notes = add('Notes', ta('Traceability rationale…', '', 2), true);

  modal('Add Traceability Link', fWrap, async () => {
    if (!f.tracedToId.value.trim()) throw new Error('Record ID is required.');
    await API.requirements.addTrace(reqId, {
      traced_to_type: f.tracedToType.value,
      traced_to_id:   parseInt(f.tracedToId.value),
      trace_type:     f.traceType.value,
      notes:          f.notes.value,
    });
    if (onSave) onSave();
  }, 'Add Link');
}

async function viewInterfaces() {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var [ifaces, assets] = await Promise.all([API.interfaces.list(), getAssets().catch(()=>[])]);
  var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'Interfaces'}));
  hdr.appendChild(btn('primary','+ New Interface', () => showInterfaceForm(null, () => viewInterfaces())));
  wrap.appendChild(hdr);

  // Filters
  var fbar = div('ops-filter-bar');
  var typeSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Types'],...IF_TYPES.map(t=>[t,(IF_TYPE_ICONS[t]||'')+' '+t])].forEach(([v,l])=>{ var o=el('option',{value:v,text:l}); typeSel.appendChild(o); });
  var statSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Statuses'],...IF_STATUSES.map(s=>[s,s])].forEach(([v,l])=>{ var o=el('option',{value:v,text:l}); statSel.appendChild(o); });
  fbar.appendChild(span('ops-filter-label','Type:')); fbar.appendChild(typeSel);
  fbar.appendChild(span('ops-filter-label','Status:')); fbar.appendChild(statSel);
  wrap.appendChild(fbar);

  var tableWrap = div(''); wrap.appendChild(tableWrap);

  function assetLabel(id) {
    var a = assetMap[id];
    return a ? span('ops-mono ops-small', (a.asset_code||('#'+id))+' '+a.name) : span('ops-muted','#'+id);
  }

  function render() {
    var t = typeSel.value, s = statSel.value;
    var filtered = ifaces.filter(i => (!t || i.interface_type===t) && (!s || i.status===s));
    var card = div('ops-card');
    if (!filtered.length) {
      card.appendChild(el('div',{cls:'ops-empty',text:'No interfaces found.'}));
    } else {
      card.appendChild(makeTable(
        ['If Code','From','To','Type','Spec','Standard','Status',''],
        filtered.map(i => [
          span('ops-mono ops-small', i.interface_code),
          assetLabel(i.from_asset_id),
          assetLabel(i.to_asset_id),
          span('ops-badge badge-blue', (IF_TYPE_ICONS[i.interface_type]||'')+' '+i.interface_type),
          i.specification ? span('ops-mono ops-small', i.specification) : span('ops-muted','—'),
          i.standard || span('ops-muted','—'),
          ifStatusBadge(i.status),
          (()=>{
            var eb = btn('ops-btn-sm','✏', ()=>showInterfaceForm(i, ()=>viewInterfaces()));
            var db = btn('ops-btn-sm ops-btn-danger','✕', async()=>{
              if(!confirm('Delete interface '+i.interface_code+'?')) return;
              await API.interfaces.destroy(i.id); viewInterfaces();
            });
            var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db); return g;
          })(),
        ]),
        null
      ));
    }
    tableWrap.innerHTML=''; tableWrap.appendChild(card);
  }

  typeSel.onchange = render; statSel.onchange = render;
  render();
  setContent(wrap);
}

function showInterfaceForm(existing, onSave, defaults) {
  defaults = defaults || {};
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  getAssets().then(assets => {
    var assetOpts = [['','— Select Asset —']].concat(
      assets.map(a=>[String(a.id),(a.asset_code||a.asset_id_label)+' — '+a.name])
    );
    var defFrom = existing?.from_asset_id ? String(existing.from_asset_id)
                : defaults.from_asset_id  ? String(defaults.from_asset_id) : '';
    var defTo   = existing?.to_asset_id   ? String(existing.to_asset_id)   : '';
    f.fromAsset = add('From Asset *', sel(assetOpts, defFrom));
    f.toAsset   = add('To Asset *',   sel(assetOpts, defTo));
    f.ifType    = add('Type',         sel(IF_TYPES.map(t=>[t,(IF_TYPE_ICONS[t]||'')+' '+t]), existing?.interface_type||'data'));
    f.spec      = add('Specification', inp('e.g. 28VDC 5A, GigE 1Gbps, 50Ω N-type', existing?.specification||''), true);
    f.standard  = add('Standard',     inp('e.g. MIL-STD-1553, IEEE 802.3', existing?.standard||''));
    f.status    = add('Status',       sel(IF_STATUSES.map(s=>[s,s]), existing?.status||'active'));
    f.drawingRef= add('Drawing Ref',  inp('Sheet and zone, e.g. D-3 / Z4', existing?.drawing_ref||''));
    f.notes     = add('Notes',        ta('', existing?.notes||'', 2), true);
  });

  modal(
    existing ? 'Edit Interface' : 'New Interface',
    fWrap,
    async () => {
      if (!f.fromAsset?.value) throw new Error('From asset is required.');
      if (!f.toAsset?.value)   throw new Error('To asset is required.');
      if (f.fromAsset.value === f.toAsset.value) throw new Error('From and To assets must be different.');
      var d = {
        from_asset_id:  parseInt(f.fromAsset.value),
        to_asset_id:    parseInt(f.toAsset.value),
        interface_type: f.ifType.value,
        specification:  f.spec.value || null,
        standard:       f.standard.value || null,
        status:         f.status.value,
        drawing_ref:    f.drawingRef.value || null,
        notes:          f.notes.value,
      };
      if (defaults.modernization_id && !existing) d.modernization_id = defaults.modernization_id;
      if (existing) await API.interfaces.update(existing.id, d);
      else          await API.interfaces.create(d);
      if (onSave) onSave();
    },
    existing ? 'Save Changes' : 'Create Interface'
  );
}

/* ── PM Dashboard ── */
async function viewPmDashboard() {
  var wrap=div(''); setContent(wrap);
  var hdr=div('ops-page-header',[el('h2',{text:'Maintenance Dashboard'}),btn('primary','All Procedures →',()=>navigate('pm-procedures'))]);
  wrap.appendChild(hdr);
  var loading=span('ops-muted','Loading…'); wrap.appendChild(loading);
  var _pf=_selectedPlatformIds.length?{platform_ids:_selectedPlatformIds.join(',')}:{};
  var [all,overdue,nodes] = await Promise.all([
    API.procedures.list({..._pf}),
    API.procedures.list({..._pf,overdue:'1'}),
    API.altofleet.list().catch(()=>[])
  ]).catch(e=>{
    loading.remove(); wrap.appendChild(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return [[],[],[]];
  });
  loading.remove();
  var now=Date.now(),in7=now+7*86400000;
  var soon=all.filter(p=>{ var d=p.next_due?new Date(p.next_due).getTime():0; return d>=now&&d<=in7; });

  // Fleet node health buckets
  var offlineNodes=nodes.filter(n=>n.status==='offline');
  var staleNodes=nodes.filter(n=>{
    if(n.status==='offline') return false;
    if(!n.last_seen) return false;
    var age=(Date.now()-new Date(n.last_seen).getTime())/86400000;
    return age>1;
  });
  var nodeAlerts=offlineNodes.length+staleNodes.length;

  var grid=div('stats-grid');
  [[all.length,'Active Procedures','stat-teal'],[soon.length,'Due This Week','stat-blue'],
   [overdue.length,'Overdue','stat-orange'],[nodeAlerts,'Node Alerts',nodeAlerts>0?'stat-red':'stat-teal']
  ].forEach(row=>{
    var c=div('stat-card '+row[2]); c.appendChild(el('div',{cls:'stat-label',text:row[1]})); c.appendChild(el('div',{cls:'stat-value',text:String(row[0])})); grid.appendChild(c);
  });
  wrap.appendChild(grid);

  // Fleet Node health panel
  if(nodes.length>0){
    var nc=div('ops-card'); nc.style.marginBottom='20px';
    nc.appendChild(div('ops-card-header',[
      el('h3',{text:'Fleet Node Health'}),
      btn('ghost ops-btn-sm','View All Nodes →',()=>navigate('fleet-nodes'))
    ]));
    if(offlineNodes.length===0&&staleNodes.length===0){
      nc.appendChild(el('div',{cls:'ops-empty',text:'✓ All nodes reporting normally'}));
    } else {
      var alertNodes=[...offlineNodes,...staleNodes].slice(0,5);
      nc.appendChild(makeTable(['Node','Status','Last Seen','Issue',''],
        alertNodes.map(n=>{
          var age=n.last_seen?Math.floor((Date.now()-new Date(n.last_seen).getTime())/60000)+'m ago':'never';
          var issue=offlineNodes.includes(n)?'Offline — missed heartbeat':'No heartbeat >24h';
          var badge=offlineNodes.includes(n)?span('ops-badge badge-red','OFFLINE'):span('ops-badge badge-orange','STALE');
          var defBtn=btn('danger ops-btn-sm','Create Deficiency',async()=>{
            await pmNodeCreateDeficiency(n);
            await viewPmDashboard();
          });
          return [el('strong',{text:n.hostname||n.local_uuid}),badge,span('ops-muted ops-small',age),
            span('ops-small',issue),defBtn];
        })
      ));
    }
    wrap.appendChild(nc);
  }

  var two=div('ops-two-col');
  var oc=div('ops-card');
  oc.appendChild(div('ops-card-header',[el('h3',{text:'⚠ Overdue — Action Required'})]));
  oc.appendChild(makeTable(['Procedure','Asset','Overdue By','Assigned',''],
    overdue.map(p=>{
      var doneBtn=btn('success ops-btn-sm','✓ Done',()=>{ showCompleteModal(p, viewPmDashboard); });
      return [el('strong',{text:p.name}),span('ops-link-chip','#'+p.asset_id),
        span('ops-badge badge-red',overdueDays(p.next_due)+'d'),p.assigned_to||span('ops-danger ops-small','Unassigned'),doneBtn];
    })));
  two.appendChild(oc);
  var sc=div('ops-card');
  sc.appendChild(div('ops-card-header',[el('h3',{text:'Coming Due — Next 7 Days'})]));
  sc.appendChild(makeTable(['Procedure','Category','Due','SOP','Assigned'],
    soon.map(p=>[el('strong',{text:p.name}),span('ops-tag',p.category),dueBadge(p.next_due),
      p.document_ref?sopLink(p.document_ref):span('ops-muted','—'),p.assigned_to||'—'])));
  two.appendChild(sc);
  wrap.appendChild(two);
}

async function pmNodeCreateDeficiency(node){
  var summary='Fleet Node Offline: '+(node.hostname||node.local_uuid);
  var desc='Node '+(node.hostname||node.local_uuid)+' ('+(node.ip_address||'unknown IP')+') has missed its heartbeat and was flagged offline. '
    +'Last seen: '+(node.last_seen?new Date(node.last_seen).toLocaleString():'never')+'. '
    +'Investigate connectivity and confirm the AltoFleet agent is running (sudo systemctl status altofleet).';
  try{
    await API.deficiencies.create({
      summary: summary,
      description: desc,
      severity: 'SEV-2',
      status: 'open',
      discovery_method: 'altofleet'
    });
    showToast('Deficiency created for node '+(node.hostname||node.local_uuid));
  }catch(e){
    showToast('Failed to create deficiency: '+e.message,'error');
  }
}

/* ── Procedure Detail View ── */
function viewProcedureDetail(p, onClose) {
  var body = el('div', {});

  function row(label, valueNode) {
    var r = el('div', {style:'display:flex;gap:16px;padding:10px 0;border-bottom:1px solid #2e3650;align-items:flex-start;'});
    var l = el('div', {style:'width:160px;flex-shrink:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.7px;padding-top:2px;', text:label});
    var v = el('div', {style:'flex:1;color:#e2e8f0;font-size:13px;'});
    if (typeof valueNode === 'string' || typeof valueNode === 'number') {
      v.textContent = valueNode || '—';
    } else if (valueNode) {
      v.appendChild(valueNode);
    } else {
      v.textContent = '—';
    }
    r.appendChild(l); r.appendChild(v);
    return r;
  }

  // Header info
  var hdrDiv = el('div', {style:'margin-bottom:20px;'});
  var metaDiv = el('div', {style:'display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;'});
  metaDiv.appendChild(span('ops-muted', p.proc_id_label));
  metaDiv.appendChild(dueBadge(p.next_due));
  if (p.computed_status === 'overdue') metaDiv.appendChild(span('ops-badge badge-red', 'OVERDUE'));
  hdrDiv.appendChild(metaDiv);
  body.appendChild(hdrDiv);

  // Schedule section
  var schedHdr = el('div', {style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'Schedule'});
  body.appendChild(schedHdr);

  var ttype = p.trigger_type || 'calendar';
  if (ttype === 'meter') {
    body.appendChild(row('Type', el('span',{text:'🔢 Meter-Based',style:'color:#38bdf8;font-weight:700;'})));
    body.appendChild(row('Meter', (p.meter_type||'—')+' ('+( p.meter_unit||'units')+')'));
    var mCurrent = p.meter_last_value!=null ? p.meter_last_value.toLocaleString()+' '+( p.meter_unit||'') : '—';
    var mNext    = p.meter_next_due_value!=null ? p.meter_next_due_value.toLocaleString()+' '+(p.meter_unit||'') : '—';
    var mInterval= p.meter_interval!=null ? 'every '+p.meter_interval.toLocaleString()+' '+(p.meter_unit||'units') : '—';
    body.appendChild(row('Last Reading', mCurrent));
    body.appendChild(row('Next Due At',  el('span',{text:mNext,style:'color:'+(p.computed_status==='overdue'?'#f87171':p.computed_status==='due_soon'?'#f59e0b':'#4ade80')+';font-weight:700;'})));
    body.appendChild(row('Interval', mInterval));
    body.appendChild(row('Check-in Periodicity', p.periodicity||'—'));
    body.appendChild(row('Last Check-in', p.last_completed ? p.last_completed.slice(0,10) : '—'));
    if (p.next_due) body.appendChild(row('Next Check-in Due', p.next_due.slice(0,10)));
  } else if (ttype === 'as_required') {
    var asrStatus = p.pending_trigger
      ? el('span',{text:'⚡ TRIGGERED — Pending Completion',style:'color:#f59e0b;font-weight:700;'})
      : el('span',{text:'On Condition',style:'color:#64748b;'});
    body.appendChild(row('Type', el('span',{text:'⚡ As Required / Condition-Based',style:'color:#f59e0b;font-weight:700;'})));
    body.appendChild(row('Status', asrStatus));
    if (p.trigger_condition) body.appendChild(row('Trigger Condition', p.trigger_condition));
    if (p.trigger_source_id) {
      var srcLink = el('span',{text:'PM-'+String(p.trigger_source_id).padStart(4,'0'),style:'color:#38bdf8;cursor:pointer;text-decoration:underline;'});
      srcLink.onclick = async function(){ try{ var src=await API.procedures.get(p.trigger_source_id); viewProcedureDetail(src); }catch(e){} };
      var srcRow = el('div',{style:'display:flex;gap:8px;align-items:center;'});
      srcRow.appendChild(srcLink);
      if (p.trigger_threshold!=null) srcRow.appendChild(el('span',{text:'triggers when reading ≥ '+p.trigger_threshold.toLocaleString()+' '+(p.meter_unit||''),style:'font-size:11px;color:#475569;'}));
      body.appendChild(row('Trigger Source', srcRow));
    }
    body.appendChild(row('Last Completed', p.last_completed ? p.last_completed.slice(0,10) : '—'));
  } else {
    body.appendChild(row('Periodicity',    p.periodicity || '—'));
    body.appendChild(row('Last Completed', p.last_completed ? p.last_completed.slice(0,10) : '—'));
    body.appendChild(row('Next Due',       p.next_due ? p.next_due.slice(0,10) : '—'));
  }
  body.appendChild(row('Est. Hours',     p.est_hours ? p.est_hours + 'h' : '—'));

  // Assignment section
  var assignHdr = el('div', {style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'Assignment'});
  body.appendChild(assignHdr);
  body.appendChild(row('Asset',       '#' + p.asset_id));
  body.appendChild(row('Assigned To', p.assigned_to || '—'));
  body.appendChild(row('Category',    p.category || '—'));
  if (p.document_ref) body.appendChild(row('SOP Document', sopLink(p.document_ref)));
  if (p.ts_document_id) {
    var tsRow = div(''); tsRow.style.cssText='display:flex;gap:8px;align-items:center;';
    var tsBadge = el('span',{text:'🔍 520 T/S DM',style:'font-size:10px;font-weight:700;color:#fbbf24;background:#1a120050;border:1px solid #fbbf2444;border-radius:4px;padding:2px 7px;'});
    var tsLnk = el('span',{text:'loading…',style:'font-size:12px;color:#fbbf24;cursor:pointer;text-decoration:underline;'});
    tsLnk.onclick = function(){ viewDocDetail(p.ts_document_id); };
    API.documents.get(p.ts_document_id).then(function(dm){ tsLnk.textContent=dm.title||dm.doc_number||('DM #'+p.ts_document_id); }).catch(function(){ tsLnk.textContent='DM #'+p.ts_document_id; });
    tsRow.appendChild(tsBadge); tsRow.appendChild(tsLnk);
    body.appendChild(row('T/S Procedure', tsRow));
  }
  if (p.document_id) {
    var dmBtns = el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap;'});
    var clBtn = el('button',{text:'📋 Open Checklist',style:'padding:5px 12px;border-radius:6px;border:1.5px solid #4ade80;background:rgba(74,222,128,0.1);color:#4ade80;font-size:12px;font-weight:600;cursor:pointer;'});
    clBtn.onclick = () => openDmChecklist(p.document_id, p.title || p.category || 'Procedure');
    var pdfBtn = el('button',{text:'🖨 Print / PDF',style:'padding:5px 12px;border-radius:6px;border:1.5px solid #94a3b8;background:rgba(148,163,184,0.1);color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;'});
    pdfBtn.onclick = () => printDmProcedure(p.document_id, p.title || p.category || 'Procedure');
    dmBtns.appendChild(clBtn); dmBtns.appendChild(pdfBtn);
    body.appendChild(row('Procedure DM', dmBtns));
  }

  // TDP Documents from asset folder
  if (p.asset_id) {
    var tdpHdrEl = el('div', {style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'📁 Technical Data Package'});
    body.appendChild(tdpHdrEl);
    var tdpLoading = el('div', {style:'color:#64748b;font-size:12px;', text:'Loading TDP documents…'});
    body.appendChild(tdpLoading);

    // Load asset to get TDP source
    API.assets.get(p.asset_id).then(async asset => {
      var srcId   = asset.tdp_source_asset_id || asset.id;
      var srcName = asset.tdp_source_asset_id ? asset.name : asset.name;
      var tdpData = await API.files.getTdp(srcId, srcName).catch(() => null);
      tdpLoading.remove();
      var sections = tdpData?.sections || [];
      var TDP_ICONS2 = {'Drawings':'📐','Tech Manuals':'📖','Test Plans':'🧪','Training':'🎓','PM SOPs':'🔧','Other':'📄'};

      // Show PM SOPs first, then others
      var sorted = [...sections].sort((a,b) => a.name === 'PM SOPs' ? -1 : b.name === 'PM SOPs' ? 1 : 0);
      sorted.forEach(section => {
        if (!section.files.length) return;
        var secLabel = el('div', {style:'font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin:8px 0 4px;', text: (TDP_ICONS2[section.name]||'📄') + ' ' + section.name});
        body.appendChild(secLabel);
        section.files.forEach(file => {
          var fileLink = el('div', {style:'display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;border-bottom:1px solid #1e2540;'});
          var icon = file.mime?.includes('pdf') ? '📕' : file.mime?.includes('image') ? '🖼' : '📄';
          fileLink.appendChild(el('span', {text: icon + ' ' + file.name, style:'color:#38bdf8;font-size:12px;flex:1;'}));
          fileLink.onclick = () => showFileViewer(file);
          body.appendChild(fileLink);
        });
      });

      if (sections.every(s => !s.files.length)) {
        body.appendChild(el('div', {style:'color:#64748b;font-size:12px;', text:'No TDP documents found. Add documents through the Asset detail view.'}));
      }
    }).catch(() => { tdpLoading.textContent = 'Could not load TDP documents.'; });
  }

  // Description
  if (p.description) {
    var descHdr = el('div', {style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'Description'});
    body.appendChild(descHdr);
    var descP = el('p', {style:'color:#94a3b8;font-size:13px;line-height:1.6;margin:0;', text:p.description});
    body.appendChild(descP);
  }

  // Closeout section — only show if completed
  if (p.last_completed) {
    var closeHdr = el('div', {style:'font-size:12px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'Last Closeout'});
    body.appendChild(closeHdr);
    body.appendChild(row('Actual Hours',    p.actual_hours ? p.actual_hours + 'h' : '—'));
    body.appendChild(row('Parts Cost',      p.actual_parts_cost ? '$' + Number(p.actual_parts_cost).toFixed(2) : '—'));
    body.appendChild(row('Labor Cost',      p.actual_labor_cost ? '$' + Number(p.actual_labor_cost).toFixed(2) : '—'));
    var totalCost = (parseFloat(p.actual_parts_cost)||0) + (parseFloat(p.actual_labor_cost)||0);
    if (totalCost > 0) body.appendChild(row('Total Cost', '$' + totalCost.toFixed(2)));
    body.appendChild(row('Notes',           p.completion_notes || '—'));
  }

  // Skills Required — placeholder appended now (holds DOM position), filled async
  var mpSection = div(''); body.appendChild(mpSection);
  (async function() {
    var mpHdr = el('div',{style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px;',text:'👷 Manpower Requirements'});
    mpSection.appendChild(mpHdr);

    // ── DM 200 inherited requirements (authoritative source) ──────────────────
    if (p.document_id) {
      var [dmReqs, dmDoc] = await Promise.all([
        API.manpower.requirements.list({source_type:'document', source_id:p.document_id}).catch(()=>[]),
        API.documents.get(p.document_id).catch(()=>null),
      ]);
      if (dmReqs.length) {
        var dmSub = el('div',{style:'display:flex;align-items:center;gap:8px;margin-bottom:6px;'});
        dmSub.appendChild(el('span',{text:'From DM '+(dmDoc?.info_code||'200')+':',style:'font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;'}));
        if (dmDoc) {
          var dmLink = el('span',{text:dmDoc.title||dmDoc.doc_number||'DM #'+p.document_id,style:'font-size:10px;color:#38bdf8;cursor:pointer;text-decoration:underline;'});
          dmLink.onclick=function(){ overlay.remove(); navigate('doc-detail',p.document_id); };
          dmSub.appendChild(dmLink);
        }
        dmSub.appendChild(el('span',{text:'(edit in DM)',style:'font-size:9px;color:#334155;font-style:italic;'}));
        mpSection.appendChild(dmSub);

        var dmColHdr = div('');
        dmColHdr.style.cssText='display:grid;grid-template-columns:1fr 60px 70px 110px;gap:8px;padding:5px 0;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #1e2540;';
        ['Skill / Cert','Qty','Hours','Coverage'].forEach(function(h){ dmColHdr.appendChild(el('span',{text:h})); });
        mpSection.appendChild(dmColHdr);

        dmReqs.forEach(function(req){
          var row = div('');
          row.style.cssText='display:grid;grid-template-columns:1fr 60px 70px 110px;gap:8px;padding:7px 0;border-bottom:1px solid #0f172a;align-items:center;font-size:12px;';
          var skillName = req.skill ? req.skill.code+' — '+req.skill.name : (req.notes||'General Labor');
          row.appendChild(el('span',{text:skillName,style:'color:#94a3b8;'}));
          row.appendChild(el('span',{text:req.qty_required+'×',style:'color:#7dd3fc;font-weight:700;'}));
          row.appendChild(el('span',{text:req.duration_hours ? req.duration_hours+'h' : '—',style:'color:#64748b;'}));
          var qualified=req.qualified_count||0, needed=req.qty_required||1;
          var covColor=qualified>=needed?'#4ade80':qualified>0?'#f59e0b':'#ef4444';
          var covText=qualified>=needed?'✓ '+qualified+' qualified':qualified>0?'⚠ '+qualified+'/'+needed:'✗ None';
          var covEl=el('span',{text:covText,style:'font-size:11px;font-weight:700;color:'+covColor+';'});
          if (req.skill_id) { covEl.style.cursor='pointer'; covEl.title='Click to see roster'; covEl.onclick=function(){ API.manpower.skills.get(req.skill_id).then(function(sk){ showSkillRoster(sk); }).catch(function(){}); }; }
          row.appendChild(covEl);
          mpSection.appendChild(row);
        });
        mpSection.appendChild(el('div',{style:'margin-bottom:4px;'}));
      }
    }

    // ── PM-specific additional requirements ───────────────────────────────────
    mpSection.appendChild(el('div',{style:'font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin:10px 0 4px;',text:'Additional PM Requirements'}));
    var pmMpContainer = div(''); mpSection.appendChild(pmMpContainer);
    var cw = !!(await canWrite().catch(function(){ return false; }));
    renderManpowerSection('procedure', p.id, pmMpContainer, cw);
    var firstChild = pmMpContainer.firstElementChild;
    if (firstChild && firstChild.textContent.includes('Manpower Requirements')) firstChild.style.display='none';
  })();

  // Actions row
  var actRow = el('div', {style:'display:flex;gap:10px;margin-top:24px;'});
  var editBtn = el('button', {style:'padding:8px 18px;border-radius:8px;border:1.5px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;', text:'Edit'});
  editBtn.onclick = async () => {
    overlay.remove();
    var f = await buildProcedureForm(p, null);
    modal('Edit Procedure — ' + p.proc_id_label, f.wrap, async () => {
      await API.procedures.update(p.id, f.collect());
      if (onClose) onClose();
    }, 'Save Changes');
  };
  var doneBtn2 = el('button', {style:'padding:8px 18px;border-radius:8px;border:1.5px solid #16803a;background:rgba(22,128,58,0.2);color:#4ade80;font-size:13px;font-weight:700;cursor:pointer;', text:'✓ Mark Complete'});
  doneBtn2.onclick = () => {
    overlay.remove();
    showCompleteModal(p, onClose || (()=>{}));
  };
  var lotoBtn = el('button', {style:'padding:8px 18px;border-radius:8px;border:1.5px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;', text:'🔒 Initiate LOTO'});
  lotoBtn.onclick = () => {
    overlay.remove();
    showLotoForm(null, lotoId => navigate('loto-detail', lotoId), {
      session_type:   'pm',
      linked_proc_id: p.id,
    });
  };
  actRow.appendChild(editBtn);
  actRow.appendChild(doneBtn2);
  actRow.appendChild(lotoBtn);
  body.appendChild(actRow);

  // View-only modal — build it manually without a save button
  var overlay=el('div',{style:'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'});
  var box=el('div',{style:'background:#1e2540;border:1px solid #3e4a65;border-radius:16px;width:740px;max-width:calc(100vw - 40px);max-height:calc(100vh - 60px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.9);'});
  var hdr=el('div',{style:'display:flex;align-items:center;padding:20px 24px;border-bottom:1px solid #2e3650;flex-shrink:0;background:#161d30;'});
  var h2=el('h2',{style:'font-size:17px;font-weight:800;margin:0;flex:1;color:#e2e8f0;font-family:inherit;',text:p.name});
  var xb=el('button',{style:'background:none;border:none;cursor:pointer;font-size:20px;color:#64748b;',text:'✕',onclick:()=>overlay.remove()});
  hdr.appendChild(h2); hdr.appendChild(xb);
  var bodyWrap=el('div',{style:'padding:24px;overflow-y:auto;flex:1;'});
  bodyWrap.appendChild(body);
  box.appendChild(hdr); box.appendChild(bodyWrap);
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}


/* ── Deficiency Closeout Modal ── */
function showCloseDeficiencyModal(def, onDone) {
  var overlay = div('ops-modal-overlay');
  var m = div('ops-modal');
  m.style.maxWidth = '560px';
  m.appendChild(el('h3', {text: 'Close Deficiency: ' + def.def_id_label}));
  m.appendChild(el('p', {cls:'ops-muted', text: def.summary}));

  function field(label, placeholder, multiline) {
    var wrap = div('ops-field');
    wrap.appendChild(el('label', {text: label}));
    var input;
    if (multiline) {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = 'number';
    }
    input.placeholder = placeholder || '';
    input.className = 'ops-input';
    wrap.appendChild(input);
    return { wrap, input };
  }

  var rootCause        = field('Root Cause *',              'What caused this deficiency?', true);
  var correctiveAction = field('Corrective Action Taken *', 'What was done to resolve it?', true);
  var partsCost        = field('Actual Parts Cost ($)',      'e.g. 45.00', false);
  var laborCost        = field('Actual Labor Cost ($)',      'e.g. 120.00', false);
  var manDays          = field('Actual Man-Days',            'e.g. 0.5', false);

  [rootCause.wrap, correctiveAction.wrap, partsCost.wrap, laborCost.wrap, manDays.wrap]
    .forEach(function(w) { m.appendChild(w); });

  var btnRow = div('ops-btn-row');
  var cancelBtn = btn('secondary', 'Cancel', function() { document.body.removeChild(overlay); });
  var submitBtn = btn('danger', '✓ Close Deficiency', async function() {
    if (!rootCause.input.value.trim()) { alert('Root cause is required.'); return; }
    if (!correctiveAction.input.value.trim()) { alert('Corrective action is required.'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      var data = {
        status: 'closed',
        root_cause: rootCause.input.value.trim(),
        corrective_action: correctiveAction.input.value.trim(),
      };
      if (partsCost.input.value) data.actual_parts_cost = parseFloat(partsCost.input.value);
      if (laborCost.input.value) data.actual_labor_cost = parseFloat(laborCost.input.value);
      if (manDays.input.value)   data.actual_man_days   = parseFloat(manDays.input.value);
      await API.deficiencies.update(def.id, data);
      await API.deficiencies.addNote(def.id,
        'CLOSED — Root cause: ' + data.root_cause + '. Corrective action: ' + data.corrective_action + '.');
      document.body.removeChild(overlay);
      onDone();
    } catch(e) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Close Deficiency';
      alert('Error: ' + e.message);
    }
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  m.appendChild(btnRow);
  overlay.appendChild(m);
  document.body.appendChild(overlay);
}

/* ── PM Closeout Modal ── */
function showCompleteModal(proc, onDone) {
  var overlay = div('ops-modal-overlay');
  var modal   = div('ops-modal');
  modal.appendChild(el('h3', {text: '✓ Complete: ' + proc.name}));
  var subLine = proc.proc_id_label;
  if (proc.trigger_type === 'meter') {
    subLine += ' · Meter-Based (' + (proc.meter_unit||'units') + ')';
    if (proc.meter_next_due_value) subLine += ' · Due at ' + proc.meter_next_due_value.toLocaleString();
  } else if (proc.trigger_type === 'as_required') {
    subLine += ' · As Required';
  } else {
    subLine += ' · ' + proc.periodicity;
  }
  modal.appendChild(el('p', {cls:'ops-muted', text: subLine}));

  function field(label, type, placeholder) {
    var wrap = div('ops-field');
    wrap.appendChild(el('label', {text: label}));
    var input = el('input', {});
    input.type = type || 'text';
    input.placeholder = placeholder || '';
    input.className = 'ops-input';
    wrap.appendChild(input);
    return { wrap, input };
  }

  // Meter reading field — shown only for meter PMs
  var meterReading = null;
  if (proc.trigger_type === 'meter') {
    var mBanner = div('');
    mBanner.style.cssText='background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:12px 14px;margin-bottom:10px;';
    mBanner.appendChild(el('div',{style:'font-size:10px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;',text:'🔢 Record Meter Reading'}));
    var mHint = 'Last recorded: '+(proc.meter_last_value!=null?proc.meter_last_value.toLocaleString()+' '+(proc.meter_unit||'units'):'(none)')+
      (proc.meter_next_due_value?' · Next due at '+proc.meter_next_due_value.toLocaleString():'');
    mBanner.appendChild(el('div',{style:'font-size:11px;color:#64748b;margin-bottom:8px;',text:mHint}));
    var mField = field('Current '+( proc.meter_type==='odometer'?'Odometer Reading':proc.meter_type==='flight_hours'?'Flight Hours':proc.meter_type==='engine_hours'?'Engine Hours':proc.meter_type==='cycles'?'Cycle Count':'Meter Reading')+' ('+(proc.meter_unit||'units')+')', 'number', proc.meter_last_value||'');
    mBanner.appendChild(mField.wrap);
    modal.appendChild(mBanner);
    meterReading = mField;
  }

  var hours     = field('Hours Spent',    'number', 'e.g. 2.5');
  var partsCost = field('Parts Cost ($)', 'number', 'e.g. 45.00');
  var laborCost = field('Labor Cost ($)', 'number', 'e.g. 120.00');

  var notesWrap = div('ops-field');
  notesWrap.appendChild(el('label', {text: 'Completion Notes'}));
  var notesInput = document.createElement('textarea');
  notesInput.className = 'ops-input';
  notesInput.rows = 4;
  notesInput.placeholder = 'What was done, findings, parts replaced…';
  notesWrap.appendChild(notesInput);

  [hours.wrap, partsCost.wrap, laborCost.wrap, notesWrap].forEach(w => modal.appendChild(w));

  // Issue logging section — shown when a 520 T/S DM is linked to this PM
  var defSummaryInp = null;
  var logDefChk = null;
  if (proc.ts_document_id) {
    var issueBanner = div('');
    issueBanner.style.cssText='background:#1a0d0d;border:1px solid #7f1d1d;border-radius:8px;padding:12px 14px;margin-top:8px;';
    issueBanner.appendChild(el('div',{style:'font-size:10px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;',text:'⚠ Issue Found? Log a Deficiency'}));
    var logRow = div(''); logRow.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    logDefChk = document.createElement('input'); logDefChk.type='checkbox'; logDefChk.id='_chk_log_def';
    var logLbl = el('label',{text:'Create deficiency from this PM completion (T/S DM 520 pre-linked)',style:'font-size:12px;color:#f87171;cursor:pointer;'});
    logLbl.htmlFor='_chk_log_def';
    logRow.appendChild(logDefChk); logRow.appendChild(logLbl);
    issueBanner.appendChild(logRow);
    var defSumWrap = div('ops-field'); defSumWrap.style.display='none';
    defSumWrap.appendChild(el('label',{text:'Deficiency Summary *',style:'color:#f87171;'}));
    defSummaryInp = el('input',{});
    defSummaryInp.className='ops-input'; defSummaryInp.placeholder='e.g., Filter bypass valve leak found during inspection';
    defSumWrap.appendChild(defSummaryInp);
    issueBanner.appendChild(defSumWrap);
    logDefChk.onchange = function(){ defSumWrap.style.display = logDefChk.checked ? '' : 'none'; };
    issueBanner.appendChild(el('div',{text:'T/S DM: 520 — linked (will auto-populate fault isolation procedure on the deficiency)',style:'font-size:10px;color:#475569;margin-top:4px;'}));
    modal.appendChild(issueBanner);
  }

  var btnRow = div('ops-btn-row');
  var cancelBtn = btn('secondary', 'Cancel', () => document.body.removeChild(overlay));

  var submitBtn = btn('success', '✓ Mark Complete', async () => {
    // Meter PMs require a reading
    if (proc.trigger_type === 'meter' && meterReading && !meterReading.input.value) {
      alert('Please enter the current meter reading before marking complete.');
      return;
    }
    if (logDefChk && logDefChk.checked && defSummaryInp && !defSummaryInp.value.trim()) {
      alert('Enter a deficiency summary or uncheck "Create deficiency".');
      defSummaryInp.focus(); return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      var data = {};
      if (hours.input.value)     data.actual_hours      = parseFloat(hours.input.value);
      if (partsCost.input.value) data.actual_parts_cost = parseFloat(partsCost.input.value);
      if (laborCost.input.value) data.actual_labor_cost = parseFloat(laborCost.input.value);
      if (notesInput.value)      data.completion_notes  = notesInput.value;
      if (meterReading && meterReading.input.value) data.meter_current_value = parseFloat(meterReading.input.value);
      if (logDefChk && logDefChk.checked && defSummaryInp && defSummaryInp.value.trim()) {
        data.log_deficiency    = 1;
        data.deficiency_summary = defSummaryInp.value.trim();
      }
      var result = await API.procedures.complete(proc.id, data);
      document.body.removeChild(overlay);
      // If a deficiency was auto-created, notify and offer to navigate
      if (result && result.deficiency_id) {
        var goBtn = confirm('✓ Deficiency DEF-'+String(result.deficiency_id).padStart(4,'0')+' created with T/S procedure pre-linked.\n\nOpen the deficiency now?');
        if (goBtn) { navigate('def-detail', result.deficiency_id); return; }
      }
      // Meter PM triggered as-required PMs
      if (result && result.triggered_pm_ids && result.triggered_pm_ids.length) {
        var msg = '⚡ '+result.triggered_pm_ids.length+' as-required PM'+(result.triggered_pm_ids.length>1?'s':'')+
          ' flagged due based on this meter reading:\n  PM-'+result.triggered_pm_ids.map(function(pid){ return String(pid).padStart(4,'0'); }).join(', PM-');
        setTimeout(function(){ alert(msg); }, 200);
      }
      onDone();
    } catch(e) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Mark Complete';
      alert('Error: ' + e.message);
    }
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(submitBtn);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

/* ── PM Procedures ── */
async function viewPmProcedures() {
  var wrap=div(''); setContent(wrap);
  var hdr=div('ops-page-header',[el('h2',{text:'PM Procedures'})]);
  var newBtn=btn('primary','+ New Procedure',async()=>{
    var f=await buildProcedureForm({},null);
    modal('New PM Procedure',f.wrap,async()=>{
      var d=f.collect(); if(!d.name.trim()) throw new Error('Name required.'); if(!d.asset_id) throw new Error('Asset required.');
      await API.procedures.create(d); load();
    },'Create Procedure');
  });
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  var tabs=div('ops-tabs'); var activeTab='all';
  [['all','All'],['overdue','Overdue'],['due_soon','Due This Week']].forEach(td=>{
    var t=el('button',{cls:'ops-tab'+(td[0]===activeTab?' active':''),text:td[1]});
    t.onclick=()=>{ activeTab=td[0]; tabs.querySelectorAll('.ops-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); load(); };
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);
  var cardEl=div('ops-card'); wrap.appendChild(cardEl);
  var procs=[];

  async function load(){
    cardEl.innerHTML=''; cardEl.appendChild(span('ops-muted','  Loading…'));
    var p={}; if(activeTab==='overdue') p.overdue='1';
    try{ if(_selectedPlatformIds.length) p.platform_ids=_selectedPlatformIds.join(','); procs=await API.procedures.list(p); }
    catch(e){ cardEl.innerHTML='<div class="ops-empty" style="color:#f87171">⚠ '+e.message+'</div>'; return; }
    if(activeTab==='due_soon'){ var now=Date.now(),in7=now+7*86400000; procs=procs.filter(p=>{var d=p.next_due?new Date(p.next_due).getTime():0;return d>=now&&d<=in7;}); }
    cardEl.innerHTML='';
    cardEl.appendChild(makeTable(
      ['ID','Procedure','Asset','Category','Periodicity','Last Done','Next Due','SOP','Assigned',''],
      procs.map(p=>{
        var editBtn=el('button',{cls:'ops-btn ops-btn-sm',text:'Edit'});
        editBtn.onclick=async e=>{ e.stopPropagation();
          var f=await buildProcedureForm(p,null);
          modal('Edit Procedure — '+p.proc_id_label,f.wrap,async()=>{
            await API.procedures.update(p.id,f.collect()); load();
          },'Save Changes');
        };
        var doneBtn=btn('success ops-btn-sm','✓ Done',e=>{ e.stopPropagation(); showCompleteModal(p, load); });
        var actionWrap=div(''); actionWrap.style.cssText='display:flex;gap:4px;';
        actionWrap.appendChild(editBtn); actionWrap.appendChild(doneBtn);
        var nameEl = el('strong',{text:p.name,style:'cursor:pointer;color:#38bdf8;'});
        nameEl.onclick = e => { e.stopPropagation(); viewProcedureDetail(p, load); };
        // Periodicity / schedule column — adapted by trigger type
        var schedCell;
        if (p.trigger_type==='meter') {
          var pct = (p.meter_last_value!=null && p.meter_next_due_value!=null && p.meter_next_due_value>0)
            ? Math.min(100, Math.round((p.meter_last_value/(p.meter_next_due_value))*100)) : null;
          var mText = (p.meter_last_value!=null?p.meter_last_value.toLocaleString():'—')+
            ' / '+(p.meter_next_due_value!=null?p.meter_next_due_value.toLocaleString():'?')+
            ' '+(p.meter_unit||'');
          schedCell = div(''); schedCell.style.cssText='font-size:11px;';
          schedCell.appendChild(el('div',{text:'🔢 '+mText,style:'color:'+(p.computed_status==='overdue'?'#f87171':p.computed_status==='due_soon'?'#f59e0b':'#94a3b8')+';font-weight:600;'}));
          if (pct!==null) {
            var bar=div(''); bar.style.cssText='width:80px;height:4px;background:#1e2540;border-radius:2px;margin-top:3px;';
            var fill=div(''); fill.style.cssText='height:100%;border-radius:2px;width:'+pct+'%;background:'+(pct>=100?'#f87171':pct>=75?'#f59e0b':'#4ade80')+';';
            bar.appendChild(fill); schedCell.appendChild(bar);
          }
        } else if (p.trigger_type==='as_required') {
          schedCell = el('span',{text: p.pending_trigger?'⚡ DUE':'⚡ On Condition',
            style:'font-size:11px;color:'+(p.pending_trigger?'#f59e0b':'#64748b')+';font-weight:700;'});
        } else {
          schedCell = el('span',{text:p.periodicity,style:'font-size:12px;'});
        }
        // Next Due column — hide for as_required (no fixed date)
        var nextDueCell = (p.trigger_type==='as_required') ? span('ops-muted','—') : dueBadge(p.next_due);
        return [span('ops-muted',p.proc_id_label),nameEl,span('ops-link-chip','#'+p.asset_id),
          span('ops-tag',p.category),schedCell,span('ops-muted',fmtDate(p.last_completed)),
          nextDueCell,p.document_ref?sopLink(p.document_ref):span('ops-muted','—'),
          p.assigned_to||'—',actionWrap];
      })
    ));
  }
  await load();
}

/* ── Deficiency List ── */
async function viewDeficiencies(initialTab) {
  var wrap=div(''); setContent(wrap);
  var hdr=div('ops-page-header',[el('h2',{text:'Deficiency Register'})]);
  var newBtn=btn('primary','+ Log Deficiency',async()=>{
    var f=await buildDeficiencyForm({},null);
    modal('Log New Deficiency',f.wrap,async()=>{
      var d=f.collect(); if(!d.summary.trim()) throw new Error('Summary required.'); if(!d.asset_id) throw new Error('Asset required.');
      await API.deficiencies.create(d); load();
    },'Log Deficiency');
  });
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  var tabs=div('ops-tabs'); var activeTab=initialTab||'open';
  var tabDefs=[['open','All Open'],['SEV-1','SEV-1'],['SEV-2','SEV-2'],['SEV-3','SEV-3'],['SEV-4','SEV-4'],['SEV-5','SEV-5'],['in_work','In Work'],['closed','Closed']];
  tabDefs.forEach(td=>{
    var t=el('button',{cls:'ops-tab'+(td[0]===activeTab?' active':''),text:td[1]});
    t.onclick=()=>{ activeTab=td[0]; tabs.querySelectorAll('.ops-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); load(); };
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);
  var cardEl=div('ops-card'); wrap.appendChild(cardEl);
  var defs=[];

  async function load(){
    cardEl.innerHTML=''; cardEl.appendChild(span('ops-muted','  Loading…'));
    var p={};
    if(activeTab==='open') p.status='open_all';
    else if(/^SEV-\d$/.test(activeTab)){p.status='open_all';p.severity=activeTab;}
    else if(activeTab==='in_work') p.status='in_work';
    else if(activeTab==='closed')  p.status='closed';
    try{ if(_selectedPlatformIds.length) p.platform_ids=_selectedPlatformIds.join(','); defs=await API.deficiencies.list(p); }
    catch(e){ cardEl.innerHTML='<div class="ops-empty" style="color:#f87171">⚠ '+e.message+'</div>'; return; }
    cardEl.innerHTML='';
    cardEl.appendChild(makeTable(
      ['ID','Summary','Asset','SEV','Status','Assigned','Est. Cost','Man-Days','Opened'],
      defs.map(d=>[span('ops-muted',d.def_id_label),el('strong',{text:d.summary}),
        span('ops-link-chip','#'+d.asset_id),sevBadge(d.severity),statusBadge(d.status),
        d.assigned_to||span('ops-danger ops-small','Unassigned'),
        d.est_total_cost>0?span('ops-warn',fmt$(d.est_total_cost)):'—',
        d.total_man_days>0?d.total_man_days+'d':'—',
        span('ops-muted ops-small',fmtDate(d.created_at))]),
      i=>{ if(defs[i]) navigate('def-detail',defs[i].id); }
    ));
  }
  await load();
}

/* ── Deficiency Detail ── */
async function viewDefDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var [def,users] = await Promise.all([API.deficiencies.get(id),getUsers()]).catch(e=>{
    setContent(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return [];
  });
  if(!def) return;
  var logs=def.logs||def.history||[];
  var wrap=div('');
  var hdr=div('ops-page-header');
  hdr.appendChild(btn('','← Deficiencies',()=>navigate('deficiencies')));
  hdr.appendChild(el('h2',{text:def.def_id_label+' — '+def.summary}));
  hdr.appendChild(sevBadge(def.severity));
  hdr.appendChild(statusBadge(def.status));

  // Edit button
  var editBtn=btn('','✏ Edit',async()=>{
    var f=await buildDeficiencyForm(def,null);
    modal('Edit Deficiency — '+def.def_id_label,f.wrap,async()=>{
      await API.deficiencies.update(id,f.collect()); viewDefDetail(id);
    },'Save Changes');
  });
  hdr.appendChild(editBtn);

  var stSel=sel([['open','Open'],['in_work','In Work'],['waiting_parts','Waiting Parts'],
    ['waiting_approval','Waiting Approval'],['scheduled','Scheduled'],['closed','Closed'],['cancelled','Cancelled']], def.status);
  stSel.style.cssText='width:190px;margin-left:8px';
  stSel.onchange=async()=>{ await API.deficiencies.update(id,{status:stSel.value}); viewDefDetail(id); };
  hdr.appendChild(stSel);
  if(def.status!=='closed')
    hdr.appendChild(btn('danger','✓ Close',()=>{ showCloseDeficiencyModal(def, ()=>viewDefDetail(id)); }));
    hdr.appendChild(btn('','🔧 Escalate to Modernization', () => {
      showModernizationForm(null, async (modId) => {
        if (modId) await API.deficiencies.update(def.id, {modernization_id: modId});
        navigate('modernizations');
      }, {
        title: 'Modernization — ' + def.summary,
        description: 'Initiated from deficiency ' + def.def_id_label,
      });
    }));
  hdr.appendChild(btn('', '🔒 Initiate LOTO', () => showLotoForm(null, lotoId => navigate('loto-detail', lotoId), {
    session_type:   'deficiency',
    linked_def_id:  def.id,
    equipment_name: def.asset_name || '',
    location:       def.location || '',
  })));
  wrap.appendChild(hdr);

  var two=div('ops-two-col');
  var left=div('');

  // Summary card
  var sc=div('ops-card ops-detail-card');
  var section=(title,content,mt)=>{
    var lbl=div('ops-section-label',[document.createTextNode(title)]);
    if(mt) lbl.style.marginTop='14px'; sc.appendChild(lbl);
    if(typeof content==='string') sc.appendChild(el('p',{cls:'ops-notes',text:content||'—'}));
    else sc.appendChild(content);
  };
  section('Summary',def.description||def.summary||'—');
  var lw=div('ops-tags');
  var ac=span('ops-link-chip','⬡ Asset #'+def.asset_id);
  ac.onclick=()=>navigate('asset-detail',def.asset_id);
  lw.appendChild(ac);
  API.assets.get(def.asset_id).then(a=>{
    ac.textContent='⬡ '+(a.asset_code||a.asset_id_label)+' — '+a.name;
  }).catch(()=>{});
  if(def.linked_procedure_id) {
    var pmChip = span('ops-link-chip','⚙ PM #'+def.linked_procedure_id);
    pmChip.style.cursor='pointer'; pmChip.onclick=()=>navigate('pm-procedures'); // future: pm-detail
    lw.appendChild(pmChip);
    // If the linked PM has a DM, offer direct manual jump
    API.procedures.get(def.linked_procedure_id).then(proc=>{
      if (!proc?.document_id) return;
      var manChip = el('span',{text:'📖 Open in Manual',cls:'ops-link-chip',style:'cursor:pointer;color:#a78bfa;border-color:#a78bfa44;background:#1e1a3f44;'});
      manChip.onclick = () => openIetmForDm(proc.document_id);
      lw.appendChild(manChip);
    }).catch(()=>{});
  }
  // 520 DM linkage — troubleshooting procedure for this deficiency
  var dmChipWrap = div('ops-tags'); dmChipWrap.style.marginTop='8px;';
  function render520Chip(docId) {
    dmChipWrap.innerHTML = '';
    if (docId) {
      API.documents.get(docId).then(dm520=>{
        var chip = el('span',{text:'🔍 '+dm520.title,cls:'ops-link-chip',style:'cursor:pointer;color:#fbbf24;border-color:#fbbf2444;'});
        chip.onclick = ()=>navigate('doc-detail', dm520.id);
        dmChipWrap.appendChild(chip);
        if (userCanEdit) {
          var chg = el('span',{text:'↩ Change',cls:'ops-link-chip',style:'cursor:pointer;font-size:10px;color:#64748b;'});
          chg.onclick = ()=>showDmPicker('Link Troubleshooting DM (520)',def.asset_id,['520'],docId,async d=>{
            await API.deficiencies.update(id,{document_id:d?d.id:null}); render520Chip(d?d.id:null);
          });
          dmChipWrap.appendChild(chg);
        }
      }).catch(()=>{});
    } else if (userCanEdit) {
      var link520 = el('span',{text:'+ Link 520 Troubleshooting DM',cls:'ops-link-chip',style:'cursor:pointer;color:#fbbf24;border-color:#fbbf2444;border-style:dashed;'});
      link520.onclick = ()=>showDmPicker('Link Troubleshooting DM (520)',def.asset_id,['520'],null,async d=>{
        if (!d) return;
        await API.deficiencies.update(id,{document_id:d.id}); render520Chip(d.id);
      });
      dmChipWrap.appendChild(link520);
    }
  }
  var userCanEdit = await canWrite().catch(()=>false);
  render520Chip(def.document_id||null);
  lw.appendChild(dmChipWrap);

  section('Linked Configuration',lw,true);
  var dm={walkdown:'Walkdown',pm_procedure:'PM Procedure',automated_alert:'Automated Alert',user_report:'User Report',cve_scan:'CVE Scan',incident_response:'Incident Response'};
  var dw=div(''); dw.appendChild(span('ops-tag',dm[def.discovery_method]||def.discovery_method));
  section('Discovery Method',dw,true);
  section('Requirements to Resolve',def.requirements_to_resolve||'Not specified.',true);
  if(def.outside_entity_required){ var oew=div('ops-tags'); oew.appendChild(span('ops-tag ops-tag-purple','🔧 '+def.outside_entity_required)); section('Outside Entity',oew,true); }
  left.appendChild(sc);

  // Cost card
  var cc=div('ops-card'); cc.style.marginTop='16px';
  cc.appendChild(div('ops-card-header',[el('h3',{text:'Cost & Effort'})]));
  var cg=div('ops-cost-grid');
  [['Est. Parts',fmt$(def.est_parts_cost),'ops-blue'],['Est. Labor',fmt$(def.est_labor_cost),'ops-blue'],
   ['Total Est.',fmt$(def.est_total_cost),'ops-warn'],['MD Internal',def.man_days_internal||'—','ops-teal'],
   ['MD External',def.man_days_external||'—','ops-teal'],['Outage Hrs',def.scheduled_outage_hours||'—','ops-warn']
  ].forEach(row=>{ var cell=div('ops-cost-cell'); cell.appendChild(el('div',{cls:'ops-cost-label',text:row[0]})); cell.appendChild(el('div',{cls:'ops-cost-value '+row[2],text:String(row[1])})); cg.appendChild(cell); });
  cc.appendChild(cg); left.appendChild(cc);


  // Closeout card — only show if closed
  if (def.status === 'closed') {
    var clCard = div('ops-card'); clCard.style.marginTop = '16px';
    clCard.appendChild(div('ops-card-header', [el('h3', {text: '✓ Closeout Details'})]));
    var clg = div('ops-cost-grid');
    var actualTotal = (parseFloat(def.actual_parts_cost)||0) + (parseFloat(def.actual_labor_cost)||0);
    [
      ['Closed By',   def.closed_by || '—',                                          'ops-teal'],
      ['Closed At',   def.closed_at ? fmtDT(def.closed_at) : '—',                   'ops-muted'],
      ['Actual Parts',def.actual_parts_cost > 0 ? fmt$(def.actual_parts_cost) : '—', 'ops-blue'],
      ['Actual Labor',def.actual_labor_cost > 0 ? fmt$(def.actual_labor_cost) : '—', 'ops-blue'],
      ['Total Actual',actualTotal > 0 ? fmt$(actualTotal) : '—',                      'ops-warn'],
      ['Man-Days',    def.actual_man_days > 0 ? String(def.actual_man_days) : '—',    'ops-teal'],
    ].forEach(function(row) {
      var cell = div('ops-cost-cell');
      cell.appendChild(el('div', {cls:'ops-cost-label', text:row[0]}));
      cell.appendChild(el('div', {cls:'ops-cost-value '+row[2], text:row[1]}));
      clg.appendChild(cell);
    });
    clCard.appendChild(clg);
    if (def.root_cause) {
      var rcLbl = div('ops-section-label'); rcLbl.style.marginTop='12px'; rcLbl.textContent='Root Cause';
      clCard.appendChild(rcLbl);
      clCard.appendChild(el('p', {cls:'ops-notes', text:def.root_cause}));
    }
    if (def.corrective_action) {
      var caLbl = div('ops-section-label'); caLbl.style.marginTop='12px'; caLbl.textContent='Corrective Action';
      clCard.appendChild(caLbl);
      clCard.appendChild(el('p', {cls:'ops-notes', text:def.corrective_action}));
    }
    left.appendChild(clCard);
  }

  // Assignment card
  var ac2=div('ops-card'); ac2.style.marginTop='16px';
  ac2.appendChild(div('ops-card-header',[el('h3',{text:'Assignment'})]));
  var ab=div('ops-kv-grid');
  var uchip=uid=>{ var c=div('ops-user-chip'); c.appendChild(el('div',{cls:'ops-avatar',text:initials(uid)})); c.appendChild(span('',uid||'Unassigned')); return c; };
  [['Assigned To',uchip(def.assigned_to)],['Reviewer',uchip(def.reviewed_by)],
   ['Target',def.target_completion?span(new Date(def.target_completion)<new Date()?'ops-danger':'',fmtDate(def.target_completion)):span('ops-muted','—')],
   ['Opened',span('ops-muted',fmtDT(def.created_at)+' · '+def.created_by)]
  ].forEach(row=>{ var kv=div('ops-kv'); kv.appendChild(span('ops-kv-key',row[0])); if(typeof row[1]==='string') kv.appendChild(span('',row[1])); else kv.appendChild(row[1]); ab.appendChild(kv); });
  ac2.appendChild(ab);
  // Reassign
  var rew=div(''); rew.style.cssText='margin-top:14px;padding-top:12px;border-top:1px solid #2e3650;display:flex;gap:8px;align-items:center;';
  var reSel=userDropdown(users,def.assigned_to||'');
  reSel.style.flex='1';
  var reBtn=btn('primary ops-btn-sm','Reassign',async()=>{ await API.deficiencies.update(id,{assigned_to:reSel.value}); viewDefDetail(id); });
  rew.appendChild(reSel); rew.appendChild(reBtn); ac2.appendChild(rew);
  left.appendChild(ac2);
  two.appendChild(left);

  // History
  var right=div('');
  // Supply Requests section
  var supplyReqs = def.supply_requests || [];
  if (supplyReqs.length) {
    var srCard = div('ops-card'); srCard.style.marginBottom = '16px';
    srCard.appendChild(div('ops-card-header', [el('h3', {text: '🛒 Supply Requests (' + supplyReqs.length + ')'})]));
    srCard.appendChild(makeTable(
      ['SRFQ #', 'Status', 'Priority', 'Items', 'Needed By'],
      supplyReqs.map(sr => {
        var statB = span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),
          SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status);
        var priColor = sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray';
        var rfqEl = el('strong', {text: sr.rfq_number||'--', style:'cursor:pointer;color:#38bdf8;'});
        rfqEl.onclick = () => navigate('supply-detail', sr.id);
        return [
          rfqEl, statB,
          span('ops-badge '+priColor, sr.priority),
          span('ops-badge badge-gray', (sr.item_count||0)+' items'),
          sr.needed_by ? sr.needed_by.slice(0,10) : span('ops-muted','--'),
        ];
      })
    ));
    right.insertBefore(srCard, right.firstChild);
  }

  // Budget classification — supervisor/admin only
  if (_userRole.can_admin || _userRole.role === 'shop_supervisor' || _userRole.role === 'platform_manager' || _userRole.role === 'multi_site_manager' || _userRole.role === 'maintenance_planner') {
    var curFyDef = new Date().getFullYear();
    var fyOptsDef = [['','— No FY —']].concat([curFyDef-1,curFyDef,curFyDef+1].map(y=>[String(y),'FY '+y]));
    var bCard = div('ops-card'); bCard.style.marginBottom='16px';
    bCard.appendChild(div('ops-card-header',[el('h3',{text:'💰 Budget Classification'})]));
    var bg = div(''); bg.style.cssText='padding:14px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;';
    var bStatusSel = sel([['unbudgeted','Unbudgeted'],['funded','Funded'],['ufr','UFR — Unfunded Requirement']], def.budget_status||'unbudgeted');
    bStatusSel.style.flex='1;min-width:160px;';
    var bFySel = sel(fyOptsDef, def.budget_fiscal_year ? String(def.budget_fiscal_year) : '');
    bFySel.style.flex='1;min-width:120px;';
    var bSave = btn('primary ops-btn-sm','Save', async()=>{
      bSave.disabled=true; bSave.textContent='Saving…';
      try {
        await API.deficiencies.update(id,{budget_status:bStatusSel.value, budget_fiscal_year:bFySel.value?parseInt(bFySel.value):null});
        def.budget_status=bStatusSel.value; def.budget_fiscal_year=bFySel.value?parseInt(bFySel.value):null;
        bSave.textContent='Saved ✓';
        setTimeout(()=>{ bSave.textContent='Save'; bSave.disabled=false; },1500);
      } catch(e){ bSave.textContent='Save'; bSave.disabled=false; alert(e.message); }
    });
    var bStatusWrap=div(''); bStatusWrap.appendChild(el('div',{text:'Budget Status',style:'font-size:11px;color:#64748b;margin-bottom:4px;'})); bStatusWrap.appendChild(bStatusSel);
    var bFyWrap=div(''); bFyWrap.appendChild(el('div',{text:'Fiscal Year',style:'font-size:11px;color:#64748b;margin-bottom:4px;'})); bFyWrap.appendChild(bFySel);
    bg.appendChild(bStatusWrap); bg.appendChild(bFyWrap); bg.appendChild(bSave);
    bCard.appendChild(bg);
    right.appendChild(bCard);
  }

  var hc=div('ops-card ops-detail-card');
  hc.appendChild(div('ops-card-header',[el('h3',{text:'Troubleshooting History ('+logs.length+')'})]));
  var timeline=div('ops-timeline');
  function renderLogs(list){
    timeline.innerHTML='';
    if(!list.length){ timeline.appendChild(el('div',{cls:'ops-empty',text:'No history entries yet.'})); return; }
    list.forEach(log=>{
      var item=div('ops-tl-item');
      item.appendChild(el('div',{cls:'ops-tl-dot',text:'📋'}));
      var cnt=div('ops-tl-content');
      cnt.appendChild(span('ops-tl-meta',fmtDT(log.created_at)+' · '+(log.created_by||'system')));
      cnt.appendChild(el('div',{cls:'ops-tl-text',text:log.entry_text||log.entry||''}));
      item.appendChild(cnt); timeline.appendChild(item);
    });
  }
  renderLogs(logs); hc.appendChild(timeline);
  var ef=div('ops-log-entry-form');
  ef.appendChild(span('ops-form-label','Add Troubleshooting Entry'));
  var ea=ta('Describe actions taken, test results, parts ordered, communications…','',4);
  ef.appendChild(ea);
  var row=div(''); row.style.cssText='display:flex;justify-content:flex-end;margin-top:10px;';
  var addBtn=btn('primary','Add Entry',async()=>{
    var txt=ea.value.trim(); if(!txt) return;
    addBtn.disabled=true; addBtn.textContent='Adding…';
    try{ var nl=await API.deficiencies.addNote(id,txt); logs.push(nl); renderLogs(logs); ea.value=''; }
    finally{ addBtn.disabled=false; addBtn.textContent='Add Entry'; }
  });
  row.appendChild(addBtn); ef.appendChild(row); hc.appendChild(ef);
  right.appendChild(hc);
  two.appendChild(right);
  wrap.appendChild(two);
  setContent(wrap);
}

/* ── Platforms ── */
async function viewPlatforms(initialTab) {
  var wrap = div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header', [el('h2', {text: '🌐 Platforms & Shops'})]));

  var activeTab = initialTab || 'platforms';
  var tabs = div('ops-tabs');
  var tabBody = div('');
  wrap.appendChild(tabs);
  wrap.appendChild(tabBody);

  [['platforms','Platforms'],['shops','Shops']].forEach(([id,label]) => {
    var t = el('button',{cls:'ops-tab'+(id===activeTab?' active':''),text:label});
    t.onclick = () => {
      activeTab = id;
      tabs.querySelectorAll('.ops-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      renderTab();
    };
    tabs.appendChild(t);
  });

  var [platforms, groups] = await Promise.all([API.platforms.list(), API.users.groups()]);

  async function renderPlatformsTab() {
    tabBody.innerHTML = '';
    var newBtn = btn('primary', '+ New Platform', () => showPlatformForm(null, () => viewPlatforms('platforms')));
    tabBody.appendChild(newBtn);

    if (!platforms.length) {
      tabBody.appendChild(el('p', {cls:'ops-empty', text:'No platforms yet. Create one to get started.'}));
      return;
    }
    var card = div('ops-card'); card.style.marginTop='12px';
    card.appendChild(makeTable(
      ['Name', 'Location', 'Description', 'Nextcloud Group', ''],
      platforms.map(p => {
        var editBtn = btn('ops-btn-sm', '✏ Edit', () => showPlatformForm(p, () => viewPlatforms('platforms')));
        var delBtn  = btn('danger ops-btn-sm', '✕', async () => {
          if (!confirm('Delete platform "' + p.name + '"?')) return;
          await API.platforms.destroy(p.id);
          viewPlatforms('platforms');
        });
        var actWrap = div(''); actWrap.style.cssText = 'display:flex;gap:4px;';
        actWrap.appendChild(editBtn); actWrap.appendChild(delBtn);
        return [
          el('strong', {text: p.name}),
          p.location || '—',
          p.description || '—',
          p.group_name ? span('ops-tag', p.group_name) : span('ops-muted', 'All users'),
          actWrap
        ];
      })
    ));
    tabBody.appendChild(card);
  }

  async function renderShopsTab() {
    tabBody.innerHTML = '';
    var platMap = {}; platforms.forEach(p => { platMap[p.id] = p.name; });
    var platOpts = [['','— No Platform —']].concat(platforms.map(p=>[String(p.id),p.name]));

    var newBtn = btn('primary', '+ New Shop', () => {
      var fWrap = div('ops-form-grid');
      var f = {};
      function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
      f.name       = add('Shop Name *',    inp('e.g., Communications Shop 1', ''));
      f.code       = add('Shop Code *',    inp('e.g., C1, IT1, HV1', ''), false, 'Short uppercase code — used in all asset codes. Cannot be changed later.');
      f.discipline = add('Discipline',     inp('e.g., Communications, IT, HVAC', ''));
      f.platform   = add('Platform',       sel(platOpts, ''));
      f.supervisor = add('Supervisor',     inp('Nextcloud username', ''));
      f.desc       = add('Description',    inp('', ''), true);
      modal('Create Shop', fWrap, async () => {
        if (!f.name.value.trim()) throw new Error('Shop name required.');
        if (!f.code.value.trim()) throw new Error('Shop code required.');
        await API.shops.create({name:f.name.value, code:f.code.value.toUpperCase(),
          discipline:f.discipline.value, platform_id:f.platform.value?parseInt(f.platform.value):null,
          supervisor:f.supervisor.value, description:f.desc.value});
        clearCache('shops'); viewPlatforms('shops');
      }, 'Create Shop');
    });
    tabBody.appendChild(newBtn);

    var cardEl = div('ops-card'); cardEl.style.marginTop='12px'; tabBody.appendChild(cardEl);
    cardEl.appendChild(span('ops-muted','  Loading…'));
    var shops = await API.shops.list(); _cache.shops = shops;
    cardEl.innerHTML = '';

    if (!shops.length) {
      cardEl.appendChild(el('div',{cls:'ops-empty',text:'No shops yet. Create one to start assigning assets.'}));
      return;
    }

    cardEl.appendChild(makeTable(
      ['Code','Name','Discipline','Platform','Supervisor',''],
      shops.map(s => [
        span('ops-mono', s.code),
        el('strong',{text:s.name}),
        s.discipline || '—',
        platMap[s.platform_id] || '—',
        s.supervisor || '—',
        (()=>{
          var b = btn('ops-btn-sm','✏ Edit', async () => {
            var fWrap = div('ops-form-grid');
            var f = {};
            function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
            fWrap.appendChild(el('p',{cls:'ops-muted',text:'Shop code: '+s.code+' (immutable)'}));
            f.name       = add('Shop Name *',  inp('', s.name));
            f.discipline = add('Discipline',   inp('', s.discipline||''));
            f.platform   = add('Platform',     sel(platOpts, s.platform_id ? String(s.platform_id) : ''));
            f.supervisor = add('Supervisor',   inp('', s.supervisor||''));
            f.desc       = add('Description',  inp('', s.description||''), true);
            modal('Edit Shop — '+s.code, fWrap, async () => {
              await API.shops.update(s.id, {name:f.name.value, discipline:f.discipline.value,
                platform_id:f.platform.value?parseInt(f.platform.value):null,
                supervisor:f.supervisor.value, description:f.desc.value});
              clearCache('shops'); viewPlatforms('shops');
            }, 'Save Changes');
          });
          return b;
        })(),
      ]),
      null
    ));
  }

  function renderTab() {
    if (activeTab === 'platforms') renderPlatformsTab();
    else renderShopsTab();
  }
  renderTab();
}

/* ── Modernizations ── */
const MOD_STATUSES = [
  ['drafting','Drafting'],['impact_analysis','Impact Analysis'],['ccb_review','CCB Review'],
  ['approved','Approved'],['execution','Execution'],['verification','Verification'],
  ['complete','Complete'],['rejected','Rejected'],['abandoned','Abandoned']
];
const MOD_TYPES = [
  ['modification','Modification'],['upgrade','Upgrade'],['replacement','Replacement'],
  ['repair','Repair'],['addition','Addition'],['decommission','Decommission'],['reconfiguration','Reconfiguration']
];
const MOD_TRANSITIONS = {
  drafting:        ['impact_analysis','abandoned'],
  impact_analysis: ['ccb_review','drafting','abandoned'],
  ccb_review:      ['approved','rejected','abandoned'],
  approved:        ['execution','abandoned'],
  execution:       ['verification'],
  verification:    ['complete','execution'],
  complete:[], rejected:[], abandoned:[]
};
const STATUS_COLORS_MOD = {
  drafting:'badge-gray', impact_analysis:'badge-blue', ccb_review:'badge-orange',
  approved:'badge-teal', execution:'badge-purple', verification:'badge-yellow',
  complete:'badge-green', rejected:'badge-red', abandoned:'badge-gray'
};

// ── Interface Registry Hierarchy ──────────────────────────────────────────────

/**
 * Renders a 2-panel interface browser: left = asset tree, right = interfaces.
 * @param {HTMLElement} container  parent element to render into
 * @param {Array}       assets     all assets (from getAssets())
 * @param {number|null} modId      if set, filters interfaces to this modernization
 * @param {Function}    onSave     callback after form save/delete
 */
async function renderInterfaceHierarchy(container, assets, modId, onSave) {
  // Build lookup structures
  var assetMap = {};
  var childMap = {}; // parentId (or 'root') → [asset, ...]
  assets.forEach(a => {
    assetMap[a.id] = a;
    var key = a.parent_id == null ? 'root' : a.parent_id;
    if (!childMap[key]) childMap[key] = [];
    childMap[key].push(a);
  });
  // Sort each level by asset_code then name
  Object.values(childMap).forEach(list => list.sort((a,b) => {
    var ca = a.asset_code||'', cb = b.asset_code||'';
    return ca.localeCompare(cb) || a.name.localeCompare(b.name);
  }));

  var expandedIds = new Set();
  var selectedId  = null;

  // Two-panel wrapper
  var panel = div('');
  panel.style.cssText = 'display:flex;gap:0;border:1px solid #334155;border-radius:6px;overflow:hidden;min-height:420px;';

  // Left tree panel
  var treePanel = div('');
  treePanel.style.cssText = 'width:280px;min-width:220px;max-width:320px;overflow-y:auto;border-right:1px solid #334155;background:#0f172a;';

  // Right detail panel
  var detailPanel = div('');
  detailPanel.style.cssText = 'flex:1;overflow-y:auto;padding:12px;';
  detailPanel.appendChild(el('p',{cls:'ops-muted ops-small',text:'Select an asset node to view its interfaces.'}));

  function assetLabel(id) {
    var a = assetMap[id];
    return a ? ((a.asset_code||('#'+id))+' — '+a.name) : '#'+id;
  }

  async function loadInterfaces(assetId) {
    detailPanel.innerHTML = '';
    detailPanel.appendChild(el('p',{cls:'ops-empty ops-small',text:'Loading…'}));
    var params = {asset_id: assetId};
    if (modId) params.modernization_id = modId;
    var ifaces = await API.interfaces.list(params).catch(()=>[]);
    detailPanel.innerHTML = '';

    var a = assetMap[assetId];

    // ── Asset detail card ──────────────────────────────────────────
    if (a) {
      var card = div('ops-card');
      card.style.marginBottom = '12px';

      // Header row: code, name, type, status badges + action buttons
      var cardHdr = div('ops-card-header');
      cardHdr.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
      cardHdr.appendChild(span('ops-mono', a.asset_code || ('#'+assetId)));
      cardHdr.appendChild(el('strong', {text: a.name, style:'font-size:15px;'}));
      if (a.asset_type) cardHdr.appendChild(span('ops-badge badge-blue', a.asset_type));
      cardHdr.appendChild(statusBadge(a.status));
      if (a.criticality_code) cardHdr.appendChild(critBadge(a.criticality_code));
      if (a.bypass_state) cardHdr.appendChild(span('ops-badge badge-orange','BYPASSED'));
      var viewBtn = btn('ops-btn-sm','👁 Detail', ()=>navigate('asset-detail', assetId));
      var editBtn2 = btn('ops-btn-sm','✏', async()=>{
        var f = await buildAssetForm(a);
        modal('Edit Asset', f.wrap, async()=>{
          await API.assets.update(assetId, f.collect());
          clearCache('assets');
          var fresh = await getAssets();
          fresh.forEach(x => { assetMap[x.id] = x; });
          loadInterfaces(assetId);
        }, 'Save Changes');
      });
      var bg = div('ops-btn-group'); bg.style.marginLeft='auto'; bg.appendChild(viewBtn); bg.appendChild(editBtn2);
      cardHdr.appendChild(bg);
      card.appendChild(cardHdr);

      // Detail grid
      var grid = div('');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 16px;padding:10px 14px;font-size:12px;';
      function kv(label, value) {
        var row = div('');
        row.style.cssText = 'display:flex;flex-direction:column;padding:4px 0;border-bottom:1px solid #1e293b;';
        var lbl = el('span',{text:label,style:'color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.05em;'}); row.appendChild(lbl);
        var valEl = typeof value === 'string' ? span('', value||'—') : (value || span('ops-muted','—'));
        row.appendChild(valEl);
        return row;
      }
      if (a.manufacturer||a.model) grid.appendChild(kv('Manufacturer / Model', [a.manufacturer, a.model].filter(Boolean).join(' / ')));
      if (a.serial_number)         grid.appendChild(kv('Serial Number', a.serial_number));
      if (a.version)               grid.appendChild(kv('Version / Build', a.version));
      if (a.location)              grid.appendChild(kv('Location', a.location));
      if (a.ip_address)            grid.appendChild(kv('IP Address', a.ip_address));
      if (a.install_date)          grid.appendChild(kv('Install Date', a.install_date.slice(0,10)));
      if (a.warranty_expiry)       grid.appendChild(kv('Warranty Expiry', a.warranty_expiry.slice(0,10)));
      if (a.uii)                   grid.appendChild(kv('UII (ISO 15459)', a.uii));
      if (a.cage_code)             grid.appendChild(kv('CAGE Code', a.cage_code));
      if (a.redundancy_available)  grid.appendChild(kv('Redundancy', span('ops-badge badge-green','Available')));
      if (a.last_verified_at)      grid.appendChild(kv('Last Verified', a.last_verified_at.slice(0,10)+(a.verified_by?' by '+a.verified_by:'')));
      if (a.hierarchy_path)        grid.appendChild(kv('Hierarchy Path', span('ops-mono ops-small', a.hierarchy_path)));
      if (a.notes)                 grid.appendChild(kv('Notes', a.notes));
      if (grid.children.length)    card.appendChild(grid);

      detailPanel.appendChild(card);
    }

    // ── Interfaces section ─────────────────────────────────────────
    var ifHdr = div('');
    ifHdr.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    ifHdr.appendChild(el('h4',{text:'Interfaces',style:'margin:0;font-size:13px;color:#94a3b8;'}));
    var addIfBtn = btn('primary ops-btn-sm','+ Interface',()=>showInterfaceForm(null,()=>{
      loadInterfaces(assetId); if (onSave) onSave();
    },{from_asset_id:assetId, modernization_id:modId||undefined}));
    ifHdr.appendChild(addIfBtn);
    detailPanel.appendChild(ifHdr);

    if (!ifaces.length) {
      detailPanel.appendChild(el('p',{cls:'ops-empty ops-small',text:'No interfaces for this asset.'}));
      return;
    }
    var tbl = makeTable(
      ['Code','Dir','Other Asset','Type','Spec','Status',''],
      ifaces.map(i => {
        var isFrom = i.from_asset_id === assetId;
        var otherId = isFrom ? i.to_asset_id : i.from_asset_id;
        var dirArrow = isFrom ? '→' : '←';
        var sc = i.status==='active'?'badge-green':i.status==='inactive'?'badge-gray':'badge-orange';
        var eb = btn('ops-btn-sm','✏',()=>showInterfaceForm(i,()=>{
          loadInterfaces(assetId); if (onSave) onSave();
        }));
        var db = btn('ops-btn-sm ops-btn-danger','✕',async()=>{
          if (!confirm('Delete '+i.interface_code+'?')) return;
          await API.interfaces.destroy(i.id);
          loadInterfaces(assetId); if (onSave) onSave();
        });
        var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db);
        return [
          span('ops-mono ops-small',i.interface_code),
          span('ops-badge badge-gray',dirArrow),
          span('ops-small',assetLabel(otherId)),
          span('ops-badge badge-blue',(IF_TYPE_ICONS[i.interface_type]||'')+' '+i.interface_type),
          i.specification ? span('ops-mono ops-small',i.specification) : span('ops-muted','—'),
          ifStatusBadge(i.status),
          g
        ];
      })
    );
    detailPanel.appendChild(tbl);
  }

  function renderNode(asset, depth) {
    var children = childMap[asset.id] || [];
    var hasChildren = children.length > 0;
    var isExpanded = expandedIds.has(asset.id);
    var isSelected = selectedId === asset.id;

    var nodeWrap = div('');

    var row = div('');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;padding:5px 8px;cursor:pointer;'
      + 'padding-left:'+(8+depth*16)+'px;'
      + (isSelected ? 'background:#1e3a5f;border-left:2px solid #38bdf8;' : 'border-left:2px solid transparent;')
      + 'user-select:none;';
    row.onmouseover = ()=>{ if (!isSelected) row.style.background='#1e293b'; };
    row.onmouseout  = ()=>{ if (!isSelected) row.style.background=''; };

    // Expand toggle
    var toggle = span('', hasChildren ? (isExpanded ? '▼ ' : '▶ ') : '  ');
    toggle.style.cssText = 'font-size:10px;color:#64748b;min-width:14px;';
    row.appendChild(toggle);

    // Asset code + name
    var codeEl = span('ops-mono ops-small', asset.asset_code || ('#'+asset.id));
    codeEl.style.color = '#94a3b8';
    row.appendChild(codeEl);
    var nameEl = span('', ' '+asset.name);
    nameEl.style.cssText = 'font-size:12px;color:'+(isSelected?'#f8fafc':'#cbd5e1')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    row.appendChild(nameEl);

    row.onclick = async (e) => {
      e.stopPropagation();
      if (hasChildren) {
        if (isExpanded) expandedIds.delete(asset.id); else expandedIds.add(asset.id);
      }
      selectedId = asset.id;
      renderTree();
      loadInterfaces(asset.id);
    };

    nodeWrap.appendChild(row);

    if (hasChildren && isExpanded) {
      var childrenWrap = div('');
      children.forEach(c => childrenWrap.appendChild(renderNode(c, depth+1)));
      nodeWrap.appendChild(childrenWrap);
    }

    return nodeWrap;
  }

  function renderTree() {
    treePanel.innerHTML = '';
    var roots = childMap['root'] || [];
    if (!roots.length) {
      treePanel.appendChild(el('p',{cls:'ops-empty ops-small',text:'No assets found.',style:'padding:12px;'}));
      return;
    }
    var treeHdr = div('');
    treeHdr.style.cssText = 'padding:8px 10px;font-size:11px;color:#64748b;border-bottom:1px solid #1e293b;font-weight:600;letter-spacing:.05em;text-transform:uppercase;';
    treeHdr.textContent = 'Asset Structure';
    treePanel.appendChild(treeHdr);
    roots.forEach(r => treePanel.appendChild(renderNode(r, 0)));
  }

  renderTree();
  panel.appendChild(treePanel);
  panel.appendChild(detailPanel);
  container.appendChild(panel);
}

async function viewModernizations(activeTab) {
  activeTab = activeTab || 'mods';
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text:'🔧 Modernizations'})]);
  wrap.appendChild(hdr);

  // Top-level tabs
  var tabs = div('ops-tab-bar');
  var tabDefs = [['mods','Modernizations'],['requirements','Requirements'],['interfaces','Interfaces']];
  tabDefs.forEach(([key,label]) => {
    var t = btn(key===activeTab?'ops-tab active':'ops-tab', label, () => viewModernizations(key));
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);

  var body = div(''); wrap.appendChild(body);

  if (activeTab === 'mods') {
    hdr.appendChild(btn('primary','+ New Modernization', ()=>showModernizationForm(null, id=>{ navigate('mod-detail', id); })));
    var p = {};
    if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
    var mods = await API.modernizations.list(p).catch(()=>[]);
    if (!mods.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No modernizations yet.'})); return; }
    var card = div('ops-card'); body.appendChild(card);
    card.appendChild(makeTable(
      ['Code','Title','Type','Stage','Priority','Target',''],
      mods.map(m => {
        var stageBadge = span('ops-badge '+(STATUS_COLORS_MOD[m.status]||'badge-gray'),
          MOD_STATUSES.find(s=>s[0]===m.status)?.[1]||m.status);
        var priColor = m.priority==='emergency'?'badge-red':m.priority==='urgent'?'badge-orange':'badge-gray';
        var eb = btn('ops-btn-sm','✏',()=>showModernizationForm(m,()=>viewModernizationDetail(m.id)));
        var vb = btn('ops-btn-sm','👁 View',()=>navigate('mod-detail',m.id));
        var aw = div(''); aw.style.cssText='display:flex;gap:4px;';
        aw.appendChild(vb); aw.appendChild(eb);
        var titleEl = el('strong',{text:m.title,style:'cursor:pointer;color:#38bdf8;'});
        titleEl.onclick = ()=>navigate('mod-detail',m.id);
        return [
          span('ops-mono ops-small', m.mod_code||'—'),
          titleEl,
          span('ops-badge badge-gray', MOD_TYPES.find(t=>t[0]===m.mod_type)?.[1]||m.mod_type||'—'),
          stageBadge,
          span('ops-badge '+priColor, m.priority||'routine'),
          m.target_completion ? m.target_completion.slice(0,10) : span('ops-muted','—'),
          aw
        ];
      })
    ));

  } else if (activeTab === 'requirements') {
    hdr.appendChild(btn('primary','+ New Requirement',()=>showRequirementForm(null,()=>viewModernizations('requirements'))));
    var reqs = await API.requirements.list({}).catch(()=>[]);
    if (!reqs.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No requirements yet.'})); return; }
    var card = div('ops-card'); body.appendChild(card);
    card.appendChild(makeTable(
      ['Code','Title','Type','Status','Modernization',''],
      reqs.map(r => {
        var sc = r.status==='met'?'badge-green':r.status==='not_met'?'badge-red':r.status==='degraded'?'badge-orange':'badge-gray';
        var eb = btn('ops-btn-sm','👁',()=>navigate('req-detail',r.id));
        return [
          span('ops-mono ops-small',r.req_code),
          el('strong',{text:r.title}),
          span('ops-badge badge-blue',r.req_type),
          span('ops-badge '+sc,r.status),
          r.modernization_id ? span('ops-tag','Mod #'+r.modernization_id) : span('ops-muted','—'),
          eb
        ];
      })
    ));

  } else if (activeTab === 'interfaces') {
    hdr.appendChild(btn('primary','+ New Interface',()=>showInterfaceForm(null,()=>viewModernizations('interfaces'))));
    var assets = await getAssets().catch(()=>[]);
    await renderInterfaceHierarchy(body, assets, null, ()=>viewModernizations('interfaces'));
  }
}

async function viewModernizationDetail(id, activeTab) {
  activeTab = activeTab || 'overview';
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var mod = await API.modernizations.get(id).catch(()=>null);
  if (!mod) { setContent(el('div',{cls:'ops-empty',text:'Modernization not found.'})); return; }

  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('','← Modernizations',()=>navigate('modernizations')));
  hdr.appendChild(el('h2',{text: (mod.mod_code ? mod.mod_code+' — ' : '') + mod.title}));
  hdr.appendChild(span('ops-badge '+(STATUS_COLORS_MOD[mod.status]||'badge-gray'),
    MOD_STATUSES.find(s=>s[0]===mod.status)?.[1]||mod.status));
  var hdrActs = div('ops-btn-group');
  hdrActs.appendChild(btn('','✏ Edit',()=>showModernizationForm(mod,()=>viewModernizationDetail(id,activeTab))));
  var postApproval = ['approved','execution','verification','complete'].includes(mod.status);
  if (postApproval) {
    hdrActs.appendChild(btn('','🛒 Request Parts',()=>showSupplyRequestForm({
      title:'Parts for: '+mod.title, source_type:'modernization',
      source_id:mod.id, platform_id:mod.platform_id,
    },()=>viewModernizationDetail(id,'supply'))));
  }
  hdr.appendChild(hdrActs);
  wrap.appendChild(hdr);

  // ── Stage transition bar ─────────────────────────────────────
  var transitions = MOD_TRANSITIONS[mod.status] || [];
  if (transitions.length && _canWrite) {
    var stageBar = div('');
    stageBar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0 14px;flex-wrap:wrap;border-bottom:1px solid #2e3650;margin-bottom:12px;';
    var stageLabel = el('span',{text:'Advance Stage:'});
    stageLabel.style.cssText = 'font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;';
    stageBar.appendChild(stageLabel);
    transitions.forEach(next => {
      var label = MOD_STATUSES.find(s=>s[0]===next)?.[1]||next;
      var isDanger = ['rejected','abandoned'].includes(next);
      stageBar.appendChild(btn(isDanger ? 'ops-btn-sm danger' : 'ops-btn-sm primary', '→ '+label, async () => {
        if (isDanger && !confirm('Move to '+label+'? This cannot be undone.')) return;
        try {
          await API.modernizations.update(id, {status: next});
          viewModernizationDetail(id, activeTab);
        } catch(e) {
          alert(e.message || 'Stage transition failed.');
        }
      }));
    });
    wrap.appendChild(stageBar);
  }

  // Phase tabs
  var tabs = div('ops-tab-bar');
  [['overview','Overview'],['requirements','Requirements'],['interfaces','Interfaces'],
   ['tdp','TDP (Library)'],['assets','Affected Assets'],['supply','Supply'],['training','Training']].forEach(([key,label]) => {
    var t = btn(key===activeTab?'ops-tab active':'ops-tab', label,
      ()=>viewModernizationDetail(id, key));
    tabs.appendChild(t);
  });
  wrap.appendChild(tabs);

  var body = div(''); wrap.appendChild(body);

  if (activeTab === 'overview') {
    var two = div('ops-two-col'); body.appendChild(two);
    var left = div(''); var right = div('');

    // Details
    var dc = div('ops-card'); left.appendChild(dc);
    dc.appendChild(div('ops-card-header',[el('h3',{text:'Details'})]));
    var kg = div('ops-kv-grid'); dc.appendChild(kg);
    [['Type', MOD_TYPES.find(t=>t[0]===mod.mod_type)?.[1]||mod.mod_type||'—'],
     ['Priority', mod.priority||'routine'],
     ['Initiator', mod.initiator_uid||'—'],
     ['Assigned To', mod.assigned_to||'—'],
     ['Approver', mod.approver||'—'],
     ['Start Date', mod.start_date?mod.start_date.slice(0,10):'—'],
     ['Target', mod.target_completion?mod.target_completion.slice(0,10):'—'],
     ['Approved By', mod.approved_by||'—'],
     ['Approved At', mod.approved_at?mod.approved_at.slice(0,10):'—'],
     ['Completed At', mod.completed_at?mod.completed_at.slice(0,10):'—'],
    ].forEach(([k,v]) => {
      var kv = div('ops-kv');
      kv.appendChild(span('ops-kv-key',k));
      kv.appendChild(typeof v==='string'?span('',v):v);
      kg.appendChild(kv);
    });
    if (mod.description) {
      var descCard = div('ops-card'); descCard.style.marginTop='16px'; left.appendChild(descCard);
      descCard.appendChild(div('ops-card-header',[el('h3',{text:'Description'})]));
      descCard.appendChild(el('p',{text:mod.description,style:'color:#cbd5e1;font-size:13px;line-height:1.6;padding:8px 0;'}));
    }
    if (mod.training_delta) {
      var tdCard = div('ops-card'); tdCard.style.marginTop='16px'; left.appendChild(tdCard);
      tdCard.appendChild(div('ops-card-header',[el('h3',{text:'Training Delta'})]));
      tdCard.appendChild(el('p',{text:mod.training_delta,style:'color:#cbd5e1;font-size:13px;line-height:1.6;padding:8px 0;'}));
    }

    // Cost summary
    var cc = div('ops-card'); right.appendChild(cc);
    cc.appendChild(div('ops-card-header',[el('h3',{text:'Cost Summary'})]));
    var cg = div('ops-cost-grid'); cc.appendChild(cg);
    [['Est. Parts',fmt$(mod.est_parts_cost),'ops-blue'],
     ['Est. Labor',fmt$(mod.est_labor_cost),'ops-blue'],
     ['Est. Contractor',fmt$(mod.est_contractor_cost),'ops-blue'],
     ['Est. Total',fmt$(mod.est_total),'ops-warn'],
     ['Act. Parts',fmt$(mod.actual_parts_cost),'ops-teal'],
     ['Act. Labor',fmt$(mod.actual_labor_cost),'ops-teal'],
     ['Act. Contractor',fmt$(mod.actual_contractor_cost),'ops-teal'],
     ['Act. Total',fmt$(mod.actual_total),'ops-green'],
    ].forEach(([l,v,c]) => {
      var cell = div('ops-cost-cell');
      cell.appendChild(el('div',{cls:'ops-cost-label',text:l}));
      cell.appendChild(el('div',{cls:'ops-cost-value '+c,text:String(v)}));
      cg.appendChild(cell);
    });

    // Linked deficiencies
    var defCard = div('ops-card'); defCard.style.marginTop='16px'; right.appendChild(defCard);
    defCard.appendChild(div('ops-card-header',[el('h3',{text:'Linked Deficiencies'})]));
    var linkedDefs = await API.deficiencies.list({modernization_id:mod.id}).catch(()=>[]);
    if (!linkedDefs.length) {
      defCard.appendChild(el('p',{cls:'ops-empty ops-small',text:'No deficiencies linked.'}));
    } else {
      defCard.appendChild(makeTable(['ID','Summary','SEV','Status'],
        linkedDefs.map(d=>[span('ops-muted',d.def_id_label),el('strong',{text:d.summary}),
          sevBadge(d.severity),statusBadge(d.status)])));
    }
    two.appendChild(left); two.appendChild(right);

  } else if (activeTab === 'requirements') {
    var rHdr = div('ops-card-header',[el('h3',{text:'Requirements'})]);
    var addReqBtn = btn('primary ops-btn-sm','+ Add Requirement',()=>showRequirementForm(null,()=>viewModernizationDetail(id,'requirements'),{modernization_id:id}));
    rHdr.appendChild(addReqBtn); body.appendChild(rHdr);
    var reqs = await API.requirements.list({modernization_id:id}).catch(()=>[]);
    if (!reqs.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No requirements linked to this modernization yet.'})); }
    else {
      var rc = div('ops-card'); body.appendChild(rc);
      rc.appendChild(makeTable(['Code','Title','Type','Status','Priority',''],
        reqs.map(r => {
          var sc = r.status==='met'?'badge-green':r.status==='not_met'?'badge-red':r.status==='degraded'?'badge-orange':'badge-gray';
          return [span('ops-mono ops-small',r.req_code),el('strong',{text:r.title}),
            span('ops-badge badge-blue',r.req_type),span('ops-badge '+sc,r.status),
            span('ops-badge badge-gray',r.priority),
            btn('ops-btn-sm','👁',()=>navigate('req-detail',r.id))];
        })));
    }

  } else if (activeTab === 'interfaces') {
    var iHdr = div('ops-card-header',[el('h3',{text:'Interfaces'})]);
    var addIfBtn = btn('primary ops-btn-sm','+ Add Interface',()=>showInterfaceForm(null,()=>viewModernizationDetail(id,'interfaces'),{modernization_id:id}));
    iHdr.appendChild(addIfBtn); body.appendChild(iHdr);
    var modAssets = await getAssets().catch(()=>[]);
    await renderInterfaceHierarchy(body, modAssets, id, ()=>viewModernizationDetail(id,'interfaces'));

  } else if (activeTab === 'tdp') {
    var tHdr = div('ops-card-header',[el('h3',{text:'Technical Data Package (Library)'})]);
    var addDocBtn = btn('primary ops-btn-sm','+ Add Document',()=>showDocumentForm(null,()=>viewModernizationDetail(id,'tdp'),{modernization_id:id}));
    tHdr.appendChild(addDocBtn); body.appendChild(tHdr);
    var tdpDocs = await API.documents.list({modernization_id:id}).catch(()=>[]);
    if (!tdpDocs.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No Library documents linked to this modernization yet.'})); }
    else {
      var DOC_CAT_COLORS = {drawing:'badge-blue',tech_manual:'badge-purple',test_plan:'badge-orange',
        training:'badge-teal',sop:'badge-gray',other:'badge-gray'};
      var tc = div('ops-card'); body.appendChild(tc);
      tc.appendChild(makeTable(['Doc #','Title','Category','Rev','Status',''],
        tdpDocs.map(d => [
          span('ops-mono ops-small',d.doc_number),
          el('strong',{text:d.title,style:'cursor:pointer;color:#38bdf8;',onclick:()=>navigate('doc-detail',d.id)}),
          span('ops-badge '+(DOC_CAT_COLORS[d.category]||'badge-gray'),d.category),
          d.current_rev?span('ops-mono ops-small',d.current_rev):span('ops-muted','—'),
          span('ops-badge '+(d.status==='approved'?'badge-green':d.status==='draft'?'badge-gray':'badge-orange'),d.status),
          btn('ops-btn-sm','👁',()=>navigate('doc-detail',d.id))
        ])));
    }

  } else if (activeTab === 'assets') {
    var aHdr = div('ops-card-header',[el('h3',{text:'Affected Assets'})]);
    var addAstBtn = btn('primary ops-btn-sm','+ Add Asset',()=>showModAssetForm(id,null,()=>viewModernizationDetail(id,'assets')));
    aHdr.appendChild(addAstBtn); body.appendChild(aHdr);
    var affAssets = mod.affected_assets || [];
    if (!affAssets.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No affected assets recorded yet.'})); }
    else {
      var ac = div('ops-card'); body.appendChild(ac);
      ac.appendChild(makeTable(['Asset ID','Action','Before Ver.','After Ver.','Notes',''],
        affAssets.map(a => [
          span('ops-tag','Asset #'+a.asset_id),
          span('ops-badge badge-blue',a.action),
          a.before_version||span('ops-muted','—'),
          a.after_version||span('ops-muted','—'),
          a.notes||span('ops-muted','—'),
          btn('ops-btn-sm','🗑',async ()=>{
            if(!confirm('Remove this asset entry?')) return;
            await API.modernizations.removeAsset(id,a.id);
            viewModernizationDetail(id,'assets');
          })
        ])));
    }

  } else if (activeTab === 'training') {
    body.appendChild(div('ops-card-header',[el('h3',{text:'Training Requirements'})]));
    var trBody = div(''); trBody.style.padding='16px'; body.appendChild(trBody);
    await renderTrainingSection('modernization', id, trBody, !!_canWrite, {platform_id: mod.platform_id});

  } else if (activeTab === 'supply') {
    var sHdr = div('ops-card-header',[el('h3',{text:'Supply Requests'})]);
    if (postApproval) {
      var addSrBtn = btn('primary ops-btn-sm','+ Request Parts',()=>showSupplyRequestForm({
        title:'Parts for: '+mod.title,source_type:'modernization',source_id:mod.id,platform_id:mod.platform_id,
      },()=>viewModernizationDetail(id,'supply')));
      sHdr.appendChild(addSrBtn);
    }
    body.appendChild(sHdr);
    var srs = mod.supply_requests || [];
    if (!srs.length) { body.appendChild(el('p',{cls:'ops-empty',text:postApproval?'No supply requests yet.':'Supply requests available after CCB approval.'})); }
    else {
      var sc2 = div('ops-card'); body.appendChild(sc2);
      sc2.appendChild(makeTable(['SRFQ #','Status','Priority','Items','Needed By'],
        srs.map(sr => {
          var statB = span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status);
          var priColor = sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray';
          var rfqEl = el('strong',{text:sr.rfq_number||'--',style:'cursor:pointer;color:#38bdf8;'});
          rfqEl.onclick=()=>navigate('supply-detail',sr.id);
          return [rfqEl,statB,span('ops-badge '+priColor,sr.priority),
            span('ops-badge badge-gray',(sr.item_count||0)+' items'),
            sr.needed_by?sr.needed_by.slice(0,10):span('ops-muted','--')];
        })));
    }
  }

  setContent(wrap);
}

function showModernizationForm(existing, onDone, prefill) {
  var isEdit = !!existing;
  var defaults = prefill || existing || {};
  var body = div('ops-form-grid');

  var titleInp = inp('Modernization title', defaults.title || '');
  body.appendChild(fg('Title *', titleInp, true));

  var typeSel = sel(MOD_TYPES, defaults.mod_type || 'modification');
  body.appendChild(fg('Change Type', typeSel));

  var priSel = sel([['routine','Routine'],['urgent','Urgent'],['emergency','Emergency']], defaults.priority || 'routine');
  body.appendChild(fg('Priority', priSel));

  var descInp = ta('Description of the modernization scope', defaults.description || '', 3);
  body.appendChild(fg('Description', descInp, true));

  var assignInp = inp('Assigned user', defaults.assigned_to || '');
  body.appendChild(fg('Assigned To', assignInp));

  var approverInp = inp('Approver user', defaults.approver || '');
  body.appendChild(fg('Approver', approverInp));

  var startInp = el('input',{}); startInp.className='ops-input'; startInp.type='date';
  if (defaults.start_date) startInp.value = defaults.start_date.slice(0,10);
  body.appendChild(fg('Start Date', startInp));

  var targetInp = el('input',{}); targetInp.className='ops-input'; targetInp.type='date';
  if (defaults.target_completion) targetInp.value = defaults.target_completion.slice(0,10);
  body.appendChild(fg('Target Completion', targetInp));

  var estPartsInp = inp('0.00', defaults.est_parts_cost || ''); estPartsInp.type='number';
  body.appendChild(fg('Est. Parts Cost ($)', estPartsInp));
  var estLaborInp = inp('0.00', defaults.est_labor_cost || ''); estLaborInp.type='number';
  body.appendChild(fg('Est. Labor Cost ($)', estLaborInp));
  var estContrInp = inp('0.00', defaults.est_contractor_cost || ''); estContrInp.type='number';
  body.appendChild(fg('Est. Contractor Cost ($)', estContrInp));

  var tdInp = ta('Training requirements and delta…', defaults.training_delta || '', 2);
  body.appendChild(fg('Training Delta', tdInp, true));

  var curFyMod = new Date().getFullYear();
  var fyOptsMod = [['','— No FY —']].concat([curFyMod-1,curFyMod,curFyMod+1].map(function(y){ return [String(y),'FY '+y]; }));
  var modBudgetStatus = sel([['unbudgeted','Unbudgeted'],['funded','Funded'],['ufr','UFR (Unfunded Requirement)']], existing?.budget_status||'unbudgeted');
  var modBudgetFy     = sel(fyOptsMod, existing?.budget_fiscal_year ? String(existing.budget_fiscal_year) : '');
  body.appendChild(fg('Budget Status', modBudgetStatus));
  body.appendChild(fg('Budget Fiscal Year', modBudgetFy));

  modal(isEdit?'Edit Modernization':'New Modernization', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:               titleInp.value.trim(),
      mod_type:            typeSel.value,
      priority:            priSel.value,
      description:         descInp.value.trim(),
      assigned_to:         assignInp.value.trim(),
      approver:            approverInp.value.trim(),
      start_date:          startInp.value || '',
      target_completion:   targetInp.value || '',
      est_parts_cost:      parseFloat(estPartsInp.value) || 0,
      est_labor_cost:      parseFloat(estLaborInp.value) || 0,
      est_contractor_cost: parseFloat(estContrInp.value) || 0,
      training_delta:      tdInp.value.trim(),
      budget_status:       modBudgetStatus.value,
      budget_fiscal_year:  modBudgetFy.value ? parseInt(modBudgetFy.value) : null,
    };
    if (defaults.platform_id) data.platform_id = defaults.platform_id;
    else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) {
      await API.modernizations.update(existing.id, data);
      if (onDone) onDone(existing.id);
    } else {
      var created = await API.modernizations.create(data);
      if (onDone) onDone(created.id);
    }
  }, isEdit?'Save Changes':'Create Modernization');
}

function showModAssetForm(modId, existing, onDone) {
  var body = div('ops-form-grid');
  var assetInp = inp('Asset ID (numeric)', existing?.asset_id||''); assetInp.type='number';
  body.appendChild(fg('Asset ID *', assetInp));
  var actionSel = sel([['modify','Modify'],['add','Add'],['remove','Remove'],['replace','Replace']], existing?.action||'modify');
  body.appendChild(fg('Action', actionSel));
  var beforeInp = inp('Version before change', existing?.before_version||'');
  body.appendChild(fg('Before Version', beforeInp));
  var afterInp  = inp('Version after change',  existing?.after_version||'');
  body.appendChild(fg('After Version', afterInp));
  var notesInp  = ta('Notes…', existing?.notes||'', 2);
  body.appendChild(fg('Notes', notesInp, true));
  modal(existing?'Edit Asset Entry':'Add Affected Asset', body, async () => {
    if (!assetInp.value.trim()) throw new Error('Asset ID required.');
    var d = {asset_id:parseInt(assetInp.value),action:actionSel.value,
      before_version:beforeInp.value.trim(),after_version:afterInp.value.trim(),notes:notesInp.value.trim()};
    if (existing) await API.modernizations.updateAsset(modId, existing.id, d);
    else await API.modernizations.addAsset(modId, d);
    if (onDone) onDone();
  }, existing?'Save':'Add Asset');
}

/* ── PDF / File Viewer ── */
function showFileViewer(file) {
  var davUrl = '/remote.php/dav/files/' + _currentUser + file.rel;
  // serveUrl removed - using davUrl directly
  var mime = file.mime || '';
  document.querySelector('.ops-file-viewer-overlay')?.remove();

  var overlay = div('');
  overlay.className = 'ops-file-viewer-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:999999;display:flex;flex-direction:column;';

  // Header
  var hdr = div('');
  hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#1e2540;border-bottom:1px solid #2e3650;flex-shrink:0;';
  var title = el('span', {text: file.name, style:'color:#e2e8f0;font-size:14px;font-weight:700;'});
  var closeBtn = el('button', {text:'✕ Close', style:'background:none;border:1px solid #3e4a65;color:#94a3b8;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;'});
  closeBtn.onclick = () => overlay.remove();
  var downloadBtn = el('a', {
    href: davUrl,
    download: file.name,
    text: '⬇ Download',
    style: 'background:none;border:1px solid #3e4a65;color:#94a3b8;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;text-decoration:none;margin-right:8px;'
  });
  hdr.appendChild(title);
  var btnWrap = div(''); btnWrap.style.cssText = 'display:flex;gap:8px;align-items:center;';
  btnWrap.appendChild(downloadBtn);
  btnWrap.appendChild(closeBtn);
  hdr.appendChild(btnWrap);
  overlay.appendChild(hdr);

  // Content area
  var content2 = div('');
  content2.style.cssText = 'flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;';

  var davUrl = '/remote.php/dav/files/' + _currentUser + file.rel;

  if (mime.includes('pdf')) {
    var iframe = document.createElement('iframe');
    iframe.src = davUrl;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    content2.appendChild(iframe);
  } else if (mime.includes('image')) {
    var img = document.createElement('img');
    img.src = davUrl;
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
    content2.appendChild(img);
  } else {
    var msg = div('');
    msg.style.cssText = 'text-align:center;color:#94a3b8;';
    msg.innerHTML = '<div style="font-size:48px;margin-bottom:16px;">📄</div>' +
      '<div style="font-size:16px;margin-bottom:8px;">' + file.name + '</div>' +
      '<div style="font-size:13px;margin-bottom:20px;color:#64748b;">Preview not available for this file type.</div>' +
      '<a href="' + davUrl + '" download="' + file.name + '" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;">⬇ Download File</a>';
    content2.appendChild(msg);
  }

  overlay.appendChild(content2);

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); }
  });

  document.body.appendChild(overlay);
}

/* ── Validations Due ── */
const COUNT_CLASS_INTERVALS = {'A-daily':1,'A-weekly':7,'B':30,'C':90,'full':365};
const COUNT_CLASS_LABELS = {'A-daily':'A (Daily)','A-weekly':'A (Weekly)','B':'B (Monthly)','C':'C (Quarterly)','full':'Annual'};

async function viewValidationsDue() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '✅ Validations Due'})]);
  hdr.appendChild(btn('', '🖨 Print', () => window.print()));
  wrap.appendChild(hdr);

  var today = new Date();
  var weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');

  var [assets, invItems] = await Promise.all([
    API.assets.list(p).catch(() => []),
    API.supply.inventory.list(p).catch(() => [])
  ]);

  // Assets overdue or due within 18 months window
  var ASSET_INTERVAL_DAYS = 548; // 18 months
  var assetsDue = assets.filter(a => {
    if (!a.last_verified_at) return true; // never verified
    var lastV = new Date(a.last_verified_at);
    var nextDue = new Date(lastV);
    nextDue.setDate(nextDue.getDate() + ASSET_INTERVAL_DAYS);
    return nextDue <= weekEnd;
  }).map(a => {
    var lastV = a.last_verified_at ? new Date(a.last_verified_at) : null;
    var nextDue = lastV ? new Date(lastV.getTime() + ASSET_INTERVAL_DAYS * 86400000) : null;
    var overdue = nextDue ? nextDue < today : true;
    return { ...a, next_due: nextDue, overdue };
  });

  // Inventory items due for cycle count this week
  var invDue = invItems.filter(i => {
    if (!i.next_count_due) return true; // never counted
    return new Date(i.next_count_due) <= weekEnd;
  }).map(i => ({
    ...i,
    overdue: i.next_count_due ? new Date(i.next_count_due) < today : true
  }));

  // Asset verifications section
  var assetCard = div('ops-card');
  assetCard.style.marginBottom = '16px';
  var assetHdr = div('ops-card-header');
  assetHdr.appendChild(el('h3', {text: '🏷 Asset Verifications Due (' + assetsDue.length + ')'}));
  assetCard.appendChild(assetHdr);

  if (!assetsDue.length) {
    assetCard.appendChild(el('p', {cls:'ops-empty', text:'No asset verifications due this week.'}));
  } else {
    assetCard.appendChild(makeTable(
      ['Asset ID', 'Name', 'Type', 'Platform', 'Location', 'Last Verified', 'Next Due', 'Verified By', 'Status', ''],
      assetsDue.map(a => {
        var statusB = a.overdue
          ? span('ops-badge badge-red', 'OVERDUE')
          : span('ops-badge badge-orange', 'DUE SOON');
        var verifyBtn2 = btn('success ops-btn-sm', '✓ Verify', () => {
          showAssetVerifyModal(a, () => viewValidationsDue());
        });
        return [
          span('ops-mono', a.asset_id_label || '#'+a.id),
          el('strong', {text: a.name}),
          span('ops-badge badge-gray', a.asset_type || '—'),
          a.platform_id ? span('ops-badge badge-blue', 'Platform #'+a.platform_id) : span('ops-muted','—'),
          a.location || span('ops-muted','—'),
          a.last_verified_at ? a.last_verified_at.slice(0,10) : span('ops-danger','Never'),
          a.next_due ? a.next_due.toISOString().slice(0,10) : span('ops-danger','Overdue'),
          a.verified_by || span('ops-muted','—'),
          statusB,
          verifyBtn2
        ];
      })
    ));
  }
  wrap.appendChild(assetCard);

  // Inventory cycle counts section
  var invCard = div('ops-card');
  var invHdr2 = div('ops-card-header');
  invHdr2.appendChild(el('h3', {text: '🗄 Inventory Cycle Counts Due (' + invDue.length + ')'}));
  invCard.appendChild(invHdr2);

  if (!invDue.length) {
    invCard.appendChild(el('p', {cls:'ops-empty', text:'No inventory cycle counts due this week.'}));
  } else {
    invCard.appendChild(makeTable(
      ['Item Name', 'Part #', 'Class', 'Platform', 'Location', 'On Hand', 'Last Counted', 'Next Due', 'Status', ''],
      invDue.map(i => {
        var statusB = i.overdue
          ? span('ops-badge badge-red', 'OVERDUE')
          : span('ops-badge badge-orange', 'DUE SOON');
        var countBtn = btn('primary ops-btn-sm', '✓ Count', async () => {
          var qty = prompt('Enter physical count quantity for: ' + i.item_name);
          if (qty === null) return;
          await API.supply.inventory.transact(i.id, {
            transaction_type: 'adjust',
            quantity: parseFloat(qty) || 0,
            notes: 'Cycle count — ' + COUNT_CLASS_LABELS[i.count_class] || i.count_class,
          });
          await API.supply.inventory.update(i.id, {
            count_class: i.count_class,
            cycle_count: 1,
          });
          viewValidationsDue();
        });
        return [
          el('strong', {text: i.item_name}),
          i.part_number ? span('ops-mono ops-small', i.part_number) : span('ops-muted','—'),
          span('ops-badge badge-blue', COUNT_CLASS_LABELS[i.count_class] || i.count_class),
          i.platform_id ? span('ops-badge badge-blue', 'Platform #'+i.platform_id) : span('ops-muted','—'),
          i.location || span('ops-muted','—'),
          String(i.quantity_on_hand),
          i.last_counted_at ? i.last_counted_at.slice(0,10) : span('ops-danger','Never'),
          i.next_count_due ? i.next_count_due.slice(0,10) : span('ops-danger','Overdue'),
          statusB,
          countBtn
        ];
      })
    ));
  }
  wrap.appendChild(invCard);

  // Supply requisition revalidation section
  var openStatuses = ['submitted','approved','ordered','partially_received'];
  var srParams = {};
  if (_selectedPlatformIds.length) srParams.platform_ids = _selectedPlatformIds.join(',');
  var allRequests = await API.supply.requests.list(srParams).catch(() => []);
  var srDue = allRequests.filter(sr => {
    if (!openStatuses.includes(sr.status)) return false;
    if (!sr.revalidation_due) return true; // never revalidated
    return new Date(sr.revalidation_due) <= weekEnd;
  }).map(sr => ({
    ...sr,
    overdue: sr.revalidation_due ? new Date(sr.revalidation_due) < today : true
  }));

  var srCard = div('ops-card'); srCard.style.marginTop = '16px';
  var srHdr = div('ops-card-header');
  srHdr.appendChild(el('h3', {text: '🛒 Supply Requisitions — Revalidation Due (' + srDue.length + ')'}));
  srCard.appendChild(srHdr);

  if (!srDue.length) {
    srCard.appendChild(el('p', {cls:'ops-empty', text:'No supply requisitions due for revalidation.'}));
  } else {
    srCard.appendChild(makeTable(
      ['SRFQ #', 'Title', 'Priority', 'Status', 'Last Revalidated', 'Due', ''],
      srDue.map(sr => {
        var statusB = span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),
          SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status);
        var overB = sr.overdue
          ? span('ops-badge badge-red', 'OVERDUE')
          : span('ops-badge badge-orange', 'DUE SOON');
        var stillNeededBtn = btn('success ops-btn-sm', '✓ Still Needed', async () => {
          await API.supply.requests.update(sr.id, {revalidate: 1});
          viewValidationsDue();
        });
        var cancelBtn = btn('danger ops-btn-sm', '✕ Cancel', async () => {
          if (!confirm('Cancel this supply request? This cannot be undone.')) return;
          await API.supply.requests.update(sr.id, {status: 'cancelled'});
          viewValidationsDue();
        });
        var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
        actWrap.appendChild(stillNeededBtn); actWrap.appendChild(cancelBtn);
        return [
          span('ops-mono', sr.rfq_number||'—'),
          el('strong', {text: sr.title}),
          span('ops-badge '+(sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray'), sr.priority),
          statusB,
          sr.last_revalidated_at ? sr.last_revalidated_at.slice(0,10) : span('ops-danger','Never'),
          sr.revalidation_due ? sr.revalidation_due.slice(0,10) : span('ops-danger','Overdue'),
          actWrap
        ];
      })
    ));
  }
  wrap.appendChild(srCard);

  // Print styles
  var style = document.createElement('style');
  style.textContent = '@media print { .ops-sidebar, .ops-topbar, button { display:none!important; } }';
  document.head.appendChild(style);
}

/* ── Asset Verify Modal ── */
function showAssetVerifyModal(asset, onDone) {
  var body = div('ops-form-grid');

  // Info block
  var info = div('');
  info.style.cssText = 'background:#0f172a;border-radius:8px;padding:12px;font-size:13px;color:#94a3b8;margin-bottom:8px;';
  info.innerHTML = '<strong style="color:#e2e8f0;">' + asset.name + '</strong><br>Type: ' + (asset.asset_type||'—') + ' | Serial: ' + (asset.serial_number||'—') + '<br>Last Verified: ' + (asset.last_verified_at ? asset.last_verified_at.slice(0,10) : 'Never') + (asset.verified_by ? ' by ' + asset.verified_by : '');
  body.appendChild(info);

  var locInp = el('input',{}); locInp.className='ops-input'; locInp.placeholder='Location (update if changed)';
  locInp.value = asset.location || '';
  body.appendChild(fg('Location', locInp));

  var statusSel = sel([
    ['operational','Operational'],['degraded','Degraded'],
    ['offline','Offline'],['maintenance','In Maintenance'],['decommissioned','Decommissioned']
  ], asset.status || 'operational');
  body.appendChild(fg('Status', statusSel));

  var serialInp = el('input',{}); serialInp.className='ops-input'; serialInp.placeholder='Serial number';
  serialInp.value = asset.serial_number || '';
  body.appendChild(fg('Serial Number', serialInp));

  var notesInp = document.createElement('textarea'); notesInp.className='ops-input'; notesInp.rows=2;
  notesInp.placeholder='Verification notes (condition, findings, etc.)';
  body.appendChild(fg('Verification Notes', notesInp, true));

  modal('Verify Asset — ' + asset.asset_id_label, body, async () => {
    await API.assets.update(asset.id, {
      verify:        1,
      location:      locInp.value.trim(),
      status:        statusSel.value,
      serial_number: serialInp.value.trim(),
      notes:         asset.notes ? asset.notes + ' [Verified] ' + notesInp.value.trim() : notesInp.value.trim(),
    });
    clearCache('assets');
    if (onDone) onDone();
  }, '✓ Confirm Verification');
}

/* ── Supply / Warehouse ── */
const SR_STATUSES = [
  ['draft','Draft'],['submitted','Submitted'],['approved','Approved'],
  ['ordered','Ordered'],['partially_received','Partially Received'],
  ['received','Received'],['closed','Closed'],['cancelled','Cancelled']
];
const SR_STATUS_COLORS = {
  draft:'badge-gray', submitted:'badge-blue', approved:'badge-teal',
  ordered:'badge-orange', partially_received:'badge-orange',
  received:'badge-green', closed:'badge-green', cancelled:'badge-gray'
};
const SR_PRIORITIES = [['routine','Routine'],['urgent','Urgent'],['emergency','Emergency']];
const INV_CATEGORIES = [['hardware','Hardware'],['software','Software'],['consumable','Consumable'],['tool','Tool'],['other','Other']];

async function viewSupplyRequests() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '🛒 Supply Requests'})]);
  hdr.appendChild(btn('primary', '+ New Request', () => showSupplyRequestForm(null, () => viewSupplyRequests())));
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var requests = await API.supply.requests.list(p).catch(() => []);
  loading.remove();

  if (!requests.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No supply requests yet.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['SRFQ #', 'Title', 'Priority', 'Status', 'Items', 'Est. Total', 'Needed By', ''],
    requests.map(sr => {
      var priColor = sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray';
      var priB  = span('ops-badge '+priColor, SR_PRIORITIES.find(p=>p[0]===sr.priority)?.[1]||sr.priority);
      var statB = span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),
        SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status);
      var viewBtn = btn('ops-btn-sm', '🛒 View', () => navigate('supply-detail', sr.id));
      var editBtn = btn('ops-btn-sm', '✏', () => showSupplyRequestForm(sr, () => viewSupplyRequests()));
      var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
      actWrap.appendChild(viewBtn); actWrap.appendChild(editBtn);
      var titleEl = el('strong', {text: sr.title, style:'cursor:pointer;color:#38bdf8;'});
      titleEl.onclick = () => navigate('supply-detail', sr.id);
      return [
        span('ops-mono', sr.rfq_number||'—'),
        titleEl, priB, statB,
        span('ops-badge badge-gray', (sr.item_count||0)+' items'),
        sr.est_total > 0 ? fmt$(sr.est_total) : span('ops-muted','—'),
        sr.needed_by ? sr.needed_by.slice(0,10) : span('ops-muted','—'),
        actWrap
      ];
    })
  ));
  wrap.appendChild(card);
}

async function viewSupplyRequestDetail(id) {
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var sr = await API.supply.requests.get(id).catch(() => null);
  if (!sr) return;

  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Supply Requests', () => navigate('supply-requests')));
  hdr.appendChild(el('h2', {text: sr.title}));
  hdr.appendChild(span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),
    SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status));
  var priColor = sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray';
  hdr.appendChild(span('ops-badge '+priColor, SR_PRIORITIES.find(p=>p[0]===sr.priority)?.[1]||sr.priority));
  hdr.appendChild(btn('', '✏ Edit', () => showSupplyRequestForm(sr, () => viewSupplyRequestDetail(id))));
  hdr.appendChild(btn('primary', '+ Add Item', () => showSupplyItemForm(id, null, () => viewSupplyRequestDetail(id))));
  hdr.appendChild(btn('success', '📄 Export SRFQ', () => exportSupplyRFQ(sr)));
  wrap.appendChild(hdr);

  // Info bar
  var infoBar = div('');
  infoBar.style.cssText = 'display:flex;gap:20px;padding:12px 0;border-bottom:1px solid #2e3650;margin-bottom:16px;font-size:13px;color:#94a3b8;flex-wrap:wrap;';
  infoBar.appendChild(el('span', {text: '🔖 ' + (sr.rfq_number||'—')}));
  if (sr.needed_by) infoBar.appendChild(el('span', {text: '📅 Needed By: ' + sr.needed_by.slice(0,10)}));
  if (sr.requested_by) infoBar.appendChild(el('span', {text: '👤 Requested By: ' + sr.requested_by}));
  if (sr.approved_by)  infoBar.appendChild(el('span', {text: '✓ Approved By: ' + sr.approved_by}));
  if (sr.source_type && sr.source_type !== 'manual') {
    infoBar.appendChild(el('span', {text: '🔗 From: ' + sr.source_type + ' #' + sr.source_id}));
  }
  wrap.appendChild(infoBar);

  var items = sr.items || [];
  var estTotal = sr.est_total || 0;

  // Cost summary
  if (estTotal > 0) {
    var costCard = div('ops-card'); costCard.style.marginBottom = '16px';
    costCard.appendChild(div('ops-card-header', [el('h3', {text:'Cost Summary'})]));
    var cg = div('ops-cost-grid');
    var actTotal = items.reduce((s,i) => s + (i.actual_total||0), 0);
    [
      ['Est. Total',    fmt$(estTotal),  'ops-blue'],
      ['Actual Total',  fmt$(actTotal),  'ops-green'],
      ['Items',         String(items.length), 'ops-teal'],
    ].forEach(([l,v,c]) => {
      var cell = div('ops-cost-cell');
      cell.appendChild(el('div', {cls:'ops-cost-label', text:l}));
      cell.appendChild(el('div', {cls:'ops-cost-value '+c, text:String(v)}));
      cg.appendChild(cell);
    });
    costCard.appendChild(cg);
    wrap.appendChild(costCard);
  }

  // Items table
  var tableCard = div('ops-card');
  tableCard.appendChild(div('ops-card-header', [el('h3', {text:'Line Items ('+items.length+')'})]));

  if (!items.length) {
    tableCard.appendChild(el('p', {cls:'ops-empty', text:'No items yet. Add parts or materials.'}));
  } else {
    var tbl = el('table', {cls:'ops-table'}); var thead = el('thead'); var hr = el('tr');
    ['', 'Item Name','Part #','NSN','Manufacturer','UOM','Qty Req','Qty Rec','Est Total','Status',''].forEach(h=>hr.appendChild(el('th',{text:h})));
    thead.appendChild(hr); tbl.appendChild(thead);
    var tbody = el('tbody');
    items.forEach(function(item) {
      // Main row
      var dataRow = el('tr');
      var expanded = false;

      // Expand toggle
      var toggleBtn = el('button', {text:'▶'});
      toggleBtn.style.cssText = 'background:none;border:none;cursor:pointer;color:#64748b;font-size:11px;padding:2px 6px;border-radius:4px;transition:color .15s;';
      toggleBtn.title = 'Show details';

      var statB = span('ops-badge '+(item.status==='received'?'badge-green':item.status==='ordered'?'badge-blue':'badge-gray'), item.status);
      var editBtn = btn('ops-btn-sm', '✏ Edit', () => showSupplyItemForm(id, item, () => viewSupplyRequestDetail(id)));
      editBtn.style.cssText += 'background:#1e40af;color:#fff;border-color:#3b82f6;font-weight:600;';
      var delBtn = btn('danger ops-btn-sm', '✕', async () => {
        if (!confirm('Remove this item?')) return;
        await API.supply.requests.deleteItem(id, item.id);
        viewSupplyRequestDetail(id);
      });
      var actWrap = div(''); actWrap.style.cssText = 'display:flex;gap:4px;';
      actWrap.appendChild(editBtn); actWrap.appendChild(delBtn);

      var cells = [
        toggleBtn,
        el('strong', {text: item.item_name}),
        item.part_number ? span('ops-mono ops-small', item.part_number) : span('ops-muted','—'),
        item.nsn ? span('ops-mono ops-small', item.nsn) : span('ops-muted','—'),
        item.manufacturer || span('ops-muted','—'),
        item.unit_of_measure || 'each',
        item.quantity_requested,
        item.quantity_received || '0',
        item.est_total > 0 ? fmt$(item.est_total) : span('ops-muted','—'),
        statB, actWrap
      ];
      cells.forEach(function(c) {
        var td = el('td');
        if (c instanceof Node) td.appendChild(c); else td.textContent = String(c);
        dataRow.appendChild(td);
      });

      // Detail row (hidden by default)
      var detailRow = el('tr');
      detailRow.style.display = 'none';
      var detailTd = el('td'); detailTd.colSpan = 11;
      detailTd.style.cssText = 'background:#0f1628;padding:0;border-bottom:2px solid #3b82f6;';
      var detailGrid = div('');
      detailGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0;padding:14px 20px;';
      function dField(label, val) {
        var f = div(''); f.style.cssText = 'padding:6px 12px 6px 0;';
        f.appendChild(el('div',{text:label,style:'font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;'}));
        var v = div(''); v.style.cssText = 'font-size:12px;color:#e2e8f0;';
        if (val instanceof Node) v.appendChild(val); else v.textContent = val || '—';
        f.appendChild(v); return f;
      }
      detailGrid.appendChild(dField('Description', item.description || '—'));
      detailGrid.appendChild(dField('Vendor', item.vendor || '—'));
      detailGrid.appendChild(dField('CAGE Code', item.cage_code ? item.cage_code : '—'));
      detailGrid.appendChild(dField('Est. Unit Cost', item.unit_cost_est > 0 ? fmt$(item.unit_cost_est) : '—'));
      detailGrid.appendChild(dField('Actual Unit Cost', item.unit_cost_actual > 0 ? fmt$(item.unit_cost_actual) : '—'));
      detailGrid.appendChild(dField('Notes', item.notes || '—'));
      detailTd.appendChild(detailGrid);
      detailRow.appendChild(detailTd);

      toggleBtn.onclick = function(e) {
        e.stopPropagation();
        expanded = !expanded;
        detailRow.style.display = expanded ? '' : 'none';
        toggleBtn.textContent = expanded ? '▼' : '▶';
        toggleBtn.style.color = expanded ? '#38bdf8' : '#64748b';
        toggleBtn.title = expanded ? 'Hide details' : 'Show details';
      };

      tbody.appendChild(dataRow);
      tbody.appendChild(detailRow);
    });
    tbl.appendChild(tbody);
    tableCard.appendChild(tbl);
  }
  wrap.appendChild(tableCard);
  setContent(wrap);
}

function showSupplyRequestForm(existing, onDone, prefill) {
  var isEdit = !!(existing && existing.id);
  var defaults = prefill || (isEdit ? existing : {});
  var body = div('ops-form-grid');

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Request title';
  titleInp.value = defaults.title || '';
  body.appendChild(fg('Title *', titleInp, true));

  var statusSel = sel(SR_STATUSES, existing?.status || 'draft');
  body.appendChild(fg('Status', statusSel));

  var priSel = sel(SR_PRIORITIES, existing?.priority || 'routine');
  body.appendChild(fg('Priority', priSel));

  var neededInp = el('input',{}); neededInp.className='ops-input'; neededInp.type='date';
  if (existing?.needed_by) neededInp.value = existing.needed_by.slice(0,10);
  body.appendChild(fg('Needed By', neededInp));

  var reqByInp = el('input',{}); reqByInp.className='ops-input'; reqByInp.placeholder='Requested by';
  if (existing) reqByInp.value = existing.requested_by || '';
  body.appendChild(fg('Requested By', reqByInp));

  var notesInp = document.createElement('textarea'); notesInp.className='ops-input'; notesInp.rows=2;
  if (existing) notesInp.value = existing.notes || '';
  body.appendChild(fg('Notes', notesInp, true));

  var curFySr = new Date().getFullYear();
  var fyOptsSr = [['','— No FY —']].concat([curFySr-1,curFySr,curFySr+1].map(function(y){ return [String(y),'FY '+y]; }));
  var srBudgetStatus = sel([['unbudgeted','Unbudgeted'],['funded','Funded'],['ufr','UFR (Unfunded Requirement)']], existing?.budget_status||'unbudgeted');
  var srBudgetFy     = sel(fyOptsSr, existing?.budget_fiscal_year ? String(existing.budget_fiscal_year) : '');
  body.appendChild(fg('Budget Status', srBudgetStatus));
  body.appendChild(fg('Budget Fiscal Year', srBudgetFy));

  modal(isEdit ? 'Edit Supply Request' : 'New Supply Request', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:               titleInp.value.trim(),
      status:              statusSel.value,
      priority:            priSel.value,
      needed_by:           neededInp.value || '',
      requested_by:        reqByInp.value.trim(),
      notes:               notesInp.value.trim(),
      budget_status:       srBudgetStatus.value,
      budget_fiscal_year:  srBudgetFy.value ? parseInt(srBudgetFy.value) : null,
    };
    if (defaults.source_type) data.source_type = defaults.source_type;
    if (defaults.source_id)   data.source_id   = defaults.source_id;
    if (defaults.platform_id) data.platform_id = defaults.platform_id;
    else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) await API.supply.requests.update(existing.id, data);
    else await API.supply.requests.create(data);
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Create Request');
}

function showSupplyItemForm(requestId, existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var nameInp = el('input',{}); nameInp.className='ops-input'; nameInp.placeholder='Item name (required)';
  if (existing) nameInp.value = existing.item_name || '';
  body.appendChild(fg('Item Name *', nameInp, true));

  var partInp = el('input',{}); partInp.className='ops-input'; partInp.placeholder='Part number / NSN';
  if (existing) partInp.value = existing.part_number || '';
  body.appendChild(fg('Part Number', partInp));

  var descInp = document.createElement('textarea'); descInp.className='ops-input'; descInp.rows=2;
  descInp.placeholder='Description';
  if (existing) descInp.value = existing.description || '';
  body.appendChild(fg('Description', descInp, true));

  var qtyInp = el('input',{}); qtyInp.className='ops-input'; qtyInp.type='number'; qtyInp.placeholder='1';
  if (existing) qtyInp.value = existing.quantity_requested || '1';
  body.appendChild(fg('Quantity', qtyInp));

  var unitCostInp = el('input',{}); unitCostInp.className='ops-input'; unitCostInp.type='number'; unitCostInp.placeholder='0.00';
  if (existing) unitCostInp.value = existing.unit_cost_est || '';
  body.appendChild(fg('Est. Unit Cost ($)', unitCostInp));

  var vendorInp = el('input',{}); vendorInp.className='ops-input'; vendorInp.placeholder='Preferred vendor';
  if (existing) vendorInp.value = existing.vendor || '';
  body.appendChild(fg('Vendor', vendorInp));

  var mfgInp = el('input',{}); mfgInp.className='ops-input'; mfgInp.placeholder='Manufacturer';
  if (existing) mfgInp.value = existing.manufacturer || '';
  body.appendChild(fg('Manufacturer', mfgInp));

  var nsnInp = el('input',{}); nsnInp.className='ops-input'; nsnInp.placeholder='NSN (e.g. 5945-01-234-5678)';
  if (existing) nsnInp.value = existing.nsn || '';
  body.appendChild(fg('NSN', nsnInp));

  var cageInp = el('input',{}); cageInp.className='ops-input'; cageInp.placeholder='CAGE Code';
  if (existing) cageInp.value = existing.cage_code || '';
  body.appendChild(fg('CAGE Code', cageInp));

  var uomSel = sel([['each','Each'],['box','Box'],['lot','Lot'],['gallon','Gallon'],['liter','Liter'],['feet','Feet'],['meter','Meter'],['pair','Pair'],['set','Set'],['roll','Roll']], existing?.unit_of_measure || 'each');
  body.appendChild(fg('Unit of Measure', uomSel));

  if (isEdit) {
    var qtyRecInp = el('input',{}); qtyRecInp.className='ops-input'; qtyRecInp.type='number'; qtyRecInp.placeholder='0';
    qtyRecInp.value = existing.quantity_received || '0';
    body.appendChild(fg('Qty Received', qtyRecInp));

    var unitActInp = el('input',{}); unitActInp.className='ops-input'; unitActInp.type='number'; unitActInp.placeholder='0.00';
    unitActInp.value = existing.unit_cost_actual || '';
    body.appendChild(fg('Actual Unit Cost ($)', unitActInp));

    var itemStatSel = sel([['pending','Pending'],['ordered','Ordered'],['received','Received'],['cancelled','Cancelled']], existing.status||'pending');
    body.appendChild(fg('Status', itemStatSel));
  }

  var notesInp2 = el('input',{}); notesInp2.className='ops-input'; notesInp2.placeholder='Notes';
  if (existing) notesInp2.value = existing.notes || '';
  body.appendChild(fg('Notes', notesInp2));

  modal(isEdit ? 'Edit Line Item' : 'Add Line Item', body, async () => {
    if (!nameInp.value.trim()) throw new Error('Item name is required.');
    var data = {
      item_name:          nameInp.value.trim(),
      part_number:        partInp.value.trim(),
      description:        descInp.value.trim(),
      quantity_requested: parseFloat(qtyInp.value) || 1,
      unit_cost_est:      parseFloat(unitCostInp.value) || 0,
      vendor:             vendorInp.value.trim(),
      manufacturer:       mfgInp.value.trim(),
      nsn:                nsnInp.value.trim(),
      cage_code:          cageInp.value.trim(),
      unit_of_measure:    uomSel.value,
      notes:              notesInp2.value.trim(),
    };
    if (isEdit) {
      data.quantity_received = parseFloat(qtyRecInp.value) || 0;
      data.unit_cost_actual  = parseFloat(unitActInp.value) || 0;
      data.status = itemStatSel.value;
      await API.supply.requests.updateItem(requestId, existing.id, data);
    } else {
      await API.supply.requests.addItem(requestId, data);
    }
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Add Item');
}

function exportSupplyRFQ(sr) {
  var items = sr.items || [];
  var today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  var grandEst = items.reduce((s,i) => s+(i.est_total||0), 0);

  var html = `<!DOCTYPE html>
<html>
<head>
<title>SRFQ ${sr.rfq_number}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #555; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .rfq-meta { text-align: right; font-size: 13px; color: #555; }
  .rfq-meta strong { font-size: 18px; color: #333; display: block; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th { background: #f5f5f5; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 700; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #fafafa; }
  .total-row { font-weight: 700; background: #f0f0f0; }
  .sig-block { margin-top: 48px; display: flex; gap: 40px; }
  .sig-line { flex: 1; border-top: 1px solid #333; padding-top: 6px; font-size: 12px; color: #555; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Supply Request for Quote</h1>
    <div style="font-size:14px;color:#555;">${_orgSettings.org_name || 'Alto Technologies LLC'}</div>
    <div style="font-size:12px;color:#888;">${_orgSettings.org_address ? _orgSettings.org_address + ((_orgSettings.org_city ? ', ' + _orgSettings.org_city : '')) : ''}</div>
    <div style="font-size:12px;color:#888;">${_orgSettings.org_phone || ''}${_orgSettings.org_email ? ' | ' + _orgSettings.org_email : ''}</div>
  </div>
  <div class="rfq-meta">
    <strong>${sr.rfq_number}</strong>
    Date Issued: ${today}<br>
    ${sr.needed_by ? 'Needed By: ' + sr.needed_by.slice(0,10) : ''}
  </div>
</div>

<h2>Request Information</h2>
<table>
  <tr><th style="width:30%">Request Title</th><td>${sr.title}</td></tr>
  <tr><th>Priority</th><td>${sr.priority.charAt(0).toUpperCase()+sr.priority.slice(1)}</td></tr>
  <tr><th>Requested By</th><td>${sr.requested_by||'—'}</td></tr>
  <tr><th>Approved By</th><td>${sr.approved_by||'—'}</td></tr>
  ${sr.notes ? '<tr><th>Notes</th><td>'+sr.notes+'</td></tr>' : ''}
</table>

<h2>Line Items</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Item Name</th>
      <th>Part Number</th>
      <th>NSN</th>
      <th>Manufacturer</th>
      <th>CAGE</th>
      <th>UOM</th>
      <th>Qty</th>
      <th>Est. Unit Cost</th>
      <th>Est. Total</th>
      <th>Preferred Vendor</th>
    </tr>
  </thead>
  <tbody>`;

  items.forEach((item, idx) => {
    html += `<tr>
      <td>${idx+1}</td>
      <td>${item.item_name}</td>
      <td>${item.part_number||'—'}</td>
      <td>${item.description||'—'}</td>
      <td>${item.quantity_requested}</td>
      <td>${item.unit_cost_est>0?'$'+Number(item.unit_cost_est).toFixed(2):'—'}</td>
      <td>${item.est_total>0?'$'+Number(item.est_total).toFixed(2):'—'}</td>
      <td>${item.vendor||'—'}</td>
    </tr>`;
  });

  html += `<tr class="total-row">
    <td colspan="6" style="text-align:right;">ESTIMATED TOTAL</td>
    <td colspan="2">$${grandEst.toFixed(2)}</td>
  </tr>
  </tbody>
</table>

<h2>Delivery Requirements</h2>
<p style="font-size:13px;line-height:1.6;color:#555;">
All items shall be delivered to the requesting organization by ${sr.needed_by?sr.needed_by.slice(0,10):'the date specified upon award'}.
Vendor shall confirm availability and lead times with their quote response.
</p>

<h2>Terms & Conditions</h2>
<p style="font-size:12px;line-height:1.6;color:#555;">
Vendors are requested to provide firm fixed pricing for all line items listed above.
Quotes must be valid for 30 days from date of submission. Partial quotes are acceptable — 
please clearly indicate any items that cannot be supplied. The requesting organization 
reserves the right to accept or reject any or all quotes.
</p>

<div class="sig-block">
  <div class="sig-line">Requested By: ${sr.requested_by||'_______________'}<br>Date: ${today}</div>
  <div class="sig-line">Approved By: ${sr.approved_by||'_______________'}<br>Date: _______________</div>
  <div class="sig-line">Vendor Quote By: _______________<br>Date: _______________</div>
</div>

<div class="footer">
  ${sr.rfq_number} | Generated by Maintain Ops Suite | ${_orgSettings.org_name || 'Alto Technologies LLC'} | ${today}
</div>
</body>
</html>`;

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

async function viewInventory() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '🗄 Inventory'})]); 
  hdr.appendChild(btn('primary', '+ Add Item', () => showInventoryForm(null, () => viewInventory())));
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var items = await API.supply.inventory.list(p).catch(() => []);
  loading.remove();

  // Low stock warning
  var lowStock = items.filter(i => i.below_reorder);
  if (lowStock.length) {
    var warn = div('');
    warn.style.cssText = 'background:rgba(245,158,11,0.1);border:1px solid #d97706;border-radius:8px;padding:12px 16px;margin-bottom:16px;color:#fbbf24;font-size:13px;';
    warn.textContent = '⚠ ' + lowStock.length + ' item(s) below reorder point: ' + lowStock.map(i=>i.item_name).join(', ');
    wrap.appendChild(warn);
  }

  if (!items.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No inventory items yet.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['Item Name', 'Part #', 'Category', 'On Hand', 'Available', 'Reorder At', 'Location', 'Unit Cost', ''],
    items.map(item => {
      var onHandEl = el('strong', {text: String(item.quantity_on_hand)});
      if (item.below_reorder) onHandEl.style.color = '#f59e0b';
      var editBtn = btn('ops-btn-sm', '✏', () => showInventoryForm(item, () => viewInventory()));
      var txBtn   = btn('ops-btn-sm', '±', () => showTransactionForm(item, () => viewInventory()));
      var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
      actWrap.appendChild(txBtn); actWrap.appendChild(editBtn);
      return [
        (()=>{ var n=el('strong',{text:item.item_name,style:'cursor:pointer;color:#38bdf8;'}); n.onclick=()=>navigate('inv-detail',item.id); return n; })(),
        item.part_number ? span('ops-mono ops-small', item.part_number) : span('ops-muted','—'),
        span('ops-badge badge-gray', item.category),
        onHandEl,
        String(item.quantity_available),
        item.reorder_point > 0 ? String(item.reorder_point) : span('ops-muted','—'),
        item.location || span('ops-muted','—'),
        item.unit_cost > 0 ? fmt$(item.unit_cost) : span('ops-muted','—'),
        actWrap
      ];
    })
  ));
  wrap.appendChild(card);
}

function showInventoryForm(existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var nameInp = el('input',{}); nameInp.className='ops-input'; nameInp.placeholder='Item name (required)';
  if (existing) nameInp.value = existing.item_name || '';
  body.appendChild(fg('Item Name *', nameInp, true));

  var partInp = el('input',{}); partInp.className='ops-input'; partInp.placeholder='Part number / NSN';
  if (existing) partInp.value = existing.part_number || '';
  body.appendChild(fg('Part Number', partInp));

  var catSel = sel(INV_CATEGORIES, existing?.category || 'other');
  body.appendChild(fg('Category', catSel));

  var descInp = document.createElement('textarea'); descInp.className='ops-input'; descInp.rows=2;
  if (existing) descInp.value = existing.description || '';
  body.appendChild(fg('Description', descInp, true));

  if (!isEdit) {
    var qtyInp = el('input',{}); qtyInp.className='ops-input'; qtyInp.type='number'; qtyInp.placeholder='0';
    body.appendChild(fg('Initial Quantity', qtyInp));
  }

  var reorderInp = el('input',{}); reorderInp.className='ops-input'; reorderInp.type='number'; reorderInp.placeholder='0';
  if (existing) reorderInp.value = existing.reorder_point || '';
  body.appendChild(fg('Reorder Point', reorderInp));

  var unitCostInp = el('input',{}); unitCostInp.className='ops-input'; unitCostInp.type='number'; unitCostInp.placeholder='0.00';
  if (existing) unitCostInp.value = existing.unit_cost || '';
  body.appendChild(fg('Unit Cost ($)', unitCostInp));

  var locInp = el('input',{}); locInp.className='ops-input'; locInp.placeholder='Shelf / bin location';
  if (existing) locInp.value = existing.location || '';
  body.appendChild(fg('Location', locInp));

  var vendorInp = el('input',{}); vendorInp.className='ops-input'; vendorInp.placeholder='Preferred vendor';
  if (existing) vendorInp.value = existing.vendor || '';
  body.appendChild(fg('Vendor', vendorInp));

  var mfgInp = el('input',{}); mfgInp.className='ops-input'; mfgInp.placeholder='Manufacturer';
  if (existing) mfgInp.value = existing.manufacturer || '';
  body.appendChild(fg('Manufacturer', mfgInp));

  var nsnInp = el('input',{}); nsnInp.className='ops-input'; nsnInp.placeholder='NSN (e.g. 5945-01-234-5678)';
  if (existing) nsnInp.value = existing.nsn || '';
  body.appendChild(fg('NSN', nsnInp));

  var cageInp = el('input',{}); cageInp.className='ops-input'; cageInp.placeholder='CAGE Code';
  if (existing) cageInp.value = existing.cage_code || '';
  body.appendChild(fg('CAGE Code', cageInp));

  var uomSel = sel([['each','Each'],['box','Box'],['lot','Lot'],['gallon','Gallon'],['liter','Liter'],['feet','Feet'],['meter','Meter'],['pair','Pair'],['set','Set'],['roll','Roll']], existing?.unit_of_measure || 'each');
  body.appendChild(fg('Unit of Measure', uomSel));

  var leadInp = el('input',{}); leadInp.className='ops-input'; leadInp.type='number'; leadInp.placeholder='0';
  if (existing) leadInp.value = existing.lead_time_days || '';
  body.appendChild(fg('Lead Time (days)', leadInp));

  var classSel = sel([
    ['A-daily','A — Daily (High value/fast moving)'],
    ['A-weekly','A — Weekly (High value/fast moving)'],
    ['B','B — Monthly (Mid tier)'],
    ['C','C — Quarterly (Low volume/slow moving)'],
    ['full','Full — Annual']
  ], existing?.count_class || 'C');
  body.appendChild(fg('Cycle Count Class', classSel));

  modal(isEdit ? 'Edit Inventory Item' : 'Add Inventory Item', body, async () => {
    if (!nameInp.value.trim()) throw new Error('Item name is required.');
    var data = {
      item_name:      nameInp.value.trim(),
      part_number:    partInp.value.trim(),
      category:       catSel.value,
      description:    descInp.value.trim(),
      reorder_point:  parseFloat(reorderInp.value) || 0,
      unit_cost:      parseFloat(unitCostInp.value) || 0,
      location:       locInp.value.trim(),
      vendor:         vendorInp.value.trim(),
      lead_time_days: parseInt(leadInp.value) || 0,
    };
    if (!isEdit) data.quantity_on_hand = parseFloat(qtyInp.value) || 0;
    data.count_class = classSel.value;
    if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) await API.supply.inventory.update(existing.id, data);
    else await API.supply.inventory.create(data);
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Add Item');
}

function showTransactionForm(item, onDone) {
  var body = div('ops-form-grid');

  var typeSel = sel([
    ['receive','Receive — Add stock'],
    ['issue','Issue — Remove stock to technician'],
    ['return','Return — Return unused stock'],
    ['adjust','Adjust — Set absolute quantity']
  ], 'receive');
  body.appendChild(fg('Transaction Type', typeSel));

  var qtyInp = el('input',{}); qtyInp.className='ops-input'; qtyInp.type='number'; qtyInp.placeholder='Quantity';
  body.appendChild(fg('Quantity', qtyInp));

  var notesInp = el('input',{}); notesInp.className='ops-input'; notesInp.placeholder='Notes (e.g. issued to Tech Smith)';
  body.appendChild(fg('Notes', notesInp));

  // Current stock info
  var info = div('');
  info.style.cssText = 'background:#0f172a;border-radius:8px;padding:12px;font-size:13px;color:#94a3b8;margin-bottom:8px;';
  info.textContent = 'Current stock: ' + item.quantity_on_hand + ' | Available: ' + item.quantity_available;
  body.insertBefore(info, body.firstChild);

  modal('Stock Transaction — ' + item.item_name, body, async () => {
    var qty = parseFloat(qtyInp.value);
    if (!qty || qty <= 0) throw new Error('Quantity must be greater than 0.');
    await API.supply.inventory.transact(item.id, {
      transaction_type: typeSel.value,
      quantity:         qty,
      notes:            notesInp.value.trim(),
    });
    if (onDone) onDone();
  }, 'Submit Transaction');
}

const WP_STATUSES = [
  ['drafting','Drafting'],['rfq_issued','RFQ Issued'],['quotes_received','Quotes Received'],
  ['awarded','Awarded'],['in_progress','In Progress'],['complete','Complete'],
  // legacy values
  ['draft','Draft'],['submitted','Submitted'],['approved','Approved'],
];
const WP_STATUS_COLORS = {
  drafting:'badge-gray', draft:'badge-gray',
  rfq_issued:'badge-blue', submitted:'badge-blue',
  quotes_received:'badge-orange',
  awarded:'badge-teal', approved:'badge-teal',
  in_progress:'badge-purple',
  complete:'badge-green',
};
const WP_TRANSITIONS = {
  drafting:        ['rfq_issued'],
  draft:           ['rfq_issued'],
  rfq_issued:      ['quotes_received','drafting'],
  quotes_received: ['awarded','rfq_issued'],
  awarded:         ['in_progress'],
  in_progress:     ['complete'],
  submitted:       ['rfq_issued'],
  approved:        ['in_progress','complete'],
};

async function viewInventoryDetail(id) {
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var item = await API.supply.inventory.get(id).catch(() => null);
  if (!item) return;
  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Inventory', () => navigate('inventory')));
  hdr.appendChild(el('h2', {text: item.item_name}));
  if (item.below_reorder) hdr.appendChild(span('ops-badge badge-orange', '⚠ Below Reorder Point'));
  hdr.appendChild(btn('', '✏ Edit', () => showInventoryForm(item, () => viewInventoryDetail(id))));
  hdr.appendChild(btn('primary', '± Transaction', () => showTransactionForm(item, () => viewInventoryDetail(id))));
  wrap.appendChild(hdr);
  var two = div('ops-two-col');
  var left = div('');
  var dc = div('ops-card');
  dc.appendChild(div('ops-card-header', [el('h3', {text:'Item Details'})]));
  var kvg = div('ops-kv-grid');
  [
    ['Part Number',   item.part_number ? span('ops-mono', item.part_number) : span('ops-muted','--')],
    ['Category',      span('ops-badge badge-gray', item.category)],
    ['Description',   item.description || span('ops-muted','--')],
    ['Location',      item.location || span('ops-muted','--')],
    ['Vendor',        item.vendor || span('ops-muted','--')],
    ['Lead Time',     item.lead_time_days ? item.lead_time_days + ' days' : span('ops-muted','--')],
    ['Unit Cost',     item.unit_cost > 0 ? fmt$(item.unit_cost) : span('ops-muted','--')],
    ['Total Value',   item.total_value > 0 ? fmt$(item.total_value) : span('ops-muted','--')],
    ['Count Class',   span('ops-badge badge-blue', COUNT_CLASS_LABELS[item.count_class]||item.count_class)],
    ['Last Counted',  item.last_counted_at ? item.last_counted_at.slice(0,10) + ' by ' + (item.counted_by||'unknown') : span('ops-danger','Never')],
    ['Next Count Due',item.next_count_due ? item.next_count_due.slice(0,10) : span('ops-muted','--')],
  ].forEach(([k,v]) => {
    var kv = div('ops-kv');
    kv.appendChild(span('ops-kv-key', k));
    typeof v === 'string' ? kv.appendChild(span('',v)) : kv.appendChild(v);
    kvg.appendChild(kv);
  });
  dc.appendChild(kvg);
  left.appendChild(dc);
  var sc = div('ops-card'); sc.style.marginTop = '16px';
  sc.appendChild(div('ops-card-header', [el('h3', {text:'Stock Levels'})]));
  var cg = div('ops-cost-grid');
  [
    ['On Hand',    String(item.quantity_on_hand),  'ops-blue'],
    ['Reserved',   String(item.quantity_reserved), 'ops-warn'],
    ['Available',  String(item.quantity_available), item.below_reorder ? 'ops-danger' : 'ops-green'],
    ['Reorder At', String(item.reorder_point),     'ops-muted'],
  ].forEach(([l,v,c]) => {
    var cell = div('ops-cost-cell');
    cell.appendChild(el('div', {cls:'ops-cost-label', text:l}));
    cell.appendChild(el('div', {cls:'ops-cost-value '+c, text:v}));
    cg.appendChild(cell);
  });
  sc.appendChild(cg);
  left.appendChild(sc);
  two.appendChild(left);
  var right = div('');
  var txCard = div('ops-card ops-detail-card');
  txCard.appendChild(div('ops-card-header', [el('h3', {text:'Transaction History'})]));
  var txs = item.transactions || [];
  if (!txs.length) {
    txCard.appendChild(el('p', {cls:'ops-empty ops-small', text:'No transactions yet.'}));
  } else {
    var TX_COLORS = {receive:'badge-green', issue:'badge-orange', adjust:'badge-blue', return:'badge-teal'};
    txCard.appendChild(makeTable(
      ['Date', 'Type', 'Qty', 'Notes', 'By'],
      txs.map(tx => [
        tx.created_at ? tx.created_at.slice(0,10) : '--',
        span('ops-badge '+(TX_COLORS[tx.transaction_type]||'badge-gray'), tx.transaction_type),
        el('strong', {text: String(tx.quantity), style: tx.transaction_type==='issue'?'color:#f59e0b;':'color:#4ade80;'}),
        tx.notes || span('ops-muted','--'),
        tx.created_by || span('ops-muted','--'),
      ])
    ));
  }
  right.appendChild(txCard);
  two.appendChild(right);
  wrap.appendChild(two);
  setContent(wrap);
}

async function viewWorkPackages() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '📦 Work Packages / RFQs'})]);
  hdr.appendChild(btn('primary', '+ New Work Package', () => showWorkPackageForm(null, () => viewWorkPackages())));
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var packages = await API.workPackages.list(p).catch(() => []);
  loading.remove();

  if (!packages.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No work packages yet. Create one to begin the RFQ process for contractor support.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['RFQ #', 'Title', 'Status', 'Items', 'Awarded To', 'Award / Est.', 'RFQ Due', ''],
    packages.map(pkg => {
      var statusB = span('ops-badge '+(WP_STATUS_COLORS[pkg.status]||'badge-gray'),
        WP_STATUSES.find(s=>s[0]===pkg.status)?.[1]||pkg.status);
      var viewBtn = btn('ops-btn-sm', 'View', () => navigate('wp-detail', pkg.id));
      var editBtn = btn('ops-btn-sm', '✏', () => showWorkPackageForm(pkg, () => viewWorkPackages()));
      var actWrap = div('ops-btn-group'); actWrap.appendChild(viewBtn); actWrap.appendChild(editBtn);
      var titleEl = el('strong', {text: pkg.title, style:'cursor:pointer;color:#38bdf8;'});
      titleEl.onclick = () => navigate('wp-detail', pkg.id);
      var costEl = pkg.award_amount != null
        ? el('span', {text: fmt$(pkg.award_amount), style:'color:#4ade80;font-weight:600;'})
        : pkg.est_total > 0 ? span('ops-muted', 'Est: '+fmt$(pkg.est_total)) : span('ops-muted','—');
      return [
        span('ops-mono ops-small', pkg.rfq_number || '—'),
        titleEl,
        statusB,
        span('ops-badge badge-gray', String(pkg.item_count || 0) + ' / ' + String(pkg.quote_count || 0) + ' quotes'),
        pkg.awarded_to ? el('span', {text: pkg.awarded_to}) : span('ops-muted','—'),
        costEl,
        pkg.rfq_due_date ? pkg.rfq_due_date.slice(0,10) : span('ops-muted','—'),
        actWrap
      ];
    })
  ));
  wrap.appendChild(card);
}

async function viewWorkPackageDetail(id) {
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var pkg = await API.workPackages.get(id).catch(() => null);
  if (!pkg) { setContent(el('div',{cls:'ops-empty',text:'Work package not found.'})); return; }

  var wrap = div('');

  // ── Header ───────────────────────────────────────────────────
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Work Packages', () => navigate('work-packages')));
  hdr.appendChild(el('h2', {text: '📦 ' + pkg.rfq_number + ' — ' + pkg.title}));
  hdr.appendChild(span('ops-badge '+(WP_STATUS_COLORS[pkg.status]||'badge-gray'),
    WP_STATUSES.find(s=>s[0]===pkg.status)?.[1]||pkg.status));
  var acts = div('ops-btn-group');
  acts.appendChild(btn('', '✏ Edit', () => showWorkPackageForm(pkg, () => viewWorkPackageDetail(id))));
  if (_canWrite && (pkg.status === 'quotes_received' || pkg.status === 'rfq_issued')) {
    acts.appendChild(btn('primary', '🏆 Award Contract', () => showAwardForm(pkg, () => viewWorkPackageDetail(id))));
  }
  acts.appendChild(btn('', '📄 Export RFQ', () => exportRFQ(pkg)));
  hdr.appendChild(acts);
  wrap.appendChild(hdr);

  // ── RFQ Lifecycle tracker ────────────────────────────────────
  var stages = ['drafting','rfq_issued','quotes_received','awarded','in_progress','complete'];
  var curIdx = stages.indexOf(pkg.status);
  if (curIdx === -1) curIdx = 0;
  var tracker = div('');
  tracker.style.cssText = 'display:flex;align-items:center;gap:0;padding:16px 0;margin-bottom:16px;overflow-x:auto;';
  stages.forEach(function(s, i) {
    var done = i < curIdx;
    var active = i === curIdx;
    var label = WP_STATUSES.find(x=>x[0]===s)?.[1]||s;
    var step = div('');
    step.style.cssText = 'display:flex;flex-direction:column;align-items:center;min-width:100px;';
    var dot = div('');
    dot.style.cssText = 'width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid ' +
      (done?'#4ade80':active?'#38bdf8':'#334155') + ';background:' +
      (done?'rgba(74,222,128,0.15)':active?'rgba(56,189,248,0.15)':'transparent') + ';color:' +
      (done?'#4ade80':active?'#38bdf8':'#475569') + ';';
    dot.textContent = done ? '✓' : String(i+1);
    var lbl = el('span',{text:label});
    lbl.style.cssText = 'font-size:10px;margin-top:4px;color:'+(active?'#e2e8f0':'#64748b')+';text-align:center;';
    step.appendChild(dot); step.appendChild(lbl);
    tracker.appendChild(step);
    if (i < stages.length - 1) {
      var line = div('');
      line.style.cssText = 'flex:1;height:2px;background:'+(i<curIdx?'#4ade80':'#1e293b')+';min-width:20px;margin-bottom:16px;';
      tracker.appendChild(line);
    }
  });
  wrap.appendChild(tracker);

  // Stage advance bar
  var nextStages = WP_TRANSITIONS[pkg.status] || [];
  if (nextStages.length && _canWrite && pkg.status !== 'awarded') {
    var advBar = div('');
    advBar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0 16px;';
    var advSel = el('select',{cls:'ops-select ops-select-sm'});
    nextStages.forEach(s => advSel.appendChild(el('option',{value:s,text:'→ '+(WP_STATUSES.find(x=>x[0]===s)?.[1]||s)})));
    var advBtn = btn('primary ops-btn-sm','Advance Stage', async()=>{
      try { await API.workPackages.update(id,{status:advSel.value}); viewWorkPackageDetail(id); }
      catch(e){ alert(e.message||'Transition failed.'); }
    });
    advBar.appendChild(advSel); advBar.appendChild(advBtn);
    wrap.appendChild(advBar);
  }

  // ── Info / Meta bar ──────────────────────────────────────────
  var infoBar = div('');
  infoBar.style.cssText = 'display:flex;gap:20px;padding:12px 0;border-bottom:1px solid #2e3650;margin-bottom:16px;font-size:13px;color:#94a3b8;flex-wrap:wrap;';
  infoBar.appendChild(el('span', {text: '🔖 ' + (pkg.rfq_number || '—')}));
  if (pkg.rfq_due_date) infoBar.appendChild(el('span', {text: '📅 Response Due: ' + pkg.rfq_due_date.slice(0,10)}));
  if (pkg.assigned_to) infoBar.appendChild(el('span', {text: '👤 ' + pkg.assigned_to}));
  if (pkg.approver)    infoBar.appendChild(el('span', {text: '✓ ' + pkg.approver}));
  if (pkg.source_type && pkg.source_label) {
    var srcLink = el('span', {text: '🔗 ' + (pkg.source_type === 'modernization' ? 'MOD' : 'DEF') + ': ' + pkg.source_label});
    srcLink.style.cssText = 'color:#38bdf8;cursor:pointer;';
    srcLink.onclick = () => navigate(pkg.source_type === 'modernization' ? 'mod-detail' : 'def-detail', pkg.source_id);
    infoBar.appendChild(srcLink);
  }
  wrap.appendChild(infoBar);

  // ── Award card (if awarded) ──────────────────────────────────
  if (pkg.awarded_to) {
    var awardCard = div('ops-card'); awardCard.style.cssText = 'margin-bottom:16px;border:1px solid rgba(74,222,128,0.3);';
    awardCard.appendChild(div('ops-card-header',[el('h3',{text:'🏆 Contract Award'})]));
    var ag = div('ops-kv-grid'); ag.style.padding='16px';
    [
      ['Awarded To',    pkg.awarded_to],
      ['Award Amount',  pkg.award_amount != null ? fmt$(pkg.award_amount) : '—'],
      ['Award Date',    pkg.award_date ? pkg.award_date.slice(0,10) : '—'],
      ['Obligation',    pkg.award_date ? 'Obligated ' + pkg.award_date.slice(0,10) : 'Pending award'],
    ].forEach(([k,v]) => {
      var kv = div('ops-kv');
      kv.appendChild(span('ops-kv-key',k));
      typeof v === 'string' ? kv.appendChild(el('span',{text:v,style:'color:#4ade80;font-weight:600;'})) : kv.appendChild(v);
      ag.appendChild(kv);
    });
    awardCard.appendChild(ag);
    wrap.appendChild(awardCard);
  }

  // ── Two-column: Items + Quotes ───────────────────────────────
  var two = div('ops-two-col');

  // Items card
  var items = pkg.items || [];
  var estTotal = pkg.est_total || 0;
  var itemCard = div('ops-card');
  var itemHdr = div('ops-card-header');
  itemHdr.appendChild(el('h3',{text:'Scope Items (' + items.length + ')'}));
  if (_canWrite) itemHdr.appendChild(btn('ops-btn-sm','+ Add Item', () => showAddWPItemForm(pkg, () => viewWorkPackageDetail(id))));
  itemCard.appendChild(itemHdr);

  if (!items.length) {
    itemCard.appendChild(el('p',{cls:'ops-empty',text:'No items yet. Link the deficiencies or modernizations this package covers.'}));
  } else {
    var TYPE_STYLES = {
      pm:           ['PM',  '#0284c7','rgba(2,132,199,0.15)'],
      modernization:['MOD', '#7c3aed','rgba(124,58,237,0.15)'],
      deficiency:   ['DEF', '#dc2626','rgba(220,38,38,0.15)'],
    };
    itemCard.appendChild(makeTable(
      ['Type','Title','Status','Est. Cost','Target',''],
      items.map(item => {
        var ts = TYPE_STYLES[item.item_type] || ['ITEM','#64748b','rgba(100,116,139,0.15)'];
        var typeChip = span('ops-badge', ts[0]);
        typeChip.style.cssText = 'background:'+ts[2]+';color:'+ts[1]+';border:1px solid '+ts[1]+';';
        var delBtn = btn('ops-btn-sm ops-btn-danger','✕', async() => {
          if (!confirm('Remove this item?')) return;
          await API.workPackages.removeItem(id, item.id);
          viewWorkPackageDetail(id);
        });
        var title = item.linked_title || item.notes || '—';
        var cost  = item.linked_est_total > 0 ? fmt$(item.linked_est_total) : '—';
        var target = (item.linked_next_due || item.linked_target || '—');
        if (target !== '—') target = target.slice(0,10);
        var statusChip = item.linked_status ? span('ops-badge badge-gray', item.linked_status) : span('ops-muted','—');
        return [typeChip, el('strong',{text:title}), statusChip, cost, target, delBtn];
      })
    ));
    if (estTotal > 0) {
      var totRow = div(''); totRow.style.cssText='text-align:right;padding:8px 12px;font-size:13px;color:#94a3b8;border-top:1px solid #1e293b;';
      totRow.appendChild(document.createTextNode('Est. Total: '));
      totRow.appendChild(el('strong',{text:fmt$(estTotal),style:'color:#f59e0b;'}));
      itemCard.appendChild(totRow);
    }
  }
  two.appendChild(itemCard);

  // Quotes card
  var quotes = pkg.quotes || [];
  var quoteCard = div('ops-card');
  var quoteHdr = div('ops-card-header');
  quoteHdr.appendChild(el('h3',{text:'Vendor Quotes (' + quotes.length + ')'}));
  if (_canWrite) quoteHdr.appendChild(btn('ops-btn-sm','+ Add Quote', () => showQuoteForm(id, null, () => viewWorkPackageDetail(id))));
  quoteCard.appendChild(quoteHdr);

  if (!quotes.length) {
    quoteCard.appendChild(el('p',{cls:'ops-empty',text:'No quotes received yet.'}));
  } else {
    quoteCard.appendChild(makeTable(
      ['Vendor','Amount','Date','Valid Until','Selected',''],
      quotes.map(q => {
        var selBadge = q.is_selected
          ? span('ops-badge badge-green','✓ Selected')
          : span('ops-muted','—');
        var eb = btn('ops-btn-sm','✏', () => showQuoteForm(id, q, () => viewWorkPackageDetail(id)));
        var db = btn('ops-btn-sm ops-btn-danger','✕', async() => {
          if (!confirm('Delete this quote?')) return;
          await API.workPackages.destroyQuote(id, q.id);
          viewWorkPackageDetail(id);
        });
        var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db);
        return [
          el('strong',{text:q.vendor_name}),
          q.quote_amount != null ? fmt$(q.quote_amount) : span('ops-muted','—'),
          q.quote_date ? q.quote_date.slice(0,10) : span('ops-muted','—'),
          q.valid_until ? q.valid_until.slice(0,10) : span('ops-muted','—'),
          selBadge, g
        ];
      })
    ));
  }
  two.appendChild(quoteCard);
  wrap.appendChild(two);

  // Manpower Requirements card
  var mpCard = div('ops-card'); mpCard.style.marginTop='16px';
  var mpHdr = div('ops-card-header'); mpHdr.appendChild(el('h3',{text:'👷 Manpower Requirements'}));
  mpCard.appendChild(mpHdr);
  var mpBody = div(''); mpBody.style.padding='16px';
  mpCard.appendChild(mpBody);
  wrap.appendChild(mpCard);
  renderManpowerSection('work_package', id, mpBody, !!_canWrite);

  // Scope / Notes
  if (pkg.description || pkg.notes) {
    var notesCard = div('ops-card'); notesCard.style.marginTop='16px';
    if (pkg.description) {
      notesCard.appendChild(div('ops-section-label',[document.createTextNode('Scope of Work')]));
      notesCard.appendChild(el('p',{cls:'ops-notes',text:pkg.description}));
    }
    if (pkg.notes) {
      notesCard.appendChild(div('ops-section-label',[document.createTextNode('Notes')]));
      notesCard.appendChild(el('p',{cls:'ops-notes',text:pkg.notes}));
    }
    wrap.appendChild(notesCard);
  }

  setContent(wrap);
}

function showWorkPackageForm(existing, onDone, defaults) {
  defaults = defaults || {};
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var titleInp = inp('Work package / RFQ title', existing?.title || '');
  body.appendChild(fg('Title *', titleInp, true));

  var descInp = ta('Scope of work — this appears in the exported RFQ document', existing?.description || '', 3);
  body.appendChild(fg('Scope of Work', descInp, true));

  var sourceTypeSel = sel([['','None — Standalone'],['modernization','Modernization'],['deficiency','Deficiency']], existing?.source_type || defaults.source_type || '');
  body.appendChild(fg('Linked Source Type', sourceTypeSel));

  var sourceIdInp = inp('Source record ID (leave blank for standalone)', existing?.source_id ? String(existing.source_id) : (defaults.source_id ? String(defaults.source_id) : ''));
  body.appendChild(fg('Source ID', sourceIdInp, false, 'ID of the Modernization or Deficiency this package covers'));

  var typeSel = sel([['mixed','Mixed (PMs + Mods + Deficiencies)'],['pm_only','PMs Only'],['modernization_only','Modernizations Only'],['deficiency_only','Deficiencies Only']], existing?.package_type || 'mixed');
  body.appendChild(fg('Package Type', typeSel));

  var assignInp = inp('Assigned contact / contracting officer', existing?.assigned_to || '');
  body.appendChild(fg('Assigned To', assignInp));

  var approverInp = inp('Approving authority', existing?.approver || '');
  body.appendChild(fg('Approver', approverInp));

  var rfqDueInp = el('input',{}); rfqDueInp.className='ops-input'; rfqDueInp.type='date';
  if (existing?.rfq_due_date) rfqDueInp.value = existing.rfq_due_date.slice(0,10);
  body.appendChild(fg('RFQ Response Due Date', rfqDueInp));

  var notesInp = ta('Internal notes', existing?.notes || '', 2);
  body.appendChild(fg('Notes', notesInp, true));

  modal(isEdit ? 'Edit Work Package' : 'New Work Package / RFQ', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:        titleInp.value.trim(),
      description:  descInp.value.trim(),
      package_type: typeSel.value,
      assigned_to:  assignInp.value.trim(),
      approver:     approverInp.value.trim(),
      rfq_due_date: rfqDueInp.value || '',
      notes:        notesInp.value.trim(),
      source_type:  sourceTypeSel.value || null,
      source_id:    sourceIdInp.value ? parseInt(sourceIdInp.value) : null,
    };
    if (!isEdit) {
      if (defaults.platform_id) data.platform_id = defaults.platform_id;
      else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    }
    if (isEdit) await API.workPackages.update(existing.id, data);
    else await API.workPackages.create(data);
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Create Work Package');
}

async function showAddWPItemForm(pkg, onDone) {
  var body = div('ops-form-grid');

  var typeSel = sel([['deficiency','Deficiency'],['modernization','Modernization'],['pm','PM Procedure']], 'deficiency');
  body.appendChild(fg('Item Type', typeSel));

  var itemWrap = div('');
  var itemSel = el('select',{cls:'ops-select'});
  itemSel.appendChild(el('option',{value:'',text:'— Select item —'}));
  itemWrap.appendChild(itemSel);
  body.appendChild(fg('Item', itemWrap));

  var notesInp = el('input',{}); notesInp.className='ops-input'; notesInp.placeholder='Notes (optional)';
  body.appendChild(fg('Notes', notesInp));

  async function loadItems() {
    itemSel.innerHTML = '<option value="">Loading…</option>';
    var type = typeSel.value;
    var items = type === 'pm'
      ? await API.procedures.list({}).catch(()=>[])
      : type === 'deficiency'
        ? await API.deficiencies.list({}).catch(()=>[])
        : await API.modernizations.list({}).catch(()=>[]);
    itemSel.innerHTML = '<option value="">— Select item —</option>';
    items.forEach(i => {
      var label = (i.def_code || i.mod_code ? '['+(i.def_code||i.mod_code)+'] ' : '') + (i.name || i.title || '#'+i.id);
      itemSel.appendChild(el('option',{value:String(i.id), text:label}));
    });
  }
  typeSel.onchange = loadItems;
  await loadItems();

  modal('Add Item to Work Package', body, async () => {
    if (!itemSel.value) throw new Error('Please select an item.');
    var result = await API.workPackages.addItem(pkg.id, {
      item_type: typeSel.value,
      item_id:   parseInt(itemSel.value),
      notes:     notesInp.value.trim(),
    });
    if (result.message && result.message.includes('already in work package')) {
      throw new Error(result.message);
    }
    if (onDone) onDone();
  }, 'Add Item');
}

function showQuoteForm(wpId, existing, onSave) {
  var body = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }

  f.vendor    = add('Vendor Name *',    inp('Company or contractor name', existing?.vendor_name || ''));
  f.contact   = add('Contact',          inp('Contact person / email', existing?.vendor_contact || ''));
  f.amount    = add('Quote Amount ($)', inp('0.00', existing?.quote_amount != null ? String(existing.quote_amount) : ''));
  f.quoteDate = add('Quote Date',       el('input',{}));
  f.quoteDate.type = 'date'; f.quoteDate.className = 'ops-input';
  if (existing?.quote_date) f.quoteDate.value = existing.quote_date.slice(0,10);
  f.validUntil= add('Valid Until',      el('input',{}));
  f.validUntil.type = 'date'; f.validUntil.className = 'ops-input';
  if (existing?.valid_until) f.validUntil.value = existing.valid_until.slice(0,10);
  f.notes     = add('Notes',            ta('Quote notes or conditions…', existing?.notes || '', 2), true);

  modal(existing ? 'Edit Quote' : 'Add Vendor Quote', body, async () => {
    if (!f.vendor.value.trim()) throw new Error('Vendor name is required.');
    var d = {
      vendor_name:    f.vendor.value.trim(),
      vendor_contact: f.contact.value.trim() || null,
      quote_amount:   f.amount.value !== '' ? parseFloat(f.amount.value) : null,
      quote_date:     f.quoteDate.value || null,
      valid_until:    f.validUntil.value || null,
      notes:          f.notes.value.trim() || null,
    };
    if (existing) await API.workPackages.updateQuote(wpId, existing.id, d);
    else          await API.workPackages.createQuote(wpId, d);
    if (onSave) onSave();
  }, existing ? 'Save Quote' : 'Add Quote');
}

function showAwardForm(pkg, onSave) {
  var quotes = pkg.quotes || [];
  var body = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }

  // Quote picker — if quotes exist, pre-fill from selection
  var quoteOpts = [['','— Manual entry (no quote) —']].concat(quotes.map(q => [String(q.id), q.vendor_name + (q.quote_amount != null ? ' — '+fmt$(q.quote_amount) : '')]));
  f.quoteSel  = add('Select Quote', sel(quoteOpts, ''));
  f.vendor    = add('Awarded To *', inp('Vendor / contractor name', ''));
  f.amount    = add('Award Amount ($)', inp('0.00', ''));
  f.awardDate = add('Award Date *', el('input',{}));
  f.awardDate.type = 'date'; f.awardDate.className = 'ops-input';
  f.awardDate.value = new Date().toISOString().slice(0,10);

  // Auto-fill when a quote is selected
  f.quoteSel.onchange = function() {
    var q = quotes.find(x => String(x.id) === f.quoteSel.value);
    if (q) {
      f.vendor.value = q.vendor_name;
      if (q.quote_amount != null) f.amount.value = String(q.quote_amount);
    }
  };

  modal('Award Contract', body, async () => {
    if (!f.vendor.value.trim()) throw new Error('Awarded To is required.');
    var d = {
      quote_id:     f.quoteSel.value ? parseInt(f.quoteSel.value) : null,
      awarded_to:   f.vendor.value.trim(),
      award_amount: f.amount.value !== '' ? parseFloat(f.amount.value) : null,
      award_date:   f.awardDate.value || new Date().toISOString().slice(0,10),
    };
    await API.workPackages.award(pkg.id, d);
    if (onSave) onSave();
  }, 'Award Contract');
}

function exportRFQ(pkg) {
  // Build RFQ HTML and open in new window for printing
  var items = pkg.items || [];
  var today = new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  var html = `<!DOCTYPE html>
<html>
<head>
<title>RFQ ${pkg.rfq_number}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #555; border-bottom: 2px solid #333; padding-bottom: 6px; margin-top: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .rfq-meta { text-align: right; font-size: 13px; color: #555; }
  .rfq-meta strong { font-size: 18px; color: #333; display: block; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th { background: #f5f5f5; padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: 700; }
  td { padding: 8px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #fafafa; }
  .total-row { font-weight: 700; background: #f0f0f0; }
  .sig-block { margin-top: 48px; display: flex; gap: 40px; }
  .sig-line { flex: 1; border-top: 1px solid #333; padding-top: 6px; font-size: 12px; color: #555; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Request for Quote</h1>
    <div style="font-size:14px;color:#555;">${_orgSettings.org_name || 'Alto Technologies LLC'}</div>
    <div style="font-size:12px;color:#888;">${_orgSettings.org_address ? _orgSettings.org_address + ((_orgSettings.org_city ? ', ' + _orgSettings.org_city : '')) : ''}</div>
    <div style="font-size:12px;color:#888;">${_orgSettings.org_phone || ''}${_orgSettings.org_email ? ' | ' + _orgSettings.org_email : ''}</div>
  </div>
  <div class="rfq-meta">
    <strong>${pkg.rfq_number}</strong>
    Date Issued: ${today}<br>
    ${pkg.rfq_due_date ? 'Response Due: ' + pkg.rfq_due_date.slice(0,10) : ''}
  </div>
</div>

<h2>Project Information</h2>
<table>
  <tr><th style="width:30%">Work Package</th><td>${pkg.title}</td></tr>
  <tr><th>Prepared By</th><td>${pkg.assigned_to || '—'}</td></tr>
  <tr><th>Approver</th><td>${pkg.approver || '—'}</td></tr>
  <tr><th>Status</th><td>${pkg.status.charAt(0).toUpperCase()+pkg.status.slice(1)}</td></tr>
</table>

<h2>Scope of Work</h2>
<p style="font-size:13px;line-height:1.6;">${pkg.description || 'See line items below.'}</p>

<h2>Line Items</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Type</th>
      <th>Description</th>
      <th>Est. Hours</th>
      <th>Est. Parts</th>
      <th>Est. Labor</th>
      <th>Est. Contractor</th>
      <th>Est. Total</th>
    </tr>
  </thead>
  <tbody>`;

  var grandTotal = 0;
  items.forEach((item, idx) => {
    var type  = item.item_type === 'pm' ? 'PM Procedure' : 'Modernization';
    var title = item.linked_title || '—';
    var hours = item.linked_est_hours ? item.linked_est_hours + 'h' : '—';
    var parts = item.linked_est_parts > 0 ? '$' + Number(item.linked_est_parts).toFixed(2) : '—';
    var labor = item.linked_est_labor > 0 ? '$' + Number(item.linked_est_labor).toFixed(2) : '—';
    var contr = item.linked_est_contractor > 0 ? '$' + Number(item.linked_est_contractor).toFixed(2) : '—';
    var total = item.linked_est_total || 0;
    grandTotal += total;
    html += `<tr>
      <td>${idx+1}</td>
      <td>${type}</td>
      <td>${title}</td>
      <td>${hours}</td>
      <td>${parts}</td>
      <td>${labor}</td>
      <td>${contr}</td>
      <td>${total > 0 ? '$'+total.toFixed(2) : '—'}</td>
    </tr>`;
  });

  html += `<tr class="total-row">
    <td colspan="7" style="text-align:right;">ESTIMATED TOTAL</td>
    <td>$${grandTotal.toFixed(2)}</td>
  </tr>
  </tbody>
</table>

<h2>Terms & Conditions</h2>
<p style="font-size:12px;line-height:1.6;color:#555;">
Vendors are requested to provide a firm fixed-price quote for the scope of work described above.
Quotes must be valid for 90 days from the date of submission. All work shall be performed in
accordance with applicable codes, standards, and regulations. The requesting organization reserves
the right to accept or reject any or all quotes.
</p>

<div class="sig-block">
  <div class="sig-line">Prepared By: ${pkg.assigned_to || '_______________'}<br>Date: ${today}</div>
  <div class="sig-line">Approved By: ${pkg.approver || '_______________'}<br>Date: _______________</div>
  <div class="sig-line">Vendor Signature: _______________<br>Date: _______________</div>
</div>

<div class="footer">
  ${pkg.rfq_number} | Generated by Maintain Ops Suite | ${_orgSettings.org_name || 'Alto Technologies LLC'} | ${today}
</div>
</body>
</html>`;

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/* ── Availability Projects ── */
const AVAIL_STATUSES = [
  ['planning','Planning'],['approved','Approved'],['in_progress','In Progress'],['complete','Complete']
];
const ITEM_COLORS = { pm:'#0284c7', modernization:'#7c3aed', deficiency:'#dc2626', milestone:'#d97706' };

async function viewAvailProjects() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '📅 Availability Projects'})]);
  var newBtn = btn('primary', '+ New Project', () => showAvailProjectForm(null, () => viewAvailProjects()));
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var projects = await API.availProjects.list(p).catch(() => []);
  loading.remove();

  if (!projects.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No availability projects yet.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['Title', 'Status', 'Start', 'End', 'Assigned', ''],
    projects.map(proj => {
      var statusB = span('ops-badge '+(proj.status==='complete'?'badge-green':proj.status==='in_progress'?'badge-blue':proj.status==='approved'?'badge-teal':'badge-gray'),
        AVAIL_STATUSES.find(s=>s[0]===proj.status)?.[1]||proj.status);
      var viewBtn = btn('ops-btn-sm', '📅 Gantt', () => navigate('avail-detail', proj.id));
      var editBtn = btn('ops-btn-sm', '✏', () => showAvailProjectForm(proj, () => viewAvailProjects()));
      var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
      actWrap.appendChild(viewBtn); actWrap.appendChild(editBtn);
      var titleEl = el('strong', {text: proj.title, style:'cursor:pointer;color:#38bdf8;'});
      titleEl.onclick = () => navigate('avail-detail', proj.id);
      return [titleEl, statusB,
        proj.start_date ? proj.start_date.slice(0,10) : span('ops-muted','—'),
        proj.end_date   ? proj.end_date.slice(0,10)   : span('ops-muted','—'),
        proj.assigned_to || span('ops-muted','—'),
        actWrap];
    })
  ));
  wrap.appendChild(card);
}

async function viewAvailProjectDetail(id) {
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var proj = await API.availProjects.get(id).catch(() => null);
  if (!proj) return;

  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Projects', () => navigate('avail-projects')));
  hdr.appendChild(el('h2', {text: proj.title}));
  hdr.appendChild(span('ops-badge '+(proj.status==='complete'?'badge-green':proj.status==='in_progress'?'badge-blue':'badge-gray'),
    AVAIL_STATUSES.find(s=>s[0]===proj.status)?.[1]||proj.status));
  hdr.appendChild(btn('', '✏ Edit', () => showAvailProjectForm(proj, () => viewAvailProjectDetail(id))));
  hdr.appendChild(btn('primary', '+ Add Item', () => showAddItemForm(proj, () => viewAvailProjectDetail(id))));
  wrap.appendChild(hdr);

  // Project window info
  var infoBar = div('');
  infoBar.style.cssText = 'display:flex;gap:20px;padding:12px 0;border-bottom:1px solid #2e3650;margin-bottom:16px;font-size:13px;color:#94a3b8;';
  if (proj.start_date) infoBar.appendChild(el('span', {text: '📅 Start: ' + proj.start_date.slice(0,10)}));
  if (proj.end_date)   infoBar.appendChild(el('span', {text: '🏁 End: '   + proj.end_date.slice(0,10)}));
  if (proj.assigned_to) infoBar.appendChild(el('span', {text: '👤 ' + proj.assigned_to}));
  wrap.appendChild(infoBar);

  var items = proj.items || [];

  if (!items.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No items yet. Add PMs, modernizations, deficiencies or milestones.'}));
    setContent(wrap);
    return;
  }

  // Gantt chart
  var ganttCard = div('ops-card');
  ganttCard.appendChild(div('ops-card-header', [el('h3', {text:'Gantt Chart'})]));
  ganttCard.appendChild(renderGantt(proj, items));
  wrap.appendChild(ganttCard);

  // Items table
  var tableCard = div('ops-card'); tableCard.style.marginTop = '16px';
  tableCard.appendChild(div('ops-card-header', [el('h3', {text:'Project Items'})]));
  tableCard.appendChild(makeTable(
    ['Type', 'Title', 'Planned Start', 'Planned End', 'Status', 'Warnings', ''],
    items.map(item => {
      var typeChip = span('ops-badge', item.item_type);
      typeChip.style.backgroundColor = ITEM_COLORS[item.item_type] + '33';
      typeChip.style.color = ITEM_COLORS[item.item_type];
      typeChip.style.border = '1px solid ' + ITEM_COLORS[item.item_type];

      var outOfWindow = [];
      if (proj.start_date && item.planned_start && item.planned_start < proj.start_date)
        outOfWindow.push('⚠ Before window');
      if (proj.end_date && item.planned_end && item.planned_end > proj.end_date)
        outOfWindow.push('⚠ After window');

      var delBtn = btn('danger ops-btn-sm', '✕', async () => {
        if (!confirm('Remove this item from the project?')) return;
        await API.availProjects.deleteItem(id, item.id);
        viewAvailProjectDetail(id);
      });

      return [
        typeChip,
        el('strong', {text: item.title || '—'}),
        item.planned_start ? item.planned_start.slice(0,10) : span('ops-muted','—'),
        item.planned_end   ? item.planned_end.slice(0,10)   : span('ops-muted','—'),
        span('ops-badge '+(item.status==='complete'?'badge-green':item.status==='in_progress'?'badge-blue':'badge-gray'), item.status),
        outOfWindow.length ? span('ops-danger ops-small', outOfWindow.join(', ')) : span('ops-muted','—'),
        delBtn
      ];
    })
  ));
  wrap.appendChild(tableCard);
  setContent(wrap);
}

function renderGantt(proj, items) {
  var container = div('');
  container.style.cssText = 'overflow-x:auto;padding:8px 0;';

  if (!items.length) return container;

  // Calculate date range
  var allDates = [];
  if (proj.start_date) allDates.push(new Date(proj.start_date));
  if (proj.end_date)   allDates.push(new Date(proj.end_date));
  items.forEach(item => {
    if (item.planned_start) allDates.push(new Date(item.planned_start));
    if (item.planned_end)   allDates.push(new Date(item.planned_end));
  });
  if (!allDates.length) return container;

  var minDate = new Date(Math.min(...allDates));
  var maxDate = new Date(Math.max(...allDates));
  // Add padding
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  var totalDays = Math.ceil((maxDate - minDate) / 86400000);
  var rowH = 36;
  var labelW = 180;
  var dayW = Math.max(20, Math.min(40, Math.floor((window.innerWidth - labelW - 60) / totalDays)));
  var chartW = labelW + totalDays * dayW;
  var chartH = (items.length + 1) * rowH + 40;

  var canvas = document.createElement('canvas');
  canvas.width  = chartW;
  canvas.height = chartH;
  canvas.style.cssText = 'display:block;border-radius:8px;';

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e2540';
  ctx.fillRect(0, 0, chartW, chartH);

  // Header row — months
  var headerY = 20;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  var d = new Date(minDate);
  var lastMonth = -1;
  for (var day = 0; day < totalDays; day++) {
    var x = labelW + day * dayW;
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(d.toLocaleString('default',{month:'short'})+' '+d.getFullYear(), x + dayW*2, headerY);
      ctx.fillStyle = '#2e3650';
      ctx.fillRect(x, 0, 1, chartH);
    }
    d.setDate(d.getDate() + 1);
  }

  // Today line
  var todayOffset = Math.floor((new Date() - minDate) / 86400000);
  if (todayOffset >= 0 && todayOffset < totalDays) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    ctx.moveTo(labelW + todayOffset * dayW, 25);
    ctx.lineTo(labelW + todayOffset * dayW, chartH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Project window shading
  if (proj.start_date && proj.end_date) {
    var winStart = Math.floor((new Date(proj.start_date) - minDate) / 86400000);
    var winEnd   = Math.floor((new Date(proj.end_date)   - minDate) / 86400000);
    ctx.fillStyle = 'rgba(56,189,248,0.05)';
    ctx.fillRect(labelW + winStart * dayW, 25, (winEnd - winStart) * dayW, chartH - 25);
  }

  // Item rows
  items.forEach((item, idx) => {
    var y = 30 + idx * rowH;
    var color = ITEM_COLORS[item.item_type] || '#64748b';

    // Row background alternate
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
    ctx.fillRect(0, y, chartW, rowH);

    // Label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    var label = (item.title || item.item_type).slice(0, 22);
    ctx.fillText(label, 8, y + rowH/2 + 4);

    // Bar or milestone
    if (item.item_type === 'milestone') {
      if (item.planned_start) {
        var mx = labelW + Math.floor((new Date(item.planned_start) - minDate) / 86400000) * dayW;
        var my = y + rowH/2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(mx, my - 8);
        ctx.lineTo(mx + 8, my);
        ctx.lineTo(mx, my + 8);
        ctx.lineTo(mx - 8, my);
        ctx.closePath();
        ctx.fill();
      }
    } else if (item.planned_start && item.planned_end) {
      var barStart = Math.floor((new Date(item.planned_start) - minDate) / 86400000);
      var barEnd   = Math.floor((new Date(item.planned_end)   - minDate) / 86400000);
      var barX = labelW + barStart * dayW;
      var barW2 = Math.max(dayW, (barEnd - barStart) * dayW);
      var barY = y + 6;
      var barH2 = rowH - 12;

      // Bar background
      ctx.fillStyle = color + '33';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW2, barH2, 4);
      ctx.fill();

      // Bar border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW2, barH2, 4);
      ctx.stroke();

      // Progress fill if actual dates
      if (item.actual_start) {
        var actStart = Math.floor((new Date(item.actual_start) - minDate) / 86400000);
        var actEnd   = item.actual_end ? Math.floor((new Date(item.actual_end) - minDate) / 86400000) : todayOffset;
        var actX = labelW + actStart * dayW;
        var actW = Math.max(4, (actEnd - actStart) * dayW);
        ctx.fillStyle = color + '88';
        ctx.beginPath();
        ctx.roundRect(actX, barY+2, Math.min(actW, barW2-2), barH2-4, 3);
        ctx.fill();
      }

      // Out of window indicator
      if ((proj.start_date && item.planned_start < proj.start_date) ||
          (proj.end_date && item.planned_end > proj.end_date)) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('⚠', barX + barW2 + 4, barY + barH2/2 + 4);
      }
    }
  });

  // Draw dependency arrows
  items.forEach((item, idx) => {
    var deps = JSON.parse(item.depends_on || '[]');
    deps.forEach(depId => {
      var depIdx = items.findIndex(i => i.id === depId);
      if (depIdx < 0 || !item.planned_start) return;
      var depItem = items[depIdx];
      if (!depItem.planned_end) return;

      var fromX = labelW + Math.floor((new Date(depItem.planned_end) - minDate) / 86400000) * dayW;
      var fromY = 30 + depIdx * rowH + rowH/2;
      var toX   = labelW + Math.floor((new Date(item.planned_start) - minDate) / 86400000) * dayW;
      var toY   = 30 + idx * rowH + rowH/2;

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - 6, toY - 4);
      ctx.lineTo(toX - 6, toY + 4);
      ctx.closePath();
      ctx.fill();
    });
  });

  // Click handler — show item details popup
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var clickedIdx = Math.floor((my - 30) / rowH);
    console.log('[Gantt click] my:', my, 'rowH:', rowH, 'idx:', clickedIdx, 'items:', items.length);
    if (clickedIdx < 0 || clickedIdx >= items.length) return;
    showItemPopup(items[clickedIdx], e.clientX, e.clientY);
  });

  container.appendChild(canvas);

  // Legend
  var legend = div(''); legend.style.cssText = 'display:flex;gap:16px;padding:8px 0;flex-wrap:wrap;';
  Object.entries(ITEM_COLORS).forEach(([type, color]) => {
    var item2 = div(''); item2.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;';
    var dot = div(''); dot.style.cssText = 'width:12px;height:12px;border-radius:3px;background:'+color+';';
    item2.appendChild(dot);
    item2.appendChild(document.createTextNode(type.charAt(0).toUpperCase()+type.slice(1)));
    legend.appendChild(item2);
  });
  var todayLeg = div(''); todayLeg.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;';
  var todayDot = div(''); todayDot.style.cssText = 'width:12px;height:2px;background:#f59e0b;';
  todayLeg.appendChild(todayDot);
  todayLeg.appendChild(document.createTextNode('Today'));
  legend.appendChild(todayLeg);
  container.appendChild(legend);

  return container;
}

function showItemPopup(item, x, y) {
  // Remove existing popup
  document.querySelector('.gantt-popup')?.remove();

  var popup = div('gantt-popup');
  popup.style.cssText = 'position:fixed;left:'+Math.min(x+10, window.innerWidth-280)+'px;top:'+Math.min(y+10,window.innerHeight-200)+'px;width:260px;background:#1e2540;border:1px solid #3e4a65;border-radius:12px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,0.5);z-index:99999;';

  var color = ITEM_COLORS[item.item_type] || '#64748b';
  var typeChip = div('');
  typeChip.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:8px;background:'+color+'33;color:'+color+';border:1px solid '+color+';';
  typeChip.textContent = item.item_type;
  popup.appendChild(typeChip);

  popup.appendChild(el('div', {style:'font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:8px;', text: item.title || '—'}));

  var details = [
    ['Planned Start', item.planned_start ? item.planned_start.slice(0,10) : '—'],
    ['Planned End',   item.planned_end   ? item.planned_end.slice(0,10)   : '—'],
    ['Status',        item.status || '—'],
  ];
  if (item.notes) details.push(['Notes', item.notes]);

  details.forEach(([k,v]) => {
    var row = div(''); row.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid #2e3650;';
    row.appendChild(span('ops-muted', k));
    row.appendChild(el('span', {style:'color:#e2e8f0;', text:v}));
    popup.appendChild(row);
  });

  // Go to detail link if linked item
  if (item.item_id && item.item_type !== 'milestone') {
    var routes = {pm:'pm-procedures', modernization:'modernizations', deficiency:'def-detail'};
    var goBtn = btn('primary ops-btn-sm', '→ View Detail', () => {
      popup.remove();
      if (item.item_type === 'deficiency') navigate('def-detail', item.item_id);
      else navigate(routes[item.item_type]);
    });
    goBtn.style.marginTop = '12px';
    popup.appendChild(goBtn);
  }

  var closeBtn = btn('ops-btn-sm', '✕', () => popup.remove());
  closeBtn.style.cssText += 'position:absolute;top:8px;right:8px;padding:2px 8px;';
  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', handler); }
    });
  }, 100);
}

function showAvailProjectForm(existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Project title';
  if (existing) titleInp.value = existing.title || '';
  body.appendChild(fg('Title *', titleInp, true));

  var descInp = document.createElement('textarea'); descInp.className='ops-input'; descInp.rows=2;
  descInp.placeholder='Project scope and description';
  if (existing) descInp.value = existing.description || '';
  body.appendChild(fg('Description', descInp, true));

  var statusSel = sel(AVAIL_STATUSES, existing?.status || 'planning');
  body.appendChild(fg('Status', statusSel));

  var startInp = el('input',{}); startInp.className='ops-input'; startInp.type='date';
  if (existing?.start_date) startInp.value = existing.start_date.slice(0,10);
  body.appendChild(fg('Start Date *', startInp));

  var endInp = el('input',{}); endInp.className='ops-input'; endInp.type='date';
  if (existing?.end_date) endInp.value = existing.end_date.slice(0,10);
  body.appendChild(fg('End Date *', endInp));

  var assignInp = el('input',{}); assignInp.className='ops-input'; assignInp.placeholder='Assigned user';
  if (existing) assignInp.value = existing.assigned_to || '';
  body.appendChild(fg('Assigned To', assignInp));

  var approverInp = el('input',{}); approverInp.className='ops-input'; approverInp.placeholder='Approver';
  if (existing) approverInp.value = existing.approver || '';
  body.appendChild(fg('Approver', approverInp));

  modal(isEdit ? 'Edit Project' : 'New Availability Project', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    if (!startInp.value) throw new Error('Start date is required.');
    if (!endInp.value)   throw new Error('End date is required.');
    var data = {
      title:       titleInp.value.trim(),
      description: descInp.value.trim(),
      status:      statusSel.value,
      start_date:  startInp.value,
      end_date:    endInp.value,
      assigned_to: assignInp.value.trim(),
      approver:    approverInp.value.trim(),
    };
    if (defaults.source_type) data.source_type = defaults.source_type;
    if (defaults.source_id)   data.source_id   = defaults.source_id;
    if (defaults.platform_id) data.platform_id = defaults.platform_id;
    else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) await API.availProjects.update(existing.id, data);
    else await API.availProjects.create(data);
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Create Project');
}

async function showAddItemForm(proj, onDone) {
  var body = div('ops-form-grid');

  var typeSel = sel([
    ['pm','PM Procedure'],['modernization','Modernization'],
    ['deficiency','Deficiency'],['milestone','Milestone']
  ], 'pm');
  body.appendChild(fg('Item Type', typeSel));

  // Dynamic item search
  var itemWrap = div('');
  var itemSel = el('select',{cls:'ops-select'});
  itemSel.appendChild(el('option',{value:'',text:'— Select item —'}));
  itemWrap.appendChild(itemSel);
  body.appendChild(fg('Linked Item', itemWrap));

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Override title (optional)';
  body.appendChild(fg('Title Override', titleInp));

  var startInp = el('input',{}); startInp.className='ops-input'; startInp.type='date';
  body.appendChild(fg('Planned Start', startInp));

  var endInp = el('input',{}); endInp.className='ops-input'; endInp.type='date';
  body.appendChild(fg('Planned End', endInp));

  var notesInp = document.createElement('textarea'); notesInp.className='ops-input'; notesInp.rows=2;
  body.appendChild(fg('Notes', notesInp, true));

  // Load items when type changes
  async function loadItems() {
    itemSel.innerHTML = '<option value="">— Select item —</option>';
    var type = typeSel.value;
    if (type === 'milestone') { itemWrap.style.display='none'; return; }
    itemWrap.style.display='';
    var items = [];
    if (type === 'pm')            items = await API.procedures.list({});
    if (type === 'modernization') items = await API.modernizations.list({});
    if (type === 'deficiency')    items = await API.deficiencies.list({status:'open_all'});
    items.forEach(i => {
      var label = i.name || i.title || i.summary || '#'+i.id;
      itemSel.appendChild(el('option',{value:String(i.id), text:label}));
    });
  }
  typeSel.onchange = loadItems;
  await loadItems();

  modal('Add Item to Project', body, async () => {
    var type = typeSel.value;
    var itemId = itemSel.value ? parseInt(itemSel.value) : null;
    if (type !== 'milestone' && !itemId) throw new Error('Please select an item.');
    var data = {
      item_type:     type,
      item_id:       itemId,
      title:         titleInp.value.trim(),
      planned_start: startInp.value || '',
      planned_end:   endInp.value || '',
      notes:         notesInp.value.trim(),
    };
    var result = await API.availProjects.addItem(proj.id, data);
    if (result.warnings && result.warnings.length) {
      alert('Item added with warnings: ' + result.warnings.join(', '));
    }
    if (onDone) onDone();
  }, 'Add Item');
}

/* ── Platform Form ── */
function showPlatformForm(existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var nameInp = el('input', {}); nameInp.className = 'ops-input'; nameInp.placeholder = 'e.g. Pensacola';
  if (existing) nameInp.value = existing.name || '';
  body.appendChild(fg('Platform Name *', nameInp));

  var locInp = el('input', {}); locInp.className = 'ops-input'; locInp.placeholder = 'e.g. Pensacola, FL';
  if (existing) locInp.value = existing.location || '';
  body.appendChild(fg('Location', locInp));

  var descInp = document.createElement('textarea'); descInp.className = 'ops-input'; descInp.rows = 2;
  descInp.placeholder = 'Description';
  if (existing) descInp.value = existing.description || '';
  body.appendChild(fg('Description', descInp));

  var groupInp = el('input', {}); groupInp.className = 'ops-input'; groupInp.placeholder = 'e.g. platform_pensacola';
  if (existing) groupInp.value = existing.group_name || '';
  body.appendChild(fg('Nextcloud Group Name', groupInp, false,
    'Users in this Nextcloud group will have access to this platform. Leave blank for all users.'));

  modal(isEdit ? 'Edit Platform' : 'New Platform', body, async () => {
    if (!nameInp.value.trim()) throw new Error('Platform name is required.');
    var data = {
      name:        nameInp.value.trim(),
      location:    locInp.value.trim(),
      description: descInp.value.trim(),
      group_name:  groupInp.value.trim(),
    };
    if (isEdit) {
      await API.platforms.update(existing.id, data);
    } else {
      await API.platforms.create(data);
    }
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Create Platform');
}

/* ── User Manual ── */
async function viewUserManual() {
  var wrap = div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header', [el('h2', {text:'📖 User Manual'})]));

  var layout = div(''); layout.style.cssText = 'display:flex;gap:24px;align-items:flex-start;max-width:1100px;';
  wrap.appendChild(layout);

  var SECTIONS = [
    {id:'s-start',    label:'1. Getting Started'},
    {id:'s-assets',   label:'2. Asset Registry'},
    {id:'s-pm',       label:'3. Preventive Maintenance'},
    {id:'s-def',      label:'4. Deficiency Tracking'},
    {id:'s-loto',     label:'5. LOTO / Tagout'},
    {id:'s-mod',      label:'6. Modernizations'},
    {id:'s-avail',    label:'7. Availability & Gantt'},
    {id:'s-wp',       label:'8. Work Packages & RFQ'},
    {id:'s-supply',   label:'9. Supply & Warehouse'},
    {id:'s-lib',      label:'10. The Library'},
    {id:'s-s1000d',   label:'11. S1000D Technical Manuals'},
    {id:'s-canvas',   label:'12. System Canvas & FMEA'},
    {id:'s-fm',       label:'13. Failure Modes'},
    {id:'s-platforms',label:'14. Platforms & Shops'},
    {id:'s-import',   label:'15. Data Import'},
  ];

  var toc = div('ops-card'); toc.style.cssText = 'min-width:200px;max-width:200px;padding:16px 0;position:sticky;top:72px;';
  toc.appendChild(el('p',{text:'Contents',style:'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;padding:0 16px 10px;margin:0;border-bottom:1px solid #2e3650;'}));
  var tocList = el('ul',{style:'list-style:none;padding:0;margin:8px 0 0;'});
  SECTIONS.forEach(function(s){
    var a = el('a',{text:s.label,style:'display:block;padding:5px 16px;color:#94a3b8;font-size:11px;text-decoration:none;border-left:2px solid transparent;transition:all .15s;cursor:pointer;'});
    a.addEventListener('mouseover',function(){a.style.color='#e2e8f0';a.style.borderLeftColor='#38bdf8';});
    a.addEventListener('mouseout', function(){a.style.color='#94a3b8';a.style.borderLeftColor='transparent';});
    a.addEventListener('click', function(e){
      e.preventDefault();
      var target = document.getElementById(s.id);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
    var li = el('li',{style:'margin:0;'}); li.appendChild(a); tocList.appendChild(li);
  });
  toc.appendChild(tocList); layout.appendChild(toc);

  var mc = div(''); mc.style.cssText = 'flex:1;min-width:0;'; layout.appendChild(mc);

  function mcard(id, icon, title) {
    var c = div('ops-card'); c.id = id; c.style.cssText = 'padding:28px 32px;margin-bottom:20px;';
    c.appendChild(el('h3',{text:icon+' '+title,style:'border-bottom:1px solid #2e3650;padding-bottom:8px;margin:0 0 16px;font-size:16px;color:#e2e8f0;font-weight:800;'}));
    return c;
  }
  function sh(text){ return el('p',{text:text,style:'font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin:16px 0 6px;'}); }
  function pp(html){ var p=el('p',{style:'color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 10px;'}); p.innerHTML=html; return p; }
  function tip(html){ var d=el('div',{style:'background:#1e3a5f;border-left:3px solid #38bdf8;padding:10px 14px;border-radius:0 6px 6px 0;margin:8px 0 14px;color:#cbd5e1;font-size:13px;line-height:1.7;'}); d.innerHTML='💡 '+html; return d; }
  function kw(t){ return '<b style="color:#7dd3fc">'+t+'</b>'; }
  function cd(t){ return '<span style="font-family:monospace;background:#1e2540;padding:2px 6px;border-radius:4px;color:#a5f3fc">'+t+'</span>'; }
  function ul(items){
    var l=el('ul',{style:'list-style:disc;padding-left:20px;margin:6px 0 12px;'});
    items.forEach(function(h){var li=el('li',{style:'color:#cbd5e1;font-size:13px;line-height:1.8;margin:2px 0;'}); li.innerHTML=h; l.appendChild(li);});
    return l;
  }
  function brow(badges){
    var d=div(''); d.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px;';
    badges.forEach(function(b){d.appendChild(span('ops-badge '+b[0],b[1]));});
    return d;
  }

  // ── 1. Getting Started ───────────────────────────────────────────────────
  (function(){
    var c=mcard('s-start','🚀','Getting Started');
    c.appendChild(pp('Maintain Ops Suite is an integrated operations management platform. All data is scoped to '+kw('Platforms')+'—logical groupings such as sites, locations, or organizational units. Confirm at least one Platform is set up before creating any records.'));
    c.appendChild(sh('Initial Setup Checklist'));
    c.appendChild(ul([
      'An admin must create at least one '+kw('Platform')+' under Admin → Platforms and link it to a Nextcloud group.',
      'Users are assigned to platforms by being members of the linked Nextcloud group.',
      kw('Shop codes')+' are configured per platform — they prefix all asset identifiers (e.g., '+cd('SHB-0042')+').',
      'Seed your '+kw('Library')+" with SOPs before creating PM procedures.",
      'Customize the '+kw('Failure Mode')+" taxonomy under Admin → Failure Modes before logging deficiencies.",
      'Use '+kw('Data Import')+' (Admin section) to bulk-load existing asset rosters from CSV or JSON.',
    ]));
    c.appendChild(sh('Navigation Overview'));
    c.appendChild(ul([
      kw('Library → Asset Registry')+' — equipment digital twin database.',
      kw('Maintenance')+' — PM Dashboard, All Procedures.',
      kw('Deficiencies')+' — fault and discrepancy tracking log.',
      kw('Safety → LOTO')+' — lockout/tagout session management.',
      kw('Modernization')+' — upgrade projects, Gantt, Work Packages.',
      kw('Supply')+' — requisitions, inventory, cycle counting.',
      kw('Library → The Library')+' — document registry and SOPs.',
      kw('System Canvas')+' — draw live system architecture diagrams.',
      kw('Admin')+' — Platforms, Shops, Failure Modes, Data Import, Settings.',
    ]));
    c.appendChild(tip('The platform selector in the header filters ALL views. If you see no data, verify your selected platform is correct and that your Nextcloud account belongs to the linked group.'));
    mc.appendChild(c);
  })();

  // ── 2. Asset Registry ────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-assets','🖥','Asset Registry');
    c.appendChild(pp('The Asset Registry is your equipment and software digital twin. Every piece of hardware, software, or firmware tracks make, model, serial number, version, location, IP address, warranty expiry, and installation date.'));
    c.appendChild(sh('Creating an Asset'));
    c.appendChild(ul([
      'Click '+kw('+ New Asset')+', select type (Hardware / Software / Firmware), fill in name, manufacturer, model, serial number.',
      'Assign a '+kw('Shop')+' — this determines the auto-generated asset ID prefix.',
      'Set a '+kw('Parent Asset')+' to create a hierarchy (e.g., NIC card nested under a server chassis).',
      'Save — the system assigns a sequential identifier within the shop.',
    ]));
    c.appendChild(sh('Criticality Codes'));
    c.appendChild(brow([['badge-red','CR — Critical'],['badge-yellow','DE — Degraded'],['badge-blue','RD — Redundant'],['badge-green','SP — Spare'],['badge-gray','AD — Administrative']]));
    c.appendChild(ul([
      kw('CR')+' — failure directly impacts mission. Highest resolution priority.',
      kw('DE')+' — functional but below full capacity. Active deficiency or bypass logged.',
      kw('RD')+' — backup system. Reduces impact of primary failure.',
      kw('SP')+' — held in reserve, not deployed.',
      kw('AD')+' — administrative support equipment with no direct mission criticality.',
    ]));
    c.appendChild(sh('Bypass & Degraded Mode'));
    c.appendChild(ul([
      'Set '+kw('Bypass Available')+'=Yes to indicate the component can be isolated without full loss.',
      'Document the '+kw('Bypass Method')+' (procedure steps to achieve bypass).',
      kw('Degraded Capability %')+' captures the operational capacity when running in bypass mode.',
      'Set '+kw('Failover Asset')+' for RD components — identifies which redundant asset takes over.',
      'Failover time and procedure fields document the switchover process.',
    ]));
    c.appendChild(sh('UII / IUID Compliance'));
    c.appendChild(ul([
      'Enter the ISO/IEC 15459 '+kw('Unique Item Identifier (UII)')+' for DoD-tracked items.',
      'Set '+kw('IUID Compliant')+'=Yes once the item is marked with a compliant 2D data matrix label.',
      'CAGE Code identifies the manufacturer in the UII namespace.',
    ]));
    c.appendChild(sh('Photos & 3D Models'));
    c.appendChild(ul([
      'Attach condition, installation, deficiency, or scan photos from the asset detail page.',
      '3D model files (.glb, .gltf, .obj, .step) can be linked and viewed in-browser using the interactive Three.js viewer.',
      'Hotspots on 3D models can be linked to deficiencies, PMs, or interfaces.',
    ]));
    c.appendChild(sh('Verification Cycles'));
    c.appendChild(ul([
      'Assets require '+kw('18-month verification')+' — the system tracks last-verified date automatically.',
      'Click '+kw('Verify Asset')+' on the detail page to record today as the new verification date.',
      'Unverified assets approaching the 18-month threshold are flagged in the registry list.',
    ]));
    c.appendChild(tip('Keep serial numbers accurate — they are the primary cross-reference between the Registry, PM procedures, Deficiency records, LOTO sessions, and supply requisitions.'));
    mc.appendChild(c);
  })();

  // ── 3. PM ────────────────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-pm','⚙','Preventive Maintenance');
    c.appendChild(pp('PM Procedures are scheduled maintenance tasks tied to specific assets. The system calculates next-due dates automatically and flags overdue items across the PM Dashboard.'));
    c.appendChild(sh('Creating a PM Procedure'));
    c.appendChild(ul([
      'Navigate to '+kw('All Procedures')+' → '+kw('+ New PM')+'.',
      'Link the procedure to an asset, set '+kw('Periodicity')+': Weekly / Monthly / Quarterly / Semi-Annual / Annual.',
      'Optionally attach an SOP from the Library.',
      'Assign a responsible technician and enter the last-completed date — next-due is auto-calculated.',
    ]));
    c.appendChild(sh('Closeout Workflow'));
    c.appendChild(ul([
      'Click '+kw('Complete')+' → fill in actual completion date, labor hours, parts cost, labor cost.',
      'Add completion notes; optionally create a linked Deficiency if anomalies were found.',
      'Last-completed date updates and next-due date is recalculated on save.',
      'Initiate LOTO directly from the PM detail if isolation is required before work begins.',
    ]));
    c.appendChild(tip('Link PMs to an SOP from the Library. When the SOP is revised, all PMs referencing it automatically display the new revision without manual updates.'));
    mc.appendChild(c);
  })();

  // ── 4. Deficiencies ──────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-def','⚠️','Deficiency Tracking');
    c.appendChild(pp('Deficiencies are the formal fault and discrepancy log. Every equipment problem, failed inspection item, or operational anomaly should be captured here.'));
    c.appendChild(sh('Severity Levels'));
    c.appendChild(brow([['badge-red','SEV-1 — Mission Critical'],['badge-red','SEV-2 — Significant'],['badge-yellow','SEV-3 — Moderate'],['badge-blue','SEV-4 — Minor'],['badge-gray','SEV-5 — Cosmetic']]));
    c.appendChild(sh('Key Workflows'));
    c.appendChild(ul([
      kw('Log a deficiency')+' — capture severity, discovery method, asset, location, description, initial cost estimate, and man-days.',
      kw('Troubleshooting Log')+' — append-only sequential log of diagnostic steps; each entry records technician, date, action, and result.',
      kw('Closeout')+' — document root cause, corrective action, failure mode (S5000F), actual costs. Sets status to Closed.',
      kw('Escalate to Mod')+' — if a capital upgrade is needed, escalates to a Modernization project. Deficiency stays open until mod completes.',
      kw('Initiate LOTO')+' — pre-populates a LOTO session linked to this deficiency and the associated asset.',
    ]));
    c.appendChild(sh('Discovery Methods'));
    c.appendChild(ul(['PM Inspection','Walkdown','Self-Reported','External Audit','Automated Alert']));
    c.appendChild(tip('Fill in cost estimate, man-days, and outside entity fields at initial logging. Work Package and RFQ generation pulls these estimates directly — accurate upfront estimates save manual data entry later.'));
    mc.appendChild(c);
  })();

  // ── 5. LOTO ─────────────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-loto','🔒','LOTO / Tagout');
    c.appendChild(pp('The LOTO module manages Lockout/Tagout sessions to control hazardous energy during maintenance. Every isolation activity requiring hardware locks or tags should be logged here before work begins.'));
    c.appendChild(sh('Tag Number Format'));
    c.appendChild(pp('Every LOTO session is auto-assigned a sequential tag number: '+cd('LOTO-2026-0001')+'. The year segment reflects the calendar year; the sequence resets to 0001 each year.'));
    c.appendChild(sh('Session Lifecycle'));
    c.appendChild(ul([
      kw('Initiate')+' — create the session, select session type (Lockout / Tagout / Combination / Group), link source (PM or Deficiency).',
      kw('Assign Devices')+' — select isolation devices from the Device Inventory (or add ad-hoc); each device is marked In Use.',
      kw('Verify')+' — record the energy verification method and result; system timestamps the verification.',
      kw('Print Audit Sheet')+' — generates a printable session record for physical posting at the work site.',
      kw('Release')+' — all devices returned to Available; session status set to Released.',
    ]));
    c.appendChild(sh('Device Inventory'));
    c.appendChild(ul([
      'Manage your physical lock and tag devices under '+kw('LOTO → Device Inventory')+'.',
      'Each device has a serial number, color, key number, type, and status (Available / In Use / Out of Service).',
      'Devices are automatically marked In Use when assigned to a session and returned to Available on release.',
    ]));
    c.appendChild(tip('Link LOTO sessions to the originating Deficiency or PM at creation. This provides a complete traceability chain from hazard identification through isolation and work completion.'));
    mc.appendChild(c);
  })();

  // ── 6. Modernizations ───────────────────────────────────────────────────
  (function(){
    var c=mcard('s-mod','🔧','Modernizations');
    c.appendChild(pp('Modernizations manage the full lifecycle of asset upgrade and modification projects — from initial design concept through to completion and TDP finalization.'));
    c.appendChild(sh('5-Stage Lifecycle'));
    c.appendChild(brow([['badge-blue','Design'],['badge-yellow','Planning'],['badge-yellow','Approval'],['badge-red','Execution'],['badge-green','Complete']]));
    c.appendChild(ul([
      kw('Design')+' — concept development, technical feasibility, initial cost estimate.',
      kw('Planning')+' — detailed work scope, resource allocation, schedule.',
      kw('Approval')+' — formal authorization gate. System records approval timestamp automatically.',
      kw('Execution')+' — active work; linked supply and LOTO sessions typically active here.',
      kw('Complete')+' — work done, TDP finalized, asset record updated.',
    ]));
    c.appendChild(sh('Technical Data Package (TDP)'));
    c.appendChild(ul([
      'Each modernization has a TDP tab organizing documents by category: Drawings, Tech Manuals, Test Plans, Training, PM SOPs, Other.',
      'Documents are stored in the Library; TDP holds references. Revisions auto-update.',
      'Print the complete TDP package from the modernization detail page.',
    ]));
    c.appendChild(sh('Linked Records'));
    c.appendChild(ul([
      kw('Deficiencies')+' — link open deficiencies to scope the mod and include their costs in roll-up.',
      kw('Supply Requests')+' — associate requisitions for a single view of all parts ordered for the project.',
      'When the mod reaches Complete, linked open deficiencies are prompted for closeout.',
    ]));
    c.appendChild(tip('Set the Approval stage only after formal authorization is documented. The system records the approval timestamp automatically — this is your audit-ready authorization event.'));
    mc.appendChild(c);
  })();

  // ── 7. Availability & Gantt ──────────────────────────────────────────────
  (function(){
    var c=mcard('s-avail','📅','Availability Projects & Gantt');
    c.appendChild(pp('Availability Projects define a maintenance window — a bounded time period during which the platform or system is available for scheduled maintenance work. Work items are scheduled within that window on a visual Gantt chart.'));
    c.appendChild(sh('Setup & Work Items'));
    c.appendChild(ul([
      'Create a project with a '+kw('Start Date')+' and '+kw('End Date')+' defining the maintenance window.',
      'Add work items: link PMs, Modernizations, Deficiencies, or create standalone Milestones.',
      'Set planned start and end dates per item. System warns if dates fall outside the window.',
    ]));
    c.appendChild(sh('Gantt Chart Features'));
    c.appendChild(ul([
      'Color-coded bars: blue = PM, purple = Modernization, yellow = Deficiency, diamond = Milestone.',
      'Click any bar to open a detail popup with status and navigation links.',
      'Draw finish-to-start dependency arrows between work items.',
      'Out-of-window items are flagged with a visual indicator.',
    ]));
    c.appendChild(tip('Use Milestones to mark key events — inspections, external reviews, or delivery gates — even when they have no associated work record.'));
    mc.appendChild(c);
  })();

  // ── 8. Work Packages ────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-wp','📦','Work Packages & RFQ');
    c.appendChild(pp('Work Packages bundle PMs and Modernizations into a named scope of work for external contracting or internal planning. Each Work Package generates a professional Request for Quote (RFQ) document.'));
    c.appendChild(ul([
      'Create a package, add line items (PMs or Mods). System enforces '+kw('one-to-one assignment')+' — an item cannot appear in two active packages.',
      'Cost estimates from each line item roll up to the package total automatically.',
      'Auto-generated RFQ numbers: '+cd('RFQ-2026-0001')+'. Sequential per platform per calendar year.',
      'Click '+kw('Export RFQ')+' for a print-ready PDF with line items, cost estimates, terms, and signature blocks.',
    ]));
    c.appendChild(tip('Finalize cost estimates on linked records before creating the Work Package — the RFQ pulls estimates directly from each linked PM and Modernization.'));
    mc.appendChild(c);
  })();

  // ── 9. Supply & Warehouse ────────────────────────────────────────────────
  (function(){
    var c=mcard('s-supply','🛒','Supply & Warehouse');
    c.appendChild(pp('The Supply module handles parts requisitioning from initial request through receipt and stock management.'));
    c.appendChild(sh('Requisitions'));
    c.appendChild(ul([
      'Create a requisition with Part Name, NSN, CAGE Code, Manufacturer Part Number, UOM, and Quantity.',
      'Link to a Modernization, Deficiency, or PM for cost roll-up traceability.',
      'Auto-generated SRFQ numbers: '+cd('SRFQ-2026-0001')+'.',
      'Export a Supply RFQ PDF for vendor quoting.',
      kw('Quarterly revalidation')+' — requisitions with no activity in 90 days are flagged under Validations Due.',
    ]));
    c.appendChild(sh('Inventory & Transactions'));
    c.appendChild(ul([
      'Track on-hand stock per part number with minimum quantity thresholds.',
      'Stock transactions: '+kw('Receive')+' / '+kw('Issue')+' / '+kw('Return')+' / '+kw('Adjust')+' — all timestamped and logged.',
    ]));
    c.appendChild(sh('Cycle Counting (A/B/C)'));
    c.appendChild(brow([['badge-red','A — Monthly'],['badge-yellow','B — Quarterly'],['badge-green','C — Annual']]));
    c.appendChild(ul([
      kw('A items')+' — high-value or high-usage parts counted monthly.',
      kw('B items')+' — moderate value/usage, counted quarterly.',
      kw('C items')+' — low-cost, low-movement items counted annually.',
    ]));
    mc.appendChild(c);
  })();

  // ── 10. Library ──────────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-lib','📚','The Library');
    c.appendChild(pp('The Library is the central document registry — SOPs, drawings, tech manuals, test plans, training materials, specifications, S1000D Data Modules, and Publications. Documents are referenced by PMs, Modernization TDPs, assets, deficiencies, and FMEA worksheets.'));
    c.appendChild(sh('Document Types'));
    c.appendChild(brow([['badge-blue','📎 External'],['badge-purple','📘 Data Module'],['badge-green','📖 Publication']]));
    c.appendChild(ul([
      kw('External')+' — SOPs, drawings, specs, test plans, training materials. Stored in Nextcloud Files; Library holds the registry record and revision metadata.',
      kw('Data Module')+' — S1000D authored content. See section 11 for full detail.',
      kw('Publication')+' — assembled technical manuals made up of Data Modules. Click the purple pill shortcuts at the top of the Library to jump directly to any publication.',
    ]));
    c.appendChild(sh('External Document Features'));
    c.appendChild(ul([
      kw('Revision tracking')+' — increment revision on new versions; status: Draft / Active / Superseded / Archived. PMs always display the current Active revision.',
      'SOPs can be attached to PM Procedures and included in Modernization TDPs.',
      'Asset TDP pages pull documents from the Library by document ID — revisions auto-update without relinking.',
    ]));
    c.appendChild(tip('Publications appear as purple clickable pills at the top of the Library — no filter required. Click any pill to go directly to that manual.'));
    mc.appendChild(c);
  })();

  // ── 11. S1000D Technical Manuals ────────────────────────────────────────
  (function(){
    var c=mcard('s-s1000d','📘','S1000D Technical Manuals');
    c.appendChild(pp('MOS includes a full S1000D Issue 6 authoring and publication system. Technical writers create Data Modules (atomic units of content), which are assembled into Publications and delivered as Interactive Electronic Technical Manuals (IETMs).'));
    c.appendChild(sh('Info Codes — What Type of DM to Create'));
    c.appendChild(ul([
      kw('040 — Description & Operation')+' — describes the system, component, theory of operation, or technical characteristics. Links automatically to the asset detail page.',
      kw('200 — Maintenance Procedure')+' — scheduled or unscheduled maintenance procedures. Link this DM to a PM Procedure via the '+cd('📖 S1000D Procedure DM')+' field on the PM form.',
      kw('300 — Illustrated Parts Data')+' — parts list with NSN, CAGE code, part numbers, quantities, and units. Appears in the Asset S1000D card under Parts.',
      kw('520 — Troubleshooting')+' — fault isolation procedure (sequential diagnostic steps). Link this DM to a Deficiency via the Linked Configuration section.',
      kw('720 — Removal Procedure')+' — step-by-step component removal. Links to PM Procedures.',
      kw('730 — Installation Procedure')+' — step-by-step component installation. Links to PM Procedures.',
      kw('900 — Fault Description')+' — known fault reference data: fault codes, symptoms, probable causes, effects. Link this DM to an FMEA Worksheet. Use the '+kw('🔄 Push Faults to FMEA')+' button to auto-create FMEA entries from the DM\'s fault titles.',
    ]));
    c.appendChild(sh('Creating a Data Module'));
    c.appendChild(ul([
      'Library → '+kw('+ Add to Library')+' → '+kw('📘 Data Module')+'.',
      'Select the linked asset and info code. A Data Module Code (DMC) is auto-generated from your asset code.',
      'The editor opens with a pre-populated S1000D template for the selected info code. Replace the placeholder text with your content.',
      'Step types: '+kw('Title')+' / '+kw('Warning')+' / '+kw('Caution')+' / '+kw('Note')+' / '+kw('Action')+' / '+kw('Expected Result')+' / '+kw('Tech Char')+' (for spec tables) / '+kw('Part Item')+' (for 300 DMs).',
      'When content is finalized, advance the issue number and set in-work to 0 to release the DM.',
    ]));
    c.appendChild(sh('Building a Publication'));
    c.appendChild(ul([
      'Library → '+kw('+ Add to Library')+' → '+kw('📖 Publication')+'. Enter a title, pub code (e.g., '+cd('PLT1-MM-001')+'), and pub type (MM / FM / IPD / OM / SM).',
      'In the '+kw('Builder')+' tab, click '+kw('+ Chapter')+', then '+kw('+ Add DM')+' to arm a chapter (it highlights purple), then click a DM from the panel to add it.',
      'Reorder DMs within a chapter using ↑ ↓. Click '+kw('🚀 Release')+' to publish the issue.',
      'When a linked DM advances its issue number, the publication is flagged with '+kw('Re-Issue Required')+'.',
    ]));
    c.appendChild(sh('IETM Viewer'));
    c.appendChild(ul([
      'Click the '+kw('📖 IETM View')+' tab on any publication. The manual renders with a left-side chapter/DM navigation panel and formatted content on the right.',
      'Click '+kw('🖨 Print / Save PDF')+' to open your browser\'s print dialog. Select "Save as PDF" to generate a file.',
      'DMs linked to PM Procedures show an '+kw('📖 Open in Technical Manual')+' link on the PM detail — this opens the IETM directly at that DM.',
    ]));
    c.appendChild(tip('Each asset has a '+kw('📘 S1000D Data Modules')+' card on its detail page showing all linked DMs grouped by type, with direct links and "+ New DM" shortcuts for each info code group.'));
    mc.appendChild(c);
  })();

  // ── 12. System Canvas & FMEA ────────────────────────────────────────────
  (function(){
    var c=mcard('s-canvas','🗺','System Canvas & FMEA');
    c.appendChild(pp('The System Canvas is an interactive diagramming tool for drawing system architecture using real assets from the Registry as nodes. Each node on the canvas can have an FMEA Worksheet — the analytical link between engineering failure analysis and field maintenance.'));
    c.appendChild(sh('Drawing a Canvas'));
    c.appendChild(ul([
      'Place '+kw('Asset Nodes')+' from the Registry onto the canvas. Nodes show name, type icon, and current criticality badge.',
      'Node color reflects live status: green = nominal, yellow = degraded, red = open deficiency, gray = bypassed.',
      'Draw '+kw('Interface Lines')+' labeled by connection type (electrical, data, mechanical, fluid, RF, etc.).',
      'Lines can be styled solid or dashed to distinguish interface types visually.',
      'Drag to arrange; positions are saved automatically.',
    ]));
    c.appendChild(sh('FMEA Worksheets'));
    c.appendChild(ul([
      'Right-click any canvas node → '+kw('Open FMEA Worksheet')+' to create or open the worksheet for that node.',
      'Each worksheet row is one failure mode — fill in: '+kw('Function')+', '+kw('Failure Mode')+', '+kw('Local Effect')+', '+kw('System Effect')+', '+kw('Detection Method')+', Severity (S), Occurrence (O), Detectability (D).',
      'RPN = S × O × D. RPN > 200 = Critical (red), RPN > 100 = High (yellow).',
      kw('Link a 900 DM')+' to the worksheet via the '+kw('⚡ Fault Description DM')+' chip in the worksheet header. The 900 DM documents the same failure modes in a technician-facing format.',
      'Once the 900 DM is linked and authored (Title steps = fault names), click '+kw('🔄 Push Faults to FMEA')+' on the DM detail page to auto-create skeleton FMEA entries — one row per fault title. Fill in S/O/D values afterward.',
    ]));
    c.appendChild(sh('The Analytical Chain'));
    c.appendChild(pp('FMEA (engineering analysis) → '+kw('900 DM')+' (known fault reference for technicians) → '+kw('520 DM')+' (how to isolate it, step-by-step) → '+kw('Deficiency')+' (live fault record in the field) → '+kw('200/720/730 DM')+' (how to fix it).'));
    c.appendChild(tip('Build the FMEA on the Canvas first, then author the 900 DM from those findings, push them back to populate the worksheet entries, and finally write the 520 DM for the field technician who needs to isolate the fault.'));
    mc.appendChild(c);
  })();

  // ── 13. Failure Modes (was 12) ───────────────────────────────────────────
  (function(){
    var c=mcard('s-fm','🔬','Failure Modes');
    c.appendChild(pp('The Failure Mode Taxonomy provides the structured classification used when closing deficiencies. It is based on S5000F / ASD reliability taxonomy conventions and is customizable per installation via Admin → Failure Modes.'));
    c.appendChild(sh('Standard Categories'));
    c.appendChild(ul(['Electrical','Mechanical','Software','Firmware','Environmental','Operator Error','Wear / Age','Corrosion','Contamination','General']));
    c.appendChild(sh('Custom Failure Modes'));
    c.appendChild(ul([
      'Navigate to '+kw('Admin → Failure Modes')+' (admin access required).',
      'Click '+kw('+ New Failure Mode')+' — provide a code, name, category, subcategory, and description.',
      'Custom modes appear alongside standard taxonomy in the deficiency closeout form.',
      'Modes with active deficiency references cannot be deleted — history is preserved.',
    ]));
    c.appendChild(sh('Fleet Analytics'));
    c.appendChild(ul([
      'Each mode shows a fleet count badge — total deficiencies closed against it.',
      'Modes with 5+ occurrences are flagged in red, indicating a systemic pattern worth investigating.',
      'Use counts to prioritize modernization projects and PM schedule adjustments.',
    ]));
    c.appendChild(tip('Establish your failure mode taxonomy before your team begins logging deficiencies. Consistent classification from day one produces meaningful trend data within weeks.'));
    mc.appendChild(c);
  })();

  // ── 13. Platforms & Shops ────────────────────────────────────────────────
  (function(){
    var c=mcard('s-platforms','🏢','Platforms & Shops');
    c.appendChild(pp('Platforms and Shops define the organizational structure. All data is scoped to a Platform. Shops drive asset identifier prefixes.'));
    c.appendChild(sh('Multi-Site Access'));
    c.appendChild(ul([
      'A single installation hosts multiple platforms. Users with multiple group memberships can switch platforms via the header selector.',
      'Cross-platform data sharing is not supported — each platform is a fully isolated data scope.',
    ]));
    c.appendChild(sh('Group-Based Access Control'));
    c.appendChild(ul([
      'Each Platform is linked to a '+kw('Nextcloud Group')+'. Add/remove users from the group to grant/revoke access.',
      'Admin users (Nextcloud admins) can see all platforms regardless of group membership.',
      'There are no additional role configurations inside the app.',
    ]));
    c.appendChild(sh('Shop Codes & Asset IDs'));
    c.appendChild(ul([
      'Shops have a short code (e.g., '+cd('SHB')+', '+cd('MNT')+') that prefixes all asset IDs: '+cd('SHB-0042')+'.',
      'Shop codes cannot be changed after assets have been created under them — choose carefully at setup.',
    ]));
    c.appendChild(sh('Mobile App'));
    c.appendChild(ul([
      'Pairs with the Maintain Ops Suite Android app for field access.',
      'Field technicians can complete PMs, log deficiencies, close deficiencies, and check supply status from mobile.',
      '7-day free trial included; subscription required for write access after trial.',
    ]));
    mc.appendChild(c);
  })();

  // ── 14. Data Import ──────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-import','📥','Data Import');
    c.appendChild(pp('The Data Import tool allows bulk-loading asset records from CSV or JSON files into the Registry. It includes an AI-assisted column mapping step and a validation preview before any records are written.'));
    c.appendChild(sh('Supported Formats'));
    c.appendChild(ul([
      kw('CSV')+' — comma-separated values. First row must be column headers.',
      kw('JSON')+' — array of objects format. Each object represents one asset row.',
    ]));
    c.appendChild(sh('Import Workflow'));
    c.appendChild(ul([
      '1. Navigate to '+kw('Admin → Data Import')+' and click '+kw('+ New Import')+'.',
      '2. Browse and select your file from Nextcloud Files. The system detects headers and auto-maps columns using known aliases.',
      '3. On the '+kw('Column Mapping')+' screen, confirm or correct each source column → target field assignment.',
      '4. Click '+kw('Validate')+' — the system checks each row for required fields and valid values. Errors are listed by row.',
      '5. Click '+kw('Import')+' — valid rows are inserted; rows with errors are skipped. A completion summary shows imported vs. skipped counts.',
    ]));
    c.appendChild(sh('Column Mapping Reference'));
    c.appendChild(ul([
      'Required: '+kw('Asset Name')+'.',
      'Optional: Asset Type, Manufacturer, Model, Serial Number, Version, Location, IP Address, Install Date, Warranty Expiry, Status, Notes, Tags, Criticality Code, UII, CAGE Code, IUID Compliant.',
      'Use '+cd('— Skip this column —')+' for columns that have no matching target field.',
      'The system auto-maps common header names (e.g., "S/N" → Serial Number, "Make" → Manufacturer).',
    ]));
    c.appendChild(sh('Supported Values'));
    c.appendChild(ul([
      kw('Asset Type')+': '+cd('hardware')+' / '+cd('software')+' / '+cd('firmware')+'.',
      kw('Status')+': '+cd('operational')+' / '+cd('degraded')+' / '+cd('offline')+' / '+cd('maintenance')+' / '+cd('decommissioned')+'.',
      kw('Criticality Code')+': '+cd('CR')+' / '+cd('DE')+' / '+cd('RD')+' / '+cd('SP')+' / '+cd('AD')+'.',
      'Date fields: '+cd('YYYY-MM-DD')+' format preferred. Other common formats are accepted.',
    ]));
    c.appendChild(tip('Run a small test import (10–20 rows) first to validate your column mapping before importing large rosters. Use the job history to review past import results.'));
    mc.appendChild(c);
  })();
}

/* ── Data Import (Sprint 2A) ── */

var IMPORT_STATUS_COLORS = {pending:'badge-gray',mapping:'badge-blue',validating:'badge-yellow',ready:'badge-green',importing:'badge-yellow',done:'badge-green',failed:'badge-red'};
var IMPORT_TYPE_LABELS   = {
  'assets':                'Assets',
  'assets/mb0001':         'Assets (MB0001)',
  'deficiencies':          'Deficiencies',
  'deficiencies/mb0001':   'Deficiencies (MB0001)',
};

/* ── Budget (Sprint 3A) ── */
async function viewBudget() {
  setContent(el('div',{cls:'ops-empty',text:'Loading budget…'}));
  var [platforms, shops, entries, summaryData] = await Promise.all([
    API.platforms.list().catch(()=>[]),
    getShops().catch(()=>[]),
    API.budget.list().catch(()=>[]),
    API.budget.summary({}).catch(()=>({deficiencies:[],supply_requests:[],modernizations:[],work_packages:[]})),
  ]);

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'💰 MMBP Budget'}));
  var hdrBtns = div('ops-btn-group');
  var newBtn = btn('primary','+ New Entry', () => showBudgetForm(null, platforms, shops, () => viewBudget()));
  var ufrBtn = btn('','📋 UFR Export', async()=>{
    var fy = parseInt(selFy ? selFy.value : new Date().getFullYear());
    var data = await API.budget.ufrExport({fiscal_year: fy}).catch(()=>null);
    if (!data) { alert('Failed to load UFR data.'); return; }
    showUfrExport(data);
  });
  hdrBtns.appendChild(newBtn); hdrBtns.appendChild(ufrBtn);
  hdr.appendChild(hdrBtns);
  wrap.appendChild(hdr);

  // FY filter — union of manual entries + summary fiscal years
  var summaryFys = [];
  [...(summaryData.deficiencies||[]),...(summaryData.supply_requests||[]),...(summaryData.modernizations||[]),...(summaryData.work_packages||[])].forEach(function(r){ if(r.budget_fiscal_year) summaryFys.push(r.budget_fiscal_year); });
  var fys = [...new Set([...entries.map(e=>e.fiscal_year),...summaryFys])].sort((a,b)=>b-a);
  if (!fys.length) fys = [new Date().getFullYear()];
  var selFy = sel(fys.map(y=>[String(y), 'FY '+y]), String(fys[0]));
  selFy.style.cssText = 'margin-bottom:16px;max-width:160px;';
  selFy.addEventListener('change', renderAll);
  wrap.appendChild(selFy);

  var content = div('');
  wrap.appendChild(content);
  setContent(wrap);
  renderAll();

  // Build derived cost maps from summary: key = "platformId:shopId" or "platformId:"
  function derivedCosts(fy) {
    var map = {};
    function key(platformId, shopId) { return (platformId||0)+':'+(shopId||0); }
    function add(k, status, cost) {
      if (!map[k]) map[k] = {funded:0, ufr:0};
      if (status === 'funded') map[k].funded += cost;
      else if (status === 'ufr') map[k].ufr += cost;
    }
    (summaryData.deficiencies||[]).forEach(function(r){
      if (r.budget_fiscal_year && r.budget_fiscal_year !== fy) return;
      add(key(r.platform_id, null), r.budget_status, r.total_cost||0);
    });
    (summaryData.supply_requests||[]).forEach(function(r){
      if (r.budget_fiscal_year && r.budget_fiscal_year !== fy) return;
      add(key(r.platform_id, r.shop_id), r.budget_status, r.total_cost||0);
    });
    (summaryData.modernizations||[]).forEach(function(r){
      if (r.budget_fiscal_year && r.budget_fiscal_year !== fy) return;
      add(key(r.platform_id, r.shop_id), r.budget_status, r.total_cost||0);
    });
    (summaryData.work_packages||[]).forEach(function(r){
      add(key(r.platform_id, null), 'funded', r.total_cost||0);
    });
    return {map:map, key:key};
  }

  function renderAll() {
    var fy = parseInt(selFy.value);
    content.innerHTML = '';
    var fyEntries = entries.filter(e => e.fiscal_year === fy);
    var derived = derivedCosts(fy);

    // Group by platform — include platforms with manual entries or derived costs
    var platformIds = [...new Set(fyEntries.map(e => e.platform_id).filter(Boolean))];
    platforms.forEach(p => { if (!platformIds.includes(p.id)) platformIds.push(p.id); });

    var anyContent = false;
    platformIds.forEach(function(pid) {
      var platform = platforms.find(p=>p.id===pid);
      if (!platform) return;

      var platEntry   = fyEntries.find(e=>e.platform_id===pid && e.entry_type==='platform');
      var shopEntries = fyEntries.filter(e=>e.platform_id===pid && e.entry_type==='shop');

      // Check if there are any derived costs for this platform
      var hasDerived = Object.keys(derived.map).some(function(k){ return k.startsWith(pid+':'); });
      if (!platEntry && !shopEntries.length && !hasDerived) return;
      anyContent = true;

      var card = div('ops-card'); card.style.marginBottom='20px';

      // Platform header row
      var cardHdr = div('ops-card-header');
      cardHdr.appendChild(el('h3',{text:'🏢 '+platform.name+' — FY '+fy}));
      var addShopBtn = btn('ops-btn-sm','+ Shop Allocation', ()=>showBudgetForm({platform_id:pid,fiscal_year:fy,entry_type:'shop'}, platforms, shops, ()=>viewBudget()));
      cardHdr.appendChild(addShopBtn);
      card.appendChild(cardHdr);

      // Platform-level authority line
      if (platEntry) {
        var auth  = platEntry.total_authorized || 0;
        var shopTotal = shopEntries.reduce((s,e)=>s+(e.total_authorized||0),0);
        var unallocated = auth - shopTotal;
        var prow = div('');
        prow.style.cssText = 'display:grid;grid-template-columns:1fr repeat(4,120px) 80px;gap:8px;padding:10px 16px;background:#0f172a;border-bottom:1px solid #2e3650;align-items:center;font-size:12px;';
        prow.appendChild(el('span',{text:'Platform Authority',style:'font-weight:700;color:#7dd3fc;'}));
        prow.appendChild(fmtMoney(auth,'color:#38bdf8;font-weight:700;'));
        prow.appendChild(fmtMoney(platEntry.funded_obligation||0,'color:#4ade80;'));
        prow.appendChild(fmtMoney(platEntry.ufr_amount||0,'color:#f87171;'));
        prow.appendChild(fmtMoney(unallocated, unallocated < 0 ? 'color:#f87171;' : 'color:#64748b;'));
        var editPlatBtn = btn('ops-btn-sm','✏',()=>showBudgetForm(platEntry, platforms, shops, ()=>viewBudget()));
        editPlatBtn.style.fontSize='11px';
        prow.appendChild(editPlatBtn);
        card.appendChild(prow);
      } else {
        var noPlatRow = div('');
        noPlatRow.style.cssText = 'padding:8px 16px;background:#0f172a;border-bottom:1px solid #2e3650;font-size:12px;color:#64748b;display:flex;justify-content:space-between;align-items:center;';
        noPlatRow.appendChild(el('span',{text:'No platform-level authority set'}));
        var addPlatBtn = btn('ops-btn-sm','+ Set Platform Authority',()=>showBudgetForm({platform_id:pid,fiscal_year:fy,entry_type:'platform'}, platforms, shops, ()=>viewBudget()));
        noPlatRow.appendChild(addPlatBtn);
        card.appendChild(noPlatRow);
      }

      // Column headers
      var colHdr = div('');
      colHdr.style.cssText = 'display:grid;grid-template-columns:1fr repeat(4,120px) 80px;gap:8px;padding:6px 16px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #1e2540;';
      ['Shop','Authorized','Obligated','UFR','Remaining',''].forEach(function(h){
        colHdr.appendChild(el('span',{text:h}));
      });
      card.appendChild(colHdr);

      // Collect all shop ids (from entries + derived costs)
      var shopIds = [...new Set(shopEntries.map(e=>e.shop_id).filter(Boolean))];
      Object.keys(derived.map).forEach(function(k){
        var parts = k.split(':');
        if (parseInt(parts[0])===pid && parseInt(parts[1])) {
          var sid = parseInt(parts[1]);
          if (!shopIds.includes(sid)) shopIds.push(sid);
        }
      });

      if (!shopIds.length) {
        var noShop = div('');
        noShop.style.cssText = 'padding:16px;text-align:center;font-size:12px;color:#475569;';
        noShop.textContent = 'No shop allocations. Click "+ Shop Allocation" to break down the budget by shop.';
        card.appendChild(noShop);
      } else {
        shopIds.forEach(function(sid) {
          var se   = shopEntries.find(e=>e.shop_id===sid);
          var shop = shops.find(s=>s.id===sid);
          var auth = se ? (se.total_authorized || 0) : 0;
          var oblig= se ? (se.funded_obligation || 0) : 0;
          var ufr  = se ? (se.ufr_amount || 0) : 0;
          var rem  = auth - oblig;

          var srow = div('');
          srow.style.cssText = 'display:grid;grid-template-columns:1fr repeat(4,120px) 80px;gap:8px;padding:9px 16px;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;cursor:pointer;';
          srow.addEventListener('mouseenter',function(){ srow.style.background='#1e2a3a'; });
          srow.addEventListener('mouseleave',function(){ srow.style.background=''; });
          srow.addEventListener('click',function(e){ if(e.target.closest('button')) return; showBudgetDrilldown(pid,sid,fy,null); });
          srow.appendChild(el('span',{text:(shop?shop.name:'Shop #'+sid),style:'color:#e2e8f0;font-weight:600;'}));
          srow.appendChild(fmtMoney(auth,'color:#cbd5e1;'));
          srow.appendChild(fmtMoney(oblig,'color:#4ade80;'));
          srow.appendChild(fmtMoney(ufr,'color:#f87171;'));
          srow.appendChild(fmtMoney(rem, rem < 0 ? 'color:#f87171;font-weight:700;' : 'color:#64748b;'));
          var acts = div(''); acts.style.cssText='display:flex;gap:4px;';
          if (se) {
            var editBtn = btn('ops-btn-sm','✏',()=>showBudgetForm(se, platforms, shops, ()=>viewBudget()));
            editBtn.style.cssText = 'font-size:11px;';
            var delBtn  = btn('ops-btn-sm','🗑',async()=>{
              if (!confirm('Delete this shop budget entry?')) return;
              await API.budget.destroy(se.id);
              viewBudget();
            });
            delBtn.style.cssText = 'font-size:11px;background:#3b1515;color:#f87171;margin-left:4px;';
            acts.appendChild(editBtn); acts.appendChild(delBtn);
          } else {
            var addShopEntry = btn('ops-btn-sm','+ Set',()=>showBudgetForm({platform_id:pid,shop_id:sid,fiscal_year:fy,entry_type:'shop'}, platforms, shops, ()=>viewBudget()));
            addShopEntry.style.fontSize='11px';
            acts.appendChild(addShopEntry);
          }
          srow.appendChild(acts);
          card.appendChild(srow);

          // System-derived sub-row for this shop
          var dk = derived.key(pid, sid);
          var dc = derived.map[dk];
          if (dc && (dc.funded || dc.ufr)) {
            var drow = div('');
            drow.style.cssText = 'display:grid;grid-template-columns:1fr repeat(4,120px) 80px;gap:8px;padding:5px 16px 5px 28px;border-bottom:1px solid #1e2540;background:#0a1520;align-items:center;font-size:11px;';
            drow.appendChild(el('span',{text:'↳ System Derived',style:'color:#475569;font-style:italic;'}));
            drow.appendChild(el('span',{text:''}));
            drow.appendChild(fmtMoney(dc.funded,'color:#22c55e;font-size:11px;'));
            drow.appendChild(fmtMoney(dc.ufr,'color:#ef4444;font-size:11px;'));
            drow.appendChild(el('span',{text:''}));
            drow.appendChild(el('span',{text:''}));
            card.appendChild(drow);
          }
        });

        // Totals row
        var totAuth  = shopEntries.reduce((s,e)=>s+(e.total_authorized||0),0);
        var totOblig = shopEntries.reduce((s,e)=>s+(e.funded_obligation||0),0);
        var totUfr   = shopEntries.reduce((s,e)=>s+(e.ufr_amount||0),0);
        var totRem   = totAuth - totOblig;
        var trow = div('');
        trow.style.cssText = 'display:grid;grid-template-columns:1fr repeat(4,120px) 80px;gap:8px;padding:8px 16px;background:#0f1a2a;font-size:12px;font-weight:700;border-top:2px solid #2e3650;';
        trow.appendChild(el('span',{text:'Shop Totals',style:'color:#94a3b8;'}));
        trow.appendChild(fmtMoney(totAuth,'color:#38bdf8;'));
        trow.appendChild(fmtMoney(totOblig,'color:#4ade80;'));
        trow.appendChild(fmtMoney(totUfr,'color:#f87171;'));
        trow.appendChild(fmtMoney(totRem, totRem < 0 ? 'color:#f87171;' : 'color:#64748b;'));
        trow.appendChild(el('span',{text:''}));
        card.appendChild(trow);
      }

      content.appendChild(card);
    });

    if (!anyContent) {
      var empty = div('ops-card');
      empty.style.padding = '32px';
      empty.appendChild(el('div',{cls:'ops-empty',text:'No budget entries for FY '+fy+'. Click "+ New Entry" to add one.'}));
      content.appendChild(empty);
    }
  }

  function fmtMoney(v, extraStyle) {
    var s = el('span',{text:'$'+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})});
    s.style.cssText = 'font-family:monospace;font-size:12px;'+(extraStyle||'color:#e2e8f0;');
    return s;
  }
}

async function showBudgetForm(existing, platforms, shops, onSave) {
  var fWrap = div('ops-form-grid');
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  var isShop = (existing?.entry_type === 'shop') || (!existing?.entry_type && existing?.shop_id);
  var typeOpts = [['platform','Platform Authority'],['shop','Shop Allocation']];
  var typeSel = add('Entry Type', sel(typeOpts, existing?.entry_type || (isShop?'shop':'platform')));

  var platOpts = [['','— Select Platform —']].concat(platforms.map(p=>[String(p.id),p.name]));
  var platSel  = add('Platform *', sel(platOpts, existing?.platform_id ? String(existing.platform_id) : ''));

  // Shop selector — filtered to selected platform
  var shopOpts = [['','— Select Shop —']].concat(shops.map(s=>[String(s.id),(platforms.find(p=>p.id===s.platform_id)?.name||'')+ ' / '+s.name]));
  var shopSel  = add('Shop', sel(shopOpts, existing?.shop_id ? String(existing.shop_id) : ''));

  // Filter shop dropdown when platform changes
  function refreshShops() {
    var pid = platSel.value ? parseInt(platSel.value) : null;
    Array.from(shopSel.options).forEach(function(o){
      if (!o.value) { o.hidden = false; return; }
      var shop = shops.find(s=>String(s.id)===o.value);
      o.hidden = pid ? (shop?.platform_id !== pid) : false;
    });
    if (shopSel.value && pid) {
      var cur = shops.find(s=>String(s.id)===shopSel.value);
      if (cur && cur.platform_id !== pid) shopSel.value = '';
    }
  }
  platSel.addEventListener('change', refreshShops);
  refreshShops();

  // Show/hide shop selector based on type
  var shopRow = shopSel.closest('.ops-form-group');
  function refreshType() {
    shopRow.style.display = typeSel.value === 'shop' ? '' : 'none';
  }
  typeSel.addEventListener('change', refreshType);
  refreshType();

  var curYear = new Date().getFullYear();
  var fyOpts  = [curYear-1,curYear,curYear+1,curYear+2].map(y=>[String(y),'FY '+y]);
  var fySel   = add('Fiscal Year *', sel(fyOpts, existing?.fiscal_year ? String(existing.fiscal_year) : String(curYear)));

  var authInp  = add('Total Authorized ($)', inp('0.00', existing?.total_authorized ?? '0'));
  var obligInp = add('Funded Obligation ($)',inp('0.00', existing?.funded_obligation ?? '0'));
  var ufrInp   = add('UFR Amount ($)',        inp('0.00', existing?.ufr_amount ?? '0'));
  var notesInp = add('Notes', ta('Budget notes, constraints, or caveats…', existing?.notes||'', 3), true);

  modal(
    existing?.id ? 'Edit Budget Entry' : 'New Budget Entry',
    fWrap,
    async () => {
      if (!platSel.value) throw new Error('Platform is required.');
      if (typeSel.value === 'shop' && !shopSel.value) throw new Error('Shop is required for a shop allocation.');
      var d = {
        entry_type:       typeSel.value,
        platform_id:      platSel.value ? parseInt(platSel.value) : null,
        shop_id:          typeSel.value === 'shop' && shopSel.value ? parseInt(shopSel.value) : null,
        fiscal_year:      parseInt(fySel.value),
        total_authorized: parseFloat(authInp.value) || 0,
        funded_obligation:parseFloat(obligInp.value) || 0,
        ufr_amount:       parseFloat(ufrInp.value) || 0,
        notes:            notesInp.value.trim() || null,
      };
      if (existing?.id) {
        await API.budget.update(existing.id, d);
      } else {
        await API.budget.create(d);
      }
      if (onSave) onSave();
    },
    existing?.id ? 'Save Changes' : 'Create Entry'
  );
}

/* ── Budget Drilldown Modal ── */
async function showBudgetDrilldown(platformId, shopId, fy, budgetStatus) {
  var overlay = div('ops-modal-overlay');
  var modal   = div('ops-modal'); modal.style.maxWidth='720px';
  var hdr = div('ops-modal-header');
  var label = shopId ? 'Shop #'+shopId : 'Platform #'+platformId;
  hdr.appendChild(el('h3',{text:'Budget Drilldown — '+label+' FY '+fy}));
  var closeBtn = btn('','✕',function(){ document.body.removeChild(overlay); });
  closeBtn.style.cssText='background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;';
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  var body = div('');
  body.style.padding = '16px';
  body.textContent = 'Loading…';
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  var p = {platform_id: platformId, fiscal_year: fy};
  if (shopId) p.shop_id = shopId;
  if (budgetStatus) p.budget_status = budgetStatus;

  var data = await API.budget.drilldown(p).catch(function(){ return null; });
  body.innerHTML = '';
  if (!data || !data.items || !data.items.length) {
    body.appendChild(el('div',{cls:'ops-empty',text:'No records found for these filters.'}));
    return;
  }

  var typeIcons = {deficiency:'⚠',supply_request:'🛒',modernization:'🔧',work_package:'📦'};
  var typeLabels = {deficiency:'Deficiency',supply_request:'Supply Req',modernization:'Modernization',work_package:'Work Package'};

  var table = div('');
  var colHdr = div('');
  colHdr.style.cssText = 'display:grid;grid-template-columns:28px 80px 1fr 80px 90px;gap:8px;padding:6px 12px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2e3650;';
  ['','Type','Title','Status','Cost'].forEach(function(h){ colHdr.appendChild(el('span',{text:h})); });
  table.appendChild(colHdr);

  data.items.forEach(function(item) {
    var row = div('');
    row.style.cssText = 'display:grid;grid-template-columns:28px 80px 1fr 80px 90px;gap:8px;padding:8px 12px;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;cursor:pointer;';
    row.addEventListener('mouseenter',function(){ row.style.background='#1e2a3a'; });
    row.addEventListener('mouseleave',function(){ row.style.background=''; });
    if (item.nav_route) {
      row.addEventListener('click',function(){
        try { document.body.removeChild(overlay); } catch(e) {}
        navigate(item.nav_route, item.nav_param || undefined);
      });
    }
    row.appendChild(el('span',{text:typeIcons[item.record_type]||'•'}));
    row.appendChild(el('span',{text:typeLabels[item.record_type]||item.record_type,style:'color:#7dd3fc;font-size:11px;'}));
    row.appendChild(el('span',{text:item.title||'—',style:'color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'}));
    row.appendChild(el('span',{text:item.status||'—',style:'color:#94a3b8;font-size:11px;'}));
    var costEl = el('span',{text:'$'+Number(item.cost||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})});
    costEl.style.cssText='font-family:monospace;font-size:12px;color:#4ade80;';
    row.appendChild(costEl);
    table.appendChild(row);
  });

  var total = data.items.reduce(function(s,i){ return s+(i.cost||0); },0);
  var totRow = div('');
  totRow.style.cssText='display:flex;justify-content:space-between;padding:10px 12px;font-size:13px;font-weight:700;border-top:2px solid #2e3650;background:#0f1a2a;';
  totRow.appendChild(el('span',{text:'Total ('+data.items.length+' records)',style:'color:#94a3b8;'}));
  var totCost = el('span',{text:'$'+Number(total).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})});
  totCost.style.cssText='font-family:monospace;color:#38bdf8;';
  totRow.appendChild(totCost);
  table.appendChild(totRow);

  body.appendChild(table);
}

/* ── UFR Export Modal ── */

function showUfrExport(data) {
  var wrap = div('');
  var total = data.total_ufr || 0;
  var fy    = data.fiscal_year || 'All';

  var summary = div('');
  summary.style.cssText='display:flex;gap:24px;padding:12px 0 20px;flex-wrap:wrap;';
  [[`FY ${fy} UFR Items`, String(data.items?.length||0)], ['Total UFR', '$'+Number(total).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})]].forEach(function([l,v]){
    var s = div(''); s.style.cssText='display:flex;flex-direction:column;gap:4px;';
    s.appendChild(el('span',{text:l,style:'font-size:10px;color:#64748b;text-transform:uppercase;'}));
    s.appendChild(el('span',{text:v,style:'font-size:20px;font-weight:700;color:#f87171;font-family:monospace;'}));
    summary.appendChild(s);
  });
  wrap.appendChild(summary);

  if (!data.items?.length) {
    wrap.appendChild(el('p',{cls:'ops-empty',text:'No UFR items found for this fiscal year.'}));
  } else {
    var TYPE_LABELS = {deficiency:'Deficiency',supply_request:'Supply Request',modernization:'Modernization'};
    wrap.appendChild(makeTable(
      ['#','Type','Title','Est. Cost'],
      data.items.map(function(item, i) {
        return [
          el('span',{text:String(i+1),style:'color:#64748b;font-size:11px;'}),
          span('ops-badge '+(item.type==='deficiency'?'badge-orange':item.type==='modernization'?'badge-purple':'badge-blue'), TYPE_LABELS[item.type]||item.type),
          el('span',{text:item.title||'—',style:'color:#e2e8f0;'}),
          el('span',{text:'$'+Number(item.estimated_cost||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),style:'font-family:monospace;color:#f87171;font-weight:700;'}),
        ];
      })
    ));
  }

  // Download as JSON
  var dlBtn = btn('','⬇ Download JSON', function(){
    var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ufr_export_fy'+fy+'.json';
    a.click();
  });
  dlBtn.style.marginTop = '12px';
  wrap.appendChild(dlBtn);

  modal('UFR Export — FY '+fy, wrap, null, null);
}

/* ── Budget Line Items ── */

async function showBudgetLines(budgetId, onUpdate) {
  var lines = await API.budget.listLines(budgetId).catch(()=>[]);
  var LINE_TYPES = [['TM','TM / Publications'],['training','Training'],['parts','Parts'],['labor','Labor'],['contractor','Contractor'],['other','Other']];
  var wrap = div('');

  var hdr2 = div(''); hdr2.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
  hdr2.appendChild(el('h4',{text:'Budget Lines',style:'margin:0;color:#e2e8f0;'}));
  hdr2.appendChild(btn('ops-btn-sm','+ Add Line', ()=>showBudgetLineForm(budgetId, null, LINE_TYPES, ()=>{ onUpdate && onUpdate(); })));
  wrap.appendChild(hdr2);

  if (!lines.length) {
    wrap.appendChild(el('p',{cls:'ops-empty',text:'No budget lines. Add lines to break down this entry by category.'}));
  } else {
    var totAuth=0,totOblig=0,totUfr=0;
    lines.forEach(l=>{ totAuth+=l.authorized_amount||0; totOblig+=l.obligated_amount||0; totUfr+=l.ufr_amount||0; });
    wrap.appendChild(makeTable(
      ['Type','Description','Authorized','Obligated','UFR',''],
      [...lines.map(function(l){
        var typeLabel = LINE_TYPES.find(t=>t[0]===l.line_type)?.[1]||l.line_type;
        var eb = btn('ops-btn-sm','✏',()=>showBudgetLineForm(budgetId, l, LINE_TYPES, onUpdate));
        var db = btn('ops-btn-sm ops-btn-danger','✕',async()=>{
          if(!confirm('Delete this line?')) return;
          await API.budget.destroyLine(budgetId, l.id); onUpdate && onUpdate();
        });
        var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db);
        return [span('ops-badge badge-gray',typeLabel), l.description||span('ops-muted','—'),
          el('span',{text:'$'+Number(l.authorized_amount||0).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#38bdf8;'}),
          el('span',{text:'$'+Number(l.obligated_amount||0).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#4ade80;'}),
          el('span',{text:'$'+Number(l.ufr_amount||0).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#f87171;'}),
          g];
      }),
      [span('ops-badge',''),el('strong',{text:'Totals'}),
        el('span',{text:'$'+Number(totAuth).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#38bdf8;font-weight:700;'}),
        el('span',{text:'$'+Number(totOblig).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#4ade80;font-weight:700;'}),
        el('span',{text:'$'+Number(totUfr).toLocaleString('en-US',{minimumFractionDigits:2}),style:'font-family:monospace;font-size:12px;color:#f87171;font-weight:700;'}),
        el('span',{text:''})
      ]]
    ));
  }
  return wrap;
}

function showBudgetLineForm(budgetId, existing, lineTypes, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
  f.lineType   = add('Line Type', sel(lineTypes, existing?.line_type||'other'));
  f.description= add('Description', inp('e.g., O-Level Maintenance Publications', existing?.description||''), true);
  f.authorized = add('Authorized ($)', inp('0.00', existing?.authorized_amount!=null?String(existing.authorized_amount):'0'));
  f.obligated  = add('Obligated ($)',  inp('0.00', existing?.obligated_amount!=null?String(existing.obligated_amount):'0'));
  f.ufr        = add('UFR ($)',        inp('0.00', existing?.ufr_amount!=null?String(existing.ufr_amount):'0'));
  f.notes      = add('Notes', ta('', existing?.notes||'', 2), true);

  modal(existing?'Edit Budget Line':'Add Budget Line', fWrap, async()=>{
    var d = {
      line_type:         f.lineType.value,
      description:       f.description.value,
      authorized_amount: parseFloat(f.authorized.value)||0,
      obligated_amount:  parseFloat(f.obligated.value)||0,
      ufr_amount:        parseFloat(f.ufr.value)||0,
      notes:             f.notes.value||null,
    };
    if (existing) await API.budget.updateLine(budgetId, existing.id, d);
    else          await API.budget.createLine(budgetId, d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Add Line');
}

/* ── Readiness Report (Sprint 2C) ── */

// Shared renderer — called by both the dashboard Readiness tab and the standalone route
function renderHealthReportBody(container, r) {

    // ── Health Score ──────────────────────────────────────────────
    var scoreColor = r.health_score>=80?'#4ade80':r.health_score>=60?'#facc15':r.health_score>=40?'#fb923c':'#f87171';
    var scoreLabel = r.health_score>=80?'READY':r.health_score>=60?'MARGINAL':r.health_score>=40?'DEGRADED':'NOT READY';

    var scoreCard = div('ops-card');
    scoreCard.style.cssText = 'padding:24px;margin-bottom:16px;display:flex;align-items:center;gap:32px;';
    var scoreBlock = div(''); scoreBlock.style.cssText = 'text-align:center;min-width:120px;';
    scoreBlock.appendChild(el('div',{text:r.health_score,style:'font-size:64px;font-weight:900;color:'+scoreColor+';line-height:1;'}));
    scoreBlock.appendChild(el('div',{text:scoreLabel,style:'font-size:13px;font-weight:700;color:'+scoreColor+';letter-spacing:2px;margin-top:4px;'}));
    scoreBlock.appendChild(el('div',{text:'Health Score',style:'font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;'}));
    scoreCard.appendChild(scoreBlock);

    // Summary stats
    var statsRow = div(''); statsRow.style.cssText = 'display:flex;gap:24px;flex:1;flex-wrap:wrap;';
    function addStat(val, label, color, clickRoute) {
      var s = div(''); s.style.cssText = 'text-align:center;min-width:80px;cursor:'+(clickRoute?'pointer':'default')+';';
      s.appendChild(el('div',{text:String(val),style:'font-size:28px;font-weight:800;color:'+(color||'#e2e8f0')+';'}));
      s.appendChild(el('div',{text:label,style:'font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;'}));
      if (clickRoute) { s.onclick = function(){ navigate(clickRoute); }; s.title = 'Click to view'; }
      statsRow.appendChild(s);
    }
    addStat(r.summary.total_assets, 'Assets', '#e2e8f0', 'assets');
    addStat(r.summary.open_deficiencies, 'Open Deficiencies', r.summary.open_deficiencies>0?'#f87171':'#4ade80', 'deficiencies');
    addStat(r.summary.overdue_pms, 'Overdue PMs', r.summary.overdue_pms>0?'#fb923c':'#4ade80', 'pm-procedures');
    addStat(r.summary.critical_at_risk, 'Critical at Risk', r.summary.critical_at_risk>0?'#f87171':'#4ade80', null);
    addStat(r.summary.assets_no_pm, 'No PM Assigned', r.summary.assets_no_pm>0?'#facc15':'#4ade80', null);
    if (r.summary.predicted_30d !== undefined) {
      addStat(r.summary.predicted_30d, 'Pred. Fail 30d', r.summary.predicted_30d>0?'#f87171':'#4ade80', null);
      if (r.summary.funding_projection > 0) {
        addStat('$'+Math.round(r.summary.funding_projection).toLocaleString(), '12-Mo Funding Est', '#fb923c', null);
      }
    }
    addStat(r.summary.iuid_gaps, 'IUID Gaps', r.summary.iuid_gaps>0?'#64748b':'#4ade80', null);
    scoreCard.appendChild(statsRow);

    var genInfo = div(''); genInfo.style.cssText = 'font-size:11px;color:#475569;min-width:140px;text-align:right;align-self:flex-start;';
    if (r.recent_import) {
      genInfo.innerHTML = 'Last import:<br><b>'+r.recent_import.import_type+'</b><br>'+
        r.recent_import.imported_rows+' rows<br>'+
        (r.recent_import.completed_at||'').slice(0,10);
    }
    genInfo.innerHTML += '<br><span style="color:#334155;">Generated '+r.generated_at.slice(0,16)+'</span>';
    scoreCard.appendChild(genInfo);
    container.appendChild(scoreCard);

    // ── Priority Actions ──────────────────────────────────────────
    var LEVEL_STYLES = {
      critical: {bg:'rgba(248,113,113,.12)',border:'rgba(248,113,113,.4)',dot:'#f87171',label:'CRITICAL'},
      high:     {bg:'rgba(251,146,60,.12)', border:'rgba(251,146,60,.4)', dot:'#fb923c',label:'HIGH'},
      medium:   {bg:'rgba(250,204,21,.1)',  border:'rgba(250,204,21,.35)',dot:'#facc15',label:'MEDIUM'},
      low:      {bg:'rgba(148,163,184,.1)', border:'rgba(148,163,184,.3)',dot:'#94a3b8',label:'LOW'},
      ok:       {bg:'rgba(74,222,128,.1)',  border:'rgba(74,222,128,.3)', dot:'#4ade80',label:'OK'},
    };

    if (r.priority_actions && r.priority_actions.length) {
      var actCard = div('ops-card'); actCard.style.cssText='margin-bottom:16px;';
      actCard.appendChild(div('ops-card-header',[el('h3',{text:'Priority Actions'})]));
      r.priority_actions.forEach(function(a) {
        var style = LEVEL_STYLES[a.level] || LEVEL_STYLES.low;
        var clickable = !!a.nav_route;
        var row = div('');
        row.style.cssText = 'display:flex;align-items:flex-start;gap:14px;padding:14px 20px;border-bottom:1px solid #1e2540;background:'+style.bg+';border-left:3px solid '+style.border+';'+(clickable?'cursor:pointer;transition:filter .15s;':'');
        if (clickable) {
          row.onmouseenter = function(){ row.style.filter='brightness(1.12)'; };
          row.onmouseleave = function(){ row.style.filter=''; };
          row.onclick = function(){ navigate(a.nav_route, a.nav_param||undefined); };
          row.title = 'Click to view';
        }
        var numEl = el('div',{text:String(a.priority),style:'font-size:18px;font-weight:900;color:'+style.dot+';min-width:24px;text-align:center;flex-shrink:0;margin-top:1px;'});
        var info = div(''); info.style.cssText = 'flex:1;';
        var titleRow = div(''); titleRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;';
        titleRow.appendChild(el('strong',{text:a.title,style:'color:#e2e8f0;font-size:13px;'}));
        titleRow.appendChild(span('ops-badge '+(a.level==='critical'?'badge-red':a.level==='high'?'badge-orange':a.level==='medium'?'badge-yellow':a.level==='ok'?'badge-green':'badge-gray'),style.label));
        info.appendChild(titleRow);
        if (a.detail) info.appendChild(el('div',{text:a.detail,style:'font-size:12px;color:#94a3b8;margin-bottom:4px;'}));
        if (a.action) info.appendChild(el('div',{text:(clickable?'→ ':'')+a.action,style:'font-size:11px;color:'+(clickable?'#38bdf8':'#64748b')+';font-style:italic;'}));
        row.appendChild(numEl); row.appendChild(info);
        actCard.appendChild(row);
      });
      container.appendChild(actCard);
    }

    // ── Two-col: breakdown charts ─────────────────────────────────
    var two = div('ops-two-col'); container.appendChild(two);
    var colL = div(''); var colR = div('');

    // Deficiencies by severity
    var defSevCard = div('ops-card'); defSevCard.style.marginBottom = '16px';
    defSevCard.appendChild(div('ops-card-header',[el('h3',{text:'Deficiencies by Severity'})]));
    var SEV_COLORS = {'SEV-1':'#f87171','SEV-2':'#fb923c','SEV-3':'#facc15','SEV-4':'#94a3b8','SEV-5':'#475569'};
    var totalDef = Object.values(r.deficiencies_by_severity||{}).reduce(function(a,b){return a+b;},0);
    if (totalDef === 0) {
      defSevCard.appendChild(el('p',{cls:'ops-empty',text:'No open deficiencies.'}));
    } else {
      Object.entries(r.deficiencies_by_severity||{}).sort().forEach(function([sev,cnt]) {
        var pct = Math.round((cnt/totalDef)*100);
        var row = div(''); row.style.cssText = 'padding:10px 16px;cursor:pointer;transition:background .15s;';
        row.title = 'Click to view '+sev+' deficiencies';
        row.onmouseenter = function(){ row.style.background='rgba(255,255,255,.04)'; };
        row.onmouseleave = function(){ row.style.background=''; };
        row.onclick = function(){ navigate('deficiencies', sev); };
        var srTop = div(''); srTop.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px;';
        srTop.appendChild(el('span',{text:sev,style:'font-size:12px;font-weight:700;color:'+(SEV_COLORS[sev]||'#94a3b8')+';'}));
        srTop.appendChild(el('span',{text:cnt+' ('+pct+'%) →',style:'font-size:12px;color:#64748b;'}));
        row.appendChild(srTop);
        var bar = div(''); bar.style.cssText = 'height:8px;border-radius:4px;background:#1e2540;overflow:hidden;';
        var fill = div(''); fill.style.cssText = 'height:100%;width:'+pct+'%;background:'+(SEV_COLORS[sev]||'#94a3b8')+';border-radius:4px;transition:width .4s;';
        bar.appendChild(fill); row.appendChild(bar);
        defSevCard.appendChild(row);
      });
    }
    colL.appendChild(defSevCard);

    // Assets by type
    var typeCard = div('ops-card'); typeCard.style.marginBottom = '16px';
    typeCard.appendChild(div('ops-card-header',[el('h3',{text:'Assets by Type'})]));
    var TYPE_COLORS = {hardware:'#38bdf8',software:'#a78bfa',firmware:'#34d399'};
    var totalAssets = Object.values(r.assets_by_type||{}).reduce(function(a,b){return a+b;},0) || 1;
    Object.entries(r.assets_by_type||{}).forEach(function([type,cnt]) {
      var pct = Math.round((cnt/totalAssets)*100);
      var row = div(''); row.style.cssText = 'padding:10px 16px;';
      var topRow = div(''); topRow.style.cssText='display:flex;justify-content:space-between;margin-bottom:4px;';
      topRow.appendChild(el('span',{text:type,style:'font-size:12px;font-weight:700;color:'+(TYPE_COLORS[type]||'#94a3b8')+';text-transform:capitalize;'}));
      topRow.appendChild(el('span',{text:cnt+' ('+pct+'%)',style:'font-size:12px;color:#64748b;'}));
      row.appendChild(topRow);
      var bar = div(''); bar.style.cssText = 'height:8px;border-radius:4px;background:#1e2540;overflow:hidden;';
      var fill = div(''); fill.style.cssText = 'height:100%;width:'+pct+'%;background:'+(TYPE_COLORS[type]||'#94a3b8')+';border-radius:4px;';
      bar.appendChild(fill); row.appendChild(bar);
      typeCard.appendChild(row);
    });
    colL.appendChild(typeCard);

    // HSC section breakdown
    if (r.assets_by_hsc_section && r.assets_by_hsc_section.length) {
      var hscCard = div('ops-card'); hscCard.style.marginBottom = '16px';
      hscCard.appendChild(div('ops-card-header',[el('h3',{text:'Assets by SWBS/HSC Section'})]));
      var maxHscCnt = Math.max.apply(null, r.assets_by_hsc_section.map(function(s){return s.count;})) || 1;
      r.assets_by_hsc_section.forEach(function(s) {
        var pct = Math.round((s.count/maxHscCnt)*100);
        var row = div(''); row.style.cssText = 'padding:8px 16px;';
        var topRow = div(''); topRow.style.cssText='display:flex;justify-content:space-between;margin-bottom:3px;';
        topRow.appendChild(el('span',{text:'Section '+s.section,style:'font-size:12px;font-weight:700;color:#7dd3fc;font-family:monospace;'}));
        topRow.appendChild(el('span',{text:s.count,style:'font-size:12px;color:#64748b;'}));
        row.appendChild(topRow);
        var bar = div(''); bar.style.cssText = 'height:6px;border-radius:3px;background:#1e2540;overflow:hidden;';
        var fill = div(''); fill.style.cssText = 'height:100%;width:'+pct+'%;background:#0ea5e9;border-radius:3px;';
        bar.appendChild(fill); row.appendChild(bar);
        hscCard.appendChild(row);
      });
      colR.appendChild(hscCard);
    }

    // Critical assets with deficiencies
    if (r.critical_assets_with_deficiencies && r.critical_assets_with_deficiencies.length) {
      var critCard = div('ops-card'); critCard.style.marginBottom = '16px';
      critCard.appendChild(div('ops-card-header',[el('h3',{text:'⚠ Critical Assets with Open Deficiencies'})]));
      critCard.appendChild(makeTable(
        ['Asset','Crit','HSC','Location','Defs','Worst'],
        r.critical_assets_with_deficiencies.map(function(a) { return [
          (function(){ var lnk=el('strong',{text:a.name,style:'cursor:pointer;color:#38bdf8;'}); lnk.onclick=function(){navigate('asset-detail',a.id);}; return lnk; })(),
          span('ops-badge '+(a.criticality_code==='CR'?'badge-red':'badge-orange'), a.criticality_code),
          a.hsc_code ? span('ops-mono ops-small', a.hsc_code) : span('ops-muted','—'),
          a.location || span('ops-muted','—'),
          el('strong',{text:String(a.def_count),style:'color:#f87171;'}),
          span('ops-badge '+(a.worst_severity==='SEV-1'?'badge-red':a.worst_severity==='SEV-2'?'badge-orange':'badge-yellow'), a.worst_severity),
        ]; }),
        function(i){ if(r.critical_assets_with_deficiencies[i]) navigate('asset-detail', r.critical_assets_with_deficiencies[i].id); }
      ));
      colR.appendChild(critCard);
    }

    two.appendChild(colL); two.appendChild(colR);

    // ── Assets without PMs ────────────────────────────────────────
    if (r.assets_without_pms && r.assets_without_pms.length) {
      var noPmCard = div('ops-card'); noPmCard.style.marginBottom = '16px';
      noPmCard.appendChild(div('ops-card-header',[el('h3',{text:'Assets with No Scheduled Maintenance ('+r.assets_without_pms.length+')'})]));
      noPmCard.appendChild(makeTable(
        ['Asset','Type','Criticality','HSC','Location'],
        r.assets_without_pms.map(function(a){ return [
          (function(){ var lnk=el('strong',{text:a.name,style:'cursor:pointer;color:#38bdf8;'}); lnk.onclick=function(){navigate('asset-detail',a.id);}; return lnk; })(),
          span('ops-badge badge-blue', a.asset_type||'—'),
          a.criticality_code ? span('ops-badge '+(a.criticality_code==='CR'?'badge-red':a.criticality_code==='DE'?'badge-orange':'badge-gray'), a.criticality_code) : span('ops-muted','—'),
          a.hsc_code ? span('ops-mono ops-small', a.hsc_code) : span('ops-muted','—'),
          a.location || span('ops-muted','—'),
        ]; }),
        function(i){ if(r.assets_without_pms[i]) navigate('asset-detail', r.assets_without_pms[i].id); }
      ));
      container.appendChild(noPmCard);
    }

    // ── IUID Compliance Gaps ──────────────────────────────────────
    if (r.iuid_gaps && r.iuid_gaps.length) {
      var iuidCard = div('ops-card'); iuidCard.style.marginBottom = '16px';
      iuidCard.appendChild(div('ops-card-header',[el('h3',{text:'IUID / UII Compliance Gaps ('+r.iuid_gaps.length+')'})]));
      iuidCard.appendChild(el('p',{cls:'ops-form-hint',text:'Hardware assets require CAGE Code + Serial Number to generate a DoD-compliant Unique Item Identifier (UII).',style:'padding:0 16px 12px;'}));
      iuidCard.appendChild(makeTable(
        ['Asset','Serial Number','CAGE Code','HSC','Location'],
        r.iuid_gaps.map(function(a){ return [
          (function(){ var lnk=el('strong',{text:a.name,style:'cursor:pointer;color:#38bdf8;'}); lnk.onclick=function(){navigate('asset-detail',a.id);}; return lnk; })(),
          a.serial_number ? span('ops-mono ops-small', a.serial_number) : span('ops-badge badge-red','MISSING'),
          a.cage_code     ? span('ops-mono ops-small', a.cage_code)     : span('ops-badge badge-red','MISSING'),
          a.hsc_code ? span('ops-mono ops-small', a.hsc_code) : span('ops-muted','—'),
          a.location || span('ops-muted','—'),
        ]; }),
        function(i){ if(r.iuid_gaps[i]) navigate('asset-detail', r.iuid_gaps[i].id); }
      ));
      container.appendChild(iuidCard);
    }

    // ── Predicted Failures (Parsons Methodology) ──────────────────
    if (r.predicted_failures && r.predicted_failures.length) {
      var pfCard = div('ops-card'); pfCard.style.marginBottom = '16px';
      var pfHdr  = div('ops-card-header');
      pfHdr.appendChild(el('h3',{text:'📈 Predicted Failures — MTBF / MTTR Analysis ('+r.predicted_failures.length+' assets tracked)'}));
      pfHdr.appendChild(el('p',{cls:'ops-form-hint',text:'Based on closed deficiency history. MTBF = mean time between failures (inter-failure uptime); MTTR = mean time to repair. Predicted date = last failure + MTBF.',style:'padding:8px 0 0;font-size:11px;color:#64748b;'}));
      pfCard.appendChild(pfHdr);

      // Summary KPIs
      var pfKpiRow = div(''); pfKpiRow.style.cssText='display:flex;gap:12px;flex-wrap:wrap;padding:12px 16px 0;';
      var pred30n  = r.predicted_failures.filter(function(p){return p.days_until_failure!==null&&p.days_until_failure<=30&&p.days_until_failure>0;}).length;
      var pred90n  = r.predicted_failures.filter(function(p){return p.days_until_failure!==null&&p.days_until_failure<=90&&p.days_until_failure>0;}).length;
      var overdueN = r.predicted_failures.filter(function(p){return p.days_until_failure!==null&&p.days_until_failure<=0;}).length;
      var fund12   = r.predicted_failures.filter(function(p){return p.days_until_failure!==null&&p.days_until_failure<=365&&p.days_until_failure>0;})
                       .reduce(function(s,p){return s+(p.avg_cost||0);},0);
      function pfKpi(label, val, col){
        var k=div(''); k.style.cssText='min-width:100px;padding:10px 14px;background:#0f172a;border-radius:6px;border-left:3px solid '+col+';text-align:center;';
        k.appendChild(el('div',{text:String(val),style:'font-size:20px;font-weight:900;color:'+col+';'}));
        k.appendChild(el('div',{text:label,style:'font-size:9px;color:#64748b;text-transform:uppercase;margin-top:2px;letter-spacing:.5px;'}));
        return k;
      }
      pfKpiRow.appendChild(pfKpi('Overdue (Past Predicted)',overdueN,'#f87171'));
      pfKpiRow.appendChild(pfKpi('Predicted ≤ 30 Days',pred30n,pred30n>0?'#fb923c':'#4ade80'));
      pfKpiRow.appendChild(pfKpi('Predicted ≤ 90 Days',pred90n,pred90n>0?'#facc15':'#4ade80'));
      pfKpiRow.appendChild(pfKpi('12-Mo Funding Est','$'+Math.round(fund12).toLocaleString(),'#38bdf8'));
      pfCard.appendChild(pfKpiRow);

      pfCard.appendChild(makeTable(
        ['Asset','Crit','HSC','Incidents','MTBF (days)','MTTR (days)','Avg Cost','Avg Man-Days','Last Failure','Predicted Next Failure','Status'],
        r.predicted_failures.map(function(p) {
          var duf = p.days_until_failure;
          var statusBadge, urgencyColor;
          if (duf === null) {
            statusBadge = span('ops-badge badge-gray','No MTBF*'); urgencyColor='#475569';
          } else if (duf <= 0) {
            statusBadge = span('ops-badge badge-red','OVERDUE'); urgencyColor='#f87171';
          } else if (duf <= 30) {
            statusBadge = span('ops-badge badge-red',duf+'d away'); urgencyColor='#f87171';
          } else if (duf <= 90) {
            statusBadge = span('ops-badge badge-orange',duf+'d away'); urgencyColor='#fb923c';
          } else if (duf <= 180) {
            statusBadge = span('ops-badge badge-yellow',duf+'d away'); urgencyColor='#facc15';
          } else {
            statusBadge = span('ops-badge badge-green',duf+'d away'); urgencyColor='#4ade80';
          }
          var assetLink = el('strong',{text:p.name,style:'cursor:pointer;color:#38bdf8;'});
          assetLink.onclick = function(){ navigate('asset-detail', p.asset_id); };
          return [
            assetLink,
            p.criticality_code ? span('ops-badge '+(p.criticality_code==='CR'?'badge-red':p.criticality_code==='DE'?'badge-orange':'badge-gray'), p.criticality_code) : span('ops-muted','—'),
            p.hsc_code ? span('ops-mono ops-small', p.hsc_code) : span('ops-muted','—'),
            el('span',{text:String(p.incident_count),style:'font-weight:700;color:#94a3b8;'}),
            p.mtbf_days !== null ? el('span',{text:p.mtbf_days+' d',style:'color:#38bdf8;font-weight:700;'}) : span('ops-muted','≥2 needed'),
            p.mttr_days !== null ? el('span',{text:p.mttr_days+' d',style:'color:#a78bfa;'}) : span('ops-muted','—'),
            p.avg_cost > 0 ? el('span',{text:'$'+p.avg_cost.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0}),style:'color:#4ade80;'}) : span('ops-muted','$0'),
            p.avg_man_days > 0 ? el('span',{text:p.avg_man_days+' MD',style:'color:#fbbf24;'}) : span('ops-muted','—'),
            el('span',{text:p.last_failure||'—',style:'font-size:11px;color:#64748b;'}),
            p.predicted_date ? el('span',{text:p.predicted_date,style:'font-weight:700;color:'+urgencyColor+';font-size:11px;'}) : span('ops-muted','—'),
            statusBadge,
          ];
        })
      ));
      pfCard.appendChild(el('p',{cls:'ops-form-hint',text:'* MTBF requires ≥2 closed incidents for the asset. Assets with 1 incident have MTTR only. Methodology: Parsons Predicted Operational Equipment Failure Projections (2025).',style:'padding:8px 16px;font-size:10px;color:#475569;border-top:1px solid #1e2540;margin:0;'}));
      container.appendChild(pfCard);
    } else if (r.predicted_failures !== undefined) {
      var pfEmptyCard = div('ops-card'); pfEmptyCard.style.marginBottom='16px';
      pfEmptyCard.appendChild(div('ops-card-header',[el('h3',{text:'📈 Predicted Failures'})]));
      pfEmptyCard.appendChild(el('p',{cls:'ops-empty',text:'No closed deficiency history found. Predicted failure analysis requires at least one closed deficiency per asset.'}));
      container.appendChild(pfEmptyCard);
    }
}

async function viewHealthReport() {
  var wrap = div(''); setContent(wrap);

  var platforms = await API.platforms.list().catch(()=>[]);
  var platOpts  = [['','All Platforms']].concat(platforms.map(p=>[String(p.id),p.name]));
  var platSel   = el('select',{cls:'ops-select ops-select-sm'});
  platOpts.forEach(function([v,l]){ platSel.appendChild(el('option',{value:v,text:l})); });

  var hdr = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'🩺 Readiness Report'}));
  var hdrRight = div(''); hdrRight.style.cssText='display:flex;align-items:center;gap:10px;';
  hdrRight.appendChild(el('label',{text:'Platform:',style:'font-size:12px;color:#64748b;'}));
  hdrRight.appendChild(platSel);
  hdrRight.appendChild(btn('','↻ Refresh', function(){ renderReport(); }));
  var _pdfBtn = btn('','🖨 Export PDF', function(){
    if (_lastReport) printHealthReport(_lastReport, platSel.options[platSel.selectedIndex].text);
  });
  _pdfBtn.disabled = true;
  hdrRight.appendChild(_pdfBtn);
  hdr.appendChild(hdrRight);
  wrap.appendChild(hdr);

  var reportBody = div(''); wrap.appendChild(reportBody);
  var _lastReport = null;

  async function renderReport() {
    reportBody.innerHTML = '';
    reportBody.appendChild(el('div',{style:'padding:30px;text-align:center;color:#64748b;font-style:italic;',text:'Generating report…'}));
    var platformId = platSel.value ? parseInt(platSel.value) : null;
    var r = await API.healthReport.generate(platformId ? {platform_id:platformId} : {}).catch(function(e){
      reportBody.innerHTML='';
      reportBody.appendChild(el('p',{cls:'ops-empty',text:'Could not generate report: '+e.message}));
      return null;
    });
    if (!r) return;
    _lastReport = r;
    _pdfBtn.disabled = false;
    reportBody.innerHTML = '';
    renderHealthReportBody(reportBody, r);
  }

  platSel.onchange = renderReport;
  await renderReport();
}

async function viewImports() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header'); hdr.appendChild(el('h2',{text:'📥 Data Import'}));
  hdr.appendChild(btn('primary','+ New Import', () => showImportWizard(() => viewImports())));
  wrap.appendChild(hdr);
  wrap.appendChild(el('p',{cls:'ops-form-hint',text:'Bulk-load assets or deficiencies from CSV or JSON. Supports Generic and MB0001/3M CSMP profiles. Column mapping and validation run before any records are written.',style:'margin-bottom:16px;'}));

  var jobs = await API.imports.list().catch(()=>[]);
  if (!jobs.length) {
    var empty = div('ops-card'); empty.style.cssText='padding:40px;text-align:center;';
    empty.appendChild(el('p',{cls:'ops-empty',text:'No import jobs yet. Click + New Import to upload a file.'}));
    wrap.appendChild(empty);
    return;
  }

  var table = div('ops-card'); wrap.appendChild(table);
  var t = el('table',{cls:'ops-table',style:'width:100%;'}); table.appendChild(t);
  var thead = el('tr'); ['File','Type','Status','Total','Valid','Errors','Imported','Created',''].forEach(function(h){thead.appendChild(el('th',{text:h}));});
  t.appendChild(el('thead',{}).appendChild(thead) && el('thead'));
  // rebuild properly
  t.innerHTML = '';
  var thead2 = el('thead'); var hrow = el('tr');
  ['File','Type','Status','Total','Valid','Errors','Imported','Created',''].forEach(function(h){hrow.appendChild(el('th',{text:h}));});
  thead2.appendChild(hrow); t.appendChild(thead2);
  var tbody = el('tbody'); t.appendChild(tbody);

  jobs.forEach(function(j){
    var tr = el('tr');
    var nameCell = el('td'); nameCell.appendChild(el('span',{text:j.original_name||j.file_path.split('/').pop(),style:'font-weight:600;color:#e2e8f0;font-size:13px;'})); tr.appendChild(nameCell);
    tr.appendChild(el('td',{text:IMPORT_TYPE_LABELS[j.import_type]||j.import_type}));
    var sc = el('td'); sc.appendChild(span('ops-badge '+(IMPORT_STATUS_COLORS[j.status]||'badge-gray'), j.status)); tr.appendChild(sc);
    tr.appendChild(el('td',{text:j.total_rows!=null?j.total_rows:'—'}));
    tr.appendChild(el('td',{text:j.valid_rows!=null?j.valid_rows:'—',style:j.valid_rows>0?'color:#4ade80;':''}));
    tr.appendChild(el('td',{text:j.error_rows!=null?j.error_rows:'—',style:j.error_rows>0?'color:#f87171;':''}));
    tr.appendChild(el('td',{text:j.imported_rows!=null?j.imported_rows:'—',style:j.imported_rows>0?'color:#4ade80;font-weight:700;':''}));
    tr.appendChild(el('td',{text:j.created_at?j.created_at.slice(0,10):''}));
    var ac = el('td'); ac.style.cssText='white-space:nowrap;';
    ac.appendChild(btn('ops-btn-sm','View', () => navigate('import-detail', j.id)));
    if (j.status==='mapping'||j.status==='ready') ac.appendChild(btn('ops-btn-sm','Continue', () => viewImportDetail(j.id)));
    if (j.status==='done'||j.status==='failed') {
      ac.appendChild(btn('ops-btn-sm ops-btn-danger','✕', async () => {
        if(confirm('Delete this import job?')) { await API.imports.destroy(j.id); viewImports(); }
      }));
    }
    tr.appendChild(ac);
    tbody.appendChild(tr);
  });
}

async function viewImportDetail(id) {
  var wrap = div(''); setContent(wrap);
  var job = await API.imports.get(id).catch(()=>null);
  if (!job) { wrap.appendChild(el('p',{cls:'ops-empty',text:'Import job not found.'})); return; }

  var hdr = div('ops-page-header'); hdr.appendChild(el('h2',{text:'📥 Import — '+(job.original_name||'Job #'+id)}));
  hdr.appendChild(btn('','← Back', () => viewImports()));
  wrap.appendChild(hdr);

  // Status banner
  var banner = div('ops-card'); banner.style.cssText='padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:16px;';
  banner.appendChild(span('ops-badge ops-badge-lg '+(IMPORT_STATUS_COLORS[job.status]||'badge-gray'), job.status.toUpperCase()));
  var stats = div(''); stats.style.cssText='display:flex;gap:24px;flex:1;';
  var addStat = function(label,val,color){
    var s=div(''); s.style.cssText='text-align:center;';
    s.appendChild(el('div',{text:val!=null?String(val):'—',style:'font-size:22px;font-weight:800;color:'+(color||'#e2e8f0')+';'}));
    s.appendChild(el('div',{text:label,style:'font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.6px;'}));
    stats.appendChild(s);
  };
  addStat('Total',job.total_rows); addStat('Valid',job.valid_rows,'#4ade80'); addStat('Errors',job.error_rows,'#f87171'); addStat('Imported',job.imported_rows,'#38bdf8');
  banner.appendChild(stats);
  if (job.error_message) banner.appendChild(el('span',{text:'Error: '+job.error_message,style:'color:#f87171;font-size:12px;'}));
  wrap.appendChild(banner);

  // ── Column Mapping ────────────────────────────────────────────────────
  if (job.status === 'mapping' || job.status === 'ready') {
    var fields = await API.imports.fields({type: job.import_type}).catch(()=>({}));
    var fieldOpts = [['_skip','— Skip this column —']].concat(Object.entries(fields).filter(([k])=>k!=='_skip').map(([k,v])=>[k,v.label+(v.required?' *':'')]));

    var mapCard = div('ops-card'); mapCard.style.cssText='padding:24px;margin-bottom:16px;'; wrap.appendChild(mapCard);
    mapCard.appendChild(el('h3',{text:'Column Mapping',style:'margin:0 0 4px;font-size:15px;color:#e2e8f0;font-weight:700;'}));
    mapCard.appendChild(el('p',{text:'Map each column from your file to a target field. Use "Skip" for columns you do not want to import.',cls:'ops-form-hint',style:'margin-bottom:16px;'}));

    var currentMap = job.column_map || {};
    var mapSelects = {};
    var headers = job.detected_headers || [];

    var grid = div('ops-form-grid'); mapCard.appendChild(grid);
    headers.forEach(function(h){
      var lbl = el('label',{text:h,style:'font-size:12px;font-weight:600;color:#94a3b8;'});
      var selEl = sel(fieldOpts, currentMap[h]||'_skip');
      selEl.style.cssText='background:#0f172a;color:#e2e8f0;border:1px solid #3e4a65;border-radius:7px;padding:7px 10px;font-size:13px;width:100%;';
      mapSelects[h] = selEl;
      var fg = div(''); fg.style.cssText='display:flex;flex-direction:column;gap:4px;';
      fg.appendChild(lbl); fg.appendChild(selEl);
      grid.appendChild(fg);
    });

    // Preview table
    if (job.preview_rows && job.preview_rows.length) {
      mapCard.appendChild(el('h4',{text:'Preview (first 5 rows)',style:'margin:20px 0 8px;font-size:13px;color:#64748b;font-weight:700;'}));
      var pt = el('table',{style:'width:100%;border-collapse:collapse;font-size:12px;overflow-x:auto;'});
      var phr = el('tr');
      headers.forEach(function(h){phr.appendChild(el('th',{text:h,style:'text-align:left;padding:6px 8px;background:#0f172a;color:#64748b;font-size:11px;border-bottom:1px solid #2e3650;white-space:nowrap;'}));});
      pt.appendChild(phr);
      job.preview_rows.forEach(function(row){
        var tr2=el('tr');
        headers.forEach(function(h){tr2.appendChild(el('td',{text:row[h]||'',style:'padding:5px 8px;border-bottom:1px solid #1e2540;color:#94a3b8;font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}));});
        pt.appendChild(tr2);
      });
      mapCard.appendChild(pt);
    }

    var mapActions = div(''); mapActions.style.cssText='display:flex;gap:10px;margin-top:18px;';
    mapActions.appendChild(btn('primary','✓ Validate', async function(){
      var colMap = {};
      Object.entries(mapSelects).forEach(function([h,s]){colMap[h]=s.value;});
      var updated = await API.imports.map(id, {column_map:colMap});
      viewImportDetail(updated.id);
    }));
    mapCard.appendChild(mapActions);
  }

  // ── Validation Errors ────────────────────────────────────────────────
  if (job.validation_errors && job.validation_errors.length) {
    var errCard = div('ops-card'); errCard.style.cssText='padding:20px;margin-bottom:16px;border:1px solid rgba(248,113,113,0.3);'; wrap.appendChild(errCard);
    errCard.appendChild(el('h3',{text:'Validation Issues ('+job.validation_errors.length+')',style:'margin:0 0 12px;font-size:14px;color:#f87171;font-weight:700;'}));
    var et = el('table',{style:'width:100%;border-collapse:collapse;font-size:12px;'}); errCard.appendChild(et);
    var ehr=el('tr'); ['Row','Field','Issue'].forEach(function(h){ehr.appendChild(el('th',{text:h,style:'text-align:left;padding:6px 8px;background:#0f172a;color:#64748b;font-size:11px;'}));});
    et.appendChild(ehr);
    job.validation_errors.slice(0,50).forEach(function(e){
      var tr3=el('tr');
      tr3.appendChild(el('td',{text:e.row,style:'padding:5px 8px;color:#f87171;font-weight:700;border-bottom:1px solid #2e3650;'}));
      tr3.appendChild(el('td',{text:e.field,style:'padding:5px 8px;color:#94a3b8;border-bottom:1px solid #2e3650;font-family:monospace;'}));
      tr3.appendChild(el('td',{text:e.message,style:'padding:5px 8px;color:#94a3b8;border-bottom:1px solid #2e3650;'}));
      et.appendChild(tr3);
    });
    if (job.validation_errors.length > 50) errCard.appendChild(el('p',{text:'… and '+(job.validation_errors.length-50)+' more errors.',style:'color:#64748b;font-size:12px;margin:8px 0 0;'}));
  }

  // ── Execute ──────────────────────────────────────────────────────────
  if (job.status === 'ready') {
    var execCard = div('ops-card'); execCard.style.cssText='padding:20px;margin-bottom:16px;'; wrap.appendChild(execCard);
    execCard.appendChild(el('h3',{text:'Ready to Import',style:'margin:0 0 8px;font-size:14px;color:#4ade80;font-weight:700;'}));
    execCard.appendChild(el('p',{text:(job.valid_rows||0)+' valid rows will be imported. '+(job.error_rows||0)+' rows with errors will be skipped.',cls:'ops-form-hint',style:'margin-bottom:14px;'}));
    var execBtn = btn('primary','📥 Run Import', async function(){
      execBtn.disabled=true; execBtn.textContent='Importing…';
      try {
        var done = await API.imports.execute(id);
        viewImportDetail(done.id);
      } catch(e) { alert('Import failed: '+e.message); execBtn.disabled=false; execBtn.textContent='📥 Run Import'; }
    });
    execCard.appendChild(execBtn);
  }

  // ── Completion Summary ───────────────────────────────────────────────
  if (job.status === 'done') {
    var doneCard = div('ops-card'); doneCard.style.cssText='padding:20px;border:1px solid rgba(74,222,128,.3);'; wrap.appendChild(doneCard);
    doneCard.appendChild(el('h3',{text:'✓ Import Complete',style:'margin:0 0 8px;color:#4ade80;font-size:14px;font-weight:700;'}));
    var baseType = (job.import_type||'assets').split('/')[0];
    var typeLabel = baseType === 'deficiencies' ? 'deficiency records' : 'asset records';
    doneCard.appendChild(el('p',{text:(job.imported_rows||0)+' '+typeLabel+' imported successfully'+(job.error_rows?' · '+(job.error_rows)+' rows skipped':'')+'. Completed: '+(job.completed_at||'').slice(0,19)+'.',cls:'ops-form-hint'}));
    var navTarget = baseType === 'deficiencies' ? 'deficiencies' : 'assets';
    var navLabel  = baseType === 'deficiencies' ? 'View Deficiencies' : 'View Assets';
    doneCard.appendChild(btn('primary', navLabel, () => navigate(navTarget)));
    if (job.import_type && job.import_type.includes('mb0001') && baseType === 'assets') {
      doneCard.appendChild(el('p',{text:'HSC hierarchy has been built automatically. Check the Asset Registry tree view to verify parent-child relationships.',cls:'ops-form-hint',style:'margin-top:8px;color:#38bdf8;'}));
    }
  }
}

function showImportWizard(onDone) {
  var platforms = [];
  var importProfiles = [];
  API.platforms.list().then(function(p){platforms=p||[];}).catch(function(){});
  API.imports.profiles().then(function(p){
    importProfiles = p||[];
    if (profSelEl) {
      profSelEl.innerHTML = '';
      importProfiles.forEach(function(pr){
        var o = el('option',{value:pr.id,text:pr.label}); profSelEl.appendChild(o);
      });
      updateProfileDesc();
    }
  }).catch(function(){});

  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }

  // Profile selector (includes type + preset)
  var profSelEl = el('select',{cls:'ops-select'});
  [
    ['assets','Assets — Generic CSV/JSON'],
    ['assets/mb0001','Assets — MB0001 / 3M CSMP Export'],
    ['deficiencies','Deficiencies — Generic CSV/JSON'],
    ['deficiencies/mb0001','Deficiencies — MB0001 / 3M CSMP'],
  ].forEach(function([v,l]){ profSelEl.appendChild(el('option',{value:v,text:l})); });

  var descEl = el('p',{style:'font-size:12px;color:#64748b;margin:4px 0 0;min-height:32px;'});
  var profWrap = div('ops-form-full');
  profWrap.appendChild(el('label',{cls:'ops-form-label',text:'Import Profile'}));
  profWrap.appendChild(profSelEl);
  profWrap.appendChild(descEl);
  body.appendChild(profWrap);

  var PROFILE_DESCS = {
    'assets':               'Import asset records from any CSV or JSON. Columns auto-mapped from common header names.',
    'assets/mb0001':        'Navy 3M / CSMP asset export. Recognizes ESWBS/HSC, JCN, Work Center, Nomenclature. HSC hierarchy built automatically.',
    'deficiencies':         'Import deficiency records. Each row must reference an existing asset by name, serial, code, or ASSET-NNNN.',
    'deficiencies/mb0001':  'Outstanding work from 3M CSMP. JCN matches back to imported assets. Priority maps to severity (1=SEV-1 … 5=SEV-5).',
  };
  function updateProfileDesc() {
    descEl.textContent = PROFILE_DESCS[profSelEl.value] || '';
  }
  profSelEl.onchange = updateProfileDesc;
  updateProfileDesc();

  // File picker
  var fileWrap = div('ops-form-full'); fileWrap.appendChild(el('label',{cls:'ops-form-label',text:'File (Nextcloud path) *'}));
  var fileInp = inp('Select a CSV or JSON file from Nextcloud…','');
  var pickBtn = btn('ops-btn-sm','📂 Browse', function(){
    showFileBrowser(function(path){fileInp.value=path;}, {
      title:'📥 Select Import File',
      allowTypes:['csv','json'],
    });
  });
  var fpRow=div(''); fpRow.style.cssText='display:flex;gap:8px;';
  fpRow.appendChild(fileInp); fpRow.appendChild(pickBtn);
  fileWrap.appendChild(fpRow); body.appendChild(fileWrap);

  var fmtSel = add('File Format', sel([['csv','CSV (comma-separated, first row = headers)'],['json','JSON (array of objects)']],'csv'));
  var platOpts = [['','— All Platforms (assign later) —']];
  var platSel  = add('Assign to Platform', sel(platOpts,''));
  // Populate platforms when loaded
  API.platforms.list().then(function(p){
    platSel.innerHTML=''; [['','— All Platforms —']].concat((p||[]).map(function(pl){return [String(pl.id),pl.name];})).forEach(function([v,l]){platSel.appendChild(el('option',{value:v,text:l}));});
  }).catch(function(){});

  modal('New Import', body, async function(){
    if (!fileInp.value.trim()) throw new Error('Please select a file.');
    var job = await API.imports.create({
      file_path:     fileInp.value.trim(),
      original_name: fileInp.value.trim().split('/').pop(),
      file_format:   fmtSel.value,
      import_type:   profSelEl.value,
      platform_id:   platSel.value ? parseInt(platSel.value) : null,
    });
    if (onDone) onDone();
    navigate('import-detail', job.id);
  }, 'Upload & Analyze');
}

/* ── Failure Mode Taxonomy (S5000F) ── */

var FM_CATEGORIES = [
  ['electrical','⚡ Electrical'],['mechanical','⚙ Mechanical'],['software','💾 Software'],
  ['firmware','🔧 Firmware'],['environmental','🌡 Environmental'],['operator','👤 Operator'],
  ['wear','📉 Wear / Age'],['corrosion','🔩 Corrosion'],['contamination','☣ Contamination'],
  ['general','📋 General']
];

var FM_SUBCATEGORIES = {
  electrical: ['Open Circuit','Short Circuit','Overvoltage','Undervoltage','Ground Fault','Connector Failure','Cable/Wiring Damage','Power Supply Failure','Relay Failure','Fuse/Breaker Failure','EMI/RF Interference','Intermittent Contact'],
  mechanical: ['Fatigue Crack','Fracture/Break','Deformation/Bend','Seizure/Jam','Misalignment','Loose Fastener','Bearing Failure','Seal/Gasket Failure','Spring Failure','Gear/Drive Failure','Coupling Failure','Vibration-Induced Damage'],
  software:   ['Logic Error','Memory Leak','Buffer Overflow','Null Pointer / Crash','Configuration Corruption','Database Corruption','Deadlock / Race Condition','Unhandled Exception','Interface Mismatch','Timeout / Hang','Permission / Auth Failure'],
  firmware:   ['Flash Corruption','Boot Failure','Update Failure','Watchdog Timeout','Peripheral Driver Error','Register Corruption','Incorrect Parameter','CRC Failure','Communication Stack Error'],
  environmental:['Overtemperature','Undertemperature','Humidity Damage','Moisture Ingress','Shock/Impact Damage','Vibration Fatigue','UV Degradation','Dust/Particulate Ingress','Chemical Exposure','ESD Damage'],
  operator:   ['Incorrect Procedure','Improper Setup / Config','Overload / Over-Limit Operation','Failure to Inspect','Calibration Error','Unauthorized Modification','Training Gap'],
  wear:       ['Abrasive Wear','Adhesive Wear','Erosion','Fatigue Wear','Surface Pitting','Fretting','Delamination'],
  corrosion:  ['Galvanic Corrosion','Crevice Corrosion','Pitting Corrosion','Stress Corrosion Cracking','Oxidation','Rust'],
  contamination:['Particulate Contamination','Fluid Contamination','Chemical Contamination','Biological Growth','Cross-Contamination'],
  general:    ['Unknown / Unclassified','Infant Mortality','Random Failure','Wear-Out','Design Deficiency','Manufacturing Defect','Supplier/Material Issue'],
};

/* ── System Canvas ── */

var CANVAS_TYPES = [
  ['network','🌐 Network'],['hvac','❄ HVAC'],['power','⚡ Power'],
  ['rf','📡 RF / Signal'],['physical','🏢 Physical'],['custom','⚙ Custom']
];

async function viewCanvases() {
  var wrap = div(''); setContent(wrap);
  var hdrBtn = div(''); // dedicated slot — cleared each tab switch
  var hdr  = div('ops-page-header',[el('h2',{text:'System Canvas'}), hdrBtn]);
  wrap.appendChild(hdr);

  // Sub-tabs: Canvases | Component Library
  var activeTab = 'canvases';
  var tabs = div('ops-tab-bar');
  function mkTab(key,label) {
    var t = btn(key===activeTab?'ops-tab active':'ops-tab', label, ()=>{ activeTab=key; renderCanvasTab(); });
    tabs.appendChild(t);
  }
  mkTab('canvases','Canvases'); mkTab('library','Component Library');
  wrap.appendChild(tabs);

  var body = div(''); wrap.appendChild(body);

  async function renderCanvasTab() {
    tabs.querySelectorAll('.ops-tab').forEach(t=>t.classList.remove('active'));
    tabs.querySelectorAll('.ops-tab')[activeTab==='canvases'?0:1].classList.add('active');
    body.innerHTML = '';
    hdrBtn.innerHTML = '';

    if (activeTab === 'canvases') {
      hdrBtn.appendChild(btn('primary','+ New Canvas',()=>showCanvasForm(null,renderCanvasTab)));
      if (_selectedPlatformIds.length) {
        hdrBtn.appendChild(btn('','⚡ Auto-Generate Canvas', function(){ showAutoGenerateCanvasModal(_selectedPlatformIds[0], renderCanvasTab); }));
        hdrBtn.appendChild(btn('','🗺 Platform Drawing', function(){ openPlatformDrawing(_selectedPlatformIds[0]); }));
      }

      var [canvases, allAssets] = await Promise.all([
        API.canvases.list(_selectedPlatformIds.length?{platform_id:_selectedPlatformIds[0]}:{}).catch(()=>[]),
        getAssets().catch(()=>[])
      ]);
      var assetMap = {}; allAssets.forEach(function(a){assetMap[a.id]=a;});

      if (!canvases.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No canvases yet. Create one to start drawing your system.'})); return; }

      // Layer tabs — group by canvas_type
      var layerOrder = ['network','power','rf','hvac','physical','custom'];
      var presentTypes = [];
      layerOrder.forEach(function(lt){ if (canvases.find(function(c){return c.canvas_type===lt;})) presentTypes.push(lt); });
      canvases.forEach(function(c){ if (!layerOrder.includes(c.canvas_type)&&!presentTypes.includes(c.canvas_type)) presentTypes.push(c.canvas_type); });

      var activeLayer = presentTypes[0] || 'custom';
      var layerTabBar = div(''); layerTabBar.style.cssText='display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;';

      var tableArea = div(''); body.appendChild(layerTabBar); body.appendChild(tableArea);

      function renderLayer(lt) {
        activeLayer = lt;
        layerTabBar.querySelectorAll('button').forEach(function(b){
          b.style.background=b.dataset.lt===lt?'#1e4d7b':'';
          b.style.color=b.dataset.lt===lt?'#e2e8f0':'#64748b';
        });
        tableArea.innerHTML='';

        var layerCanvases = canvases.filter(function(c){return c.canvas_type===lt;});
        if (!layerCanvases.length) {
          tableArea.appendChild(el('p',{cls:'ops-empty',text:'No canvases for this layer.'}));
          return;
        }
        var card = div('ops-card'); tableArea.appendChild(card);
        card.appendChild(makeTable(
          ['Name','Rev','System Asset','Status','Updated',''],
          layerCanvases.map(function(c) {
            var viewB = btn('ops-btn-sm','👁 Open',function(){navigate('canvas-detail',c.id);});
            var editB = btn('ops-btn-sm','✏',function(){showCanvasForm(c,renderCanvasTab);});
            var delB  = btn('ops-btn-sm ops-btn-danger','✕',async function(){
              if (!confirm('Delete canvas "'+c.name+'"?')) return;
              await API.canvases.destroy(c.id); renderCanvasTab();
            });
            var g = div('ops-btn-group'); g.appendChild(viewB); g.appendChild(editB); g.appendChild(delB);
            var nameCell = div('');
            nameCell.appendChild(el('strong',{text:c.name,style:'cursor:pointer;color:#38bdf8;',onclick:function(){navigate('canvas-detail',c.id);}}));
            if (c.revision_required) { nameCell.appendChild(document.createTextNode(' ')); nameCell.appendChild(span('ops-badge badge-orange','⚠ Rev Req')); }
            var sysAsset = c.system_asset_id ? assetMap[c.system_asset_id] : null;
            var sysCell = sysAsset ? el('span',{text:sysAsset.name,style:'font-size:12px;color:#cbd5e1;'}) : span('ops-muted','—');
            var statusCell = div(''); statusCell.style.cssText='display:flex;gap:4px;flex-wrap:wrap;';
            statusCell.appendChild(c.is_live ? span('ops-badge badge-green','Live') : span('ops-badge badge-gray','Static'));
            if (c.drawing_doc_id) statusCell.appendChild(span('ops-badge badge-blue','Published'));
            return [
              nameCell,
              c.published_rev ? span('ops-mono ops-small',c.published_rev) : span('ops-muted','—'),
              sysCell,
              statusCell,
              c.updated_at ? c.updated_at.slice(0,10) : '—',
              g
            ];
          })
        ));
      }

      presentTypes.forEach(function(lt){
        var typeLabel = CANVAS_TYPES.find(function(t){return t[0]===lt;})?.[1] || lt;
        var count = canvases.filter(function(c){return c.canvas_type===lt;}).length;
        var tb = btn('ops-btn-sm', typeLabel+' ('+count+')', function(){renderLayer(lt);});
        tb.dataset.lt=lt;
        tb.style.cssText='transition:background .15s;color:#64748b;';
        layerTabBar.appendChild(tb);
      });

      renderLayer(activeLayer);

    } else {
      hdrBtn.appendChild(btn('primary','+ New Component',()=>showComponentLibForm(null,renderCanvasTab)));
      var items = await API.componentLib.list({}).catch(()=>[]);
      if (!items.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No component library entries yet.'})); return; }
      var card = div('ops-card'); body.appendChild(card);
      card.appendChild(makeTable(
        ['Name','Category','Asset Type','Mfr / Model','Criticality','NSN',''],
        items.map(i => {
          var editB = btn('ops-btn-sm','✏',()=>showComponentLibForm(i,renderCanvasTab));
          var delB  = btn('ops-btn-sm ops-btn-danger','✕',async()=>{
            if (!confirm('Delete "'+i.name+'"?')) return;
            await API.componentLib.destroy(i.id); renderCanvasTab();
          });
          var g = div('ops-btn-group'); g.appendChild(editB); g.appendChild(delB);
          return [
            el('strong',{text:i.name}),
            span('ops-badge badge-blue',i.category),
            span('ops-badge badge-gray',i.asset_type),
            [i.manufacturer,i.model_number].filter(Boolean).join(' / ') || span('ops-muted','—'),
            i.default_criticality ? critBadge(i.default_criticality) : span('ops-muted','—'),
            i.nsn ? span('ops-mono ops-small',i.nsn) : span('ops-muted','—'),
            g
          ];
        })
      ));
    }
  }

  await renderCanvasTab();
}

async function viewCanvasDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var [canvas, allAssets] = await Promise.all([
    API.canvases.get(id).catch(()=>null),
    getAssets().catch(()=>[])
  ]);
  if (!canvas) { setContent(el('div',{cls:'ops-empty',text:'Canvas not found.'})); return; }
  var assetById = {}; allAssets.forEach(function(a){ assetById[a.id]=a; });

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Canvases',()=>navigate('canvases')));
  hdr.appendChild(el('h2',{text:canvas.name}));
  hdr.appendChild(span('ops-badge badge-blue', CANVAS_TYPES.find(function(t){return t[0]===canvas.canvas_type;})?.[1]||canvas.canvas_type));
  hdr.appendChild(span('ops-mono ops-small','Rev '+canvas.version));
  if (canvas.is_live) hdr.appendChild(span('ops-badge badge-green','● Live Sync'));
  if (canvas.revision_required) hdr.appendChild(span('ops-badge badge-orange','⚠ Revision Required'));
  if (canvas.published_at) hdr.appendChild(span('ops-mono ops-small','Published '+canvas.published_rev+' · '+canvas.published_at.slice(0,10)));
  if (canvas.drawing_doc_id) hdr.appendChild(btn('','📄 View Drawing',async function(){
    var doc=await API.documents.get(canvas.drawing_doc_id).catch(()=>null);
    var revs=doc?await API.documents.getRevisions(canvas.drawing_doc_id).catch(()=>[]):[];
    if (doc) openMilStdDrawing(canvas, doc, revs, nodes||[]);
  }));
  hdr.appendChild(btn('primary','📐 Publish Drawing',function(){showPublishDrawingForm(canvas,function(){viewCanvasDetail(id);});}));
  hdr.appendChild(btn('','✏ Edit',function(){showCanvasForm(canvas,function(){viewCanvasDetail(id);});}));
  wrap.appendChild(hdr);

  // ── Canvas editor ────────────────────────────────────────────
  var NS = 'http://www.w3.org/2000/svg';
  var cd = JSON.parse(canvas.canvas_data || '{"nodes":[],"edges":[]}');
  var nodes = cd.nodes || [];
  var edges = cd.edges || [];
  canvas._nodeCache = nodes;

  // Enrich nodes that have an asset_id but are missing human-readable fields
  // (covers nodes created before this sprint or with the old plain-label form)
  nodes.forEach(function(node) {
    if (!node.asset_id) return;
    var a = assetById[node.asset_id] || assetById[String(node.asset_id)];
    if (!a) return;
    if (!node.asset_name || node.asset_name === node.label) node.asset_name = a.name || node.asset_name;
    if (!node.asset_code)   node.asset_code   = a.asset_id_label || '';
    if (!node.manufacturer) node.manufacturer = a.manufacturer   || '';
    if (!node.model_number) node.model_number = a.model          || '';
    if (!node.nsn)          node.nsn          = a.nsn            || a.part_number || '';
    if (!node.cage_code)    node.cage_code    = a.cage_code      || '';
    if (!node.criticality)  node.criticality  = a.criticality    || null;
  });

  // Connection types: [id, label, color, dash-pattern]
  var CONN_TYPES = [
    ['fiber',      'Fiber Optic',    '#f97316', '8,3'],
    ['ethernet',   'Ethernet / Cat', '#4ade80', ''],
    ['coax',       'Coaxial',        '#fbbf24', '3,3'],
    ['serial_232', 'RS-232 Serial',  '#a78bfa', '6,2'],
    ['serial_485', 'RS-485 Serial',  '#c4b5fd', '4,2'],
    ['power_ac',   'Power (AC)',     '#f87171', ''],
    ['power_dc',   'Power (DC)',     '#60a5fa', ''],
    ['waveguide',  'Waveguide',      '#22d3ee', '2,4'],
    ['optical',    'Optical',        '#f472b6', '5,2'],
    ['can_bus',    'CAN Bus',        '#fb923c', '3,2'],
    ['other',      'Other',          '#94a3b8', ''],
  ];
  var CONN_MAP = {}; CONN_TYPES.forEach(function(c){CONN_MAP[c[0]]=c;});

  // Editor state
  var selId      = null;
  var edgeMode   = false;
  var edgeSrc    = null;
  var dragging   = null;   // {id, ox, oy, sx, sy}
  var panning    = null;   // {sx, sy, px, py}
  var pan        = {x:40, y:40};
  var statuses   = {};     // asset_id (string) → {sev, sev_count, loto, overdue}
  var dirty      = false;

  var NODE_BG    = {hardware:'#1e3a5f',software:'#1a3020',network:'#2d1a5f',firmware:'#3a2800',custom:'#2a1a1a'};
  var GRID       = 10;

  // ── Toolbar ──────────────────────────────────────────────────
  var editorCard = div('ops-card');
  var toolbar = div('');
  toolbar.style.cssText='display:flex;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid #2e3650;flex-wrap:wrap;background:#0d1117;border-radius:8px 8px 0 0;';

  var addNodeBtn  = btn('ops-btn-sm','+ Node', doAddNode);
  var edgeModeBtn = btn('ops-btn-sm','↔ Connect', toggleEdgeMode);
  var delBtn      = btn('ops-btn-sm ops-btn-danger','✕ Delete', doDelete);
  delBtn.id='cvs-del'; delBtn.style.display='none';
  var saveBtn     = btn('primary ops-btn-sm','💾 Save', doSave);
  var syncBtn     = btn('ops-btn-sm','⟳ Sync Registry', doSync);
  if (!canvas.is_live || !canvas.system_asset_id) syncBtn.style.display='none';
  var statusBtn   = btn('ops-btn-sm','📡 Live Status', doLiveStatus);

  // Legend
  var legend = div('');
  legend.style.cssText='display:flex;gap:10px;align-items:center;margin-left:auto;flex-wrap:wrap;';
  [['#4ade80','Healthy'],['#fbbf24','Overdue'],['#fb923c','Def'],['#f87171','Critical'],['#f97316','LOTO']].forEach(function(c){
    var dot=div(''); dot.style.cssText='width:9px;height:9px;border-radius:50%;background:'+c[0]+';flex-shrink:0;';
    var lbl=el('span',{text:c[1],style:'color:#475569;font-size:10px;'});
    var g2=div(''); g2.style.cssText='display:flex;align-items:center;gap:3px;'; g2.appendChild(dot); g2.appendChild(lbl);
    legend.appendChild(g2);
  });
  // Connection type line swatches
  var sep=el('span',{text:'|',style:'color:#2e3650;'});
  legend.appendChild(sep);
  CONN_TYPES.forEach(function(ct){
    var swatch=div(''); swatch.style.cssText='width:18px;height:3px;background:'+ct[2]+';border-radius:2px;flex-shrink:0;';
    var lbl2=el('span',{text:ct[1].split(' ')[0],style:'color:#475569;font-size:9px;'});
    var g3=div(''); g3.style.cssText='display:flex;align-items:center;gap:3px;'; g3.appendChild(swatch); g3.appendChild(lbl2);
    legend.appendChild(g3);
  });

  [addNodeBtn,edgeModeBtn,delBtn,saveBtn,syncBtn,statusBtn,legend].forEach(function(b){ toolbar.appendChild(b); });
  editorCard.appendChild(toolbar);

  // ── SVG area ─────────────────────────────────────────────────
  var svgWrap = div('');
  svgWrap.style.cssText='position:relative;overflow:hidden;height:580px;background:#0d1117;cursor:grab;border-radius:0 0 8px 8px;';
  var svgEl = document.createElementNS(NS,'svg');
  svgEl.style.cssText='width:100%;height:100%;user-select:none;';
  var gRoot = document.createElementNS(NS,'g');
  gRoot.setAttribute('id','cvs-g');
  svgEl.appendChild(gRoot);
  svgWrap.appendChild(svgEl);
  editorCard.appendChild(svgWrap);

  // ── Side panel ───────────────────────────────────────────────
  var sidePanel = div('ops-card');
  sidePanel.style.cssText='margin-top:12px;display:none;';
  var sidePanelBody = div(''); sidePanelBody.style.padding='16px';
  sidePanel.appendChild(sidePanelBody);

  wrap.appendChild(editorCard);
  wrap.appendChild(sidePanel);
  setContent(wrap);

  // ── Render ───────────────────────────────────────────────────
  function applyPan() { gRoot.setAttribute('transform','translate('+pan.x+','+pan.y+')'); }

  function render() {
    gRoot.innerHTML='';

    // Arrowhead markers — one per connection type color
    var defs=document.createElementNS(NS,'defs');
    CONN_TYPES.forEach(function(ct){
      var mid=document.createElementNS(NS,'marker');
      mid.setAttribute('id','cvs-arr-'+ct[0]);
      mid.setAttribute('markerWidth','8'); mid.setAttribute('markerHeight','6');
      mid.setAttribute('refX','7'); mid.setAttribute('refY','3'); mid.setAttribute('orient','auto');
      var poly=document.createElementNS(NS,'polygon');
      poly.setAttribute('points','0 0,8 3,0 6'); poly.setAttribute('fill',ct[2]);
      mid.appendChild(poly); defs.appendChild(mid);
    });
    // Fallback gray arrow
    var defMark=document.createElementNS(NS,'marker');
    defMark.setAttribute('id','cvs-arr-default'); defMark.setAttribute('markerWidth','8'); defMark.setAttribute('markerHeight','6');
    defMark.setAttribute('refX','7'); defMark.setAttribute('refY','3'); defMark.setAttribute('orient','auto');
    var defPoly=document.createElementNS(NS,'polygon');
    defPoly.setAttribute('points','0 0,8 3,0 6'); defPoly.setAttribute('fill','#334155');
    defMark.appendChild(defPoly); defs.appendChild(defMark);
    gRoot.appendChild(defs);

    // Edges
    edges.forEach(function(edge) {
      var src=nodes.find(function(n){return n.id===edge.from;});
      var dst=nodes.find(function(n){return n.id===edge.to;});
      if (!src||!dst) return;
      var x1=src.x+(src.w||150)/2, y1=src.y+(src.h||60)/2;
      var x2=dst.x+(dst.w||150)/2, y2=dst.y+(dst.h||60)/2;

      var ct=edge.conn_type ? CONN_MAP[edge.conn_type] : null;
      var strokeColor = ct ? ct[2] : '#334155';
      var dashArray   = ct && ct[3] ? ct[3] : '';
      var markerId    = ct ? 'cvs-arr-'+ct[0] : 'cvs-arr-default';

      // Hit-target (wider invisible line)
      var hit=document.createElementNS(NS,'line');
      hit.setAttribute('x1',x1); hit.setAttribute('y1',y1);
      hit.setAttribute('x2',x2); hit.setAttribute('y2',y2);
      hit.setAttribute('stroke','transparent'); hit.setAttribute('stroke-width','10');
      hit.style.cursor='pointer';
      hit.addEventListener('click',function(e){
        e.stopPropagation();
        var typeLabel = ct ? ct[1] : 'Untyped';
        if (confirm('Connection: '+typeLabel+(edge.label?' ('+edge.label+')':'')+'\n\nDelete this connection?')) {
          edges=edges.filter(function(ed){return ed!==edge;}); dirty=true; render();
        }
      });
      gRoot.appendChild(hit);

      var line=document.createElementNS(NS,'line');
      line.setAttribute('x1',x1); line.setAttribute('y1',y1);
      line.setAttribute('x2',x2); line.setAttribute('y2',y2);
      line.setAttribute('stroke',strokeColor); line.setAttribute('stroke-width','2');
      if (dashArray) line.setAttribute('stroke-dasharray',dashArray);
      line.setAttribute('marker-end','url(#'+markerId+')');
      line.setAttribute('pointer-events','none');
      gRoot.appendChild(line);

      // Mid-point label: type abbreviation + optional label
      var mx=(x1+x2)/2, my=(y1+y2)/2;
      var abbr = ct ? ct[1].split(' ')[0].toUpperCase().slice(0,4) : '';
      var midText = [abbr, edge.label].filter(Boolean).join(' · ');
      if (midText) {
        var bg=document.createElementNS(NS,'rect');
        var textW=midText.length*5+8;
        bg.setAttribute('x',mx-textW/2); bg.setAttribute('y',my-9);
        bg.setAttribute('width',textW); bg.setAttribute('height',13);
        bg.setAttribute('fill','#0d1117'); bg.setAttribute('rx','3');
        bg.setAttribute('pointer-events','none');
        gRoot.appendChild(bg);
        var lt=document.createElementNS(NS,'text');
        lt.setAttribute('x',mx); lt.setAttribute('y',my);
        lt.setAttribute('text-anchor','middle'); lt.setAttribute('dominant-baseline','middle');
        lt.setAttribute('font-size','8'); lt.setAttribute('fill',strokeColor);
        lt.setAttribute('pointer-events','none'); lt.setAttribute('font-weight','700');
        lt.textContent=midText;
        gRoot.appendChild(lt);
      }
    });

    // Criticality dot colors
    var CRIT_COLORS = {CR:'#f87171',DE:'#fb923c',RD:'#fbbf24',SP:'#38bdf8',AD:'#64748b'};

    // Nodes
    nodes.forEach(function(node) {
      var nw=node.w||150, nh=node.h||60;
      var isSel=node.id===selId;
      var st=node.asset_id ? (statuses[node.asset_id]||statuses[String(node.asset_id)]) : null;

      var borderColor='#2e3650', borderWidth=1;
      if (isSel)   { borderColor='#38bdf8'; borderWidth=2; }
      if (edgeMode && edgeSrc===node.id) { borderColor='#a78bfa'; borderWidth=2; }
      if (st) {
        if (st.overdue && !isSel)              { borderColor='#fbbf24'; borderWidth=2; }
        if (st.sev_count>0 && st.sev>=3)      { borderColor='#fb923c'; borderWidth=2; }
        if (st.sev_count>0 && st.sev<=2)      { borderColor='#f87171'; borderWidth=2; }
        if (st.loto)                           { borderColor='#f97316'; borderWidth=2; }
      }

      var ng=document.createElementNS(NS,'g');
      ng.setAttribute('data-id',node.id);
      ng.style.cursor=edgeMode?'crosshair':'pointer';

      var rect=document.createElementNS(NS,'rect');
      rect.setAttribute('x',node.x); rect.setAttribute('y',node.y);
      rect.setAttribute('width',nw); rect.setAttribute('height',nh);
      rect.setAttribute('rx','6'); rect.setAttribute('fill',NODE_BG[node.type]||NODE_BG.custom);
      rect.setAttribute('stroke',borderColor); rect.setAttribute('stroke-width',borderWidth);
      ng.appendChild(rect);

      // Line 1: asset name (the primary identity — what the thing IS)
      var nameLine = node.asset_name || node.label || '';
      var nameT=document.createElementNS(NS,'text');
      nameT.setAttribute('x',node.x+nw/2); nameT.setAttribute('y',node.y+20);
      nameT.setAttribute('text-anchor','middle'); nameT.setAttribute('dominant-baseline','middle');
      nameT.setAttribute('font-size','11'); nameT.setAttribute('font-weight','700');
      nameT.setAttribute('fill','#e2e8f0'); nameT.setAttribute('pointer-events','none');
      nameT.textContent=nameLine.length>20?nameLine.slice(0,19)+'…':nameLine;
      ng.appendChild(nameT);

      // Line 2: manufacturer + model (falls back gracefully)
      var modelLine = [node.manufacturer, node.model_number].filter(Boolean).join(' · ') || node.asset_code || '';
      if (modelLine) {
        var divL=document.createElementNS(NS,'line');
        divL.setAttribute('x1',node.x+8); divL.setAttribute('y1',node.y+32);
        divL.setAttribute('x2',node.x+nw-8); divL.setAttribute('y2',node.y+32);
        divL.setAttribute('stroke','#1e2540'); divL.setAttribute('stroke-width','1');
        ng.appendChild(divL);
        var modelT=document.createElementNS(NS,'text');
        modelT.setAttribute('x',node.x+nw/2); modelT.setAttribute('y',node.y+46);
        modelT.setAttribute('text-anchor','middle'); modelT.setAttribute('dominant-baseline','middle');
        modelT.setAttribute('font-size','8'); modelT.setAttribute('fill','#64748b');
        modelT.setAttribute('pointer-events','none');
        modelT.textContent=modelLine.length>22?modelLine.slice(0,21)+'…':modelLine;
        ng.appendChild(modelT);
      }

      // Criticality dot top-left
      if (node.criticality && CRIT_COLORS[node.criticality]) {
        var critC=document.createElementNS(NS,'circle');
        critC.setAttribute('cx',node.x+8); critC.setAttribute('cy',node.y+8);
        critC.setAttribute('r','5'); critC.setAttribute('fill',CRIT_COLORS[node.criticality]);
        critC.setAttribute('pointer-events','none');
        ng.appendChild(critC);
        var critT=document.createElementNS(NS,'text');
        critT.setAttribute('x',node.x+8); critT.setAttribute('y',node.y+8);
        critT.setAttribute('text-anchor','middle'); critT.setAttribute('dominant-baseline','middle');
        critT.setAttribute('font-size','6'); critT.setAttribute('fill','#000'); critT.setAttribute('font-weight','800');
        critT.setAttribute('pointer-events','none');
        critT.textContent=node.criticality;
        ng.appendChild(critT);
      }

      // Status badge top-right
      if (st && (st.sev_count>0||st.loto||st.overdue)) {
        var bc=st.loto?'#f97316':st.sev_count>0?'#f87171':'#fbbf24';
        var bt=st.loto?'🔒':String(st.sev_count||'!');
        var br=document.createElementNS(NS,'circle');
        br.setAttribute('cx',node.x+nw-8); br.setAttribute('cy',node.y+8);
        br.setAttribute('r','7'); br.setAttribute('fill',bc); br.setAttribute('stroke','#0d1117'); br.setAttribute('stroke-width','1');
        ng.appendChild(br);
        var brt=document.createElementNS(NS,'text');
        brt.setAttribute('x',node.x+nw-8); brt.setAttribute('y',node.y+8);
        brt.setAttribute('text-anchor','middle'); brt.setAttribute('dominant-baseline','middle');
        brt.setAttribute('font-size','7'); brt.setAttribute('fill','#000'); brt.setAttribute('font-weight','700');
        brt.setAttribute('pointer-events','none');
        brt.textContent=bt;
        ng.appendChild(brt);
      } else if (st) {
        var okC=document.createElementNS(NS,'circle');
        okC.setAttribute('cx',node.x+nw-8); okC.setAttribute('cy',node.y+8);
        okC.setAttribute('r','5'); okC.setAttribute('fill','#4ade80'); okC.setAttribute('stroke','#0d1117'); okC.setAttribute('stroke-width','1');
        ng.appendChild(okC);
      }

      // Mouse events
      ng.addEventListener('mousedown',function(e){
        e.stopPropagation();
        if (edgeMode) {
          if (!edgeSrc) { edgeSrc=node.id; render(); }
          else if (edgeSrc!==node.id) {
            var fromId=edgeSrc, toId=node.id;
            edgeSrc=null; render();
            // Connection type modal
            var eWrap=div('');
            eWrap.style.cssText='display:flex;flex-direction:column;gap:12px;';
            var fromNode=nodes.find(function(n){return n.id===fromId;});
            var toNode=nodes.find(function(n){return n.id===toId;});
            eWrap.appendChild(el('div',{
              text:(fromNode?fromNode.asset_name||fromNode.label:'?')+' → '+(toNode?toNode.asset_name||toNode.label:'?'),
              style:'color:#94a3b8;font-size:12px;border-bottom:1px solid #2e3650;padding-bottom:8px;'
            }));
            var ctOpts=CONN_TYPES.map(function(c){return [c[0],c[1]];});
            var ctSel=sel(ctOpts,'ethernet');
            var lbl2=inp('Optional description / signal name','');
            eWrap.appendChild(fg('Connection Type *',ctSel));
            eWrap.appendChild(fg('Label (optional)',lbl2));
            // Color preview strip
            var preview=div(''); preview.style.cssText='height:4px;border-radius:2px;margin-top:-4px;background:'+CONN_MAP[ctSel.value][2]+';';
            eWrap.appendChild(preview);
            ctSel.addEventListener('change',function(){
              preview.style.background=CONN_MAP[ctSel.value]?CONN_MAP[ctSel.value][2]:'#334155';
            });
            modal('Add Connection', eWrap, function(){
              edges.push({id:'e'+Date.now(),from:fromId,to:toId,conn_type:ctSel.value,label:lbl2.value.trim()});
              dirty=true; render();
            }, 'Add Connection');
          }
          return;
        }
        selId=node.id;
        document.getElementById('cvs-del').style.display='';
        showSidePanel(node);
        var svgRect=svgEl.getBoundingClientRect();
        dragging={id:node.id,ox:node.x,oy:node.y,sx:e.clientX-svgRect.left,sy:e.clientY-svgRect.top};
        render();
      });
      gRoot.appendChild(ng);
    });

    applyPan();
  }

  // ── Mouse handlers ────────────────────────────────────────────
  svgWrap.addEventListener('mousedown',function(e){
    if (e.target===svgEl||e.target===gRoot) {
      selId=null; document.getElementById('cvs-del').style.display='none';
      sidePanel.style.display='none';
      panning={sx:e.clientX,sy:e.clientY,px:pan.x,py:pan.y};
      svgWrap.style.cursor='grabbing';
      render();
    }
  });
  function onMouseMove(e) {
    if (dragging) {
      var svgRect=svgEl.getBoundingClientRect();
      var node=nodes.find(function(n){return n.id===dragging.id;});
      if (node) {
        node.x=Math.round((dragging.ox+(e.clientX-svgRect.left-dragging.sx))/GRID)*GRID;
        node.y=Math.round((dragging.oy+(e.clientY-svgRect.top -dragging.sy))/GRID)*GRID;
        dirty=true; render();
      }
    } else if (panning) {
      pan.x=panning.px+(e.clientX-panning.sx);
      pan.y=panning.py+(e.clientY-panning.sy);
      applyPan();
    }
  }
  function onMouseUp() {
    dragging=null; panning=null; svgWrap.style.cursor=edgeMode?'crosshair':'grab';
  }
  window.addEventListener('mousemove',onMouseMove);
  window.addEventListener('mouseup',onMouseUp);
  // Clean up on navigate away
  var _origSetContent = setContent;
  function cleanupListeners() { window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp); }

  // ── Toolbar actions ───────────────────────────────────────────
  function toggleEdgeMode() {
    edgeMode=!edgeMode; edgeSrc=null;
    edgeModeBtn.style.background=edgeMode?'#1e4d7b':'';
    edgeModeBtn.textContent=edgeMode?'↔ Connect (ESC to cancel)':'↔ Connect';
    svgWrap.style.cursor=edgeMode?'crosshair':'grab';
    render();
  }
  document.addEventListener('keydown',function esc(e){
    if(e.key==='Escape'&&edgeMode){ edgeMode=false; edgeSrc=null; edgeModeBtn.style.background=''; edgeModeBtn.textContent='↔ Connect'; svgWrap.style.cursor='grab'; render(); }
  },{once:false});

  function doDelete() {
    if (!selId) return;
    if (!confirm('Delete selected node and its connections?')) return;
    nodes=nodes.filter(function(n){return n.id!==selId;});
    edges=edges.filter(function(e){return e.from!==selId&&e.to!==selId;});
    selId=null; dirty=true; document.getElementById('cvs-del').style.display='none';
    sidePanel.style.display='none'; render();
  }

  async function doAddNode() {
    var allAssets=await API.assets.list({}).catch(()=>[]);
    var selected=null;

    var wrap=div('');
    // Search box
    var searchInp=inp('Search by name or code…','');
    searchInp.style.cssText='width:100%;margin-bottom:10px;';
    wrap.appendChild(searchInp);

    // Asset list
    var listBox=div('');
    listBox.style.cssText='max-height:220px;overflow-y:auto;border:1px solid #2e3650;border-radius:6px;margin-bottom:12px;';

    function renderList(filter) {
      listBox.innerHTML='';
      var shown=allAssets.filter(function(a){
        if (!filter) return true;
        var f=filter.toLowerCase();
        return (a.name||'').toLowerCase().includes(f)||(a.asset_id_label||'').toLowerCase().includes(f);
      }).slice(0,60);
      if (!shown.length) { listBox.appendChild(el('div',{text:'No assets found.',style:'padding:12px;color:#475569;font-size:12px;'})); return; }
      shown.forEach(function(a){
        var row=div('');
        row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #1a2035;';
        row.onmouseover=function(){row.style.background='rgba(56,189,248,0.07)';};
        row.onmouseout=function(){row.style.background=selected&&selected.id===a.id?'rgba(56,189,248,0.12)':'';};
        if (selected&&selected.id===a.id) row.style.background='rgba(56,189,248,0.12)';
        var critColorMap={CR:'#f87171',DE:'#fb923c',RD:'#fbbf24',SP:'#38bdf8',AD:'#64748b'};
        var crit=el('span',{text:a.criticality||'—',style:'font-size:10px;font-weight:800;color:'+(critColorMap[a.criticality]||'#64748b')+';width:18px;'});
        var code=el('span',{text:a.asset_id_label||'',style:'font-family:monospace;font-size:11px;color:#38bdf8;min-width:100px;'});
        var name=el('span',{text:a.name,style:'font-size:12px;color:#e2e8f0;flex:1;'});
        var type=el('span',{text:a.asset_type||'',style:'font-size:10px;color:#475569;'});
        row.appendChild(crit); row.appendChild(code); row.appendChild(name); row.appendChild(type);
        row.addEventListener('click',function(){
          selected=a;
          listBox.querySelectorAll('div').forEach(function(r){r.style.background='';});
          row.style.background='rgba(56,189,248,0.12)';
          previewBox.innerHTML='';
          previewBox.appendChild(el('div',{text:a.asset_id_label+' — '+a.name,style:'font-weight:700;color:#e2e8f0;margin-bottom:4px;'}));
          previewBox.appendChild(el('div',{text:'Type: '+(a.asset_type||'—')+'  |  Criticality: '+(a.criticality||'—')+'  |  Status: '+(a.status||'—'),style:'font-size:11px;color:#64748b;'}));
        });
        listBox.appendChild(row);
      });
    }
    renderList('');
    searchInp.addEventListener('input',function(){renderList(searchInp.value);});

    // Manual node option at bottom
    var orDiv=el('div',{text:'— or add a manual (non-asset) node —',style:'font-size:10px;color:#475569;text-align:center;margin:8px 0 6px;'});
    var manualRow=div('ops-form-grid');
    var manLbl=inp('Label for manual node','');
    var manTyp=sel([['hardware','Hardware'],['network','Network'],['software','Software'],['firmware','Firmware'],['custom','Custom']],'hardware');
    manualRow.appendChild(fg('Label',manLbl));
    manualRow.appendChild(fg('Type',manTyp));

    // Preview
    var previewBox=div('');
    previewBox.style.cssText='background:#0f172a;border-radius:6px;padding:8px 12px;min-height:36px;margin-bottom:8px;font-size:12px;color:#64748b;';
    previewBox.textContent='Select an asset above, or fill in a manual node label below.';

    wrap.appendChild(listBox);
    wrap.appendChild(previewBox);
    wrap.appendChild(orDiv);
    wrap.appendChild(manualRow);

    modal('Add Canvas Node', wrap, function(){
      var nx=Math.round((120-pan.x)/GRID)*GRID, ny=Math.round((80-pan.y)/GRID)*GRID;
      if (selected) {
        nodes.push({
          id:'n'+Date.now(),
          label:        selected.asset_id_label||selected.name,
          asset_code:   selected.asset_id_label||'',
          asset_name:   selected.name||'',
          asset_id:     selected.id,
          criticality:  selected.criticality||null,
          type:         selected.asset_type||'hardware',
          manufacturer: selected.manufacturer||'',
          model_number: selected.model||'',
          nsn:          selected.nsn||selected.part_number||'',
          cage_code:    selected.cage_code||'',
          x:nx, y:ny, w:150, h:60
        });
      } else if (manLbl.value.trim()) {
        nodes.push({
          id:'n'+Date.now(),
          label:        manLbl.value.trim(),
          asset_code:   '',
          asset_name:   manLbl.value.trim(),
          asset_id:     null,
          criticality:  null,
          type:         manTyp.value,
          manufacturer: '',
          model_number: '',
          nsn:          '',
          cage_code:    '',
          x:nx, y:ny, w:150, h:60
        });
      } else {
        throw new Error('Select an asset or enter a manual label.');
      }
      dirty=true; render();
    }, 'Add Node');
  }

  async function doSave() {
    saveBtn.textContent='Saving…'; saveBtn.disabled=true;
    try {
      await API.canvases.update(id,{canvas_data:JSON.stringify({nodes:nodes,edges:edges}),last_synced_at:new Date().toISOString().slice(0,19)});
      dirty=false; saveBtn.textContent='💾 Save';
    } catch(e) { saveBtn.textContent='⚠ Error'; }
    saveBtn.disabled=false;
  }

  async function doSync() {
    if (!canvas.system_asset_id) return;
    syncBtn.textContent='Syncing…'; syncBtn.disabled=true;
    var allAssets=await API.assets.list({}).catch(()=>[]);
    function treeLayout(assetId,x,y) {
      var asset=allAssets.find(function(a){return a.id===assetId;});
      if (!asset) return;
      if (!nodes.find(function(n){return n.asset_id===assetId;})) {
        nodes.push({
          id:'n'+assetId,
          label:        asset.asset_id_label||asset.name,
          asset_code:   asset.asset_id_label||'',
          asset_name:   asset.name||'',
          asset_id:     assetId,
          criticality:  asset.criticality||null,
          type:         asset.asset_type||'hardware',
          manufacturer: asset.manufacturer||'',
          model_number: asset.model||'',
          nsn:          asset.nsn||asset.part_number||'',
          cage_code:    asset.cage_code||'',
          x:x, y:y, w:150, h:60
        });
      }
      var children=allAssets.filter(function(a){return a.parent_id===assetId;});
      var startX=x-Math.floor(children.length/2)*180;
      children.forEach(function(child,i){treeLayout(child.id,startX+i*180,y+80);});
    }
    treeLayout(canvas.system_asset_id, 300, 40);
    dirty=true; render();
    syncBtn.textContent='⟳ Sync Registry'; syncBtn.disabled=false;
  }

  async function doLiveStatus() {
    statusBtn.textContent='Loading…'; statusBtn.disabled=true;
    try {
      var s=await API.canvases.status(id);
      statuses=s||{};
    } catch(e) { statuses={}; }
    render();
    statusBtn.textContent='📡 Live Status'; statusBtn.disabled=false;
  }

  var CRIT_COLORS_PANEL = {CR:'#f87171',DE:'#fb923c',RD:'#fbbf24',SP:'#38bdf8',AD:'#64748b'};

  async function showSidePanel(node) {
    sidePanelBody.innerHTML='';
    sidePanel.style.display='';
    sidePanel.scrollIntoView({behavior:'smooth',block:'nearest'});

    // Fetch live asset record if linked
    var asset = null;
    if (node.asset_id) {
      sidePanelBody.appendChild(el('div',{text:'Loading…',style:'color:#475569;font-size:12px;padding:8px 0;'}));
      asset = await API.assets.get(node.asset_id).catch(()=>null);
      sidePanelBody.innerHTML='';
    }

    // Merge: prefer live asset data but fall back to node cache
    var name    = (asset&&asset.name)     || node.asset_name || node.label || '—';
    var mfr     = (asset&&asset.manufacturer) || node.manufacturer || '';
    var model   = (asset&&asset.model)    || node.model_number || '';
    var serial  = (asset&&asset.serial_number) || '';
    var locStr  = (asset&&asset.location) || '';
    var ipAddr  = (asset&&asset.ip_address) || '';
    var crit    = (asset&&asset.criticality) || node.criticality || '';
    var aType   = (asset&&asset.asset_type) || node.type || '';
    var aStatus = (asset&&asset.status) || '';
    var aCode   = (asset&&asset.asset_id_label) || node.asset_code || '';
    var nsn     = (asset&&(asset.nsn||asset.national_stock_number)) || node.nsn || '';
    var partNum = (asset&&asset.part_number) || '';
    var cageCode= (asset&&asset.cage_code) || node.cage_code || '';
    var fwVer   = (asset&&asset.firmware_version) || '';
    var swVer   = (asset&&asset.software_version) || '';
    var warranty= (asset&&asset.warranty_expiry) || '';
    var instDate= (asset&&asset.installation_date) || '';
    var lastVerif=(asset&&asset.last_verified_at) || '';

    // ── Header row ───────────────────────────────────────────────
    var panelHdr=div(''); panelHdr.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;';
    if (node.asset_id) panelHdr.appendChild(btn('ops-btn-sm','👁 Full Asset Record',function(){navigate('asset-detail',node.asset_id);}));
    panelHdr.appendChild(btn('ops-btn-sm','⚠ FMEA',async function(){
      var ws = await API.fmea.findOrCreate({
        canvas_id: canvas.id,
        node_id:   node.id,
        asset_id:  node.asset_id || null,
        title:     (node.asset_name||node.label) + ' — FMEA',
      }).catch(()=>null);
      if (ws) navigate('fmea-worksheet', ws.id);
    }));
    panelHdr.appendChild(btn('ops-btn-sm','✕ Close',function(){sidePanel.style.display='none';selId=null;document.getElementById('cvs-del').style.display='none';render();}));
    sidePanelBody.appendChild(panelHdr);

    // ── Identity block ───────────────────────────────────────────
    var idBlock=div(''); idBlock.style.cssText='margin-bottom:14px;';
    // Name
    idBlock.appendChild(el('div',{text:name,style:'font-size:16px;font-weight:800;color:#e2e8f0;margin-bottom:4px;line-height:1.3;'}));
    // Badges row
    var bRow=div(''); bRow.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;';
    if (aType)   bRow.appendChild(span('ops-badge badge-blue',aType));
    if (crit && CRIT_COLORS_PANEL[crit]) {
      var cc=CRIT_COLORS_PANEL[crit];
      bRow.appendChild(el('span',{text:crit,style:'background:'+cc+'22;color:'+cc+';font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;border:1px solid '+cc+'44;'}));
    }
    if (aStatus) bRow.appendChild(span('ops-badge '+(aStatus==='active'?'badge-green':'badge-gray'),aStatus));
    idBlock.appendChild(bRow);
    sidePanelBody.appendChild(idBlock);

    // ── Specification fields ─────────────────────────────────────
    function sField(label, value, mono) {
      if (!value) return;
      var row=div(''); row.style.cssText='display:flex;gap:0;margin-bottom:6px;align-items:baseline;';
      row.appendChild(el('span',{text:label,style:'color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.4px;min-width:110px;flex-shrink:0;'}));
      row.appendChild(el('span',{text:value,style:'color:#cbd5e1;font-size:12px;'+(mono?'font-family:monospace;':'')}));
      sidePanelBody.appendChild(row);
    }

    var specHead=el('div',{text:'Identification',style:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#334155;margin-bottom:6px;margin-top:2px;border-bottom:1px solid #1e2540;padding-bottom:4px;'});
    sidePanelBody.appendChild(specHead);
    sField('Asset Code',  aCode,   true);
    sField('Manufacturer',mfr,     false);
    sField('Model',       model,   true);
    sField('Serial No.',  serial,  true);
    sField('Firmware',    fwVer,   true);
    sField('Software',    swVer,   true);
    sField('Location',    locStr,  false);
    sField('IP Address',  ipAddr,  true);

    // Supply chain fields
    if (nsn||partNum||cageCode) {
      var supHead=el('div',{text:'Supply Chain',style:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#334155;margin-bottom:6px;margin-top:12px;border-bottom:1px solid #1e2540;padding-bottom:4px;'});
      sidePanelBody.appendChild(supHead);
      sField('NSN',         nsn,     true);
      sField('Part Number', partNum, true);
      sField('CAGE Code',   cageCode,true);
    }

    // Lifecycle fields
    if (warranty||instDate||lastVerif) {
      var lifHead=el('div',{text:'Lifecycle',style:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#334155;margin-bottom:6px;margin-top:12px;border-bottom:1px solid #1e2540;padding-bottom:4px;'});
      sidePanelBody.appendChild(lifHead);
      sField('Installed',   instDate?instDate.slice(0,10):'',  false);
      sField('Warranty Exp',warranty?warranty.slice(0,10):'',  false);
      sField('Last Verified',lastVerif?lastVerif.slice(0,10):'',false);
    }

    // ── Live status ───────────────────────────────────────────────
    var st=node.asset_id?(statuses[node.asset_id]||statuses[String(node.asset_id)]):null;
    if (st) {
      var stHead=el('div',{text:'Live Status',style:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#334155;margin-bottom:6px;margin-top:12px;border-bottom:1px solid #1e2540;padding-bottom:4px;'});
      sidePanelBody.appendChild(stHead);
      var stBox=div(''); stBox.style.cssText='display:flex;flex-direction:column;gap:4px;';
      if (st.sev_count>0) {
        var SEV_LABELS={1:'Critical / Safety / Mission Impact',2:'High / Significant Degradation',3:'Medium / Workaround Available',4:'Low / Non-Urgent',5:'Informational'};
        var SEV_TEXT_COLORS={1:'#f87171',2:'#fb923c',3:'#facc15',4:'#fb923c',5:'#94a3b8'};
        var sevColor=SEV_TEXT_COLORS[st.sev]||'#fb923c';
        var sevLabel=st.sev?('SEV-'+st.sev+(SEV_LABELS[st.sev]?' — '+SEV_LABELS[st.sev]:'')):'Unknown';
        stBox.appendChild(el('div',{text:'⚠ '+st.sev_count+' open deficienc'+(st.sev_count===1?'y':'ies')+' — worst '+sevLabel,style:'color:'+sevColor+';font-size:12px;'}));
      }
      if (st.loto)        stBox.appendChild(el('div',{text:'🔒 LOTO / Tagout active',style:'color:#f97316;font-size:12px;'}));
      if (st.overdue)     stBox.appendChild(el('div',{text:'⏱ Verification overdue (>18 mo)',style:'color:#fbbf24;font-size:12px;'}));
      if (!st.sev_count&&!st.loto&&!st.overdue) stBox.appendChild(el('div',{text:'✓ Healthy — no open issues',style:'color:#4ade80;font-size:12px;'}));
      sidePanelBody.appendChild(stBox);
    } else if (node.asset_id) {
      sidePanelBody.appendChild(el('p',{text:'Click "📡 Live Status" to load health indicators.',style:'color:#475569;font-size:11px;margin-top:12px;'}));
    }

    // ── Connections on this node ──────────────────────────────────
    var connected=edges.filter(function(e){return e.from===node.id||e.to===node.id;});
    if (connected.length) {
      var connHead=el('div',{text:'Connections ('+connected.length+')',style:'font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#334155;margin-bottom:6px;margin-top:12px;border-bottom:1px solid #1e2540;padding-bottom:4px;'});
      sidePanelBody.appendChild(connHead);
      connected.forEach(function(e2){
        var other=nodes.find(function(n){return n.id===(e2.from===node.id?e2.to:e2.from);});
        var dir=e2.from===node.id?'→':'←';
        var ct2=e2.conn_type?CONN_MAP[e2.conn_type]:null;
        var ctColor=ct2?ct2[2]:'#334155';
        var ctLabel=ct2?ct2[1]:'';
        var connRow=div(''); connRow.style.cssText='display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0d1117;font-size:11px;';
        var dot2=div(''); dot2.style.cssText='width:10px;height:3px;background:'+ctColor+';border-radius:2px;flex-shrink:0;';
        connRow.appendChild(dot2);
        connRow.appendChild(el('span',{text:dir+' '+(other?other.asset_name||other.label:'unknown'),style:'color:#cbd5e1;flex:1;'}));
        if (ctLabel) connRow.appendChild(el('span',{text:ctLabel,style:'color:'+ctColor+';font-size:10px;'}));
        if (e2.label) connRow.appendChild(el('span',{text:e2.label,style:'color:#475569;font-size:10px;'}));
        sidePanelBody.appendChild(connRow);
      });
    }
  }

  // Auto-load live status for live canvases, then render
  if (canvas.is_live) doLiveStatus(); else render();
}

// ── RPN helpers ───────────────────────────────────────────────────────────
function rpnColor(rpn) {
  if (rpn >= 200) return '#f87171'; // red   — critical
  if (rpn >= 100) return '#fb923c'; // orange — high
  if (rpn >= 40)  return '#fbbf24'; // yellow — medium
  return '#4ade80';                  // green  — low
}
function rpnLabel(rpn) {
  if (rpn >= 200) return 'Critical';
  if (rpn >= 100) return 'High';
  if (rpn >= 40)  return 'Medium';
  return 'Low';
}

// ── FMEA Worksheet view ───────────────────────────────────────────────────
async function viewFmeaWorksheet(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var ws = await API.fmea.getWorksheet(id).catch(()=>null);
  if (!ws) { setContent(el('div',{cls:'ops-empty',text:'Worksheet not found.'})); return; }

  var [entries, rcmList] = [ws.entries || [], await API.rcm.list({worksheet_id: ws.id}).catch(()=>[])];
  var rcmByEntry = {}; rcmList.forEach(function(r){ rcmByEntry[r.fmea_entry_id]=r; });

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Canvas',function(){navigate('canvas-detail', ws.canvas_id);}));
  hdr.appendChild(el('h2',{text:ws.title}));
  hdr.appendChild(span('ops-badge '+(ws.status==='active'?'badge-green':'badge-gray'), ws.status));
  if (ws.doc_id) hdr.appendChild(span('ops-badge badge-blue','Published'));
  hdr.appendChild(btn('primary','+ Add Entry', function(){ showFmeaEntryForm(ws, null, function(){ viewFmeaWorksheet(id); }); }));
  hdr.appendChild(btn('','📄 Publish', function(){ showFmeaPublishForm(ws, function(){ viewFmeaWorksheet(id); }); }));
  if (ws.doc_id) hdr.appendChild(btn('','📊 FMEA Report', async function(){
    var full = await API.fmea.getWorksheet(id).catch(()=>null);
    if (full) openFmeaReport(full, full.entries||[]);
  }));

  // 900 DM linkage chip
  var fmeaDmBar = div(''); fmeaDmBar.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 0 10px;flex-wrap:wrap;';
  function render900Chip(docId) {
    fmeaDmBar.innerHTML = '';
    fmeaDmBar.appendChild(el('span',{text:'⚡ Fault Description DM (900):',style:'font-size:11px;color:#64748b;font-weight:700;'}));
    if (docId) {
      API.documents.get(docId).then(dm900=>{
        var chip = el('span',{text:dm900.title,cls:'ops-link-chip',style:'cursor:pointer;color:#a78bfa;border-color:#a78bfa44;'});
        chip.onclick = ()=>navigate('doc-detail', dm900.id);
        fmeaDmBar.appendChild(chip);

        var mergeBtn = el('button',{text:'🔄 Merge into FMEA',style:'padding:4px 12px;border-radius:6px;border:1.5px solid #4ade80;background:rgba(74,222,128,0.1);color:#4ade80;font-size:11px;font-weight:700;cursor:pointer;'});
        mergeBtn.onclick = async function() {
          mergeBtn.disabled = true; mergeBtn.textContent = 'Merging…';
          try {
            var r = await API.fmea.syncFromDm(ws.id);
            var parts = [];
            if (r.created) parts.push(r.created+' new entries');
            if (r.updated) parts.push(r.updated+' enriched');
            mergeBtn.textContent = parts.length ? '✓ '+parts.join(', ') : '✓ Up to date';
            mergeBtn.style.borderColor = '#4ade80';
            setTimeout(function(){ viewFmeaWorksheet(id); }, 1200);
          } catch(e) {
            alert('Merge failed: '+(e.message||'unknown error'));
            mergeBtn.disabled = false; mergeBtn.textContent = '🔄 Merge into FMEA';
          }
        };
        fmeaDmBar.appendChild(mergeBtn);

        var chg = el('span',{text:'↩ Change',cls:'ops-link-chip',style:'cursor:pointer;font-size:10px;color:#64748b;'});
        chg.onclick = ()=>showDmPicker('Link Fault Description DM (900)', ws.asset_id, ['900'], docId, async d=>{
          await API.fmea.updateWorksheet(ws.id,{document_id:d?d.id:null}); render900Chip(d?d.id:null);
        });
        fmeaDmBar.appendChild(chg);
      }).catch(()=>{});
    } else {
      var link900 = el('span',{text:'+ Link 900 Fault Description DM',cls:'ops-link-chip',style:'cursor:pointer;color:#a78bfa;border-color:#a78bfa44;border-style:dashed;'});
      link900.onclick = ()=>showDmPicker('Link Fault Description DM (900)', ws.asset_id, ['900'], null, async d=>{
        if (!d) return;
        await API.fmea.updateWorksheet(ws.id,{document_id:d.id}); render900Chip(d.id);
      });
      fmeaDmBar.appendChild(link900);
    }
  }
  render900Chip(ws.document_id||null);
  wrap.appendChild(hdr);
  wrap.appendChild(fmeaDmBar);

  // ── Summary KPI row ───────────────────────────────────────────────
  if (entries.length) {
    var maxRpn   = Math.max.apply(null, entries.map(function(e){return e.rpn;}));
    var critCount= entries.filter(function(e){return e.rpn>=200;}).length;
    var highCount= entries.filter(function(e){return e.rpn>=100&&e.rpn<200;}).length;
    var kpiRow=div(''); kpiRow.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;';
    function kpi(label,value,color){
      var k=div('ops-card'); k.style.cssText='flex:1;min-width:120px;padding:12px 16px;text-align:center;border-left:3px solid '+color+';';
      k.appendChild(el('div',{text:String(value),style:'font-size:22px;font-weight:900;color:'+color+';'}));
      k.appendChild(el('div',{text:label,style:'font-size:10px;color:#64748b;text-transform:uppercase;margin-top:2px;'}));
      return k;
    }
    kpiRow.appendChild(kpi('Entries',     entries.length, '#38bdf8'));
    kpiRow.appendChild(kpi('Max RPN',     maxRpn,         rpnColor(maxRpn)));
    kpiRow.appendChild(kpi('Critical',    critCount,      '#f87171'));
    kpiRow.appendChild(kpi('High',        highCount,      '#fb923c'));
    wrap.appendChild(kpiRow);
  }

  // ── Entries — card-per-entry layout ──────────────────────────────
  var entriesWrap = div(''); wrap.appendChild(entriesWrap);

  if (!entries.length) {
    var emptyCard = div('ops-card');
    emptyCard.appendChild(el('p',{cls:'ops-empty',text:'No entries yet. Click "+ Add Entry" to start the analysis.'}));
    entriesWrap.appendChild(emptyCard);
  } else {
    var TASK_LABELS = {on_condition:'On-Condition',scheduled_restoration:'Sched. Restore',scheduled_discard:'Sched. Discard',failure_finding:'Failure Finding',run_to_failure:'Run-to-Failure',redesign:'Redesign / No PM'};

    entries.forEach(function(e, i) {
      var rpn    = e.rpn;
      var rpnC   = rpnColor(rpn);
      var rcmDec = rcmByEntry[e.id];

      var card = div('ops-card');
      card.style.cssText = 'margin-bottom:10px;padding:0;overflow:hidden;border:1px solid #1e293b;';

      // ── Header: # · Failure Mode · S/O/D chips · RPN · action buttons ──
      var hdr = div('');
      hdr.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:12px 16px;background:#0f1929;border-bottom:1px solid #1e293b;flex-wrap:wrap;';

      var numBadge = el('div',{text:String(i+1),style:'width:24px;height:24px;border-radius:50%;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#64748b;flex-shrink:0;margin-top:2px;'});
      hdr.appendChild(numBadge);

      var titleCol = div(''); titleCol.style.cssText = 'flex:1;min-width:0;';
      titleCol.appendChild(el('div',{text:e.failure_mode||'—',style:'font-size:14px;font-weight:700;color:#fbbf24;line-height:1.3;word-break:break-word;'}));
      if (e.function) titleCol.appendChild(el('div',{text:'Function: '+e.function,style:'font-size:11px;color:#64748b;margin-top:3px;'}));
      hdr.appendChild(titleCol);

      // S · O · D chips
      var scores = div(''); scores.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;';
      function scorePill(lbl,val,col){
        var p=div(''); p.style.cssText='background:#1e293b;border-radius:6px;padding:4px 8px;text-align:center;min-width:36px;';
        p.appendChild(el('div',{text:lbl,style:'font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:.5px;'}));
        p.appendChild(el('div',{text:String(val),style:'font-size:15px;font-weight:900;color:'+col+';line-height:1;'}));
        return p;
      }
      scores.appendChild(scorePill('S',e.severity,'#f87171'));
      scores.appendChild(scorePill('O',e.occurrence,'#fb923c'));
      scores.appendChild(scorePill('D',e.detectability,'#fbbf24'));

      // RPN block
      var rpnBlock = div(''); rpnBlock.style.cssText='background:#1e293b;border-radius:6px;padding:4px 10px;text-align:center;border:1.5px solid '+rpnC+'44;min-width:52px;';
      rpnBlock.appendChild(el('div',{text:String(rpn),style:'font-size:18px;font-weight:900;color:'+rpnC+';line-height:1;'}));
      rpnBlock.appendChild(el('div',{text:rpnLabel(rpn),style:'font-size:9px;color:'+rpnC+';text-transform:uppercase;'}));
      if (e.revised_rpn) rpnBlock.appendChild(el('div',{text:'→'+e.revised_rpn,style:'font-size:10px;color:#4ade80;font-weight:700;'}));
      scores.appendChild(rpnBlock);
      hdr.appendChild(scores);

      // Edit / Delete
      var actG = div('ops-btn-group'); actG.style.cssText='flex-shrink:0;display:flex;gap:6px;align-items:center;';
      actG.appendChild(btn('ops-btn-sm','✏ Edit', function(){ showFmeaEntryForm(ws, e, function(){ viewFmeaWorksheet(id); }); }));
      actG.appendChild(btn('ops-btn-sm ops-btn-danger','✕', async function(){
        if (!confirm('Delete entry "'+e.failure_mode+'"?')) return;
        await API.fmea.destroyEntry(ws.id, e.id);
        viewFmeaWorksheet(id);
      }));
      hdr.appendChild(actG);
      card.appendChild(hdr);

      // ── Body: 3-column effects grid ──────────────────────────────────
      var body = div(''); body.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid #1e293b;';
      function effectCell(label, text, textColor) {
        var c = div(''); c.style.cssText = 'padding:10px 14px;border-right:1px solid #1e293b;';
        c.appendChild(el('div',{text:label,style:'font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;'}));
        c.appendChild(el('div',{text:text||'—',style:'font-size:12px;color:'+(textColor||'#cbd5e1')+';line-height:1.55;word-break:break-word;white-space:pre-wrap;'}));
        return c;
      }
      body.appendChild(effectCell('Local Effect',       e.local_effect,      '#e2e8f0'));
      body.appendChild(effectCell('System Effect',      e.system_effect,     '#fb923c'));
      body.appendChild(effectCell('Detection Method',   e.detection_method,  '#94a3b8'));
      card.appendChild(body);

      // ── Footer: RCM decision ──────────────────────────────────────────
      var ftr = div(''); ftr.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 16px;background:#0a111f;flex-wrap:wrap;';
      ftr.appendChild(el('span',{text:'RCM:',style:'font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;flex-shrink:0;'}));
      if (rcmDec) {
        ftr.appendChild(el('span',{text:TASK_LABELS[rcmDec.task_type]||rcmDec.task_type,style:'font-size:12px;font-weight:700;color:#38bdf8;'}));
        if (rcmDec.task_interval) ftr.appendChild(el('span',{text:'Interval: '+rcmDec.task_interval,style:'font-size:11px;color:#64748b;'}));
        if (rcmDec.approved_by)   ftr.appendChild(el('span',{text:'✓ '+rcmDec.approved_by,style:'font-size:11px;color:#4ade80;'}));
        ftr.appendChild(btn('ops-btn-sm','✏ RCM', function(){ showRcmDecisionForm(ws, e, rcmDec, function(){ viewFmeaWorksheet(id); }); }));
        // Generate PM + DM 200 — only for actionable task types, shown as chip once linked
        var canGenPm = ['on_condition','scheduled_restoration','scheduled_discard','failure_finding'].indexOf(rcmDec.task_type) >= 0;
        if (canGenPm) {
          if (rcmDec.linked_procedure_id) {
            var pmChip = el('span',{text:'⚙ PM #'+rcmDec.linked_procedure_id,style:'font-size:11px;font-weight:700;color:#38bdf8;background:#1e3a5f;border:1px solid #1e40af;border-radius:4px;padding:2px 8px;cursor:pointer;'});
            pmChip.title='View linked PM procedure';
            pmChip.onclick=async function(){
              try { var proc=await API.procedures.get(rcmDec.linked_procedure_id); viewProcedureDetail(proc); }
              catch(e2){ alert('Could not load PM #'+rcmDec.linked_procedure_id+': '+(e2.message||'unknown error')); }
            };
            ftr.appendChild(pmChip);
          } else {
            (function(rcmId, assetId, genBtn){
              genBtn.title='Link this RCM decision to a DM and create a PM procedure';
              genBtn.onclick=async function(){
                genBtn.disabled=true; genBtn.textContent='Loading…';
                try {
                  // Fetch existing data_module docs for this asset (info_code 200/720/730)
                  var allDocs = assetId
                    ? await API.documents.list({asset_id: assetId, doc_type: 'data_module'}).catch(()=>[])
                    : [];
                  var procDocs = allDocs.filter(function(d){ return ['200','720','730'].indexOf(d.info_code) >= 0; });

                  // Build picker modal
                  var pickerBody = div(''); pickerBody.style.cssText='display:flex;flex-direction:column;gap:8px;';
                  pickerBody.appendChild(el('p',{text:'Select an existing maintenance DM to link this PM to, or create a new DM 200 stub:',style:'font-size:12px;color:#94a3b8;margin:0 0 8px;'}));

                  var selected = {docId: null}; // null = create new

                  // "Create new DM 200 stub" option — selected by default
                  var newOpt = el('div',{style:'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;border:2px solid #0284c7;background:#0c1929;cursor:pointer;'});
                  newOpt.innerHTML='<span style="font-size:18px;">➕</span><div><div style="font-size:13px;font-weight:700;color:#e2e8f0;">Create new DM 200 stub</div><div style="font-size:11px;color:#64748b;">A blank maintenance procedure data module will be created and linked</div></div>';
                  newOpt.dataset.selected='1';
                  pickerBody.appendChild(newOpt);

                  function selectOpt(el2, docId) {
                    [newOpt].concat(Array.from(pickerBody.querySelectorAll('[data-dmopt]'))).forEach(function(o){ o.style.borderColor='#334155'; o.dataset.selected='0'; });
                    el2.style.borderColor='#0284c7'; el2.dataset.selected='1';
                    selected.docId = docId;
                  }
                  newOpt.onclick=function(){ selectOpt(newOpt, null); };

                  if (procDocs.length === 0) {
                    pickerBody.appendChild(el('p',{text:'No existing maintenance DMs found for this asset.',style:'font-size:11px;color:#475569;margin:4px 0 0;font-style:italic;'}));
                  } else {
                    procDocs.forEach(function(d){
                      var opt = el('div',{style:'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;border:2px solid #334155;background:#0c1929;cursor:pointer;'});
                      opt.dataset.dmopt='1';
                      var badge = d.info_code==='200'?'📋 DM 200':d.info_code==='720'?'🔧 DM 720':'⚙ DM '+d.info_code;
                      var statusColor = d.status==='released'?'#4ade80':d.status==='draft'?'#fb923c':'#64748b';
                      opt.innerHTML='<span style="font-size:16px;flex-shrink:0;">'+badge+'</span>'
                        +'<div style="min-width:0;flex:1;">'
                        +'<div style="font-size:13px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(d.title||d.doc_number||'Untitled')+'</div>'
                        +'<div style="font-size:11px;color:#64748b;">'+(d.doc_number||'No DMC')+' &nbsp;·&nbsp; <span style="color:'+statusColor+'">'+d.status+'</span>'+(d.current_rev?' &nbsp;·&nbsp; Rev '+d.current_rev:'')+'</div>'
                        +'</div>';
                      opt.onclick=(function(o,did){ return function(){ selectOpt(o, did); }; })(opt, d.id);
                      pickerBody.appendChild(opt);
                    });
                  }

                  showModal('Link DM to PM — RCM Decision', pickerBody, [
                    { label: 'Link & Create PM', cls: 'primary', action: async function(close) {
                        var r = await API.rcm.generatePm(rcmId, selected.docId);
                        close();
                        genBtn.textContent = '✓ PM #'+r.procedure_id;
                        genBtn.style.background='#14532d'; genBtn.style.color='#4ade80';
                        setTimeout(function(){ viewFmeaWorksheet(id); }, 900);
                    }},
                    { label: 'Cancel', cls: '', action: function(close){ close(); genBtn.disabled=false; genBtn.textContent='→ Generate PM'; }},
                  ]);
                } catch(e2){ alert('Error: '+(e2.message||'unknown error')); genBtn.disabled=false; genBtn.textContent='→ Generate PM'; }
              };
              ftr.appendChild(genBtn);
            })(rcmDec.id, ws.asset_id, btn('ops-btn-sm','→ Generate PM', null));
          }
        }
      } else {
        ftr.appendChild(el('span',{text:'No decision recorded',style:'font-size:11px;color:#334155;font-style:italic;'}));
        ftr.appendChild(btn('ops-btn-sm','+ RCM', function(){ showRcmDecisionForm(ws, e, null, function(){ viewFmeaWorksheet(id); }); }));
      }
      if (e.notes) {
        var noteEl = el('span',{text:'📝 '+e.notes,style:'font-size:10px;color:#475569;flex:1;text-align:right;min-width:0;word-break:break-word;'});
        ftr.appendChild(noteEl);
      }
      card.appendChild(ftr);

      entriesWrap.appendChild(card);
    });
  }

  setContent(wrap);
}

// ── FMEA Entry form ───────────────────────────────────────────────────────
async function showFmeaEntryForm(ws, existing, onSave) {
  // Build failure mode options from the same static S5000F taxonomy used by deficiency forms
  var fmOpts = [['','— None / Manual Entry —']];
  FM_CATEGORIES.forEach(function(cat){
    (FM_SUBCATEGORIES[cat[0]]||[]).forEach(function(sub){
      fmOpts.push([cat[0]+': '+sub, cat[1].replace(/^[^ ]+ /,'')+' › '+sub]);
    });
  });

  var fWrap = div('ops-form-grid');
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  var fmSel = sel(fmOpts, existing?.failure_mode||'');
  fWrap.appendChild(fg('Failure Mode Category (S5000F)', fmSel, true, 'Selecting auto-fills the Failure Mode field below.'));

  var func  = add('Function *',        inp('What does this item do?',           existing?.function||''),        true);
  var fm    = add('Failure Mode *',    inp('How can it fail?',                  existing?.failure_mode||''),    true);
  var le    = add('Local Effect',      inp('Effect on the immediate function',  existing?.local_effect||''),    true);
  var se    = add('System Effect',     inp('Effect on the overall system',      existing?.system_effect||''),   true);
  var det   = add('Detection Method',  inp('How is failure detected?',         existing?.detection_method||''),true);

  // Auto-fill failure mode field from taxonomy selection
  fmSel.addEventListener('change', function(){
    if (fmSel.value && !fm.value) {
      fm.value = fmSel.value.split(': ').slice(1).join(': ');
    }
  });

  // S / O / D sliders
  var sodWrap = div(''); sodWrap.style.cssText='grid-column:span 2;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:4px;';
  var rpnDisp = el('div',{text:'RPN: —',style:'grid-column:span 2;font-size:18px;font-weight:900;color:#38bdf8;text-align:center;padding:8px;'});

  function makeSlider(label, dflt, color, hint) {
    var g = div(''); g.style.cssText='display:flex;flex-direction:column;gap:4px;';
    var lbl2 = el('div',{style:'font-size:10px;color:#64748b;text-transform:uppercase;'});
    var valDisp = el('span',{text:String(dflt),style:'font-weight:900;font-size:16px;color:'+color+';margin-left:6px;'});
    lbl2.textContent=label+' '; lbl2.appendChild(valDisp);
    var sldr = document.createElement('input'); sldr.type='range'; sldr.min=1; sldr.max=10; sldr.value=dflt;
    sldr.style.cssText='width:100%;accent-color:'+color+';';
    sldr.addEventListener('input',function(){ valDisp.textContent=sldr.value; updateRpn(); });
    g.appendChild(lbl2); g.appendChild(sldr);
    if (hint) g.appendChild(el('div',{text:hint,style:'font-size:9px;color:#334155;'}));
    return {g, sldr};
  }

  var sSldr = makeSlider('Severity (S)',      existing?.severity||5,      '#f87171', '1=No effect · 10=Safety/catastrophic');
  var oSldr = makeSlider('Occurrence (O)',    existing?.occurrence||3,    '#fb923c', '1=Unlikely · 10=Certain');
  var dSldr = makeSlider('Detectability (D)', existing?.detectability||3, '#fbbf24', '1=Always detected · 10=Undetectable');
  sodWrap.appendChild(sSldr.g); sodWrap.appendChild(oSldr.g); sodWrap.appendChild(dSldr.g);

  function updateRpn() {
    var rpn = parseInt(sSldr.sldr.value) * parseInt(oSldr.sldr.value) * parseInt(dSldr.sldr.value);
    rpnDisp.textContent = 'RPN: '+rpn+' — '+rpnLabel(rpn);
    rpnDisp.style.color = rpnColor(rpn);
  }
  updateRpn();

  fWrap.appendChild(sodWrap);
  fWrap.appendChild(rpnDisp);

  var recom = add('Recommended Action', inp('What should be done?',         existing?.recommended_action||''), true);
  var resp  = add('Responsible Party',  inp('Who is responsible?',          existing?.responsible_party||''),  false);
  var taken = add('Action Taken',       inp('What was actually done?',      existing?.action_taken||''),       true);
  var notes = add('Notes',              inp('Additional notes',             existing?.notes||''),              true);

  // Revised S/O/D if action has been taken
  var revWrap = div(''); revWrap.style.cssText='grid-column:span 2;';
  revWrap.appendChild(el('div',{text:'Revised RPN (after action — optional)',style:'font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:8px;'}));
  var revGrid = div(''); revGrid.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;';
  var rsSldr = makeSlider('Revised S', existing?.revised_sev||existing?.severity||5, '#4ade80', '');
  var roSldr = makeSlider('Revised O', existing?.revised_occ||existing?.occurrence||3,'#4ade80','');
  var rdSldr = makeSlider('Revised D', existing?.revised_det||existing?.detectability||3,'#4ade80','');
  var revRpnDisp = el('div',{style:'grid-column:span 3;font-size:13px;font-weight:700;color:#4ade80;text-align:center;'});
  function updateRevRpn(){
    var r=parseInt(rsSldr.sldr.value)*parseInt(roSldr.sldr.value)*parseInt(rdSldr.sldr.value);
    revRpnDisp.textContent='Revised RPN: '+r+' ('+rpnLabel(r)+')';
  }
  [rsSldr,roSldr,rdSldr].forEach(function(s){s.sldr.addEventListener('input',updateRevRpn);});
  updateRevRpn();
  revGrid.appendChild(rsSldr.g); revGrid.appendChild(roSldr.g); revGrid.appendChild(rdSldr.g);
  revGrid.appendChild(revRpnDisp);
  revWrap.appendChild(revGrid);
  fWrap.appendChild(revWrap);

  modal(existing?'Edit FMEA Entry':'Add FMEA Entry', fWrap, async function(){
    if (!func.value.trim()) throw new Error('Function is required.');
    if (!fm.value.trim())   throw new Error('Failure Mode is required.');
    var payload = {
      function:           func.value.trim(),
      failure_mode:       fm.value.trim(),
      local_effect:       le.value.trim(),
      system_effect:      se.value.trim(),
      detection_method:   det.value.trim(),
      severity:           parseInt(sSldr.sldr.value),
      occurrence:         parseInt(oSldr.sldr.value),
      detectability:      parseInt(dSldr.sldr.value),
      failure_mode_id:    null,
      recommended_action: recom.value.trim(),
      responsible_party:  resp.value.trim(),
      action_taken:       taken.value.trim(),
      revised_sev:        rsSldr.sldr.value !== sSldr.sldr.value ? parseInt(rsSldr.sldr.value) : null,
      revised_occ:        roSldr.sldr.value !== oSldr.sldr.value ? parseInt(roSldr.sldr.value) : null,
      revised_det:        rdSldr.sldr.value !== dSldr.sldr.value ? parseInt(rdSldr.sldr.value) : null,
      notes:              notes.value.trim(),
    };
    if (existing) {
      await API.fmea.updateEntry(ws.id, existing.id, payload);
    } else {
      await API.fmea.createEntry(ws.id, payload);
    }
    if (onSave) onSave();
  }, existing ? 'Save Changes' : 'Add Entry');
}

// ── FMEA Publish form ────────────────────────────────────────────────────
// ── RCM Decision Form ─────────────────────────────────────────────────────
function showRcmDecisionForm(ws, fmeaEntry, existing, onSave) {
  // MSG-3/S4000P guided decision tree
  var VISIBILITY_OPTS = [['evident','Evident — Operators will notice the failure'],['hidden','Hidden — Failure is not apparent during normal operation']];
  var CONSEQUENCE_OPTS = [
    ['safety',      'Safety — Could injure or kill personnel'],
    ['environmental','Environmental — Regulatory / environmental impact'],
    ['operational', 'Operational — Reduces capability / output'],
    ['economic',    'Economic / Non-operational — Only a repair cost'],
  ];
  var TASK_TYPE_OPTS = [
    ['on_condition',          'On-Condition (OC) — Inspect/test to detect potential failure'],
    ['scheduled_restoration', 'Scheduled Restoration (SR) — Restore at fixed interval'],
    ['scheduled_discard',     'Scheduled Discard (SD) — Replace at fixed interval'],
    ['failure_finding',       'Failure Finding (FF) — Verify hidden function still works'],
    ['run_to_failure',        'Run-to-Failure (RTF) — Accept failure, repair on occurrence'],
    ['redesign',              'Redesign / Change — Default tasks are not applicable'],
  ];
  // RPN-guided default task type
  var rpn = fmeaEntry.rpn || 0;
  var defaultTask = rpn >= 200 ? 'on_condition' : rpn >= 100 ? 'scheduled_restoration' : 'run_to_failure';
  var defaultVis  = 'evident';
  var defaultCons = rpn >= 200 ? 'safety' : 'operational';

  var fld = function(label, input) {
    var w=div(''); w.style.marginBottom='12px';
    w.appendChild(el('label',{text:label,style:'display:block;font-size:11px;color:#94a3b8;margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;'}));
    w.appendChild(input); return w;
  };
  var sel = function(opts, val) {
    var s=document.createElement('select'); s.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;';
    opts.forEach(function(o){ var op=document.createElement('option'); op.value=o[0]; op.textContent=o[1]; if(o[0]===(val||o[0])) op.selected=true; s.appendChild(op); });
    return s;
  };
  var ta = function(val, ph) {
    var t=document.createElement('textarea'); t.rows=3; t.value=val||''; t.placeholder=ph||'';
    t.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;resize:vertical;';
    return t;
  };
  var inp = function(val, ph) {
    var i=document.createElement('input'); i.type='text'; i.value=val||''; i.placeholder=ph||'';
    i.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;';
    return i;
  };

  // Guided hint block
  var hintEl = div(''); hintEl.style.cssText='background:#1e293b;border-left:3px solid #38bdf8;padding:8px 12px;border-radius:4px;font-size:11px;color:#94a3b8;margin-bottom:14px;';
  function updateHint(vis, cons, task) {
    var hints = [];
    if (vis==='hidden') hints.push('Hidden failures must have a Failure Finding task unless redesign is chosen.');
    if (cons==='safety'||cons==='environmental') hints.push('Safety/environmental consequences require an effective PM task before RTF is allowed.');
    if (task==='run_to_failure' && (cons==='safety'||cons==='environmental')) {
      hintEl.style.borderColor='#f87171'; hints.push('⚠ RTF is NOT acceptable for safety/environmental consequences per MSG-3 Section 3.');
    } else { hintEl.style.borderColor='#38bdf8'; }
    hintEl.textContent = hints.length ? hints.join(' ') : 'Select failure visibility and consequence to see MSG-3 guidance.';
  }

  var visEl  = sel(VISIBILITY_OPTS,  existing?.failure_visibility  || defaultVis);
  var consEl = sel(CONSEQUENCE_OPTS, existing?.failure_consequence || defaultCons);
  var taskEl = sel(TASK_TYPE_OPTS,   existing?.task_type           || defaultTask);
  var intEl  = inp(existing?.task_interval, 'e.g. 500 FH, 90 Days, 12 Months');
  var basisEl= ta(existing?.interval_basis, 'Engineering rationale, reliability data, OEM recommendation…');
  var ratEl  = ta(existing?.rationale,      'Decision rationale, MSG-3 logic path taken…');
  var approEl= inp(existing?.approved_by,   'Approver name / title');

  function refreshHint(){ updateHint(visEl.value, consEl.value, taskEl.value); }
  visEl.onchange=refreshHint; consEl.onchange=refreshHint; taskEl.onchange=refreshHint;
  refreshHint();

  var entryName = fmeaEntry.failure_mode || fmeaEntry.function || 'Entry #'+fmeaEntry.id;
  var body = div(''); body.style.maxHeight='70vh'; body.style.overflowY='auto';
  body.appendChild(el('div',{text:'FMEA entry: '+entryName,style:'color:#64748b;font-size:11px;margin-bottom:12px;'}));
  // RPN indicator
  var rpnBadge = el('div',{text:'RPN: '+rpn+' ('+rpnLabel(rpn)+')',style:'display:inline-block;padding:4px 10px;border-radius:4px;background:'+rpnColor(rpn)+'22;color:'+rpnColor(rpn)+';font-weight:700;font-size:12px;margin-bottom:12px;'});
  body.appendChild(rpnBadge);
  body.appendChild(hintEl);
  body.appendChild(fld('Failure Visibility', visEl));
  body.appendChild(fld('Failure Consequence', consEl));
  body.appendChild(fld('Maintenance Task Type (MSG-3)', taskEl));
  body.appendChild(fld('Task Interval', intEl));
  body.appendChild(fld('Interval Basis', basisEl));
  body.appendChild(fld('Decision Rationale', ratEl));
  body.appendChild(fld('Approved By', approEl));

  showModal('RCM Decision — '+entryName, body, [
    { label: 'Save Decision', cls: 'primary', action: async function(close) {
        var data = {
          fmea_entry_id:       fmeaEntry.id,
          worksheet_id:        ws.id,
          failure_visibility:  visEl.value,
          failure_consequence: consEl.value,
          task_type:           taskEl.value,
          task_interval:       intEl.value.trim(),
          interval_basis:      basisEl.value.trim(),
          rationale:           ratEl.value.trim(),
          approved_by:         approEl.value.trim(),
        };
        await API.rcm.upsert(data);
        close(); onSave();
    }},
    ...(existing ? [{ label: 'Delete', cls: 'ops-btn-danger', action: async function(close){
        if (!confirm('Remove this RCM decision?')) return;
        await API.rcm.destroy(existing.id);
        close(); onSave();
    }}] : []),
    { label: 'Cancel', cls: '', action: function(close){ close(); }},
  ]);
}

function showFmeaPublishForm(ws, onDone) {
  var fWrap = div('ops-form-grid');
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
  var rev  = add('Revision *', inp('A, B, C…', 'A'));
  var desc = add('Change Description *', inp('e.g. Initial FMEA baseline', ''), true);
  var appr = add('Approved By', inp('Name or UID', ''));

  modal('Publish FMEA Worksheet', fWrap, async function(){
    if (!rev.value.trim())  throw new Error('Revision required.');
    if (!desc.value.trim()) throw new Error('Change description required.');
    var result = await API.fmea.publishWorksheet(ws.id, {
      revision:    rev.value.trim(),
      change_desc: desc.value.trim(),
      approved_by: appr.value.trim() || null,
    });
    var conf = div('');
    conf.style.cssText='background:#0f172a;border:1px solid #166534;border-radius:8px;padding:16px 20px;';
    conf.appendChild(el('div',{text:'✓ FMEA Worksheet Published',style:'color:#4ade80;font-weight:800;font-size:14px;margin-bottom:8px;'}));
    conf.appendChild(el('div',{text:'Document: '+result.document.doc_number,style:'font-family:monospace;color:#38bdf8;margin-bottom:3px;'}));
    conf.appendChild(el('div',{text:'Rev: '+result.revision.revision,style:'color:#e2e8f0;'}));
    modal('Published', conf, null, null, true);
    if (onDone) onDone();
  }, 'Publish');
}

// ── FMEA printable report ────────────────────────────────────────────────
function openFmeaReport(ws, entries) {
  var sorted = entries.slice().sort(function(a,b){return b.rpn-a.rpn;});
  var entryRows = sorted.map(function(e,i){
    var c=e.rpn>=200?'#f87171':e.rpn>=100?'#fb923c':e.rpn>=40?'#cc8800':'#166534';
    var revCell=e.revised_rpn?'<td style="font-family:monospace;font-weight:700;color:#4ade80;">'+e.revised_rpn+'</td>':'<td style="color:#64748b;">—</td>';
    return '<tr>'
      +'<td>'+(i+1)+'</td>'
      +'<td>'+e.function+'</td>'
      +'<td style="color:#fbbf24;">'+e.failure_mode+'</td>'
      +'<td>'+e.local_effect+'</td>'
      +'<td style="color:#fb923c;">'+e.system_effect+'</td>'
      +'<td style="font-family:monospace;font-weight:700;color:#c00;">'+e.severity+'</td>'
      +'<td style="font-family:monospace;font-weight:700;color:#c60;">'+e.occurrence+'</td>'
      +'<td style="font-family:monospace;font-weight:700;color:#880;">'+e.detectability+'</td>'
      +'<td style="font-family:monospace;font-weight:900;color:'+c+';">'+e.rpn+'</td>'
      +revCell
      +'<td>'+e.recommended_action+'</td>'
      +'<td>'+e.responsible_party+'</td>'
      +'<td>'+e.detection_method+'</td>'
      +'</tr>';
  }).join('');

  var critCount=entries.filter(function(e){return e.rpn>=200;}).length;
  var highCount=entries.filter(function(e){return e.rpn>=100&&e.rpn<200;}).length;
  var maxRpn=entries.length?Math.max.apply(null,entries.map(function(e){return e.rpn;})):0;

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FMEA — '+ws.title+'</title>'
    +'<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:10px;color:#1e293b;background:#fff;padding:16px;}'
    +'h1{font-size:16px;font-weight:900;margin-bottom:4px;}h2{font-size:12px;font-weight:700;margin:16px 0 6px;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}'
    +'.meta{color:#64748b;font-size:10px;margin-bottom:16px;}'
    +'.kpi{display:flex;gap:12px;margin-bottom:16px;}'
    +'.kpi-box{border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;text-align:center;min-width:80px;}'
    +'.kpi-val{font-size:18px;font-weight:900;} .kpi-lbl{font-size:9px;color:#64748b;text-transform:uppercase;}'
    +'table{width:100%;border-collapse:collapse;font-size:9px;}'
    +'th{background:#1e293b;color:#fff;padding:4px 6px;text-align:left;white-space:nowrap;}'
    +'td{padding:4px 6px;border-bottom:1px solid #e2e8f0;vertical-align:top;}'
    +'tr:nth-child(even) td{background:#f8fafc;}'
    +'.no-print{display:none;}'
    +'@media print{.no-print{display:none!important;}.toolbar{display:none!important;}}'
    +'.toolbar{background:#1e293b;color:#fff;padding:8px 14px;display:flex;align-items:center;gap:10px;margin-bottom:14px;border-radius:6px;}'
    +'.toolbar button{background:#38bdf8;color:#000;border:none;padding:5px 12px;border-radius:4px;cursor:pointer;font-weight:700;}'
    +'</style></head><body>'
    +'<div class="toolbar no-print"><strong>FMEA Report</strong><button onclick="window.print()">🖨 Print / PDF</button></div>'
    +'<h1>'+ws.title+'</h1>'
    +'<div class="meta">Status: '+ws.status+' · Entries: '+entries.length+' · Generated: '+new Date().toISOString().slice(0,10)+'</div>'
    +'<div class="kpi">'
      +'<div class="kpi-box"><div class="kpi-val" style="color:#f87171;">'+critCount+'</div><div class="kpi-lbl">Critical (≥200)</div></div>'
      +'<div class="kpi-box"><div class="kpi-val" style="color:#fb923c;">'+highCount+'</div><div class="kpi-lbl">High (100–199)</div></div>'
      +'<div class="kpi-box"><div class="kpi-val" style="color:#1d4ed8;">'+entries.length+'</div><div class="kpi-lbl">Total Entries</div></div>'
      +'<div class="kpi-box"><div class="kpi-val" style="color:'+(maxRpn>=200?'#f87171':maxRpn>=100?'#fb923c':'#1d4ed8')+';">'+maxRpn+'</div><div class="kpi-lbl">Max RPN</div></div>'
    +'</div>'
    +'<h2>Failure Mode Analysis (sorted by RPN descending)</h2>'
    +'<table><thead><tr><th>#</th><th>Function</th><th>Failure Mode</th><th>Local Effect</th><th>System Effect</th>'
    +'<th>S</th><th>O</th><th>D</th><th>RPN</th><th>Rev RPN</th>'
    +'<th>Recommended Action</th><th>Responsible</th><th>Detection Method</th></tr></thead>'
    +'<tbody>'+entryRows+'</tbody></table>'
    +'</body></html>';

  var win=window.open('','_blank');
  if (win){ win.document.write(html); win.document.close(); }
  else alert('Pop-up blocked — allow pop-ups to view the FMEA report.');
}

// ── Auto-Generate Canvas from Asset Hierarchy ─────────────────────────────
//
// Builds canvas nodes/edges from the platform asset registry, structured by
// parent_id relationships. Tree layout uses recursive subtree-width centering
// (simplified Reingold-Tilford) — roots across the top, children below.
//
// Asset code prefix → canvas type mapping:
//   PWR / ELEC / UPS / GEN → power
//   NET / ETH / FBR / SW / RT → network
//   RF / ANT / RAD / WVG    → rf
//   HVAC / AIR / COOL / THM → hvac
//   PHYS / RACK / CAB / MNT → physical
//   (everything else)        → custom

function autoCanvasTypeFromCode(assetCode, assetType) {
  var code = (assetCode || '').toUpperCase();
  var prefixes = {
    power:    ['PWR','ELEC','UPS','GEN','PDU','BATT','INV','XFMR','DIST'],
    network:  ['NET','ETH','FBR','SWT','RTR','HUB','NIC','LAN','WAN','VPN','VLAN'],
    rf:       ['RF','ANT','RAD','WVG','SAT','REC','XMT','RCVR','XMTR','AMP'],
    hvac:     ['HVAC','AIR','COOL','HTR','THM','DUCT','CHIL','FAN','AHU'],
    physical: ['PHYS','RACK','CAB','MNT','ENC','FLOR','WALL','SHLF'],
  };
  for (var type in prefixes) {
    if (prefixes[type].some(function(p){ return code.startsWith(p+'-') || code.startsWith(p); })) return type;
  }
  // Fall back on Nextcloud asset_type field
  if (assetType === 'hardware') return 'power';
  return 'custom';
}

// Recursive subtree width calculator
function calcSubtreeWidths(nodeId, childrenMap, NW, GAP_X) {
  var children = childrenMap[nodeId] || [];
  if (!children.length) return NW;
  var totalChildren = children.reduce(function(sum, cid) {
    return sum + calcSubtreeWidths(cid, childrenMap, NW, GAP_X) + GAP_X;
  }, -GAP_X);
  return Math.max(NW, totalChildren);
}

// Assign x/y to each node in the tree
function assignTreePositions(nodeId, x, y, childrenMap, positions, NW, NH, GAP_X, GAP_Y) {
  positions[nodeId] = { x: x, y: y };
  var children = childrenMap[nodeId] || [];
  if (!children.length) return;
  // Total width needed for all children
  var totalW = children.reduce(function(sum, cid) {
    return sum + calcSubtreeWidths(cid, childrenMap, NW, GAP_X) + GAP_X;
  }, -GAP_X);
  var cx = x + (NW / 2) - (totalW / 2);
  children.forEach(function(cid) {
    var sw = calcSubtreeWidths(cid, childrenMap, NW, GAP_X);
    assignTreePositions(cid, cx, y + NH + GAP_Y, childrenMap, positions, NW, NH, GAP_X, GAP_Y);
    cx += sw + GAP_X;
  });
}

async function showAutoGenerateCanvasModal(platformId, onDone) {
  var [platform, allAssets] = await Promise.all([
    API.platforms.get(platformId).catch(()=>null),
    API.assets.list ? API.assets.list({platform_id: platformId}).catch(()=>[]) : getAssets().catch(()=>[]),
  ]);
  // Filter to this platform
  var assets = allAssets.filter(function(a){ return a.platform_id == platformId || !platformId; });
  if (!assets.length) { alert('No assets found for this platform. Add assets first.'); return; }

  // Detect canvas types present in this asset set
  var typeGroups = {};
  assets.forEach(function(a){
    var t = autoCanvasTypeFromCode(a.asset_code || a.asset_id_label, a.asset_type);
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(a);
  });

  var TYPE_LABELS = {power:'Power Distribution',network:'Network / Data',rf:'RF / Signal',hvac:'HVAC / Mechanical',physical:'Physical Installation',custom:'Functional / Custom'};
  var CANVAS_TYPE_OPTS = Object.keys(typeGroups).map(function(t){
    return [t, TYPE_LABELS[t]||t, typeGroups[t].length+' assets'];
  });
  // Add "All types on one canvas" option
  CANVAS_TYPE_OPTS.unshift(['__all__','All Types — Single Canvas', assets.length+' assets total']);

  var body = div('');
  body.appendChild(el('p',{text:'Choose which asset layer to generate a canvas for. Assets are grouped by asset code prefix. The hierarchy from parent→child relationships becomes the canvas node layout.',style:'color:#94a3b8;font-size:12px;margin-bottom:16px;'}));

  // Type selector cards
  var typeVar = CANVAS_TYPE_OPTS[0][0];
  var typeCards = div(''); typeCards.style.cssText='display:flex;flex-direction:column;gap:8px;margin-bottom:16px;';
  CANVAS_TYPE_OPTS.forEach(function(opt){
    var card = div(''); card.style.cssText='padding:10px 14px;border:1px solid #334155;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .15s;';
    card.dataset.val = opt[0];
    var left = div('');
    left.appendChild(el('div',{text:opt[1],style:'font-weight:700;color:#e2e8f0;font-size:13px;'}));
    if (opt[2]) left.appendChild(el('div',{text:opt[2],style:'font-size:11px;color:#64748b;margin-top:2px;'}));
    card.appendChild(left);
    var check = el('div',{text:'○',style:'color:#334155;font-size:16px;'});
    card.appendChild(check);
    card.onclick = function(){
      typeVar = opt[0];
      typeCards.querySelectorAll('[data-val]').forEach(function(c){
        c.style.borderColor='#334155'; c.style.background='';
        c.querySelector('div:last-child').textContent='○'; c.querySelector('div:last-child').style.color='#334155';
      });
      card.style.borderColor='#38bdf8'; card.style.background='#0f2744';
      check.textContent='●'; check.style.color='#38bdf8';
    };
    typeCards.appendChild(card);
    if (opt[0]===CANVAS_TYPE_OPTS[0][0]) card.onclick(); // select first by default
  });
  body.appendChild(typeCards);

  // Canvas name input
  var nameInput = document.createElement('input'); nameInput.type='text';
  nameInput.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;margin-bottom:12px;';
  nameInput.placeholder = (platform?platform.name+' — ':'')+'Auto-Generated Canvas';
  body.appendChild(el('label',{text:'Canvas Name',style:'display:block;font-size:11px;color:#94a3b8;margin-bottom:4px;font-weight:600;text-transform:uppercase;'}));
  body.appendChild(nameInput);

  // Include edges toggle
  var edgesLabel = div(''); edgesLabel.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:4px;';
  var edgesChk = document.createElement('input'); edgesChk.type='checkbox'; edgesChk.checked=true;
  edgesLabel.appendChild(edgesChk);
  edgesLabel.appendChild(el('span',{text:'Generate edges from parent → child relationships',style:'font-size:12px;color:#e2e8f0;'}));
  body.appendChild(edgesLabel);
  body.appendChild(el('p',{text:'Edge connection type is inferred from asset code prefix.',style:'font-size:11px;color:#475569;margin-bottom:16px;'}));

  showModal('Auto-Generate Canvas — '+(platform?platform.name:'Platform'), body, [
    { label: 'Generate Canvas', cls: 'primary', action: async function(close) {
        var selectedType = typeVar;
        var canvasName   = nameInput.value.trim() || nameInput.placeholder;
        var includeEdges = edgesChk.checked;

        // Filter assets to selected type
        var subset = selectedType === '__all__' ? assets : (typeGroups[selectedType] || []);
        if (!subset.length) { alert('No assets for this type.'); return; }

        // Build parent→children map (only within subset)
        var subsetIds = new Set(subset.map(function(a){ return a.id; }));
        var childrenMap = {};
        var roots = [];
        subset.forEach(function(a){
          var pid = a.parent_id;
          if (pid && subsetIds.has(pid)) {
            if (!childrenMap[pid]) childrenMap[pid] = [];
            childrenMap[pid].push(a.id);
          } else {
            roots.push(a.id);
          }
        });
        var assetById = {};
        subset.forEach(function(a){ assetById[a.id]=a; });

        // Node dimensions
        var NW=170, NH=70, GAP_X=40, GAP_Y=80;

        // Lay out roots side-by-side across the top
        var positions = {};
        var rootX = 40;
        roots.forEach(function(rid){
          var sw = calcSubtreeWidths(rid, childrenMap, NW, GAP_X);
          assignTreePositions(rid, rootX, 40, childrenMap, positions, NW, NH, GAP_X, GAP_Y);
          rootX += sw + GAP_X + 20;
        });

        // Build node objects
        var nodes = subset.map(function(a){
          var pos = positions[a.id] || {x:40, y:40};
          // Infer connection type for edges from code prefix
          var ct = autoCanvasTypeFromCode(a.asset_code||a.asset_id_label, a.asset_type);
          var connTypeMap = {power:'power_dc',network:'ethernet',rf:'coax',hvac:'other',physical:'other',custom:'other'};
          return {
            id:            'n-'+a.id,
            asset_id:      a.id,
            asset_code:    a.asset_code || a.asset_id_label || '',
            asset_name:    a.name || '',
            manufacturer:  a.manufacturer || '',
            model_number:  a.model || '',
            nsn:           a.nsn || a.part_number || '',
            cage_code:     a.cage_code || '',
            criticality:   a.criticality_code || null,
            type:          a.asset_type || 'hardware',
            label:         a.name || a.asset_code || 'Asset',
            x:             pos.x,
            y:             pos.y,
            w:             NW,
            h:             NH,
            _conn_type:    connTypeMap[ct] || 'other',
          };
        });

        // Build edges from parent→child
        var edges = [];
        if (includeEdges) {
          subset.forEach(function(a){
            var pid = a.parent_id;
            if (pid && subsetIds.has(pid)) {
              var parentNode = nodes.find(function(n){ return n.asset_id===pid; });
              var childNode  = nodes.find(function(n){ return n.asset_id===a.id; });
              if (parentNode && childNode) {
                edges.push({
                  id:        'e-'+pid+'-'+a.id,
                  from:      parentNode.id,
                  to:        childNode.id,
                  conn_type: childNode._conn_type,
                  label:     '',
                });
              }
            }
          });
        }

        // Strip internal _conn_type from nodes
        nodes.forEach(function(n){ delete n._conn_type; });

        // Determine canvas type
        var cType = selectedType === '__all__' ? 'custom' : selectedType;

        var canvasData = {
          name:         canvasName,
          canvas_type:  cType,
          platform_id:  platformId || null,
          canvas_data:  JSON.stringify({nodes: nodes, edges: edges}),
          description:  'Auto-generated from asset hierarchy ('+(new Date().toISOString().slice(0,10))+'). '+nodes.length+' nodes, '+edges.length+' edges.',
        };

        var created = await API.canvases.create(canvasData).catch(function(e){
          alert('Error creating canvas: '+e.message); return null;
        });
        close();
        if (created) {
          onDone && onDone();
          navigate('canvas-detail', created.id);
        }
    }},
    { label: 'Cancel', cls: '', action: function(close){ close(); }},
  ]);
}

function showCanvasForm(existing, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  f.name       = add('Canvas Name *', inp('e.g., C1 Network Topology', existing?.name||''));
  f.canvasType = add('Canvas Type', sel(CANVAS_TYPES, existing?.canvas_type||'custom'));
  f.version    = add('Revision', inp('e.g., A, B, C, 1.0', existing?.version||'A'));
  f.isLive     = add('Live Sync', sel([['0','No — Static drawing'],['1','Yes — Two-way sync with Asset Registry']], existing?.is_live?'1':'0'));

  Promise.all([API.platforms.list(), getAssets(), getShops()]).then(([platforms,assets,shops]) => {
    var platOpts = [['','— No Platform —']].concat(platforms.map(p=>[String(p.id),p.name]));
    f.platformId = add('Platform', sel(platOpts, existing?.platform_id?String(existing.platform_id):''));
    var shopOpts = [['','— No Shop —']].concat(shops.map(s=>[String(s.id),s.code+' — '+s.name]));
    f.shopId = add('Shop', sel(shopOpts, existing?.shop_id?String(existing.shop_id):''));
    var rootAssets = assets.filter(a=>!a.parent_id);
    var astOpts = [['','— No System Asset —']].concat(rootAssets.map(a=>[String(a.id),(a.asset_code||('#'+a.id))+' — '+a.name]));
    f.systemAssetId = add('System Asset (root node)', sel(astOpts, existing?.system_asset_id?String(existing.system_asset_id):''),false,'Links this canvas to the top-level asset it represents.');
  });

  modal(existing?'Edit Canvas':'New Canvas', fWrap, async()=>{
    if (!f.name.value.trim()) throw new Error('Canvas name is required.');
    var d = {
      name:            f.name.value.trim(),
      canvas_type:     f.canvasType.value,
      version:         f.version.value||'A',
      is_live:         f.isLive.value==='1',
      platform_id:     f.platformId?.value    ? parseInt(f.platformId.value)    : null,
      shop_id:         f.shopId?.value         ? parseInt(f.shopId.value)         : null,
      system_asset_id: f.systemAssetId?.value  ? parseInt(f.systemAssetId.value)  : null,
    };
    if (existing) await API.canvases.update(existing.id, d);
    else          await API.canvases.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Create Canvas');
}

// ── Platform-level drawing ────────────────────────────────────────────────
async function openPlatformDrawing(platformId) {
  var [platform, settings, allCanvases, allAssets] = await Promise.all([
    API.platforms.get(platformId).catch(()=>null),
    API.settings.get().catch(()=>({})),
    API.canvases.list({platform_id: platformId}).catch(()=>[]),
    getAssets().catch(()=>[]),
  ]);
  if (!platform) { alert('Platform not found.'); return; }

  var orgName  = settings.org_name  || 'Alto Technologies LLC';
  var cageCode = settings.cage_code || '—';
  var pubDate  = new Date().toISOString().slice(0,10);
  var assetById = {}; allAssets.forEach(function(a){ assetById[a.id]=a; });

  // Enrich canvas nodes
  allCanvases.forEach(function(cv){
    var cd = JSON.parse(cv.canvas_data || '{"nodes":[],"edges":[]}');
    cv._nodes = cd.nodes || [];
    cv._edges = cd.edges || [];
    cv._nodes.forEach(function(node){
      if (!node.asset_id) return;
      var a = assetById[node.asset_id]||assetById[String(node.asset_id)];
      if (!a) return;
      if (!node.asset_name || node.asset_name===node.label) node.asset_name = a.name||node.asset_name;
      if (!node.manufacturer) node.manufacturer = a.manufacturer||'';
      if (!node.model_number) node.model_number = a.model||'';
      if (!node.criticality)  node.criticality  = a.criticality||null;
    });
  });

  var LAYER_ORDER  = ['power','network','rf','hvac','physical','custom'];
  var LAYER_LABELS = {power:'POWER DISTRIBUTION',network:'DATA / NETWORK',rf:'RF / SIGNAL FLOW',hvac:'HVAC / MECHANICAL',physical:'PHYSICAL INSTALLATION',custom:'FUNCTIONAL SYSTEMS'};
  var LAYER_COLOR  = {power:'#dc2626',network:'#1d4ed8',rf:'#7c3aed',hvac:'#0891b2',physical:'#15803d',custom:'#334155'};

  // Collect present layers
  var layers = {};
  allCanvases.forEach(function(cv){
    var t = cv.canvas_type||'custom';
    if (!layers[t]) layers[t] = [];
    layers[t].push(cv);
  });
  var presentLayers = LAYER_ORDER.filter(function(l){return layers[l]&&layers[l].length;});
  allCanvases.forEach(function(cv){
    if (!LAYER_ORDER.includes(cv.canvas_type)) {
      if (!layers.custom) layers.custom=[];
      if (!layers.custom.includes(cv)) layers.custom.push(cv);
      if (!presentLayers.includes('custom')) presentLayers.push('custom');
    }
  });

  // ── Platform Architecture SVG ──────────────────────────────────────
  var BOX_W=200, BOX_HBASE=80, NODE_H=14, BOX_GAP_X=24, BOX_GAP_Y=32;
  var LANE_PAD=16, LANE_LABEL_H=22;
  var svgRows=[]; var svgH=20;

  presentLayers.forEach(function(lt){
    var cvs = layers[lt]||[];
    var rowH = LANE_LABEL_H + Math.max.apply(null, cvs.map(function(cv){
      return BOX_HBASE + Math.max(0, cv._nodes.length-3)*NODE_H;
    })) + BOX_GAP_Y;
    svgRows.push({lt:lt, cvs:cvs, y:svgH, h:rowH});
    svgH += rowH;
  });
  svgH += 20;
  var svgW = Math.max(700, presentLayers.length ? Math.max.apply(null, presentLayers.map(function(lt){
    return (layers[lt]||[]).length * (BOX_W+BOX_GAP_X) + LANE_PAD*2;
  })) : 700);

  var archSvg='<svg xmlns="http://www.w3.org/2000/svg" width="'+svgW+'" height="'+svgH+'" style="background:#fff;border:1px solid #e2e8f0;font-family:Arial,sans-serif;">';

  svgRows.forEach(function(row){
    var col  = LAYER_COLOR[row.lt]||'#334155';
    var lbl  = LAYER_LABELS[row.lt]||row.lt.toUpperCase();
    // Lane background
    archSvg+='<rect x="0" y="'+row.y+'" width="'+svgW+'" height="'+row.h+'" fill="'+col+'08" stroke="'+col+'33" stroke-width="0.5"/>';
    // Lane label
    archSvg+='<text x="12" y="'+(row.y+15)+'" font-size="10" font-weight="800" fill="'+col+'" letter-spacing="1">'+lbl+'</text>';

    row.cvs.forEach(function(cv, ci){
      var bx = LANE_PAD + ci*(BOX_W+BOX_GAP_X);
      var by = row.y + LANE_LABEL_H;
      var bh = BOX_HBASE + Math.max(0, cv._nodes.length-3)*NODE_H;
      // Box
      archSvg+='<rect x="'+bx+'" y="'+by+'" width="'+BOX_W+'" height="'+bh+'" rx="5" fill="#fff" stroke="'+col+'" stroke-width="1.5"/>';
      // Header strip
      archSvg+='<rect x="'+bx+'" y="'+by+'" width="'+BOX_W+'" height="22" rx="4" fill="'+col+'"/>';
      // Canvas name
      var cvName = cv.name.length>26 ? cv.name.slice(0,25)+'…' : cv.name;
      archSvg+='<text x="'+(bx+BOX_W/2)+'" y="'+(by+13)+'" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="700" fill="#fff">'+cvName+'</text>';
      // Node count
      archSvg+='<text x="'+(bx+BOX_W-6)+'" y="'+(by+35)+'" text-anchor="end" font-size="8" fill="'+col+'" font-weight="700">'+cv._nodes.length+' items</text>';
      // Node list (first 6)
      cv._nodes.slice(0,6).forEach(function(node, ni){
        var ny=by+34+ni*NODE_H;
        var nName=(node.asset_name||node.label||'—').slice(0,24);
        var nModel=(node.model_number||'').slice(0,16);
        archSvg+='<text x="'+(bx+8)+'" y="'+ny+'" font-size="8" fill="#1e293b">'+nName+'</text>';
        if(nModel) archSvg+='<text x="'+(bx+BOX_W-6)+'" y="'+ny+'" text-anchor="end" font-size="7" fill="#94a3b8">'+nModel+'</text>';
        // Criticality dot
        if(node.criticality && CRIT_PRINT_PLAT[node.criticality]){
          archSvg+='<circle cx="'+(bx+BOX_W-32)+'" cy="'+(ny-3)+'" r="3" fill="'+CRIT_PRINT_PLAT[node.criticality]+'"/>';
        }
      });
      if(cv._nodes.length>6) archSvg+='<text x="'+(bx+8)+'" y="'+(by+34+6*NODE_H)+'" font-size="7" fill="#94a3b8">…+'+(cv._nodes.length-6)+' more</text>';
      // Drawing number badge
      if(cv.drawing_doc_id || cv.published_rev){
        archSvg+='<text x="'+(bx+6)+'" y="'+(by+bh-5)+'" font-size="7" fill="'+col+'" font-family="monospace">'+(cv.published_rev?'Rev '+cv.published_rev:'Unpublished')+'</text>';
      }
    });
  });
  archSvg+='</svg>';

  var CRIT_PRINT_PLAT={CR:'#dc2626',DE:'#ea580c',RD:'#d97706',SP:'#2563eb',AD:'#64748b'};

  // Title block builder
  function titleBlock(sheet, total) {
    return '<div class="title-block">'
      +'<div class="tb-title"><div class="tb-label">TITLE</div><div class="tb-value" style="font-size:11px;font-weight:700;">'+orgName+'<br>'+platform.name+' — SYSTEM ARCHITECTURE</div></div>'
      +'<div class="tb-right">'
        +'<div class="tb-row"><div class="tb-cell"><div class="tb-label">SIZE</div><div class="tb-value">B</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">CAGE CODE</div><div class="tb-value">'+cageCode+'</div></div>'
          +'<div class="tb-cell" style="flex:3;"><div class="tb-label">DRAWING NUMBER</div><div class="tb-value" style="font-family:monospace;">PLAT-'+String(platformId).padStart(4,'0')+'-ARCH</div></div>'
          +'<div class="tb-cell"><div class="tb-label">REV</div><div class="tb-value" style="font-weight:800;">A</div></div></div>'
        +'<div class="tb-row">'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">PLATFORM</div><div class="tb-value">'+platform.name+'</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">DATE</div><div class="tb-value">'+pubDate+'</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">SHEET</div><div class="tb-value">'+sheet+' OF '+total+'</div></div>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  var totalSheets = 1 + allCanvases.length; // arch + one per system canvas

  // Sheet index rows
  var sheetIndexRows = allCanvases.map(function(cv,i){
    var typeLabel = LAYER_LABELS[cv.canvas_type]||cv.canvas_type;
    return '<tr><td>'+(i+2)+'</td><td>'+cv.name+'</td><td>'+typeLabel+'</td><td>'+(cv.published_rev||'Unpublished')+'</td></tr>';
  }).join('');

  // Per-system SVG sheets
  var systemSheets = allCanvases.map(function(cv, i){
    var nodes2 = cv._nodes; var edges2 = cv._edges;
    var col2 = LAYER_COLOR[cv.canvas_type]||'#334155';
    var allX2=nodes2.map(function(n){return n.x+(n.w||170);}); var allY2=nodes2.map(function(n){return n.y+(n.h||70);});
    var sW=Math.max(600,allX2.length?Math.max.apply(null,allX2)+80:600);
    var sH=Math.max(350,allY2.length?Math.max.apply(null,allY2)+80:350);

    var eSvg='', nSvg='';
    edges2.forEach(function(e){
      var s=nodes2.find(function(n){return n.id===e.from;}); var d2=nodes2.find(function(n){return n.id===e.to;});
      if(!s||!d2) return;
      var x1=s.x+(s.w||170)/2, y1=s.y+(s.h||70)/2, x2=d2.x+(d2.w||170)/2, y2=d2.y+(d2.h||70)/2;
      var ec=e.conn_type?({fiber:'#ea580c',ethernet:'#16a34a',coax:'#ca8a04',serial_232:'#7c3aed',serial_485:'#a855f7',power_ac:'#dc2626',power_dc:'#2563eb',waveguide:'#0891b2',optical:'#db2777',can_bus:'#ea580c'}[e.conn_type]||'#94a3b8'):'#94a3b8';
      eSvg+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+ec+'" stroke-width="1.5" marker-end="url(#arr2)"/>';
      if(e.conn_type||e.label){var lp=(e.conn_type||'').replace('_',' ').toUpperCase()+(e.label?' · '+e.label:'');var mx=(x1+x2)/2,my=(y1+y2)/2;var tw=lp.length*5+8;eSvg+='<rect x="'+(mx-tw/2)+'" y="'+(my-8)+'" width="'+tw+'" height="12" fill="#fff" rx="2"/><text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="'+ec+'" font-weight="700">'+lp+'</text>';}
    });
    nodes2.forEach(function(n){
      var nw=n.w||170, nh=n.h||70;
      var bc=col2;
      var nm=n.asset_name||n.label||'—', md=[n.manufacturer,n.model_number].filter(Boolean).join(' · ');
      nSvg+='<rect x="'+n.x+'" y="'+n.y+'" width="'+nw+'" height="'+nh+'" rx="4" fill="#fff" stroke="'+bc+'" stroke-width="1.5"/>';
      nSvg+='<rect x="'+n.x+'" y="'+n.y+'" width="'+nw+'" height="5" rx="2" fill="'+bc+'"/>';
      nSvg+='<text x="'+(n.x+nw/2)+'" y="'+(n.y+25)+'" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#1e293b" font-family="Arial,sans-serif">'+nm.slice(0,22)+'</text>';
      if(md){nSvg+='<line x1="'+(n.x+8)+'" y1="'+(n.y+37)+'" x2="'+(n.x+nw-8)+'" y2="'+(n.y+37)+'" stroke="#e2e8f0" stroke-width="0.5"/>';nSvg+='<text x="'+(n.x+nw/2)+'" y="'+(n.y+52)+'" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#64748b" font-family="Arial,sans-serif">'+md.slice(0,26)+'</text>';}
      if(n.criticality&&{CR:'#dc2626',DE:'#ea580c',RD:'#d97706',SP:'#2563eb',AD:'#64748b'}[n.criticality]){var cc={CR:'#dc2626',DE:'#ea580c',RD:'#d97706',SP:'#2563eb',AD:'#64748b'}[n.criticality];nSvg+='<rect x="'+(n.x+nw-26)+'" y="'+(n.y+8)+'" width="22" height="13" rx="3" fill="'+cc+'22" stroke="'+cc+'" stroke-width="0.8"/><text x="'+(n.x+nw-15)+'" y="'+(n.y+15)+'" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="'+cc+'" font-weight="800">'+n.criticality+'</text>';}
    });
    var sysSvg='<svg xmlns="http://www.w3.org/2000/svg" width="'+sW+'" height="'+sH+'" style="background:#fff;"><defs><marker id="arr2" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#94a3b8"/></marker></defs>'+eSvg+nSvg+'</svg>';

    var typeLabel2 = (LAYER_LABELS[cv.canvas_type]||cv.canvas_type.toUpperCase())+' — '+cv.name;
    return '<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
      +'<div class="sheet-content"><div class="sheet-title">'+typeLabel2+'</div><div style="overflow:auto;margin-top:8px;">'+sysSvg+'</div></div>'
      +titleBlock(i+2, totalSheets)+'</div></div>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+platform.name+' — Platform Architecture Drawing</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0;}'
    +'body{background:#e5e7eb;font-family:Arial,sans-serif;font-size:11px;color:#1e293b;}'
    +'.sheet{width:17in;min-height:11in;background:#fff;margin:20px auto;position:relative;page-break-after:always;}'
    +'@media print{.sheet{margin:0;page-break-after:always;width:100%;}body{background:#fff;}.no-print{display:none!important;}}'
    +'.sheet-border{border:2px solid #000;margin:0.4in 0.38in 0.38in 0.75in;min-height:9.9in;display:flex;flex-direction:column;}'
    +'.zone-bar{display:flex;justify-content:space-around;border-bottom:1px solid #000;padding:2px 0;font-size:9px;font-weight:700;color:#666;}'
    +'.sheet-content{flex:1;padding:16px;overflow:hidden;}'
    +'.sheet-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:12px;}'
    +'.title-block{display:flex;border-top:2px solid #000;height:90px;}'
    +'.tb-title{flex:2;border-right:1px solid #000;padding:4px 6px;display:flex;flex-direction:column;}'
    +'.tb-right{flex:3;display:flex;flex-direction:column;}'
    +'.tb-row{display:flex;flex:1;border-top:1px solid #000;}'
    +'.tb-row:first-child{border-top:none;}'
    +'.tb-cell{flex:1;border-right:1px solid #000;padding:2px 5px;display:flex;flex-direction:column;}'
    +'.tb-cell:last-child{border-right:none;}'
    +'.tb-label{font-size:7px;color:#666;text-transform:uppercase;}'
    +'.tb-value{font-size:10px;font-weight:600;flex:1;display:flex;align-items:center;}'
    +'table{width:100%;border-collapse:collapse;}'
    +'th{background:#1e293b;color:#fff;padding:5px 8px;font-size:9px;text-transform:uppercase;text-align:left;}'
    +'td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;}'
    +'.toolbar{background:#1e293b;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:99;}'
    +'.toolbar button{background:#38bdf8;color:#000;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:700;}'
    +'</style></head><body>'
    +'<div class="toolbar no-print"><strong>'+platform.name+' — Platform Architecture Drawing</strong>'
    +'<button onclick="window.print()">🖨 Print / Save PDF</button>'
    +'<span style="opacity:.5;font-size:10px;">Landscape · '+totalSheets+' sheets total</span></div>'

    // Sheet 1: Platform Architecture
    +'<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
    +'<div class="sheet-content">'
    +'<div class="sheet-title">SYSTEM ARCHITECTURE — '+platform.name+'</div>'
    +'<div style="overflow:auto;margin-bottom:14px;">'+archSvg+'</div>'
    +'<table><thead><tr><th>Sheet</th><th>System / Canvas</th><th>Layer</th><th>Rev</th></tr></thead><tbody>'
    +'<tr><td>1</td><td>Platform Architecture Overview</td><td>ALL LAYERS</td><td>A</td></tr>'
    +sheetIndexRows
    +'</tbody></table>'
    +'</div>'
    +titleBlock(1, totalSheets)+'</div></div>'

    // Per-system sheets
    +systemSheets
    +'</body></html>';

  var win=window.open('','_blank');
  if (win){ win.document.write(html); win.document.close(); }
  else alert('Pop-up blocked — allow pop-ups to view the platform drawing.');
}

async function openMilStdDrawing(canvas, doc, revisions, canvasNodes) {
  // Fetch supporting data in parallel
  var [platform, settings, allAssets] = await Promise.all([
    canvas.platform_id ? API.platforms.get(canvas.platform_id).catch(()=>null) : Promise.resolve(null),
    API.settings.get().catch(()=>({})),
    getAssets().catch(()=>[]),
  ]);
  var orgName  = settings.org_name  || 'Alto Technologies LLC';
  var cageCode = settings.cage_code || '—';

  // Physical canvas for elevation sheet
  var physCanvas = null;
  if (canvas.platform_id && canvas.canvas_type !== 'physical') {
    var allCanvases = await API.canvases.list({platform_id: canvas.platform_id}).catch(()=>[]);
    physCanvas = allCanvases.find(function(c){ return c.canvas_type === 'physical' && c.id !== canvas.id; }) || null;
  }

  var TYPE_DRAWING_TITLES = {
    network:  'NETWORK TOPOLOGY DIAGRAM',
    hvac:     'HVAC/MECHANICAL SCHEMATIC',
    power:    'SINGLE LINE POWER DIAGRAM',
    rf:       'FUNCTIONAL BLOCK DIAGRAM / RF SIGNAL FLOW',
    physical: 'INSTALLATION / FLOOR PLAN DRAWING',
    custom:   'SYSTEM FUNCTIONAL BLOCK DIAGRAM',
  };
  var TYPE_ACCENT = {
    network:'#1d4ed8', power:'#dc2626', rf:'#7c3aed',
    hvac:'#0891b2', physical:'#15803d', custom:'#334155',
  };
  var drawingTitle = TYPE_DRAWING_TITLES[canvas.canvas_type] || 'SYSTEM DRAWING';
  var accentColor  = TYPE_ACCENT[canvas.canvas_type] || '#334155';
  var currentRev   = doc.current_rev || (revisions.length ? revisions[revisions.length-1].revision : 'A');
  var pubDate      = doc.updated_at ? doc.updated_at.slice(0,10) : new Date().toISOString().slice(0,10);
  var platformName = platform ? platform.name : '—';

  // ── Use enriched canvasNodes param; enrich any still-stale nodes ──
  var assetById = {}; allAssets.forEach(function(a){ assetById[a.id]=a; });
  var cd   = JSON.parse(canvas.canvas_data || '{"nodes":[],"edges":[]}');
  var nodes = (canvasNodes && canvasNodes.length) ? canvasNodes : (cd.nodes || []);
  var edges = cd.edges || [];

  nodes.forEach(function(node) {
    if (!node.asset_id) return;
    var a = assetById[node.asset_id] || assetById[String(node.asset_id)];
    if (!a) return;
    if (!node.asset_name || node.asset_name === node.label || node.asset_name === node.asset_code)
      node.asset_name = a.name || node.asset_name;
    if (!node.manufacturer) node.manufacturer = a.manufacturer || '';
    if (!node.model_number) node.model_number = a.model        || '';
    if (!node.nsn)          node.nsn          = a.nsn          || a.part_number || '';
    if (!node.cage_code)    node.cage_code    = a.cage_code    || '';
    if (!node.criticality)  node.criticality  = a.criticality  || null;
  });

  var sheetCount = 4 + (physCanvas ? 1 : 0);

  // ── SVG re-render (print-optimised, light background) ────────────
  var CRIT_PRINT = {CR:'#dc2626',DE:'#ea580c',RD:'#d97706',SP:'#2563eb',AD:'#64748b'};
  var CONN_PRINT = {
    fiber:'#ea580c', ethernet:'#16a34a', coax:'#ca8a04',
    serial_232:'#7c3aed', serial_485:'#a855f7',
    power_ac:'#dc2626', power_dc:'#2563eb',
    waveguide:'#0891b2', optical:'#db2777', can_bus:'#ea580c',
  };
  var CONN_DASH = {
    fiber:'8,3', coax:'3,3', serial_232:'6,2', serial_485:'4,2',
    waveguide:'2,4', optical:'5,2', can_bus:'3,2',
  };

  var NW=170, NH=70;
  var allX=nodes.map(function(n){return n.x+(n.w||NW);}); var allY=nodes.map(function(n){return n.y+(n.h||NH);});
  var svgW=Math.max(700, allX.length?Math.max.apply(null,allX)+80:700);
  var svgH=Math.max(450, allY.length?Math.max.apply(null,allY)+80:450);

  // Build per-connection-type markers
  var markerDefs='<marker id="arr-default" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#64748b"/></marker>';
  Object.keys(CONN_PRINT).forEach(function(k){
    markerDefs+='<marker id="arr-'+k+'" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="'+CONN_PRINT[k]+'"/></marker>';
  });

  var edgeSvg=''; var nodeSvg='';

  // Edges first (under nodes)
  edges.forEach(function(e){
    var s=nodes.find(function(n){return n.id===e.from;}); var d2=nodes.find(function(n){return n.id===e.to;});
    if(!s||!d2) return;
    var sw=s.w||NW, sh=s.h||NH, dw=d2.w||NW, dh=d2.h||NH;
    var x1=s.x+sw/2, y1=s.y+sh/2, x2=d2.x+dw/2, y2=d2.y+dh/2;
    var col  = e.conn_type ? (CONN_PRINT[e.conn_type]||'#64748b') : '#94a3b8';
    var dash = e.conn_type ? (CONN_DASH[e.conn_type]||'')         : '';
    var mark = e.conn_type && CONN_PRINT[e.conn_type] ? 'url(#arr-'+e.conn_type+')' : 'url(#arr-default)';
    edgeSvg+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2
      +'" stroke="'+col+'" stroke-width="1.5"'+(dash?' stroke-dasharray="'+dash+'"':'')+' marker-end="'+mark+'"/>';
    var mx=(x1+x2)/2, my=(y1+y2)/2;
    var lparts=[e.conn_type?e.conn_type.replace('_',' ').toUpperCase():'', e.label||''].filter(Boolean).join(' · ');
    if(lparts){
      var tw=lparts.length*5+8;
      edgeSvg+='<rect x="'+(mx-tw/2)+'" y="'+(my-8)+'" width="'+tw+'" height="12" fill="#fff" rx="2"/>';
      edgeSvg+='<text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="'+col+'" font-weight="700">'+lparts+'</text>';
    }
  });

  // Nodes
  var TYPE_BORDER = {network:'#1d4ed8',power:'#dc2626',rf:'#7c3aed',hvac:'#0891b2',physical:'#15803d',software:'#15803d',firmware:'#92400e',hardware:'#334155',custom:'#334155'};
  nodes.forEach(function(n){
    var nw=n.w||NW, nh=n.h||NH;
    var borderCol = TYPE_BORDER[n.type]||'#334155';
    var name  = n.asset_name || n.label || '—';
    var model = [n.manufacturer, n.model_number].filter(Boolean).join(' · ');

    // Node box — white fill, colored border + top strip
    nodeSvg+='<rect x="'+n.x+'" y="'+n.y+'" width="'+nw+'" height="'+nh+'" rx="4" fill="#fff" stroke="'+borderCol+'" stroke-width="1.5"/>';
    // Color strip top
    nodeSvg+='<rect x="'+n.x+'" y="'+n.y+'" width="'+nw+'" height="5" rx="2" fill="'+borderCol+'"/>';
    // Name (line 1)
    nodeSvg+='<text x="'+(n.x+nw/2)+'" y="'+(n.y+25)+'" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#1e293b" font-family="Arial,sans-serif">'+name.slice(0,22)+'</text>';
    // Divider
    if(model){
      nodeSvg+='<line x1="'+(n.x+8)+'" y1="'+(n.y+37)+'" x2="'+(n.x+nw-8)+'" y2="'+(n.y+37)+'" stroke="#e2e8f0" stroke-width="0.5"/>';
      nodeSvg+='<text x="'+(n.x+nw/2)+'" y="'+(n.y+52)+'" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#64748b" font-family="Arial,sans-serif">'+model.slice(0,26)+'</text>';
    }
    // Criticality badge top-right
    if(n.criticality && CRIT_PRINT[n.criticality]){
      var cc=CRIT_PRINT[n.criticality];
      nodeSvg+='<rect x="'+(n.x+nw-26)+'" y="'+(n.y+8)+'" width="22" height="13" rx="3" fill="'+cc+'22" stroke="'+cc+'" stroke-width="0.8"/>';
      nodeSvg+='<text x="'+(n.x+nw-15)+'" y="'+(n.y+15)+'" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="'+cc+'" font-weight="800" font-family="Arial,sans-serif">'+n.criticality+'</text>';
    }
  });

  var diagramSvg='<svg xmlns="http://www.w3.org/2000/svg" width="'+svgW+'" height="'+svgH+'" style="background:#fff;border:1px solid #e2e8f0;">'
    +'<defs>'+markerDefs+'</defs>'
    +edgeSvg+nodeSvg+'</svg>';

  // ── Parts list table rows ──────────────────────────────────────
  var partsRows='';
  nodes.forEach(function(n,i){
    partsRows+='<tr>'
      +'<td>'+(i+1)+'</td>'
      +'<td>'+(n.asset_name||n.label||'—')+'</td>'
      +'<td>'+(n.manufacturer||'—')+'</td>'
      +'<td style="font-family:monospace;">'+(n.model_number||'—')+'</td>'
      +'<td style="font-family:monospace;">'+(n.nsn||'—')+'</td>'
      +'<td style="font-family:monospace;">'+(n.cage_code||'—')+'</td>'
      +'<td>'+(n.criticality||'—')+'</td>'
      +'</tr>';
  });

  // ── Interface list table rows ──────────────────────────────────
  var CONN_TYPE_LABELS={'fiber':'Fiber Optic','ethernet':'Ethernet / Cat','coax':'Coaxial','serial_232':'RS-232 Serial','serial_485':'RS-485 Serial','power_ac':'Power (AC)','power_dc':'Power (DC)','waveguide':'Waveguide','optical':'Optical','can_bus':'CAN Bus','other':'Other'};
  var ifaceRows='';
  edges.forEach(function(e,i){
    var s=nodes.find(function(n){return n.id===e.from;})||{};
    var d2=nodes.find(function(n){return n.id===e.to;})||{};
    ifaceRows+='<tr><td>'+(i+1)+'</td>'
      +'<td>'+(s.asset_name||s.label||'—')+'</td>'
      +'<td>'+(d2.asset_name||d2.label||'—')+'</td>'
      +'<td>'+(e.conn_type?CONN_TYPE_LABELS[e.conn_type]||e.conn_type:'—')+'</td>'
      +'<td>'+(e.label||'—')+'</td></tr>';
  });

  // ── Revision history rows ──────────────────────────────────────
  var revRows='';
  (revisions||[]).slice().reverse().forEach(function(r){
    revRows+='<tr><td style="font-family:monospace;font-weight:700;">'+r.revision+'</td>'
      +'<td>'+(r.created_at||'').slice(0,10)+'</td>'
      +'<td>'+r.change_desc+'</td>'
      +'<td>'+(r.author||'—')+'</td>'
      +'<td>'+(r.approved_by||'—')+'</td></tr>';
  });

  // ── Title block HTML (MIL-STD-100G style) ─────────────────────
  function titleBlock(sheet, totalSheets) {
    return '<div class="title-block">'
      +'<div class="tb-title"><div class="tb-label">TITLE</div><div class="tb-value" style="font-size:11px;font-weight:700;">'+orgName+'<br>'+canvas.name+'</div></div>'
      +'<div class="tb-right">'
        +'<div class="tb-row"><div class="tb-cell"><div class="tb-label">SIZE</div><div class="tb-value">B</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">CAGE CODE</div><div class="tb-value">'+cageCode+'</div></div>'
          +'<div class="tb-cell" style="flex:3;"><div class="tb-label">DRAWING NUMBER</div><div class="tb-value" style="font-family:monospace;font-size:10px;">'+doc.doc_number+'</div></div>'
          +'<div class="tb-cell"><div class="tb-label">REV</div><div class="tb-value" style="font-weight:800;">'+currentRev+'</div></div></div>'
        +'<div class="tb-row">'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">PLATFORM</div><div class="tb-value">'+platformName+'</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">DATE</div><div class="tb-value">'+pubDate+'</div></div>'
          +'<div class="tb-cell" style="flex:2;"><div class="tb-label">SHEET</div><div class="tb-value">'+sheet+' OF '+totalSheets+'</div></div>'
        +'</div>'
        +'<div class="tb-row">'
          +'<div class="tb-cell" style="flex:3;"><div class="tb-label">APPROVED BY</div><div class="tb-value">'+(revisions&&revisions[revisions.length-1]?.approved_by||'—')+'</div></div>'
          +'<div class="tb-cell" style="flex:5;"><div class="tb-label">DRAWING TYPE</div><div class="tb-value" style="font-size:9px;">'+drawingTitle+'</div></div>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  // ── Elevation / physical sheet ─────────────────────────────────
  var elevationSheet='';
  if (physCanvas) {
    var pcd=JSON.parse(physCanvas.canvas_data||'{"nodes":[],"edges":[]}');
    var pnodes=pcd.nodes||[]; var pedges=pcd.edges||[];
    var pX=pnodes.map(function(n){return n.x+NW;}); var pY=pnodes.map(function(n){return n.y+NH;});
    var psvgW=Math.max(600,pX.length?Math.max.apply(null,pX)+60:600);
    var psvgH=Math.max(400,pY.length?Math.max.apply(null,pY)+60:400);
    var pedgeSvg='',pnodeSvg='';
    pedges.forEach(function(e){
      var s=pnodes.find(function(n){return n.id===e.from;}); var d2=pnodes.find(function(n){return n.id===e.to;});
      if(!s||!d2) return;
      pedgeSvg+='<line x1="'+(s.x+NW/2)+'" y1="'+(s.y+NH/2)+'" x2="'+(d2.x+NW/2)+'" y2="'+(d2.y+NH/2)+'" stroke="#334155" stroke-width="1.5"/>';
    });
    pnodes.forEach(function(n){
      var nw=n.w||NW, nh=n.h||NH;
      pnodeSvg+='<rect x="'+n.x+'" y="'+n.y+'" width="'+nw+'" height="'+nh+'" rx="4" fill="#f0f4f8" stroke="#64748b" stroke-width="1"/>';
      pnodeSvg+='<text x="'+(n.x+nw/2)+'" y="'+(n.y+NH/2)+'" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#1e293b">'+(n.asset_name||n.label||'').slice(0,18)+'</text>';
    });
    var physSvg='<svg xmlns="http://www.w3.org/2000/svg" width="'+psvgW+'" height="'+psvgH+'" style="background:#fff;">'+pedgeSvg+pnodeSvg+'</svg>';
    elevationSheet='<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
      +'<div class="sheet-content"><div class="sheet-title">INSTALLATION / FLOOR PLAN DRAWING — '+physCanvas.name+'</div>'
      +'<div style="overflow:auto;margin-top:8px;">'+physSvg+'</div></div>'
      +titleBlock(3, totalSheets)+'</div></div>';
  } else {
    elevationSheet='<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
      +'<div class="sheet-content"><div class="sheet-title">INSTALLATION / ELEVATION DRAWING</div>'
      +'<div style="margin-top:40px;text-align:center;color:#64748b;font-size:13px;padding:40px;">'
      +'No physical layout canvas found for this platform.<br>Create a canvas of type "Physical Layout" for this platform to auto-include the elevation drawing here.<br><br>'
      +'Reference: '+doc.doc_number+'-ELEV (to be issued separately)'
      +'</div></div>'+titleBlock(3, sheetCount)+'</div></div>';
  }

  var totalSheets = sheetCount;

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'
    +'<title>'+doc.doc_number+' Rev '+currentRev+' — '+canvas.name+'</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0;}'
    +'body{background:#e5e7eb;font-family:"Arial",sans-serif;font-size:11px;color:#1e293b;}'
    +'.sheet{width:17in;min-height:11in;background:#fff;margin:20px auto;position:relative;page-break-after:always;}'
    +'@media print{'
      +'.sheet{margin:0;page-break-after:always;width:100%;}'
      +'body{background:#fff;}'
      +'.no-print{display:none!important;}'
    +'}'
    +'.sheet-border{border:2px solid #000;margin:0.4in 0.38in 0.38in 0.75in;min-height:9.9in;display:flex;flex-direction:column;}'
    +'.zone-bar{display:flex;justify-content:space-around;border-bottom:1px solid #000;padding:2px 0;font-size:9px;font-weight:700;color:#666;}'
    +'.sheet-content{flex:1;padding:16px;overflow:hidden;}'
    +'.sheet-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:12px;}'
    /* Title block */
    +'.title-block{display:flex;border-top:2px solid #000;height:90px;}'
    +'.tb-title{flex:2;border-right:1px solid #000;padding:4px 6px;display:flex;flex-direction:column;}'
    +'.tb-right{flex:3;display:flex;flex-direction:column;}'
    +'.tb-row{display:flex;flex:1;border-top:1px solid #000;}'
    +'.tb-row:first-child{border-top:none;}'
    +'.tb-cell{flex:1;border-right:1px solid #000;padding:2px 5px;display:flex;flex-direction:column;}'
    +'.tb-cell:last-child{border-right:none;}'
    +'.tb-label{font-size:7px;color:#666;text-transform:uppercase;letter-spacing:0.3px;}'
    +'.tb-value{font-size:10px;font-weight:600;flex:1;display:flex;align-items:center;}'
    /* Cover sheet */
    +'.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;}'
    +'.cover-field{border-bottom:1px solid #64748b;padding:6px 0 3px;margin-bottom:12px;}'
    +'.cover-label{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:0.5px;}'
    +'.cover-value{font-size:12px;font-weight:600;margin-top:2px;}'
    +'.sheet-index{margin-top:20px;}'
    +'.sheet-index th{background:#1e293b;color:#fff;padding:5px 8px;font-size:9px;text-transform:uppercase;}'
    +'.sheet-index td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;}'
    /* Parts / interface tables */
    +'table.data-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:10px;}'
    +'table.data-table th{background:#1e293b;color:#fff;padding:5px 8px;text-align:left;}'
    +'table.data-table td{padding:5px 8px;border-bottom:1px solid #e2e8f0;}'
    +'table.data-table tr:nth-child(even) td{background:#f8fafc;}'
    /* Print toolbar */
    +'.toolbar{background:#1e293b;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:99;}'
    +'.toolbar button{background:#38bdf8;color:#000;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:700;font-size:12px;}'
    +'</style></head><body>'
    // Toolbar
    +'<div class="toolbar no-print">'
      +'<strong>'+doc.doc_number+' Rev '+currentRev+'</strong>'
      +'<span style="opacity:.6;">'+canvas.name+'</span>'
      +'<button onclick="window.print()">🖨 Print / Save PDF</button>'
      +'<span style="opacity:.5;font-size:10px;">Use landscape for best results · Print all '+totalSheets+' sheets</span>'
    +'</div>'

    // ── Sheet 1: Cover / Title Page ────────────────────────────
    +'<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
    +'<div class="sheet-content">'
    +'<div style="text-align:center;margin-bottom:24px;">'
      +'<div style="font-size:9px;color:#666;letter-spacing:2px;text-transform:uppercase;">'+orgName+'</div>'
      +'<div style="font-size:20px;font-weight:900;margin:6px 0;">'+canvas.name+'</div>'
      +'<div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">'+drawingTitle+'</div>'
    +'</div>'
    +'<div class="cover-grid">'
      +'<div><div class="cover-field"><div class="cover-label">Drawing Number</div><div class="cover-value" style="font-family:monospace;">'+doc.doc_number+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">Revision</div><div class="cover-value">'+currentRev+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">Platform</div><div class="cover-value">'+platformName+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">Date</div><div class="cover-value">'+pubDate+'</div></div></div>'
      +'<div><div class="cover-field"><div class="cover-label">Organization</div><div class="cover-value">'+orgName+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">CAGE Code</div><div class="cover-value">'+cageCode+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">Canvas Type</div><div class="cover-value">'+drawingTitle+'</div></div>'
      +'<div class="cover-field"><div class="cover-label">Current Revision</div><div class="cover-value">'+currentRev+'</div></div></div>'
    +'</div>'
    // Sheet index
    +'<table class="sheet-index data-table" style="margin-top:20px;">'
      +'<thead><tr><th>Sheet</th><th>Title</th><th>Rev</th></tr></thead><tbody>'
      +'<tr><td>1</td><td>Cover / Title Page</td><td>'+currentRev+'</td></tr>'
      +'<tr><td>2</td><td>'+drawingTitle+' — '+canvas.name+'</td><td>'+currentRev+'</td></tr>'
      +(physCanvas?'<tr><td>3</td><td>Installation / Floor Plan — '+physCanvas.name+'</td><td>'+currentRev+'</td></tr>':'<tr><td>3</td><td>Installation / Elevation Drawing (see reference)</td><td>—</td></tr>')
      +'<tr><td>'+(physCanvas?4:3)+'</td><td>Equipment / Parts List</td><td>'+currentRev+'</td></tr>'
      +'<tr><td>'+(physCanvas?5:4)+'</td><td>Interface / Connection List</td><td>'+currentRev+'</td></tr>'
      +'</tbody></table>'
    +'</div>'
    +titleBlock(1, totalSheets)+'</div></div>'

    // ── Sheet 2: Block Diagram ─────────────────────────────────
    +'<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
    +'<div class="sheet-content"><div class="sheet-title">'+drawingTitle+'</div>'
    +'<div style="overflow:auto;">'+diagramSvg+'</div></div>'
    +titleBlock(2, totalSheets)+'</div></div>'

    // ── Sheet 3: Elevation / Physical ─────────────────────────
    +elevationSheet

    // ── Sheet 4 (or 3): Equipment / Parts List ────────────────
    +'<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
    +'<div class="sheet-content"><div class="sheet-title">EQUIPMENT / PARTS LIST</div>'
    +'<table class="data-table">'
      +'<thead><tr><th>#</th><th>Name / Description</th><th>Manufacturer</th><th>Model / Part No.</th><th>NSN</th><th>CAGE</th><th>Crit</th></tr></thead>'
      +'<tbody>'+partsRows+'</tbody></table>'
    +(nodes.length===0?'<div style="text-align:center;color:#64748b;margin-top:40px;">No nodes defined on canvas.</div>':'')
    +'</div>'
    +titleBlock(physCanvas?4:3, totalSheets)+'</div></div>'

    // ── Sheet 5 (or 4): Interface / Connection List ────────────
    +'<div class="sheet"><div class="sheet-border"><div class="zone-bar"><span>D</span><span>C</span><span>B</span><span>A</span></div>'
    +'<div class="sheet-content"><div class="sheet-title">INTERFACE / CONNECTION LIST</div>'
    +'<table class="data-table">'
      +'<thead><tr><th>#</th><th>From</th><th>To</th><th>Connection Type</th><th>Signal / Label</th></tr></thead>'
      +'<tbody>'+ifaceRows+'</tbody></table>'
    +(edges.length===0?'<div style="text-align:center;color:#64748b;margin-top:40px;">No connections defined on canvas.</div>':'')
    +'<div style="margin-top:24px;">'
    +'<table class="data-table"><thead><tr><th>Rev</th><th>Date</th><th>Description</th><th>Author</th><th>Approved By</th></tr></thead>'
    +'<tbody>'+revRows+'</tbody></table>'
    +'</div>'
    +'</div>'
    +titleBlock(physCanvas?5:4, totalSheets)+'</div></div>'

    +'</body></html>';

  var win=window.open('','_blank');
  if (win) { win.document.write(html); win.document.close(); }
  else { alert('Pop-up blocked — allow pop-ups for this page to view the MIL-STD drawing.'); }
}

function showPublishDrawingForm(canvas, onDone) {
  var TYPE_LABELS = {
    network:'Network Topology Diagram', hvac:'HVAC/Mechanical Schematic',
    power:'Power One-Line Diagram', rf:'RF/Signal Flow Diagram',
    physical:'Physical Layout Drawing', custom:'System Block Diagram'
  };
  var typeLabel = TYPE_LABELS[canvas.canvas_type] || 'System Drawing';
  var nextRev   = canvas.published_rev
    ? String.fromCharCode(canvas.published_rev.charCodeAt(0)+1)
    : 'A';

  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  // Info banner
  var info = div('');
  info.style.cssText='background:rgba(56,189,248,0.07);border:1px solid #1e3a5f;border-radius:6px;padding:12px 14px;margin-bottom:12px;font-size:12px;color:#94a3b8;line-height:1.7;';
  info.innerHTML='<strong style="color:#e2e8f0;">Drawing Type:</strong> '+typeLabel+'<br>'
    +(canvas.drawing_doc_id
      ? '<strong style="color:#e2e8f0;">Existing Doc:</strong> Will add a new revision to the linked drawing in the Document Registry.<br>'
      : '<strong style="color:#e2e8f0;">First Publish:</strong> A new MIL-STD drawing document will be created in the Document Registry.<br>')
    +(canvas.revision_required ? '<span style="color:#fb923c;">⚠ This canvas was flagged revision-required by a Config Change approval.</span>' : '');
  fWrap.insertBefore(info, fWrap.firstChild);

  f.revision   = add('Revision Label *', inp('e.g. A, B, Rev 1', nextRev));
  f.changeDesc = add('Change Description *', inp('What changed in this revision?', ''));
  f.baseline   = add('Baseline (optional)', inp('e.g. Functional Baseline, Product Baseline', ''));
  f.approvedBy = add('Approved By (optional)', inp('NC username of approver', ''));

  modal('📐 Publish MIL-STD Drawing', fWrap, async function() {
    if (!f.revision.value.trim()) { alert('Revision label is required.'); return; }
    if (!f.changeDesc.value.trim()) { alert('Change description is required.'); return; }
    var result = await API.canvases.publish(canvas.id, {
      revision:    f.revision.value.trim(),
      change_desc: f.changeDesc.value.trim(),
      baseline:    f.baseline.value.trim() || null,
      approved_by: f.approvedBy.value.trim() || null,
    });
    // Show confirmation with view link
    var conf = div('');
    conf.style.cssText='background:#0f172a;border:1px solid #166534;border-radius:8px;padding:16px 20px;';
    conf.appendChild(el('div',{text:'✓ Drawing Published',style:'color:#4ade80;font-weight:800;font-size:14px;margin-bottom:10px;'}));
    conf.appendChild(el('div',{text:'Document: '+result.document.doc_number,style:'font-family:monospace;color:#38bdf8;margin-bottom:3px;'}));
    conf.appendChild(el('div',{text:'Title: '+result.document.title,style:'color:#e2e8f0;margin-bottom:3px;'}));
    conf.appendChild(el('div',{text:'Revision: '+result.revision.revision+' — '+result.revision.change_desc,style:'color:#94a3b8;font-size:12px;margin-bottom:12px;'}));
    var viewBtn=btn('primary','📄 Open MIL-STD Drawing',async function(){
      var revs=await API.documents.getRevisions(result.document.id).catch(()=>[result.revision]);
      openMilStdDrawing(canvas, result.document, revs, canvas._nodeCache||[]);
    });
    conf.appendChild(viewBtn);
    modal('Drawing Published', conf, null, null, true);
    if (onDone) onDone();
  }, 'Publish Drawing');
}

function showComponentLibForm(existing, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  f.name      = add('Name *', inp('e.g., Cisco Catalyst 9300', existing?.name||''));
  f.category  = add('Category', sel([['network','Network'],['hvac','HVAC'],['power','Power'],['rf','RF / Signal'],['custom','Custom']], existing?.category||'custom'));
  f.assetType = add('Asset Type', sel([['hardware','Hardware'],['software','Software'],['firmware','Firmware']], existing?.asset_type||'hardware'));
  f.mfr       = add('Manufacturer', inp('', existing?.manufacturer||''));
  f.model     = add('Model Number', inp('', existing?.model_number||''));
  f.criticality = add('Default Criticality', sel([['','— Unclassified —'],['CR','CR — Mission Critical'],['DE','DE — Direct Effect'],['RD','RD — Readiness Degrader'],['SP','SP — Support'],['AD','AD — Administrative']], existing?.default_criticality||''));
  f.nsn       = add('NSN', inp('National Stock Number', existing?.nsn||''));
  f.cage      = add('CAGE Code', inp('5-char CAGE', existing?.cage_code||''));

  modal(existing?'Edit Component':'New Component Library Entry', fWrap, async()=>{
    if (!f.name.value.trim()) throw new Error('Name is required.');
    var d = {
      name:                f.name.value.trim(),
      category:            f.category.value,
      asset_type:          f.assetType.value,
      manufacturer:        f.mfr.value||null,
      model_number:        f.model.value||null,
      default_criticality: f.criticality.value||null,
      nsn:                 f.nsn.value||null,
      cage_code:           f.cage.value||null,
    };
    if (existing) await API.componentLib.update(existing.id, d);
    else          await API.componentLib.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Add to Library');
}

/* ── Settings ── */
async function viewSettings() {
  var wrap=div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header',[el('h2',{text:'Settings'})]));
  var loading=span('ops-muted','Loading…'); wrap.appendChild(loading);
  var [settings, groupsData] = await Promise.all([getSettings(), getGroups()]);
  loading.remove();

  var card=div('ops-card');
  card.appendChild(div('ops-card-header',[el('h3',{text:'Access Control'})]));
  card.appendChild(el('p',{style:'font-size:13px;color:#94a3b8;margin-bottom:16px;line-height:1.6;',
    text:'Map each role to a Nextcloud group. Nextcloud admins are always Administrators regardless of group config. If no groups are configured, all users receive Technician access (open mode).'}));

  var roleRows = [
    {role:'admin',                 label:'Administrator',          hint:'Full system access including settings, all CRUD, CCB approval.'},
    {role:'multi_site_manager',    label:'Multi-Site Manager',     hint:'Cross-site oversight; can admin settings but not NC admin.'},
    {role:'platform_manager',      label:'Platform Manager',       hint:'Manages a platform — can approve CCB transitions.'},
    {role:'shop_supervisor',       label:'Shop Supervisor',        hint:'Manages a shop — full write within their assigned shops.'},
    {role:'lead_technician',       label:'Lead Technician',        hint:'Senior tech — full write, shop-scoped by shop assignments.'},
    {role:'technician',            label:'Technician',             hint:'Standard write access — create and close work, log deficiencies.'},
    {role:'quality_inspector',     label:'Quality Inspector',      hint:'Write access for inspections and deficiency closeout; shop-scoped.'},
    {role:'safety_officer',        label:'Safety Officer',         hint:'Write access for LOTO and safety records; shop-scoped.'},
    {role:'logistics_coordinator', label:'Logistics Coordinator',  hint:'Write access for supply requests and inventory; shop-scoped.'},
    {role:'maintenance_planner',   label:'Maintenance Planner',    hint:'Write access for PM scheduling and work packages.'},
    {role:'contractor',            label:'Contractor',             hint:'Limited write — log deficiencies and PM closeout only; shop-scoped.'},
    {role:'read_only',             label:'Read Only',              hint:'View-only access — no create, edit, or delete.'},
  ];
  var roleSels = {};
  var acForm = div('ops-form-grid');
  roleRows.forEach(({role, label, hint}) => {
    var sel = el('select', {cls:'ops-select'});
    sel.appendChild(el('option',{value:'',text:'— None —'}));
    (groupsData||[]).forEach(g=>{
      var opt=el('option',{value:g.gid,text:g.displayName||g.gid});
      if(g.gid===settings['role_group_'+role]) opt.selected=true;
      sel.appendChild(opt);
    });
    roleSels[role] = sel;
    acForm.appendChild(fg(label, sel, true, hint));
  });
  card.appendChild(acForm);

  var saveBtn=btn('primary','Save Access Control',async()=>{
    saveBtn.disabled=true; saveBtn.textContent='Saving…';
    try{
      var payload = {};
      roleRows.forEach(({role})=>{ payload['role_group_'+role]=roleSels[role].value; });
      await API.settings.save(payload);
      _userRole={ role:'technician', label:'Technician', can_write:true, can_admin:false, can_approve:false }; _cache.settings=null;
      saveBtn.textContent='Saved ✓'; saveBtn.style.background='#16803a'; saveBtn.style.borderColor='#16803a';
      setTimeout(()=>{ saveBtn.disabled=false; saveBtn.textContent='Save Access Control'; saveBtn.style.background=''; saveBtn.style.borderColor=''; },2000);
    }catch(e){ alert('Error: '+e.message); saveBtn.disabled=false; saveBtn.textContent='Save Access Control'; }
  });
  card.appendChild(saveBtn);

  // PMS Procedures folder info
  var folderCard=div('ops-card');
  folderCard.appendChild(div('ops-card-header',[el('h3',{text:'PMS Procedures Folder'})]));
  folderCard.appendChild(el('p',{style:'font-size:13px;color:#94a3b8;line-height:1.6;',text:'SOP documents for maintenance procedures are stored in the "PMS Procedures" folder in your Nextcloud Files. This folder is automatically created for each user when they log in.'}));
  var openFolderBtn=el('a',{href:'/apps/files/?dir=/PMS%20Procedures',target:'_blank',
    style:'display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;border:1.5px solid #38bdf8;background:rgba(56,189,248,0.1);color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;',
    text:'📂 Open PMS Procedures in Files'});
  folderCard.appendChild(openFolderBtn);

  wrap.appendChild(card);
  wrap.appendChild(folderCard);

  // Organization Settings card
  var orgCard = div('ops-card');
  orgCard.appendChild(div('ops-card-header', [el('h3', {text:'Organization Settings'})]));
  orgCard.appendChild(el('p', {style:'font-size:13px;color:#94a3b8;margin-bottom:16px;line-height:1.6;',
    text:'This information appears on RFQ exports, supply requisitions, and reports.'}));

  var orgForm = div('ops-form-grid');
  var orgName    = el('input',{}); orgName.className='ops-input';    orgName.placeholder='Organization name';
  var orgAddress = el('input',{}); orgAddress.className='ops-input'; orgAddress.placeholder='Street address';
  var orgCity    = el('input',{}); orgCity.className='ops-input';    orgCity.placeholder='City, State ZIP';
  var orgPhone   = el('input',{}); orgPhone.className='ops-input';   orgPhone.placeholder='Phone number';
  var orgEmail   = el('input',{}); orgEmail.className='ops-input';   orgEmail.type='email'; orgEmail.placeholder='Contact email';
  var orgWebsite = el('input',{}); orgWebsite.className='ops-input'; orgWebsite.placeholder='https://';

  // Load existing org settings
  var orgSettings = settings.org_name ? settings : {};
  orgName.value    = settings.org_name    || '';
  orgAddress.value = settings.org_address || '';
  orgCity.value    = settings.org_city    || '';
  orgPhone.value   = settings.org_phone   || '';
  orgEmail.value   = settings.org_email   || '';
  orgWebsite.value = settings.org_website || '';

  orgForm.appendChild(fg('Organization Name', orgName, true));
  orgForm.appendChild(fg('Address', orgAddress, true));
  orgForm.appendChild(fg('City, State ZIP', orgCity, true));
  orgForm.appendChild(fg('Phone', orgPhone));
  orgForm.appendChild(fg('Email', orgEmail));
  orgForm.appendChild(fg('Website', orgWebsite));
  orgCard.appendChild(orgForm);

  var saveOrgBtn = btn('primary', 'Save Organization Settings', async () => {
    saveOrgBtn.disabled = true; saveOrgBtn.textContent = 'Saving…';
    try {
      await API.settings.save({
        org_name:    orgName.value.trim(),
        org_address: orgAddress.value.trim(),
        org_city:    orgCity.value.trim(),
        org_phone:   orgPhone.value.trim(),
        org_email:   orgEmail.value.trim(),
        org_website: orgWebsite.value.trim(),
      });
      _cache.settings = null;
      saveOrgBtn.textContent = 'Saved ✓';
      saveOrgBtn.style.background = '#16803a';
      setTimeout(() => {
        saveOrgBtn.disabled = false;
        saveOrgBtn.textContent = 'Save Organization Settings';
        saveOrgBtn.style.background = '';
      }, 2000);
    } catch(e) { alert('Error: ' + e.message); saveOrgBtn.disabled = false; saveOrgBtn.textContent = 'Save Organization Settings'; }
  });
  orgCard.appendChild(saveOrgBtn);
  wrap.appendChild(orgCard);


  // ── MOS Documentation Seed card ─────────────────────────────────────────
  var docSeedCard = div('ops-card');
  docSeedCard.appendChild(div('ops-card-header',[el('h3',{text:'📚 MOS Documentation'})]));
  docSeedCard.appendChild(el('p',{style:'font-size:13px;color:#94a3b8;margin-bottom:16px;line-height:1.6;',
    text:'Seeds the Maintain Ops Suite Technical Specification (SM) and User Manual (OM) as S1000D publications directly into the Library. Creates a "Maintain Ops Suite" software asset as the documentation anchor. Safe to run once — skips if already seeded.'}));
  var seedDocBtn = btn('primary','📚 Seed MOS Documentation', async () => {
    seedDocBtn.disabled = true; seedDocBtn.textContent = 'Seeding…';
    try {
      var result = await API.settings.seedDocs();
      if (result.status === 'already_seeded') {
        showToast('Documentation already exists in the Library.');
        navigate('documents');
      } else {
        showToast('✓ MOS Technical Specification and User Manual created — '+result.dm_count+' Data Modules seeded. Opening Library…');
        seedDocBtn.textContent = '✓ Seeded';
        seedDocBtn.style.background = '#16803a';
        setTimeout(()=>navigate('documents'), 1200);
      }
    } catch(e) {
      showToast('Seed failed: '+(e.message||'Unknown error'));
      seedDocBtn.disabled = false;
      seedDocBtn.textContent = '📚 Seed MOS Documentation';
    }
  });
  docSeedCard.appendChild(seedDocBtn);
  wrap.appendChild(docSeedCard);

  // ── Section Visibility card ──────────────────────────────────────────────
  var secCard = div('ops-card');
  secCard.appendChild(div('ops-card-header', [el('h3', {text:'Section Visibility'})]));
  secCard.appendChild(el('p', {style:'font-size:13px;color:#94a3b8;margin-bottom:16px;line-height:1.6;',
    text:'Toggle which sections appear in the sidebar. Disabled sections are hidden from all users. Dashboard, Settings, Platforms, and User Manual are always visible.'}));

  var toggleStates = {};
  SECTION_DEFS.forEach(function(s) {
    toggleStates[s.key] = !_enabledSections || _enabledSections.indexOf(s.key) !== -1;
  });

  var secGrid = div('');
  secGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px;';

  function mkToggle(checked, onChange) {
    var wrap = document.createElement('label');
    wrap.style.cssText = 'position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;';
    var inp = document.createElement('input');
    inp.type = 'checkbox'; inp.checked = checked;
    inp.style.cssText = 'opacity:0;width:0;height:0;position:absolute;';
    var track = document.createElement('span');
    track.style.cssText = 'position:absolute;inset:0;border-radius:12px;transition:background .2s,border-color .2s;background:'+(checked?'#38bdf8':'#334155')+';border:1.5px solid '+(checked?'#38bdf866':'#1e293b')+';';
    var thumb = document.createElement('span');
    thumb.style.cssText = 'position:absolute;top:3px;left:'+(checked?'22px':'3px')+';width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,0.4);';
    inp.onchange = function() {
      var v = inp.checked;
      track.style.background = v ? '#38bdf8' : '#334155';
      track.style.borderColor = v ? '#38bdf866' : '#1e293b';
      thumb.style.left = v ? '22px' : '3px';
      if (onChange) onChange(v);
    };
    wrap.appendChild(inp); wrap.appendChild(track); wrap.appendChild(thumb);
    return wrap;
  }

  SECTION_DEFS.forEach(function(s) {
    var row = div('');
    row.style.cssText = 'display:flex;align-items:center;gap:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px 14px;';
    var tog = mkToggle(toggleStates[s.key], function(v) { toggleStates[s.key] = v; });
    var info = div(''); info.style.flex = '1';
    info.appendChild(el('div', {text:s.label, style:'font-size:13px;font-weight:600;color:#e2e8f0;'}));
    info.appendChild(el('div', {text:s.desc,  style:'font-size:11px;color:#475569;margin-top:2px;'}));
    row.appendChild(tog); row.appendChild(info);
    secGrid.appendChild(row);
  });

  var saveSecBtn = btn('primary', 'Save Section Settings', async function() {
    saveSecBtn.disabled = true; saveSecBtn.textContent = 'Saving…';
    try {
      var enabled = SECTION_DEFS.filter(function(s){return toggleStates[s.key];}).map(function(s){return s.key;});
      await API.settings.save({ enabled_sections: JSON.stringify(enabled) });
      _enabledSections = enabled.length === SECTION_DEFS.length ? null : enabled;
      _cache.settings = null;
      buildSidebar();
      var r = routeFromHash(); updateNav(r.route);
      saveSecBtn.textContent = 'Saved ✓'; saveSecBtn.style.background = '#16803a'; saveSecBtn.style.borderColor = '#16803a';
      setTimeout(function(){ saveSecBtn.disabled=false; saveSecBtn.textContent='Save Section Settings'; saveSecBtn.style.background=''; saveSecBtn.style.borderColor=''; }, 2000);
    } catch(e) { alert('Error: '+e.message); saveSecBtn.disabled=false; saveSecBtn.textContent='Save Section Settings'; }
  });

  secCard.appendChild(secGrid);
  secCard.appendChild(saveSecBtn);
  wrap.appendChild(secCard);

  // About card
  var aboutCard = div('ops-card');
  aboutCard.appendChild(div('ops-card-header', [el('h3', {text:'About Maintain Ops Suite'})]));
  var aboutBody = div(''); aboutBody.style.cssText = 'padding:8px 0;';
  aboutBody.innerHTML = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">' +
    '<div style="font-size:32px;">⚙</div>' +
    '<div><div style="font-size:18px;font-weight:800;color:#e2e8f0;">Maintain Ops Suite</div>' +
    '<div style="font-size:13px;color:#64748b;">Version 3.24.7</div></div></div>' +
    '<div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:16px;">Developed and maintained by <strong style="color:#e2e8f0;">Alto Technologies LLC</strong>. ' +
    'Built for field operations teams of all sizes — from school districts to defense contractors.</div>' +
    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
    '<a href="https://github.com/Cyberseal89/maintain-ops-suite-nextcloud" target="_blank" style="color:#38bdf8;font-size:13px;text-decoration:none;">📦 GitHub</a>' +
    '<a href="https://github.com/Cyberseal89/maintain-ops-suite-nextcloud/issues" target="_blank" style="color:#38bdf8;font-size:13px;text-decoration:none;">🐛 Report Issue</a>' +
    '<a href="https://altotechnologiesllc.com" target="_blank" style="color:#38bdf8;font-size:13px;text-decoration:none;">🌐 Alto Technologies LLC</a>' +
    '</div>';
  aboutCard.appendChild(aboutBody);
  wrap.appendChild(aboutCard);
}

/* ════════════════════════════════════════════════════════════════
   ROUTER
════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════
   SHOPS
════════════════════════════════════════════════════════════════ */
async function viewShops() {
  var wrap = div(''); setContent(wrap);
  var platforms = await API.platforms.list();
  var platMap = {}; platforms.forEach(p=>{ platMap[p.id]=p.name; });

  var hdr = div('ops-page-header', [el('h2',{text:'Shop Registry'})]);
  hdr.appendChild(btn('primary','+ New Shop', async()=>{
    var platOpts = [['','— No Platform —']].concat(platforms.map(p=>[String(p.id),p.name]));
    var fWrap = div('ops-form-grid');
    var f = {};
    function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
    f.name       = add('Shop Name *',    inp('e.g., Communications Shop 1', ''));
    f.code       = add('Shop Code *',    inp('e.g., C1, IT1, HV1', ''), false, 'Short uppercase code — used in all asset codes. Cannot be changed later.');
    f.discipline = add('Discipline',     inp('e.g., Communications, IT, HVAC, Security', ''));
    f.platform   = add('Platform',       sel(platOpts, ''));
    f.supervisor = add('Supervisor',     inp('Nextcloud username', ''));
    f.desc       = add('Description',    inp('', ''), true);
    modal('Create Shop', fWrap, async()=>{
      if(!f.name.value.trim()) throw new Error('Shop name required.');
      if(!f.code.value.trim()) throw new Error('Shop code required.');
      await API.shops.create({name:f.name.value,code:f.code.value,discipline:f.discipline.value,
        platform_id:f.platform.value?parseInt(f.platform.value):null,
        supervisor:f.supervisor.value,description:f.desc.value});
      clearCache('shops'); load();
    }, 'Create Shop');
  }));
  wrap.appendChild(hdr);

  var cardEl = div('ops-card'); wrap.appendChild(cardEl);

  async function load() {
    cardEl.innerHTML=''; cardEl.appendChild(span('ops-muted','  Loading…'));
    var shops = await API.shops.list(); _cache.shops = shops;
    cardEl.innerHTML='';
    if(!shops.length){
      cardEl.appendChild(el('div',{cls:'ops-empty',text:'No shops yet. Create one to start assigning assets.'}));
      return;
    }
    cardEl.appendChild(makeTable(
      ['Code','Name','Discipline','Platform','Supervisor',''],
      shops.map(s=>[
        span('ops-mono',s.code), el('strong',{text:s.name}), s.discipline||'—',
        platMap[s.platform_id]||'—', s.supervisor||'—', editShopBtn(s)
      ]),
      null
    ));
  }

  function editShopBtn(s) {
    var b = el('button',{cls:'ops-btn ops-btn-sm',text:'Edit',style:'flex-shrink:0;'});
    b.onclick = async e => { e.stopPropagation();
      var platOpts = [['','— No Platform —']].concat(platforms.map(p=>[String(p.id),p.name]));
      var fWrap = div('ops-form-grid');
      var f = {};
      function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }
      f.name       = add('Shop Name *',    inp('', s.name));
      f.discipline = add('Discipline',     inp('', s.discipline||''));
      f.platform   = add('Platform',       sel(platOpts, s.platform_id ? String(s.platform_id) : ''));
      f.supervisor = add('Supervisor',     inp('', s.supervisor||''));
      f.desc       = add('Description',    inp('', s.description||''), true);
      // Code shown read-only — immutable after creation
      var codeNote = el('p',{cls:'ops-muted',text:'Shop code: '+s.code+' (immutable — changing it would break all asset codes)'});
      fWrap.insertBefore(codeNote, fWrap.firstChild);
      modal('Edit Shop — '+s.code, fWrap, async()=>{
        await API.shops.update(s.id,{name:f.name.value,discipline:f.discipline.value,
          platform_id:f.platform.value?parseInt(f.platform.value):null,
          supervisor:f.supervisor.value,description:f.desc.value});
        clearCache('shops'); load();
      },'Save Changes');
    };
    return b;
  }

  await load();
}

/* ════════════════════════════════════════════════════════════════
   LOTO / TAGOUT
════════════════════════════════════════════════════════════════ */
var LOTO_TYPES = [['deficiency','Deficiency Tagout'],['pm','PM / Planned Maintenance'],['general','General LOTO']];
var LOTO_ENERGY = ['Electrical','Hydraulic','Pneumatic','Thermal','Chemical','Gravity','Stored Mechanical','Steam'];
var LOTO_STEPS = [
  {key:'notify',    label:'Notify affected employees of shutdown'},
  {key:'identify',  label:'Identify all energy sources'},
  {key:'isolate',   label:'Isolate / de-energize equipment'},
  {key:'apply',     label:'Apply lockout/tagout devices'},
  {key:'release',   label:'Release / restrain stored energy'},
  {key:'verify',    label:'Verify isolation — try to start'},
];
var LOTO_DEV_TYPES = [['lock','Lock'],['tag','Tag'],['hasp','Hasp']];
var LOTO_DEV_STATUS = [['available','Available'],['in_use','In Use'],['lost','Lost'],['retired','Retired']];

async function viewLotoSessions() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header');
  hdr.appendChild(el('h2', {text:'🔒 LOTO / Tagout'}));
  var hdrBtns = div('');
  hdrBtns.appendChild(btn('primary', '+ Initiate LOTO', () => showLotoForm(null, id => navigate('loto-detail', id))));
  hdr.appendChild(hdrBtns);
  wrap.appendChild(hdr);

  // Tabs: Active | History | Inventory
  var tabBar = div('ops-tab-bar'); wrap.appendChild(tabBar);
  var tabContent = div(''); wrap.appendChild(tabContent);
  var _activeTab = 'active';

  function renderTabs() {
    tabBar.innerHTML = '';
    [['active','🔒 Active'],['history','📋 History'],['inventory','🗃 Device Inventory']].forEach(([key,label]) => {
      var t = btn(_activeTab===key ? 'ops-tab ops-tab-active' : 'ops-tab', label, () => { _activeTab=key; renderTabs(); loadTab(); });
      tabBar.appendChild(t);
    });
  }

  async function loadTab() {
    tabContent.innerHTML = '';
    if (_activeTab === 'active')     await loadSessionsTab('active');
    else if (_activeTab === 'history') await loadSessionsTab('released');
    else await loadDevicesTab();
  }

  async function loadSessionsTab(statusFilter) {
    var isActive = statusFilter === 'active';
    var p = {status: statusFilter};
    if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
    var sessions = await API.loto.list(p).catch(() => []);

    if (isActive && sessions.length) {
      var auditBtn = btn('secondary', '🖨 Print Audit (All Active)', () => printLotoAudit(sessions));
      auditBtn.style.cssText = 'margin-bottom:12px;';
      tabContent.appendChild(auditBtn);
    }

    if (!sessions.length) {
      tabContent.appendChild(el('p', {cls:'ops-empty', text: isActive ? 'No active LOTO sessions.' : 'No released sessions found.'}));
      return;
    }

    var assets = await getAssets().catch(() => []);
    var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });

    var card = div('ops-card'); tabContent.appendChild(card);
    card.appendChild(makeTable(
      ['Tag #', 'Equipment', 'Type', isActive ? 'Devices' : 'Released At', 'Initiated By', 'Last Verified', ''],
      sessions.map(s => {
        var asset = s.asset_id ? assetMap[s.asset_id] : null;
        var equipName = s.equipment_name || (asset ? asset.name : '—');
        var typeLabel = LOTO_TYPES.find(t => t[0] === s.session_type)?.[1] || s.session_type;
        var devCount = Array.isArray(s.device_ids) ? s.device_ids.length : 0;
        var vb = btn('ops-btn-sm', '👁 View', () => navigate('loto-detail', s.id));
        var actions = div(''); actions.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
        actions.appendChild(vb);
        if (isActive) {
          actions.appendChild(btn('ops-btn-sm', '✓ Verify', async () => {
            await API.loto.verify(s.id);
            await loadSessionsTab(statusFilter);
          }));
          actions.appendChild(btn('ops-btn-sm ops-btn-danger', '🔓 Release', () => showLotoReleaseForm(s, () => loadTab())));
        }
        var col4 = isActive
          ? (devCount ? span('ops-badge badge-blue', devCount+' device'+(devCount>1?'s':'')) : span('ops-muted','—'))
          : (s.released_at ? s.released_at.slice(0,16).replace('T',' ') : '—');
        var lastVer = s.last_verified_at
          ? el('span', {style:'font-size:11px;', text: s.last_verified_at.slice(0,16).replace('T',' ')+'\n'+s.last_verified_by})
          : span('ops-muted','—');
        return [
          s.tag_number ? span('ops-mono', s.tag_number) : span('ops-muted','—'),
          el('strong', {text:equipName, style:'cursor:pointer;color:#38bdf8;', onclick:()=>navigate('loto-detail',s.id)}),
          span('ops-badge badge-blue', typeLabel),
          col4,
          s.initiated_by || '—',
          lastVer,
          actions
        ];
      })
    ));
  }

  async function loadDevicesTab() {
    var hdrRow = div(''); hdrRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
    hdrRow.appendChild(el('span', {style:'font-size:14px;font-weight:600;', text:'Lock / Tag / Hasp Inventory'}));
    hdrRow.appendChild(btn('primary', '+ Add Device', () => showLotoDeviceForm(null, () => loadDevicesTab())));
    tabContent.appendChild(hdrRow);

    var devices = await API.loto.listDevices({}).catch(() => []);
    if (!devices.length) {
      tabContent.appendChild(el('p', {cls:'ops-empty', text:'No devices in inventory. Add your first lock, tag, or hasp.'}));
      return;
    }

    var card = div('ops-card'); tabContent.appendChild(card);
    card.appendChild(makeTable(
      ['Serial #', 'Type', 'Color', 'Key #', 'Status', 'Description', ''],
      devices.map(d => {
        var statusBadge = d.status === 'available' ? span('ops-badge badge-green','Available')
          : d.status === 'in_use' ? span('ops-badge badge-red','In Use')
          : d.status === 'lost' ? span('ops-badge badge-orange','Lost')
          : span('ops-badge badge-gray','Retired');
        var actions = div(''); actions.style.cssText = 'display:flex;gap:4px;';
        actions.appendChild(btn('ops-btn-sm', '✏', () => showLotoDeviceForm(d, () => loadDevicesTab())));
        if (d.status !== 'in_use') {
          actions.appendChild(btn('ops-btn-sm ops-btn-danger', '✕', async () => {
            if (!confirm('Delete device '+d.serial_number+'?')) return;
            await API.loto.destroyDevice(d.id);
            loadDevicesTab();
          }));
        }
        return [
          span('ops-mono', d.serial_number),
          LOTO_DEV_TYPES.find(t=>t[0]===d.device_type)?.[1]||d.device_type,
          d.color || '—',
          d.key_number || '—',
          statusBadge,
          d.description || '—',
          actions
        ];
      })
    ));
  }

  renderTabs();
  await loadTab();
}

async function viewLotoDetail(id) {
  if (!id || isNaN(id)) { navigate('loto'); return; }
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var s = await API.loto.get(id).catch(e => { console.error('LOTO get failed:', e); return null; });
  if (!s) { setContent(el('div', {cls:'ops-empty', text:'LOTO session not found.'})); return; }

  var assets = await getAssets().catch(() => []);
  var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });
  var asset = s.asset_id ? assetMap[s.asset_id] : null;
  var orgSettings = await getSettings().catch(() => ({}));

  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← LOTO / Tagout', () => navigate('loto')));
  hdr.appendChild(el('h2', {text: (s.tag_number ? 'Tag #'+s.tag_number+' — ' : '') + (s.equipment_name || asset?.name || 'LOTO Session')}));
  var isActive = s.status === 'active';
  hdr.appendChild(isActive ? span('ops-badge badge-red', '🔒 ACTIVE') : span('ops-badge badge-gray', '✓ Released'));
  if (isActive) {
    hdr.appendChild(btn('', '✓ Verify', async () => {
      await API.loto.verify(id);
      viewLotoDetail(id);
    }));
    hdr.appendChild(btn('danger', '🔓 Release LOTO', () => showLotoReleaseForm(s, () => viewLotoDetail(id))));
  }
  hdr.appendChild(btn('secondary', '🖨 Print Form', () => printLotoForm(s, asset, orgSettings)));
  hdr.appendChild(btn('secondary', '🏷 Print Label', () => printLotoLabel(s, asset, orgSettings)));
  wrap.appendChild(hdr);

  // Steps checklist card
  var stepsCard = div('ops-card'); wrap.appendChild(stepsCard);
  stepsCard.appendChild(div('ops-card-header', [el('h3', {text:'LOTO Procedure Checklist'})]));
  var stepsBody = div(''); stepsCard.appendChild(stepsBody);
  var completed = Array.isArray(s.steps_completed) ? s.steps_completed : [];

  function renderSteps() {
    stepsBody.innerHTML = '';
    LOTO_STEPS.forEach((step, i) => {
      var isDone = completed.includes(step.key);
      var row = div('');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #2e3650;';
      var num = el('div', {text:String(i+1)});
      num.style.cssText = 'width:24px;height:24px;border-radius:50%;background:'+(isDone?'#16803a':'#2e3650')+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:'+(isDone?'#fff':'#94a3b8')+';flex-shrink:0;';
      var lbl = el('span', {text: step.label});
      lbl.style.cssText = 'flex:1;font-size:13px;color:'+(isDone?'#e2e8f0':'#94a3b8')+';'+(isDone?'text-decoration:line-through;':'');
      var cb = isActive ? btn(isDone?'ops-btn-sm ops-btn-danger':'ops-btn-sm', isDone?'✕ Undo':'✓ Done', async () => {
        if (isDone) completed = completed.filter(k => k !== step.key);
        else completed = [...completed, step.key];
        await API.loto.update(id, {steps_completed: completed});
        renderSteps();
      }) : null;
      row.appendChild(num); row.appendChild(lbl); if (cb) row.appendChild(cb);
      stepsBody.appendChild(row);
    });
  }
  renderSteps();

  // Assigned devices card
  var devs = Array.isArray(s.devices) ? s.devices : [];
  var devCard = div('ops-card'); wrap.appendChild(devCard);
  devCard.appendChild(div('ops-card-header', [el('h3', {text:'Assigned Devices'})]));
  if (devs.length) {
    var devList = div(''); devList.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;';
    devs.forEach(d => {
      var pill = span('ops-badge badge-blue', (LOTO_DEV_TYPES.find(t=>t[0]===d.device_type)?.[1]||d.device_type)+' '+d.serial_number+(d.color?' ('+d.color+')':''));
      devList.appendChild(pill);
    });
    devCard.appendChild(devList);
  } else {
    devCard.appendChild(el('p', {cls:'ops-muted', style:'padding:8px 0;', text:'No devices assigned to this session.'}));
  }

  // Detail cards
  var detCard = div('ops-card'); wrap.appendChild(detCard);
  detCard.appendChild(div('ops-card-header', [el('h3', {text:'Session Details'})]));
  var dg = div('ops-kv-grid'); detCard.appendChild(dg);
  function kv(l,v){ var g=div('');g.appendChild(el('dt',{cls:'ops-kv-label',text:l}));g.appendChild(el('dd',{cls:'ops-kv-value',text:String(v||'—')}));dg.appendChild(g); }
  kv('Tag Number',      s.tag_number || '—');
  kv('Lock Number',     s.lock_number || '—');
  kv('Type',            LOTO_TYPES.find(t=>t[0]===s.session_type)?.[1]||s.session_type);
  kv('Equipment',       s.equipment_name || asset?.name || '—');
  kv('Location',        s.location || asset?.location || '—');
  kv('Initiated By',    s.initiated_by || '—');
  kv('Initiated At',    s.initiated_at ? s.initiated_at.slice(0,16).replace('T',' ') : '—');
  kv('Authorized By',   s.authorized_by || '—');
  kv('Expected Release',s.expected_release || '—');
  kv('Last Verified',   s.last_verified_at ? s.last_verified_at.slice(0,16).replace('T',' ')+' by '+s.last_verified_by : 'Not verified');
  if (!isActive) {
    kv('Released By', s.released_by || '—');
    kv('Released At', s.released_at ? s.released_at.slice(0,16).replace('T',' ') : '—');
  }

  if (s.work_description) {
    var wdCard = div('ops-card'); wrap.appendChild(wdCard);
    wdCard.appendChild(div('ops-card-header', [el('h3', {text:'Work Description'})]));
    wdCard.appendChild(el('p', {style:'font-size:13px;color:#e2e8f0;line-height:1.6;', text:s.work_description}));
  }

  if (s.hazards) {
    var hzCard = div('ops-card'); wrap.appendChild(hzCard);
    hzCard.appendChild(div('ops-card-header', [el('h3', {text:'Known Hazards'})]));
    hzCard.appendChild(el('p', {style:'font-size:13px;color:#fbbf24;line-height:1.6;', text:s.hazards}));
  }

  var esrc = Array.isArray(s.energy_sources) ? s.energy_sources : [];
  if (esrc.length) {
    var esCard = div('ops-card'); wrap.appendChild(esCard);
    esCard.appendChild(div('ops-card-header', [el('h3', {text:'Energy Sources'})]));
    var esList = div(''); esList.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;';
    esrc.forEach(e => esList.appendChild(span('ops-badge badge-orange', e)));
    esCard.appendChild(esList);
  }

  if (!isActive && s.release_notes) {
    var rnCard = div('ops-card'); wrap.appendChild(rnCard);
    rnCard.appendChild(div('ops-card-header', [el('h3', {text:'Release Notes'})]));
    rnCard.appendChild(el('p', {style:'font-size:13px;color:#e2e8f0;line-height:1.6;', text:s.release_notes}));
  }
}

async function showLotoForm(existing, onDone, prefill) {
  // prefill: {session_type, linked_def_id, linked_proc_id, equipment_name, location}
  var pf = prefill || {};
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }

  var typeSel = add('Type *', sel(LOTO_TYPES, existing?.session_type || pf.session_type || 'deficiency'));
  var lockInp = add('Lock Number', inp('e.g., L-042', existing?.lock_number||''), false, 'Combination or key number on the lock.');

  // Asset picker (async populated)
  var assetSel = el('select', {cls:'ops-select'});
  assetSel.appendChild(el('option', {value:'', text:'— No linked asset —'}));
  getAssets().then(assets => {
    assets.forEach(a => {
      var o = el('option', {value:String(a.id), text:(a.asset_code?a.asset_code+' — ':'')+a.name});
      if (existing?.asset_id === a.id) o.selected = true;
      assetSel.appendChild(o);
    });
  });
  body.appendChild(fg('Linked Asset', assetSel, true));

  var equipInp = add('Equipment Name *', inp('Equipment being locked out', existing?.equipment_name || pf.equipment_name || ''), true);
  var locInp   = add('Location', inp('Shop / bay / panel', existing?.location || pf.location || ''), true);
  var wdInp    = add('Work Description *', ta('What work is being performed?', existing?.work_description||'', 3), true);
  var hzInp    = add('Known Hazards', ta('List all hazards: voltage, pressure, spring tension…', existing?.hazards||'', 2), true);
  var authInp  = add('Authorized By', inp('Supervisor / manager name', existing?.authorized_by||''));
  var relInp   = add('Expected Release', inp('', existing?.expected_release||'', 'date'));

  // Energy sources checkboxes
  var esWrap = div('ops-form-full');
  esWrap.appendChild(el('label', {cls:'ops-form-label', text:'Energy Sources Present'}));
  var esCbs = {}; var esFlex = div(''); esFlex.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;';
  var existingSrc = existing?.energy_sources || [];
  LOTO_ENERGY.forEach(e => {
    var cb = el('input', {type:'checkbox'}); cb.checked = existingSrc.includes(e);
    var lbl = el('label', {style:'display:flex;align-items:center;gap:6px;font-size:13px;color:#e2e8f0;cursor:pointer;padding:4px 10px;border-radius:6px;border:1px solid #2e3650;background:#1a1f2e;'});
    lbl.appendChild(cb); lbl.appendChild(el('span', {text:e}));
    esFlex.appendChild(lbl); esCbs[e] = cb;
  });
  esWrap.appendChild(esFlex); body.appendChild(esWrap);

  // Device picker — load available devices
  var devWrap = div('ops-form-full');
  devWrap.appendChild(el('label', {cls:'ops-form-label', text:'Assign Devices (Locks / Tags / Hasps)'}));
  var devFlex = div(''); devFlex.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;';
  var devCbs = {};
  var existingDevIds = existing?.device_ids || [];
  API.loto.listDevices({status:'available'}).then(devices => {
    if (!devices.length) {
      devFlex.appendChild(el('span', {cls:'ops-muted', style:'font-size:12px;', text:'No available devices in inventory.'}));
      return;
    }
    devices.forEach(d => {
      var label = (LOTO_DEV_TYPES.find(t=>t[0]===d.device_type)?.[1]||d.device_type)+' '+d.serial_number+(d.color?' ('+d.color+')':'');
      var cb = el('input', {type:'checkbox'}); cb.checked = existingDevIds.includes(d.id);
      var lbl = el('label', {style:'display:flex;align-items:center;gap:6px;font-size:13px;color:#e2e8f0;cursor:pointer;padding:4px 10px;border-radius:6px;border:1px solid #2e3650;background:#1a1f2e;'});
      lbl.appendChild(cb); lbl.appendChild(el('span', {text:label}));
      devFlex.appendChild(lbl); devCbs[d.id] = cb;
    });
  }).catch(() => {});
  devWrap.appendChild(devFlex); body.appendChild(devWrap);

  modal(existing ? 'Edit LOTO Session' : 'Initiate LOTO', body, async () => {
    if (!equipInp.value.trim()) throw new Error('Equipment name is required.');
    if (!wdInp.value.trim())    throw new Error('Work description is required.');
    var selectedDevIds = Object.entries(devCbs).filter(([,cb])=>cb.checked).map(([id])=>parseInt(id));
    var d = {
      session_type:    typeSel.value,
      lock_number:     lockInp.value.trim(),
      asset_id:        assetSel.value ? parseInt(assetSel.value) : null,
      equipment_name:  equipInp.value.trim(),
      location:        locInp.value.trim(),
      work_description:wdInp.value.trim(),
      hazards:         hzInp.value.trim(),
      authorized_by:   authInp.value.trim(),
      expected_release:relInp.value || null,
      energy_sources:  LOTO_ENERGY.filter(e => esCbs[e].checked),
      device_ids:      selectedDevIds,
    };
    if (pf.linked_def_id)  d.linked_def_id  = pf.linked_def_id;
    if (pf.linked_proc_id) d.linked_proc_id = pf.linked_proc_id;
    if (existing) {
      await API.loto.update(existing.id, d);
      if (onDone) onDone(existing.id);
    } else {
      var created = await API.loto.create(d);
      if (!created || !created.id) throw new Error('Session was not created — check Nextcloud logs for details.');
      if (onDone) onDone(created.id);
    }
  }, existing ? 'Save Changes' : 'Initiate LOTO');
}

function showLotoReleaseForm(session, onDone) {
  var body = div('ops-form-grid');
  var notesInp = el('textarea', {cls:'ops-textarea', placeholder:'Describe energy verification, conditions at release, any observations…'});
  notesInp.rows = 4;
  body.appendChild(fg('Release Notes', notesInp, true));
  body.appendChild(el('p', {style:'font-size:12px;color:#fbbf24;grid-column:1/-1;',
    text:'⚠ Confirm all lockout/tagout devices have been removed and equipment is safe to energize before releasing.'}));
  modal('🔓 Release LOTO — '+(session.equipment_name||'Session #'+session.id), body, async () => {
    await API.loto.release(session.id, {release_notes: notesInp.value.trim()});
    if (onDone) onDone();
  }, 'Confirm Release');
}

function showLotoDeviceForm(existing, onDone) {
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }

  var typeSel   = add('Device Type *', sel(LOTO_DEV_TYPES, existing?.device_type||'lock'));
  var serialInp = add('Serial Number *', inp('Manufacturer serial or your own ID', existing?.serial_number||''), false, existing ? 'Serial number cannot be changed.' : 'Must be unique across all devices.');
  if (existing) serialInp.readOnly = true;
  var colorInp = add('Color', inp('e.g., Red, Yellow', existing?.color||''));
  var keyInp   = add('Key Number', inp('Keying code or combination', existing?.key_number||''));
  var descInp  = add('Description', inp('e.g., Brady 65674 Red Keyed-Alike', existing?.description||''), true);
  var notesInp = add('Notes', ta('Condition, location in storage, etc.', existing?.notes||'', 2), true);

  var stSel = existing ? add('Status', sel(LOTO_DEV_STATUS, existing.status||'available')) : null;

  modal(existing ? 'Edit Device' : 'Add Device to Inventory', body, async () => {
    if (!serialInp.value.trim()) throw new Error('Serial number is required.');
    var d = {
      device_type:   typeSel.value,
      serial_number: serialInp.value.trim(),
      color:         colorInp.value.trim(),
      key_number:    keyInp.value.trim(),
      description:   descInp.value.trim(),
      notes:         notesInp.value.trim(),
    };
    if (existing) {
      if (stSel) d.status = stSel.value;
      await API.loto.updateDevice(existing.id, d);
    } else {
      await API.loto.createDevice(d);
    }
    if (onDone) onDone();
  }, existing ? 'Save Changes' : 'Add Device');
}

/* ── Print Functions ──────────────────────────────────────────── */
function printLotoForm(s, asset, org) {
  var tagNum   = s.tag_number   || '—';
  var lockNum  = s.lock_number  || '—';
  var equip    = s.equipment_name || asset?.name || '—';
  var loc      = s.location    || asset?.location || '—';
  var initBy   = s.initiated_by || '—';
  var initAt   = s.initiated_at ? s.initiated_at.slice(0,16).replace('T',' ') : '—';
  var authBy   = s.authorized_by || '—';
  var expRel   = s.expected_release || '—';
  var typeLabel= LOTO_TYPES.find(t=>t[0]===s.session_type)?.[1]||s.session_type;
  var esrc     = Array.isArray(s.energy_sources) ? s.energy_sources : [];
  var completed= Array.isArray(s.steps_completed) ? s.steps_completed : [];
  var orgName  = org?.org_name || 'Alto Technologies LLC';
  var orgAddr  = [org?.org_address, org?.org_city].filter(Boolean).join(', ');

  var stepsHtml = LOTO_STEPS.map((st,i) => {
    var done = completed.includes(st.key);
    return '<tr><td style="width:30px;text-align:center;font-size:16px;">'+(done?'☑':'☐')+'</td>'+
           '<td style="font-size:12px;padding:4px 8px;">Step '+(i+1)+': '+st.label+'</td>'+
           '<td style="width:160px;border-bottom:1px solid #999;font-size:11px;color:#555;">'+(done?'Completed':'_____________ / ______')+'</td></tr>';
  }).join('');

  var energyHtml = LOTO_ENERGY.map(e => {
    var checked = esrc.includes(e);
    return '<span style="display:inline-flex;align-items:center;gap:4px;margin:3px 6px 3px 0;font-size:12px;">'+(checked?'☑':'☐')+' '+e+'</span>';
  }).join('');

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LOTO Form — ${equip}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; font-family: Arial, sans-serif; }
  body { color: #000; background: #fff; font-size: 12px; }
  .danger-banner { background:#d00;color:#fff;text-align:center;padding:10px 0;font-size:22px;font-weight:900;letter-spacing:2px;border:3px solid #000; }
  .org-header { display:flex;justify-content:space-between;align-items:flex-start;margin:10px 0 8px; }
  h1 { font-size:16px;font-weight:800;margin:0; }
  table.fields { width:100%;border-collapse:collapse;margin:8px 0; }
  table.fields td { border:1px solid #333;padding:5px 8px;vertical-align:top; }
  table.fields td.lbl { background:#eee;font-weight:700;font-size:11px;width:150px;white-space:nowrap; }
  table.steps { width:100%;border-collapse:collapse;margin:4px 0; }
  table.steps td { padding:3px 6px; }
  .section-title { background:#222;color:#fff;font-weight:700;font-size:12px;padding:4px 8px;margin:10px 0 4px; }
  .sig-row { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px; }
  .sig-box { border-top:2px solid #000;padding-top:4px;font-size:11px; }
  .watermark-released { position:fixed;top:40%;left:20%;font-size:80px;color:rgba(0,180,0,0.15);transform:rotate(-30deg);font-weight:900;pointer-events:none; }
  @media print { .no-print{display:none;} }
</style></head><body>
${s.status==='released'?'<div class="watermark-released">RELEASED</div>':''}
<div class="danger-banner">⚠ DANGER — LOCKOUT / TAGOUT — DO NOT OPERATE ⚠</div>
<div class="org-header">
  <div><h1>${orgName}</h1><div style="font-size:11px;color:#555;">${orgAddr}</div></div>
  <div style="text-align:right;font-size:11px;">
    <div><strong>LOTO Form #:</strong> ${s.id}</div>
    <div><strong>Tag #:</strong> ${tagNum} &nbsp;&nbsp; <strong>Lock #:</strong> ${lockNum}</div>
    <div><strong>Type:</strong> ${typeLabel}</div>
  </div>
</div>

<div class="section-title">EQUIPMENT IDENTIFICATION</div>
<table class="fields"><tbody>
  <tr><td class="lbl">Equipment / Asset</td><td colspan="3">${equip}</td></tr>
  <tr><td class="lbl">Location</td><td>${loc}</td><td class="lbl">Asset Code</td><td>${asset?.asset_code||'—'}</td></tr>
  <tr><td class="lbl">Work Description</td><td colspan="3" style="min-height:48px;">${s.work_description||'—'}</td></tr>
  <tr><td class="lbl">Known Hazards</td><td colspan="3" style="color:#c00;min-height:32px;">${s.hazards||'None identified'}</td></tr>
</tbody></table>

<div class="section-title">ENERGY SOURCES (check all that apply)</div>
<div style="padding:6px 0;">${energyHtml}</div>

<div class="section-title">LOTO PROCEDURE — SIX STEPS</div>
<table class="steps"><tbody>${stepsHtml}</tbody></table>

<div class="section-title">AUTHORIZATION &amp; TIMING</div>
<table class="fields"><tbody>
  <tr><td class="lbl">Initiated By</td><td>${initBy}</td><td class="lbl">Date / Time</td><td>${initAt}</td></tr>
  <tr><td class="lbl">Authorized By</td><td>${authBy}</td><td class="lbl">Expected Release</td><td>${expRel}</td></tr>
</tbody></table>

${s.status==='released'?`
<div class="section-title" style="background:#16803a;">RELEASE RECORD</div>
<table class="fields"><tbody>
  <tr><td class="lbl">Released By</td><td>${s.released_by||'—'}</td><td class="lbl">Released At</td><td>${s.released_at?s.released_at.slice(0,16).replace('T',' '):'—'}</td></tr>
  <tr><td class="lbl">Release Notes</td><td colspan="3">${s.release_notes||'—'}</td></tr>
</tbody></table>`:''}

<div class="sig-row">
  <div class="sig-box">Technician Signature / Date<br><br><br></div>
  <div class="sig-box">Supervisor Signature / Date<br><br><br></div>
</div>
<div style="font-size:9px;color:#888;margin-top:12px;text-align:center;">
  Generated by Maintain Ops Suite — ${new Date().toLocaleString()} — OSHA 29 CFR 1910.147
</div>
</body></html>`;

  var w = window.open('', '_blank', 'width=850,height=1100');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function printLotoLabel(s, asset, org) {
  var tagNum  = s.tag_number   || s.id;
  var lockNum = s.lock_number  || '—';
  var equip   = s.equipment_name || asset?.name || 'Equipment';
  var assetCode = asset?.asset_code || '';
  var initBy  = s.initiated_by || '—';
  var initAt  = s.initiated_at ? s.initiated_at.slice(0,10) : new Date().toISOString().slice(0,10);
  var typeLabel = s.session_type === 'pm' ? 'PM TAGOUT' : s.session_type === 'deficiency' ? 'DEFICIENCY' : 'LOCKOUT';
  var orgName = org?.org_name || '';

  // Renders 2 label formats: Dymo 30252 (1-1/8" x 3-1/2") and a larger 2"x4"
  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LOTO Label</title>
<style>
  @page { size: auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { background: #fff; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 20px; }
  .label-section { text-align: center; }
  .label-section h3 { font-size: 11px; color: #666; margin-bottom: 6px; text-transform: uppercase; }

  /* ── Dymo 30252 / Standard Address Label 1-1/8" x 3-1/2" ─────── */
  .label-dymo {
    width: 3.5in; height: 1.125in; border: 2px solid #000;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .label-dymo .danger-bar { background:#d00;color:#fff;font-size:8px;font-weight:900;text-align:center;padding:1px;letter-spacing:1px; }
  .label-dymo .main-row { display:flex;align-items:stretch;flex:1; }
  .label-dymo .icon-col { background:#222;color:#fff;width:28px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0; }
  .label-dymo .text-col { flex:1;padding:3px 5px;display:flex;flex-direction:column;justify-content:space-between; }
  .label-dymo .equip { font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .label-dymo .meta  { font-size:7.5px;color:#333; }
  .label-dymo .tag-col { background:#ffeb3b;width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:1px solid #000;padding:2px; }
  .label-dymo .tag-num { font-size:11px;font-weight:900; }
  .label-dymo .tag-lbl { font-size:6px;font-weight:700;text-transform:uppercase; }

  /* ── Brother / Zebra 2" x 4" ───────────────────────────────── */
  .label-lg {
    width: 4in; height: 2in; border: 3px solid #000;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .label-lg .danger-bar { background:#d00;color:#fff;font-size:11px;font-weight:900;text-align:center;padding:2px;letter-spacing:2px; }
  .label-lg .body { display:flex;flex:1; }
  .label-lg .left { flex:1;padding:6px 8px;display:flex;flex-direction:column;justify-content:space-between; }
  .label-lg .right { background:#222;color:#fff;width:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:2px solid #000; }
  .label-lg .equip { font-size:14px;font-weight:900; }
  .label-lg .code  { font-size:10px;color:#555; }
  .label-lg .meta  { font-size:9px;line-height:1.5; }
  .label-lg .type-badge { background:#ff9800;color:#000;font-size:9px;font-weight:900;padding:2px 6px;border-radius:3px;display:inline-block; }
  .label-lg .tag-num  { font-size:24px;font-weight:900; }
  .label-lg .tag-lbl  { font-size:8px;font-weight:700;text-align:center; }
  .label-lg .lock-num { font-size:11px;margin-top:4px; }

  @media print {
    .no-print { display:none; }
    body { padding: 0; background: #fff; }
  }
</style></head><body>

<div class="no-print" style="font-family:Arial;font-size:13px;color:#333;padding:8px 16px;background:#f0f0f0;border-radius:6px;margin-bottom:8px;">
  Select your label size and print. Use "Actual Size" in print dialog — do not scale to fit.
</div>

<div class="label-section">
  <h3>Standard Tag Label — Dymo 30252 / 1-1/8" × 3-1/2"</h3>
  <div class="label-dymo">
    <div class="danger-bar">⚠ DO NOT OPERATE — ${typeLabel}</div>
    <div class="main-row">
      <div class="icon-col">🔒</div>
      <div class="text-col">
        <div class="equip">${equip}</div>
        <div class="meta">
          ${assetCode?assetCode+' &nbsp;|&nbsp; ':''}${initBy}<br>
          ${initAt} &nbsp;|&nbsp; Lock: ${lockNum}
          ${orgName?'<br>'+orgName:''}
        </div>
      </div>
      <div class="tag-col">
        <div class="tag-num">${tagNum}</div>
        <div class="tag-lbl">Tag #</div>
      </div>
    </div>
  </div>
</div>

<div class="label-section">
  <h3>Heavy-Duty Tag Label — Brother / Zebra 2" × 4"</h3>
  <div class="label-lg">
    <div class="danger-bar">⚠ DANGER — DO NOT OPERATE — LOCKOUT/TAGOUT IN EFFECT ⚠</div>
    <div class="body">
      <div class="left">
        <div>
          <div class="equip">${equip}</div>
          ${assetCode?'<div class="code">'+assetCode+'</div>':''}
          <span class="type-badge">${typeLabel}</span>
        </div>
        <div class="meta">
          <strong>Tagged by:</strong> ${initBy}<br>
          <strong>Date:</strong> ${initAt}<br>
          <strong>Lock #:</strong> ${lockNum}<br>
          ${orgName?'<strong>Org:</strong> '+orgName:''}
        </div>
      </div>
      <div class="right">
        <div class="tag-num">${tagNum}</div>
        <div class="tag-lbl">TAG NUMBER</div>
        <div class="lock-num">🔒 ${lockNum}</div>
      </div>
    </div>
  </div>
</div>

<div class="no-print" style="margin-top:12px;">
  <button onclick="window.print()" style="padding:8px 20px;background:#0284c7;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-family:Arial;">🖨 Print Labels</button>
</div>
</body></html>`;

  var w = window.open('', '_blank', 'width=700,height=700');
  w.document.write(html);
  w.document.close();
}

async function printLotoAudit(sessions) {
  var org = await getSettings().catch(() => ({}));
  var assets = await getAssets().catch(() => []);
  var assetMap = {}; assets.forEach(a => { assetMap[a.id] = a; });
  var orgName = org?.org_name || 'Maintain Ops Suite';
  var now = new Date().toLocaleString();
  var printedBy = _currentUser || '';

  var rows = sessions.map(s => {
    var asset = s.asset_id ? assetMap[s.asset_id] : null;
    var equip = s.equipment_name || asset?.name || '—';
    var loc   = s.location || asset?.location || '—';
    var typeLabel = LOTO_TYPES.find(t=>t[0]===s.session_type)?.[1]||s.session_type;
    var initAt = s.initiated_at ? s.initiated_at.slice(0,16).replace('T',' ') : '—';
    var lastVer = s.last_verified_at ? s.last_verified_at.slice(0,10)+' '+s.last_verified_by : 'Not verified';
    return `<tr>
      <td>${s.tag_number||'—'}</td>
      <td>${equip}</td>
      <td>${loc}</td>
      <td>${typeLabel}</td>
      <td>${s.initiated_by||'—'}</td>
      <td>${initAt}</td>
      <td>${lastVer}</td>
      <td style="text-align:center;">☐</td>
    </tr>`;
  }).join('');

  var html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LOTO Audit Report</title>
<style>
  @page { size: letter landscape; margin: 0.5in; }
  * { box-sizing:border-box; font-family: Arial, sans-serif; }
  body { color:#000;background:#fff;font-size:11px; }
  .banner { background:#d00;color:#fff;text-align:center;padding:8px;font-size:18px;font-weight:900;letter-spacing:2px;border:2px solid #000;margin-bottom:8px; }
  .org-line { display:flex;justify-content:space-between;margin-bottom:8px; }
  h2 { margin:0;font-size:14px; }
  table { width:100%;border-collapse:collapse; }
  th { background:#222;color:#fff;padding:5px 6px;font-size:10px;text-align:left; }
  td { border:1px solid #ccc;padding:4px 6px;vertical-align:top;font-size:10px; }
  tr:nth-child(even) td { background:#f5f5f5; }
  .sig-section { margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px; }
  .sig-box { border-top:1px solid #000;padding-top:4px;font-size:10px; }
  @media print { .no-print{display:none;} }
</style></head><body>
<div class="banner">⚠ ACTIVE LOTO AUDIT REPORT — ${now} ⚠</div>
<div class="org-line">
  <div><h2>${orgName}</h2><div style="font-size:10px;">Printed by: ${printedBy}</div></div>
  <div style="text-align:right;font-size:10px;"><strong>Total Active Sessions:</strong> ${sessions.length}<br>
    <strong>Audit Date/Time:</strong> ${now}</div>
</div>
<table>
  <thead><tr>
    <th>Tag #</th><th>Equipment</th><th>Location</th><th>Type</th>
    <th>Initiated By</th><th>Initiated At</th><th>Last Verified</th><th style="width:60px;">Verified ✓</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="sig-section">
  <div class="sig-box">Safety Officer Signature / Date<br><br><br></div>
  <div class="sig-box">Supervisor Signature / Date<br><br><br></div>
</div>
<div style="font-size:8px;color:#888;margin-top:12px;text-align:center;">
  Generated by Maintain Ops Suite — OSHA 29 CFR 1910.147 — Periodic Inspection Record
</div>
<div class="no-print" style="margin-top:16px;">
  <button onclick="window.print()" style="padding:8px 20px;background:#0284c7;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;">🖨 Print Audit Report</button>
</div>
</body></html>`;

  var w = window.open('', '_blank', 'width=1100,height=800');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);

  // Log all active sessions as verified
  await Promise.all(sessions.map(s => API.loto.verify(s.id).catch(()=>{})));
}

/* ── Energy Sources (Sprint 1C) ── */

var ENERGY_SOURCE_TYPES = [
  ['electrical','⚡ Electrical'],['pneumatic','💨 Pneumatic'],['hydraulic','🌊 Hydraulic'],
  ['thermal','🌡 Thermal'],['chemical','⚗ Chemical'],['gravity','⬇ Gravitational'],
  ['spring','🌀 Spring / Mechanical'],['radiation','☢ Radiation'],
];

async function viewEnergySources() {
  var wrap = div(''); setContent(wrap);
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'⚡ Energy Source Registry'}));
  hdr.appendChild(btn('primary','+ New Energy Source', ()=>showEnergySourceForm(null, load)));
  wrap.appendChild(hdr);

  var filterBar = div('ops-filter-bar');
  var typeSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Types'],...ENERGY_SOURCE_TYPES].forEach(function([v,l]){ typeSel.appendChild(el('option',{value:v,text:l})); });
  filterBar.appendChild(span('ops-filter-label','Type:')); filterBar.appendChild(typeSel);
  wrap.appendChild(filterBar);

  var body = div(''); wrap.appendChild(body);

  async function load() {
    body.innerHTML = '';
    var params = {};
    if (typeSel.value) params.source_type = typeSel.value;
    var sources = await API.energySources.list(params).catch(()=>[]);
    if (!sources.length) { body.appendChild(el('p',{cls:'ops-empty',text:'No energy sources registered yet. Add sources to link them to LOTO sessions.'})); return; }
    var card = div('ops-card'); body.appendChild(card);
    card.appendChild(makeTable(
      ['Name','Type','Asset / Panel','Breaker','Voltage','Location',''],
      sources.map(function(s) {
        var typeLabel = ENERGY_SOURCE_TYPES.find(t=>t[0]===s.source_type)?.[1] || s.source_type;
        var panelInfo = [s.panel_name, s.breaker_number].filter(Boolean).join(' / ') || span('ops-muted','—');
        var voltageInfo = s.voltage_v ? s.voltage_v+'V' : (s.pressure_psi ? s.pressure_psi+' PSI' : span('ops-muted','—'));
        var eb = btn('ops-btn-sm','✏',()=>showEnergySourceForm(s, load));
        var db = btn('ops-btn-sm ops-btn-danger','✕',async()=>{
          if (!confirm('Delete "'+s.name+'"?')) return;
          await API.energySources.destroy(s.id); load();
        });
        var g = div('ops-btn-group'); g.appendChild(eb); g.appendChild(db);
        return [el('strong',{text:s.name}), span('ops-badge badge-blue', typeLabel), panelInfo, s.breaker_number||span('ops-muted','—'), voltageInfo, s.location||span('ops-muted','—'), g];
      })
    ));
  }
  typeSel.onchange = load;
  await load();
}

function showEnergySourceForm(existing, onSave) {
  var fWrap = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  f.name       = add('Name *', inp('e.g., Main Panel A / Breaker 12', existing?.name||''));
  f.sourceType = add('Energy Type', sel(ENERGY_SOURCE_TYPES, existing?.source_type||'electrical'));
  f.assetId    = add('Linked Asset', inp('Asset ID (optional)', existing?.asset_id||''), false, 'Link to an asset in the registry.');
  f.panelName  = add('Panel / Source Name', inp('e.g., MCC-1, Compressor A', existing?.panel_name||''));
  f.breaker    = add('Breaker / Valve / Isolator', inp('e.g., CB-12, V-003', existing?.breaker_number||''));
  f.voltage    = add('Voltage (V)', inp('e.g., 480', existing?.voltage_v||''), false, 'For electrical sources.');
  f.current    = add('Current (A)', inp('e.g., 30', existing?.current_a||''), false, 'For electrical sources.');
  f.pressure   = add('Pressure (PSI)', inp('e.g., 125', existing?.pressure_psi||''), false, 'For pneumatic/hydraulic sources.');
  f.location   = add('Physical Location', inp('e.g., Building 3, East Wall', existing?.location||''));
  f.isolation  = add('Isolation Procedure', ta('Describe the step-by-step procedure to safely isolate this energy source…', existing?.isolation_procedure||'', 4), true);
  f.notes      = add('Notes', ta('Additional notes…', existing?.notes||'', 2), true);

  modal(existing?'Edit Energy Source':'New Energy Source', fWrap, async()=>{
    if (!f.name.value.trim()) throw new Error('Name is required.');
    var d = {
      name:                f.name.value.trim(),
      source_type:         f.sourceType.value,
      asset_id:            f.assetId.value ? parseInt(f.assetId.value) : null,
      panel_name:          f.panelName.value||null,
      breaker_number:      f.breaker.value||null,
      voltage_v:           f.voltage.value ? parseFloat(f.voltage.value) : null,
      current_a:           f.current.value ? parseFloat(f.current.value) : null,
      pressure_psi:        f.pressure.value ? parseFloat(f.pressure.value) : null,
      location:            f.location.value||null,
      isolation_procedure: f.isolation.value||null,
      notes:               f.notes.value||null,
    };
    if (existing) await API.energySources.update(existing.id, d);
    else          await API.energySources.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Register Source');
}

/* ══════════════════════════════════════════════════════════════════
   Sprint 3C — Manpower & Skills Registry
   ══════════════════════════════════════════════════════════════════ */

var _profLabels = ['','Novice','Familiar','Proficient','Advanced','Expert'];

async function viewPersonnel() {
  setContent(el('div',{cls:'ops-empty',text:'Loading personnel…'}));
  var [people, platforms, shops, allSkills] = await Promise.all([
    API.manpower.personnel.list().catch(()=>[]),
    API.platforms.list().catch(()=>[]),
    getShops().catch(()=>[]),
    API.manpower.skills.list().catch(()=>[]),
  ]);

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'👥 Personnel Registry'}));
  var hdrBtns = div('ops-btn-group');
  hdrBtns.appendChild(btn('primary','+ Add Person', ()=>showPersonnelForm(null, platforms, shops, ()=>viewPersonnel())));
  hdr.appendChild(hdrBtns);
  wrap.appendChild(hdr);

  if (!people.length) {
    var empty = div('ops-card'); empty.style.padding='32px';
    empty.appendChild(el('div',{cls:'ops-empty',text:'No personnel on record. Click "+ Add Person" to add the first entry.'}));
    wrap.appendChild(empty);
    setContent(wrap);
    return;
  }

  var table = div('');
  var colHdr = div('');
  colHdr.style.cssText='display:grid;grid-template-columns:1fr 120px 140px 100px 80px;gap:8px;padding:8px 16px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2e3650;';
  ['Name','Role','Shop / Platform','Status',''].forEach(function(h){ colHdr.appendChild(el('span',{text:h})); });
  table.appendChild(colHdr);

  people.forEach(function(p) {
    var shop = shops.find(s=>s.id===p.shop_id);
    var plat = platforms.find(pl=>pl.id===p.platform_id);
    var loc  = shop ? shop.name : (plat ? plat.name : '—');

    var row = div('');
    row.style.cssText='display:grid;grid-template-columns:1fr 120px 140px 100px 80px;gap:8px;padding:10px 16px;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;cursor:pointer;';
    row.addEventListener('mouseenter',function(){ row.style.background='#1e2a3a'; });
    row.addEventListener('mouseleave',function(){ row.style.background=''; });
    row.addEventListener('click',function(e){ if(e.target.closest('button')) return; navigate('personnel-detail',p.id); });

    var nameCell = div('');
    nameCell.appendChild(el('div',{text:p.full_name||'—',style:'color:#e2e8f0;font-weight:600;'}));
    if (p.nextcloud_uid) nameCell.appendChild(el('div',{text:'@'+p.nextcloud_uid,style:'color:#475569;font-size:11px;margin-top:2px;'}));
    row.appendChild(nameCell);
    row.appendChild(el('span',{text:p.role||'—',style:'color:#94a3b8;font-size:12px;'}));
    row.appendChild(el('span',{text:loc,style:'color:#7dd3fc;font-size:12px;'}));

    var statusColors = {active:'#4ade80',inactive:'#ef4444',on_leave:'#f59e0b'};
    var statusEl = el('span',{text:p.status});
    statusEl.style.cssText='font-size:11px;padding:2px 8px;border-radius:4px;background:'+(statusColors[p.status]||'#475569')+'22;color:'+(statusColors[p.status]||'#94a3b8')+';font-weight:600;';
    row.appendChild(statusEl);

    var acts = div('ops-btn-group');
    acts.appendChild(btn('ops-btn-sm','✏',function(e){ e.stopPropagation(); showPersonnelForm(p, platforms, shops, ()=>viewPersonnel()); }));
    acts.appendChild(btn('ops-btn-sm','🗑',async function(e){
      e.stopPropagation();
      if (!confirm('Delete '+p.full_name+'?')) return;
      await API.manpower.personnel.destroy(p.id);
      viewPersonnel();
    }));
    row.appendChild(acts);
    table.appendChild(row);
  });

  var card = div('ops-card'); card.style.padding='0';
  card.appendChild(table);
  wrap.appendChild(card);
  setContent(wrap);
}

async function viewPersonnelDetail(id) {
  if (!id || isNaN(id)) { navigate('personnel'); return; }
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));

  var [person, allSkills, platforms, shops] = await Promise.all([
    API.manpower.personnel.get(id).catch(()=>null),
    API.manpower.skills.list().catch(()=>[]),
    API.platforms.list().catch(()=>[]),
    getShops().catch(()=>[]),
  ]);

  if (!person) { setContent(el('div',{cls:'ops-empty',text:'Person not found.'})); return; }

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'👤 '+person.full_name}));
  var hdrBtns = div('ops-btn-group');
  hdrBtns.appendChild(btn('','← Back',()=>navigate('personnel')));
  hdrBtns.appendChild(btn('','✏ Edit',()=>showPersonnelForm(person, platforms, shops, ()=>viewPersonnelDetail(id))));
  hdr.appendChild(hdrBtns);
  wrap.appendChild(hdr);

  // Info card
  var info = div('ops-card'); info.style.padding='20px';
  var shop = shops.find(s=>s.id===person.shop_id);
  var plat = platforms.find(p=>p.id===person.platform_id);
  var details = [
    ['Nextcloud User', person.nextcloud_uid ? '@'+person.nextcloud_uid : '—'],
    ['Role',     person.role||'—'],
    ['Shop',     shop ? shop.name : '—'],
    ['Platform', plat ? plat.name : '—'],
    ['Email',    person.email||'—'],
    ['Phone',    person.phone||'—'],
    ['Status',   person.status],
  ];
  var grid = div(''); grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:16px;';
  details.forEach(function(pair) {
    var cell = div(''); cell.style.cssText='background:#0f172a;border-radius:6px;padding:12px;';
    cell.appendChild(el('div',{text:pair[0],style:'font-size:11px;color:#475569;text-transform:uppercase;margin-bottom:4px;'}));
    cell.appendChild(el('div',{text:pair[1],style:'color:#e2e8f0;font-weight:600;'}));
    grid.appendChild(cell);
  });
  if (person.notes) {
    var notesCell = div(''); notesCell.style.cssText='background:#0f172a;border-radius:6px;padding:12px;grid-column:1/-1;';
    notesCell.appendChild(el('div',{text:'Notes',style:'font-size:11px;color:#475569;text-transform:uppercase;margin-bottom:4px;'}));
    notesCell.appendChild(el('div',{text:person.notes,style:'color:#94a3b8;white-space:pre-wrap;'}));
    grid.appendChild(notesCell);
  }
  info.appendChild(grid);
  wrap.appendChild(info);

  // Skills card
  var skillsCard = div('ops-card'); skillsCard.style.marginTop='20px';
  var skillsHdr = div('ops-card-header');
  skillsHdr.appendChild(el('h3',{text:'🎓 Skills & Qualifications'}));
  var unassignedSkills = allSkills.filter(function(s){ return !(person.skills||[]).some(function(ps){ return ps.skill_id===s.id; }); });
  if (unassignedSkills.length) {
    skillsHdr.appendChild(btn('ops-btn-sm','+ Add Skill',function(){
      showPersonnelSkillForm(null, id, unassignedSkills, function(){ viewPersonnelDetail(id); });
    }));
  }
  skillsCard.appendChild(skillsHdr);

  if (!(person.skills||[]).length) {
    var noSkills = div(''); noSkills.style.cssText='padding:24px;text-align:center;color:#475569;font-size:13px;';
    noSkills.textContent='No skills assigned yet.';
    skillsCard.appendChild(noSkills);
  } else {
    var skColHdr = div('');
    skColHdr.style.cssText='display:grid;grid-template-columns:1fr 100px 130px 130px 80px;gap:8px;padding:8px 16px;font-size:11px;color:#475569;text-transform:uppercase;border-bottom:1px solid #2e3650;';
    ['Skill','Proficiency','Certified','Expires',''].forEach(function(h){ skColHdr.appendChild(el('span',{text:h})); });
    skillsCard.appendChild(skColHdr);

    (person.skills||[]).forEach(function(ps) {
      var skRow = div('');
      skRow.style.cssText='display:grid;grid-template-columns:1fr 100px 130px 130px 80px;gap:8px;padding:9px 16px;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;';
      var skillName = ps.skill ? (ps.skill.code+' — '+ps.skill.name) : 'Skill #'+ps.skill_id;
      var profColor = ['','#ef4444','#f97316','#f59e0b','#4ade80','#22d3ee'][ps.proficiency_level] || '#94a3b8';
      skRow.appendChild(el('span',{text:skillName,style:'color:#e2e8f0;'}));
      var profEl = el('span',{text:(_profLabels[ps.proficiency_level]||'—')});
      profEl.style.cssText='color:'+profColor+';font-size:12px;font-weight:600;';
      skRow.appendChild(profEl);
      skRow.appendChild(el('span',{text:ps.certified_date||'—',style:'color:#94a3b8;font-size:12px;'}));
      var expEl = el('span',{text:ps.expiry_date||'—'});
      expEl.style.color = (ps.expiry_date && ps.expiry_date < new Date().toISOString().slice(0,10)) ? '#ef4444' : '#94a3b8';
      expEl.style.fontSize = '12px';
      skRow.appendChild(expEl);
      var acts = div('ops-btn-group');
      acts.appendChild(btn('ops-btn-sm','✏',function(){ showPersonnelSkillForm(ps, id, allSkills, function(){ viewPersonnelDetail(id); }); }));
      acts.appendChild(btn('ops-btn-sm','🗑',async function(){
        if (!confirm('Remove this skill?')) return;
        await API.manpower.personnel.removeSkill(id, ps.id);
        viewPersonnelDetail(id);
      }));
      skRow.appendChild(acts);
      skillsCard.appendChild(skRow);
    });
  }
  wrap.appendChild(skillsCard);

  // Training requirements assigned to this person
  if (person.nextcloud_uid) {
    var trCard = div('ops-card'); trCard.style.marginTop='20px';
    var trCardHdr = div('ops-card-header'); trCardHdr.appendChild(el('h3',{text:'🎓 Assigned Training'}));
    trCard.appendChild(trCardHdr);
    var trBody = div(''); trBody.style.padding='16px'; trCard.appendChild(trBody);
    wrap.appendChild(trCard);
    var assignedTR = await API.training.list({assigned_to: person.nextcloud_uid}).catch(()=>[]);
    if (!assignedTR.length) {
      trBody.appendChild(el('p',{cls:'ops-empty',text:'No training requirements assigned.'}));
    } else {
      assignedTR.forEach(function(tr) {
        var row = div(''); row.style.cssText='display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #1e2540;font-size:13px;cursor:pointer;';
        row.addEventListener('mouseenter',function(){row.style.background='#1e2a3a';});
        row.addEventListener('mouseleave',function(){row.style.background='';});
        row.onclick=function(){ navigate('training-detail',tr.id); };
        row.appendChild(span('ops-badge '+(_trStatusColors[tr.status]||'badge-gray'), tr.status.replace('_',' ')));
        row.appendChild(el('span',{text:tr.title,style:'flex:1;color:#e2e8f0;'}));
        if (tr.required_by_date) row.appendChild(el('span',{text:fmtDate(tr.required_by_date),style:'color:#94a3b8;font-size:11px;'}));
        trBody.appendChild(row);
      });
    }
  }

  setContent(wrap);
}

async function showPersonnelForm(existing, platforms, shops, onSave) {
  var [ncUsers, allPersonnel] = await Promise.all([
    getUsers().catch(()=>[]),
    API.manpower.personnel.list().catch(()=>[]),
  ]);

  // Users not yet enrolled (skip for edit — they already have a uid)
  var enrolledUids = new Set(allPersonnel.map(function(p){ return p.nextcloud_uid; }).filter(Boolean));
  var availableUsers = existing
    ? ncUsers  // editing: show all so they can change assignment
    : ncUsers.filter(function(u){ return !enrolledUids.has(u.uid); });

  var f = div('ops-form-grid');
  function add(l,i,full){ f.appendChild(fg(l,i,full)); return i; }

  // Nextcloud user picker — primary field
  var userOpts = [['','— Select Nextcloud User —']].concat(availableUsers.map(function(u){
    return [u.uid, u.displayName + (u.email ? ' ('+u.email+')' : '')];
  }));
  var userSel = add('Nextcloud User *', sel(userOpts, existing?.nextcloud_uid||''));

  // Display name fields — auto-filled from NC user, editable for overrides
  var firstInp = add('First Name *', inp(existing?.first_name||''));
  var lastInp  = add('Last Name *',  inp(existing?.last_name||''));
  var emailInp = add('Email',        inp(existing?.email||''));

  // Auto-populate name/email when NC user is selected
  userSel.addEventListener('change', function() {
    var u = ncUsers.find(function(u){ return u.uid === userSel.value; });
    if (!u) return;
    var parts = u.displayName.trim().split(' ');
    firstInp.value = parts.slice(0,-1).join(' ') || parts[0] || '';
    lastInp.value  = parts.length > 1 ? parts[parts.length-1] : '';
    if (!emailInp.value) emailInp.value = u.email || '';
  });

  var roleInp = add('Role/Title', inp(existing?.role||''));

  var platOpts = [['','— Platform —']].concat(platforms.map(function(p){ return [String(p.id),p.name]; }));
  var platSel  = add('Platform', sel(platOpts, existing?.platform_id ? String(existing.platform_id) : ''));

  var shopOpts = [['','— Shop —']].concat(shops.map(function(s){ return [String(s.id),s.name]; }));
  var shopSel  = add('Shop', sel(shopOpts, existing?.shop_id ? String(existing.shop_id) : ''));

  var phoneInp  = add('Phone', inp(existing?.phone||''));
  var statusSel = add('Status', sel([['active','Active'],['inactive','Inactive'],['on_leave','On Leave']], existing?.status||'active'));
  var notesInp  = add('Notes', ta(existing?.notes||''), true);

  modal('👤 '+(existing?'Edit Person':'Add Person'), f, async function(){
    if (!userSel.value)         throw new Error('Select a Nextcloud user.');
    if (!firstInp.value.trim()) throw new Error('First name is required.');
    if (!lastInp.value.trim())  throw new Error('Last name is required.');
    var d = {
      nextcloud_uid: userSel.value,
      first_name:    firstInp.value.trim(),
      last_name:     lastInp.value.trim(),
      email:         emailInp.value.trim()||null,
      role:          roleInp.value.trim()||null,
      platform_id:   platSel.value ? parseInt(platSel.value) : null,
      shop_id:       shopSel.value ? parseInt(shopSel.value) : null,
      phone:         phoneInp.value.trim()||null,
      status:        statusSel.value,
      notes:         notesInp.value.trim()||null,
    };
    if (existing) await API.manpower.personnel.update(existing.id, d);
    else          await API.manpower.personnel.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Add Person');
}

function showPersonnelSkillForm(existing, personnelId, availableSkills, onSave) {
  var f = div('ops-form-grid');
  function add(l,i,full){ f.appendChild(fg(l,i,full)); return i; }

  var skillOpts = availableSkills.map(s=>[String(s.id), s.code+' — '+s.name]);
  if (existing) skillOpts = [[String(existing.skill_id), existing.skill ? existing.skill.code+' — '+existing.skill.name : 'Skill #'+existing.skill_id]].concat(skillOpts.filter(o=>o[0]!==String(existing.skill_id)));

  var skillSel  = add('Skill *', sel(skillOpts, existing ? String(existing.skill_id) : ''));
  var profSel   = add('Proficiency', sel([['1','1 — Novice'],['2','2 — Familiar'],['3','3 — Proficient'],['4','4 — Advanced'],['5','5 — Expert']], String(existing?.proficiency_level||1)));
  var certInp   = add('Certified Date', inp(existing?.certified_date||'','date'));
  var expInp    = add('Expiry Date',    inp(existing?.expiry_date||'','date'));
  var notesInp  = add('Notes', ta(existing?.notes||''), true);

  modal('🎓 '+(existing?'Edit Skill':'Assign Skill'), f, async function(){
    if (!skillSel.value) throw new Error('Select a skill.');
    var d = {
      skill_id:          parseInt(skillSel.value),
      proficiency_level: parseInt(profSel.value),
      certified_date:    certInp.value||null,
      expiry_date:       expInp.value||null,
      notes:             notesInp.value.trim()||null,
    };
    if (existing) await API.manpower.personnel.updateSkill(personnelId, existing.id, d);
    else          await API.manpower.personnel.addSkill(personnelId, d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Assign Skill');
}

async function viewSkillsCatalog() {
  setContent(el('div',{cls:'ops-empty',text:'Loading skills catalog…'}));
  var skills = await API.manpower.skills.list().catch(()=>[]);

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'🎓 Skills Catalog'}));
  if (_userRole.can_admin) {
    var hdrBtns = div('ops-btn-group');
    hdrBtns.appendChild(btn('primary','+ Add Skill',()=>showSkillForm(null,()=>viewSkillsCatalog())));
    hdr.appendChild(hdrBtns);
  }
  wrap.appendChild(hdr);

  if (!skills.length) {
    var empty = div('ops-card'); empty.style.padding='32px';
    empty.appendChild(el('div',{cls:'ops-empty',text:'No skills defined. Admins can add skills with "+ Add Skill".'}));
    wrap.appendChild(empty);
    setContent(wrap);
    return;
  }

  // Group by category
  var cats = [...new Set(skills.map(s=>s.category||'Uncategorized'))].sort();
  cats.forEach(function(cat) {
    var catSkills = skills.filter(s=>(s.category||'Uncategorized')===cat);
    var card = div('ops-card'); card.style.marginBottom='20px';
    var cardHdr = div('ops-card-header');
    cardHdr.appendChild(el('h3',{text:cat}));
    card.appendChild(cardHdr);

    var colHdr = div('');
    colHdr.style.cssText='display:grid;grid-template-columns:80px 1fr 1fr 100px 70px;gap:8px;padding:6px 16px;font-size:11px;color:#475569;text-transform:uppercase;border-bottom:1px solid #2e3650;';
    ['Code','Name','Description','Roster',''].forEach(function(h){ colHdr.appendChild(el('span',{text:h})); });
    card.appendChild(colHdr);

    catSkills.forEach(function(sk) {
      var row = div('');
      row.style.cssText='display:grid;grid-template-columns:80px 1fr 1fr 100px 70px;gap:8px;padding:9px 16px;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;';
      row.appendChild(el('span',{text:sk.code,style:'color:#7dd3fc;font-family:monospace;font-weight:700;'}));
      row.appendChild(el('span',{text:sk.name,style:'color:#e2e8f0;'}));
      row.appendChild(el('span',{text:sk.description||'—',style:'color:#64748b;font-size:12px;'}));

      // Roster count — click to see who's qualified
      var rosterEl = el('span',{text:'Loading…',style:'color:#475569;font-size:11px;'});
      row.appendChild(rosterEl);
      API.manpower.skills.get(sk.id).then(function(full){
        var count = full.qualified_count || 0;
        rosterEl.textContent = count ? count+' qualified' : 'None';
        rosterEl.style.cssText = 'font-size:12px;font-weight:600;cursor:'+(count?'pointer':'default')+';color:'+(count?'#4ade80':'#475569')+';';
        if (count) {
          rosterEl.title = 'Click to see roster';
          rosterEl.addEventListener('click', function(){ showSkillRoster(full); });
        }
      }).catch(function(){ rosterEl.textContent = '—'; });

      if (_userRole.can_admin) {
        var acts = div('ops-btn-group');
        acts.appendChild(btn('ops-btn-sm','✏',()=>showSkillForm(sk,()=>viewSkillsCatalog())));
        acts.appendChild(btn('ops-btn-sm','🗑',async function(){
          if (!confirm('Delete skill '+sk.code+'? This will also remove it from personnel records.')) return;
          await API.manpower.skills.destroy(sk.id);
          viewSkillsCatalog();
        }));
        row.appendChild(acts);
      } else {
        row.appendChild(el('span',{text:''}));
      }
      card.appendChild(row);
    });
    wrap.appendChild(card);
  });
  setContent(wrap);
}

function showSkillForm(existing, onSave) {
  var f = div('ops-form-grid');
  function add(l,i,full){ f.appendChild(fg(l,i,full)); return i; }

  var codeInp = add('Code *',     inp(existing?.code||''));
  var nameInp = add('Name *',     inp(existing?.name||''));
  var catInp  = add('Category',   inp(existing?.category||''));
  var descInp = add('Description',ta(existing?.description||''), true);

  modal('🎓 '+(existing?'Edit Skill':'New Skill'), f, async function(){
    var d = {
      code:        codeInp.value.trim().toUpperCase(),
      name:        nameInp.value.trim(),
      category:    catInp.value.trim()||null,
      description: descInp.value.trim()||null,
    };
    if (!d.code || !d.name) throw new Error('Code and name are required.');
    if (existing) await API.manpower.skills.update(existing.id, d);
    else          await API.manpower.skills.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Create Skill');
}

/* ── Training Curriculum (Sprint 4B) ── */

var _trTypes   = [['initial','Initial'],['recurrent','Recurrent'],['upgrade','Upgrade'],['qualification','Qualification']];
var _trStatuses= [['pending','Pending'],['in_progress','In Progress'],['complete','Complete'],['waived','Waived']];
var _trStatusColors = {pending:'badge-orange',in_progress:'badge-blue',complete:'badge-green',waived:'badge-gray'};

async function viewTraining() {
  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'🎓 Training Curriculum'}));
  if (_canWrite) hdr.appendChild(btn('primary','+ New Requirement', ()=>showTrainingForm(null,{},function(){ navigate('training'); })));
  wrap.appendChild(hdr);

  var tabs = ['All','Pending','Mine'];
  var activeTab = 0;
  var tabBar = div('ops-tab-bar'); wrap.appendChild(tabBar);
  var contentDiv = div(''); wrap.appendChild(contentDiv);

  async function loadTab(idx) {
    activeTab = idx;
    tabBar.querySelectorAll('.ops-tab').forEach(function(t,i){ t.classList.toggle('active', i===idx); });
    contentDiv.innerHTML = '';
    contentDiv.appendChild(el('p',{cls:'ops-empty',text:'Loading…'}));
    var params = {};
    if (idx===1) params.status='pending';
    if (idx===2) params.assigned_to=_currentUser;
    var items = await API.training.list(params).catch(()=>[]);
    contentDiv.innerHTML = '';
    if (!items.length) { contentDiv.appendChild(el('p',{cls:'ops-empty',text:'No training requirements found.'})); return; }
    var tbl = makeTable(
      ['Title','Type','Task Code','Skill Lvl','Hours','Required By','Status','Assigned To'],
      items.map(function(tr) {
        return [
          el('span',{text:tr.title,style:'font-weight:600;color:#e2e8f0;cursor:pointer;'}),
          span('ops-badge badge-blue', tr.training_type),
          tr.s6000t_task_code ? span('ops-mono ops-small', tr.s6000t_task_code) : span('ops-muted','—'),
          tr.skill_level ? span('',_profLabels[tr.skill_level]||tr.skill_level) : span('ops-muted','—'),
          tr.man_hours ? tr.man_hours+'h' : span('ops-muted','—'),
          tr.required_by_date ? fmtDate(tr.required_by_date) : span('ops-muted','—'),
          span('ops-badge '+(_trStatusColors[tr.status]||'badge-gray'), tr.status.replace('_',' ')),
          tr.assigned_to ? span('ops-mono ops-small','@'+tr.assigned_to) : span('ops-muted','—'),
        ];
      }),
      function(i){ if(items[i]) navigate('training-detail', items[i].id); }
    );
    contentDiv.appendChild(tbl);
  }

  tabs.forEach(function(label,i) {
    var t = el('button',{cls:'ops-tab'+(i===0?' active':''), text:label});
    t.onclick = function(){ loadTab(i); };
    tabBar.appendChild(t);
  });
  await loadTab(0);
  setContent(wrap);
}

async function viewTrainingDetail(id) {
  setContent(el('div',{cls:'ops-empty',text:'Loading…'}));
  var tr = await API.training.get(id).catch(function(e){ setContent(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return null; });
  if (!tr) return;

  var wrap = div('');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Training', ()=>navigate('training')));
  hdr.appendChild(el('h2',{text:tr.title}));
  hdr.appendChild(span('ops-badge '+(_trStatusColors[tr.status]||'badge-gray'), tr.status.replace('_',' ')));
  if (_canWrite) {
    hdr.appendChild(btn('','✏ Edit', ()=>showTrainingForm(tr,{},()=>viewTrainingDetail(id))));
    if (tr.status!=='complete') hdr.appendChild(btn('success','✓ Mark Complete', async function(){
      await API.training.update(id,{status:'complete',completed_date:new Date().toISOString().slice(0,10)});
      viewTrainingDetail(id);
    }));
    if (tr.status!=='waived') hdr.appendChild(btn('','⊘ Waive', async function(){
      var note=prompt('Reason for waiving (optional):');
      await API.training.update(id,{status:'waived',notes:(tr.notes?tr.notes+'\n':'')+('Waived: '+(note||''))});
      viewTrainingDetail(id);
    }));
  }
  wrap.appendChild(hdr);

  var card = div('ops-card');
  var cardHdr = div('ops-card-header'); cardHdr.appendChild(el('h3',{text:'Requirement Details'})); card.appendChild(cardHdr);
  var grid = div('ops-kv-grid'); card.appendChild(grid);
  function kv(l,v){ var g=div(''); g.appendChild(el('dt',{cls:'ops-kv-label',text:l})); var dd=el('dd',{cls:'ops-kv-value'}); if(typeof v==='string')dd.textContent=v; else dd.appendChild(v); g.appendChild(dd); grid.appendChild(g); }
  kv('Training Type', span('ops-badge badge-blue', tr.training_type));
  kv('Source', tr.source_type !== 'standalone' ? (tr.source_type+' #'+tr.source_id) : 'Standalone');
  kv('S6000T Task Code', tr.s6000t_task_code ? span('ops-mono',tr.s6000t_task_code) : '—');
  kv('Work Unit Code (WUC)', tr.s6000t_wuc ? span('ops-mono',tr.s6000t_wuc) : '—');
  kv('Skill Level Required', tr.skill_level ? (_profLabels[tr.skill_level]||String(tr.skill_level)) : '—');
  kv('Est. Man-Hours', tr.man_hours ? tr.man_hours+'h' : '—');
  kv('Required By', tr.required_by_date ? fmtDate(tr.required_by_date) : '—');
  kv('Assigned To', tr.assigned_to ? span('ops-mono','@'+tr.assigned_to) : '—');
  kv('Completed', tr.completed_date ? fmtDate(tr.completed_date) : '—');
  if (tr.description) { var descRow = div(''); descRow.style.cssText='padding:12px 16px;border-top:1px solid #2e3650;'; descRow.appendChild(el('p',{style:'color:#94a3b8;font-size:11px;text-transform:uppercase;margin-bottom:4px;',text:'Description'})); descRow.appendChild(el('p',{style:'color:#cbd5e1;font-size:13px;line-height:1.6;',text:tr.description})); card.appendChild(descRow); }
  if (tr.notes) { var nRow = div(''); nRow.style.cssText='padding:12px 16px;border-top:1px solid #2e3650;'; nRow.appendChild(el('p',{style:'color:#94a3b8;font-size:11px;text-transform:uppercase;margin-bottom:4px;',text:'Notes'})); nRow.appendChild(el('p',{style:'color:#cbd5e1;font-size:13px;line-height:1.6;',text:tr.notes})); card.appendChild(nRow); }
  wrap.appendChild(card);
  setContent(wrap);
}

function showTrainingForm(existing, defaults, onSave) {
  var body = div('ops-form-grid');
  function add(l,i,full,hint){ body.appendChild(fg(l,i,full,hint)); return i; }
  var titleInp   = add('Title *',          inp('e.g. Hydraulic System Operations — Initial', existing?.title || defaults.title || ''), true);
  var typeInp    = add('Training Type',    sel(_trTypes, existing?.training_type || 'initial'));
  var taskInp    = add('S6000T Task Code', inp('e.g. 05-10-00-820-801', existing?.s6000t_task_code || ''), false, 'Leave blank if not applicable');
  var wucInp     = add('Work Unit Code',   inp('e.g. 27-00-00', existing?.s6000t_wuc || ''));
  var skillInp   = add('Skill Level Required', sel([['','—'],['1','Novice'],['2','Familiar'],['3','Proficient'],['4','Advanced'],['5','Expert']], String(existing?.skill_level||'')));
  var hoursInp   = add('Est. Man-Hours',   inp('e.g. 8', existing?.man_hours||'', 'number'));
  var byDateInp  = add('Required By Date', inp('', existing?.required_by_date||'', 'date'));
  var statusInp  = add('Status',           sel(_trStatuses, existing?.status||'pending'));
  var assignInp  = add('Assigned To (NC user)', inp('@uid', existing?.assigned_to||defaults.assigned_to||''), false, 'Nextcloud username');
  var descInp    = add('Description',      ta('What training is required and why…', existing?.description||defaults.description||'', 3), true);
  var notesInp   = add('Notes',            ta('', existing?.notes||'', 2), true);

  modal(existing ? 'Edit Training Requirement' : 'New Training Requirement', body, async function() {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var d = {
      title:            titleInp.value.trim(),
      training_type:    typeInp.value,
      s6000t_task_code: taskInp.value.trim()||null,
      s6000t_wuc:       wucInp.value.trim()||null,
      skill_level:      skillInp.value||null,
      man_hours:        hoursInp.value||null,
      required_by_date: byDateInp.value||null,
      status:           statusInp.value,
      assigned_to:      assignInp.value.trim().replace(/^@/,'')||null,
      description:      descInp.value.trim()||null,
      notes:            notesInp.value.trim()||null,
    };
    if (defaults.source_type) d.source_type = defaults.source_type;
    if (defaults.source_id)   d.source_id   = defaults.source_id;
    if (defaults.platform_id) d.platform_id = defaults.platform_id;
    if (existing) await API.training.update(existing.id, d);
    else          await API.training.create(d);
    if (onSave) onSave();
  }, existing ? 'Save Changes' : 'Create Requirement');
}

async function renderTrainingSection(sourceType, sourceId, container, canEdit, defaults) {
  var hdr = el('div',{style:'font-size:12px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px;'});
  hdr.textContent = '🎓 Training Requirements';
  container.appendChild(hdr);

  var ph = div(''); ph.style.cssText='color:#475569;font-size:12px;'; ph.textContent='Loading…';
  container.appendChild(ph);

  var items = await API.training.list({source_type:sourceType, source_id:sourceId}).catch(()=>[]);
  ph.innerHTML='';

  function render() {
    ph.innerHTML='';
    if (!items.length) {
      ph.appendChild(el('p',{style:'color:#475569;font-size:12px;margin:4px 0;',text:'No training requirements linked.'}));
    }
    items.forEach(function(tr) {
      var row=div(''); row.style.cssText='display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1e2540;font-size:13px;';
      row.appendChild(span('ops-badge '+(_trStatusColors[tr.status]||'badge-gray'),tr.status.replace('_',' ')));
      var titleEl=el('span',{text:tr.title,style:'flex:1;color:#e2e8f0;cursor:pointer;'});
      titleEl.onclick=function(){ navigate('training-detail',tr.id); };
      row.appendChild(titleEl);
      if (tr.s6000t_task_code) row.appendChild(span('ops-mono ops-small',tr.s6000t_task_code));
      if (tr.man_hours) row.appendChild(el('span',{text:tr.man_hours+'h',style:'color:#94a3b8;font-size:11px;'}));
      if (canEdit) {
        var delBtn=btn('ops-btn-sm ops-btn-danger','✕',async function(){ if(!confirm('Remove this training requirement?'))return; await API.training.destroy(tr.id); items=items.filter(function(x){return x.id!==tr.id;}); render(); });
        row.appendChild(delBtn);
      }
      ph.appendChild(row);
    });
    if (canEdit) {
      var addBtn=btn('ops-btn-sm','+ Add Training Req',function(){
        showTrainingForm(null, Object.assign({source_type:sourceType,source_id:sourceId},defaults||{}), async function(){
          items = await API.training.list({source_type:sourceType,source_id:sourceId}).catch(()=>[]);
          render();
        });
      });
      addBtn.style.marginTop='8px';
      ph.appendChild(addBtn);
    }
  }
  render();
}

/* ── Reusable Manpower Requirements section ── */
async function renderManpowerSection(sourceType, sourceId, container, canEdit) {
  var sectionHdr = el('div',{style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px;'});
  sectionHdr.textContent = '👷 Manpower Requirements';
  container.appendChild(sectionHdr);

  var placeholder = div(''); placeholder.style.color='#475569'; placeholder.style.fontSize='12px';
  placeholder.textContent='Loading…';
  container.appendChild(placeholder);

  var [reqs, allSkills] = await Promise.all([
    API.manpower.requirements.list({source_type: sourceType, source_id: sourceId}).catch(()=>[]),
    API.manpower.skills.list().catch(()=>[]),
  ]);

  placeholder.innerHTML = '';

  function renderReqs() {
    placeholder.innerHTML = '';

    if (canEdit) {
      var addReqBtn = btn('ops-btn-sm','+ Add Requirement', function(){
        showManpowerReqForm(null, sourceType, sourceId, allSkills, function(){
          API.manpower.requirements.list({source_type: sourceType, source_id: sourceId}).then(function(r){
            reqs = r; renderReqs();
          }).catch(function(){});
        });
      });
      addReqBtn.style.marginBottom = '8px';
      placeholder.appendChild(addReqBtn);
    }

    if (!reqs.length) {
      var noReqs = el('div',{style:'color:#475569;font-size:12px;padding:8px 0;'});
      noReqs.textContent = canEdit ? 'No manpower requirements defined. Click "+ Add Requirement" to specify needed skills.' : 'No manpower requirements defined.';
      placeholder.appendChild(noReqs);
      return;
    }

    // Column header
    var colHdr = div('');
    colHdr.style.cssText='display:grid;grid-template-columns:1fr 60px 70px 110px 60px;gap:8px;padding:6px 0;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2e3650;';
    ['Skill / Cert','Qty','Hours','Coverage',''].forEach(function(h){ colHdr.appendChild(el('span',{text:h})); });
    placeholder.appendChild(colHdr);

    reqs.forEach(function(req) {
      var row = div('');
      row.style.cssText='display:grid;grid-template-columns:1fr 60px 70px 110px 60px;gap:8px;padding:8px 0;border-bottom:1px solid #1e2540;align-items:center;font-size:13px;';

      var skillName = req.skill ? req.skill.code+' — '+req.skill.name : (req.notes||'General Labor');
      row.appendChild(el('span',{text:skillName,style:'color:#e2e8f0;'}));
      row.appendChild(el('span',{text:req.qty_required+'×',style:'color:#7dd3fc;font-weight:700;'}));
      row.appendChild(el('span',{text:req.duration_hours ? req.duration_hours+'h' : '—',style:'color:#94a3b8;'}));

      var qualified = req.qualified_count || 0;
      var needed    = req.qty_required || 1;
      var coverEl   = div('');
      var covColor  = qualified >= needed ? '#4ade80' : qualified > 0 ? '#f59e0b' : '#ef4444';
      var covText   = qualified >= needed ? '✓ '+qualified+' qualified' : qualified > 0 ? '⚠ '+qualified+'/'+needed : '✗ None';
      coverEl.style.cssText='font-size:11px;font-weight:700;color:'+covColor+';cursor:'+(req.skill_id?'pointer':'default')+';';
      coverEl.textContent = covText;
      if (req.skill_id) {
        coverEl.title = 'Click to see who qualifies';
        coverEl.addEventListener('click', function(){
          API.manpower.skills.get(req.skill_id).then(function(sk){ showSkillRoster(sk); }).catch(function(){});
        });
      }
      row.appendChild(coverEl);

      var acts = div('');
      if (canEdit) {
        var delBtn = btn('ops-btn-sm','✕',async function(){
          if (!confirm('Remove this requirement?')) return;
          await API.manpower.requirements.destroy(req.id);
          reqs = reqs.filter(function(r){ return r.id !== req.id; });
          renderReqs();
        });
        delBtn.style.cssText='background:#3b1515;color:#f87171;border-color:#5a2020;font-size:11px;';
        acts.appendChild(delBtn);
      }
      row.appendChild(acts);
      placeholder.appendChild(row);
    });

    // Summary
    var totalHours = reqs.reduce(function(s,r){ return s+(r.duration_hours||0); },0);
    if (totalHours > 0) {
      var sumRow = div('');
      sumRow.style.cssText='padding:6px 0;font-size:12px;color:#64748b;text-align:right;border-top:1px solid #2e3650;margin-top:4px;';
      sumRow.textContent='Total est. labor: '+totalHours.toFixed(1)+' hrs';
      placeholder.appendChild(sumRow);
    }
  }

  renderReqs();
}

function showManpowerReqForm(existing, sourceType, sourceId, allSkills, onSave) {
  var f = div('ops-form-grid');
  function add(l,i,full){ f.appendChild(fg(l,i,full)); return i; }

  var skillOpts = [['','— Any / General Labor —'],['__new__','＋ Create new skill in catalog…']].concat(
    allSkills.map(function(s){ return [String(s.id), s.code+' — '+s.name]; })
  );
  var skillSel = add('Skill / Cert Required', sel(skillOpts, existing?.skill_id ? String(existing.skill_id) : ''));

  // New-skill inline fields — shown when "Create new skill" is selected
  var newSkillWrap = div(''); newSkillWrap.style.display='none';
  newSkillWrap.style.cssText='display:none;grid-column:1/-1;background:#0c1929;border:1px solid #1e3a5f;border-radius:8px;padding:14px 16px;margin-top:4px;';
  var nsCode = inp('Code', '', 'text'); nsCode.placeholder='e.g. ELECT-01';
  var nsName = inp('Name', '', 'text'); nsName.placeholder='e.g. Electrician — Low Voltage';
  var nsCat  = inp('Category', '', 'text'); nsCat.placeholder='e.g. Electrical, Mechanical, Safety…';
  var nsDesc = document.createElement('textarea'); nsDesc.rows=2; nsDesc.placeholder='Optional description / certification details…';
  nsDesc.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:8px;font-size:12px;resize:vertical;margin-top:4px;';
  newSkillWrap.appendChild(el('div',{text:'New Skill Details',style:'font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;'}));
  [[nsCode,'Code (short identifier)'],[nsName,'Full Name'],[nsCat,'Category']].forEach(function(pair){
    var row=div(''); row.style.cssText='margin-bottom:8px;';
    row.appendChild(el('label',{text:pair[1],style:'display:block;font-size:10px;color:#94a3b8;margin-bottom:3px;font-weight:600;text-transform:uppercase;'}));
    pair[0].style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:7px 10px;font-size:12px;';
    row.appendChild(pair[0]); newSkillWrap.appendChild(row);
  });
  var nsDescRow=div(''); nsDescRow.style.marginBottom='4px';
  nsDescRow.appendChild(el('label',{text:'Description',style:'display:block;font-size:10px;color:#94a3b8;margin-bottom:3px;font-weight:600;text-transform:uppercase;'}));
  nsDescRow.appendChild(nsDesc); newSkillWrap.appendChild(nsDescRow);
  f.appendChild(newSkillWrap);

  skillSel.onchange = function() {
    newSkillWrap.style.display = skillSel.value==='__new__' ? 'block' : 'none';
  };

  var qtyInp   = add('Qty Required', inp('1', String(existing?.qty_required||1), 'number'));
  var hrsInp   = add('Est. Hours Each', inp('0', existing?.duration_hours ? String(existing.duration_hours) : '', 'number'));
  var notesInp = add('Notes / Description', ta('e.g. Must be OSHA 30-certified…', existing?.notes||''), true);

  modal((existing?'Edit':'Add')+' Manpower Requirement', f, async function(){
    var resolvedSkillId = existing?.skill_id || null;

    if (skillSel.value === '__new__') {
      // Create the skill in the catalog first
      if (!nsCode.value.trim() || !nsName.value.trim()) throw new Error('Skill Code and Name are required.');
      var newSkill = await API.manpower.skills.create({
        code:        nsCode.value.trim().toUpperCase(),
        name:        nsName.value.trim(),
        category:    nsCat.value.trim()||null,
        description: nsDesc.value.trim()||null,
      });
      resolvedSkillId = newSkill.id;
      // Inject into the local allSkills array so subsequent calls have it
      allSkills.push(newSkill);
    } else if (skillSel.value) {
      resolvedSkillId = parseInt(skillSel.value);
    }

    var d = {
      source_type:    sourceType,
      source_id:      sourceId,
      skill_id:       resolvedSkillId,
      qty_required:   parseInt(qtyInp.value)||1,
      duration_hours: hrsInp.value ? parseFloat(hrsInp.value) : null,
      notes:          notesInp.value.trim()||null,
    };
    if (existing) await API.manpower.requirements.update(existing.id, d);
    else          await API.manpower.requirements.create(d);
    if (onSave) onSave();
  }, existing?'Save Changes':'Add Requirement');
}

function showSkillRoster(skill) {
  var qualified = skill.qualified_personnel || [];
  var body = div('');
  body.appendChild(el('p',{text:skill.code+' — '+skill.name,style:'color:#7dd3fc;font-weight:700;margin:0 0 16px;'}));

  if (!qualified.length) {
    body.appendChild(el('div',{cls:'ops-empty',text:'No personnel currently hold this qualification.'}));
  } else {
    var colHdr = div('');
    colHdr.style.cssText='display:grid;grid-template-columns:1fr 90px 110px 110px;gap:8px;padding:6px 0;font-size:10px;color:#475569;text-transform:uppercase;border-bottom:1px solid #2e3650;';
    ['Name','Proficiency','Certified','Expires'].forEach(function(h){ colHdr.appendChild(el('span',{text:h})); });
    body.appendChild(colHdr);

    var today = new Date().toISOString().slice(0,10);
    qualified.forEach(function(p) {
      var row = div('');
      row.style.cssText='display:grid;grid-template-columns:1fr 90px 110px 110px;gap:8px;padding:8px 0;border-bottom:1px solid #1e2540;font-size:13px;align-items:center;';
      var nameCell = div('');
      nameCell.appendChild(el('div',{text:p.full_name,style:'color:#e2e8f0;font-weight:600;'}));
      if (p.nextcloud_uid) nameCell.appendChild(el('div',{text:'@'+p.nextcloud_uid,style:'color:#475569;font-size:11px;'}));
      row.appendChild(nameCell);
      var profColor=['','#ef4444','#f97316','#f59e0b','#4ade80','#22d3ee'][p.proficiency_level]||'#94a3b8';
      row.appendChild(el('span',{text:_profLabels[p.proficiency_level]||'—',style:'color:'+profColor+';font-size:12px;font-weight:600;'}));
      row.appendChild(el('span',{text:p.certified_date||'—',style:'color:#94a3b8;font-size:12px;'}));
      var expEl = el('span',{text:p.expiry_date||'—'});
      expEl.style.cssText='font-size:12px;color:'+(p.expiry_date && p.expiry_date < today ? '#ef4444' : '#94a3b8')+';';
      row.appendChild(expEl);
      body.appendChild(row);
    });
  }

  modal('👷 Qualified Roster — '+skill.code, body, async function(){}, 'Close');
}

/* ── Reports / Analytics (Sprint 5J) ────────────────────────── */

// ── Chart drawing helpers ─────────────────────────────────────────

function _rptLineChart(canvas, series, opts) {
  // series: [{label, value}] or [{label, CRITICAL, HIGH, ...}] for stacked
  var stacked = opts.stacked && opts.keys;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var padL=44, padR=16, padT=12, padB=32;
  var cW=W-padL-padR, cH=H-padT-padB;
  ctx.clearRect(0,0,W,H);

  if (!series.length) { ctx.fillStyle='#475569'; ctx.font='12px monospace'; ctx.fillText('No data', W/2-20, H/2); return; }

  var colors = opts.colors || ['#4ac8e8','#f87171','#fbbf24','#34d399','#a78bfa'];
  var keys   = stacked ? opts.keys : ['value'];

  // Compute max
  var max = 0;
  series.forEach(pt => {
    var tot = stacked ? keys.reduce((s,k)=>s+(+pt[k]||0),0) : (+pt.value||0);
    if (tot > max) max = tot;
  });
  if (!max) max = 1;

  // Grid lines
  ctx.strokeStyle='#1e2540'; ctx.lineWidth=1;
  [0,0.25,0.5,0.75,1].forEach(f => {
    var y = padT + cH*(1-f);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle='#475569'; ctx.font='9px monospace'; ctx.textAlign='right';
    ctx.fillText(Math.round(f*max), padL-4, y+3);
  });

  // Lines / stacked
  var xStep = cW / Math.max(series.length-1, 1);
  keys.forEach((k,ki) => {
    ctx.beginPath(); ctx.strokeStyle=colors[ki%colors.length]; ctx.lineWidth=2;
    series.forEach((pt,i) => {
      var val = stacked ? keys.slice(0,ki+1).reduce((s,kk)=>s+(+pt[kk]||0),0) : (+pt.value||0);
      var x=padL+i*xStep, y=padT+cH*(1-val/max);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
  });

  // X labels
  ctx.fillStyle='#64748b'; ctx.font='9px monospace'; ctx.textAlign='center';
  var step = Math.ceil(series.length/8);
  series.forEach((pt,i) => {
    if (i%step!==0 && i!==series.length-1) return;
    ctx.fillText(pt.label||'', padL+i*xStep, H-6);
  });
}

function _rptBarChart(canvas, series, opts) {
  // series: [{label, value}] or [{label, funded, obligated}]
  var ctx = canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  var padL=44, padR=12, padT=12, padB=48;
  var cW=W-padL-padR, cH=H-padT-padB;
  ctx.clearRect(0,0,W,H);

  if (!series.length) { ctx.fillStyle='#475569'; ctx.font='12px monospace'; ctx.fillText('No data', W/2-20, H/2); return; }

  var keys   = opts.keys || ['value'];
  var colors = opts.colors || ['#4ac8e8','#6366f1','#34d399','#fbbf24'];
  var max = 0;
  series.forEach(pt => { keys.forEach(k => { if((+pt[k]||0)>max) max=+pt[k]||0; }); });
  if (!max) max = 1;

  var bW = cW / series.length;
  var subW = (bW - 8) / keys.length;

  // Grid
  ctx.strokeStyle='#1e2540'; ctx.lineWidth=1;
  [0.25,0.5,0.75,1].forEach(f => {
    var y=padT+cH*(1-f);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle='#475569'; ctx.font='9px monospace'; ctx.textAlign='right';
    var label = opts.unit==='%' ? Math.round(f*max)+'%' : Math.round(f*max);
    ctx.fillText(label, padL-4, y+3);
  });

  // Bars
  series.forEach((pt,i) => {
    keys.forEach((k,ki) => {
      var val = +pt[k]||0;
      var x = padL + i*bW + 4 + ki*subW;
      var bH = cH*(val/max);
      ctx.fillStyle = colors[ki%colors.length];
      ctx.fillRect(x, padT+cH-bH, subW-2, bH);
    });
    // X label
    ctx.fillStyle='#64748b'; ctx.font='9px monospace'; ctx.textAlign='center';
    var lbl = (pt.label||'').length>10 ? pt.label.slice(0,10)+'…' : (pt.label||'');
    ctx.fillText(lbl, padL+i*bW+bW/2, H-6);
    if (keys.length===1 && opts.unit==='%') {
      ctx.fillStyle='#94a3b8'; ctx.font='9px monospace';
      ctx.fillText(pt.value+'%', padL+i*bW+bW/2, padT+cH*(1-pt.value/max)-4);
    }
  });
}

function _rptDonutChart(canvas, series) {
  // series: [{label, value}]
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  var colors=['#4ac8e8','#6366f1','#34d399','#fbbf24','#f87171'];
  var total=series.reduce((s,d)=>s+d.value,0)||1;
  var cx=W/2-40, cy=H/2, r=Math.min(cx,cy)*0.82, inner=r*0.58;
  var angle=-Math.PI/2;
  series.forEach((d,i)=>{
    var sweep=2*Math.PI*(d.value/total);
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+sweep);
    ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    angle+=sweep;
  });
  // Inner hole
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,2*Math.PI);
  ctx.fillStyle='#0f172a'; ctx.fill();
  // Legend
  var lx=W-85, ly=20;
  series.forEach((d,i)=>{
    ctx.fillStyle=colors[i%colors.length];
    ctx.fillRect(lx,ly+i*20,10,10);
    ctx.fillStyle='#94a3b8'; ctx.font='10px monospace'; ctx.textAlign='left';
    ctx.fillText((d.label||'').slice(0,10)+': '+d.value, lx+14, ly+i*20+9);
  });
}

function _rptGauge(canvas, value, label) {
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  var cx=W/2, cy=H*0.62, r=Math.min(W,H)*0.38;
  var startA=Math.PI, endA=2*Math.PI;
  // Track
  ctx.beginPath(); ctx.arc(cx,cy,r,startA,endA); ctx.strokeStyle='#1e2540'; ctx.lineWidth=14; ctx.stroke();
  // Fill
  var pct=Math.max(0,Math.min(100,value))/100;
  var color=pct>=0.75?'#34d399':pct>=0.5?'#4ac8e8':pct>=0.25?'#fbbf24':'#f87171';
  ctx.beginPath(); ctx.arc(cx,cy,r,startA,startA+(endA-startA)*pct); ctx.strokeStyle=color; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
  // Value
  ctx.fillStyle='#f1f5f9'; ctx.font='bold 28px monospace'; ctx.textAlign='center'; ctx.fillText(value+'%',cx,cy+6);
  ctx.fillStyle='#64748b'; ctx.font='11px monospace'; ctx.fillText(label||'',cx,cy+24);
}

function _rptHeatmap(container, series, keys) {
  // series: [{age_bucket, critical, high, medium, low}]
  container.innerHTML='';
  var maxVal=0;
  series.forEach(row=>keys.forEach(k=>{ if((row[k]||0)>maxVal) maxVal=row[k]||0; }));
  if(!maxVal) maxVal=1;

  var grid=div(''); grid.style.cssText='display:grid;grid-template-columns:70px repeat('+keys.length+',1fr);gap:3px;font-size:11px;';

  var hdrRow=[div('')];
  keys.forEach(k=>{ var h=div(''); h.style.cssText='text-align:center;color:#64748b;padding:3px;font-weight:600;'; h.textContent=k; hdrRow.push(h); });
  hdrRow.forEach(h=>grid.appendChild(h));

  series.forEach(row=>{
    var lbl=div(''); lbl.style.cssText='color:#94a3b8;display:flex;align-items:center;'; lbl.textContent=row.age_bucket||'';
    grid.appendChild(lbl);
    keys.forEach(k=>{
      var v=row[k]||0;
      var intensity=v/maxVal;
      var cell=div(''); cell.title=k+': '+v;
      var r=Math.round(248*intensity), g=Math.round(52*(1-intensity)+200*intensity*(intensity>0.6?0:1)), b=Math.round(114*(1-intensity));
      cell.style.cssText='background:rgba('+r+','+g+','+b+','+(0.15+intensity*0.85)+');border-radius:4px;padding:8px 4px;text-align:center;color:#f1f5f9;font-weight:600;cursor:default;';
      cell.textContent=v||'';
      grid.appendChild(cell);
    });
  });
  container.appendChild(grid);
}

function _rptSparkGrid(container, nodes) {
  container.innerHTML='';
  nodes.forEach(n=>{
    var row=div(''); row.style.cssText='display:grid;grid-template-columns:140px 60px 60px 60px 60px 80px;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #1e2540;font-size:12px;';
    var statusColor=n.status==='online'?'#34d399':n.status==='offline'?'#f87171':'#fbbf24';
    row.appendChild(el('span',{text:n.hostname||'—',style:'color:#e2e8f0;font-weight:500;'}));
    row.appendChild(el('span',{text:n.cpu!=null?n.cpu+'%':'—',style:'color:'+(n.cpu>85?'#f87171':n.cpu>70?'#fbbf24':'#94a3b8')+';text-align:right;'}));
    row.appendChild(el('span',{text:n.ram!=null?n.ram+'%':'—',style:'color:'+(n.ram>85?'#f87171':n.ram>70?'#fbbf24':'#94a3b8')+';text-align:right;'}));
    row.appendChild(el('span',{text:n.disk!=null?n.disk+'%':'—',style:'color:'+(n.disk>90?'#f87171':n.disk>75?'#fbbf24':'#94a3b8')+';text-align:right;'}));
    row.appendChild(el('span',{text:n.pending_update?'⚠ Pending':'✓',style:'color:'+(n.pending_update?'#fbbf24':'#34d399')+';text-align:center;'}));
    row.appendChild(el('span',{text:'●  '+(n.status||'—'),style:'color:'+statusColor+';'}));
    container.appendChild(row);
  });
  if(!nodes.length) container.appendChild(el('div',{cls:'ops-empty',text:'No fleet nodes registered.'}));
}

// ── Widget renderer ───────────────────────────────────────────────

// Renders chart content directly into `container` (a pre-created div)
// scope: optional {platform_id, shop_id} for global dashboard filter
async function _renderWidget(container, widget, scope) {
  container.style.cssText='padding:12px;flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;';

  var filters = {}; try{ filters=JSON.parse(widget.filters||'{}'); }catch(e){}
  // Use generic query engine whenever x_source or y_source is set in filters
  var isCustom = !!(filters.x_source || filters.y_source || filters.data_source);

  var data;
  if(isCustom) {
    var qp = {
      x_source:      filters.x_source || filters.data_source || '',
      x_field:       filters.x_field  || '',
      y_source:      filters.y_source || filters.data_source || '',
      y_field:       filters.y_field  || 'count',
      scatter_field: filters.scatter_field || '',
      time_range:    widget.time_range || '30d',
    };
    if(scope?.platform_id) qp.platform_id = scope.platform_id;
    if(scope?.shop_id)     qp.shop_id     = scope.shop_id;
    try {
      data = await API.reports.query(qp);
      if(data && data.error) { container.appendChild(el('div',{style:'color:#f87171;font-size:11px;padding:16px 8px;',text:'⚠ '+data.error})); return; }
    }
    catch(e) { container.appendChild(el('div',{style:'color:#f87171;font-size:11px;padding:16px 8px;',text:'⚠ '+e.message})); return; }
  } else {
    var params={time_range:widget.time_range||'30d'};
    if(widget.group_by)  params.group_by=widget.group_by;
    if(scope?.platform_id) params.platform_id = scope.platform_id;
    if(scope?.shop_id)     params.shop_id     = scope.shop_id;
    if(filters && Object.keys(filters).length) params.filters=JSON.stringify(filters);
    try { data = await API.reports.data(widget.metric, params); }
    catch(e) { container.appendChild(el('div',{cls:'ops-empty',text:'⚠ '+e.message})); return; }
  }

  if(!data || (!data.series?.length && data.compliance_rate===undefined && data.fleet_score===undefined)) {
    container.appendChild(el('div',{style:'color:#475569;font-size:12px;text-align:center;padding:32px 0;',text:'No data for this time range'}));
    return;
  }

  var chartType=widget.chart_type||'bar';

  if(chartType==='heatmap') {
    var hmEl=div(''); hmEl.style.cssText='padding:4px;overflow:auto;flex:1;';
    _rptHeatmap(hmEl, data.series||[], data.keys||['SEV-1','SEV-2','SEV-3','SEV-4','SEV-5']);
    container.appendChild(hmEl);
  } else if(chartType==='sparkline') {
    if(widget.metric==='fleet_node_health') {
      var spHdr=div(''); spHdr.style.cssText='display:grid;grid-template-columns:140px 60px 60px 60px 60px 80px;gap:8px;padding:4px 0 8px;border-bottom:1px solid #2e3650;font-size:10px;color:#475569;font-weight:700;';
      ['Node','CPU','RAM','Disk','Patch','Status'].forEach(function(h){ var he=div(''); he.style.textAlign=h==='Node'?'left':'right'; he.textContent=h; spHdr.appendChild(he); });
      container.appendChild(spHdr);
    }
    var spWrap=div(''); spWrap.style.cssText='flex:1;overflow-y:auto;';
    _rptSparkGrid(spWrap, data.series||[]);
    container.appendChild(spWrap);
  } else if(chartType==='gauge') {
    var cv=el('canvas'); cv.width=280; cv.height=160; cv.style.cssText='display:block;margin:auto;';
    container.appendChild(cv);
    _rptGauge(cv, data.compliance_rate??data.fleet_score??0, widget.title||'');
    var br=div(''); br.style.cssText='display:flex;gap:16px;justify-content:center;margin-top:8px;font-size:11px;';
    if(data.patched!==undefined) {
      [['Patched',data.patched,'#34d399'],['Pending',data.pending||0,'#fbbf24'],['Offline',data.offline||0,'#f87171']].forEach(function(arr){
        br.appendChild(el('span',{text:arr[0]+': '+arr[1],style:'color:'+arr[2]+';'}));
      });
    }
    container.appendChild(br);
  } else if(chartType==='donut') {
    var cv=el('canvas'); cv.width=280; cv.height=180; cv.style.cssText='display:block;margin:auto;';
    var donutSeries=(data.series||[]).map(function(s){ return {label:'T'+(s.tier||s.label||'?'), value:s.total||s.value||0}; });
    container.appendChild(cv);
    _rptDonutChart(cv, donutSeries);
  } else if(chartType==='line') {
    var cv=el('canvas');
    cv.width=container.offsetWidth>0?container.offsetWidth-24:340; cv.height=160;
    cv.style.cssText='display:block;width:100%;max-width:100%;';
    container.appendChild(cv);
    requestAnimationFrame(function(){ _rptLineChart(cv, data.series||[], {stacked:data.stacked,keys:data.keys,colors:['#f87171','#fbbf24','#34d399','#4ac8e8']}); });
  } else if(chartType==='scatter') {
    var cv=el('canvas');
    cv.width=container.offsetWidth>0?container.offsetWidth-24:340; cv.height=200;
    cv.style.cssText='display:block;width:100%;max-width:100%;';
    container.appendChild(cv);
    requestAnimationFrame(function(){ _rptScatterChart(cv, data.series||[], {xLabel:filters.scatter_field||'X',yLabel:filters.y_field||'Y'}); });
  } else if(chartType==='table') {
    var tblWrap=div(''); tblWrap.style.cssText='flex:1;overflow-y:auto;';
    _rptDataTable(tblWrap, data.series||[], {xLabel:filters.x_field||'Group',yLabel:filters.y_field||'Value'});
    container.appendChild(tblWrap);
  } else {
    var cv=el('canvas');
    cv.width=container.offsetWidth>0?container.offsetWidth-24:340; cv.height=160;
    cv.style.cssText='display:block;width:100%;max-width:100%;';
    container.appendChild(cv);
    requestAnimationFrame(function(){ _rptBarChart(cv, data.series||[], {keys:data.keys||['value'],unit:data.unit,colors:['#4ac8e8','#6366f1']}); });
  }
}

// ── Scatter chart renderer ────────────────────────────────────────
// series: [{label, value (Y), x_val (X)}]
function _rptScatterChart(canvas, series, opts) {
  var ctx=canvas.getContext('2d');
  var W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  if(!series||!series.length){ ctx.fillStyle='#475569'; ctx.font='12px system-ui'; ctx.textAlign='center'; ctx.fillText('No data',W/2,H/2); return; }

  var pad={t:16,r:20,b:40,l:52};
  var cw=W-pad.l-pad.r, ch=H-pad.t-pad.b;

  var xs=series.map(function(s){ return s.x_val!=null?+s.x_val:0; });
  var ys=series.map(function(s){ return +s.value||0; });
  var minX=Math.min.apply(null,xs), maxX=Math.max.apply(null,xs);
  var minY=Math.min.apply(null,ys), maxY=Math.max.apply(null,ys);
  if(maxX===minX){ minX=minX-1; maxX=maxX+1; }
  if(maxY===minY){ minY=minY-1; maxY=maxY+1; }
  var rangeX=maxX-minX, rangeY=maxY-minY;

  // Grid lines
  ctx.strokeStyle='#1e293b'; ctx.lineWidth=1;
  for(var gi=0;gi<=4;gi++){
    var gy=pad.t+ch*(gi/4);
    ctx.beginPath(); ctx.moveTo(pad.l,gy); ctx.lineTo(pad.l+cw,gy); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle='#334155'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+ch); ctx.lineTo(pad.l+cw,pad.t+ch); ctx.stroke();

  // Axis labels
  ctx.fillStyle='#64748b'; ctx.font='10px system-ui'; ctx.textAlign='center';
  ctx.fillText(opts.xLabel||'X', pad.l+cw/2, H-4);
  ctx.save(); ctx.translate(12,pad.t+ch/2); ctx.rotate(-Math.PI/2); ctx.fillText(opts.yLabel||'Y',0,0); ctx.restore();

  // Tick values
  ctx.font='9px system-ui'; ctx.fillStyle='#475569';
  ctx.textAlign='right'; ctx.fillText(maxY.toFixed(1),pad.l-3,pad.t+4);
  ctx.fillText(minY.toFixed(1),pad.l-3,pad.t+ch);
  ctx.textAlign='left'; ctx.fillText(minX.toFixed(1),pad.l,pad.t+ch+12);
  ctx.textAlign='right'; ctx.fillText(maxX.toFixed(1),pad.l+cw,pad.t+ch+12);

  // Points
  var colors=['#4ac8e8','#6366f1','#34d399','#f59e0b','#f87171','#a78bfa','#10b981','#60a5fa'];
  series.forEach(function(s,i){
    var px=pad.l+((( s.x_val!=null?+s.x_val:0)-minX)/rangeX)*cw;
    var py=pad.t+(1-((+s.value||0)-minY)/rangeY)*ch;
    var c=colors[i%colors.length];
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fillStyle=c; ctx.fill();
    // Label above dot
    ctx.fillStyle='#94a3b8'; ctx.font='9px system-ui'; ctx.textAlign='center';
    ctx.fillText((s.label||'').substring(0,10),px,py-8);
  });
}

// ── Data table renderer ────────────────────────────────────────────
// series: [{label, value}] — renders scrollable HTML table
function _rptDataTable(container, series, opts) {
  var tbl=el('table');
  tbl.style.cssText='width:100%;border-collapse:collapse;font-size:12px;';

  var thead=el('thead'); var hr=el('tr');
  [opts.xLabel||'Group', opts.yLabel||'Value'].forEach(function(h,i){
    var th=el('th',{text:h}); th.style.cssText='text-align:'+(i?'right':'left')+';padding:5px 8px;border-bottom:1px solid #1e293b;font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;';
    hr.appendChild(th);
  });
  thead.appendChild(hr); tbl.appendChild(thead);

  var tbody=el('tbody');
  if(!series||!series.length){
    var tr=el('tr'); var td=el('td',{text:'No data'}); td.colSpan=2; td.style.cssText='text-align:center;padding:16px;color:#475569;'; tr.appendChild(td); tbody.appendChild(tr);
  } else {
    series.forEach(function(s,i){
      var tr=el('tr'); tr.style.background=i%2===0?'transparent':'#0f172a';
      var td1=el('td',{text:s.label||'—'}); td1.style.cssText='padding:5px 8px;color:#94a3b8;border-bottom:1px solid #0f172a;';
      var td2=el('td',{text:(+s.value||0).toLocaleString()}); td2.style.cssText='padding:5px 8px;text-align:right;color:#e2e8f0;font-weight:600;border-bottom:1px solid #0f172a;font-variant-numeric:tabular-nums;';
      tr.appendChild(td1); tr.appendChild(td2); tbody.appendChild(tr);
    });
  }
  tbl.appendChild(tbody);
  container.appendChild(tbl);
}

// ── Widget builder modal ─────────────────────────────────────────

var METRIC_META = {
  readiness_trend:          {label:'Readiness Trend',         icon:'📈', desc:'Fleet readiness scores over time',                   charts:['line','bar','table','scatter'],         defaultChart:'line'},
  pm_compliance:            {label:'PM Compliance Rate',       icon:'🔧', desc:'Scheduled vs completed preventive maintenance',       charts:['bar','donut','table'],                 defaultChart:'bar'},
  cve_severity_trend:       {label:'CVE Severity Trend',       icon:'🛡', desc:'Open vulnerabilities by severity over time',          charts:['line','bar','table'],                  defaultChart:'line'},
  deficiency_aging:         {label:'Deficiency Aging',         icon:'⚠', desc:'Open deficiencies bucketed by age and severity',     charts:['heatmap','bar','table'],               defaultChart:'heatmap'},
  budget_variance:          {label:'Budget Variance',          icon:'💰', desc:'Authorized vs obligated funding by platform',         charts:['bar','table','scatter'],               defaultChart:'bar'},
  fleet_node_health:        {label:'Fleet Node Health',        icon:'💻', desc:'CPU / RAM / disk utilization per node',               charts:['sparkline','table','scatter'],          defaultChart:'sparkline'},
  patch_compliance:         {label:'Patch Compliance',         icon:'🩹', desc:'Ratio of nodes with current vs pending patches',      charts:['gauge','donut','table'],               defaultChart:'gauge'},
  vulnerability_score:      {label:'Vulnerability Score',      icon:'🔍', desc:'Weighted CVE exposure score per node',                charts:['sparkline','bar','table','scatter'],    defaultChart:'sparkline'},
  software_tier_compliance: {label:'SW Tier Compliance',       icon:'📦', desc:'Approved vs total software requests by tier',        charts:['donut','bar','table'],                 defaultChart:'donut'},
};

var CHART_LABELS = {line:'Line',bar:'Bar',donut:'Donut',heatmap:'Heatmap',sparkline:'Sparkline',gauge:'Gauge',scatter:'Scatter',table:'Table'};
var CHART_ICONS  = {line:'📉',bar:'📊',donut:'🍩',heatmap:'🟥',sparkline:'⚡',gauge:'🕐',scatter:'✦',table:'⊞'};

// Static field schema for the X/Y axis configurator (per metric)
// dimensions → X axis grouping options (maps to group_by param)
// measures   → Y axis value options (informational + stored in filters for future backend use)
var METRIC_SCHEMA = {
  readiness_trend:   { dimensions:[{key:'',label:'Week (default)'},{key:'platform',label:'Platform'},{key:'status_code',label:'Status Code'}], measures:[{key:'avg_score',label:'Avg Readiness Score'},{key:'count',label:'Asset Count'}] },
  pm_compliance:     { dimensions:[{key:'category',label:'Category (default)'},{key:'platform',label:'Platform'}], measures:[{key:'compliance_rate',label:'Compliance Rate %'},{key:'overdue',label:'Overdue Count'},{key:'total',label:'Total PMs'}] },
  cve_severity_trend:{ dimensions:[{key:'',label:'Week (default)'},{key:'severity',label:'Severity'},{key:'node',label:'Node'}], measures:[{key:'count',label:'CVE Count'},{key:'critical',label:'Critical Only'},{key:'high',label:'High Only'}] },
  deficiency_aging:  { dimensions:[{key:'',label:'Age Bucket (default)'},{key:'severity',label:'Severity'},{key:'platform',label:'Platform'}], measures:[{key:'count',label:'Deficiency Count'}] },
  budget_variance:   { dimensions:[{key:'platform',label:'Platform (default)'},{key:'fiscal_year',label:'Fiscal Year'}], measures:[{key:'authorized',label:'Authorized ($)'},{key:'obligated',label:'Obligated ($)'},{key:'variance',label:'Variance ($)'}] },
  fleet_node_health: { dimensions:[{key:'hostname',label:'Hostname (default)'},{key:'status',label:'Status'}], measures:[{key:'cpu_pct',label:'CPU %'},{key:'memory_pct',label:'Memory %'},{key:'disk_pct',label:'Disk %'}] },
  patch_compliance:  { dimensions:[{key:'hostname',label:'Hostname (default)'},{key:'patch_state',label:'Patch State'},{key:'os_version',label:'OS Version'}], measures:[{key:'compliance_rate',label:'Compliance Rate %'},{key:'count',label:'Node Count'}] },
  vulnerability_score:{ dimensions:[{key:'hostname',label:'Hostname (default)'},{key:'severity',label:'Severity'}], measures:[{key:'cyber_score',label:'Cyber Score'},{key:'raw_score',label:'Raw Exposure'},{key:'cve_count',label:'CVE Count'}] },
  software_tier_compliance:{ dimensions:[{key:'tier',label:'Tier (default)'},{key:'status',label:'Request Status'}], measures:[{key:'rate',label:'Compliance Rate %'},{key:'total',label:'Total Requests'},{key:'approved',label:'Approved Count'}] },
};

function openWidgetBuilder(dashboardId, existingWidget, onSave) {
  var overlay=div('ops-modal-overlay'); overlay.style.zIndex='2000';
  var modal=div('ops-modal');
  modal.style.cssText='max-width:880px;width:95%;display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0;overflow:hidden;border-radius:10px;';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick=e=>{ if(e.target===overlay) overlay.remove(); };

  var isEdit=!!existingWidget;
  var selMetric   = existingWidget?.metric      || Object.keys(METRIC_META)[0];
  var selChart    = existingWidget?.chart_type  || METRIC_META[selMetric].defaultChart;
  var selRange    = existingWidget?.time_range  || '30d';
  var selGroup    = existingWidget?.group_by    || '';
  var previewData = null;
  var previewTimer= null;

  // ── LEFT PANE ──────────────────────────────────────────────────────
  var left=div(''); left.style.cssText='padding:20px;background:#0f172a;border-right:1px solid #1e293b;display:flex;flex-direction:column;gap:0;overflow-y:auto;max-height:80vh;';

  left.appendChild(el('h3',{text:(isEdit?'Edit':'Add')+' Widget',style:'margin:0 0 16px;color:#e2e8f0;font-size:15px;font-weight:600;'}));

  // Title
  var titleInp=inp('Widget title', existingWidget?.title||'');
  titleInp.style.cssText='width:100%;background:#1e293b;border:1px solid #2e3650;border-radius:6px;padding:7px 10px;color:#e2e8f0;font-size:13px;box-sizing:border-box;margin-bottom:14px;';
  left.appendChild(titleInp);

  // Metric cards
  left.appendChild(el('label',{text:'Data Source',style:'display:block;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:6px;letter-spacing:.06em;'}));
  var metricGrid=div(''); metricGrid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;';

  var metricCards={};
  function refreshMetricCards() {
    Object.entries(metricCards).forEach(([k,c])=>{
      c.style.borderColor = k===selMetric ? '#3b82f6' : '#1e293b';
      c.style.background  = k===selMetric ? '#1e3a5f' : '#1e293b';
    });
  }

  Object.entries(METRIC_META).forEach(([k,m])=>{
    var card=div(''); card.style.cssText='border:1px solid #1e293b;border-radius:6px;padding:8px 10px;cursor:pointer;transition:border-color .15s,background .15s;background:#1e293b;';
    card.appendChild(el('div',{text:m.icon+' '+m.label, style:'font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:2px;'}));
    card.appendChild(el('div',{text:m.desc,             style:'font-size:10px;color:#64748b;line-height:1.3;'}));
    card.onclick=()=>{
      selMetric=k;
      selChart=METRIC_META[k].defaultChart;
      refreshMetricCards();
      refreshChartPills();
      schedulePreview();
    };
    metricCards[k]=card;
    metricGrid.appendChild(card);
  });
  refreshMetricCards();
  left.appendChild(metricGrid);

  // Time range
  var selStyle='width:100%;background:#1e293b;border:1px solid #2e3650;border-radius:6px;padding:7px 10px;color:#e2e8f0;font-size:13px;box-sizing:border-box;';
  function mkSel(options, current, onChange) {
    var s=el('select'); s.style.cssText=selStyle;
    options.forEach(([v,l])=>{ var o=el('option',{text:l}); o.value=v; if(v===current) o.selected=true; s.appendChild(o); });
    s.onchange=()=>onChange(s.value);
    return s;
  }

  function fldRow(lbl, ctrl) {
    var w=div(''); w.style.marginBottom='10px';
    w.appendChild(el('label',{text:lbl, style:'display:block;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:4px;letter-spacing:.06em;'}));
    w.appendChild(ctrl); return w;
  }

  var rangeCtrl=mkSel([['7d','Last 7 days'],['30d','Last 30 days'],['90d','Last 90 days'],['1y','Last year'],['all','All time']], selRange, v=>{ selRange=v; schedulePreview(); });
  var groupCtrl=mkSel([['','None'],['platform','By Platform']], selGroup, v=>{ selGroup=v; schedulePreview(); });
  left.appendChild(fldRow('Time Range', rangeCtrl));
  left.appendChild(fldRow('Group By',   groupCtrl));

  var errEl=el('p',{text:'',style:'color:#f87171;font-size:12px;margin:8px 0 0;min-height:16px;'}); left.appendChild(errEl);

  var actRow=div(''); actRow.style.cssText='display:flex;gap:8px;margin-top:auto;padding-top:12px;';
  var saveB=btn('primary ops-btn-sm', isEdit?'Update Widget':'Add Widget', async ()=>{
    var meta=METRIC_META[selMetric];
    var payload={
      title:      titleInp.value.trim()||meta.label,
      metric:     selMetric,
      chart_type: selChart,
      time_range: selRange,
      group_by:   selGroup||null,
      pos_x:  existingWidget?.pos_x  || 0,
      pos_y:  existingWidget?.pos_y  || 0,
      width:  existingWidget?.width  || 2,
      height: existingWidget?.height || 2,
    };
    saveB.disabled=true; saveB.textContent='Saving…';
    try {
      var result;
      if(isEdit) result=await API.reports.updateWidget(dashboardId, existingWidget.id, payload);
      else       result=await API.reports.createWidget(dashboardId, payload);
      overlay.remove();
      onSave(result);
    } catch(e) { errEl.textContent=e.message; saveB.disabled=false; saveB.textContent=isEdit?'Update Widget':'Add Widget'; }
  });
  var cancelB=btn('ops-btn-sm','Cancel',()=>overlay.remove());
  actRow.appendChild(saveB); actRow.appendChild(cancelB);
  left.appendChild(actRow);

  // ── RIGHT PANE ─────────────────────────────────────────────────────
  var right=div(''); right.style.cssText='padding:20px;background:#0b1120;display:flex;flex-direction:column;gap:12px;';

  right.appendChild(el('label',{text:'Chart Type',style:'display:block;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.06em;'}));

  var pillRow=div(''); pillRow.style.cssText='display:flex;flex-wrap:wrap;gap:6px;';
  var pillEls={};

  function refreshChartPills() {
    Object.keys(pillEls).forEach(k=>pillEls[k].remove());
    Object.keys(pillEls).forEach(k=>delete pillEls[k]);
    (METRIC_META[selMetric]?.charts||['line']).forEach(ct=>{
      var p=div(''); p.style.cssText='padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:all .15s;';
      p.textContent=CHART_ICONS[ct]+' '+CHART_LABELS[ct];
      function stylePill() {
        p.style.borderColor  = ct===selChart ? '#3b82f6' : '#2e3650';
        p.style.background   = ct===selChart ? '#1e3a5f' : 'transparent';
        p.style.color        = ct===selChart ? '#93c5fd' : '#64748b';
      }
      stylePill();
      p.onclick=()=>{ selChart=ct; Object.keys(pillEls).forEach(k=>{ if(pillEls[k]) { pillEls[k].style.borderColor=k===selChart?'#3b82f6':'#2e3650'; pillEls[k].style.background=k===selChart?'#1e3a5f':'transparent'; pillEls[k].style.color=k===selChart?'#93c5fd':'#64748b'; } }); schedulePreview(); };
      pillEls[ct]=p;
      pillRow.appendChild(p);
    });
  }
  refreshChartPills();
  right.appendChild(pillRow);

  // Preview label
  var previewLbl=el('div',{text:'Preview',style:'font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.06em;'});
  right.appendChild(previewLbl);

  // Preview area — canvas for chart types, div container for heatmap/sparkline
  var previewBox=div(''); previewBox.style.cssText='flex:1;min-height:220px;background:#0f172a;border-radius:8px;border:1px solid #1e293b;position:relative;overflow:auto;';
  var previewCv=document.createElement('canvas'); previewCv.width=360; previewCv.height=210;
  previewCv.style.cssText='width:100%;display:block;border-radius:6px;';
  previewBox.appendChild(previewCv);
  var previewSpinner=el('div',{text:'Loading…',style:'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;background:#0f172a;border-radius:8px;'});
  previewBox.appendChild(previewSpinner);
  right.appendChild(previewBox);

  // Data summary strip
  var summaryEl=el('div',{text:'',style:'font-size:11px;color:#64748b;min-height:16px;text-align:center;'});
  right.appendChild(summaryEl);

  // Assemble
  modal.appendChild(left);
  modal.appendChild(right);

  // ── Live preview logic ─────────────────────────────────────────────
  function schedulePreview() {
    if(previewTimer) clearTimeout(previewTimer);
    previewTimer=setTimeout(loadPreview, 380);
  }

  async function loadPreview() {
    previewSpinner.style.display='flex';
    summaryEl.textContent='';
    try {
      var d=await API.reports.data(selMetric, {time_range:selRange, group_by:selGroup||undefined});
      previewData=d;
      renderPreview(d);
    } catch(e) {
      previewSpinner.textContent='Failed to load data';
    }
  }

  function renderPreview(d) {
    previewSpinner.style.display='none';
    var series = d?.series || [];

    // Heatmap and sparkline render DOM into the box; others use the canvas
    var usesDOM = selChart === 'heatmap' || selChart === 'sparkline';

    if (usesDOM) {
      previewCv.style.display = 'none';
      // Clear any prior DOM render except canvas and spinner
      Array.from(previewBox.children).forEach(c => { if (c !== previewCv && c !== previewSpinner) c.remove(); });
      var inner = div(''); inner.style.cssText = 'padding:10px;min-height:190px;';
      previewBox.appendChild(inner);

      if (!series.length) {
        inner.appendChild(el('div',{text:'No data for this time range',style:'color:#334155;font-size:13px;text-align:center;padding-top:80px;'}));
      } else if (selChart === 'heatmap') {
        _rptHeatmap(inner, series, d?.keys||['SEV-1','SEV-2','SEV-3','SEV-4','SEV-5']);
      } else {
        _rptSparkGrid(inner, series);
      }
    } else {
      previewCv.style.display = 'block';
      var ctx = previewCv.getContext('2d');
      ctx.clearRect(0, 0, previewCv.width, previewCv.height);

      if (!series.length && selChart !== 'gauge') {
        ctx.fillStyle='#334155'; ctx.font='13px system-ui'; ctx.textAlign='center';
        ctx.fillText('No data for this time range', previewCv.width/2, previewCv.height/2);
        summaryEl.textContent = 'Try a longer time range or verify data exists.';
        return;
      }

      switch (selChart) {
        case 'line':  _rptLineChart(previewCv, series, {stacked: d?.stacked, keys: d?.keys, colors: ['#4ac8e8','#f87171','#fbbf24','#34d399']}); break;
        case 'bar':   _rptBarChart(previewCv, series, {keys: d?.keys||['value'], unit: d?.unit, colors: ['#4ac8e8','#6366f1']}); break;
        case 'donut': _rptDonutChart(previewCv, series.map(s=>({...s, value: s.value??s.total??0}))); break;
        case 'gauge': _rptGauge(previewCv, d?.compliance_rate ?? d?.fleet_score ?? 0, METRIC_META[selMetric]?.label||''); break;
        default:
          ctx.fillStyle='#334155'; ctx.font='12px system-ui'; ctx.textAlign='center';
          ctx.fillText('Preview not available', previewCv.width/2, previewCv.height/2);
      }
    }

    var pts = series.length;
    var meta = METRIC_META[selMetric];
    summaryEl.textContent = pts
      ? `${meta.label} · ${pts} data point${pts!==1?'s':''} · ${selRange==='all'?'All time':selRange} window`
      : `${meta.label} · no data`;
  }

  // Kick off initial preview
  schedulePreview();
}

// ── Views ─────────────────────────────────────────────────────────

async function viewReports() {
  var wrap=div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header',[
    el('h2',{text:'📊 Analytics Dashboards'}),
    btn('primary','+ New Dashboard',()=>_newDashboardModal(wrap)),
  ]));

  var loading=span('ops-muted','Loading…'); wrap.appendChild(loading);
  var boards=await API.reports.listDashboards().catch(()=>[]);
  loading.remove();

  if(!boards.length) {
    var empty=div('ops-empty');
    empty.appendChild(el('p',{text:'No dashboards yet. Create one to start pinning widgets.'}));
    empty.appendChild(btn('primary','+ New Dashboard',()=>_newDashboardModal(wrap)));
    wrap.appendChild(empty); return;
  }

  var grid=div(''); grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:4px 0;';
  boards.forEach(b=>{
    var card=div('ops-card'); card.style.cursor='pointer';
    var hdr=div('ops-card-header');
    hdr.appendChild(el('h3',{text:b.title,style:'font-size:14px;margin:0;color:#e2e8f0;'}));
    hdr.appendChild(span('ops-badge '+(b.visibility==='shared'?'badge-teal':'badge-gray'), b.visibility==='shared'?'Shared':'Personal'));
    card.appendChild(hdr);
    var body=div(''); body.style.padding='12px 16px';
    if(b.description) body.appendChild(el('p',{text:b.description,style:'color:#64748b;font-size:12px;margin:0 0 8px;'}));
    var wc=b.widgets?.length??0;
    body.appendChild(el('span',{text:(b.widgets?.length??'…')+' widget'+(wc!==1?'s':''),style:'color:#475569;font-size:11px;'}));
    card.appendChild(body);
    card.onclick=()=>navigate('report-detail',b.id);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
}

function _newDashboardModal(wrap) {
  var overlay=div('ops-modal-overlay');
  var modal=div('ops-modal'); modal.style.maxWidth='400px';
  overlay.appendChild(modal); document.body.appendChild(overlay);
  overlay.onclick=e=>{ if(e.target===overlay) overlay.remove(); };

  modal.appendChild(el('h3',{text:'New Dashboard',style:'margin:0 0 16px;color:#e2e8f0;font-size:15px;'}));

  var titleInp=inp('e.g. Weekly Leadership Brief','');
  titleInp.style.cssText='width:100%;background:#0f172a;border:1px solid #2e3650;border-radius:6px;padding:7px 10px;color:#e2e8f0;font-size:13px;box-sizing:border-box;margin-bottom:10px;';

  var visSel=el('select'); visSel.style.cssText=titleInp.style.cssText+'margin-bottom:0;';
  [['personal','Personal (only me)'],['shared','Shared (all users)']].forEach(([v,l])=>{ var o=el('option',{text:l}); o.value=v; visSel.appendChild(o); });

  modal.appendChild(el('label',{text:'Title',style:'display:block;font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px;font-weight:700;'}));
  modal.appendChild(titleInp);
  modal.appendChild(el('label',{text:'Visibility',style:'display:block;font-size:11px;color:#64748b;text-transform:uppercase;margin:10px 0 4px;font-weight:700;'}));
  modal.appendChild(visSel);

  var errEl=el('p',{text:'',style:'color:#f87171;font-size:12px;margin:8px 0 0;min-height:16px;'});
  modal.appendChild(errEl);

  var actRow=div(''); actRow.style.cssText='display:flex;gap:8px;margin-top:16px;';
  var saveB=btn('primary ops-btn-sm','Create',async ()=>{
    var t=titleInp.value.trim();
    if(!t){ errEl.textContent='Title required.'; return; }
    saveB.disabled=true; saveB.textContent='Creating…';
    try {
      var b=await API.reports.createDashboard({title:t,visibility:visSel.value});
      overlay.remove();
      navigate('report-detail', b.id);
    } catch(e){ errEl.textContent=e.message; saveB.disabled=false; saveB.textContent='Create'; }
  });
  actRow.appendChild(saveB); actRow.appendChild(btn('ops-btn-sm','Cancel',()=>overlay.remove()));
  modal.appendChild(actRow);
}

// ── PDF export helpers ────────────────────────────────────────────────────

var _PDF_CSS = `
  @page{size:letter portrait;margin:.7in .75in .85in .75in}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#0f172a;background:#fff;margin:0}
  h1{font-size:16pt;font-weight:900;margin:0 0 2px}
  h2{font-size:12pt;font-weight:700;margin:0 0 6px;color:#1e3a5f;border-bottom:1.5px solid #1e3a5f;padding-bottom:4px}
  h3{font-size:10pt;font-weight:700;margin:0 0 6px;color:#334155}
  .hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #0f172a}
  .hdr-meta{font-size:8pt;color:#64748b;text-align:right;line-height:1.6}
  .score-big{font-size:48pt;font-weight:900;line-height:1}
  .tag{display:inline-block;padding:1px 7px;border-radius:3px;font-size:7.5pt;font-weight:700;letter-spacing:.5px}
  .tag-red{background:#fee2e2;color:#b91c1c}
  .tag-orange{background:#ffedd5;color:#c2410c}
  .tag-yellow{background:#fef9c3;color:#854d0e}
  .tag-green{background:#dcfce7;color:#15803d}
  .tag-blue{background:#dbeafe;color:#1d4ed8}
  .tag-gray{background:#f1f5f9;color:#475569}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  th{background:#f1f5f9;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#475569;padding:5px 8px;text-align:left;border-bottom:1.5px solid #cbd5e1}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:8.5pt;vertical-align:top}
  tr:nth-child(even) td{background:#f8fafc}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
  .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;text-align:center}
  .kpi-val{font-size:22pt;font-weight:900;line-height:1}
  .kpi-lbl{font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
  .widget-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  .widget-box{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;break-inside:avoid}
  .widget-title{font-size:9pt;font-weight:700;color:#1e3a5f;margin-bottom:6px}
  .widget-meta{font-size:7.5pt;color:#94a3b8;margin-bottom:8px}
  .section{margin-bottom:16px;break-inside:avoid}
  .action-row{display:flex;gap:10px;padding:7px 10px;border-left:3px solid #cbd5e1;margin-bottom:4px;background:#f8fafc}
  .ftr{position:fixed;bottom:0;left:0;right:0;font-size:7pt;color:#94a3b8;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding:4px 0;background:#fff}
  img{max-width:100%;height:auto;display:block}
`;

function _pdfOpen(titleText, metaLines, bodyHtml) {
  var w = window.open('', '_blank');
  var now = new Date().toLocaleString();
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+titleText+'</title><style>'+_PDF_CSS+'</style></head><body>'
    +'<div class="hdr"><div><h1>'+titleText+'</h1>'+(metaLines||[]).map(function(m){ return '<div style="font-size:8.5pt;color:#334155;">'+m+'</div>'; }).join('')+'</div>'
    +'<div class="hdr-meta">Maintain Ops Suite<br>Exported: '+now+'<br>CONFIDENTIAL — INTERNAL USE</div></div>'
    +bodyHtml
    +'<div class="ftr"><span>Maintain Ops Suite — Auto-generated leadership brief</span><span>Exported '+now+'</span></div>'
    +'</body></html>');
  w.document.close();
  setTimeout(function(){ w.print(); }, 450);
}

function printReportDashboard(board, widgetList, wGrid) {
  var sections = '';
  var widgetHtmls = widgetList.map(function(w) {
    var meta = METRIC_META[w.metric]||{};
    var title = w.title || meta.label || w.metric;
    var chartLbl = (CHART_LABELS[w.chart_type]||w.chart_type) + (w.time_range?' · '+w.time_range:'');
    var bodyEl = wGrid ? wGrid.querySelector('[data-wbody="'+w.id+'"]') : null;
    var inner = '';
    if (bodyEl) {
      var cvs = bodyEl.querySelector('canvas');
      if (cvs) {
        try { inner = '<img src="'+cvs.toDataURL('image/png')+'">'; } catch(e) { inner = '<p style="color:#94a3b8;font-size:8pt;">Chart unavailable</p>'; }
      } else {
        // DOM-rendered (heatmap, sparkline) — copy text content as table fallback
        var tds = bodyEl.querySelectorAll('td,th');
        if (tds.length) {
          inner = '<div style="font-size:8pt;color:#334155;">';
          bodyEl.querySelectorAll('tr').forEach(function(tr){
            var cells = Array.from(tr.querySelectorAll('td,th')).map(function(c){ return c.textContent.trim(); });
            inner += cells.join(' | ')+'<br>';
          });
          inner += '</div>';
        } else {
          inner = '<div style="font-size:8pt;color:#334155;white-space:pre-wrap;">'+bodyEl.textContent.trim()+'</div>';
        }
      }
    }
    return '<div class="widget-box"><div class="widget-title">'+(meta.icon||'')+'&nbsp;'+title+'</div>'
          +'<div class="widget-meta">'+chartLbl+'</div>'+inner+'</div>';
  });
  // Pair into 2-col rows
  for (var i = 0; i < widgetHtmls.length; i += 2) {
    sections += '<div class="widget-grid">'+widgetHtmls[i]+(widgetHtmls[i+1]||'<div></div>')+'</div>';
  }
  if (!sections) sections = '<p style="color:#64748b;">No widgets on this dashboard.</p>';
  _pdfOpen(board.title+' — Analytics Dashboard', ['Dashboard export • '+widgetList.length+' widget'+(widgetList.length===1?'':'s')], sections);
}

function printCyberReadiness(data) {
  var gradeColor = {A:'#15803d',B:'#1d4ed8',C:'#854d0e',D:'#c2410c',F:'#b91c1c'}[data.grade]||'#334155';
  var body = '<div style="display:flex;align-items:center;gap:28px;margin-bottom:18px;border:1.5px solid #e2e8f0;border-radius:8px;padding:16px 20px;">'
    +'<div style="text-align:center;min-width:90px;"><div class="score-big" style="color:'+gradeColor+'">'+data.grade+'</div>'
    +'<div style="font-size:8pt;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Cyber Grade</div>'
    +'<div style="font-size:20pt;font-weight:700;color:'+gradeColor+';">'+(data.score||0)+'%</div></div>'
    +'<div class="kpi-grid" style="flex:1;grid-template-columns:repeat(3,1fr);margin:0;">'
    +'<div class="kpi"><div class="kpi-val" style="color:#0369a1;">'+(data.patch_score||0)+'%</div><div class="kpi-lbl">Patch Compliance</div></div>'
    +'<div class="kpi"><div class="kpi-val" style="color:#15803d;">'+(data.vuln_score||0)+'%</div><div class="kpi-lbl">Vuln Score</div></div>'
    +'<div class="kpi"><div class="kpi-val" style="color:#6d28d9;">'+(data.sw_score||0)+'%</div><div class="kpi-lbl">SW Compliance</div></div>'
    +'</div></div>';

  // Node patch table
  var nodes = data.patch_detail?.nodes||[];
  if (nodes.length) {
    body += '<h2>Node Patch Status</h2><table><thead><tr><th>Node</th><th>Patch State</th><th>OS Version</th><th>Last Seen</th></tr></thead><tbody>';
    nodes.forEach(function(n){
      var cls = n.patch_state==='current'?'tag-green':n.patch_state==='pending'?'tag-yellow':'tag-gray';
      body += '<tr><td>'+n.hostname+'</td>'
        +'<td><span class="tag '+cls+'">'+(n.patch_state||'Unknown')+'</span></td>'
        +'<td>'+(n.os_version||'—')+'</td>'
        +'<td>'+(n.last_seen?n.last_seen.slice(0,16).replace('T',' '):'—')+'</td></tr>';
    });
    body += '</tbody></table>';
  }

  // CVE exposure table
  var vulnSeries = data.vuln_detail?.series||[];
  if (vulnSeries.length) {
    body += '<h2>Vulnerability Exposure by Node</h2><table><thead><tr><th>Node</th><th>Score</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th></tr></thead><tbody>';
    vulnSeries.forEach(function(n){
      var sc = n.cyber_score||0;
      var scTag = sc>=75?'tag-green':sc>=50?'tag-blue':sc>=25?'tag-yellow':'tag-red';
      body += '<tr><td>'+n.hostname+'</td>'
        +'<td><span class="tag '+scTag+'">'+sc+'</span></td>'
        +'<td style="color:'+(n.counts?.CRITICAL>0?'#b91c1c':'#475569')+';font-weight:'+(n.counts?.CRITICAL>0?'700':'400')+'">'+(n.counts?.CRITICAL||0)+'</td>'
        +'<td style="color:'+(n.counts?.HIGH>0?'#c2410c':'#475569')+';font-weight:'+(n.counts?.HIGH>0?'700':'400')+'">'+(n.counts?.HIGH||0)+'</td>'
        +'<td>'+(n.counts?.MEDIUM||0)+'</td><td>'+(n.counts?.LOW||0)+'</td></tr>';
    });
    body += '</tbody></table>';
  }

  _pdfOpen('🛡 Cyber Readiness Report', ['Composite Score: '+data.score+'% (Grade '+data.grade+')'], body);
}

function printHealthReport(r, platformName) {
  var scoreColor = r.health_score>=80?'#15803d':r.health_score>=60?'#854d0e':r.health_score>=40?'#c2410c':'#b91c1c';
  var scoreLabel = r.health_score>=80?'READY':r.health_score>=60?'MARGINAL':r.health_score>=40?'DEGRADED':'NOT READY';
  var s = r.summary||{};

  var body = '<div style="display:flex;align-items:center;gap:28px;margin-bottom:18px;border:1.5px solid #e2e8f0;border-radius:8px;padding:16px 20px;">'
    +'<div style="text-align:center;min-width:100px;">'
    +'<div class="score-big" style="color:'+scoreColor+'">'+r.health_score+'</div>'
    +'<div style="font-size:9pt;font-weight:700;color:'+scoreColor+';letter-spacing:2px;margin-top:2px;">'+scoreLabel+'</div>'
    +'<div style="font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Health Score</div></div>'
    +'<div class="kpi-grid" style="flex:1;">'
    +'<div class="kpi"><div class="kpi-val">'+(s.total_assets||0)+'</div><div class="kpi-lbl">Assets</div></div>'
    +'<div class="kpi"><div class="kpi-val" style="color:'+(s.open_deficiencies>0?'#b91c1c':'#15803d')+'">'+(s.open_deficiencies||0)+'</div><div class="kpi-lbl">Open Deficiencies</div></div>'
    +'<div class="kpi"><div class="kpi-val" style="color:'+(s.overdue_pms>0?'#c2410c':'#15803d')+'">'+(s.overdue_pms||0)+'</div><div class="kpi-lbl">Overdue PMs</div></div>'
    +'<div class="kpi"><div class="kpi-val" style="color:'+(s.critical_at_risk>0?'#b91c1c':'#15803d')+'">'+(s.critical_at_risk||0)+'</div><div class="kpi-lbl">Critical at Risk</div></div>'
    +'</div></div>';

  // Priority actions
  if (r.priority_actions && r.priority_actions.length) {
    body += '<h2>Priority Actions</h2>';
    var lcColors = {critical:'#b91c1c',high:'#c2410c',medium:'#854d0e',ok:'#15803d',low:'#475569'};
    var lcTags   = {critical:'tag-red',high:'tag-orange',medium:'tag-yellow',ok:'tag-green',low:'tag-gray'};
    r.priority_actions.forEach(function(a){
      var c = lcColors[a.level]||'#334155';
      body += '<div class="action-row" style="border-left-color:'+c+';">'
        +'<div style="font-size:14pt;font-weight:900;color:'+c+';min-width:22px;">'+a.priority+'</div>'
        +'<div><div style="font-weight:700;font-size:9pt;">'+a.title+'&nbsp;<span class="tag '+(lcTags[a.level]||'tag-gray')+'">'+a.level.toUpperCase()+'</span></div>'
        +(a.detail?'<div style="font-size:8pt;color:#334155;margin-top:2px;">'+a.detail+'</div>':'')
        +(a.action?'<div style="font-size:8pt;color:#1d4ed8;margin-top:1px;font-style:italic;">→ '+a.action+'</div>':'')
        +'</div></div>';
    });
  }

  // Asset summary table
  if (r.assets && r.assets.length) {
    body += '<h2>Asset Summary</h2><table><thead><tr><th>Asset</th><th>Serial</th><th>Status</th><th>Readiness</th><th>Overdue PMs</th><th>Open Defs</th></tr></thead><tbody>';
    r.assets.slice(0,60).forEach(function(a){
      var rdTag = (a.readiness_pct>=80)?'tag-green':(a.readiness_pct>=60)?'tag-yellow':'tag-red';
      body += '<tr><td>'+a.name+'</td><td style="font-size:7.5pt;color:#64748b;">'+(a.serial_number||'—')+'</td>'
        +'<td>'+(a.status||'—')+'</td>'
        +'<td><span class="tag '+rdTag+'">'+(a.readiness_pct!=null?a.readiness_pct+'%':'—')+'</span></td>'
        +'<td style="color:'+(a.overdue_pm_count>0?'#c2410c':'#475569')+';font-weight:'+(a.overdue_pm_count>0?'700':'400')+'">'+(a.overdue_pm_count||0)+'</td>'
        +'<td style="color:'+(a.open_def_count>0?'#b91c1c':'#475569')+';font-weight:'+(a.open_def_count>0?'700':'400')+'">'+(a.open_def_count||0)+'</td></tr>';
    });
    if (r.assets.length>60) body += '<tr><td colspan="6" style="color:#94a3b8;font-style:italic;font-size:8pt;">… and '+(r.assets.length-60)+' more assets</td></tr>';
    body += '</tbody></table>';
  }

  _pdfOpen('🩺 Readiness Report'+(platformName&&platformName!=='All Platforms'?' — '+platformName:''),
    ['Generated: '+r.generated_at.slice(0,16), 'Platform: '+(platformName||'All Platforms')], body);
}

async function viewReportDetail(id) {
  setContent(el('div',{cls:'ops-loading',text:'Loading dashboard…'}));
  var board=await API.reports.getDashboard(id).catch(()=>null);
  if(!board){ setContent(el('div',{cls:'ops-empty',text:'Dashboard not found.'})); return; }

  var colsKey   = 'rpt_cols_'+id;
  var editKey   = 'rpt_edit_'+id;
  var gridCols  = parseInt(localStorage.getItem(colsKey)||'3',10)||3;
  var editMode  = localStorage.getItem(editKey)==='1';
  var widgetList= (board.widgets||[]).slice().sort(function(a,b){ return (a.pos_y-b.pos_y)||(a.pos_x-b.pos_x); });
  var selectedW = null; // widget selected in edit mode (shows bottom field bar)
  var dragSrcIdx= null;
  var dragType  = null; // 'grid' | 'palette'

  // ── Page shell ────────────────────────────────────────────────────
  var wrap=div(''); wrap.style.cssText='display:flex;flex-direction:column;height:100%;min-height:0;';
  setContent(wrap);

  // ── Header ────────────────────────────────────────────────────────
  var hdr=div('ops-page-header'); hdr.style.flexShrink='0';
  hdr.appendChild(el('h2',{text:'📊 '+board.title,style:'margin:0;'}));
  var hdrRight=div(''); hdrRight.style.cssText='display:flex;gap:6px;align-items:center;flex-wrap:wrap;';

  // Edit mode toggle
  var editToggle=el('button');
  function styleEditToggle(){
    editToggle.textContent=editMode?'✓ Editing':'Edit Dashboard';
    editToggle.style.cssText='padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:all .15s;'
      +(editMode?'background:#1e3a5f;border-color:#3b82f6;color:#93c5fd;':'background:transparent;border-color:#2e3650;color:#64748b;');
  }
  styleEditToggle();
  editToggle.onclick=async function(){
    var wasEditing = editMode;
    editMode=!editMode;
    localStorage.setItem(editKey, editMode?'1':'0');
    selectedW=null;
    styleEditToggle();
    // Auto-save widget positions when leaving edit mode
    if(wasEditing && widgetList.length) {
      await Promise.all(widgetList.map(function(w,i){
        return API.reports.updateWidget(id, w.id, {
          pos_y: w.pos_y ?? i,
          pos_x: w.pos_x ?? 0,
          width: w.width ?? 1,
          height: w.height ?? 1,
          metric: w.metric,
          chart_type: w.chart_type,
          time_range: w.time_range
        }).catch(function(){});
      }));
    }
    applyLayout();
  };
  hdrRight.appendChild(editToggle);

  // Column selector (always visible)
  var colBar=div(''); colBar.style.cssText='display:flex;gap:2px;border:1px solid #1e293b;border-radius:6px;padding:3px;background:#0f172a;';
  [1,2,3,4].forEach(function(n){
    var p=el('button',{text:n+'col'});
    p.title=n+' column'+(n>1?'s':'');
    function styleCP(){
      p.style.cssText='padding:4px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;border:none;'
        +(gridCols===n?'background:#1e3a5f;color:#93c5fd;':'background:transparent;color:#475569;');
    }
    styleCP();
    p.onclick=function(){
      gridCols=n; localStorage.setItem(colsKey,n);
      colBar.querySelectorAll('button').forEach(function(b){ b.style.background='transparent'; b.style.color='#475569'; });
      p.style.background='#1e3a5f'; p.style.color='#93c5fd';
      wGrid.style.gridTemplateColumns='repeat('+gridCols+',1fr)';
      widgetList.forEach(function(w){ if((w.width||1)>gridCols){ w.width=gridCols; API.reports.updateWidget(id,w.id,{width:gridCols,metric:w.metric,chart_type:w.chart_type,time_range:w.time_range}); }});
      renderGrid();
    };
    colBar.appendChild(p);
  });
  hdrRight.appendChild(colBar);

  // Global scope filter — Platform then Shop (shop list is filtered to selected platform)
  var scopeWrap=div(''); scopeWrap.style.cssText='display:flex;gap:4px;align-items:center;flex-wrap:wrap;';
  scopeWrap.appendChild(el('span',{text:'Filter:',style:'font-size:10px;color:#475569;font-weight:700;flex-shrink:0;'}));

  var selStyle='background:#0f172a;border:1px solid #2e3650;border-radius:5px;padding:4px 8px;color:#e2e8f0;font-size:11px;max-width:150px;';

  // ── Platform selector ─────────────────────────────────────────
  var platformSel=document.createElement('select'); platformSel.style.cssText=selStyle;
  var allPlatOpt=document.createElement('option'); allPlatOpt.value=''; allPlatOpt.textContent='All Platforms'; platformSel.appendChild(allPlatOpt);

  // ── Shop selector ─────────────────────────────────────────────
  var shopSel=document.createElement('select'); shopSel.style.cssText=selStyle;

  // All shops cache — keyed by id for platform filtering
  var _allShops=[];

  function repopulateShops(platformId) {
    shopSel.innerHTML='';
    var allOpt=document.createElement('option'); allOpt.value=''; allOpt.textContent='All Shops'; shopSel.appendChild(allOpt);
    var visible = platformId ? _allShops.filter(function(s){ return s.platform_id===platformId||s.platformId===platformId; }) : _allShops;
    visible.forEach(function(s){ var o=document.createElement('option'); o.value=s.id; o.textContent=s.name; shopSel.appendChild(o); });
    // Disable shop dropdown when no platform is selected and there are many shops (still usable, just UX hint)
    shopSel.disabled = false;
  }

  // Fetch both lists in parallel, then wire up
  Promise.all([
    API.platforms.list().catch(function(){ return []; }),
    API.shops.list().catch(function(){ return []; })
  ]).then(function(results){
    var platforms=results[0], shops=results[1];
    _allShops = shops;
    platforms.forEach(function(p){ var o=document.createElement('option'); o.value=p.id; o.textContent=p.name; platformSel.appendChild(o); });
    repopulateShops(null); // start with all shops visible
  });

  platformSel.onchange=function(){
    var pid = platformSel.value ? parseInt(platformSel.value,10) : null;
    scopePlatformId = pid;
    scopeShopId = null;
    repopulateShops(pid);  // filter shops to this platform
    renderGrid();
  };

  shopSel.onchange=function(){
    scopeShopId = shopSel.value ? parseInt(shopSel.value,10) : null;
    // Keep platform selection as-is — shop scopes within it
    renderGrid();
  };

  scopeWrap.appendChild(platformSel);
  scopeWrap.appendChild(el('span',{text:'›',style:'color:#334155;font-size:12px;flex-shrink:0;'}));
  scopeWrap.appendChild(shopSel);
  hdrRight.appendChild(scopeWrap);

  hdrRight.appendChild(btn('ghost ops-btn-sm','🖨 Export PDF',function(){ printReportDashboard(board, widgetList, wGrid); }));
  hdrRight.appendChild(btn('ghost ops-btn-sm','← Back',function(){ navigate('reports'); }));
  hdrRight.appendChild(btn('ops-btn-sm ops-btn-danger','Delete',async function(){
    if(!confirm('Delete "'+board.title+'" and all its widgets?')) return;
    await API.reports.destroyDashboard(id); navigate('reports');
  }));
  hdr.appendChild(hdrRight);
  wrap.appendChild(hdr);

  // ── Body row (left panel + grid) ──────────────────────────────────
  var bodyRow=div(''); bodyRow.style.cssText='display:flex;flex:1;min-height:0;gap:0;overflow:hidden;';
  wrap.appendChild(bodyRow);

  // ── Left visuals panel ────────────────────────────────────────────
  var leftPanel=div('');
  leftPanel.style.cssText='width:210px;flex-shrink:0;background:#080d1a;border-right:1px solid #1e293b;overflow-y:auto;padding:10px;display:none;';

  // Chart types section
  leftPanel.appendChild(el('div',{text:'Chart Types',style:'font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#475569;margin:6px 0 8px;'}));
  var ctGrid=div(''); ctGrid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;';
  Object.entries(CHART_ICONS).forEach(function(entry){
    var ct=entry[0]; var icon=entry[1];
    var c=div(''); c.style.cssText='padding:10px 6px;border:1px solid #1e293b;border-radius:6px;text-align:center;cursor:grab;background:#0f172a;transition:border-color .15s;';
    c.appendChild(el('div',{text:icon,style:'font-size:20px;line-height:1;margin-bottom:4px;'}));
    c.appendChild(el('div',{text:CHART_LABELS[ct],style:'font-size:10px;color:#64748b;font-weight:600;'}));
    c.draggable=true;
    c.addEventListener('mouseenter',function(){ c.style.borderColor='#3b82f6'; });
    c.addEventListener('mouseleave',function(){ c.style.borderColor='#1e293b'; });
    c.addEventListener('dragstart',function(e){
      dragType='palette';
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('ops-palette', JSON.stringify({chart_type:ct, metric:null}));
    });
    ctGrid.appendChild(c);
  });
  leftPanel.appendChild(ctGrid);

  // Metric list section
  leftPanel.appendChild(el('div',{text:'Data Sources',style:'font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:#475569;margin:6px 0 8px;'}));
  Object.entries(METRIC_META).forEach(function(entry){
    var mk=entry[0]; var mm=entry[1];
    var c=div(''); c.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #1e293b;border-radius:6px;cursor:grab;background:#0f172a;margin-bottom:6px;transition:border-color .15s;';
    c.appendChild(el('span',{text:mm.icon,style:'font-size:16px;flex-shrink:0;'}));
    var txt=div('');
    txt.appendChild(el('div',{text:mm.label,style:'font-size:11px;color:#cbd5e1;font-weight:600;line-height:1.2;'}));
    txt.appendChild(el('div',{text:mm.desc,style:'font-size:9px;color:#475569;line-height:1.3;margin-top:2px;'}));
    c.appendChild(txt);
    c.draggable=true;
    c.addEventListener('mouseenter',function(){ c.style.borderColor='#3b82f6'; });
    c.addEventListener('mouseleave',function(){ c.style.borderColor='#1e293b'; });
    c.addEventListener('dragstart',function(e){
      dragType='palette';
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('ops-palette', JSON.stringify({chart_type:mm.defaultChart, metric:mk}));
    });
    leftPanel.appendChild(c);
  });
  bodyRow.appendChild(leftPanel);

  // ── Canvas (grid + drop zone) ─────────────────────────────────────
  var canvas=div(''); canvas.style.cssText='flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;';
  bodyRow.appendChild(canvas);

  var wGrid=div('');
  wGrid.style.cssText='display:grid;grid-template-columns:repeat('+gridCols+',1fr);gap:12px;align-items:start;';
  canvas.appendChild(wGrid);

  // Drop zone (palette → canvas)
  var dropZone=div('');
  dropZone.style.cssText='border:2px dashed #1e293b;border-radius:10px;padding:24px;text-align:center;color:#334155;font-size:13px;display:none;cursor:default;transition:border-color .15s,color .15s;';
  dropZone.textContent='⊕  Drop a metric or chart type here to add a widget';
  dropZone.addEventListener('dragover',function(e){
    e.preventDefault(); e.dataTransfer.dropEffect='copy';
    dropZone.style.borderColor='#3b82f6'; dropZone.style.color='#93c5fd';
  });
  dropZone.addEventListener('dragleave',function(){ dropZone.style.borderColor='#1e293b'; dropZone.style.color='#334155'; });
  dropZone.addEventListener('drop',async function(e){
    e.preventDefault(); dropZone.style.borderColor='#1e293b'; dropZone.style.color='#334155';
    var raw=e.dataTransfer.getData('ops-palette'); if(!raw) return;
    var pal=JSON.parse(raw);
    var metric=pal.metric||Object.keys(METRIC_META)[0];
    var meta=METRIC_META[metric];
    var payload={title:meta.label, metric:metric, chart_type:pal.chart_type||meta.defaultChart, time_range:'30d', group_by:null, pos_y:widgetList.length, pos_x:0, width:1, height:1};
    var created=await API.reports.createWidget(id, payload).catch(function(e){ console.error(e); return null; });
    if(!created) return;
    widgetList.push(created);
    renderGrid();
  });
  canvas.appendChild(dropZone);

  // ── Global scope filter state ─────────────────────────────────────
  var scopePlatformId = null; // null = All
  var scopeShopId     = null;

  // ── Field registry (lazy-loaded, cached) ─────────────────────────
  var _fieldReg = null;
  async function getFieldRegistry() {
    if (!_fieldReg) _fieldReg = await API.reports.fields().catch(function(){ return {}; });
    return _fieldReg;
  }

  // ── Searchable field picker component ────────────────────────────
  // fields: [{key, label, type, source, source_label, computed}]
  // currentKey: string — active key (compared with `source+'.'+key`)
  // onSelect(field) called on click
  function makeFieldPicker(fields, currentKey, onSelect) {
    var wrap = div(''); wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:210px;flex:1;';

    var srch = document.createElement('input');
    srch.type = 'text'; srch.placeholder = 'Search all fields…';
    srch.style.cssText = 'background:#0f172a;border:1px solid #2e3650;border-radius:5px;padding:5px 9px;color:#e2e8f0;font-size:11px;width:100%;box-sizing:border-box;';

    var list = div(''); list.style.cssText = 'max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:1px;';

    // Source badge color map
    var srcColors = {deficiencies:'#dc2626',assets:'#2563eb',procedures:'#7c3aed',fleet:'#0891b2',cves:'#d97706',readiness:'#16a34a',supply:'#db2777',modernizations:'#9333ea',budget:'#059669',software:'#6366f1'};

    function renderList(q) {
      list.innerHTML = '';
      var lq = (q||'').toLowerCase();
      var filtered = fields.filter(function(f){
        return !lq || f.label.toLowerCase().includes(lq) || (f.source_label||'').toLowerCase().includes(lq) || f.key.toLowerCase().includes(lq);
      });
      var lastSrc = null;
      filtered.forEach(function(f){
        var fkey = (f.source||'')+'.'+f.key;
        var active = fkey === currentKey;
        // Source group header
        if(f.source !== lastSrc) {
          var gh = div(''); gh.style.cssText = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#475569;padding:6px 8px 2px;';
          gh.textContent = f.source_label || f.source || '';
          list.appendChild(gh);
          lastSrc = f.source;
        }
        var incompatible = f.compatible === false;
        var item = div('');
        item.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:5px;transition:background .1s;'
          +(active?'background:#1e3a5f;':'')
          +(incompatible?'opacity:.4;':'cursor:pointer;');
        var typeIcon = f.type==='measure'?'#':f.type==='date'?'≋':'≡';
        item.appendChild(el('span',{text:typeIcon,style:'font-size:10px;color:#475569;width:12px;text-align:center;flex-shrink:0;font-weight:700;'}));
        item.appendChild(el('span',{text:f.label,style:'font-size:11px;color:'+(active?'#93c5fd':(incompatible?'#334155':'#94a3b8'))+';flex:1;line-height:1.2;'}));
        if(f.computed) item.appendChild(el('span',{text:'fx',style:'font-size:9px;color:#64748b;background:#1e293b;padding:1px 4px;border-radius:3px;flex-shrink:0;'}));
        var srcC = srcColors[f.source]||'#475569';
        item.appendChild(el('span',{text:f.source_label||f.source,style:'font-size:9px;color:'+srcC+';background:'+srcC+'1a;padding:1px 5px;border-radius:3px;flex-shrink:0;max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}));
        if(!incompatible){
          item.addEventListener('mouseenter',function(){ if(!active) item.style.background='#1e293b'; });
          item.addEventListener('mouseleave',function(){ if(!active) item.style.background='transparent'; });
          item.onclick = function(){ onSelect(f); };
        } else {
          item.title = 'No join path between '+f.source+' and the selected Y source';
        }
        list.appendChild(item);
      });
      if(!list.children.length) list.appendChild(el('div',{text:'No fields match',style:'font-size:11px;color:#475569;padding:8px;text-align:center;'}));
    }

    srch.oninput = function(){ renderList(srch.value); };
    renderList('');
    wrap.appendChild(srch);
    wrap.appendChild(list);
    return wrap;
  }

  // Build flat field arrays from registry, annotating each field with source info.
  // ySource: when set, annotate cross-source fields with compatibility info.
  function buildFlatFields(reg, typeFilter, ySource) {
    // Valid cross-source join paths — pipe separator, must match PHP $crossJoins keys exactly
    var crossJoins = {
      'assets|deficiencies':true,
      'assets|procedures':true,
      'assets|readiness':true,
      'fleet|cves':true
    };
    var all = [];
    Object.entries(reg).forEach(function(e){
      var src=e[0]; var info=e[1];
      info.fields.forEach(function(f){
        if(!typeFilter || typeFilter.includes(f.type)) {
          var compatible = true;
          var crossWarn  = null;
          if(ySource && src !== ySource) {
            // Cross-source: check if join path exists
            var joinKey = src+'|'+ySource;
            compatible = !!crossJoins[joinKey];
            if(!compatible) crossWarn = 'No join path';
          }
          all.push(Object.assign({},f,{source:src, source_label:info.label, compatible:compatible, crossWarn:crossWarn}));
        }
      });
    });
    return all;
  }

  // ── Bottom field configurator ─────────────────────────────────────
  var fieldBar=div('');
  fieldBar.style.cssText='flex-shrink:0;background:#080d1a;border-top:1px solid #1e293b;padding:10px 16px;display:none;';
  wrap.appendChild(fieldBar);

  async function renderFieldBar() {
    fieldBar.innerHTML='';
    if(!selectedW || !editMode){ fieldBar.style.display='none'; return; }
    fieldBar.style.display='block';

    var reg = await getFieldRegistry();
    var filters = {}; try{ filters=JSON.parse(selectedW.filters||'{}'); }catch(e){}

    // Cross-source fields: x_source.x_field and y_source.y_field stored separately
    var curXSource  = filters.x_source || '';
    var curXField   = filters.x_field  || selectedW.group_by || '';
    var curYSource  = filters.y_source || '';
    var curYField   = filters.y_field  || 'count';
    var curScatSource = filters.scatter_source || '';
    var curScatField  = filters.scatter_field  || '';

    // Build flat field lists — X picker is compatibility-checked against current Y source
    var dimFields  = buildFlatFields(reg, ['dimension','date'], curYSource || null);
    var measFields = buildFlatFields(reg, ['measure']);

    var isScatter = selectedW.chart_type === 'scatter';

    var row = div(''); row.style.cssText = 'display:flex;align-items:flex-start;gap:14px;overflow-x:auto;padding-bottom:2px;';

    // Widget label
    var wlbl = div(''); wlbl.style.cssText = 'flex-shrink:0;min-width:100px;';
    var metaLabel = METRIC_META[selectedW.metric];
    wlbl.appendChild(el('div',{text:(metaLabel?.icon||'📊')+' '+selectedW.title,style:'font-size:11px;font-weight:600;color:#cbd5e1;line-height:1.3;margin-bottom:3px;white-space:nowrap;'}));
    wlbl.appendChild(el('div',{text:'Fields',style:'font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:.06em;'}));
    row.appendChild(wlbl);

    // Helper: save widget filters and refresh
    async function saveAndRefresh() {
      selectedW.filters = JSON.stringify(filters);
      await API.reports.updateWidget(id, selectedW.id, {
        filters: filters,
        metric: selectedW.metric,
        chart_type: selectedW.chart_type,
        time_range: selectedW.time_range,
        group_by: selectedW.group_by
      });
      renderFieldBar();
      refreshWidgetBody(selectedW);
    }

    // ── X axis (Group By / Dimension) ────────────────────────────
    var xCol = div(''); xCol.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    xCol.appendChild(el('div',{text:isScatter?'Scatter Group':'X — Group By',style:'font-size:10px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;'}));
    xCol.appendChild(makeFieldPicker(dimFields, (curXSource?curXSource+'.':'')+curXField, async function(f){
      filters.x_source = f.source;
      filters.x_field  = f.key;
      filters.y_source = filters.y_source || f.source; // default y_source to same if unset
      selectedW.group_by = null; // group_by is now driven by x_field
      await saveAndRefresh();
    }));
    row.appendChild(xCol);

    // ── Y axis (Measure / Value) ──────────────────────────────────
    var yCol = div(''); yCol.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    yCol.appendChild(el('div',{text:isScatter?'Y Value (measure)':'Y — Value',style:'font-size:10px;color:#34d399;font-weight:700;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;'}));
    yCol.appendChild(makeFieldPicker(measFields, (curYSource?curYSource+'.':'')+curYField, async function(f){
      filters.y_source = f.source;
      filters.y_field  = f.key;
      await saveAndRefresh();
    }));
    row.appendChild(yCol);

    // ── Scatter: second measure for X axis ───────────────────────
    if(isScatter) {
      var sCol = div(''); sCol.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
      sCol.appendChild(el('div',{text:'X Value (measure)',style:'font-size:10px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;'}));
      sCol.appendChild(makeFieldPicker(measFields, (curScatSource?curScatSource+'.':'')+curScatField, async function(f){
        filters.scatter_source = f.source;
        filters.scatter_field  = f.key;
        await saveAndRefresh();
      }));
      row.appendChild(sCol);
    }

    // ── Time Range ───────────────────────────────────────────────
    var trCol = div(''); trCol.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex-shrink:0;';
    trCol.appendChild(el('div',{text:'Time Range',style:'font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;'}));
    var trSel = document.createElement('select');
    trSel.style.cssText = 'background:#0f172a;border:1px solid #2e3650;border-radius:5px;padding:5px 8px;color:#e2e8f0;font-size:11px;';
    [['7d','Last 7d'],['30d','Last 30d'],['90d','Last 90d'],['1y','Last year'],['all','All time']].forEach(function(o){
      var opt = document.createElement('option'); opt.value=o[0]; opt.textContent=o[1];
      if((selectedW.time_range||'30d')===o[0]) opt.selected=true;
      trSel.appendChild(opt);
    });
    trSel.onchange = async function(){
      selectedW.time_range = trSel.value;
      await API.reports.updateWidget(id, selectedW.id, {time_range:trSel.value, metric:selectedW.metric, chart_type:selectedW.chart_type});
      refreshWidgetBody(selectedW);
    };
    trCol.appendChild(trSel);
    row.appendChild(trCol);

    // Close
    var closeBtn = el('button',{text:'✕'});
    closeBtn.style.cssText = 'flex-shrink:0;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;border:1px solid #2e3650;background:transparent;color:#64748b;align-self:flex-start;margin-left:4px;';
    closeBtn.onclick = function(){ selectedW=null; renderFieldBar(); };
    row.appendChild(closeBtn);

    fieldBar.appendChild(row);
  }

  // Re-render a single widget body without full grid rebuild
  function refreshWidgetBody(w) {
    var body = wGrid.querySelector('[data-wbody="'+w.id+'"]');
    if(!body) return;
    body.innerHTML=''; body.dataset.rendered='';
    _renderWidget(body, w, {platform_id:scopePlatformId, shop_id:scopeShopId});
  }

  // ── Apply layout (called on edit mode toggle) ──────────────────────
  function applyLayout() {
    leftPanel.style.display  = editMode ? 'block'  : 'none';
    dropZone.style.display   = editMode ? 'block'  : 'none';
    renderFieldBar();
    renderGrid();
  }

  // ── Grid renderer ─────────────────────────────────────────────────
  function renderGrid() {
    wGrid.innerHTML='';
    if(!widgetList.length){
      var emptyW=div('ops-empty');
      emptyW.appendChild(el('p',{text:'No widgets yet.'}));
      if(!editMode) emptyW.appendChild(btn('primary','Edit Dashboard',function(){ editMode=true; localStorage.setItem(editKey,'1'); styleEditToggle(); applyLayout(); }));
      wGrid.appendChild(emptyW); return;
    }
    widgetList.forEach(function(w,idx){ wGrid.appendChild(buildCard(w,idx)); });
    requestAnimationFrame(function(){
      widgetList.forEach(function(w){
        var body=wGrid.querySelector('[data-wbody="'+w.id+'"]');
        if(body && !body.dataset.rendered){ body.dataset.rendered='1'; _renderWidget(body,w,{platform_id:scopePlatformId,shop_id:scopeShopId}); }
      });
    });
  }

  function buildCard(w, idx) {
    var colSpan=Math.min(w.width||1,gridCols);
    var rowSpan=Math.max(1,w.height||1);
    var isSelected=editMode && selectedW && selectedW.id===w.id;

    var card=div('ops-card');
    card.style.cssText='display:flex;flex-direction:column;grid-column:span '+colSpan+';grid-row:span '+rowSpan
      +';min-height:'+(rowSpan===2?'420':'210')+'px;transition:opacity .15s,outline .15s;box-sizing:border-box;'
      +(isSelected?'outline:2px solid #3b82f6;':'');
    card.draggable=!!editMode;
    card.dataset.idx=idx;

    // Grid drag events (reorder)
    card.addEventListener('dragstart',function(e){
      if(!editMode){ e.preventDefault(); return; }
      dragType='grid'; dragSrcIdx=idx;
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',String(idx));
      setTimeout(function(){ card.style.opacity='0.35'; },0);
    });
    card.addEventListener('dragend',function(){ card.style.opacity='1'; card.style.outline=isSelected?'2px solid #3b82f6':''; dragType=null; dragSrcIdx=null; });
    card.addEventListener('dragover',function(e){
      e.preventDefault(); e.stopPropagation();
      if(dragType==='palette'){
        e.dataTransfer.dropEffect='copy';
        card.style.outline='2px solid #34d399';
      } else if(dragType==='grid' && dragSrcIdx!==idx){
        e.dataTransfer.dropEffect='move';
        card.style.outline='2px solid #3b82f6';
      }
    });
    card.addEventListener('dragleave',function(){ card.style.outline=isSelected?'2px solid #3b82f6':''; });
    card.addEventListener('drop',async function(e){
      e.preventDefault(); e.stopPropagation();
      card.style.outline=isSelected?'2px solid #3b82f6':'';
      if(dragType==='palette'){
        // Drop chart type onto existing widget → change its chart type
        var raw=e.dataTransfer.getData('ops-palette'); if(!raw) return;
        var pal=JSON.parse(raw);
        if(pal.chart_type && METRIC_META[w.metric]?.charts.includes(pal.chart_type)){
          w.chart_type=pal.chart_type;
          await API.reports.updateWidget(id,w.id,{chart_type:pal.chart_type,metric:w.metric,time_range:w.time_range});
          renderGrid();
        } else if(pal.metric){
          // Drop a different metric onto widget → swap metric
          w.metric=pal.metric; w.chart_type=METRIC_META[pal.metric].defaultChart;
          await API.reports.updateWidget(id,w.id,{metric:pal.metric,chart_type:w.chart_type,title:METRIC_META[pal.metric].label,time_range:w.time_range});
          renderGrid();
        }
      } else if(dragType==='grid'){
        var fromIdx=parseInt(e.dataTransfer.getData('text/plain'),10);
        if(isNaN(fromIdx)||fromIdx===idx) return;
        var moved=widgetList.splice(fromIdx,1)[0];
        widgetList.splice(idx,0,moved);
        await Promise.all(widgetList.map(function(ww,i){ return API.reports.updateWidget(id,ww.id,{pos_y:i,pos_x:0,metric:ww.metric,chart_type:ww.chart_type,time_range:ww.time_range}); }));
        renderGrid();
      }
    });

    // Click to select (edit mode field config)
    card.addEventListener('click',function(e){
      if(!editMode) return;
      selectedW=w; renderFieldBar();
      wGrid.querySelectorAll('.ops-card').forEach(function(c){ c.style.outline=''; });
      card.style.outline='2px solid #3b82f6';
    });

    // ── Widget header ──────────────────────────────────────────────
    var wHdr=div('');
    wHdr.style.cssText='display:flex;align-items:center;gap:5px;padding:8px 10px 7px;border-bottom:1px solid #1e293b;flex-shrink:0;flex-wrap:wrap;';

    if(editMode){
      var grip=el('span',{text:'⠿',style:'cursor:grab;color:#334155;font-size:15px;line-height:1;flex-shrink:0;'});
      grip.title='Drag to reorder'; wHdr.appendChild(grip);
    }

    wHdr.appendChild(el('h3',{text:w.title||METRIC_META[w.metric]?.label||w.metric,style:'font-size:12px;margin:0;color:#cbd5e1;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'}));
    wHdr.appendChild(el('span',{text:(METRIC_META[w.metric]?.icon||'')+' '+(w.time_range||'30d'),style:'font-size:10px;color:#334155;flex-shrink:0;'}));

    if(editMode){
      // Col span pills
      var colPills=div(''); colPills.style.cssText='display:flex;gap:2px;flex-shrink:0;';
      for(var c=1;c<=gridCols;c++){
        (function(cols){
          var active=(w.width||1)===cols;
          var p=el('button',{text:cols});
          p.title=cols+' col'+(cols>1?'s':'');
          p.style.cssText='padding:2px 5px;border-radius:3px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid;line-height:1.4;'
            +(active?'background:#1e3a5f;border-color:#3b82f6;color:#93c5fd;':'background:transparent;border-color:#1e293b;color:#475569;');
          p.onclick=async function(e){ e.stopPropagation(); w.width=cols; await API.reports.updateWidget(id,w.id,{width:cols,metric:w.metric,chart_type:w.chart_type,time_range:w.time_range}); renderGrid(); };
          colPills.appendChild(p);
        })(c);
      }
      wHdr.appendChild(colPills);

      // Height toggle
      var hTog=el('button',{text:(w.height||1)===2?'2×':'1×'});
      hTog.style.cssText='padding:2px 5px;border-radius:3px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid #1e293b;background:transparent;color:#475569;line-height:1.4;flex-shrink:0;';
      (function(ww){ hTog.onclick=async function(e){ e.stopPropagation(); var nh=(ww.height||1)===2?1:2; ww.height=nh; await API.reports.updateWidget(id,ww.id,{height:nh,metric:ww.metric,chart_type:ww.chart_type,time_range:ww.time_range}); renderGrid(); }; })(w);
      wHdr.appendChild(hTog);

      // Delete
      var delB=el('button',{text:'✕'});
      delB.style.cssText='padding:2px 5px;border-radius:3px;font-size:11px;cursor:pointer;border:1px solid #7f1d1d;background:transparent;color:#f87171;line-height:1.4;flex-shrink:0;';
      (function(ww){ delB.onclick=async function(e){ e.stopPropagation(); if(!confirm('Remove "'+ww.title+'"?')) return; await API.reports.destroyWidget(id,ww.id); widgetList.splice(widgetList.findIndex(function(x){ return x.id===ww.id; }),1); if(selectedW&&selectedW.id===ww.id){ selectedW=null; renderFieldBar(); } renderGrid(); }; })(w);
      wHdr.appendChild(delB);
    }

    card.appendChild(wHdr);

    // Chart body
    var body=div(''); body.style.cssText='flex:1;min-height:0;overflow:hidden;'; body.dataset.wbody=w.id;
    card.appendChild(body);

    return card;
  }

  // ── Boot ──────────────────────────────────────────────────────────
  applyLayout();
}

async function viewCyberReadiness() {
  setContent(el('div',{cls:'ops-loading',text:'Computing cyber readiness…'}));
  var data=await API.reports.cyber().catch(()=>null);
  if(!data){ setContent(el('div',{cls:'ops-empty',text:'⚠ Could not load cyber readiness data.'})); return; }

  var wrap=div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header',[
    el('h2',{text:'🛡 Cyber Readiness'}),
    btn('ghost ops-btn-sm','🖨 Export PDF', function(){ printCyberReadiness(data); }),
    btn('ghost ops-btn-sm','View Nodes →',()=>navigate('fleet-nodes')),
  ]));

  // Composite score card
  var gradeColor={A:'#34d399',B:'#4ac8e8',C:'#fbbf24',D:'#f97316',F:'#f87171'}[data.grade]||'#94a3b8';
  var scoreCard=div('ops-card'); scoreCard.style.cssText='display:flex;align-items:center;gap:32px;padding:20px 24px;margin-bottom:20px;';
  var scoreLeft=div(''); scoreLeft.style.cssText='text-align:center;min-width:110px;';
  scoreLeft.appendChild(el('div',{text:data.grade,style:'font-size:56px;font-weight:900;color:'+gradeColor+';line-height:1;'}));
  scoreLeft.appendChild(el('div',{text:'Cyber Readiness',style:'font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px;'}));
  scoreCard.appendChild(scoreLeft);

  var scoreRight=div(''); scoreRight.style.flex='1';
  var gaugeCanv=el('canvas'); gaugeCanv.width=280; gaugeCanv.height=140; gaugeCanv.style.cssText='display:block;';
  scoreRight.appendChild(gaugeCanv);
  scoreCard.appendChild(scoreRight);
  wrap.appendChild(scoreCard);
  _rptGauge(gaugeCanv, data.score||0, 'Fleet Composite Score');

  // Component breakdown
  var compGrid=div(''); compGrid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;';
  [
    ['🩹 Patch Compliance', data.patch_score, '#4ac8e8', 'Nodes current on security updates'],
    ['🔍 Vuln Score',       data.vuln_score,  '#34d399', 'Weighted CVE exposure (inverted)'],
    ['💾 SW Compliance',    data.sw_score,    '#a78bfa', 'Approved software tier adherence'],
  ].forEach(([lbl,val,color,desc])=>{
    var c=div('ops-card'); c.style.padding='16px';
    c.appendChild(el('div',{text:String(val??0)+'%',style:'font-size:32px;font-weight:700;color:'+color+';line-height:1;'}));
    c.appendChild(el('div',{text:lbl,style:'font-size:12px;color:#94a3b8;margin:4px 0 2px;'}));
    c.appendChild(el('div',{text:desc,style:'font-size:10px;color:#475569;'}));
    compGrid.appendChild(c);
  });
  wrap.appendChild(compGrid);

  // Node table
  var nodeCard=div('ops-card');
  nodeCard.appendChild(div('ops-card-header',[el('h3',{text:'Node Patch Status'})]));
  var tbl=div(''); tbl.style.padding='4px 16px 12px';

  var tHdr=div(''); tHdr.style.cssText='display:grid;grid-template-columns:1fr 100px 100px 120px;gap:8px;padding:8px 0;border-bottom:1px solid #1e2540;font-size:10px;color:#475569;font-weight:700;text-transform:uppercase;';
  ['Node','Patch State','OS Version','Last Seen'].forEach(h=>{ var he=div(''); he.textContent=h; tHdr.appendChild(he); });
  tbl.appendChild(tHdr);

  var patchNodes=(data.patch_detail?.nodes||[]);
  if(!patchNodes.length){ tbl.appendChild(el('div',{cls:'ops-empty',text:'No nodes registered.'})); }
  patchNodes.forEach(n=>{
    var stateColor=n.patch_state==='current'?'#34d399':n.patch_state==='pending'?'#fbbf24':'#64748b';
    var stateLabel=n.patch_state==='current'?'✓ Current':n.patch_state==='pending'?'⚠ Pending':'? Unknown';
    var row=div(''); row.style.cssText='display:grid;grid-template-columns:1fr 100px 100px 120px;gap:8px;padding:9px 0;border-bottom:1px solid #0f172a;font-size:12px;align-items:center;cursor:pointer;';
    row.appendChild(el('span',{text:n.hostname||'—',style:'color:#e2e8f0;'}));
    row.appendChild(el('span',{text:stateLabel,style:'color:'+stateColor+';font-weight:600;'}));
    row.appendChild(el('span',{text:n.os_version||'—',style:'color:#64748b;font-size:11px;'}));
    row.appendChild(el('span',{text:n.last_seen?n.last_seen.slice(0,16).replace('T',' '):'—',style:'color:#475569;font-size:11px;'}));
    row.onclick=()=>navigate('fleet-detail',n.id);
    tbl.appendChild(row);
  });

  // CVE section
  if(data.vuln_detail?.series?.length){
    tbl.appendChild(el('h4',{text:'Vulnerability Exposure by Node',style:'color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:20px 0 8px;'}));
    var vHdr=div(''); vHdr.style.cssText='display:grid;grid-template-columns:1fr 80px 70px 70px 70px 70px;gap:8px;padding:8px 0;border-bottom:1px solid #1e2540;font-size:10px;color:#475569;font-weight:700;';
    ['Node','Score','Crit','High','Med','Low'].forEach(h=>{ var he=div(''); he.textContent=h; vHdr.appendChild(he); });
    tbl.appendChild(vHdr);
    data.vuln_detail.series.forEach(n=>{
      var sc=n.cyber_score||0;
      var scColor=sc>=75?'#34d399':sc>=50?'#4ac8e8':sc>=25?'#fbbf24':'#f87171';
      var vRow=div(''); vRow.style.cssText='display:grid;grid-template-columns:1fr 80px 70px 70px 70px 70px;gap:8px;padding:8px 0;border-bottom:1px solid #0f172a;font-size:12px;align-items:center;cursor:pointer;';
      vRow.appendChild(el('span',{text:n.hostname||'—',style:'color:#e2e8f0;'}));
      vRow.appendChild(el('span',{text:sc,style:'color:'+scColor+';font-weight:700;'}));
      ['CRITICAL','HIGH','MEDIUM','LOW'].forEach(k=>{
        var cnt=n.counts?.[k]||0;
        var cColor=k==='CRITICAL'?'#f87171':k==='HIGH'?'#f97316':k==='MEDIUM'?'#fbbf24':'#94a3b8';
        vRow.appendChild(el('span',{text:cnt||'—',style:'color:'+(cnt>0?cColor:'#475569')+';'}));
      });
      vRow.onclick=()=>navigate('fleet-detail',n.id);
      tbl.appendChild(vRow);
    });
  }

  nodeCard.appendChild(tbl);
  wrap.appendChild(nodeCard);
}

/* ── Fleet Nodes (Sprint 6A) ─────────────────────────────────── */
async function viewFleetNodes() {
  setContent(el('div',{cls:'ops-loading',text:'Loading Fleet Nodes…'}));
  var [nodes, platforms] = await Promise.all([API.altofleet.list(), API.platforms.list()]);
  var platformMap = {};
  platforms.forEach(p => { platformMap[p.id] = p; });

  var wrap = div('ops-page');
  var hdr  = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'🖥 Fleet Nodes'}));

  // Summary badges
  var online   = nodes.filter(n => n.status === 'online').length;
  var offline  = nodes.filter(n => n.status === 'offline').length;
  var degraded = nodes.filter(n => n.status === 'degraded').length;
  var sumRow   = div('');
  sumRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;';
  [[online,'online','#22c55e'],[degraded,'degraded','#f59e0b'],[offline,'offline','#ef4444'],
   [nodes.length,'total','#64748b']].forEach(([cnt,lbl,clr]) => {
    var b = el('span',{html:`<strong>${cnt}</strong> ${lbl}`});
    b.style.cssText=`background:${clr}22;color:${clr};padding:4px 12px;border-radius:20px;font-size:13px;border:1px solid ${clr}44;`;
    sumRow.appendChild(b);
  });
  hdr.appendChild(sumRow);
  wrap.appendChild(hdr);

  if (!nodes.length) {
    wrap.appendChild(el('div',{cls:'ops-empty',text:'No AltoFleet nodes registered. Install the AltoFleet agent on AltoOS machines to start monitoring.'}));
    return setContent(wrap);
  }

  // Filter bar
  var filterRow = div('');
  filterRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;';
  var filterStatus = el('select');
  filterStatus.style.cssText = 'background:#1e2540;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:4px 8px;font-size:13px;';
  [['','All Statuses'],['online','Online'],['degraded','Degraded'],['offline','Offline']].forEach(([v,l])=>{
    var o = el('option',{text:l}); o.value=v; filterStatus.appendChild(o);
  });
  filterRow.appendChild(filterStatus);
  wrap.appendChild(filterRow);

  // Node grid
  var grid = div('');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;';
  wrap.appendChild(grid);

  function renderGrid(statusFilter) {
    grid.innerHTML = '';
    var filtered = statusFilter ? nodes.filter(n => n.status === statusFilter) : nodes;
    if (!filtered.length) {
      grid.appendChild(el('div',{cls:'ops-empty',text:'No nodes match filter.'}));
      return;
    }
    filtered.forEach(node => {
      var card = div('ops-card');
      card.style.cssText = 'background:#1e2540;border:1px solid #334155;border-radius:10px;padding:16px;cursor:pointer;transition:border-color .15s;';
      card.onmouseenter = () => card.style.borderColor = '#38bdf8';
      card.onmouseleave = () => { var col={online:'#22c55e66',degraded:'#f59e0b66',offline:'#ef444466'}; card.style.borderColor = col[node.status]||'#334155'; };

      var statusColor = {online:'#22c55e',degraded:'#f59e0b',offline:'#ef4444',new:'#94a3b8'}[node.status]||'#94a3b8';
      var statusBg    = {online:'#22c55e22',degraded:'#f59e0b22',offline:'#ef444422',new:'#94a3b822'}[node.status]||'#94a3b822';
      card.style.borderColor = statusColor + '66';

      var topRow = div('');
      topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;';
      var nameCol = div('');
      nameCol.appendChild(el('div',{text:node.hostname||'Unknown',style:'color:#e2e8f0;font-weight:700;font-size:15px;'}));
      nameCol.appendChild(el('div',{text:node.ip_address||'—',style:'color:#64748b;font-size:12px;'}));
      topRow.appendChild(nameCol);
      var badge = el('span',{text:node.status.toUpperCase()});
      badge.style.cssText=`background:${statusBg};color:${statusColor};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;border:1px solid ${statusColor}44;`;
      topRow.appendChild(badge);
      card.appendChild(topRow);

      // OS / agent info
      var osLine = el('div',{text:(node.os_pretty_name||node.os_name||'—')+' · '+node.architecture});
      osLine.style.cssText='color:#94a3b8;font-size:12px;margin-bottom:8px;';
      card.appendChild(osLine);
      var agentLine = el('div',{text:'Agent v'+node.agent_version+(platformMap[node.platform_id]?' · '+platformMap[node.platform_id].name:'')});
      agentLine.style.cssText='color:#64748b;font-size:11px;margin-bottom:10px;';
      card.appendChild(agentLine);

      // Metric bars
      if (node.status !== 'new') {
        var metrics = [
          {label:'CPU',    pct:node.cpu_pct,    color: node.cpu_pct>90?'#ef4444':node.cpu_pct>70?'#f59e0b':'#22c55e'},
          {label:'MEM',    pct:node.memory_pct, color: node.memory_pct>90?'#ef4444':node.memory_pct>70?'#f59e0b':'#22c55e'},
          {label:'DISK',   pct:node.disk_pct,   color: node.disk_pct>85?'#ef4444':node.disk_pct>70?'#f59e0b':'#22c55e'},
        ];
        var mWrap = div('');
        mWrap.style.cssText='display:flex;flex-direction:column;gap:4px;margin-bottom:10px;';
        metrics.forEach(m => {
          var row = div('');
          row.style.cssText='display:grid;grid-template-columns:36px 1fr 36px;gap:6px;align-items:center;';
          row.appendChild(el('span',{text:m.label,style:'color:#64748b;font-size:11px;font-weight:600;'}));
          var track = div('');
          track.style.cssText='background:#0f172a;border-radius:4px;height:6px;overflow:hidden;';
          var fill = div('');
          fill.style.cssText=`background:${m.color};height:100%;width:${Math.min(100,m.pct||0).toFixed(1)}%;border-radius:4px;transition:width .3s;`;
          track.appendChild(fill);
          row.appendChild(track);
          row.appendChild(el('span',{text:(m.pct||0).toFixed(0)+'%',style:'color:#94a3b8;font-size:11px;text-align:right;'}));
          mWrap.appendChild(row);
        });
        card.appendChild(mWrap);

        // Uptime
        var uptimeSecs = node.uptime_secs || 0;
        var ud = Math.floor(uptimeSecs/86400), uh = Math.floor((uptimeSecs%86400)/3600);
        card.appendChild(el('div',{text:'Uptime: '+(ud?ud+'d ':'')+(uh?uh+'h ':'')+Math.floor((uptimeSecs%3600)/60)+'m',style:'color:#64748b;font-size:11px;margin-bottom:4px;'}));
      }

      // Alerts
      if (node.threshold_alerts && node.threshold_alerts.length) {
        var alertBox = div('');
        alertBox.style.cssText='background:#ef444411;border:1px solid #ef444444;border-radius:6px;padding:6px 8px;margin-top:6px;';
        node.threshold_alerts.slice(0,3).forEach(a => {
          alertBox.appendChild(el('div',{text:'⚠ '+a,style:'color:#ef4444;font-size:11px;line-height:1.4;'}));
        });
        card.appendChild(alertBox);
      }

      // Services
      if (node.services && typeof node.services === 'object' && Object.keys(node.services).length) {
        var svcRow = div('');
        svcRow.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;';
        Object.entries(node.services).forEach(([svc, state]) => {
          var ok = typeof state === 'string' && state.toLowerCase().includes('active');
          var s = el('span',{text:svc});
          s.style.cssText=`background:${ok?'#22c55e22':'#ef444422'};color:${ok?'#22c55e':'#ef4444'};padding:2px 6px;border-radius:4px;font-size:10px;border:1px solid ${ok?'#22c55e44':'#ef444444'};`;
          svcRow.appendChild(s);
        });
        card.appendChild(svcRow);
      }

      // Last seen footer
      var lastSeenStr = node.last_seen ? node.last_seen : 'Never';
      card.appendChild(el('div',{text:'Last seen: '+lastSeenStr,style:'color:#334155;font-size:11px;margin-top:8px;border-top:1px solid #1e2540;padding-top:6px;'}));

      card.onclick = () => navigate('fleet-detail', node.id);
      grid.appendChild(card);
    });
  }

  filterStatus.onchange = () => renderGrid(filterStatus.value);
  renderGrid('');
  setContent(wrap);
}

async function viewFleetNodeDetail(nodeId) {
  setContent(el('div',{cls:'ops-loading',text:'Loading node…'}));
  var [node, platforms, assets, nodeReqs, nodeCves] = await Promise.all([
    API.altofleet.get(nodeId),
    API.platforms.list(),
    API.assets.list(),
    API.software.requests({node_id: nodeId}),
    API.altofleet.cves(nodeId).catch(()=>[]),
  ]);

  var wrap = div('ops-page');
  var hdr  = div('ops-page-header');
  hdr.appendChild(btn('','← Back', () => navigate('fleet-nodes')));
  hdr.appendChild(el('h2',{text:'🖥 '+node.hostname}));
  wrap.appendChild(hdr);

  var statusColor = {online:'#22c55e',degraded:'#f59e0b',offline:'#ef4444',new:'#94a3b8'}[node.status]||'#94a3b8';
  var badge = el('span',{text:node.status.toUpperCase()});
  badge.style.cssText=`background:${statusColor}22;color:${statusColor};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid ${statusColor}44;display:inline-block;margin-bottom:16px;`;
  wrap.appendChild(badge);

  // Two-column info grid
  var grid = div('');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:16px;';

  function infoCard(title, rows) {
    var c = div('');
    c.style.cssText='background:#1e2540;border:1px solid #334155;border-radius:10px;padding:16px;';
    c.appendChild(el('div',{text:title,style:'color:#64748b;font-size:11px;font-weight:700;letter-spacing:.05em;margin-bottom:10px;text-transform:uppercase;'}));
    rows.forEach(([lbl,val]) => {
      var r = div('');
      r.style.cssText='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1e2540;font-size:13px;';
      r.appendChild(el('span',{text:lbl,style:'color:#64748b;'}));
      r.appendChild(el('span',{text:val||'—',style:'color:#e2e8f0;font-weight:500;'}));
      c.appendChild(r);
    });
    return c;
  }

  var ud = Math.floor((node.uptime_secs||0)/86400);
  var uh = Math.floor(((node.uptime_secs||0)%86400)/3600);

  grid.appendChild(infoCard('System', [
    ['Hostname',    node.hostname],
    ['IP Address',  node.ip_address],
    ['MAC Address', node.mac_address],
    ['OS',          node.os_pretty_name || node.os_name],
    ['Architecture',node.architecture],
    ['Uptime',      (ud?ud+'d ':'')+(uh?uh+'h ':'')+Math.floor(((node.uptime_secs||0)%3600)/60)+'m'],
  ]));

  grid.appendChild(infoCard('Hardware', [
    ['CPU Cores',   String(node.cpu_count)],
    ['Memory',      Math.round((node.memory_mb||0)/1024)+' GB'],
    ['Disk Total',  (node.disk_gb||0)+' GB'],
    ['Disk Free',   (node.disk_free_gb||0)+' GB'],
    ['CPU %',       (node.cpu_pct||0).toFixed(1)+'%'],
    ['Memory %',    (node.memory_pct||0).toFixed(1)+'%'],
    ['Disk %',      (node.disk_pct||0).toFixed(1)+'%'],
  ]));

  grid.appendChild(infoCard('Agent', [
    ['UUID',          node.local_uuid],
    ['Agent Version', node.agent_version],
    ['Status',        node.status],
    ['Last Seen',     node.last_seen || 'Never'],
    ['Last Full CI',  node.last_full_checkin || 'Never'],
    ['Registered',    node.registered_at],
    ['Registered By', node.registered_by],
  ]));

  // Assignment card
  var assignCard = div('');
  assignCard.style.cssText='background:#1e2540;border:1px solid #334155;border-radius:10px;padding:16px;';
  assignCard.appendChild(el('div',{text:'ASSIGNMENT',style:'color:#64748b;font-size:11px;font-weight:700;letter-spacing:.05em;margin-bottom:10px;text-transform:uppercase;'}));

  var platformSel = el('select');
  platformSel.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:6px 8px;font-size:13px;margin-bottom:8px;';
  var pOpt = el('option',{text:'— No Platform —'}); pOpt.value=''; platformSel.appendChild(pOpt);
  platforms.forEach(p => { var o=el('option',{text:p.name}); o.value=p.id; if(node.platform_id===p.id) o.selected=true; platformSel.appendChild(o); });

  var assetSel = el('select');
  assetSel.style.cssText='width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:6px 8px;font-size:13px;margin-bottom:12px;';
  var aOpt = el('option',{text:'— No Asset Link —'}); aOpt.value=''; assetSel.appendChild(aOpt);
  assets.forEach(a => { var o=el('option',{text:a.asset_code+' – '+(a.asset_name||a.name||'')}); o.value=a.id; if(node.asset_id===a.id) o.selected=true; assetSel.appendChild(o); });

  assignCard.appendChild(el('label',{text:'Platform',style:'color:#94a3b8;font-size:12px;display:block;margin-bottom:4px;'}));
  assignCard.appendChild(platformSel);
  assignCard.appendChild(el('label',{text:'Linked Asset',style:'color:#94a3b8;font-size:12px;display:block;margin-bottom:4px;'}));
  assignCard.appendChild(assetSel);

  var saveBtn = btn('primary','Save Assignment', async () => {
    await API.altofleet.update(nodeId, {
      platform_id: platformSel.value ? parseInt(platformSel.value) : null,
      asset_id:    assetSel.value    ? parseInt(assetSel.value)    : null,
    });
    navigate('fleet-detail', nodeId);
  });
  assignCard.appendChild(saveBtn);

  var delBtn = btn('danger','Remove Node', async () => {
    if (!confirm('Remove this node from the registry?')) return;
    await API.altofleet.destroy(nodeId);
    navigate('fleet-nodes');
  });
  delBtn.style.marginLeft='8px';
  assignCard.appendChild(delBtn);

  grid.appendChild(assignCard);
  wrap.appendChild(grid);

  // Services table
  if (node.services && typeof node.services === 'object' && Object.keys(node.services).length) {
    var svcHdr = el('h3',{text:'Services',style:'color:#94a3b8;font-size:14px;font-weight:600;margin:20px 0 10px;'});
    wrap.appendChild(svcHdr);
    var svcGrid = div('');
    svcGrid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;';
    Object.entries(node.services).forEach(([svc, state]) => {
      var ok = typeof state === 'string' && state.toLowerCase().includes('active');
      var s = div('');
      s.style.cssText=`background:${ok?'#22c55e11':'#ef444411'};border:1px solid ${ok?'#22c55e44':'#ef444444'};border-radius:8px;padding:10px;`;
      s.appendChild(el('div',{text:svc,style:'color:#e2e8f0;font-weight:600;font-size:13px;margin-bottom:2px;'}));
      s.appendChild(el('div',{text:state,style:`color:${ok?'#22c55e':'#ef4444'};font-size:11px;`}));
      svcGrid.appendChild(s);
    });
    wrap.appendChild(svcGrid);
  }

  // Threshold alerts
  if (node.threshold_alerts && node.threshold_alerts.length) {
    var altHdr = el('h3',{text:'Active Alerts',style:'color:#ef4444;font-size:14px;font-weight:600;margin:20px 0 10px;'});
    wrap.appendChild(altHdr);
    var altBox = div('');
    altBox.style.cssText='background:#ef444411;border:1px solid #ef444444;border-radius:10px;padding:12px 16px;';
    node.threshold_alerts.forEach(a => {
      altBox.appendChild(el('div',{text:'⚠ '+a,style:'color:#ef4444;font-size:13px;line-height:1.8;'}));
    });
    wrap.appendChild(altBox);
  }

  // Software requests for this node
  var swHdr = div('');
  swHdr.style.cssText='display:flex;align-items:center;justify-content:space-between;margin:24px 0 10px;';
  swHdr.appendChild(el('h3',{text:'Software Requests',style:'color:#94a3b8;font-size:14px;font-weight:600;margin:0;'}));
  swHdr.appendChild(btn('primary ops-btn-sm','+ Request Software', () => swRequestModal(nodeId)));
  wrap.appendChild(swHdr);

  if (nodeReqs.length) {
    var swBox = div('');
    nodeReqs.forEach(r => {
      var row = div('');
      row.style.cssText='display:flex;align-items:center;gap:10px;background:#0f172a;border:1px solid #1e3050;border-radius:8px;padding:10px 14px;margin-bottom:6px;';
      row.appendChild(el('span',{text:r.catalog?.icon||'📦',style:'font-size:18px;'}));
      var info = div('');
      info.style.flex='1';
      info.appendChild(el('div',{text:r.catalog?.name||'Unknown',style:'font-size:13px;font-weight:600;color:#e2e8f0;'}));
      info.appendChild(el('div',{text:r.catalog?.package_name||'',style:'font-size:11px;color:#38bdf8;font-family:monospace;'}));
      var sColor={pending:'#f59e0b',approved:'#38bdf8',installed:'#22c55e',rejected:'#ef4444',failed:'#f87171'}[r.status]||'#64748b';
      var sb=el('span',{text:r.status.toUpperCase()});
      sb.style.cssText='font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:'+sColor+'22;color:'+sColor+';border:1px solid '+sColor+'44;';
      row.appendChild(info);
      row.appendChild(sb);
      swBox.appendChild(row);
    });
    wrap.appendChild(swBox);
  } else {
    var swEmpty = el('div',{text:'No software requests for this node.',style:'color:#334155;font-size:13px;padding:12px;'});
    wrap.appendChild(swEmpty);
  }

  // ── CVE / Vulnerability Scan ──────────────────────────────────────────────
  var cveSection = div('');
  cveSection.style.cssText='margin-top:28px;';

  // Header row: title + action buttons
  var cveHdr = div('');
  cveHdr.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;';
  var cveTitleWrap = div('');
  cveTitleWrap.style.cssText='display:flex;align-items:center;gap:12px;';
  cveTitleWrap.appendChild(el('h3',{text:'CVE / Vulnerability Scan',style:'color:#94a3b8;font-size:14px;font-weight:600;margin:0;'}));
  if (node.last_cve_scan) {
    cveTitleWrap.appendChild(el('span',{text:'Last scan: '+node.last_cve_scan,style:'color:#475569;font-size:11px;'}));
  } else {
    cveTitleWrap.appendChild(el('span',{text:'No scan yet',style:'color:#475569;font-size:11px;'}));
  }
  // Trivy DB status badge — sourced from heartbeat
  var trivyBadge = el('span',{});
  if (node.trivy_db_ready === true) {
    trivyBadge.textContent = '🛡 Trivy Ready';
    trivyBadge.style.cssText = 'background:#14532d33;color:#4ade80;border:1px solid #4ade8044;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;';
    trivyBadge.title = 'Trivy is installed and the vulnerability DB is downloaded. CVE scans use full Trivy data.';
  } else if (node.trivy_db_ready === false) {
    trivyBadge.textContent = '⬇ Trivy DB Downloading';
    trivyBadge.style.cssText = 'background:#78350f33;color:#fbbf24;border:1px solid #fbbf2444;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;';
    trivyBadge.title = 'Trivy is installed but the vulnerability database is still downloading. Scans will use apt fallback until the DB is ready.';
  } else {
    trivyBadge.textContent = '⚠ Trivy Not Installed';
    trivyBadge.style.cssText = 'background:#7f1d1d33;color:#f87171;border:1px solid #f8717144;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;';
    trivyBadge.title = 'Trivy is not installed on this node. CVE data falls back to apt security checks only — no CVE IDs or CVSS scores.';
  }
  cveTitleWrap.appendChild(trivyBadge);
  cveHdr.appendChild(cveTitleWrap);

  // Action buttons
  var cveBtns = div('');
  cveBtns.style.cssText='display:flex;gap:8px;';
  var btnForceScan = el('button',{text:'Force Scan'});
  btnForceScan.style.cssText='background:#1e3a5f;border:1px solid #38bdf844;color:#38bdf8;font-size:11px;font-weight:600;padding:4px 12px;border-radius:6px;cursor:pointer;';
  btnForceScan.onclick = async function() {
    btnForceScan.disabled=true; btnForceScan.textContent='Queued...';
    try { await API.altofleet.forceScan(nodeId); btnForceScan.textContent='Scan queued'; } catch(e) { btnForceScan.textContent='Error'; btnForceScan.disabled=false; }
  };
  var btnUpdate = el('button',{text:'Schedule Update'});
  btnUpdate.style.cssText='background:#1a3a1a;border:1px solid #22c55e44;color:#22c55e;font-size:11px;font-weight:600;padding:4px 12px;border-radius:6px;cursor:pointer;';
  btnUpdate.onclick = async function() {
    if (!confirm('This will run apt-get upgrade on '+node.hostname+' and trigger a new CVE scan. Continue?')) return;
    btnUpdate.disabled=true; btnUpdate.textContent='Queued...';
    try { await API.altofleet.scheduleUpdate(nodeId); btnUpdate.textContent='Update queued'; } catch(e) { btnUpdate.textContent='Error'; btnUpdate.disabled=false; }
  };
  cveBtns.appendChild(btnForceScan);
  cveBtns.appendChild(btnUpdate);
  cveHdr.appendChild(cveBtns);
  cveSection.appendChild(cveHdr);

  if (nodeCves.length) {
    var SEV_COLOR = {CRITICAL:'#ef4444',HIGH:'#f97316',MEDIUM:'#f59e0b',LOW:'#22c55e',UNKNOWN:'#64748b'};
    var bySev = {};
    nodeCves.forEach(c => { (bySev[c.severity]||(bySev[c.severity]=[])).push(c); });

    // KPI summary cards
    var kpiRow = div('');
    kpiRow.style.cssText='display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;';
    var activeFilter = null;
    var cveListEl = div('');

    var _aptFallback = nodeCves.length > 0 && nodeCves.every(c => !c.cve_id);

    function renderCveList(filterSev) {
      cveListEl.innerHTML='';
      if (_aptFallback) {
        var warn = div('');
        warn.style.cssText='background:#f59e0b11;border:1px solid #f59e0b44;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#f59e0b;';
        warn.textContent='⚠ CVE data sourced from apt — trivy is not installed on this node. Install trivy for full CVE IDs, CVSS scores, and fix versions.';
        cveListEl.appendChild(warn);
      }
      var sevsToShow = filterSev ? [filterSev] : ['CRITICAL','HIGH','MEDIUM','LOW','UNKNOWN'];
      sevsToShow.forEach(sev => {
        if (!bySev[sev]) return;
        var color = SEV_COLOR[sev]||'#64748b';
        cveListEl.appendChild(el('div',{text:sev+' ('+bySev[sev].length+')',style:'color:'+color+';font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:10px 0 6px;'}));
        bySev[sev].forEach(c => {
          var row = div('');
          row.style.cssText='display:flex;align-items:flex-start;gap:12px;background:#0f172a;border:1px solid '+color+'33;border-radius:8px;padding:10px 14px;margin-bottom:6px;';
          var left = div(''); left.style.flex='1';

          // CVE ID — clickable NVD link for real CVEs
          var cveIdStr = (c.cve_id||'').trim();
          if (/^CVE-/i.test(cveIdStr)) {
            var cveLink = el('a',{text:cveIdStr});
            cveLink.href='https://nvd.nist.gov/vuln/detail/'+cveIdStr;
            cveLink.target='_blank'; cveLink.rel='noopener noreferrer';
            cveLink.style.cssText='font-weight:700;font-size:13px;color:#38bdf8;text-decoration:none;margin-bottom:2px;display:block;';
            cveLink.onmouseover=function(){this.style.textDecoration='underline';};
            cveLink.onmouseout=function(){this.style.textDecoration='none';};
            left.appendChild(cveLink);
          } else {
            left.appendChild(el('div',{text:'Pending Security Update',style:'font-weight:700;font-size:13px;color:#94a3b8;margin-bottom:2px;font-style:italic;'}));
          }

          // Package + version
          var pkgStr = (c.package_name||'')+(c.installed_version?' '+c.installed_version:'')+(c.fixed_version?' → '+c.fixed_version:'');
          if (pkgStr.trim()) left.appendChild(el('div',{text:pkgStr,style:'font-size:11px;color:#38bdf8;font-family:monospace;margin-bottom:4px;'}));

          // Badges
          var badgeRow = div(''); badgeRow.style.cssText='display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:4px;';
          var remedBadge = el('span',{text:c.is_remedial?'FIXABLE':'NO FIX'});
          remedBadge.style.cssText='font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;'
            +(c.is_remedial?'background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;':'background:#ef444422;color:#ef4444;border:1px solid #ef444444;');
          badgeRow.appendChild(remedBadge);
          if (!cveIdStr) {
            var aptBadge = el('span',{text:'APT SCAN'});
            aptBadge.style.cssText='font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44;';
            aptBadge.title='Install trivy for full CVE data with CVSS scores.';
            badgeRow.appendChild(aptBadge);
          }
          left.appendChild(badgeRow);

          if (c.description) left.appendChild(el('div',{text:c.description,style:'font-size:11px;color:#64748b;line-height:1.5;'}));
          row.appendChild(left);

          // CVSS v3 score — always shown
          var scoreVal = c.cvss_score ? parseFloat(c.cvss_score) : null;
          var scoreEl = div('');
          scoreEl.style.cssText='text-align:center;flex-shrink:0;min-width:56px;padding:4px 0;';
          var scoreNum = el('div',{text:scoreVal!==null?scoreVal.toFixed(1):'N/A'});
          scoreNum.style.cssText='font-size:'+(scoreVal!==null?'22':'14')+'px;font-weight:800;color:'+color+';line-height:1;';
          var scoreLbl = el('div',{text:'CVSS v3'});
          scoreLbl.style.cssText='font-size:9px;color:#475569;margin-top:3px;letter-spacing:0.5px;font-weight:600;text-transform:uppercase;';
          scoreEl.appendChild(scoreNum);
          scoreEl.appendChild(scoreLbl);
          row.appendChild(scoreEl);

          cveListEl.appendChild(row);
        });
      });
    }

    ['CRITICAL','HIGH','MEDIUM','LOW'].forEach(sev => {
      var count = (bySev[sev]||[]).length;
      var color = SEV_COLOR[sev];
      var card = div('');
      card.style.cssText='flex:1;min-width:80px;background:'+color+'11;border:1px solid '+color+'44;border-radius:10px;padding:10px 14px;cursor:pointer;transition:background 0.15s;text-align:center;';
      card.appendChild(el('div',{text:String(count),style:'font-size:26px;font-weight:800;color:'+color+';line-height:1;'}));
      card.appendChild(el('div',{text:sev,style:'font-size:10px;font-weight:700;color:'+color+';letter-spacing:1px;margin-top:3px;'}));
      card.onclick = function() {
        if (activeFilter===sev) {
          activeFilter=null; card.style.outline='none';
          kpiRow.querySelectorAll('[data-sev]').forEach(c2=>c2.style.outline='none');
        } else {
          activeFilter=sev;
          kpiRow.querySelectorAll('[data-sev]').forEach(c2=>c2.style.outline='none');
          card.style.outline='2px solid '+color;
        }
        renderCveList(activeFilter);
      };
      card.dataset.sev=sev;
      if (count===0) card.style.opacity='0.4';
      kpiRow.appendChild(card);
    });

    // Remedial vs Non-remedial summary
    var remedCount    = nodeCves.filter(c=>c.is_remedial).length;
    var nonRemedCount = nodeCves.length - remedCount;
    var summaryEl = div('');
    summaryEl.style.cssText='display:flex;gap:10px;margin-bottom:12px;font-size:11px;color:#64748b;';
    summaryEl.appendChild(el('span',{text:'Total: '+nodeCves.length+'  |  ',style:''}));
    summaryEl.appendChild(el('span',{text:'Remedial (fix available): '+remedCount,style:'color:#22c55e;font-weight:600;'}));
    summaryEl.appendChild(el('span',{text:' | Non-remedial: '+nonRemedCount,style:'color:#ef4444;font-weight:600;'}));

    cveSection.appendChild(kpiRow);
    cveSection.appendChild(summaryEl);
    renderCveList(null);
    cveSection.appendChild(cveListEl);

  } else if (node.last_cve_scan) {
    var cveOk = div('');
    cveOk.style.cssText='background:#22c55e11;border:1px solid #22c55e44;border-radius:10px;padding:14px;color:#22c55e;font-size:13px;';
    cveOk.textContent='No vulnerabilities detected on last scan ('+node.last_cve_scan+')';
    cveSection.appendChild(cveOk);
  } else {
    cveSection.appendChild(el('div',{text:'CVE scan pending — agent will run on next check-in.',style:'color:#334155;font-size:13px;padding:12px;'}));
  }
  wrap.appendChild(cveSection);

  setContent(wrap);
}

function openModal(title, html, onSave, saveLabel) {
  var wrap = el('div'); wrap.innerHTML = html;
  modal(title, wrap, onSave, saveLabel);
}
function closeModal() {}

async function swRequestModal(nodeId) {
  var catalog = await API.software.catalog();

  var wrap = el('div', {style:'display:grid;gap:14px;'});

  // Mode toggle
  var modeRow = el('div',{style:'display:flex;gap:0;border:1px solid #1e293b;border-radius:8px;overflow:hidden;'});
  var btnCatalog = el('button',{text:'Browse Catalog',style:'flex:1;padding:8px;background:#0d1829;color:#94a3b8;border:none;cursor:pointer;font-size:12px;font-weight:600;'});
  var btnCustom  = el('button',{text:'Describe What You Need',style:'flex:1;padding:8px;background:#070c18;color:#475569;border:none;cursor:pointer;font-size:12px;font-weight:600;border-left:1px solid #1e293b;'});
  modeRow.appendChild(btnCatalog);
  modeRow.appendChild(btnCustom);
  wrap.appendChild(modeRow);

  // Catalog pane
  var catalogPane = el('div',{style:'display:grid;gap:10px;'});
  if (catalog.length) {
    var opts = catalog.map(i=>'<option value="'+i.id+'">'+i.name+' ('+i.package_name+')</option>').join('');
    var catSel = el('select',{cls:'ops-input',style:'width:100%;'});
    catSel.innerHTML = opts;
    catalogPane.appendChild(fg('Software', catSel));
  } else {
    catalogPane.appendChild(el('div',{text:'No catalog items yet. Use "Describe What You Need" to submit a request.',style:'color:#64748b;font-size:12px;font-style:italic;'}));
  }
  var catNotes = el('textarea',{cls:'ops-input',style:'width:100%;height:54px;',placeholder:'Why is this needed? (optional)'});
  catalogPane.appendChild(fg('Notes', catNotes));
  wrap.appendChild(catalogPane);

  // Custom pane (hidden by default)
  var customPane = el('div',{style:'display:none;display:grid;gap:10px;'});
  customPane.style.display = 'none';
  var customDesc = el('textarea',{cls:'ops-input',style:'width:100%;height:100px;',placeholder:'e.g. "I need software for statistical analysis and data visualization (similar to R / SPSS). Will use it to process sensor data and generate reports."'});
  customPane.appendChild(fg('Describe the software you need', customDesc, true));
  var customNote = el('div',{text:'Your administrator will review this and install the appropriate package. You\'ll be notified through the Software Center.',style:'font-size:11px;color:#475569;font-style:italic;'});
  customPane.appendChild(customNote);
  wrap.appendChild(customPane);

  var _mode = 'catalog';
  function setMode(m) {
    _mode = m;
    if (m === 'catalog') {
      btnCatalog.style.background='#0d1829'; btnCatalog.style.color='#e2e8f0';
      btnCustom.style.background='#070c18'; btnCustom.style.color='#475569';
      catalogPane.style.display='grid'; customPane.style.display='none';
    } else {
      btnCustom.style.background='#0d1829'; btnCustom.style.color='#e2e8f0';
      btnCatalog.style.background='#070c18'; btnCatalog.style.color='#475569';
      catalogPane.style.display='none'; customPane.style.display='grid';
    }
  }
  setMode('catalog');
  btnCatalog.onclick = () => setMode('catalog');
  btnCustom.onclick  = () => setMode('custom');

  modal('Request Software for Node #'+nodeId, wrap, async function() {
    if (_mode === 'catalog') {
      if (!catalog.length) { alert('No catalog items. Use Describe What You Need instead.'); return; }
      await API.software.createRequest({
        node_id:    nodeId,
        catalog_id: parseInt(catSel ? catSel.value : '0'),
        notes:      catNotes.value.trim(),
      });
    } else {
      var desc = customDesc.value.trim();
      if (!desc) { alert('Please describe the software you need.'); return; }
      await API.software.customRequest({ node_id: nodeId, description: desc });
    }
    closeModal();
    showToast('Software request submitted');
    viewFleetNodeDetail(nodeId);
  }, 'Submit Request');
}

/* ── Software Catalog (Sprint 6B) ────────────────────────────── */
var _swCatalogItems = [];
var _swCatalogTab = 'catalog'; // 'catalog' | 'requests'

async function viewSoftwareCatalog(tab) {
  if (tab) _swCatalogTab = tab;
  setContent(el('div',{cls:'ops-loading',text:'Loading Software Catalog…'}));
  await getUserRole();
  var [catalog, requests] = await Promise.all([
    API.software.catalog(),
    API.software.requests()
  ]);
  _swCatalogItems = catalog;

  var wrap = div('ops-page-wrap');

  // Header
  var hdr = div('ops-page-header');
  hdr.appendChild(el('h2',{text:'📦 Software Catalog'}));
  var hdrRight = div('');
  hdrRight.style.cssText='display:flex;gap:8px;align-items:center;';
  if (_userRole.can_admin) {
    hdrRight.appendChild(btn('primary','+ Add Software', () => swCatalogAddModal()));
  }
  hdr.appendChild(hdrRight);
  wrap.appendChild(hdr);

  // Tabs
  var tabBar = div('');
  tabBar.style.cssText='display:flex;gap:0;border-bottom:2px solid #1e293b;margin-bottom:20px;';
  [{id:'catalog',label:'Catalog'},{id:'requests',label:'Requests ('+requests.filter(r=>r.status==='pending').length+' pending)'}].forEach(t=>{
    var tb = el('div',{text:t.label});
    tb.style.cssText='padding:8px 24px;cursor:pointer;font-size:13px;font-weight:600;'
      +(_swCatalogTab===t.id ? 'border-bottom:2px solid #38bdf8;color:#38bdf8;margin-bottom:-2px;' : 'color:#64748b;');
    tb.onclick=()=>viewSoftwareCatalog(t.id);
    tabBar.appendChild(tb);
  });
  wrap.appendChild(tabBar);

  if (_swCatalogTab === 'catalog') {
    swRenderCatalog(wrap, catalog);
  } else {
    swRenderRequests(wrap, requests);
  }

  setContent(wrap);
}

var SW_TIER_COLORS = {1:'#22c55e',2:'#38bdf8',3:'#f59e0b',4:'#ef4444'};
var SW_TIER_LABELS = {1:'Free',2:'Standard',3:'Professional',4:'Restricted'};

function swRenderCatalog(wrap, catalog) {
  var categories = [...new Set(catalog.map(i=>i.category))].sort();

  categories.forEach(cat => {
    var items = catalog.filter(i=>i.category===cat);
    wrap.appendChild(el('h3',{text:cat,style:'color:#94a3b8;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:20px 0 10px;'}));
    var grid = div('');
    grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;';
    items.forEach(item => {
      var card = div('ops-card');
      card.style.cssText='background:#0f172a;border:1px solid #1e3050;border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s;';
      card.onmouseover=()=>card.style.borderColor='#38bdf8';
      card.onmouseout=()=>card.style.borderColor='#1e3050';

      var top = div('');
      top.style.cssText='display:flex;align-items:flex-start;gap:12px;';
      var iconEl = el('div',{text:item.icon});
      iconEl.style.cssText='font-size:28px;flex-shrink:0;';
      var info = div('');
      info.appendChild(el('div',{text:item.name,style:'font-weight:700;font-size:14px;color:#e2e8f0;'}));
      info.appendChild(el('div',{text:item.package_name,style:'font-size:11px;color:#38bdf8;font-family:monospace;margin:2px 0;'}));
      info.appendChild(el('div',{text:item.description,style:'font-size:12px;color:#64748b;margin-top:4px;line-height:1.4;'}));
      top.appendChild(iconEl);
      top.appendChild(info);
      card.appendChild(top);

      var badges = div('');
      badges.style.cssText='display:flex;gap:6px;margin-top:12px;align-items:center;';
      var tierBadge = el('span',{text:'Tier '+item.tier+': '+item.tier_label});
      tierBadge.style.cssText='font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:'+(SW_TIER_COLORS[item.tier]||'#64748b')+'22;color:'+(SW_TIER_COLORS[item.tier]||'#64748b')+';border:1px solid '+(SW_TIER_COLORS[item.tier]||'#64748b')+'44;';
      badges.appendChild(tierBadge);
      if (item.auto_approve) {
        var ab = el('span',{text:'Auto-approve'});
        ab.style.cssText='font-size:10px;padding:2px 8px;border-radius:4px;background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;';
        badges.appendChild(ab);
      }
      card.appendChild(badges);

      if (_userRole.can_admin) {
        var actions = div('');
        actions.style.cssText='display:flex;gap:6px;margin-top:12px;';
        actions.appendChild(btn('ghost ops-btn-sm','Edit', e=>{e.stopPropagation();swCatalogEditModal(item);}));
        actions.appendChild(btn('ghost ops-btn-sm','Delete', async e=>{
          e.stopPropagation();
          if(!confirm('Remove "'+item.name+'" from catalog?')) return;
          await API.software.deleteCatalog(item.id);
          viewSoftwareCatalog('catalog');
        }));
        card.appendChild(actions);
      }
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  });

  if (!catalog.length) {
    wrap.appendChild(el('div',{cls:'ops-empty',text:'No software in catalog yet. Admins can add items.'}));
  }
}

function swRenderRequests(wrap, requests) {
  var pending  = requests.filter(r=>r.status==='pending');
  var approved = requests.filter(r=>r.status==='approved');
  var other    = requests.filter(r=>!['pending','approved'].includes(r.status));

  function swReqRow(r) {
    var isCustom = !r.catalog_id || r.custom_description;
    var row = div('');
    row.style.cssText='display:flex;align-items:flex-start;gap:12px;background:#0f172a;border:1px solid '+(isCustom?'#a78bfa44':'#1e3050')+';border-radius:10px;padding:14px;margin-bottom:8px;';
    var icon = el('div',{text:isCustom?'💬':(r.catalog?.icon||'📦')});
    icon.style.cssText='font-size:22px;flex-shrink:0;margin-top:2px;';
    var info = div('');
    info.style.cssText='flex:1;min-width:0;';

    if (isCustom) {
      var titleRow = el('div',{style:'display:flex;align-items:center;gap:8px;margin-bottom:4px;'});
      titleRow.appendChild(el('span',{text:'Unlisted Software Request',style:'font-weight:600;font-size:13px;color:#e2e8f0;'}));
      var reviewBadge = el('span',{text:'REVIEW NEEDED'});
      reviewBadge.style.cssText='font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;background:#a78bfa22;color:#a78bfa;border:1px solid #a78bfa44;';
      titleRow.appendChild(reviewBadge);
      info.appendChild(titleRow);
      if (r.custom_description) {
        var descEl = el('div',{text:'"'+r.custom_description+'"',style:'font-size:12px;color:#94a3b8;font-style:italic;margin-bottom:4px;line-height:1.5;'});
        info.appendChild(descEl);
      }
    } else {
      info.appendChild(el('div',{text:(r.catalog?.name||'Unknown software'),style:'font-weight:600;font-size:13px;color:#e2e8f0;margin-bottom:2px;'}));
    }

    info.appendChild(el('div',{text:(r.node_hostname||'Node #'+r.node_id)+' · requested by '+r.requested_by,style:'font-size:11px;color:#64748b;'}));
    if (r.notes) info.appendChild(el('div',{text:r.notes,style:'font-size:11px;color:#475569;margin-top:2px;font-style:italic;'}));

    var statColor = {pending:'#f59e0b',approved:'#38bdf8',installed:'#22c55e',rejected:'#ef4444',failed:'#f87171'}[r.status]||'#64748b';
    var statBadge = el('span',{text:r.status.toUpperCase()});
    statBadge.style.cssText='font-size:10px;font-weight:700;padding:2px 10px;border-radius:4px;background:'+statColor+'22;color:'+statColor+';border:1px solid '+statColor+'44;flex-shrink:0;margin-top:2px;';

    var rightCol = div('');
    rightCol.style.cssText='display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;';
    rightCol.appendChild(statBadge);

    if (_userRole.can_admin && (r.status==='pending' || r.status==='failed')) {
      var btnRow = div('');
      btnRow.style.cssText='display:flex;gap:4px;';
      if (r.status==='pending') {
        var approveBtn = btn('primary ops-btn-sm','Approve', async () => {
          await API.software.approve(r.id);
          viewSoftwareCatalog('requests');
        });
        var rejectBtn = btn('danger ops-btn-sm','Reject', async () => {
          var notes = prompt('Rejection reason (optional):','');
          await API.software.reject(r.id, {notes});
          viewSoftwareCatalog('requests');
        });
        btnRow.appendChild(approveBtn);
        btnRow.appendChild(rejectBtn);
      } else if (r.status==='failed') {
        var retryBtn = btn('primary ops-btn-sm','Retry', async () => {
          await API.software.approve(r.id);
          viewSoftwareCatalog('requests');
        });
        btnRow.appendChild(retryBtn);
      }
      rightCol.appendChild(btnRow);
    }

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(rightCol);
    return row;
  }

  if (pending.length) {
    wrap.appendChild(el('h3',{text:'Pending Approval ('+pending.length+')',style:'color:#f59e0b;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;'}));
    pending.forEach(r=>wrap.appendChild(swReqRow(r)));
  }
  if (approved.length) {
    wrap.appendChild(el('h3',{text:'Approved — Queued for Install ('+approved.length+')',style:'color:#38bdf8;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:20px 0 10px;'}));
    approved.forEach(r=>wrap.appendChild(swReqRow(r)));
  }
  if (other.length) {
    wrap.appendChild(el('h3',{text:'History',style:'color:#64748b;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:20px 0 10px;'}));
    other.forEach(r=>wrap.appendChild(swReqRow(r)));
  }
  if (!requests.length) {
    wrap.appendChild(el('div',{cls:'ops-empty',text:'No software requests yet.'}));
  }
}

async function viewSoftwareRequests() { return viewSoftwareCatalog('requests'); }

function swCatalogAddModal() {
  var wrap = el('div', {style:'display:grid;gap:12px;'});

  var nameInp = el('input', {cls:'ops-input', placeholder:'e.g. VLC Media Player', style:'width:100%;'});
  wrap.appendChild(fg('Name', nameInp, true));

  var pkgWrap = el('div', {});
  var pkgInp  = el('input', {cls:'ops-input', placeholder:'e.g. vlc', style:'width:100%;font-family:monospace;'});
  var pkgHint = el('div', {style:'font-size:11px;margin-top:5px;color:#64748b;'});
  pkgHint.innerHTML = 'Not sure of the package name? Look it up at <a href="https://packages.ubuntu.com" target="_blank" rel="noopener" style="color:#38bdf8;">packages.ubuntu.com</a> or <a href="https://repology.org" target="_blank" rel="noopener" style="color:#38bdf8;">repology.org</a>';
  var pkgStatus = el('div', {style:'font-size:11px;margin-top:3px;min-height:16px;'});
  pkgWrap.appendChild(pkgInp);
  pkgWrap.appendChild(pkgHint);
  pkgWrap.appendChild(pkgStatus);
  wrap.appendChild(fg('Package Name (apt)', pkgWrap, true));

  var descTa = el('textarea', {cls:'ops-input', style:'width:100%;height:60px;'});
  wrap.appendChild(fg('Description', descTa, true));

  var row = el('div', {style:'display:grid;grid-template-columns:1fr 1fr;gap:12px;'});
  var catSel = sel([['General','General'],['Office','Office'],['Media','Media'],
    ['Development','Development'],['Security','Security'],['Network','Network'],
    ['Graphics','Graphics'],['Communication','Communication']], 'General');
  var tierSel = sel([[1,'1 — Free'],[2,'2 — Standard'],[3,'3 — Professional'],[4,'4 — Restricted']], 1);
  row.appendChild(fg('Category', catSel));
  row.appendChild(fg('Tier', tierSel));
  wrap.appendChild(row);

  var autoChk = el('input', {type:'checkbox', style:'width:16px;height:16px;'});
  var autoRow = el('div', {style:'display:flex;align-items:center;gap:8px;'});
  autoRow.appendChild(autoChk);
  autoRow.appendChild(el('label', {cls:'ops-form-label', text:'Auto-approve (Tier 1 only — skips approval workflow)'}));
  wrap.appendChild(autoRow);

  var _repologyTimer = null;
  pkgInp.addEventListener('input', function() {
    clearTimeout(_repologyTimer);
    var pkg = pkgInp.value.trim();
    if (!pkg) { pkgStatus.textContent = ''; return; }
    pkgStatus.style.color = '#64748b';
    pkgStatus.textContent = 'Checking…';
    _repologyTimer = setTimeout(async function() {
      try {
        var data = await req('GET', '/api/software/repology?pkg=' + encodeURIComponent(pkg));
        if (data.error === 'unreachable') {
          pkgStatus.style.color = '#64748b';
          pkgStatus.textContent = 'Could not reach Repology — package name unverified';
        } else if (data.found) {
          pkgStatus.style.color = '#22c55e';
          pkgStatus.textContent = '✓ Found in Ubuntu/Debian repos';
        } else {
          pkgStatus.style.color = '#f59e0b';
          pkgStatus.textContent = '⚠ Not found in Ubuntu/Debian — verify package name before saving';
        }
      } catch(e) {
        pkgStatus.style.color = '#64748b';
        pkgStatus.textContent = 'Could not reach Repology — package name unverified';
      }
    }, 500);
  });

  modal('Add Software to Catalog', wrap, async function() {
    await API.software.createCatalog({
      name:         nameInp.value.trim(),
      package_name: pkgInp.value.trim(),
      description:  descTa.value.trim(),
      category:     catSel.value,
      tier:         parseInt(tierSel.value),
      auto_approve: autoChk.checked,
      icon:         '📦',
    });
    viewSoftwareCatalog('catalog');
  }, 'Add to Catalog');
}

function swCatalogEditModal(item) {
  openModal('Edit: '+item.name, `
    <div style="display:grid;gap:12px;">
      <div><label style="color:#94a3b8;font-size:12px;">Name</label><br><input id="sw-name" class="ops-input" value="${escH(item.name)}" style="width:100%;"></div>
      <div><label style="color:#94a3b8;font-size:12px;">Package Name (apt)</label><br><input id="sw-pkg" class="ops-input" value="${escH(item.package_name)}" style="width:100%;font-family:monospace;"></div>
      <div><label style="color:#94a3b8;font-size:12px;">Description</label><br><textarea id="sw-desc" class="ops-input" style="width:100%;height:60px;">${escH(item.description)}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label style="color:#94a3b8;font-size:12px;">Category</label><br>
          <select id="sw-cat" class="ops-input" style="width:100%;">
            ${['General','Office','Media','Development','Security','Network','Graphics','Communication'].map(c=>'<option'+(c===item.category?' selected':'')+'>'+c+'</option>').join('')}
          </select></div>
        <div><label style="color:#94a3b8;font-size:12px;">Tier</label><br>
          <select id="sw-tier" class="ops-input" style="width:100%;">
            ${[1,2,3,4].map(t=>'<option value="'+t+'"'+(t===item.tier?' selected':'')+'>'+t+' — '+SW_TIER_LABELS[t]+'</option>').join('')}
          </select></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="sw-auto" style="width:16px;height:16px;"${item.auto_approve?' checked':''}>
        <label for="sw-auto" style="color:#94a3b8;font-size:12px;">Auto-approve</label>
      </div>
    </div>
  `, async () => {
    await API.software.updateCatalog(item.id, {
      name:         document.getElementById('sw-name').value.trim(),
      package_name: document.getElementById('sw-pkg').value.trim(),
      description:  document.getElementById('sw-desc').value.trim(),
      category:     document.getElementById('sw-cat').value,
      tier:         parseInt(document.getElementById('sw-tier').value),
      auto_approve: document.getElementById('sw-auto').checked,
    });
    closeModal();
    viewSoftwareCatalog('catalog');
  }, 'Save Changes');
}

var SECTION_DEFS = [
  { key:'library',        label:'Library',                    desc:'Asset Registry, documents, component library' },
  { key:'maintenance',    label:'Maintenance (PM)',            desc:'PM dashboard and procedures' },
  { key:'deficiencies',   label:'Deficiencies',               desc:'Deficiency tracking and closeout' },
  { key:'safety',         label:'Safety / LOTO',              desc:'Lock-out/Tag-out and energy source control' },
  { key:'config_mgmt',    label:'Configuration Mgmt',         desc:'Modernizations, canvas, avail projects, work packages' },
  { key:'supply',         label:'Supply & Financials',        desc:'Supply requests, inventory, budget' },
  { key:'manpower',       label:'Manpower & Training',        desc:'Personnel, skills catalog, training records' },
  { key:'infrastructure', label:'Infrastructure (AltoFleet)', desc:'Fleet nodes, CVE scanning, software catalog' },
  { key:'analytics',      label:'Analytics',                  desc:'Reports, dashboards, and cyber readiness' },
  { key:'tools',          label:'Tools',                      desc:'QR scanner and utilities' },
  { key:'admin',          label:'Admin',                      desc:'Data import utilities' },
];

function buildSidebar() {
  var nav=document.getElementById('ops-sidebar');
  if(!nav) return;
  // Clear existing nav items (keep logo + badge header elements)
  nav.querySelectorAll('.ops-nav-item,.ops-nav-section-label').forEach(function(e){e.remove();});

  var items=[
    {label:'Dashboard',        route:'dashboard',        icon:'◈'},
    {label:'Asset Registry',   route:'assets',           icon:'⬡', section:'Library',            group:'library'},
    {label:'The Library',      route:'documents',        icon:'📄', section:'Library',            group:'library'},
    {label:'PM Dashboard',     route:'pm-dashboard',     icon:'⚙', section:'Maintenance',         group:'maintenance'},
    {label:'All Procedures',   route:'pm-procedures',    icon:'≡',                                 group:'maintenance'},
    {label:'Deficiencies',     route:'deficiencies',     icon:'⚠', section:'Deficiencies',        group:'deficiencies'},
    {label:'LOTO / Tagout',    route:'loto',             icon:'🔒', section:'Safety',              group:'safety'},
    {label:'Energy Sources',   route:'energy-sources',   icon:'⚡',                                group:'safety'},
    {label:'Modernizations',   route:'modernizations',   icon:'🔧', section:'Configuration Mgmt',  group:'config_mgmt'},
    {label:'System Canvas',    route:'canvases',         icon:'🗺',                                group:'config_mgmt'},
    {label:'Avail Projects',   route:'avail-projects',   icon:'📅',                                group:'config_mgmt'},
    {label:'Work Packages',    route:'work-packages',    icon:'📦',                                group:'config_mgmt'},
    {label:'Supply Requests',  route:'supply-requests',  icon:'🛒', section:'Supply / Financials', group:'supply'},
    {label:'Validations Due',  route:'validations-due',  icon:'✅',                                group:'supply'},
    {label:'Inventory',        route:'inventory',        icon:'🗄',                                group:'supply'},
    {label:'Budget',           route:'budget',           icon:'💰',                                group:'supply'},
    {label:'Personnel',        route:'personnel',        icon:'👥', section:'Manpower',            group:'manpower'},
    {label:'Skills Catalog',   route:'skills-catalog',   icon:'🎓',                                group:'manpower'},
    {label:'Training',         route:'training',         icon:'📋',                                group:'manpower'},
    {label:'Dashboards',       route:'reports',          icon:'📊', section:'Analytics',           group:'analytics'},
    {label:'Cyber Readiness',  route:'cyber-readiness',  icon:'🛡',                                group:'analytics'},
    {label:'QR Scan',          route:'qr-scan',          icon:'🔲', section:'Tools',               group:'tools'},
    {label:'Fleet Nodes',      route:'fleet-nodes',      icon:'🖥', section:'Infrastructure',      group:'infrastructure'},
    {label:'Software Catalog', route:'software-catalog', icon:'💾',                                group:'infrastructure'},
    {label:'Platforms & Shops',route:'platforms',        icon:'🌐', section:'Admin',               group:'admin'},
    {label:'Data Import',      route:'imports',          icon:'📥',                                group:'admin'},
    {label:'Settings',         route:'settings',         icon:'⚙',                                group:'admin'},
    {label:'User Manual',      route:'manual',           icon:'📖'},
  ];

  var lastSection='';
  items.forEach(function(item){
    // Skip items whose group is disabled
    if(_enabledSections && item.group && _enabledSections.indexOf(item.group)===-1) return;
    if(item.section&&item.section!==lastSection){
      nav.appendChild(el('div',{cls:'ops-nav-section-label',text:item.section}));
      lastSection=item.section;
    }
    var ni=el('div',{cls:'ops-nav-item'});
    ni.appendChild(span('ops-nav-icon',item.icon));
    ni.appendChild(span('',item.label));
    ni.dataset.route=item.route;
    ni.onclick=(function(r){return function(){navigate(r);};})(item.route);
    nav.appendChild(ni);
  });
}

function updateNav(route) {
  document.querySelectorAll('#ops-sidebar .ops-nav-item').forEach(e=>e.classList.toggle('active',e.dataset.route===route));
}

async function dispatch(route, param) {
  updateNav(route);
  try {
    if      (route==='dashboard')     await viewDashboard();
    else if (route==='assets')        await viewAssets();
    else if (route==='documents')      await viewDocuments();
    else if (route==='doc-detail')     await viewDocDetail(parseInt(param));
    else if (route==='requirements')   await viewModernizations('requirements');
    else if (route==='req-detail')     await viewReqDetail(parseInt(param));
    else if (route==='interfaces')     await viewModernizations('interfaces');
    else if (route==='mod-detail')     await viewModernizationDetail(parseInt(param));
    else if (route==='asset-detail')  await viewAssetDetail(parseInt(param));
    else if (route==='validations-due')  await viewValidationsDue();
    else if (route==='pm-dashboard')  await viewPmDashboard();
    else if (route==='pm-procedures') await viewPmProcedures();
    else if (route==='deficiencies')  await viewDeficiencies(param);
    else if (route==='budget')         await viewBudget();
    else if (route==='health-report')  await viewHealthReport();
    else if (route==='imports')        await viewImports();
    else if (route==='import-detail')  await viewImportDetail(parseInt(param));
    else if (route==='loto')          await viewLotoSessions();
    else if (route==='energy-sources')  await viewEnergySources();
    else if (route==='personnel')       await viewPersonnel();
    else if (route==='personnel-detail') await viewPersonnelDetail(parseInt(param));
    else if (route==='skills-catalog')  await viewSkillsCatalog();
    else if (route==='qr-scan')         await viewQrScan();
    else if (route==='training')        await viewTraining();
    else if (route==='training-detail') await viewTrainingDetail(parseInt(param));
    else if (route==='loto-detail')   await viewLotoDetail(parseInt(param));
    else if (route==='modernizations') await viewModernizations();
    else if (route==='canvases')        await viewCanvases();
    else if (route==='canvas-detail')   await viewCanvasDetail(parseInt(param));
    else if (route==='fmea-worksheet')  await viewFmeaWorksheet(parseInt(param));
    else if (route==='avail-projects')  await viewAvailProjects();
    else if (route==='work-packages')   await viewWorkPackages();
    else if (route==='wp-detail')       await viewWorkPackageDetail(parseInt(param));
    else if (route==='avail-detail')    await viewAvailProjectDetail(parseInt(param));
    else if (route==='def-detail')    await viewDefDetail(parseInt(param));
    else if (route==='supply-requests') await viewSupplyRequests();
    else if (route==='supply-detail')   await viewSupplyRequestDetail(parseInt(param));
    else if (route==='inventory')       await viewInventory();
    else if (route==='inv-detail')      await viewInventoryDetail(parseInt(param));
    else if (route==='fleet-nodes')        await viewFleetNodes();
    else if (route==='fleet-detail')       await viewFleetNodeDetail(parseInt(param));
    else if (route==='software-catalog')   await viewSoftwareCatalog();
    else if (route==='software-requests')  await viewSoftwareRequests();
    else if (route==='reports')            await viewReports();
    else if (route==='report-detail')      await viewReportDetail(parseInt(param));
    else if (route==='cyber-readiness')    await viewCyberReadiness();
    else if (route==='settings')        await viewSettings();
    else if (route==='manual')         await viewUserManual();
    else if (route==='platforms')     await viewPlatforms();
    else if (route==='shops')         await viewPlatforms('shops');
    else                              await viewDashboard();
  } catch(e) {
    console.error('[OpsSuite]',route,e);
    setContent(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span><br><small>See browser console for details.</small>'}));
  }
}

function navigate(route,param) { window.location.hash=param?route+'/'+param:route; }
function routeFromHash() { var h=window.location.hash.replace('#','').split('/'); return {route:h[0]||'dashboard',param:h[1]||null}; }

/* ── Boot ────────────────────────────────────────────────────── */
ready(async function(){
  (function forceBackground(){
    var s=document.createElement('style');
    s.textContent='#content.app-ops_suite,#app-ops_suite,.app-ops_suite{background-image:none!important;background-color:#1a1f2e!important;}#ops-suite-wrapper{background:#1a1f2e!important;height:100%!important;min-height:0!important;overflow:hidden!important;flex:1!important;}#ops-sidebar{background:#0f172a!important;overflow-y:auto!important;overflow-x:hidden!important;height:100%!important;max-height:100%!important;padding-bottom:24px!important;}#ops-sidebar::-webkit-scrollbar{width:4px;}#ops-sidebar::-webkit-scrollbar-thumb{background:#1e3050;border-radius:4px;}#ops-main{overflow-y:auto!important;height:100%!important;max-height:100%!important;}#ops-main,#ops-content{background:#1a1f2e!important;}';
    document.head.appendChild(s);
  })();

  var wrapper=document.getElementById('ops-suite-wrapper');
  var cur=wrapper;
  while(cur&&cur!==document.body){ cur.style.setProperty('background-image','none','important'); cur=cur.parentElement; }

  // Load section visibility before building sidebar
  try { var _s = await getSettings(); _enabledSections = Array.isArray(_s.enabled_sections) ? _s.enabled_sections : null; } catch(e){}

  buildSidebar();

  // Silently ensure the Nextcloud folder structure exists so file browsers open correctly
  API.files.ensureFolders().catch(function(){});

  // Show default badge immediately — no flash of "Loading…"
  var _roleBadgeColors = {admin:'badge-red',multi_site_manager:'badge-purple',platform_manager:'badge-teal',
                          shop_supervisor:'badge-blue',technician:'badge-gray',read_only:'badge-orange'};
  function setRoleBadge(role) {
    var el = document.getElementById('ops-role-badge');
    if (el) { el.className='ops-badge '+(_roleBadgeColors[role.role]||'badge-gray'); el.textContent=role.label; }
  }
  setRoleBadge(_userRole); // instant render with cached default
  getUserRole().then(setRoleBadge); // update when real role arrives

  window.addEventListener('hashchange',function(){ var r=routeFromHash(); dispatch(r.route,r.param); });
  var r=routeFromHash(); dispatch(r.route,r.param);

  // Expose refresh hook for online-event in template (re-fetches current section data)
  window.__mosRefreshData = function() { var r=routeFromHash(); dispatch(r.route,r.param); };
});

})();
