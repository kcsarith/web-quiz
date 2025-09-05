
export interface ApiResponseProps {
    status: number;
    data: any;
    timestamp: string;
}

export interface RequestFormProps {
    endpoint: string;
    setEndpoint: (value: string) => void;
    method: string;
    setMethod: (value: string) => void;
    body: string;
    setBody: (value: string) => void;
    onSendRequest: () => void;
    loading: boolean;
}

export interface ResponseDisplayProps {
    response: ApiResponseProps | null;
    error: string | null;
    onClear: () => void;
}


export type ImageOrNull = string | null;

export type TtsEngineType = {
    baseUrl?: string | null;
    token?: string | null;
    model?: string | null;
    voiceName?: string | null;
}

export type SpeechBubble = {
    message: string;
    isVisible: boolean;
    autoHide?: boolean;
    duration?: number;
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
    choice_images: ImageOrNull[];
    notes: string[];
    note_images: ImageOrNull[]
    answers: string[]
}

export type UserPrefsFavoriteType = {
    [key: string]: boolean;
}
export type UserPrefsFavoritesType = {
    [key: string]: UserPrefsFavoriteType;
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
    username: string;
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
        "❤️️ Liked": {},
        "☠️ Difficult": {},
    },
    records: {}
}

export type LLM_Message = {
    role: string;
    content: string;
}

export type LLM_Props = {
    model: string;
    messages: LLM_Message[];
}
