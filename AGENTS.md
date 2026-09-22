# Rivals Poll Creator agent guide

This repository ships the Windows app and a checked-in web bundle. Read `README.md` and locate the source-of-truth in `tools/patch-web-bundle.mjs` before editing hashed bundle assets.

## GitHub is the source of truth

A local zip is not a release. Do not leave Troy with the only copy on disk.

- After every landed code change: commit and push `main`. Done means GitHub has the source, not a zip on the desktop.
- Do **not** cut a GitHub Release for each bugfix. Releases are only when the app version bumps (`RivalsPollCreator.csproj` / `build-release.ps1`, example: 4.6.1 → 4.6.2).
- On a version bump: publish GitHub Release tag `vX.Y.Z` and attach `Rivals-Poll-Creator-Windows.zip`. Source version and zip README version must match.
- Never commit the 190MB+ exe into the tree. It exceeds GitHub's 100MB file limit. Binaries go on the Release only.
- Do not turn on metered CI.

- `src/RivalsPollCreator/MainForm.cs`, `Program.cs`, `*.csproj`: Windows/.NET packaging expert; preserve WebView/desktop lifecycle, offline startup and clean ZIP exports.
- `src/RivalsPollCreator/NativeOcrService.cs`, `www/tess/**`: OCR specialist; compare title and owner evidence, distinguish default/colorway/outfit, allow manual correction, never silently manufacture names.
- `tools/patch-web-bundle.mjs`, `www/assets/*.js`, `www/assets/*.css`: image editor specialist; maintain full-costume cutouts, adjustable placement, background selection, predictable progress, portrait/cover dimensions, no clipped feet or blank export.
- `tests/RivalsPollCreator.OcrHarness/**`, `tests/fixtures/manifest.json`: regression test input breadth, invalid images, offline fallback and name collisions.

For OCR work, run the documented fixture harness using actual matching local screenshots; for web-render work, inspect exported cover and all 1080×1920 pages and confirm ZIP contents. Run `build-release.ps1` on Windows for packaging changes. Do not add remote/metered OCR or background uploads when the built-in offline pipeline can work.
