# Download all 12 classic arcade games from juliensimon/browser-games
# into public/browser-games/ directory

$repoUrl = "https://raw.githubusercontent.com/juliensimon/browser-games/main"
$targetDir = "public/browser-games"

$games = @(
    "computer-space",
    "pong",
    "gun-fight",
    "breakout",
    "space-invaders",
    "galaxian",
    "asteroids",
    "lunar-lander",
    "pac-man",
    "centipede",
    "missile-command",
    "defender"
)

Write-Host "=== Downloading browser games ===" -ForegroundColor Green

foreach ($game in $games) {
    Write-Host "Downloading $game..." -ForegroundColor Yellow
    
    $gameDir = Join-Path $targetDir $game
    New-Item -ItemType Directory -Force -Path $gameDir | Out-Null
    
    $files = @("index.html", "style.css", "game.js")
    
    foreach ($file in $files) {
        $url = "$repoUrl/$game/$file"
        $output = Join-Path $gameDir $file
        
        try {
            Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
            Write-Host "  ✓ $file" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Failed to download $file : $_" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== All games downloaded successfully! ===" -ForegroundColor Green
Write-Host "Location: $targetDir" -ForegroundColor Cyan

