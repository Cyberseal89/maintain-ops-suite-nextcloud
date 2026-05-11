/**
 * OpsSuite v1.1.0
 * Adds: asset/procedure dropdowns, edit forms, SOP file picker,
 *       settings page (editor group), PMS Procedures folder integration.
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
                  save:       d       => req('POST', '/api/settings', d) },
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
                  list:       p         => req('GET',    '/api/work-packages'+qs(p)),
                  get:        id        => req('GET',    '/api/work-packages/'+id),
                  create:     d         => req('POST',   '/api/work-packages', d),
                  update:     (id,d)    => req('PUT',    '/api/work-packages/'+id, d),
                  destroy:    id        => req('DELETE', '/api/work-packages/'+id),
                  addItem:    (id,d)    => req('POST',   '/api/work-packages/'+id+'/items', d),
                  removeItem: (id,iid)  => req('DELETE', '/api/work-packages/'+id+'/items/'+iid),
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
                  list:      p       => req('GET',    '/api/modernizations'+qs(p)),
                  get:       id      => req('GET',    '/api/modernizations/'+id),
                  create:    d       => req('POST',   '/api/modernizations', d),
                  update:    (id,d)  => req('PUT',    '/api/modernizations/'+id, d),
                  destroy:   id      => req('DELETE', '/api/modernizations/'+id),
                  getDocs:   id      => req('GET',    '/api/modernizations/'+id+'/docs'),
                  addDoc:    (id,d)  => req('POST',   '/api/modernizations/'+id+'/docs', d),
                  updateDoc: (id,did,d) => req('PUT', '/api/modernizations/'+id+'/docs/'+did, d),
                  deleteDoc: (id,did)   => req('DELETE','/api/modernizations/'+id+'/docs/'+did),
                },
  platforms:    { list:       ()      => req('GET',  '/api/platforms'),
                  mine:       uid     => req('GET',  '/api/platforms/mine' + (uid ? '?uid='+uid : '')),
                  get:        id      => req('GET',  '/api/platforms/'+id),
                  create:     d       => req('POST', '/api/platforms', d),
                  update:     (id,d)  => req('PUT',  '/api/platforms/'+id, d),
                  destroy:    id      => req('DELETE','/api/platforms/'+id) },
  files:        { sopFolder:  ()      => req('GET',  '/api/files/sop'),
                  listFolder: p       => req('GET',  '/api/files/list'+qs(p)),
                  getTdp:    (assetId, assetName) => req('GET',  '/api/files/tdp?asset_id='+assetId+'&asset_name='+encodeURIComponent(assetName)),
                  createTdp: (assetId, assetName) => req('POST', '/api/files/tdp', {asset_id: assetId, asset_name: assetName}) } };

/* ── Cache ───────────────────────────────────────────────────── */
var _cache = { assets:null, users:null, settings:null };
var _selectedPlatformIds = []; // empty = all platforms
async function getAssets()   { if (!_cache.assets)   _cache.assets   = await API.assets.list(); return _cache.assets; }
async function getUsers()    { if (!_cache.users)    _cache.users    = await API.users.list();  return _cache.users; }
async function getSettings() { if (!_cache.settings) _cache.settings = await API.settings.get(); return _cache.settings; }
function clearCache(k)       { if (k) _cache[k]=null; else { _cache.assets=null; _cache.users=null; } }

/* ── Permission helper ───────────────────────────────────────── */
var _canWrite = null;
var _currentUser = (typeof OC !== 'undefined' && OC.currentUser) ? OC.currentUser : '';
var _orgSettings = { org_name: 'Alto Technologies LLC', org_address: '', org_city: '', org_phone: '', org_email: '', org_website: '' };
async function canWrite() {
  if (_canWrite !== null) return _canWrite;
  if (isAdmin()) { _canWrite = true; return true; }
  var s = await getSettings();
  if (!s.editor_group) { _canWrite = true; return true; }
  // Ask server — a 403 on any write will surface the real answer
  _canWrite = true; // optimistic; server enforces
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
function typeBadge(t) { return span('ops-tag ops-tag-'+(t||''), (t||'').toUpperCase().slice(0,2)); }
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
  var platforms = await API.platforms.list();
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
    name:data.id?data.name:f.name.value, asset_type:f.type.value,
    manufacturer:f.mfr.value, model:f.model.value, serial_number:f.serial.value,
    version:f.version.value, location:f.location.value, ip_address:f.ip.value,
    install_date:f.install.value||'', warranty_expiry:f.warranty.value||'',
    status:f.status.value, linked_assets:linkedPicker.getValue(),
    tags:f.tags.value, notes:f.notes.value,
    platform_id: f.platform.value ? parseInt(f.platform.value) : null,
    tdp_source_asset_id: f.tdpSource ? (f.tdpSource.value ? parseInt(f.tdpSource.value) : null) : null,
    uii: f.uii.value,
    cage_code: f.cageCode.value,
    iuid_compliant: parseInt(f.iuid.value),
    name:f.name.value,
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
  });
  f.wrap = wrap;
  return f;
}

/* ════════════════════════════════════════════════════════════════
   VIEWS
════════════════════════════════════════════════════════════════ */

/* ── Dashboard ── */
async function viewDashboard() {
  var wrap=div('');
  var hdr=div('ops-page-header',[el('h2',{text:'Dashboard'})]);

  // Platform selector buttons
  var platforms = await API.platforms.list().catch(()=>[]);
  if (platforms.length > 0) {
    var platWrap = div('');
    platWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap;';
    platWrap.appendChild(el('span',{text:'Platform:',style:'font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.7px;'}));
    var allBtn = btn(_selectedPlatformIds.length===0?'primary ops-btn-sm':'ops-btn-sm','All Platforms', ()=>{
      _selectedPlatformIds=[];
      viewDashboard();
    });
    platWrap.appendChild(allBtn);
    platforms.forEach(p=>{
      var isSelected = _selectedPlatformIds.includes(p.id);
      var pb = btn(isSelected?'primary ops-btn-sm':'ops-btn-sm', p.name, ()=>{
        if (isSelected) {
          _selectedPlatformIds = _selectedPlatformIds.filter(id=>id!==p.id);
        } else {
          _selectedPlatformIds = [..._selectedPlatformIds, p.id];
        }
        viewDashboard();
      });
      platWrap.appendChild(pb);
    });
    hdr.appendChild(platWrap);
  }

  wrap.appendChild(hdr);
  var loading=span('ops-muted','Loading stats…'); wrap.appendChild(loading);
  setContent(wrap);
  var stats;
  try{ stats=await API.dashboard.stats(_selectedPlatformIds); } catch(e){
    loading.remove(); wrap.appendChild(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return;
  }
  loading.remove();
  var a=stats.assets||{},pr=stats.procedures||{},df=stats.deficiencies||{},sev=df.bySeverity||{};
  var grid=div('stats-grid');
  [[a.total||0,'Total Assets',(a.byType?.hardware||0)+' HW · '+(a.byType?.software||0)+' SW · '+(a.byType?.firmware||0)+' FW','stat-teal'],
   [pr.dueSoon||0,'PM Due This Week','Procedures coming up','stat-blue'],
   [pr.overdue||0,'PM Overdue',(pr.completed30d||0)+' completed in last 30d','stat-orange'],
   [df.open||0,'Open Deficiencies','SEV-1: '+(sev['SEV-1']||0)+' · SEV-2: '+(sev['SEV-2']||0),'stat-red'],
  ].forEach(row=>{
    var c=div('stat-card '+row[3]);
    c.appendChild(el('div',{cls:'stat-label',text:row[1]}));
    c.appendChild(el('div',{cls:'stat-value',text:String(row[0])}));
    c.appendChild(el('div',{cls:'stat-sub',  text:row[2]}));
    grid.appendChild(c);
  });
  wrap.appendChild(grid);
  var two=div('ops-two-col');
  // Overdue PM
  var pmC=div('ops-card');
  pmC.appendChild(div('ops-card-header',[el('h3',{text:'⚠ Overdue PM'}),btn('','View All →',()=>navigate('pm-procedures'))]));
  pmC.appendChild(makeTable(['Procedure','Asset','Overdue By','Assigned'],
    (stats.overdue_list||[]).map(p=>[el('strong',{text:p.name}),span('ops-link-chip','#'+p.asset_id),
      span('ops-badge badge-red',overdueDays(p.next_due)+'d'),p.assigned_to||span('ops-danger ops-small','Unassigned')]),
    ()=>navigate('pm-procedures')));
  two.appendChild(pmC);
  // Critical defs
  var defC=div('ops-card');
  defC.appendChild(div('ops-card-header',[el('h3',{text:'Critical Deficiencies'}),btn('','View All →',()=>navigate('deficiencies'))]));
  var cd=stats.critical_defs||[];
  defC.appendChild(makeTable(['ID','Summary','SEV','Status'],
    cd.map(d=>[span('ops-muted',d.def_id_label),el('strong',{text:d.summary}),sevBadge(d.severity),statusBadge(d.status)]),
    i=>{ if(cd[i]) navigate('def-detail',cd[i].id); }));
  two.appendChild(defC);
  wrap.appendChild(two);
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
      ['ID','Name','Type','Manufacturer / Model','Location','Version','Status',''],
      filtered.map(a=>[span('ops-muted',a.asset_id_label),el('strong',{text:a.name}),typeBadge(a.asset_type),
        (a.manufacturer?a.manufacturer+' ':'')+a.model,a.location||'—',span('ops-mono',a.version||'—'),
        statusBadge(a.status),editAssetBtn(a)]),
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
  hdr.appendChild(statusBadge(asset.status));
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
  var tdpBtn = btn('', '📁 Open TDP Folder', async () => {
    var srcId   = asset.tdp_source_asset_id || id;
    var srcName = asset.tdp_source_asset_id ? (assets.find(a=>a.id===asset.tdp_source_asset_id)?.name || asset.name) : asset.name;
    var result  = await API.files.createTdp(srcId, srcName).catch(e => null);
    if (result && result.url) window.open(result.url, '_blank');
    else alert('Could not create TDP folder.');
  });
  hdr.appendChild(editBtn); hdr.appendChild(logDefBtn); hdr.appendChild(addPmBtn); hdr.appendChild(modBtn); hdr.appendChild(verifyBtn); hdr.appendChild(tdpBtn);
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

  // TDP Section
  var tdpCard = div('ops-card'); tdpCard.style.marginTop = '16px';
  var tdpHdr = div('ops-card-header');
  tdpHdr.appendChild(el('h3', {text: '📁 Technical Data Package'}));
  if (asset.tdp_source_asset_id) {
    var srcAsset = await API.assets.get(asset.tdp_source_asset_id).catch(() => null);
    var sharedBadge = span('ops-badge badge-blue', '⬡ Shared from ' + (srcAsset ? srcAsset.asset_id_label + ' — ' + srcAsset.name : 'Asset #' + asset.tdp_source_asset_id));
    tdpHdr.appendChild(sharedBadge);
  }
  var openTdpBtn = btn('ops-btn-sm', '📂 Open in Files', async () => {
    var srcId   = asset.tdp_source_asset_id || id;
    var srcName = asset.tdp_source_asset_id ? (srcAsset?.name || asset.name) : asset.name;
    var result  = await API.files.createTdp(srcId, srcName).catch(() => null);
    if (result?.url) window.open(result.url, '_blank');
  });
  tdpHdr.appendChild(openTdpBtn);
  tdpCard.appendChild(tdpHdr);

  // Load TDP contents
  var tdpSrcId   = asset.tdp_source_asset_id || id;
  var tdpSrcName = asset.tdp_source_asset_id ? (srcAsset?.name || asset.name) : asset.name;
  var tdpData    = await API.files.getTdp(tdpSrcId, tdpSrcName).catch(() => null);
  var sections   = tdpData?.sections || [];

  var TDP_ICONS = {
    'Drawings':'📐', 'Tech Manuals':'📖', 'Test Plans':'🧪',
    'Training':'🎓', 'PM SOPs':'🔧', 'Other':'📄'
  };

  if (!sections.length || sections.every(s => s.files.length === 0)) {
    var emptyMsg = div('');
    emptyMsg.style.cssText = 'padding:16px;color:#64748b;font-size:13px;text-align:center;';
    emptyMsg.textContent = 'No documents yet. Click "Open in Files" to add documents to the TDP folder.';
    tdpCard.appendChild(emptyMsg);
  } else {
    sections.forEach(section => {
      var secDiv = div('');
      secDiv.style.cssText = 'margin-bottom:12px;';

      var secHdr = div('');
      secHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0f172a;border-radius:8px;cursor:pointer;margin-bottom:4px;';
      var secTitle = el('span', {text: (TDP_ICONS[section.name]||'📄') + ' ' + section.name + ' (' + section.files.length + ')', style:'color:#e2e8f0;font-weight:600;font-size:13px;'});
      var openSecBtn = el('a', {href: section.url, target:'_blank', style:'color:#38bdf8;font-size:11px;text-decoration:none;', text:'Open folder →'});
      secHdr.appendChild(secTitle);
      secHdr.appendChild(openSecBtn);
      secDiv.appendChild(secHdr);

      if (section.files.length > 0) {
        var fileList = div('');
        fileList.style.cssText = 'padding:4px 8px;';
        section.files.forEach(file => {
          var fileRow = div('');
          fileRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid #1e2540;';
          var icon = file.type === 'folder' ? '📁' :
            file.mime?.includes('pdf') ? '📕' :
            file.mime?.includes('image') ? '🖼' :
            file.mime?.includes('video') ? '🎬' : '📄';
          var fileName = el('span', {text: icon + ' ' + file.name, style:'flex:1;color:#94a3b8;font-size:12px;cursor:pointer;'});
          fileName.onclick = () => showFileViewer(file);
          fileRow.appendChild(fileName);
          fileList.appendChild(fileRow);
        });
        secDiv.appendChild(fileList);
      }
      tdpCard.appendChild(secDiv);
    });
  }
  right.appendChild(tdpCard);
  two.appendChild(right);
  wrap.appendChild(two);
  setContent(wrap);
}

function sopLink(path) {
  if(!path) return span('ops-muted','—');
  var a=el('a',{href:'#',cls:'ops-link-chip',text:'📋 SOP'});
  a.onclick=e=>{ e.preventDefault(); e.stopPropagation();
    var dir=path.replace(/\/[^/]+$/,'');
    window.open('/apps/files/?dir='+encodeURIComponent(dir), '_blank'); };
  return a;
}

/* ── PM Dashboard ── */
async function viewPmDashboard() {
  var wrap=div(''); setContent(wrap);
  var hdr=div('ops-page-header',[el('h2',{text:'Maintenance Dashboard'}),btn('primary','All Procedures →',()=>navigate('pm-procedures'))]);
  wrap.appendChild(hdr);
  var loading=span('ops-muted','Loading…'); wrap.appendChild(loading);
  var _pf=_selectedPlatformIds.length?{platform_ids:_selectedPlatformIds.join(',')}:{};
  var [all,overdue] = await Promise.all([API.procedures.list({..._pf}),API.procedures.list({..._pf,overdue:'1'})]).catch(e=>{
    loading.remove(); wrap.appendChild(el('div',{cls:'ops-empty',html:'<span style="color:#f87171">⚠ '+e.message+'</span>'})); return [[],[]];
  });
  loading.remove();
  var now=Date.now(),in7=now+7*86400000;
  var soon=all.filter(p=>{ var d=p.next_due?new Date(p.next_due).getTime():0; return d>=now&&d<=in7; });
  var grid=div('stats-grid');
  [[all.length,'Active Procedures','stat-teal'],[soon.length,'Due This Week','stat-blue'],[overdue.length,'Overdue','stat-orange']].forEach(row=>{
    var c=div('stat-card '+row[2]); c.appendChild(el('div',{cls:'stat-label',text:row[1]})); c.appendChild(el('div',{cls:'stat-value',text:String(row[0])})); grid.appendChild(c);
  });
  wrap.appendChild(grid);
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
  actRow.appendChild(editBtn);
  actRow.appendChild(doneBtn2);
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
async function viewDeficiencies() {
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

  var tabs=div('ops-tabs'); var activeTab='open';
  [['open','All Open'],['SEV-1','SEV-1'],['SEV-2','SEV-2'],['in_work','In Work'],['closed','Closed']].forEach(td=>{
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
    else if(activeTab==='SEV-1'){p.status='open_all';p.severity='SEV-1';}
    else if(activeTab==='SEV-2'){p.status='open_all';p.severity='SEV-2';}
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
async function viewPlatforms() {
  var wrap = div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header', [el('h2', {text: '🌐 Platforms'})]));

  var newBtn = btn('primary', '+ New Platform', () => {
    showPlatformForm(null, () => viewPlatforms());
  });
  wrap.appendChild(newBtn);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var [platforms, groups] = await Promise.all([API.platforms.list(), API.users.groups()]);
  loading.remove();

  if (!platforms.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No platforms yet. Create one to get started.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['Name', 'Location', 'Description', 'Nextcloud Group', ''],
    platforms.map(p => {
      var editBtn = btn('ops-btn-sm', '✏ Edit', () => showPlatformForm(p, () => viewPlatforms()));
      var delBtn  = btn('danger ops-btn-sm', '✕', async () => {
        if (!confirm('Delete platform "' + p.name + '"?')) return;
        await API.platforms.destroy(p.id);
        viewPlatforms();
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
  wrap.appendChild(card);
}

/* ── Modernizations ── */
const MOD_STATUSES = [
  ['design','Design'],['planning','Planning'],['approval','Approval'],
  ['execution','Execution'],['complete','Complete']
];
const MOD_DOC_TYPES = [
  ['drawing','Drawings'],['tech_manual','Tech Manuals'],['test_plan','Test Plan'],
  ['training','Training'],['sop','PM SOPs'],['other','Other']
];
const STATUS_COLORS_MOD = {
  design:'badge-gray', planning:'badge-blue', approval:'badge-orange',
  execution:'badge-teal', complete:'badge-green'
};

async function viewModernizations() {
  var wrap = div(''); setContent(wrap);
  var hdr = div('ops-page-header', [el('h2', {text: '🔧 Modernizations'})]);
  var newBtn = btn('primary', '+ New Modernization', () => showModernizationForm(null, () => viewModernizations()));
  hdr.appendChild(newBtn);
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var mods = await API.modernizations.list(p).catch(e => []);
  loading.remove();

  if (!mods.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No modernizations yet. Create one to get started.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['Title', 'Status', 'Platform', 'Target', 'Assigned', 'Est. Total', ''],
    mods.map(m => {
      var statusBadge2 = span('ops-badge ' + (STATUS_COLORS_MOD[m.status]||'badge-gray'),
        MOD_STATUSES.find(s=>s[0]===m.status)?.[1] || m.status);
      var editBtn = btn('ops-btn-sm', '✏', () => showModernizationForm(m, () => viewModernizations()));
      var viewBtn = btn('ops-btn-sm', '👁 View', () => viewModernizationDetail(m.id));
      var actWrap = div(''); actWrap.style.cssText = 'display:flex;gap:4px;';
      actWrap.appendChild(viewBtn); actWrap.appendChild(editBtn);
      var titleEl = el('strong', {text: m.title, style:'cursor:pointer;color:#38bdf8;'});
      titleEl.onclick = () => viewModernizationDetail(m.id);
      return [
        titleEl,
        statusBadge2,
        m.platform_id ? span('ops-tag', 'Platform #'+m.platform_id) : span('ops-muted','—'),
        m.target_completion ? span('', m.target_completion.slice(0,10)) : span('ops-muted','—'),
        m.assigned_to || span('ops-muted','—'),
        m.est_total > 0 ? fmt$(m.est_total) : span('ops-muted','—'),
        actWrap
      ];
    })
  ));
  wrap.appendChild(card);
}

async function viewModernizationDetail(id) {
  setContent(el('div', {cls:'ops-empty', text:'Loading…'}));
  var mod = await API.modernizations.get(id).catch(e => null);
  if (!mod) return;

  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Modernizations', () => navigate('modernizations')));
  hdr.appendChild(el('h2', {text: mod.title}));
  hdr.appendChild(span('ops-badge '+(STATUS_COLORS_MOD[mod.status]||'badge-gray'),
    MOD_STATUSES.find(s=>s[0]===mod.status)?.[1]||mod.status));

  // Status workflow buttons
  var nextStatus = {design:'planning', planning:'approval', approval:'execution', execution:'complete'};
  if (nextStatus[mod.status]) {
    var advBtn = btn('primary', '→ Advance to ' + (MOD_STATUSES.find(s=>s[0]===nextStatus[mod.status])?.[1]||''), async () => {
      await API.modernizations.update(mod.id, {status: nextStatus[mod.status]});
      viewModernizationDetail(id);
    });
    hdr.appendChild(advBtn);
  }
  hdr.appendChild(btn('', '✏ Edit', () => showModernizationForm(mod, () => viewModernizationDetail(id))));
  // Supply request only available after approval stage
  var approvedStatuses = ['approval','execution','complete'];
  if (approvedStatuses.includes(mod.status)) {
    hdr.appendChild(btn('', '🛒 Request Parts', () => showSupplyRequestForm({
      title: 'Parts for: ' + mod.title,
      source_type: 'modernization',
      source_id: mod.id,
      platform_id: mod.platform_id,
    }, () => viewModernizationDetail(id))));
  } else {
    var lockedBtn = btn('', '🔒 Request Parts (Approve First)', () => 
      alert('Supply requests are only available after the modernization reaches Approval stage.'));
    lockedBtn.disabled = true;
    lockedBtn.style.opacity = '0.5';
    hdr.appendChild(lockedBtn);
  }
  wrap.appendChild(hdr);

  var two = div('ops-two-col');
  var left = div('');

  // Details card
  var dc = div('ops-card');
  dc.appendChild(div('ops-card-header', [el('h3', {text:'Details'})]));
  var kg = div('ops-kv-grid');
  [
    ['Description', mod.description || '—'],
    ['Assigned To', mod.assigned_to || '—'],
    ['Approver',    mod.approver || '—'],
    ['Start Date',  mod.start_date ? mod.start_date.slice(0,10) : '—'],
    ['Target',      mod.target_completion ? mod.target_completion.slice(0,10) : '—'],
  ].forEach(([k,v]) => {
    var kv = div('ops-kv');
    kv.appendChild(span('ops-kv-key', k));
    kv.appendChild(typeof v === 'string' ? span('', v) : v);
    kg.appendChild(kv);
  });
  dc.appendChild(kg);
  left.appendChild(dc);

  // Cost card
  var cc = div('ops-card'); cc.style.marginTop = '16px';
  cc.appendChild(div('ops-card-header', [el('h3', {text:'Cost Summary'})]));
  var cg = div('ops-cost-grid');
  [
    ['Est. Parts',       fmt$(mod.est_parts_cost),       'ops-blue'],
    ['Est. Labor',       fmt$(mod.est_labor_cost),       'ops-blue'],
    ['Est. Contractor',  fmt$(mod.est_contractor_cost),  'ops-blue'],
    ['Est. Total',       fmt$(mod.est_total),            'ops-warn'],
    ['Act. Parts',       fmt$(mod.actual_parts_cost),    'ops-teal'],
    ['Act. Labor',       fmt$(mod.actual_labor_cost),    'ops-teal'],
    ['Act. Contractor',  fmt$(mod.actual_contractor_cost),'ops-teal'],
    ['Act. Total',       fmt$(mod.actual_total),         'ops-green'],
  ].forEach(([l,v,c]) => {
    var cell = div('ops-cost-cell');
    cell.appendChild(el('div', {cls:'ops-cost-label', text:l}));
    cell.appendChild(el('div', {cls:'ops-cost-value '+c, text:String(v)}));
    cg.appendChild(cell);
  });
  cc.appendChild(cg);
  left.appendChild(cc);
  two.appendChild(left);

  // TDP Docs card
  var right = div('');
  var docsCard = div('ops-card ops-detail-card');
  docsCard.appendChild(div('ops-card-header', [
    el('h3', {text:'Technical Data Package'}),
    btn('primary ops-btn-sm', '+ Add Doc', () => showDocForm(mod.id, null, () => viewModernizationDetail(id)))
  ]));

  var docs = mod.docs || [];
  if (!docs.length) {
    docsCard.appendChild(el('p', {cls:'ops-empty', text:'No documents yet.'}));
  } else {
    MOD_DOC_TYPES.forEach(([type, label]) => {
      var typeDocs = docs.filter(d => d.doc_type === type);
      if (!typeDocs.length) return;
      var typeHdr = div('ops-section-label'); typeHdr.textContent = label;
      typeHdr.style.marginTop = '12px';
      docsCard.appendChild(typeHdr);
      typeDocs.forEach(doc => {
        var row = div(''); row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #2e3650;';
        var titleSpan = el('span', {text: doc.title, style:'flex:1;color:#e2e8f0;font-size:13px;'});
        if (doc.file_ref) {
          var link = el('a', {href: doc.file_ref, target:'_blank',
            style:'font-size:12px;color:#38bdf8;text-decoration:none;', text:'📎 Open'});
          row.appendChild(titleSpan);
          row.appendChild(link);
        } else {
          row.appendChild(titleSpan);
        }
        var statusBadge3 = span('ops-badge '+(doc.status==='complete'?'badge-green':doc.status==='in_progress'?'badge-blue':'badge-gray'), doc.status);
        row.appendChild(statusBadge3);
        var editDocBtn = btn('ops-btn-sm', '✏', () => showDocForm(mod.id, doc, () => viewModernizationDetail(id)));
        row.appendChild(editDocBtn);
        docsCard.appendChild(row);
      });
    });
  }
  right.appendChild(docsCard);

  // Linked deficiencies
  var defCard = div('ops-card'); defCard.style.marginTop = '16px';
  // Supply Requests linked to modernization
  var modSupplyReqs = mod.supply_requests || [];
  if (modSupplyReqs.length) {
    var msrCard = div('ops-card'); msrCard.style.marginBottom = '16px';
    msrCard.appendChild(div('ops-card-header', [el('h3', {text: '🛒 Supply Requests (' + modSupplyReqs.length + ')'})]));
    msrCard.appendChild(makeTable(
      ['SRFQ #', 'Status', 'Priority', 'Items', 'Needed By'],
      modSupplyReqs.map(sr => {
        var statB = span('ops-badge '+(SR_STATUS_COLORS[sr.status]||'badge-gray'),
          SR_STATUSES.find(s=>s[0]===sr.status)?.[1]||sr.status);
        var priColor = sr.priority==='emergency'?'badge-red':sr.priority==='urgent'?'badge-orange':'badge-gray';
        var rfqEl = el('strong', {text: sr.rfq_number||'--', style:'cursor:pointer;color:#38bdf8;'});
        rfqEl.onclick = () => navigate('supply-detail', sr.id);
        return [rfqEl, statB, span('ops-badge '+priColor, sr.priority),
          span('ops-badge badge-gray', (sr.item_count||0)+' items'),
          sr.needed_by ? sr.needed_by.slice(0,10) : span('ops-muted','--')];
      })
    ));
    right.appendChild(msrCard);
  }

  defCard.appendChild(div('ops-card-header', [el('h3', {text:'Linked Deficiencies'})]));
  var linkedDefs = await API.deficiencies.list({modernization_id: mod.id}).catch(() => []);
  if (!linkedDefs.length) {
    defCard.appendChild(el('p', {cls:'ops-empty ops-small', text:'No deficiencies linked.'}));
  } else {
    defCard.appendChild(makeTable(['ID','Summary','SEV','Status','Deferred'],
      linkedDefs.map(d => [
        span('ops-muted', d.def_id_label),
        el('strong', {text: d.summary}),
        sevBadge(d.severity),
        statusBadge(d.status),
        d.deferred_from_modernization ? span('ops-badge badge-orange','Deferred') : span('ops-muted','—')
      ])
    ));
  }
  right.appendChild(defCard);
  two.appendChild(right);
  wrap.appendChild(two);
  setContent(wrap);
}

function showModernizationForm(existing, onDone, prefill) {
  var isEdit = !!existing;
  var defaults = prefill || existing || {};
  var body = div('ops-form-grid');

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Modernization title';
  titleInp.value = defaults.title || '';
  body.appendChild(fg('Title *', titleInp, true));

  var descInp = document.createElement('textarea'); descInp.className='ops-input'; descInp.rows=3;
  descInp.placeholder='Description of the modernization scope';
  descInp.value = defaults.description || '';
  body.appendChild(fg('Description', descInp, true));

  var statusSel = sel(MOD_STATUSES, defaults.status || 'design');
  body.appendChild(fg('Status', statusSel));

  var assignInp = el('input',{}); assignInp.className='ops-input'; assignInp.placeholder='Assigned user';
  if (existing) assignInp.value = existing.assigned_to || '';
  body.appendChild(fg('Assigned To', assignInp));

  var approverInp = el('input',{}); approverInp.className='ops-input'; approverInp.placeholder='Approver user';
  if (existing) approverInp.value = existing.approver || '';
  body.appendChild(fg('Approver', approverInp));

  var startInp = el('input',{}); startInp.className='ops-input'; startInp.type='date';
  if (existing?.start_date) startInp.value = existing.start_date.slice(0,10);
  body.appendChild(fg('Start Date', startInp));

  var targetInp = el('input',{}); targetInp.className='ops-input'; targetInp.type='date';
  if (existing?.target_completion) targetInp.value = existing.target_completion.slice(0,10);
  body.appendChild(fg('Target Completion', targetInp));

  var estPartsInp = el('input',{}); estPartsInp.className='ops-input'; estPartsInp.type='number'; estPartsInp.placeholder='0.00';
  if (existing) estPartsInp.value = existing.est_parts_cost || '';
  body.appendChild(fg('Est. Parts Cost ($)', estPartsInp));

  var estLaborInp = el('input',{}); estLaborInp.className='ops-input'; estLaborInp.type='number'; estLaborInp.placeholder='0.00';
  if (existing) estLaborInp.value = existing.est_labor_cost || '';
  body.appendChild(fg('Est. Labor Cost ($)', estLaborInp));

  var estContractorInp = el('input',{}); estContractorInp.className='ops-input'; estContractorInp.type='number'; estContractorInp.placeholder='0.00';
  if (existing) estContractorInp.value = existing.est_contractor_cost || '';
  body.appendChild(fg('Est. Contractor Cost ($)', estContractorInp));

  modal(isEdit ? 'Edit Modernization' : 'New Modernization', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:               titleInp.value.trim(),
      description:         descInp.value.trim(),
      status:              statusSel.value,
      assigned_to:         assignInp.value.trim(),
      approver:            approverInp.value.trim(),
      start_date:          startInp.value || '',
      target_completion:   targetInp.value || '',
      est_parts_cost:      parseFloat(estPartsInp.value) || 0,
      est_labor_cost:      parseFloat(estLaborInp.value) || 0,
      est_contractor_cost: parseFloat(estContractorInp.value) || 0,
    };
    if (defaults.asset_ids) data.asset_ids = defaults.asset_ids;
    if (defaults.platform_id) data.platform_id = defaults.platform_id;
    else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) {
      await API.modernizations.update(existing.id, data);
      if (onDone) onDone(existing.id);
    } else {
      var created = await API.modernizations.create(data);
      if (onDone) onDone(created.id);
    }
  }, isEdit ? 'Save Changes' : 'Create Modernization');
}

function showDocForm(modId, existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var typeS = sel(MOD_DOC_TYPES, existing?.doc_type || 'other');
  body.appendChild(fg('Document Type', typeS));

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Document title';
  if (existing) titleInp.value = existing.title || '';
  body.appendChild(fg('Title *', titleInp, true));

  var fileInp = el('input',{}); fileInp.className='ops-input'; fileInp.placeholder='Nextcloud path or URL';
  if (existing) fileInp.value = existing.file_ref || '';
  body.appendChild(fg('File Reference / URL', fileInp, true));

  var statusS = sel([['pending','Pending'],['in_progress','In Progress'],['complete','Complete']], existing?.status||'pending');
  body.appendChild(fg('Status', statusS));

  var notesInp = document.createElement('textarea'); notesInp.className='ops-input'; notesInp.rows=2;
  notesInp.placeholder='Notes';
  if (existing) notesInp.value = existing.notes || '';
  body.appendChild(fg('Notes', notesInp, true));

  modal(isEdit ? 'Edit Document' : 'Add TDP Document', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      doc_type: typeS.value,
      title:    titleInp.value.trim(),
      file_ref: fileInp.value.trim(),
      status:   statusS.value,
      notes:    notesInp.value.trim(),
    };
    if (isEdit) {
      await API.modernizations.updateDoc(modId, existing.id, data);
    } else {
      await API.modernizations.addDoc(modId, data);
    }
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Add Document');
}

/* ── PDF / File Viewer ── */
function showFileViewer(file) {
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
    href: serveUrl,
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
  var mime = file.mime || '';

  if (mime.includes('pdf')) {
    var iframe = document.createElement('iframe');
    iframe.src = davUrl;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    content2.appendChild(iframe);
  } else if (mime.includes('image')) {
    var img = document.createElement('img');
    img.src = serveUrl;
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
    tableCard.appendChild(makeTable(
      ['Item Name', 'Part #', 'NSN', 'Manufacturer', 'UOM', 'Qty Req', 'Qty Rec', 'Est Total', 'Status', ''],
      items.map(item => {
        var statB = span('ops-badge '+(item.status==='received'?'badge-green':item.status==='ordered'?'badge-blue':'badge-gray'), item.status);
        var editBtn = btn('ops-btn-sm', '✏', () => showSupplyItemForm(id, item, () => viewSupplyRequestDetail(id)));
        var delBtn  = btn('danger ops-btn-sm', '✕', async () => {
          if (!confirm('Remove this item?')) return;
          await API.supply.requests.deleteItem(id, item.id);
          viewSupplyRequestDetail(id);
        });
        var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
        actWrap.appendChild(editBtn); actWrap.appendChild(delBtn);
        return [
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
      })
    ));
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

  modal(isEdit ? 'Edit Supply Request' : 'New Supply Request', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:        titleInp.value.trim(),
      status:       statusSel.value,
      priority:     priSel.value,
      needed_by:    neededInp.value || '',
      requested_by: reqByInp.value.trim(),
      notes:        notesInp.value.trim(),
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

const WP_STATUSES = [['draft','Draft'],['submitted','Submitted'],['approved','Approved'],['complete','Complete']];
const WP_STATUS_COLORS = { draft:'badge-gray', submitted:'badge-blue', approved:'badge-teal', complete:'badge-green' };

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
  var hdr = div('ops-page-header', [el('h2', {text: '📦 Work Packages'})]);
  hdr.appendChild(btn('primary', '+ New Work Package', () => showWorkPackageForm(null, () => viewWorkPackages())));
  wrap.appendChild(hdr);

  var loading = span('ops-muted', 'Loading…'); wrap.appendChild(loading);
  var p = {};
  if (_selectedPlatformIds.length) p.platform_ids = _selectedPlatformIds.join(',');
  var packages = await API.workPackages.list(p).catch(() => []);
  loading.remove();

  if (!packages.length) {
    wrap.appendChild(el('p', {cls:'ops-empty', text:'No work packages yet.'}));
    return;
  }

  var card = div('ops-card');
  card.appendChild(makeTable(
    ['RFQ #', 'Title', 'Status', 'Items', 'Est. Total', 'RFQ Due', ''],
    packages.map(pkg => {
      var statusB = span('ops-badge '+(WP_STATUS_COLORS[pkg.status]||'badge-gray'),
        WP_STATUSES.find(s=>s[0]===pkg.status)?.[1]||pkg.status);
      var viewBtn = btn('ops-btn-sm', '📦 View', () => navigate('wp-detail', pkg.id));
      var editBtn = btn('ops-btn-sm', '✏', () => showWorkPackageForm(pkg, () => viewWorkPackages()));
      var actWrap = div(''); actWrap.style.cssText='display:flex;gap:4px;';
      actWrap.appendChild(viewBtn); actWrap.appendChild(editBtn);
      var titleEl = el('strong', {text: pkg.title, style:'cursor:pointer;color:#38bdf8;'});
      titleEl.onclick = () => navigate('wp-detail', pkg.id);
      return [
        span('ops-mono', pkg.rfq_number || '—'),
        titleEl,
        statusB,
        span('ops-badge badge-gray', String(pkg.item_count || 0) + ' items'),
        pkg.est_total > 0 ? fmt$(pkg.est_total) : span('ops-muted','—'),
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
  if (!pkg) return;

  var wrap = div('');
  var hdr = div('ops-page-header');
  hdr.appendChild(btn('', '← Work Packages', () => navigate('work-packages')));
  hdr.appendChild(el('h2', {text: pkg.title}));
  hdr.appendChild(span('ops-badge '+(WP_STATUS_COLORS[pkg.status]||'badge-gray'),
    WP_STATUSES.find(s=>s[0]===pkg.status)?.[1]||pkg.status));
  hdr.appendChild(btn('', '✏ Edit', () => showWorkPackageForm(pkg, () => viewWorkPackageDetail(id))));
  hdr.appendChild(btn('primary', '+ Add Item', () => showAddWPItemForm(pkg, () => viewWorkPackageDetail(id))));
  hdr.appendChild(btn('success', '📄 Export RFQ', () => exportRFQ(pkg)));
  wrap.appendChild(hdr);

  // Info bar
  var infoBar = div('');
  infoBar.style.cssText = 'display:flex;gap:20px;padding:12px 0;border-bottom:1px solid #2e3650;margin-bottom:16px;font-size:13px;color:#94a3b8;flex-wrap:wrap;';
  infoBar.appendChild(el('span', {text: '🔖 RFQ: ' + (pkg.rfq_number || '—')}));
  if (pkg.rfq_due_date) infoBar.appendChild(el('span', {text: '📅 Due: ' + pkg.rfq_due_date.slice(0,10)}));
  if (pkg.assigned_to) infoBar.appendChild(el('span', {text: '👤 ' + pkg.assigned_to}));
  if (pkg.approver)    infoBar.appendChild(el('span', {text: '✓ Approver: ' + pkg.approver}));
  wrap.appendChild(infoBar);

  var items = pkg.items || [];
  var estTotal = pkg.est_total || 0;

  // Cost summary card
  if (estTotal > 0) {
    var costCard = div('ops-card'); costCard.style.marginBottom = '16px';
    costCard.appendChild(div('ops-card-header', [el('h3', {text:'Cost Summary'})]));
    var cg = div('ops-cost-grid');
    var pmItems  = items.filter(i => i.item_type === 'pm');
    var modItems = items.filter(i => i.item_type === 'modernization');
    var modTotal = modItems.reduce((s,i) => s + (i.linked_est_total||0), 0);
    [
      ['PM Items',      String(pmItems.length) + ' procedures', 'ops-blue'],
      ['Mod Items',     String(modItems.length) + ' modernizations', 'ops-purple'],
      ['Est. Total',    fmt$(estTotal), 'ops-warn'],
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
  tableCard.appendChild(div('ops-card-header', [el('h3', {text:'Package Items (' + items.length + ')'})]));

  if (!items.length) {
    tableCard.appendChild(el('p', {cls:'ops-empty', text:'No items yet. Add PMs or modernizations.'}));
  } else {
    tableCard.appendChild(makeTable(
      ['Type', 'Title', 'Est. Hours', 'Est. Cost', 'Target', ''],
      items.map(item => {
        var typeChip = span('ops-badge', item.item_type === 'pm' ? 'PM' : 'MOD');
        typeChip.style.cssText = 'background:'+(item.item_type==='pm'?'rgba(2,132,199,0.2)':'rgba(124,58,237,0.2)')+';color:'+(item.item_type==='pm'?'#38bdf8':'#a78bfa')+';border:1px solid '+(item.item_type==='pm'?'#0284c7':'#7c3aed')+';';
        var delBtn = btn('danger ops-btn-sm', '✕', async () => {
          if (!confirm('Remove this item from the package?')) return;
          await API.workPackages.removeItem(id, item.id);
          viewWorkPackageDetail(id);
        });
        var title = item.linked_title || item.notes || '—';
        var hours = item.linked_est_hours ? item.linked_est_hours + 'h' : '—';
        var cost  = item.linked_est_total > 0 ? fmt$(item.linked_est_total) : '—';
        var target = (item.linked_next_due || item.linked_target || '—');
        if (target !== '—') target = target.slice(0,10);
        return [typeChip, el('strong',{text:title}), hours, cost, target, delBtn];
      })
    ));
  }
  wrap.appendChild(tableCard);

  // Description / notes
  if (pkg.description || pkg.notes) {
    var notesCard = div('ops-card'); notesCard.style.marginTop = '16px';
    if (pkg.description) {
      notesCard.appendChild(div('ops-section-label', [document.createTextNode('Scope of Work')]));
      notesCard.appendChild(el('p', {cls:'ops-notes', text:pkg.description}));
    }
    if (pkg.notes) {
      notesCard.appendChild(div('ops-section-label', [document.createTextNode('Notes')]));
      notesCard.appendChild(el('p', {cls:'ops-notes', text:pkg.notes}));
    }
    wrap.appendChild(notesCard);
  }

  setContent(wrap);
}

function showWorkPackageForm(existing, onDone) {
  var isEdit = !!existing;
  var body = div('ops-form-grid');

  var titleInp = el('input',{}); titleInp.className='ops-input'; titleInp.placeholder='Work package title';
  if (existing) titleInp.value = existing.title || '';
  body.appendChild(fg('Title *', titleInp, true));

  var descInp = document.createElement('textarea'); descInp.className='ops-input'; descInp.rows=3;
  descInp.placeholder='Scope of work description — this will appear in the RFQ';
  if (existing) descInp.value = existing.description || '';
  body.appendChild(fg('Scope of Work', descInp, true));

  var statusSel = sel(WP_STATUSES, existing?.status || 'draft');
  body.appendChild(fg('Status', statusSel));

  var typeSel = sel([['mixed','Mixed (PMs + Modernizations)'],['pm_only','PMs Only'],['modernization_only','Modernizations Only']], existing?.package_type || 'mixed');
  body.appendChild(fg('Package Type', typeSel));

  var assignInp = el('input',{}); assignInp.className='ops-input'; assignInp.placeholder='Assigned user';
  if (existing) assignInp.value = existing.assigned_to || '';
  body.appendChild(fg('Assigned To', assignInp));

  var approverInp = el('input',{}); approverInp.className='ops-input'; approverInp.placeholder='Approver';
  if (existing) approverInp.value = existing.approver || '';
  body.appendChild(fg('Approver', approverInp));

  var rfqDueInp = el('input',{}); rfqDueInp.className='ops-input'; rfqDueInp.type='date';
  if (existing?.rfq_due_date) rfqDueInp.value = existing.rfq_due_date.slice(0,10);
  body.appendChild(fg('RFQ Response Due Date', rfqDueInp));

  var notesInp = document.createElement('textarea'); notesInp.className='ops-input'; notesInp.rows=2;
  notesInp.placeholder='Internal notes';
  if (existing) notesInp.value = existing.notes || '';
  body.appendChild(fg('Notes', notesInp, true));

  modal(isEdit ? 'Edit Work Package' : 'New Work Package', body, async () => {
    if (!titleInp.value.trim()) throw new Error('Title is required.');
    var data = {
      title:        titleInp.value.trim(),
      description:  descInp.value.trim(),
      status:       statusSel.value,
      package_type: typeSel.value,
      assigned_to:  assignInp.value.trim(),
      approver:     approverInp.value.trim(),
      rfq_due_date: rfqDueInp.value || '',
      notes:        notesInp.value.trim(),
    };
    if (defaults.source_type) data.source_type = defaults.source_type;
    if (defaults.source_id)   data.source_id   = defaults.source_id;
    if (defaults.platform_id) data.platform_id = defaults.platform_id;
    else if (_selectedPlatformIds.length === 1) data.platform_id = _selectedPlatformIds[0];
    if (isEdit) await API.workPackages.update(existing.id, data);
    else await API.workPackages.create(data);
    if (onDone) onDone();
  }, isEdit ? 'Save Changes' : 'Create Work Package');
}

async function showAddWPItemForm(pkg, onDone) {
  var body = div('ops-form-grid');

  var typeSel = sel([['pm','PM Procedure'],['modernization','Modernization']], 'pm');
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
      ? await API.procedures.list({})
      : await API.modernizations.list({});
    itemSel.innerHTML = '<option value="">— Select item —</option>';
    items.forEach(i => {
      var label = i.name || i.title || '#'+i.id;
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
  wrap.appendChild(div('ops-page-header', [el('h2', {text: '📖 User Manual'})]));

  var loading = span('ops-muted', 'Loading manual…'); wrap.appendChild(loading);

  try {
    var json = await req('GET', '/user-manual');
    var html = json.html || '';
    loading.remove();
    var content2 = div('ops-card');
    content2.style.cssText = 'padding:32px;max-width:900px;line-height:1.7;';
    content2.innerHTML = html;
    // Style headings and tables
    content2.querySelectorAll('h1').forEach(h => h.style.cssText='font-size:24px;font-weight:900;color:#e2e8f0;margin:0 0 16px;');
    content2.querySelectorAll('h2').forEach(h => h.style.cssText='font-size:18px;font-weight:800;color:#38bdf8;margin:32px 0 12px;border-bottom:1px solid #2e3650;padding-bottom:8px;');
    content2.querySelectorAll('h3').forEach(h => h.style.cssText='font-size:15px;font-weight:700;color:#e2e8f0;margin:20px 0 8px;');
    content2.querySelectorAll('p').forEach(p => p.style.cssText='color:#94a3b8;margin:0 0 12px;');
    content2.querySelectorAll('li').forEach(li => li.style.cssText='color:#94a3b8;margin:4px 0;');
    content2.querySelectorAll('table').forEach(t => t.style.cssText='width:100%;border-collapse:collapse;margin:12px 0;');
    content2.querySelectorAll('th').forEach(th => th.style.cssText='text-align:left;padding:8px;background:#0f172a;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.7px;');
    content2.querySelectorAll('td').forEach(td => td.style.cssText='padding:8px;border-bottom:1px solid #2e3650;color:#94a3b8;font-size:13px;');
    content2.querySelectorAll('code').forEach(c => c.style.cssText='background:#0f172a;padding:2px 6px;border-radius:4px;font-size:12px;color:#38bdf8;');
    content2.querySelectorAll('strong').forEach(s => s.style.color='#e2e8f0');
    wrap.appendChild(content2);
  } catch(e) {
    loading.remove();
    wrap.appendChild(el('p', {cls:'ops-empty', text:'Could not load manual: ' + e.message}));
  }
}

/* ── Settings ── */
async function viewSettings() {
  var wrap=div(''); setContent(wrap);
  wrap.appendChild(div('ops-page-header',[el('h2',{text:'Settings'})]));
  var loading=span('ops-muted','Loading…'); wrap.appendChild(loading);
  var [settings, groupsData] = await Promise.all([API.settings.get(), API.users.groups()]);
  loading.remove();

  var card=div('ops-card');
  card.appendChild(div('ops-card-header',[el('h3',{text:'Access Control'})]));
  var desc=el('p',{style:'font-size:13px;color:#94a3b8;margin-bottom:16px;line-height:1.6;',text:'Select which Nextcloud group can create and edit assets, procedures, and deficiencies. Nextcloud admins can always write. If no group is selected, all users can write.'});
  card.appendChild(desc);

  var formWrap=div('ops-form-grid');
  var groupSel=el('select',{cls:'ops-select'});
  groupSel.appendChild(el('option',{value:'',text:'— None (all users can edit) —'}));
  (groupsData||[]).forEach(g=>{
    var opt=el('option',{value:g.gid,text:g.displayName||g.gid});
    if(g.gid===settings.editor_group) opt.selected=true;
    groupSel.appendChild(opt);
  });
  formWrap.appendChild(fg('Editor Group', groupSel, true,
    'Only members of this group (plus Nextcloud admins) will be able to create, edit, or delete records.'));
  card.appendChild(formWrap);

  var saveBtn=btn('primary','Save Settings',async()=>{
    saveBtn.disabled=true; saveBtn.textContent='Saving…';
    try{
      await API.settings.save({editor_group:groupSel.value});
      _canWrite=null; _cache.settings=null; // reset permission cache
      saveBtn.textContent='Saved ✓'; saveBtn.style.background='#16803a'; saveBtn.style.borderColor='#16803a';
      setTimeout(()=>{ saveBtn.disabled=false; saveBtn.textContent='Save Settings'; saveBtn.style.background=''; saveBtn.style.borderColor=''; },2000);
    }catch(e){ alert('Error: '+e.message); saveBtn.disabled=false; saveBtn.textContent='Save Settings'; }
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
    '<div style="font-size:13px;color:#64748b;">Version 2.0.3</div></div></div>' +
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
function buildSidebar() {
  var nav=document.getElementById('ops-sidebar');
  if(!nav) return;
  var items=[
    {label:'Dashboard',      route:'dashboard',     icon:'◈'},
    {label:'Asset Registry', route:'assets',        icon:'⬡', section:'Configuration'},
    {label:'PM Dashboard',   route:'pm-dashboard',  icon:'⚙', section:'Maintenance'},
    {label:'All Procedures', route:'pm-procedures', icon:'≡'},
    {label:'Deficiencies',   route:'deficiencies',  icon:'⚠', section:'Deficiencies'},
    {label:'Modernizations',  route:'modernizations', icon:'🔧', section:'Modernization'},
    {label:'Avail Projects',   route:'avail-projects',  icon:'📅', section:'Modernization'},
    {label:'Work Packages',    route:'work-packages',   icon:'📦', section:'Modernization'},
    {label:'Supply Requests', route:'supply-requests', icon:'🛒', section:'Supply'},
    {label:'Validations Due',  route:'validations-due',  icon:'✅', section:'Supply'},
    {label:'Inventory',        route:'inventory',       icon:'🗄', section:'Supply'},
    {label:'Settings',         route:'settings',        icon:'⚙', section:'Admin'},
    {label:'User Manual',      route:'manual',        icon:'📖', section:'Admin'},
    {label:'Platforms',       route:'platforms',     icon:'🌐', section:'Admin'},
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
    else if (route==='asset-detail')  await viewAssetDetail(parseInt(param));
    else if (route==='validations-due')  await viewValidationsDue();
    else if (route==='pm-dashboard')  await viewPmDashboard();
    else if (route==='pm-procedures') await viewPmProcedures();
    else if (route==='deficiencies')  await viewDeficiencies();
    else if (route==='modernizations') await viewModernizations();
    else if (route==='avail-projects')  await viewAvailProjects();
    else if (route==='work-packages')   await viewWorkPackages();
    else if (route==='wp-detail')       await viewWorkPackageDetail(parseInt(param));
    else if (route==='avail-detail')    await viewAvailProjectDetail(parseInt(param));
    else if (route==='def-detail')    await viewDefDetail(parseInt(param));
    else if (route==='supply-requests') await viewSupplyRequests();
    else if (route==='supply-detail')   await viewSupplyRequestDetail(parseInt(param));
    else if (route==='inventory')       await viewInventory();
    else if (route==='inv-detail')      await viewInventoryDetail(parseInt(param));
    else if (route==='settings')        await viewSettings();
    else if (route==='manual')         await viewUserManual();
    else if (route==='platforms')     await viewPlatforms();
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
    s.textContent='#content.app-ops_suite,#app-ops_suite,.app-ops_suite{background-image:none!important;background-color:#1a1f2e!important;}#ops-suite-wrapper{background:#1a1f2e!important;min-height:100vh!important;}#ops-sidebar{background:#0f172a!important;}#ops-main,#ops-content{background:#1a1f2e!important;}';
    document.head.appendChild(s);
  })();

  var wrapper=document.getElementById('ops-suite-wrapper');
  var cur=wrapper;
  while(cur&&cur!==document.body){ cur.style.setProperty('background-image','none','important'); cur=cur.parentElement; }

  buildSidebar();

  // Ensure PMS Procedures folder exists on load
  API.files.sopFolder().catch(()=>{});

  window.addEventListener('hashchange',()=>{ var r=routeFromHash(); dispatch(r.route,r.param); });
  var r=routeFromHash(); dispatch(r.route,r.param);
});

})();
