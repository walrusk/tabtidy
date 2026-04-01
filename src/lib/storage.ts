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

export async function removeClosedTabRecord(
  storageArea: StorageAreaLike,
  recordToRemove: ClosedTabRecord,
): Promise<ClosedTabRecord[]> {
  const existingRecords = await readClosedTabRecords(storageArea);
  const recordIndex = existingRecords.findIndex((record) =>
    isSameClosedTabRecord(record, recordToRemove),
  );

  if (recordIndex === -1) {
    return existingRecords;
  }

  const nextRecords = [...existingRecords];
  nextRecords.splice(recordIndex, 1);
  await storageArea.set({ [CLOSED_TABS_STORAGE_KEY]: nextRecords });

  return nextRecords;
}

export async function clearClosedTabRecords(
  storageArea: StorageAreaLike,
): Promise<ClosedTabRecord[]> {
  const nextRecords: ClosedTabRecord[] = [];
  await storageArea.set({ [CLOSED_TABS_STORAGE_KEY]: nextRecords });

  return nextRecords;
}

export async function removeClosedTabRunRecords(
  storageArea: StorageAreaLike,
  closedAt: string,
): Promise<ClosedTabRecord[]> {
  const existingRecords = await readClosedTabRecords(storageArea);
  const nextRecords = existingRecords.filter((record) => record.closedAt !== closedAt);

  if (nextRecords.length === existingRecords.length) {
    return existingRecords;
  }

  await storageArea.set({ [CLOSED_TABS_STORAGE_KEY]: nextRecords });

  return nextRecords;
}

function isSameClosedTabRecord(
  left: ClosedTabRecord,
  right: ClosedTabRecord,
): boolean {
  return (
    left.url === right.url &&
    left.title === right.title &&
    left.closedAt === right.closedAt &&
    left.dayKey === right.dayKey
  );
}
