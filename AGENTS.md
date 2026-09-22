# Rivals Poll Creator agent guide

This repository ships the Windows app and a checked-in web bundle. Read `README.md` and locate the source-of-truth in `tools/patch-web-bundle.mjs` before editing hashed bundle assets.

## GitHub is the handoff

Troy switches between ChatGPT and Grok when usage runs out. Neither model sees the other chat. **GitHub `main` is the only shared memory.**

1. Start: `git pull` (or read current `main`). Do not trust a local zip, a prior chat, or a stale checkout.
2. Work against the files on `main`.
3. Stop: commit + push `main` before you end. If you cannot push, say that in one line — do not leave the only copy in the chat or on disk.
4. Releases only when version bumps (`RivalsPollCreator.csproj` / `build-release.ps1`). Tag `vX.Y.Z`, attach `Rivals-Poll-Creator-Windows.zip`. No release per bugfix.
5. Never commit the 190MB+ exe. It exceeds GitHub's file limit. No metered CI.

- `src/RivalsPollCreator/MainForm.cs`, `Program.cs`, `*.csproj`: Windows/.NET packaging expert; preserve WebView/desktop lifecycle, offline startup and clean ZIP exports.
- `src/RivalsPollCreator/NativeOcrService.cs`, `www/tess/**`: OCR specialist; compare title and owner evidence, distinguish default/colorway/outfit, allow manual correction, never silently manufacture names.
- `tools/patch-web-bundle.mjs`, `www/assets/*.js`, `www/assets/*.css`: image editor specialist; maintain full-costume cutouts, adjustable placement, background selection, predictable progress, portrait/cover dimensions, no clipped feet or blank export.
- `tests/RivalsPollCreator.OcrHarness/**`, `tests/fixtures/manifest.json`: regression test input breadth, invalid images, offline fallback and name collisions.

For OCR work, run the documented fixture harness using actual matching local screenshots; for web-render work, inspect exported cover and all 1080×1920 pages and confirm ZIP contents. Run `build-release.ps1` on Windows for packaging changes. Do not add remote/metered OCR or background uploads when the built-in offline pipeline can work.
