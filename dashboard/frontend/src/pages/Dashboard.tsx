import { useEffect, useState } from 'react';
import { getConfig, getStats } from '../api/client';
import type { AwardConfigType } from '../types';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Components
import { Sidebar } from '../components/dashboard/Sidebar';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { VotersTab } from '../components/dashboard/VotersTab';
import { ConfigTab } from '../components/dashboard/ConfigTab';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<AwardConfigType | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'config'>('overview');

    // User Info
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch Initial Data
    useEffect(() => {
        loadData();
        toast.success(`Bienvenido de nuevo, ${user.username || 'Admin'}!`, {
            description: 'Conexión segura establecida con el servidor.',
            duration: 4000,
            icon: '👋'
        });
    }, []);

    const loadData = async () => {
        try {
            const [cfg, sts] = await Promise.all([getConfig(), getStats()]);
            setConfig(cfg);
            setStats(sts);
        } catch (e) {
            console.error(e);
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex font-sans selection:bg-gold/30 overflow-hidden">
            {/* Sidebar Component */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                handleLogout={handleLogout}
                totalVotes={stats?.totalVotes}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-10 relative min-h-screen">
                {/* Cinematic Background */}
                <div className="fixed inset-0 z-0 bg-[#0a0a0a]">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-gold/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
                </div>

                <div className="relative z-10">
                    <header className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 tracking-tight">
                                {activeTab === 'overview' && 'Dashboard Overview'}
                                {activeTab === 'voters' && 'Registro de Votantes'}
                                {activeTab === 'config' && 'Gestión del Evento'}
                            </h2>
                            <p className="text-gray-400 text-lg">
                                {activeTab === 'overview' && 'Vista general de las estadísticas y rendimiento.'}
                                {activeTab === 'voters' && 'Consulta el historial detallado de participación.'}
                                {activeTab === 'config' && 'Personaliza categorías, candidatos y aspectos del bot.'}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={loadData}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/5 hover:rotate-180 duration-500 shadow-lg backdrop-blur-md"
                                title="Actualizar Datos"
                            >
                                <RefreshCw size={22} />
                            </button>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && config && (
                            <OverviewTab stats={stats} config={config} />
                        )}
                        {activeTab === 'voters' && config && (
                            <VotersTab stats={stats} config={config} />
                        )}
                        {activeTab === 'config' && config && (
                            <ConfigTab config={config} setConfig={setConfig} />
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
