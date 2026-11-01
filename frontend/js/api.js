(() => {
  const cfg = window.MOODNEST_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  window.moodnestSupabaseConfigured = Boolean(configured);
  window.moodnestSupabase = configured && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;

  const apiBase = cfg.API_BASE_URL || "";
  async function request(path, options = {}) {
    if (!window.moodnestSupabase) throw new Error("Add your Supabase URL and publishable/anon key in frontend/js/config.js first.");
    const { data: { session } } = await window.moodnestSupabase.auth.getSession();
    if (!session?.access_token) {
      if (!location.pathname.endsWith("login.html")) location.href = "login.html";
      throw new Error("Please sign in to continue.");
    }
    const response = await fetch(`${apiBase}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        ...(options.headers || {})
      }
    });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
    return payload;
  }
  window.MoodNestAPI = {
    request,
    get: path => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: path => request(path, { method: "DELETE" })
  };
  window.moodnestToast = function(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__moodnestToastTimer);
    window.__moodnestToastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  };
})();