import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Linking,
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
    const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'timestamps'>('summary');

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

    const handleTimestampTap = (seconds: number) => {
        // Open YouTube at specific timestamp
        const url = `https://www.youtube.com/watch?v=${video?.youtubeId}&t=${seconds}s`;
        Linking.openURL(url);
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

    const tabs = [
        { key: 'summary' as const, label: 'Özet' },
        { key: 'notes' as const, label: 'Notlar' },
        ...(video.timestampNotes?.length > 0 ? [{ key: 'timestamps' as const, label: 'Zaman Çizelgesi' }] : []),
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Thumbnail */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => Linking.openURL(video.youtubeUrl)}
                >
                    <Image
                        source={{ uri: video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg` }}
                        style={styles.thumbnail}
                    />
                    <View style={styles.playOverlay}>
                        <View style={styles.playButton}>
                            <Ionicons name="play" size={28} color="#FFFFFF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Back & Favorite */}
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
                    {video.channelName && <Text style={styles.channelName}>{video.channelName}</Text>}
                    <View style={styles.metaRow}>
                        {video.subject && (
                            <View style={styles.subjectBadge}>
                                <Text style={styles.subjectText}>{video.subject}</Text>
                            </View>
                        )}
                        {video.tags?.map((tag, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Action Buttons Grid */}
                <View style={styles.actions}>
                    {video.quizQuestions?.length > 0 && (
                        <ActionButton
                            icon="help-circle"
                            label="Quiz"
                            count={`${video.quizQuestions.length} soru`}
                            colors={['rgba(0,206,202,0.2)', 'rgba(0,206,202,0.05)']}
                            iconColor={Colors.dark.secondary}
                            onPress={() => router.push(`/quiz/${video._id}`)}
                        />
                    )}
                    {video.yksQuestions?.length > 0 && (
                        <ActionButton
                            icon="school"
                            label="YKS Test"
                            count={`${video.yksQuestions.length} soru`}
                            colors={['rgba(108,92,231,0.2)', 'rgba(108,92,231,0.05)']}
                            iconColor={Colors.dark.primary}
                            onPress={() => router.push(`/yks-test/${video._id}`)}
                        />
                    )}
                    {video.flashcards?.length > 0 && (
                        <ActionButton
                            icon="layers"
                            label="Kartlar"
                            count={`${video.flashcards.length} kart`}
                            colors={['rgba(253,203,110,0.2)', 'rgba(253,203,110,0.05)']}
                            iconColor={Colors.dark.warning}
                            onPress={() => router.push(`/flashcards/${video._id}`)}
                        />
                    )}
                </View>

                {/* Content Tabs */}
                <View style={styles.tabBar}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    {activeTab === 'summary' && (
                        <Text style={styles.contentText}>
                            {video.summary || 'Özet henüz oluşturulmadı.'}
                        </Text>
                    )}
                    {activeTab === 'notes' && (
                        <Text style={styles.contentText}>
                            {video.notes || 'Notlar henüz oluşturulmadı.'}
                        </Text>
                    )}
                    {activeTab === 'timestamps' && (
                        <View style={styles.timestampList}>
                            {video.timestampNotes?.map((note, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.timestampItem}
                                    onPress={() => handleTimestampTap(note.seconds)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.timestampTime}>
                                        <Ionicons name="play-circle" size={14} color={Colors.dark.primary} />
                                        <Text style={styles.timestampTimeText}>{note.time}</Text>
                                    </View>
                                    <Text style={styles.timestampNote}>{note.note}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function ActionButton({
    icon,
    label,
    count,
    colors,
    iconColor,
    onPress,
}: {
    icon: string;
    label: string;
    count: string;
    colors: [string, string];
    iconColor: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <LinearGradient colors={colors} style={styles.actionGradient}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
                <Text style={styles.actionLabel}>{label}</Text>
                <Text style={styles.actionCount}>{count}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: Spacing.xxl },
    thumbnail: { width: '100%', height: 220, backgroundColor: Colors.dark.surfaceLight },
    playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    playButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingLeft: 3 },
    topBar: { position: 'absolute', top: 50, left: Spacing.md, right: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
    topButton: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    infoSection: { padding: Spacing.lg },
    videoTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.dark.text, lineHeight: 28 },
    channelName: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: Spacing.xs },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
    subjectBadge: { backgroundColor: 'rgba(108,92,231,0.15)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
    subjectText: { fontSize: FontSizes.xs, color: Colors.dark.primary, fontWeight: FontWeights.semibold },
    tag: { backgroundColor: Colors.dark.surfaceLight, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
    tagText: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary },

    // Actions
    actions: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
    actionButton: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
    actionGradient: { alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
    actionLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.text },
    actionCount: { fontSize: FontSizes.xs, color: Colors.dark.textMuted },

    // Tabs
    tabBar: { flexDirection: 'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: 4, marginBottom: Spacing.md },
    tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
    tabActive: { backgroundColor: Colors.dark.primary },
    tabText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.dark.textSecondary },
    tabTextActive: { color: '#FFF' },

    // Content
    contentSection: { paddingHorizontal: Spacing.lg },
    contentText: { fontSize: FontSizes.md, color: Colors.dark.textSecondary, lineHeight: 24 },

    // Timestamps
    timestampList: { gap: Spacing.xs },
    timestampItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    timestampTime: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
    timestampTimeText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.primary },
    timestampNote: { flex: 1, fontSize: FontSizes.sm, color: Colors.dark.text, lineHeight: 20 },

    errorText: { fontSize: FontSizes.lg, color: Colors.dark.textSecondary, marginTop: Spacing.md },
    backLink: { fontSize: FontSizes.md, color: Colors.dark.primary, marginTop: Spacing.md },
});
