document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id);
  const form = $("journal-form"), dateInput = $("entry-date"), moodInput = $("mood");
  const today = new Date(), localISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  dateInput.value = new URLSearchParams(location.search).get("date") || localISO(today);
  let selectedTags = new Set(), currentId = null, loadedDate = "";
  const setMessage = (msg,error=false) => { $("journal-message").textContent=msg; $("journal-message").classList.toggle("error",error); };
  document.querySelectorAll(".mood-option").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".mood-option").forEach(b=>b.classList.toggle("selected",b===button));
    moodInput.value=button.dataset.mood;
  }));
  document.querySelectorAll("[data-quality]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-quality]").forEach(b=>b.classList.toggle("selected",b===button));
    $("sleep-quality").value=button.dataset.quality;
  }));
  document.querySelectorAll("[data-tag]").forEach(button => button.addEventListener("click", () => {
    const tag=button.dataset.tag;
    if(selectedTags.has(tag)){selectedTags.delete(tag);button.classList.remove("selected");}
    else {selectedTags.add(tag);button.classList.add("selected");}
  }));
  $("intensity").addEventListener("input",()=> $("intensity-value").textContent=$("intensity").value);
  $("notes").addEventListener("input",()=> $("char-count").textContent=`${$("notes").value.length} / 5000`);
  dateInput.addEventListener("change",loadEntry);
  $("delete-entry").addEventListener("click",async()=>{
    if(!currentId||!confirm("Delete this journal entry? This cannot be undone."))return;
    try{await MoodNestAPI.delete(`/entries/${currentId}`);window.moodnestToast("Entry deleted.");location.href="weekly.html";}
    catch(e){setMessage(e.message,true);}
  });
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!moodInput.value){setMessage("Choose the mood that feels closest to you today.",true);return;}
    const hours=Number($("sleep-hours").value),minutes=Number($("sleep-minutes").value);
    if(!Number.isInteger(hours)||hours<0||hours>24||hours*60+minutes>1440){setMessage("Please enter a valid sleep duration (up to 24 hours).",true);return;}
    const payload={entry_date:dateInput.value,mood:moodInput.value,mood_intensity:Number($("intensity").value),sleep_minutes:hours*60+minutes,sleep_quality:$("sleep-quality").value,notes:$("notes").value.trim(),tags:[...selectedTags]};
    const save=$("save-entry");save.disabled=true;save.textContent="Saving your entry…";setMessage("");
    try{
      if(currentId)await MoodNestAPI.put(`/entries/${currentId}`,payload);
      else await MoodNestAPI.post("/entries",payload);
      window.moodnestToast("Your entry is safely saved.");setMessage("Your entry is saved. Thank you for checking in.");
      await loadEntry();
    }catch(e){setMessage(e.message,true);}
    finally{save.disabled=false;save.innerHTML=currentId?'Update my entry <span>→</span>':'Save my entry <span>→</span>';}
  });
  async function loadEntry(){
    const date=dateInput.value;if(!date)return;
    $("entry-date-label").textContent=new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"});
    try{
      const result=await MoodNestAPI.get(`/entries/by-date/${date}`);
      const entry=result.entry;
      currentId=entry?.id||null;loadedDate=date;
      $("delete-entry").classList.toggle("hidden",!currentId);
      $("save-entry").innerHTML=currentId?'Update my entry <span>→</span>':'Save my entry <span>→</span>';
      if(!entry){form.reset();dateInput.value=date;$("intensity").value=3;$("intensity-value").textContent="3";$("sleep-hours").value=7;$("sleep-minutes").value="0";$("sleep-quality").value="Good";$("notes").value="";$("char-count").textContent="0 / 5000";moodInput.value="";selectedTags.clear();document.querySelectorAll(".mood-option,.tag-options button").forEach(b=>b.classList.remove("selected"));document.querySelectorAll("[data-quality]").forEach(b=>b.classList.toggle("selected",b.dataset.quality==="Good"));setMessage("");return;}
      moodInput.value=entry.mood;document.querySelectorAll(".mood-option").forEach(b=>b.classList.toggle("selected",b.dataset.mood===entry.mood));
      $("intensity").value=entry.mood_intensity;$("intensity-value").textContent=entry.mood_intensity;
      $("sleep-hours").value=Math.floor(entry.sleep_minutes/60);$("sleep-minutes").value=String(entry.sleep_minutes%60);
      $("sleep-quality").value=entry.sleep_quality;document.querySelectorAll("[data-quality]").forEach(b=>b.classList.toggle("selected",b.dataset.quality===entry.sleep_quality));
      $("notes").value=entry.notes||"";$("char-count").textContent=`${$("notes").value.length} / 5000`;
      selectedTags=new Set(entry.tags||[]);document.querySelectorAll("[data-tag]").forEach(b=>b.classList.toggle("selected",selectedTags.has(b.dataset.tag)));
      setMessage("You already have an entry for this date. You can update it below.");
    }catch(e){setMessage(e.message,true);}
  }
  await loadEntry();
});