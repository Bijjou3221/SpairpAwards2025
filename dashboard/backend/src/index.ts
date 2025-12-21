import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import DiscordOauth2 from 'discord-oauth2';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import fs from 'fs';
import https from 'https';
import CryptoJS from 'crypto-js';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';
import path from 'path';
import AwardConfig from './models/AwardConfig';
import Vote from './models/Vote';

// Cargar .env desde la raíz del proyecto (dos niveles arriba)
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://spainrp.xyz'; // Keep localhost as fallback only for local dev if env missing, but secrets must be env.
const API_SECRET_KEY = process.env.API_SECRET_KEY;

if (!API_SECRET_KEY) {
    console.error("❌ CRITICAL ERROR: API_SECRET_KEY is missing in .env"); // Using console.error here as logger might not be fully initialized or configured for critical errors yet.
    process.exit(1);
}

// --- WINSTON LOGGER SETUP ---
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Log errors to error.log
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        // Log everything to combined.log
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// --- SECURITY MIDDLEWARE ---

// 1. Helmet
app.use(helmet());

// 2. CORS
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // IMPORTANT for Cookies
    optionsSuccessStatus: 200
}));

// 3. Logger (Morgan) connected to Winston
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// 4. Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Demasiadas peticiones.',
    handler: (req, res, next, options) => {
        logger.warn(`Rate Limit Exceeded: IP ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});
app.use('/api/', limiter);

// 5. HPP & Body Parser & Cookie Parser
app.use(hpp());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // Enable Cookie Parsing

// 6. ENCRYPTION & OBSCURE MIDDLEWARE
const encryptMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientKey = req.headers['x-client-key'];

    // Authorization Check for "Soup" Response
    if (clientKey !== process.env.CLIENT_SECRET_KEY && req.path.startsWith('/api/') && !req.path.includes('/auth/login')) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        logger.warn(`🚨 UNAUTHORIZED ACCESS ATTEMPT: IP ${ip} tried to access ${req.path} without valid Client Key.`);
        return res.status(502).send('Error 502: Bad Gateway - Protocol Mismatch. %&@!#*&^!@#');
    }

    const originalSend = res.json;
    res.json = function (body) {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(body), API_SECRET_KEY).toString();
        return originalSend.call(this, { payload: encrypted });
    };
    next();
};

app.use('/api/', encryptMiddleware);


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || '')
    .then(() => logger.info('🟢 Backend conectado a MongoDB (Seguro)'))
    .catch(err => logger.error('🔴 Error Mongo Backend:', err));

// OAuth2 Setup
const oauth = new DiscordOauth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `${FRONTEND_URL}/dashboard`,
});

// Middleware de Autenticación JWT (READ FROM COOKIE)
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Try cookie first, then header as backup (though header is less secure)
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        logger.warn(`Auth Failed: No token for ${req.ip}`);
        return res.status(401).json({ error: 'Acceso Denegado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = decoded;
        next();
    } catch (e) {
        logger.error(`Auth Error: Invalid Token for ${req.ip}`);
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// --- RUTAS ---

// Login: Intercambia código por token y verifica admin
app.post('/api/auth/login', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Falta el código' });

    try {
        // 1. Canjear código
        const tokenData = await oauth.tokenRequest({
            code,
            scope: 'identify',
            grantType: 'authorization_code',
            redirectUri: FRONTEND_URL, // Must match the frontend's origin
        });

        // 2. Obtener usuario
        const user = await oauth.getUser(tokenData.access_token);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 3. Verificar Admin
        const config = await AwardConfig.findOne();
        const dbAdminIds = config?.adminIds || [];
        const envAdminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
        const allowedIds = [...new Set([...dbAdminIds, ...envAdminIds])];

        if (!allowedIds.includes(user.id)) {
            logger.warn(`Login Failed: User ${user.username} (${user.id}) from IP ${ip} is not an admin.`);
            return res.status(403).json({
                error: 'No tienes permisos de administrador.',
                user: { id: user.id, username: user.username, avatar: user.avatar, ip: ip }
            });
        }

        // 4. Generar JWT
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
        const jwtToken = jwt.sign(
            { id: user.id, username: user.username, avatar: user.avatar },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info(`✅ Admin Login: ${user.username} (${user.id}) logged in successfully from ${ip}`);

        // 5. Set HttpOnly Cookie
        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: true, // Always true for SameSite=None
            sameSite: 'none', // Required for Cross-Domain (frontend.com vs backend.render.com)
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Return user info, but NOT the token (it's in the cookie now)
        res.json({ success: true, user });

    } catch (error: any) {
        logger.error('Error Auth:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error de autenticación' });
    }
});

// Logout Helper
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true });
});

// GET Config
app.get('/api/config', async (req, res) => {
    try {
        const config = await AwardConfig.findOne();
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: 'Error obteniendo config' });
    }
});

// UPDATE Config
app.post('/api/config', authMiddleware, async (req, res) => {
    try {
        const { awards, colors } = req.body;
        // Solo permitimos actualizar awards y colors por ahora
        const config = await AwardConfig.findOneAndUpdate({}, { awards, colors }, { new: true });
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: 'Error actualizando config' });
    }
});

// GET Stats
app.get('/api/stats', authMiddleware, async (req, res) => {
    try {
        const votes = await Vote.find();
        const config = await AwardConfig.findOne();

        // Calcular estadísticas básicas
        const totalVotes = votes.length;
        const votesByCategory: Record<string, number> = {};

        // Inicializar contadores
        config?.awards.forEach(cat => {
            votesByCategory[cat.id] = 0;
            cat.candidates.forEach(cand => {
                votesByCategory[`${cat.id}:${cand.value}`] = 0;
            });
        });

        votes.forEach(vote => {
            // @ts-ignore
            for (const [catId, val] of vote.votes) {
                if (votesByCategory[catId] !== undefined) votesByCategory[catId]++;
                // @ts-ignore
                if (votesByCategory[`${catId}:${val}`] !== undefined) votesByCategory[`${catId}:${val}`]++;
            }
        });

        res.json({ totalVotes, detail: votesByCategory, raw: votes });

    } catch (e) {
        res.status(500).json({ error: 'Error stats' });
    }
});

// GET Health (Status Page)
app.get('/api/health', async (req, res) => {
    const services = [];
    let overallStatus: 'operational' | 'degraded' | 'major_outage' = 'operational';

    // 1. Check Database (MongoDB)
    let dbStatus: 'operational' | 'major_outage' = 'major_outage';
    let dbLatency = '-';
    try {
        if (mongoose.connection.readyState === 1) {
            const start = Date.now();
            await mongoose.connection.db?.command({ ping: 1 });
            const duration = Date.now() - start;
            dbStatus = 'operational';
            dbLatency = `${duration}ms`;
        }
    } catch (e) {
        console.error('DB Health Check failed:', e);
    }
    services.push({ name: 'Database (MongoDB)', status: dbStatus, latency: dbLatency });

    // 2. Check Discord Gateway
    let discordStatus: 'operational' | 'degraded' | 'major_outage' = 'major_outage';
    let discordLatency = '-';
    try {
        const start = Date.now();
        // Simple fetch to Discord API to check connectivity
        const discordRes = await fetch('https://discord.com/api/v10/gateway');
        if (discordRes.ok) {
            const duration = Date.now() - start;
            discordStatus = 'operational';
            discordLatency = `${duration}ms`;
        } else {
            discordStatus = 'degraded';
        }
    } catch (e) {
        console.error('Discord Health Check failed:', e);
    }
    services.push({ name: 'Discord Gateway', status: discordStatus, latency: discordLatency });

    // 3. API Backend (Self)
    services.push({ name: 'API Backend', status: 'operational', latency: '0ms' });

    // 4. Web Dashboard (Assumed Operational if this API is reachable)
    services.push({ name: 'Web Dashboard', status: 'operational', latency: '10ms' });

    // Determine Overall Status
    if (dbStatus !== 'operational' || discordStatus === 'major_outage') {
        overallStatus = 'major_outage';
    } else if (discordStatus === 'degraded') {
        overallStatus = 'degraded';
    }

    res.json({
        status: overallStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services
    });
});

// SSL/TLS & Server Startup
const startServer = () => {
    try {
        if (fs.existsSync('server.key') && fs.existsSync('server.cert')) {
            const httpsOptions = {
                key: fs.readFileSync('server.key'),
                cert: fs.readFileSync('server.cert')
            };
            https.createServer(httpsOptions, app).listen(PORT, () => {
                console.log(`🟢 Backend Seguro (HTTPS) iniciado en el puerto ${PORT}`);
            });
        } else {
            app.listen(PORT, () => {
                console.log(`🚀 Backend iniciado en el puerto ${PORT}`);
            });
        }
    } catch (e) {
        console.error('Error iniciando servidor:', e);
        // Fallback
        app.listen(PORT, () => console.log(`🚀 Backend iniciado en el puerto ${PORT} (Modo Fallback)`));
    }
};

startServer();
