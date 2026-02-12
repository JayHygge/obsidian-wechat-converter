import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

function syncManifest() {
  const pkgPath = path.join(ROOT, "package.json");
  const manifestPath = path.join(ROOT, "manifest.json");

  if (!fs.existsSync(pkgPath)) {
    console.error("[ERROR] package.json not found.");
    process.exit(1);
  }

  if (!fs.existsSync(manifestPath)) {
    console.error("[ERROR] manifest.json not found.");
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let changed = false;

  // Sync: version
  if (manifest.version !== pkg.version) {
    console.log(`[SYNC] Updating version: ${manifest.version} -> ${pkg.version}`);
    manifest.version = pkg.version;
    changed = true;
  }

  // Sync: description
  if (manifest.description !== pkg.description) {
    console.log(`[SYNC] Updating description: ${manifest.description} -> ${pkg.description}`);
    manifest.description = pkg.description;
    changed = true;
  }

  // Sync: author
  if (manifest.author !== pkg.author) {
    console.log(`[SYNC] Updating author: ${manifest.author} -> ${pkg.author}`);
    manifest.author = pkg.author;
    changed = true;
  }
  
  // Sync: authorUrl
  const repoUrl = (pkg.repository && pkg.repository.url) 
    ? pkg.repository.url.replace('git+', '').replace('.git', '') 
    : '';
    
  if (repoUrl && manifest.authorUrl !== repoUrl) {
     console.log(`[SYNC] Updating authorUrl: ${manifest.authorUrl} -> ${repoUrl}`);
     manifest.authorUrl = repoUrl;
     changed = true;
  }

  // Sync: id (from package.name)
  if (manifest.id !== pkg.name) {
     console.log(`[SYNC] Updating id: ${manifest.id} -> ${pkg.name}`);
     manifest.id = pkg.name;
     changed = true;
  }
  
  // Sync: name (from config.displayName)
  if (pkg.config && pkg.config.displayName && manifest.name !== pkg.config.displayName) {
      console.log(`[SYNC] Updating name (display): ${manifest.name} -> ${pkg.config.displayName}`);
      manifest.name = pkg.config.displayName;
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log("✅ manifest.json synced with package.json");
  } else {
    console.log("no changes needed in manifest.json");
  }
}

syncManifest();
