'use client';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="page container" style={{ paddingTop: 'var(--space-xl)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <Link href="/profile" style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', textDecoration: 'none',
                }}>←</Link>
                <h2>Tentang Halalqu</h2>
            </div>

            {/* Logo */}
            <div style={{
                textAlign: 'center', padding: 'var(--space-2xl) 0', marginBottom: 'var(--space-xl)',
                background: 'var(--halalqu-green-gradient)', borderRadius: 'var(--radius-xl)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-50px', right: '-30px', width: '200px', height: '200px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                }} />
                <img src="/logo-white.svg" alt="Halalqu" style={{
                    height: '36px', marginBottom: 'var(--space-sm)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }} />
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                    Cari Halal, Tanpa Ragu
                </p>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '22px', lineHeight: 1.4, marginBottom: 'var(--space-md)' }}>
                    Menjelajahi Dunia Tanpa Ragu.{' '}
                    <span style={{ color: 'var(--halalqu-green)' }}>Karena Setiap Suapan Adalah Ibadah.</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '15px' }}>
                    Mencari makanan halal di tempat baru seharusnya semudah mencari senyum di wajah saudara seiman.
                    Halalqu hadir sebagai kompas digital bagi umat Muslim untuk menemukan hidangan yang tak hanya lezat,
                    tapi juga menenangkan hati.
                </p>
            </div>

            {/* Kisah Kami */}
            <div style={{
                background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)',
                marginBottom: 'var(--space-xl)', borderLeft: '4px solid var(--halalqu-green)',
            }}>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>📖 Kisah Kami</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '14px' }}>
                    Halalqu lahir dari sebuah keresahan sederhana: &ldquo;Bisa makan di sini tidak ya?&rdquo;
                    Pertanyaan ini sering muncul saat kita sedang traveling, belajar di negeri orang,
                    atau sekadar menjelajahi sudut kota yang baru. Kami percaya bahwa akses terhadap makanan halal
                    adalah hak dasar setiap Muslim, di mana pun mereka berada.
                </p>
            </div>

            {/* Visi */}
            <div style={{
                background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
                textAlign: 'center',
            }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: 'var(--space-sm)' }}>🌟</span>
                <h3 style={{ color: 'var(--halalqu-green)', marginBottom: 'var(--space-sm)' }}>Visi Kami</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                    Menjadi ekosistem kuliner halal terbesar di dunia yang menghubungkan jutaan umat
                    dengan ribuan pengusaha kuliner yang amanah.
                </p>
            </div>

            {/* Values */}
            <h3 style={{ marginBottom: 'var(--space-md)' }}>💎 Apa yang Kami Pegang Teguh</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {[
                    {
                        icon: '🔍', title: 'Transparansi Tanpa Kompromi',
                        desc: 'Kami menyediakan detail status halal yang jelas, mulai dari sertifikasi resmi hingga kepemilikan Muslim.'
                    },
                    {
                        icon: '🤝', title: 'Kekuatan Komunitas',
                        desc: 'Halalqu bukan sekadar direktori, tapi gerakan. Dari pengguna, oleh pengguna, untuk umat.'
                    },
                    {
                        icon: '📱', title: 'Kemudahan Akses',
                        desc: 'Teknologi canggih yang dirancang sesederhana mungkin agar bisa digunakan oleh siapa saja.'
                    },
                ].map((value, i) => (
                    <div key={i} className="card" style={{
                        padding: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: '28px', flexShrink: 0 }}>{value.icon}</span>
                        <div>
                            <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{value.title}</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{value.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quote */}
            <div style={{
                textAlign: 'center', padding: 'var(--space-xl)',
                background: 'var(--halalqu-green-gradient)', borderRadius: 'var(--radius-xl)',
                color: 'var(--white)', marginBottom: 'var(--space-xl)',
            }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: 'var(--space-md)' }}>&ldquo;</span>
                <p style={{
                    fontSize: '16px', fontStyle: 'italic', lineHeight: 1.6, maxWidth: '350px', margin: '0 auto',
                    fontFamily: 'var(--font-heading)',
                }}>
                    Di Halalqu, kami tidak hanya mencari rasa yang enak, tapi juga keberkahan yang nyata.
                </p>
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', paddingBottom: 'var(--space-lg)' }}>
                Halalqu v1.0 · © 2026 Halalqu. All rights reserved.
            </p>
        </div>
    );
}
