import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { articles as defaultArticles } from '../data/articles';

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800; // max width/height

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
    reader.onerror = error => reject(error);
  });
};

export const ImageInput = ({ value, onChange, placeholder = "https://..." }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressImage(file);
      onChange(base64);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses gambar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md p-2 text-sm text-[var(--color-brand-charcoal)]"
      />
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">Atau upload gambar:</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
        />
        {loading && <span className="text-xs text-blue-500 font-medium">Memproses...</span>}
      </div>
    </div>
  );
};

export const VideoInput = ({ value, onChange, placeholder = "https://..." }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size limit to 5MB
    if (file.size > 5000000) {
      alert("Ukuran video terlalu besar. Maksimal 5MB untuk upload langsung ke database.");
      return;
    }
    
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      onChange(event.target?.result as string);
      setLoading(false);
    };
    reader.onerror = (error) => {
      console.error(error);
      alert('Gagal memproses video');
      setLoading(false);
    };
  };

  return (
    <div className="space-y-2">
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md p-2 text-sm text-[var(--color-brand-charcoal)]"
      />
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Atau upload video:</span>
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange}
            className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
          />
          {loading && <span className="text-xs text-blue-500 font-medium">Memproses...</span>}
        </div>
        <span className="text-[10px] text-orange-400 font-medium">*Upload video maksimal 5MB. Gunakan URL Youtube/Tiktok jika video lebih besar.</span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, loginWithGoogle, logout, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', text: '', rating: 5 });
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editArticleForm, setEditArticleForm] = useState({ title: '', category: '', content: '' });
  const [editArticleImage, setEditArticleImage] = useState('');
  const [productImage, setProductImage] = useState('');
  const [articleImage, setArticleImage] = useState('');

  useEffect(() => {
    // Dynamic Favicon and Title
    const qSettings = query(collection(db, 'settings'));
    const unsubSettings = onSnapshot(qSettings, (snap) => {
      snap.docs.forEach(doc => {
        if (doc.id === 'faviconUrl') {
          let link = document.getElementById("dynamic-favicon") as HTMLLinkElement;
          if (!link) {
            link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          }
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = doc.data().value;
        }
        if (doc.id === 'ogImageUrl') {
          const ogImage = document.getElementById("og-image") as HTMLMetaElement;
          if (ogImage) ogImage.content = doc.data().value;
          const twitterImage = document.getElementById("twitter-image") as HTMLMetaElement;
          if (twitterImage) twitterImage.content = doc.data().value;
        }
        if (doc.id === 'logoName') {
          document.title = doc.data().value;
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settings'));

    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Settings
    const unsubSettings = onSnapshot(query(collection(db, 'settings')), (snap) => {
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
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settings'));

    // Fetch Products
    const unsubProducts = onSnapshot(query(collection(db, 'products')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Fetch Testimonials
    const unsubTestimonials = onSnapshot(query(collection(db, 'testimonials')), (snap) => {
      setTestimonials(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'testimonials'));

    // Fetch FAQs
    const unsubFaqs = onSnapshot(query(collection(db, 'faqs')), (snap) => {
      setFaqs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'faqs'));

    // Fetch Articles
    const unsubArticles = onSnapshot(query(collection(db, 'articles')), (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'articles'));

    return () => {
      unsubSettings();
      unsubProducts();
      unsubTestimonials();
      unsubFaqs();
      unsubArticles();
    };
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <h1 className="font-serif text-3xl mb-8">Admin Isti Beauty</h1>
        <button 
          onClick={loginWithGoogle}
          className="px-6 py-3 bg-gray-900 text-white rounded text-sm uppercase tracking-widest hover:bg-gold transition"
        >
          Login Khusus Admin
        </button>
      </div>
    );
  }

  const saveSetting = async (key: string, value: string) => {
    try {
      if (value.length > 800000) {
        const CHUNK_SIZE = 800000;
        const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
        await setDoc(doc(db, 'settings', key), { value: 'chunked', totalChunks });
        for (let i = 0; i < totalChunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await setDoc(doc(db, 'settings', `${key}_chunk_${i}`), { value: chunk });
        }
      } else {
        await setDoc(doc(db, 'settings', key), { value });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `settings/${key}`);
    }
  };

  const addProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      await addDoc(collection(db, 'products'), {
        name: formData.get('name'),
        category: formData.get('category'),
        price: Number(formData.get('price')),
        imageUrl: formData.get('imageUrl'),
        shopeeLink: formData.get('shopeeLink'),
        tokpedLink: formData.get('tokpedLink')
      });
      form.reset();
      setProductImage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Hapus produk ini?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const addTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      await addDoc(collection(db, 'testimonials'), {
        name: formData.get('name'),
        text: formData.get('text'),
        rating: Number(formData.get('rating')),
      });
      form.reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'testimonials');
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!window.confirm('Hapus testimoni ini?')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
    }
  };

  const startEditTestimonial = (t: any) => {
    setEditingTestimonialId(t.id);
    setEditForm({ name: t.name, text: t.text, rating: t.rating });
  };

  const saveEditTestimonial = async () => {
    if (!editingTestimonialId) return;
    try {
      await setDoc(doc(db, 'testimonials', editingTestimonialId), editForm, { merge: true });
      setEditingTestimonialId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonials/${editingTestimonialId}`);
    }
  };

  const addFaq = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      await addDoc(collection(db, 'faqs'), {
        q: formData.get('q'),
        a: formData.get('a'),
      });
      form.reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'faqs');
    }
  };

  const deleteFaq = async (id: string) => {
    if (!window.confirm('Hapus FAQ ini?')) return;
    try {
      await deleteDoc(doc(db, 'faqs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `faqs/${id}`);
    }
  };

  const addArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      await addDoc(collection(db, 'articles'), {
        title: formData.get('title'),
        category: formData.get('category'),
        image: formData.get('image'),
        content: formData.get('content'),
      });
      form.reset();
      setArticleImage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'articles');
    }
  };

  const deleteArticle = async (id: string) => {
    if (!window.confirm('Hapus Artikel ini?')) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `articles/${id}`);
    }
  };

  const startEditArticle = (a: any) => {
    setEditingArticleId(a.id);
    setEditArticleForm({ title: a.title, category: a.category, content: a.content });
    setEditArticleImage(a.image || '');
  };

  const saveEditArticle = async () => {
    if (!editingArticleId) return;
    try {
      await setDoc(doc(db, 'articles', editingArticleId), { ...editArticleForm, image: editArticleImage }, { merge: true });
      setEditingArticleId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `articles/${editingArticleId}`);
    }
  };

  const seedArticles = async () => {
    if (!window.confirm('Muat ulang artikel bawaan? Tindakan ini akan menambahkan artikel default ke database.')) return;
    try {
      for (const a of defaultArticles) {
        await addDoc(collection(db, 'articles'), {
          title: a.title,
          category: a.category,
          image: a.image,
          content: a.content || 'Konten belum tersedia.'
        });
      }
      alert('Berhasil memuat artikel bawaan.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'articles');
    }
  };

  const seedTestimonials = async () => {
    if (!window.confirm('Tambahkan testimoni dummy?')) return;
    const dummies = [
      { name: "Siti Nurhaliza", text: "Wah, sejak pakai produk Isti Beauty jerawatku hilang tuntas! Kulit jadi lebih sehat dan kenyal. Harganya juga sangat terjangkau dengan kualitas premium. Pasti repurchase lagi nih!", rating: 5 },
      { name: "Rina Maharani", text: "Awalnya ragu buat nyoba karena kulitku sensitif banget. Tapi pas pakai rangkaian skincarenya, sumpah ngga bikin perih sama sekali. Mencerahkan secara natural dan bikin glowing abisss.", rating: 5 },
      { name: "Andini Putri", text: "Teksturnya enak banget, ringan dan cepat meresap. Sukses terus Isti Beauty! Makin pede kemana-mana walau cuma pake bare face.", rating: 4 }
    ];
    
    try {
      for (const t of dummies) {
        await addDoc(collection(db, 'testimonials'), t);
      }
      alert('Berhasil menambahkan testimoni contoh!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'testimonials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="font-serif text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex">
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Pengaturan Umum
            </button>
            <button 
              onClick={() => setActiveTab('landing')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'landing' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Teks Landing Page
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'products' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Kelola Produk
            </button>
            <button 
              onClick={() => setActiveTab('testimonials')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'testimonials' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Kelola Testimoni
            </button>
            <button 
              onClick={() => setActiveTab('faqs')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'faqs' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Kelola FAQ
            </button>
            <button 
              onClick={() => setActiveTab('articles')}
              className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm ${activeTab === 'articles' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Kelola Artikel
            </button>
            <button 
              onClick={() => window.open('/', '_blank')}
              className="w-full text-left px-3 py-2 rounded-md font-medium text-sm text-blue-600 hover:bg-blue-50 mt-4"
            >
              Lihat Website ↗
            </button>
          </nav>
        </div>

        <div className="flex-1 ml-8">
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Pengaturan Umum</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headline Utama</label>
                  <input 
                    type="text" 
                    placeholder="Pancarkan Cantik Alami, Raih Kulit Sehat Impian."
                    value={settings['headline'] || ''} 
                    onChange={(e) => setSettings({...settings, headline: e.target.value})}
                    onBlur={(e) => saveSetting('headline', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Hero</label>
                  <textarea 
                    placeholder="Kurasi produk skincare dan makeup pilihan untuk hasil riasan sempurna dan kulit yang terjaga nutrisinya."
                    value={settings['description'] || ''} 
                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                    onBlur={(e) => saveSetting('description', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor WhatsApp (Contoh: 628123456789)</label>
                  <input 
                    type="text" 
                    value={settings['whatsappNumber'] || ''} 
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                    onBlur={(e) => saveSetting('whatsappNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username Instagram (Lama, Opsional)</label>
                  <input 
                    type="text" 
                    value={settings['instagram'] || ''} 
                    onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                    onBlur={(e) => saveSetting('instagram', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Instagram</label>
                  <input 
                    type="text" 
                    value={settings['socialInstagram'] || ''} 
                    onChange={(e) => setSettings({...settings, socialInstagram: e.target.value})}
                    onBlur={(e) => saveSetting('socialInstagram', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Facebook</label>
                  <input 
                    type="text" 
                    value={settings['socialFacebook'] || ''} 
                    onChange={(e) => setSettings({...settings, socialFacebook: e.target.value})}
                    onBlur={(e) => saveSetting('socialFacebook', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL TikTok</label>
                  <input 
                    type="text" 
                    value={settings['socialTiktok'] || ''} 
                    onChange={(e) => setSettings({...settings, socialTiktok: e.target.value})}
                    onBlur={(e) => saveSetting('socialTiktok', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL YouTube</label>
                  <input 
                    type="text" 
                    value={settings['socialYoutube'] || ''} 
                    onChange={(e) => setSettings({...settings, socialYoutube: e.target.value})}
                    onBlur={(e) => saveSetting('socialYoutube', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Website / Logo Teks</label>
                  <input 
                    type="text" 
                    value={settings['logoName'] || ''} 
                    onChange={(e) => setSettings({...settings, logoName: e.target.value})}
                    onBlur={(e) => saveSetting('logoName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL (Gambar kecil di Tab Browser)</label>
                  <ImageInput 
                    value={settings['faviconUrl']} 
                    onChange={(val) => {
                      setSettings({...settings, faviconUrl: val});
                      saveSetting('faviconUrl', val);
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Share / OG Image (Untuk Tautan Sosial Media)</label>
                  <ImageInput 
                    value={settings['ogImageUrl']} 
                    onChange={(val) => {
                      setSettings({...settings, ogImageUrl: val});
                      saveSetting('ogImageUrl', val);
                    }} 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">*Perubahan langsung tersimpan otomatis.</p>
              </div>
            </div>
          )}

          {activeTab === 'landing' && (
            <div className="bg-white p-6 rounded shadow-sm border border-gray-100 mb-8 space-y-12">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Bagian "Kenapa Isti Beauty?"</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Judul Section</label>
                    <input type="text" value={settings['whyTitle'] || ''} onChange={(e) => setSettings({...settings, whyTitle: e.target.value})} onBlur={(e) => saveSetting('whyTitle', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Kenapa Isti Beauty?" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sub Judul</label>
                    <input type="text" value={settings['whySubtitle'] || ''} onChange={(e) => setSettings({...settings, whySubtitle: e.target.value})} onBlur={(e) => saveSetting('whySubtitle', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Nilai Kami" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Poin 1</label>
                    <input type="text" value={settings['whyItem1Title'] || ''} onChange={(e) => setSettings({...settings, whyItem1Title: e.target.value})} onBlur={(e) => saveSetting('whyItem1Title', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="BPOM Approved" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Poin 2</label>
                    <input type="text" value={settings['whyItem2Title'] || ''} onChange={(e) => setSettings({...settings, whyItem2Title: e.target.value})} onBlur={(e) => saveSetting('whyItem2Title', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Bahan Alami" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Poin 3</label>
                    <input type="text" value={settings['whyItem3Title'] || ''} onChange={(e) => setSettings({...settings, whyItem3Title: e.target.value})} onBlur={(e) => saveSetting('whyItem3Title', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Cruelty-Free" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Poin 4</label>
                    <input type="text" value={settings['whyItem4Title'] || ''} onChange={(e) => setSettings({...settings, whyItem4Title: e.target.value})} onBlur={(e) => saveSetting('whyItem4Title', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Konsultasi Ahli" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Bagian "Manfaat Maksimal"</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Judul Section</label>
                    <input type="text" value={settings['manfaatTitle'] || ''} onChange={(e) => setSettings({...settings, manfaatTitle: e.target.value})} onBlur={(e) => saveSetting('manfaatTitle', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Rasakan Perubahan Nyata" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sub Judul</label>
                    <input type="text" value={settings['manfaatSubtitle'] || ''} onChange={(e) => setSettings({...settings, manfaatSubtitle: e.target.value})} onBlur={(e) => saveSetting('manfaatSubtitle', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Manfaat Maksimal" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea value={settings['manfaatDesc'] || ''} onChange={(e) => setSettings({...settings, manfaatDesc: e.target.value})} onBlur={(e) => saveSetting('manfaatDesc', e.target.value)} className="w-full border rounded p-2 text-sm h-16" placeholder="Dengan pemakaian rutin..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gambar Samping (Opsional)</label>
                    <ImageInput 
                      value={settings['manfaatImage']} 
                      onChange={(val) => {
                        setSettings({...settings, manfaatImage: val});
                        saveSetting('manfaatImage', val);
                      }} 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2 mt-2">
                    <label className="block text-xs font-medium text-gray-700">4 Poin Manfaat</label>
                    <input type="text" value={settings['manfaat1'] || ''} onChange={(e) => setSettings({...settings, manfaat1: e.target.value})} onBlur={(e) => saveSetting('manfaat1', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Manfaat 1" />
                    <input type="text" value={settings['manfaat2'] || ''} onChange={(e) => setSettings({...settings, manfaat2: e.target.value})} onBlur={(e) => saveSetting('manfaat2', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Manfaat 2" />
                    <input type="text" value={settings['manfaat3'] || ''} onChange={(e) => setSettings({...settings, manfaat3: e.target.value})} onBlur={(e) => saveSetting('manfaat3', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Manfaat 3" />
                    <input type="text" value={settings['manfaat4'] || ''} onChange={(e) => setSettings({...settings, manfaat4: e.target.value})} onBlur={(e) => saveSetting('manfaat4', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Manfaat 4" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Bagian Teks Lainnya</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Koleksi Title</label>
                    <input type="text" value={settings['koleksiTitle'] || ''} onChange={(e) => setSettings({...settings, koleksiTitle: e.target.value})} onBlur={(e) => saveSetting('koleksiTitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Koleksi Subtitle</label>
                    <input type="text" value={settings['koleksiSubtitle'] || ''} onChange={(e) => setSettings({...settings, koleksiSubtitle: e.target.value})} onBlur={(e) => saveSetting('koleksiSubtitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video Title</label>
                    <input type="text" value={settings['videoTitle'] || ''} onChange={(e) => setSettings({...settings, videoTitle: e.target.value})} onBlur={(e) => saveSetting('videoTitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video Subtitle</label>
                    <input type="text" value={settings['videoSubtitle'] || ''} onChange={(e) => setSettings({...settings, videoSubtitle: e.target.value})} onBlur={(e) => saveSetting('videoSubtitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video (URL / Upload)</label>
                    <VideoInput 
                      value={settings['videoUrl']} 
                      onChange={(val) => {
                        setSettings({...settings, videoUrl: val});
                        saveSetting('videoUrl', val);
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Testimoni Title</label>
                    <input type="text" value={settings['testimoniTitle'] || ''} onChange={(e) => setSettings({...settings, testimoniTitle: e.target.value})} onBlur={(e) => saveSetting('testimoniTitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Testimoni Subtitle</label>
                    <input type="text" value={settings['testimoniSubtitle'] || ''} onChange={(e) => setSettings({...settings, testimoniSubtitle: e.target.value})} onBlur={(e) => saveSetting('testimoniSubtitle', e.target.value)} className="w-full border rounded p-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Tambah Produk Baru</h2>
                <form onSubmit={addProduct} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Nama Produk</label>
                    <input name="name" required className="w-full border rounded p-2" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                    <input name="category" required className="w-full border rounded p-2" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Harga (Angka saja)</label>
                    <input name="price" type="number" required className="w-full border rounded p-2" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Gambar Produk</label>
                    <ImageInput value={productImage} onChange={setProductImage} />
                    <input type="hidden" name="imageUrl" value={productImage} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Link Shopee</label>
                    <input name="shopeeLink" className="w-full border rounded p-2" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Link Tokopedia</label>
                    <input name="tokpedLink" className="w-full border rounded p-2" />
                  </div>
                  <div className="col-span-2 mt-2">
                    <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gold">
                      + Tambah Produk
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Daftar Produk</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Harga</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 flex items-center space-x-3">
                            <img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                            <span className="text-sm font-medium">{p.name}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{p.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">Rp {p.price.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-sm text-red-600 cursor-pointer" onClick={() => deleteProduct(p.id)}>
                            Hapus
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                            Tidak ada data produk
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Data Testimoni</h2>
                <button onClick={seedTestimonials} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 border border-blue-200 rounded hover:bg-blue-100">
                  Generate Testimoni Palsu
                </button>
              </div>

              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Tambah Testimoni Baru</h2>
                <form onSubmit={addTestimonial} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Nama Customer</label>
                    <input name="name" required className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Rating (1-5)</label>
                    <input name="rating" type="number" min="1" max="5" defaultValue="5" required className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Isi Testimoni</label>
                    <textarea name="text" required className="w-full border rounded p-2 text-sm h-20" />
                  </div>
                  <div className="col-span-2 mt-2">
                    <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gold transition-colors">
                      + Tambah 
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Daftar Testimoni</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/4">Nama</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Isi Testimoni</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">Rating</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {testimonials.map(t => (
                        <tr key={t.id}>
                          {editingTestimonialId === t.id ? (
                            <td colSpan={4} className="px-4 py-3">
                              <div className="flex flex-col space-y-2">
                                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border rounded p-1 text-sm" />
                                <input type="number" min="1" max="5" value={editForm.rating} onChange={(e) => setEditForm({...editForm, rating: Number(e.target.value)})} className="border rounded p-1 text-sm" />
                                <textarea value={editForm.text} onChange={(e) => setEditForm({...editForm, text: e.target.value})} className="border rounded p-1 text-sm w-full" />
                                <div className="flex space-x-2">
                                  <button onClick={saveEditTestimonial} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Simpan</button>
                                  <button onClick={() => setEditingTestimonialId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs">Batal</button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500"><p className="line-clamp-2">{t.text}</p></td>
                              <td className="px-4 py-3 text-sm text-yellow-500">★ {t.rating}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 cursor-pointer space-x-2">
                                <span className="text-blue-600 hover:underline" onClick={() => startEditTestimonial(t)}>Edit</span>
                                <span className="text-red-600 hover:underline" onClick={() => deleteTestimonial(t.id)}>Hapus</span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {testimonials.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                            Belum ada testimoni.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'faqs' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Tambah FAQ Baru</h2>
                <form onSubmit={addFaq} className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pertanyaan</label>
                    <input name="q" required className="w-full border rounded p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Jawaban</label>
                    <textarea name="a" required className="w-full border rounded p-2 text-sm h-20" />
                  </div>
                  <div className="mt-2">
                    <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gold transition-colors">
                      + Tambah 
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Daftar FAQ</h2>
                <div className="space-y-4">
                   {faqs.map(f => (
                     <div key={f.id} className="border rounded p-4 flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm mb-1">{f.q}</h4>
                          <p className="text-sm text-gray-600">{f.a}</p>
                        </div>
                        <button onClick={() => deleteFaq(f.id)} className="text-sm text-red-600 ml-4">Hapus</button>
                     </div>
                   ))}
                   {faqs.length === 0 && <p className="text-sm text-gray-500">Belum ada FAQ</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'articles' && (
             <div className="space-y-8">
               <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                 <h2 className="text-lg font-medium text-gray-900">Data Artikel</h2>
                 <button onClick={seedArticles} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 border border-blue-200 rounded hover:bg-blue-100">
                   Generate Artikel Bawaan
                 </button>
               </div>

               <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                 <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Tambah Artikel Baru</h2>
                 <form onSubmit={addArticle} className="grid grid-cols-2 gap-4">
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs text-gray-500 mb-1">Judul Artikel</label>
                     <input name="title" required className="w-full border rounded p-2 text-sm" />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                     <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                     <input name="category" required className="w-full border rounded p-2 text-sm" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-xs text-gray-500 mb-1">Gambar Artikel</label>
                     <ImageInput value={articleImage} onChange={setArticleImage} />
                     <input type="hidden" name="image" value={articleImage} />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-xs text-gray-500 mb-1">Konten Artikel</label>
                     <textarea name="content" required className="w-full border rounded p-2 text-sm h-40" />
                   </div>
                   <div className="col-span-2 mt-2">
                     <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gold transition-colors">
                       + Tambah Artikel
                     </button>
                   </div>
                 </form>
               </div>

                <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                 <h2 className="text-sm font-medium text-gray-900 mb-6 uppercase tracking-widest">Daftar Artikel</h2>
                 <div className="space-y-4">
                    {articles.map(a => (
                      <div key={a.id} className="border rounded p-4 flex flex-col space-y-4">
                         {editingArticleId === a.id ? (
                           <div className="flex flex-col space-y-2">
                             <input type="text" value={editArticleForm.title} onChange={(e) => setEditArticleForm({...editArticleForm, title: e.target.value})} className="border rounded p-1 text-sm bg-white" placeholder="Judul Artikel" />
                             <input type="text" value={editArticleForm.category} onChange={(e) => setEditArticleForm({...editArticleForm, category: e.target.value})} className="border rounded p-1 text-sm bg-white" placeholder="Kategori" />
                             <ImageInput value={editArticleImage} onChange={setEditArticleImage} placeholder="Gambar Artikel" />
                             <textarea value={editArticleForm.content} onChange={(e) => setEditArticleForm({...editArticleForm, content: e.target.value})} className="border rounded p-1 text-sm w-full h-24 bg-white" placeholder="Konten Artikel" />
                             <div className="flex space-x-2">
                               <button onClick={saveEditArticle} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Simpan</button>
                               <button onClick={() => setEditingArticleId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs">Batal</button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex justify-between items-center w-full">
                             <div className="flex items-center space-x-4">
                               <img src={a.image} className="w-16 h-16 object-cover rounded" alt="" />
                               <div>
                                 <h4 className="font-medium text-sm mb-1">{a.title}</h4>
                                 <p className="text-xs text-gray-500">{a.category}</p>
                               </div>
                             </div>
                             <div className="flex space-x-3">
                               <button onClick={() => startEditArticle(a)} className="text-sm text-blue-600 hover:underline">Edit</button>
                               <button onClick={() => deleteArticle(a.id)} className="text-sm text-red-600 hover:underline">Hapus</button>
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                    {articles.length === 0 && <p className="text-sm text-gray-500">Belum ada Artikel</p>}
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
