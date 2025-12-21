import { motion } from 'framer-motion';
import { Users, Trophy, BarChart3, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { KPICard } from './KPICard';
import type { AwardConfigType, Category, Candidate } from '../../types';

interface OverviewTabProps {
    stats: any;
    config: AwardConfigType;
}

export const OverviewTab = ({ stats, config }: OverviewTabProps) => {
    if (!stats || !config) return (
        <div className="space-y-8 animate-pulse p-4 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 shadow-lg"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 h-[500px] bg-white/5 rounded-3xl border border-white/5 shadow-xl"></div>
                <div className="lg:col-span-5 h-[500px] bg-white/5 rounded-3xl border border-white/5 shadow-xl"></div>
            </div>
        </div>
    );

    // 1. Chart Data
    const categoryData = config.awards.map((cat: Category) => ({
        name: cat.title,
        shortName: cat.title.length > 25 ? cat.title.substring(0, 25) + '...' : cat.title,
        votes: stats.detail[cat.id] || 0
    })).sort((a, b) => b.votes - a.votes);

    // 2. Top 5 Candidates
    const candidateCounts: Record<string, number> = {};

    // Helper to find candidate info
    const processedCandidates = new Map();
    config.awards.forEach((cat: Category) => {
        cat.candidates.forEach((c: Candidate) => {
            processedCandidates.set(c.value, { ...c, categoryTitle: cat.title });
        });
    });

    stats.raw.forEach((vote: any) => {
        if (vote.votes) {
            Object.values(vote.votes).forEach((val: any) => {
                if (typeof val === 'string') {
                    candidateCounts[val] = (candidateCounts[val] || 0) + 1;
                }
            });
        }
    });

    const topCandidates = Object.keys(candidateCounts)
        .map(key => {
            const info = processedCandidates.get(key);
            return {
                id: key,
                name: info?.label || key,
                emoji: info?.emoji || '❔',
                category: info?.categoryTitle || 'Desconocido',
                votes: candidateCounts[key]
            };
        })
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    icon={<Users size={24} />}
                    label="Votos Totales"
                    value={stats.totalVotes}
                    color="text-primary" bg="bg-primary/10 border-primary/20"
                />
                <KPICard
                    icon={<Trophy size={24} />}
                    label="Categorías"
                    value={config.awards.length}
                    color="text-secondary" bg="bg-secondary/10 border-secondary/20"
                />
                <KPICard
                    icon={<BarChart3 size={24} />}
                    label="Participación"
                    value={stats.totalVotes > 0 ? "Activa" : "Esperando"}
                    color="text-gold" bg="bg-gold/10 border-gold/20"
                />
                <KPICard
                    icon={<RefreshCw size={24} />}
                    label="Última Sincronización"
                    value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    color="text-green-400" bg="bg-green-500/10 border-green-500/20"
                />
            </div>

            {/* Main Visualizations Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* 1. Category Chart */}
                <div className="lg:col-span-7 bg-[#121212]/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col hover:border-white/10 transition-all duration-300 group">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="p-2 rounded-lg bg-gray-800/50 text-gold border border-white/5 group-hover:bg-gold/10 transition-colors"><BarChart3 size={20} /></span>
                                Participación por Categoría
                            </h3>
                            <p className="text-sm text-gray-500 mt-2 ml-1">Volumen de votos registrados.</p>
                        </div>
                        <div className="flex gap-2 text-xs font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                            <span>TOTAL</span>
                            <span className="text-white font-bold">{stats.totalVotes}</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full" style={{ minHeight: `${Math.max(400, categoryData.length * 50)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={categoryData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barGap={5}>
                                <defs>
                                    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#FCD34D" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.05} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={220}
                                    tick={{ fill: '#D1D5DB', fontSize: 13, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{ fill: 'url(#gridGradient)' }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                                    formatter={(value?: number) => [`${value || 0} votos`, 'Total']}
                                    labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}
                                />
                                <Bar
                                    dataKey="votes"
                                    fill="url(#goldGradient)"
                                    radius={[0, 4, 4, 0]}
                                    barSize={24}
                                    animationDuration={1500}
                                >
                                    <LabelList dataKey="votes" position="right" fill="#9CA3AF" fontSize={12} formatter={(val: any) => val > 0 ? val : ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Top Candidates Leaderboard */}
                <div className="lg:col-span-5 bg-[#121212]/80 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-gold/10 transition-colors duration-1000"></div>

                    <div className="mb-8 relative z-10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-gold/10 text-gold border border-gold/10"><Trophy size={20} /></span>
                            Ranking Global
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 ml-1">Los favoritos de la comunidad.</p>
                    </div>

                    <div className="flex-1 space-y-4">
                        {topCandidates.map((cand, idx) => {
                            const maxVotes = topCandidates[0]?.votes || 1;
                            const percent = (cand.votes / maxVotes) * 100;

                            return (
                                <div key={cand.id} className="relative group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold ${idx === 0 ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-black/40 text-gray-500'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm leading-tight">{cand.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate max-w-[120px]">{cand.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-white">{cand.votes}</div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 h-1 bg-gold/50 rounded-b-xl transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                </div>
                            );
                        })}

                        {topCandidates.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                                <Users size={32} />
                                <p className="text-sm">Esperando votos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
