# merge-dependabot.ps1
# Requires Git + GitHub CLI (gh)
#
# for gh : winget install --id GitHub.cli
# gh auth login required.
#
# Use: npm run merge:dependabot

$ErrorActionPreference = "Stop"

Write-Host "Refreshing master..."
git checkout master
git pull origin master

Write-Host "Recreating TestPRs..."
git checkout -B TestPRs

Write-Host "Fetching open PRs..."
$prs = gh pr list --state open --json number,author,headRefName | ConvertFrom-Json

if (-not $prs) {
    Write-Host "No Dependabot PRs found."
    exit 0
}

# Filter to Dependabot PRs (e.g. author.login = 'app/dependabot', 'dependabot[bot]', etc.)
$dependabotPrs = $prs | Where-Object { $_.author.login -like "*dependabot*" }

if (-not $dependabotPrs -or $dependabotPrs.Count -eq 0) {
    Write-Host "No Dependabot PRs found."
    exit 0
}

foreach ($pr in $dependabotPrs) {
    $prNumber = $pr.number
    $author   = $pr.author.login
    $branch   = $pr.headRefName

    Write-Host "Processing PR #$prNumber by $author on branch $branch"

    Write-Host "Fetching branch $branch"
    git fetch origin $branch

    Write-Host "Merging $branch"
    git merge --no-edit "origin/$branch"
}

Write-Host "Pushing TestPRs..."
git push -u origin TestPRs --force

Write-Host "Done."
