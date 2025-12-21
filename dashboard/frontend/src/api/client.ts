import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL || 'https://spainrp-awards-backend.onrender.com/api';
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY
const CLIENT_SECRET_KEY = import.meta.env.VITE_CLIENT_SECRET_KEY

const client = axios.create({
    baseURL: API_URL,
    withCredentials: true // IMPORTANT: Send cookies with requests
});

// Interceptor para Request: Añadir Token y Client Key
// Interceptor para Request: Añadir Client Key solamente (Auth va por Cookie)
client.interceptors.request.use((config) => {
    // 1. Client Key (Para evitar error 502/Soup)
    config.headers['X-Client-Key'] = CLIENT_SECRET_KEY;

    // 2. Auth Token (LocalStorage Fallback for Mobile)
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Interceptor para Response: Desencriptar datos
client.interceptors.response.use((response) => {
    // Si la respuesta viene encriptada dentro de 'payload'
    if (response.data && response.data.payload) {
        try {
            const bytes = CryptoJS.AES.decrypt(response.data.payload, API_SECRET_KEY);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            response.data = decryptedData; // Reemplazamos data por la desencriptada
        } catch (e) {
            console.error('Error desencriptando respuesta del servidor', e);
        }
    }
    return response;
}, (error) => {
    return Promise.reject(error);
});

export const loginWithDiscord = async (code: string) => {
    const response = await client.post('/auth/login', { code });
    return response.data;
};

export const getConfig = async () => {
    const response = await client.get('/config');
    return response.data;
};

export const updateConfig = async (data: any) => {
    const response = await client.post('/config', data);
    return response.data;
};

export const getStats = async () => {
    const response = await client.get('/stats');
    return response.data;
};

export default client;
