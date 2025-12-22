import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getConfig, getStats } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronsRight, Lock, Unlock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Components
import { Sidebar } from '../components/dashboard/Sidebar';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { VotersTab } from '../components/dashboard/VotersTab';
import { ConfigTab } from '../components/dashboard/ConfigTab';
import { MyVotesTab } from '../components/dashboard/MyVotesTab';

const fetcher = async () => {
    const [config, stats] = await Promise.all([getConfig(), getStats()]);
    return { config, stats };
};

export const Dashboard = () => {
    const navigate = useNavigate();
    // User Info (moved up to use in state initialization)
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'config' | 'my-votes'>(
        user.isAdmin ? 'overview' : 'my-votes'
    );
    const [showEntrance, setShowEntrance] = useState(() => {
        return !sessionStorage.getItem('hasSeenDashboardEntrance');
    });

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

        // Fireworks Logic - Trigger AFTER entrance or immediately if no entrance
        const startFireworks = () => {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    return;
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        };

        if (!showEntrance) {
            startFireworks();
        } else {
            // If entrance is showing, we'll trigger from the onComplete of the entrance
        }
    }, [showEntrance]);

    const handleEntranceComplete = () => {
        setShowEntrance(false);
        sessionStorage.setItem('hasSeenDashboardEntrance', 'true');
        // Trigger fireworks manually here if needed, or rely on the effect dependency change if structured that way.
        // Simplified: Just re-trigger fireworks logic or move it to a function.
        // Actually, since we want fireworks *right after* the doors open/start opening, 
        // we can trigger it in the Entrance component's exit or just call it here.
        // Let's refactor the fireworks to a reuseable function inside useEffect? 
        // Easier: Just let the useEffect above run when showEntrance changes to false.
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (error) return <div>Error cargando datos...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex font-sans selection:bg-gold/30 overflow-hidden relative">

            <AnimatePresence>
                {showEntrance && (
                    <GoldenEntrance onComplete={handleEntranceComplete} />
                )}
            </AnimatePresence>

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
                                {activeTab === 'my-votes' && 'Gestión de Votos'}
                            </h2>
                            <p className="text-gray-400 text-lg">
                                {activeTab === 'overview' && 'Vista general de las estadísticas y rendimiento.'}
                                {activeTab === 'voters' && 'Consulta el historial detallado de participación.'}
                                {activeTab === 'config' && 'Personaliza categorías, candidatos y aspectos del bot.'}
                                {activeTab === 'my-votes' && 'Revisa y actualiza tus elecciones en tiempo real.'}
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
                                {activeTab === 'my-votes' && data && (
                                    <MyVotesTab config={data.config} />
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

const GoldenEntrance = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 10000); // 10 seconds auto-skip
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, delay: 0.5 } }} // Fade out container after doors open
        >
            {/* Left Door */}
            <motion.div
                initial={{ x: 0 }}
                exit={{ x: '-100%', transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] } }}
                className="absolute left-0 top-0 w-1/2 h-full bg-[#050505] border-r-2 border-gold/50 flex items-center justify-end pr-10 shadow-[5px_0_50px_rgba(0,0,0,0.8)] z-20"
            >
                <div className="bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] absolute inset-0 opacity-20"></div>
                <div className="text-right opacity-50">
                    <Lock className="w-24 h-24 text-gold/20" />
                </div>
            </motion.div>

            {/* Right Door */}
            <motion.div
                initial={{ x: 0 }}
                exit={{ x: '100%', transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] } }}
                className="absolute right-0 top-0 w-1/2 h-full bg-[#050505] border-l-2 border-gold/50 flex items-center justify-start pl-10 shadow-[-5px_0_50px_rgba(0,0,0,0.8)] z-20"
            >
                <div className="bg-[linear-gradient(-45deg,transparent_25%,rgba(212,175,55,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] absolute inset-0 opacity-20"></div>
                <div className="text-left opacity-50">
                    <Lock className="w-24 h-24 text-gold/20" />
                </div>
            </motion.div>

            {/* Center Content (Badge / Logo Validation) */}
            <motion.div
                className="relative z-30 flex flex-col items-center gap-6"
                exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.5 } }}
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="relative w-40 h-40"
                >
                    <div className="absolute inset-0 bg-gold/20 blur-[50px] rounded-full animate-pulse"></div>
                    <img
                        src="https://imgur.com/aZMcktO.png"
                        alt="Logo"
                        className="w-full h-full object-cover rounded-full border-4 border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                    />
                    <motion.div
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, delay: 1 }}
                        className="absolute -inset-4 rounded-full border border-gold/50 border-dashed animate-spin-slow"
                        style={{ padding: '10px' }}
                    />
                </motion.div>

                <div className="text-center space-y-2">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="text-2xl font-bold text-white tracking-[0.2em]"
                    >
                        BIENVENIDO
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                        className="flex items-center gap-2 justify-center text-gold text-sm font-mono uppercase"
                    >
                        <Unlock size={14} />
                        <span>Verificando Credenciales...</span>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, color: '#4ade80' }} // Green color
                        transition={{ delay: 4.5 }}
                        className="text-xs font-bold tracking-widest uppercase border border-white/10 bg-white/5 py-1 px-3 rounded-full"
                    >
                        Acceso Concedido
                    </motion.div>
                </div>
            </motion.div>

            {/* Skip Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={onComplete}
                className="absolute bottom-10 z-40 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest group"
            >
                Saltar Intro
                <ChevronsRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </motion.div>
    );
};
