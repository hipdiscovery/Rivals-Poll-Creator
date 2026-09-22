# Rivals Poll Creator

Windows desktop app for turning Marvel Rivals costume screenshots into portrait rating pages and a lineup cover.

Current packaged build: **4.6.1**.

## Download

Download **Rivals-Poll-Creator-Windows.zip** from [Releases](https://github.com/hipdiscovery/Rivals-Poll-Creator/releases).

Latest GitHub-attached binary is still **v4.5.0**. The 4.6.1 Windows zip is the newer local package; attach it to a `v4.6.1` release to replace that.

Unzip the whole folder and double-click `Rivals Poll Creator.exe`.

## Workflow

1. Drop Battle Pass, Shop, Customize, Inspect, or Hero Profile screenshots.
2. Windows built-in OCR reads the visible costume title and owner. Bundled Tesseract is an offline fallback.
3. Confirm the character, outfit, rating, and optional cover-background status.
4. Review and export the cover plus 1080×1920 rating pages as a ZIP.

Known outfits are matched to the built-in catalog for exact spelling. A future outfit that is not in the catalog is still read from the visible title and `COSTUME:` owner line, then offered for confirmation.

## Build

Prerequisites: Windows 10/11, Node.js, and the .NET 8 SDK.

```powershell
.\build-release.ps1
```

The build is self-contained and unsigned. The shipped application does not start PowerShell or a local HTTP server.

## OCR regression test

```powershell
dotnet run --project .\tests\RivalsPollCreator.OcrHarness -- .\tests\fixtures\manifest.json "C:\path\to\Screenshots"
```
