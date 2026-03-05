'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import './globals.css';
import BottomNav from './components/BottomNav';
import { UserProvider, useUser } from './context/UserContext';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2E9B5A" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <title>Halalqu — Cari Halal, Tanpa Ragu</title>
        <meta name="description" content="Temukan restoran dan makanan halal terdekat yang terverifikasi. Halalqu adalah kompas digital bagi umat Muslim untuk menemukan hidangan halal di mana pun." />
      </head>
      <body>
        <UserProvider>
          <ServiceWorkerRegister />
          <AppShell>{children}</AppShell>
        </UserProvider>
      </body>
    </html>
  );
}

function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          function (err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
    }
  }, []);
  return null;
}

function GeolocationPrompt() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Prompt for location on mount, reuse if already granted
      navigator.geolocation.getCurrentPosition(
        (pos) => console.log('Location permission granted/reused on load'),
        (err) => console.warn('Location permission denied or error on load:', err),
        { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);
  return null;
}

function AppShell({ children }) {
  const pathname = usePathname();
  const { authLoading } = useUser();
  const hideNavOn = ['/onboarding'];
  const showNav = !hideNavOn.includes(pathname);

  // Show loading screen while Firebase auth initializes
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)',
        background: 'var(--halalqu-green-gradient)',
      }}>
        <img src="/logo-white.svg" alt="Halalqu" style={{
          height: '32px', opacity: 0.9,
        }} />
        <div style={{
          width: '40px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.3)', overflow: 'hidden',
          marginTop: 'var(--space-sm)',
        }}>
          <div style={{
            width: '50%', height: '100%', borderRadius: '2px',
            background: 'rgba(255,255,255,0.8)',
            animation: 'shimmer 1.2s ease-in-out infinite',
          }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <GeolocationPrompt />
      <main>{children}</main>
      {showNav && <BottomNav />}
    </>
  );
}
