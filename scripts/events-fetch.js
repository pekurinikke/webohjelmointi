const DAYS_WINDOW = 7; // Viikko kerrallaan
let allEvents = [];
let hasLoadedEvents = false; // Haetaan API-data vain kerran
let currentStartDate = getTodayAtMidnight();

const eventsContainer = document.getElementById("eventsContainer");
const rangeTitle = document.getElementById("rangeTitle");
const eventCount = document.getElementById("eventCount");
const startDateInput = document.getElementById("startDate");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const sortHervantaCheckbox = document.getElementById("sortHervanta");

// Kiinteä vertailupiste Hervannalle
const HERVANTA = {
  lat: 61.4499,
  lon: 23.8500
};

// 2-tasoinen Hervanta-läheisyys
const VERY_NEAR_HERVANTA_KM = 3;   // Todella lähellä
const NEAR_HERVANTA_KM = 7;        // Kohtuullisen lähellä

// Tunnettujen tapahtumapaikkojen koordinaatit
const placeCoords = {
  // Hervanta / kampus
  "Hervanta": { lat: 61.4499, lon: 23.8500 },
  "Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto Hervanta": { lat: 61.4495, lon: 23.8570 },
  "Tampereen yliopisto, Hervannan kampus": { lat: 61.4495, lon: 23.8570 },
  "Tampere University Hervanta Campus": { lat: 61.4495, lon: 23.8570 },

  // Selvästi Hervannan lähellä
  "Bricks": { lat: 61.4498, lon: 23.8510 },
  "Bommari": { lat: 61.4502, lon: 23.8576 },

  // Keskusta / Tulli / muut
  "Tullikamari": { lat: 61.4980, lon: 23.7737 },
  "Pakkahuone": { lat: 61.4979, lon: 23.7741 },
  "Klubi": { lat: 61.4978, lon: 23.7609 },
  "Yo-talo": { lat: 61.4974, lon: 23.7602 },
  "Ranta & Poro": { lat: 61.4970, lon: 23.7610 },
  "Tavara-asema": { lat: 61.4957, lon: 23.7730 },
  "Ilona": { lat: 61.4982, lon: 23.7605 },
  "Olympia": { lat: 61.4970, lon: 23.7658 },

  // Uusia / Kide-haun pohjalta
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

  // Uudet lisäykset v2.1
  "Ikaalisten Kylpylä & Spa": { lat: 61.7699, lon: 23.0676 },

  "Sin City and H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 },
  "Sin City": { lat: 61.4982, lon: 23.7608 },
  "H5 Bar&Cellar": { lat: 61.4982, lon: 23.7608 }
};

init();

async function init() {
  startDateInput.value = formatDateForInput(currentStartDate);

  await ensureEventsLoaded();
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

  startDateInput.addEventListener("change", (e) => {
    currentStartDate = parseInputDate(e.target.value);
    render();
  });

  sortHervantaCheckbox?.addEventListener("change", () => {
    render();
  });
}

// Haetaan API-data vain kerran
async function ensureEventsLoaded() {
  if (hasLoadedEvents) return;

  try {
    const newEvents = await loadEvents();
    mergeEvents(newEvents);
    hasLoadedEvents = true;
  } catch (error) {
    console.error("Tapahtumien latauksessa virhe:", error);
    showError("Tapahtumien lataaminen epäonnistui.");
  }
}

// Lisää vain uudet tapahtumat (ei duplikaatteja)
function mergeEvents(newEvents) {
  const existingTitlesAndDates = new Set(
    allEvents.map(e => e.title + e.dateObj.toISOString())
  );

  newEvents.forEach(e => {
    const key = e.title + e.dateObj.toISOString();
    if (!existingTitlesAndDates.has(key)) {
      allEvents.push(e);
    }
  });

  allEvents.sort((a, b) => a.dateObj - b.dateObj);
}

// Muuntaa hinnat senteistä euroiksi muodossa 5,00 €
function formatPrice(minPrice, maxPrice) {
  if (!minPrice && !maxPrice) return "Ei hintaa saatavilla";

  const min = minPrice ? (minPrice / 100).toFixed(2).replace(".", ",") : null;
  const max = maxPrice ? (maxPrice / 100).toFixed(2).replace(".", ",") : null;

  if (!max || min === max) return `alk. ${min} €`;
  return `alk. ${min}–${max} €`;
}

// Harkitut kuvaukset tapahtumatyyppien mukaan
function getCustomDescription(event) {
  const title = event.title.toLowerCase();

  if (title.includes("appro")) {
    return "APPROT: Rastisuunnistus, jossa kierretään baareja tai ravintoloita ja kerätään leimoja passiin.";
  }

  if (title.includes("sitsit")) {
    return "SITSIT: Perinteiset opiskelijasitsit laulujen, ruoan ja ohjelman kera.";
  }

  if (title.includes("sauna")) {
    return "SAUNAILTA: Rentoa hengailua, saunomista ja lautapelejä opiskelijoille.";
  }

  if (title.includes("afterwork") || title.includes("network")) {
    return "AFTERWORK: Rennompi verkostoitumisilta opiskelijoille ja alumneille.";
  }

  if (title.includes("bileet") || title.includes("party")) {
    return "BILEET: Rento opiskelijabileilta haalarikansalle. Musiikkia, teemajuomia ja paljon porukkaa.";
  }

  if (title.includes("liikunta") || title.includes("sport") || title.includes("treeni") || title.includes("futsal")) {
    return "LIIKUNTATAPAHTUMA: Opiskelijoille suunnattua liikuntaa, hyvinvointia tai aktiivista tekemistä.";
  }

  if (title.includes("kahvit")) {
    return "KAHVITTELU: Rennompaa hengailua, jutustelua ja yhteisöllistä opiskelijameininkiä.";
  }

  return "Ei tarkempaa kuvausta saatavilla.";
}

// Lataa tapahtumat Kide.app APIsta
async function loadEvents() {
  const url = "https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50";
  const response = await fetch(url);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();

  if (!data.model || !Array.isArray(data.model)) {
    throw new Error("API ei palauttanut odotettua dataa");
  }

  return data.model.map(event => ({
    title: event.name,
    dateObj: new Date(event.dateActualFrom),
    location: event.place || "Tuntematon",
    organizer: event.companyName || "",
    minPrice: event.minPrice?.eur,
    maxPrice: event.maxPrice?.eur,
    availability: event.availability ?? "N/A",
    popularity: event.favoritedTimes ?? 0
  }));
}

// Renderöinti
function render() {
  let filteredEvents = filterEvents(allEvents, currentStartDate, DAYS_WINDOW);

  // Rikastetaan etäisyystiedoilla aina, jotta km voidaan näyttää vaikka checkbox ei olisi päällä
  filteredEvents = enrichEventsWithHervantaPriority(filteredEvents);

  if (sortHervantaCheckbox?.checked) {
    filteredEvents.sort((a, b) => {
      const aRank = getHervantaPriorityRank(a);
      const bRank = getHervantaPriorityRank(b);

      // Ensin Hervanta-prioriteetin mukaan
      if (aRank !== bRank) return aRank - bRank;

      // Jos sama ryhmä, lähin ensin
      const aDistance = typeof a.distanceFromHervanta === "number" ? a.distanceFromHervanta : Infinity;
      const bDistance = typeof b.distanceFromHervanta === "number" ? b.distanceFromHervanta : Infinity;

      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }

      // Lopuksi aikajärjestys
      return a.dateObj - b.dateObj;
    });
  } else {
    // Normaalisti aikajärjestys
    filteredEvents.sort((a, b) => a.dateObj - b.dateObj);
  }

  updateRangeInfo(filteredEvents);
  renderEvents(filteredEvents);
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

function renderEvents(events) {
  eventsContainer.innerHTML = "";

  if (events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Ei tapahtumia tällä aikavälillä</h3>
        <p>Kokeile siirtyä seuraavaan viikkoon tai muuta aloituspäivää.</p>
      </div>
    `;
    return;
  }

  events.forEach(event => {
    const popularity = getPopularityLabel(event.popularity);
    const dateText = formatDateTimeFi(event.dateObj);
    const proximityBadge = getHervantaBadge(event);

    const distanceText = typeof event.distanceFromHervanta === "number"
      ? `<div class="distance-badge">📍 ${event.distanceFromHervanta.toFixed(1).replace(".", ",")} km Hervannasta</div>`
      : "";

    const card = document.createElement("article");
    card.className = `event-card ${event.nearHervanta ? "near-hervanta" : ""}`;

    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(event.location)}</div>
        ${proximityBadge}
        ${distanceText}
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

function getPopularityLabel(score = 0) {
  if (score >= 50) return { level: "high", label: "🔥 Suosio: korkea" };
  if (score >= 20) return { level: "medium", label: "⭐ Suosio: keskitaso" };
  return { level: "low", label: "🙂 Suosio: matala" };
}

function showError(message) {
  rangeTitle.textContent = "Virhe";
  eventCount.textContent = "";
  eventsContainer.innerHTML = `<div class="empty-state"><h3>${message}</h3></div>`;
}

function getTodayAtMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateFi(date) {
  return date.toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric"
  });
}

function formatDateTimeFi(date) {
  return date.toLocaleString("fi-FI", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Laskee etäisyyden kilometreinä kahden koordinaatin välillä
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Hakee koordinaatit sijainnin nimen perusteella
function getCoordsForLocation(location) {
  if (!location) return null;

  const normalized = location.trim();

  // 1) Suora osuma
  if (placeCoords[normalized]) {
    return placeCoords[normalized];
  }

  // 2) Osittainen osuma, esim. "Tullikamari, Tampere"
  const foundKey = Object.keys(placeCoords).find(key =>
    normalized.toLowerCase().includes(key.toLowerCase())
  );

  if (foundKey) {
    return placeCoords[foundKey];
  }

  return null;
}

// Lisää tapahtumiin tiedon etäisyydestä Hervantaan + luokittelu
function enrichEventsWithHervantaPriority(events) {
  return events.map(event => {
    const coords = getCoordsForLocation(event.location);

    const distance = coords
      ? distanceKm(HERVANTA.lat, HERVANTA.lon, coords.lat, coords.lon)
      : null;

    const veryNearHervanta = typeof distance === "number" && distance <= VERY_NEAR_HERVANTA_KM;
    const nearHervanta = typeof distance === "number" && distance <= NEAR_HERVANTA_KM;

    return {
      ...event,
      distanceFromHervanta: distance,
      veryNearHervanta,
      nearHervanta
    };
  });
}

// Prioriteettijärjestys lajittelua varten
function getHervantaPriorityRank(event) {
  if (event.veryNearHervanta) return 0; // paras
  if (event.nearHervanta) return 1;
  return 2;
}

// Badge tapahtumakorttiin
function getHervantaBadge(event) {
  if (typeof event.distanceFromHervanta !== "number") {
    return `<div class="distance-badge">⚪ Etäisyys Hervantaan ei tiedossa</div>`;
  }

  if (event.veryNearHervanta) {
    return `<div class="distance-badge">🟢 Todella lähellä Hervantaa</div>`;
  }

  if (event.nearHervanta) {
    return `<div class="distance-badge">🟡 Kohtuullisen lähellä Hervantaa</div>`;
  }

  return "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}