import { inizializzaAuth, eseguiLogin, eseguiLogout } from './admin-auth.js';
import { applicaFiltri } from './admin-filters.js';
import { segnaComePresiInCarico } from './admin-table.js';
import { esportaDettaglioBotteghe, esportaTotaliFornitore } from './admin-export.js';

document.addEventListener('DOMContentLoaded', () => {
  inizializzaAuth();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      eseguiLogin(email, password);
    });
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', eseguiLogout);
  }

  const filterCategoria = document.getElementById('filter-categoria');
  const searchCliente = document.getElementById('search-cliente');
  if (filterCategoria) filterCategoria.addEventListener('change', applicaFiltri);
  if (searchCliente) searchCliente.addEventListener('input', applicaFiltri);

  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.order-checkbox');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
  }

  const btnMarkDownloaded = document.getElementById('btn-mark-downloaded');
  if (btnMarkDownloaded) btnMarkDownloaded.addEventListener('click', segnaComePresiInCarico);

  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) btnExportCsv.addEventListener('click', esportaDettaglioBotteghe);

  const btnExportSummary = document.getElementById('btn-export-summary');
  if (btnExportSummary) btnExportSummary.addEventListener('click', esportaTotaliFornitore);
});
