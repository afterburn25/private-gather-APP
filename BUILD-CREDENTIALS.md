# Private Gather native build credentials

Do not place any real credential in the source ZIP or Git repository.

## Expo / EAS
1. Create or use an Expo account.
2. Run `npx eas-cli@latest login`.
3. Run `npx eas-cli@latest init` in this directory.
4. Copy the resulting project id to `EAS_PROJECT_ID` in the EAS environment / local `.env`.
5. For CI, create an Expo access token and store it as GitHub Actions secret `EXPO_TOKEN`.

## Android / Firebase
1. Create a Firebase Android app with package `com.privoralabs.privategather`.
2. Download `google-services.json`.
3. Local build: set `GOOGLE_SERVICES_JSON` to its full path.
4. EAS: upload it as a secret file/environment variable named `GOOGLE_SERVICES_JSON`.
5. Configure the Private Gather native push gateway with the Firebase service-account JSON through its server environment, never the mobile app.
6. Let EAS generate/manage the Android keystore for the first internal build unless you already have a permanent release keystore.

## iOS / Apple
1. Apple Developer Program membership is required for physical-device CallKit/PushKit distribution.
2. App identifier: `com.privoralabs.privategather`.
3. Enable Push Notifications and Associated Domains for the identifier.
4. Create an APNs Auth Key (`.p8`) with its Key ID and Team ID for the Private Gather native push gateway.
5. Keep the `.p8` only on the push gateway / secure secret manager.
6. Let EAS manage development/distribution certificates and provisioning profiles unless you have an existing signing process.

## Private Gather backend
Enable only for admin/test accounts first:
- Native API V1
- Native Realtime V1
- Native Updates V1

Also configure Laravel Reverb and the signed native push gateway before terminated-app call tests.
