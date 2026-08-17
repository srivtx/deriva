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
        <span className="android-kicker">ANDROID / SIGNED BUILD</span>
        <div className="android-title-row">
          <img className="android-icon" src="/icons/icon-maskable.png" alt="Deriva app icon" width={96} height={96} />
          <div>
            <h1>Deriva for Android</h1>
            <p>Carry the derivation with you. The signed app opens Deriva as a focused Android surface.</p>
          </div>
        </div>
        <div className="android-build-meta">
          <div><span>BUILD</span><strong>1.2</strong></div>
          <div><span>PACKAGE</span><strong>xyz.srivtx.deriva</strong></div>
          <div><span>FORMAT</span><strong>APK</strong></div>
        </div>
        <a className="android-download" href="/downloads/deriva-android.apk" download>
          Download Android app <span aria-hidden="true">-&gt;</span>
        </a>
        <p className="android-note">Android may ask you to allow installs from this browser before opening the downloaded APK.</p>
        <p className="android-note">After installation, open Settings inside the app and choose <strong>Change app icon in Android app</strong> to select a bundled launcher icon.</p>
        <PwaInstallAction />
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
