param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryPath
)

$ErrorActionPreference = "Stop"
$file = Join-Path $RepositoryPath "lib\intelligence\insight-engine.ts"
if (-not (Test-Path $file)) {
  Write-Host "Bilgi: insight-engine.ts bulunamadı; bu ek kontrol atlandı."
  exit 0
}

$text = [System.IO.File]::ReadAllText($file)
if ($text -match '"REAL_GERMANY"') {
  Write-Host "REAL_GERMANY kaynak tipi zaten mevcut."
  exit 0
}

$pattern = 'sourceType:\s*"EXERCISE"\s*\|\s*"UNIT_QUIZ"\s*\|\s*"SKILL_LAB"\s*\|\s*"PLACEMENT"\s*\|\s*"SMART_REVIEW"\s*;'
$replacement = @'
sourceType:
  | "EXERCISE"
  | "UNIT_QUIZ"
  | "SKILL_LAB"
  | "PLACEMENT"
  | "SMART_REVIEW"
  | "REAL_GERMANY";
'@

$updated = [System.Text.RegularExpressions.Regex]::Replace(
  $text,
  $pattern,
  $replacement,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

if ($updated -eq $text) {
  Write-Warning "REAL_GERMANY kaynak tipi otomatik eklenemedi. Dosyanın mevcut biçimi beklenenden farklı."
  exit 2
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($file, $updated, $utf8NoBom)
Write-Host "REAL_GERMANY kaynak tipi insight-engine.ts dosyasına eklendi."
