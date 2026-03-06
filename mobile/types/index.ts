export interface User {
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
    studyStreak: number;
    lastStudyDate: string | null;
    totalVideosProcessed: number;
    totalQuizzesTaken: number;
    totalStudyMinutes: number;
    preferences: {
        notifications: boolean;
        darkMode: boolean;
        language: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

export interface Flashcard {
    _id?: string;
    front: string;
    back: string;
}

export interface QuizQuestion {
    _id?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface Video {
    _id: string;
    userId: string;
    youtubeUrl: string;
    youtubeId: string;
    title: string;
    thumbnail: string | null;
    duration: string | null;
    channelName: string | null;
    transcript: string | null;
    summary: string | null;
    notes: string | null;
    flashcards: Flashcard[];
    quizQuestions: QuizQuestion[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    errorMessage: string | null;
    subject: string | null;
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}
