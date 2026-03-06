const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
});

const quizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, default: '' },
});

const videoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        youtubeUrl: {
            type: String,
            required: [true, 'YouTube linki gereklidir'],
        },
        youtubeId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: 'İşleniyor...',
        },
        thumbnail: {
            type: String,
            default: null,
        },
        duration: {
            type: String,
            default: null,
        },
        channelName: {
            type: String,
            default: null,
        },
        transcript: {
            type: String,
            default: null,
        },
        summary: {
            type: String,
            default: null,
        },
        notes: {
            type: String,
            default: null,
        },
        flashcards: [flashcardSchema],
        quizQuestions: [quizQuestionSchema],
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        errorMessage: {
            type: String,
            default: null,
        },
        subject: {
            type: String,
            default: null,
        },
        tags: [{ type: String }],
        isFavorite: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);
