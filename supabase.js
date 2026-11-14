
// =====================================
// SCOTLAND YARD – SUPABASE VERBINDUNG
// =====================================

const SUPABASE_URL =
    "https://shludjcxsbnrbpkopjzw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_2wXa2vJgDgoevZSgZ15-tA_WxEXaezP";

// Supabase-Verbindung herstellen
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Global verfügbar machen
window.supabaseClient = supabaseClient;

console.log("Supabase erfolgreich initialisiert!");
