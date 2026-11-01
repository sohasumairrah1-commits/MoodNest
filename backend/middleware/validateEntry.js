const MOODS = ["Happy", "Calm", "Neutral", "Anxious", "Sad", "Stressed"];
const QUALITIES = ["Poor", "Fair", "Good", "Excellent"];
const TAGS = ["Exercise", "Study", "Family", "Work", "Rest", "Social"];

function validateEntry(req, res, next) {
  const body = req.body || {};
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.entry_date || "") || Number.isNaN(Date.parse(`${body.entry_date}T00:00:00Z`))) errors.push("Entry date must be a valid YYYY-MM-DD date.");
  if (!MOODS.includes(body.mood)) errors.push("Choose a valid mood.");
  if (!Number.isInteger(body.mood_intensity) || body.mood_intensity < 1 || body.mood_intensity > 5) errors.push("Mood intensity must be an integer from 1 to 5.");
  if (!Number.isInteger(body.sleep_minutes) || body.sleep_minutes < 0 || body.sleep_minutes > 1440) errors.push("Sleep duration must be between 0 and 1440 minutes.");
  if (!QUALITIES.includes(body.sleep_quality)) errors.push("Choose a valid sleep quality.");
  if (typeof (body.notes ?? "") !== "string" || (body.notes ?? "").length > 5000) errors.push("Journal notes must be 5000 characters or fewer.");
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > TAGS.length || body.tags.some(t => !TAGS.includes(t)))) errors.push("One or more wellness tags are invalid.");
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  req.validEntry = {
    entry_date: body.entry_date,
    mood: body.mood,
    mood_intensity: body.mood_intensity,
    sleep_minutes: body.sleep_minutes,
    sleep_quality: body.sleep_quality,
    notes: (body.notes || "").trim(),
    tags: [...new Set(body.tags || [])]
  };
  next();
}

module.exports = { validateEntry };