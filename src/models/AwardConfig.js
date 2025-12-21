const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    label: { type: String, required: true },
    value: { type: String, required: true },
    emoji: { type: String, required: true }
});

const CategorySchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    candidates: [CandidateSchema]
});

const AwardConfigSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    awards: [CategorySchema],
    colors: {
        primary: { type: String, required: true },
        secondary: { type: String, required: true },
        success: { type: String, required: true },
        error: { type: String, required: true },
        background: { type: String, required: true }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AwardConfig', AwardConfigSchema);
