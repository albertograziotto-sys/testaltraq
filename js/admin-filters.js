import { AdminState } from './admin-state.js';
import { renderTabella } from './admin-table.js';

export function applicaFiltri() {
  const searchCliente = document.getElementById('search-cliente');
  const filterCategoria = document.getElementById('filter-categoria');

  const queryStr = searchCliente.value.toLowerCase().trim();
  const catSelezionata = filterCategoria.value;

  const ordiniFiltrati = AdminState.ordiniCorrenti.filter(ordine => {
    const coincideCategoria = catSelezionata === "" || String(ordine.id_categoria) === String(catSelezionata);
    const ragioneSociale = ordine.clienti?.ragione_sociale?.toLowerCase() || '';
    const nomeBottega = ordine.botteghe?.nome_bottega?.toLowerCase() || '';
    const coincideRicerca = queryStr === "" || ragioneSociale.includes(queryStr) || nomeBottega.includes(queryStr);

    return coincideCategoria && coincideRicerca;
  });

  renderTabella(ordiniFiltrati);
}
