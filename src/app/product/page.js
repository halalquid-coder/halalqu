'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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
        <div className="page pb-24">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition-colors">
                        ←
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Katalog Produk</h1>
                </div>
            </header>

            <div className="py-4">
                {sortedCategories.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">
                        <p className="text-4xl mb-4">🛍️</p>
                        <p className="text-sm">Belum ada produk saat ini.</p>
                    </div>
                ) : (
                    sortedCategories.map((category) => {
                        const products = groupedProducts[category];
                        // Limit to max 6 products for the horizontal scroll
                        const displayProducts = products.slice(0, 6);
                        const hasMore = products.length > 6;

                        return (
                            <section key={category} className="mb-8">
                                <div className="px-4 flex items-center justify-between mb-3">
                                    <h2 className="text-[15px] font-bold text-gray-900">{category}</h2>
                                    {hasMore && (
                                        <Link href={`/product/category?name=${encodeURIComponent(category)}`} className="text-xs font-semibold text-emerald-600">
                                            Lihat Semua
                                        </Link>
                                    )}
                                </div>

                                {/* Horizontal Carousel */}
                                <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
                                    {displayProducts.map((p) => {
                                        const image = p.images && p.images.length > 0 ? p.images[0] : null;
                                        return (
                                            <Link
                                                key={p.id}
                                                href={`/product/${p.id}`}
                                                className="flex-shrink-0 w-36 snap-start flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                            >
                                                {/* Product Image */}
                                                <div className="w-full h-36 bg-gray-50 relative">
                                                    {image ? (
                                                        <img src={image} alt={p.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                                                    )}

                                                    {/* Halal Badge Overlay */}
                                                    {p.halalId && (
                                                        <div className="absolute top-2 left-2 bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-purple-200">
                                                            ☪️ Halal
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-2.5 flex flex-col flex-1">
                                                    <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{p.title}</h3>

                                                    <div className="mt-auto flex flex-wrap gap-1">
                                                        {p.labels?.isLokal && <span className="text-[9px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.5 rounded border border-emerald-100">Lokal</span>}
                                                        {p.labels?.isImpor && <span className="text-[9px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.5 rounded border border-blue-100">Impor</span>}
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}

                                    {/* See All Card (Appears as 7th item if there are more products) */}
                                    {hasMore && (
                                        <Link
                                            href={`/product/category?name=${encodeURIComponent(category)}`}
                                            className="flex-shrink-0 w-32 snap-start flex flex-col items-center justify-center bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                        >
                                            <span className="text-xl mb-1">👉</span>
                                            <span className="text-xs font-bold">Lihat Semua</span>
                                            <span className="text-[10px] mt-0.5 opacity-80">{products.length - 6} Lainnya</span>
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
