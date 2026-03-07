'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export default function ProductDetailPage({ params }) {
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        async function fetchProduct() {
            try {
                const docRef = doc(db, 'products', params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setProduct(null);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        }

        if (params.id) {
            fetchProduct();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: 'var(--text-muted)' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--halalqu-green)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <p>Memuat Informasi Produk...</p>
                <style jsx>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', paddingTop: '120px' }}>
                <p style={{ fontSize: '50px', margin: '0 0 16px' }}>😕</p>
                <h2 style={{ fontSize: '20px', color: 'var(--charcoal)', marginBottom: '8px' }}>Produk Tidak Ditemukan</h2>
                <p style={{ fontSize: '14px', marginBottom: '24px' }}>Produk yang Anda cari mungkin sudah dihapus atau URL tidak valid.</p>
                <button
                    onClick={() => router.back()}
                    style={{ padding: '12px 24px', background: 'var(--halalqu-green)', color: 'white', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}
                >
                    Kembali ke Katalog
                </button>
            </div>
        );
    }

    const images = product.images && product.images.length > 0 ? product.images : [];

    return (
        <div className="page pb-24" style={{ paddingBottom: '96px', background: 'var(--bg-primary)', minHeight: '100vh' }}>
            {/* Header / Nav */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)', padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '12px'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--charcoal)', background: 'var(--bg-primary)', borderRadius: '50%', border: '1px solid var(--border)'
                    }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: '16px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontWeight: 600, color: 'var(--charcoal)' }}>
                    Detail Produk
                </h1>
            </header>

            {/* Image Slider Component */}
            <div style={{ marginTop: '61px', background: 'var(--white)', position: 'relative' }}>
                {images.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#f8f9fa' }}>
                        <img
                            src={images[activeImageIndex]}
                            alt={product.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {/* Dots Indicator */}
                        {images.length > 1 && (
                            <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        style={{
                                            width: idx === activeImageIndex ? '20px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: idx === activeImageIndex ? 'var(--halalqu-green)' : 'rgba(255,255,255,0.6)',
                                            border: idx === activeImageIndex ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                            padding: 0,
                                            transition: 'width 0.3s ease, background 0.3s ease'
                                        }}
                                        aria-label={`Lihat gambar ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', margin: '0 0 8px' }}>📦</p>
                            <p style={{ fontSize: '14px' }}>Tidak ada foto produk</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Meta Data */}
            <div style={{ background: 'var(--white)', padding: '20px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {/* Halal Badge */}
                    {product.halalId && (
                        <div style={{
                            background: '#F3E8FF', color: '#7E22CE', fontSize: '12px', fontWeight: 'bold',
                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #E9D5FF', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                            {getHalalBadgeText(product.halalCountry)}
                        </div>
                    )}

                    {product.labels?.isLokal && <span style={{ fontSize: '12px', background: 'var(--halalqu-green-light)', color: 'var(--halalqu-green-dark)', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}>Lokal 🇮🇩</span>}
                    {product.labels?.isImpor && <span style={{ fontSize: '12px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}>Impor 🌍</span>}
                </div>

                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--charcoal)', lineHeight: 1.3 }}>
                    {product.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--halalqu-green)', fontWeight: 600 }}>{product.category || 'Lain-lain'}</span>
                    {product.subCategory && (
                        <>
                            <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
                            <span>{product.subCategory}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Additional Detail Box */}
            {product.halalId && (
                <div style={{ background: 'var(--white)', padding: '16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--charcoal)' }}>Informasi Halal</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Penerbit</span>
                        <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{product.halalCountry || 'Indonesia'}</span>

                        <span style={{ color: 'var(--text-secondary)' }}>No. Sertifikat</span>
                        <span style={{ fontWeight: 500, color: 'var(--charcoal)', wordBreak: 'break-all' }}>{product.halalId}</span>

                        {product.halalExpiry && (
                            <>
                                <span style={{ color: 'var(--text-secondary)' }}>Masa Berlaku</span>
                                <span style={{ fontWeight: 500, color: 'var(--charcoal)' }}>
                                    {new Date(product.halalExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Description Box */}
            <div style={{ background: 'var(--white)', padding: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--charcoal)' }}>Deskripsi Produk</h3>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {product.description || 'Tidak ada deskripsi yang tersedia untuk produk ini.'}
                </div>
            </div>

        </div>
    );
}
