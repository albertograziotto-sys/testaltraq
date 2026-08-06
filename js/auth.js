import { clientDB } from './config.js';
import { AppState } from './state.js';
import { cambiaVista, inizializzaDashboard } from './app.js';

export function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

export async function eseguiRegistrazione() {
  const ragSoc = document.getElementById('reg-ragionesociale').value.trim();
  const piva = document.getElementById('reg-piva').value.trim();
  const tel = document.getElementById('reg-telefono').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const psw = document.getElementById('reg-password').value.trim();
  const btn = document.getElementById('btn-register');

  if (!ragSoc || !email || !psw) return alert("Compila Ragione Sociale, Email e Password!");
  if (psw.length < 6) return alert("La password deve avere almeno 6 caratteri.");
  
  btn.innerText = "Creazione in corso..."; 
  btn.disabled = true;

  const { data: authData, error: authError } = await clientDB.auth.signUp({ email, password: psw });
  if (authError) { 
    alert("Errore registrazione: " + authError.message); 
    btn.innerText = "Crea Account Sicuro"; 
    btn.disabled = false; 
    return; 
  }

  const userId = authData.user.id;
  const { error: dbError } = await clientDB.from('clienti').insert([{ 
    id: userId, 
    email, 
    password: psw, 
    ragione_sociale: ragSoc, 
    partita_iva: piva, 
    telefono: tel 
  }]);

  if (dbError) {
    alert("Account creato ma anagrafica non salvata: " + dbError.message);
  } else {
    document.getElementById('success-modal-msg').innerHTML = `Ti abbiamo inviato un'email a <b>${email}</b>. Clicca sul link all'interno per confermare l'account.`;
    new bootstrap.Modal(document.getElementById('successModal')).show();
    document.getElementById('successModal').addEventListener('hidden.bs.modal', () => {
      cambiaVista('login-section'); 
      document.getElementById('login-email').value = email;
    }, { once: true });
  }
  btn.innerText = "Crea Account Sicuro"; 
  btn.disabled = false;
}

export async function eseguiRecuperoPassword() {
  const email = document.getElementById('recupero-email').value.trim().toLowerCase();
  if (!email) return alert("Inserisci l'email.");
  const { error } = await clientDB.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) alert("Errore: " + error.message); 
  else alert("Email inviata!");
}

export async function salvaNuovaPassword() {
  const psw = document.getElementById('prof-nuova-psw').value.trim();
  if (psw.length < 6) return alert("Minimo 6 caratteri.");
  const { error } = await clientDB.auth.updateUser({ password: psw });
  if (error) {
    alert("Errore: " + error.message);
  } else { 
    await clientDB.from('clienti').update({ password: psw }).eq('id', AppState.user.id);
    alert("Password aggiornata!"); 
    document.getElementById('prof-nuova-psw').value = ''; 
  }
}

export async function eseguiLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const psw = document.getElementById('login-password').value.trim();
  const btn = document.getElementById('btn-login'); 
  const errorMsg = document.getElementById('login-error');
  
  if (!email || !psw) return;
  btn.innerText = "Autenticazione in corso..."; 
  btn.disabled = true; 
  errorMsg.style.display = 'none';

  const { error: authError } = await clientDB.auth.signInWithPassword({ email, password: psw });
  if (authError) { 
    errorMsg.style.display = 'block'; 
    btn.innerText = "Accedi al Portale"; 
    btn.disabled = false; 
    return; 
  }
  
  const { data: clienteData, error: dbError } = await clientDB.from('clienti').select('*').eq('email', email).single();
  if (dbError || !clienteData) { 
    alert("Anagrafica non trovata."); 
    await clientDB.auth.signOut(); 
    btn.innerText = "Accedi al Portale"; 
    btn.disabled = false; 
    return; 
  }

  AppState.user = clienteData; 
  AppState.carrello = clienteData.carrello_bozza || [];
  
  inizializzaDashboard();
}

export async function eseguiLogout() {
  await clientDB.auth.signOut(); 
  AppState.user = null; 
  AppState.carrello = [];
  document.getElementById('login-password').value = ''; 
  const btn = document.getElementById('btn-login'); 
  if (btn) { btn.innerText = "Accedi al Portale"; btn.disabled = false; }
  cambiaVista('login-section');
}
