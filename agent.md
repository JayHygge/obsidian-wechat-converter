# AI Context & Development Guidelines

This file serves as the primary context source for AI assistants (Antigravity, Claude, Gemini, etc.) working on this repository.

## 1. Project Philosophy & Interaction Rules

*   **Role**: Senior Engineer & Product Partner.
*   **Style**: High information density. Concise. No emojis (unless in user-facing UI strings).
*   **Mindset**: MVP first. Do not over-engineer.
*   **Workflow**: Discuss -> Confirm -> Plan -> Execute.
*   **Language**:
    *   **Discussion**: Chinese (Simplified).
    *   **Code/Comments/Commits**: English.

## 2. Architecture: Single Source of Truth

We rigorously enforce a **Single Source of Truth** architecture to minimize maintenance costs.

*   **Master Config**: `package.json` is the ONLY place to define:
    *   `name` (Plugin ID, e.g., `wechat-publisher-obsidian`)
    *   `version` (e.g., `2.6.0`)
    *   `description`
    *   `author`
    *   `config.displayName` (User-facing name, e.g., `WeChat Publisher`)
*   **Automated Sync**:
    *   `manifest.json` is **auto-generated/synced** from `package.json` via `scripts/sync-manifest.mjs`.
    *   **NEVER** edit `manifest.json` manually.
*   **Code Injection**:
    *   UI strings in `input.js` use `process.env.PLUGIN_NAME` and `process.env.PLUGIN_ID`.
    *   These are injected by `esbuild.config.mjs` during build.

## 3. Development Commands

*   `npm install`: Install dependencies.
*   `npm run dev`: Start dev watcher (auto-syncs manifest).
*   `npm run build`: Production build (minified).
*   `npm run release:dryrun`: **Full Validation Cycle**.
    *   Runs `build` -> `release:pack` -> `release:validate`.
    *   Use this before submitting code.
*   `npm run deploy:dev`: **Local Deployment**.
    *   Builds and copies plugin files to the local Google Drive Vault.
    *   Auto-migrates `data.json` from legacy plugin if needed.

## 4. Key Components

*   `input.js`: Main Entry. Handles UI, Commands, Lifecycle.
*   `converter.js`: Core Logic. Markdown to HTML AST transformation.
*   `scripts/release.mjs`:
    *   Node.js based packaging script.
    *   **Cross-platform**: Works on Mac/Windows/Linux.
    *   **Graceful Fallback**: If file permissions fail (EPERM), it prints a manual `zip` command.

## 5. Coding Standards

*   **No Hardcoding**: Never hardcode the plugin name or ID. Use the constants.
*   **WeChat Compatibility**:
    *   No external CSS files allowed in output HTML (inline styles only).
    *   MathJax must be converted to Images/SVG to bypass WeChat content filters.
*   **Security & Privacy**:
    *   **Input Masking**: `AppSecret` and other sensitive fields MUST use `type="password"` in Settings UI.
    *   **Data Isolation**: User secrets (AppSecret) stay in `data.json`. Do NOT implement features that upload `data.json` to any server.
*   **Testing**:
    *   Unit Tests: `npm test` (Vitest).
    *   Visual Tests: Use `TEST.md` cases in Obsidian Live Preview.

## 6. Release Checklist

1.  Update `version` in `package.json`.
2.  Run `npm run release:dryrun`.
    *   Verify `manifest.json` updated automatically.
    *   Verify `wechat-publisher-obsidian.zip` generated.
3.  Git Commit & Tag (`vX.Y.Z`).

## 7. Knowledge Base (Common Pitfalls)

*   **ESM/CJS**: This project bundles CJS for Obsidian. `esbuild` handles the conversion.
*   **Validation**: `scripts/release-validate.mjs` ensures `versions.json` maps the current plugin version to a valid Obsidian min-version.

