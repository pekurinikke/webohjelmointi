const fs = require("fs");
const path = require("path");

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toIsoWithLocalOffset(date) {
  const tzOffset = -date.getTimezoneOffset();
  const sign = tzOffset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(tzOffset) % 60).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${sign}${hours}:${minutes}`;
}

function createEvent(id, title, daysFromNow, hour, minute, popularity, description, organizer, url) {
  const now = new Date();
  const date = addDays(now, daysFromNow);
  date.setHours(hour, minute, 0, 0);

  return {
    id,
    title,
    date: toIsoWithLocalOffset(date),
    location: "Hervanta, Tampere",
    popularity,
    description,
    organizer,
    sourceUrl: url
  };
}

const events = [
  createEvent(
    "event-auto-001",
    "Haalaribileet @ Hervanta",
    2,
    19,
    0,
    88,
    "Rento opiskelijabileilta haalarikansalle. Musiikkia, teemajuomia ja paljon porukkaa.",
    "TUTTI",
    "https://example.com/haalaribileet"
  ),
  createEvent(
    "event-auto-002",
    "Sitsit: Kevään avaussitsit",
    6,
    18,
    0,
    76,
    "Perinteiset opiskelijasitsit teemalla kevään avaus. OPM ja laulut valmiina.",
    "Ainejärjestö X",
    "https://example.com/sitsit"
  ),
  createEvent(
    "event-auto-003",
    "Saunailta ja lautapelit",
    11,
    17,
    30,
    52,
    "Rentoa hengailua, saunomista ja lautapelejä opiskelijoille.",
    "Kerho Y",
    "https://example.com/saunailta"
  ),
  createEvent(
    "event-auto-004",
    "Afterwork & networking",
    16,
    16,
    0,
    43,
    "Rennompi verkostoitumisilta opiskelijoille ja alumneille.",
    "TREY / yhteistyöjärjestäjät",
    "https://example.com/networking"
  ),
  createEvent(
    "event-auto-005",
    "Appro-etkot Hervannassa",
    20,
    18,
    30,
    91,
    "Etkot ennen isompaa approkierrosta. Teemajuomat ja haalarit suositeltuja.",
    "Tapahtumatiimi Z",
    "https://example.com/appro"
  ),
  createEvent(
    "event-auto-006",
    "Lautapeli-ilta kiltahuoneella",
    24,
    17,
    0,
    49,
    "Matalan kynnyksen ilta uusille ja vanhoille opiskelijoille.",
    "Kilta Q",
    "https://example.com/lautapeli-ilta"
  )
];

const outputPath = path.join(__dirname, "..", "data", "events.json");

fs.writeFileSync(outputPath, JSON.stringify(events, null, 2), "utf8");

console.log(`Kirjoitettu ${events.length} tapahtumaa tiedostoon: ${outputPath}`);