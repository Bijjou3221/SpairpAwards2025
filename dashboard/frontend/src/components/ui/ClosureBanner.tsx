import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ClosureBanner: React.FC = () => {
    return (
        <div className="w-full bg-red-600/90 text-white font-bold text-center py-4 px-4 shadow-lg flex items-center justify-center gap-3 backdrop-blur-md border-b-4 border-red-800 animate-in slide-in-from-top duration-500 z-50">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <span className="uppercase tracking-wide text-sm md:text-base lg:text-lg drop-shadow-md">
                YA FINALIZO LA GALA Y LOS SPAINRP AWARDS 2025. AHORA ESPERAREMOS PROXIMAMENTE HASTA 2026, GRACIAS A TODOS!
            </span>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
    );
};

export default ClosureBanner;
