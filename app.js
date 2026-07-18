// Inizializzazione Supabase (inserirai le tue chiavi dopo)
const SUPABASE_URL = 'https://tuo-progetto.supabase.co';
const SUPABASE_ANON_KEY = 'la-tua-anon-key';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Stato globale della SPA
const AppState = {
    user: null,
    botteghe: [],
    bottegaAttiva: null,
    carrelli: {} // Es: { 'id_bottega_1': { 'FornitoreA': [], 'FornitoreB': [] } }
};

// Esegui al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    console.log("App inizializzata. In attesa di login...");
    // Qui metteremo il controllo della sessione utente
});
