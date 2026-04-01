type ChromeTab = {
  id?: number;
  windowId?: number;
  pinned?: boolean;
  title?: string;
  url?: string;
};

type ChromeTabQueryInfo = {
  currentWindow?: boolean;
  windowId?: number;
};

type ChromeStorageArea = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

declare const chrome: {
  action: {
    onClicked: {
      addListener(callback: (tab: ChromeTab) => void | Promise<void>): void;
    };
  };
  storage: {
    local: ChromeStorageArea;
  };
  tabs: {
    query(queryInfo: ChromeTabQueryInfo): Promise<ChromeTab[]>;
    remove(tabIds: number[]): Promise<void>;
  };
};
