# Experience AEM Claude AEM Skills

A collection of specialized skills for Adobe Experience Manager (AEM) development, designed to work with Claude AI in Cursor IDE.

## Overview

This repository contains reusable skills that automate common AEM development workflows. Each skill is self-contained with its own documentation, scripts, and resources.

## Available Skills

### 🎨 eaem-create-assets-package-from-page-skill

Creates AEM JCR packages containing images scraped from webpages, ready for deployment to AEM DAM.

**What it does:**
- Takes images downloaded by the scrape-webpage skill
- Creates a properly structured JCR package with full metadata
- Generates a deployable .zip file ready for AEM Package Manager

**Use cases:**
- Migrating assets from existing websites to AEM
- Bulk importing images into AEM DAM
- Creating asset packages for AEM environments

**Documentation:** [SKILL.md](./eaem-create-assets-package-from-page-skill/SKILL.md)

