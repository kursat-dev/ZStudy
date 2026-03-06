const express = require('express');
const router = express.Router();
const StudyAnalytics = require('../../models/StudyAnalytics');
const Video = require('../../models/Video');
const User = require('../../models/User');
const { authenticate } = require('../../lib/middleware');

// GET /api/analytics — Get all per-topic analytics for user
router.get('/', authenticate, async (req, res) => {
    try {
        const analytics = await StudyAnalytics.find({ userId: req.user._id })
            .sort({ quizAccuracy: 1 }); // Weakest topics first

        // Separate weak vs strong topics
        const weakTopics = analytics.filter((a) => a.recommendedReview);
        const strongTopics = analytics.filter((a) => !a.recommendedReview);

        res.json({
            success: true,
            data: {
                analytics,
                weakTopics,
                strongTopics,
                totalSubjects: analytics.length,
            },
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Analiz verileri yüklenirken hata oluştu.',
        });
    }
});

// GET /api/analytics/weekly — Get weekly learning stats
router.get('/weekly', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('weeklyStats studyStreak lastStudyDate');

        // Calculate current week key
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        // Find current week stats or create default
        let currentWeek = user.weeklyStats?.find((w) => w.week === weekKey);
        if (!currentWeek) {
            currentWeek = {
                week: weekKey,
                videosWatched: 0,
                quizzesTaken: 0,
                accuracy: 0,
                minutesStudied: 0,
            };
        }

        // Get last 4 weeks
        const recentWeeks = (user.weeklyStats || [])
            .sort((a, b) => b.week.localeCompare(a.week))
            .slice(0, 4);

        res.json({
            success: true,
            data: {
                currentWeek,
                recentWeeks,
                studyStreak: user.studyStreak,
                lastStudyDate: user.lastStudyDate,
            },
        });
    } catch (error) {
        console.error('Get weekly stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Haftalık istatistikler yüklenirken hata oluştu.',
        });
    }
});

// POST /api/analytics/record — Record a study session
router.post('/record', authenticate, async (req, res) => {
    try {
        const { subject, minutesStudied, quizScore, totalQuestions, correctAnswers } = req.body;

        const user = await User.findById(req.user._id);

        // Update study streak
        const today = new Date().toISOString().split('T')[0];
        const lastStudy = user.lastStudyDate
            ? new Date(user.lastStudyDate).toISOString().split('T')[0]
            : null;

        if (lastStudy !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastStudy === yesterdayStr) {
                user.studyStreak += 1;
            } else if (lastStudy !== today) {
                user.studyStreak = 1;
            }
            user.lastStudyDate = new Date();
        }

        // Update weekly stats
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        let weekIdx = user.weeklyStats.findIndex((w) => w.week === weekKey);
        if (weekIdx === -1) {
            user.weeklyStats.push({
                week: weekKey,
                videosWatched: 0,
                quizzesTaken: 0,
                accuracy: 0,
                minutesStudied: 0,
            });
            weekIdx = user.weeklyStats.length - 1;
        }

        if (minutesStudied) {
            user.weeklyStats[weekIdx].minutesStudied += minutesStudied;
            user.totalStudyMinutes += minutesStudied;
        }

        if (totalQuestions) {
            user.weeklyStats[weekIdx].quizzesTaken += 1;
            user.totalQuizzesTaken += 1;

            // Recalculate weekly accuracy
            const weekData = user.weeklyStats[weekIdx];
            const oldTotal = weekData.accuracy * (weekData.quizzesTaken - 1);
            const currentAccuracy = correctAnswers / totalQuestions;
            weekData.accuracy = (oldTotal + currentAccuracy) / weekData.quizzesTaken;
        }

        await user.save();

        // Update per-topic analytics if subject provided
        if (subject && totalQuestions) {
            let analytics = await StudyAnalytics.findOne({
                userId: req.user._id,
                subject,
            });

            if (!analytics) {
                analytics = new StudyAnalytics({
                    userId: req.user._id,
                    subject,
                });
            }

            analytics.totalQuestions += totalQuestions;
            analytics.correctAnswers += correctAnswers;
            analytics.updateAccuracy();
            analytics.lastStudiedAt = new Date();

            await analytics.save();
        }

        res.json({
            success: true,
            message: 'Çalışma kaydedildi.',
            data: {
                studyStreak: user.studyStreak,
            },
        });
    } catch (error) {
        console.error('Record study error:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışma kaydedilirken hata oluştu.',
        });
    }
});

module.exports = router;
