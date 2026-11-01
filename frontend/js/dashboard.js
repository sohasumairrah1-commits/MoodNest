document.addEventListener("DOMContentLoaded", async () => {
  const today = new Date();
  const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const startOfWeek = date => { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d; };
  const start = startOfWeek(today);
  const end = new Date(start); end.setDate(end.getDate()+6);
  document.getElementById("today-label").textContent = today.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  document.getElementById("date-pill").textContent = today.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  try {
    const [dashboard, week] = await Promise.all([
      MoodNestAPI.get("/entries/dashboard"),
      MoodNestAPI.get(`/entries?start=${iso(start)}&end=${iso(end)}`)
    ]);
    const entries = week.entries || [];
    const todayEntry = entries.find(e => e.entry_date === iso(today));
    const name = document.getElementById("user-name")?.textContent || "there";
    document.getElementById("greeting").innerHTML = `Hello, ${escapeHTML(name.split(" ")[0])} <span class="wave">✳</span>`;
    if (todayEntry) {
      document.getElementById("today-mood").textContent = todayEntry.mood;
      document.getElementById("today-mood-icon").textContent = moodGlyph(todayEntry.mood);
      document.getElementById("today-mood-sub").textContent = `Intensity ${todayEntry.mood_intensity} of 5`;
      document.getElementById("mood-action").innerHTML = 'Edit today’s entry <span>→</span>';
      const h = Math.floor(todayEntry.sleep_minutes/60), m = todayEntry.sleep_minutes%60;
      document.getElementById("today-sleep").innerHTML = `${h}${m ? `:${String(m).padStart(2,"0")}` : ""} <small>hrs</small>`;
      document.getElementById("today-sleep-sub").textContent = `${todayEntry.sleep_quality} sleep quality`;
      document.getElementById("sleep-progress").style.width = `${Math.min(todayEntry.sleep_minutes/480*100,100)}%`;
    }
    document.getElementById("days-journaled").innerHTML = `${entries.length} <small>days</small>`;
    const strip = document.getElementById("week-strip");
    strip.innerHTML = "";
    for (let i=0;i<7;i++) {
      const date = new Date(start); date.setDate(start.getDate()+i);
      const dateStr = iso(date), entry = entries.find(e=>e.entry_date===dateStr);
      const chip = document.createElement("div");
      chip.className = `day-chip ${entry?"has-entry":""} ${dateStr===iso(today)?"today":""}`;
      chip.innerHTML = `<span class="day-name">${date.toLocaleDateString(undefined,{weekday:"short"})}</span><span class="day-mood">${entry?moodGlyph(entry.mood):"·"}</span><span class="day-date">${date.getDate()}</span><span class="day-sleep">${entry?`${(entry.sleep_minutes/60).toFixed(1)}h`:"—"}</span>`;
      strip.appendChild(chip);
    }
  } catch (error) {
    window.moodnestToast?.(error.message);
    document.getElementById("week-strip").innerHTML = '<p class="empty-state">Your week will appear here once your entries load.</p>';
  }
});
function moodGlyph(mood){return ({Happy:"☺",Calm:"〜",Neutral:"—",Anxious:"〰",Sad:"⌢",Stressed:"∿"})[mood]||"·";}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}