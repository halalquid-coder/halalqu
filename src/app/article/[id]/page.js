import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ArticleClient from './ArticleClient';

export async function generateMetadata({ params }) {
    try {
        const snap = await getDoc(doc(db, 'articles', params.id));
        if (snap.exists()) {
            const article = snap.data();
            const description = article.summary || (article.content ? article.content.substring(0, 160) + '...' : 'Baca artikel di Halalqu');
            return {
                title: `${article.title} | Halalqu`,
                description,
                openGraph: {
                    title: article.title,
                    description,
                    type: 'article',
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

export default function ArticlePage({ params }) {
    return <ArticleClient id={params.id} />;
}
