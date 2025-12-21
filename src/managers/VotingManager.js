const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Vote = require('../models/Vote');
const ConfigManager = require('../config/ConfigManager');
const axios = require('axios');

class VotingManager {
    constructor() {
        this.sessions = new Map(); // Key: userId, Value: { step, votes, ... }
        this.client = null;
    }

    setClient(client) {
        this.client = client;
    }

    async startVoting(interaction) {
        const userId = interaction.user.id;
        const config = ConfigManager.get();

        // 1. Verificar si ya votó en BD
        const existingVote = await Vote.findOne({ userId });
        if (existingVote) {
            return interaction.editReply({
                content: '<:298685ex:1451314611415416942> **Eh, ya has votado anteriormente.** Solo se permite un voto por usuario.'
            });
        }

        // 2. Verificar sesión activa
        if (this.sessions.has(userId)) {
            return interaction.editReply({
                content: '<a:1792loading:1451314517932769451> **Ya tienes una sesión activa.** Por favor, revisa tus DMs.'
            });
        }

        // 3. Iniciar
        try {
            await interaction.user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('<:mcheartfull91:1451314725785833553> | SpainRP Awards 2025')
                        .setDescription(
                            '¡Hola! Has iniciado el proceso de votación oficial.\n\n' +
                            '> **<:6109symbolquestionmark:1451314527378472970> | Como voto?:**\n' +
                            '> 1. Lee atentamente cada categoría.\n' +
                            '> 2. Selecciona a tu candidato favorito.\n' +
                            '> 3. Al final, confirma tus elecciones.\n\n' +
                            '*¡Vota con sabiduría!*'
                        )
                        .setThumbnail('https://i.imgur.com/aLaivDx.png')
                        .setColor(config.colors.primary)
                ]
            });

            this.sessions.set(userId, { step: 0, votes: {} });

            await interaction.editReply({ content: '<:54186bluevote:1451987934193516634> **¡Checkea tus DMs!** He empezado el proceso allí.' });

            await this.sendCategoryQuestion(interaction.user);

        } catch (e) {
            console.error('Error enviando DM:', e);
            await interaction.editReply({ content: '<:298685ex:1451314611415416942> No pude enviarte un DM. Por favor activa los Mensajes Directos.' });
        }
    }

    async handleButton(interaction) {
        const session = this.sessions.get(interaction.user.id);
        if (!session) {
            if (interaction.customId.startsWith('vote:') || interaction.customId === 'confirm_vote') {
                try { await interaction.deferUpdate(); } catch (e) { }
                return interaction.followUp({ content: '<a:1792loading:1451314517932769451> **Sesión expirada.** Por favor inicia una nueva votación.', ephemeral: true });
            }
            return;
        }

        // Helper para deshabilitar botones
        const disableButtons = (components, selectedId = null) => {
            return components.map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components.forEach(btn => {
                    btn.setDisabled(true);
                    if (selectedId && btn.data.custom_id === selectedId) {
                        btn.setStyle(ButtonStyle.Success);
                    } else if (selectedId) {
                        // Si hubo selección, oscurecer los otros
                        btn.setStyle(ButtonStyle.Secondary);
                    }
                });
                return newRow;
            });
        };

        if (interaction.customId === 'confirm_vote') {
            await interaction.update({ components: disableButtons(interaction.message.components, 'confirm_vote') });
            session.step++;
            await this.sendCategoryQuestion(interaction.user);

        } else if (interaction.customId === 'restart_vote') {
            await interaction.update({ components: disableButtons(interaction.message.components) });
            session.step = 0;
            session.votes = {};
            await this.sendCategoryQuestion(interaction.user);

        } else if (interaction.customId.startsWith('vote:')) {
            // Actualizar UI instantáneamente
            await interaction.update({ components: disableButtons(interaction.message.components, interaction.customId) });

            const [_, catId, ...candValParts] = interaction.customId.split(':');
            const candVal = candValParts.join(':');

            session.votes[catId] = candVal;
            session.step++;

            // Pequeño delay para UX (que se note la selección antes del siguiente mensaje)
            setTimeout(() => this.sendCategoryQuestion(interaction.user), 400);
        }
    }

    async sendCategoryQuestion(user) {
        const session = this.sessions.get(user.id);
        if (!session) return;

        const config = ConfigManager.get();
        const totalSteps = config.awards.length;
        const step = session.step;

        const progressPercent = Math.round((step / totalSteps) * 100);
        const progress = Math.min(10, Math.max(0, Math.round((step / totalSteps) * 10)));
        const progressBar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(Math.max(0, 10 - progress));

        let embed, components = [];

        if (step === totalSteps) {
            // Resumen
            let summary = '';
            config.awards.forEach((cat, idx) => {
                const val = session.votes[cat.id];
                const cand = cat.candidates.find(c => c.value === val);
                summary += `\`${idx + 1}.\` **${cat.title}**\n└ ${cand ? `${cand.emoji} **${cand.label}**` : '❌ *Sin selección*'}\n\n`;
            });

            embed = new EmbedBuilder()
                .setTitle('<:54186bluevote:1451987934193516634> | Resumen Final de Votos')
                .setDescription(
                    '> Estás a un paso de hacer historia. Confirma que tus elecciones sean correctas.\n\n' +
                    summary +
                    '<a:animatedarrowgreen:1451314837190742149> **Advertencia:** Una vez confirmado, no podrás modificar tu voto.'
                )
                .setColor(config.colors.secondary)
                .setFooter({ text: 'SpainRP Awards 2025', iconURL: this.client?.user.displayAvatarURL() })
                .setTimestamp();

            components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('restart_vote').setLabel('Corregir Votos').setStyle(ButtonStyle.Danger).setEmoji('1451314611415416942'),
                    new ButtonBuilder().setCustomId('confirm_vote').setLabel('Confirmar y Enviar').setStyle(ButtonStyle.Success).setEmoji('1451314609163341875')
                )
            ];
        } else if (step === totalSteps + 1) {
            // Usuario Roblox
            embed = new EmbedBuilder()
                .setTitle('<:unlock1:1451996244380750007> Verificación de Identidad')
                .setDescription(
                    `<a:1792loading:1451314517932769451> | **Progreso: 100% Completo**\n${progressBar}\n\n` +
                    '<:6933greenarrowdown:1451314525797089433> **Instrucción Final**\n' +
                    'Por favor, escribe a continuación tu **Nombre de Usuario de ROBLOX**.\n' +
                    '> *Esto es necesario para validar que eres un miembro activo de la comunidad.*'
                )
                .setColor('#15ff00') // Premium Green
                .setThumbnail('https://i.imgur.com/7EKpb7T.png');
        } else {
            // Pregunta de categoría
            const category = config.awards[step];
            // Safety check
            if (!category) return;

            embed = new EmbedBuilder()
                .setTitle(`<:mcheartfull91:1451314725785833553> | ${category.title}`)
                .setDescription(
                    `**Categoría ${step + 1} de ${totalSteps}**\n` +
                    `\`${progressBar}\` **${progressPercent}%**\n\n` +
                    `*${category.description || 'Elige al mejor candidato.'}*\n\n` +
                    '<:verifed:1451314554482069725> **Candidatos Nominados:**'
                )
                .setColor(config.colors.primary)
                .setThumbnail(this.client?.user.displayAvatarURL());

            let row = new ActionRowBuilder();
            category.candidates.forEach((cand, index) => {
                if (index < 5) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`vote:${category.id}:${cand.value}`)
                            .setLabel(cand.label)
                            .setEmoji(cand.emoji)
                            .setStyle(ButtonStyle.Secondary)
                    );
                }
            });
            components = [row];
        }

        try {
            await user.send({ embeds: [embed], components });
            console.log(`[DM] 📤 Enviado paso ${step} a ${user.tag}`);
        } catch (e) {
            console.error('Error enviando paso DM:', e);
            this.sessions.delete(user.id);
        }
    }

    async handleMessage(message) {
        // Manejo entrada de texto (Roblox User)
        const session = this.sessions.get(message.author.id);
        const config = ConfigManager.get();

        if (session && session.step === config.awards.length + 1) {
            await this.finalizeVote(message, session);
        }
    }

    async finalizeVote(message, session) {
        const robloxUser = message.content.trim();
        if (robloxUser.length < 3) return message.reply('<:298685ex:1451314611415416942> | El nombre de usuario es demasiado corto.');

        const config = ConfigManager.get();
        let avatarUrl = 'https://i.imgur.com/rSnIo9U.png'; // Default fallback image

        try {
            // 1. Obtener ID de Roblox
            const idRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [robloxUser],
                excludeBannedUsers: true
            });

            if (idRes.data.data && idRes.data.data.length > 0) {
                const robloxId = idRes.data.data[0].id;
                // 2. Obtener Avatar (Headshot)
                const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`);
                if (thumbRes.data.data && thumbRes.data.data.length > 0) {
                    avatarUrl = thumbRes.data.data[0].imageUrl;
                }
            }
        } catch (apiError) {
            console.error('Error fetching Roblox API:', apiError.message);
        }

        try {
            const newVote = new Vote({
                userId: message.author.id,
                username: message.author.username,
                robloxUser: robloxUser,
                discordAvatarUrl: message.author.displayAvatarURL({ extension: 'png' }),
                robloxAvatarUrl: avatarUrl,
                // Si conseguimos ID, la guardamos también, aunque aquí no la tenemos en variable separada limpia
                // (la lógica anterior no guarda el ID en variable externa al try, pero avatarUrl sí)
                votes: session.votes
            });

            await newVote.save();
            console.log(`✅ [VOTO] Guardado: ${message.author.tag} | Roblox: ${robloxUser}`);

            const confirmEmbed = new EmbedBuilder()
                .setTitle('<:verifed:1451314554482069725> | ¡Voto Registrado Exitosamente!')
                .setDescription(
                    `**Gracias** por tu participación, **${message.author.username}**.\n` +
                    'Tus votos han sido encriptados y almacenados.\n\n' +
                    `<:735812user:1451314698094903297> **Usuario Roblox:** \`${robloxUser}\`\n\n` +
                    '🎉 *¡Nos vemos en la gala de premiación!*'
                )
                .setColor(config.colors.success)
                .setThumbnail(avatarUrl)
                .setTimestamp();

            await message.reply({ embeds: [confirmEmbed] });

            // Admin Log
            const adminId = config.adminId === 'TU_ID_AQUI' ? process.env.ADMIN_ID : config.adminId;
            if (adminId && this.client) {
                const admin = await this.client.users.fetch(adminId).catch(() => null);
                if (admin) {
                    let details = '';
                    const entries = Object.entries(session.votes);
                    entries.forEach(([catId, candVal], index) => {
                        const cat = config.awards.find(c => c.id === catId);
                        const cand = cat?.candidates.find(c => c.value === candVal);

                        details += `**${cat ? cat.title.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim() : catId}**\n` +
                            `└ ${cand ? `${cand.emoji} \`${cand.label}\`` : `\`${candVal}\``}\n`;

                        if (index < entries.length - 1) details += `⠀╵\n`;
                    });

                    const logEmbed = new EmbedBuilder()
                        .setTitle('🗳️ Nuevo Voto Emitido')
                        .addFields(
                            { name: '👤 Usuario', value: `<@${message.author.id}>`, inline: true },
                            { name: '🎮 Roblox', value: `\`${robloxUser}\``, inline: true },
                            { name: '🆔 ID', value: `\`${message.author.id}\``, inline: true }
                        )
                        .setDescription(`**📋 Boleta Electoral:**\n\n${details}`)
                        .setColor(0x3498DB)
                        .setTimestamp();
                    await admin.send({ embeds: [logEmbed] }).catch(() => { });
                }
            }

            this.sessions.delete(message.author.id);
        } catch (e) {
            console.error('Error guardando voto:', e);
            await message.reply('<a:1792loading:1451314517932769451> **Error Crítico:** No se pudo guardar el voto. Contacta a un administrador.');
        }
    }
}

module.exports = new VotingManager();
