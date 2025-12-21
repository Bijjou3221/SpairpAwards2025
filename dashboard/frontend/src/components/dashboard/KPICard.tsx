import type { ReactNode } from 'react';

interface KPICardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    color: string;
    bg: string;
}

export const KPICard = ({ icon, label, value, color, bg }: KPICardProps) => (
    <div className="bg-[#121212]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:-translate-y-1 transition-transform duration-300 hover:shadow-gold/5 hover:border-white/10">
        <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl text-white ${bg} ${color}`}>
            {icon}
        </div>
    </div>
);
