// events-fetch.js v3 – Hervanta-läheisyys ja 100 tapahtumaa

const HERVANTA = { lat: 61.4499, lon: 23.8500 };
const VERY_NEAR_HERVANTA_KM = 3; // Todella lähellä
const NEAR_HERVANTA_KM = 7;      // Kohtuullisen lähellä

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
  "RestoLab G0-08, TAMK Main Campus": { lat: 61.5037721, lon: 23.8087612 },
  "SportUni Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "SportUni, Kaupin kampus": { lat: 61.5038423, lon: 23.8064888 },
  "Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "Sport-Uni Keskusta": { lat: 61.4927922, lon: 23.781083 },
  "Atalpa": { lat: 61.4927922, lon: 23.781083 },
  "Sherlock Holmes": { lat: 61.4983958, lon: 23.7677662 },
  "Sherlock Holmes Bar": { lat: 61.4983958, lon: 23.7677662 },
  "Restaurant DAM": { lat: 61.5008549, lon: 23.7636317 },
  "MMA Team 300": { lat: 61.5003608, lon: 23.7720876 },
  "Kaijakka": { lat: 61.4946562, lon: 23.7596234 },
  "Tampereen Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Ikaalisten Kylpylä & Spa": { lat: 61.7699, lon: 23.0676 },
  "Sin City and H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 }
};

const DAYS_WINDOW = 7;
let allEvents = [];
let loadedWeeks = new Set();
let currentStartDate = getTodayAtMidnight();

const eventsContainer = document.getElementById("eventsContainer");
const rangeTitle = document.getElementById("rangeTitle");
const eventCount = document.getElementById("eventCount");
const startDateInput = document.getElementById("startDate");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

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

// Hae APIsta 100 tapahtumaa (2 sivua × 50)
async function loadEvents() {
  const baseUrl = "https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50";
  let allData = [];

  for (let page = 1; page <= 2; page++) {
    const response = await fetch(`${baseUrl}&page=${page}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.model && Array.isArray(data.model)) {
      allData = allData.concat(data.model);
    }
  }

  return allData.map(event => {
    const coords = placeCoords[event.place] || null;
    return {
      title: event.name,
      dateObj: new Date(event.dateActualFrom),
      location: event.place || "Tuntematon",
      organizer: event.companyName || "",
      minPrice: event.minPrice?.eur,
      maxPrice: event.maxPrice?.eur,
      availability: event.availability ?? "N/A",
      popularity: event.favoritedTimes ?? 0,
      coords
    };
  });
}

// Lisää vain uudet tapahtumat (ei duplikaatteja)
function mergeEvents(newEvents) {
  const existingKeys = new Set(allEvents.map(e => e.title + e.dateObj.toISOString()));
  newEvents.forEach(e => {
    const key = e.title + e.dateObj.toISOString();
    if (!existingKeys.has(key)) allEvents.push(e);
  });
  allEvents.sort((a,b) => {
    const distA = a.coords ? getDistanceKm(HERVANTA, a.coords) : Infinity;
    const distB = b.coords ? getDistanceKm(HERVANTA, b.coords) : Infinity;
    return distA - distB || (a.dateObj - b.dateObj);
  });
}

// Lasketaan etäisyys km HERVANTA → event
function getDistanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1)*Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Renderöinti
function render() {
  const filteredEvents = filterEvents(allEvents, currentStartDate, DAYS_WINDOW);
  updateRangeInfo(filteredEvents);
  renderEvents(filteredEvents);
}

// Lisää Hervanta-läheisyysteksti
function getNearText(event) {
  if (!event.coords) return "";
  const km = getDistanceKm(HERVANTA, event.coords);
  if (km <= VERY_NEAR_HERVANTA_KM) return `🟢 Todella lähellä Hervantaa 📍 ${km.toFixed(1)} km`;
  if (km <= NEAR_HERVANTA_KM) return `🟡 Kohtuullisen lähellä Hervantaa 📍 ${km.toFixed(1)} km`;
  return `⚪ Etäällä Hervannasta 📍 ${km.toFixed(1)} km`;
}

// Renderöi tapahtumakortit
function renderEvents(events) {
  eventsContainer.innerHTML = "";
  if (events.length === 0) {
    eventsContainer.innerHTML = `<div class="empty-state"><h3>Ei tapahtumia tällä aikavälillä</h3></div>`;
    return;
  }

  events.forEach(event => {
    const popularity = getPopularityLabel(event.popularity);
    const dateText = formatDateTimeFi(event.dateObj);
    const nearText = getNearText(event);

    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(event.location)} ${nearText}</div>
        <div><strong>Järjestäjä:</strong> ${escapeHtml(event.organizer)}</div>
        <div><strong>Hinta:</strong> ${formatPrice(event.minPrice, event.maxPrice)}</div>
        <div><strong>Paikkoja jäljellä:</strong> ${escapeHtml(event.availability)}</div>
        <div class="popularity ${popularity.level}">${popularity.label}</div>
        <div><strong>Tykkäykset:</strong> ${event.popularity}</div>
        <p class="event-description">${escapeHtml(getCustomDescription(event))}</p>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

// --- Muut funktiot (sama kuin aiemmin) ---
function getPopularityLabel(score = 0) {
  if (score >= 50) return { level: "high", label: "🔥 Suosio: korkea" };
  if (score >= 20) return { level: "medium", label: "⭐ Suosio: keskitaso" };
  return { level: "low", label: "🙂 Suosio: matala" };
}

function formatPrice(minPrice, maxPrice) {
  if (!minPrice && !maxPrice) return "Ei hintaa saatavilla";
  const min = minPrice ? (minPrice / 100).toFixed(2) : null;
  const max = maxPrice ? (maxPrice / 100).toFixed(2) : null;
  if (!max || min === max) return `alk. ${min} €`;
  return `alk. ${min}–${max} €`;
}

function getCustomDescription(event) {
  const title = event.title.toLowerCase();
  if (title.includes("appro")) return "APPROT: Rastisuunnistus, jossa käydään erinäisiä baareja/ravintoloita läpi tilaamalla tuotteita saadakseen leimoja passiin.";
  if (title.includes("sitsit")) return "SITSIT: Perinteiset opiskelijasitsit laulujen ja ohjelman kera.";
  if (title.includes("sauna")) return "SAUNAILTA: Rentoa hengailua, saunomista ja lautapelejä opiskelijoille.";
  if (title.includes("afterwork") || title.includes("network")) return "AFTERWORK: Rennompi verkostoitumisilta opiskelijoille ja alumneille.";
  if (title.includes("bileet") || title.includes("party")) return "BILEET: Rento opiskelijabileilta haalarikansalle. Musiikkia, teemajuomia ja paljon porukkaa.";
  return "Ei tarkempaa kuvausta saatavilla.";
}

function showError(message) {
  rangeTitle.textContent = "Virhe";
  eventCount.textContent = "";
  eventsContainer.innerHTML = `<div class="empty-state"><h3>${message}</h3></div>`;
}

function filterEvents(events, startDate, daysWindow) {
  const start = new Date(startDate);
  const end = addDays(start, daysWindow);
  return events.filter(event => event.dateObj >= start && event.dateObj < end);
}

function updateRangeInfo(events) {
  const endDate = addDays(currentStartDate, DAYS_WINDOW - 1);
  rangeTitle.textContent = `${formatDateFi(currentStartDate)} – ${formatDateFi(endDate)}`;
  eventCount.textContent = `${events.length} tapahtumaa tällä aikavälillä`;
}

// --- Päivämäärä- ja apufunktiot ---
function getTodayAtMidnight() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
function addDays(date, days) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function formatDateForInput(date) { const year = date.getFullYear(); const month = String(date.getMonth()+1).padStart(2,'0'); const day = String(date.getDate()).padStart(2,'0'); return `${year}-${month}-${day}`; }
function parseInputDate(value) { const [year,month,day]=value.split("-").map(Number); return new Date(year,month-1,day); }
function formatDateFi(date){ return date.toLocaleDateString("fi-FI",{day:"numeric",month:"numeric",year:"numeric"});}
function formatDateTimeFi(date){ return date.toLocaleString("fi-FI",{weekday:"short",day:"numeric",month:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function escapeHtml(str){return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}

async function ensureEventsForWeek(startDate){
  const weekKey = formatDateForInput(startDate);
  if(!loadedWeeks.has(weekKey)){
    try{
      const newEvents = await loadEvents();
      mergeEvents(newEvents);
      loadedWeeks.add(weekKey);
    } catch(error){
      console.error("Tapahtumien latauksessa virhe:", error);
      showError("Tapahtumien lataaminen epäonnistui.");
    }
  }
}