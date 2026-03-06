import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { WeeklyStats } from '../../types';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut, refreshUser } = useAuth();
    const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
    const [studyStreak, setStudyStreak] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const res = await api.getWeeklyStats().catch(() => null);
            if (res?.success) {
                setWeeklyStats(res.data.recentWeeks || []);
                setStudyStreak(res.data.studyStreak || 0);
            }
        } catch {
            // Silent
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

    const handleSignOut = () => {
        Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/');
                },
            },
        ]);
    };

    // Find max value for chart scaling
    const maxMinutes = Math.max(...weeklyStats.map((w) => w.minutesStudied), 1);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profil</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <LinearGradient
                    colors={Colors.dark.gradient.accent as [string, string]}
                    style={styles.avatarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Text>
                </LinearGradient>
                <Text style={styles.userName}>{user?.name || 'Öğrenci'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                {user?.examTarget && (
                    <View style={styles.examBadge}>
                        <Ionicons name="school" size={14} color={Colors.dark.primary} />
                        <Text style={styles.examBadgeText}>Hedef: {user.examTarget}</Text>
                    </View>
                )}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatItem icon="flame" color={Colors.dark.warning} value={`${studyStreak}`} label="Gün Serisi" />
                <StatItem icon="videocam" color={Colors.dark.primary} value={`${user?.totalVideosProcessed || 0}`} label="Video" />
                <StatItem icon="trophy" color={Colors.dark.success} value={`${user?.totalQuizzesTaken || 0}`} label="Quiz" />
                <StatItem icon="time" color={Colors.dark.info} value={`${user?.totalStudyMinutes || 0}`} label="Dakika" />
            </View>

            {/* Weekly Chart */}
            {weeklyStats.length > 0 && (
                <View style={styles.chartSection}>
                    <Text style={styles.chartTitle}>📊 Haftalık Çalışma</Text>
                    <View style={styles.chart}>
                        {weeklyStats.map((week, i) => {
                            const height = Math.max((week.minutesStudied / maxMinutes) * 80, 4);
                            const weekLabel = new Date(week.week).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                            return (
                                <View key={i} style={styles.chartCol}>
                                    <Text style={styles.chartValue}>{week.minutesStudied}dk</Text>
                                    <View style={[styles.chartBar, { height }]}>
                                        <LinearGradient
                                            colors={Colors.dark.gradient.primary as [string, string]}
                                            style={styles.chartBarGrad}
                                        />
                                    </View>
                                    <Text style={styles.chartLabel}>{weekLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.chartLegend}>
                        {weeklyStats.length > 0 && (
                            <>
                                <Text style={styles.legendItem}>Quiz: {weeklyStats[0]?.quizzesTaken || 0}</Text>
                                <Text style={styles.legendItem}>Doğruluk: %{Math.round((weeklyStats[0]?.accuracy || 0) * 100)}</Text>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Ayarlar</Text>
                <MenuItem icon="calendar-outline" label="Sınav Ayarları" onPress={() => router.push('/planner')} />
                <MenuItem icon="notifications-outline" label="Bildirimler" onPress={() => { }} />
                <MenuItem icon="moon-outline" label="Karanlık Mod" trailing="Açık" onPress={() => { }} />
                <MenuItem icon="language-outline" label="Dil" trailing="Türkçe" onPress={() => { }} />
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Destek</Text>
                <MenuItem icon="help-circle-outline" label="Yardım Merkezi" onPress={() => { }} />
                <MenuItem icon="chatbubble-outline" label="Geri Bildirim" onPress={() => { }} />
                <MenuItem icon="star-outline" label="Uygulamayı Değerlendir" onPress={() => { }} />
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={Colors.dark.error} />
                <Text style={styles.signOutText}>Çıkış Yap</Text>
            </TouchableOpacity>
            <Text style={styles.version}>StudyFlow v1.0.0</Text>
        </ScrollView>
    );
}

function StatItem({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) {
    return (
        <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MenuItem({ icon, label, trailing, onPress }: { icon: string; label: string; trailing?: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
            <Ionicons name={icon as any} size={20} color={Colors.dark.textSecondary} />
            <Text style={styles.menuLabel}>{label}</Text>
            <View style={styles.menuTrailing}>
                {trailing && <Text style={styles.menuTrailingText}>{trailing}</Text>}
                <Ionicons name="chevron-forward" size={16} color={Colors.dark.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    scrollContent: { paddingBottom: 100 },
    header: { paddingHorizontal: Spacing.lg, paddingTop: 60, marginBottom: Spacing.lg },
    headerTitle: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.bold, color: Colors.dark.text },

    // Profile
    profileCard: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: Spacing.lg,
    },
    avatarGradient: { width: 72, height: 72, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    avatarText: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: '#FFF' },
    userName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    userEmail: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },
    examBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,92,231,0.1)', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
    examBadgeText: { fontSize: FontSizes.xs, color: Colors.dark.primary, fontWeight: FontWeights.medium },

    // Stats
    statsGrid: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
    statItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.dark.border },
    statIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
    statValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.text },
    statLabel: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary },

    // Chart
    chartSection: { marginHorizontal: Spacing.lg, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: Spacing.lg },
    chartTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.dark.text, marginBottom: Spacing.md },
    chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
    chartCol: { alignItems: 'center', gap: 4 },
    chartValue: { fontSize: 10, color: Colors.dark.textMuted },
    chartBar: { width: 28, borderRadius: BorderRadius.sm, overflow: 'hidden' },
    chartBarGrad: { flex: 1, borderRadius: BorderRadius.sm },
    chartLabel: { fontSize: 10, color: Colors.dark.textSecondary },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.sm },
    legendItem: { fontSize: FontSizes.xs, color: Colors.dark.textMuted },

    // Menu
    menuSection: { marginBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
    menuSectionTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.dark.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.dark.border, gap: Spacing.sm },
    menuLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.dark.text },
    menuTrailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    menuTrailingText: { fontSize: FontSizes.sm, color: Colors.dark.textMuted },

    // Sign out
    signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', backgroundColor: 'rgba(255,107,107,0.08)', marginBottom: Spacing.md },
    signOutText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.error },
    version: { textAlign: 'center', fontSize: FontSizes.xs, color: Colors.dark.textMuted, marginBottom: Spacing.xxl },
});
