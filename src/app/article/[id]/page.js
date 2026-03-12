import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ArticleClient from './ArticleClient';

export async function generateMetadata({ params }) {
    try {
        const snap = await getDoc(doc(db, 'articles', params.id));
        if (snap.exists()) {
            const article = snap.data();
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
                    canonical: `https://halalqu.online/article/${params.id}`,
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
    // Fetch related articles server-side for faster loading
    let relatedArticles = [];
    try {
        const snap = await getDocs(collection(db, 'articles'));
        const currentSnap = await getDoc(doc(db, 'articles', params.id));
        const current = currentSnap.exists() ? currentSnap.data() : null;

        if (current) {
            relatedArticles = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(a => a.id !== params.id && a.status === 'published')
                .sort((a, b) => {
                    // Prioritize same category, then same country
                    let scoreA = 0, scoreB = 0;
                    if (a.category === current.category) scoreA += 2;
                    if (b.category === current.category) scoreB += 2;
                    if (a.country && a.country === current.country) scoreA += 1;
                    if (b.country && b.country === current.country) scoreB += 1;
                    return scoreB - scoreA || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                })
                .slice(0, 4)
                .map(a => ({ id: a.id, title: a.title, coverImage: a.coverImage || '', category: a.category || '', country: a.country || '' }));
        }
    } catch (e) { /* ok */ }

    // Build JSON-LD
    let jsonLd = null;
    try {
        const snap = await getDoc(doc(db, 'articles', params.id));
        if (snap.exists()) {
            const a = snap.data();
            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: a.title,
                description: a.summary || (a.content ? a.content.substring(0, 160) : ''),
                image: a.coverImage || undefined,
                author: { '@type': 'Person', name: a.authorName || 'Halalqu' },
                publisher: { '@type': 'Organization', name: 'Halalqu', url: 'https://halalqu.online' },
                datePublished: a.createdAt?.toDate?.()?.toISOString(),
                dateModified: a.updatedAt?.toDate?.()?.toISOString(),
                mainEntityOfPage: `https://halalqu.online/article/${params.id}`,
                keywords: Array.isArray(a.tags) ? a.tags.join(', ') : '',
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
            <ArticleClient id={params.id} relatedArticles={relatedArticles} />
        </>
    );
}
