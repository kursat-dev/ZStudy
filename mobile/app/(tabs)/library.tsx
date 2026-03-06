import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import api from '../../services/api';
import { Video } from '../../types';

const SUBJECTS = ['Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'];

export default function LibraryScreen() {
    const router = useRouter();
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Tümü');
    const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'favorites'>('all');

    const loadVideos = useCallback(async () => {
        try {
            const filters: any = {};
            if (selectedSubject !== 'Tümü') filters.subject = selectedSubject;
            if (search) filters.search = search;
            if (filter === 'completed') filters.status = 'completed';
            if (filter === 'processing') filters.status = 'processing';
            if (filter === 'favorites') filters.favorite = true;

            const response = await api.getVideos(1, 50, Object.keys(filters).length > 0 ? filters : undefined);
            if (response.success) {
                setVideos(response.data.videos);
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, [selectedSubject, search, filter]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadVideos();
        setIsRefreshing(false);
    }, [loadVideos]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return Colors.dark.success;
            case 'processing': return Colors.dark.warning;
            case 'pending': return Colors.dark.info;
            default: return Colors.dark.error;
        }
    };

    const getProgressInfo = (video: Video) => {
        if (video.status !== 'completed') return null;
        let total = 0;
        let done = 0;
        if (video.quizQuestions?.length > 0) total++;
        if (video.yksQuestions?.length > 0) total++;
        if (video.flashcards?.length > 0) total++;
        if (video.watchProgress?.completed) done++;
        // For simplicity, show materials count
        return { materials: total };
    };

    const renderVideo = ({ item: video }: { item: Video }) => {
        const progress = getProgressInfo(video);

        return (
            <TouchableOpacity
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
                    style={styles.thumbnail}
                />
                <View style={styles.videoOverlay}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(video.status) }]} />
                </View>
                <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    {video.subject && (
                        <View style={styles.subjectBadge}>
                            <Text style={styles.subjectText}>{video.subject}</Text>
                        </View>
                    )}
                    <View style={styles.videoMeta}>
                        {video.status === 'completed' && (
                            <>
                                {video.yksQuestions?.length > 0 && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="school-outline" size={11} color={Colors.dark.primary} />
                                        <Text style={[styles.metaText, { color: Colors.dark.primary }]}>{video.yksQuestions.length}</Text>
                                    </View>
                                )}
                                {video.flashcards?.length > 0 && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="layers-outline" size={11} color={Colors.dark.textMuted} />
                                        <Text style={styles.metaText}>{video.flashcards.length}</Text>
                                    </View>
                                )}
                                {video.timestampNotes?.length > 0 && (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={11} color={Colors.dark.textMuted} />
                                        <Text style={styles.metaText}>{video.timestampNotes.length}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
                {video.isFavorite && (
                    <View style={styles.favoriteIcon}>
                        <Ionicons name="heart" size={14} color={Colors.dark.error} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Kütüphane 📚</Text>
                <Text style={styles.subtitle}>{videos.length} video</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.dark.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Video ara..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Subject Filter */}
            <FlatList
                horizontal
                data={SUBJECTS}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectScroll}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.subjectChip, selectedSubject === item && styles.subjectChipActive]}
                        onPress={() => setSelectedSubject(item)}
                    >
                        <Text style={[styles.subjectChipText, selectedSubject === item && styles.subjectChipTextActive]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Status Filters */}
            <View style={styles.filters}>
                {(['all', 'completed', 'processing', 'favorites'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && styles.filterChipActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'Tümü' : f === 'completed' ? '✓ Hazır' : f === 'processing' ? '⏳ İşleniyor' : '❤️ Favori'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Video List */}
            <FlatList
                data={videos}
                renderItem={renderVideo}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="library-outline" size={48} color={Colors.dark.textMuted} />
                        <Text style={styles.emptyTitle}>
                            {search || selectedSubject !== 'Tümü' ? 'Sonuç bulunamadı' : 'Kütüphane boş'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {search ? 'Farklı bir arama dene' : 'Dashboard\'dan video ekleyerek başla'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: 60, marginBottom: Spacing.md },
    title: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    subtitle: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        height: 44,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: Spacing.sm,
    },
    searchInput: { flex: 1, fontSize: FontSizes.md, color: Colors.dark.text },

    // Subject chips
    subjectScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.sm },
    subjectChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.dark.surface,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginRight: Spacing.xs,
    },
    subjectChipActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
    subjectChipText: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary, fontWeight: FontWeights.medium },
    subjectChipTextActive: { color: '#FFF' },

    // Status filters
    filters: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.xs, marginBottom: Spacing.md },
    filterChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        backgroundColor: 'transparent',
    },
    filterChipActive: { backgroundColor: Colors.dark.surfaceLight },
    filterText: { fontSize: FontSizes.xs, color: Colors.dark.textMuted },
    filterTextActive: { color: Colors.dark.text },

    // List
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

    // Video card
    videoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    thumbnail: { width: 120, height: 85, backgroundColor: Colors.dark.surfaceLight },
    videoOverlay: { position: 'absolute', top: Spacing.xs, left: Spacing.xs },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    videoInfo: { flex: 1, padding: Spacing.sm, justifyContent: 'space-between' },
    videoTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.text, lineHeight: 18 },
    subjectBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(108,92,231,0.12)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: BorderRadius.full, marginTop: 3 },
    subjectText: { fontSize: 10, color: Colors.dark.primary, fontWeight: FontWeights.medium },
    videoMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    metaText: { fontSize: 10, color: Colors.dark.textMuted },
    favoriteIcon: { position: 'absolute', top: Spacing.xs, right: Spacing.xs },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    emptyTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, color: Colors.dark.textSecondary, marginTop: Spacing.md },
    emptySubtitle: { fontSize: FontSizes.sm, color: Colors.dark.textMuted, marginTop: Spacing.xs },
});
