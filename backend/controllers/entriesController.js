function dbError(error) {
  if (error?.code === "23505") return { status: 409, message: "You already have an entry for that date. Open it to make changes." };
  if (error?.code === "PGRST116") return { status: 404, message: "Entry not found." };
  return { status: 400, message: error?.message || "Unable to complete that database request." };
}

async function createEntry(req, res, next) {
  try {
    const { data, error } = await req.supabase.from("entries").insert({ ...req.validEntry, user_id: req.user.id }).select("*").single();
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    res.status(201).json({ entry: data });
  } catch (e) { next(e); }
}

async function listEntries(req, res, next) {
  try {
    const { start, end, limit } = req.query;
    let query = req.supabase.from("entries").select("*").order("entry_date", { ascending: Boolean(start || end) });
    if (start || end) {
      if (!start || !end || !isDate(start) || !isDate(end) || start > end) return res.status(400).json({ error: "Provide a valid start and end date range." });
      query = query.gte("entry_date", start).lte("entry_date", end);
    }
    const cap = Math.min(Math.max(Number.parseInt(limit, 10) || 90, 1), 365);
    const { data, error } = await query.limit(cap);
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    res.json({ entries: data || [] });
  } catch (e) { next(e); }
}

async function getEntry(req, res, next) {
  try {
    const { data, error } = await req.supabase.from("entries").select("*").eq("id", req.params.id).maybeSingle();
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    if (!data) return res.status(404).json({ error: "Entry not found." });
    res.json({ entry: data });
  } catch (e) { next(e); }
}

async function getEntryByDate(req, res, next) {
  try {
    if (!isDate(req.params.date)) return res.status(400).json({ error: "Use a valid YYYY-MM-DD date." });
    const { data, error } = await req.supabase.from("entries").select("*").eq("entry_date", req.params.date).maybeSingle();
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    res.json({ entry: data || null });
  } catch (e) { next(e); }
}

async function updateEntry(req, res, next) {
  try {
    const { data, error } = await req.supabase.from("entries").update({ ...req.validEntry, updated_at: new Date().toISOString() }).eq("id", req.params.id).select("*").maybeSingle();
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    if (!data) return res.status(404).json({ error: "Entry not found." });
    res.json({ entry: data });
  } catch (e) { next(e); }
}

async function deleteEntry(req, res, next) {
  try {
    const { data, error } = await req.supabase.from("entries").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    if (!data) return res.status(404).json({ error: "Entry not found." });
    res.json({ message: "Entry deleted." });
  } catch (e) { next(e); }
}

async function dashboard(req, res, next) {
  try {
    const { data, error } = await req.supabase.from("entries").select("entry_date,mood,sleep_minutes,sleep_quality").order("entry_date", { ascending: false }).limit(90);
    if (error) { const e = dbError(error); return res.status(e.status).json({ error: e.message }); }
    const entries = data || [];
    const moodCounts = entries.reduce((acc, entry) => { acc[entry.mood] = (acc[entry.mood] || 0) + 1; return acc; }, {});
    const avgSleep = entries.length ? Math.round(entries.reduce((sum, e) => sum + e.sleep_minutes, 0) / entries.length) : null;
    const mostCommonMood = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || null;
    res.json({ stats: { totalEntries: entries.length, averageSleepMinutes: avgSleep, mostCommonMood }, recentEntries: entries.slice(0, 7) });
  } catch (e) { next(e); }
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value;
}

module.exports = { createEntry, listEntries, getEntry, getEntryByDate, updateEntry, deleteEntry, dashboard };