import type { ClosedTabRecord, StorageAreaLike } from "../types.js";
import { sanitizeClosedTabRecords } from "./records.js";

export const CLOSED_TABS_STORAGE_KEY = "closedTabRecords";

export async function readClosedTabRecords(
  storageArea: StorageAreaLike,
): Promise<ClosedTabRecord[]> {
  const storedItems = await storageArea.get(CLOSED_TABS_STORAGE_KEY);

  return sanitizeClosedTabRecords(storedItems[CLOSED_TABS_STORAGE_KEY]);
}

export async function appendClosedTabRecords(
  storageArea: StorageAreaLike,
  newRecords: ClosedTabRecord[],
): Promise<ClosedTabRecord[]> {
  if (newRecords.length === 0) {
    return readClosedTabRecords(storageArea);
  }

  const existingRecords = await readClosedTabRecords(storageArea);
  const nextRecords = [...existingRecords, ...newRecords];

  await storageArea.set({ [CLOSED_TABS_STORAGE_KEY]: nextRecords });

  return nextRecords;
}
