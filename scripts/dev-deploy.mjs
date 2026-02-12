
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import process from 'process';

// === CONFIGURATION ===
// Your Google Drive Vault Path
// We use your confirmed path from contextual metadata
const PROD_VAULT_PLUGIN_DIR = "/Users/jayhygge/Library/CloudStorage/GoogleDrive-fandc112@gmail.com/My Drive/Jayverse/.obsidian/plugins";
const PLUGIN_ID = "wechat-publisher-obsidian"; // Must match package.json name

const TARGET_DIR = path.join(PROD_VAULT_PLUGIN_DIR, PLUGIN_ID);
const SOURCE_FILES = ['main.js', 'manifest.json', 'styles.css', 'versions.json'];

// =====================

console.log(`🚀 Deploying to: ${TARGET_DIR}`);

// 1. Build project
console.log('📦 Building project...');
try {
    execSync('npm run build', { stdio: 'inherit' });
} catch (e) {
    console.error('❌ Build failed. Aborting deployment.');
    process.exit(1);
}

// 2. Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
    console.log(`📂 Creating plugin directory: ${TARGET_DIR}`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 3. Copy files
console.log('📋 Copying files...');
for (const file of SOURCE_FILES) {
    const srcPath = path.resolve(process.cwd(), file);
    const destPath = path.join(TARGET_DIR, file);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ Copied ${file}`);
    } else {
        console.warn(`  ⚠️ Missing source file: ${file}`);
    }
}

// special handling for data.json migration (if it doesn't exist in target)
const targetDataPath = path.join(TARGET_DIR, 'data.json');
if (!fs.existsSync(targetDataPath)) {
    console.log('⚙️ First-time deployment detected.');
    
    // Check for Legacy Plugin (obsidian-wechat-converter)
    const legacyDir = path.join(PROD_VAULT_PLUGIN_DIR, 'obsidian-wechat-converter');
    const legacyDataPath = path.join(legacyDir, 'data.json');

    if (fs.existsSync(legacyDataPath)) {
        console.log('🔄 Found legacy data.json from obsidian-wechat-converter. Migrating...');
        fs.copyFileSync(legacyDataPath, targetDataPath);
        console.log('  ✅ Migrated legacy data.json to new plugin folder.');
    } else {
        console.log('  ℹ️ No legacy data found. Starting fresh.');
    }
} else {
    console.log('  ℹ️ data.json already exists in target. Leaving it untouched.');
}

console.log('✅ Deployment complete! reload Obsidian to see changes.');
