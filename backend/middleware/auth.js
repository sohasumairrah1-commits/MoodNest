const { createAuthClient, createUserClient } = require("../config/supabase");

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: "Sign in to access your journal." });
    const token = match[1];
    const supabase = createAuthClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    req.user = data.user;
    req.accessToken = token;
    req.supabase = createUserClient(token);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };