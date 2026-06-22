# run.ps1
$nodeDir = "c:\Users\nvsai\Desktop\anti gravity\New folder\node-bin\node-v22.12.0-win-x64"
$env:PATH = "$nodeDir;" + $env:PATH
$command = $args -join " "
if ($command) {
    Invoke-Expression $command
} else {
    Write-Host "Node Path: $nodeDir"
    node -v
    npm -v
}
