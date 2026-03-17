const DAYS_WINDOW = 21;
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
}

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
    description: `Hinta: ${event.minPrice?.eur || "N/A"}–${event.maxPrice?.eur || "N/A"} € | Saatavuus: ${event.availability}`,
    location: event.place || "Tuntematon",
    organizer: event.companyName || "",
    sourceUrl: "",
    popularity: event.favoritedTimes || 0
  })).sort((a,b) => a.dateObj - b.dateObj);
}

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
        <p>Kokeile siirtyä seuraavaan 3 viikon jaksoon tai muuta aloituspäivää.</p>
      </div>
    `;
    return;
  }

  events.forEach(event => {
    const card = document.createElement("article");
    card.className = "event-card";
    const dateText = formatDateTimeFi(event.dateObj);

    card.innerHTML = `
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <div><strong>Päivämäärä:</strong> ${dateText}</div>
        <div><strong>Sijainti:</strong> ${escapeHtml(event.location)}</div>
        <div><strong>Järjestäjä:</strong> ${escapeHtml(event.organizer)}</div>
      </div>
      <p class="event-description">${escapeHtml(event.description)}</p>
    `;

    eventsContainer.appendChild(card);
  });
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