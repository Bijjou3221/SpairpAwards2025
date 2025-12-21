import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Activity, Server, Database, Globe, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import client from "../api/client";

interface ServiceStatus {
    name: string;
    status: 'operational' | 'degraded' | 'major_outage';
    latency: string;
}

interface SystemHealth {
    status: 'operational' | 'degraded' | 'major_outage';
    uptime: number;
    timestamp: string;
    services: ServiceStatus[];
}

export const StatusPage = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                // Use secure client instead of raw fetch
                const res = await client.get('/health');
                setHealth(res.data);
                setLastUpdate(new Date());
            } catch (error) {
                console.error("Health check failed", error);
                // Fallback display if backend is totally unreachable
                setHealth({
                    status: 'major_outage',
                    uptime: 0,
                    timestamp: new Date().toISOString(),
                    services: [
                        { name: 'API Backend', status: 'major_outage', latency: 'TIMEOUT' },
                        { name: 'Database (MongoDB)', status: 'major_outage', latency: '-' },
                        { name: 'Discord Gateway', status: 'major_outage', latency: '-' },
                        { name: 'Web Dashboard', status: 'operational', latency: '1ms' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'operational') return 'text-green-500 border-green-500';
        if (status === 'degraded') return 'text-yellow-500 border-yellow-500';
        return 'text-red-500 border-red-500';
    };

    const getStatusBg = (status: string) => {
        if (status === 'operational') return 'bg-green-500/10';
        if (status === 'degraded') return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    const getIcon = (name: string) => {
        if (name.includes('Database')) return <Database size={20} />;
        if (name.includes('Backend')) return <Server size={20} />;
        if (name.includes('Discord')) return <Activity size={20} />;
        return <Globe size={20} />;
    };

    const getStatusText = (status: string) => {
        if (status === 'operational') return 'Operativo';
        if (status === 'degraded') return 'Lento';
        return 'Caído';
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans p-6 md:p-12 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-4">
                            <img src="https://imgur.com/aZMcktO.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg border border-white/10" />
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Estado del Sistema</h1>
                                <p className="text-gray-400 text-xs md:text-sm">Desarollado por BijjouPro08</p>
                            </div>
                        </div>
                    </div>

                    {health && (
                        <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                            <div className="text-left md:text-right w-full md:w-auto">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Última actualización</p>
                                <p className="text-xs font-mono text-gray-300">{lastUpdate.toLocaleTimeString()}</p>
                            </div>
                            <div className={`px-6 py-3 rounded-xl border flex items-center gap-3 ${getStatusBg(health.status)} ${getStatusColor(health.status)} border-opacity-20`}>
                                {health.status === 'operational' ? <CheckCircle size={20} /> : health.status === 'degraded' ? <Activity size={20} /> : <XCircle size={20} />}
                                <span className="font-bold uppercase tracking-wider text-sm">
                                    {health.status === 'operational' ? 'Todos los sistemas operativos' : 'Problemas Detectados'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Metrics & Uptime */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Clock size={100} />
                            </div>
                            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Tiempo de Actividad</h3>
                            <p className="text-4xl font-mono font-bold text-white">
                                {health ? formatUptime(health.uptime) : '0d 0h 0m'}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 w-fit px-3 py-1 rounded-full">
                                <Activity size={12} />
                                <span>99.9% Uptime</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Services Embeds */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading && !health ? (
                            <div className="flex items-center justify-center h-64 text-gray-500 gap-3">
                                <RefreshCw className="animate-spin" /> Cargando estado...
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {health?.services.map((service, idx) => (
                                        <motion.div
                                            key={service.name}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`
                                                relative bg-[#0F0F0F] rounded-lg p-5 border border-white/5 
                                                hover:border-white/10 transition-all group overflow-hidden
                                                before:absolute before:inset-y-0 before:left-0 before:w-1 
                                                ${service.status === 'operational' ? 'before:bg-green-500' : service.status === 'degraded' ? 'before:bg-yellow-500' : 'before:bg-red-500'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white transition-colors">
                                                        {getIcon(service.name)}
                                                    </div>
                                                    <h3 className="font-bold text-sm text-gray-200">{service.name}</h3>
                                                </div>
                                                <div className={`
                                                    w-2 h-2 rounded-full 
                                                    ${service.status === 'operational' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : service.status === 'degraded' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}
                                                `} />
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div className="text-xs text-gray-500 font-mono">
                                                    Latencia
                                                    <div className="text-white text-base font-bold mt-0.5">{service.latency}</div>
                                                </div>
                                                <span className={`
                                                    text-xs font-bold uppercase tracking-wider px-2 py-1 rounded
                                                    ${getStatusBg(service.status)} ${getStatusColor(service.status)}
                                                `}>
                                                    {getStatusText(service.status)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Monitoreo en Tiempo Real
                    </span>
                    <span>© 2025 Evento SpainRP</span>
                </div>
            </div>
        </div>
    );
};
