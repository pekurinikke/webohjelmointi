const DAYS_WINDOW = 7; // Viikko kerrallaan
let allEvents = [];
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

  try {
    allEvents = await loadEvents();
    if (allEvents.length === 0) {
      showError("API ei palauttanut tapahtumia tällä hetkellä.");
    } else {
      render();
    }
  } catch (error) {
    console.error("Tapahtumien latauksessa virhe:", error);
    showError("Tapahtumien lataaminen epäonnistui.");
  }

  prevBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, -DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await ensureEventsLoadedForWeek(currentStartDate, DAYS_WINDOW);
    render();
  });

  nextBtn.addEventListener("click", async () => {
    currentStartDate = addDays(currentStartDate, DAYS_WINDOW);
    startDateInput.value = formatDateForInput(currentStartDate);
    await ensureEventsLoadedForWeek(currentStartDate, DAYS_WINDOW);
    render();
  });

  startDateInput.addEventListener("change", async (e) => {
    currentStartDate = parseInputDate(e.target.value);
    await ensureEventsLoadedForWeek(currentStartDate, DAYS_WINDOW);
    render();
  });
}

// Muuntaa hinnat sentit -> eurot
function formatPrice(minPrice, maxPrice) {
  if (!minPrice && !maxPrice) return "Ei hintaa saatavilla";
  const min = minPrice ? (minPrice).toFixed(2) : null;
  const max = maxPrice ? (maxPrice).toFixed(2) : null;
  if (!max || min === max) return `alk. ${min} €`;
  return `alk. ${min}–${max} €`;
}

// Harkitut kuvaukset tapahtumatyyppien mukaan
function getCustomDescription(event) {
  const title = event.title.toLowerCase();
  
  if (title.includes("appro")) {
    return "APPROT: Rastisuunnistus, jossa käydään erinäisiä baareja/ravintoloita läpi tilaamalla tuotteita saadakseen leimoja passiin.";
  }
  if (title.includes("sitsit")) {
    return "SITSIT: Perinteiset opiskelijasitsit laulujen ja ohjelman kera.";
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
  })).sort((a,b)=>a.dateObj-b.dateObj);
}

// Varmistaa, että tarvittavat tapahtumat on ladattu, estää tuplauksia
async function ensureEventsLoadedForWeek(startDate, daysWindow) {
  const weekEvents = filterEvents(allEvents, startDate, daysWindow);
  if (weekEvents.length === 0) {
    try {
      const newEvents = await loadEvents();
      const existingKeys = new Set(allEvents.map(e => e.title + e.dateObj.getTime()));
      const uniqueNewEvents = newEvents.filter(e => !existingKeys.has(e.title + e.dateObj.getTime()));
      allEvents = allEvents.concat(uniqueNewEvents);
    } catch (e) {
      console.error("Uusien tapahtumien haku epäonnistui:", e);
    }
  }
}

// Renderöinti
function render() {
  const filteredEvents = filterEvents(allEvents, currentStartDate, DAYS_WINDOW);
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

    const card = document.createElement("article");
    card.className = "event-card";

    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(event.location)}</div>
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
  return date.toLocaleDateString("fi-FI", { day: "numeric", month: "numeric", year: "numeric" });
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}