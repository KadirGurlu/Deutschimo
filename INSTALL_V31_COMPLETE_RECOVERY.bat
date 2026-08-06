@echo off
setlocal EnableExtensions
chcp 65001 >nul

echo.
echo ============================================================
echo  Deutschimo V31 Complete Recovery Installer
echo ============================================================
echo.
set "SOURCE=%~dp0PATCH_ROOT"
set /p "TARGET=Deutschimo repository klasorunun tam yolunu yapistirin: "
set "TARGET=%TARGET:"=%"

if not exist "%SOURCE%\package.json" (
  echo HATA: Paket dosyalari bulunamadi. ZIP'i tamamen ayiklayin.
  pause
  exit /b 1
)

if not exist "%TARGET%\package.json" (
  echo HATA: Secilen klasorde package.json bulunamadi.
  echo Dogru Deutschimo repository klasorunu secin.
  pause
  exit /b 1
)

echo.
echo Dosyalar silinmeden repository ile birlestiriliyor...
robocopy "%SOURCE%" "%TARGET%" /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NP /XD node_modules .git .next
set "ROBO=%ERRORLEVEL%"
if %ROBO% GEQ 8 (
  echo HATA: Dosya kopyalama basarisiz. Robocopy kodu: %ROBO%
  pause
  exit /b %ROBO%
)

echo.
echo REAL_GERMANY kaynak tipi kontrol ediliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0TOOLS\ensure-real-germany-source-type.ps1" -RepositoryPath "%TARGET%"
if errorlevel 3 (
  echo HATA: Ek kaynak tipi kontrolu basarisiz.
  pause
  exit /b 1
)

echo.
echo Kritik dosyalar kontrol ediliyor...
set "MISSING=0"
for %%F in (
  "app\api\vocabulary\review\route.ts"
  "app\api\intelligence\review\route.ts"
  "app\api\intelligence\placement\route.ts"
  "app\writing-coach\page.tsx"
  "app\api\writing-coach\review\route.ts"
  "app\real-germany\page.tsx"
  "app\api\real-germany\progress\route.ts"
  "app\api\real-germany\evaluate\route.ts"
  "app\api\v1\devices\route.ts"
  "scripts\validate-v31.mjs"
  "prisma\schema.prisma"
) do (
  if not exist "%TARGET%\%%~F" (
    echo EKSIK: %%~F
    set "MISSING=1"
  )
)

if "%MISSING%"=="1" (
  echo HATA: Bir veya daha fazla kritik dosya kopyalanamadi.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Kurulum tamamlandi.
echo ============================================================
echo GitHub Desktop'ta degisiklikleri kontrol edin.
echo Commit mesaji: Apply Deutschimo V31 Complete Recovery
echo Sonra Commit to v29-staging ve Push origin yapin.
echo Eski deployment'a Redeploy basmayin.
echo.
pause
exit /b 0
