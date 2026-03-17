// events-fetch.js
const eventsContainer = document.getElementById("eventsContainer");
const eventCount = document.getElementById("eventCount");

// Funktio tapahtumien renderöintiin
function renderEvents(events) {
  eventsContainer.innerHTML = "";
  if (!events || events.length === 0) {
    eventsContainer.innerHTML = "<p>Ei tapahtumia löydetty.</p>";
    return;
  }

  events.forEach(event => {
    const eventDiv = document.createElement("div");
    eventDiv.className = "event-card";

    const title = document.createElement("h3");
    title.textContent = event.name;
    eventDiv.appendChild(title);

    const date = document.createElement("p");
    const eventDate = new Date(event.startDate).toLocaleString("fi-FI");
    date.textContent = `Aika: ${eventDate}`;
    eventDiv.appendChild(date);

    if (event.location && event.location.name) {
      const location = document.createElement("p");
      location.textContent = `Paikka: ${event.location.name}`;
      eventDiv.appendChild(location);
    }

    if (event.price !== undefined && event.price !== null) {
      const price = document.createElement("p");
      price.textContent = `Hinta: ${event.price} €`;
      eventDiv.appendChild(price);
    }

    eventsContainer.appendChild(eventDiv);
  });

  if (eventCount) eventCount.textContent = `Löytyi ${events.length} tapahtumaa.`;
}

// Hae live-tapahtumat Kide.app API:sta
fetch("https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=10")
  .then(res => res.json())
  .then(data => {
    if (data.items && data.items.length > 0) {
      renderEvents(data.items);
      document.getElementById("rangeTitle").textContent = "Tapahtumat tällä hetkellä:";
    } else {
      eventsContainer.innerHTML = "<p>Ei tapahtumia löydetty.</p>";
    }
  })
  .catch(err => {
    console.error("Tapahtumia ei voitu ladata:", err);
    eventsContainer.innerHTML = "<p>Tapahtumia ei voitu ladata.</p>";
  });