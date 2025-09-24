// --- Dashboard logic ---
function qs(s,ctx=document){return ctx.querySelector(s)}
function qsa(s,ctx=document){return Array.from(ctx.querySelectorAll(s))}
function parseISO(d){const x=new Date(d); return isNaN(x)?null:x}
function getISOWeek(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return weekNo;
}
function getQuarter(d){ return Math.floor(d.getMonth()/3)+1 }
function monthLabel(d){ return d.toLocaleString('nl-NL', { month: 'long', year: 'numeric' }) }

function loadAllData(){
  const active = JSON.parse(localStorage.getItem('urenregistratie')||'[]');
  const archives = JSON.parse(localStorage.getItem('uren_archief')||'[]');
  const archived = archives.flatMap(w => w.data || []);
  return { active, archives, all: [...active, ...archived] };
}

function renderWeeksSelect(rows){
  const weeks = new Set();
  rows.forEach(r=>{const d=parseISO(r.datum); if(d) weeks.add(getISOWeek(d))});
  const sel = qs('#filterWeek');
  sel.innerHTML = '<option value=\"\">Alle</option>' + Array.from(weeks).sort((a,b)=>a-b).map(w=>`<option value=\"${w}\">${w}</option>`).join('');
}

function renderTable(rows){
  const tbody = qs('#dashboardBody'); tbody.innerHTML='';
  let total = 0;
  rows.forEach(r=>{
    const d=parseISO(r.datum); const w=d?getISOWeek(d):'';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${r.datum||''}</td><td>${r.start||''}</td><td>${r.eind||''}</td><td>${r.project||''}</td><td class="right">${(+r.uren||0).toFixed(2)}</td><td>${w}</td>`;
    tbody.appendChild(tr);
    total += (+r.uren||0);
  });
  qs('#totaalUren').textContent = total.toFixed(2);
  qs('#rowCount').textContent = rows.length;
  const wdSel = qs('#filterWeekday').value;
  if(wdSel===''){ qs('#avgWeekday').textContent='-'; }
  else{
    const wd = parseInt(wdSel,10);
    const subset = rows.filter(r=>{const d=parseISO(r.datum); return d && d.getDay()===wd});
    const avg = subset.length ? subset.reduce((a,b)=>a+(+b.uren||0),0)/subset.length : 0;
    qs('#avgWeekday').textContent = avg.toFixed(2);
  }
}

function groupBy(arr, keyFn){
  return arr.reduce((acc, item)=>{
    const k = keyFn(item);
    acc[k] = (acc[k]||0) + (+item.uren||0);
    return acc;
  }, {});
}

function renderSums(rows){
  // per project
  const byProject = groupBy(rows, r=>r.project||'Onbekend');
  qs('#sumPerProject').innerHTML = Object.entries(byProject).sort().map(([k,v])=>`<tr><td>${k}</td><td class="right">${v.toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
  // per maand
  const byMonth = groupBy(rows, r=>{const d=parseISO(r.datum); return d?monthLabel(d):'—'});
  qs('#sumPerMonth').innerHTML = Object.entries(byMonth).sort().map(([k,v])=>`<tr><td>${k}</td><td class="right">${v.toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
  // per week
  const byWeek = groupBy(rows, r=>{const d=parseISO(r.datum); return d?`W${getISOWeek(d)}`:'—'});
  qs('#sumPerWeek').innerHTML = Object.entries(byWeek).sort((a,b)=>a[0].localeCompare(b[0], 'nl',{numeric:true})).map(([k,v])=>`<tr><td>${k}</td><td class="right">${v.toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="2">—</td></tr>';
}

function applyFilters(all){
  const dateVal = qs('#filterDate').value;
  const projVal = qs('#filterProject').value;
  const weekVal = qs('#filterWeek').value;
  const qVal = qs('#filterQuarter').value;
  const wdVal = qs('#filterWeekday').value;

  const filtered = all.filter(item=>{
    const d=parseISO(item.datum);
    const okDate = !dateVal || item.datum===dateVal;
    const okProj = !projVal || item.project===projVal;
    const okWeek = !weekVal || (d && String(getISOWeek(d))===weekVal);
    const okQuarter = !qVal || (d && String(getQuarter(d))===qVal);
    const okWeekday = !wdVal || (d && String(d.getDay())===wdVal);
    return okDate && okProj && okWeek && okQuarter && okWeekday;
  });

  renderTable(filtered);
  renderSums(filtered);
  return filtered;
}

function exportCSV(filename, rows){
  const headers=['Datum','Start','Eind','Project','Uren'];
  const lines=[headers.join(',')];
  rows.forEach(r=>{
    const line=[r.datum,r.start,r.eind,r.project,r.uren].map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(',');
    lines.push(line);
  });
  const blob=new Blob([lines.join('\\n')],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

function renderArchiveList(archives){
  const box = qs('#archiveList'); box.innerHTML='';
  if(!archives.length){ box.innerHTML = '<div class="meta">Nog geen afgesloten weken.</div>'; return; }
  archives.forEach(w=>{
    const total = (w.data||[]).reduce((a,b)=>a+(+b.uren||0),0).toFixed(2);
    const el = document.createElement('div');
    el.className='archive-item';
    el.innerHTML = `<div><strong>${w.key}</strong><div class="meta">Gesloten: ${new Date(w.closedAt).toLocaleString('nl-NL')}</div></div>
                    <div>
                      <button class="btn" data-k="${w.key}" data-act="export">⬇︎ CSV</button>
                      <button class="btn subtle" data-k="${w.key}" data-act="restore">↩︎ Heropen</button>
                      <span class="meta">Totaal: ${total} u</span>
                    </div>`;
    box.appendChild(el);
  });

  box.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const key = btn.dataset.k; const act = btn.dataset.act;
    const archives = JSON.parse(localStorage.getItem('uren_archief')||'[]');
    const w = archives.find(x=>x.key===key);
    if(!w) return;
    if(act==='export'){ exportCSV(`${key}.csv`, w.data||[]); }
    if(act==='restore'){
      localStorage.setItem('urenregistratie', JSON.stringify(w.data||[]));
      alert(`Week ${key} naar 'actief' gezet. Ga naar invoerpagina om te bewerken.`);
    }
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const {{ all, archives }} = loadAllData();
  renderWeeksSelect(all);
  renderTable(all);
  renderSums(all);
  renderArchiveList(archives);

  qs('#applyFiltersBtn').addEventListener('click', ()=>{
    const all = loadAllData().all;
    applyFilters(all);
  });
  qs('#resetFiltersBtn').addEventListener('click', ()=>{
    qsa('select,input[type="date"]','.filters').forEach(el=>el.value='');
    const all = loadAllData().all;
    renderWeeksSelect(all);
    renderTable(all);
    renderSums(all);
  });

  qs('#exportViewBtn').addEventListener('click', ()=>{
    const all = loadAllData().all;
    const view = applyFilters(all);
    exportCSV('uren_dashboard_zicht.csv', view);
  });
  qs('#exportAllBtn').addEventListener('click', ()=>{
    const all = loadAllData().all;
    exportCSV('uren_dashboard_alles.csv', all);
  });
  qs('#printBtn').addEventListener('click', ()=>{ window.print(); });
});
