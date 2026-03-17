async function loadEvents() {
  const response = await fetch("https://api.kide.app/api/products?country=FI&city=Tampere&productType=1&pageSize=50");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  // Muutetaan API:n data samaan muotoon kuin vanha JSON
  return data.items.map(event => ({
    ...event,
    dateObj: new Date(event.startDate),
    title: event.name,
    description: event.description || "",
    location: event.location?.name || "",
    organizer: "", // API ei välttämättä anna järjestäjää
    sourceUrl: "" // API ei välttämättä anna URLia
  })).sort((a, b) => a.dateObj - b.dateObj);
}