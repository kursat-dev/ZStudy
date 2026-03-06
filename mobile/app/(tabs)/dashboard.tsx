import React, { useState, useCallback, useEffect } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Video, StudyAnalytics, StudyPlanItem } from '../../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [weakTopics, setWeakTopics] = useState<StudyAnalytics[]>([]);
    const [todayPlan, setTodayPlan] = useState<StudyPlanItem[]>([]);
    const [tips, setTips] = useState<string[]>([]);
    const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [videosRes, analyticsRes, plannerRes] = await Promise.all([
                api.getVideos(1, 5),
                api.getAnalytics().catch(() => null),
                api.getTodayPlan().catch(() => null),
            ]);

            if (videosRes.success) setVideos(videosRes.data.videos);
            if (analyticsRes?.success) setWeakTopics(analyticsRes.data.weakTopics || []);
            if (plannerRes?.success) {
                setTodayPlan(plannerRes.data.todayPlan || []);
                setTips(plannerRes.data.tips || []);
                setDaysUntilExam(plannerRes.data.daysUntilExam);
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([loadData(), refreshUser()]);
        setIsRefreshing(false);
    }, [loadData, refreshUser]);

    const handleAddVideo = async () => {
        if (!videoUrl.trim()) return;
        setIsSubmitting(true);
        try {
            const response = await api.createVideo(videoUrl.trim());
            if (response.success) {
                setShowVideoModal(false);
                setVideoUrl('');
                loadData();
            }
        } catch {
            // Error
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return { label: 'Hazır', color: Colors.dark.success };
            case 'processing': return { label: 'İşleniyor', color: Colors.dark.warning };
            case 'pending': return { label: 'Bekliyor', color: Colors.dark.info };
            default: return { label: 'Hata', color: Colors.dark.error };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return Colors.dark.error;
            case 'medium': return Colors.dark.warning;
            default: return Colors.dark.textMuted;
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
                        <Text style={styles.greeting}>
                            Merhaba, {user?.name?.split(' ')[0] || 'Öğrenci'} 👋
                        </Text>
                        <Text style={styles.subGreeting}>Bugün ne çalışacaksın?</Text>
                    </View>
                    {user?.studyStreak ? (
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakEmoji}>🔥</Text>
                            <Text style={styles.streakCount}>{user.studyStreak}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Exam Countdown */}
                {daysUntilExam !== null && (
                    <View style={styles.countdownBanner}>
                        <LinearGradient
                            colors={['rgba(108,92,231,0.15)', 'rgba(0,206,202,0.08)']}
                            style={styles.countdownGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="calendar" size={20} color={Colors.dark.primary} />
                            <Text style={styles.countdownText}>
                                Sınava <Text style={styles.countdownNumber}>{daysUntilExam}</Text> gün kaldı
                            </Text>
                        </LinearGradient>
                    </View>
                )}

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon="flame"
                        iconColor={Colors.dark.warning}
                        label="Seri"
                        value={`${user?.studyStreak || 0}`}
                        gradient={['rgba(253,203,110,0.15)', 'rgba(253,203,110,0.03)']}
                    />
                    <StatCard
                        icon="videocam"
                        iconColor={Colors.dark.primary}
                        label="Video"
                        value={`${user?.totalVideosProcessed || 0}`}
                        gradient={['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.03)']}
                    />
                    <StatCard
                        icon="trophy"
                        iconColor={Colors.dark.success}
                        label="Quiz"
                        value={`${user?.totalQuizzesTaken || 0}`}
                        gradient={['rgba(0,184,148,0.15)', 'rgba(0,184,148,0.03)']}
                    />
                    <StatCard
                        icon="time"
                        iconColor={Colors.dark.info}
                        label="Dakika"
                        value={`${user?.totalStudyMinutes || 0}`}
                        gradient={['rgba(9,132,227,0.15)', 'rgba(9,132,227,0.03)']}
                    />
                </View>

                {/* Today's Plan */}
                {todayPlan.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Bugünün Planı</Text>
                        {todayPlan.slice(0, 4).map((item, index) => (
                            <View key={index} style={styles.planItem}>
                                <View style={[styles.planPriority, { backgroundColor: getPriorityColor(item.priority) }]} />
                                <Ionicons name={item.icon as any} size={20} color={Colors.dark.textSecondary} />
                                <View style={styles.planInfo}>
                                    <Text style={styles.planTitle}>{item.title}</Text>
                                    <Text style={styles.planDesc}>{item.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Tips */}
                {tips.length > 0 && (
                    <View style={styles.tipsContainer}>
                        {tips.map((tip, i) => (
                            <Text key={i} style={styles.tipText}>{tip}</Text>
                        ))}
                    </View>
                )}

                {/* Weak Topics */}
                {weakTopics.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚠️ Zayıf Konular</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weakScroll}>
                            {weakTopics.map((topic) => (
                                <View key={topic._id} style={styles.weakCard}>
                                    <Text style={styles.weakSubject}>{topic.subject}</Text>
                                    <Text style={styles.weakAccuracy}>
                                        %{Math.round(topic.quizAccuracy * 100)}
                                    </Text>
                                    <View style={styles.weakBar}>
                                        <View
                                            style={[
                                                styles.weakBarFill,
                                                {
                                                    width: `${Math.round(topic.quizAccuracy * 100)}%`,
                                                    backgroundColor:
                                                        topic.quizAccuracy < 0.4
                                                            ? Colors.dark.error
                                                            : Colors.dark.warning,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.weakMeta}>
                                        {topic.totalQuestions} soru çözüldü
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Quick Add CTA */}
                <TouchableOpacity
                    style={styles.addCta}
                    onPress={() => setShowVideoModal(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={Colors.dark.gradient.primary as [string, string]}
                        style={styles.addCtaGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                        <View>
                            <Text style={styles.addCtaTitle}>YouTube Video Ekle</Text>
                            <Text style={styles.addCtaSubtitle}>AI ile çalışma materyali oluştur</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Recent Videos */}
                {videos.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🕐 Son Videolar</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
                                <Text style={styles.seeAll}>Tümü →</Text>
                            </TouchableOpacity>
                        </View>
                        {videos.map((video) => {
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
                                        style={styles.videoThumb}
                                    />
                                    <View style={styles.videoInfo}>
                                        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                                        <View style={styles.videoMeta}>
                                            <View style={[styles.statusBadge, { backgroundColor: `${badge.color}20` }]}>
                                                <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
                                                <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                                            </View>
                                            {video.subject && (
                                                <Text style={styles.subjectTag}>{video.subject}</Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Add Video Modal */}
            <Modal visible={showVideoModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Video Ekle</Text>
                            <TouchableOpacity onPress={() => setShowVideoModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="YouTube linkini yapıştır..."
                            placeholderTextColor={Colors.dark.textMuted}
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={[styles.modalButton, !videoUrl.trim() && styles.modalButtonDisabled]}
                            onPress={handleAddVideo}
                            disabled={!videoUrl.trim() || isSubmitting}
                        >
                            <LinearGradient
                                colors={Colors.dark.gradient.primary as [string, string]}
                                style={styles.modalButtonGradient}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonText}>İşleme Başla</Text>
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
        <View style={styles.statCard}>
            <LinearGradient colors={gradient} style={styles.statGradient}>
                <Ionicons name={icon as any} size={18} color={iconColor} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        marginBottom: Spacing.md,
    },
    greeting: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    subGreeting: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(253,203,110,0.15)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    streakEmoji: { fontSize: 16 },
    streakCount: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.dark.warning },

    // Countdown
    countdownBanner: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    countdownGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(108,92,231,0.2)',
    },
    countdownText: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary },
    countdownNumber: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.primary },

    // Stats
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
    statGradient: { alignItems: 'center', paddingVertical: Spacing.sm, gap: 2, borderRadius: BorderRadius.md },
    statValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.text },
    statLabel: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary },

    // Sections
    section: { marginBottom: Spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.text, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
    seeAll: { fontSize: FontSizes.sm, color: Colors.dark.primary, fontWeight: FontWeights.medium },

    // Today's Plan
    planItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    planPriority: { width: 4, height: 28, borderRadius: 2 },
    planInfo: { flex: 1 },
    planTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.text },
    planDesc: { fontSize: FontSizes.xs, color: Colors.dark.textMuted, marginTop: 1 },

    // Tips
    tipsContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    tipText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textSecondary,
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },

    // Weak Topics
    weakScroll: { paddingLeft: Spacing.lg },
    weakCard: {
        width: 140,
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    weakSubject: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.text, marginBottom: 4 },
    weakAccuracy: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.dark.warning },
    weakBar: { height: 4, backgroundColor: Colors.dark.surfaceLight, borderRadius: 2, marginTop: 6, marginBottom: 4 },
    weakBarFill: { height: '100%', borderRadius: 2 },
    weakMeta: { fontSize: FontSizes.xs, color: Colors.dark.textMuted },

    // Add CTA
    addCta: { marginHorizontal: Spacing.lg, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.lg },
    addCtaGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md },
    addCtaTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#FFFFFF' },
    addCtaSubtitle: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.7)' },

    // Videos
    videoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    videoThumb: { width: 120, height: 80, backgroundColor: Colors.dark.surfaceLight },
    videoInfo: { flex: 1, padding: Spacing.sm, justifyContent: 'space-between' },
    videoTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.text, lineHeight: 18 },
    videoMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
    subjectTag: { fontSize: FontSizes.xs, color: Colors.dark.primary, backgroundColor: 'rgba(108,92,231,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: BorderRadius.full },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: Colors.dark.surface,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    modalTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    modalInput: {
        backgroundColor: Colors.dark.background,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: Spacing.md,
    },
    modalButton: { borderRadius: BorderRadius.md, overflow: 'hidden' },
    modalButtonDisabled: { opacity: 0.5 },
    modalButtonGradient: { paddingVertical: Spacing.md, alignItems: 'center' },
    modalButtonText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#FFFFFF' },
});
