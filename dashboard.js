
function parseISO(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return weekNo;
}
function getQuarter(d) {
  return Math.floor(d.getMonth()/3) + 1;
}
function weekdayNum(d) {
  return d.getDay(); // 0=zo ... 6=za
}

function loadAllWeeksIntoSelect(data) {
  const uniqueWeeks = new Set();
  data.forEach(item => {
    const d = parseISO(item.datum);
    if (d) uniqueWeeks.add(getISOWeek(d));
  });
  const weeks = Array.from(uniqueWeeks).sort((a,b)=>a-b);
  const sel = document.getElementById('filterWeek');
  weeks.forEach(w => {
    const opt = document.createElement('option');
    opt.value = String(w);
    opt.textContent = w;
    sel.appendChild(opt);
  });
}

function loadData() {
  // Combine active entries and archived weeks into one dataset for view
  const active = JSON.parse(localStorage.getItem('urenregistratie')) || [];
  const archives = JSON.parse(localStorage.getItem('uren_archief')) || [];
  const archived = archives.flatMap(w => w.data || []);
  const all = [...active, ...archived];
  loadAllWeeksIntoSelect(all);
  renderTable(all);
  return all;
}

function renderTable(rows) {
  const tbody = document.getElementById('dashboardBody');
  tbody.innerHTML = '';
  let total = 0;

  rows.forEach(item => {
    const d = parseISO(item.datum);
    const week = d ? getISOWeek(d) : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.datum || ''}</td>
      <td>${item.start || ''}</td>
      <td>${item.eind || ''}</td>
      <td>${item.project || ''}</td>
      <td>${parseFloat(item.uren || 0).toFixed(2)}</td>
      <td>${week}</td>
    `;
    total += parseFloat(item.uren || 0);
    tbody.appendChild(tr);
  });
  document.getElementById('totaalUren').textContent = total.toFixed(2);

  // Average for selected weekday (if any)
  const wdSel = document.getElementById('filterWeekday').value;
  if (wdSel === '') {
    document.getElementById('avgWeekday').textContent = '-';
  } else {
    const wd = parseInt(wdSel, 10);
    const wdRows = rows.filter(r => {
      const d = parseISO(r.datum);
      return d && weekdayNum(d) === wd;
    });
    const sum = wdRows.reduce((acc, r) => acc + parseFloat(r.uren || 0), 0);
    const avg = wdRows.length ? sum / wdRows.length : 0;
    document.getElementById('avgWeekday').textContent = avg.toFixed(2);
  }
}

function applyFilters() {
  const dateVal = document.getElementById('filterDate').value;
  const projVal = document.getElementById('filterProject').value;
  const weekVal = document.getElementById('filterWeek').value;
  const qVal = document.getElementById('filterQuarter').value;
  const wdVal = document.getElementById('filterWeekday').value;

  const active = JSON.parse(localStorage.getItem('urenregistratie')) || [];
  const archives = JSON.parse(localStorage.getItem('uren_archief')) || [];
  const archived = archives.flatMap(w => w.data || []);
  const all = [...active, ...archived];

  const filtered = all.filter(item => {
    const d = parseISO(item.datum);
    const okDate = !dateVal || item.datum === dateVal;
    const okProj = !projVal || item.project === projVal;
    const okWeek = !weekVal || (d && String(getISOWeek(d)) === weekVal);
    const okQuarter = !qVal || (d && String(getQuarter(d)) === qVal);
    const okWeekday = !wdVal || (d && String(weekdayNum(d)) === wdVal);
    return okDate && okProj && okWeek && okQuarter && okWeekday;
  });

  renderTable(filtered);
}

function resetFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterProject').value = '';
  document.getElementById('filterWeek').value = '';
  document.getElementById('filterQuarter').value = '';
  document.getElementById('filterWeekday').value = '';
  loadData();
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
  document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
});
