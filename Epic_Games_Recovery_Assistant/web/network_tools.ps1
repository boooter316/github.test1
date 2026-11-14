# Epic Recovery Assistant - local network diagnostics helper
# Supports one explicitly supplied private/loopback/link-local IP and up to 32 TCP ports.
# Also reports local VPN/proxy configuration without changing it.
[CmdletBinding()]
param(
  [switch]$ScanStatus,
  [switch]$ScanPorts,
  [string]$Target,
  [string]$Ports = "22,53,80,443,3389",
  [string]$OutputPath,
  [switch]$InstallDailyStatusCheck,
  [switch]$RemoveDailyStatusCheck
)
$ErrorActionPreference = "Stop"
$TaskName = "Epic Recovery Assistant - Daily Network Status"
$StateRoot = Join-Path $env:LOCALAPPDATA "EpicRecoveryAssistant\NetworkChecks"
if (-not $OutputPath) { $OutputPath = Join-Path $StateRoot "network-status-latest.json" }

function Test-AllowedTarget([string]$Address) {
  $parsed = $null
  if (-not [System.Net.IPAddress]::TryParse($Address, [ref]$parsed)) { throw "Target must be a literal IP address; hostnames and CIDR ranges are not accepted." }
  $bytes = $parsed.GetAddressBytes()
  if ($parsed.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
    $a,$b = $bytes[0],$bytes[1]
    $allowed = ($a -eq 10) -or ($a -eq 172 -and $b -ge 16 -and $b -le 31) -or ($a -eq 192 -and $b -eq 168) -or ($a -eq 127) -or ($a -eq 169 -and $b -eq 254)
  } else {
    $allowed = $parsed.IsIPv6LinkLocal -or $parsed.IsIPv6SiteLocal -or $parsed.Equals([System.Net.IPAddress]::IPv6Loopback) -or (($bytes[0] -band 0xFE) -eq 0xFC)
  }
  if (-not $allowed) { throw "Target must be a private, loopback, link-local, or IPv6 unique-local address. Public IP scanning is disabled." }
  return $parsed
}
function Get-ProxySummary {
  $key = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
  $settings = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
  $server = [string]$settings.ProxyServer
  if ($server -match "://[^/@]+@") { $server = $server -replace "://[^/@]+@", "://[redacted]@" }
  elseif ($server -match "^[^/;]+@") { $server = "[redacted]@" + ($server -split "@",2)[1] }
  [pscustomobject]@{
    Enabled = ([int]$settings.ProxyEnable -eq 1)
    Server = $server
    AutoConfigUrl = [bool]([string]$settings.AutoConfigURL)
  }
}
function Get-StatusReport {
  $vpnProfiles = @()
  if (Get-Command Get-VpnConnection -ErrorAction SilentlyContinue) {
    try { $vpnProfiles += @(Get-VpnConnection -ErrorAction SilentlyContinue | ForEach-Object { [pscustomobject]@{Name=$_.Name;ConnectionStatus=[string]$_.ConnectionStatus;TunnelType=[string]$_.TunnelType} }) } catch {}
    try { $vpnProfiles += @(Get-VpnConnection -AllUserConnection -ErrorAction SilentlyContinue | ForEach-Object { [pscustomobject]@{Name=$_.Name;ConnectionStatus=[string]$_.ConnectionStatus;TunnelType=[string]$_.TunnelType} }) } catch {}
  }
  $vpnAdapters = @(Get-NetAdapter -ErrorAction SilentlyContinue | Where-Object { ($_.Name + " " + $_.InterfaceDescription) -match "(?i)vpn|wireguard|tap|tunnel|tailscale|zerotier" } | ForEach-Object { [pscustomobject]@{Name=$_.Name;Status=[string]$_.Status;InterfaceDescription=$_.InterfaceDescription} })
  $winHttp = ""
  try { $winHttp = (& netsh winhttp show proxy 2>&1 | Out-String).Trim() } catch { $winHttp = "Unavailable" }
  [pscustomobject]@{
    TimestampUtc = [DateTime]::UtcNow.ToString("o")
    Mode = "Local VPN and proxy status"
    ComputerName = $env:COMPUTERNAME
    VpnProfiles = $vpnProfiles
    VpnAdapters = $vpnAdapters
    Proxy = Get-ProxySummary
    WinHttpProxy = $winHttp
    Scope = "Local configuration summary only. No credentials, proxy passwords, traffic payloads, or remote lookups are collected. No network settings are changed."
  }
}
function Write-Report($Object) {
  $full = [IO.Path]::GetFullPath($OutputPath)
  $dir = [IO.Path]::GetDirectoryName($full)
  if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $Object | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $full -Encoding UTF8
  Write-Host "Report saved: $full"
}
if ($RemoveDailyStatusCheck) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Daily local VPN/proxy status task removed (if installed)."
  exit 0
}
if ($InstallDailyStatusCheck) {
  $powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
  $scriptPath = $PSCommandPath
  $reportPath = Join-Path $StateRoot "network-status-latest.json"
  $argument = '-NoProfile -ExecutionPolicy Bypass -File "' + $scriptPath + '" -ScanStatus -OutputPath "' + $reportPath + '"'
  $action = New-ScheduledTaskAction -Execute $powerShell -Argument $argument
  $trigger = New-ScheduledTaskTrigger -Daily -At 9:15AM
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
  $principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Daily local VPN/proxy configuration snapshot; does not change networking." -Force | Out-Null
  Write-Host "Daily VPN/proxy status snapshot scheduled for 9:15 AM while this user is signed in."
  exit 0
}
if ($ScanPorts) {
  if (-not $Target) { throw "Supply one private IP using -Target." }
  $address = Test-AllowedTarget $Target
  $portList = @($Ports -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
  if ($portList.Count -lt 1 -or $portList.Count -gt 32) { throw "Choose between 1 and 32 TCP ports." }
  $numbers = @()
  foreach ($item in $portList) {
    $number = 0
    if (-not [int]::TryParse($item,[ref]$number) -or $number -lt 1 -or $number -gt 65535) { throw "Invalid TCP port: $item" }
    if ($numbers -notcontains $number) { $numbers += $number }
  }
  $results = @()
  foreach ($number in $numbers) {
    $client = New-Object System.Net.Sockets.TcpClient
    $watch = [Diagnostics.Stopwatch]::StartNew()
    $status = "closed-or-filtered"
    try {
      $async = $client.BeginConnect($address,$number,$null,$null)
      if ($async.AsyncWaitHandle.WaitOne(900,$false)) {
        $client.EndConnect($async)
        if ($client.Connected) { $status = "open" }
      } else { $status = "timeout-or-filtered" }
    } catch { $status = "closed-or-filtered" }
    finally { $watch.Stop(); $client.Close() }
    $results += [pscustomobject]@{Port=$number;Status=$status;ElapsedMs=$watch.ElapsedMilliseconds}
  }
  Write-Report ([pscustomobject]@{
    TimestampUtc=[DateTime]::UtcNow.ToString("o");Mode="Bounded TCP port check";Target=$address.IPAddressToString
    PortResults=$results;Scope="One private/loopback/link-local IP only; TCP connect checks; no exploitation, authentication, payload transfer, public targets, or address ranges."
  })
  exit 0
}
if ($ScanStatus) { Write-Report (Get-StatusReport); exit 0 }
Write-Host "Choose one action: -ScanStatus, -ScanPorts -Target <private-IP> [-Ports 22,80,443], -InstallDailyStatusCheck, or -RemoveDailyStatusCheck."
