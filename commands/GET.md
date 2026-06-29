Pull a page's `.content.xml` from AEM and save it to `C:\dev\projects\eaem\tools\content-xmls\<page-name>\`.

## Determine the JCR path

**If a JCR path or URL argument was provided** (e.g. `GET /content/eaem-eds/.../science/areas-of-innovation` or `GET https://eaem-in--dev-eaem-in--eaem.aem.live/science/areas-of-innovation`):
- Derive the JCR path from the argument.
- For AEM Live URLs: strip the host and prepend `/content/eaem-eds/corporate/eaem-com/in/en`.
- Page name = last path segment (e.g. `areas-of-innovation`).

**If no argument was provided**:
- Find the most recently modified `.content.xml` in the India WIP folder:
  ```
  C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content
  ```
- Derive the JCR path by stripping the WIP root prefix and `.content.xml` suffix.
- Page name = last path segment.

## Pull from AEM

Run the following PowerShell, substituting `$jcrPath` and `$pageName` with the derived values:

```powershell
$jcrPath = '<DERIVED_JCR_PATH>'
$pageName = '<LAST_PATH_SEGMENT>'
$destDir = "C:\dev\projects\eaem\tools\content-xmls\$pageName"

Write-Host "Pulling: $jcrPath"
& 'C:\dev\projects\eaem\playground\temp\pull-from-aem.ps1' -JcrPath $jcrPath

# Copy the pulled file into the content-xmls folder
$pulledFile = 'C:\dev\projects\eaem\playground\eaem-in-wip\jcr_root\content\eaem-eds\corporate\eaem-com\in\en' + ($jcrPath -replace '/content/eaem-eds/corporate/eaem-com/in/en', '' -replace '/', '\') + '\.content.xml'

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
Copy-Item -Path $pulledFile -Destination "$destDir\.content.xml" -Force
Write-Host "Saved to: $destDir\.content.xml"
```

## Copy to content xmls

After the file is saved, run:

```powershell
git -C 'C:\dev\projects\eaem\tools\content-xmls' add "$pageName\.content.xml"
```

Report the saved path and the git commit hash.
