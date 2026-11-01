document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.moodnestSupabase;
  const isLogin = location.pathname.endsWith("login.html");
  if (!supabase) {
    if (isLogin) {
      const message = document.getElementById("auth-message");
      if (message) { message.textContent = "Setup needed: add your Supabase URL and publishable/anon key to frontend/js/config.js."; message.classList.add("error"); }
    } else {
      location.href = "login.html";
    }
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (isLogin && session) { location.href = "index.html"; return; }
  if (!isLogin && !session) { location.href = "login.html"; return; }

  if (!isLogin && session) {
    const email = session.user.email || "Your account";
    const name = session.user.user_metadata?.full_name || email.split("@")[0] || "Friend";
    const nameNode = document.getElementById("user-name");
    const emailNode = document.getElementById("user-email");
    const avatarNode = document.getElementById("user-avatar");
    if (nameNode) nameNode.textContent = name;
    if (emailNode) emailNode.textContent = email;
    if (avatarNode) avatarNode.textContent = name.trim().charAt(0).toUpperCase();
    const logout = document.getElementById("logout-button");
    logout?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.href = "login.html";
    });
    document.getElementById("mobile-menu")?.addEventListener("click", () => document.getElementById("sidebar")?.classList.toggle("open"));
  }

  if (isLogin) {
    let mode = "login";
    const form = document.getElementById("auth-form");
    const heading = document.getElementById("auth-heading");
    const subtitle = document.getElementById("auth-subtitle");
    const nameField = document.getElementById("name-field");
    const nameLabel = document.getElementById("name-label");
    const submit = document.getElementById("auth-submit");
    const message = document.getElementById("auth-message");
    document.querySelectorAll(".auth-tab").forEach(tab => tab.addEventListener("click", () => {
      mode = tab.dataset.mode;
      document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t === tab));
      const signup = mode === "signup";
      nameField.classList.toggle("hidden", !signup);
      nameLabel.classList.toggle("hidden", !signup);
      nameField.required = signup;
      heading.textContent = signup ? "Make it yours." : "Come on in.";
      subtitle.textContent = signup ? "Create a private space to check in with yourself." : "A small check-in can be a lovely place to start.";
      submit.innerHTML = signup ? "Create my space <span>→</span>" : "Sign in gently <span>→</span>";
      message.textContent = ""; message.classList.remove("error");
    }));
    form.addEventListener("submit", async event => {
      event.preventDefault();
      message.textContent = ""; message.classList.remove("error");
      submit.disabled = true; submit.textContent = "One moment…";
      const email = document.getElementById("email-field").value.trim();
      const password = document.getElementById("password-field").value;
      try {
        if (mode === "signup") {
          const full_name = nameField.value.trim();
          const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } });
          if (error) throw error;
          if (!data.session) {
            message.textContent = "Account created. Check your email to confirm it, then sign in.";
            message.classList.remove("error");
            return;
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
        location.href = "index.html";
      } catch (error) {
        message.textContent = error.message || "Unable to sign in. Please try again.";
        message.classList.add("error");
      } finally {
        submit.disabled = false;
        if (submit.textContent === "One moment…") submit.textContent = mode === "signup" ? "Create my space →" : "Sign in gently →";
      }
    });
  }
});