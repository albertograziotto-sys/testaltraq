// 1. Configurazione Supabase
const SUPABASE_URL = 'https://tmaxqbosibkxrghgwfzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXhxYm9zaWJreHJnaGd3ZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODA2MjUsImV4cCI6MjA5OTk1NjYyNX0.xMVQd7yHyUuoCyH1JajJttYRNR5qhEy_W6TsMcDgJA0';

// ERRORE CORRETTO: Chiamiamo la variabile supabaseClient invece di supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Riferimenti alla UI
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const userMenu = document.getElementById('user-menu');
const adminEmail = document.getElementById('admin-email');
const loginError = document.getElementById('login-error');
const tableBody = document.getElementById('orders-table-body');
const filterCategoria = document.getElementById('filter-categoria');

// Variabile globale per salvare gli ordini in memoria (utile per i filtri e l'export)
let ordiniCorrenti = [];

// 3. Gestore dello Stato di Autenticazione
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        // Mostra Dashboard
        loginSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        userMenu.classList.remove('d-none');
        adminEmail.textContent = session.user.email;
        
        initDashboard();
    } else {
        // Mostra Login
        loginSection.classList.remove('d-none');
        dashboardSection.classList.add('d-none');
        userMenu.classList.add('d-none');
    }
});

// 4. Logica di Login e Logout
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = "Errore di accesso: " + error.message;
        loginError.classList.remove('d-none');
    } else {
        loginError.classList.add('d-none');
        document.getElementById('login-form').reset();
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// 5. Inizializzazione Dashboard
async function initDashboard() {
    await fetchCategorie();
    await fetchOrdini();
}

// 6. Recupero Categorie (per la select dei filtri)
async function fetchCategorie() {
    const { data, error } = await supabaseClient
        .from('categorie')
        .select('id_categoria, nome_categoria')
        .order('nome_categoria');

    if (error) {
        console.error("Errore recupero categorie:", error);
        return;
    }

    // Pulisce e popola la select mantenendo la prima opzione
    filterCategoria.innerHTML = '<option value="">Tutte le categorie</option>';
    data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id_categoria;
        option.textContent = cat.nome_categoria;
        filterCategoria.appendChild(option);
    });
}

// 7. Recupero Ordini in Ingresso
async function fetchOrdini() {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Caricamento in corso...</td></tr>';

    const { data, error } = await supabaseClient
        .from('ordini_testata')
        .select(`
            id_ordine,
            data_ordine,
            flag_scaricato,
            id_categoria,
            clienti ( ragione_sociale ),
            botteghe ( nome_bottega ),
            categorie ( nome_categoria )
        `)
        .eq('flag_scaricato', false)
        .order('data_ordine', { ascending: false });

    if (error) {
        console.error("Errore recupero ordini:", error);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Errore nel caricamento dei dati.</td></tr>';
        return;
    }

    ordiniCorrenti = data;
    renderTabella(ordiniCorrenti);
}

// 8. Disegna la Tabella
function renderTabella(ordini) {
    tableBody.innerHTML = '';
    
    if (ordini.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nessun nuovo ordine da processare.</td></tr>';
        return;
    }

    ordini.forEach(ordine => {
        const dataFormattata = new Date(ordine.data_ordine).toLocaleDateString('it-IT');
        const clienteNome = ordine.clienti ? ordine.clienti.ragione_sociale : 'Cliente sconosciuto';
        const bottegaNome = ordine.botteghe ? ordine.botteghe.nome_bottega : 'Bottega sconosciuta';
        const categoriaNome = ordine.categorie ? ordine.categorie.nome_categoria : 'Categoria sconosciuta';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="order-checkbox" value="${ordine.id_ordine}"></td>
            <td>${dataFormattata}</td>
            <td><strong>${clienteNome}</strong></td>
            <td>${bottegaNome}</td>
            <td><span class="badge bg-secondary">${categoriaNome}</span></td>
            <td>-</td>
            <td><span class="badge bg-warning text-dark">Da processare</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

// 9. Gestione Filtro per Categoria
filterCategoria.addEventListener('change', (e) => {
    const categoriaSelezionata = e.target.value;
    
    if (categoriaSelezionata === "") {
        renderTabella(ordiniCorrenti);
    } else {
        const ordiniFiltrati = ordiniCorrenti.filter(o => String(o.id_categoria) === String(categoriaSelezionata));
        renderTabella(ordiniFiltrati);
    }
});
