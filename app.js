
// --- Helpers ---
function createProjectSelect(value="") {
  const html = `<select>
    <option value="">Selecteer...</option>
    <option value="Opsterland">Opsterland</option>
    <option value="Weststellingwerf">Weststellingwerf</option>
    <option value="CO Algemeen">CO Algemeen</option>
    <option value="Team Opwest">Team Opwest</option>
    <option value="Overig">Overig</option>
  </select>`;
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  const el = temp.firstChild;
  el.value = value;
  return el;
}

function addRow(prefill={}) {
  const tbody = document.getElementById('urenBody');
  const row = document.createElement('tr');

  const tdDate = document.createElement('td');
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  if (prefill.datum) dateInput.value = prefill.datum;
  dateInput.addEventListener('change', () => { updateHours(row); saveData(); maybeAddAutoRow(); });
  tdDate.appendChild(dateInput);

  const tdStart = document.createElement('td');
  const startInput = document.createElement('input');
  startInput.type = 'time';
  if (prefill.start) startInput.value = prefill.start;
  startInput.addEventListener('change', () => { updateHours(row); saveData(); maybeAddAutoRow(); });
  tdStart.appendChild(startInput);

  const tdEnd = document.createElement('td');
  const endInput = document.createElement('input');
  endInput.type = 'time';
  if (prefill.eind) endInput.value = prefill.eind;
  endInput.addEventListener('change', () => { updateHours(row); saveData(); maybeAddAutoRow(); });
  tdEnd.appendChild(endInput);

  const tdProj = document.createElement('td');
  const projSelect = createProjectSelect(prefill.project || "");
  projSelect.addEventListener('change', () => { saveData(); });
  tdProj.appendChild(projSelect);

  const tdHours = document.createElement('td');
  tdHours.className = 'workedHours';
  tdHours.textContent = prefill.uren ? Number(prefill.uren).toFixed(2) : '0.00';

  const tdRemove = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Verwijder';
  delBtn.addEventListener('click', () => { row.remove(); saveData(); });
  tdRemove.appendChild(delBtn);

  row.appendChild(tdDate);
  row.appendChild(tdStart);
  row.appendChild(tdEnd);
  row.appendChild(tdProj);
  row.appendChild(tdHours);
  row.appendChild(tdRemove);

  tbody.appendChild(row);
}

function updateHours(row) {
  const start = row.children[1].querySelector('input').value;
  const end = row.children[2].querySelector('input').value;
  if (start && end) {
    const s = new Date(`1970-01-01T${start}:00`);
    const e = new Date(`1970-01-01T${end}:00`);
    let diff = (e - s) / 36e5;
    if (diff < 0) diff += 24;
    row.querySelector('.workedHours').textContent = (isFinite(diff) ? diff : 0).toFixed(2);
  }
}

function saveData() {
  const rows = Array.from(document.querySelectorAll('#urenBody tr'));
  const data = rows.map(row => ({
    datum: row.children[0].querySelector('input').value,
    start: row.children[1].querySelector('input').value,
    eind: row.children[2].querySelector('input').value,
    project: row.children[3].querySelector('select').value,
    uren: row.children[4].textContent
  })).filter(r => r.datum || r.start || r.eind || r.project);
  localStorage.setItem('urenregistratie', JSON.stringify(data));
}

function getCurrentWeek() {
  const today = new Date();
  const jan1 = new Date(today.getFullYear(), 0, 1);
  const dayMs = 24*60*60*1000;
  const days = Math.floor((today - jan1) / dayMs);
  return Math.ceil(((jan1.getDay() + 1) + days) / 7);
}

function closeWeek() {
  const data = JSON.parse(localStorage.getItem('urenregistratie')) || [];
  if (!data.length) { alert('Er zijn geen gegevens om op te slaan.'); return; }
  const weekNumber = getCurrentWeek();
  const key = `uren_week_${weekNumber}_${new Date().getFullYear()}`;
  const archives = JSON.parse(localStorage.getItem('uren_archief')) || [];
  archives.push({ key, data, closedAt: new Date().toISOString() });
  localStorage.setItem('uren_archief', JSON.stringify(archives));
  localStorage.removeItem('urenregistratie');
  document.getElementById('urenBody').innerHTML = '';
  for (let i=0;i<5;i++) addRow(); // reset 5 lege rijen
  alert(`Week ${weekNumber} opgeslagen als ${key}`);
}

function maybeAddAutoRow() {
  const rows = document.querySelectorAll('#urenBody tr');
  if (!rows.length) return;
  const last = rows[rows.length - 1];
  const hasValues = Array.from(last.querySelectorAll('input, select')).some(el => el.value);
  if (hasValues && rows.length < 1000) addRow(); // auto add
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addRowBtn').addEventListener('click', () => { addRow(); saveData(); });
  document.getElementById('closeWeekBtn').addEventListener('click', closeWeek);

  const existing = JSON.parse(localStorage.getItem('urenregistratie')) || [];
  if (existing.length) {
    existing.forEach(entry => addRow(entry));
  } else {
    for (let i=0;i<5;i++) addRow();
  }
});
