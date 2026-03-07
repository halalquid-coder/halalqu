'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function CategoryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryName = searchParams.get('name');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategoryProducts() {
            if (!categoryName) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const q = query(
                    collection(db, 'products'),
                    where('status', '==', 'active'),
                    where('category', '==', categoryName)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Sort by newest
                data.sort((a, b) => {
                    const tA = a.createdAt?.seconds || 0;
                    const tB = b.createdAt?.seconds || 0;
                    return tB - tA;
                });

                setProducts(data);
            } catch (error) {
                console.error("Error fetching category products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCategoryProducts();
    }, [categoryName]);

    return (
        <div className="page pb-24" style={{ paddingBottom: '96px' }}>
            <header style={{
                position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)', padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '12px'
            }}>
                <button onClick={() => router.back()} style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
                    ←
                </button>
                <h1 style={{ fontSize: '18px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {categoryName || 'Kategori Tidak Ditemukan'}
                </h1>
            </header>

            <div style={{ padding: '20px 16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <p>Memuat produk...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '40px', margin: '0 0 16px' }}>📭</p>
                        <h3 style={{ fontSize: '18px', margin: '0 0 8px', color: 'var(--charcoal)' }}>Kategori Kosong</h3>
                        <p style={{ fontSize: '14px', margin: 0 }}>Belum ada produk yang ditambahkan ke etalase ini.</p>
                        <button
                            onClick={() => router.back()}
                            style={{ marginTop: '24px', padding: '10px 24px', background: 'var(--halalqu-green)', color: 'white', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}
                        >
                            Kembali
                        </button>
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Menampilkan <b>{products.length}</b> produk
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
                            {products.map((p) => {
                                const image = p.images && p.images.length > 0 ? p.images[0] : null;
                                return (
                                    <Link
                                        key={p.id}
                                        href={`/product/${p.id}`}
                                        style={{
                                            display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
                                            borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
                                        }}
                                    >
                                        {/* Product Image */}
                                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg-primary)', position: 'relative' }}>
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
                                                    ☪️ Halal
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{p.title}</h3>

                                            {p.subCategory && (
                                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>{p.subCategory}</p>
                                            )}

                                            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {p.labels?.isLokal && <span style={{ fontSize: '10px', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green-dark)', fontWeight: 500, padding: '2px 6px', borderRadius: '4px' }}>Lokal</span>}
                                                {p.labels?.isImpor && <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500, padding: '2px 6px', borderRadius: '4px' }}>Impor</span>}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CategoryPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat Kategori...</div>}>
            <CategoryContent />
        </Suspense>
    );
}
