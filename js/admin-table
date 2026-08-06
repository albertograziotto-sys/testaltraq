import { supabaseClient } from './config.js';
import { AdminState } from './admin-state.js';

export async function fetchCategorie() {
  const filterCategoria = document.getElementById('filter-categoria');
  const { data, error } = await supabaseClient
    .from('categorie')
    .select('id_categoria, nome_categoria')
    .order('nome_categoria');

  if (error) return;

  filterCategoria.innerHTML = '<option value="">Tutti i moduli</option>';
  data.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id_categoria;
    option.textContent = cat.nome_categoria;
    filterCategoria.appendChild(option);
  });
}

export async function fetchOrdini() {
  const tableBody = document.getElementById('orders-table-body');
  tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><span class="spinner-border spinner-border-sm text-brand"></span> Caricamento ordini in corso...</td></tr>';

  const { data, error } = await supabaseClient
    .from('ordini_testata')
    .select(`
      id_ordine,
      data_ordine,
      flag_scaricato,
      id_categoria,
      clienti ( ragione_sociale ),
      botteghe ( nome_bottega ),
      categorie ( nome_categoria )
    `)
    .eq('flag_scaricato', false)
    .order('data_ordine', { ascending: false });

  if (error) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Errore nel caricamento dei dati.</td></tr>';
    return;
  }

  AdminState.ordiniCorrenti = data;
  renderTabella(AdminState.ordiniCorrenti);
}

export function renderTabella(ordini) {
  const tableBody = document.getElementById('orders-table-body');
  tableBody.innerHTML = '';
  
  document.getElementById('select-all').checked = false;
  
  if (ordini.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nessun ordine trovato.</td></tr>';
    return;
  }

  ordini.forEach(ordine => {
    const dataFormattata = new Date(ordine.data_ordine).toLocaleDateString('it-IT');
    const clienteNome = ordine.clienti ? ordine.clienti.ragione_sociale : 'Sconosciuto';
    const bottegaNome = ordine.botteghe ? ordine.botteghe.nome_bottega : 'Sconosciuta';
    const categoriaNome = ordine.categorie ? ordine.categorie.nome_categoria : 'Sconosciuto';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="order-checkbox form-check-input" value="${ordine.id_ordine}"></td>
      <td>${dataFormattata}</td>
      <td><strong>${clienteNome}</strong></td>
      <td>${bottegaNome}</td>
      <td><span class="badge bg-secondary">${categoriaNome}</span></td>
      <td><span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> In Attesa</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

export async function segnaComePresiInCarico() {
  const checkboxes = document.querySelectorAll('.order-checkbox:checked');
  const ordiniSelezionati = Array.from(checkboxes).map(cb => cb.value);

  if (ordiniSelezionati.length === 0) {
    alert("Seleziona almeno un ordine da prendere in carico.");
    return;
  }

  const conferma = confirm(`Stai per segnare ${ordiniSelezionati.length} ordini come presi in carico. Procedere?`);
  if (!conferma) return;

  const btn = document.getElementById('btn-mark-downloaded');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Aggiornamento...';
  btn.disabled = true;

  const { error } = await supabaseClient
    .from('ordini_testata')
    .update({ flag_scaricato: true })
    .in('id_ordine', ordiniSelezionati);

  if (error) {
    alert("Errore durante l'aggiornamento: " + error.message);
  } else {
    await fetchOrdini(); 
  }

  btn.innerHTML = originalText;
  btn.disabled = false;
}
