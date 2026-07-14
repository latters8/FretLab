# scripts/generate-samples.ps1

Write-Host "🥁 Генерация барабанных сэмплов..." -ForegroundColor Cyan

# Создаем директории
New-Item -ItemType Directory -Force -Path "public/samples/drums" | Out-Null

# Создаем простые WAV файлы с помощью .NET
function Create-WavFile {
    param(
        [string]$FilePath,
        [int]$Frequency,
        [double]$Duration,
        [double]$Amplitude = 0.5
    )
    
    $SampleRate = 44100
    $NumSamples = [int]($SampleRate * $Duration)
    $BytesPerSample = 2
    $DataSize = $NumSamples * $BytesPerSample
    
    # Создаем WAV заголовок
    $MemoryStream = New-Object System.IO.MemoryStream
    $Writer = New-Object System.IO.BinaryWriter($MemoryStream)
    
    # RIFF заголовок
    $Writer.Write([char[]]'RIFF')
    $Writer.Write([int]($DataSize + 36))
    $Writer.Write([char[]]'WAVE')
    
    # fmt чанк
    $Writer.Write([char[]]'fmt ')
    $Writer.Write([int]16)
    $Writer.Write([short]1)  # PCM
    $Writer.Write([short]1)  # Mono
    $Writer.Write([int]$SampleRate)
    $Writer.Write([int]($SampleRate * $BytesPerSample))
    $Writer.Write([short]($BytesPerSample))
    $Writer.Write([short]16) # Bits per sample
    
    # data чанк
    $Writer.Write([char[]]'data')
    $Writer.Write([int]$DataSize)
    
    # Генерируем аудио данные
    for ($i = 0; $i -lt $NumSamples; $i++) {
        $t = $i / $SampleRate
        # Синусоида с затуханием
        $envelope = [Math]::Exp(-$t * 3)
        $sample = [Math]::Sin(2 * [Math]::PI * $Frequency * $t) * $envelope * $Amplitude
        $sampleInt = [short][Math]::Round($sample * 32767)
        $Writer.Write($sampleInt)
    }
    
    $Writer.Flush()
    [System.IO.File]::WriteAllBytes($FilePath, $MemoryStream.ToArray())
    $Writer.Close()
    $MemoryStream.Close()
    
    Write-Host "✅ Создан $(Split-Path $FilePath -Leaf)" -ForegroundColor Green
}

# Генерируем сэмплы
Create-WavFile -FilePath "public/samples/drums/kick.wav" -Frequency 60 -Duration 0.3 -Amplitude 0.7
Create-WavFile -FilePath "public/samples/drums/snare.wav" -Frequency 200 -Duration 0.15 -Amplitude 0.6
Create-WavFile -FilePath "public/samples/drums/hihat.wav" -Frequency 8000 -Duration 0.05 -Amplitude 0.3
Create-WavFile -FilePath "public/samples/drums/crash.wav" -Frequency 1000 -Duration 0.4 -Amplitude 0.5
Create-WavFile -FilePath "public/samples/drums/ride.wav" -Frequency 400 -Duration 0.2 -Amplitude 0.5
Create-WavFile -FilePath "public/samples/drums/tom.wav" -Frequency 150 -Duration 0.2 -Amplitude 0.6

Write-Host "🎸 Все сэмплы созданы!" -ForegroundColor Green
