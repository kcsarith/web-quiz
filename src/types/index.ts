export type ImageOrNull = string | null;

export type TtsEngineType = {
    baseUrl?: string | null;
    token?: string | null;
    model?: string | null;
    voiceName?: string | null;
}

export type TeacherExpressionsType = {
    neutral: string;
    happy: string;
    sad: string;
    angry: string;
    worried: string;
    excited: string;
}

export type TeacherType = {
    name: string;
    gender: string;
    background: string;
    personality: string;
    ttsEngine: TtsEngineType;
    images: TeacherExpressionsType;
}

export type QuizType = {
    question: string;
    question_images: string[];
    choices: string[];
    choiceImages: ImageOrNull[];
    notes: string[];
    noteImages: ImageOrNull[]
    answers: string[]
}

export type UserPrefsFavoritesType = {
    [key: string]: string[];
}

export type UserPrefsRecordType = {
    attempts: number;
    pass: number;
    lastAttempted: number | null;
}
export type UserPrefsRecordsType = {
    [key: string]: UserPrefsRecordType;
}

export type UserPrefsType = {
    username: string,
    image: ImageOrNull;
    teacher: string | null;
    favorites: UserPrefsFavoritesType;
    records: UserPrefsRecordsType;
}

export const defaultPrefs: UserPrefsType = {
    username: "Default",
    image: null,
    teacher: null,
    favorites: {
        "❤️️ Liked": [],
        "☠️ Difficult": [],
    },
    records: {}
}
