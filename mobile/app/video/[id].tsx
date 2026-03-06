import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import api from '../../services/api';
import { Video } from '../../types';

export default function VideoDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [video, setVideo] = useState<Video | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'summary' | 'notes'>('summary');

    useEffect(() => {
        loadVideo();
    }, [id]);

    const loadVideo = async () => {
        try {
            const response = await api.getVideo(id);
            if (response.success) {
                setVideo(response.data.video);
            }
        } catch {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!video) return;
        try {
            const response = await api.toggleFavorite(video._id);
            if (response.success) {
                setVideo(response.data.video);
            }
        } catch {
            // Silent fail
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
        );
    }

    if (!video) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle" size={48} color={Colors.dark.error} />
                <Text style={styles.errorText}>Video bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Thumbnail */}
                <Image
                    source={{ uri: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg` }}
                    style={styles.thumbnail}
                />

                {/* Back & Favorite Buttons */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.topButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={Colors.dark.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.topButton} onPress={handleToggleFavorite}>
                        <Ionicons
                            name={video.isFavorite ? 'heart' : 'heart-outline'}
                            size={22}
                            color={video.isFavorite ? Colors.dark.error : Colors.dark.text}
                        />
                    </TouchableOpacity>
                </View>

                {/* Title & Meta */}
                <View style={styles.infoSection}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    {video.channelName && (
                        <Text style={styles.channelName}>{video.channelName}</Text>
                    )}
                    {video.tags && video.tags.length > 0 && (
                        <View style={styles.tags}>
                            {video.tags.map((tag, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {video.quizQuestions.length > 0 && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/quiz/${video._id}`)}
                        >
                            <LinearGradient
                                colors={['rgba(0, 206, 202, 0.2)', 'rgba(0, 206, 202, 0.05)']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="help-circle" size={24} color={Colors.dark.secondary} />
                                <Text style={styles.actionLabel}>Quiz</Text>
                                <Text style={styles.actionCount}>{video.quizQuestions.length} soru</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {video.flashcards.length > 0 && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/flashcards/${video._id}`)}
                        >
                            <LinearGradient
                                colors={['rgba(253, 203, 110, 0.2)', 'rgba(253, 203, 110, 0.05)']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="layers" size={24} color={Colors.dark.warning} />
                                <Text style={styles.actionLabel}>Kartlar</Text>
                                <Text style={styles.actionCount}>{video.flashcards.length} kart</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content Tabs */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
                        onPress={() => setActiveTab('summary')}
                    >
                        <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
                            Özet
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
                        onPress={() => setActiveTab('notes')}
                    >
                        <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
                            Notlar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    {activeTab === 'summary' ? (
                        <Text style={styles.contentText}>
                            {video.summary || 'Özet henüz oluşturulmadı.'}
                        </Text>
                    ) : (
                        <Text style={styles.contentText}>
                            {video.notes || 'Notlar henüz oluşturulmadı.'}
                        </Text>
                    )}
                </View>
            </ScrollView>
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
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xxl,
    },
    thumbnail: {
        width: '100%',
        height: 220,
        backgroundColor: Colors.dark.surfaceLight,
    },
    topBar: {
        position: 'absolute',
        top: 50,
        left: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    topButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        padding: Spacing.lg,
    },
    videoTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
        lineHeight: 28,
    },
    channelName: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textSecondary,
        marginTop: Spacing.xs,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    tag: {
        backgroundColor: Colors.dark.surfaceLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    tagText: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    actionButton: {
        flex: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    actionGradient: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        gap: 4,
    },
    actionLabel: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
    },
    actionCount: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textMuted,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Colors.dark.primary,
    },
    tabText: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
        color: Colors.dark.textSecondary,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    contentSection: {
        paddingHorizontal: Spacing.lg,
    },
    contentText: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        lineHeight: 24,
    },
    errorText: {
        fontSize: FontSizes.lg,
        color: Colors.dark.textSecondary,
        marginTop: Spacing.md,
    },
    backLink: {
        fontSize: FontSizes.md,
        color: Colors.dark.primary,
        marginTop: Spacing.md,
    },
});
