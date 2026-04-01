import assert from "node:assert/strict";
import test from "node:test";

import {
  createHistoryExportFilename,
  createHistoryExportHtml,
} from "../dist/lib/export.js";
import { toLocalDayKey } from "../dist/lib/date.js";
import { createClosedTabCaptures, groupClosedTabRecords } from "../dist/lib/records.js";
import {
  appendClosedTabRecords,
  clearClosedTabRecords,
  CLOSED_TABS_STORAGE_KEY,
  readClosedTabRecords,
  removeClosedTabRecord,
  removeClosedTabRunRecords,
} from "../dist/lib/storage.js";

class FakeStorageArea {
  constructor(seed = {}) {
    this.items = { ...seed };
  }

  async get(key) {
    return { [key]: this.items[key] };
  }

  async set(items) {
    Object.assign(this.items, items);
  }
}

test("toLocalDayKey formats a local date as YYYY-MM-DD", () => {
  const date = new Date(2026, 3, 1, 8, 15, 0);

  assert.equal(toLocalDayKey(date), "2026-04-01");
});

test("createClosedTabCaptures filters pinned tabs and fills missing values", () => {
  const now = new Date(2026, 3, 1, 9, 30, 0);
  const captures = createClosedTabCaptures(
    [
      {
        id: 1,
        pinned: false,
        title: "  Planning doc  ",
        url: "https://example.com/planning",
      },
      {
        id: 2,
        pinned: false,
      },
      {
        id: 3,
        pinned: true,
        title: "Pinned tab",
        url: "https://example.com/pinned",
      },
      {
        title: "Missing id",
        url: "https://example.com/no-id",
      },
    ],
    { now },
  );

  assert.equal(captures.length, 2);
  assert.deepEqual(captures[0], {
    tabId: 1,
    record: {
      url: "https://example.com/planning",
      title: "Planning doc",
      closedAt: now.toISOString(),
      dayKey: "2026-04-01",
    },
  });
  assert.deepEqual(captures[1], {
    tabId: 2,
    record: {
      url: "",
      title: "Untitled tab",
      closedAt: now.toISOString(),
      dayKey: "2026-04-01",
    },
  });
});

test("createClosedTabCaptures skips excluded URLs such as the history page", () => {
  const now = new Date(2026, 3, 1, 9, 30, 0);
  const captures = createClosedTabCaptures(
    [
      {
        id: 10,
        pinned: false,
        title: "TabTidy",
        url: "chrome-extension://abc123/tabtidy.html",
      },
      {
        id: 11,
        pinned: false,
        title: "Regular tab",
        url: "https://example.com/work",
      },
    ],
    {
      now,
      excludedUrls: ["chrome-extension://abc123/tabtidy.html"],
    },
  );

  assert.equal(captures.length, 1);
  assert.equal(captures[0].tabId, 11);
  assert.equal(captures[0].record.title, "Regular tab");
});

test("appendClosedTabRecords merges onto existing history and ignores invalid values", async () => {
  const existingRecord = {
    url: "https://example.com/existing",
    title: "Existing",
    closedAt: "2026-03-31T16:00:00.000Z",
    dayKey: "2026-03-31",
  };
  const newRecord = {
    url: "https://example.com/new",
    title: "New",
    closedAt: "2026-04-01T15:30:00.000Z",
    dayKey: "2026-04-01",
  };
  const storageArea = new FakeStorageArea({
    [CLOSED_TABS_STORAGE_KEY]: [existingRecord, { nope: true }],
  });

  const nextRecords = await appendClosedTabRecords(storageArea, [newRecord]);
  const storedRecords = await readClosedTabRecords(storageArea);

  assert.deepEqual(nextRecords, [existingRecord, newRecord]);
  assert.deepEqual(storedRecords, [existingRecord, newRecord]);
});

test("removeClosedTabRecord deletes one matching saved tab at a time", async () => {
  const duplicateRecord = {
    url: "https://example.com/duplicate",
    title: "Duplicate",
    closedAt: "2026-04-01T15:30:00.000Z",
    dayKey: "2026-04-01",
  };
  const storageArea = new FakeStorageArea({
    [CLOSED_TABS_STORAGE_KEY]: [
      duplicateRecord,
      duplicateRecord,
      {
        url: "https://example.com/keep",
        title: "Keep",
        closedAt: "2026-04-01T15:35:00.000Z",
        dayKey: "2026-04-01",
      },
    ],
  });

  const nextRecords = await removeClosedTabRecord(storageArea, duplicateRecord);

  assert.equal(nextRecords.length, 2);
  assert.deepEqual(nextRecords[0], duplicateRecord);
  assert.equal(nextRecords[1].title, "Keep");
});

test("clearClosedTabRecords removes every saved tab record", async () => {
  const storageArea = new FakeStorageArea({
    [CLOSED_TABS_STORAGE_KEY]: [
      {
        url: "https://example.com/one",
        title: "One",
        closedAt: "2026-04-01T15:30:00.000Z",
        dayKey: "2026-04-01",
      },
      {
        url: "https://example.com/two",
        title: "Two",
        closedAt: "2026-04-01T15:35:00.000Z",
        dayKey: "2026-04-01",
      },
    ],
  });

  const nextRecords = await clearClosedTabRecords(storageArea);
  const storedRecords = await readClosedTabRecords(storageArea);

  assert.deepEqual(nextRecords, []);
  assert.deepEqual(storedRecords, []);
});

test("removeClosedTabRunRecords removes all records from one saved section", async () => {
  const storageArea = new FakeStorageArea({
    [CLOSED_TABS_STORAGE_KEY]: [
      {
        url: "https://example.com/one",
        title: "One",
        closedAt: "2026-04-01T15:30:00.000Z",
        dayKey: "2026-04-01",
      },
      {
        url: "https://example.com/two",
        title: "Two",
        closedAt: "2026-04-01T15:30:00.000Z",
        dayKey: "2026-04-01",
      },
      {
        url: "https://example.com/keep",
        title: "Keep",
        closedAt: "2026-04-01T15:35:00.000Z",
        dayKey: "2026-04-01",
      },
    ],
  });

  const nextRecords = await removeClosedTabRunRecords(
    storageArea,
    "2026-04-01T15:30:00.000Z",
  );

  assert.equal(nextRecords.length, 1);
  assert.equal(nextRecords[0].title, "Keep");
});

test("groupClosedTabRecords groups tabs by tidy run and sorts newest runs first", () => {
  const groups = groupClosedTabRecords([
    {
      url: "https://example.com/earlier-run-a",
      title: "Earlier run A",
      closedAt: "2026-04-01T08:00:00.000Z",
      dayKey: "2026-04-01",
    },
    {
      url: "https://example.com/latest-run-a",
      title: "Latest run A",
      closedAt: "2026-04-01T08:00:00.000Z",
      dayKey: "2026-04-01",
    },
    {
      url: "https://example.com/latest-run-b",
      title: "Latest run B",
      closedAt: "2026-04-01T10:15:00.000Z",
      dayKey: "2026-04-01",
    },
    {
      url: "https://example.com/older-day",
      title: "Older day",
      closedAt: "2026-03-30T10:00:00.000Z",
      dayKey: "2026-03-30",
    },
  ]);

  assert.equal(groups.length, 3);
  assert.equal(groups[0].closedAt, "2026-04-01T10:15:00.000Z");
  assert.equal(groups[0].records[0].title, "Latest run B");
  assert.equal(groups[1].closedAt, "2026-04-01T08:00:00.000Z");
  assert.deepEqual(groups[1].records.map((record) => record.title), [
    "Earlier run A",
    "Latest run A",
  ]);
  assert.equal(groups[2].closedAt, "2026-03-30T10:00:00.000Z");
});

test("createHistoryExportFilename creates a timestamped html file name", () => {
  const fileName = createHistoryExportFilename(new Date(2026, 3, 1, 9, 5, 0));

  assert.equal(fileName, "tabtidy-history-2026-04-01-0905.html");
});

test("createHistoryExportHtml builds a standalone html snapshot", () => {
  const html = createHistoryExportHtml(
    [
      {
        url: "https://example.com/?a=1&b=2",
        title: "Work <Inbox>",
        closedAt: "2026-04-01T10:15:00.000Z",
        dayKey: "2026-04-01",
      },
      {
        url: "",
        title: "Untitled",
        closedAt: "2026-04-01T10:15:00.000Z",
        dayKey: "2026-04-01",
      },
    ],
    "en-CA",
    new Date("2026-04-01T11:00:00.000Z"),
  );

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /TabTidy Saved Tab List/);
  assert.match(html, /Work &lt;Inbox&gt;/);
  assert.match(html, /https:\/\/example\.com\/\?a=1&amp;b=2/);
  assert.match(html, /No URL was available for this tab\./);
});
