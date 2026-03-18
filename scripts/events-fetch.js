// events-fetch.js (korjattu toimivaksi Kide API -hausta)

const DAYS_WINDOW = 7; // Näytetään viikko
let allEvents = [];

const HERVANTA = { lat: 61.4499, lon: 23.8500 };
const VERY_NEAR_HERVANTA_KM = 3;
const NEAR_HERVANTA_KM = 7;

// Tunnettujen paikkojen koordinaatit
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
  "Sherlock Holmes The Bar": { lat: 61.4983958, lon: 23.7677662 },
  "Restaurant DAM": { lat: 61.5008549, lon: 23.7636317 },
  "MMA Team 300": { lat: 61.5003608, lon: 23.7720876 },
  "MMATeam 300 Tampereen keskustassa": { lat: 61.5003608, lon: 23.7720876 },
  "Kaijakka": { lat: 61.4946562, lon: 23.7596234 },
  "Tampereen Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Ylioppilasteatteri": { lat: 61.4988265, lon: 23.7821438 },
  "Ikaalisten Kylpylä & Spa": { lat: 61.7699, lon: 23.0676 },
  "Sin City and H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 },
  "Sin City": { lat: 61.4982, lon: 23.7608 },
  "H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 }
};

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startDateInput = document.getElementById("startDate");
const rangeTitle = document.getElementById("rangeTitle");
const eventCount = document.getElementById("eventCount");

const sortCheckbox = document.getElementById("sortHervanta");

const eventsContainer = document.getElementById("eventsContainer");
let currentStartDate = getTodayAtMidnight();

init();

async function init() {
  startDateInput.value = formatDateForInput(currentStartDate);

  await loadEventsForWeek(currentStartDate);
  render();

  prevBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, -DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await loadEventsForWeek(currentStartDate);
    render();
  });

  nextBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await loadEventsForWeek(currentStartDate);
    render();
  });

  startDateInput.addEventListener("change", async () => {
    currentStartDate = parseInputDate(startDateInput.value);
    await loadEventsForWeek(currentStartDate);
    render();
  });

  sortCheckbox.addEventListener("change", render);
}

async function loadEventsForWeek(startDate) {
  allEvents = []; 

  const urls = [
    `https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50&pageNumber=1`,
    `https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50&pageNumber=2`
  ];

  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (!data.model) continue;

    data.model.forEach(ev => {
      allEvents.push({
        title: ev.name,
        dateObj: new Date(ev.dateActualFrom),
        location: ev.place || "Tuntematon",
        organizer: ev.companyName || "",
        minPrice: ev.minPrice?.eur / 100,
        maxPrice: ev.maxPrice?.eur / 100,
        availability: ev.availability ?? "N/A",
        popularity: ev.favoritedTimes ?? 0
      });
    });
  }

  allEvents.sort((a,b) => a.dateObj - b.dateObj);
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-c));
  return R*c;
}

function render() {
  let filtered = filterEvents(allEvents, currentStartDate, DAYS_WINDOW);

  if (sortCheckbox.checked) {
    filtered = [...filtered].sort((a,b) => {
      const d1 = parseFloat(getDistanceInfo(a.location)?.km || 999);
      const d2 = parseFloat(getDistanceInfo(b.location)?.km || 999);
      return d1 - d2;
    });
  }

  updateRangeInfo(filtered);
  renderEvents(filtered);
}

function filterEvents(events,startDate,days) {
  const start = new Date(startDate);
  const end = addDays(start, days);
  return events.filter(e => e.dateObj >= start && e.dateObj < end);
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
        <div><strong>Hinta:</strong> ${formatPrice(e.minPrice,e.maxPrice)}</div>
        <div><strong>Paikkoja jäljellä:</strong> ${escapeHtml(e.availability)}</div>
        <div class="popularity ${popularity.level}">${popularity.label}</div>
        <div><strong>Tykkäykset:</strong> ${e.popularity}</div>
        <p class="event-description">${escapeHtml(getCustomDescription(e))}</p>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

function getDistanceInfo(location) {
  if (!placeCoords[location]) return null;
  const km = getDistanceKm(HERVANTA.lat,HERVANTA.lon,placeCoords[location].lat,placeCoords[location].lon).toFixed(1);
  if (km <= VERY_NEAR_HERVANTA_KM) return { label: "Todella lähellä Hervantaa", class: "very-near", km };
  if (km <= NEAR_HERVANTA_KM) return { label: "Kohtuullisen lähellä Hervantaa", class: "near", km };
  return { label: "Hervannasta kauempana", class: "far", km };
}

function getPopularityLabel(score=0) {
  if (score>=50) return { level:"high", label:"🔥 Suosio: korkea" };
  if (score>=20) return { level:"medium", label:"⭐ Suosio: keskitaso" };
  return { level:"low", label:"🙂 Suosio: matala" };
}

function getTodayAtMidnight(){ const now=new Date(); return new Date(now.getFullYear(),now.getMonth(),now.getDate()); }
function addDays(date,days){ const r=new Date(date); r.setDate(r.getDate()+days); return r; }
function formatDateForInput(date){ return date.toISOString().split("T")[0]; }
function parseInputDate(v){ const [y,m,d]=v.split("-").map(Number); return new Date(y,m-1,d);}
function formatDateFi(d){ return d.toLocaleDateString("fi-FI",{day:"numeric",month:"numeric",year:"numeric"});}
function escapeHtml(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function getCustomDescription(ev){const t=ev.title.toLowerCase();if(t.includes("appro")) return "APPROT: ...";if(t.includes("sitsit")) return "SITSIT: ...";if(t.includes("sauna")) return "SAUNAILTA: ...";if(t.includes("afterwork")||t.includes("network")) return "AFTERWORK: ...";if(t.includes("bileet")||t.includes("party")) return "BILEET: ...";return "Ei tarkempaa kuvausta saatavilla.";}