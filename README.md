# BharatSpace — Android wrapper

A native Android app for the BharatSpace web app in `../bharatspace`, built
with [Capacitor](https://capacitorjs.com). Deliberately kept in this
separate folder rather than inside `../bharatspace` — this is a thin
native shell around the same web build, not a second copy of the app.

## What's already done here

- Capacitor installed and configured (`capacitor.config.json`)
- The native `android/` Gradle project scaffolded (`npx cap add android`)
- App icon + adaptive icon (all densities) + splash screen (light/dark,
  portrait/landscape) generated from the app's own logo — see
  `assets/` for the sources and `android/app/src/main/res/` for every
  generated size
- `INTERNET` permission present in `AndroidManifest.xml` (Capacitor adds
  this by default — confirmed, not assumed)
- The web app's production build copied into `www/` and synced into the
  native project

## App icon

The launcher icon is now the BharatSpace logo (previously the default
Capacitor/Android placeholder). It's a proper adaptive icon, not just a
flattened image dropped into the legacy slot:

- `ic_launcher_background.png` — a full-bleed orange→magenta→purple
  gradient sampled from the logo, so it fills the whole icon canvas no
  matter what shape the launcher masks it into (circle, squircle,
  teardrop, etc.)
- `ic_launcher_foreground.png` — just the white glyph, scaled to sit
  inside Android's safe zone so its tips don't get clipped by a tight
  circular mask
- `ic_launcher.png` / `ic_launcher_round.png` — the flattened logo
  (used pre-Android 8, where adaptive icons don't apply)

All four are generated at every density (ldpi through xxxhdpi). The
source files this was built from live in `assets/icon.png`,
`assets/icon-foreground.png`, and `assets/icon-background.png` — if you
ever run `npx @capacitor/assets generate --android` again, it'll
regenerate from those.

## The one thing that needs your machine

Compiling the actual `.apk` requires downloading Gradle itself and the
Android Gradle Plugin from Google's servers
(`services.gradle.org`, Google's Maven repository). The sandboxed
environment this project was built in only has network access to a
handful of package registries (npm, PyPI, crates.io, GitHub, Ubuntu's own
package mirrors) — **not** Android's build infrastructure. I tried this
directly rather than guessing:

```
$ ./gradlew assembleDebug
Downloading https://services.gradle.org/distributions/gradle-8.2.1-all.zip
Exception in thread "main" java.io.IOException: Server returned HTTP response code: 403
```

That 403 is the sandbox's own network policy blocking the request, not a
bug in this project. On your machine, with normal internet access, this
step takes a few minutes and produces a real, installable APK. You need:

- **Android Studio** (free, includes the Android SDK) — https://developer.android.com/studio
- That's genuinely the only prerequisite; Android Studio bundles Gradle,
  the SDK, and everything else this project needs.

## Building the APK

**Option A — Android Studio (recommended, especially the first time):**

1. Open Android Studio → **Open** → select this folder's `android/`
   subfolder (not the `bharatspace-android` folder itself).
2. Let it finish an initial Gradle sync (this is the step that downloads
   Gradle/AGP/AndroidX — needs your machine's normal internet, takes a
   few minutes the first time).
3. Plug in your Android phone (with USB debugging enabled — Settings →
   About Phone → tap "Build number" 7 times to unlock Developer Options,
   then Settings → Developer Options → USB debugging), or use the AVD
   emulator.
4. Click the green **Run** button. It builds, installs, and launches on
   your device automatically.

**Option B — command line, once Android Studio's SDK is installed:**

```bash
cd bharatspace-android/android
./gradlew assembleDebug
```

The debug APK lands at
`android/app/build/outputs/apk/debug/app-debug.apk` — copy it to your
phone (or `adb install app-debug.apk` with the phone connected) to
sideload it directly, no Play Store needed.

**Option C — GitHub Actions (no local install at all):**

This repo includes `.github/workflows/build-apk.yml`, which builds the
debug APK on GitHub's own runners — those have normal internet access to
Google's Maven repo and Gradle's servers, so the 403 above doesn't apply
there.

1. Push this folder to a new GitHub repo (public or private both work).
2. It builds automatically on every push to `main`, or trigger it by
   hand: repo → **Actions** tab → **Build Android APK** → **Run workflow**.
3. When the run finishes (a few minutes), open it and download the
   **bharatspace-debug-apk** artifact — that's a zip containing
   `app-debug.apk`. Unzip it, then sideload as in Option B.

## Before you build: point it at your real backend

**This matters — read it before your first build.** The bundled web
assets in `www/` right now are a **mock-mode** build (no
`VITE_API_BASE_URL` set), so the app opens and the entire UI works, but
nothing persists to a real backend — this was a deliberate choice so the
very first APK you build is guaranteed to actually run, rather than
shipping something pointed at a placeholder URL I can't verify from here.

To connect it to your real deployed Worker:

1. In `../bharatspace`, create `.env.production`:
   ```
   VITE_API_BASE_URL=https://YOUR-WORKER.workers.dev/v1
   VITE_TURNSTILE_SITE_KEY=...   # optional, if you set up Turnstile
   ```
2. Rebuild and re-sync:
   ```bash
   cd ../bharatspace && npm run build
   cd ../bharatspace-android && npm run sync
   ```
3. **Add the app's origin to your backend's CORS allowlist.** Capacitor's
   Android WebView serves the bundled app from `https://localhost`
   (`capacitor.config.json`'s `androidScheme: "https"`) — this is fixed
   regardless of what device it runs on. In
   `../bharatspace/backend/wrangler.toml`:
   ```toml
   ALLOWED_ORIGINS = "https://YOUR-FRONTEND.pages.dev,https://localhost"
   ```
   then `npx wrangler deploy` from `../bharatspace/backend`. Without this,
   every API call from the Android app will fail with a CORS error even
   though the URL itself is correct — this is the single most common
   thing to forget when wrapping a web app this way.
4. Rebuild the APK (Option A or B above).

Repeat step 2 (`npm run sync`) any time you change the web app and want
the Android build to pick it up — `www/` is a build output, not something
to hand-edit.

## Signing a release build (needed before any real distribution)

A debug APK (above) is fine for sideloading onto your own device to test.
For a release build — including uploading to Play Console later, even as
an internal test track — you need a signing key:

```bash
keytool -genkey -v -keystore bharatspace-release.keystore \
  -alias bharatspace -keyalg RSA -keysize 2048 -validity 10000
```

Keep that `.keystore` file and its passwords somewhere safe and **outside
this repo** (already gitignored) — losing it means you can never publish
an update to the same app listing again; Google cannot recover it for you.
Android Studio's **Build → Generate Signed Bundle / APK** wizard will
walk you through pointing at this keystore and producing a signed
`.aab` (Play Store's required format) or `.apk`.

## App identity

- Package name: `com.bharatspace.app` (set in `capacitor.config.json`) —
  this is permanent once you publish; changing it later means a new,
  separate Play Store listing. Change it now in `capacitor.config.json`
  and re-run `npx cap sync android` if you want something else before
  your first real build.
- Version: managed in `android/app/build.gradle`'s `versionCode`/
  `versionName` — bump both for every release you'd upload to Play
  Console.

## Play Store readiness

This folder produces the installable app itself. Everything else Play
Console asks for before publishing (privacy policy, data safety
declarations, account deletion, content moderation, store listing copy)
is covered in `../bharatspace/docs/PLAY_STORE_CHECKLIST.md` — worth
reading even if you're only sideloading today, since a couple of the
items (like account deletion) are real features, not just paperwork.
