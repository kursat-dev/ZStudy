const express = require('express');
const router = express.Router();
const Video = require('../../models/Video');
const User = require('../../models/User');
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

// GET /api/videos — Get all user's videos
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, favorite } = req.query;

        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (favorite === 'true') filter.isFavorite = true;

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
        const { videoId, title, channelName, transcript, summary, notes, flashcards, quizQuestions, subject, tags } = req.body;

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

module.exports = router;
