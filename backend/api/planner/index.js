const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const StudyAnalytics = require('../../models/StudyAnalytics');
const Video = require('../../models/Video');
const { authenticate } = require('../../lib/middleware');

// GET /api/planner/today — Get AI-generated daily study plan
router.get('/today', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const analytics = await StudyAnalytics.find({ userId: req.user._id }).sort({ quizAccuracy: 1 });

        // Get recent completed videos
        const recentVideos = await Video.find({
            userId: req.user._id,
            status: 'completed',
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title subject tags');

        // Calculate days until exam
        let daysUntilExam = null;
        if (user.examDate) {
            const diff = new Date(user.examDate).getTime() - Date.now();
            daysUntilExam = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        // Generate study plan based on weak areas and exam target
        const weakTopics = analytics.filter((a) => a.recommendedReview);
        const todayPlan = [];
        const tips = [];

        // Priority 1: Review weak topics
        if (weakTopics.length > 0) {
            const weakest = weakTopics[0];
            todayPlan.push({
                type: 'review',
                icon: 'alert-circle',
                title: `${weakest.subject} konusunu tekrar et`,
                description: `Doğruluk oranın: %${Math.round(weakest.quizAccuracy * 100)}`,
                priority: 'high',
            });

            todayPlan.push({
                type: 'quiz',
                icon: 'help-circle',
                title: `${weakest.subject} quiz çöz`,
                description: '20 soruluk pratik test',
                priority: 'high',
            });
        }

        // Priority 2: Flashcard review
        const videosWithFlashcards = await Video.countDocuments({
            userId: req.user._id,
            status: 'completed',
            'flashcards.0': { $exists: true },
        });

        if (videosWithFlashcards > 0) {
            todayPlan.push({
                type: 'flashcard',
                icon: 'layers',
                title: 'Flashcard tekrarı yap',
                description: `${videosWithFlashcards} videoda kart mevcut`,
                priority: 'medium',
            });
        }

        // Priority 3: Watch new content
        todayPlan.push({
            type: 'video',
            icon: 'videocam',
            title: 'Yeni bir konu videosu izle',
            description: user.examTarget
                ? `Hedef: ${user.examTarget}`
                : 'YouTube\'dan bir eğitim videosu ekle',
            priority: 'medium',
        });

        // Priority 4: Practice questions
        todayPlan.push({
            type: 'practice',
            icon: 'pencil',
            title: '20 pratik soru çöz',
            description: 'Farklı konulardan karışık sorular',
            priority: 'low',
        });

        // Tips based on stats
        if (user.studyStreak > 0) {
            tips.push(`🔥 ${user.studyStreak} günlük serin! Devam et!`);
        }
        if (daysUntilExam !== null && daysUntilExam <= 30) {
            tips.push(`⏰ Sınava ${daysUntilExam} gün kaldı. Yoğun çalış!`);
        }
        if (weakTopics.length >= 3) {
            tips.push(`📊 ${weakTopics.length} zayıf konun var. Öncelikli olarak bunlara odaklan.`);
        }

        res.json({
            success: true,
            data: {
                todayPlan,
                tips,
                examTarget: user.examTarget,
                daysUntilExam,
                studyStreak: user.studyStreak,
                weakTopicsCount: weakTopics.length,
            },
        });
    } catch (error) {
        console.error('Get planner error:', error);
        res.status(500).json({
            success: false,
            message: 'Çalışma planı yüklenirken hata oluştu.',
        });
    }
});

// POST /api/planner/settings — Save exam target & date
router.post('/settings', authenticate, async (req, res) => {
    try {
        const { examTarget, estimatedScore, examDate } = req.body;

        const update = {};
        if (examTarget !== undefined) update.examTarget = examTarget;
        if (estimatedScore !== undefined) update.estimatedScore = estimatedScore;
        if (examDate !== undefined) update.examDate = new Date(examDate);

        const user = await User.findByIdAndUpdate(req.user._id, update, {
            new: true,
        }).select('-password');

        res.json({
            success: true,
            message: 'Ayarlar kaydedildi.',
            data: { user },
        });
    } catch (error) {
        console.error('Save planner settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Ayarlar kaydedilirken hata oluştu.',
        });
    }
});

module.exports = router;
