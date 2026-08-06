@echo off
setlocal EnableExtensions
chcp 65001 >nul
set /p "TARGET=Deutschimo repository klasorunun tam yolunu yapistirin: "
set "TARGET=%TARGET:"=%"
if not exist "%TARGET%\package.json" (
  echo HATA: package.json bulunamadi.
  pause
  exit /b 1
)
cd /d "%TARGET%"
for %%S in (v28.1 v28.3 v28.4 v29 v29.2 v30.1 v30.2 v31) do (
  echo.
  echo validate:%%S calistiriliyor...
  call npm run validate:%%S
  if errorlevel 1 (
    echo HATA: validate:%%S basarisiz.
    pause
    exit /b 1
  )
)
echo.
echo Tum V28.1-V31 dogrulamalari basarili.
pause
exit /b 0
