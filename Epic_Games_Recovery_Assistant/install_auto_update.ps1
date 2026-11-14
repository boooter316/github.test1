# Enables or removes a daily Windows task for the project updater.
[CmdletBinding()]
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$TaskName = 'Epic Recovery Assistant - Daily Project Update'
$Updater = Join-Path $PSScriptRoot 'update_project.ps1'
if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host 'Daily update task removed.'
  exit 0
}
if (!(Test-Path $Updater)) { throw 'update_project.ps1 was not found in this folder.' }
if (!(Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI from https://cli.github.com/ first.' }
& gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Run 'gh auth login' before enabling automatic updates." }
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$Updater`" -Quiet"
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Downloads checksum-verified project updates from authenticated GitHub main builds; does not run downloaded scripts.' -Force | Out-Null
Write-Host 'Daily update check enabled for 9:00 AM when this Windows user is logged in.'
Write-Host "To remove: powershell -ExecutionPolicy Bypass -File `"$PSScriptRoot\install_auto_update.ps1`" -Remove"
