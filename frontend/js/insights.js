document.addEventListener("DOMContentLoaded",async()=>{
  try{
    const {entries=[]}=await MoodNestAPI.get("/entries?limit=90");
    document.getElementById("total-days").textContent=entries.length;
    const avg=entries.length?entries.reduce((sum,e)=>sum+e.sleep_minutes,0)/entries.length:0;
    document.getElementById("average-sleep").textContent=entries.length?`${(avg/60).toFixed(1)}h`:"—";
    const counts={};entries.forEach(e=>counts[e.mood]=(counts[e.mood]||0)+1);
    const common=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    document.getElementById("common-mood").textContent=common?common[0]:"—";
    const moodChart=document.getElementById("mood-chart");
    if(!entries.length)moodChart.innerHTML='<p class="empty-state">Your mood overview will appear here as you journal.</p>';
    else{
      moodChart.innerHTML="";
      ["Happy","Calm","Neutral","Anxious","Sad","Stressed"].forEach(mood=>{
        const count=counts[mood]||0,row=document.createElement("div");row.className="bar-row";
        row.innerHTML=`<span>${mood}</span><div class="bar-track"><div class="bar-fill" style="width:${count/entries.length*100}%"></div></div><span class="bar-count">${count}</span>`;
        moodChart.appendChild(row);
      });
    }
    const sleepChart=document.getElementById("sleep-chart");
    const recent=[...entries].sort((a,b)=>a.entry_date.localeCompare(b.entry_date)).slice(-7);
    if(!recent.length)sleepChart.innerHTML='<p class="empty-state">Your sleep rhythm will appear here as you log rest.</p>';
    else{
      sleepChart.innerHTML="";
      recent.forEach(e=>{
        const item=document.createElement("div");item.className="sleep-bar-item";
        const hours=e.sleep_minutes/60;
        item.innerHTML=`<span>${hours.toFixed(1)}h</span><div class="sleep-bar" style="height:${Math.max(3,Math.min(hours/12*100,100))}%"></div><small>${new Date(`${e.entry_date}T12:00:00`).toLocaleDateString(undefined,{weekday:"short"})}</small>`;
        sleepChart.appendChild(item);
      });
    }
  }catch(e){window.moodnestToast?.(e.message);}
});