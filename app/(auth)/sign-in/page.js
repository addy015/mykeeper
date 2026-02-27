"use client"

import { useState } from 'react'
import { account } from '@/lib/appwrite'

// ── Google Icon Component ─────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// ── Login Page Component ──────────────────────────────────────────────────────
export default function Login() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setLoading(true)
    const origin = window.location.origin

    // Initiates Google OAuth flow via Appwrite
    account.createOAuth2Token(
      'google',
      `${origin}/auth/callback`,
      `${origin}/sign-in`
    )
  }

  return (
    <div className="login-fullscreen">
      {/* Decorative background elements */}
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />
      <div className="auth-orb auth-orb-3" aria-hidden="true" />
      <div className="login-noise" aria-hidden="true" />

      <div className="login-content">
        {/* Brand Identity */}
        <div className="auth-brand" style={{ justifyContent: 'center', marginBottom: '40px' }}>
          <div className="brand-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <span className="brand-wordmark">MyKeeper</span>
        </div>

        <h1 className="auth-headline" style={{ textAlign: 'center', marginBottom: '14px' }}>
          Keep your files<br />
          <span className="auth-headline-accent">safe &amp; organised.</span>
        </h1>

        <p className="auth-description" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto 36px' }}>
          A beautiful, encrypted cloud drive where your documents,
          images, and media live — always in sync, always private.
        </p>

        {/* Core value propositions */}
        <div className="auth-pills" style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
          {[
            { icon: '🔒', text: 'End-to-end encrypted' },
            { icon: '⚡', text: 'Instant sync' },
            { icon: '☁️', text: '2GB Free storage' },
          ].map(({ icon, text }) => (
            <div key={text} className="auth-pill">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Primary Call to Action */}
        <button
          type="button"
          className="btn-google-hero"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="spinner spinner--light" /> Redirecting to Google…
            </span>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <p className="login-legal">
          🔒 Secured by Google OAuth 2.0 · We never see your password
        </p>

        {/* Decorative UI illustrations */}
        <div className="auth-illustration login-illustration" aria-hidden="true">
          <div className="ill-ring" />

          {/* Sample File Cards (Decorative) */}
          <div className="ill-card ill-card-1">
            <div className="ill-card-icon" style={{ background: 'linear-gradient(135deg,#92400e,#d97706)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div className="ill-card-name">report_q4.pdf</div>
              <div className="ill-card-meta">2.4 MB · Edited just now</div>
            </div>
          </div>

          <div className="ill-card ill-card-2">
            <div className="ill-card-icon" style={{ background: 'linear-gradient(135deg,#7c2d12,#ea580c)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <div className="ill-card-name">photo_album.zip</div>
              <div className="ill-card-meta">84 MB · Shared with 3</div>
            </div>
          </div>

          <div className="ill-card ill-card-3">
            <div className="ill-card-icon" style={{ background: 'linear-gradient(135deg,#78350f,#f59e0b)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </div>
            <div>
              <div className="ill-card-name">demo_reel.mp4</div>
              <div className="ill-card-meta">312 MB · Uploading…</div>
            </div>
          </div>

          <div className="ill-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <span>Synced</span>
            <span className="ill-badge-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}
