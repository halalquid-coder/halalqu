'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

function getHalalBadgeText(country) {
    if (!country || country === 'Indonesia') return '☪️ Halal MUI';
    if (country === 'Malaysia') return '☪️ Halal JAKIM';
    if (country === 'Korea') return '☪️ Halal KMF';
    if (country === 'Jepang') return '☪️ Halal JHA';
    if (country === 'Singapura') return '☪️ Halal MUIS';
    if (country === 'Thailand') return '☪️ Halal CICOT';
    if (country === 'Australia') return '☪️ Halal AFIC';
    return `☪️ Halal ${country}`;
}

export default function ProductShowcasePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [groupedProducts, setGroupedProducts] = useState({});

    useEffect(() => {
        async function loadActiveProducts() {
            try {
                const q = query(
                    collection(db, 'products'),
                    where('status', '==', 'active')
                );
                const snapshot = await getDocs(q);
                const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Group purely by main category
                const grouped = {};
                allProducts.forEach(prod => {
                    const cat = prod.category || 'Lainnya';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(prod);
                });

                // Optionally sort by most recently added if timestamp exists within the group
                Object.keys(grouped).forEach(cat => {
                    grouped[cat].sort((a, b) => {
                        const timeA = a.createdAt?.seconds || 0;
                        const timeB = b.createdAt?.seconds || 0;
                        return timeB - timeA;
                    });
                });

                setGroupedProducts(grouped);
            } catch (error) {
                console.error("Error loading products:", error);
            } finally {
                setLoading(false);
            }
        }

        loadActiveProducts();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <p>Memuat Katalog Produk...</p>
            </div>
        );
    }

    // Define Category display order matching Admin priorities for consistent UI
    const categoryOrder = [
        "Makanan & Minuman (F&B)",
        "Fashion Muslim",
        "Kesehatan, Herbal & Kosmetik",
        "Ibu, Bayi & Anak",
        "Peralatan Rumah Tangga & Gaya Hidup",
        "Perawatan Pria (Men's Grooming)"
    ];

    // Sort groups based on predefined order
    const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
        let indexA = categoryOrder.indexOf(a);
        let indexB = categoryOrder.indexOf(b);
        // Give them a low priority if not in the list
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
    });

    return (
        <div className="page pb-24" style={{ paddingBottom: '96px' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)', padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.back()} style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
                        ←
                    </button>
                    <h1 style={{ fontSize: '18px', margin: 0 }}>Katalog Produk</h1>
                </div>
            </header>

            <div style={{ padding: '16px 0' }}>
                {sortedCategories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '36px', margin: '0 0 16px' }}>🛍️</p>
                        <p style={{ fontSize: '14px' }}>Belum ada produk saat ini.</p>
                    </div>
                ) : (
                    sortedCategories.map((category) => {
                        const products = groupedProducts[category];
                        // Limit to max 6 products for the horizontal scroll
                        const displayProducts = products.slice(0, 6);
                        const hasMore = products.length > 6;

                        return (
                            <section key={category} style={{ marginBottom: '32px' }}>
                                <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h2 style={{ fontSize: '16px', margin: 0 }}>{category}</h2>
                                    {hasMore && (
                                        <Link href={`/product/category?name=${encodeURIComponent(category)}`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--halalqu-green)' }}>
                                            Lihat Semua
                                        </Link>
                                    )}
                                </div>

                                {/* Horizontal Carousel */}
                                <div className="hide-scrollbar" style={{
                                    display: 'flex', gap: '16px', overflowX: 'auto', padding: '0 16px 16px',
                                    scrollSnapType: 'x mandatory'
                                }}>
                                    {displayProducts.map((p) => {
                                        const image = p.images && p.images.length > 0 ? p.images[0] : null;
                                        return (
                                            <Link
                                                key={p.id}
                                                href={`/product/${p.id}`}
                                                style={{
                                                    flexShrink: 0, width: '140px', scrollSnapAlign: 'start',
                                                    display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
                                                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
                                                }}
                                            >
                                                {/* Product Image */}
                                                <div style={{ width: '100%', height: '140px', background: 'var(--bg-primary)', position: 'relative' }}>
                                                    {image ? (
                                                        <img src={image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--light-gray)' }}>📦</div>
                                                    )}

                                                    {/* Halal Badge Overlay */}
                                                    {p.halalId && (
                                                        <div style={{
                                                            position: 'absolute', top: '8px', left: '8px', background: '#F3E8FF',
                                                            color: '#7E22CE', fontSize: '10px', fontWeight: 'bold',
                                                            padding: '2px 6px', borderRadius: '4px', border: '1px solid #E9D5FF'
                                                        }}>
                                                            {getHalalBadgeText(p.halalCountry)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{p.title}</h3>

                                                    <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {p.labels?.isLokal && <span style={{ fontSize: '10px', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green-dark)', fontWeight: 500, padding: '2px 6px', borderRadius: '4px' }}>Lokal</span>}
                                                        {p.labels?.isImpor && <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500, padding: '2px 6px', borderRadius: '4px' }}>Impor</span>}
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}

                                    {/* See All Card (Appears as 7th item if there are more products) */}
                                    {hasMore && (
                                        <Link
                                            href={`/product/category?name=${encodeURIComponent(category)}`}
                                            style={{
                                                flexShrink: 0, width: '130px', scrollSnapAlign: 'start',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--halalqu-green-light)', borderRadius: 'var(--radius-md)',
                                                border: '1px solid #D1FAE5', color: 'var(--halalqu-green-dark)', textDecoration: 'none'
                                            }}
                                        >
                                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>👉</span>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Lihat Semua</span>
                                            <span style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>{products.length - 6} Lainnya</span>
                                        </Link>
                                    )}
                                </div>
                            </section>
                        );
                    })
                )}
            </div>

            <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
        </div>
    );
}
