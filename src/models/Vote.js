const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true // Asegura que solo voten una vez
    },
    username: String, // Discord username
    robloxUser: {
        type: String,
        required: true
    },
    discordAvatarUrl: String,
    robloxAvatarUrl: String,
    robloxId: String,
    votes: {
        type: Map,
        of: String // categoryId: candidateValue
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vote', voteSchema);
