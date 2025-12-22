import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
    userId: string;
    username: string;
    robloxUser: string;
    votes: Map<string, string>; // Map categoryId -> candidateValue
    createdAt: Date;
}

const VoteSchema: Schema = new Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    robloxUser: { type: String, required: true },
    votes: { type: Map, of: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVote>('Vote', VoteSchema);
