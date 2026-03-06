'use client';
import styles from '../page.module.css';
import BottomNav from '../components/BottomNav';

export default function ProductPage() {
    return (
        <div className={`page container ${styles.hero}`} style={{ minHeight: '100vh', background: 'var(--white)', padding: 0 }}>
            {/* Header */}
            <header style={{
                background: 'var(--halalqu-green-gradient)',
                padding: 'var(--space-xl) var(--space-md) var(--space-xl)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                color: 'white'
            }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Produk Halal</h1>
                <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>Temukan produk-produk halal terbaik</p>
            </header>

            <div style={{ padding: 'var(--space-2xl) var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
                <h2 style={{ fontSize: '18px', color: 'var(--charcoal)', marginBottom: '8px' }}>Halaman Produk Segera Hadir</h2>
                <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                    Kami sedang menyiapkan katalog produk halal pilihan untuk Anda. Nanti Anda bisa berbelanja langsung dari sini.
                </p>
            </div>

            <BottomNav />
        </div>
    );
}
