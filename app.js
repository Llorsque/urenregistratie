
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
