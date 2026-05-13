import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, deleteDoc, doc, Prompt, Category, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { Search, Plus, Edit2, Trash2, ExternalLink, Image as ImageIcon, Filter, Loader2, MoreVertical, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumber } from '../lib/utils';
import PromptEditor from './PromptEditor';

export default function PromptList() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>(['Trending', 'Fantasy', 'Cyberpunk', 'Nature', 'Anime', 'Realistic', 'Abstract']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoverImage, setHoverImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'));
    const unsubscribePrompts = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
      setPrompts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prompts');
    });

    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const dbCats = snapshot.docs.map(doc => (doc.data() as Category).name);
      // Merge with hardcoded ones to ensure they appear even if DB is empty
      const merged = Array.from(new Set(['Trending', 'Fantasy', 'Cyberpunk', 'Nature', 'Anime', 'Realistic', 'Abstract', ...dbCats]));
      setCategories(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => {
      unsubscribePrompts();
      unsubscribeCats();
    };
  }, []);

  const totalCategories = ['All', ...categories];

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'prompts', id));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `prompts/${id}`);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Prompts</h1>
          <p className="text-gray-400 mt-1">Manage and curate your AI prompt collection.</p>
        </div>
        <button 
          onClick={() => { setEditingPrompt(null); setIsEditorOpen(true); }}
          className="bg-brand-emerald hover:bg-emerald-600 text-bg-deep font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-emerald/20"
        >
          <Plus size={20} />
          Add New Prompt
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-emerald transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search titles or keywords..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {totalCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-4 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-emerald text-bg-deep' 
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-emerald" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPrompts.map((prompt) => (
              <motion.div
                layout
                key={prompt.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl overflow-hidden group flex flex-col h-full border border-white/5 hover:border-brand-emerald/30 transition-colors"
                onMouseEnter={() => setHoverImage(prompt.imageUrl)}
                onMouseLeave={() => setHoverImage(null)}
              >
                <div className="h-48 relative overflow-hidden bg-white/5">
                  <img 
                    src={prompt.imageUrl} 
                    alt={prompt.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-emerald text-bg-deep text-[10px] uppercase font-bold px-3 py-1 rounded-full">{prompt.category}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div>
                    <h3 className="text-xl font-bold line-clamp-1">{prompt.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mt-1 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-gray-500 bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1"><ExternalLink size={12} /> {formatNumber(prompt.viewsCount)}</div>
                    <div className="flex items-center gap-1"><Plus size={12} className="rotate-45" /> {formatNumber(prompt.copiesCount)}</div>
                    <div className="flex items-center gap-1"><ImageIcon size={12} /> {formatNumber(prompt.likesCount)}</div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setEditingPrompt(prompt); setIsEditorOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors font-semibold text-sm"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(prompt.id)}
                      className="w-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Large Image Preview Modal */}
      <AnimatePresence>
        {hoverImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-20 hidden lg:flex"
          >
             {/* Small preview on the side of cursor would be cool but a centered large version is safer for full preview */}
             <div className="mt-auto ml-auto p-4 glass rounded-2xl max-w-sm pointer-events-auto">
                <img src={hoverImage} alt="Preview" className="rounded-xl w-full h-auto shadow-2xl shadow-black h-[400px] object-contain" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <PromptEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        promptValue={editingPrompt} 
      />

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/20 flex items-center justify-center rounded-2xl mx-auto">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Delete Prompt?</h3>
                <p className="text-gray-400">This action is permanent and cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                  className="flex-1 py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 transition-colors font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
