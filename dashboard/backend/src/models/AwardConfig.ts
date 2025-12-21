import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate {
    label: string;
    value: string;
    emoji: string;
}

export interface ICategory {
    id: string;
    title: string;
    description: string;
    candidates: ICandidate[];
}

export interface IAwardConfig extends Document {
    adminIds: string[];
    awards: ICategory[];
    colors: {
        primary: string;
        secondary: string;
        success: string;
        error: string;
        background: string;
    };
    updatedAt: Date;
}

const CandidateSchema: Schema = new Schema({
    label: { type: String, required: true },
    value: { type: String, required: true },
    emoji: { type: String, required: true }
});

const CategorySchema: Schema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    candidates: [CandidateSchema]
});

const AwardConfigSchema: Schema = new Schema({
    adminIds: { type: [String], required: true, default: [] },
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

export default mongoose.model<IAwardConfig>('AwardConfig', AwardConfigSchema);
