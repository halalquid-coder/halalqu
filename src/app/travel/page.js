'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const countries = [
    { slug: 'indonesia', emoji: '🇮🇩', name: 'Indonesia', color: '#DC2626' },
    { slug: 'malaysia', emoji: '🇲🇾', name: 'Malaysia', color: '#1D4ED8' },
    { slug: 'singapura', emoji: '🇸🇬', name: 'Singapura', color: '#DC2626' },
    { slug: 'thailand', emoji: '🇹🇭', name: 'Thailand', color: '#1D4ED8' },
    { slug: 'jepang', emoji: '🇯🇵', name: 'Jepang', color: '#DC2626' },
    { slug: 'korea', emoji: '🇰🇷', name: 'Korea Selatan', color: '#1D4ED8' },
    { slug: 'turki', emoji: '🇹🇷', name: 'Turki', color: '#DC2626' },
    { slug: 'uae', emoji: '🇦🇪', name: 'UAE', color: '#047857' },
    { slug: 'arab-saudi', emoji: '🇸🇦', name: 'Arab Saudi', color: '#047857' },
    { slug: 'mesir', emoji: '🇪🇬', name: 'Mesir', color: '#B45309' },
    { slug: 'india', emoji: '🇮🇳', name: 'India', color: '#EA580C' },
    { slug: 'uk', emoji: '🇬🇧', name: 'Inggris', color: '#1D4ED8' },
    { slug: 'australia', emoji: '🇦🇺', name: 'Australia', color: '#1D4ED8' },
    { slug: 'amerika', emoji: '🇺🇸', name: 'Amerika Serikat', color: '#1D4ED8' },
];

export default function TravelPage() {
    const [articles, setArticles] = useState([]);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [prayerLoading, setPrayerLoading] = useState(true);
    const [sliderIdx, setSliderIdx] = useState(0);
    const sliderRef = useRef(null);

    useEffect(() => {
        // Load articles
        async function loadArticles() {
            try {
                const snap = await getDocs(collection(db, 'articles'));
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const published = all
                    .filter(a => a.status === 'published')
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setArticles(published);
            } catch (e) { console.warn('Error loading articles:', e); }
        }
        loadArticles();

        // Load prayer times
        async function loadPrayer() {
            setPrayerLoading(true);
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                const { latitude, longitude } = pos.coords;
                const today = new Date();
                const res = await fetch(
                    `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${latitude}&longitude=${longitude}&method=20`
                );
                const data = await res.json();
                if (data.code === 200) {
                    setPrayerTimes(data.data.timings);
                }
            } catch (e) {
                // Fallback: Jakarta
                try {
                    const today = new Date();
                    const res = await fetch(
                        `https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=-6.2088&longitude=106.8456&method=20`
                    );
                    const data = await res.json();
                    if (data.code === 200) setPrayerTimes(data.data.timings);
                } catch (e2) { /* ok */ }
            }
            setPrayerLoading(false);
        }
        loadPrayer();
    }, []);

    // Auto-slide for article slider
    const sliderArticles = articles.slice(0, 5);
    useEffect(() => {
        if (sliderArticles.length <= 1) return;
        const timer = setInterval(() => {
            setSliderIdx(prev => (prev + 1) % sliderArticles.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [sliderArticles.length]);

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const prayerList = prayerTimes ? [
        { name: 'Subuh', time: prayerTimes.Fajr, icon: '🌅' },
        { name: 'Dzuhur', time: prayerTimes.Dhuhr, icon: '☀️' },
        { name: 'Ashar', time: prayerTimes.Asr, icon: '🌤️' },
        { name: 'Maghrib', time: prayerTimes.Maghrib, icon: '🌇' },
        { name: 'Isya', time: prayerTimes.Isha, icon: '🌙' },
    ] : [];

    // Find next prayer
    const getNextPrayer = () => {
        if (!prayerTimes) return null;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        for (const p of prayerList) {
            const [h, m] = p.time.split(':').map(Number);
            if (h * 60 + m > nowMins) return p.name;
        }
        return 'Subuh';
    };
    const nextPrayer = getNextPrayer();

    return (
        <div className="page container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: '96px' }}>

            {/* ═══════════ ARTICLE SLIDER (replaces search bar) ═══════════ */}
            {sliderArticles.length > 0 && (
                <section style={{ marginBottom: 'var(--space-xl)' }}>
                    <Link href={`/article/${sliderArticles[sliderIdx]?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                            height: '180px', background: 'var(--halalqu-green-light)',
                        }}>
                            {sliderArticles[sliderIdx]?.coverImage ? (
                                <img
                                    src={sliderArticles[sliderIdx].coverImage}
                                    alt={sliderArticles[sliderIdx].title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', background: 'linear-gradient(135deg, var(--halalqu-green), #34D399)' }}>📰</div>
                            )}
                            {/* Gradient overlay */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                padding: '16px', paddingTop: '40px',
                            }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                    background: 'var(--halalqu-green)', color: 'white',
                                    fontSize: '10px', fontWeight: 600, marginBottom: '6px', display: 'inline-block',
                                }}>{sliderArticles[sliderIdx]?.category}</span>
                                <h3 style={{
                                    color: 'white', fontSize: '15px', fontWeight: 700, margin: '4px 0 0',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>{sliderArticles[sliderIdx]?.title}</h3>
                            </div>
                        </div>
                    </Link>
                    {/* Dots */}
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
                        {sliderArticles.map((_, i) => (
                            <button key={i} onClick={() => setSliderIdx(i)} style={{
                                width: sliderIdx === i ? '20px' : '8px', height: '8px',
                                borderRadius: '4px', border: 'none', cursor: 'pointer',
                                background: sliderIdx === i ? 'var(--halalqu-green)' : '#D1D5DB',
                                transition: 'all 0.3s',
                            }} />
                        ))}
                    </div>
                </section>
            )}

            {/* ═══════════ HORIZONTAL SCROLL COUNTRIES ═══════════ */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">🌍 Pilih Negara</h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{countries.length} negara</span>
                </div>
                <div style={{
                    display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto',
                    paddingBottom: '8px', marginTop: 'var(--space-sm)',
                    scrollbarWidth: 'none', msOverflowStyle: 'none',
                }}>
                    {countries.map(country => (
                        <Link key={country.slug} href={`/travel/${country.slug}`} style={{
                            flexShrink: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', textDecoration: 'none', color: 'inherit',
                            gap: '6px', width: '72px',
                        }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: `${country.color}12`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                                border: `2px solid ${country.color}25`,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}>
                                {country.emoji}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                                {country.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ═══════════ JADWAL SHOLAT ═══════════ */}
            <section style={{ marginTop: 'var(--space-xl)' }}>
                <div className="section-header">
                    <h2 className="section-title">🕌 Jadwal Sholat</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                {prayerLoading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Memuat jadwal sholat...
                    </div>
                ) : prayerTimes ? (
                    <div style={{
                        display: 'flex', gap: '8px', overflowX: 'auto',
                        paddingBottom: '4px', marginTop: 'var(--space-sm)',
                        scrollbarWidth: 'none',
                    }}>
                        {prayerList.map(p => (
                            <div key={p.name} style={{
                                flexShrink: 0, flex: 1, minWidth: '60px',
                                background: nextPrayer === p.name
                                    ? 'linear-gradient(135deg, var(--halalqu-green), #34D399)'
                                    : 'var(--white)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '12px 8px', textAlign: 'center',
                                boxShadow: 'var(--shadow-sm)',
                                border: nextPrayer === p.name ? 'none' : '1px solid var(--border)',
                            }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{p.icon}</div>
                                <div style={{
                                    fontSize: '11px', fontWeight: 600,
                                    color: nextPrayer === p.name ? 'white' : 'var(--text-secondary)',
                                    marginBottom: '2px',
                                }}>{p.name}</div>
                                <div style={{
                                    fontSize: '14px', fontWeight: 700,
                                    color: nextPrayer === p.name ? 'white' : 'var(--charcoal)',
                                }}>{p.time}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: 'var(--space-md)',
                        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                        fontSize: '13px', color: 'var(--text-muted)',
                    }}>
                        Tidak dapat memuat jadwal sholat. Aktifkan lokasi untuk hasil akurat.
                    </div>
                )}
            </section>

            {/* ═══════════ ARTIKEL & PANDUAN ═══════════ */}
            {articles.length > 0 && (
                <section style={{ marginTop: 'var(--space-xl)' }}>
                    <div className="section-header">
                        <h2 className="section-title">📰 Artikel & Panduan</h2>
                        <Link href="/articles" style={{ fontSize: '13px', color: 'var(--halalqu-green)', fontWeight: 600, textDecoration: 'none' }}>
                            Lihat Semua →
                        </Link>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-sm)', marginTop: 'var(--space-sm)', scrollbarWidth: 'none' }}>
                        {articles.slice(0, 6).map(article => (
                            <Link key={article.id} href={`/article/${article.id}`} style={{
                                flexShrink: 0, width: '240px', background: 'var(--white)',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                textDecoration: 'none', color: 'inherit',
                                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
                            }}>
                                <div style={{ height: '120px', background: 'var(--halalqu-green-light)', position: 'relative' }}>
                                    {article.coverImage ? (
                                        <img src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>📰</div>
                                    )}
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                        background: 'var(--halalqu-green)', color: 'white',
                                        fontSize: '10px', fontWeight: 600,
                                    }}>{article.category}</div>
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <h3 style={{
                                        fontSize: '13px', fontWeight: 700, margin: '0 0 4px',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden', lineHeight: 1.3,
                                    }}>{article.title}</h3>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        📅 {formatDate(article.createdAt)} · 👁️ {article.views || 0}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
