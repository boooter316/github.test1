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
  & gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Run 'gh auth login' with an account that can access this private repository." }
  New-Item -ItemType Directory -Force -Path $WorkRoot, $BackupRoot | Out-Null
  Status 'Finding latest successful build on main...'
  $runsJson = & gh run list --repo "$Owner/$Repository" --workflow $Workflow --branch main --status success --limit 10 --json databaseId,headBranch,createdAt
  if ($LASTEXITCODE -ne 0) { throw 'Could not list workflow runs. Check repository access.' }
  $runs = @($runsJson | ConvertFrom-Json)
  $run = $runs | Where-Object { $_.headBranch -eq 'main' } | Select-Object -First 1
  if (-not $run) { throw 'No successful build for main was found.' }
  Status "Downloading project package from run $($run.databaseId)..."
  & gh run download $run.databaseId --repo "$Owner/$Repository" --name $ArtifactName --dir $WorkRoot
  if ($LASTEXITCODE -ne 0) { throw 'Artifact download failed; it may have expired or repository access may be missing.' }
  $archive = Join-Path $WorkRoot $ArchiveName
  $manifest = Join-Path $WorkRoot $ManifestName
  if (!(Test-Path $archive) -or !(Test-Path $manifest)) { throw 'Project ZIP or checksum manifest is missing.' }
  $line = Get-Content $manifest | Where-Object { $_ -match [regex]::Escape($ArchiveName) } | Select-Object -First 1
  if (!$line -or $line -notmatch '^([a-fA-F0-9]{64})\s+') { throw 'Checksum manifest is invalid.' }
  $expected = $Matches[1].ToLowerInvariant()
  $actual = (Get-FileHash -Algorithm SHA256 $archive).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw 'SHA-256 verification failed. No project files were changed.' }
  $backup = Join-Path $BackupRoot ('project-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
  Status "Backing up current project to $backup ..."
  Compress-Archive -Path (Join-Path $ProjectRoot '*') -DestinationPath $backup -CompressionLevel Optimal
  $stage = Join-Path $WorkRoot 'staged'
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  Expand-Archive -LiteralPath $archive -DestinationPath $stage -Force
  $copyArgs = @($stage, $ProjectRoot, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:2', '/W:2', '/NFL', '/NDL', '/NP', '/XF', 'ip_history_log.csv', 'login_activity_log.csv', 'recovery_details.csv', 'local_users.db')
  & robocopy @copyArgs
  $copyCode = $LASTEXITCODE
  if ($copyCode -ge 8) { throw "Project copy failed (robocopy exit code $copyCode). Backup: $backup" }
  Status 'Project source files and scripts are updated.'
  Status "Backup retained at: $backup"
  Status 'Close and reopen the app to use the newly built executable. No downloaded script or executable was run.'
  exit 0
} catch { Write-Error $_; exit 1 }
finally { if (Test-Path $WorkRoot) { Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue } }
