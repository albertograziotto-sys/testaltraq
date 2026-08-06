// js/config.js
export const SUPABASE_URL = 'https://tmaxqbosibkxrghgwfzi.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXhxYm9zaWJreHJnaGd3ZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODA2MjUsImV4cCI6MjA5OTk1NjYyNX0.xMVQd7yHyUuoCyH1JajJttYRNR5qhEy_W6TsMcDgJA0';

export const clientDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Alias per garantire la compatibilità con i moduli dell'Admin
export const supabaseClient = clientDB;
