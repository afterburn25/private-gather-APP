$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
Write-Host 'Private Gather EAS first build' -ForegroundColor Cyan
node .\scripts\check-ready.mjs
npm install --no-audit --no-fund
npx expo-doctor@latest
Write-Host 'Expo login / project initialization may prompt once.' -ForegroundColor Yellow
npx eas-cli@latest login
npx eas-cli@latest init
Write-Host 'Starting Android admin development APK build...' -ForegroundColor Cyan
npx eas-cli@latest build --platform android --profile development
Write-Host 'After Android is proven, run:' -ForegroundColor Cyan
Write-Host 'npx eas-cli@latest build --platform ios --profile development'
