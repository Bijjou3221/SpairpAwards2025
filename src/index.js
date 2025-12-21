require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');

// Managers & Handlers
const ConfigManager = require('./config/ConfigManager');
const VotingManager = require('./managers/VotingManager');
const { handleInteraction } = require('./handlers/interactionHandler');

// Inicializar Cliente
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// Enlazar cliente al VotingManager (para notificaciones admin)
VotingManager.setClient(client);

// --- CONEXIÓN BASE DE DATOS ---
mongoose.connect(process.env.MONGO_URI || '')
    .then(() => console.log('🟢 [DB] Conectado a MongoDB'))
    .catch(err => console.error('🔴 [DB] Error conectando a MongoDB:', err));

// --- REGISTRO DE COMANDOS ---
const commands = [
    {
        name: 'enviar-panel',
        description: 'Envía el panel de votación (Solo Admin)',
    },
    {
        name: 'resultados',
        description: 'Muestra los resultados de la votación (Solo Admin)',
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function refreshCommands() {
    try {
        console.log('🔄 [BOT] Iniciando actualización de comandos (/)');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ [BOT] Comandos (/) registrados correctamente.');
    } catch (error) {
        console.error('🔴 [BOT] Error registrando comandos:', error);
    }
}

// --- EVENTOS ---

client.once('clientReady', async () => {
    console.log(`🤖 [BOT] Sesión iniciada como ${client.user.tag}`);
    await ConfigManager.load();
    await refreshCommands();
});

client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));

client.on('messageCreate', (message) => {
    if (message.guild || message.author.bot) return;

    // Delegar a VotingManager para lógica de Roblox User
    VotingManager.handleMessage(message);
});

// Iniciar
client.login(process.env.DISCORD_TOKEN);
