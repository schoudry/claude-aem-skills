# Migrate Page — Skill Reference

> Invoked by: **"migrate page `<source page>` using `<template page>`"**
>
> Migrates a live eaem page (`<source page>`) into a JCR `.content.xml` by
> using an existing migrated page (`<template page>`) as a structural reference.

---

## Inputs

| Placeholder | Meaning | Example |
|---|---|---|
| `<source page>` | Live page URL to migrate | `https://www.eaem.in/join-us/life-at-eaem/employee-resource-groups.html` |
| `<template page>` | Already-migrated AEM Live URL used as structure reference | `https://eaem-in--dev-eaem-in--eaem.aem.live/who-we-are/our-principles` |

---

## Step 0: Resolve Paths

1. **Template content XML root:**
   ```
   C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\
   ```
   Derive the relative path from the `<template page>` URL path (e.g. `/who-we-are/our-principles` → `who-we-are\our-principles`).
   Full template XML: `<root>\who-we-are\our-principles\.content.xml`

2. **Output root (same base):**
   ```
   C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\
   ```

3. **Output page node name:** fetch `<source page>` HTML and read:
   ```html
   <meta property="og:url" content="https://www.eaem.in/join-us/life-at-eaem/employee-resource-groups.html">
   ```
   Extract the last path segment: `employee-resource-groups`.
   Full output path: `<root>\join-us\life-at-eaem\employee-resource-groups\.content.xml`

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

---

## Step 3: Match Section Layout Patterns

**Never write a section/grid element from scratch.** Always find an existing example first.

### 3a. Check section-layouts.csv

Read `C:\dev\projects\eaem\tools\content-xmls\section-layouts.csv` first.

Each row has three columns: **Prompt**, **Element**, **Content XML**.

- The **Prompt** (first column) is a compact token string describing the grid layout and blocks (e.g. `6-1-5-left-image-right-custom-title-h3-text-container-cta-bg-f1f3ff`).
- Match the source page's grid structure against these prompt tokens to find the closest existing pattern.
- When a match is found, read the corresponding **Content XML** and copy the **Element** node as the starting point — then adapt text, images, and links to the new page.

### 3b. If no CSV match — grep WIP XMLs

WIP root: `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\`

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

1. Check `C:\dev\projects\eaem\eaem-eds\blocks\<block-name>\` for JS/CSS.
2. If a block is needed but unfamiliar, grep the WIP folder for `aueComponentId="<block-name>"` to find a page that already uses it:
   ```
   C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\
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
      jcr:title="<page title from source>"
      sling:resourceType="<same as template>"
      ...remaining attrs from template...>
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
- All alt text extracted from source `alt` attributes (never empty unless decorative)
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
C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\<relative-path-from-source-url>\<og-url-last-segment>\.content.xml
```

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
- Any content that could not be mapped (with reason)

---

## Reference Locations

| Resource | Path |
|---|---|
| Section layout patterns | `C:\dev\projects\eaem\tools\content-xmls\section-layouts.csv` |
| Block JS/CSS library | `C:\dev\projects\eaem\eaem-eds\blocks\` |
| Sample content XMLs (WIP) | `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\` |
| India content XML root | `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\` |
| Temp / scratch | `C:\dev\projects\eaem\playground\temp\` |
