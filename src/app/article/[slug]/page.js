import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ArticleClient from './ArticleClient';

// Resolve article by slug field, fallback to doc ID for old URLs
async function resolveArticle(slug) {
    // 1. Try by slug field
    try {
        const q = query(collection(db, 'articles'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const d = snap.docs[0];
            return { docId: d.id, data: d.data() };
        }
    } catch (e) {}

    // 2. Fallback: try by doc ID (backward compat for old links)
    try {
        const snap = await getDoc(doc(db, 'articles', slug));
        if (snap.exists()) {
            return { docId: snap.id, data: snap.data() };
        }
    } catch (e) {}

    return null;
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const result = await resolveArticle(slug);
        if (result) {
            const { docId, data: article } = result;
            const canonicalSlug = article.slug || docId;
            const description = article.summary || (article.content ? article.content.substring(0, 160) + '...' : 'Baca artikel di Halalqu');
            const tags = Array.isArray(article.tags) ? article.tags : [];
            return {
                title: `${article.title} | Halalqu`,
                description,
                keywords: [article.category, article.country, ...tags, 'halal', 'halalqu'].filter(Boolean).join(', '),
                openGraph: {
                    title: article.title,
                    description,
                    type: 'article',
                    publishedTime: article.createdAt?.toDate?.()?.toISOString(),
                    authors: [article.authorName || 'Halalqu'],
                    tags,
                    ...(article.coverImage && { images: [{ url: article.coverImage, width: 1200, height: 630, alt: article.title }] }),
                    siteName: 'Halalqu',
                },
                twitter: {
                    card: article.coverImage ? 'summary_large_image' : 'summary',
                    title: article.title,
                    description,
                    ...(article.coverImage && { images: [article.coverImage] }),
                },
                alternates: {
                    canonical: `https://halalqu.online/article/${canonicalSlug}`,
                },
            };
        }
    } catch (e) {
        console.error('Error generating metadata:', e);
    }
    return {
        title: 'Artikel | Halalqu',
        description: 'Baca artikel dan panduan travel halal di Halalqu',
    };
}

export default async function ArticlePage({ params }) {
    const { slug } = await params;

    let relatedArticles = [];
    let jsonLd = null;
    let docId = slug;

    try {
        const result = await resolveArticle(slug);
        if (result) {
            docId = result.docId;
            const current = result.data;
            const canonicalSlug = current.slug || docId;

            // Related articles
            const allSnap = await getDocs(collection(db, 'articles'));
            relatedArticles = allSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(a => a.id !== docId && a.status === 'published')
                .sort((a, b) => {
                    let scoreA = 0, scoreB = 0;
                    if (a.category === current.category) scoreA += 2;
                    if (b.category === current.category) scoreB += 2;
                    if (a.country && a.country === current.country) scoreA += 1;
                    if (b.country && b.country === current.country) scoreB += 1;
                    return scoreB - scoreA || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                })
                .slice(0, 4)
                .map(a => ({
                    id: a.id,
                    slug: a.slug || a.id,
                    title: a.title,
                    coverImage: a.coverImage || '',
                    category: a.category || '',
                    country: a.country || '',
                }));

            // JSON-LD
            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: current.title,
                description: current.summary || (current.content ? current.content.substring(0, 160) : ''),
                image: current.coverImage || undefined,
                author: { '@type': 'Person', name: current.authorName || 'Halalqu' },
                publisher: { '@type': 'Organization', name: 'Halalqu', url: 'https://halalqu.online' },
                datePublished: current.createdAt?.toDate?.()?.toISOString(),
                dateModified: current.updatedAt?.toDate?.()?.toISOString(),
                mainEntityOfPage: `https://halalqu.online/article/${canonicalSlug}`,
                keywords: Array.isArray(current.tags) ? current.tags.join(', ') : '',
            };
        }
    } catch (e) { /* ok */ }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ArticleClient id={docId} relatedArticles={relatedArticles} />
        </>
    );
}
