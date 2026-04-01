import { formatRunHeading } from "./lib/date.js";
import { groupClosedTabRecords } from "./lib/records.js";
import { readClosedTabRecords, removeClosedTabRecord } from "./lib/storage.js";
import type { ClosedTabRecord, ClosedTabRunGroup } from "./types.js";

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

    container.replaceChildren(
      ...groups.map((group) => createRunSection(group, container)),
    );
  } catch (error) {
    container.replaceChildren(
      createMessageCard("Tab history could not be loaded right now."),
    );
    console.error("TabTidy failed to load history.", error);
  }
}

function createRunSection(
  group: ClosedTabRunGroup,
  container: HTMLElement,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "day-group";

  const heading = document.createElement("h2");
  heading.className = "day-heading";
  heading.textContent = formatRunHeading(group.closedAt, navigator.language);

  const list = document.createElement("ul");
  list.className = "tab-list";

  for (const record of group.records) {
    list.append(createTabEntry(record, container));
  }

  section.append(heading, list);

  return section;
}

function createTabEntry(
  record: ClosedTabRecord,
  container: HTMLElement,
): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "tab-entry";

  const row = document.createElement("div");
  row.className = "tab-entry-row";

  const main = document.createElement("div");
  main.className = "tab-entry-main";

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

  const deleteButton = document.createElement("button");
  deleteButton.className = "tab-delete";
  deleteButton.type = "button";
  deleteButton.innerHTML = "&times;";
  deleteButton.setAttribute("aria-label", `Delete ${record.title}`);
  deleteButton.addEventListener("click", () => {
    void handleDeleteRecord(record, deleteButton, container);
  });

  const urlLine = document.createElement("p");
  urlLine.className = "tab-url";
  urlLine.textContent = record.url || "No URL was available for this tab.";

  main.append(titleElement, urlLine);
  row.append(main, deleteButton);
  item.append(row);

  return item;
}

async function handleDeleteRecord(
  record: ClosedTabRecord,
  deleteButton: HTMLButtonElement,
  container: HTMLElement,
): Promise<void> {
  deleteButton.disabled = true;

  try {
    await removeClosedTabRecord(chrome.storage.local, record);
    await renderHistory(container);
  } catch (error) {
    deleteButton.disabled = false;
    console.error("TabTidy failed to delete a saved tab.", error);
  }
}

function createMessageCard(message: string): HTMLElement {
  const card = document.createElement("section");
  card.className = "message-card";

  const body = document.createElement("p");
  body.textContent = message;

  card.append(body);

  return card;
}
