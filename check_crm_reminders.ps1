# Antibiotics CRM Expiry Reminder - Windows Background / CLI Check
# Scans Antibiotics CRM database and reports any items in the 1-month reminder alert window

param (
    [int]$ThresholdDays = 30
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$jsonPath = Join-Path $scriptDir "antibiotics_crm.json"
if (-not (Test-Path $jsonPath)) {
    $jsonPath = Join-Path $scriptDir "CRM-Reminder-Web\antibiotics_crm.json"
}

if (-not (Test-Path $jsonPath)) {
    Write-Host "antibiotics_crm.json not found in $scriptDir or CRM-Reminder-Web" -ForegroundColor Red
    exit 1
}

$items = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Parse-CrmDate($raw, $val2) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
    $s = $raw.Trim()
    if ($s -match '^\d+$') {
        try {
            $serial = [double]$s
            if ($serial -gt 30000 -and $serial -lt 60000) {
                return [DateTime]::FromOADate($serial)
            }
        } catch {}
    }
    if ($val2 -match '^\d+$') {
        try {
            $serial = [double]$val2
            if ($serial -gt 30000 -and $serial -lt 60000) {
                return [DateTime]::FromOADate($serial)
            }
        } catch {}
    }
    $s = $s -replace '\s+', '.' -replace '-', '.' -replace '/', '.'
    if ($s -match '^(\d{1,2})\.(\d{1,2})\.(\d{2})$') {
        return [DateTime]::ParseExact("20" + $Matches[3] + "-" + $Matches[2].PadLeft(2,'0') + "-" + $Matches[1].PadLeft(2,'0'), "yyyy-MM-dd", $null)
    }
    if ($s -match '^(\d{1,2})\.(\d{1,2})\.(\d{4})$') {
        return [DateTime]::ParseExact($Matches[3] + "-" + $Matches[2].PadLeft(2,'0') + "-" + $Matches[1].PadLeft(2,'0'), "yyyy-MM-dd", $null)
    }
    return $null
}

$today = (Get-Date).Date
$urgentList = @()
$expiredList = @()
$upcomingList = @()
$safeCount = 0

foreach ($item in $items) {
    $expDate = Parse-CrmDate $item.rawExpiry $item.expiryValue2
    if ($expDate) {
        $days = ($expDate - $today).Days
        $remDate = $expDate.AddMonths(-1)
        
        $obj = [PSCustomObject]@{
            Code = $item.code
            Name = $item.name
            CAS = $item.casNo
            Batch = $item.batchNo
            Storage = $item.storage
            ReminderDate = $remDate.ToString("yyyy-MM-dd")
            ExpiryDate = $expDate.ToString("yyyy-MM-dd")
            DaysLeft = $days
        }

        if ($days -lt 0) {
            $expiredList += $obj
        } elseif ($days -le $ThresholdDays) {
            $urgentList += $obj
        } elseif ($days -le 60) {
            $upcomingList += $obj
        } else {
            $safeCount++
        }
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ANTIBIOTICS CRM EXPIRY REMINDER SYSTEM (1-MONTH NOTICE) " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Current Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Gray
$urgentColor = if ($urgentList.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "Total Standards Catalogued : $($items.Count)"
Write-Host "1-Month Reminder Active    : $($urgentList.Count)" -ForegroundColor $urgentColor
Write-Host "Upcoming (31 to 60 Days)   : $($upcomingList.Count)" -ForegroundColor Cyan
Write-Host "Expired Items              : $($expiredList.Count)" -ForegroundColor Red
Write-Host "Safe / Valid (> 60 Days)   : $safeCount" -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Cyan

if ($urgentList.Count -gt 0) {
    Write-Host ">>> ⚠️ ITEMS REQUIRING IMMEDIATE ATTENTION (EXPIRES IN <= 30 DAYS):" -ForegroundColor Yellow
    $urgentList | Format-Table Code, Name, ReminderDate, ExpiryDate, DaysLeft, Batch -AutoSize | Out-String | Write-Host
} else {
    Write-Host "No items currently in the 30-day reminder alert window." -ForegroundColor Green
}

if ($upcomingList.Count -gt 0) {
    Write-Host "`n>>> ⏳ UPCOMING IN NEXT MONTH (EXPIRES IN 31 TO 60 DAYS):" -ForegroundColor Magenta
    $upcomingList | Format-Table Code, Name, ReminderDate, ExpiryDate, DaysLeft, Batch -AutoSize | Out-String | Write-Host
}

# Windows Notification
if ($urgentList.Count -gt 0) {
    try {
        [reflection.assembly]::loadwithpartialname('System.Windows.Forms') | Out-Null
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Warning
        $notify.BalloonTipTitle = "Antibiotics CRM Expiry Alert ($($urgentList.Count) items)"
        $notify.BalloonTipText = "$($urgentList.Count) antibiotic reference standard(s) expire within 1 month! Check CRM reminder app."
        $notify.Visible = $true
        $notify.ShowBalloonTip(5000)
    } catch {}
}
