import { supabaseClient } from './config.js';
import { fetchCategorie, fetchOrdini } from './admin-table.js';

export function inizializzaAuth() {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const userMenu = document.getElementById('user-menu');
  const adminEmail = document.getElementById('admin-email');
  const loginError = document.getElementById('login-error');

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const { data: cliente } = await supabaseClient
        .from('clienti')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cliente) {
        await supabaseClient.auth.signOut();
        loginError.textContent = "Accesso Negato: Questo account appartiene a un cliente B2B. Utilizza il portale principale.";
        loginError.classList.remove('d-none');
        return;
      }

      loginError.classList.add('d-none');
      loginSection.classList.add('d-none');
      dashboardSection.classList.remove('d-none');
      userMenu.classList.remove('d-none');
      adminEmail.textContent = session.user.email;
      
      await fetchCategorie();
      await fetchOrdini();
    } else {
      loginSection.classList.remove('d-none');
      dashboardSection.classList.add('d-none');
      userMenu.classList.add('d-none');
    }
  });
}

export async function eseguiLogin(email, password) {
  const loginError = document.getElementById('login-error');
  loginError.classList.add('d-none');

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = "Errore di accesso: " + error.message;
    loginError.classList.remove('d-none');
  } else {
    document.getElementById('login-form').reset();
  }
}

export async function eseguiLogout() {
  await supabaseClient.auth.signOut();
}
