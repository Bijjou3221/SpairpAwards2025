import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { loginWithDiscord } from '../api/client';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Countdown } from '../components/Countdown';
import { ForbiddenPage } from './ForbiddenPage';
import {
    ShieldCheck,
    Loader2,
    Trophy,
    Vote,
    BarChart3,
    CheckCircle2
} from 'lucide-react';

const DISCORD_CLIENT_ID = '1382837683788976279';
const REDIRECT_URI = 'https://spainrp.xyz';
const AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;

// Imágenes premium para el carrusel de fondo
const BACKGROUND_IMAGES = [
    "https://i.imgur.com/BmpCImH.jpeg", // Ciudad Noche
    "https://i.imgur.com/MEkjVcR.png",   // Vehículo Policial
    "https://i.imgur.com/3XTaVvy.jpeg", // Paisaje Urbano
    "https://i.imgur.com/RxG8ngm.png",   // Evento
    "https://i.imgur.com/UJgw2f5.png",   // Acción
    "https://i.imgur.com/wiEjDn3.jpeg"  // Atardecer
];

export const LoginPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [unauthorizedUser, setUnauthorizedUser] = useState<any>(null);

    // 3D Tilt Hook Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);

    // Slideshow Effect & Preload
    useEffect(() => {
        // Preload Images
        BACKGROUND_IMAGES.forEach((src) => {
            const img = new Image();
            img.src = src;
        });

        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 8000); // Change every 8 seconds
        return () => clearInterval(interval);
    }, []);

    const codeProcessed = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code && !codeProcessed.current) {
            codeProcessed.current = true;
            handleLogin(code);
        }
    }, [searchParams]);

    const handleLogin = async (code: string) => {
        setLoading(true);
        try {
            const data = await loginWithDiscord(code);
            // 1. Store User Info
            localStorage.setItem('user', JSON.stringify(data.user));
            // 2. Store Token for LocalStorage Fallback (Mobile/Cross-Site)
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);

            if (err.response?.status === 403 && err.response?.data?.user) {
                // Use the real data sent by backend (includes IP, username, id)
                setUnauthorizedUser(err.response.data.user);
            } else if (err.response?.status === 403) {
                // Fallback if data is missing
                setUnauthorizedUser({
                    username: 'Usuario No Autorizado',
                    id: 'Desconocido',
                    ip: 'No detectada'
                });
            } else {
                setError('Error de autenticación. Verifica que seas administrador.');
            }
            setLoading(false);
        }
    };

    if (unauthorizedUser) {
        return <ForbiddenPage userData={unauthorizedUser} />;
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 200);
        y.set(yPct * 200);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-gold/30 relative overflow-hidden">

            {/* --- IMMERSIVE BACKGROUND SLIDESHOW --- */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBgIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }} // Smoother transition
                    className="absolute inset-0 w-full h-full"
                >
                    <div className="absolute inset-0 bg-black/70 z-10" /> {/* Darker overlay for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50 z-10" />
                    <img
                        src={BACKGROUND_IMAGES[currentBgIndex]}
                        alt="Background"
                        className="w-full h-full object-cover object-center"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Navbar / Header */}
            <header className="w-full max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-3 backdrop-blur-md bg-black/40 p-2 pr-4 rounded-full border border-white/5">
                    <img src="https://imgur.com/aZMcktO.png" alt="SpainRP Logo" className="w-8 h-8 rounded-full shadow-lg" />
                    <span className="font-bold text-base md:text-lg tracking-tight">SpainRP<span className="text-gold">Awards</span></span>
                </div>
                <div className="hidden md:flex bg-green-900/40 backdrop-blur border border-green-500/20 px-4 py-1.5 rounded-full items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 size={14} />
                    <span className="animate-pulse">Sistema Operativo</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 relative z-20">

                {/* Left Column: Cinematic Text */}
                <div className="flex-1 space-y-6 md:space-y-10 max-w-2xl text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-4 md:space-y-6"
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                            AWARDS 2025 <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-yellow-600 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                                SPAINRP
                            </span>
                        </h1>

                        {/* LIVE COUNTDOWN */}
                        <div className="flex justify-center lg:justify-start">
                            <Countdown targetDate="2025-12-26T20:00:00" />
                        </div>

                        <p className="text-gray-300 text-lg md:text-xl lg:text-2xl max-w-lg leading-relaxed font-light mx-auto lg:mx-0 border-l-0 lg:border-l-4 border-gold lg:pl-6">
                            Celebrando la excelencia, la historia y el rol que define nuestra comunidad.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-left"
                    >
                        <FeatureCard icon={<Trophy className="text-gold" />} title="Premios Elite" desc="Galardones exclusivos." />
                        <FeatureCard icon={<Vote className="text-blue-400" />} title="Voto Verificado" desc="Seguridad garantizada." />
                        <FeatureCard icon={<BarChart3 className="text-purple-400" />} title="Live Analytics" desc="Datos en tiempo real." />
                        <FeatureCard icon={<ShieldCheck className="text-green-400" />} title="Acceso Staff" desc="Solo personal autorizado." />
                    </motion.div>
                </div>

                {/* Right Column: 3D Login Card */}
                <div className="flex-1 w-full max-w-sm md:max-w-md perspective-1000 mt-6 lg:mt-0">
                    <motion.div
                        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative group"
                    >
                        {/* 3D Depth Elements */}
                        <div
                            className="absolute -inset-1 bg-gradient-to-r from-gold/30 to-purple-500/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                            style={{ transform: "translateZ(-50px)" }}
                        />

                        <div className="flex flex-col items-center text-center mb-8 md:mb-10" style={{ transform: "translateZ(20px)" }}>
                            <div className="relative w-20 h-20 md:w-28 md:h-28 mb-4 md:mb-6">
                                <div className="absolute inset-0 bg-gold blur-[40px] opacity-20 rounded-full animate-pulse"></div>
                                <img src="https://imgur.com/aZMcktO.png" alt="Logo" className="w-full h-full rounded-full object-cover border-2 border-white/10 shadow-2xl relative z-10" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Acceso Administrativo</h2>
                            <p className="text-gray-400 text-xs md:text-sm mt-2">Identifícate mediante credenciales seguras</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center backdrop-blur-md">
                                {error}
                            </div>
                        )}

                        <div style={{ transform: "translateZ(30px)" }}>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                                        <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-gold animate-pulse" />
                                    </div>
                                    <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase">Autenticando...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <a
                                        href={AUTH_URL}
                                        className="group relative block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative z-10 flex items-center justify-center gap-3 text-base md:text-lg">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 14.156 14.156 0 0 0-.649 1.334 18.27 18.27 0 0 0-6.191 0 14.168 14.168 0 0 0-.649-1.334.076.076 0 0 0-.078-.037 19.792 19.792 0 0 0-4.885 1.515.068.068 0 0 0-.03.023C.45 9.043-.65 14.28.32 18.918a.077.077 0 0 0 .025.05 19.986 19.986 0 0 0 5.923 3.018.077.077 0 0 0 .084-.027 14.331 14.331 0 0 0 1.254-2.043.076.076 0 0 0-.041-.106 13.048 13.048 0 0 1-1.872-.892.076.076 0 0 1-.008-.128 10.15 10.15 0 0 0 .373-.292.076.076 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.01 9.947 9.947 0 0 0 .371.292.075.075 0 0 1-.006.128 12.822 12.822 0 0 1-1.873.892.076.076 0 0 0-.04.106 13.97 13.97 0 0 0 1.252 2.043.076.076 0 0 0 .085.027 19.957 19.957 0 0 0 5.925-3.018.077.077 0 0 0 .024-.052c1.07-5.088-.844-9.875-4.131-14.545a.066.066 0 0 0-.03-.023zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.085 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.085 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" /></svg>
                                            Iniciar Sesión
                                        </span>
                                    </a>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                        <RequirementItem text="Verificación 2FA Requerida" />
                                        <RequirementItem text="Acceso Exclusivo Staff" />
                                        <RequirementItem text="Encriptación SSL Activa" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[10px] text-gray-500 mt-8 font-medium">
                            Acceso monitoreado y registrado por seguridad.
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-6 relative z-20 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">© 2025 SpainRP Awards. Desarollado por Bijjoupro08 </p>
                    <div className="flex items-center gap-6 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        <Link to="/status" className="cursor-pointer hover:text-white transition-colors">Estado del Sistema</Link>
                        <span
                            onClick={() => toast.info('Soporte Técnico', { description: 'Contacta a @BijjouPro08 en Discord para asistencia.', duration: 5000 })}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            Soporte
                        </span>
                        <span className="cursor-pointer hover:text-white transition-colors">Legal</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="bg-black/40 backdrop-blur-md hover:bg-white/5 border border-white/10 rounded-xl p-4 transition-all flex items-start gap-4 group">
        <div className="p-2.5 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-white text-sm group-hover:text-gold transition-colors">{title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
        </div>
    </div>
);

const RequirementItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        <span>{text}</span>
    </div>
);
