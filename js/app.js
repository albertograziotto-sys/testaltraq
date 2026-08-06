import { clientDB } from './config.js';
import { AppState } from './state.js';
import { eseguiLogin, eseguiRegistrazione, eseguiRecuperoPassword, salvaNuovaPassword, eseguiLogout, togglePassword } from './auth.js';
import { caricaBotteghe, cambiaBottegaAttiva, aggiungiBottega, eliminaBottega, salvaModificaBottega } from './botteghe.js';
import { caricaCampagne, apriCampagna, apriCategoria, apriGalleria, gestisciErroreFoto } from './catalog.js';
import { modificaQtaGriglia, modificaQtaModal, applicaQtaDalBottone, applicaQtaDalModal, modificaQtaDalCarrello, rimuoviDalCarrello } from './cart.js';
import { mostraRiepilogoCarrello, toggleForzaInvio, inviaOrdineDefinitivo } from './checkout.js';
import { caricaStoricoOrdini } from './orders.js';

export function cambiaVista(vistaID) {
  ['login-section', 'register-section', 'forgot-password-section', 'dashboard-wrapper', 'main-navbar', 'cart-sticky-bar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (vistaID === 'login-section' || vistaID === 'register-section' || vistaID === 'forgot-password-section') {
    document.getElementById(vistaID).style.display = 'flex';
  } else {
    document.getElementById('main-navbar').style.display = 'flex';
    document.getElementById('dashboard-wrapper').style.display = 'block';
    navigaA(vistaID);
  }
}

export function navigaA(sezione) {
  ['app-section', 'orders-section', 'checkout-section', 'profile-section'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById(sezione).style.display = 'block';
  
  document.getElementById('cart-sticky-bar').style.display = (sezione === 'app-section') ? 'flex' : 'none';

  document.querySelectorAll('.sidebar-menu button').forEach(b => {
    b.classList.remove('active', 'fw-bold'); 
    b.classList.add('text-secondary', 'fw-semibold');
  });

  if (sezione === 'app-section') {
    document.getElementById('nav-fornitori').classList.add('active', 'fw-bold');
  }
  if (sezione === 'orders-section') {
    document.getElementById('nav-ordini').classList.add('active', 'fw-bold');
    caricaStoricoOrdini();
  }
  if (sezione === 'profile-section') {
    document.getElementById('nav-profilo').classList.add('active', 'fw-bold');
  }

  const offcanvasMenu = document.getElementById('sidebarMenu');
  if (offcanvasMenu && window.innerWidth < 768) {
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasMenu);
    if (bsOffcanvas) bsOffcanvas.hide();
  }
}

export async function inizializzaDashboard() {
  document.getElementById('nome-cliente-display').innerText = AppState.user.ragione_sociale;
  document.getElementById('prof-ragione').value = AppState.user.ragione_sociale || ''; 
  document.getElementById('prof-email').value = AppState.user.email || '';
  
  const { data: tutteLeCategorie } = await clientDB.from('categorie').select('*').order('nome_categoria');
  if (tutteLeCategorie) AppState.categorieCache = tutteLeCategorie;

  cambiaVista('app-section');
  await caricaBotteghe();
}

// Esposizione funzioni su window per la compatibilità con gli attributi HTML (onclick, onchange, onerror)
Object.assign(window, {
  cambiaVista,
  navigaA,
  togglePassword,
  eseguiLogin,
  eseguiRegistrazione,
  eseguiRecuperoPassword,
  salvaNuovaPassword,
  eseguiLogout,
  cambiaBottegaAttiva,
  aggiungiBottega,
  eliminaBottega,
  salvaModificaBottega,
  caricaCampagne,
  apriCampagna,
  apriCategoria,
  apriGalleria,
  gestisciErroreFoto,
  modificaQtaGriglia,
  modificaQtaModal,
  applicaQtaDalBottone,
  applicaQtaDalModal,
  modificaQtaDalCarrello,
  rimuoviDalCarrello,
  mostraRiepilogoCarrello,
  toggleForzaInvio,
  inviaOrdineDefinitivo,
  caricaStoricoOrdini
});

// Event Listener di avvio
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await clientDB.auth.getSession();
  if (session) {
    const { data: clienteData } = await clientDB.from('clienti').select('*').eq('id', session.user.id).single();
    if (clienteData) {
      AppState.user = clienteData;
      if (clienteData.carrello_bozza) {
        AppState.carrello = clienteData.carrello_bozza;
      }
      inizializzaDashboard();
    }
  }
});
