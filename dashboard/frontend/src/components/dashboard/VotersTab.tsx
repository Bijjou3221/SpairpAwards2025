import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Search, ChevronDown, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AwardConfigType, Category, Candidate } from '../../types';

interface VotersTabProps {
    stats: any;
    config: AwardConfigType;
}

export const VotersTab = ({ stats, config }: VotersTabProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    if (!stats) return null;

    const filteredVotes = stats.raw.filter((v: any) =>
        v.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.robloxUser.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportPDF = async () => {
        if (!stats) return;

        const doc = new jsPDF();
        const logoUrl = 'https://i.imgur.com/aZMcktO.png';

        const cleanText = (text: string) => {
            if (!text) return "";
            return text.replace(/[^\w\s\u00C0-\u00FF.,:;()\[\]\/-]/g, '').trim();
        };

        const loadImage = (url: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = url;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        reject(new Error('Canvas context failed'));
                    }
                };
                img.onerror = reject;
            });
        };

        try {
            const logoBase64 = await loadImage(logoUrl);
            doc.addImage(logoBase64, 'PNG', 160, 10, 35, 35);
        } catch (e) {
            console.error('Error loading watermark:', e);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(212, 175, 55);
        doc.text("SpainRP Awards 2025", 14, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Reporte Oficial de Votantes`, 14, 32);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 37);
        doc.text(`Total Votos: ${stats.totalVotes}`, 14, 42);

        const categoryMap = new Map();
        const candidateMap = new Map();

        if (config && config.awards) {
            config.awards.forEach((cat: Category) => {
                categoryMap.set(cat.id, cat.title);
                cat.candidates.forEach((cand: Candidate) => {
                    candidateMap.set(cand.value, cand.label);
                });
            });
        }

        const tableData = stats.raw.map((vote: any) => {
            const votesDetail = Object.entries(vote.votes).map(([catId, candVal]) => {
                const catTitle = cleanText(categoryMap.get(catId) || catId);
                // @ts-ignore
                const candName = cleanText(candidateMap.get(candVal) || candVal);
                return `• ${catTitle}: ${candName}`;
            }).join('\n');

            return [
                cleanText(vote.username),
                cleanText(vote.robloxUser),
                cleanText(vote.userId),
                new Date(vote.createdAt).toLocaleDateString() + ' ' + new Date(vote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                votesDetail
            ];
        });

        autoTable(doc, {
            head: [['Usuario Discord', 'Roblox', 'Discord ID', 'Fecha', 'Votos Detallados']],
            body: tableData,
            startY: 50,
            theme: 'grid',
            headStyles: {
                fillColor: [20, 20, 20],
                textColor: [212, 175, 55],
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak',
                valign: 'top',
                lineColor: [220, 220, 220],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 25, fontStyle: 'bold' },
                1: { cellWidth: 25 },
                2: { cellWidth: 32, font: 'courier' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 'auto' }
            },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.setTextColor(150);
                const pageStr = `Página ${doc.internal.pages.length - 1} - SpainRP Awards`;
                doc.text(pageStr, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save('SpainRP_Awards_Votos_Completo.pdf');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121212]/50 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl font-bold text-white">Registro de Votantes</h2>
                    <p className="text-sm text-gray-500">Historial completo de votos emitidos.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg hover:shadow-white/20 whitespace-nowrap"
                    >
                        <FileDown size={16} />
                        Exportar PDF
                    </button>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario o ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-black/30 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-gold outline-none w-full sm:w-64 transition-all focus:sm:w-80"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/30 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Usuario Discord</th>
                            <th className="p-4">Perfil Roblox</th>
                            <th className="p-4">IDs</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4 text-center">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredVotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vote: any) => {
                            const isExpanded = expandedRow === vote._id;
                            return (
                                <Fragment key={vote._id}>
                                    <tr className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`} onClick={() => setExpandedRow(isExpanded ? null : vote._id)}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={vote.discordAvatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(vote.userId) % 5}.png`}
                                                    className="w-10 h-10 rounded-full ring-2 ring-white/10"
                                                    alt="Discord Avatar"
                                                    onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                                />
                                                <div>
                                                    <span className="font-bold text-white block">{vote.username}</span>
                                                    <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Verificado</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                                                    {vote.robloxAvatarUrl ? (
                                                        <img
                                                            src={vote.robloxAvatarUrl}
                                                            alt="Roblox"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <img
                                                            src="https://tr.rbxcdn.com/30day/avatar-headshot/png"
                                                            alt="Roblox Placeholder"
                                                            className="w-full h-full object-cover opacity-50"
                                                        />
                                                    )}
                                                </div>
                                                <span className="font-mono text-gold text-sm font-bold">{vote.robloxUser}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-black/40 px-2 py-1 rounded w-fit" title="Discord ID">
                                                    <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-3 h-3" alt="ID" />
                                                    {vote.userId}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(vote.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-gold text-black rotate-180' : 'hover:bg-white/10 text-gray-400'}`}>
                                                <ChevronDown size={16} className="transition-transform duration-300" />
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-black/20">
                                            <td colSpan={5} className="p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    {Object.entries(vote.votes).map(([catId, val]) => {
                                                        const category = config?.awards.find((c: any) => c.id === catId);
                                                        const candidate = category?.candidates.find((cd: any) => cd.value === val);
                                                        return (
                                                            <div key={catId} className="bg-gradient-to-br from-[#121212] to-black p-4 rounded-xl border border-white/5 flex items-start gap-4 hover:border-gold/30 transition-colors shadow-lg">
                                                                <div className="text-3xl bg-white/5 w-12 h-12 flex items-center justify-center rounded-lg">{candidate?.emoji || '❓'}</div>
                                                                <div>
                                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-0.5">{category?.title || catId}</p>
                                                                    <p className="text-sm text-gold font-bold">{candidate?.label || (val as string)}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {filteredVotes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
                                    <Search size={48} className="opacity-20" />
                                    <p>No se encontraron votantes con ese criterio.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards (Stack) */}
            <div className="md:hidden space-y-4">
                {filteredVotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vote: any) => {
                    const isExpanded = expandedRow === vote._id;
                    return (
                        <div key={vote._id} className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                            <div className="p-5 flex flex-col gap-4" onClick={() => setExpandedRow(isExpanded ? null : vote._id)}>
                                {/* Header Info */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={vote.discordAvatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(vote.userId) % 5}.png`}
                                            className="w-12 h-12 rounded-full ring-2 ring-white/10"
                                            alt="Discord Avatar"
                                            onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                        />
                                        <div>
                                            <span className="font-bold text-white text-lg block">{vote.username}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-black/40 px-2 py-0.5 rounded w-fit">
                                                    <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-3 h-3" alt="ID" />
                                                    {vote.userId}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className={`p-2 rounded-full bg-white/5 text-gray-400 ${isExpanded ? 'rotate-180 text-gold bg-gold/10' : ''} transition-all`}>
                                        <ChevronDown size={20} />
                                    </button>
                                </div>

                                {/* Roblox Info & Date */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                                            {vote.robloxAvatarUrl ? (
                                                <img src={vote.robloxAvatarUrl} alt="Roblox" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px]">?</span>
                                            )}
                                        </div>
                                        <span className="font-mono text-gold text-xs font-bold">{vote.robloxUser}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{new Date(vote.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="bg-black/20 p-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.entries(vote.votes).map(([catId, val]) => {
                                            const category = config?.awards.find((c: any) => c.id === catId);
                                            const candidate = category?.candidates.find((cd: any) => cd.value === val);
                                            return (
                                                <div key={catId} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/20 rounded-lg">{candidate?.emoji}</div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{category?.title}</p>
                                                        <p className="text-sm text-gold font-bold">{candidate?.label || (val as string)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {
                filteredVotes.length > itemsPerPage && (
                    <div className="flex justify-between items-center bg-[#121212]/50 p-4 rounded-xl border border-white/10">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-400">
                            Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{Math.ceil(filteredVotes.length / itemsPerPage)}</span>
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredVotes.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(filteredVotes.length / itemsPerPage)}
                            className="px-4 py-2 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                )
            }

            {/* Visual Separator */}
            <div className="py-12 flex items-center justify-center relative">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="absolute bg-[#0a0a0a] px-4 text-gray-500 text-xs uppercase tracking-widest font-bold">Análisis Detallado</div>
            </div>

            {/* Drilldown Section */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="bg-primary/20 p-2 rounded-xl text-primary"><Users size={24} /></span>
                            Desglose por Categoría
                        </h3>
                        <p className="text-gray-400 mt-2 ml-1">Explora cada votación al detalle. <span className="text-gold font-bold">Haz click</span> en los candidatos para ver quién les votó.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config?.awards.map((cat: Category) => {
                        const totalVotes = stats.detail[cat.id] || 0;
                        return (
                            <div key={cat.id} className="bg-[#121212]/60 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:from-gold/5 transition-all"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <h4 className="font-bold text-lg text-white leading-tight w-3/4" title={cat.title}>{cat.title}</h4>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-white">{totalVotes}</span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Votos</span>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {cat.candidates.map((cand, idx) => {
                                        const candVotes = stats.raw.filter((v: any) => v.votes[cat.id] === cand.value);
                                        const voteCount = candVotes.length;
                                        const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                                        return (
                                            <div
                                                key={idx}
                                                className="group/item cursor-pointer hover:bg-white/5 p-2.5 -mx-2.5 rounded-xl transition-all border border-transparent hover:border-white/5 active:scale-[0.98]"
                                                onClick={() => setExpandedRow(`modal:${cat.id}:${cand.value}`)}
                                            >
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-gray-300 flex items-center gap-2 font-medium">
                                                        <span className="text-base filter grayscale group-hover/item:grayscale-0 transition-all">{cand.emoji}</span>
                                                        <span className="group-hover/item:text-white transition-colors">{cand.label}</span>
                                                    </span>
                                                    <span className="text-gold font-bold bg-gold/10 px-2 py-0.5 rounded-full text-[10px]">{voteCount}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-gold to-yellow-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {expandedRow && expandedRow.startsWith('modal:') && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setExpandedRow(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(() => {
                                const [_, catId, candVal] = expandedRow.split(':');
                                const category = config?.awards.find((c: any) => c.id === catId);
                                const candidate = category?.candidates.find((cd: any) => cd.value === candVal);
                                const voters = stats.raw.filter((v: any) => v.votes[catId] === candVal);

                                return (
                                    <>
                                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">{candidate?.emoji}</div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{candidate?.label}</h3>
                                                    <p className="text-sm text-gold">{category?.title}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-2xl font-black text-white">{voters.length}</span>
                                                <span className="text-xs text-gray-400 uppercase tracking-widest">Votos</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-2">
                                            {voters.map((v: any) => (
                                                <div key={v._id} className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={v.discordAvatarUrl || `https://cdn.discordapp.com/embed/avatars/${parseInt(v.userId) % 5}.png`}
                                                            className="w-10 h-10 rounded-full"
                                                            alt="Discord"
                                                            onError={(e) => { e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                                        />
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{v.username}</p>
                                                            <p className="text-xs text-gray-500">{v.userId}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="font-mono text-gold text-xs">{v.robloxUser}</p>
                                                        </div>
                                                        {v.robloxAvatarUrl ? (
                                                            <img src={v.robloxAvatarUrl} className="w-8 h-8 rounded-full bg-gray-700" alt="Roblox" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">?</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {voters.length === 0 && <p className="text-center text-gray-500 py-10">Nadie ha votado por este candidato aún.</p>}
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
