/**
 * OpsSuite v3.23.5
 * Sprint 0A/0B: shops, asset coding (TYPE-SHOP-POSITION), criticality,
 * readiness engine, local_uuid offline sync foundation.
 */
(function () {
'use strict';

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
  return (window.OC && window.OC.requestToken) ? window.OC.requestToken : '';
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
                  seed:       ()      => req('POST', '/api/settings/seed', {}) },
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
  rcm:          { list:    p     => req('GET',    '/api/rcm/decisions'+qs(p)),
                  get:     id    => req('GET',    '/api/rcm/decisions/'+id),
                  upsert:  d     => req('POST',   '/api/rcm/decisions', d),
                  destroy: id    => req('DELETE', '/api/rcm/decisions/'+id) },
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
                  destroyEntry:    (wsId,id)   => req('DELETE', '/api/fmea/worksheets/'+wsId+'/entries/'+id) },
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
  altofleet:    { list:      p     => req('GET',    '/api/altofleet/nodes'+qs(p)),
                  get:       id    => req('GET',    '/api/altofleet/nodes/'+id),
                  update:    (id,d)=> req('PUT',    '/api/altofleet/nodes/'+id, d),
                  destroy:   id    => req('DELETE', '/api/altofleet/nodes/'+id),
                  cves:      id    => req('GET',    '/api/altofleet/nodes/'+id+'/cves') },
  software:     { catalog:       p     => req('GET',    '/api/software/catalog'+qs(p)),
                  createCatalog: d     => req('POST',   '/api/software/catalog', d),
                  updateCatalog: (id,d)=> req('PUT',    '/api/software/catalog/'+id, d),
                  deleteCatalog: id    => req('DELETE', '/api/software/catalog/'+id),
                  requests:      p     => req('GET',    '/api/software/requests'+qs(p)),
                  createRequest: d     => req('POST',   '/api/software/requests', d),
                  approve:       id    => req('POST',   '/api/software/requests/'+id+'/approve'),
                  reject:        (id,d)=> req('POST',   '/api/software/requests/'+id+'/reject', d) } };

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
  var cancelBtn=el('button',{style:'padding:8px 18px;border-radius:8px;border:1.5px solid #3e4a65;background:#2d3548;color:#cbd5e1;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;',text:'Cancel',onclick:()=>overlay.remove()});
  var saveBtn=el('button',{style:'padding:8px 18px;border-radius:8px;border:1.5px solid #0284c7;background:#0284c7;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;',text:saveLabel||'Save'});
  saveBtn.onclick=async()=>{
    saveBtn.disabled=true; saveBtn.textContent='Saving…';
    try { await onSave(); overlay.remove(); }
    catch(e){ alert('Error: '+e.message); saveBtn.disabled=false; saveBtn.textContent=saveLabel||'Save'; }
  };
  footer.appendChild(cancelBtn); footer.appendChild(saveBtn);
  box.appendChild(hdr); box.appendChild(body); box.appendChild(footer);
  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
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
  f.period = add('Periodicity', sel([['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],
    ['quarterly','Quarterly'],['semi_annual','Semi-Annual (6mo)'],['annual','Annual']], data.periodicity||'monthly'));
  f.lastDone = add('Last Completed', inp('','','date'));
  if(data.last_completed) f.lastDone.value=data.last_completed;
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

  f.collect = () => ({
    name:f.name.value,
    asset_id:fixedAssetId||(f.assetSel?parseInt(f.assetSel.value)||0:0),
    category:f.category.value, periodicity:f.period.value,
    last_completed:f.lastDone.value||'', assigned_to:f.assigned.value||'',
    document_ref:f.sopInput.value||'', description:f.desc.value||'',
    est_hours:parseFloat(f.hours.value)||0,
    create_deficiency_on_fail:parseInt(f.autoLog.value)||0,
  });
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
  var newBtn = btn('primary', '+ New Document', () => showDocumentForm(null, null, () => viewDocuments()));
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  // Filters
  var fbar = div('ops-filter-bar');
  var catSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Categories'],...DOC_CATEGORIES.map(c=>[c,DOC_CAT_ICONS[c]+' '+c])].forEach(([v,l])=>{
    var o=el('option',{value:v,text:l}); catSel.appendChild(o);
  });
  var statSel = el('select',{cls:'ops-select ops-select-sm'});
  [['','All Statuses'],...DOC_STATUSES.map(s=>[s,s])].forEach(([v,l])=>{
    var o=el('option',{value:v,text:l}); statSel.appendChild(o);
  });
  fbar.appendChild(span('ops-filter-label','Category:')); fbar.appendChild(catSel);
  fbar.appendChild(span('ops-filter-label','Status:'));   fbar.appendChild(statSel);
  wrap.appendChild(fbar);

  var tableWrap = div('');
  wrap.appendChild(tableWrap);

  function render() {
    var cat  = catSel.value;
    var stat = statSel.value;
    var filtered = docs.filter(d =>
      (!cat  || d.category === cat) &&
      (!stat || d.status   === stat)
    );
    var assetMap = {};
    assets.forEach(a => { assetMap[a.id] = a; });

    var card = div('ops-card');
    card.appendChild(makeTable(
      ['Doc #','Title','Category','Asset','Rev','Status',''],
      filtered.map(d => [
        span('ops-mono ops-small', d.doc_number),
        (()=>{ var lnk=el('strong',{text:d.title,style:'cursor:pointer;color:#38bdf8;'}); lnk.onclick=()=>navigate('doc-detail',d.id); return lnk; })(),
        span('ops-badge badge-blue', (DOC_CAT_ICONS[d.category]||'📄') + ' ' + (DOC_CAT_LABELS[d.category]||d.category)),
        d.asset_id && assetMap[d.asset_id] ? span('ops-mono ops-small', assetMap[d.asset_id].asset_id_label || ('#'+d.asset_id)) : span('ops-muted','—'),
        d.current_rev ? span('ops-mono ops-small','Rev '+d.current_rev) : span('ops-muted','—'),
        docStatusBadge(d.status),
        (()=>{
          var eb=btn('ops-btn-sm','✏',()=>showDocumentForm(d,d.asset_id,()=>viewDocuments()));
          var db=btn('ops-btn-sm ops-btn-danger','✕',async()=>{
            if(!confirm('Delete document "'+d.doc_number+'"?')) return;
            await API.documents.destroy(d.id); viewDocuments();
          });
          var g=div('ops-btn-group'); g.appendChild(eb); g.appendChild(db); return g;
        })(),
      ]),
      i => { if (filtered[i]) navigate('doc-detail', filtered[i].id); }
    ));
    tableWrap.innerHTML='';
    tableWrap.appendChild(card);
  }

  catSel.onchange = render;
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
  hdr.appendChild(el('h2',{text:doc.doc_number+' — '+doc.title}));
  hdr.appendChild(docStatusBadge(doc.status));
  var editBtn = btn('primary','✏ Edit & Advance Revision',()=>showDocumentForm(doc, doc.asset_id, ()=>viewDocDetail(id)));
  hdr.appendChild(editBtn);
  wrap.appendChild(hdr);

  var two = div('ops-two-col');
  var left = div('');

  // Detail card
  var dc = div('ops-card ops-detail-card');
  dc.appendChild(div('ops-section-label',[document.createTextNode('Document Information')]));
  var kvg = div('ops-kv-grid');
  var fields = [
    ['Doc Number', span('ops-mono', doc.doc_number)],
    ['Title',      doc.title],
    ['Category',   span('ops-badge badge-blue', (DOC_CAT_ICONS[doc.category]||'📄')+' '+(DOC_CAT_LABELS[doc.category]||doc.category))],
    ['Status',     docStatusBadge(doc.status)],
    ['Current Rev',doc.current_rev ? span('ops-mono','Rev '+doc.current_rev) : span('ops-muted','—')],
    ['Applicability', doc.applicability || span('ops-muted','—')],
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
  setContent(wrap);
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

async function showDocumentForm(existing, defaultAssetId, onSave) {
  var assets = await getAssets().catch(() => []);
  var fWrap  = div('ops-form-grid');
  var f = {};
  function add(l,i,full,hint){ fWrap.appendChild(fg(l,i,full,hint)); return i; }

  if (!existing) {
    f.docNumber = add('Doc Number', inp('Auto-generated if blank', ''));
  }
  f.title       = add('Title *',       inp('e.g., Network Rack Wiring Diagram', existing?.title||''), true);
  f.category    = add('Category',      sel(DOC_CATEGORIES.map(c=>[c,(DOC_CAT_ICONS[c]||'')+' '+(DOC_CAT_LABELS[c]||c)]), existing?.category||'other'));
  f.status      = add('Status',        sel(DOC_STATUSES.map(s=>[s,s]), existing?.status||'draft'));
  f.applicability = add('Applicability', inp('e.g., All HW-C1-* assets', existing?.applicability||''), true);

  // Asset linkage — searchable dropdown
  var assetOpts = [['','— No linked asset —']].concat(
    assets.map(a => [String(a.id), (a.asset_code||a.asset_id_label) + ' — ' + a.name])
  );
  var preselect = existing?.asset_id ? String(existing.asset_id) : (defaultAssetId ? String(defaultAssetId) : '');
  f.assetId = add('Linked Asset', sel(assetOpts, preselect), true, 'Attach this document to a specific asset in the registry.');

  f.notes = add('Notes', ta('Additional context…', existing?.notes||'', 3), true);

  // File attachment — browse button + path display
  var fileRow = div('ops-form-group ops-form-full');
  fileRow.appendChild(el('label',{cls:'ops-form-label',text: existing ? 'Attach File (this revision)' : 'Attach File (Rev A)'}));
  var filePathInp = inp('No file attached — click Browse to pick from Nextcloud', '');
  filePathInp.readOnly = true;
  filePathInp.style.cssText = 'flex:1;cursor:pointer;background:#0f172a;';
  var browseBtn = btn('','📂 Browse', () => {
    showFileBrowser((path, name) => {
      filePathInp.value = path;
      filePathInp.title = path;
    }, { title: '📂 Attach Document File', hint: 'Click a file to attach it to this revision', rootPath: 'Maintain Ops Suite/Documents' });
  });
  browseBtn.style.cssText = 'margin-top:4px;';
  var clearBtn = btn('', '✕ Clear', () => { filePathInp.value = ''; });
  clearBtn.style.cssText = 'margin-top:4px;margin-left:4px;';
  var fileInputWrap = div(''); fileInputWrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
  fileInputWrap.appendChild(filePathInp); fileInputWrap.appendChild(browseBtn); fileInputWrap.appendChild(clearBtn);
  fileRow.appendChild(fileInputWrap);
  fWrap.appendChild(fileRow);

  // On edit: ask what changed so we can auto-record the revision
  if (existing) {
    f.changeDesc = add('What changed? *', ta('Describe the changes made in this revision…', '', 2), true,
      'Saving will automatically advance the revision from ' + (existing.current_rev||'(none)') + ' → ' + nextRevision(existing.current_rev));
  }

  modal(
    existing ? 'Edit Document — Rev ' + nextRevision(existing?.current_rev) : 'New Document',
    fWrap,
    async () => {
      if (!f.title.value.trim()) throw new Error('Title is required.');
      if (existing && !f.changeDesc.value.trim()) throw new Error('Please describe what changed.');

      var d = {
        title:         f.title.value,
        category:      f.category.value,
        status:        f.status.value,
        applicability: f.applicability.value,
        notes:         f.notes.value,
        asset_id:      f.assetId.value ? parseInt(f.assetId.value) : null,
      };

      if (existing) {
        var newRev = nextRevision(existing.current_rev);
        d.current_rev = newRev;
        await API.documents.update(existing.id, d);
        await API.documents.addRevision(existing.id, {
          revision:    newRev,
          change_desc: f.changeDesc.value,
          file_path:   filePathInp.value || null,
          approved_by: null,
        });
      } else {
        if (f.docNumber?.value.trim()) d.doc_number = f.docNumber.value.trim();
        d.current_rev = 'A';
        var created = await API.documents.create(d);
        await API.documents.addRevision(created.id, {
          revision:    'A',
          change_desc: 'Initial document creation.',
          file_path:   filePathInp.value || null,
          approved_by: null,
        });
      }
      if (onSave) onSave();
    },
    existing ? 'Save & Advance Revision' : 'Create Document'
  );
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
  body.appendChild(row('Periodicity',    p.periodicity || '—'));
  body.appendChild(row('Last Completed', p.last_completed ? p.last_completed.slice(0,10) : '—'));
  body.appendChild(row('Next Due',       p.next_due ? p.next_due.slice(0,10) : '—'));
  body.appendChild(row('Est. Hours',     p.est_hours ? p.est_hours + 'h' : '—'));

  // Assignment section
  var assignHdr = el('div', {style:'font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;', text:'Assignment'});
  body.appendChild(assignHdr);
  body.appendChild(row('Asset',       '#' + p.asset_id));
  body.appendChild(row('Assigned To', p.assigned_to || '—'));
  body.appendChild(row('Category',    p.category || '—'));
  if (p.document_ref) body.appendChild(row('SOP Document', sopLink(p.document_ref)));

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

  // Skills Required section (async, loads inline)
  renderManpowerSection('procedure', p.id, body, !!_canWrite);

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
  modal.appendChild(el('p',  {cls:'ops-muted', text: proc.proc_id_label + ' · ' + proc.periodicity}));

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

  var btnRow = div('ops-btn-row');

  var cancelBtn = btn('secondary', 'Cancel', () => document.body.removeChild(overlay));

  var submitBtn = btn('success', '✓ Mark Complete', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      var data = {};
      if (hours.input.value)     data.actual_hours      = parseFloat(hours.input.value);
      if (partsCost.input.value) data.actual_parts_cost = parseFloat(partsCost.input.value);
      if (laborCost.input.value) data.actual_labor_cost = parseFloat(laborCost.input.value);
      if (notesInput.value)      data.completion_notes  = notesInput.value;
      await API.procedures.complete(proc.id, data);
      document.body.removeChild(overlay);
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
        return [span('ops-muted',p.proc_id_label),nameEl,span('ops-link-chip','#'+p.asset_id),
          span('ops-tag',p.category),p.periodicity,span('ops-muted',fmtDate(p.last_completed)),
          dueBadge(p.next_due),p.document_ref?sopLink(p.document_ref):span('ops-muted','—'),
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
  var ac=span('ops-link-chip','⬡ Asset #'+def.asset_id); ac.onclick=()=>navigate('asset-detail',def.asset_id); lw.appendChild(ac);
  if(def.linked_procedure_id) lw.appendChild(span('ops-link-chip','⚙ PM #'+def.linked_procedure_id));
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
    {id:'s-canvas',   label:'11. System Canvas'},
    {id:'s-fm',       label:'12. Failure Modes'},
    {id:'s-platforms',label:'13. Platforms & Shops'},
    {id:'s-import',   label:'14. Data Import'},
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
    c.appendChild(pp('The Library is the central document registry — SOPs, drawings, tech manuals, test plans, training materials, and specifications. Documents are referenced by PMs, Modernization TDPs, and assets.'));
    c.appendChild(sh('Document Categories'));
    c.appendChild(ul(['Drawing','Tech Manual','Specification','SOP (referenced by PMs)','Test Plan','Training Material','Other']));
    c.appendChild(sh('Key Features'));
    c.appendChild(ul([
      'Upload files stored in Nextcloud Files; the Library holds the registry record and metadata.',
      kw('Revision tracking')+' — increment revision on new versions; old revisions are retained. Status: Draft / Active / Superseded / Archived.',
      'PMs reference documents by ID — they always display the current Active revision.',
      'SOPs can be attached to PMs and included in Modernization TDPs.',
    ]));
    c.appendChild(tip('Use consistent document numbering (e.g., '+cd('SHB-SOP-0042')+') — this makes filtering and search significantly more effective across large document sets.'));
    mc.appendChild(c);
  })();

  // ── 11. System Canvas ────────────────────────────────────────────────────
  (function(){
    var c=mcard('s-canvas','🗺','System Canvas');
    c.appendChild(pp('The System Canvas is an interactive diagramming tool for drawing system architecture using real assets from the Registry as nodes. Diagrams are stored per platform and reflect live asset status.'));
    c.appendChild(ul([
      'Place '+kw('Asset Nodes')+' from the Registry onto the canvas. Nodes show name, type icon, and current criticality badge.',
      'Node color reflects current status: green = nominal, yellow = degraded, red = open deficiency, gray = bypassed.',
      'Draw '+kw('Interface Lines')+' between nodes labeled by connection type (electrical, data, mechanical, fluid, RF, etc.).',
      'Lines can be styled solid or dashed to distinguish interface types visually.',
      'Drag to arrange layout — positions are saved automatically.',
    ]));
    c.appendChild(tip('System Canvas is a communication and planning tool. Use it to give your team a quick visual reference of system topology alongside detailed registry data.'));
    mc.appendChild(c);
  })();

  // ── 12. Failure Modes ────────────────────────────────────────────────────
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
  hdr.appendChild(hdrRight);
  wrap.appendChild(hdr);

  var reportBody = div(''); wrap.appendChild(reportBody);

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
      if (st.sev_count>0) stBox.appendChild(el('div',{text:'⚠ '+st.sev_count+' open deficienc'+(st.sev_count===1?'y':'ies')+' — worst SEV-'+st.sev,style:'color:#f87171;font-size:12px;'}));
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
  wrap.appendChild(hdr);

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

  // ── Entries table ─────────────────────────────────────────────────
  var card = div('ops-card'); wrap.appendChild(card);

  if (!entries.length) {
    card.appendChild(el('p',{cls:'ops-empty',text:'No entries yet. Click "+ Add Entry" to start the analysis.'}));
  } else {
    var tbl = makeTable(
      ['#','Function','Failure Mode','Local Effect','System Effect','S','O','D','RPN','RCM Decision','Actions'],
      entries.map(function(e, i) {
        var rpn = e.rpn;
        var rpnCell = div(''); rpnCell.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;';
        rpnCell.appendChild(el('span',{text:String(rpn),style:'font-weight:900;font-size:14px;color:'+rpnColor(rpn)+';'}));
        rpnCell.appendChild(el('span',{text:rpnLabel(rpn),style:'font-size:9px;color:'+rpnColor(rpn)+';'}));
        if (e.revised_rpn) {
          rpnCell.appendChild(el('span',{text:'→'+e.revised_rpn,style:'font-size:10px;color:#4ade80;font-weight:700;'}));
        }

        // RCM cell
        var rcmCell = div(''); rcmCell.style.cssText='font-size:10px;min-width:130px;';
        var rcmDec = rcmByEntry[e.id];
        if (rcmDec) {
          var taskTypeLabels = {on_condition:'On-Condition',scheduled_restoration:'Sched. Restore',scheduled_discard:'Sched. Discard',failure_finding:'Failure Finding',run_to_failure:'Run-to-Failure',redesign:'Redesign / No PM'};
          rcmCell.appendChild(el('div',{text:taskTypeLabels[rcmDec.task_type]||rcmDec.task_type,style:'color:#38bdf8;font-weight:700;'}));
          if (rcmDec.task_interval) rcmCell.appendChild(el('div',{text:'Interval: '+rcmDec.task_interval,style:'color:#94a3b8;'}));
          if (rcmDec.approved_by)   rcmCell.appendChild(el('div',{text:'✓ '+rcmDec.approved_by,style:'color:#4ade80;font-size:9px;'}));
          rcmCell.appendChild(btn('ops-btn-sm','✏ RCM', function(){ showRcmDecisionForm(ws, e, rcmDec, function(){ viewFmeaWorksheet(id); }); }));
        } else {
          rcmCell.appendChild(btn('ops-btn-sm','+ RCM', function(){ showRcmDecisionForm(ws, e, null, function(){ viewFmeaWorksheet(id); }); }));
        }

        var btnG = div('ops-btn-group');
        btnG.appendChild(btn('ops-btn-sm','✏', function(){ showFmeaEntryForm(ws, e, function(){ viewFmeaWorksheet(id); }); }));
        btnG.appendChild(btn('ops-btn-sm ops-btn-danger','✕', async function(){
          if (!confirm('Delete this entry?')) return;
          await API.fmea.destroyEntry(ws.id, e.id);
          viewFmeaWorksheet(id);
        }));

        return [
          i+1,
          el('span',{text:e.function,style:'font-size:11px;max-width:120px;display:block;'}),
          el('span',{text:e.failure_mode,style:'font-size:11px;max-width:120px;display:block;color:#fbbf24;'}),
          el('span',{text:e.local_effect,style:'font-size:11px;max-width:120px;display:block;'}),
          el('span',{text:e.system_effect,style:'font-size:11px;max-width:120px;display:block;color:#fb923c;'}),
          el('span',{text:String(e.severity),    style:'font-weight:700;color:#f87171;'}),
          el('span',{text:String(e.occurrence),  style:'font-weight:700;color:#fb923c;'}),
          el('span',{text:String(e.detectability),style:'font-weight:700;color:#fbbf24;'}),
          rpnCell,
          rcmCell,
          btnG,
        ];
      })
    );
    card.appendChild(tbl);
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


  // About card
  var aboutCard = div('ops-card');
  aboutCard.appendChild(div('ops-card-header', [el('h3', {text:'About Maintain Ops Suite'})]));
  var aboutBody = div(''); aboutBody.style.cssText = 'padding:8px 0;';
  aboutBody.innerHTML = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">' +
    '<div style="font-size:32px;">⚙</div>' +
    '<div><div style="font-size:18px;font-weight:800;color:#e2e8f0;">Maintain Ops Suite</div>' +
    '<div style="font-size:13px;color:#64748b;">Version 3.12.1</div></div></div>' +
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
          renderManpowerSection(sourceType, sourceId, container, canEdit);
          // replace the section we just built — remove from sectionHdr down
          // Actually we re-render by removing old nodes and re-calling; simpler: just reload page view
          // For WP detail this is called from the page; for PM modal this is in-place
          // Since we re-render inline, we can just rebuild placeholder
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

  var skillOpts = [['','— Any / General Labor —']].concat(allSkills.map(function(s){ return [String(s.id), s.code+' — '+s.name]; }));
  var skillSel  = add('Skill / Cert Required', sel(skillOpts, existing?.skill_id ? String(existing.skill_id) : ''));
  var qtyInp    = add('Qty Required', inp('1', String(existing?.qty_required||1), 'number'));
  var hrsInp    = add('Est. Hours Each', inp('0', existing?.duration_hours ? String(existing.duration_hours) : '', 'number'));
  var notesInp  = add('Notes / Description', ta('e.g. Must be OSHA 30-certified…', existing?.notes||''), true);

  modal((existing?'Edit':'Add')+' Manpower Requirement', f, async function(){
    var d = {
      source_type:    sourceType,
      source_id:      sourceId,
      skill_id:       skillSel.value ? parseInt(skillSel.value) : null,
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

  // CVE Scan Results
  var cveHdr = div('');
  cveHdr.style.cssText='display:flex;align-items:center;justify-content:space-between;margin:28px 0 10px;';
  var cveTitleEl = el('h3',{text:'CVE / Vulnerability Scan',style:'color:#94a3b8;font-size:14px;font-weight:600;margin:0;'});
  cveHdr.appendChild(cveTitleEl);
  if (node.last_cve_scan) {
    cveHdr.appendChild(el('span',{text:'Last scan: '+node.last_cve_scan,style:'color:#475569;font-size:11px;'}));
  } else {
    cveHdr.appendChild(el('span',{text:'No scan yet — agent will run on next check-in',style:'color:#475569;font-size:11px;'}));
  }
  wrap.appendChild(cveHdr);

  if (nodeCves.length) {
    var SEV_COLOR = {CRITICAL:'#ef4444',HIGH:'#f97316',MEDIUM:'#f59e0b',LOW:'#22c55e',UNKNOWN:'#64748b'};
    var bySev = {};
    nodeCves.forEach(c => { (bySev[c.severity]||(bySev[c.severity]=[])).push(c); });
    ['CRITICAL','HIGH','MEDIUM','LOW','UNKNOWN'].forEach(sev => {
      if (!bySev[sev]) return;
      var color = SEV_COLOR[sev]||'#64748b';
      wrap.appendChild(el('div',{text:sev+' ('+bySev[sev].length+')',style:'color:'+color+';font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:12px 0 6px;'}));
      bySev[sev].forEach(c => {
        var row = div('');
        row.style.cssText='display:flex;align-items:flex-start;gap:12px;background:#0f172a;border:1px solid '+color+'33;border-radius:8px;padding:10px 14px;margin-bottom:6px;';
        var left = div('');
        left.style.flex='1';
        var cveIdEl = el('div',{text:c.cve_id||'CVE-Unknown',style:'font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:2px;'});
        var pkgEl  = el('div',{text:c.package_name+' '+c.installed_version+(c.fixed_version?' → fix: '+c.fixed_version:''),style:'font-size:11px;color:#38bdf8;font-family:monospace;margin-bottom:4px;'});
        var descEl = el('div',{text:c.description,style:'font-size:11px;color:#64748b;line-height:1.5;'});
        left.appendChild(cveIdEl);
        left.appendChild(pkgEl);
        if (c.description) left.appendChild(descEl);
        row.appendChild(left);
        if (c.cvss_score) {
          var scoreEl = el('div',{text:'CVSS\n'+c.cvss_score});
          scoreEl.style.cssText='text-align:center;font-size:10px;font-weight:700;color:'+color+';white-space:pre;flex-shrink:0;';
          row.appendChild(scoreEl);
        }
        wrap.appendChild(row);
      });
    });
  } else if (node.last_cve_scan) {
    var cveOk = div('');
    cveOk.style.cssText='background:#22c55e11;border:1px solid #22c55e44;border-radius:10px;padding:14px;color:#22c55e;font-size:13px;';
    cveOk.textContent='✓ No vulnerabilities detected on last scan ('+node.last_cve_scan+')';
    wrap.appendChild(cveOk);
  } else {
    wrap.appendChild(el('div',{text:'CVE scan pending — agent will run trivy on the next 7-day cycle.',style:'color:#334155;font-size:13px;padding:12px;'}));
  }

  setContent(wrap);
}

function openModal(title, html, onSave, saveLabel) {
  var wrap = el('div'); wrap.innerHTML = html;
  modal(title, wrap, onSave, saveLabel);
}
function closeModal() {}

async function swRequestModal(nodeId) {
  var catalog = await API.software.catalog();
  if (!catalog.length) { alert('No software in catalog. Ask an admin to add items.'); return; }
  var opts = catalog.map(i=>'<option value="'+i.id+'">'+i.name+' ('+i.package_name+')</option>').join('');
  openModal('Request Software for Node #'+nodeId, `
    <div style="display:grid;gap:12px;">
      <div>
        <label style="color:#94a3b8;font-size:12px;">Software</label><br>
        <select id="sw-req-cat" class="ops-input" style="width:100%;">${opts}</select>
      </div>
      <div>
        <label style="color:#94a3b8;font-size:12px;">Notes / Justification</label><br>
        <textarea id="sw-req-notes" class="ops-input" style="width:100%;height:60px;" placeholder="Why is this software needed?"></textarea>
      </div>
    </div>
  `, async () => {
    await API.software.createRequest({
      node_id:    nodeId,
      catalog_id: parseInt(document.getElementById('sw-req-cat').value),
      notes:      document.getElementById('sw-req-notes').value.trim(),
    });
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
    var row = div('');
    row.style.cssText='display:flex;align-items:center;gap:12px;background:#0f172a;border:1px solid #1e3050;border-radius:10px;padding:14px;margin-bottom:8px;';
    var icon = el('div',{text:r.catalog?.icon||'📦'});
    icon.style.cssText='font-size:22px;flex-shrink:0;';
    var info = div('');
    info.style.cssText='flex:1;min-width:0;';
    info.appendChild(el('div',{text:(r.catalog?.name||'Unknown'),style:'font-weight:600;font-size:13px;color:#e2e8f0;'}));
    info.appendChild(el('div',{text:(r.node_hostname||'Node #'+r.node_id)+' · requested by '+r.requested_by,style:'font-size:11px;color:#64748b;margin-top:2px;'}));
    var statColor = {pending:'#f59e0b',approved:'#38bdf8',installed:'#22c55e',rejected:'#ef4444',failed:'#f87171'}[r.status]||'#64748b';
    var statBadge = el('span',{text:r.status.toUpperCase()});
    statBadge.style.cssText='font-size:10px;font-weight:700;padding:2px 10px;border-radius:4px;background:'+statColor+'22;color:'+statColor+';border:1px solid '+statColor+'44;flex-shrink:0;';
    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(statBadge);
    if (r.status==='pending' && _userRole.can_admin) {
      var approveBtn = btn('primary ops-btn-sm','Approve', async () => {
        await API.software.approve(r.id);
        viewSoftwareCatalog('requests');
      });
      var rejectBtn = btn('danger ops-btn-sm','Reject', async () => {
        var notes = prompt('Rejection reason (optional):','');
        await API.software.reject(r.id, {notes});
        viewSoftwareCatalog('requests');
      });
      approveBtn.style.marginLeft='8px';
      rejectBtn.style.marginLeft='4px';
      row.appendChild(approveBtn);
      row.appendChild(rejectBtn);
    }
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

  var pkgInp  = el('input', {cls:'ops-input', placeholder:'e.g. vlc', style:'width:100%;font-family:monospace;'});
  var pkgStatus = el('div', {style:'font-size:11px;margin-top:4px;min-height:16px;'});
  var pkgWrap = div('');
  pkgWrap.appendChild(pkgInp);
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
        var r = await fetch('https://repology.org/api/v1/project/' + encodeURIComponent(pkg));
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var data = await r.json();
        var found = Array.isArray(data) && data.some(function(e) {
          return e.repo && /ubuntu|debian/.test(e.repo);
        });
        if (found) {
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

function buildSidebar() {
  var nav=document.getElementById('ops-sidebar');
  if(!nav) return;
  var items=[
    {label:'Dashboard',      route:'dashboard',     icon:'◈'},
    {label:'Asset Registry', route:'assets',        icon:'⬡', section:'Library'},
    {label:'PM Dashboard',   route:'pm-dashboard',  icon:'⚙', section:'Maintenance'},
    {label:'All Procedures', route:'pm-procedures', icon:'≡'},
    {label:'Deficiencies',   route:'deficiencies',  icon:'⚠', section:'Deficiencies'},
    {label:'LOTO / Tagout',  route:'loto',          icon:'🔒', section:'Safety'},
    {label:'Energy Sources', route:'energy-sources', icon:'⚡'},
    {label:'The Library',     route:'documents',      icon:'📄', section:'Library'},
    {label:'Modernizations',  route:'modernizations', icon:'🔧', section:'Configuration Mgmt'},
    {label:'System Canvas',   route:'canvases',       icon:'🗺'},
    {label:'Avail Projects',   route:'avail-projects',  icon:'📅', section:'Configuration Mgmt'},
    {label:'Work Packages',    route:'work-packages',   icon:'📦', section:'Configuration Mgmt'},
    {label:'Supply Requests', route:'supply-requests', icon:'🛒', section:'Supply / Financials'},
    {label:'Validations Due',  route:'validations-due',  icon:'✅', section:'Supply / Financials'},
    {label:'Inventory',        route:'inventory',       icon:'🗄', section:'Supply / Financials'},
    {label:'Budget',           route:'budget',          icon:'💰', section:'Supply / Financials'},
    {label:'Personnel',        route:'personnel',     icon:'👥', section:'Manpower'},
    {label:'Skills Catalog',   route:'skills-catalog',icon:'🎓'},
    {label:'Training',         route:'training',      icon:'📋'},
    {label:'QR Scan',          route:'qr-scan',       icon:'🔲', section:'Tools'},
    {label:'Fleet Nodes',      route:'fleet-nodes',      icon:'🖥', section:'Infrastructure'},
    {label:'Software Catalog', route:'software-catalog', icon:'📦'},
    {label:'Data Import',      route:'imports',       icon:'📥', section:'Admin'},
    {label:'Settings',         route:'settings',      icon:'⚙'},
    {label:'User Manual',      route:'manual',        icon:'📖'},
    {label:'Platforms & Shops', route:'platforms',    icon:'🌐'},
  ];
  var lastSection='';
  items.forEach(item=>{
    if(item.section&&item.section!==lastSection){
      nav.appendChild(el('div',{cls:'ops-nav-section-label',text:item.section}));
      lastSection=item.section;
    }
    var ni=el('div',{cls:'ops-nav-item'});
    ni.appendChild(span('ops-nav-icon',item.icon));
    ni.appendChild(span('',item.label));
    ni.dataset.route=item.route;
    ni.onclick=()=>navigate(item.route);
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
ready(function(){
  (function forceBackground(){
    var s=document.createElement('style');
    s.textContent='#content.app-ops_suite,#app-ops_suite,.app-ops_suite{background-image:none!important;background-color:#1a1f2e!important;}#ops-suite-wrapper{background:#1a1f2e!important;height:100vh!important;overflow:hidden!important;}#ops-sidebar{background:#0f172a!important;overflow-y:auto!important;height:100%!important;}#ops-main{overflow-y:auto!important;height:100%!important;}#ops-main,#ops-content{background:#1a1f2e!important;}';
    document.head.appendChild(s);
  })();

  var wrapper=document.getElementById('ops-suite-wrapper');
  var cur=wrapper;
  while(cur&&cur!==document.body){ cur.style.setProperty('background-image','none','important'); cur=cur.parentElement; }

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

  window.addEventListener('hashchange',()=>{ var r=routeFromHash(); dispatch(r.route,r.param); });
  var r=routeFromHash(); dispatch(r.route,r.param);
});

})();
