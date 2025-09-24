// Urenregistratie logic (with archive + sync)
function qs(sel, ctx=document){ return ctx.querySelector(sel); }
function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }

function createProjectSelect(value=""){
  const html = `<select>
    <option value="">Selecteer...</option>
    <option value="Opsterland">Opsterland</option>
    <option value="Weststellingwerf">Weststellingwerf</option>
    <option value="CO Algemeen">CO Algemeen</option>
    <option value="Team Opwest">Team Opwest</option>
    <option value="Overig">Overig</option>
  </select>`;
  const temp = document.createElement('div'); temp.innerHTML = html.trim();
  const el = temp.firstChild; el.value = value; return el;
}

function addRow(prefill={}){
  const tbody = qs('#urenBody');
  const tr = document.createElement('tr');

  const tdDate = document.createElement('td');
  const date = document.createElement('input'); date.type='date'; if(prefill.datum) date.value=prefill.datum;
  tdDate.appendChild(date);

  const tdStart = document.createElement('td');
  const start = document.createElement('input'); start.type='time'; if(prefill.start) start.value=prefill.start;
  tdStart.appendChild(start);

  const tdEnd = document.createElement('td');
  const end = document.createElement('input'); end.type='time'; if(prefill.eind) end.value=prefill.eind;
  tdEnd.appendChild(end);

  const tdProj = document.createElement('td');
  const proj = createProjectSelect(prefill.project||""); tdProj.appendChild(proj);

  const tdHours = document.createElement('td'); tdHours.className='right workedHours'; tdHours.textContent=(+prefill.uren||0).toFixed(2);

  const tdDel = document.createElement('td');
  const del = document.createElement('button'); del.className='btn subtle'; del.textContent='Verwijder';
  del.addEventListener('click', ()=>{ tr.remove(); saveData(); });
  tdDel.appendChild(del);

  [date,start,end,proj].forEach(el=>{
    el.addEventListener('change', ()=>{ updateHours(tr); saveData(); maybeAddAutoRow(); });
  });

  tr.append(tdDate, tdStart, tdEnd, tdProj, tdHours, tdDel);
  tbody.appendChild(tr);
}

function updateHours(tr){
  const s = tr.children[1].querySelector('input').value;
  const e = tr.children[2].querySelector('input').value;
  if(!s || !e) return;
  const start = new Date(`1970-01-01T${s}:00`);
  const end = new Date(`1970-01-01T${e}:00`);
  let diff = (end - start) / 36e5; if(diff < 0) diff += 24;
  tr.querySelector('.workedHours').textContent = (isFinite(diff)?diff:0).toFixed(2);
}

function saveData(){
  const rows = qsa('#urenBody tr').map(tr=>({
    datum: tr.children[0].querySelector('input').value,
    start: tr.children[1].querySelector('input').value,
    eind: tr.children[2].querySelector('input').value,
    project: tr.children[3].querySelector('select').value,
    uren: tr.children[4].textContent
  })).filter(r => r.datum || r.start || r.eind || r.project);
  localStorage.setItem('urenregistratie', JSON.stringify(rows));
  localStorage.setItem('uren_last_updated', String(Date.now()));
}

function getISOWeek(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

function closeWeek(){
  const data = JSON.parse(localStorage.getItem('urenregistratie')||'[]');
  if(!data.length){ alert('Geen gegevens om op te slaan.'); return; }
  const today = new Date();
  const key = `uren_week_${getISOWeek(today)}_${today.getFullYear()}`;
  const archives = JSON.parse(localStorage.getItem('uren_archief')||'[]');
  archives.push({ key, data, closedAt: new Date().toISOString() });
  localStorage.setItem('uren_archief', JSON.stringify(archives));
  localStorage.removeItem('urenregistratie');
  localStorage.setItem('uren_last_updated', String(Date.now())); // trigger dashboards
  // Reset UI
  qs('#urenBody').innerHTML='';
  for(let i=0;i<5;i++) addRow();
  // Ga direct naar dashboard
  window.location.href = 'dashboard.html?refresh=1';
}

function exportCSV(filename, rows){
  const headers = ['Datum','Start','Eind','Project','Uren'];
  const lines = [headers.join(',')];
  rows.forEach(r=>{
    const line = [r.datum,r.start,r.eind,r.project,r.uren].map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(',');
    lines.push(line);
  });
  const blob = new Blob([lines.join('\\n')], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function exportActive(){
  const active = JSON.parse(localStorage.getItem('urenregistratie')||'[]');
  exportCSV('uren_actief.csv', active);
}

function maybeAddAutoRow(){
  const rows = qsa('#urenBody tr');
  if(!rows.length) return;
  const last = rows[rows.length-1];
  const hasValue = qsa('input,select', last).some(el=>el.value);
  if(hasValue) addRow();
}

document.addEventListener('DOMContentLoaded', ()=>{
  qs('#addRowBtn').addEventListener('click', ()=>{ addRow(); saveData(); });
  qs('#closeWeekBtn').addEventListener('click', closeWeek);
  qs('#exportActiveBtn').addEventListener('click', exportActive);

  const existing = JSON.parse(localStorage.getItem('urenregistratie')||'[]');
  if(existing.length) existing.forEach(addRow); else for(let i=0;i<5;i++) addRow();
});
