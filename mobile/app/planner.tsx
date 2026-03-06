import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { StudyPlanItem, StudyAnalytics } from '../types';

export default function PlannerScreen() {
    const { user, refreshUser } = useAuth();
    const [todayPlan, setTodayPlan] = useState<StudyPlanItem[]>([]);
    const [tips, setTips] = useState<string[]>([]);
    const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
    const [weakTopics, setWeakTopics] = useState<StudyAnalytics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [examTarget, setExamTarget] = useState('');
    const [examDate, setExamDate] = useState('');
    const [estimatedScore, setEstimatedScore] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [plannerRes, analyticsRes] = await Promise.all([
                api.getTodayPlan().catch(() => null),
                api.getAnalytics().catch(() => null),
            ]);

            if (plannerRes?.success) {
                setTodayPlan(plannerRes.data.todayPlan || []);
                setTips(plannerRes.data.tips || []);
                setDaysUntilExam(plannerRes.data.daysUntilExam);
            }
            if (analyticsRes?.success) {
                setWeakTopics(analyticsRes.data.weakTopics || []);
            }
        } catch {
            // Silent
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
            if (user) {
                setExamTarget(user.examTarget || '');
                setExamDate(user.examDate ? new Date(user.examDate).toISOString().split('T')[0] : '');
                setEstimatedScore(user.estimatedScore?.toString() || '');
            }
        }, [loadData, user])
    );

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [loadData]);

    const handleSaveSettings = async () => {
        try {
            await api.savePlannerSettings({
                examTarget: examTarget || undefined,
                estimatedScore: estimatedScore ? parseInt(estimatedScore) : undefined,
                examDate: examDate || undefined,
            });
            setShowSettings(false);
            await Promise.all([loadData(), refreshUser()]);
        } catch {
            // Error
        }
    };

    const getPriorityStyle = (p: string) => {
        switch (p) {
            case 'high': return { bg: 'rgba(255,107,107,0.1)', color: Colors.dark.error, border: 'rgba(255,107,107,0.2)' };
            case 'medium': return { bg: 'rgba(253,203,110,0.1)', color: Colors.dark.warning, border: 'rgba(253,203,110,0.2)' };
            default: return { bg: Colors.dark.surface, color: Colors.dark.textMuted, border: Colors.dark.border };
        }
    };

    const EXAM_TARGETS = ['Tıp', 'Mühendislik', 'Hukuk', 'İşletme', 'Eğitim', 'Diğer'];

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Çalışma Planı 📅</Text>
                        <Text style={styles.subtitle}>
                            {user?.examTarget ? `Hedef: ${user.examTarget}` : 'Hedefe yönelik çalış'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
                        <Ionicons name="settings-outline" size={22} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Exam Countdown */}
                {daysUntilExam !== null && (
                    <View style={styles.countdown}>
                        <LinearGradient
                            colors={Colors.dark.gradient.primary as [string, string]}
                            style={styles.countdownGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View>
                                <Text style={styles.countdownLabel}>Sınava Kalan</Text>
                                <Text style={styles.countdownDays}>{daysUntilExam} Gün</Text>
                            </View>
                            <View style={styles.countdownRight}>
                                <Text style={styles.countdownStreak}>🔥 {user?.studyStreak || 0} gün seri</Text>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Today's Plan */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bugünün Görevleri</Text>
                    {todayPlan.length === 0 ? (
                        <View style={styles.emptyPlan}>
                            <Ionicons name="clipboard-outline" size={32} color={Colors.dark.textMuted} />
                            <Text style={styles.emptyPlanText}>Sınav hedefini belirle ve plan oluştur</Text>
                        </View>
                    ) : (
                        todayPlan.map((item, index) => {
                            const ps = getPriorityStyle(item.priority);
                            return (
                                <View
                                    key={index}
                                    style={[styles.planCard, { backgroundColor: ps.bg, borderColor: ps.border }]}
                                >
                                    <View style={styles.planIcon}>
                                        <Ionicons name={item.icon as any} size={22} color={ps.color} />
                                    </View>
                                    <View style={styles.planContent}>
                                        <Text style={styles.planTitle}>{item.title}</Text>
                                        <Text style={styles.planDesc}>{item.description}</Text>
                                    </View>
                                    <View style={[styles.priorityDot, { backgroundColor: ps.color }]} />
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Tips */}
                {tips.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💡 Öneriler</Text>
                        {tips.map((tip, i) => (
                            <View key={i} style={styles.tipCard}>
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Weak Topics */}
                {weakTopics.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎯 Odaklanılacak Konular</Text>
                        {weakTopics.map((topic) => (
                            <View key={topic._id} style={styles.topicCard}>
                                <View style={styles.topicInfo}>
                                    <Text style={styles.topicName}>{topic.subject}</Text>
                                    <Text style={styles.topicMeta}>{topic.totalQuestions} soru çözüldü</Text>
                                </View>
                                <View style={styles.topicScore}>
                                    <Text style={[
                                        styles.topicAccuracy,
                                        { color: topic.quizAccuracy < 0.4 ? Colors.dark.error : Colors.dark.warning }
                                    ]}>
                                        %{Math.round(topic.quizAccuracy * 100)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Settings Modal */}
            <Modal visible={showSettings} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sınav Ayarları</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Hedef Bölüm</Text>
                        <View style={styles.targetChips}>
                            {EXAM_TARGETS.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.targetChip, examTarget === t && styles.targetChipActive]}
                                    onPress={() => setExamTarget(t)}
                                >
                                    <Text style={[styles.targetChipText, examTarget === t && styles.targetChipTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Sınav Tarihi (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="2026-06-15"
                            placeholderTextColor={Colors.dark.textMuted}
                            value={examDate}
                            onChangeText={setExamDate}
                        />

                        <Text style={styles.inputLabel}>Tahmini Puan</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="350"
                            placeholderTextColor={Colors.dark.textMuted}
                            value={estimatedScore}
                            onChangeText={setEstimatedScore}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
                            <LinearGradient colors={Colors.dark.gradient.primary as [string, string]} style={styles.saveBtnGrad}>
                                <Text style={styles.saveBtnText}>Kaydet</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark.background },
    scrollContent: { paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, paddingTop: 60, marginBottom: Spacing.md },
    title: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    subtitle: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },
    settingsBtn: { width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center', marginTop: 4 },

    // Countdown
    countdown: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    countdownGrad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: BorderRadius.lg, padding: Spacing.lg },
    countdownLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.7)' },
    countdownDays: { fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, color: '#FFF' },
    countdownRight: { alignItems: 'flex-end' },
    countdownStreak: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },

    // Sections
    section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.dark.text, marginBottom: Spacing.sm },

    // Plan cards
    emptyPlan: { alignItems: 'center', paddingVertical: Spacing.xl, backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.dark.border },
    emptyPlanText: { fontSize: FontSizes.sm, color: Colors.dark.textMuted, marginTop: Spacing.sm },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.xs,
        gap: Spacing.sm,
        borderWidth: 1,
    },
    planIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    planContent: { flex: 1 },
    planTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.text },
    planDesc: { fontSize: FontSizes.xs, color: Colors.dark.textMuted, marginTop: 2 },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },

    // Tips
    tipCard: { backgroundColor: Colors.dark.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.dark.border },
    tipText: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, lineHeight: 20 },

    // Topics
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    topicInfo: { flex: 1 },
    topicName: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.dark.text },
    topicMeta: { fontSize: FontSizes.xs, color: Colors.dark.textMuted, marginTop: 2 },
    topicScore: {},
    topicAccuracy: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.dark.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: Spacing.xxl },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.dark.text },
    inputLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.dark.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
    input: { backgroundColor: Colors.dark.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.dark.text, borderWidth: 1, borderColor: Colors.dark.border },
    targetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    targetChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, backgroundColor: Colors.dark.background, borderWidth: 1, borderColor: Colors.dark.border },
    targetChipActive: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
    targetChipText: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary },
    targetChipTextActive: { color: '#FFF' },
    saveBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.lg },
    saveBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    saveBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#FFF' },
});
