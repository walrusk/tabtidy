import type { ClosedTabRecord } from "../types.js";
import { formatRunHeading } from "./date.js";
import { groupClosedTabRecords } from "./records.js";

export function createHistoryExportFilename(now: Date = new Date()): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `tabtidy-history-${year}-${month}-${day}-${hours}${minutes}.html`;
}

export function createHistoryExportHtml(
  records: ClosedTabRecord[],
  locale: string,
  exportedAt: Date = new Date(),
): string {
  const groups = groupClosedTabRecords(records);
  const exportedLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(exportedAt);

  const content =
    groups.length === 0
      ? `
        <section class="message-card">
          <p>No tabs have been tidied yet.</p>
        </section>
      `
      : groups
          .map((group) => {
            const items = group.records
              .map((record) => {
                const title = escapeHtml(record.title);
                const url = escapeHtml(record.url);

                if (record.url) {
                  return `
                    <li class="tab-entry">
                      <a class="tab-title" href="${url}" target="_blank" rel="noreferrer">${title}</a>
                      <p class="tab-url">${url}</p>
                    </li>
                  `;
                }

                return `
                  <li class="tab-entry">
                    <span class="tab-title">${title}</span>
                    <p class="tab-url">No URL was available for this tab.</p>
                  </li>
                `;
              })
              .join("");

            return `
              <section class="run-card">
                <h2>${escapeHtml(formatRunHeading(group.closedAt, locale))}</h2>
                <ul class="tab-list">
                  ${items}
                </ul>
              </section>
            `;
          })
          .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TabTidy Saved Tab List</title>
    <style>
      :root {
        color-scheme: light;
        --page-bg: #e8eff8;
        --page-accent: #1f4f8f;
        --card-bg: rgba(255, 255, 255, 0.96);
        --card-border: rgba(31, 79, 143, 0.18);
        --text-primary: #163354;
        --text-secondary: #4f6784;
        --link: #0f4f99;
        --shadow: 0 22px 48px rgba(22, 51, 84, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-width: 320px;
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(31, 79, 143, 0.18), transparent 32%),
          linear-gradient(180deg, #f4f8fd 0%, var(--page-bg) 100%);
        color: var(--text-primary);
        font-family: "Avenir Next", "Segoe UI", "Trebuchet MS", sans-serif;
      }

      .page-shell {
        width: min(920px, calc(100% - 32px));
        margin: 0 auto;
        padding: 48px 0 56px;
      }

      .hero {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--page-accent);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(2.2rem, 6vw, 3.2rem);
        line-height: 1.05;
      }

      .lede {
        max-width: 42rem;
        margin: 12px 0 0;
        color: var(--text-secondary);
        font-size: 1.02rem;
        line-height: 1.6;
      }

      .meta {
        margin: 16px 0 0;
        color: var(--text-secondary);
        font-size: 0.92rem;
      }

      .history-root {
        display: grid;
        gap: 18px;
      }

      .run-card,
      .message-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 22px;
        box-shadow: var(--shadow);
        padding: 20px 22px;
      }

      h2 {
        margin: 0 0 16px;
        font-size: 1.05rem;
        line-height: 1.4;
      }

      .tab-list {
        margin: 0;
        padding-left: 1.3rem;
        display: grid;
        gap: 14px;
      }

      .tab-entry {
        color: var(--text-primary);
      }

      .tab-title {
        color: var(--link);
        font-weight: 600;
        text-decoration: none;
        word-break: break-word;
      }

      .tab-url {
        margin: 6px 0 0;
        color: var(--text-secondary);
        font-size: 0.92rem;
        line-height: 1.45;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="page-shell">
      <header class="hero">
        <p class="eyebrow">Browser housekeeping</p>
        <h1>TabTidy Saved Tab List</h1>
        <p class="lede">A saved snapshot of the tabs you tidied in TabTidy.</p>
        <p class="meta">Exported ${escapeHtml(exportedLabel)}</p>
      </header>

      <main class="history-root">
        ${content}
      </main>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
