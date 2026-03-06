import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Video } from '../../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const loadVideos = useCallback(async () => {
        try {
            const response = await api.getVideos(1, 5);
            if (response.success) {
                setVideos(response.data.videos);
            }
        } catch {
            // Silent fail
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadVideos();
        setIsRefreshing(false);
    }, [loadVideos]);

    React.useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    const handleAddVideo = async () => {
        if (!youtubeUrl.trim()) {
            setSubmitError('YouTube linki girin.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response = await api.createVideo(youtubeUrl.trim());
            if (response.success) {
                setShowAddModal(false);
                setYoutubeUrl('');
                loadVideos();
            }
        } catch (err: any) {
            setSubmitError(err.message || 'Video eklenirken hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return { color: Colors.dark.success, text: 'Hazır', icon: 'checkmark-circle' };
            case 'processing':
                return { color: Colors.dark.warning, text: 'İşleniyor', icon: 'time' };
            case 'pending':
                return { color: Colors.dark.info, text: 'Bekliyor', icon: 'hourglass' };
            default:
                return { color: Colors.dark.error, text: 'Hata', icon: 'alert-circle' };
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Merhaba, {user?.name?.split(' ')[0]} 👋</Text>
                        <Text style={styles.subtitle}>Bugün ne çalışacaksın?</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton}>
                        <LinearGradient
                            colors={Colors.dark.gradient.accent as [string, string]}
                            style={styles.avatarGradient}
                        >
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsContainer}
                >
                    <StatCard
                        icon="flame"
                        iconColor={Colors.dark.warning}
                        label="Çalışma Serisi"
                        value={`${user?.studyStreak || 0} gün`}
                        gradient={['rgba(253, 203, 110, 0.15)', 'rgba(253, 203, 110, 0.05)']}
                    />
                    <StatCard
                        icon="videocam"
                        iconColor={Colors.dark.primary}
                        label="İşlenen Video"
                        value={`${user?.totalVideosProcessed || 0}`}
                        gradient={['rgba(108, 92, 231, 0.15)', 'rgba(108, 92, 231, 0.05)']}
                    />
                    <StatCard
                        icon="trophy"
                        iconColor={Colors.dark.success}
                        label="Quiz Sayısı"
                        value={`${user?.totalQuizzesTaken || 0}`}
                        gradient={['rgba(0, 184, 148, 0.15)', 'rgba(0, 184, 148, 0.05)']}
                    />
                </ScrollView>

                {/* Quick Add Video */}
                <TouchableOpacity
                    style={styles.addVideoCard}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={Colors.dark.gradient.primary as [string, string]}
                        style={styles.addVideoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.addVideoContent}>
                            <View style={styles.addVideoIcon}>
                                <Ionicons name="add-circle" size={32} color="#FFFFFF" />
                            </View>
                            <View style={styles.addVideoText}>
                                <Text style={styles.addVideoTitle}>YouTube Video Ekle</Text>
                                <Text style={styles.addVideoSubtitle}>
                                    Video linkini yapıştır, AI not çıkarsın
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Recent Videos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Son Videolar</Text>
                        {videos.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
                                <Text style={styles.seeAllText}>Tümünü Gör</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {videos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="videocam-outline" size={48} color={Colors.dark.textMuted} />
                            <Text style={styles.emptyTitle}>Henüz video eklenmemiş</Text>
                            <Text style={styles.emptySubtitle}>
                                YouTube video linkini yapıştırarak başla!
                            </Text>
                        </View>
                    ) : (
                        videos.map((video) => {
                            const badge = getStatusBadge(video.status);
                            return (
                                <TouchableOpacity
                                    key={video._id}
                                    style={styles.videoCard}
                                    onPress={() => {
                                        if (video.status === 'completed') {
                                            router.push(`/video/${video._id}`);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={{ uri: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` }}
                                        style={styles.videoThumbnail}
                                    />
                                    <View style={styles.videoInfo}>
                                        <Text style={styles.videoTitle} numberOfLines={2}>
                                            {video.title}
                                        </Text>
                                        {video.channelName && (
                                            <Text style={styles.videoChannel}>{video.channelName}</Text>
                                        )}
                                        <View style={[styles.statusBadge, { backgroundColor: `${badge.color}20` }]}>
                                            <Ionicons name={badge.icon as any} size={12} color={badge.color} />
                                            <Text style={[styles.statusText, { color: badge.color }]}>
                                                {badge.text}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
                    <View style={styles.quickActions}>
                        <QuickAction
                            icon="document-text"
                            label="Notlarım"
                            color={Colors.dark.primary}
                            onPress={() => router.push('/(tabs)/library')}
                        />
                        <QuickAction
                            icon="help-circle"
                            label="Quiz"
                            color={Colors.dark.secondary}
                            onPress={() => router.push('/(tabs)/library')}
                        />
                        <QuickAction
                            icon="layers"
                            label="Kartlar"
                            color={Colors.dark.warning}
                            onPress={() => router.push('/(tabs)/library')}
                        />
                        <QuickAction
                            icon="stats-chart"
                            label="İstatistik"
                            color={Colors.dark.success}
                            onPress={() => router.push('/(tabs)/profile')}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Add Video Modal */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>YouTube Video Ekle</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Video linkini yapıştır, yapay zeka senin için not, quiz ve kart çıkarsın.
                        </Text>

                        {submitError ? (
                            <View style={styles.modalError}>
                                <Ionicons name="alert-circle" size={16} color={Colors.dark.error} />
                                <Text style={styles.modalErrorText}>{submitError}</Text>
                            </View>
                        ) : null}

                        <View style={styles.modalInputContainer}>
                            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="https://youtube.com/watch?v=..."
                                placeholderTextColor={Colors.dark.textMuted}
                                value={youtubeUrl}
                                onChangeText={setYoutubeUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.modalSubmit, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleAddVideo}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={Colors.dark.gradient.primary as [string, string]}
                                style={styles.modalSubmitGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                                        <Text style={styles.modalSubmitText}>AI ile Analiz Et</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function StatCard({
    icon,
    iconColor,
    label,
    value,
    gradient,
}: {
    icon: string;
    iconColor: string;
    label: string;
    value: string;
    gradient: [string, string];
}) {
    return (
        <LinearGradient colors={gradient} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${iconColor}20` }]}>
                <Ionicons name={icon as any} size={20} color={iconColor} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </LinearGradient>
    );
}

function QuickAction({
    icon,
    label,
    color,
    onPress,
}: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    greeting: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    avatarButton: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    avatarGradient: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    statLabel: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    addVideoCard: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addVideoGradient: {
        padding: Spacing.lg,
    },
    addVideoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addVideoIcon: {
        marginRight: Spacing.md,
    },
    addVideoText: {
        flex: 1,
    },
    addVideoTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    addVideoSubtitle: {
        fontSize: FontSizes.sm,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    section: {
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    seeAllText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.primary,
        fontWeight: FontWeights.semibold,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.textSecondary,
        marginTop: Spacing.md,
    },
    emptySubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textMuted,
        marginTop: Spacing.xs,
    },
    videoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    videoThumbnail: {
        width: 120,
        height: 80,
        backgroundColor: Colors.dark.surfaceLight,
    },
    videoInfo: {
        flex: 1,
        padding: Spacing.sm,
        justifyContent: 'space-between',
    },
    videoTitle: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.text,
        lineHeight: 18,
    },
    videoChannel: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textMuted,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    statusText: {
        fontSize: FontSizes.xs,
        fontWeight: FontWeights.medium,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    quickAction: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionLabel: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textSecondary,
        fontWeight: FontWeights.medium,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.dark.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    modalSubtitle: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textSecondary,
        marginBottom: Spacing.md,
        lineHeight: 20,
    },
    modalError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    modalErrorText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.error,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceLight,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        height: 52,
        marginBottom: Spacing.md,
    },
    modalInput: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.dark.text,
    },
    modalSubmit: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    modalSubmitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    modalSubmitText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
});
