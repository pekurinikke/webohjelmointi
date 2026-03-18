const HERVANTA = { lat: 61.4499, lon: 23.8500 };
const VERY_NEAR_HERVANTA_KM = 3;
const NEAR_HERVANTA_KM = 7;

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

const eventsContainer = document.getElementById("eventsContainer");
let allEvents = [];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getDistanceInfo(location) {
  if (!placeCoords[location]) return null;
  const km = haversineDistance(HERVANTA.lat, HERVANTA.lon, placeCoords[location].lat, placeCoords[location].lon);
  const kmRounded = km.toFixed(1);
  if (km <= VERY_NEAR_HERVANTA_KM) return { label: "Todella lähellä Hervantaa", class: "very-near", km: kmRounded };
  if (km <= NEAR_HERVANTA_KM) return { label: "Kohtuullisen lähellä Hervantaa", class: "near", km: kmRounded };
  return { label: "Hervannasta kauempana", class: "far", km: kmRounded };
}

function getPopularityLabel(popularity) {
  if (popularity >= 50) return { label: "🔥 Korkea", level: "high" };
  if (popularity >= 20) return { label: "⭐ Keskitaso", level: "medium" };
  return { label: "🙂 Matala", level: "low" };
}

function formatDateTimeFi(date) {
  return date.toLocaleString("fi-FI", { weekday:"short", day:"numeric", month:"numeric", hour:"2-digit", minute:"2-digit" });
}

function formatPrice(min, max) {
  if (!min && !max) return "Ei hintaa saatavilla";
  if (!max || min === max) return `alk. ${min.toFixed(2)} €`;
  return `alk. ${min.toFixed(2)}–${max.toFixed(2)} €`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getCustomDescription(event) {
  return event.description || "";
}

function renderEvents(events) {
  eventsContainer.innerHTML = "";
  if (!events.length) {
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

function init() {
  fetch("events.json")
    .then(res => res.json())
    .then(data => {
      allEvents = data.map(ev => ({ ...ev, dateObj: new Date(ev.date) }));
      renderEvents(allEvents);

      // liitetään nappi vasta kun data on ladattu
      const nearButton = document.getElementById("nearHervantaBtn");
      if (nearButton) {
        nearButton.addEventListener("click", () => {
          const sorted = [...allEvents].sort((a, b) => {
            const d1 = parseFloat(getDistanceInfo(a.location)?.km ?? 999);
            const d2 = parseFloat(getDistanceInfo(b.location)?.km ?? 999);
            return d1 - d2;
          });
          renderEvents(sorted);
        });
      }
    })
    .catch(console.error);
}

init();