/* Independent warehouse UI concept. All records are fictional and stay in this browser. */
const KEY = 'field-ledger-demo-v1';
const LOCATIONS = ['Central Store', 'North Field', 'South Field'];
const PAGES = [
  ['overview', 'Overview', '▦'], ['inventory', 'Inventory', '▤'],
  ['receive', 'Receive stock', '↙'], ['dispatch', 'Dispatch', '↗'],
  ['transfer', 'Transfers', '⇄'], ['counts', 'Stock counts', '◎'],
  ['reports', 'Reports', '▥'], ['audit', 'Audit trail', '≡']
];
const SAMPLE = {
  items: [
    { sku:'REL-104', name:'Household supply kits', category:'Relief items', unit:'kits', reorder:120, stock:{'Central Store':420,'North Field':86,'South Field':74} },
    { sku:'WAT-201', name:'Water containers · 20 L', category:'WASH', unit:'units', reorder:100, stock:{'Central Store':280,'North Field':96,'South Field':60} },
    { sku:'HYG-315', name:'Hygiene packs', category:'WASH', unit:'packs', reorder:150, stock:{'Central Store':510,'North Field':104,'South Field':120} },
    { sku:'SHE-430', name:'Shelter tool sets', category:'Shelter', unit:'sets', reorder:60, stock:{'Central Store':180,'North Field':20,'South Field':40} },
    { sku:'EDU-522', name:'Learning supply boxes', category:'Education', unit:'boxes', reorder:45, stock:{'Central Store':130,'North Field':26,'South Field':18} },
    { sku:'LGT-608', name:'Solar lanterns', category:'Core relief', unit:'units', reorder:100, stock:{'Central Store':235,'North Field':34,'South Field':51} },
    { sku:'MED-713', name:'First aid refill packs', category:'Health', unit:'packs', reorder:50, stock:{'Central Store':92,'North Field':12,'South Field':15} }
  ],
  events: [
    { type:'receipt', sku:'HYG-315', qty:120, from:'Approved supplier', to:'Central Store', ref:'GRN-2026-081', actor:'Demo operator', at:'Today · 09:42' },
    { type:'dispatch', sku:'REL-104', qty:-45, from:'Central Store', to:'Field distribution', ref:'DIS-2026-047', actor:'Demo operator', at:'Today · 08:15' },
    { type:'transfer', sku:'WAT-201', qty:30, from:'Central Store', to:'North Field', ref:'TRF-2026-023', actor:'Demo operator', at:'Yesterday · 16:20' },
    { type:'count', sku:'LGT-608', qty:-2, from:'South Field', to:'South Field', ref:'CNT-2026-019', actor:'Demo operator', at:'Yesterday · 11:04' }
  ]
};
const clone = value => JSON.parse(JSON.stringify(value));
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || clone(SAMPLE); } catch { state = clone(SAMPLE); }
let page = 'overview';
let selectedLocation = 'All locations';
let searchText = '';
let flash = null;

const $ = selector => document.querySelector(selector);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Number(n).toLocaleString('en-UG');
const total = item => LOCATIONS.reduce((n,l) => n + Number(item.stock[l] || 0), 0);
const now = () => new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Africa/Kampala'}).format(new Date()) + ' EAT';
const locationOptions = selected => LOCATIONS.map(l => `<option value="${safe(l)}" ${selected===l?'selected':''}>${safe(l)}</option>`).join('');
const itemOptions = () => state.items.map(i => `<option value="${safe(i.sku)}">${safe(i.name)} · ${safe(i.sku)}</option>`).join('');
const itemFor = sku => state.items.find(i => i.sku===sku);
function store(){ localStorage.setItem(KEY,JSON.stringify(state)); }
function notice(){ if(!flash) return ''; const html=`<div class="${flash.kind==='error'?'error-banner':'success-banner'}" role="status">${safe(flash.message)}</div>`; flash=null; return html; }
function show(kind,message){ flash={kind,message}; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function navigate(to){ page=to; flash=null; render(); window.scrollTo({top:0,behavior:'smooth'}); $('.sidebar').classList.remove('open'); }

function renderNav(){
  $('#navigation').innerHTML=PAGES.map(([id,label,icon])=>`<button type="button" class="nav-item ${page===id?'active':''}" data-nav="${id}" aria-current="${page===id?'page':'false'}"><span class="nav-icon" aria-hidden="true">${icon}</span>${label}${id==='inventory'?`<span class="nav-count">${state.items.length}</span>`:''}</button>`).join('');
  $('#breadcrumb-current').textContent=PAGES.find(([id])=>id===page)?.[1]||'Overview';
}
function head(kicker,title,subtitle,actions=''){
  return `<div class="page-head"><div><div class="eyebrow">${safe(kicker)}</div><h1>${safe(title)}</h1><p>${safe(subtitle)}</p></div><div class="button-row">${actions}</div></div>`;
}
const action = (id,label,cls='') => `<button type="button" class="button ${cls}" data-nav="${id}">${label}</button>`;
function status(item,place){ const n=place==='All locations'?total(item):item.stock[place]||0; const floor=place==='All locations'?item.reorder:item.reorder/3; return n<floor?'<span class="chip alert">Low stock</span>':n<floor*1.5?'<span class="chip warn">Watch</span>':'<span class="chip good">Available</span>'; }
function eventIcon(type){return ({receipt:'↙',dispatch:'↗',transfer:'⇄',count:'◎'})[type]||'•';}
function eventName(e){ const i=itemFor(e.sku); return `${({receipt:'Received',dispatch:'Dispatched',transfer:'Transferred',count:'Count adjusted'})[e.type]||'Updated'} ${i?i.name:e.sku}`; }
function eventRows(limit=99){return state.events.slice(0,limit).map(e=>`<li><div class="event-icon ${safe(e.type)}">${eventIcon(e.type)}</div><div class="event-text"><strong>${safe(eventName(e))}</strong><small>${safe(e.from)} → ${safe(e.to)} · ${safe(e.at)} · ${safe(e.ref)}</small></div><span class="event-amount ${e.qty>=0?'plus':'minus'}">${e.qty>0?'+':''}${fmt(e.qty)}</span></li>`).join('');}

function overview(){
  const quantity=state.items.reduce((n,i)=>n+total(i),0);
  const low=state.items.filter(i=>LOCATIONS.some(l=>i.stock[l] < i.reorder/3)).length;
  const movements=state.events.length;
  const recent=state.events.filter(e=>e.type==='dispatch').length;
  const top=state.items.slice().sort((a,b)=>total(a)-total(b)).slice(0,5);
  return head('OPERATIONS DESK','Every item, accounted for.','A clear view of stock and movement across a distributed warehouse network.',action('receive','＋ Record receipt','accent')+action('dispatch','↗ Prepare dispatch'))+notice()+
  `<section class="hero"><div><div class="eyebrow">THE DAILY PICTURE</div><h2>Inventory decisions start with one reliable record.</h2><p>Move from handwritten entries to a shared view of receipts, releases, counts and location balances. This is a fictional interaction demo.</p><div class="hero-action">${action('inventory','Explore inventory')}</div></div><div class="hero-right"><small>ITEMS TRACKED</small><strong>${fmt(quantity)}</strong><span>Units across ${LOCATIONS.length} demo stores</span></div></section>`+
  `<section class="metrics"><div class="metric"><span class="label">Product lines</span><div class="number">${state.items.length}</div><div class="foot">Across ${LOCATIONS.length} locations</div></div><div class="metric"><span class="label">Units on hand</span><div class="number">${fmt(quantity)}</div><div class="foot good">Current simulated balance</div></div><div class="metric"><span class="label">Needs attention</span><div class="number">${low}</div><div class="foot warn">Low at one or more stores</div></div><div class="metric"><span class="label">Recorded movements</span><div class="number">${movements}</div><div class="foot">${recent} dispatch records</div></div></section>`+
  `<section class="grid-two"><div class="panel"><div class="panel-head"><div><h2>Stock snapshot</h2><p>Sorted by combined balance across locations</p></div><button class="text-button" data-nav="inventory">View all stock →</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>SKU</th><th>On hand</th><th>Status</th></tr></thead><tbody>${top.map(i=>`<tr><td><div class="item-name">${safe(i.name)}</div><div class="item-sub">${safe(i.category)}</div></td><td class="mono">${safe(i.sku)}</td><td><strong>${fmt(total(i))}</strong> <small>${safe(i.unit)}</small></td><td>${status(i,'All locations')}</td></tr>`).join('')}</tbody></table></div></div><div class="panel"><div class="panel-head"><div><h2>Recent movements</h2><p>Trace each recorded change</p></div><button class="text-button" data-nav="audit">Audit trail →</button></div><div class="panel-body"><ul class="list">${eventRows(4)}</ul></div></div></section>`+
  `<section class="feature-steps"><div class="step"><b>01 /</b><strong>Receive</strong><small>Record item, quantity, source and reference.</small></div><div class="step"><b>02 /</b><strong>Locate</strong><small>See stock by product and store.</small></div><div class="step"><b>03 /</b><strong>Move</strong><small>Transfer or dispatch with traceable entries.</small></div><div class="step"><b>04 /</b><strong>Reconcile</strong><small>Compare physical counts and export a view.</small></div></section>`;
}
function inventory(){
  const rows=state.items.filter(i=>(`${i.name} ${i.sku} ${i.category}`).toLowerCase().includes(searchText.toLowerCase()));
  return head('STOCK REGISTER','Inventory','Search products and compare quantities across stores.',action('receive','＋ Record receipt','accent')+action('counts','◎ Record count'))+notice()+
  `<div class="toolbar"><div class="search"><input class="input" id="inventory-search" aria-label="Search stock" placeholder="Search item, category or SKU" value="${safe(searchText)}"></div><select class="select" id="inventory-location" aria-label="Select location"><option ${selectedLocation==='All locations'?'selected':''}>All locations</option>${locationOptions(selectedLocation)}</select><button type="button" class="button" id="download-csv">↓ Export CSV</button></div>`+
  `<div class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>SKU</th><th>Location</th><th>On hand</th><th>Reorder guide</th><th>Stock signal</th></tr></thead><tbody>${rows.map(i=>`<tr><td><div class="item-name">${safe(i.name)}</div><div class="item-sub">${safe(i.category)}</div></td><td class="mono">${safe(i.sku)}</td><td>${safe(selectedLocation)}</td><td><strong>${fmt(selectedLocation==='All locations'?total(i):i.stock[selectedLocation])}</strong> <small>${safe(i.unit)}</small></td><td>${fmt(selectedLocation==='All locations'?i.reorder:Math.ceil(i.reorder/3))}</td><td>${status(i,selectedLocation)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No items match this search.</td></tr>'}</tbody></table></div></div><p class="help" style="margin-top:11px">The reorder guide is an illustrative threshold for this concept, not an approved operational rule.</p>`;
}
function formPage(type){
  const config={
    receive:{kicker:'INBOUND MOVEMENT',title:'Receive stock',subtitle:'Create a goods receipt and increase stock at the receiving store.',icon:'↙',intro:'Capture what arrived, where it was received, and the reference used to trace it.',action:'Record receipt'},
    dispatch:{kicker:'OUTBOUND MOVEMENT',title:'Dispatch stock',subtitle:'Release stock from a store to a distribution destination.',icon:'↗',intro:'Keep an accountable record of quantities released and the reason or destination.',action:'Record dispatch'},
    transfer:{kicker:'INTERNAL MOVEMENT',title:'Transfer stock',subtitle:'Move items between stores without changing the network total.',icon:'⇄',intro:'Preserve both source and destination balances with one linked transfer record.',action:'Record transfer'},
    counts:{kicker:'RECONCILIATION',title:'Stock count',subtitle:'Compare a physical count with the recorded balance.',icon:'◎',intro:'Enter an observed quantity. The difference becomes a traceable adjustment.',action:'Record count'}
  }[type];
  let locationFields='';
  if(type==='receive') locationFields=`<div class="field"><label for="location">Receiving store</label><select id="location" name="location" class="select" required>${locationOptions()}</select></div><div class="field"><label for="counterparty">Supplier / source</label><input id="counterparty" name="counterparty" class="input" placeholder="e.g. Approved supplier" required maxlength="70"></div>`;
  if(type==='dispatch') locationFields=`<div class="field"><label for="location">From store</label><select id="location" name="location" class="select" required>${locationOptions()}</select></div><div class="field"><label for="counterparty">Destination / programme</label><input id="counterparty" name="counterparty" class="input" placeholder="e.g. Field distribution" required maxlength="70"></div>`;
  if(type==='transfer') locationFields=`<div class="field"><label for="location">From store</label><select id="location" name="location" class="select" required>${locationOptions()}</select></div><div class="field"><label for="counterparty">To store</label><select id="counterparty" name="counterparty" class="select" required>${locationOptions()}</select></div>`;
  if(type==='counts') locationFields=`<div class="field"><label for="location">Counted store</label><select id="location" name="location" class="select" required>${locationOptions()}</select></div><div class="field"><label for="counterparty">Count note</label><input id="counterparty" name="counterparty" class="input" placeholder="e.g. Monthly physical check" required maxlength="70"></div>`;
  return head(config.kicker,config.title,config.subtitle,action('audit','≡ Review audit trail'))+notice()+`<section class="form-section"><div class="panel"><div class="panel-head"><div><h2>Movement record</h2><p>${safe(config.subtitle)}</p></div><span class="chip neutral">Demo action</span></div><div class="panel-body"><div class="form-intro"><span class="round">${config.icon}</span><div><strong>${safe(config.intro)}</strong><p>These controls update only fictional data saved in this browser.</p></div></div><form id="movement-form" data-type="${type}"><div class="form-grid"><div class="field"><label for="sku">Product</label><select id="sku" name="sku" class="select" required>${itemOptions()}</select></div><div class="field"><label for="quantity">${type==='counts'?'Observed quantity':'Quantity'}</label><input id="quantity" name="quantity" class="input" type="number" min="${type==='counts'?0:1}" step="1" placeholder="Enter a whole number" required></div>${locationFields}<div class="field full"><label for="reference">Document / transaction reference</label><input id="reference" name="reference" class="input" placeholder="e.g. ${type==='receive'?'GRN':type==='dispatch'?'DIS':type==='transfer'?'TRF':'CNT'}-2026-001" required maxlength="45"></div></div><div class="form-actions"><button class="button accent" type="submit">${safe(config.action)} →</button><button type="reset" class="button">Clear form</button></div></form><div class="notice">Prototype workflow only. A production system would add approvals, user permissions, documents, integrations and validation based on the actual solicitation.</div></div></div></section>`;
}
function reports(){
  const totals=LOCATIONS.map(l=>({location:l,units:state.items.reduce((n,i)=>n+i.stock[l],0)}));
  const max=Math.max(...totals.map(x=>x.units),1);
  const low=state.items.filter(i=>LOCATIONS.some(l=>i.stock[l]<i.reorder/3));
  return head('DECISION SUPPORT','Reports','Readable summaries for stock oversight and follow-up.',`<button type="button" id="download-csv" class="button">↓ Export stock CSV</button>`)+notice()+`<div class="status-strip"><strong>ⓘ</strong> Charts and counts are calculated from the fictional inventory in this browser.</div><section class="report-grid">${totals.map(x=>`<div class="report-card"><div class="eyebrow">LOCATION BALANCE</div><h3>${safe(x.location)}</h3><p>${fmt(x.units)} units currently recorded</p><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,x.units/max*100)}%"></div></div><small>${Math.round(x.units/Math.max(1,state.items.reduce((n,i)=>n+total(i),0))*100)}% of all units</small></div>`).join('')}</section><section class="grid-two" style="margin-top:18px"><div class="panel"><div class="panel-head"><div><h2>Attention list</h2><p>Products below the sample guide at any location</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Location</th><th>On hand</th><th>Guide</th></tr></thead><tbody>${low.flatMap(i=>LOCATIONS.filter(l=>i.stock[l]<i.reorder/3).map(l=>`<tr><td><strong>${safe(i.name)}</strong><div class="item-sub">${safe(i.sku)}</div></td><td>${safe(l)}</td><td>${fmt(i.stock[l])}</td><td>${Math.ceil(i.reorder/3)}</td></tr>`)).join('')||'<tr><td colspan="4" class="empty">No items below the sample guide.</td></tr>'}</tbody></table></div></div><div class="panel"><div class="panel-head"><div><h2>Movement mix</h2><p>Activity logged in this demo</p></div></div><div class="panel-body"><ul class="list">${['receipt','dispatch','transfer','count'].map(t=>`<li><div class="event-icon ${t}">${eventIcon(t)}</div><div class="event-text"><strong>${({receipt:'Receipts',dispatch:'Dispatches',transfer:'Transfers',count:'Stock counts'})[t]}</strong><small>${state.events.filter(e=>e.type===t).length} records</small></div></li>`).join('')}</ul></div></div></section>`;
}
function audit(){return head('TRACEABILITY','Audit trail','Every simulated stock change leaves a visible record.',`<button type="button" class="button" id="reset-demo">↺ Reset demo data</button>`)+notice()+`<div class="status-strip"><strong>ⓘ</strong> This browser-only prototype records action, product, quantity, stores, reference and time. Production audit controls would be defined by DRC.</div><div class="panel"><div class="panel-head"><div><h2>Movement history</h2><p>Newest entries first</p></div><span class="chip neutral">${state.events.length} records</span></div>${state.events.map(e=>`<div class="audit-row"><small>${safe(e.at)}</small><span class="chip ${e.type==='dispatch'?'warn':e.type==='count'?'neutral':'good'}">${safe(e.type)}</span><div><strong>${safe(eventName(e))}</strong><div class="item-sub">${safe(e.from)} → ${safe(e.to)} · ${safe(e.ref)} · ${e.qty>0?'+':''}${fmt(e.qty)}</div></div><small class="audit-actor">${safe(e.actor)}</small></div>`).join('')}</div>`;}
function render(){renderNav();const views={overview,inventory,receive:()=>formPage('receive'),dispatch:()=>formPage('dispatch'),transfer:()=>formPage('transfer'),counts:()=>formPage('counts'),reports,audit};$('#main').innerHTML=views[page]();}
function log(type,sku,qty,from,to,ref){state.events.unshift({type,sku,qty,from,to,ref,actor:'Demo operator',at:now()});store();}

document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
  if(e.target.closest('#menu-toggle')){$('.sidebar').classList.toggle('open');return;}
  if(e.target.closest('#download-csv')){
    const rows=[['SKU','Item','Category','Unit','Central Store','North Field','South Field','Total']];
    state.items.forEach(i=>rows.push([i.sku,i.name,i.category,i.unit,...LOCATIONS.map(l=>i.stock[l]),total(i)]));
    const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='field-ledger-demo-stock.csv';a.click();URL.revokeObjectURL(url);return;
  }
  if(e.target.closest('#reset-demo')){state=clone(SAMPLE);store();show('success','Sample inventory and audit history restored.');}
});
document.addEventListener('input',e=>{if(e.target.id==='inventory-search'){searchText=e.target.value;const cursor=e.target.selectionStart;render();const field=$('#inventory-search');field.focus();field.setSelectionRange(cursor,cursor);}});
document.addEventListener('change',e=>{if(e.target.id==='inventory-location'){selectedLocation=e.target.value;render();}});
document.addEventListener('submit',e=>{
  if(e.target.id!=='movement-form')return;e.preventDefault();
  const form=e.target,type=form.dataset.type,data=new FormData(form),sku=String(data.get('sku')),item=itemFor(sku),place=String(data.get('location')),other=String(data.get('counterparty')).trim(),ref=String(data.get('reference')).trim(),n=Number(data.get('quantity'));
  if(!item||!LOCATIONS.includes(place)||!other||!ref||!Number.isInteger(n)||n<(type==='counts'?0:1)){show('error','Complete all fields with a valid whole number.');return;}
  if(type==='receive'){item.stock[place]+=n;log('receipt',sku,n,other,place,ref);show('success',`${fmt(n)} ${item.unit} of ${item.name} received at ${place}.`);return;}
  if(type==='dispatch'){if(n>item.stock[place]){show('error',`Only ${fmt(item.stock[place])} ${item.unit} are available at ${place}.`);return;}item.stock[place]-=n;log(type,sku,-n,place,other,ref);show('success',`${fmt(n)} ${item.unit} dispatched from ${place}.`);return;}
  if(type==='transfer'){if(!LOCATIONS.includes(other)||other===place){show('error','Choose a different destination store.');return;}if(n>item.stock[place]){show('error',`Only ${fmt(item.stock[place])} ${item.unit} are available at ${place}.`);return;}item.stock[place]-=n;item.stock[other]+=n;log(type,sku,n,place,other,ref);show('success',`${fmt(n)} ${item.unit} transferred from ${place} to ${other}.`);return;}
  if(type==='counts'){const diff=n-item.stock[place];item.stock[place]=n;log('count',sku,diff,place,place,ref);show('success',`Physical count recorded for ${item.name} at ${place}. Difference: ${diff>0?'+':''}${fmt(diff)}.`);}
});
render();
