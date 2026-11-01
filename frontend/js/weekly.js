document.addEventListener("DOMContentLoaded",async()=>{
  let weekOffset=0;const $=id=>document.getElementById(id);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const mondayOf=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
  $("prev-week").addEventListener("click",()=>{weekOffset--;render();});
  $("next-week").addEventListener("click",()=>{if(weekOffset<0){weekOffset++;render();}});
  async function render(){
    const start=mondayOf(new Date());start.setDate(start.getDate()+weekOffset*7);
    const end=new Date(start);end.setDate(end.getDate()+6);
    $("week-title").textContent=weekOffset===0?"This week":`${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric"})}`;
    $("next-week").disabled=weekOffset>=0;$("next-week").style.opacity=weekOffset>=0?".4":"1";
    $("week-list").innerHTML='<p class="empty-state">Gathering your entries…</p>';
    try{
      const {entries=[]}=await MoodNestAPI.get(`/entries?start=${iso(start)}&end=${iso(end)}`);
      const today=iso(new Date());$("week-list").innerHTML="";
      for(let i=0;i<7;i++){
        const date=new Date(start);date.setDate(start.getDate()+i);const dateStr=iso(date),entry=entries.find(e=>e.entry_date===dateStr);
        const row=document.createElement("article");row.className=`week-row ${dateStr===today?"today":""}`;
        const mood=entry?entry.mood:"No entry";
        row.innerHTML=`<div class="week-day"><strong>${date.toLocaleDateString(undefined,{weekday:"short"})}${dateStr===today?" · Today":""}</strong><small>${date.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</small></div><div class="week-entry-main"><span class="week-mood-badge">${entry?glyph(entry.mood):"·"}</span><div class="week-entry-text"><strong>${mood}</strong><p>${entry?(entry.notes?escapeText(entry.notes):`${entry.sleep_quality} sleep · Mood intensity ${entry.mood_intensity}/5`):"A little space is waiting for you."}</p></div></div><div class="week-meta"><span>${entry?`${(entry.sleep_minutes/60).toFixed(1)} hrs sleep`:"Not journaled"}</span><a href="journal.html?date=${dateStr}">${entry?"Open entry":"Add entry"} →</a></div>`;
        $("week-list").appendChild(row);
      }
    }catch(e){$("week-list").innerHTML=`<p class="empty-state">${escapeText(e.message)}</p>`;}
  }
  await render();
});
function glyph(m){return({Happy:"☺",Calm:"〜",Neutral:"—",Anxious:"〰",Sad:"⌢",Stressed:"∿"})[m]||"·";}
function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}