const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'İsim gereklidir'],
            trim: true,
            minlength: [2, 'İsim en az 2 karakter olmalıdır'],
            maxlength: [50, 'İsim en fazla 50 karakter olabilir'],
        },
        email: {
            type: String,
            required: [true, 'E-posta gereklidir'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Geçerli bir e-posta adresi girin'],
        },
        password: {
            type: String,
            required: [true, 'Şifre gereklidir'],
            minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
        },
        avatar: {
            type: String,
            default: null,
        },
        studyStreak: {
            type: Number,
            default: 0,
        },
        lastStudyDate: {
            type: Date,
            default: null,
        },
        totalVideosProcessed: {
            type: Number,
            default: 0,
        },
        totalQuizzesTaken: {
            type: Number,
            default: 0,
        },
        totalStudyMinutes: {
            type: Number,
            default: 0,
        },
        examTarget: {
            type: String,
            default: null,
        },
        estimatedScore: {
            type: Number,
            default: null,
        },
        examDate: {
            type: Date,
            default: null,
        },
        weeklyStats: [
            {
                week: { type: String },
                videosWatched: { type: Number, default: 0 },
                quizzesTaken: { type: Number, default: 0 },
                accuracy: { type: Number, default: 0 },
                minutesStudied: { type: Number, default: 0 },
                _id: false,
            },
        ],
        preferences: {
            notifications: { type: Boolean, default: true },
            darkMode: { type: Boolean, default: true },
            language: { type: String, default: 'tr' },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
