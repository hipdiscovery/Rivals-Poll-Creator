param(
    [string]$Dotnet = "dotnet",
    [string]$Version = "4.0.0"
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
$project = Join-Path $repoRoot "src\RivalsPollCreator\RivalsPollCreator.csproj"
$artifactRoot = Join-Path $repoRoot "artifacts"
$publish = Join-Path $artifactRoot "publish"
$package = Join-Path $artifactRoot "Rivals-Poll-Creator-Windows.zip"

& node (Join-Path $repoRoot "tools\patch-web-bundle.mjs") (Join-Path $repoRoot "src\RivalsPollCreator\www")
if ($LASTEXITCODE -ne 0) { throw "Web bundle patch failed." }

& $Dotnet publish $project -c Release -r win-x64 --self-contained true -p:Version=$Version -p:FileVersion="$Version.0" -o $publish
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed." }

$readme = @"
Rivals Poll Creator $Version

1. Unzip the entire folder.
2. Double-click Rivals Poll Creator.exe.
3. Drop Marvel Rivals costume screenshots, check the detected names, rate, review, and export.

The app uses Windows built-in OCR first and its bundled offline OCR only as a fallback.
It is unsigned, so Windows SmartScreen may show an unrecognized-app warning.
"@
Set-Content -LiteralPath (Join-Path $publish "README.txt") -Value $readme -Encoding UTF8

if (Test-Path -LiteralPath $package) { Remove-Item -LiteralPath $package -Force }
Compress-Archive -Path @(
    (Join-Path $publish "Rivals Poll Creator.exe"),
    (Join-Path $publish "README.txt")
) -DestinationPath $package -CompressionLevel Optimal
Get-FileHash -LiteralPath $package -Algorithm SHA256
