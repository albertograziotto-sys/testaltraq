// 1. Configurazione Supabase
const SUPABASE_URL = 'INSERISCI_IL_TUO_URL';
const SUPABASE_ANON_KEY = 'INSERISCI_LA_TUA_CHIAVE_ANONIMA';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Riferimenti alla UI
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const userMenu = document.getElementById('user-menu');
const adminEmail = document.getElementById('admin-email');

// 3. Gestore dello Stato di Autenticazione (Listener)
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        // Utente loggato: mostra la dashboard
        loginSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        userMenu.classList.remove('d-none');
        adminEmail.textContent = session.user.email;
        
        // Avvia il caricamento dei dati
        initDashboard();
    } else {
        // Utente non loggato: mostra il form di login
        loginSection.classList.remove('d-none');
        dashboardSection.classList.add('d-none');
        userMenu.classList.add('d-none');
    }
});

function initDashboard() {
    console.log("Caricamento dati in corso...");
    // Qui inseriremo le funzioni:
    // fetchCategorie()
    // fetchOrdiniDaProcessare()
}
