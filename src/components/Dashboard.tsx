import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, Prompt, handleFirestoreError, OperationType } from '../firebase';
import { TrendingUp, Copy, Eye, Heart, Database, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatNumber } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalViews: 0,
    totalCopies: 0,
    totalLikes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'prompts'));
        const prompts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
        
        const totals = prompts.reduce((acc, p) => ({
          totalPrompts: acc.totalPrompts + 1,
          totalViews: acc.totalViews + (p.viewsCount || 0),
          totalCopies: acc.totalCopies + (p.copiesCount || 0),
          totalLikes: acc.totalLikes + (p.likesCount || 0),
        }), { totalPrompts: 0, totalViews: 0, totalCopies: 0, totalLikes: 0 });

        setStats(totals);

        // Prepare chart data: Group by category
        const categories = prompts.reduce((acc: any, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {});

        setChartData(Object.entries(categories).map(([name, value]) => ({ name, value })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'prompts');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Prompts', value: stats.totalPrompts, icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Global Copies', value: stats.totalCopies, icon: Copy, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  if (loading) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Overview</h1>
        <p className="text-gray-400 mt-1">Real-time performance tracking for Prompt Bajar.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1">{formatNumber(stat.value)}</h3>
            <div className="absolute top-4 right-4 text-gray-700">
              <TrendingUp size={24} className="opacity-10" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass p-8 rounded-3xl space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Category Distribution</h3>
            <button className="text-xs font-semibold text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full uppercase tracking-wider">Live Metrics</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={formatNumber}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10B981' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Tips or Info */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="glass-emerald p-8 rounded-3xl space-y-6 flex flex-col justify-center"
        >
          <div className="w-14 h-14 bg-brand-emerald/20 flex items-center justify-center rounded-2xl mb-2">
            <ArrowUpRight className="text-brand-emerald" size={28} />
          </div>
          <h3 className="text-2xl font-bold leading-tight">Trending Insight</h3>
          <p className="text-gray-400">Prompts with the <span className="text-white font-medium">realistic</span> category are currently seeing a 40% higher conversion rate in copies this week.</p>
          <button className="w-full bg-brand-emerald py-4 px-6 rounded-2xl text-bg-deep font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
            View Analytics
          </button>
        </motion.div>
      </div>
    </div>
  );
}
