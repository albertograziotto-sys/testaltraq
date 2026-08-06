import { clientDB } from './config.js';
import { AppState } from './state.js';
import { navigaA } from './app.js';
import { salvaCarrelloInBozza, aggiornaBarraStickyCarrello, modificaQtaDalCarrello, rimuoviDalCarrello } from './cart.js';

export function mostraRiepilogoCarrello() {
  navigaA('checkout-section');
  const app = document.getElementById('checkout-section');
  
  if (AppState.carrello.length === 0) {
    app.innerHTML = `
    <div class="full-page-card border-top-0 w-100 text-center" style="border-top: 6px solid var(--brand) !important;">
      <h3 class="text-muted fw-bold mt-4">Il tuo carrello è vuoto</h3>
      <p>Torna alla Vetrina Preordini per iniziare ad aggiungere articoli.</p>
      <button class="btn btn-brand mt-3 fw-bold px-4" onclick="navigaA('app-section'); caricaCampagne();">Torna ai Preordini</button>
    </div>`;
    return;
  }

  let avvisiBudgetHtml = "";
  AppState.botteghe.forEach(b => {
    const mappaBudget = b.budget || {};
    for (let catId in mappaBudget) {
      const limiteBudget = Number(mappaBudget[catId]) || 0;
      if (limiteBudget > 0) {
        const totSpesoCat = AppState.carrello
          .filter(i => i.id_bottega == b.id_bottega && i.id_categoria == catId)
          .reduce((sum, item) => sum + (item.quantita * item.prezzo), 0);
        
        if (totSpesoCat > limiteBudget) {
          const infoCat = AppState.categorieCache.find(c => c.id_categoria == catId) || {nome_categoria: 'Sconosciuta'};
          avvisiBudgetHtml += `
          <div class="alert alert-warning py-2 mb-2 border-warning-subtle text-dark fw-semibold small d-flex justify-content-between align-items-center shadow-sm">
            <span>⚠️ La bottega <strong>${b.nome_bottega}</strong> ha sforato il budget per la categoria <strong>${infoCat.nome_categoria}</strong></span>
            <span class="badge bg-danger font-monospace fs-6">€ ${totSpesoCat.toFixed(2).replace('.',',')} / € ${limiteBudget.toFixed(2).replace('.',',')}</span>
          </div>`;
        }
      }
    }
  });

  const categorieNelCarrello = [...new Set(AppState.carrello.map(i => i.id_categoria))];
  
  let html = `
  <div class="full-page-card border-top-0 w-100" style="border-top: 6px solid var(--brand) !important;">
    <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 flex-wrap">
      <h3 class="fw-bold text-brand m-0">Logistica e Carrello</h3>
      <button class="btn btn-outline-secondary btn-sm fw-bold mt-2 mt-md-0" onclick="navigaA('app-section'); caricaCampagne();">← Torna ai Preordini</button>
    </div>
    
    ${avvisiBudgetHtml}
    
    <p class="text-muted">Riepilogo delle spedizioni organizzate secondo i minimi di categoria per la rete di botteghe.</p>
  `;

  let tuttoSuperato = true;

  categorieNelCarrello.forEach(idCat => {
    const infoCat = AppState.categorieCache.find(c => c.id_categoria == idCat) || {nome_categoria: 'Sconosciuta', minimo_ordine: 0};
    const minOrdineInfo = Number(infoCat.minimo_ordine) || 0; 
    
    const vociCat = AppState.carrello.filter(i => i.id_categoria == idCat);
    const totaleCat = vociCat.reduce((sum, v) => sum + (v.quantita * v.prezzo), 0);
    
    const minimoSuperato = totaleCat >= minOrdineInfo;
    if (!minimoSuperato) tuttoSuperato = false;

    html += `
    <div class="card mb-4 shadow-sm border-0 border-top border-4 ${minimoSuperato ? 'border-success' : 'border-danger'} bg-light">
      <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap">
        <h4 class="fw-bold text-dark m-0">📁 ${infoCat.nome_categoria}</h4>
        <div class="text-end mt-2 mt-md-0">
          <span class="d-block fw-bold fs-5 mb-1 ${minimoSuperato ? 'text-success' : 'text-danger'}">Totale Rete: € ${totaleCat.toFixed(2).replace('.',',')}</span>
          ${minimoSuperato ? `<span class="badge bg-success fs-6">Minimo Raggiunto</span>` : `<span class="badge bg-danger fs-6">Mancano € ${(minOrdineInfo - totaleCat).toFixed(2).replace('.',',')} al minimo (€ ${minOrdineInfo})</span>`}
        </div>
      </div>
      <div class="card-body p-4">`;

    if (!minimoSuperato) {
      html += `<div class="alert alert-danger fw-bold shadow-sm mb-4">❌ Il totale di categoria per la rete non raggiunge il minimo d'ordine. Aggiusta le quantità o forza l'invio.</div>`;
    }

    let spesaPerBottega = {};
    vociCat.forEach(v => {
      spesaPerBottega[v.id_bottega] = (spesaPerBottega[v.id_bottega] || 0) + (v.quantita * v.prezzo);
    });

    const allBottegheCat = Object.keys(spesaPerBottega);
    const sopraMinimo = allBottegheCat.filter(idB => spesaPerBottega[idB] >= minOrdineInfo && minOrdineInfo > 0);
    const sottoMinimo = allBottegheCat.filter(idB => spesaPerBottega[idB] < minOrdineInfo || minOrdineInfo === 0);
    const totSottoMinimo = sottoMinimo.reduce((sum, idB) => sum + spesaPerBottega[idB], 0);

    const generaListaProdottiModificabile = (idSede) => {
      const items = vociCat.filter(i => i.id_bottega == idSede);
      let listaHtml = `<div class="mt-3 p-2 bg-white rounded border border-secondary-subtle small"><strong class="text-dark d-block mb-2 border-bottom pb-1">Gestisci Articoli Sede:</strong><ul class="list-unstyled mb-0">`;
      
      items.forEach(item => {
        const subtotale = (item.quantita * item.prezzo).toFixed(2).replace('.',',');
        listaHtml += `
        <li class="mb-2 pb-2 border-bottom border-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="text-truncate" style="flex: 1 1 200px; min-width: 0;">
            <span class="badge bg-dark me-1">${item.nome_produttore}</span><br class="d-md-none">
            <span class="text-dark">${item.nome}</span>
          </div>
          <div class="d-flex align-items-center gap-3">
            <span class="fw-bold text-brand d-none d-sm-block">€ ${subtotale}</span>
            <div class="input-group input-group-sm" style="width: 90px; flex-wrap: nowrap;">
              <button class="btn btn-outline-secondary px-2 fw-bold" type="button" onclick="modificaQtaDalCarrello('${item.codice_articolo}', ${idSede}, -1)">-</button>
              <input type="number" class="form-control text-center p-0 fw-bold bg-white" value="${item.quantita}" readonly>
              <button class="btn btn-outline-secondary px-2 fw-bold" type="button" onclick="modificaQtaDalCarrello('${item.codice_articolo}', ${idSede}, 1)">+</button>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="rimuoviDalCarrello('${item.codice_articolo}', ${idSede})" title="Rimuovi">🗑️</button>
          </div>
        </li>`;
      });
      listaHtml += `</ul></div>`;
      return listaHtml;
    };

    html += `<div class="row">`;

    if (sopraMinimo.length === allBottegheCat.length) {
      html += `<div class="col-12 mb-3">
        <div class="p-3 bg-white border border-success rounded shadow-sm">
          <h6 class="fw-bold text-success border-bottom pb-2">📦 Caso 4: Spedizioni Indipendenti Dirette (Ogni bottega riceve il proprio ordine)</h6>
          <ul class="list-group list-group-flush mb-0">`;
      sopraMinimo.forEach(idB => {
        const nomeB = AppState.botteghe.find(b => b.id_bottega == idB)?.nome_bottega || 'Sconosciuta';
        html += `<li class="list-group-item bg-transparent px-0 d-flex flex-column py-2">
          <div class="d-flex justify-content-between align-items-center w-100">
            <span><strong class="text-dark">${nomeB}</strong> <small class="text-success ms-2">(Supera il minimo da sola)</small></span>
            <span class="fw-bold text-success fs-5">€ ${spesaPerBottega[idB].toFixed(2).replace('.',',')}</span>
          </div>
          ${generaListaProdottiModificabile(idB)}
        </li>`;
      });
      html += `</ul></div></div>`;
    } else if (sopraMinimo.length === 0) {
      html += `<div class="col-12 mb-3">
        <div class="p-3 bg-white border border-warning rounded shadow-sm">
          <h6 class="fw-bold text-warning border-bottom pb-2" style="color: #d39e00 !important;">🤝 Caso 1: Spedizione Unica Raggruppata per la Categoria</h6>
          <p class="small text-muted mb-2">Nessuna bottega raggiunge il minimo autonomamente. La merce verrà consolidata in un unico ordine per AltraQualità.</p>
          <ul class="list-group list-group-flush mb-3">`;
      sottoMinimo.forEach(idB => {
        const nomeB = AppState.botteghe.find(b => b.id_bottega == idB)?.nome_bottega || 'Sconosciuta';
        html += `<li class="list-group-item bg-transparent px-0 d-flex flex-column py-2">
          <div class="d-flex justify-content-between align-items-center w-100">
            <span class="text-dark fw-bold">${nomeB}</span>
            <span class="text-muted fw-bold">€ ${spesaPerBottega[idB].toFixed(2).replace('.',',')}</span>
          </div>
          ${generaListaProdottiModificabile(idB)}
        </li>`;
      });
      html += `</ul>
      <div class="p-3 bg-light border rounded">
        <label class="fw-bold small mb-2 text-dark">Scegli la sede di destinazione unica per l'ordine:</label>
        <select class="form-select form-select-sm border-secondary fw-bold text-brand" id="destinazione-cat-${idCat}">
          <option value="" disabled selected>Seleziona bottega dove recapitare il collo unico...</option>`;
      AppState.botteghe.forEach(b => {
        html += `<option value="${b.id_bottega}">Spedisci a: ${b.nome_bottega}</option>`;
      });
      html += `</select>
      </div></div></div>`;
    } else {
      if (totSottoMinimo >= minOrdineInfo) {
        html += `<div class="col-md-6 mb-3">
          <div class="p-3 bg-white border border-success rounded shadow-sm h-100">
            <h6 class="fw-bold text-success border-bottom pb-2">📦 Caso 2A: Spedizione Autonoma Diretta</h6>
            <ul class="list-group list-group-flush mb-0">`;
        sopraMinimo.forEach(idB => {
          const nomeB = AppState.botteghe.find(b => b.id_bottega == idB)?.nome_bottega || 'Sconosciuta';
          html += `<li class="list-group-item bg-transparent px-0 d-flex flex-column py-2">
            <div class="d-flex justify-content-between align-items-center w-100">
              <span><strong class="text-dark">${nomeB}</strong> <small class="text-muted d-block">Spedizione autonoma</small></span>
              <span class="fw-bold text-success fs-5">€ ${spesaPerBottega[idB].toFixed(2).replace('.',',')}</span>
            </div>
            ${generaListaProdottiModificabile(idB)}
          </li>`;
        });
        html += `</ul></div></div>`;

        html += `<div class="col-md-6 mb-3">
          <div class="p-3 bg-white border border-warning rounded shadow-sm h-100">
            <h6 class="fw-bold text-warning border-bottom pb-2" style="color: #d39e00 !important;">🤝 Caso 2B: Spedizione Raggruppata Rimanenti</h6>
            <p class="small text-muted mb-2">Le botteghe rimanenti insieme superano il minimo (€ ${totSottoMinimo.toFixed(2).replace('.',',')}).</p>
            <ul class="list-group list-group-flush mb-3">`;
        sottoMinimo.forEach(idB => {
          const nomeB = AppState.botteghe.find(b => b.id_bottega == idB)?.nome_bottega || 'Sconosciuta';
          html += `<li class="list-group-item bg-transparent px-0 d-flex flex-column py-2">
            <div class="d-flex justify-content-between align-items-center w-100">
              <span class="text-dark fw-bold">${nomeB}</span>
              <span class="text-muted fw-bold">€ ${spesaPerBottega[idB].toFixed(2).replace('.',',')}</span>
            </div>
            ${generaListaProdottiModificabile(idB)}
          </li>`;
        });
        html += `</ul>
        <div class="p-3 bg-light border rounded">
          <label class="fw-bold small mb-2 text-dark">Scegli destinazione per il gruppo rimanente:</label>
          <select class="form-select form-select-sm border-secondary fw-bold text-brand" id="destinazione-cat-${idCat}">
            <option value="" disabled selected>Seleziona bottega di destinazione...</option>`;
        AppState.botteghe.forEach(b => {
          html += `<option value="${b.id_bottega}">Spedisci a: ${b.nome_bottega}</option>`;
        });
        html += `</select>
        </div></div></div>`;
      } else {
        html += `<div class="col-12 mb-3">
          <div class="p-3 bg-white border border-warning rounded shadow-sm">
            <h6 class="fw-bold text-warning border-bottom pb-2" style="color: #d39e00 !important;">🤝 Caso 3: Spedizione Unificata Categoria</h6>
            <p class="small text-muted mb-2">Le botteghe rimanenti non raggiungono il minimo da sole (totale rimanente: € ${totSottoMinimo.toFixed(2).replace('.',',')}). L'ordine della categoria viene unificato per garantire l'evasione.</p>
            <ul class="list-group list-group-flush mb-3">`;
        allBottegheCat.forEach(idB => {
          const nomeB = AppState.botteghe.find(b => b.id_bottega == idB)?.nome_bottega || 'Sconosciuta';
          html += `<li class="list-group-item bg-transparent px-0 d-flex flex-column py-2">
            <div class="d-flex justify-content-between align-items-center w-100">
              <span class="text-dark fw-bold">${nomeB}</span>
              <span class="text-muted fw-bold">€ ${spesaPerBottega[idB].toFixed(2).replace('.',',')}</span>
            </div>
            ${generaListaProdottiModificabile(idB)}
          </li>`;
        });
        html += `</ul>
        <div class="p-3 bg-light border rounded">
          <label class="fw-bold small mb-2 text-dark">Scegli la sede di destinazione per l'ordine unico unificato:</label>
          <select class="form-select form-select-sm border-secondary fw-bold text-brand" id="destinazione-cat-${idCat}">
            <option value="" disabled selected>Seleziona bottega di destinazione...</option>`;
        AppState.botteghe.forEach(b => {
          html += `<option value="${b.id_bottega}">Spedisci a: ${b.nome_bottega}</option>`;
        });
        html += `</select>
        </div></div></div>`;
      }
    }

    html += `</div></div></div>`; 
  });

  const grandTotale = document.getElementById('cart-total-bar').innerHTML;
  html += `
  <div class="col-12 text-end mt-4 bg-white p-4 rounded shadow-sm border border-secondary-subtle">
    <h3 class="fw-bold mb-3 text-dark">Totale Generale da confermare: <span class="text-brand">${grandTotale}</span></h3>`;
      
  if (tuttoSuperato) {
    html += `<button id="btn-conferma-ordine" class="btn btn-success btn-lg fw-bold px-5 shadow-sm" onclick="inviaOrdineDefinitivo()">✅ Conferma e Invia Ordine</button>`;
  } else {
    html += `
    <div class="d-inline-block text-start mb-3 p-3 bg-light border border-warning rounded">
      <div class="form-check">
        <input class="form-check-input border-warning" type="checkbox" id="force-submit-checkbox" onchange="toggleForzaInvio()" style="cursor: pointer;">
        <label class="form-check-label fw-bold text-dark" for="force-submit-checkbox" style="cursor: pointer;">
          Invia anche sotto minimo d'ordine
        </label>
      </div>
    </div>
    <br>
    <button id="btn-conferma-ordine" class="btn btn-secondary btn-lg fw-bold px-5" disabled onclick="inviaOrdineDefinitivo()">Raggiungi i minimi per poter inviare</button>
    <p id="msg-errore-minimi" class="text-danger mt-2 fw-bold small">Attenzione: risolvi le categorie segnate in rosso o spunta la casella per forzare l'invio.</p>
    `;
  }

  html += `</div></div>`;
  app.innerHTML = html;
}

export function toggleForzaInvio() {
  const isChecked = document.getElementById('force-submit-checkbox').checked;
  const btn = document.getElementById('btn-conferma-ordine');
  const msgErrore = document.getElementById('msg-errore-minimi');
  
  if (isChecked) {
    btn.disabled = false;
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-warning', 'text-dark', 'shadow-sm');
    btn.innerHTML = '⚠️ Conferma e Invia Sotto Minimo';
    if (msgErrore) msgErrore.style.display = 'none';
  } else {
    btn.disabled = true;
    btn.classList.remove('btn-warning', 'text-dark', 'shadow-sm');
    btn.classList.add('btn-secondary');
    btn.innerHTML = 'Raggiungi i minimi per poter inviare';
    if (msgErrore) msgErrore.style.display = 'block';
  }
}

export async function inviaOrdineDefinitivo() {
  if (!confirm("Confermi di voler inviare l'ordine definitivo ad AltraQualità?")) return;
  
  const btn = document.getElementById('btn-conferma-ordine');
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Salvataggio ordini nel database...";
  }

  const categorieNelCarrello = [...new Set(AppState.carrello.map(i => i.id_categoria))];

  for (const idCat of categorieNelCarrello) {
    const infoCat = AppState.categorieCache.find(c => c.id_categoria == idCat) || { nome_categoria: 'Sconosciuta', minimo_ordine: 0 };
    const minOrdineInfo = Number(infoCat.minimo_ordine) || 0;
    const vociCat = AppState.carrello.filter(i => i.id_categoria == idCat);

    let spesaPerBottega = {};
    vociCat.forEach(v => {
      spesaPerBottega[v.id_bottega] = (spesaPerBottega[v.id_bottega] || 0) + (v.quantita * v.prezzo);
    });

    const allBottegheCat = Object.keys(spesaPerBottega);
    const sopraMinimo = allBottegheCat.filter(idB => spesaPerBottega[idB] >= minOrdineInfo && minOrdineInfo > 0);

    if (sopraMinimo.length < allBottegheCat.length) {
      const selectEl = document.getElementById(`destinazione-cat-${idCat}`);
      if (selectEl && !selectEl.value && allBottegheCat.length > 1) {
        alert(`Attenzione: Seleziona la sede di destinazione per la spedizione raggruppata della categoria "${infoCat.nome_categoria}" prima di procedere.`);
        if (btn) { btn.disabled = false; btn.innerText = "✅ Conferma e Invia Ordine"; }
        return;
      }
    }
  }

  let errori = 0;
  let testateCreate = 0;

  for (const idCat of categorieNelCarrello) {
    const infoCat = AppState.categorieCache.find(c => c.id_categoria == idCat) || { minimo_ordine: 0 };
    const minOrdineInfo = Number(infoCat.minimo_ordine) || 0;
    const vociCat = AppState.carrello.filter(i => i.id_categoria == idCat);

    let spesaPerBottega = {};
    vociCat.forEach(v => {
      spesaPerBottega[v.id_bottega] = (spesaPerBottega[v.id_bottega] || 0) + (v.quantita * v.prezzo);
    });

    const allBottegheCat = Object.keys(spesaPerBottega);
    const sopraMinimo = allBottegheCat.filter(idB => spesaPerBottega[idB] >= minOrdineInfo && minOrdineInfo > 0);
    const sottoMinimo = allBottegheCat.filter(idB => spesaPerBottega[idB] < minOrdineInfo || minOrdineInfo === 0);
    const totSottoMinimo = sottoMinimo.reduce((sum, idB) => sum + spesaPerBottega[idB], 0);

    const selectEl = document.getElementById(`destinazione-cat-${idCat}`);
    const destSelezionata = (selectEl && selectEl.value) ? parseInt(selectEl.value) : parseInt(allBottegheCat[0]);

    const creaSingoloOrdineInDB = async (idBottegaDest, itemsGroup) => {
      const bottegaInfo = AppState.botteghe.find(b => b.id_bottega == idBottegaDest);
      let budget = null;
      if (bottegaInfo && bottegaInfo.budget && bottegaInfo.budget[idCat]) {
        budget = parseFloat(bottegaInfo.budget[idCat]);
      }

      const { data: testata, error: errTestata } = await clientDB.from('ordini_testata').insert([{
        id_cliente: AppState.user.id,
        id_bottega: parseInt(idBottegaDest),
        id_categoria: parseInt(idCat),
        budget_impostato: budget || null
      }]).select().single();

      if (errTestata) {
        console.error(`Errore Inserimento Testata:`, errTestata.message);
        errori++;
        return false;
      }

      const idOrdineGenerato = testata.id_ordine;

      const righeDettaglio = itemsGroup.map(item => ({
        id_ordine: idOrdineGenerato,
        id_bottega: parseInt(item.id_bottega),
        codice_articolo: item.codice_articolo,
        quantita: item.quantita,
        prezzo_unitario_applicato: item.prezzo
      }));

      const { error: errDettagli } = await clientDB.from('ordini_dettaglio').insert(righeDettaglio);
      if (errDettagli) {
        console.error(`Errore Inserimento Dettagli:`, errDettagli.message);
        errori++;
        return false;
      }

      testateCreate++;
      return true;
    };

    if (sopraMinimo.length === allBottegheCat.length) {
      for (const idB of allBottegheCat) {
        const itemsBottega = vociCat.filter(i => String(i.id_bottega) === String(idB));
        await creaSingoloOrdineInDB(idB, itemsBottega);
      }
    } else if (sopraMinimo.length === 0) {
      await creaSingoloOrdineInDB(destSelezionata, vociCat);
    } else {
      if (totSottoMinimo >= minOrdineInfo) {
        for (const idB of sopraMinimo) {
          const itemsBottega = vociCat.filter(i => String(i.id_bottega) === String(idB));
          await creaSingoloOrdineInDB(idB, itemsBottega);
        }
        const itemsRimanenti = vociCat.filter(i => sottoMinimo.includes(String(i.id_bottega)));
        await creaSingoloOrdineInDB(destSelezionata, itemsRimanenti);
      } else {
        await creaSingoloOrdineInDB(destSelezionata, vociCat);
      }
    }
  }

  if (errori > 0) {
    alert(`Si è verificato un problema: ${testateCreate} ordini generati con successo, ma ${errori} hanno fallito.`);
    if (btn) { btn.disabled = false; btn.innerText = "Riprova Invio Falliti"; }
    return;
  }

  document.getElementById('success-modal-msg').innerHTML = `I tuoi <b>${testateCreate} ordini spedizione</b> sono stati salvati con successo in Supabase!<br>AltraQualità ha ricevuto i colli unificati, mentre la distinta interna di smistamento per le botteghe è stata preservata nello storico.`;
  new bootstrap.Modal(document.getElementById('successModal')).show();
  
  AppState.carrello = [];
  await salvaCarrelloInBozza();
  
  aggiornaBarraStickyCarrello();
  navigaA('orders-section'); 
}
