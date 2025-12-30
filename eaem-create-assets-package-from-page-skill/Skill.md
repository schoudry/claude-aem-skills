---
name: eaem-create-assets-package-from-page-skill
description: Creates a AEM JCR Package with the images downloaded by scrape-webpage skill 
---

# Create Assets Package from Page Skill

Collect the images created by Scrape webpage skill and create a JCR Package 

## Prerequisites

Before using this skill, ensure:
- ✅ scrape-webpage skill is available

## Asset Package Workflow

### Step 1: Scrape Webpage

**Invoke:** scrape-webpage skill

**Provide:**
- Target URL
- Output directory: `./import-work`

**Success criteria:**
- ✅ images/ folder with all downloaded images from the URL provided

### Step 2: Confirm JCR Package is created only with Images

**Before proceeding, confirm with the user only images are copied and not for example pdfs:**

"This skill only creates a package with images, proceed?"

### Step 3: Ask for the JCR package name

**Ask user for the JCR package name, give default as 'my-site-assets':**

"What would you like the package name to be? eg. my-site-assets"

### Step 4: Install package dependencies

**Command:**
```bash
npm install --prefix ./.skills/eaem-create-assets-package-from-page-skill/scripts
```

### Step 5: Run the copy images and package creation script

**Command:**
```bash
node .skills/eaem-create-assets-package-from-page-skill/scripts/create-jcr-package.js 'my-site-assets'
```

### Step 6: Verify package created as .zip

**Success criteria:**
- ✅ package created as zip with images