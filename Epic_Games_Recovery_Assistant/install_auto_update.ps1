# Installs or removes the daily Windows task for checksum-verified project updates.
[CmdletBinding()]
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$TaskName = 'Epic Recovery Assistant - Daily Project Update'
$Updater = Join-Path $PSScriptRoot 'update_project.ps1'
if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host 'Daily update task removed (if it was installed).'
    exit 0
}
if (-not (Test-Path -LiteralPath $Updater -PathType Leaf)) { throw "update_project.ps1 was not found: $Updater" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Install GitHub CLI from https://cli.github.com/ and run 'gh auth login' first." }
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not authenticated. Run 'gh auth login' with access to boooter316/github.test1." }
$PowerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$Arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $Updater + '" -Quiet'
$Action = New-ScheduledTaskAction -Execute $PowerShell -Argument $Arguments
$Trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20)
$CurrentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description 'Downloads checksum-verified project updates from authenticated GitHub main builds; does not execute downloaded code.' -Force | Out-Null
Write-Host 'Daily project update check enabled for 9:00 AM while this Windows user is signed in.'
Write-Host 'To remove it, run .\install_auto_update.ps1 -Remove from this folder.'
