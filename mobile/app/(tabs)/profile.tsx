import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();

    const handleSignOut = () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabından çıkış yapmak istediğine emin misin?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/');
                    },
                },
            ]
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatItem
                    icon="flame"
                    color={Colors.dark.warning}
                    value={`${user?.studyStreak || 0}`}
                    label="Gün Serisi"
                />
                <StatItem
                    icon="videocam"
                    color={Colors.dark.primary}
                    value={`${user?.totalVideosProcessed || 0}`}
                    label="Video"
                />
                <StatItem
                    icon="trophy"
                    color={Colors.dark.success}
                    value={`${user?.totalQuizzesTaken || 0}`}
                    label="Quiz"
                />
                <StatItem
                    icon="time"
                    color={Colors.dark.info}
                    value={`${user?.totalStudyMinutes || 0}`}
                    label="Dakika"
                />
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Ayarlar</Text>
                <MenuItem icon="notifications-outline" label="Bildirimler" onPress={() => { }} />
                <MenuItem icon="moon-outline" label="Karanlık Mod" trailing="Açık" onPress={() => { }} />
                <MenuItem icon="language-outline" label="Dil" trailing="Türkçe" onPress={() => { }} />
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Destek</Text>
                <MenuItem icon="help-circle-outline" label="Yardım Merkezi" onPress={() => { }} />
                <MenuItem icon="chatbubble-outline" label="Geri Bildirim" onPress={() => { }} />
                <MenuItem icon="star-outline" label="Uygulamayı Değerlendir" onPress={() => { }} />
                <MenuItem icon="document-text-outline" label="Gizlilik Politikası" onPress={() => { }} />
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={Colors.dark.error} />
                <Text style={styles.signOutText}>Çıkış Yap</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={styles.version}>StudyFlow v1.0.0</Text>
        </ScrollView>
    );
}

function StatItem({
    icon,
    color,
    value,
    label,
}: {
    icon: string;
    color: string;
    value: string;
    label: string;
}) {
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

function MenuItem({
    icon,
    label,
    trailing,
    onPress,
}: {
    icon: string;
    label: string;
    trailing?: string;
    onPress: () => void;
}) {
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
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
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
    avatarGradient: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: FontSizes.xxl,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    userName: {
        fontSize: FontSizes.xl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    userEmail: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    statValue: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
    },
    statLabel: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textSecondary,
    },
    menuSection: {
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    menuSectionTitle: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        gap: Spacing.sm,
    },
    menuLabel: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.dark.text,
    },
    menuTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    menuTrailingText: {
        fontSize: FontSizes.sm,
        color: Colors.dark.textMuted,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        marginBottom: Spacing.md,
    },
    signOutText: {
        fontSize: FontSizes.md,
        fontWeight: FontWeights.semibold,
        color: Colors.dark.error,
    },
    version: {
        textAlign: 'center',
        fontSize: FontSizes.xs,
        color: Colors.dark.textMuted,
        marginBottom: Spacing.xxl,
    },
});
