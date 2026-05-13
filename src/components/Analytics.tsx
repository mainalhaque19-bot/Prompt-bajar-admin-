import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, Prompt, query, orderBy, limit, handleFirestoreError, OperationType } from '../firebase';
import { TrendingUp, Copy, Eye, Heart, Trophy, Medal, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatNumber, cn } from '../lib/utils';

export default function Analytics() {
  const [trending, setTrending] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // We'll calculate trending by copiesCount + viewsCount
        const snapshot = await getDocs(collection(db, 'prompts'));
        const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
        
        const sorted = prompts.sort((a, b) => 
          ((b.copiesCount || 0) + (b.viewsCount || 0)) - ((a.copiesCount || 0) + (a.viewsCount || 0))
        ).slice(0, 5);

        setTrending(sorted);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'prompts');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-gray-400 mt-1">Deep dive into user behavior and trending content.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={24} />
            <h2 className="text-2xl font-bold">Top Performing Prompts</h2>
          </div>

          <div className="space-y-4">
            {trending.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-4 flex items-center gap-6 group hover:border-brand-emerald/30 transition-all cursor-pointer"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={prompt.imageUrl} alt={prompt.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-xl">
                    {i === 0 ? <Trophy className="text-yellow-500" size={20} /> : `#${i + 1}`}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{prompt.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Copy size={14} /> {formatNumber(prompt.copiesCount)}</span>
                    <span className="flex items-center gap-1"><Eye size={14} /> {formatNumber(prompt.viewsCount)}</span>
                  </div>
                </div>

                <div className="text-right pr-2">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Impact Score</div>
                  <div className="text-xl font-bold text-brand-emerald">+{formatNumber((prompt.copiesCount || 0) + (prompt.viewsCount || 0))}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories Analysis */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-emerald" size={24} />
            <h2 className="text-2xl font-bold">Growth Metrics</h2>
          </div>

          <div className="glass rounded-[2.5rem] p-8 h-full bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.05),transparent_60%)] relative overflow-hidden">
             <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg">Engagement Distribution</h4>
                  <div className="space-y-6">
                    {[
                      { label: 'Conversion (Views to Copies)', value: '18.4%', progress: 65, color: 'bg-indigo-500' },
                      { label: 'Retention Rate', value: '72.1%', progress: 85, color: 'bg-emerald-500' },
                      { label: 'Avg. Prompt Depth', value: '42 words', progress: 40, color: 'bg-orange-500' },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{metric.label}</span>
                          <span className="text-white font-bold">{metric.value}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.progress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={cn("h-full rounded-full", metric.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="glass-emerald p-6 rounded-2xl space-y-2">
                      <p className="text-brand-emerald font-bold text-sm uppercase tracking-wider">Top Category</p>
                      <h4 className="text-2xl font-bold">Cyberpunk</h4>
                      <p className="text-gray-400 text-sm">Dominating 34% of all user downloads this month.</p>
                   </div>
                </div>
             </div>
             
             <Medal className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 -rotate-12 pointer-events-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
