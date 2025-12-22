import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2, AlertCircle, Save, X } from 'lucide-react';
import { getMyVote, updateMyVote } from '../../api/client';
import { toast } from 'sonner';

interface MyVotesTabProps {
    config: any;
}

export const MyVotesTab = ({ config }: MyVotesTabProps) => {
    // State
    const [myVote, setMyVote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [tempSelection, setTempSelection] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Fetch Vote
    useEffect(() => {
        loadVote();
    }, []);

    const loadVote = async () => {
        setLoading(true);
        try {
            const res = await getMyVote();
            if (res.found) {
                // Backend returns "vote" object which has "votes" map/object
                setMyVote(res.vote);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error cargando tu voto");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (catId: string, currentVal: string) => {
        setEditingCategory(catId);
        setTempSelection(currentVal);
    };

    const handleSave = async (catId: string) => {
        if (!tempSelection) return;
        setSaving(true);
        try {
            await updateMyVote({ [catId]: tempSelection });
            toast.success("Voto actualizado correctamente");
            setEditingCategory(null);
            loadVote(); // Reload to confirm
        } catch (e) {
            toast.error("Error actualizando voto");
        } finally {
            setSaving(false);
        }
    };

    const targetCategories = ['mejor_dao', 'mejor_gc'];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-900/40 to-yellow-600/10 border-l-4 border-yellow-500 p-6 rounded-r-xl backdrop-blur-sm shadow-xl"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                        <AlertCircle className="text-yellow-500 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-yellow-100 text-xl mb-2">⚠️ Actualización de Candidatos</h3>
                        <p className="text-yellow-200/80 leading-relaxed mb-2">
                            Se han realizado cambios importantes en las listas:
                        </p>
                        <ul className="list-disc list-inside text-yellow-200/70 text-sm space-y-1">
                            <li><strong>Mejor DAO:</strong> Se ha añadido a <strong>Kyzzi</strong>.</li>
                            <li><strong>Mejor GC:</strong> <strong>Paco_2010</strong> ha sido sustituido por <strong>Nana99772</strong> (Paco no asistirá a la gala).</li>
                        </ul>
                        <p className="text-yellow-200/80 leading-relaxed mt-2">
                            Si ya votaste, puedes modificar tu elección en estas categorías aquí mismo.
                        </p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p>Cargando tus votos...</p>
                </div>
            ) : !myVote ? (
                <div className="text-center py-20 text-gray-400 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-lg">No has votado todavía.</p>
                    <p className="text-sm opacity-60">Ve a Discord y usa /votar para participar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.awards.map((cat: any) => {
                        const isTarget = targetCategories.includes(cat.id);
                        const userVoteVal = myVote.votes[cat.id];
                        const candidate = cat.candidates.find((c: any) => c.value === userVoteVal);

                        const isEditing = editingCategory === cat.id;

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-5 rounded-xl border relative overflow-hidden transition-all ${isTarget ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent' : 'border-white/5 bg-white/5 opacity-70 hover:opacity-100'}`}
                            >
                                {isTarget && <div className="absolute top-0 right-0 p-1 bg-yellow-500/20 rounded-bl-lg text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Modificable</div>}

                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-gray-200 text-lg">{cat.title}</h4>
                                    {isTarget && !isEditing && (
                                        <button
                                            onClick={() => handleEdit(cat.id, userVoteVal)}
                                            className="ml-2 text-xs flex items-center gap-1.5 bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
                                        >
                                            <Edit2 size={12} /> Editar Voto
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                        {cat.candidates.map((c: any) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setTempSelection(c.value)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${tempSelection === c.value ? 'border-green-500/50 bg-green-500/10 text-green-100 ring-1 ring-green-500/20' : 'border-white/5 hover:bg-white/5 text-gray-400'}`}
                                            >
                                                <span className="flex items-center gap-3 font-medium">
                                                    <span className="text-xl">{c.emoji}</span>
                                                    {c.label}
                                                </span>
                                                {tempSelection === c.value && <Check size={16} className="text-green-500" />}
                                            </button>
                                        ))}
                                        <div className="flex gap-2 mt-4 justify-end pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => setEditingCategory(null)}
                                                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSave(cat.id)}
                                                disabled={saving}
                                                className="px-4 py-2 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-500 flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all active:scale-95"
                                            >
                                                {saving ? 'Guardando...' : <><Save size={14} /> Guardar Cambios</>}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                                        {candidate ? (
                                            <>
                                                <span className="text-2xl">{candidate.emoji}</span>
                                                <span className="font-semibold text-gray-200">{candidate.label}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-500 italic flex items-center gap-2">
                                                <X size={16} /> Sin voto registrado
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
