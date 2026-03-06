import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import api from '../../services/api';
import { YksQuestion } from '../../types';

export default function YksTestScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [questions, setQuestions] = useState<YksQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadQuestions();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    const loadQuestions = async () => {
        try {
            const response = await api.getVideo(id);
            if (response.success && response.data.video.yksQuestions?.length > 0) {
                setQuestions(response.data.video.yksQuestions);
                setAnswers(new Array(response.data.video.yksQuestions.length).fill(null));
                // Start timer
                timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
            }
        } catch {
            // Error
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);

        const newAnswers = [...answers];
        newAnswers[currentIndex] = index;
        setAnswers(newAnswers);

        if (index === questions[currentIndex].correctAnswer) {
            setScore((s) => s + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex >= questions.length - 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsFinished(true);
            // Submit result
            api.submitQuizResult(id, {
                score,
                totalQuestions: questions.length,
                correctAnswers: score,
                type: 'yks',
            }).catch(() => { });
            return;
        }

        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        }, 120);
    };

    const getDifficultyBadge = (d: string) => {
        switch (d) {
            case 'kolay': return { label: 'Kolay', color: Colors.dark.success };
            case 'zor': return { label: 'Zor', color: Colors.dark.error };
            default: return { label: 'Orta', color: Colors.dark.warning };
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>YKS Testi Hazırlanıyor...</Text>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="school-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>YKS sorusu bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Review mode
    if (showReview) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setShowReview(false)}>
                        <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Çözüm İnceleme</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView style={styles.reviewScroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    {questions.map((q, qi) => {
                        const userAnswer = answers[qi];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                            <View key={qi} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewNum}>Soru {qi + 1}</Text>
                                    <Ionicons
                                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                                        size={20}
                                        color={isCorrect ? Colors.dark.success : Colors.dark.error}
                                    />
                                </View>
                                <Text style={styles.reviewQuestion}>{q.question}</Text>
                                {q.options.map((opt, oi) => (
                                    <View
                                        key={oi}
                                        style={[
                                            styles.reviewOption,
                                            oi === q.correctAnswer && styles.reviewCorrect,
                                            oi === userAnswer && oi !== q.correctAnswer && styles.reviewWrong,
                                        ]}
                                    >
                                        <Text style={styles.reviewOptionLetter}>{String.fromCharCode(65 + oi)}</Text>
                                        <Text style={styles.reviewOptionText}>{opt}</Text>
                                    </View>
                                ))}
                                {q.explanation && (
                                    <View style={styles.reviewExplanation}>
                                        <Ionicons name="bulb" size={16} color={Colors.dark.warning} />
                                        <Text style={styles.reviewExplanationText}>{q.explanation}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    }

    // Finished screen
    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const net = score - ((questions.length - score) / 3); // YKS net calculation
        const emoji = percentage >= 80 ? '🎯' : percentage >= 60 ? '💪' : percentage >= 40 ? '📝' : '📚';

        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.finishedEmoji}>{emoji}</Text>
                <Text style={styles.finishedTitle}>YKS Test Sonucu</Text>

                <View style={styles.resultCards}>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Doğru</Text>
                        <Text style={[styles.resultValue, { color: Colors.dark.success }]}>{score}</Text>
                    </View>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Yanlış</Text>
                        <Text style={[styles.resultValue, { color: Colors.dark.error }]}>{questions.length - score}</Text>
                    </View>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Net</Text>
                        <Text style={[styles.resultValue, { color: Colors.dark.primary }]}>{net.toFixed(1)}</Text>
                    </View>
                </View>

                <View style={styles.resultMeta}>
                    <Text style={styles.resultTime}>⏱ Süre: {formatTime(timer)}</Text>
                    <Text style={styles.resultPercent}>%{percentage} başarı</Text>
                </View>

                <View style={styles.finishedActions}>
                    <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReview(true)}>
                        <Ionicons name="eye" size={20} color={Colors.dark.primary} />
                        <Text style={styles.reviewBtnText}>Çözümleri İncele</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                        <LinearGradient colors={Colors.dark.gradient.primary as [string, string]} style={styles.doneBtnGrad}>
                            <Text style={styles.doneBtnText}>Tamam</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const question = questions[currentIndex];
    const diffBadge = getDifficultyBadge(question.difficulty);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                </View>
                <View style={styles.scoreBadge}>
                    <Text style={styles.scoreNum}>{score}</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Question */}
                    <View style={styles.questionCard}>
                        <View style={[styles.diffBadge, { backgroundColor: `${diffBadge.color}20` }]}>
                            <Text style={[styles.diffText, { color: diffBadge.color }]}>{diffBadge.label}</Text>
                        </View>
                        <Text style={styles.questionText}>{question.question}</Text>
                    </View>

                    {/* Options */}
                    <View style={styles.options}>
                        {question.options.map((option, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrect = index === question.correctAnswer;
                            const showCorrect = isAnswered && isCorrect;
                            const showWrong = isAnswered && isSelected && !isCorrect;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionBtn,
                                        showCorrect && styles.optionCorrect,
                                        showWrong && styles.optionWrong,
                                        isSelected && !isAnswered && styles.optionSelected,
                                    ]}
                                    onPress={() => handleSelectAnswer(index)}
                                    activeOpacity={0.7}
                                    disabled={isAnswered}
                                >
                                    <View style={[
                                        styles.optionLetter,
                                        showCorrect && { backgroundColor: Colors.dark.success },
                                        showWrong && { backgroundColor: Colors.dark.error },
                                    ]}>
                                        <Text style={[
                                            styles.optionLetterText,
                                            (showCorrect || showWrong) && { color: '#FFF' },
                                        ]}>
                                            {String.fromCharCode(65 + index)}
                                        </Text>
                                    </View>
                                    <Text style={styles.optionText}>{option}</Text>
                                    {showCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />}
                                    {showWrong && <Ionicons name="close-circle" size={20} color={Colors.dark.error} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {isAnswered && question.explanation && (
                        <View style={styles.explanation}>
                            <Ionicons name="bulb" size={18} color={Colors.dark.warning} />
                            <Text style={styles.explanationText}>{question.explanation}</Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {isAnswered && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <LinearGradient colors={Colors.dark.gradient.primary as [string, string]} style={styles.nextGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.nextText}>
                                {currentIndex >= questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki Soru'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    loadingText: { fontSize: FontSizes.md, color: Colors.dark.textSecondary, marginTop: Spacing.md },
    emptyText: { fontSize: FontSizes.lg, color: Colors.dark.textSecondary, marginTop: Spacing.md },
    backLink: { fontSize: FontSizes.md, color: Colors.dark.primary, marginTop: Spacing.md },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    closeBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.text },
    headerCenter: { alignItems: 'center' },
    progressText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.text },
    timerText: { fontSize: FontSizes.xs, color: Colors.dark.textMuted },
    scoreBadge: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,184,148,0.15)', justifyContent: 'center', alignItems: 'center' },
    scoreNum: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.dark.success },

    // Progress
    progressBar: { height: 4, backgroundColor: Colors.dark.surface, marginHorizontal: Spacing.lg, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.dark.primary, borderRadius: 2 },

    scrollView: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: 100 },

    // Question
    questionCard: { backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.dark.border },
    diffBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
    diffText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
    questionText: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, color: Colors.dark.text, lineHeight: 26 },

    // Options
    options: { gap: Spacing.sm },
    optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.dark.border },
    optionSelected: { borderColor: Colors.dark.primary, backgroundColor: 'rgba(108,92,231,0.08)' },
    optionCorrect: { borderColor: Colors.dark.success, backgroundColor: 'rgba(0,184,148,0.08)' },
    optionWrong: { borderColor: Colors.dark.error, backgroundColor: 'rgba(255,107,107,0.08)' },
    optionLetter: { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.dark.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    optionLetterText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.dark.textSecondary },
    optionText: { flex: 1, fontSize: FontSizes.md, color: Colors.dark.text, lineHeight: 22 },

    // Explanation
    explanation: { flexDirection: 'row', backgroundColor: 'rgba(253,203,110,0.1)', borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md, borderWidth: 1, borderColor: 'rgba(253,203,110,0.2)', alignItems: 'flex-start' },
    explanationText: { flex: 1, fontSize: FontSizes.sm, color: Colors.dark.textSecondary, lineHeight: 20 },

    // Bottom
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: Spacing.xxl, backgroundColor: Colors.dark.background },
    nextBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
    nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
    nextText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: '#FFF' },

    // Finished
    finishedEmoji: { fontSize: 64, marginBottom: Spacing.md },
    finishedTitle: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.dark.text, marginBottom: Spacing.lg },
    resultCards: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    resultCard: { flex: 1, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
    resultLabel: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary, marginBottom: 4 },
    resultValue: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold },
    resultMeta: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl },
    resultTime: { fontSize: FontSizes.sm, color: Colors.dark.textMuted },
    resultPercent: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, fontWeight: FontWeights.medium },
    finishedActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
    reviewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.dark.primary },
    reviewBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.primary },
    doneBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
    doneBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    doneBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#FFF' },

    // Review
    reviewScroll: { flex: 1, paddingTop: Spacing.md },
    reviewCard: { backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.dark.border },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    reviewNum: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.dark.textSecondary },
    reviewQuestion: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.text, marginBottom: Spacing.sm, lineHeight: 22 },
    reviewOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm, gap: Spacing.sm, marginBottom: 2 },
    reviewCorrect: { backgroundColor: 'rgba(0,184,148,0.1)' },
    reviewWrong: { backgroundColor: 'rgba(255,107,107,0.1)' },
    reviewOptionLetter: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.dark.textMuted, width: 20 },
    reviewOptionText: { flex: 1, fontSize: FontSizes.sm, color: Colors.dark.text },
    reviewExplanation: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, backgroundColor: 'rgba(253,203,110,0.08)', padding: Spacing.sm, borderRadius: BorderRadius.sm },
    reviewExplanationText: { flex: 1, fontSize: FontSizes.xs, color: Colors.dark.textSecondary, lineHeight: 18 },
});
