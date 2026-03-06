const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { generateTokens, verifyRefreshToken } = require('../../lib/auth');
const { authenticate } = require('../../lib/middleware');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Tüm alanları doldurun.',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Şifre en az 6 karakter olmalıdır.',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu e-posta adresi zaten kayıtlı.',
            });
        }

        // Create user
        const user = await User.create({ name, email, password });
        const tokens = generateTokens(user._id);

        res.status(201).json({
            success: true,
            message: 'Hesap başarıyla oluşturuldu.',
            data: {
                user: user.toJSON(),
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası. Lütfen tekrar deneyin.',
        });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'E-posta ve şifre gereklidir.',
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'E-posta veya şifre hatalı.',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'E-posta veya şifre hatalı.',
            });
        }

        const tokens = generateTokens(user._id);

        res.json({
            success: true,
            message: 'Giriş başarılı.',
            data: {
                user: user.toJSON(),
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası. Lütfen tekrar deneyin.',
        });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: { user: req.user },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası.',
        });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token gereklidir.',
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz refresh token.',
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı.',
            });
        }

        const tokens = generateTokens(user._id);

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası.',
        });
    }
});

module.exports = router;
