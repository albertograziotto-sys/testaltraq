// 1. Configurazione Supabase
const SUPABASE_URL = 'https://tmaxqbosibkxrghgwfzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXhxYm9zaWJreHJnaGd3ZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODA2MjUsImV4cCI6MjA5OTk1NjYyNX0.xMVQd7yHyUuoCyH1JajJttYRNR5qhEy_W6TsMcDgJA0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Riferimenti alla UI
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const userMenu = document.getElementById('user-menu');
const adminEmail = document.getElementById('admin-email');
const loginError = document.getElementById('login-error');
const tableBody = document.getElementById('orders-table-body');
const filterCategoria = document.getElementById('filter-categoria');

let ordiniCorrenti = [];

// 3. Gestore dello Stato di Autenticazione
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        loginSection.classList.add('d-none');
        dashboardSection.classList.remove('d-none');
        userMenu.classList.remove('d-none');
        adminEmail.textContent = session.user.email;
        initDashboard();
    } else {
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

    if (error) return;

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
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Errore nel caricamento.</td></tr>';
        return;
    }

    ordiniCorrenti = data;
    renderTabella(ordiniCorrenti);
}

// 8. Disegna la Tabella
function renderTabella(ordini) {
    tableBody.innerHTML = '';
    
    document.getElementById('select-all').checked = false;
    
    if (ordini.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nessun nuovo ordine da processare.</td></tr>';
        return;
    }

    ordini.forEach(ordine => {
        const dataFormattata = new Date(ordine.data_ordine).toLocaleDateString('it-IT');
        const clienteNome = ordine.clienti ? ordine.clienti.ragione_sociale : 'Sconosciuto';
        const bottegaNome = ordine.botteghe ? ordine.botteghe.nome_bottega : 'Sconosciuta';
        const categoriaNome = ordine.categorie ? ordine.categorie.nome_categoria : 'Sconosciuta';

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

// 10. Gestione Checkbox "Seleziona Tutti"
document.getElementById('select-all').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

// 11. Azione: Segna come Presi in Carico
document.getElementById('btn-mark-downloaded').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    const ordiniSelezionati = Array.from(checkboxes).map(cb => cb.value);

    if (ordiniSelezionati.length === 0) {
        alert("Seleziona almeno un ordine da prendere in carico.");
        return;
    }

    const conferma = confirm(`Stai per segnare ${ordiniSelezionati.length} ordini come presi in carico. Procedere?`);
    if (!conferma) return;

    const btn = document.getElementById('btn-mark-downloaded');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Aggiornamento...';
    btn.disabled = true;

    const { error } = await supabaseClient
        .from('ordini_testata')
        .update({ flag_scaricato: true })
        .in('id_ordine', ordiniSelezionati);

    if (error) {
        alert("Errore durante l'aggiornamento: " + error.message);
    } else {
        await fetchOrdini(); 
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
});

// 12. Azione: Esporta in CSV
document.getElementById('btn-export-csv').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    const ordiniSelezionatiIDs = Array.from(checkboxes).map(cb => cb.value);

    if (ordiniSelezionatiIDs.length === 0) {
        alert("Seleziona almeno un ordine da esportare.");
        return;
    }

    const btn = document.getElementById('btn-export-csv');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Esportazione...';
    btn.disabled = true;

    console.log("IDs ordini selezionati:", ordiniSelezionatiIDs);

    // Recupera i dettagli degli ordini selezionati
    const { data: dettagli, error } = await supabaseClient
        .from('ordini_dettaglio')
        .select('*')
        .in('id_ordine', ordiniSelezionatiIDs);

    if (error) {
        console.error("Errore Supabase dettagli:", error);
        alert("Errore durante il recupero dei dettagli: " + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    console.log("Dettagli ricevuti da Supabase:", dettagli);

    if (!dettagli || dettagli.length === 0) {
        alert("Nessun articolo/dettaglio trovato su Supabase per gli ordini selezionati.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Creazione del contenuto CSV (con BOM per supportare gli accenti su Excel)
    let csvContent = "\uFEFF"; 
    csvContent += "ID Ordine;Data;Cliente;Bottega;Categoria;Codice Articolo;Quantità;Prezzo Unitario;Totale Riga\n";

    let righeAggiunte = 0;

    dettagli.forEach(dettaglio => {
        // Conversione forzata in stringa per evitare fallimenti da disallineamento Int/String/UUID
        const testata = ordiniCorrenti.find(o => String(o.id_ordine) === String(dettaglio.id_ordine));
        
        if (testata) {
            const dataOrdine = testata.data_ordine ? new Date(testata.data_ordine).toLocaleDateString('it-IT') : '';
            const cliente = testata.clienti ? String(testata.clienti.ragione_sociale).replace(/;/g, ',') : '';
            const bottega = testata.botteghe ? String(testata.botteghe.nome_bottega).replace(/;/g, ',') : '';
            const categoria = testata.categorie ? String(testata.categorie.nome_categoria).replace(/;/g, ',') : '';
            
            const qta = dettaglio.quantita || 0;
            const prezzo = dettaglio.prezzo_unitario_applicato || 0;
            const totaleRiga = (qta * prezzo).toFixed(2);
            const prezzoUnitario = Number(prezzo).toFixed(2);

            csvContent += `${dettaglio.id_ordine};${dataOrdine};"${cliente}";"${bottega}";"${categoria}";"${dettaglio.codice_articolo}";${qta};${prezzoUnitario};${totaleRiga}\n`;
            righeAggiunte++;
        }
    });

    if (righeAggiunte === 0) {
        alert("Impossibile associare gli articoli alle testate degli ordini.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    // Avvia il download del file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `esportazione_ordini_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    btn.innerHTML = originalText;
    btn.disabled = false;
});
