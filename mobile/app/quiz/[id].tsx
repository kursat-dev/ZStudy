import React, { useState, useEffect } from 'react';
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
import { QuizQuestion } from '../../types';

export default function QuizScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        loadQuiz();
    }, [id]);

    const loadQuiz = async () => {
        try {
            const response = await api.getVideo(id);
            if (response.success && response.data.video.quizQuestions.length > 0) {
                setQuestions(response.data.video.quizQuestions);
            }
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);

        if (index === questions[currentIndex].correctAnswer) {
            setScore((s) => s + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex >= questions.length - 1) {
            setIsFinished(true);
            return;
        }

        // Fade out and in
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        }, 150);
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="help-circle-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>Quiz sorusu bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Finished screen
    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👏' : percentage >= 40 ? '💪' : '📚';

        return (
            <View style={[styles.container, styles.center]}>
                <View style={styles.finishedCard}>
                    <Text style={styles.finishedEmoji}>{emoji}</Text>
                    <Text style={styles.finishedTitle}>Quiz Tamamlandı!</Text>
                    <View style={styles.scoreCircle}>
                        <LinearGradient
                            colors={Colors.dark.gradient.primary as [string, string]}
                            style={styles.scoreGradient}
                        >
                            <Text style={styles.scorePercentage}>{percentage}%</Text>
                            <Text style={styles.scoreLabel}>{score}/{questions.length}</Text>
                        </LinearGradient>
                    </View>
                    <Text style={styles.finishedMessage}>
                        {percentage >= 80 ? 'Harika! Konuyu çok iyi anlamışsın!' :
                            percentage >= 60 ? 'İyi iş! Biraz daha pratik faydalı olabilir.' :
                                percentage >= 40 ? 'Fena değil! Notları tekrar gözden geçir.' :
                                    'Notları tekrar çalışıp tekrar dene!'}
                    </Text>

                    <View style={styles.finishedActions}>
                        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                            <Ionicons name="refresh" size={20} color={Colors.dark.primary} />
                            <Text style={styles.restartText}>Tekrar Dene</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                            <LinearGradient
                                colors={Colors.dark.gradient.primary as [string, string]}
                                style={styles.doneGradient}
                            >
                                <Text style={styles.doneText}>Tamam</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    const question = questions[currentIndex];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                        {currentIndex + 1} / {questions.length}
                    </Text>
                </View>
                <View style={styles.scoreInfo}>
                    <Ionicons name="trophy" size={16} color={Colors.dark.warning} />
                    <Text style={styles.currentScore}>{score}</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentIndex + 1) / questions.length) * 100}%` },
                    ]}
                />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Question */}
                    <View style={styles.questionCard}>
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
                                        styles.optionButton,
                                        showCorrect && styles.optionCorrect,
                                        showWrong && styles.optionWrong,
                                        isSelected && !isAnswered && styles.optionSelected,
                                    ]}
                                    onPress={() => handleSelectAnswer(index)}
                                    activeOpacity={0.7}
                                    disabled={isAnswered}
                                >
                                    <View
                                        style={[
                                            styles.optionLabel,
                                            showCorrect && styles.optionLabelCorrect,
                                            showWrong && styles.optionLabelWrong,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionLabelText,
                                                (showCorrect || showWrong) && { color: '#FFFFFF' },
                                            ]}
                                        >
                                            {String.fromCharCode(65 + index)}
                                        </Text>
                                    </View>
                                    <Text style={styles.optionText}>{option}</Text>
                                    {showCorrect && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.dark.success} />
                                    )}
                                    {showWrong && (
                                        <Ionicons name="close-circle" size={20} color={Colors.dark.error} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Explanation */}
                    {isAnswered && question.explanation && (
                        <View style={styles.explanationCard}>
                            <Ionicons name="bulb" size={20} color={Colors.dark.warning} />
                            <Text style={styles.explanationText}>{question.explanation}</Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Next Button */}
            {isAnswered && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
                        <LinearGradient
                            colors={Colors.dark.gradient.primary as [string, string]}
                            style={styles.nextGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.nextText}>
                                {currentIndex >= questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki Soru'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressInfo: {},
    progressText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
    },
    scoreInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    currentScore: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        color: Colors.dark.warning,
    },
    progressBar: {
        height: 4,
        backgroundColor: Colors.dark.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.dark.primary,
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    questionCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    questionText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
        lineHeight: 26,
    },
    options: {
        gap: Spacing.sm,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.dark.border,
    },
    optionSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: 'rgba(108, 92, 231, 0.08)',
    },
    optionCorrect: {
        borderColor: Colors.dark.success,
        backgroundColor: 'rgba(0, 184, 148, 0.08)',
    },
    optionWrong: {
        borderColor: Colors.dark.error,
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
    },
    optionLabel: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.dark.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabelCorrect: {
        backgroundColor: Colors.dark.success,
    },
    optionLabelWrong: {
        backgroundColor: Colors.dark.error,
    },
    optionLabelText: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.bold,
        color: Colors.dark.textSecondary,
    },
    optionText: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.dark.text,
        lineHeight: 22,
    },
    explanationCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(253, 203, 110, 0.1)',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.sm,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(253, 203, 110, 0.2)',
        alignItems: 'flex-start',
    },
    explanationText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.dark.textSecondary,
        lineHeight: 20,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
        backgroundColor: Colors.dark.background,
    },
    nextButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    nextGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    nextText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    emptyText: {
        fontSize: FontSizes.lg,
        color: Colors.dark.textSecondary,
        marginTop: Spacing.md,
    },
    backLink: {
        fontSize: FontSizes.md,
        color: Colors.dark.primary,
        marginTop: Spacing.md,
    },
    // Finished screen
    finishedCard: {
        alignItems: 'center',
        width: '100%',
    },
    finishedEmoji: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    finishedTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
        marginBottom: Spacing.lg,
    },
    scoreCircle: {
        marginBottom: Spacing.lg,
    },
    scoreGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scorePercentage: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.extrabold,
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: FontSizes.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    finishedMessage: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    finishedActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
    },
    restartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.primary,
    },
    restartText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.primary,
    },
    doneButton: {
        flex: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    doneGradient: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    doneText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
});
