export default function sitemap() {
  const baseUrl = 'https://halalqu.online';

  // 15 Kota Besar
  const cities = [
    "jakarta", "bandung", "surabaya", "medan", "makassar", 
    "yogyakarta", "semarang", "bali", "malang", "bogor", 
    "depok", "tangerang", "bekasi", "palembang", "batam"
  ];
  
  // 15 Kategori Populer
  const categories = [
    "sushi", "kopi", "ayam", "bakso", "mie-ayam", 
    "nasi-padang", "martabak", "dessert", "cafe", "restoran", 
    "street-food", "ramen", "seafood", "ayam-geprek", "makanan"
  ];

  const seoUrls = [];
  categories.forEach(cat => {
    cities.forEach(city => {
      seoUrls.push({
        url: `${baseUrl}/${cat}-halal/${city}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  });

  // Rute statis yang penting
  const staticUrls = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'always', priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/add-place`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/onboarding`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/product`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  // Total 225 kombinasi rute SEO dinamis + 5 statis
  return [...staticUrls, ...seoUrls];
}
