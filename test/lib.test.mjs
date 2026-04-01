import assert from "node:assert/strict";
import test from "node:test";

import { toLocalDayKey } from "../dist/lib/date.js";
import { createClosedTabCaptures, groupClosedTabRecords } from "../dist/lib/records.js";
import {
  appendClosedTabRecords,
  CLOSED_TABS_STORAGE_KEY,
  readClosedTabRecords,
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
  const captures = createClosedTabCaptures([
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
  ], now);

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

test("groupClosedTabRecords sorts newest days and newest records first", () => {
  const groups = groupClosedTabRecords([
    {
      url: "https://example.com/older-day",
      title: "Older day",
      closedAt: "2026-03-30T10:00:00.000Z",
      dayKey: "2026-03-30",
    },
    {
      url: "https://example.com/newer-day-early",
      title: "Newer day early",
      closedAt: "2026-04-01T08:00:00.000Z",
      dayKey: "2026-04-01",
    },
    {
      url: "https://example.com/newer-day-late",
      title: "Newer day late",
      closedAt: "2026-04-01T10:15:00.000Z",
      dayKey: "2026-04-01",
    },
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].dayKey, "2026-04-01");
  assert.equal(groups[0].records[0].title, "Newer day late");
  assert.equal(groups[0].records[1].title, "Newer day early");
  assert.equal(groups[1].dayKey, "2026-03-30");
});
