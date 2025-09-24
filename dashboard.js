
window.onload = loadData;

function loadData() {
  const data = JSON.parse(localStorage.getItem('urenregistratie')) || [];
  renderTable(data);
}

function renderTable(data) {
  const tbody = document.getElementById('dashboardBody');
  tbody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.datum}</td>
      <td>${item.start}</td>
      <td>${item.eind}</td>
      <td>${item.project}</td>
      <td>${item.uren}</td>
    `;
    tbody.appendChild(row);
  });
}

function applyFilters() {
  const filterDate = document.getElementById('filterDate').value;
  const filterProject = document.getElementById('filterProject').value.toLowerCase();
  const data = JSON.parse(localStorage.getItem('urenregistratie')) || [];

  const filtered = data.filter(item => {
    return (!filterDate || item.datum === filterDate) &&
           (!filterProject || item.project.toLowerCase().includes(filterProject));
  });

  renderTable(filtered);
}

function resetFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterProject').value = '';
  loadData();
}
