export type ClosedTabRecord = {
  url: string;
  title: string;
  closedAt: string;
  dayKey: string;
};

export type ClosedTabCapture = {
  tabId: number;
  record: ClosedTabRecord;
};

export type ChromeTabLike = {
  id?: number;
  pinned?: boolean;
  title?: string;
  url?: string;
};

export type StorageAreaLike = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

export type ClosedTabRunGroup = {
  closedAt: string;
  records: ClosedTabRecord[];
};
