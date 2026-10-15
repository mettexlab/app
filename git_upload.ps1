param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string]$Message
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       🚀 Git Upload Automation        " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Check if inside a git repository, initialize if not
if (-not (Test-Path ".git")) {
    Write-Host "Git repository not found in current folder. Initializing with 'git init'..." -ForegroundColor Yellow
    git init
    Write-Host ""
}

# Prompt for commit message if omitted
if ([string]::IsNullOrWhiteSpace($Message)) {
    $defaultMsg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $inputMsg = Read-Host "Enter commit message (Press Enter for '$defaultMsg')"
    if ([string]::IsNullOrWhiteSpace($inputMsg)) {
        $Message = $defaultMsg
    } else {
        $Message = $inputMsg
    }
}

# Command 1: git status
Write-Host "`n[1/5] Running: git status" -ForegroundColor Cyan
git status

# Command 2: git add .
Write-Host "`n[2/5] Running: git add ." -ForegroundColor Cyan
git add .
Write-Host "All files staged." -ForegroundColor Green

# Command 3: git commit -m "$Message"
Write-Host "`n[3/5] Running: git commit -m `"$Message`"" -ForegroundColor Cyan
git commit -m "$Message"

# Command 4: git branch -M main
Write-Host "`n[4/5] Running: git branch -M main" -ForegroundColor Cyan
git branch -M main

# Command 5: git push -u origin main
Write-Host "`n[5/5] Running: git push -u origin main" -ForegroundColor Cyan
$remotes = git remote
if (-not $remotes) {
    Write-Host "`n⚠️ Warning: No remote repository (origin) is configured yet!" -ForegroundColor Yellow
    Write-Host "To link your GitHub or GitLab repository, run:" -ForegroundColor White
    Write-Host "  git remote add origin https://github.com/<your-username>/<repo-name>.git" -ForegroundColor Green
    Write-Host "Then re-run 'git_upload' to push your code.`n" -ForegroundColor Gray
} else {
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to remote repository!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Push failed. If the remote has new commits, run 'git pull --rebase origin main' first." -ForegroundColor Yellow
    }
}

Write-Host "========================================`n" -ForegroundColor Cyan
