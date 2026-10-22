$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'manifest.json') -Raw | ConvertFrom-Json
$source = Get-Content -LiteralPath (Join-Path $projectRoot 'chatgpt-limits.user.js') -Raw
if ($source -notmatch '(?m)^// @version\s+([^\r\n]+)' -or $Matches[1].Trim() -ne $manifest.version) {
    throw 'The manifest and userscript versions must match.'
}

# Explicit allowlist keeps development files and store artwork out of the upload.
$files = @('manifest.json', 'popup.html', 'popup.css') +
    @($manifest.content_scripts.js) + @($manifest.icons.PSObject.Properties.Value)
foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $file) -PathType Leaf)) {
        throw "Missing package file: $file"
    }
}
$dist = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$zipPath = Join-Path $dist "chatgpt-limits-$($manifest.version).zip"
$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
try {
    $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $files) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, (Join-Path $projectRoot $file), $file,
                [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $archive.Dispose() }
} finally { $stream.Dispose() }
Write-Output "Created $zipPath"
