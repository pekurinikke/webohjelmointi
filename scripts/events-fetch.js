// events-fetch.js v10

const DAYS_WINDOW = 7;
let allEvents = [];
let currentStartDate = getTodayAtMidnight();

const HERVANTA = { lat: 61.4499, lon: 23.8500 };
const VERY_NEAR_HERVANTA_KM = 3;
const NEAR_HERVANTA_KM = 7;

// Tunnettujen tapahtumapaikkojen koordinaatit (kaikki aiemmin listatut Hervannan lähellä olevat)
const placeCoords = {
  "Hervanta": { lat: 61.4499, lon: 23.8500 },
  "Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto Hervanta": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto, Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampere University Hervanta Campus": { lat: 61.4495, lon: 23.8570 },
  "Bricks": { lat: 61.4498, lon: 23.8510 },
  "Bommari": { lat: 61.4502, lon: 23.8576 },
  "SportUni Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "SportUni, Kaupin kampus": { lat: 61.5038423, lon: 23.8064888 },
  "SportUni Kauppi (TAMK liikuntakeskus, L-rakennus)": { lat: 61.5038423, lon: 23.8064888 },
  "Kauppi": { lat: 61.5038423, lon: 23.8064888 },
  "Sherlock Holmes": { lat: 61.4983958, lon: 23.7677662 },
  "Sherlock Holmes Bar": { lat: 61.4983958, lon: 23.7677662 },
  "Sherlock Holmes The Bar": { lat: 61.4983958, lon: 23.7677662 },
  "Restaurant DAM": { lat: 61.5008549, lon: 23.7636317 },
  "MMA Team 300": { lat: 61.5003608, lon: 23.7720876 },
  "MMATeam 300 Tampereen keskustassa": { lat: 61.5003608, lon: 23.7720876 },
  "Kaijakka": { lat: 61.4946562, lon: 23.7596234 },
  "Tampereen Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Sin City and H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 },
  "Sin City": { lat: 61.4982, lon: 23.7608 },
  "H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 },
  "Ikaalisten Kylpylä & Spa": { lat: 61.7699, lon: 23.0676 },
  "TAMK Main Campus": { lat: 61.5037721, lon: 23.8087612 },
  "TAMK Stage C1-05": { lat: 61.5037721, lon: 23.8087612 },
  "RestoLab G0-08, TAMK Main Campus": { lat: 61.5037721, lon: 23.8087612 },
  "TAMK": { lat: 61.5037721, lon: 23.8087612 },
  "Sport-Uni Keskusta": { lat: 61.4927922, lon: 23.781083 },
  "Sport-Uni Keskusta, Atalpa": { lat: 61.4927922, lon: 23.781083 },
  "Atalpa": { lat: 61.4927922, lon: 23.781083 },
};

const eventsContainer = document.getElementById("eventsContainer");
const rangeTitle = document.getElementById("rangeTitle");
const eventCount = document.getElementById("eventCount");
const startDateInput = document.getElementById("startDate");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

init();

async function init() {
  startDateInput.value = formatDateForInput(currentStartDate);
  await loadAllEvents();
  render();

  prevBtn.addEventListener("click", () => {
    currentStartDate = addDays(currentStartDate, -DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    render();
  });

  nextBtn.addEventListener("click", () => {
    currentStartDate = addDays(currentStartDate, DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    render();
  });

  startDateInput.addEventListener("change", e => {
    currentStartDate = parseInputDate(e.target.value);
    render();
  });
}

async function loadAllEvents() {
  const pages = [1, 2]; // 50+50
  let events = [];

  for (const page of pages) {
    const url = `https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (!data.model) continue;

    const mapped = data.model.map(e => ({
      title: e.name,
      dateObj: new Date(e.dateActualFrom),
      location: e.place || "Tuntematon",
      organizer: e.companyName || "",
      minPrice: e.minPrice?.eur / 100,
      maxPrice: e.maxPrice?.eur / 100,
      availability: e.availability ?? "N/A",
      popularity: e.favoritedTimes ?? 0
    }));

    events = events.concat(mapped);
  }

  // Poista duplikaatit
  const seen = new Set();
  allEvents = events.filter(e => {
    const key = e.title + e.dateObj.toISOString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  allEvents.sort((a,b) => a.dateObj - b.dateObj);
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

function getDistanceInfo(location) {
  if (!placeCoords[location]) return null;
  const dist = getDistanceKm(HERVANTA.lat, HERVANTA.lon, placeCoords[location].lat, placeCoords[location].lon);
  if (dist <= VERY_NEAR_HERVANTA_KM) return { label: "Todella lähellä Hervantaa", km: dist.toFixed(1), class: "very-near" };
  if (dist <= NEAR_HERVANTA_KM) return { label: "Kohtuullisen lähellä Hervantaa", km: dist.toFixed(1), class: "near" };
  return null;
}

function render() {
  const filtered = allEvents.filter(e => {
    const start = currentStartDate;
    const end = addDays(start, DAYS_WINDOW);
    return e.dateObj >= start && e.dateObj < end;
  });

  updateRangeInfo(filtered);
  renderEvents(filtered);
}

function updateRangeInfo(events) {
  const endDate = addDays(currentStartDate, DAYS_WINDOW-1);
  rangeTitle.textContent = `${formatDateFi(currentStartDate)} – ${formatDateFi(endDate)}`;
  eventCount.textContent = `${events.length} tapahtumaa tällä aikavälillä`;
}

function renderEvents(events) {
  eventsContainer.innerHTML = "";

  if (events.length === 0) {
    eventsContainer.innerHTML = `<div class="empty-state"><h3>Ei tapahtumia tällä aikavälillä</h3></div>`;
    return;
  }

  events.forEach(e => {
    const distInfo = getDistanceInfo(e.location);
    const popularity = getPopularityLabel(e.popularity);
    const dateText = formatDateTimeFi(e.dateObj);

    const distanceHtml = distInfo
      ? `<div class="distance ${distInfo.class}">📍 ${distInfo.label} (${distInfo.km} km)</div>`
      : "";

    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(e.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(e.location)}</div>
        ${distanceHtml}
        <div><strong>Järjestäjä:</strong> ${escapeHtml(e.organizer)}</div>
        <div><strong>Hinta:</strong> ${formatPrice(e.minPrice, e.maxPrice)}</div>
        <div><strong>Paikkoja jäljellä:</strong> ${escapeHtml(e.availability)}</div>
        <div class="popularity ${popularity.level}">${popularity.label}</div>
        <div><strong>Tykkäykset:</strong> ${e.popularity}</div>
        <p class="event-description">${escapeHtml(getCustomDescription(e))}</p>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

function getPopularityLabel(score = 0) {
  if (score >= 50) return { level: "high", label: "🔥 Suosio: korkea" };
  if (score >= 20) return { level: "medium", label: "⭐ Suosio: keskitaso" };
  return { level: "low", label: "🙂 Suosio: matala" };
}

function getCustomDescription(event) {
  const title = event.title.toLowerCase();
  if (title.includes("appro")) return "APPROT: Rastisuunnistus, jossa kierretään baareja tai ravintoloita passiin.";
  if (title.includes("sitsit")) return "SITSIT: Perinteiset opiskelijasitsit laulujen ja ohjelman kera.";
  if (title.includes("bileet") || title.includes("party")) return "BILEET: Rento opiskelijabileilta haalarikansalle. Musiikkia, teemajuomia ja paljon porukkaa.";
  return "Ei tarkempaa kuvausta saatavilla.";
}

function formatPrice(min, max) {
  if (!min && !max) return "Ei hintaa saatavilla";
  const minStr = min ? min.toFixed(2).replace(".", ",") : null;
  const maxStr = max ? max.toFixed(2).replace(".", ",") : null;
  if (!max || min === max) return `alk. ${minStr} €`;
  return `alk. ${minStr}–${maxStr} €`;
}

function getTodayAtMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function parseInputDate(value) {
  const [y,m,d] = value.split("-").map(Number);
  return new Date(y,m-1,d);
}

function formatDateFi(date) {
  return date.toLocaleDateString("fi-FI", { day: "numeric", month:"numeric", year:"numeric" });
}

function formatDateTimeFi(date) {
  return date.toLocaleString("fi-FI", {
    weekday:"short",
    day:"numeric",
    month:"numeric",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}