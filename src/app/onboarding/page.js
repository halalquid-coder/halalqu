'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const slides = [
    {
        emoji: '📍',
        bg: 'linear-gradient(135deg, #2E9B5A 0%, #3DBF6E 100%)',
        title: 'Temukan di Sekitarmu',
        desc: 'Cari restoran halal terdekat hanya dalam satu klik. Kami menghubungkan kamu dengan ribuan tempat makan halal di seluruh dunia.',
        illustration: '🗺️',
    },
    {
        emoji: '✅',
        bg: 'linear-gradient(135deg, #237A45 0%, #2E9B5A 100%)',
        title: 'Terverifikasi & Terpercaya',
        desc: 'Setiap tempat melalui proses kurasi ketat. Lihat sertifikat halal, review komunitas, dan "Last Checked" date untuk ketenangan hati.',
        illustration: '🛡️',
    },
    {
        emoji: '🤝',
        bg: 'linear-gradient(135deg, #1a7a3f 0%, #2E9B5A 100%)',
        title: 'Bangun Bersama Komunitas',
        desc: 'Bantu sesama Muslim dengan menambahkan tempat baru dan memberikan review jujur. Bersama kita buat ekosistem halal yang lebih baik.',
        illustration: '🌍',
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    const next = () => {
        if (current < slides.length - 1) {
            setDirection(1);
            setCurrent(current + 1);
        } else {
            router.push('/login');
        }
    };

    const prev = () => {
        if (current > 0) {
            setDirection(-1);
            setCurrent(current - 1);
        }
    };

    const skip = () => router.push('/login');
    const slide = slides[current];
    const isLast = current === slides.length - 1;

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            background: slide.bg, transition: 'background 0.6s ease',
            padding: 'var(--space-xl) var(--space-md)', position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative circles */}
            <div style={{
                position: 'absolute', top: '-80px', right: '-60px',
                width: '250px', height: '250px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-40px', left: '-40px',
                width: '180px', height: '180px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
            }} />

            {/* Skip */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 2 }}>
                {!isLast && (
                    <button onClick={skip} style={{
                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                        color: 'var(--white)', padding: '8px 20px', borderRadius: 'var(--radius-pill)',
                        fontSize: '14px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                    }}>
                        Lewati
                    </button>
                )}
            </div>

            {/* Illustration */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
            }}>
                {slide.illustration && ( // Only render if illustration exists
                    <div style={{
                        fontSize: '120px', marginBottom: 'var(--space-xl)',
                        animation: 'scaleIn 0.5s ease', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))',
                    }} key={current}>
                        {slide.illustration}
                    </div>
                )}

                <h1 style={{
                    color: 'var(--white)', fontSize: '28px', textAlign: 'center',
                    marginBottom: 'var(--space-md)', fontFamily: 'var(--font-heading)',
                    animation: 'fadeInUp 0.5s ease',
                }} key={`title-${current}`}>
                    {slide.title}
                </h1>

                <p style={{
                    color: 'rgba(255,255,255,0.85)', fontSize: '15px', textAlign: 'center',
                    lineHeight: 1.7, maxWidth: '340px',
                    animation: 'fadeInUp 0.5s ease 0.1s forwards', opacity: 0,
                }} key={`desc-${current}`}>
                    {slide.desc}
                </p>
            </div>

            {/* Bottom controls */}
            <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Dot indicator */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '8px',
                    marginBottom: 'var(--space-xl)',
                }}>
                    {slides.map((_, i) => (
                        <div key={i} style={{
                            width: i === current ? '24px' : '8px', height: '8px',
                            borderRadius: '4px',
                            background: i === current ? 'var(--white)' : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.3s ease', cursor: 'pointer',
                        }} onClick={() => setCurrent(i)} />
                    ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    {current > 0 && (
                        <button onClick={prev} style={{
                            padding: '16px 24px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                            color: 'var(--white)', fontWeight: 600, fontSize: '15px',
                            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}>
                            ←
                        </button>
                    )}
                    <button onClick={next} style={{
                        flex: 1, padding: '16px', borderRadius: 'var(--radius-md)',
                        background: 'var(--white)', color: 'var(--halalqu-green)',
                        fontWeight: 700, fontSize: '16px', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease', border: 'none',
                        fontFamily: 'var(--font-heading)',
                    }}>
                        {isLast ? '🚀 Mulai Sekarang' : 'Lanjut →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
