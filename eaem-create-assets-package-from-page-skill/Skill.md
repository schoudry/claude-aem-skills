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

### Step 2: Confirm JCR Package is created only with .jpg Images

**Before proceeding, confirm with the user only jpg images are copied:**

"This skill only creates a package with .jpg images, proceed?"

"If user says no, stop the package creation"

### Step 3: Ask for the JCR package name

**Ask user for the JCR package name, give default as my-site:**

"What would you like the package name to be? eg. my-site"

### Step 4: Copy the .jpg Images

1. Copy the structure `my-site-assets` from `resources` to a **Output directory** folder eg. `./import-work/my-site-assets`

2. Create a folder with image name **Output directory/my-site-assets** eg. `import-work/my-site-assets\jcr_root\content\dam\my-site` 

### Step 5: Zip the folder **Output directory/my-site-assets** eg. `import-work/my-site-assets`

**Success criteria:**
- ✅ package created with provided name