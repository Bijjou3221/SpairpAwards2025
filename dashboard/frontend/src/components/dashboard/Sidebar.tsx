import { useState } from 'react';
import { LayoutDashboard, Users, Edit3, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    activeTab: 'overview' | 'voters' | 'config';
    setActiveTab: (tab: 'overview' | 'voters' | 'config') => void;
    user: any;
    handleLogout: () => void;
    totalVotes?: number;
}

const SidebarItem = ({ active, onClick, icon, label, badge }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 group ${active
            ? 'bg-gradient-to-r from-gold/10 to-transparent text-gold border-l-4 border-gold shadow-[inset_10px_0_20px_-10px_rgba(212,175,55,0.2)]'
            : 'hover:bg-white/5 text-gray-500 hover:text-white border-l-4 border-transparent'
            }`}
    >
        <div className="flex items-center gap-3">
            <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
            <span className="font-medium text-sm tracking-wide">{label}</span>
        </div>
        {badge && (
            <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white shadow-sm">{badge}</span>
        )}
    </button>
);

export const Sidebar = ({ activeTab, setActiveTab, user, handleLogout, totalVotes }: SidebarProps) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#050505]/95 backdrop-blur-md border-r border-white/5 shadow-2xl">
            <div className="p-8 border-b border-white/5 flex flex-col items-center text-center relative">
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-gold to-yellow-800 shadow-xl shadow-gold/20 mb-4 ring-2 ring-gold/20 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/')}>
                    <img
                        src="https://imgur.com/aZMcktO.png"
                        alt="SpainRP Awards"
                        className="w-full h-full rounded-full object-cover border-4 border-[#050505]"
                    />
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">
                    SpainRP <span className="text-gold">Awards</span>
                </h1>
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">Panel Oficial 2025</span>
            </div>

            <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
                <SidebarItem
                    active={activeTab === 'overview'}
                    onClick={() => { setActiveTab('overview'); setIsOpen(false); }}
                    icon={<LayoutDashboard size={20} />}
                    label="Panel Principal"
                />
                <SidebarItem
                    active={activeTab === 'voters'}
                    onClick={() => { setActiveTab('voters'); setIsOpen(false); }}
                    icon={<Users size={20} />}
                    label="Votantes"
                    badge={totalVotes}
                />
                <SidebarItem
                    active={activeTab === 'config'}
                    onClick={() => { setActiveTab('config'); setIsOpen(false); }}
                    icon={<Edit3 size={20} />}
                    label="Configuración"
                />

                <div className="pt-4 pb-2">
                    <p className="px-5 text-[10px] font-bold uppercase text-gray-600 tracking-wider">Sistema</p>
                </div>
                <SidebarItem
                    active={false}
                    onClick={() => navigate('/status')}
                    icon={<BarChart3 size={20} />}
                    label="Estado del Sistema"
                />
            </nav>

            <div className="p-6 border-t border-white/5 bg-white/5">
                <div className="flex items-center gap-3 mb-4">
                    {user.avatar ? (
                        <img
                            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full ring-2 ring-gold/50"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gold/50 flex items-center justify-center font-bold text-black">{user.username?.[0]}</div>
                    )}
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate max-w-[150px]">{user.username}</p>
                        <p className="text-xs text-gold flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-black/50 hover:bg-red-500/10 hover:text-red-400 px-4 py-3 rounded-xl transition-all text-sm font-medium border border-white/5"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
                <p className="text-[10px] text-gray-600 text-center mt-4 opacity-50">v1.0.0 • SpainRP</p>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-gold shadow-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                className={`fixed top-0 left-0 bottom-0 z-50 w-72 lg:translate-x-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <SidebarContent />
            </motion.aside>

            {/* Spacer for Desktop Layout */}
            <div className="hidden lg:block w-72 flex-shrink-0" />
        </>
    );
};
