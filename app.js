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
// Aggiungiamo lo stato al nostro AppState
AppState.fornitori = [];

async function caricaFornitori() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="spinner-border text-brand mx-auto mt-5"></div>';

    // Peschiamo i fornitori dal DB
    const { data: fornitori, error } = await clientDB.from('fornitori').select('*').order('nome');
    
    if (error) {
        app.innerHTML = `<p class="text-danger fw-bold mt-4">Errore caricamento fornitori.</p>`;
        return;
    }

    AppState.fornitori = fornitori;
    disegnaVetrinaFornitori();
}

function disegnaVetrinaFornitori() {
    const app = document.getElementById('app');
    let html = `<div class="col-12 mb-4 text-start">
                    <h3 class="fw-bold text-brand">I Nostri Fornitori</h3>
                    <p class="text-muted">Seleziona un fornitore per visualizzare il catalogo e iniziare l'ordine.</p>
                </div>`;

    AppState.fornitori.forEach(f => {
        html += `
        <div class="col-md-6 col-lg-4 mb-4 text-start">
            <div class="card shadow-sm h-100 border-0" style="border-top: 5px solid var(--brand) !important; cursor: pointer; transition: transform 0.2s;" onclick="apriCatalogoFornitore('${f.nome}')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="card-body p-4 d-flex flex-column">
                    <h4 class="fw-bold text-dark mb-3">${f.nome}</h4>
                    <div class="mt-auto p-3 bg-light rounded border border-secondary-subtle">
                        <span class="text-muted small fw-bold d-block mb-1">Minimo d'ordine richiesto:</span>
                        <h5 class="text-brand fw-bold mb-0">€ ${f.minimo_ordine.toFixed(2).replace('.', ',')}</h5>
                    </div>
                </div>
            </div>
        </div>`;
    });

    app.innerHTML = html;
}

function apriCatalogoFornitore(nomeFornitore) {
    // Verifica se l'utente ha selezionato una bottega prima di farlo comprare
    const bottegaSelezionata = document.getElementById('global-bottega-selector').value;
    if(!bottegaSelezionata) {
        alert("Prima di iniziare gli acquisti, seleziona una bottega dal menu in alto!");
        return;
    }
    
    console.log("Apro catalogo per: ", nomeFornitore);
    // Qui chiameremo la funzione che fa la query su 'prodotti' filtrando per fornitore
    // E disegnerà la griglia dei prodotti con i pulsanti "Aggiungi"
}
