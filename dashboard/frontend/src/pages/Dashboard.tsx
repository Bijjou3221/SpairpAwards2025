import { useState, useEffect } from 'react';
import useSWR from 'swr';
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

const fetcher = async () => {
    const [config, stats] = await Promise.all([getConfig(), getStats()]);
    return { config, stats };
};

export const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'config'>('overview');

    // User Info
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // SWR Data Fetching (Auto Refresh every 30s)
    const { data, error, isLoading, mutate } = useSWR('dashboard-data', fetcher, {
        refreshInterval: 30000, // 30 seconds
        revalidateOnFocus: false,
        onError: (err) => {
            console.error('SWR Error:', err);
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    });

    useEffect(() => {
        if (data) {
            // Optional: Show a subtle toast or nothing on silent refresh
            // toast.success("Datos actualizados");
        }
    }, [data]);

    useEffect(() => {
        toast.success(`Bienvenido de nuevo, ${user.username || 'Admin'}!`, {
            description: 'Conexión segura establecida con el servidor.',
            duration: 4000,
            icon: '👋'
        });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (error) return <div>Error cargando datos...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex font-sans selection:bg-gold/30 overflow-hidden">
            {/* Sidebar Component */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                handleLogout={handleLogout}
                totalVotes={data?.stats?.totalVotes}
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
                                onClick={() => mutate()}
                                className={`p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/5 shadow-lg backdrop-blur-md ${isLoading ? 'animate-spin' : ''}`}
                                title="Actualizar Datos"
                            >
                                <RefreshCw size={22} />
                            </button>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {isLoading && !data ? (
                            // Premium Skeleton Loading
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-48 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && data && (
                                    <OverviewTab stats={data.stats} config={data.config} />
                                )}
                                {activeTab === 'voters' && data && (
                                    <VotersTab stats={data.stats} config={data.config} />
                                )}
                                {activeTab === 'config' && data && (
                                    <ConfigTab config={data.config} setConfig={(newConfig: any) => mutate({ ...data, config: newConfig }, false)} />
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
