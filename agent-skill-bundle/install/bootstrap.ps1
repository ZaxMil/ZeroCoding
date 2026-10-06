$ErrorActionPreference = "Stop"
$Repo = "ZaxMil/ZeroCoding"
$Root = if ($env:AGENT_BUNDLE_REPO_ROOT) { $env:AGENT_BUNDLE_REPO_ROOT } else { Join-Path $env:USERPROFILE ".agent-tools\ZeroCoding" }
$Bundle = Join-Path $Root "agent-skill-bundle"
$Bin = if ($env:AGENT_BUNDLE_BIN_DIR) { $env:AGENT_BUNDLE_BIN_DIR } else { Join-Path $env:USERPROFILE ".agent-tools\bin" }

foreach ($Name in @("git","gh")) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "Missing required command: $Name" }
}
$Py = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { throw "Python 3 is required." }
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not signed in. Run: gh auth login" }

if (Test-Path (Join-Path $Root ".git")) {
    $Dirty = & git -C $Root status --porcelain
    if ($Dirty) {
        Write-Warning "Existing checkout has local changes; preserving it without update: $Root"
    } else {
        & git -C $Root remote set-url origin "https://github.com/ZaxMil/ZeroCoding.git"
        & git -C $Root sparse-checkout init --cone *> $null
        & git -C $Root sparse-checkout set agent-skill-bundle
        & git -C $Root checkout main
        & git -C $Root pull --ff-only origin main
    }
} elseif (Test-Path $Root) {
    throw "Refusing to replace non-Git path: $Root"
} else {
    New-Item -ItemType Directory -Path (Split-Path $Root -Parent) -Force | Out-Null
    & gh repo clone $Repo $Root -- --filter=blob:none --no-checkout
    & git -C $Root sparse-checkout init --cone
    & git -C $Root sparse-checkout set agent-skill-bundle
    & git -C $Root checkout main
}

$Manager = Join-Path $Bundle "scripts\bundle_manager.py"
$AgentInit = Join-Path $Bundle "scripts\agent_init.py"
if (-not (Test-Path $Manager)) { throw "Bundle manager missing: $Bundle" }
New-Item -ItemType Directory -Path $Bin -Force | Out-Null

function Write-Wrapper([string]$Name,[string]$Script,[string]$Command="") {
    $Target = Join-Path $Bin "$Name.cmd"
    $Runner = if ($Py -eq "py") { "py -3" } else { "python" }
    $Cmd = if ($Command) { " " + $Command } else { "" }
    $Q = [char]34
    $Body = "@echo off" + [Environment]::NewLine + $Runner + " " + $Q + $Script + $Q + $Cmd + " %*" + [Environment]::NewLine
    Set-Content -Path $Target -Value $Body -Encoding ASCII
}
Write-Wrapper "bundle-install" $Manager "install"
Write-Wrapper "bundle-update" $Manager "update"
Write-Wrapper "bundle-status" $Manager "status"
Write-Wrapper "bundle-remove" $Manager "remove"
Write-Wrapper "agent-init" $AgentInit

$UserPath = [Environment]::GetEnvironmentVariable("Path","User")
$Parts = @()
if ($UserPath) { $Parts = $UserPath -split ";" | Where-Object { $_ } }
if ($Parts -notcontains $Bin) {
    [Environment]::SetEnvironmentVariable("Path", (($Parts + $Bin) -join ";"), "User")
}
if (($env:Path -split ";") -notcontains $Bin) { $env:Path = "$Bin;$env:Path" }

if ($Py -eq "py") { & py -3 $Manager install --repo-root $Root } else { & python $Manager install --repo-root $Root }
Write-Host "Commands installed in: $Bin"
Write-Host "Ready: run agent-init inside any project."
