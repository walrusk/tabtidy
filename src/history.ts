import { formatClosedTime, formatDayHeading } from "./lib/date.js";
import { groupClosedTabRecords } from "./lib/records.js";
import { readClosedTabRecords } from "./lib/storage.js";
import type { ClosedTabDayGroup, ClosedTabRecord } from "./types.js";

const historyRoot = document.querySelector<HTMLElement>("[data-history-root]");

if (!historyRoot) {
  throw new Error("TabTidy history root not found.");
}

void renderHistory(historyRoot);

async function renderHistory(container: HTMLElement): Promise<void> {
  try {
    const records = await readClosedTabRecords(chrome.storage.local);
    const groups = groupClosedTabRecords(records);

    if (groups.length === 0) {
      container.replaceChildren(createMessageCard("No tabs have been tidied yet."));
      return;
    }

    container.replaceChildren(...groups.map((group) => createDaySection(group)));
  } catch (error) {
    container.replaceChildren(
      createMessageCard("Tab history could not be loaded right now."),
    );
    console.error("TabTidy failed to load history.", error);
  }
}

function createDaySection(group: ClosedTabDayGroup): HTMLElement {
  const section = document.createElement("section");
  section.className = "day-group";

  const heading = document.createElement("h2");
  heading.className = "day-heading";
  heading.textContent = formatDayHeading(group.dayKey, navigator.language);

  const list = document.createElement("ul");
  list.className = "tab-list";

  for (const record of group.records) {
    list.append(createTabEntry(record));
  }

  section.append(heading, list);

  return section;
}

function createTabEntry(record: ClosedTabRecord): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "tab-entry";

  const row = document.createElement("div");
  row.className = "tab-entry-row";

  const titleElement = record.url
    ? document.createElement("a")
    : document.createElement("span");

  titleElement.className = "tab-title";
  titleElement.textContent = record.title;

  if (titleElement instanceof HTMLAnchorElement) {
    titleElement.href = record.url;
    titleElement.target = "_blank";
    titleElement.rel = "noreferrer";
  }

  const timestamp = document.createElement("time");
  timestamp.className = "tab-time";
  timestamp.dateTime = record.closedAt;
  timestamp.textContent = formatClosedTime(record.closedAt, navigator.language);

  row.append(titleElement, timestamp);

  const urlLine = document.createElement("p");
  urlLine.className = "tab-url";
  urlLine.textContent = record.url || "No URL was available for this tab.";

  item.append(row, urlLine);

  return item;
}

function createMessageCard(message: string): HTMLElement {
  const card = document.createElement("section");
  card.className = "message-card";

  const body = document.createElement("p");
  body.textContent = message;

  card.append(body);

  return card;
}
