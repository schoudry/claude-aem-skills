# Migrate Page — Skill Reference

> Invoked by: **"migrate page `<source page>` using `<template page>`"**
>
> Migrates a live AbbVie page (`<source page>`) into a JCR `.content.xml` by
> using an existing migrated page (`<template page>`) as a structural reference.

---

## Inputs

| Placeholder | Meaning | Example |
|---|---|---|
| `<source page>` | Live page URL to migrate | `https://www.abbvie.in/join-us/life-at-abbvie/employee-resource-groups.html` |
| `<template page>` | Already-migrated AEM Live URL used as structure reference | `https://abbvie-in--dev-abbvie-in--abbvie.aem.live/who-we-are/our-principles` |

---

## Step 0: Resolve Paths

1. **Template content XML root:**
   ```
   C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\
   ```
   Derive the relative path from the `<template page>` URL path (e.g. `/who-we-are/our-principles` → `who-we-are\our-principles`).
   Full template XML: `<root>\who-we-are\our-principles\.content.xml`

2. **Output root (same base):**
   ```
   C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\
   ```

3. **Output page node name:** fetch `<source page>` HTML and read:
   ```html
   <meta property="og:url" content="https://www.abbvie.in/join-us/life-at-abbvie/employee-resource-groups.html">
   ```
   Extract the last path segment: `employee-resource-groups`.
   **Always lowercase this segment before using it as the folder name** — the source URL/og:url segment sometimes has mixed case (e.g. `abbVie-recognised-as-a-great-place-to-work-at-2024-awards-ceremony`), but the migrated page's parent folder name (the one directly containing `.content.xml`) must always be all-lowercase regardless of the source casing.
   Full output path: `<root>\join-us\life-at-abbvie\employee-resource-groups\.content.xml`

---

## Step 1: Read the Template Content XML

Read the resolved template `.content.xml` in full.

Key things to extract:
- Top-level `jcr:content` attributes (template, model, title pattern)
- Section node naming convention (`section_0`, `section_1` … or named nodes)
- Block node naming convention (`hero_0`, `text_0`, …)
- `sling:resourceType`, `model`, `modelFields` patterns for every block type present
- `Section Metadata` node structure (`style_customDynamicClass`, `blockModelId`)
- How `jcr:primaryType="nt:unstructured"` is applied at each level

---

## Step 2: Fetch and Analyse the Source Page

Use `WebFetch` to GET `<source page>` HTML. Parse with the AEM DOM inspection checklist (CLAUDE.md Rule 6):

1. **Identify sections** — each `.cmp-container-full-width` is typically one section boundary.
2. **For each section detect:**
   - Background color / image (→ `Section Metadata style`)
   - Container size variant (`.cmp-container-xx-large` etc.)
   - Grid columns (`.grid-row__col-with-*`) to determine EDS grid layout
3. **For each component inside sections map to an EDS block:**

| AEM class pattern | EDS block |
|---|---|
| `.container.overlap-predecessor` | `hero` |
| `.cmp-title` | inline heading (no block) |
| `.cmp-text` | `text` or inline richtext |
| `.cmp-image` | `image` |
| `.cmp-teaser` | `teaser` or `cards` variant |
| `.cmp-video--youtube` | `video` |
| `.cmp-video--brightcove` | `brightcove-video` |
| `.cmp-quote` | `quote` |
| `.cmp-accordion-*` | `accordion` |
| `.cardpagestory` | `cards` |
| `.dashboardcards` | `cards (dashboard)` |
| `.cmp-experiencefragment--*` (header/footer) | skip (auto-added by template) |

4. **Check video type per CLAUDE.md Rule 7** — detect YouTube vs Brightcove before writing any video block.
5. **Identify `og:url`** to determine the output page node name.
6. **Every image on the source page must have its `alt` text, `title`, and caption migrated** (CLAUDE.md Rule 5). AEM's core Image component typically renders each image with up to four separate metadata carriers that do NOT always agree with each other — check all of them before picking a value:
   - `data-title="X"` on the wrapping `.cmp-image` div (the authored "Title" field — usually the best, human-readable, correctly-cased text)
   - `<img ... alt="y" title="X">` — the `alt` attribute is sometimes a lowercased or otherwise mangled variant of the title (e.g. `alt="solar panel farm"` vs `title="Solar panel farm"`), and occasionally contains a typo the title doesn't have
   - `<meta itemprop="caption" content="X">` — schema.org caption metadata, normally identical to `data-title`/`title`, even when not visibly displayed on the page
   - A plain background `<img src="..." alt="y" class="cmp-container__bg-image">` (used for section/container backgrounds) — this pattern has ONLY an `alt`, no title/caption metadata at all

   Extraction rule:
   - **`imageAlt`** ← the `alt` attribute. If `alt` is empty, is clearly filename-derived (e.g. matches the asset slug verbatim, like `azita-saleki-gerhardt-headshot-square`), or is a lower-cased/typo'd variant of `data-title`/`title`, prefer the better-formed `data-title`/`title` text instead — don't propagate a worse value just because it technically came from the `alt` attribute.
   - **`caption`** (when the target block model has a `caption` field) ← `data-title` (or `title`, or `itemprop="caption"` — they're normally identical); use the same value as `imageAlt` when no separate title exists. Populate `caption` even if the source doesn't visibly display it (e.g. `displayCaptionBelowImage`/equivalent stays `false`) — it's still authored metadata worth preserving.
   - If the target block has no `caption` field at all, add the caption as a small text block immediately below the image rather than dropping it.
   - Never leave `imageAlt` empty unless the source itself marks the image decorative (`alt=""` with `role="presentation"`).
   - **If the source image has no `alt`, `data-title`/`title`, or `itemprop="caption"` at all** (all metadata carriers empty or missing — not just `alt`), derive a human-readable value from the image's filename instead of leaving it blank: take the last path segment of the asset URL/DAM path, strip the extension and any dimension/query suffix, replace hyphens/underscores with spaces, and title-case it (e.g. `two-women-in-cafe.jpg` → `Two women in cafe`). Use this derived value for **both** `imageAlt` and `caption`.
   - Do this for every image instance, including images inside cards, teasers, galleries, hero blocks, and section/container background images — not just the first/primary image.
   - **Check for images present on the source page but entirely absent from the migrated output** (not just mismatched metadata on images that already migrated) — diff the full image inventory (every `data-asset`/`data-cmp-src` on the source vs. every `image=` in the target `.content.xml`) rather than only checking images you already see a block for. Before assuming a missing image needs a fresh DAM upload, check whether its asset already has a `delivery-...` URL in `C:\dev\projects\abbvie\tools\s7-to-dm-openapi\data\asset-map-test.csv` (Step 2.7, Method A) — it may already exist in the target DAM and just need a new block referencing it.
   - **If `<source page>` is on a country domain without a corresponding EDS Dev/QA build yet (or you're reconciling an already-migrated page rather than doing a fresh migration)**, the live production equivalent to diff against is `https://www.abbvie.<country-tld>/<path>.html` (e.g. `https://www.abbvie.ie/join-us/student-programmes.html` for an `ie/en` page) — fetch that directly with curl/WebFetch rather than assuming the AEM Live dev/QA alias has the authoritative image metadata.
7. **Every Scene7 URL and every DAM PDF/document link must resolve to a DM OpenAPI (`https://delivery-...`) URL** — images and PDFs alike:
   - **Images**: any `src` / `data-cmp-src` matching `https://abbvie.scene7.com/is/image/<scene7File>`.
   - **PDFs / documents**: any link `href` matching `https://abbvie.scene7.com/is/content/<scene7File>` (or any other scene7-hosted document link, typically ending in `.pdf`), or any link that already points to an AEM DAM path (`/content/dam/...`).

   **Method A — Scene7 URL → CSV lookup:** Look up `<scene7File>` in `C:\dev\projects\abbvie\tools\s7-to-dm-openapi\data\asset-map-test.csv` (column `scene7File`) and take its `openApiUrl` (only rows where `openApiUrl` starts with `https://delivery-` are valid substitution targets).

   **Method B — DAM path → live resolver (preferred for PDFs, and for anything not in the CSV):** POST the DAM path(s) to the local resolver service:
   ```bash
   curl --location 'http://localhost:3000/api/meta/resolve-dm' \
     --header 'Content-Type: application/json' \
     --data '{
       "env": "dev",
       "values": [
         "/content/dam/abbvie-com2/pdfs/abbvie-esg-action-report.pdf"
       ]
     }'
   ```
   - Response shape: `{"resolved": [...]}` — one entry per input `values` item, in order.
   - `values` accepts one or more DAM asset paths in a single call (batch lookups are fine).
   - `env` is slugified and used to find `data/asset-map-<env>.csv` in the migration-tools folder. **Only `"dev"` has a CSV present today** (`data/asset-map-dev.csv` / `data/config-dev.json`) — other env names will 400 until their CSV is generated.
   - **The endpoint does not error on an unresolved asset** — if the path isn't found in the CSV map, it silently returns the original `/content/dam/...` path unchanged in `resolved`. To detect a failed resolution, check whether the returned value is still a `/content/dam/...` path (unresolved) vs. a `https://delivery-...` URL (resolved) — do not assume a response means success.
   - This resolver service lives in `C:\dev\projects\abbvie\tools\migration-tools` (package `aem-migration-suite`, endpoint defined in `server.js`) — start it with `npm start` (or `npm run dev` for nodemon) from that folder if the curl call fails to connect. It listens on port 3000 by default.

   Write the resolved `https://delivery-...` URL directly into the content XML — do not write a raw scene7 or `/content/dam/...` URL and rely on packaging-time substitution, since the automatic rewrite in `package-jcr.ps1` only matches the `/is/image/` (image) pattern and will NOT rewrite PDF/document links.
   - If neither method resolves an asset (CSV has no row, or the live resolver echoes the path back unchanged), do not guess or invent a `delivery-` URL — leave the original URL in place and flag it explicitly in the Step 7 report.
8. **`titleType` and the `-size` class must each be read independently from the source — they do NOT always match.** `titleType` comes from the actual `<h1>`–`<h6>` tag wrapping the source heading (semantic level). The `-size` class comes from the size token already present on the source's `custom-title` block wrapper (visual size) — e.g. `<div class="custom-title h5-size block" ...><h2 class="custom-title-heading">...</h2></div>` must become `titleType="h2"` **with** `h5-size` in `classes_customDynamicClass`, NOT `h2-size`, because the source author chose to render an `<h2>` at `h5` visual size. Only default to the tag-matching size (`h3`→`h3-size`, etc.) when the source has no explicit `-size` class of its own to copy. Never override an explicit source `-size` class with one derived from the heading tag — extract both independently and copy each verbatim. Any additional weight/style classes already found on the source (e.g. `medium-weight`) are appended alongside the `-size` class, not instead of it.
9. **Nested `<span>` style classes must all be carried into `classes_customDynamicClass`, not just the innermost one.** Source text styling is sometimes split across nested wrapper spans, e.g. `<span class="light-font"><span class="body-unica-32-reg">...</span></span>`. Collect every class from the outer span(s) down to the innermost one and combine them all — comma-separated — on the migrated block's `classes_customDynamicClass` (e.g. `classes_customDynamicClass="body-unica-32-reg,light-font"`). Do not drop the outer wrapper's class just because the innermost span is the one carrying the "primary" font-size/style token.
10. **Extract the `<title>` tag from the source page `<head>`** and use it to set both `jcr:title` and `pageTitle` on `jcr:content` — **they must be identical**:
    - Take the full `<title>` text and strip the trailing `" | AbbVie"` (or equivalent site-name suffix, e.g. `" | AbbVie India"`) — e.g. `<title>Our Principles | AbbVie</title>` → stripped value `"Our Principles"`.
    - Set **both** `jcr:title="Our Principles"` **and** `pageTitle="Our Principles"` to this same stripped value. Do not keep the `| AbbVie` suffix on `jcr:title` — the suffix is re-appended automatically by block rendering logic at display time, so baking it into either stored attribute produces a doubled `"... | AbbVie | AbbVie"` on the rendered page. If the source `<title>` has no such suffix to begin with, both fields simply equal the full `<title>` text verbatim.
    - Never fall back to the visible `<h1>`/`cmp-title` text for these two fields — always source them from the `<title>` tag, even if it differs slightly from the on-page heading.

---

## Step 3: Match Section Layout Patterns

**Never write a section/grid element from scratch.** Always find an existing example first.

### 3a. Check section-layouts.csv

Read `C:\dev\projects\abbvie\tools\content-xmls\section-layouts.csv` first.

Each row has three columns: **Prompt**, **Element**, **Content XML**.

- The **Prompt** (first column) is a compact token string describing the grid layout and blocks (e.g. `6-1-5-left-image-right-custom-title-h3-text-container-cta-bg-f1f3ff`).
- Match the source page's grid structure against these prompt tokens to find the closest existing pattern.
- When a match is found, read the corresponding **Content XML** and copy the **Element** node as the starting point — then adapt text, images, and links to the new page.

### 3b. If no CSV match — grep WIP XMLs

WIP root: `C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\`

Grep patterns to find section/grid nodes across all pages:
- Sections: `<section_`
- Grid containers: `<grid_container`
- Grid sections: `<grid_section`
- Inner grids: `<inner_grid`

Filter by `style_customDynamicClass` to narrow to the desired layout classes (e.g. `content-wide`, `no-bottom-margin`, `large-radius`).

### 3c. Key attributes to check on any section/grid node

| Attribute | Purpose |
|---|---|
| `style_customDynamicClass` | Layout + spacing classes |
| `style_gridCols` | Column widths (e.g. `cols-6-6`, `cols-4-4-4`) |
| `style_contentWidth` | `content-wide` / `content-regular` |
| `style_margin` | Margin overrides |
| `style_padding` | Padding overrides |
| `background` | Background image DAM path |
| `backgroundMimeType` | MIME type for background image |

---

## Step 4: Check Available Blocks

Before mapping any component, confirm the block exists locally:

1. Check `C:\dev\projects\abbvie\abbvie-nextgen-eds\blocks\<block-name>\` for JS/CSS.
2. If a block is needed but unfamiliar, grep the WIP folder for `aueComponentId="<block-name>"` to find a page that already uses it:
   ```
   C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\
   ```
3. Read that page's `.content.xml` to understand exact node attributes, `modelFields`, and field types for the block.
4. Never create a new block when a variant of an existing block will do (CLAUDE.md Rule 2).

---

## Step 5: Build the Content XML

### 4a. File header — copy from template XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"
          xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
          xmlns:sling="http://sling.apache.org/jcr/sling/1.0"
          jcr:primaryType="cq:Page">
  <jcr:content
      jcr:primaryType="cq:PageContent"
      jcr:title="<source page's <title> tag, with the site-name suffix stripped, per Step 2.10>"
      sling:resourceType="<same as template>"
      ...remaining attrs from template...
      pageTitle="<same stripped value as jcr:title, per Step 2.10>">
    <root jcr:primaryType="nt:unstructured"
          sling:resourceType="core/franklin/components/root/v1/root">
```

### 4b. Sections

Each visual section becomes a named child node of `<root>`:

```xml
<section_0 jcr:primaryType="nt:unstructured"
           sling:resourceType="core/franklin/components/section/v1/section">
  <!-- block nodes here -->
  <section_metadata_0 ... model="section-metadata" ...
      style_customDynamicClass="<style classes>"
      blockId="id:"/>
</section_0>
```

### 4c. Block nodes

Use exact attribute names, types, and `modelFields` from the template XML or sample XML for each block type. Key rules:
- Boolean values: `{Boolean}true` / `{Boolean}false`
- Reference fields (images): `/content/dam/<path>`
- All image paths from source `data-cmp-src` or `src` attributes
- **Every image's alt text, title, AND caption must be migrated** — per the extraction rule in Step 2.6: `imageAlt` from the `alt` attribute (falling back to `data-title`/`title` when `alt` is empty, filename-derived, or a mangled variant), `caption` from `data-title`/`title`/`itemprop="caption"` (populate it even when the source doesn't visibly display the caption). Never leave `imageAlt` empty unless the source explicitly marks the image decorative. This applies to every image on the page, including ones in cards, teasers, galleries, heroes, and section/container backgrounds — not just the first one.
- **If the source image is missing alt text AND caption entirely**, derive both `imageAlt` and `caption` from the image's filename (strip extension/dimension suffix, replace hyphens/underscores with spaces, title-case) per Step 2.6 — don't leave them empty just because the source had nothing authored.
- **Every Scene7 image `src` and Scene7 PDF/document `href` must be converted to its DM OpenAPI (`https://delivery-...`) URL** via the asset-map CSV lookup (see Step 2.7) before being written into the XML. Never leave a raw `abbvie.scene7.com` URL in the output unless it had no CSV match (in which case flag it per Step 7).
- **Every `custom-title` block's `titleType` and `-size` class must each be extracted independently from the source** (per Step 2.8): `titleType` from the heading tag itself, `-size` from the source block wrapper's own size class — they can differ (e.g. source `<div class="custom-title h5-size block"><h2>...</h2></div>` → `titleType="h2"` + `h5-size`, not `h2-size`). Only fall back to a tag-matched size class when the source has no explicit `-size` class to copy.
- **Classes split across nested `<span>` wrappers must all land in `classes_customDynamicClass`** (per Step 2.9) — e.g. `<span class="light-font"><span class="body-unica-32-reg">` becomes `classes_customDynamicClass="body-unica-32-reg,light-font"`, not just the innermost class.
- Field order must match `modelFields` sequence

### 4d. Section Metadata

Every section MUST close with a `section_metadata_N` node:
```xml
<section_metadata_0
    jcr:primaryType="nt:unstructured"
    sling:resourceType="core/franklin/components/block/v1/block"
    aueComponentId="section-metadata"
    blockId="id:"
    model="section-metadata"
    modelFields="[style_customDynamicClass@ngaem:dynamic-picklist,blockId@text]"
    name="Section Metadata"
    style_customDynamicClass="<derived classes>"/>
```

### 4e. Close the XML

```xml
    </root>
  </jcr:content>
</jcr:root>
```

---

## Step 6: Write the Output File

Write to:
```
C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\<relative-path-from-source-url>\<og-url-last-segment>\.content.xml
```

`<og-url-last-segment>` (the folder directly containing `.content.xml`) must always be lowercase, per Step 0.3 — even if the source page's URL/og:url segment has mixed case.

The PostToolUse hook in `settings.local.json` will automatically:
1. Package the XML into a ZIP
2. Upload it to AEM
3. Publish the page

---

## Step 7: Confirm

Report:
- Full output path of the written `.content.xml`
- Number of sections created
- List of blocks used per section
- Every image migrated, with its alt text, title, and caption (or explicit note if the source had none and the value was filename-derived instead, per Step 2.6), and any images found on the source page but missing from the output
- Every Scene7 URL (image or PDF) found and its resolved DM OpenAPI URL, or an explicit flag for any that had no CSV match
- Any content that could not be mapped (with reason)

---

## Reference Locations

| Resource | Path |
|---|---|
| Section layout patterns | `C:\dev\projects\abbvie\tools\content-xmls\section-layouts.csv` |
| Scene7 → DM OpenAPI asset map | `C:\dev\projects\abbvie\tools\s7-to-dm-openapi\data\asset-map-test.csv` |
| Block JS/CSS library | `C:\dev\projects\abbvie\abbvie-nextgen-eds\blocks\` |
| Sample content XMLs (WIP) | `C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\` |
| India content XML root | `C:\dev\projects\abbvie\playground\abbvie-in-wip\jcr_root\content\abbvie-nextgen-eds\corporate\abbvie-com\in\en\` |
| Temp / scratch | `C:\dev\projects\abbvie\playground\temp\` |
