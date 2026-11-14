[CmdletBinding()]
param(
  [string]$OutputPath = (Join-Path $env:TEMP "network-snapshot.json"),
  [switch]$Watch,
  [ValidateRange(1,3600)][int]$IntervalSeconds = 5,
  [ValidateRange(1,1440)][int]$DurationMinutes = 5
)
$ErrorActionPreference = "Stop"
function Get-NetworkSnapshot {
  $interfaces = @(Get-NetIPConfiguration -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{
      InterfaceAlias = $_.InterfaceAlias
      IPv4Address = @($_.IPv4Address | ForEach-Object { $_.IPAddress })
      IPv6Address = @($_.IPv6Address | ForEach-Object { $_.IPAddress })
    }
  })
  $tcp = @(Get-NetTCPConnection -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{
      LocalAddress=$_.LocalAddress; LocalPort=$_.LocalPort
      RemoteAddress=$_.RemoteAddress; RemotePort=$_.RemotePort
      State=[string]$_.State; OwningProcess=$_.OwningProcess
    }
  })
  $udp = @(Get-NetUDPEndpoint -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{ LocalAddress=$_.LocalAddress; LocalPort=$_.LocalPort; OwningProcess=$_.OwningProcess }
  })
  $adapters = @(Get-NetAdapterStatistics -ErrorAction SilentlyContinue | ForEach-Object {
    [pscustomobject]@{
      Name=$_.Name; ReceivedBytes=$_.ReceivedBytes; SentBytes=$_.SentBytes
      ReceivedUnicastPackets=$_.ReceivedUnicastPackets; SentUnicastPackets=$_.SentUnicastPackets
    }
  })
  [pscustomobject]@{
    TimestampUtc=[DateTime]::UtcNow.ToString("o")
    ComputerName=$env:COMPUTERNAME
    Interfaces=$interfaces
    TcpConnections=$tcp
    UdpEndpoints=$udp
    AdapterStatistics=$adapters
    Scope="Metadata only; no packet payloads, passwords, cookies, tokens, or message contents."
  }
}
$fullPath=[IO.Path]::GetFullPath($OutputPath)
$directory=[IO.Path]::GetDirectoryName($fullPath)
if($directory -and !(Test-Path -LiteralPath $directory)){New-Item -ItemType Directory -Path $directory -Force | Out-Null}
if($Watch){
  if(Test-Path -LiteralPath $fullPath){Remove-Item -LiteralPath $fullPath -Force}
  $stopAt=(Get-Date).AddMinutes($DurationMinutes)
  Write-Host "Writing metadata-only snapshots to $fullPath every $IntervalSeconds second(s). Press Ctrl+C to stop."
  while((Get-Date) -lt $stopAt){
    $record=Get-NetworkSnapshot
    ($record | ConvertTo-Json -Depth 6 -Compress) | Add-Content -LiteralPath $fullPath -Encoding UTF8
    Start-Sleep -Seconds $IntervalSeconds
  }
}else{
  $record=Get-NetworkSnapshot
  $record | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $fullPath -Encoding UTF8
  Write-Host "Snapshot saved to $fullPath"
}
Write-Host "Only local interface, connection, port, state, and adapter-counter metadata was collected."
