'use client';
import Link from 'next/link';
import { useUser } from '../context/UserContext';

export default function PricingPage() {
    const { user } = useUser();

    const plans = [
        {
            name: 'Guest',
            subtitle: 'Tanpa Akun',
            price: 'Gratis',
            priceNote: '',
            icon: '👤',
            color: '#6B7280',
            bg: '#F3F4F6',
            features: [
                { text: '3x scan total', included: true },
                { text: 'Analisis AI dasar', included: true },
                { text: 'Riwayat scan', included: false },
                { text: 'Reset bulanan', included: false },
                { text: 'Scan unlimited', included: false },
            ],
            cta: user?.isLoggedIn ? null : 'Mulai Scan',
            ctaLink: '/scan',
            current: !user?.isLoggedIn,
        },
        {
            name: 'Registered',
            subtitle: 'Akun Gratis',
            price: 'Gratis',
            priceNote: '5 scan / bulan',
            icon: '🌱',
            color: 'var(--halalqu-green)',
            bg: 'var(--halalqu-green-light)',
            features: [
                { text: '5x scan / bulan', included: true },
                { text: 'Analisis AI lengkap', included: true },
                { text: 'Riwayat scan tersimpan', included: true },
                { text: 'Reset otomatis tiap bulan', included: true },
                { text: 'Scan unlimited', included: false },
            ],
            cta: user?.isLoggedIn ? null : 'Daftar Sekarang',
            ctaLink: '/login',
            current: user?.isLoggedIn && user?.tier !== 'premium',
        },
        {
            name: 'Premium',
            subtitle: 'Langganan',
            price: 'Coming Soon',
            priceNote: 'Segera hadir',
            icon: '👑',
            color: '#F59E0B',
            bg: '#FEF3C7',
            features: [
                { text: 'Unlimited scan', included: true },
                { text: 'Analisis AI prioritas', included: true },
                { text: 'Riwayat scan lengkap', included: true },
                { text: 'Badge Premium', included: true },
                { text: 'Fitur eksklusif mendatang', included: true },
            ],
            cta: 'Upgrade Sekarang',
            ctaLink: '/checkout',
            current: user?.tier === 'premium',
            highlight: true,
        },
    ];

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                <Link href="/scan" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none',
                    marginBottom: 'var(--space-md)',
                }}>← Kembali ke Scan</Link>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '8px' }}>
                    Pilih Paket Scan AI
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Tingkatkan akses scan AI untuk analisis komposisi produk halal
                </p>
            </div>

            {/* Plans */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {plans.map((plan, idx) => (
                    <div key={idx} style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-xl)',
                        background: 'var(--white)',
                        border: plan.highlight
                            ? '2px solid #F59E0B'
                            : plan.current
                                ? `2px solid ${plan.color}`
                                : '1px solid var(--border)',
                        padding: 'var(--space-lg)',
                        boxShadow: plan.highlight ? '0 8px 30px rgba(245,158,11,0.15)' : 'var(--shadow-sm)',
                        overflow: 'hidden',
                    }}>
                        {/* Current badge */}
                        {plan.current && (
                            <div style={{
                                position: 'absolute', top: '12px', right: '12px',
                                padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                background: plan.color, color: 'white',
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                            }}>Paket Anda</div>
                        )}

                        {/* Highlight badge */}
                        {plan.highlight && !plan.current && (
                            <div style={{
                                position: 'absolute', top: '12px', right: '12px',
                                padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white',
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                            }}>⭐ Recommended</div>
                        )}

                        {/* Plan header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: 'var(--radius-lg)',
                                background: plan.bg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '22px',
                            }}>{plan.icon}</div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                                    {plan.name}
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{plan.subtitle}</p>
                            </div>
                        </div>

                        {/* Price */}
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <span style={{ fontSize: '28px', fontWeight: 800, color: plan.color }}>{plan.price}</span>
                            {plan.priceNote && (
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    {plan.priceNote}
                                </span>
                            )}
                        </div>

                        {/* Features */}
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            {plan.features.map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 0', fontSize: '13px',
                                    color: f.included ? 'var(--charcoal)' : 'var(--text-muted)',
                                }}>
                                    <span style={{ fontSize: '14px' }}>{f.included ? '✅' : '—'}</span>
                                    <span style={{
                                        textDecoration: f.included ? 'none' : 'line-through',
                                        opacity: f.included ? 1 : 0.5,
                                    }}>{f.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        {plan.cta && !plan.current && (
                            plan.ctaLink ? (
                                <Link href={plan.ctaLink} style={{
                                    display: 'block', textAlign: 'center',
                                    padding: '12px', borderRadius: 'var(--radius-md)',
                                    background: plan.highlight
                                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                                        : plan.color,
                                    color: 'white', fontWeight: 700, fontSize: '14px',
                                    textDecoration: 'none', transition: 'opacity 0.2s',
                                    opacity: plan.ctaLink ? 1 : 0.5,
                                }}>{plan.cta}</Link>
                            ) : (
                                <div style={{
                                    textAlign: 'center', padding: '12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--border)', color: 'var(--text-muted)',
                                    fontWeight: 600, fontSize: '14px',
                                }}>{plan.cta}</div>
                            )
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison table dark */}
            <div style={{
                marginTop: 'var(--space-2xl)',
                background: '#1a1a2e', borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-lg)', overflow: 'hidden',
            }}>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                    Perbandingan Paket
                </h3>
                <div>
                    {/* Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <span style={{ color: '#9CA3AF', fontWeight: 700, fontSize: '13px' }}>Level</span>
                        <span style={{ color: '#9CA3AF', fontWeight: 700, fontSize: '13px' }}>Akses</span>
                    </div>
                    {/* Rows */}
                    {[
                        { level: 'Guest (Tamu)', access: '3x Scan Total' },
                        { level: 'Registered (Free)', access: '5x Scan / Bulan' },
                        { level: 'Premium (Sub)', access: 'Unlimited / Kuota Besar' },
                    ].map((row, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px',
                            borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        }}>
                            <span style={{ color: '#E5E7EB', fontWeight: 700, fontSize: '14px' }}>{row.level}</span>
                            <span style={{ color: '#D1D5DB', fontSize: '14px' }}>{row.access}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer note */}
            <div style={{
                marginTop: 'var(--space-xl)', textAlign: 'center',
                fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6,
            }}>
                <p>💡 Kuota scan untuk akun gratis akan di-reset otomatis setiap awal bulan.</p>
                <p>Fitur Premium akan segera hadir dengan integrasi pembayaran.</p>
            </div>
        </div>
    );
}
