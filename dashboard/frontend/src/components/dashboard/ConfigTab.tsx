import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, Users, Plus, Trash2 } from 'lucide-react';
import { updateConfig } from '../../api/client';
import type { AwardConfigType, Category, Candidate } from '../../types';

interface ConfigTabProps {
    config: AwardConfigType;
    setConfig: (config: AwardConfigType) => void;
}

export const ConfigTab = ({ config, setConfig }: ConfigTabProps) => {
    const [saving, setSaving] = useState(false);

    if (!config) return null;

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await updateConfig({ awards: config.awards, colors: config.colors });
            alert('Configuración guardada correctamente. El bot se actualizará en el próximo comando.');
        } catch (e) {
            alert('Error guardando configuración');
        }
        setSaving(false);
    };

    const addCandidate = (catIndex: number) => {
        const newAwards = config.awards.map((award, i) => {
            if (i === catIndex) {
                return {
                    ...award,
                    candidates: [
                        ...award.candidates,
                        {
                            label: 'Nuevo Candidato',
                            value: `cand_${Date.now()}`,
                            emoji: '🆕'
                        }
                    ]
                };
            }
            return award;
        });
        setConfig({ ...config, awards: newAwards });
    };

    const removeCandidate = (catIndex: number, candIndex: number) => {
        if (!confirm('¿Estás seguro de eliminar este candidato?')) return;
        const newAwards = [...config.awards];
        newAwards[catIndex].candidates.splice(candIndex, 1);
        setConfig({ ...config, awards: newAwards });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20"
        >
            <div className="sticky top-0 bg-[#121212]/90 backdrop-blur-xl p-4 rounded-xl z-20 flex flex-col items-start md:flex-row md:items-center justify-between gap-4 border border-white/10 mb-6 shadow-2xl">
                <div>
                    <h2 className="text-xl font-bold text-white">Editor de Configuración</h2>
                    <p className="text-xs text-gray-400">Modifica categorías y candidatos en tiempo real</p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-700 text-black px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-gold/30 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
                >
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>{saving ? 'Guardando...' : 'Guardar y Aplicar'}</span>
                </button>
            </div>

            <div className="space-y-8">
                {config.awards.map((category: Category, idx: number) => (
                    <div key={idx} className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-lg group hover:border-white/20 transition-all">

                        {/* Category Header */}
                        <div className="bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a] to-gold/5 p-6 border-b border-white/5">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/4">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">ID (Interno)</label>
                                    <input
                                        type="text"
                                        value={category.id}
                                        disabled
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-gray-500 text-sm font-mono cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Título de la Categoría</label>
                                    <input
                                        type="text"
                                        value={category.title}
                                        onChange={(e) => {
                                            const newAwards = [...config.awards];
                                            newAwards[idx].title = e.target.value;
                                            setConfig({ ...config, awards: newAwards });
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white font-medium focus:border-gold outline-none focus:ring-1 focus:ring-gold/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Descripción para el panel</label>
                                <input
                                    type="text"
                                    value={category.description}
                                    onChange={(e) => {
                                        const newAwards = [...config.awards];
                                        newAwards[idx].description = e.target.value;
                                        setConfig({ ...config, awards: newAwards });
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-gray-400 text-sm focus:border-gold outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Candidates Section */}
                        <div className="p-6 bg-black/20">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Users size={14} /> Candidatos Nominados
                                </h4>
                                <button
                                    onClick={() => addCandidate(idx)}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-gold px-3 py-1 rounded-full flex items-center gap-1 transition-colors border border-gold/10 hover:border-gold/30"
                                >
                                    <Plus size={12} /> Añadir Candidato
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {category.candidates.map((cand: Candidate, cIdx: number) => (
                                    <div key={cIdx} className="flex gap-3 items-center bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="w-12 flex flex-col items-center">
                                            <input
                                                type="text"
                                                value={cand.emoji}
                                                onChange={(e) => {
                                                    const newAwards = [...config.awards];
                                                    newAwards[idx].candidates[cIdx].emoji = e.target.value;
                                                    setConfig({ ...config, awards: newAwards });
                                                }}
                                                className="w-10 text-center bg-transparent text-2xl outline-none"
                                                title="Emoji"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <input
                                                type="text"
                                                value={cand.label}
                                                placeholder="Nombre Candidato"
                                                onChange={(e) => {
                                                    const newAwards = [...config.awards];
                                                    newAwards[idx].candidates[cIdx].label = e.target.value;
                                                    setConfig({ ...config, awards: newAwards });
                                                }}
                                                className="bg-transparent border-b border-white/10 px-1 py-0.5 text-sm text-white font-medium focus:border-gold outline-none w-full"
                                            />
                                            <input
                                                type="text"
                                                value={cand.value}
                                                placeholder="Valor interno (ID)"
                                                onChange={(e) => {
                                                    const newAwards = [...config.awards];
                                                    newAwards[idx].candidates[cIdx].value = e.target.value;
                                                    setConfig({ ...config, awards: newAwards });
                                                }}
                                                className="bg-transparent border-none px-1 py-0 text-xs text-gray-500 font-mono focus:text-gray-300 outline-none w-full"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeCandidate(idx, cIdx)}
                                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Eliminar candidato"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
