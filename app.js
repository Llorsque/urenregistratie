
document.getElementById('addRowBtn').addEventListener('click', addRow);

function addRow() {
  const tbody = document.getElementById('urenBody');
  const row = document.createElement('tr');

  row.innerHTML = `
    <td><input type="date" onchange="updateHours(this)" /></td>
    <td><input type="time" onchange="updateHours(this)" /></td>
    <td><input type="time" onchange="updateHours(this)" /></td>
    <td><input type="text" placeholder="Projectnaam" /></td>
    <td class="workedHours">0</td>
    <td><button onclick="removeRow(this)">Verwijder</button></td>
  `;

  tbody.appendChild(row);
}

function removeRow(button) {
  const row = button.closest('tr');
  row.remove();
}

function updateHours(element) {
  const row = element.closest('tr');
  const startInput = row.children[1].children[0].value;
  const endInput = row.children[2].children[0].value;

  if (startInput && endInput) {
    const start = new Date('1970-01-01T' + startInput + ':00');
    const end = new Date('1970-01-01T' + endInput + ':00');

    let diff = (end - start) / 1000 / 60 / 60; // uren
    if (diff < 0) diff += 24;

    row.querySelector('.workedHours').innerText = diff.toFixed(2);
  }
}


function saveData() {
  const rows = document.querySelectorAll('#urenBody tr');
  const data = [];

  rows.forEach(row => {
    const datum = row.children[0].children[0].value;
    const start = row.children[1].children[0].value;
    const eind = row.children[2].children[0].value;
    const project = row.children[3].children[0].value;
    const uren = row.children[4].innerText;

    if (datum && start && eind && project) {
      data.push({ datum, start, eind, project, uren });
    }
  });

  localStorage.setItem('urenregistratie', JSON.stringify(data));
}

// Automatisch opslaan bij wijziging
document.getElementById('urenTabel').addEventListener('change', saveData);


document.getElementById('closeWeekBtn').addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem('urenregistratie')) || [];

  if (data.length === 0) {
    alert('Er zijn geen gegevens om op te slaan.');
    return;
  }

  const weekNumber = getCurrentWeek();
  const archiveKey = `uren_week_${weekNumber}_${new Date().getFullYear()}`;

  let archives = JSON.parse(localStorage.getItem('uren_archief')) || [];
  archives.push({ key: archiveKey, data });
  localStorage.setItem('uren_archief', JSON.stringify(archives));

  localStorage.removeItem('urenregistratie');
  document.getElementById('urenBody').innerHTML = '';
  alert(`Week ${weekNumber} is succesvol opgeslagen.`);
});

function getCurrentWeek() {
  const today = new Date();
  const oneJan = new Date(today.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((today - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((today.getDay() + 1 + numberOfDays) / 7);
}
