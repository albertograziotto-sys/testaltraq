import { supabaseClient } from './config.js';
import { AdminState } from './admin-state.js';

export async function fetchCategorie() {
  const filterCategoria = document.getElementById('filter-categoria');
  const { data, error } = await supabaseClient
    .from('categorie')
    .select('id_categoria, nome_categoria')
    .order('nome_categoria');

  if (error) {
    console.error("Errore fetchCategorie:", error);
    return;
  }

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

  // Tentativo 1: Query diretta con relazioni JOIN
  let { data, error } = await supabaseClient
    .from('ordini_testata')
    .select(`
      id_ordine,
      data_ordine,
      flag_scaricato,
      id_categoria,
      id_cliente,
      id_bottega,
      clienti ( ragione_sociale ),
      botteghe ( nome_bottega ),
      categorie ( nome_categoria )
    `)
    .eq('flag_scaricato', false)
    .order('data_ordine', { ascending: false });

  // Tentativo 2 (Fallback): Se la JOIN fallisce per vincoli schema cache, eseguiamo il mapping manuale
  if (error) {
    console.warn("Query JOIN diretta fallita, attivazione fallback manuale:", error.message);

    const { data: rawTestate, error: errTestate } = await supabaseClient
      .from('ordini_testata')
      .select('*')
      .eq('flag_scaricato', false)
      .order('data_ordine', { ascending: false });

    if (errTestate) {
      console.error("Errore definitivo fetch testate:", errTestate);
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Errore caricamento: ${errTestate.message}</td></tr>`;
      return;
    }

    const { data: clientiData } = await supabaseClient.from('clienti').select('id, ragione_sociale');
    const { data: bottegheData } = await supabaseClient.from('botteghe').select('id_bottega, nome_bottega');
    const { data: categorieData } = await supabaseClient.from('categorie').select('id_categoria, nome_categoria');

    const clientiMap = Object.fromEntries((clientiData || []).map(c => [c.id, c.ragione_sociale]));
    const bottegheMap = Object.fromEntries((bottegheData || []).map(b => [b.id_bottega, b.nome_bottega]));
    const categorieMap = Object.fromEntries((categorieData || []).map(c => [c.id_categoria, c.nome_categoria]));

    data = (rawTestate || []).map(t => ({
      ...t,
      clienti: { ragione_sociale: clientiMap[t.id_cliente] || 'Sconosciuto' },
      botteghe: { nome_bottega: bottegheMap[t.id_bottega] || 'Sconosciuta' },
      categorie: { nome_categoria: categorieMap[t.id_categoria] || 'Sconosciuto' }
    }));
  }

  AdminState.ordiniCorrenti = data || [];
  renderTabella(AdminState.ordiniCorrenti);
}

export function renderTabella(ordini) {
  const tableBody = document.getElementById('orders-table-body');
  tableBody.innerHTML = '';
  
  const selectAll = document.getElementById('select-all');
  if (selectAll) selectAll.checked = false;
  
  if (!ordini || ordini.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nessun ordine trovato.</td></tr>';
    return;
  }

  ordini.forEach(ordine => {
    const dataFormattata = ordine.data_ordine ? new Date(ordine.data_ordine).toLocaleDateString('it-IT') : '-';
    
    // Gestione sicura per relazioni ritornate come Oggetto o come Array
    const clienteObj = Array.isArray(ordine.clienti) ? ordine.clienti[0] : ordine.clienti;
    const bottegaObj = Array.isArray(ordine.botteghe) ? ordine.botteghe[0] : ordine.botteghe;
    const categoriaObj = Array.isArray(ordine.categorie) ? ordine.categorie[0] : ordine.categorie;

    const clienteNome = clienteObj?.ragione_sociale || 'Sconosciuto';
    const bottegaNome = bottegaObj?.nome_bottega || 'Sconosciuta';
    const categoriaNome = categoriaObj?.nome_categoria || 'Sconosciuto';

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
    console.error("Errore aggiornamento flag_scaricato:", error);
    alert("Errore durante l'aggiornamento: " + error.message);
  } else {
    await fetchOrdini(); 
  }

  btn.innerHTML = originalText;
  btn.disabled = false;
}
