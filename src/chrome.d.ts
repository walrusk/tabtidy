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

type ChromeTabCreateProperties = {
  active?: boolean;
  url?: string;
  windowId?: number;
};

type ChromeTabUpdateProperties = {
  active?: boolean;
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
  runtime: {
    getURL(path: string): string;
  };
  storage: {
    local: ChromeStorageArea;
  };
  tabs: {
    create(createProperties: ChromeTabCreateProperties): Promise<ChromeTab>;
    query(queryInfo: ChromeTabQueryInfo): Promise<ChromeTab[]>;
    remove(tabIds: number[]): Promise<void>;
    update(
      tabId: number,
      updateProperties: ChromeTabUpdateProperties,
    ): Promise<ChromeTab>;
  };
};
