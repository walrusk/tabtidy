import type {
  ChromeTabLike,
  ClosedTabCapture,
  ClosedTabDayGroup,
  ClosedTabRecord,
} from "../types.js";
import { toLocalDayKey } from "./date.js";

const UNTITLED_TAB = "Untitled tab";

export function createClosedTabCaptures(
  tabs: ChromeTabLike[],
  now: Date = new Date(),
): ClosedTabCapture[] {
  const closedAt = now.toISOString();
  const dayKey = toLocalDayKey(now);

  return tabs.flatMap((tab) => {
    if (tab.pinned || typeof tab.id !== "number") {
      return [];
    }

    const url = normalizeUrl(tab.url);

    return [
      {
        tabId: tab.id,
        record: {
          url,
          title: normalizeTitle(tab.title, url),
          closedAt,
          dayKey,
        },
      },
    ];
  });
}

export function sanitizeClosedTabRecords(value: unknown): ClosedTabRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isClosedTabRecord(item)) {
      return [];
    }

    return [item];
  });
}

export function groupClosedTabRecords(
  records: ClosedTabRecord[],
): ClosedTabDayGroup[] {
  const groups = new Map<string, ClosedTabRecord[]>();

  for (const record of [...records].sort(compareRecordsNewestFirst)) {
    const group = groups.get(record.dayKey);

    if (group) {
      group.push(record);
      continue;
    }

    groups.set(record.dayKey, [record]);
  }

  return [...groups.entries()].map(([dayKey, dayRecords]) => ({
    dayKey,
    records: dayRecords,
  }));
}

function compareRecordsNewestFirst(
  left: ClosedTabRecord,
  right: ClosedTabRecord,
): number {
  if (left.dayKey !== right.dayKey) {
    return right.dayKey.localeCompare(left.dayKey);
  }

  if (left.closedAt !== right.closedAt) {
    return right.closedAt.localeCompare(left.closedAt);
  }

  return left.title.localeCompare(right.title);
}

function normalizeTitle(title: string | undefined, url: string): string {
  const trimmedTitle = title?.trim() ?? "";

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return url || UNTITLED_TAB;
}

function normalizeUrl(url: string | undefined): string {
  return url?.trim() ?? "";
}

function isClosedTabRecord(value: unknown): value is ClosedTabRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.url === "string" &&
    typeof record.title === "string" &&
    typeof record.closedAt === "string" &&
    typeof record.dayKey === "string"
  );
}
