const { createCanvas, loadImage } = require('canvas');

/**
 * Genera una imagen con los resultados sumarizados (Barras)
 */
async function generateResultsImage(awardsConfig, votes) {
    const totalVotes = votes.length;
    const data = processVotes(awardsConfig, votes);

    // Calcular altura dinámica
    const width = 1000;
    const headerHeight = 160;
    const categoryHeight = 60;
    const candidateHeight = 55;
    const spacing = 40;

    let totalHeight = headerHeight + 50;
    data.forEach(cat => {
        totalHeight += categoryHeight;
        totalHeight += (candidateHeight + 10) * cat.candidates.length;
        totalHeight += spacing;
    });

    const canvas = createCanvas(width, totalHeight);
    const ctx = canvas.getContext('2d');

    // Fondo
    drawBackground(ctx, width, totalHeight);

    // Header
    drawHeader(ctx, width, '📊 Resultados Oficiales', `Participación: ${totalVotes} votos`);

    // Content
    let currentY = headerHeight + 50;

    for (const cat of data) {
        // Category Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(cat.title, 40, currentY);

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(40, currentY + 15);
        ctx.lineTo(width - 40, currentY + 15);
        ctx.stroke();

        currentY += 60;

        // Candidates
        for (const [index, cand] of cat.candidates.entries()) {
            drawProgressBar(ctx, cand, index, 40, currentY, width - 80, totalVotes);
            currentY += 65;
        }
        currentY += 20;
    }

    drawFooter(ctx, width, totalHeight);
    return canvas.toBuffer();
}

/**
 * Genera una imagen detallada con la lista de votantes por candidato (Log)
 */
/**
 * Genera imágenes detalladas (Logs) divididas si son muy largas
 */
async function generateDetailedLogImage(awardsConfig, votes, client) {
    const width = 1200;
    const headerHeight = 180;
    const cardHeight = 70;
    const cardWidth = 350;
    const colCount = 3;
    const padding = 40;
    const maxCanvasHeight = 10000; // Límite seguro para Discord/Canvas

    const data = processVotes(awardsConfig, votes, true);

    // Calcular altura total requerida
    let calculatedTotalHeight = 0;
    data.forEach(cat => {
        calculatedTotalHeight += 100; // Cat Title + Spacing
        cat.candidates.forEach(cand => {
            calculatedTotalHeight += 60; // Cand Title
            const rows = Math.ceil((cand.voters.length || 0) / colCount);
            // Si row es 0 (sin votos) altura min
            const actualRows = rows > 0 ? rows : 1;
            calculatedTotalHeight += actualRows * (cardHeight + 15);
            calculatedTotalHeight += 20;
        });
        calculatedTotalHeight += 40;
    });

    // Si es pequeño, una sola imagen
    if (calculatedTotalHeight < maxCanvasHeight) {
        return [await drawChunk(data, width, calculatedTotalHeight, headerHeight, padding, cardWidth, cardHeight, colCount, client, 1, 1)];
    }

    // Si es grande, dividir
    const chunks = [];
    const categoriesPerChunk = 6; // Ajustable
    for (let i = 0; i < data.length; i += categoriesPerChunk) {
        const chunkData = data.slice(i, i + categoriesPerChunk);

        // Recalcular altura para este chunk
        let chunkHeight = headerHeight + 50 + 100; // Base + Footer safety
        chunkData.forEach(cat => {
            chunkHeight += 100;
            cat.candidates.forEach(cand => {
                chunkHeight += 60;
                const rows = Math.ceil((cand.voters.length || 0) / colCount);
                const actualRows = rows > 0 ? rows : 1;
                chunkHeight += actualRows * (cardHeight + 15);
                chunkHeight += 20;
            });
            chunkHeight += 20;
        });

        const buffer = await drawChunk(chunkData, width, chunkHeight, headerHeight, padding, cardWidth, cardHeight, colCount, client, Math.floor(i / categoriesPerChunk) + 1, Math.ceil(data.length / categoriesPerChunk));
        chunks.push(buffer);
    }

    return chunks;
}

async function drawChunk(data, width, totalHeight, headerHeight, padding, cardWidth, cardHeight, colCount, client, pageNum, totalPages) {
    const canvas = createCanvas(width, totalHeight);
    const ctx = canvas.getContext('2d');

    drawBackground(ctx, width, totalHeight);
    drawHeader(ctx, width, '📋 Registro Detallado de Votos', `Página ${pageNum} de ${totalPages} • SpainRP Awards 2025`);

    let currentY = headerHeight + padding;

    for (const cat of data) {
        // Título Categoría
        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`📂 ${cat.title}`, padding, currentY);
        currentY += 60;

        for (const cand of cat.candidates) {
            // Título Candidato
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial';
            ctx.fillText(`${cand.emoji} ${cand.label} — (${cand.count} votos)`, padding + 20, currentY);
            currentY += 40;

            // Grid de Votantes
            let x = padding + 20;

            if (cand.voters.length === 0) {
                ctx.fillStyle = '#555555';
                ctx.font = 'italic 20px Arial';
                ctx.fillText('Sin votos registrados.', x, currentY);
                currentY += 40;
            } else {
                for (const [vIndex, voter] of cand.voters.entries()) {
                    await drawVoterCard(ctx, client, voter, x, currentY, cardWidth, cardHeight);
                    x += cardWidth + 15;
                    if ((vIndex + 1) % colCount === 0) {
                        x = padding + 20;
                        currentY += cardHeight + 15;
                    }
                }
                // Ajustar si quedó fila a medias
                if (cand.voters.length % colCount !== 0) {
                    currentY += cardHeight + 15;
                }
            }
            currentY += 20; // Spacer entre candidatos
        }
        currentY += 40; // Spacer entre categorías
    }

    drawFooter(ctx, width, totalHeight);
    return canvas.toBuffer();
}


// --- Helpers ---

function processVotes(awardsConfig, votes, detailed = false) {
    return awardsConfig.map(category => {
        const counts = {};
        const voterMap = {}; // value -> array of votes

        category.candidates.forEach(c => {
            counts[c.value] = 0;
            voterMap[c.value] = [];
        });

        votes.forEach(vote => {
            const userVotes = vote.votes || {};
            const val = userVotes[category.id];
            if (val && counts[val] !== undefined) {
                counts[val]++;
                if (detailed) {
                    voterMap[val].push({
                        userId: vote.userId,
                        username: vote.username,
                        robloxUser: vote.robloxUser,
                        avatarUrl: null // Se rellenará si podemos
                    });
                }
            }
        });

        const sorted = [...category.candidates].sort((a, b) => counts[b.value] - counts[a.value]);

        return {
            title: category.title,
            candidates: sorted.map(c => ({
                label: c.label,
                emoji: c.emoji,
                value: c.value,
                count: counts[c.value],
                percent: votes.length > 0 ? counts[c.value] / votes.length : 0,
                voters: detailed ? voterMap[c.value] : []
            }))
        };
    });
}

function drawBackground(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#121212');
    grad.addColorStop(1, '#23272A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawHeader(ctx, w, title, subtitle) {
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 80);

    ctx.fillStyle = '#bbbbbb';
    ctx.font = '30px Arial';
    ctx.fillText(subtitle, w / 2, 130);
    ctx.textAlign = 'left';
}

function drawProgressBar(ctx, cand, index, x, y, w, total) {
    const maxBarW = w - 250;
    const barW = maxBarW * cand.percent;
    const highlight = index === 0 ? '#D4AF37' : '#7289da';

    // Label
    ctx.fillStyle = index === 0 ? '#FFD700' : '#ffffff';
    ctx.font = 'bold 28px Arial';
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
    ctx.fillText(`${medal} ${cand.emoji} ${cand.label}`, x, y);

    // Background Bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 350, y - 25, maxBarW, 30);

    // Fill Bar
    if (barW > 0) {
        ctx.fillStyle = highlight;
        ctx.fillRect(x + 350, y - 25, barW, 30);
    }

    // Text
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${(cand.percent * 100).toFixed(1)}% (${cand.count})`, x + w, y);
    ctx.textAlign = 'left';
}

async function drawVoterCard(ctx, client, voter, x, y, w, h) {
    // Card Background
    ctx.fillStyle = '#2C2F33';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();

    // Avatar
    try {
        let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
        if (client) {
            // Try to fetch from cache or use basic construction if possible
            // We avoid raw fetch per user to avoid rate limits if too many, but for reasonable usage:
            try {
                const user = await client.users.fetch(voter.userId);
                avatarUrl = user.displayAvatarURL({ extension: 'png', size: 64 });
            } catch (e) { }
        }

        const avatar = await loadImage(avatarUrl);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + 35, y + 35, 25, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x + 10, y + 10, 50, 50);
        ctx.restore();
    } catch (e) {
        // Fallback circle
        ctx.fillStyle = '#7289da';
        ctx.beginPath();
        ctx.arc(x + 35, y + 35, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Texts
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(voter.username || 'Usuario', x + 70, y + 30);

    ctx.fillStyle = '#99aab5';
    ctx.font = '16px Arial';
    ctx.fillText(`🎮 ${voter.robloxUser}`, x + 70, y + 55);
}

function drawFooter(ctx, w, h) {
    ctx.fillStyle = '#444444';
    ctx.font = 'italic 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SpainRP Awards System • Generado automáticamente', w / 2, h - 20);
}

module.exports = { generateResultsImage, generateDetailedLogImage };
