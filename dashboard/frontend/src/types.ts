export interface Candidate {
    label: string;
    value: string;
    emoji: string;
    _id?: string;
}

export interface Category {
    id: string;
    title: string;
    description: string;
    candidates: Candidate[];
    _id?: string;
}

export interface AwardConfigType {
    adminId: string;
    awards: Category[];
    colors: {
        primary: string;
        secondary: string;
        success: string;
        error: string;
        background: string;
    };
}
