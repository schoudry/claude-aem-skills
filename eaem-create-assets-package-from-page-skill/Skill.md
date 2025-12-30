---
name: eaem-create-assets-package-from-page-skill
description: Depends on the scrape-webpage skill, gets the images from ./import-work/images and creates a AEM JCR Package
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

### Step 2: Create JCR Package with Images

**Provide:**
- Package Name
- Output directory: `./import-work`

**Success criteria:**
- ✅ package created with provided name containing images