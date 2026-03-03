'use client';
import Link from 'next/link';
import { useState } from 'react';

const statsData = [
    { label: 'Dilihat', value: '1,245', icon: '👁', change: '+12%', up: true },
    { label: 'Navigasi', value: '342', icon: '🗺', change: '+8%', up: true },
    { label: 'Bookmark', value: '89', icon: '❤️', change: '+5%', up: true },
    { label: 'Review', value: '28', icon: '💬', change: '+3', up: true },
];

const reviews = [
    { name: 'Ahmad F.', rating: 5, text: 'Makanan enak dan halal terjamin!', date: '28 Feb', replied: true },
    { name: 'Siti N.', rating: 4, text: 'Tempatnya nyaman, sotonya mantap.', date: '25 Feb', replied: true },
    { name: 'Budi S.', rating: 3, text: 'Menunya terbatas tapi rasa OK.', date: '22 Feb', replied: false },
    { name: 'Aisyah R.', rating: 5, text: 'Best nasi gudeg in town!', date: '20 Feb', replied: false },
];

export default function MerchantDashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px' }}>🏪 Merchant Dashboard</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Warung Halal Barokah</p>
                </div>
                <span className="badge badge-certified" style={{ fontSize: '11px' }}>✅ Verified</span>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', background: 'var(--white)', borderRadius: 'var(--radius-md)',
                padding: '4px', marginBottom: 'var(--space-xl)', boxShadow: 'var(--shadow-sm)',
            }}>
                {[
                    { key: 'overview', label: '📊 Overview' },
                    { key: 'listing', label: '📝 Listing' },
                    { key: 'reviews', label: '💬 Review' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer', border: 'none',
                        transition: 'all 0.2s ease',
                        background: activeTab === tab.key ? 'var(--halalqu-green)' : 'transparent',
                        color: activeTab === tab.key ? 'var(--white)' : 'var(--text-secondary)',
                    }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                        {statsData.map((stat, i) => (
                            <div key={i} style={{
                                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                    <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                                    <span style={{
                                        fontSize: '12px', fontWeight: 600,
                                        color: stat.up ? 'var(--halalqu-green)' : 'var(--danger)',
                                    }}>
                                        {stat.up ? '↑' : '↓'} {stat.change}
                                    </span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--charcoal)' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Week chart placeholder */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-xl)',
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-md)' }}>📈 Kunjungan Minggu Ini</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px' }}>
                            {[45, 62, 38, 70, 55, 80, 65].map((val, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                        width: '100%', height: `${val}%`, borderRadius: '6px 6px 0 0',
                                        background: i === 5 ? 'var(--halalqu-green)' : 'var(--halalqu-green-light)',
                                        transition: 'height 0.5s ease',
                                        animation: `fadeInUp 0.3s ease ${i * 0.05}s forwards`, opacity: 0,
                                    }} />
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div style={{
                        background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    }}>
                        <span style={{ fontSize: '32px' }}>🏅</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--halalqu-green)' }}>
                                Sertifikat Halal Aktif
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                MUI / BPJPH · Berlaku s/d Des 2026
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Listing Tab */}
            {activeTab === 'listing' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: 'var(--radius-lg)',
                                background: 'var(--halalqu-green-light)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '48px',
                                margin: '0 auto var(--space-md)',
                            }}>
                                🍛
                            </div>
                            <h3>Warung Halal Barokah</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Indonesian · Street Food</p>
                        </div>

                        {[
                            { label: 'Nama', value: 'Warung Halal Barokah' },
                            { label: 'Alamat', value: 'Jl. Sudirman No. 12, Jakarta' },
                            { label: 'Telepon', value: '0812-3456-7890' },
                            { label: 'Jam Buka', value: '08:00 - 22:00' },
                            { label: 'Kategori', value: 'Street Food' },
                        ].map((field, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 0', borderBottom: '1px solid var(--border)',
                            }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{field.label}</span>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{field.value}</span>
                            </div>
                        ))}

                        <button className="btn btn-outline btn-full" style={{ marginTop: 'var(--space-lg)' }}>
                            ✏️ Edit Informasi
                        </button>
                    </div>

                    {/* Menu Management */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ fontSize: '16px' }}>🍽 Menu</h3>
                            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                                ➕ Tambah
                            </button>
                        </div>
                        {[
                            { name: 'Nasi Gudeg', price: 'Rp 35.000', emoji: '🍛' },
                            { name: 'Sate Ayam', price: 'Rp 40.000', emoji: '🍢' },
                            { name: 'Soto Ayam', price: 'Rp 30.000', emoji: '🍲' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                padding: '10px 0', borderBottom: '1px solid var(--border)',
                            }}>
                                <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 600 }}>{item.price}</div>
                                </div>
                                <button style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '14px',
                                }}>✏️</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Summary */}
                    <div style={{
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                        marginBottom: 'var(--space-lg)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '40px', fontWeight: 700, color: 'var(--halalqu-green)', fontFamily: 'var(--font-heading)' }}>
                            4.8
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                            dari {reviews.length} review
                        </div>
                        <div style={{ fontSize: '16px' }}>{'⭐'.repeat(5)}</div>
                    </div>

                    {/* Reviews List */}
                    {reviews.map((review, i) => (
                        <div key={i} style={{
                            background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)',
                            marginBottom: 'var(--space-md)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{review.name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{review.date}</span>
                                </div>
                                <span style={{ fontSize: '12px' }}>{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-sm)' }}>
                                {review.text}
                            </p>
                            {review.replied ? (
                                <div style={{
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-sm)',
                                    fontSize: '12px', color: 'var(--halalqu-green)',
                                }}>
                                    ✅ Sudah dibalas
                                </div>
                            ) : (
                                <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                                    💬 Balas Review
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
