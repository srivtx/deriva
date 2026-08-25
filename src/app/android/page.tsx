import type { Metadata } from "next"
import PwaInstallAction from "@/components/pwa-install-action"

export const metadata: Metadata = {
  title: "Deriva for Android",
  description: "Install the signed Deriva Android app.",
}

export default function AndroidPage() {
  return (
    <main className="android-page">
      <section className="android-hero">
        <div className="android-hero-grid">
          <div className="android-hero-copy">
            <span className="android-kicker">ANDROID / SIGNED BUILD</span>
            <h1>Deriva for Android.</h1>
            <p>One quiet, green workspace for deriving algorithms wherever you think best. Install the signed app, then make the launcher feel like yours.</p>
            <div className="android-build-meta">
              <div><span>BUILD</span><strong>1.4.1</strong></div>
              <div><span>PACKAGE</span><strong>xyz.srivtx.deriva</strong></div>
              <div><span>FORMAT</span><strong>APK</strong></div>
            </div>
            <a className="android-download" href="/downloads/deriva-android.apk" download>
              Download Android app <span aria-hidden="true">-&gt;</span>
            </a>
            <p className="android-note">Android may ask you to allow installs from this browser before opening the downloaded APK.</p>
            <p className="android-note">After installation, open Settings inside the app and choose <strong>Change app icon in Android app</strong> to select a bundled launcher icon.</p>
            <PwaInstallAction />
          </div>
          <div className="android-hero-visual" aria-label="Deriva moss Android app mark">
            <div className="android-visual-orbit" />
            <div className="android-visual-stamp">
              <img className="android-icon" src="/icons/icon-moss.svg" alt="Moss Deriva app icon" width={176} height={176} />
              <AndroidMascot />
            </div>
            <span className="android-visual-caption">DERIVA / MOSS BUILD / 1.2</span>
          </div>
        </div>
      </section>

      <section className="android-install-guide" aria-labelledby="android-install-heading">
        <span className="android-kicker">INSTALL / THREE MOVES</span>
        <h2 id="android-install-heading">From download to first derivation.</h2>
        <ol>
          <li><strong>Download the APK.</strong><span>Use the button above in Chrome on your Android device.</span></li>
          <li><strong>Open the file.</strong><span>Confirm the install prompt. If asked, allow this browser to install unknown apps.</span></li>
          <li><strong>Open Deriva.</strong><span>The app will verify its relationship with deriva.srivtx.xyz and launch the live curriculum.</span></li>
        </ol>
      </section>
    </main>
  )
}

function AndroidMascot() {
  return (
    <svg className="android-mascot" viewBox="0 0 160 160" role="img" aria-label="Android mascot">
      <path d="M58 32 48 17M102 32l10-15" fill="none" stroke="var(--android-mascot)" strokeWidth="6" strokeLinecap="round" />
      <rect x="34" y="28" width="92" height="62" rx="31" fill="var(--android-mascot)" />
      <circle cx="62" cy="59" r="5" fill="var(--paper-raised)" />
      <circle cx="98" cy="59" r="5" fill="var(--paper-raised)" />
      <rect x="34" y="82" width="92" height="53" rx="14" fill="var(--android-mascot)" />
      <path d="M24 91v34M136 91v34M58 132v16M102 132v16" fill="none" stroke="var(--android-mascot)" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}
