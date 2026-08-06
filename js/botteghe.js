import { clientDB } from './config.js';
import { AppState } from './state.js';
import { caricaCampagne } from './catalog.js';
import { aggiornaBarraStickyCarrello, salvaCarrelloInBozza } from './cart.js';

export async function caricaBotteghe() {
  const app = document.getElementById('app-container');
  if (app.innerHTML.includes('spinner-border')) {
    app.innerHTML = '<div class="spinner-border text-brand mx-auto mt-5"></div><p class="text-muted mt-3 fw-bold">Caricamento botteghe...</p>';
  }

  let { data: botteghe, error } = await clientDB.from('botteghe').select('*').eq('id_cliente', AppState.user.id).order('id_bottega');
  if (error) return console.error(error);

  if (!botteghe || botteghe.length === 0) {
    const bottegheTest = [
      { id_cliente: AppState.user.id, nome_bottega: 'Angoli di Mondo', indirizzo: '', budget: {} },
      { id_cliente: AppState.user.id, nome_bottega: 'El Fontego di Mestre', indirizzo: '', budget: {} }
    ];
    await clientDB.from('botteghe').insert(bottegheTest);
    let { data: bNew } = await clientDB.from('botteghe').select('*').eq('id_cliente', AppState.user.id).order('id_bottega');
    botteghe = bNew;
  }

  AppState.botteghe = botteghe || [];
  popolaSelettoreBotteghe();
  disegnaBottegheProfilo();
  
  if (!AppState.bottegaAttivaId && AppState.botteghe.length > 0) {
    AppState.bottegaAttivaId = AppState.botteghe[0].id_bottega;
    document.getElementById('global-bottega-selector').value = AppState.bottegaAttivaId;
  }

  const vistaAttuale = document.querySelector('#app-container h2')?.innerText || '';
  if (vistaAttuale === '' || vistaAttuale.includes('Inizializzazione')) {
    caricaCampagne(); 
  }
}

export function popolaSelettoreBotteghe() {
  const selector = document.getElementById('global-bottega-selector');
  let html = `<option value="" disabled selected>Seleziona Bottega...</option>`;
  AppState.botteghe.forEach(b => html += `<option value="${b.id_bottega}">${b.nome_bottega}</option>`);
  selector.innerHTML = html;
  if (AppState.bottegaAttivaId) selector.value = AppState.bottegaAttivaId;
  aggiornaBarraStickyCarrello();
}

export function cambiaBottegaAttiva() {
  AppState.bottegaAttivaId = document.getElementById('global-bottega-selector').value;
  aggiornaBarraStickyCarrello();
  const vistaAttuale = document.querySelector('#app-container h3')?.innerText || '';
  if (!vistaAttuale.includes('Preordini') && !vistaAttuale.includes('Categoria')) {
    caricaCampagne(); 
  }
}

export async function aggiungiBottega() {
  const nome = document.getElementById('new-bottega-nome').value.trim();
  const ind = document.getElementById('new-bottega-ind').value.trim();
  
  if (!nome) return alert("Inserisci almeno il nome identificativo della bottega.");
  
  const { error } = await clientDB.from('botteghe').insert([{
    id_cliente: AppState.user.id,
    nome_bottega: nome,
    indirizzo: ind,
    budget: {}
  }]);
  
  if (error) {
    alert("Errore inserimento: " + error.message);
  } else {
    document.getElementById('new-bottega-nome').value = '';
    document.getElementById('new-bottega-ind').value = '';
    alert("Nuova bottega inserita correttamente!");
    await caricaBotteghe();
  }
}

export async function eliminaBottega(idBottega) {
  if (!confirm("Sei sicuro di voler eliminare definitivamente questa bottega? Rimuovendo la bottega perderai anche i budget impostati ed il relativo carrello.")) return;
  
  const { error } = await clientDB.from('botteghe').delete().eq('id_bottega', idBottega);
  if (error) {
    alert("Errore eliminazione: " + error.message);
  } else {
    if (AppState.bottegaAttivaId == idBottega) AppState.bottegaAttivaId = null;
    AppState.carrello = AppState.carrello.filter(i => i.id_bottega != idBottega);
    await salvaCarrelloInBozza();
    alert("Bottega eliminata con successo!");
    await caricaBotteghe();
  }
}

export function disegnaBottegheProfilo() {
  const container = document.getElementById('botteghe-list-container');
  let html = '';
  AppState.botteghe.forEach(b => {
    const budgetMappati = b.budget || {};
    let budgetGridHtml = '<div class="mt-3 p-3 bg-white rounded border border-secondary-subtle small"><h6 class="fw-bold text-muted mb-2">Assegna Budget per Categoria d\'Ordine:</h6><div class="row">';
    AppState.categorieCache.forEach(cat => {
      const valoreBudget = budgetMappati[cat.id_categoria] || 0;
      budgetGridHtml += `
        <div class="col-sm-6 mb-2">
          <label class="text-muted small fw-semibold d-block text-truncate" title="${cat.nome_categoria}">📁 ${cat.nome_categoria}</label>
          <input type="number" step="0.01" class="form-control form-control-sm budget-input-${b.id_bottega}" data-cat-id="${cat.id_categoria}" value="${valoreBudget}" placeholder="Nessun limite">
        </div>`;
    });
    budgetGridHtml += '</div></div>';

    html += `
    <div class="bg-light p-3 rounded mb-4 border border-secondary-subtle shadow-sm">
      <div class="row align-items-end">
        <div class="col-md-4 mb-2 mb-md-0"><label class="text-muted small fw-bold">Nome Bottega</label><input type="text" class="form-control fw-bold text-dark" id="edit-nome-${b.id_bottega}" value="${b.nome_bottega}"></div>
        <div class="col-md-4 mb-2 mb-md-0"><label class="text-muted small fw-bold">Indirizzo (Opzionale)</label><input type="text" class="form-control text-secondary" id="edit-ind-${b.id_bottega}" value="${b.indirizzo || ''}"></div>
        <div class="col-md-2 mb-2 mb-md-0"><button class="btn btn-outline-brand w-100 fw-bold shadow-sm" onclick="salvaModificaBottega(${b.id_bottega})">Salva Tutto</button></div>
        <div class="col-md-2 mb-2 mb-md-0"><button class="btn btn-outline-danger w-100 fw-bold shadow-sm" onclick="eliminaBottega(${b.id_bottega})">Elimina</button></div>
      </div>
      ${budgetGridHtml}
    </div>`;
  });
  container.innerHTML = html;
}

export async function salvaModificaBottega(idBottega) {
  const nNome = document.getElementById(`edit-nome-${idBottega}`).value.trim();
  const nInd = document.getElementById(`edit-ind-${idBottega}`).value.trim();
  
  if (!nNome) return alert("Il nome della bottega non può essere vuoto.");

  const mappaBudget = {};
  document.querySelectorAll(`.budget-input-${idBottega}`).forEach(input => {
    const catId = input.getAttribute('data-cat-id');
    const val = parseFloat(input.value) || 0;
    if (val > 0) mappaBudget[catId] = val;
  });
  
  const { error } = await clientDB.from('botteghe').update({ nome_bottega: nNome, indirizzo: nInd, budget: mappaBudget }).eq('id_bottega', idBottega);
  if (error) {
    alert("Errore: " + error.message);
  } else {
    const b = AppState.botteghe.find(x => x.id_bottega === idBottega);
    if (b) { b.nome_bottega = nNome; b.indirizzo = nInd; b.budget = mappaBudget; }
    popolaSelettoreBotteghe();
    document.getElementById('success-modal-msg').innerText = "Anagrafica bottega e budget salvati correttamente nell'applicazione.";
    new bootstrap.Modal(document.getElementById('successModal')).show();
  }
}
