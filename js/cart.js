import { clientDB } from './config.js';
import { AppState } from './state.js';
import { mostraRiepilogoCarrello } from './checkout.js';

export async function salvaCarrelloInBozza() {
  if (!AppState.user) return;
  const { error } = await clientDB.from('clienti')
    .update({ carrello_bozza: AppState.carrello })
    .eq('id', AppState.user.id);
      
  if (error) console.error("Errore salvataggio bozza cloud:", error.message);
}

export function modificaQtaGriglia(codice, delta) {
  const input = document.getElementById('qty_' + codice);
  if (!input) return;
  let val = parseInt(input.value) || 0;
  val += delta;
  if (val < 1) val = 1; 
  input.value = val;
}

export function modificaQtaModal(delta) {
  const input = document.getElementById('modal-qty');
  if (!input) return;
  let val = parseInt(input.value) || 0;
  val += delta;
  if (val < 1) val = 1; 
  input.value = val;
}

export function applicaQtaDalBottone(codice, nome, prezzoNetto, idCategoria, idProduttore, nomeProduttore) {
  const input = document.getElementById('qty_' + codice);
  if (!input) return;
  const qta = parseInt(input.value) || 0;
  aggiornaQuantitaCarrelloGlobale(codice, nome, qta, prezzoNetto, idCategoria, idProduttore, nomeProduttore);
  
  const btn = event.currentTarget;
  btn.innerText = "✓ Fatto";
  btn.classList.add('bg-success', 'border-success');
  setTimeout(() => { 
    btn.innerText = "Aggiorna"; 
    btn.classList.remove('bg-success', 'border-success'); 
  }, 1000);
}

export function applicaQtaDalModal(codice, nome, prezzoNetto, idCategoria, idProduttore, nomeProduttore) {
  const input = document.getElementById('modal-qty');
  if (!input) return;
  const qta = parseInt(input.value) || 0;
  
  aggiornaQuantitaCarrelloGlobale(codice, nome, qta, prezzoNetto, idCategoria, idProduttore, nomeProduttore);
  
  const gridInput = document.getElementById('qty_' + codice);
  if (gridInput) gridInput.value = qta;
  
  const gridBtn = document.getElementById(`btn_grid_${codice}`);
  if (gridBtn) gridBtn.innerText = "Aggiorna";

  const btn = document.getElementById('modal-add-btn');
  btn.innerText = "✓ Carrello Aggiornato";
  btn.classList.add('bg-success', 'border-success');
  setTimeout(() => { 
    btn.innerText = "Aggiorna"; 
    btn.classList.remove('bg-success', 'border-success'); 
  }, 1200);
}

export function aggiornaQuantitaCarrelloGlobale(codice, nome, quantita, prezzoNetto, idCategoria, idProduttore, nomeProduttore) {
  const idBottega = AppState.bottegaAttivaId;
  if (!idBottega) return alert("Seleziona una bottega dal menu in alto!");

  const index = AppState.carrello.findIndex(i => i.codice_articolo === codice && i.id_bottega == idBottega);

  if (quantita <= 0) {
    if (index > -1) AppState.carrello.splice(index, 1);
  } else {
    if (index > -1) {
      AppState.carrello[index].quantita = quantita;
    } else {
      AppState.carrello.push({
        codice_articolo: codice, 
        nome, 
        id_bottega: idBottega, 
        id_categoria: idCategoria, 
        id_produttore: idProduttore,
        nome_produttore: nomeProduttore,
        quantita, 
        prezzo: prezzoNetto 
      });
    }
  }
  
  salvaCarrelloInBozza();
  aggiornaBarraStickyCarrello();
}

export function calcolaTotaleCarrelloPerCategoria(idCategoria) {
  return AppState.carrello
    .filter(i => i.id_categoria == idCategoria)
    .reduce((sum, i) => sum + (i.quantita * i.prezzo), 0);
}

export function aggiornaBarraStickyCarrello() {
  const totaleGlobale = AppState.carrello.reduce((sum, i) => sum + (i.quantita * i.prezzo), 0);
  const numeroPezzi = AppState.carrello.reduce((sum, i) => sum + i.quantita, 0);
  
  const bottegaAttiva = AppState.botteghe.find(b => b.id_bottega == AppState.bottegaAttivaId);
  let badgeBudget = "";

  if (bottegaAttiva && AppState.categoriaAttivaId) {
    const mappaBudget = bottegaAttiva.budget || {};
    const budgetSpecificoCategoria = parseFloat(mappaBudget[AppState.categoriaAttivaId]) || 0;
    
    if (budgetSpecificoCategoria > 0) {
      const spesaBottegaInCategoria = AppState.carrello
        .filter(i => i.id_bottega == AppState.bottegaAttivaId && i.id_categoria == AppState.categoriaAttivaId)
        .reduce((sum, item) => sum + (item.quantita * item.prezzo), 0);
      
      const residuo = budgetSpecificoCategoria - spesaBottegaInCategoria;
      const infoCat = AppState.categorieCache.find(c => c.id_categoria == AppState.categoriaAttivaId);
      const nomeCat = infoCat ? infoCat.nome_categoria : 'Categoria';

      if (residuo < 0) {
        badgeBudget = ` <span class="badge bg-danger ms-2">Sforato Budget ${nomeCat}: € ${Math.abs(residuo).toFixed(2).replace('.',',')}</span>`;
      } else {
        badgeBudget = ` <span class="badge bg-light text-dark border border-secondary-subtle ms-2">Residuo Budget ${nomeCat}: € ${residuo.toFixed(2).replace('.',',')}</span>`;
      }
    }
  }

  document.getElementById('cart-total-bar').innerHTML = '€ ' + totaleGlobale.toFixed(2).replace('.',',') + badgeBudget;
  document.getElementById('cart-badge').innerText = numeroPezzi;
}

export function modificaQtaDalCarrello(codice, idBottega, delta) {
  const index = AppState.carrello.findIndex(i => i.codice_articolo === codice && i.id_bottega == idBottega);
  if (index > -1) {
    let nuovaQta = AppState.carrello[index].quantita + delta;
    if (nuovaQta <= 0) {
      AppState.carrello.splice(index, 1);
    } else {
      AppState.carrello[index].quantita = nuovaQta;
    }
    salvaCarrelloInBozza();
    aggiornaBarraStickyCarrello();
    mostraRiepilogoCarrello();
  }
}

export function rimuoviDalCarrello(codice, idBottega) {
  const index = AppState.carrello.findIndex(i => i.codice_articolo === codice && i.id_bottega == idBottega);
  if (index > -1) {
    AppState.carrello.splice(index, 1);
    salvaCarrelloInBozza();
    aggiornaBarraStickyCarrello();
    mostraRiepilogoCarrello();
  }
}
