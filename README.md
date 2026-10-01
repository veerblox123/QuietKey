# QuietKey

A small app for encrypting and decrypting private messages. It uses the browser's built-in Web Crypto API: AES-256-GCM encryption, a random 256-bit key, and a fresh random 96-bit nonce for every encryption.

## Run it

Open `index.html` in a modern browser. For Web Crypto support, use `https://` or a local server. For example, if Python is installed, run `python3 -m http.server 8000` from this folder, then open `http://localhost:8000`.

## Desktop and Android builds

GitHub Actions builds Windows (`.exe` installer), macOS (`.dmg` and `.zip`), Linux (`.AppImage` and `.deb`), and Android (`.apk`) downloads for version tags. To make a release after installing the project dependencies, create and push a version tag, for example:

```sh
git tag v1.0.1
git push origin v1.0.1
```

When the builds finish, GitHub Actions publishes a release with the installers attached. Desktop downloads are unsigned, so operating systems may show a warning before first launch. The Android download is a debug-signed APK for direct installation, not a Play Store bundle.

For local builds, install Node.js 22 or newer, then run `npm install`. Use `npm run start` for the desktop app. Build for the current OS with `npm run build:desktop`, or use `npm run build:desktop:windows`, `npm run build:desktop:linux`, or `npm run build:desktop:mac` on the corresponding operating system. Android builds need Android Studio/SDK and Java 21; on the first build, run `npm run build:web` and `npx cap add android`, then run `npm run build:android`.

## Use it

1. Write your message and choose **Encrypt message**.
2. Copy the encrypted message and secret key. The key is only shown to you; QuietKey does not store or send it.
3. Share the encrypted text and key through separate channels when possible.
4. To read it later, paste both into the **Decrypt a message** tab.

The encrypted message contains a format version, the random nonce, and authenticated ciphertext. It does not contain the secret key. If you lose the key, the message cannot be decrypted. A changed message or wrong key will fail authentication.

## Format

Encrypted values start with `QK1.` followed by base64url-encoded JSON containing the version, algorithm, nonce, and ciphertext. Keys are base64url-encoded raw AES-256 keys.

## Privacy note

Encryption and decryption run on your device. The app does not send messages or keys to a server. Don't share the key in the same place as the ciphertext if you need to keep the message private.
# QuietKey
