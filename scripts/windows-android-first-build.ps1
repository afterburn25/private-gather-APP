$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
Write-Host 'Private Gather Android first-build gate' -ForegroundColor Cyan
node .\scripts\check-ready.mjs
if (-not (Test-Path .env)) { Copy-Item .env.build.example .env; Write-Host 'Created .env from .env.build.example; edit it before production builds.' -ForegroundColor Yellow }
npm.cmd install --no-audit --no-fund
npx.cmd expo-doctor@latest
npx.cmd expo prebuild --clean --platform android
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
  throw 'Android SDK not found. Install Android Studio/SDK or use EAS cloud build: npx eas-cli@latest build --platform android --profile development'
}
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
$apk = Get-ChildItem -Path .\android\app\build\outputs\apk -Filter *.apk -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($apk) { Write-Host "APK: $($apk.FullName)" -ForegroundColor Green } else { throw 'Gradle completed but APK was not found.' }
