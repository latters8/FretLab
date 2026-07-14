# scripts/download-samples.ps1

Write-Host "🎸 Загрузка сэмплов для FretLab..." -ForegroundColor Green

# Создаем директории
New-Item -ItemType Directory -Force -Path "public/samples/drums" | Out-Null
New-Item -ItemType Directory -Force -Path "public/samples/guitar" | Out-Null

# Функция для загрузки файлов
function Download-Sample {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    if (Test-Path $OutputPath) {
        Write-Host "✅ $OutputPath уже существует" -ForegroundColor Green
        return
    }
    
    Write-Host "📥 Скачивание $OutputPath..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -ErrorAction Stop
        Write-Host "✅ $OutputPath загружен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка загрузки $OutputPath : $_" -ForegroundColor Red
    }
}

Write-Host "🥁 Загрузка барабанных сэмплов..." -ForegroundColor Cyan

# Используем бесплатные сэмплы из открытых источников
$samples = @(
    @{Url="https://www.musicradar.com/samples/samples/kick-1.wav"; Path="public/samples/drums/kick.wav"},
    @{Url="https://www.musicradar.com/samples/samples/snare-1.wav"; Path="public/samples/drums/snare.wav"},
    @{Url="https://www.musicradar.com/samples/samples/hihat-1.wav"; Path="public/samples/drums/hihat.wav"},
    @{Url="https://www.musicradar.com/samples/samples/crash-1.wav"; Path="public/samples/drums/crash.wav"},
    @{Url="https://www.musicradar.com/samples/samples/ride-1.wav"; Path="public/samples/drums/ride.wav"},
    @{Url="https://www.musicradar.com/samples/samples/tom-1.wav"; Path="public/samples/drums/tom.wav"}
)

foreach ($sample in $samples) {
    Download-Sample -Url $sample.Url -OutputPath $sample.Path
}

Write-Host "🎸 Готово! Сэмплы загружены в public/samples/" -ForegroundColor Green
