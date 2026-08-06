import { clientDB } from './config.js';
import { AppState } from './state.js';
import { navigaA } from './app.js';
import { caricaCampagne } from './catalog.js';

export async function caricaStoricoOrdini() {
  const container = document.getElementById('orders-list-container');
  container.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-brand"></div><p class="mt-2 text-muted fw-bold">Caricamento ordini dal database...</p></div>';

  const { data: testate, error: errT } = await clientDB.from('ordini_testata')
    .select('*')
    .eq('id_cliente', AppState.user.id)
    .order('data_ordine', { ascending: false });

  if (errT) {
    container.innerHTML = `<p class="text-danger fw-bold">Errore di lettura ordini: ${errT.message}</p>`;
    return;
  }

  if (!testate || testate.length === 0) {
    container.innerHTML = `<div class="alert alert-light text-center py-5 border">
      <h4 class="text-muted fw-bold mb-3">Nessun ordine trovato</h4>
      <p>Non hai ancora effettuato ordini. Vai alla vetrina per iniziare!</p>
      <button class="btn btn-brand mt-2 fw-bold px-4" onclick="navigaA('app-section'); caricaCampagne();">Vai alla Vetrina</button>
    </div>`;
    return;
  }

  const orderIds = testate.map(t => t.id_ordine);
  const { data: dettagli, error: errD } = await clientDB.from('ordini_dettaglio')
    .select('*')
    .in('id_ordine', orderIds);

  if (errD) {
    container.innerHTML = `<p class="text-danger fw-bold">Errore lettura dettagli: ${errD.message}</p>`;
    return;
  }

  let html = '';
  testate.forEach(t => {
    const bottegaDest = AppState.botteghe.find(b => b.id_bottega == t.id_bottega);
    const nomeBottegaDest = bottegaDest ? bottegaDest.nome_bottega : 'Bottega ID: ' + t.id_bottega;
    
    const catInfo = AppState.categorieCache.find(c => c.id_categoria == t.id_categoria);
    const nomeCat = catInfo ? catInfo.nome_categoria : 'Categoria ID: ' + t.id_categoria;
    
    const dataFormattata = new Date(t.data_ordine).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const righeOrdine = dettagli.filter(d => d.id_ordine === t.id_ordine);
    const totaleCalcolato = righeOrdine.reduce((sum, r) => sum + (r.quantita * r.prezzo_unitario_applicato), 0);

    html += `
    <div class="card shadow-sm border-0 mb-4 bg-light border-start border-4 border-brand">
      <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap">
        <div>
          <h5 class="fw-bold text-dark m-0">Spedizione / Ordine #${t.id_ordine}</h5>
          <small class="text-muted">${dataFormattata}</small>
        </div>
        <div class="text-end mt-2 mt-md-0">
          <span class="badge bg-brand fs-6 mb-1">Totale Collo: € ${totaleCalcolato.toFixed(2).replace('.',',')}</span><br>
          ${t.flag_scaricato ? '<span class="badge bg-success small">Preso in carico da AltraQualità</span>' : '<span class="badge bg-secondary small">Inviato al Sistema</span>'}
        </div>
      </div>
      <div class="card-body">
        <div class="row mb-3">
          <div class="col-sm-6"><span class="text-muted small d-block">Destinazione Consegna Collo:</span><strong class="text-dark fs-6">🏢 ${nomeBottegaDest}</strong></div>
          <div class="col-sm-6"><span class="text-muted small d-block">Modulo d'Ordine / Categoria:</span><strong class="text-dark fs-6">📁 ${nomeCat}</strong></div>
        </div>
        <div class="table-responsive bg-white rounded border">
          <table class="table table-sm table-borderless mb-0">
            <thead class="border-bottom bg-light">
              <tr class="text-muted small">
                <th class="py-2 px-3">Bottega Destinataria</th>
                <th class="py-2">Codice Articolo</th>
                <th class="text-center py-2">Q.tà</th>
                <th class="text-end py-2">Prezzo Netto</th>
                <th class="text-end py-2 px-3">Subtotale</th>
              </tr>
            </thead>
            <tbody>`;
    
    righeOrdine.forEach(r => {
      const sub = r.quantita * r.prezzo_unitario_applicato;
      const bOrig = AppState.botteghe.find(b => b.id_bottega == r.id_bottega);
      const nomeBOrig = bOrig ? bOrig.nome_bottega : (r.id_bottega ? 'Bottega ID ' + r.id_bottega : 'Generale');

      html += `
        <tr class="border-bottom border-light">
          <td class="px-3 align-middle"><span class="badge bg-light text-dark border">${nomeBOrig}</span></td>
          <td class="fw-semibold text-dark align-middle">${r.codice_articolo}</td>
          <td class="text-center align-middle fw-bold">${r.quantita}</td>
          <td class="text-end text-muted align-middle">€ ${Number(r.prezzo_unitario_applicato).toFixed(2).replace('.',',')}</td>
          <td class="text-end fw-bold text-dark px-3 align-middle">€ ${sub.toFixed(2).replace('.',',')}</td>
        </tr>`;
    });

    html += `       </tbody>
          </table>
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}
