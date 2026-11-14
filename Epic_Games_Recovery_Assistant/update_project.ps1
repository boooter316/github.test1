# Downloads the latest successful main-branch project build, verifies it,
# backs up the local project, and updates source/scripts without executing them.
[CmdletBinding()]
param([switch]$Quiet)
$ErrorActionPreference = 'Stop'
$Owner = 'boooter316'
$Repository = 'github.test1'
$Workflow = 'build-windows.yml'
$ArtifactName = 'Epic-Games-Recovery-Assistant-Project'
$ArchiveName = 'Epic-Games-Recovery-Assistant-project.zip'
$ManifestName = 'SHA256SUMS.txt'
$ProjectRoot = $PSScriptRoot
$StateRoot = Join-Path $env:LOCALAPPDATA 'EpicRecoveryAssistant'
$BackupRoot = Join-Path $StateRoot 'UpdateBackups'
$WorkRoot = Join-Path $env:TEMP ('EpicRecoveryUpdate-' + [guid]::NewGuid().ToString('N'))
function Status([string]$Message) { if (-not $Quiet) { Write-Host $Message } }
try {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Install GitHub CLI from https://cli.github.com/ and run 'gh auth login' once." }
    & gh auth status *> $null
    if ($LASTEXITCODE -ne 0) { throw "Run 'gh auth login' with an account that can access this private repository." }
    if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) { throw "Project folder was not found: $ProjectRoot" }
    New-Item -ItemType Directory -Force -Path $WorkRoot, $BackupRoot | Out-Null

    Status 'Finding the latest successful build on main...'
    $runsJson = & gh run list --repo "$Owner/$Repository" --workflow $Workflow --branch main --status success --limit 20 --json databaseId,headBranch,createdAt
    if ($LASTEXITCODE -ne 0) { throw 'Could not list workflow runs. Check repository access.' }
    $runs = @($runsJson | ConvertFrom-Json)
    $run = $runs | Where-Object { $_.headBranch -eq 'main' } | Select-Object -First 1
    if (-not $run) { throw 'No successful build for main was found.' }

    Status "Downloading project package from run $($run.databaseId)..."
    & gh run download $run.databaseId --repo "$Owner/$Repository" --name $ArtifactName --dir $WorkRoot
    if ($LASTEXITCODE -ne 0) { throw 'Artifact download failed; it may have expired or repository access may be missing.' }
    $archive = Join-Path $WorkRoot $ArchiveName
    $manifest = Join-Path $WorkRoot $ManifestName
    if (-not (Test-Path -LiteralPath $archive -PathType Leaf) -or -not (Test-Path -LiteralPath $manifest -PathType Leaf)) { throw 'Project ZIP or checksum manifest is missing.' }

    $line = Get-Content -LiteralPath $manifest | Where-Object { $_ -like "*$ArchiveName*" } | Select-Object -First 1
    if (-not $line -or $line -notmatch '^([a-fA-F0-9]{64})') { throw 'Checksum manifest is invalid.' }
    $expected = $Matches[1].ToLowerInvariant()
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw 'SHA-256 verification failed. No project files were changed.' }

    $backup = Join-Path $BackupRoot ('project-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
    Status "Backing up current project to $backup ..."
    Compress-Archive -Path (Join-Path $ProjectRoot '*') -DestinationPath $backup -CompressionLevel Optimal
    $stage = Join-Path $WorkRoot 'staged'
    New-Item -ItemType Directory -Force -Path $stage | Out-Null
    Expand-Archive -LiteralPath $archive -DestinationPath $stage -Force

    $requiredFiles = @(
        'build.bat', 'setup.bat', 'run.bat', 'PDF_EVIDENCE_SCANNER.bat', 'install_auto_update.ps1', 'update_project.ps1',
        'recovery_assistant.c++', 'paf_evidence_scanner.c++', 'README.md', 'SETUP_AND_USAGE.txt',
        'OPEN_PROJECT.bat', 'FIRST_RUN_SETUP.bat', 'first_run_setup.ps1', 'setup_dependencies.ps1',
        'web\index.html', 'web\server.mjs', 'web\server.cpp', 'web\Dockerfile',
        'web\README.md', 'web\SETUP_AND_USAGE.txt', 'web\FAZE_JARVIS_SETUP.md',
        'web\TELEGRAM_FORTNITE_SETUP.md', 'web\network_security.js',
        'web\network-tools.html', 'web\network_tools.ps1', 'web\network_security_snapshot.ps1'
    )
    foreach ($name in $requiredFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $stage $name) -PathType Leaf)) { throw "Downloaded package is incomplete; missing required file: $name" }
    }

    $copyArgs = @($stage, $ProjectRoot, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:2', '/W:2', '/NFL', '/NDL', '/NP', '/XF', 'ip_history_log.csv', 'login_activity_log.csv', 'recovery_details.csv', 'local_users.db')
    & robocopy @copyArgs
    $copyCode = $LASTEXITCODE
    if ($copyCode -ge 8) {
        $restore = Join-Path $WorkRoot 'restore'
        New-Item -ItemType Directory -Force -Path $restore | Out-Null
        Expand-Archive -LiteralPath $backup -DestinationPath $restore -Force
        & robocopy $restore $ProjectRoot /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /NFL /NDL /NP /XF ip_history_log.csv login_activity_log.csv recovery_details.csv local_users.db
        $restoreCode = $LASTEXITCODE
        if ($restoreCode -ge 8) { throw "Update failed (robocopy $copyCode); automatic restore also failed (robocopy $restoreCode). Backup: $backup" }
        throw "Update copy failed (robocopy exit code $copyCode). Previous files were restored. Backup: $backup"
    }

    Status 'Project source files and scripts are updated.'
    Status "Backup retained at: $backup"
    Status 'Close and reopen the app to use the updated executable. No downloaded script or executable was run.'
    exit 0
}
catch { Write-Error $_; exit 1 }
finally {
    if (Test-Path -LiteralPath $WorkRoot) { Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue }
}
