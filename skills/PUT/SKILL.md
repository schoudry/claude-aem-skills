# PUT — Package, Install & Publish a Page to AEM

> Invoked by: **`PUT <page-url>`**
>
> Finds the `.content.xml` for the given India AEM Live page, packages it into
> a JCR ZIP, uploads it to AEM Dev, waits for installation, then publishes the page.

---

## Arguments

| Placeholder | Meaning | Example |
|---|---|---|
| `<page-url>` | AEM Live URL of the page to publish | `https://eaem-in--dev-eaem-in--eaem.aem.live/who-we-are/our-principles` |

---

## Step 1: Derive the Content XML Path

Strip the base URL to get the JCR-relative path:

1. Remove `https://eaem-in--dev-eaem-in--eaem.aem.live` from the URL.
2. Replace forward slashes with backslashes.
3. Prepend the India WIP root:
   ```
   C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en
   ```
4. Append `\.content.xml`.

**Example:**
- URL: `https://eaem-in--dev-eaem-in--eaem.aem.live/who-we-are/our-principles`
- Path: `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en\who-we-are\our-principles\.content.xml`

**Verify the file exists.** If it does not, report the expected path and stop — do not proceed.

---

## Step 2: Package

Run the packaging script with the derived file path:

```powershell
& 'C:\dev\projects\eaem\playground\temp\package-jcr.ps1' -FilePath '<derived-path>'
```

Confirm the output contains `Packaged:` followed by the ZIP path. If the script errors, report the error and stop.

---

## Step 3: Upload & Install

Run the upload script (auto-detects the most-recently created ZIP):

```powershell
& 'C:\dev\projects\eaem\playground\temp\upload-to-aem.ps1'
```

Wait for `OK:` in the response. If the HTTP status is not 200, or the AEM status code is not 200, report the error and stop.

---

## Step 4: Wait

Allow AEM time to process the package installation:

```powershell
Start-Sleep -Seconds 10
```

---

## Step 5: Publish

Activate the page on AEM:

```powershell
& 'C:\dev\projects\eaem\playground\temp\publish-aem-page.ps1' -FilePath '<derived-path>'
```

Confirm the output contains `Published OK`. If it fails, report the error.

---

## Step 6: Report

Confirm all steps completed successfully:

- **File:** full path of the `.content.xml` used
- **ZIP:** full path of the package created
- **Upload:** HTTP status and AEM result
- **Publish:** HTTP status and result

---

## Error Handling

| Condition | Action |
|---|---|
| `.content.xml` not found at derived path | Stop immediately; show the expected path |
| Package script fails | Stop; show error output |
| Upload returns non-200 | Stop; show HTTP status and AEM error message |
| Publish returns non-200 | Warn but continue; show the error |

---

## Reference

| Script | Purpose |
|---|---|
| `C:\dev\projects\eaem\playground\temp\package-jcr.ps1` | Builds the JCR ZIP from a `.content.xml` |
| `C:\dev\projects\eaem\playground\temp\upload-to-aem.ps1` | Uploads + installs the latest ZIP to AEM Dev |
| `C:\dev\projects\eaem\playground\temp\publish-aem-page.ps1` | Activates (publishes) a JCR path on AEM |
| India WIP root | `C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en` |
