const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    MessageFlags
} = require('discord.js');
const ConfigManager = require('../config/ConfigManager');
const VotingManager = require('../managers/VotingManager');
const Vote = require('../models/Vote');
const { generateResultsImage, generateDetailedLogImage } = require('../utils/resultsGenerator');

async function handleCommand(interaction, client) {
    const { commandName } = interaction;
    const config = ConfigManager.get();

    // Get admins from ENV or fallback to singular config (supporting legacy)
    const envAdminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    const configAdminId = config.adminId === 'TU_ID_AQUI' ? null : config.adminId;
    const allowedIds = new Set([...envAdminIds, configAdminId].filter(Boolean));

    if (!allowedIds.has(interaction.user.id)) {
        return interaction.reply({
            content: '⛔ **Acceso Denegado:** No tienes permisos de administrador.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (commandName === 'enviar-panel') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        // Refrescamos config antes de enviar
        await ConfigManager.load();

        const embed = new EmbedBuilder()
            .setDescription(
                `# <:spainrp_iconoremovebgpreview:1451314972339601488> SpainRP Awards 2025\n\n` +
                `> *Celebramos la **excelencia**, el **talento** y la **dedicación** de nuestra comunidad.*\n\n` +
                `<:mcheartfull91:1451314725785833553> **TU VOTO DECIDE LA HISTORIA**\n` +
                `El poder está en tus manos. Elige a quienes marcaron la diferencia este año.\n\n` +
                `<:6933greenarrowdown:1451314525797089433> **PROCESO DE VOTACIÓN**\n` +
                `\` 1 \` Pulsa **Empezar Votación** aquí abajo.\n\n` +
                `\` 2 \` Revisa tus **Mensajes Privados (MD)**.\n\n` +
                `\` 3 \` **Selecciona** a tus favoritos en cada categoría.\n\n` +
                `\` 4 \` Valida tu identidad con tu usuario de **Roblox**.\n\n` +
                `<:verifed:1451314554482069725> *Sistema de votación seguro.*`
            )
            .setColor(0xD4AF37)
            .setImage('https://media.discordapp.net/attachments/1427072984182423716/1451313021602496632/Gold_Modern_Elegant_Awards_Night_Presentation.png?ex=6945b814&is=69446694&hm=d7bc82082cb7236b8b3ef81770de3ed80b482f5b4afd742e9e145008a2101031&=&format=webp&quality=lossless')
            .setFooter({ text: 'SpainRP Awards 2025', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('start_voting').setLabel('Empezar Votación').setStyle(ButtonStyle.Success).setEmoji('1451987934193516634')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Panel desplegado correctamente.' });
    }

    if (commandName === 'resultados') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        await ConfigManager.load(); // Refresh to get latest colors/config

        const votes = await Vote.find().lean();
        if (votes.length === 0) {
            return interaction.editReply({ content: '📭 Aún no hay votos.' });
        }

        try {
            const buffer = await generateResultsImage(config.awards, votes);
            const attachment = new AttachmentBuilder(buffer, { name: 'resultados.png' });

            const detailBuffers = await generateDetailedLogImage(config.awards, votes, client);
            const detailAttachments = detailBuffers.map((buf, i) => new AttachmentBuilder(buf, { name: `detalles_${i + 1}.png` }));

            const resultEmbed = new EmbedBuilder()
                .setTitle('📊 Resultados - SpainRP Awards 2025')
                .setDescription(`Total de votos registrados: \`${votes.length}\``)
                .setColor(config.colors.primary)
                .setImage('attachment://resultados.png');

            await interaction.editReply({
                content: '📊 Aquí tienes el escrutinio actual:',
                embeds: [resultEmbed],
                files: [attachment, ...detailAttachments]
            });
        } catch (error) {
            console.error('Error en resultados:', error);
            await interaction.editReply({ content: '❌ Error al generar las imágenes.' });
        }
    }
}

async function handleInteraction(interaction, client) {
    const timestamp = new Date().toLocaleTimeString();

    try {
        if (interaction.isChatInputCommand()) {
            console.log(`[${timestamp}] ⌨️ Comando: /${interaction.commandName} por ${interaction.user.tag}`);
            await handleCommand(interaction, client);
        } else if (interaction.isButton()) {
            const { customId } = interaction;
            console.log(`[${timestamp}] 🖱️ Botón: ${customId} por ${interaction.user.tag}`);

            if (customId === 'start_voting') {
                // Para start_voting, cargamos config reciente y delegamos al manager
                await ConfigManager.load();
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                await VotingManager.startVoting(interaction);
            } else {
                // Delegar resto de botones de votación
                await VotingManager.handleButton(interaction);
            }
        }
    } catch (error) {
        console.error(`🔴 [${timestamp}] Error en interacción:`, error);
        if (interaction.repliable || !interaction.acknowledged) {
            try {
                const method = (interaction.replied || interaction.deferred) ? 'followUp' : 'reply';
                await interaction[method]({
                    content: '❌ **Error Interno:** Se ha producido un problema al procesar esta acción.',
                    flags: [MessageFlags.Ephemeral]
                });
            } catch (e) { }
        }
    }
}

module.exports = { handleInteraction };
