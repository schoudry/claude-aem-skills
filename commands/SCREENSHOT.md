Take full-page screenshots in **desktop**, **tablet**, and **mobile** viewports and save them to `C:\dev\projects\eaem\playground\packages\eaem-in-dev-screenshots\`.

## Viewports

| Suffix | Width | Height |
|--------|-------|--------|
| `-desktop.png` | 1440 | 900 |
| `-tablet.png` | 768 | 1024 |
| `-mobile.png` | 390 | 844 |

## Determine the URL

**If a URL argument was provided** (e.g. `SCREENSHOT https://eaem-in--dev-eaem-in--eaem.aem.live/sustainability`):
- Use that URL directly.
- Derive the base filename from the last path segment (e.g. `sustainability`). Strip `.html` if present.

**If no URL was provided**:
- Find the most recently modified `.content.xml` in the India WIP folder:
  ```
  C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content
  ```
- Derive the AEM Live URL by stripping the JCR prefix:
  - Remove `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eaem\corporate\eaem-com\in\en`
  - Remove the trailing `\.content.xml`
  - Replace backslashes with `/`
  - Prepend `https://eaem-in--dev-eaem-in--eaem.aem.live`
- Base filename = last path segment (e.g. `sustainability`)

Output files: `<base>-desktop.png`, `<base>-tablet.png`, `<base>-mobile.png`

## Take the screenshots

Write the following as a temporary `.mjs` file in `C:\dev\projects\eaem\playground\temp\`, run it with `node`, then delete it. Fill in the actual URL and base filename before writing.

```js
import { chromium } from 'playwright';

const url = '<DERIVED_OR_PROVIDED_URL>';
const base = 'C:/dev/projects/eaem/playground/packages/eaem-in-dev-screenshots/<BASENAME>';

const viewports = [
  { suffix: '-desktop.png', width: 1440, height: 900,  label: 'Desktop (1440×900)' },
  { suffix: '-tablet.png',  width: 768,  height: 1024, label: 'Tablet (768×1024)' },
  { suffix: '-mobile.png',  width: 390,  height: 844,  label: 'Mobile (390×844)' },
];

// Proxy GraphQL persisted-query requests to AEM author so content fragment data
// (fact-cards, dashboard cards, etc.) is available even on preview/dev environments.
const AUTHOR_BASE = 'https://author-p99999-e999999.adobeaemcloud.com';
const AUTHOR_AUTH = 'Basic ' + Buffer.from('claude-migration-user:claude-migration-user').toString('base64');

async function setupGraphqlProxy(page) {
  await page.route('**/graphql/execute.json/**', async (route) => {
    const origUrl = new URL(route.request().url());
    const authorUrl = AUTHOR_BASE + origUrl.pathname + origUrl.search;
    try {
      const resp = await fetch(authorUrl, { headers: { Authorization: AUTHOR_AUTH } });
      const body = Buffer.from(await resp.arrayBuffer());
      await route.fulfill({
        status: resp.status,
        headers: { 'content-type': resp.headers.get('content-type') || 'application/json' },
        body,
      });
      console.log('GraphQL proxied:', origUrl.pathname);
    } catch (err) {
      console.warn('GraphQL proxy failed:', authorUrl, err.message);
      await route.continue();
    }
  });
}

async function scrollAndLoad(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 800;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
  await page.waitForTimeout(8000);
}

async function injectUrlBanner(page, pageUrl, label) {
  await page.evaluate(([u, l]) => {
    const banner = document.createElement('div');
    banner.style.cssText = `
      width: 100%;
      background: #222;
      color: #fff;
      font-family: monospace;
      font-size: 15px;
      padding: 10px 20px;
      box-sizing: border-box;
      word-break: break-all;
    `;
    banner.textContent = u + '   |   ' + l;
    document.body.insertBefore(banner, document.body.firstChild);
  }, [pageUrl, label]);
}

const browser = await chromium.launch();

for (const { suffix, width, height, label } of viewports) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await setupGraphqlProxy(page);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await scrollAndLoad(page);
  await injectUrlBanner(page, url, label);
  const outPath = base + suffix;
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved:', outPath);
  await page.close();
}

await browser.close();
```

## Copy to content-xmls screenshots

After saving, copy all three files to `C:\dev\projects\eaem\tools\content-xmls\screenshots\`:

```powershell
$screenshotsDir = 'C:\dev\projects\eaem\tools\content-xmls\screenshots'
if (!(Test-Path $screenshotsDir)) { New-Item -ItemType Directory -Path $screenshotsDir | Out-Null }
foreach ($suffix in @('-desktop.png', '-tablet.png', '-mobile.png')) {
    Copy-Item -Path "C:\dev\projects\eaem\playground\packages\eaem-in-dev-screenshots\<BASENAME>$suffix" `
              -Destination "$screenshotsDir\<BASENAME>$suffix" -Force
}
Write-Host "Copied to $screenshotsDir"
```

## Report

Confirm all three saved paths and display each screenshot using the Read tool.
