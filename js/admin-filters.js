import { AdminState } from './admin-state.js';
import { renderTabella } from './admin-table.js';

export function applicaFiltri() {
  const searchCliente = document.getElementById('search-cliente');
  const filterCategoria = document.getElementById('filter-categoria');

  const queryStr = searchCliente ? searchCliente.value.toLowerCase().trim() : '';
  const catSelezionata = filterCategoria ? filterCategoria.value : '';

  const ordiniFiltrati = AdminState.ordiniCorrenti.filter(ordine => {
    const coincideCategoria = catSelezionata === "" || String(ordine.id_categoria) === String(catSelezionata);
    
    const clienteObj = Array.isArray(ordine.clienti) ? ordine.clienti[0] : ordine.clienti;
    const bottegaObj = Array.isArray(ordine.botteghe) ? ordine.botteghe[0] : ordine.botteghe;

    const ragioneSociale = clienteObj?.ragione_sociale?.toLowerCase() || '';
    const nomeBottega = bottegaObj?.nome_bottega?.toLowerCase() || '';
    const coincideRicerca = queryStr === "" || ragioneSociale.includes(queryStr) || nomeBottega.includes(queryStr);

    return coincideCategoria && coincideRicerca;
  });

  renderTabella(ordiniFiltrati);
}
