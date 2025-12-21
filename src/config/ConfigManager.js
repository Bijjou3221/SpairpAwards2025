const AwardConfig = require('../models/AwardConfig');
const defaults = require('../defaults');

class ConfigManager {
    constructor() {
        this.config = null;
    }

    async load() {
        try {
            let dbConfig = await AwardConfig.findOne();
            if (!dbConfig) {
                console.log('⚠️ [CONFIG] No se encontró configuración en DB. Creando desde defaults...');
                dbConfig = new AwardConfig({
                    adminId: defaults.adminId,
                    awards: defaults.awards,
                    colors: defaults.colors
                });
                await dbConfig.save();
            }
            this.config = dbConfig;
            console.log('✅ [CONFIG] Configuración cargada correctamente.');
        } catch (e) {
            console.error('🔴 [CONFIG] Error cargando configuración:', e);
            this.config = defaults;
        }
        return this.config;
    }

    get() {
        if (!this.config) {
            return defaults; // Fallback seguro
        }
        return this.config;
    }
}

module.exports = new ConfigManager();
