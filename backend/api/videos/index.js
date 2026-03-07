const express = require('express');
const router = express.Router();
const { YoutubeTranscript } = require('youtube-transcript');
const Video = require('../../models/Video');
const User = require('../../models/User');
const StudyAnalytics = require('../../models/StudyAnalytics');
const { authenticate } = require('../../lib/middleware');

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// GET /api/videos/transcript — Get YouTube transcript purely using local backend library
router.get('/transcript', async (req, res) => {
    try {
        const { url, videoId } = req.query;

        if (!url && !videoId) {
            return res.status(400).json({ success: false, message: 'URL veya Video ID gerekli' });
        }

        const targetUrl = url || `https://www.youtube.com/watch?v=${videoId}`;

        const transcript = await YoutubeTranscript.fetchTranscript(targetUrl);
        const fullText = transcript.map(t => t.text).join(' ');

        res.json({
            success: true,
            transcript: fullText
        });
    } catch (error) {
        console.error('Transcript fetch error:', error);
        res.status(500).json({ success: false, message: 'Altyazı alınamadı', error: error.message });
    }
});

// GET /api/videos — Get all user's videos
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, favorite, subject, search } = req.query;

        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (favorite === 'true') filter.isFavorite = true;
        if (subject) filter.subject = subject;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const videos = await Video.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-transcript');

        const total = await Video.countDocuments(filter);

        res.json({
            success: true,
            data: {
                videos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Videolar yüklenirken hata oluştu.',
        });
    }
});

// POST /api/videos — Submit a new YouTube video for processing
router.post('/', authenticate, async (req, res) => {
    try {
        const { youtubeUrl } = req.body;

        if (!youtubeUrl) {
            return res.status(400).json({
                success: false,
                message: 'YouTube linki gereklidir.',
            });
        }

        const youtubeId = extractYouTubeId(youtubeUrl);
        if (!youtubeId) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz YouTube linki.',
            });
        }

        // Check if video already processed by this user
        const existing = await Video.findOne({
            userId: req.user._id,
            youtubeId,
        });

        if (existing) {
            return res.json({
                success: true,
                message: 'Bu video zaten işlenmiş.',
                data: { video: existing },
            });
        }

        // Create video record
        const video = await Video.create({
            userId: req.user._id,
            youtubeUrl,
            youtubeId,
            thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
            status: 'pending',
        });

        // Trigger n8n webhook (if configured)
        if (process.env.N8N_WEBHOOK_URL) {
            try {
                const response = await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: video._id.toString(),
                        youtubeUrl,
                        youtubeId,
                        userId: req.user._id.toString(),
                    }),
                });

                if (response.ok) {
                    video.status = 'processing';
                    await video.save();
                }
            } catch (webhookError) {
                console.error('n8n webhook error:', webhookError);
                // Don't fail the request — video stays in pending
            }
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalVideosProcessed: 1 },
        });

        res.status(201).json({
            success: true,
            message: 'Video işleme kuyruğuna eklendi.',
            data: { video },
        });
    } catch (error) {
        console.error('Create video error:', error);
        res.status(500).json({
            success: false,
            message: 'Video eklenirken hata oluştu.',
        });
    }
});

// GET /api/videos/:id — Get single video with all materials
router.get('/:id', authenticate, async (req, res) => {
    try {
        const video = await Video.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video bulunamadı.',
            });
        }

        res.json({
            success: true,
            data: { video },
        });
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({
            success: false,
            message: 'Video yüklenirken hata oluştu.',
        });
    }
});

// POST /api/videos/process — n8n callback to update video with AI results
router.post('/process', async (req, res) => {
    try {
        const { videoId, title, channelName, transcript, summary, notes, flashcards, quizQuestions, timestampNotes, yksQuestions, subject, tags } = req.body;

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Video ID gereklidir.',
            });
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video bulunamadı.',
            });
        }

        // Update video with AI-processed data
        video.title = title || video.title;
        video.channelName = channelName || video.channelName;
        video.transcript = transcript || video.transcript;
        video.summary = summary || video.summary;
        video.notes = notes || video.notes;
        video.flashcards = flashcards || video.flashcards;
        video.quizQuestions = quizQuestions || video.quizQuestions;
        video.timestampNotes = timestampNotes || video.timestampNotes;
        video.yksQuestions = yksQuestions || video.yksQuestions;
        video.subject = subject || video.subject;
        video.tags = tags || video.tags;
        video.status = 'completed';

        await video.save();

        res.json({
            success: true,
            message: 'Video başarıyla işlendi.',
            data: { video },
        });
    } catch (error) {
        console.error('Process video error:', error);

        // Try to mark as failed
        if (req.body.videoId) {
            await Video.findByIdAndUpdate(req.body.videoId, {
                status: 'failed',
                errorMessage: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Video işlenirken hata oluştu.',
        });
    }
});

// PATCH /api/videos/:id/favorite — Toggle favorite
router.patch('/:id/favorite', authenticate, async (req, res) => {
    try {
        const video = await Video.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video bulunamadı.',
            });
        }

        video.isFavorite = !video.isFavorite;
        await video.save();

        res.json({
            success: true,
            data: { video },
        });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'İşlem sırasında hata oluştu.',
        });
    }
});

// DELETE /api/videos/:id — Delete a video
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const video = await Video.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video bulunamadı.',
            });
        }

        res.json({
            success: true,
            message: 'Video silindi.',
        });
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({
            success: false,
            message: 'Video silinirken hata oluştu.',
        });
    }
});

// POST /api/videos/:id/quiz-result — Record quiz result
router.post('/:id/quiz-result', authenticate, async (req, res) => {
    try {
        const { score, totalQuestions, correctAnswers, type } = req.body;
        // type can be 'quiz' or 'yks'

        const video = await Video.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video bulunamadı.',
            });
        }

        // Update per-topic analytics
        if (video.subject) {
            let analytics = await StudyAnalytics.findOne({
                userId: req.user._id,
                subject: video.subject,
            });

            if (!analytics) {
                analytics = new StudyAnalytics({
                    userId: req.user._id,
                    subject: video.subject,
                    videosWatched: 1,
                });
            }

            analytics.totalQuestions += totalQuestions;
            analytics.correctAnswers += correctAnswers;
            analytics.updateAccuracy();
            analytics.lastStudiedAt = new Date();

            await analytics.save();
        }

        // Update user stats
        const user = await User.findById(req.user._id);
        user.totalQuizzesTaken += 1;

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
            } else {
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

        user.weeklyStats[weekIdx].quizzesTaken += 1;
        const weekData = user.weeklyStats[weekIdx];
        const oldTotal = weekData.accuracy * (weekData.quizzesTaken - 1);
        const currentAccuracy = correctAnswers / totalQuestions;
        weekData.accuracy = weekData.quizzesTaken > 0
            ? (oldTotal + currentAccuracy) / weekData.quizzesTaken
            : currentAccuracy;

        await user.save();

        res.json({
            success: true,
            message: 'Quiz sonucu kaydedildi.',
            data: {
                accuracy: currentAccuracy,
                studyStreak: user.studyStreak,
            },
        });
    } catch (error) {
        console.error('Quiz result error:', error);
        res.status(500).json({
            success: false,
            message: 'Quiz sonucu kaydedilirken hata oluştu.',
        });
    }
});

module.exports = router;
