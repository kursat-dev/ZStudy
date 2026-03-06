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
    examTarget: string | null;
    estimatedScore: number | null;
    examDate: string | null;
    weeklyStats: WeeklyStats[];
    preferences: {
        notifications: boolean;
        darkMode: boolean;
        language: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface WeeklyStats {
    week: string;
    videosWatched: number;
    quizzesTaken: number;
    accuracy: number;
    minutesStudied: number;
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

export interface TimestampNote {
    _id?: string;
    time: string;
    seconds: number;
    note: string;
}

export interface YksQuestion {
    _id?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'kolay' | 'orta' | 'zor';
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
    timestampNotes: TimestampNote[];
    yksQuestions: YksQuestion[];
    watchProgress: {
        completed: boolean;
        lastPosition: number;
        watchedAt: string | null;
    };
    status: 'pending' | 'processing' | 'completed' | 'failed';
    errorMessage: string | null;
    subject: string | null;
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StudyAnalytics {
    _id: string;
    userId: string;
    subject: string;
    videosWatched: number;
    totalQuestions: number;
    correctAnswers: number;
    quizAccuracy: number;
    weakAreas: string[];
    recommendedReview: boolean;
    lastStudiedAt: string | null;
}

export interface StudyPlanItem {
    type: 'review' | 'quiz' | 'flashcard' | 'video' | 'practice';
    icon: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface StudyPlan {
    todayPlan: StudyPlanItem[];
    tips: string[];
    examTarget: string | null;
    daysUntilExam: number | null;
    studyStreak: number;
    weakTopicsCount: number;
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
