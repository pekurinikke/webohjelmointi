// events-fetch.js v6

const DAYS_WINDOW = 7; // Viikko kerrallaan
let allEvents = [];
let loadedWeeks = new Set();
let currentStartDate = getTodayAtMidnight();

const eventsContainer = document.getElementById("eventsContainer");
const rangeTitle = document.getElementById("rangeTitle");
const eventCount = document.getElementById("eventCount");
const startDateInput = document.getElementById("startDate");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Hervanta + lähellä-kriteerit
const HERVANTA = { lat: 61.4499, lon: 23.8500 };
const VERY_NEAR_HERVANTA_KM = 3;
const NEAR_HERVANTA_KM = 7;

// Tunnettujen tapahtumapaikkojen koordinaatit
const placeCoords = {
  "Hervanta": { lat: 61.4499, lon: 23.8500 },
  "Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto Hervanta": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto, Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampere University Hervanta Campus": { lat: 61.4495, lon: 23.8570 },
  "Bricks": { lat: 61.4498, lon: 23.8510 },
  "Bommari": { lat: 61.4502, lon: 23.8576 },
  "Tullikamari": { lat: 61.4980, lon: 23.7737 },
  "Pakkahuone": { lat: 61.4979, lon: 23.7741 },
  "Klubi": { lat: 61.4978, lon: 23.7609 },
  "Yo-talo": { lat: 61.4974, lon: 23.7602 },
  "Ranta & Poro": { lat: 61.4970, lon: 23.7610 },
  "Tavara-asema": { lat: 61.4957, lon: 23.7730 },
  "Ilona": { lat: 61.4982, lon: 23.7605 },
  "Olympia": { lat: 61.4970, lon: 23.7658 },
  "Ole.Fit Tampella": { lat: 61.5034893, lon: 23.764089 },
  "TAMK Main Campus": { lat: 61.5037721, lon: 23.8087612 },
  "TAMK Stage C1-05": { lat: 61.5037721, lon: 23.8087612 },
  "Tampere University of Applied Sciences (TAMK) - Main campus": { lat: 61.5037721, lon: 23.8087612 },
  "RestoLab G0-08, TAMK Main Campus": { lat: 61.5037721, lon: 23.8087612 },
  "TAMK": { lat: 61.5037721, lon: 23.8087612 },
  "SportUni Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "SportUni, Kaupin kampus": { lat: 61.5038423, lon: 23.8064888 },
  "SportUni Kauppi (TAMK liikuntakeskus, L-rakennus)": { lat: 61.5038423, lon: 23.8064888 },
  "Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "Sport-Uni Keskusta": { lat: 61.4927922, lon: 23.781083 },
  "Sport-Uni Keskusta, Atalpa": { lat: 61.4927922, lon: 23.781083 },
  "Atalpa": { lat: 61.4927922, lon: 23.781083 },
  "Sherlock Holmes": { lat: 61.4983958, lon: 23.7677662 },
  "Sherlock Holmes Bar": { lat: 61.4983958, lon: 23.7677662 },
  "Restaurant DAM": { lat: 61.5008549, lon: 23.7636317 },
  "MMA Team 300": { lat: 61.5003608, lon: 23.7720876 },
  "MMATeam 300 Tampereen keskustassa": { lat: 61.5003608, lon: 23.7720876 },
  "Kaijakka": { lat: 61.4946562, lon: 23.7596234 },
  "Tampereen Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Ikaalisten Kylpylä & Spa": { lat: 61.7699, lon: 23.0676 },
  "Sin City and H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 },
  "Sin City": { lat: 61.4982, lon: 23.7608 },
  "H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 }
};

init();

async function init() {
  startDateInput.value = formatDateForInput(currentStartDate);
  await ensureEventsForWeek(currentStartDate);
  render();

  prevBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, -DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await ensureEventsForWeek(currentStartDate);
    render();
  });

  nextBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await ensureEventsForWeek(currentStartDate);
    render();
  });

  startDateInput.addEventListener("change", async (e) => {
    currentStartDate = parseInputDate(e.target.value);
    await ensureEventsForWeek(currentStartDate);
    render();
  });
}

async function ensureEventsForWeek(startDate) {
  const weekKey = formatDateForInput(startDate);
  if (!loadedWeeks.has(weekKey)) {
    try {
      const newEvents = await loadAllPages();
      mergeEvents(newEvents);
      loadedWeeks.add(weekKey);
    } catch (error) {
      console.error("Tapahtumien latauksessa virhe:", error);
      showError("Tapahtumien lataaminen epäonnistui.");
    }
  }
}

// Lataa kaksi 50-tuotteen sivua -> max 100 tapahtumaa
async function loadAllPages() {
  const pageUrls = [
    "https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50&pageNumber=1",
    "https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50&pageNumber=2"
  ];
  let results = [];
  for (const url of pageUrls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.model || !Array.isArray(data.model)) continue;
    const events = data.model.map(event => ({
      title: event.name,
      dateObj: new Date(event.dateActualFrom),
      location: event.place || "Tuntematon",
      organizer: event.companyName || "",
      minPrice: event.minPrice?.eur,
      maxPrice: event.maxPrice?.eur,
      availability: event.availability ?? "N/A",
      popularity: event.favoritedTimes ?? 0,
      coords: placeCoords[event.place] || null
    }));
    results.push(...events);
  }
  return results;
}

// Duplikaattien poisto ja järjestys: Hervanta ensin
function mergeEvents(newEvents) {
  const existingKeys = new Set(allEvents.map(e => e.title + e.dateObj.toISOString() + e.location));
  newEvents.forEach(e => {
    const key = e.title + e.dateObj.toISOString() + e.location;
    if (!existingKeys.has(key)) {
      allEvents.push(e);
      existingKeys.add(key);
    }
  });

  allEvents.sort((a,b)=>{
    const distA = a.coords ? getDistanceKm(HERVANTA,a.coords) : Infinity;
    const distB = b.coords ? getDistanceKm(HERVANTA,b.coords) : Infinity;
    if(distA <= NEAR_HERVANTA_KM && distB > NEAR_HERVANTA_KM) return -1;
    if(distA > NEAR_HERVANTA_KM && distB <= NEAR_HERVANTA_KM) return 1;
    return a.dateObj - b.dateObj;
  });
}

// Etäisyyden lasku km
function getDistanceKm(a,b) {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lon - a.lon);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const c = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  const d = 2*R*Math.atan2(Math.sqrt(c), Math.sqrt(1-c));
  return d;
}
function deg2rad(deg){return deg*Math.PI/180;}

function filterEvents(events,startDate,daysWindow){
  const start = new Date(startDate);
  const end = addDays(start, daysWindow);
  return events.filter(event => event.dateObj >= start && event.dateObj < end);
}

function render() {
  const filteredEvents = filterEvents(allEvents, currentStartDate, DAYS_WINDOW);
  updateRangeInfo(filteredEvents);
  renderEvents(filteredEvents);
}

function updateRangeInfo(events) {
  const endDate = addDays(currentStartDate, DAYS_WINDOW - 1);
  rangeTitle.textContent = `${formatDateFi(currentStartDate)} – ${formatDateFi(endDate)}`;
  eventCount.textContent = `${events.length} tapahtumaa tällä aikavälillä`;
}

function renderEvents(events){
  eventsContainer.innerHTML = "";
  if(events.length===0){
    eventsContainer.innerHTML = `<div class="empty-state"><h3>Ei tapahtumia tällä aikavälillä</h3><p>Kokeile siirtyä seuraavaan viikkoon tai muuta aloituspäivää.</p></div>`;
    return;
  }

  events.forEach(event=>{
    const distKm = event.coords ? getDistanceKm(HERVANTA,event.coords).toFixed(1) : null;
    let distanceLabel = "";
    if(distKm !== null){
      if(distKm <= VERY_NEAR_HERVANTA_KM) distanceLabel = `🟢 Todella lähellä Hervantaa 📍 ${distKm} km`;
      else if(distKm <= NEAR_HERVANTA_KM) distanceLabel = `🟡 Kohtuullisen lähellä Hervantaa 📍 ${distKm} km`;
    }

    const popularity = getPopularityLabel(event.popularity);
    const dateText = formatDateTimeFi(event.dateObj);
    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(event.location)}</div>
        ${distanceLabel ? `<div>${distanceLabel}</div>` : ""}
        <div><strong>Järjestäjä:</strong> ${escapeHtml(event.organizer)}</div>
        <div><strong>Hinta:</strong> ${formatPrice(event.minPrice,event.maxPrice)}</div>
        <div><strong>Paikkoja jäljellä:</strong> ${escapeHtml(event.availability)}</div>
        <div class="popularity ${popularity.level}">${popularity.label}</div>
        <div><strong>Tykkäykset:</strong> ${event.popularity}</div>
        <p class="event-description">${escapeHtml(getCustomDescription(event))}</p>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

function getPopularityLabel(score=0){
  if(score>=50) return { level:"high", label:"🔥 Suosio: korkea" };
  if(score>=20) return { level:"medium", label:"⭐ Suosio: keskitaso" };
  return { level:"low", label:"🙂 Suosio: matala" };
}

function showError(message){
  rangeTitle.textContent="Virhe";
  eventCount.textContent="";
  eventsContainer.innerHTML=`<div class="empty-state"><h3>${message}</h3></div>`;
}

function getTodayAtMidnight(){ const now=new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
function addDays(date,days){ const result=new Date(date); result.setDate(result.getDate()+days); return result; }
function formatDateForInput(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,"0"); const d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function parseInputDate(value){ const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d); }
function formatDateFi(date){ return date.toLocaleDateString("fi-FI",{day:"numeric",month:"numeric",year:"numeric"});}
function formatDateTimeFi(date){ return date.toLocaleString("fi-FI",{weekday:"short",day:"numeric",month:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function escapeHtml(str){return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function formatPrice(min,max){if(!min&&!max) return "Ei hintaa saatavilla"; if(!max||min===max) return `alk. ${min} €`; return `alk. ${min}–${max} €`;}
function getCustomDescription(event){
  const title=event.title.toLowerCase();
  if(title.includes("appro")) return "APPROT: Rastisuunnistus, jossa käydään erinäisiä baareja/ravintoloita läpi tilaamalla tuotteita saadakseen leimoja passiin.";
  if(title.includes("sitsit")) return "SITSIT: Perinteiset opiskelijasitsit laulujen ja ohjelman kera.";
  if(title.includes("sauna")) return "SAUNAILTA: Rentoa hengailua, saunomista ja lautapelejä opiskelijoille.";
  if(title.includes("afterwork")||title.includes("network")) return "AFTERWORK: Rennompi verkostoitumisilta opiskelijoille ja alumneille.";
  if(title.includes("bileet")||title.includes("party")) return "BILEET: Rento opiskelijabileilta haalarikansalle. Musiikkia, teemajuomia ja paljon porukkaa.";
  return "Ei tarkempaa kuvausta saatavilla.";
}