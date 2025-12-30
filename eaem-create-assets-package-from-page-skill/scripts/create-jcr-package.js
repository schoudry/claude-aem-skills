import { mkdir, access, cp, rename, readdir, readFile, writeFile, rm } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

async function updateOriginalMimeType(renditionsFolder, imageFile) {
    const contentXmlPath = path.join(renditionsFolder, 'original.dir', '.content.xml');
    const mimeType = getMimeType(imageFile);
    let xmlContent = await readFile(contentXmlPath, 'utf8');
    xmlContent = xmlContent.replace(/jcr:mimeType="[^"]*"/, `jcr:mimeType="${mimeType}"`);
    await writeFile(contentXmlPath, xmlContent, 'utf8');
}

async function createPackageTempFolder(folderName) {
    const importWorkFolder = path.join(__dirname, '..', '..', '..', 'import-work');
    const packageFolder = path.join(importWorkFolder, folderName);
    
    try {
        await access(packageFolder, constants.F_OK);
    } catch (error) {
        await mkdir(packageFolder, { recursive: true });
    }
    
    return packageFolder;
}

async function copyTemplateFiles(destinationFolder) {
    const templateSource = path.join(__dirname, '..', 'resources', 'my-site-assets');
    
    await cp(templateSource, destinationFolder, { 
        recursive: true,
        force: true 
    });
    
    return destinationFolder;
}

async function renameDamFolder(packageFolderPath, folderName) {
    const oldPath = path.join(packageFolderPath, 'jcr_root', 'content', 'dam', 'my-site');
    const newPath = path.join(packageFolderPath, 'jcr_root', 'content', 'dam', folderName);
    
    await rename(oldPath, newPath);
    
    return packageFolderPath;
}

async function updateDamFolderTitle(packageFolderPath, folderName) {
    const contentXmlPath = path.join(packageFolderPath, 'jcr_root', 'content', 'dam', folderName, '.content.xml');
    
    // Read the .content.xml file
    let xmlContent = await readFile(contentXmlPath, 'utf-8');
    
    // Replace jcr:title="My Site" with jcr:title="{folderName}"
    xmlContent = xmlContent.replace(/jcr:title="My Site"/, `jcr:title="${folderName}"`);
    
    // Write the updated content back
    await writeFile(contentXmlPath, xmlContent, 'utf-8');
    
    return packageFolderPath;
}

async function createAssetFoldersForImages(packageFolderPath, folderName) {
    const imagesSource = path.join(__dirname, '..', '..', '..', 'import-work', 'images');
    const damFolder = path.join(packageFolderPath, 'jcr_root', 'content', 'dam', folderName);
    const assetTemplatePath = path.join(damFolder, 'asset.jpg');
    
    // Read all image files from import-work/images
    const imageFiles = await readdir(imagesSource);
    
    // For each image, copy the asset.jpg folder and rename it
    for (const imageFile of imageFiles) {
        const newAssetFolderPath = path.join(damFolder, imageFile);
        
        // Copy asset.jpg folder to new image name folder
        await cp(assetTemplatePath, newAssetFolderPath, {
            recursive: true,
            force: true
        });
        
        // Copy the actual image binary to renditions folder as "original"
        const imageSourcePath = path.join(imagesSource, imageFile);
        const renditionsFolder = path.join(newAssetFolderPath, '_jcr_content', 'renditions');
        const imageDestPath = path.join(renditionsFolder, 'original');
        
        await cp(imageSourcePath, imageDestPath);
        
        // Update the jcr:mimeType in original.dir/.content.xml
        await updateOriginalMimeType(renditionsFolder, imageFile);
    }
    
    // Remove the template asset.jpg folder
    await rm(assetTemplatePath, { recursive: true, force: true });
    
    return packageFolderPath;
}

async function main() {
    const args = process.argv.slice(2);
    
    const folderName = args[0];
    
    if (!folderName) {
        console.error('❌ Error: Please provide a folder name');
        process.exit(1);
    }
    
    try {
        const packageFolderPath = await createPackageTempFolder(folderName);
        await copyTemplateFiles(packageFolderPath);
        await renameDamFolder(packageFolderPath, folderName);
        await updateDamFolderTitle(packageFolderPath, folderName);
        await createAssetFoldersForImages(packageFolderPath, folderName);
        
    } catch (error) {
        console.error(`❌ Failed to create package folder: ${error.message}`);
        process.exit(1);
    }
}

main();