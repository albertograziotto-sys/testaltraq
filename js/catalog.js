import { clientDB, SUPABASE_URL } from './config.js';
import { AppState } from './state.js';
import { calcolaTotaleCarrelloPerCategoria, aggiornaBarraStickyCarrello } from './cart.js';

export function gestisciErroreFoto(img, codice) {
  if (!img.dataset.tentativo) {
    img.dataset.tentativo = "1";
    img.src = `${SUPABASE_URL}/storage/v1/object/public/foto/${codice} (1).webp`;
  } else {
    img.onerror = null;
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f8f9fa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23adb5bd">Foto non disp.</text></svg>`;
  }
}

export async function caricaCampagne() {
  AppState.categoriaAttivaId = null;
  const app = document.getElementById('app-container');
  app.innerHTML = '<div class="spinner-border text-brand mx-auto mt-5"></div><p class="text-muted mt-3 fw-bold">Caricamento preordini attivi...</p>';
  
  const { data: campagne, error } = await clientDB.from('campagne').select('*').order('id_campagna');
  if (error) { app.innerHTML = `<p class="text-danger fw-bold">Errore: ${error.message}</p>`; return; }
  
  let html = `
  <div class="col-12 mb-4 text-start">
    <h2 class="fw-bold text-brand">Preordini Aperti</h2>
    <p class="text-muted fs-6">Benvenuto <strong>${AppState.user.ragione_sociale}</strong>. Seleziona una campagna per iniziare l'ordine.</p>
  </div>`;
  
  campagne.forEach(c => {
    html += `
    <div class="col-12 mb-4 text-start">
      <div class="card shadow-sm border-0 bg-dark text-white overflow-hidden" style="border-radius: 15px; cursor: pointer; transition: transform 0.2s;" onclick="apriCampagna(${c.id_campagna}, '${c.nome_campagna}')" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
        <div class="card-body p-5 d-flex flex-column justify-content-center" style="background: linear-gradient(135deg, var(--brand) 0%, #a43800 100%); min-height: 160px;">
          <h3 class="card-title fw-bold mb-2">📦 ${c.nome_campagna}</h3>
          <p class="card-text opacity-75">Clicca per entrare e visualizzare le categorie di prodotto.</p>
        </div>
      </div>
    </div>`;
  });
  
  app.innerHTML = html;
  aggiornaBarraStickyCarrello();
  document.getElementById('cart-sticky-bar').style.display = 'flex';
}

export async function apriCampagna(idCampagna, nomeCampagna) {
  AppState.categoriaAttivaId = null;
  const app = document.getElementById('app-container');
  app.innerHTML = '<div class="spinner-border text-brand mx-auto mt-5"></div>';

  const { data: categorie, error } = await clientDB.from('categorie').select('*').eq('id_campagna', idCampagna).order('nome_categoria');
  if (error) { app.innerHTML = `<p class="text-danger fw-bold">Errore: ${error.message}</p>`; return; }
  
  categorie.forEach(c => {
    if (!AppState.categorieCache.find(cat => cat.id_categoria === c.id_categoria)){
      AppState.categorieCache.push(c);
    }
  });

  let html = `
  <div class="col-12 mb-4 text-start">
    <button class="btn btn-outline-secondary btn-sm mb-3 fw-bold" onclick="caricaCampagne()">← Torna ai Preordini</button>
    <h3 class="fw-bold text-brand">${nomeCampagna}</h3>
    <p class="text-muted">I minimi d'ordine sono calcolati sul totale della categoria per l'intera organizzazione (somma di tutte le botteghe).</p>
  </div>`;
  
  categorie.forEach(cat => {
    const totCategoria = calcolaTotaleCarrelloPerCategoria(cat.id_categoria);
    const perc = Math.min((totCategoria / cat.minimo_ordine) * 100, 100);
    const coloreBarra = perc >= 100 ? 'bg-success' : 'bg-warning text-dark';

    html += `
    <div class="col-md-6 mb-4 text-start">
      <div class="card shadow-sm h-100 border-0 p-3" style="cursor: pointer; transition: transform 0.2s;" onclick="apriCategoria(${cat.id_categoria}, '${cat.nome_categoria.replace("'", "\\'")}', ${cat.minimo_ordine}, ${idCampagna}, '${nomeCampagna.replace("'", "\\'")}')" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
        <div class="card-body d-flex flex-column">
          <h4 class="fw-bold text-dark mb-2">📁 ${cat.nome_categoria}</h4>
          <p class="text-muted small mb-3">Minimo organizzazione: <strong>€ ${cat.minimo_ordine.toFixed(2).replace('.',',')}</strong></p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between small fw-bold mb-1">
              <span>Progresso (tutte le botteghe):</span>
              <span>€ ${totCategoria.toFixed(2).replace('.',',')} / € ${cat.minimo_ordine.toFixed(2).replace('.',',')}</span>
            </div>
            <div class="progress" style="height: 12px; border-radius: 10px;">
              <div class="progress-bar ${coloreBarra} progress-bar-striped progress-bar-animated" style="width: ${perc}%;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  });
  app.innerHTML = html;
  aggiornaBarraStickyCarrello();
}

export async function apriCategoria(idCategoria, nomeCategoria, minimoOrdine, idCampagna, nomeCampagna) {
  if (!AppState.bottegaAttivaId) return alert("Seleziona una bottega dal menu in alto per iniziare!");
  AppState.categoriaAttivaId = idCategoria;

  const app = document.getElementById('app-container');
  app.innerHTML = '<div class="spinner-border text-brand mx-auto mt-5"></div><p class="text-muted mt-2">Caricamento articoli...</p>';

  const { data: produttori, error: errP } = await clientDB.from('produttori').select('*').eq('id_categoria', idCategoria).order('nome_produttore');
  if (errP) { app.innerHTML = `<p class="text-danger fw-bold">Errore caricamento produttori: ${errP.message}</p>`; return; }
  
  const prodMap = {};
  const prodIds = [];
  produttori.forEach(p => {
    prodMap[p.id_produttore] = p.nome_produttore;
    prodIds.push(p.id_produttore);
  });

  let prodotti = [];
  if (prodIds.length > 0) {
    const { data: dataProdotti, error: errProd } = await clientDB.from('prodotti').select('*').in('id_produttore', prodIds).order('nome');
    if (errProd) { app.innerHTML = `<p class="text-danger fw-bold">Errore caricamento prodotti: ${errProd.message}</p>`; return; }
    prodotti = dataProdotti || [];
  }
  
  let html = `
  <div class="col-12 mb-4 text-start">
    <button class="btn btn-outline-secondary btn-sm mb-3 fw-bold" onclick="apriCampagna(${idCampagna}, '${nomeCampagna.replace("'", "\\'")}')">← Torna a Categorie</button>
    <div class="d-flex justify-content-between align-items-center flex-wrap">
      <h3 class="fw-bold text-brand mb-0">Categoria: ${nomeCategoria}</h3>
      <div class="p-2 bg-light rounded border mt-2 mt-md-0">
        <span class="small text-muted fw-bold d-block">Stato Minimo:</span>
        <span class="badge ${calcolaTotaleCarrelloPerCategoria(idCategoria) >= minimoOrdine ? 'bg-success' : 'bg-warning text-dark'} fs-6">
          € ${calcolaTotaleCarrelloPerCategoria(idCategoria).toFixed(2).replace('.',',')} / € ${minimoOrdine.toFixed(2).replace('.',',')}
        </span>
      </div>
    </div>
  </div>
  <div class="row w-100 m-0">`;

  if (prodotti.length === 0) html += `<div class="col-12 text-start"><p class="text-muted fw-bold">Nessun prodotto inserito per questa categoria.</p></div>`;

  prodotti.forEach(p => {
    const cod = p.codice_articolo;
    const safeNome = p.nome.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeDesc = p.descrizione ? p.descrizione.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
    
    const nomeProduttore = prodMap[p.id_produttore] || 'Produttore Unico';
    const safeNomeProduttore = nomeProduttore.replace(/'/g, "\\'");
    
    const imgUrl = `${SUPABASE_URL}/storage/v1/object/public/foto/${cod}.webp`;
    const itemInCart = AppState.carrello.find(i => i.codice_articolo === cod && i.id_bottega == AppState.bottegaAttivaId);
    const qtaAttuale = itemInCart ? itemInCart.quantita : 0;
    
    html += `
    <div class="col-xl-3 col-lg-4 col-sm-6 product-card text-start mb-4">
      <div class="card shadow-sm h-100">
        <div style="height: 200px; background: #fff; border-radius: 10px 10px 0 0; display: flex; align-items: center; justify-content: center; padding: 15px; position: relative; cursor: pointer;" onclick="apriGalleria('${cod}', '${safeNome}', ${p.prezzo_netto}, ${idCategoria}, ${p.id_produttore}, '${safeNomeProduttore}', ${p.pvp}, '${safeDesc}')">
          <img src="${imgUrl}" 
               onerror="gestisciErroreFoto(this, '${cod}')" 
               style="max-height: 100%; max-width: 100%; object-fit: contain; transition: 0.3s;" 
               onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
          <span class="badge bg-dark text-white position-absolute top-0 start-0 m-2 opacity-75">${nomeProduttore}</span>
          <div class="position-absolute bottom-0 end-0 m-2 text-brand bg-white rounded-circle shadow-sm" style="padding: 4px 8px; opacity: 0.9;">🔍</div>
        </div>
        <div class="card-body d-flex flex-column bg-white border-top p-3">
          <h6 class="card-title fw-bold text-dark mt-1 mb-1" style="font-size: 0.95rem; line-height: 1.2;" title="${safeNome}">${p.nome}</h6>
          <p class="text-muted small mb-2">Cod: ${cod}</p>
          
          <div class="mt-auto mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="text-muted small">PVP Pubblico:</span>
              <span class="text-secondary small fw-bold">€ ${p.pvp.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center bg-light p-2 rounded">
              <span class="text-dark fw-bold small">Costo Netto:</span>
              <h5 class="text-brand fw-bold mb-0">€ ${p.prezzo_netto.toFixed(2).replace('.', ',')}</h5>
            </div>
          </div>

          <div class="d-flex align-items-center">
            <div class="input-group me-2" style="width: 110px;">
              <button class="btn btn-outline-secondary btn-qta px-2" onclick="modificaQtaGriglia('${cod}', -1, '${safeNome}', ${p.prezzo_netto}, ${idCategoria}, ${p.id_produttore}, '${safeNomeProduttore}')">-</button>
              <input type="number" class="form-control text-center fw-bold p-0" value="${qtaAttuale > 0 ? qtaAttuale : 1}" min="1" id="qty_${cod}">
              <button class="btn btn-outline-secondary btn-qta px-2" onclick="modificaQtaGriglia('${cod}', 1, '${safeNome}', ${p.prezzo_netto}, ${idCategoria}, ${p.id_produttore}, '${safeNomeProduttore}')">+</button>
            </div>
            <button id="btn_grid_${cod}" class="btn btn-brand flex-grow-1 px-1 fw-bold shadow-sm" onclick="applicaQtaDalBottone('${cod}', '${safeNome}', ${p.prezzo_netto}, ${idCategoria}, ${p.id_produttore}, '${safeNomeProduttore}')">
              ${qtaAttuale > 0 ? 'Aggiorna' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  });
  
  html += `</div>`;
  app.innerHTML = html;
  aggiornaBarraStickyCarrello();
}

export function apriGalleria(codice, nome, prezzoNetto, idCategoria, idProduttore, nomeProduttore, pvp, descrizione) {
  document.getElementById('galleryModalLabel').innerText = nome;
  const carouselInner = document.getElementById('carousel-inner-content');
  carouselInner.innerHTML = ''; 

  const estensioni = ['', ' (1)', ' (2)', ' (3)'];
  let html = '';

  estensioni.forEach((ext, i) => {
    const imgUrl = `${SUPABASE_URL}/storage/v1/object/public/foto/${codice}${ext}.webp`;
    html += `
    <div class="carousel-item ${i === 0 ? 'active' : ''} p-3">
      <img src="${imgUrl}" class="d-block mx-auto" style="height: 45vh; max-width: 100%; object-fit: contain;" onerror="this.parentElement.remove();">
    </div>`;
  });
  carouselInner.innerHTML = html;

  const itemInCart = AppState.carrello.find(i => i.codice_articolo === codice && i.id_bottega == AppState.bottegaAttivaId);
  const qtaAttuale = itemInCart ? itemInCart.quantita : 0;

  const detailsPanel = document.getElementById('modal-product-details');
  detailsPanel.innerHTML = `
    <div class="row m-0 w-100">
      <div class="col-md-7 p-0 pe-md-3 mb-3 mb-md-0">
        <h6 class="fw-bold text-brand mb-1">Descrizione Prodotto</h6>
        <p class="text-secondary small mb-3" style="line-height:1.4;">${descrizione || 'Nessuna descrizione aggiuntiva inserita per questo articolo.'}</p>
        <div class="d-flex gap-2">
          <span class="badge bg-light text-muted border px-2 py-1 small">Cod: ${codice}</span>
          <span class="badge bg-dark text-white border px-2 py-1 small">${nomeProduttore}</span>
        </div>
      </div>
      <div class="col-md-5 bg-light p-3 rounded border">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted small">PVP Pubblico:</span>
          <span class="text-secondary small fw-bold">€ ${pvp ? pvp.toFixed(2).replace('.', ',') : '0,00'}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center border-top pt-2 mb-3">
          <span class="text-dark fw-bold small">Costo Netto:</span>
          <h4 class="text-brand fw-bold mb-0">€ ${prezzoNetto.toFixed(2).replace('.', ',')}</h4>
        </div>
        
        <div class="d-flex align-items-center">
          <div class="input-group me-2" style="width: 110px;">
            <button class="btn btn-outline-secondary fw-bold px-2 py-1" style="font-size:0.9rem;" onclick="modificaQtaModal(-1)">-</button>
            <input type="number" class="form-control text-center fw-bold p-0" value="${qtaAttuale > 0 ? qtaAttuale : 1}" min="1" id="modal-qty">
            <button class="btn btn-outline-secondary fw-bold px-2 py-1" style="font-size:0.9rem;" onclick="modificaQtaModal(1)">+</button>
          </div>
          <button class="btn btn-brand flex-grow-1 fw-bold shadow-sm py-1" style="font-size:0.95rem;" id="modal-add-btn" onclick="applicaQtaDalModal('${codice}', '${nome.replace(/'/g, "\\'")}', ${prezzoNetto}, ${idCategoria}, ${idProduttore}, '${nomeProduttore.replace(/'/g, "\\'")}')">
            ${qtaAttuale > 0 ? 'Aggiorna' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>`;

  new bootstrap.Modal(document.getElementById('galleryModal')).show();
}
