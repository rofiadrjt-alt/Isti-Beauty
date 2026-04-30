import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Leaf, ShieldCheck, HeartPulse, ChevronDown, Instagram, Play, X, ArrowRight, Facebook, Youtube, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { articles, Article } from '../data/articles';

const TiktokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.34 6.34 0 0 0 6.27-6.36V10.5a8.39 8.39 0 0 0 5.46 2V9a5.1 5.1 0 0 1-3.41-2.31z" />
  </svg>
);

export default function LandingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const qSettings = query(collection(db, 'settings'));
    const unsubSettings = onSnapshot(qSettings, (snap) => {
      const newSettings: Record<string, string> = {};
      const chunkedSettings: Record<string, { totalChunks: number, chunks: string[] }> = {};

      snap.docs.forEach(doc => {
        const id = doc.id;
        const data = doc.data();
        if (data.totalChunks) {
          chunkedSettings[id] = { totalChunks: data.totalChunks, chunks: chunkedSettings[id]?.chunks || [] };
        } else if (id.includes('_chunk_')) {
          const [baseKey, , chunkIndexStr] = id.split('_');
          const chunkIndex = parseInt(chunkIndexStr);
          if (!chunkedSettings[baseKey]) chunkedSettings[baseKey] = { totalChunks: 0, chunks: [] };
          chunkedSettings[baseKey].chunks[chunkIndex] = data.value;
        } else {
          newSettings[id] = data.value;
        }
      });

      for (const [key, meta] of Object.entries(chunkedSettings)) {
        if (meta.totalChunks > 0 && meta.chunks.length === meta.totalChunks && !meta.chunks.includes(undefined as any)) {
          newSettings[key] = meta.chunks.join('');
        }
      }

      setSettings(newSettings);

      if (newSettings['logoName']) document.title = newSettings['logoName'];
      
      let link = document.getElementById("dynamic-favicon") as HTMLLinkElement;
      if (!link) {
        link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      }
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (newSettings['faviconUrl']) {
        link.href = newSettings['faviconUrl'];
      }
      if (newSettings['ogImageUrl']) {
        const ogImage = document.getElementById("og-image") as HTMLMetaElement;
        if (ogImage) ogImage.content = newSettings['ogImageUrl'];
        const twitterImage = document.getElementById("twitter-image") as HTMLMetaElement;
        if (twitterImage) twitterImage.content = newSettings['ogImageUrl'];
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settings'));

    const qTestimonials = query(collection(db, 'testimonials'));
    const unsubTestimonials = onSnapshot(qTestimonials, (snap) => {
      setTestimonials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'testimonials'));

    const qFaqs = query(collection(db, 'faqs'));
    const unsubFaqs = onSnapshot(qFaqs, (snap) => {
      setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'faqs'));

    const qArticles = query(collection(db, 'articles'));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setDbArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'articles'));

    return () => {
      unsubProducts();
      unsubSettings();
      unsubTestimonials();
      unsubFaqs();
      unsubArticles();
    };
  }, []);

  useEffect(() => {
    if (settings['logoName']) {
      document.title = settings['logoName'];
    }
  }, [settings]);

  const headline = settings['headline'] || 'Pancarkan Cantik Alami, Raih Kulit Sehat Impian.';
  const description = settings['description'] || 'Kurasi produk skincare dan makeup pilihan untuk hasil riasan sempurna dan kulit yang terjaga nutrisinya.';
  const whatsappNumber = settings['whatsappNumber'] || '';

  const whyChooseUs = [
    { icon: ShieldCheck, title: settings['whyItem1Title'] || 'BPOM Approved' },
    { icon: Leaf, title: settings['whyItem2Title'] || 'Bahan Alami' },
    { icon: HeartPulse, title: settings['whyItem3Title'] || 'Cruelty-Free' },
    { icon: CheckCircle2, title: settings['whyItem4Title'] || 'Pemesanan Mudah' },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : [
    { q: 'Apakah produk Isti Beauty aman untuk kulit sensitif?', a: 'Ya, formulasi kami telah teruji iritasi dan minim bahan pemicu alergi, sangat cocok untuk kulit sensitif.' },
    { q: 'Bagaimana cara pengiriman produknya?', a: 'Kami bekerja sama dengan kurir terpercaya. Pesanan diproses H+1 setelah pembayaran dikonfirmasi.' },
    { q: 'Bagaimana cara memesan produk?', a: 'Anda dapat menekan tombol Beli Produk yang akan langsung terhubung ke WhatsApp Admin kami.' },
  ];

  const displayArticles = dbArticles.length > 0 ? dbArticles : articles;

  const handleConsultClick = () => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProductClick = (product: any, e?: React.MouseEvent) => {
    // If they clicked the Shopee or Tokopedia links, handled elsewhere
    if (whatsappNumber) {
      const message = `Halo Admin Isti Beauty, saya tertarik untuk membeli produk *${product.name}*. Apakah produk ini masih tersedia?`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('Nomor WhatsApp belum dikonfigurasi oleh admin.');
    }
  };

  return (
    <div className="min-h-screen selection:bg-pink-100 selection:text-pink-900 overflow-x-hidden">
      <nav aria-label="Navigasi Utama" className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-serif text-xl md:text-3xl font-medium tracking-wide text-[var(--color-brand-charcoal)] truncate">
                {settings['logoName'] || 'Isti Beauty'}
              </div>
            </div>
            <div className="hidden md:flex space-x-10 flex-shrink-0">
              <a href="#home" className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-accent transition-colors">Home</a>
              <a href="#collection" className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-accent transition-colors">Koleksi</a>
              <a href="#tips" className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-accent transition-colors">Tips</a>
              <a href="#testimonials" className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-accent transition-colors">Testimoni</a>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 md:gap-0">
              <button onClick={handleConsultClick} className="bg-accent text-white px-4 py-2 md:px-7 md:py-3 rounded-full text-[10px] md:text-xs uppercase tracking-widest md:tracking-[0.15em] hover:bg-darkpink transition-all shadow-md shadow-pink-200 whitespace-nowrap">
                Beli Produk
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden text-[var(--color-brand-charcoal)] p-1 ml-1 hover:bg-pink-50 rounded-full transition-colors flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-md border-t border-pink-50 overflow-hidden absolute top-full w-full left-0 shadow-lg"
            >
              <div className="flex flex-col px-6 py-6 space-y-6">
                <a onClick={() => setIsMobileMenuOpen(false)} href="#home" className="text-sm uppercase tracking-widest text-[var(--color-brand-charcoal)] hover:text-accent transition-colors">Home</a>
                <a onClick={() => setIsMobileMenuOpen(false)} href="#collection" className="text-sm uppercase tracking-widest text-[var(--color-brand-charcoal)] hover:text-accent transition-colors">Koleksi</a>
                <a onClick={() => setIsMobileMenuOpen(false)} href="#tips" className="text-sm uppercase tracking-widest text-[var(--color-brand-charcoal)] hover:text-accent transition-colors">Tips</a>
                <a onClick={() => setIsMobileMenuOpen(false)} href="#testimonials" className="text-sm uppercase tracking-widest text-[var(--color-brand-charcoal)] hover:text-accent transition-colors">Testimoni</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
      <section id="home" aria-label="Halaman Utama" className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 lg:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-softpink rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>

        <div className="w-full md:w-[55%] pr-0 md:pr-16 z-10 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 text-[var(--color-brand-charcoal)]">
              {headline}
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-base md:text-lg text-[var(--color-brand-text-light)] mb-10 font-light leading-relaxed max-w-xl mx-auto md:mx-0"
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <a href="#collection" className="bg-accent text-white px-8 py-4 rounded-full text-xs uppercase tracking-[0.15em] hover:bg-darkpink transition-all shadow-lg shadow-pink-200 w-full sm:w-auto text-center">
              Eksplor Koleksi
            </a>
            <button onClick={handleConsultClick} className="text-[var(--color-brand-charcoal)] px-8 py-4 rounded-full text-xs uppercase tracking-[0.15em] hover:bg-softpink transition-all w-full sm:w-auto text-center border border-gray-100">
              Beli Produk
            </button>
          </motion.div>
        </div>
        <div className="md:w-[45%] mt-16 md:mt-0 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="relative w-full aspect-[4/5] md:aspect-[3/4] max-w-md mx-auto"
          >
             <div className="absolute inset-0 bg-softpink rounded-[40px] rotate-6 transform scale-105 -z-10"></div>
             <img 
               loading="lazy"
               src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800" 
               alt="Isti Beauty Skincare" 
               className="w-full h-full object-cover rounded-[40px] shadow-2xl shadow-pink-100 border-4 border-white" 
             />
          </motion.div>
        </div>
      </section>

      {/* Trust Elements Banner */}
      <div className="bg-white border-y border-pink-50 py-8 relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap justify-center gap-6 md:gap-16 text-center">
            {[
              settings['trust1'] || '100% Original', 
              settings['trust2'] || 'BPOM Certified', 
              settings['trust3'] || 'Halal MUI', 
              settings['trust4'] || 'Dermatologist Tested'
            ].map((trust, i) => (
              <div key={i} className="flex items-center space-x-2 text-[var(--color-brand-charcoal)]/80">
                <ShieldCheck className="text-accent" size={20} />
                <span className="font-medium text-xs md:text-sm tracking-wide uppercase">{trust}</span>
              </div>
            ))}
        </div>
      </div>

      <section className="bg-softpink/50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 md:mb-24">
            <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['whySubtitle'] || 'Nilai Kami'}</span>
            <h2 className="text-3xl md:text-5xl mb-6">{settings['whyTitle'] || 'Kenapa Isti Beauty?'}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {whyChooseUs.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-white shadow-sm shadow-pink-100 flex items-center justify-center mb-6 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-500">
                  <item.icon size={32} strokeWidth={1} />
                </div>
                <h3 className="font-serif text-lg md:text-xl text-[var(--color-brand-charcoal)]">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Manfaat Section */}
      <section id="manfaat" className="py-24 md:py-32 bg-white relative overflow-hidden flex items-center">
        <div className="absolute right-0 top-0 -z-10 w-[500px] h-[500px] bg-softpink rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/4"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
               <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['manfaatSubtitle'] || 'Manfaat Maksimal'}</span>
               <h2 className="text-3xl md:text-5xl mb-6 text-[var(--color-brand-charcoal)]">{settings['manfaatTitle'] || 'Rasakan Perubahan Nyata pada Kulitmu'}</h2>
               <p className="text-[var(--color-brand-text-light)] font-light leading-relaxed mb-10 md:text-lg">
                 {settings['manfaatDesc'] || 'Dengan pemakaian rutin, rangkaian produk Isti Beauty diformulasikan untuk menutrisi hingga lapisan kulit terdalam, memberikan hasil yang efektif dan aman untuk jangka panjang.'}
               </p>
               <ul className="space-y-6">
                 {[
                   settings['manfaat1'] || 'Mencerahkan dan meratakan warna kulit yang kusam.',
                   settings['manfaat2'] || 'Menyamarkan noda hitam dan bekas jerawat secara bertahap.',
                   settings['manfaat3'] || 'Memberikan hidrasi ekstra agar kulit terasa kenyal dan glowing.',
                   settings['manfaat4'] || 'Memperbaiki dan memperkuat skin barrier secara alami.'
                 ].map((manfaat, idx) => (
                   <li key={idx} className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow">
                     <span className="flex-shrink-0 w-8 h-8 rounded-full bg-softpink text-accent flex items-center justify-center mr-4 mt-0.5">
                       <CheckCircle2 size={18} strokeWidth={2.5} />
                     </span>
                     <span className="text-[var(--color-brand-charcoal)] font-medium leading-relaxed">{manfaat}</span>
                   </li>
                 ))}
               </ul>
            </div>
            <div className="md:w-1/2 relative">
                <div className="absolute inset-0 bg-accent rounded-[40px] rotate-3 transform scale-105 -z-10 opacity-20"></div>
                <img loading="lazy" src={settings['manfaatImage'] || "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800"} alt="Manfaat Skincare" className="rounded-[40px] shadow-2xl shadow-pink-100 w-full object-cover aspect-[4/5] border-4 border-white" />
            </div>
          </div>
        </div>
      </section>

      <section id="collection" className="py-24 md:py-32 w-full max-w-7xl mx-auto px-6 lg:px-12 relative border-t border-pink-50 overflow-hidden">
        <div className="absolute left-0 top-1/2 -z-10 w-96 h-96 bg-softpink rounded-full blur-3xl opacity-40 -translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-0">
          <div className="text-left">
            <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['koleksiSubtitle'] || 'Etalase Kami'}</span>
            <h2 className="text-3xl md:text-5xl">{settings['koleksiTitle'] || 'Koleksi Eksklusif'}</h2>
          </div>
          <p className="text-[var(--color-brand-text-light)] font-light max-w-xs text-left md:text-right mt-6 md:mt-0 text-sm md:text-base leading-relaxed">
            {settings['koleksiDesc'] || 'Pancaran kecantikan alami dari kurasi bahan kualitas premium.'}
          </p>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center text-[var(--color-brand-text-light)] py-20 bg-white rounded-2xl border border-pink-50">
            Belum ada produk. Silakan tambahkan dari Admin Dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-16">
            {products.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={(e) => handleProductClick(product, e)}
                className="group cursor-pointer flex flex-col p-5 rounded-[40px] hover:bg-white transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(232,165,176,0.3)]"
              >
                <div className="relative overflow-hidden mb-6 bg-pink-50 aspect-[4/5] rounded-[2rem] sm:rounded-[3rem]">
                  <img loading="lazy" src={product.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'} alt={product.name} className="object-cover w-full h-full transform group-hover:scale-105 transition duration-700 ease-out" />
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-500 flex flex-col items-center justify-center space-y-3 p-4">
                    {product.shopeeLink && (
                      <a href={product.shopeeLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white text-[var(--color-brand-charcoal)] px-6 py-3 rounded-full text-xs uppercase tracking-[0.1em] hover:bg-accent hover:text-white transition shadow-sm w-40 text-center font-medium">Shopee</a>
                    )}
                    {product.tokpedLink && (
                      <a href={product.tokpedLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white text-[var(--color-brand-charcoal)] px-6 py-3 rounded-full text-xs uppercase tracking-[0.1em] hover:bg-accent hover:text-white transition shadow-sm w-40 text-center font-medium">Tokopedia</a>
                    )}
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs text-accent uppercase tracking-widest mb-2 font-medium">{product.category}</p>
               <h3 className="font-serif text-xl md:text-2xl mb-2 text-[var(--color-brand-charcoal)] group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-[var(--color-brand-charcoal)] tracking-wide font-light">Rp {product.price?.toLocaleString('id-ID')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Video / Promo Section */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
             <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['videoSubtitle'] || 'Galeri Video'}</span>
             <h2 className="text-3xl md:text-5xl mb-6">{settings['videoTitle'] || 'Cerita di Balik Cantikmu'}</h2>
             <p className="text-[var(--color-brand-text-light)] font-light leading-relaxed">
               {settings['videoDesc'] || 'Temukan inspirasi dan proses di balik pembuatan produk yang aman dan efektif untuk merawat kecantikan naturalmu.'}
             </p>
          </div>
          <div className="relative rounded-[40px] overflow-hidden aspect-video shadow-2xl shadow-pink-100 group">
             <img loading="lazy" src={settings['videoImage'] || "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=1600"} alt="Isti Beauty Video" className="w-full h-full object-cover transition duration-1000 group-hover:scale-105" />
             {settings['videoUrl'] ? (
               settings['videoUrl'].startsWith('data:') ? (
                 <button onClick={() => setIsVideoModalOpen(true)} aria-label="Tonton Video" className="absolute inset-0 bg-[var(--color-brand-charcoal)]/30 flex flex-col items-center justify-center transition-colors group-hover:bg-[var(--color-brand-charcoal)]/40 w-full h-full border-none">
                   <div aria-hidden="true" className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-110">
                     <Play className="text-white fill-current ml-2" size={40} />
                   </div>
                   <p className="text-white font-medium tracking-widest uppercase text-sm mt-8 drop-shadow-md">{settings['videoButton'] || 'Tonton Video Inspirasi Kami'}</p>
                 </button>
               ) : (
                 <a href={settings['videoUrl']} target="_blank" rel="noreferrer" aria-label="Tonton Video" className="absolute inset-0 bg-[var(--color-brand-charcoal)]/30 flex flex-col items-center justify-center transition-colors group-hover:bg-[var(--color-brand-charcoal)]/40">
                   <div aria-hidden="true" className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-110">
                     <Play className="text-white fill-current ml-2" size={40} />
                   </div>
                   <p className="text-white font-medium tracking-widest uppercase text-sm mt-8 drop-shadow-md">{settings['videoButton'] || 'Tonton Video Inspirasi Kami'}</p>
                 </a>
               )
             ) : (
               <div className="absolute inset-0 bg-[var(--color-brand-charcoal)]/30 flex flex-col items-center justify-center transition-colors group-hover:bg-[var(--color-brand-charcoal)]/40">
                 <div aria-hidden="true" className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-110">
                   <Play className="text-white fill-current ml-2" size={40} />
                 </div>
                 <p className="text-white font-medium tracking-widest uppercase text-sm mt-8 drop-shadow-md">{settings['videoButton'] || 'Tonton Video Inspirasi Kami'}</p>
               </div>
             )}
          </div>
        </div>
      </section>

      <section id="tips" className="bg-softpink/30 py-24 md:py-32 border-t border-b border-pink-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 md:mb-24">
            <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['journalSubtitle'] || 'Edukasi & Inspirasi'}</span>
            <h2 className="text-3xl md:text-5xl">{settings['journalTitle'] || 'Beauty Journal'}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayArticles.map((article, idx) => (
               <motion.div 
                 key={article.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.5, delay: idx * 0.1 }}
                 className="bg-white rounded-[30px] overflow-hidden border border-pink-50 shadow-sm hover:shadow-xl hover:shadow-pink-100/50 transition-all group flex flex-col cursor-pointer"
                 onClick={() => setSelectedArticle(article)}
               >
                 <div className="relative h-56 overflow-hidden">
                   <img loading="lazy" src={article.image} alt={article.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                   <div className="absolute top-4 left-4">
                     <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-[#d18895] font-semibold shadow-sm">{article.category}</span>
                   </div>
                 </div>
                 <div className="p-8 flex flex-col flex-grow">
                   <h3 className="font-serif text-xl mb-4 text-[var(--color-brand-charcoal)] group-hover:text-accent transition-colors leading-snug">{article.title}</h3>
                   <div className="mt-auto pt-4 flex items-center text-accent text-sm font-medium group-hover:text-darkpink">
                     <span className="uppercase tracking-widest text-xs">Baca Artikel</span>
                     <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                   </div>
                 </div>
               </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-12"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedArticle(null)}></div>
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-white w-full max-w-4xl max-h-full rounded-[30px] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-[var(--color-brand-charcoal)] hover:bg-white hover:scale-110 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
              
              <div className="overflow-y-auto w-full custom-scrollbar">
                <div className="w-full h-64 md:h-80 relative flex-shrink-0">
                  <img loading="lazy" src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-charcoal)]/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                    <span className="bg-accent/80 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold mb-4 inline-block">{selectedArticle.category}</span>
                    <h2 className="text-white text-3xl md:text-4xl font-serif max-w-2xl leading-tight">{selectedArticle.title}</h2>
                  </div>
                </div>
                
                <div className="p-8 md:p-12 md:py-16 max-w-3xl mx-auto">
                  <div className="prose prose-pink prose-img:rounded-xl prose-headings:font-serif text-[var(--color-brand-charcoal)]/80 font-light leading-relaxed">
                    {selectedArticle.content}
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-pink-100 flex items-center justify-between">
                     <p className="text-sm text-gray-500 uppercase tracking-widest">Share this article</p>
                     <div className="flex space-x-4">
                       <button aria-label="Bagikan ke Facebook" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                       </button>
                       <button aria-label="Bagikan ke LinkedIn" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors">
                         <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                       </button>
                     </div>
                  </div>
                </div>
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && settings['videoUrl'] && settings['videoUrl'].startsWith('data:') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black"
            >
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X size={20} />
              </button>
              <video 
                src={settings['videoUrl']} 
                controls 
                autoPlay 
                className="w-full h-auto max-h-[85vh]"
                controlsList="nodownload"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section id="testimonials" className="py-24 md:py-32 w-full bg-white relative text-center overflow-hidden">
        <div className="absolute right-0 top-1/4 -z-10 w-80 h-80 bg-softpink rounded-full blur-3xl opacity-50 translate-x-1/2"></div>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['testimoniSubtitle'] || 'Cerita Mereka'}</span>
          <h2 className="text-3xl md:text-5xl mb-16 md:mb-24">{settings['testimoniTitle'] || 'Real Results'}</h2>
          
          {testimonials.length === 0 ? (
             <p className="text-[var(--color-brand-text-light)] font-light bg-softpink/30 py-10 rounded-2xl">Belum ada testimoni.</p>
          ) : (
            <div className="relative w-full max-w-3xl mx-auto">
              <div className="overflow-hidden py-10">
                <div 
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
                >
                  {testimonials.map((testi, idx) => (
                    <div key={testi.id} className="w-full flex-shrink-0 px-4">
                      <article className="flex flex-col items-center bg-white p-8 md:p-14 rounded-[40px] shadow-[0_15px_50px_-12px_rgba(232,165,176,0.2)] border border-pink-50 relative h-full transition-all duration-300">
                        <div className="flex text-accent mb-8 space-x-1">
                          {Array.from({length: testi.rating || 5}).map((_, i) => (
                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          ))}
                        </div>
                        <p className="font-serif text-2xl md:text-3xl text-[var(--color-brand-charcoal)] mb-10 italic leading-relaxed text-center">"{testi.text}"</p>
                        <p className="text-sm uppercase tracking-[0.2em] text-accent font-semibold">— {testi.name}</p>
                      </article>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              {testimonials.length > 1 && (
                <>
                  <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-10 hidden md:block">
                    <button 
                      onClick={() => setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent shadow-lg border border-pink-50 hover:bg-accent hover:text-white transition-all transform hover:-translate-x-1"
                      aria-label="Previous Testimonial"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-10 hidden md:block">
                    <button 
                      onClick={() => setActiveTestimonial(prev => (prev + 1) % testimonials.length)}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent shadow-lg border border-pink-50 hover:bg-accent hover:text-white transition-all transform hover:translate-x-1"
                      aria-label="Next Testimonial"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex justify-center space-x-3 mt-4">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTestimonial(idx)}
                        className={`transition-all duration-500 rounded-full ${activeTestimonial === idx ? 'w-8 h-2.5 bg-accent' : 'w-2.5 h-2.5 bg-pink-200 hover:bg-pink-300'}`}
                        aria-label={`Go to testimonial ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 md:py-32 bg-softpink/40">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 md:mb-24">
            <span className="text-accent text-xs uppercase tracking-[0.2em] font-medium mb-3 block">{settings['faqSubtitle'] || 'Info Tambahan'}</span>
            <h2 className="text-3xl md:text-5xl">{settings['faqTitle'] || 'Pertanyaan Umum'}</h2>
          </div>
          
          <div className="space-y-4">
            {displayFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-2xl border ${activeFaq === idx ? 'border-pink-200 shadow-md shadow-pink-100/50' : 'border-white'} p-6 md:p-8 cursor-pointer transition-all duration-300`} 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                role="button"
                aria-expanded={activeFaq === idx}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveFaq(activeFaq === idx ? null : idx);
                  }
                }}
              >
                <div className="flex justify-between items-center group">
                  <h3 className="font-sans font-medium text-[var(--color-brand-charcoal)] group-hover:text-accent transition-colors pr-6 text-lg">{faq.q}</h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeFaq === idx ? 'bg-accent text-white' : 'bg-softpink text-accent'}`}>
                    <ChevronDown className={`transform transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} size={16} strokeWidth={2.5} />
                  </div>
                </div>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[var(--color-brand-text-light)] font-light text-sm md:text-base leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white text-center px-6">
        <h2 className="font-serif text-4xl md:text-5xl mb-6 text-[var(--color-brand-charcoal)]">{settings['ctaTitle'] || 'Mulai Perjalanan Cantikmu'}</h2>
        <p className="text-[var(--color-brand-text-light)] mb-10 max-w-md mx-auto font-light">{settings['ctaDesc'] || 'Dapatkan produk original dan rasakan manfaatnya sekarang juga.'}</p>
        <button onClick={handleConsultClick} className="bg-accent text-white px-6 py-4 md:px-10 md:py-5 rounded-full text-xs md:text-sm uppercase tracking-widest md:tracking-[0.15em] hover:bg-darkpink transition-all shadow-xl shadow-pink-200 hover:-translate-y-1 w-full sm:w-auto max-w-[280px] sm:max-w-none mx-auto break-words">
          {settings['ctaButton'] || 'Beli Produk Sekarang'}
        </button>
      </section>
      </main>

      <footer className="bg-softpink border-t border-pink-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="col-span-1 md:col-span-5">
              <h2 className="font-serif text-4xl mb-6 text-[var(--color-brand-charcoal)]">{settings['logoName'] || 'Isti Beauty'}</h2>
              <p className="text-[var(--color-brand-charcoal)]/70 font-light max-w-sm mb-8 leading-relaxed">
                {settings['footerDesc'] || 'Kecantikan yang abadi dimulai dari kulit yang sehat. Kami berdedikasi untuk memberikan formulasi terbaik.'}
              </p>
              <div className="flex space-x-3 mt-6">
                {settings['socialInstagram'] && (
                   <a href={settings['socialInstagram']} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors" aria-label="Instagram">
                     <Instagram size={18} />
                   </a>
                )}
                {settings['socialFacebook'] && (
                   <a href={settings['socialFacebook']} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors" aria-label="Facebook">
                     <Facebook size={18} />
                   </a>
                )}
                {settings['socialTiktok'] && (
                   <a href={settings['socialTiktok']} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors" aria-label="TikTok">
                     <TiktokIcon size={18} />
                   </a>
                )}
                {settings['socialYoutube'] && (
                   <a href={settings['socialYoutube']} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors" aria-label="YouTube">
                     <Youtube size={18} />
                   </a>
                )}
                {settings['instagram'] && !settings['socialInstagram'] && (
                   <a href={`https://instagram.com/${settings['instagram']}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-pink-200 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors">
                     <Instagram size={18} />
                   </a>
                )}
              </div>
            </div>
            <div className="col-span-1 md:col-span-3 md:col-start-7">
              <h4 className="uppercase tracking-[0.2em] text-xs mb-6 text-[var(--color-brand-charcoal)] font-semibold">Tautan Cepat</h4>
              <ul className="space-y-4 font-light text-[var(--color-brand-charcoal)]/80">
                <li><a href="#home" className="hover:text-accent transition">Halaman Utama</a></li>
                <li><a href="#collection" className="hover:text-accent transition">Koleksi Produk</a></li>
                <li><a href="#tips" className="hover:text-accent transition">Beauty Journal</a></li>
                <li><Link to="/admin" className="hover:text-accent transition">Admin Akses</Link></li>
              </ul>
            </div>
            <div className="col-span-1 md:col-span-3">
              <h4 className="uppercase tracking-[0.2em] text-xs mb-6 text-[var(--color-brand-charcoal)] font-semibold">Layanan</h4>
              <ul className="space-y-4 font-light text-[var(--color-brand-charcoal)]/80">
                <li>Senin - Jumat</li>
                <li>Pukul 09:00 - 17:00 WIB</li>
                {whatsappNumber && <li className="pt-2"><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">Order Via WA</a></li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-pink-200/60 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[var(--color-brand-charcoal)]/50 tracking-widest uppercase">
            <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Isti Beauty. All Rights Reserved.</p>
            <p>Designed with elegance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}
