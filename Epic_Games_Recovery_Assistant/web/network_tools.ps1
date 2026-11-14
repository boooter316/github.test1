# Local network tools for Windows PowerShell 5.1+.
# Defensive scope: metadata-only VPN/proxy status and limited TCP checks
# against loopback or RFC1918 private IPv4 addresses only.
[CmdletBinding()]
param(
  [switch]$Status,
  [switch]$PortCheck,
  [string]$TargetIP,
  [int[]]$Ports = @(22,53,80,443,445,3389,8080),
  [switch]$InstallDailyStatusTask,
  [switch]$RemoveDailyStatusTask,
  [string]$OutputPath = (Join-Path $env:LOCALAPPDATA 'EpicRecoveryAssistant\NetworkStatus.json')
)
$ErrorActionPreference = 'Stop'
$TaskName = 'Epic Recovery Assistant - Daily Network Status'
function Test-PrivateIPv4([string]$Address) {
  $parsed = $null
  if (-not [Net.IPAddress]::TryParse($Address, [ref]$parsed) -or $parsed.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) { return $false }
  $b = $parsed.GetAddressBytes()
  return ($b[0] -eq 10 -or $b[0] -eq 127 -or ($b[0] -eq 192 -and $b[1] -eq 168) -or ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31))
}
function Get-LocalNetworkStatus {
  $vpn = @()
  if (Get-Command Get-VpnConnection -ErrorAction SilentlyContinue) {
    try { $vpn += @(Get-VpnConnection -ErrorAction Stop | Select-Object Name,ConnectionStatus,ServerAddress,SplitTunneling) } catch {}
    try { $vpn += @(Get-VpnConnection -AllUserConnection -ErrorAction Stop | Select-Object Name,ConnectionStatus,ServerAddress,SplitTunneling) } catch {}
  }
  $adapters = @()
  if (Get-Command Get-NetAdapter -ErrorAction SilentlyContinue) {
    $adapters = @(Get-NetAdapter -ErrorAction SilentlyContinue | Select-Object Name,InterfaceDescription,Status,LinkSpeed)
  }
  $proxyPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'
  $proxy = Get-ItemProperty -Path $proxyPath -ErrorAction SilentlyContinue
  $winHttp = (& netsh winhttp show proxy 2>&1 | Out-String).Trim()
  [pscustomobject]@{
    CheckedAtUtc = [DateTime]::UtcNow.ToString('o')
    Computer = $env:COMPUTERNAME
    VpnProfiles = $vpn
    NetworkAdapters = $adapters
    UserProxyEnabled = [bool]($proxy.ProxyEnable -eq 1)
    UserProxyServer = [string]$proxy.ProxyServer
    UserProxyAutoConfigUrlPresent = [bool](-not [string]::IsNullOrWhiteSpace([string]$proxy.AutoConfigURL))
    WinHttpProxySummary = $winHttp
    Scope = 'Configuration metadata only. No traffic capture, credential access, or network upload.'
  }
}
if ($RemoveDailyStatusTask) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host 'Daily network status task removed if it existed.'
  exit 0
}
if ($InstallDailyStatusTask) {
  $scriptPath = $PSCommandPath
  if ([string]::IsNullOrWhiteSpace($scriptPath)) { throw 'Save this script to disk before installing the scheduled task.' }
  $powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
  $out = [IO.Path]::GetFullPath($OutputPath)
  $args = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $scriptPath + '" -Status -OutputPath "' + $out + '"'
  $action = New-ScheduledTaskAction -Execute $powershell -Argument $args
  $trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
  $principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Writes a local VPN/proxy and adapter configuration snapshot; does not change network settings.' -Force | Out-Null
  Write-Host "Daily status snapshot scheduled for 9:00 AM. Output: $out"
  exit 0
}
if ($PortCheck) {
  if (-not (Test-PrivateIPv4 $TargetIP)) { throw 'Blocked: target must be a loopback or RFC1918 private IPv4 address (10/8, 172.16/12, 192.168/16, 127/8).' }
  if (-not $Ports -or $Ports.Count -gt 32) { throw 'Provide between 1 and 32 explicit TCP ports.' }
  if (@($Ports | Where-Object { $_ -lt 1 -or $_ -gt 65535 }).Count -gt 0 -or @($Ports | Select-Object -Unique).Count -ne $Ports.Count) { throw 'Ports must be unique integers from 1 to 65535.' }
  foreach ($port in $Ports) {
    $client = New-Object Net.Sockets.TcpClient
    try {
      $async = $client.BeginConnect($TargetIP, $port, $null, $null)
      $ok = $async.AsyncWaitHandle.WaitOne(700, $false)
      if ($ok -and $client.Connected) { $client.EndConnect($async); $state = 'OPEN' }
      elseif ($ok) { $state = 'CLOSED_OR_REFUSED' }
      else { $state = 'NO_RESPONSE_OR_FILTERED' }
      [pscustomobject]@{ Target=$TargetIP; Port=$port; Protocol='TCP'; Result=$state }
    } catch {
      [pscustomobject]@{ Target=$TargetIP; Port=$port; Protocol='TCP'; Result='CLOSED_OR_REFUSED' }
    } finally { $client.Close() }
  }
  exit 0
}
if ($Status) {
  $snapshot = Get-LocalNetworkStatus
  $full = [IO.Path]::GetFullPath($OutputPath)
  $dir = [IO.Path]::GetDirectoryName($full)
  if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $snapshot | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $full -Encoding UTF8
  $snapshot | Format-List
  Write-Host "Status snapshot saved to $full"
  exit 0
}
Write-Host 'Choose -Status, -PortCheck -TargetIP <private IPv4> -Ports <comma-separated ports>, -InstallDailyStatusTask, or -RemoveDailyStatusTask.'
