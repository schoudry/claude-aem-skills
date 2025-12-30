import { mkdir, access, cp, rename } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPackageTempFolder(folderName) {
    try {
        await access(folderName, constants.F_OK);
    } catch (error) {
        await mkdir(folderName, { recursive: true });
    }
    
    return folderName;
}

async function copyTemplateFiles(destinationFolder) {
    const templateSource = path.join(__dirname, '..', 'resources', 'my-site-assets');
    
    await cp(templateSource, destinationFolder, { 
        recursive: true,
        force: true 
    });
    
    return destinationFolder;
}

async function renameDamFolder(packageFolderName) {
    const oldPath = path.join(packageFolderName, 'jcr_root', 'content', 'dam', 'my-site');
    const newPath = path.join(packageFolderName, 'jcr_root', 'content', 'dam', packageFolderName);
    
    await rename(oldPath, newPath);
    
    return packageFolderName;
}

async function main() {
    const args = process.argv.slice(2);
    
    const folderName = args[0];
    
    if (!folderName) {
        console.error('❌ Error: Please provide a folder name');
        process.exit(1);
    }
    
    try {
        const packageFolderName = await createPackageTempFolder(folderName);
        await copyTemplateFiles(packageFolderName);
        await renameDamFolder(packageFolderName);
        
    } catch (error) {
        console.error(`❌ Failed to create package folder: ${error.message}`);
        process.exit(1);
    }
}

main();