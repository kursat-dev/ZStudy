const mongoose = require('mongoose');

const studyAnalyticsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        subject: {
            type: String,
            required: true,
        },
        videosWatched: {
            type: Number,
            default: 0,
        },
        totalQuestions: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        quizAccuracy: {
            type: Number,
            default: 0,
        },
        weakAreas: [{ type: String }],
        recommendedReview: {
            type: Boolean,
            default: false,
        },
        lastStudiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient per-user, per-subject lookups
studyAnalyticsSchema.index({ userId: 1, subject: 1 }, { unique: true });

// Virtual for accuracy calculation
studyAnalyticsSchema.methods.updateAccuracy = function () {
    if (this.totalQuestions > 0) {
        this.quizAccuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100) / 100;
    }
    this.recommendedReview = this.quizAccuracy < 0.6;
};

module.exports =
    mongoose.models.StudyAnalytics ||
    mongoose.model('StudyAnalytics', studyAnalyticsSchema);
