'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';

export default function ProfilePage() {
    const { user, logout, authLoading } = useUser();
    const router = useRouter();
    const isMerchant = user.role === 'merchant';

    useEffect(() => {
        if (!authLoading && !user.isLoggedIn) {
            router.replace('/login');
        }
    }, [authLoading, user.isLoggedIn, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const userMenuItems = [
        { icon: '👑', label: 'Subscribe Premium', href: '/subscribe' },
        { icon: '⭐', label: 'Review Saya', href: '/profile/reviews' },
        { icon: '📍', label: 'Rekomendasi Saya', href: '/profile/places' },
        { icon: '❤️', label: 'Bookmark', href: '/bookmarks' },
    ];

    const merchantMenuItems = [
        { icon: '🏪', label: 'Merchant Dashboard', href: '/merchant/dashboard', accent: true },
        ...userMenuItems,
    ];

    const menuItems = isMerchant ? merchantMenuItems : userMenuItems;

    const settingsItems = [
        { icon: '⚙️', label: 'Pengaturan', href: '/profile/settings' },
        { icon: 'ℹ️', label: 'Tentang Halalqu', href: '/about' },
    ];

    if (authLoading || !user.isLoggedIn) {
        return <div className="page container" style={{ paddingTop: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Memuat profil...</div>;
    }

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Profile Card */}
            <div style={{
                background: 'var(--halalqu-green-gradient)', borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--white)',
                position: 'relative', overflow: 'hidden', marginBottom: 'var(--space-xl)',
            }}>
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20px', left: '-20px',
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                }} />

                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', margin: '0 auto var(--space-md)',
                    border: '3px solid rgba(255,255,255,0.3)', overflow: 'hidden',
                }}>
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        isMerchant ? '🏪' : '👤'
                    )}
                </div>

                <h2 style={{ color: 'var(--white)', fontSize: '20px', marginBottom: '4px' }}>
                    {user.name}
                </h2>
                <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: 'var(--space-md)' }}>
                    {user.email}
                </p>

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                }}>
                    {/* Role Badge */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 12px', borderRadius: 'var(--radius-pill)',
                        background: isMerchant ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(8px)', fontSize: '12px', fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                        {isMerchant ? '🏪 Merchant' : '👤 User'}
                    </span>
                </div>

                {isMerchant ? (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)' }}>
                            {user.merchantInfo?.restaurantName || user.merchantInfo?.restoName || 'Merchant Halalqu'}
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.9, color: 'rgba(255,255,255,0.85)' }}>
                            {user.merchantInfo?.description || 'Deskripsi merchant belum ditambahkan.'}
                        </div>
                    </div>
                ) : (
                    <p style={{ opacity: 0.9, fontSize: '13px', marginBottom: 'var(--space-md)' }}>
                        {user.bio || 'Pencinta kuliner halal'}
                    </p>
                )}
            </div>

            {/* Contributor Badge */}
            {(() => {
                const reviews = user.stats.reviews || 0;
                const levels = [
                    { name: 'Bronze', icon: '🥉', min: 0, max: 5, color: '#D4920A', bg: '#FFF8E7' },
                    { name: 'Silver', icon: '🥈', min: 5, max: 15, color: '#6B7280', bg: '#F3F4F6' },
                    { name: 'Gold', icon: '🥇', min: 15, max: 30, color: '#B45309', bg: '#FEF3C7' },
                ];
                const level = levels.find(l => reviews < l.max) || levels[levels.length - 1];
                const progress = Math.min(100, Math.round(((reviews - level.min) / (level.max - level.min)) * 100));
                const remaining = level.max - reviews;
                const nextLevel = levels[levels.indexOf(level) + 1];

                return (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        background: level.bg, borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', marginBottom: 'var(--space-xl)',
                    }}>
                        <span style={{ fontSize: '32px' }}>{level.icon}</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '15px', color: level.color }}>
                                {level.name} Contributor
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {nextLevel
                                    ? `Tambah ${remaining} review lagi untuk naik ke ${nextLevel.name}!`
                                    : '🎉 Level tertinggi! Terima kasih kontribusinya!'}
                            </div>
                        </div>
                        <div style={{
                            marginLeft: 'auto', width: '48px', height: '48px', borderRadius: '50%',
                            background: `conic-gradient(${level.color} ${progress}%, #E5E7EB ${progress}%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: '50%', background: level.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 700, color: level.color,
                            }}>
                                {progress}%
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Merchant Upgrade CTA (only for non-merchant users) */}
            {!isMerchant && user.isLoggedIn && (
                <Link href="/merchant/register" style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    background: 'linear-gradient(135deg, #2E9B5A 0%, #3DBF6E 100%)',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)', textDecoration: 'none', color: 'var(--white)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '-20px', right: '-10px',
                        fontSize: '60px', opacity: 0.15,
                    }}>🏪</div>
                    <span style={{ fontSize: '32px', position: 'relative', zIndex: 1 }}>🏪</span>
                    <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>Punya Restoran?</div>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>Daftar jadi Merchant & kelola bisnismu</div>
                    </div>
                    <span style={{ fontSize: '18px', position: 'relative', zIndex: 1 }}>→</span>
                </Link>
            )
            }

            {/* Merchant Pending Status */}
            {
                !isMerchant && user.merchantStatus === 'pending' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        background: '#FFF8E7', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)', marginBottom: 'var(--space-xl)',
                    }}>
                        <span style={{ fontSize: '28px' }}>⏳</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#D4920A' }}>Pendaftaran Merchant Sedang Direview</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tim Halalqu akan memverifikasi dalam 1-3 hari</div>
                        </div>
                    </div>
                )
            }

            {/* Menu Items */}
            <div style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-md)',
                overflow: 'hidden',
            }}>
                {menuItems.map((item, i) => (
                    <Link key={i} href={item.href} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        padding: 'var(--space-md)',
                        borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none', color: 'inherit', transition: 'background var(--transition-fast)',
                        background: item.accent ? 'var(--halalqu-green-light)' : 'transparent',
                    }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{
                            flex: 1, fontWeight: item.accent ? 600 : 500, fontSize: '15px',
                            color: item.accent ? 'var(--halalqu-green)' : 'inherit',
                        }}>{item.label}</span>
                        {item.count !== undefined && (
                            <span style={{
                                background: item.accent ? 'var(--halalqu-green)' : 'var(--halalqu-green-light)',
                                color: item.accent ? 'var(--white)' : 'var(--halalqu-green)',
                                padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                                fontSize: '12px', fontWeight: 600,
                            }}>
                                {item.count}
                            </span>
                        )}
                        <span style={{ color: item.accent ? 'var(--halalqu-green)' : 'var(--text-muted)' }}>→</span>
                    </Link>
                ))}
            </div>

            {/* Settings */}
            <div style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            }}>
                {settingsItems.map((item, i) => (
                    <Link key={i} href={item.href} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        padding: 'var(--space-md)', borderBottom: i < settingsItems.length - 1 ? '1px solid var(--border)' : 'none',
                        textDecoration: 'none', color: 'inherit',
                    }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: '15px' }}>{item.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                    </Link>
                ))}
            </div>

            {/* Logout */}
            {
                user.isLoggedIn && (
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: 'var(--space-md)', marginTop: 'var(--space-lg)',
                        background: '#FDE8E8', color: 'var(--danger)', borderRadius: 'var(--radius-lg)',
                        fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer',
                    }}>
                        Keluar
                    </button>
                )
            }
        </div >
    );
}
