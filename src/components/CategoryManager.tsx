import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Category, setDoc, handleFirestoreError, OperationType } from '../firebase';
import { Search, Plus, Edit2, Trash2, Loader2, X, Save, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (editingCategory) {
      setFormData({ name: editingCategory.name, description: editingCategory.description || '' });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [editingCategory, isEditorOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use name as ID for easy rules lookup context
      const categoryId = formData.name.trim(); // Simplified ID naming
      const data = { name: formData.name, description: formData.description };
      
      if (editingCategory) {
        // If name changed, we really should delete and recreate if we want name as ID
        // But for simplicity in this admin portal, we'll just update if ID matches or add new
        await setDoc(doc(db, 'categories', categoryId), data);
        if (editingCategory.id !== categoryId) {
          await deleteDoc(doc(db, 'categories', editingCategory.id));
        }
      } else {
        await setDoc(doc(db, 'categories', categoryId), data);
      }
      setIsEditorOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This might break prompts using this category if they rely on dynamic validation.')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Categories</h1>
          <p className="text-gray-400 mt-1">Manage global categories for the prompt discovery engine.</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setIsEditorOpen(true); }}
          className="bg-brand-emerald hover:bg-emerald-600 text-bg-deep font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Add Category
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-emerald" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <motion.div
              layout
              key={cat.id}
              className="glass p-6 rounded-3xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-2xl">
                  <Tag className="text-brand-emerald" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-gray-500 text-sm">{cat.description || 'No description provided.'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingCategory(cat); setIsEditorOpen(true); }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all underline-none"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 p-8 rounded-[2rem] max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-brand-emerald"
                    placeholder="e.g. Scifi, Portrait"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description (Optional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-brand-emerald h-24 resize-none"
                    placeholder="Describe what this category covers..."
                  />
                </div>
                <button 
                  disabled={saving}
                  className="w-full bg-brand-emerald hover:bg-emerald-600 text-bg-deep font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
