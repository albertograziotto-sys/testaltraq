import { supabaseClient } from './config.js';
import { AdminState } from './admin-state.js';

function scaricaFileCSV(contenuto, nomeFile) {
  const blob = new Blob([contenuto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeFile);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function esportaDettaglioBotteghe() {
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

  const { data: dettagli, error } = await supabaseClient
    .from('ordini_dettaglio')
    .select('*')
    .in('id_ordine', ordiniSelezionatiIDs);

  if (error || !dettagli || dettagli.length === 0) {
    alert("Errore o nessun articolo trovato per gli ordini selezionati.");
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  let csvContent = "\uFEFF"; 
  csvContent += "ID Ordine;Data;Cliente;Bottega;Categoria;Codice Articolo;Quantità;Prezzo Unitario;Totale Riga\n";

  dettagli.forEach(dettaglio => {
    const testata = AdminState.ordiniCorrenti.find(o => String(o.id_ordine) === String(dettaglio.id_ordine));
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
    }
  });

  scaricaFileCSV(csvContent, `dettaglio_botteghe_${new Date().toISOString().split('T')[0]}.csv`);

  btn.innerHTML = originalText;
  btn.disabled = false;
}

export async function esportaTotaliFornitore() {
  const checkboxes = document.querySelectorAll('.order-checkbox:checked');
  const ordiniSelezionatiIDs = Array.from(checkboxes).map(cb => cb.value);

  if (ordiniSelezionatiIDs.length === 0) {
    alert("Seleziona gli ordini di cui vuoi calcolare i totali per il fornitore.");
    return;
  }

  const btn = document.getElementById('btn-export-summary');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Calcolo...';
  btn.disabled = true;

  const { data: dettagli, error } = await supabaseClient
    .from('ordini_dettaglio')
    .select('*')
    .in('id_ordine', ordiniSelezionatiIDs);

  if (error || !dettagli || dettagli.length === 0) {
    alert("Errore o nessun articolo trovato per gli ordini selezionati.");
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  const riassuntoArticoli = {};

  dettagli.forEach(dettaglio => {
    const cod = dettaglio.codice_articolo;
    const qta = Number(dettaglio.quantita) || 0;
    const prezzo = Number(dettaglio.prezzo_unitario_applicato) || 0;

    if (!riassuntoArticoli[cod]) {
      riassuntoArticoli[cod] = {
        codice: cod,
        quantitaTotale: 0,
        prezzoUnitario: prezzo
      };
    }
    riassuntoArticoli[cod].quantitaTotale += qta;
  });

  let csvContent = "\uFEFF"; 
  csvContent += "Codice Articolo;Quantità Totale Ordinata;Prezzo Unitario Applicato;Importo Totale Estimativo\n";

  Object.values(riassuntoArticoli).forEach(item => {
    const totaleEuro = (item.quantitaTotale * item.prezzoUnitario).toFixed(2);
    const prezzoUnit = item.prezzoUnitario.toFixed(2);
    csvContent += `"${item.codice}";${item.quantitaTotale};${prezzoUnit};${totaleEuro}\n`;
  });

  scaricaFileCSV(csvContent, `totali_fornitore_${new Date().toISOString().split('T')[0]}.csv`);

  btn.innerHTML = originalText;
  btn.disabled = false;
}
