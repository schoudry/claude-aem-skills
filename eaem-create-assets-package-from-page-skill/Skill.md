---
name: eaem-create-assets-package-from-page-skill
description: Creates a AEM JCR Package with the images downloaded by scrape-webpage skill 
---

# Create Assets Package from Page Skill

Collect the images created by Scrape webpage skill and create a JCR Package 

## Prerequisites

Before using this skill, ensureensure:
- ✅ scrape-webpage skill is available

## Asset Package Workflow

### Step 1: Scrape Webpage

**Invoke:** scrape-webpage skill

**Provide:**
- Target URL
- Output directory: `./import-work`

**Success criteria:**
- ✅ images/ folder with all downloaded images

---

### Step 2: Confirm JCR Package is created only with Images

**Before proceeding, confirm with the user images are copied:**

"This skill only creates a package with images, proceed?"

### Step 3: Ask for the JCR package name

**Ask user for the JCR package name, give default as my-site-assets:**

"What would you like the package name to be? eg. my-site-assets"

### Step 4: Run the copy images and package creation script

**Command:**
```bash
node .skills/eaem-create-assets-package-from-page-skill/scripts/create-jcr-package.js "my-site-assets"
```

### Step 5: Verify package created as .zip

**Success criteria:**
- ✅ package created as zip with images