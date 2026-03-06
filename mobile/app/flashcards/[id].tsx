import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
    PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import api from '../../services/api';
import { Flashcard } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.lg * 2;

export default function FlashcardsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [knownCount, setKnownCount] = useState(0);

    const flipAnim = useRef(new Animated.Value(0)).current;
    const swipeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadFlashcards();
    }, [id]);

    const loadFlashcards = async () => {
        try {
            const response = await api.getVideo(id);
            if (response.success && response.data.video.flashcards.length > 0) {
                setFlashcards(response.data.video.flashcards);
            }
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                swipeAnim.setValue(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 100) {
                    // Swipe right — known
                    handleKnown();
                } else if (gestureState.dx < -100) {
                    // Swipe left — needs review
                    handleNext();
                } else {
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleFlip = () => {
        const toValue = isFlipped ? 0 : 1;
        Animated.spring(flipAnim, {
            toValue,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const goToNext = () => {
        if (currentIndex >= flashcards.length - 1) return;

        Animated.timing(swipeAnim, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setCurrentIndex((i) => i + 1);
            setIsFlipped(false);
            flipAnim.setValue(0);
            swipeAnim.setValue(0);
        });
    };

    const handleKnown = () => {
        setKnownCount((c) => c + 1);
        goToNext();
    };

    const handleNext = () => {
        goToNext();
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnownCount(0);
        flipAnim.setValue(0);
        swipeAnim.setValue(0);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (flashcards.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="layers-outline" size={48} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>Flashcard bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // All cards done
    if (currentIndex >= flashcards.length) {
        const percentage = Math.round((knownCount / flashcards.length) * 100);

        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.finishedEmoji}>🎯</Text>
                <Text style={styles.finishedTitle}>Tüm Kartlar Tamamlandı!</Text>
                <Text style={styles.finishedStats}>
                    {knownCount}/{flashcards.length} kartı bildin ({percentage}%)
                </Text>

                <View style={styles.finishedActions}>
                    <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                        <Ionicons name="refresh" size={20} color={Colors.dark.primary} />
                        <Text style={styles.restartText}>Tekrar</Text>
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
        );
    }

    const card = flashcards[currentIndex];

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const cardRotation = swipeAnim.interpolate({
        inputRange: [-width, 0, width],
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {flashcards.length}
                </Text>
                <View style={styles.knownBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.dark.success} />
                    <Text style={styles.knownCount}>{knownCount}</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentIndex + 1) / flashcards.length) * 100}%` },
                    ]}
                />
            </View>

            {/* Card */}
            <View style={styles.cardContainer}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.cardWrapper,
                        {
                            transform: [
                                { translateX: swipeAnim },
                                { rotate: cardRotation },
                            ],
                        },
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleFlip}
                        style={styles.cardTouchable}
                    >
                        {/* Front */}
                        <Animated.View
                            style={[
                                styles.card,
                                styles.cardFront,
                                { transform: [{ rotateY: frontInterpolate }] },
                            ]}
                        >
                            <Text style={styles.cardLabel}>SORU</Text>
                            <Text style={styles.cardText}>{card.front}</Text>
                            <Text style={styles.flipHint}>Cevabı görmek için dokun</Text>
                        </Animated.View>

                        {/* Back */}
                        <Animated.View
                            style={[
                                styles.card,
                                styles.cardBack,
                                { transform: [{ rotateY: backInterpolate }] },
                            ]}
                        >
                            <Text style={styles.cardLabel}>CEVAP</Text>
                            <Text style={styles.cardText}>{card.back}</Text>
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.reviewButton} onPress={handleNext}>
                    <Ionicons name="close" size={28} color={Colors.dark.error} />
                    <Text style={styles.reviewText}>Tekrar Et</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.knownButton} onPress={handleKnown}>
                    <Ionicons name="checkmark" size={28} color={Colors.dark.success} />
                    <Text style={styles.knownText}>Biliyorum</Text>
                </TouchableOpacity>
            </View>
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
    progressText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
    },
    knownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    knownCount: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.bold,
        color: Colors.dark.success,
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
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.2,
    },
    cardTouchable: {
        width: '100%',
        height: '100%',
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
    },
    cardFront: {
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    cardBack: {
        backgroundColor: Colors.dark.surfaceLight,
        borderWidth: 1,
        borderColor: Colors.dark.primary,
    },
    cardLabel: {
        position: 'absolute',
        top: Spacing.lg,
        fontSize: FontSizes.xs,
        fontWeight: FontWeights.bold,
        color: Colors.dark.primary,
        letterSpacing: 2,
    },
    cardText: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
        textAlign: 'center',
        lineHeight: 30,
    },
    flipHint: {
        position: 'absolute',
        bottom: Spacing.lg,
        fontSize: FontSizes.xs,
        color: Colors.dark.textMuted,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xxl,
        paddingBottom: Spacing.xxl,
        paddingTop: Spacing.md,
    },
    reviewButton: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    knownButton: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    reviewText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.error,
        fontWeight: FontWeights.medium,
    },
    knownText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.success,
        fontWeight: FontWeights.medium,
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
    // Finished
    finishedEmoji: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    finishedTitle: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
        marginBottom: Spacing.sm,
    },
    finishedStats: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        marginBottom: Spacing.xl,
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
