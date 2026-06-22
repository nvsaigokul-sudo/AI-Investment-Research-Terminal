# setup-node.ps1
$ErrorActionPreference = "Stop"

$nodeVersion = "v22.12.0"
$zipName = "node-$nodeVersion-win-x64.zip"
$url = "https://nodejs.org/dist/$nodeVersion/$zipName"
$destDir = Join-Path $PWD "node-bin"
$zipPath = Join-Path $destDir $zipName

Write-Host "Creating node-bin directory at $destDir..."
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

if (-not (Test-Path $zipPath)) {
    Write-Host "Downloading Node.js $nodeVersion from $url..."
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UserAgent "Mozilla/5.0"
    Write-Host "Download complete."
} else {
    Write-Host "Node.js zip already exists at $zipPath. Skipping download."
}

$extractedDirName = "node-$nodeVersion-win-x64"
$extractedPath = Join-Path $destDir $extractedDirName

if (-not (Test-Path $extractedPath)) {
    Write-Host "Extracting Node.js archive..."
    Expand-Archive -Path $zipPath -DestinationPath $destDir
    Write-Host "Extraction complete."
} else {
    Write-Host "Node.js already extracted at $extractedPath. Skipping extraction."
}

$nodeExePath = Join-Path $extractedPath "node.exe"
if (Test-Path $nodeExePath) {
    Write-Host "Node.js successfully verified at: $nodeExePath"
    $version = & $nodeExePath -v
    Write-Host "Node.js version: $version"
    $npmVersion = & $nodeExePath (Join-Path $extractedPath "node_modules\npm\bin\npm-cli.js") -v
    Write-Host "npm version: $npmVersion"
} else {
    throw "Verification failed: node.exe not found at $nodeExePath"
}
