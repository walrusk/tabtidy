import type {
  ChromeTabLike,
  ClosedTabCapture,
  ClosedTabRecord,
  ClosedTabRunGroup,
} from "../types.js";
import { toLocalDayKey } from "./date.js";

const UNTITLED_TAB = "Untitled tab";

export function createClosedTabCaptures(
  tabs: ChromeTabLike[],
  options: {
    now?: Date;
    excludedUrls?: string[];
  } = {},
): ClosedTabCapture[] {
  const now = options.now ?? new Date();
  const closedAt = now.toISOString();
  const dayKey = toLocalDayKey(now);
  const excludedUrls = new Set(
    (options.excludedUrls ?? []).map((url) => normalizeUrl(url)),
  );

  return tabs.flatMap((tab) => {
    const url = normalizeUrl(tab.url);

    if (
      tab.pinned ||
      typeof tab.id !== "number" ||
      excludedUrls.has(url)
    ) {
      return [];
    }

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
) : ClosedTabRunGroup[] {
  const groups = new Map<string, ClosedTabRecord[]>();

  for (const record of records) {
    const group = groups.get(record.closedAt);

    if (group) {
      group.push(record);
      continue;
    }

    groups.set(record.closedAt, [record]);
  }

  return [...groups.entries()]
    .sort(([leftClosedAt], [rightClosedAt]) =>
      rightClosedAt.localeCompare(leftClosedAt),
    )
    .map(([closedAt, runRecords]) => ({
      closedAt,
      records: runRecords,
    }));
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
