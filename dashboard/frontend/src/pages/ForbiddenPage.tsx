import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Lock, AlertTriangle } from "lucide-react";

interface ForbiddenPageProps {
    userData: any;
}

export const ForbiddenPage = ({ userData }: ForbiddenPageProps) => {
    useEffect(() => {
        // Bloqueo temporal simulado (solo visual)
        const timer = setTimeout(() => {
            window.location.href = '/';
        }, 15000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black text-red-500 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Glitch Effect */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-overlay"></div>
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 bg-black/90 border border-red-600/50 p-10 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.5)] max-w-2xl w-full text-center relative"
            >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-black px-4 py-1 rounded font-bold uppercase tracking-widest animate-pulse">
                    Acceso Denegado
                </div>

                <ShieldAlert size={80} className="mx-auto mb-6 text-red-600 animate-bounce" />

                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">
                    SpainRP <span className="text-red-600">Security</span>
                </h1>
                <p className="text-red-400 text-sm uppercase tracking-widest mb-8">Sistema de Protección de Votos Activo</p>

                <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-lg mb-8 text-left space-y-3">
                    <div className="flex items-center gap-3 text-red-300">
                        <Lock size={16} />
                        <span>IP Registrada: <span className="text-white font-bold">{userData?.ip || 'Detectando...'}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-red-300">
                        <AlertTriangle size={16} />
                        <span>Usuario Discord: <span className="text-white font-bold">{userData?.username || 'Desconocido'}</span> ({userData?.id})</span>
                    </div>
                    <div className="flex items-center gap-3 text-red-300">
                        <ShieldAlert size={16} />
                        <span>Razón: <span className="text-white font-bold">No autorizado (ID no en whitelist)</span></span>
                    </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    Este panel es exclusivo para los <span className="text-red-500 font-bold">3 Administradores</span> de SpainRP Awards.
                    Contiene información confidencial sobre los resultados de las votaciones que no pueden ser revelados antes de la Gala del 26 de Diciembre.
                </p>

                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 15, ease: "linear" }}
                        className="h-full bg-red-600"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2 uppercase">Redireccionando en 15 segundos...</p>

            </motion.div>
        </div>
    );
};
