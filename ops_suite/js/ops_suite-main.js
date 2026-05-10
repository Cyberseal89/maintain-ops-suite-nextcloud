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
  dashboard:    { stats:      ()      => req('GET',  '/api/dashboard/stats') },
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
  platforms:    { list:       ()      => req('GET',  '/api/platforms'),
                  mine:       uid     => req('GET',  '/api/platforms/mine' + (uid ? '?uid='+uid : '')),
                  get:        id      => req('GET',  '/api/platforms/'+id),
                  create:     d       => req('POST', '/api/platforms', d),
                  update:     (id,d)  => req('PUT',  '/api/platforms/'+id, d),
                  destroy:    id      => req('DELETE','/api/platforms/'+id) },
  files:        { sopFolder:  ()      => req('GET',  '/api/files/sop'),
                  listFolder: p       => req('GET',  '/api/files/list'+qs(p)) }
};

/* ── Cache ───────────────────────────────────────────────────── */
var _cache = { assets:null, users:null, settings:null };
async function getAssets()   { if (!_cache.assets)   _cache.assets   = await API.assets.list(); return _cache.assets; }
async function getUsers()    { if (!_cache.users)    _cache.users    = await API.users.list();  return _cache.users; }
async function getSettings() { if (!_cache.settings) _cache.settings = await API.settings.get(); return _cache.settings; }
function clearCache(k)       { if (k) _cache[k]=null; else { _cache.assets=null; _cache.users=null; } }

/* ── Permission helper ───────────────────────────────────────── */
var _canWrite = null;
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

  // Multi-asset picker for linked assets
  var linkedPicker = multiAssetPicker(assets.filter(a=>a.id!==(data.id||0)), data.linked_assets||'');
  var linkedWrap = div('ops-form-group ops-form-full');
  linkedWrap.appendChild(el('label',{cls:'ops-form-label',text:'Linked Assets (Digital Twin Cross-References)'}));
  linkedWrap.appendChild(el('div',{cls:'ops-form-hint',text:'Check all related hardware, software, or firmware assets'}));
  linkedWrap.appendChild(linkedPicker);
  wrap.appendChild(linkedWrap);

  f.tags  = add('Tags', inp('Comma-separated tags', data.tags||''), true);
  f.notes = add('Notes', ta('Technical details, configuration notes…', data.notes||'',3), true);

  f.collect = () => ({
    name:data.id?data.name:f.name.value, asset_type:f.type.value,
    manufacturer:f.mfr.value, model:f.model.value, serial_number:f.serial.value,
    version:f.version.value, location:f.location.value, ip_address:f.ip.value,
    install_date:f.install.value||'', warranty_expiry:f.warranty.value||'',
    status:f.status.value, linked_assets:linkedPicker.getValue(),
    tags:f.tags.value, notes:f.notes.value,
    // allow name edit too
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
  var wrap=div(''); var hdr=div('ops-page-header',[el('h2',{text:'Dashboard'})]);
  wrap.appendChild(hdr);
  var loading=span('ops-muted','Loading stats…'); wrap.appendChild(loading);
  setContent(wrap);
  var stats;
  try{ stats=await API.dashboard.stats(); } catch(e){
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
    try{ assets=await API.assets.list(activeType?{type:activeType}:{}); clearCache('assets'); _cache.assets=assets; }
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
  hdr.appendChild(editBtn); hdr.appendChild(logDefBtn); hdr.appendChild(addPmBtn);
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
  var [all,overdue] = await Promise.all([API.procedures.list({}),API.procedures.list({overdue:'1'})]).catch(e=>{
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
    try{ procs=await API.procedures.list(p); }
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
    try{ defs=await API.deficiencies.list(p); }
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
    {label:'Settings',       route:'settings',      icon:'⚙', section:'Admin'},
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
    else if (route==='pm-dashboard')  await viewPmDashboard();
    else if (route==='pm-procedures') await viewPmProcedures();
    else if (route==='deficiencies')  await viewDeficiencies();
    else if (route==='def-detail')    await viewDefDetail(parseInt(param));
    else if (route==='settings')      await viewSettings();
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
