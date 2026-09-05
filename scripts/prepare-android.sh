#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check-ready.mjs
npm install --no-audit --no-fund
npx expo-doctor@latest
npx expo prebuild --clean --platform android
printf '\nAndroid native project generated at: %s/android\n' "$PWD"
printf 'For a local debug APK: cd android && ./gradlew assembleDebug\n'
printf 'For EAS: npx eas-cli@latest build --platform android --profile development\n'
