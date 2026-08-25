import Link from "next/link"
import { readFileSync, statSync } from "fs"
import path from "path"
import { RELEASES } from "@/data/releases"

function loadBuildInfo() {
  try {
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), "android/deriva-twa/twa-manifest.json"), "utf8")) as { appVersionName?: string; appVersionCode?: number }
    const apk = statSync(path.join(process.cwd(), "public/downloads/deriva-android.apk"))
    return {
      version: manifest.appVersionName ?? "1.4",
      code: manifest.appVersionCode ?? 4,
      sizeMb: (apk.size / (1024 * 1024)).toFixed(1),
    }
  } catch {
    return { version: "1.4", code: 4, sizeMb: "1.2" }
  }
}

const FEATURES = [
  { glyph: "▦", title: "Native icon settings", body: "Seven launcher icons — preview and apply inside the app." },
  { glyph: "☀", title: "Daily + shortcuts", body: "Long-press the icon for Daily, Practice, and ICPC." },
  { glyph: "↻", title: "Full curriculum", body: "Everything on the site, full screen, with back gestures." },
  { glyph: "◔", title: "Offline ready", body: "Cached shell and local progress — no account, ever." },
]

export default function AndroidPage() {
  const build = loadBuildInfo()
  const latest = RELEASES[0]
  return (
    <main className="super-page">
      <section className="android-store-hero">
        <div className="android-store-icon" aria-hidden="true">d</div>
        <div className="android-store-id">
          <span className="android-kicker">SRIVTX · TOOLS &amp; LEARNING</span>
          <h1>Deriva</h1>
          <p>Derive the algorithm. Don&apos;t memorize it.</p>
          <div className="android-store-meta">
            <span>v{build.version}</span>
            <i aria-hidden="true" />
            <span>{build.sizeMb} MB</span>
            <i aria-hidden="true" />
            <span>APK · Android 5+</span>
          </div>
        </div>
      </section>

      <section className="android-store-actions">
        <a className="android-store-cta" href="/downloads/deriva-android.apk" download>
          Download APK <span aria-hidden="true">↓</span>
        </a>
        <p className="android-note">Android may ask you to allow installs from this browser before opening the downloaded file. The app verifies its connection to deriva.srivtx.xyz on first open.</p>
      </section>

      <section className="android-store-card" aria-label="Verified connection">
        <div className="android-verified">
          <span className="android-verified-mark" aria-hidden="true">✓</span>
          <div>
            <strong>Verified app</strong>
            <p>Digital Asset Links confirms this APK is authorized for deriva.srivtx.xyz — no fake-app risk.</p>
          </div>
        </div>
      </section>

      <section className="android-store-card" aria-label="What's new">
        <span className="android-kicker">WHAT&apos;S NEW IN {latest.version}</span>
        <ul className="android-whatsnew">
          {latest.highlights.slice(0, 4).map(highlight => (
            <li key={highlight.title}><strong>{highlight.title}</strong><span>{highlight.body}</span></li>
          ))}
        </ul>
        <Link className="android-store-link" href="/releases">Full release notes →</Link>
      </section>

      <section className="android-store-card" aria-label="Features">
        <span className="android-kicker">INSIDE THE APP</span>
        <div className="android-features">
          {FEATURES.map(feature => (
            <div key={feature.title} className="android-feature">
              <span className="android-feature-glyph" aria-hidden="true">{feature.glyph}</span>
              <strong>{feature.title}</strong>
              <span className="android-feature-body">{feature.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="android-store-card" aria-label="Install steps">
        <span className="android-kicker">INSTALL / THREE MOVES</span>
        <ol className="android-install-guide">
          <li><strong>Download the APK.</strong><span>Use the button above in Chrome on your Android device.</span></li>
          <li><strong>Open the file.</strong><span>Confirm the install prompt. If asked, allow this browser to install unknown apps.</span></li>
          <li><strong>Open Deriva.</strong><span>The app launches full screen with your progress already on the device.</span></li>
        </ol>
        <p className="android-note">Updating later: download the new APK on this page and install — it replaces the old version, keeping all your data.</p>
      </section>

      <section className="android-store-card">
        <span className="android-kicker">NO APK? NO PROBLEM</span>
        <p className="android-note">You can also install the browser app — same experience, installed by Chrome without downloads.</p>
        <Link className="android-store-link" href="/settings">Install browser PWA from Settings →</Link>
      </section>
    </main>
  )
}
