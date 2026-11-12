<#
.SYNOPSIS
  Misura RAM e CPU di NekoCalendar (app + processi WebView2) per gli obiettivi della M0.

.DESCRIPTION
  Somma la memoria di nekocalendar.exe e di tutti i processi figli (i motori WebView2
  delle finestre e dei widget), poi misura l'uso medio di CPU per alcuni secondi.
  Obiettivi del progetto con il widget fermo: CPU < 1 %, RAM < 150 MB.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\measure.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\measure.ps1 -Seconds 60
#>
param(
  [ValidateRange(5, 600)]
  [int]$Seconds = 30
)

$ErrorActionPreference = "Stop"

$root = Get-Process -Name "nekocalendar" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $root) {
  Write-Host "NekoCalendar non è in esecuzione. Avvialo (npm run tauri dev o l'app installata) e riprova." -ForegroundColor Yellow
  exit 1
}

function Get-ProcessTree([int]$ParentId) {
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ParentId"
  foreach ($child in $children) {
    $child.ProcessId
    Get-ProcessTree -ParentId $child.ProcessId
  }
}

$ids = @($root.Id) + @(Get-ProcessTree -ParentId $root.Id)
$cores = [Environment]::ProcessorCount

Write-Host "Trovati $($ids.Count) processi (app + WebView2). Misuro per $Seconds secondi: non toccare il PC..."

$before = Get-Process -Id $ids -ErrorAction SilentlyContinue
$cpuBefore = ($before | Measure-Object -Property CPU -Sum).Sum
Start-Sleep -Seconds $Seconds
$after = Get-Process -Id $ids -ErrorAction SilentlyContinue
$cpuAfter = ($after | Measure-Object -Property CPU -Sum).Sum

$cpuPercent = [math]::Round((($cpuAfter - $cpuBefore) / $Seconds / $cores) * 100, 2)
$privateMb = [math]::Round((($after | Measure-Object -Property PrivateMemorySize64 -Sum).Sum) / 1MB, 1)
$workingSetMb = [math]::Round((($after | Measure-Object -Property WorkingSet64 -Sum).Sum) / 1MB, 1)

$cpuOk = $cpuPercent -lt 1
$ramOk = $privateMb -lt 150

Write-Host ""
Write-Host "Risultati NekoCalendar ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
Write-Host ("  CPU media:            {0} %   (obiettivo < 1 %)   {1}" -f $cpuPercent, $(if ($cpuOk) { "OK" } else { "DA MIGLIORARE" }))
Write-Host ("  RAM privata totale:   {0} MB  (obiettivo < 150 MB) {1}" -f $privateMb, $(if ($ramOk) { "OK" } else { "DA MIGLIORARE" }))
Write-Host ("  Working set totale:   {0} MB  (quello mostrato da Gestione attività)" -f $workingSetMb)
Write-Host ""
Write-Host "Dettaglio per processo:"
$after | Sort-Object PrivateMemorySize64 -Descending |
  Select-Object Id, ProcessName, @{ Name = "RAM privata (MB)"; Expression = { [math]::Round($_.PrivateMemorySize64 / 1MB, 1) } } |
  Format-Table -AutoSize
