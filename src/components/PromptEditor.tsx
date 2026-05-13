import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp, Prompt, Category, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { suggestCategory } from '../services/gemini';
import { X, Save, Wand2, Loader2, Image as ImageIcon, Type, Layout, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  promptValue: Prompt | null;
}

export default function PromptEditor({ isOpen, onClose, promptValue }: PromptEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    imageUrl: '',
    category: '',
  });
  const [categories, setCategories] = useState<string[]>(['Trending', 'Fantasy', 'Cyberpunk', 'Nature', 'Anime', 'Realistic', 'Abstract']);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const dbCats = snapshot.docs.map(doc => (doc.data() as Category).name);
      const merged = Array.from(new Set(['Trending', 'Fantasy', 'Cyberpunk', 'Nature', 'Anime', 'Realistic', 'Abstract', ...dbCats]));
      setCategories(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (promptValue) {
      setFormData({
        title: promptValue.title,
        prompt: promptValue.prompt,
        imageUrl: promptValue.imageUrl,
        category: promptValue.category,
      });
    } else {
      setFormData({
        title: '',
        prompt: '',
        imageUrl: '',
        category: categories[0] || 'Fantasy',
      });
    }
  }, [promptValue, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (promptValue) {
        await updateDoc(doc(db, 'prompts', promptValue.id), {
          ...formData,
        });
      } else {
        await addDoc(collection(db, 'prompts'), {
          ...formData,
          createdAt: serverTimestamp(),
          likesCount: 0,
          viewsCount: 0,
          copiesCount: 0,
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, promptValue ? OperationType.UPDATE : OperationType.CREATE, promptValue ? `prompts/${promptValue.id}` : 'prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!formData.prompt) return;
    setSuggesting(true);
    const category = await suggestCategory(formData.prompt);
    setFormData(prev => ({ ...prev, category }));
    setSuggesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-surface border border-white/10 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-5 md:p-8 space-y-6 md:space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{promptValue ? 'Edit Prompt' : 'New Prompt'}</h2>
              <p className="text-gray-400 mt-1">Configure your prompt details and visuals.</p>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl flex items-center justify-center transition-all"
            >
              <X size={24} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Display Title</label>
                <div className="relative group">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-emerald transition-colors" size={20} />
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="E.g. Neon Cyberpunk Samurai"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Prompt Content</label>
                <div className="relative group">
                  <AlignLeft className="absolute left-4 top-4 text-gray-500 group-focus-within:text-brand-emerald transition-colors" size={20} />
                  <textarea 
                    required
                    rows={4}
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter the full AI prompt here..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all font-medium resize-none"
                  />
                </div>
              </div>

              <div className="relative gap-4 grid grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Image URL</label>
                  <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-emerald transition-colors" size={20} />
                    <input 
                      required
                      type="url" 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Paste image link..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Category</label>
                  <div className="relative group flex gap-2">
                    <div className="relative flex-1">
                      <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-emerald transition-colors" size={20} />
                      <select 
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all font-medium appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className="bg-bg-deep">{cat}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggesting || !formData.prompt}
                      className="w-14 h-14 bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed group/magic"
                    >
                      {suggesting ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={24} className="group-hover/magic:rotate-12 transition-transform" /> }
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Image in form */}
            {formData.imageUrl && formData.imageUrl.startsWith('http') && (
               <div className="h-40 rounded-3xl overflow-hidden border border-white/10 bg-black/40">
                  <img src={formData.imageUrl} alt="Form Preview" className="w-full h-full object-contain" />
               </div>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors font-bold tracking-wide"
              >
                Discard
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 px-6 rounded-2xl bg-brand-emerald hover:bg-emerald-600 text-bg-deep font-bold tracking-wide transition-all shadow-xl shadow-brand-emerald/10 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                {promptValue ? 'Update Prompt' : 'Publish Prompt'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
