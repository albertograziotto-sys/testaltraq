// Inizializzazione Supabase
const SUPABASE_URL = 'https://tmaxqbosibkxrghgwfzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXhxYm9zaWJreHJnaGd3ZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODA2MjUsImV4cCI6MjA5OTk1NjYyNX0.xMVQd7yHyUuoCyH1JajJttYRNR5qhEy_W6TsMcDgJA0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Stato globale della SPA
const AppState = {
    user: null,
    botteghe: [],
    bottegaAttiva: null,
    carrelli: {} 
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App inizializzata. Connessione a Supabase stabilita.");
    // Prossimo step: Check sessione e Auth
});
