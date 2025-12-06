# Android Build Instructions

## Development

1. Build: `npm run build:android`
2. Open Android Studio: `npx cap open android`
3. Run on emulator or connected device

## Production Build

1. In Android Studio: Build → Generate Signed Bundle/APK
2. Choose Android App Bundle (.aab) for Play Store
3. Create keystore (first time) or use existing
4. Build release bundle

## Play Store Submission

1. Go to play.google.com/console
2. Create app → Enter details
3. Upload .aab file
4. Complete store listing
5. Submit for review

## App Signing

Store your keystore safely:
- keystore.jks
- keystore password
- key alias
- key password

NEVER commit these to git.
