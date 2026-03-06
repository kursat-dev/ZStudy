import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/(tabs)/dashboard');
            return;
        }

        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(buttonFade, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="book" size={48} color={Colors.dark.primary} />
                    </View>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background gradient decoration */}
            <View style={styles.bgDecoration}>
                <LinearGradient
                    colors={['rgba(108, 92, 231, 0.15)', 'transparent']}
                    style={styles.bgGradient1}
                />
                <LinearGradient
                    colors={['rgba(0, 206, 202, 0.1)', 'transparent']}
                    style={styles.bgGradient2}
                />
            </View>

            {/* Floating particles */}
            <View style={[styles.particle, { top: height * 0.15, left: width * 0.1 }]}>
                <Ionicons name="sparkles" size={20} color={Colors.dark.primaryLight} />
            </View>
            <View style={[styles.particle, { top: height * 0.25, right: width * 0.15 }]}>
                <Ionicons name="flash" size={16} color={Colors.dark.secondary} />
            </View>
            <View style={[styles.particle, { top: height * 0.4, left: width * 0.8 }]}>
                <Ionicons name="star" size={14} color={Colors.dark.warning} />
            </View>

            {/* Logo & Title */}
            <Animated.View
                style={[
                    styles.headerSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={Colors.dark.gradient.accent as [string, string]}
                        style={styles.logoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="book" size={40} color="#FFFFFF" />
                    </LinearGradient>
                </View>

                <Text style={styles.appName}>StudyFlow</Text>
                <Text style={styles.tagline}>Yapay Zeka Destekli Çalışma Arkadaşın</Text>
            </Animated.View>

            {/* Feature pills */}
            <Animated.View
                style={[
                    styles.featureSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.featureRow}>
                    <FeaturePill icon="videocam" text="Video → Not" />
                    <FeaturePill icon="help-circle" text="Quiz" />
                    <FeaturePill icon="layers" text="Kartlar" />
                </View>
                <View style={styles.featureRow}>
                    <FeaturePill icon="document-text" text="Özet" />
                    <FeaturePill icon="download" text="PDF" />
                    <FeaturePill icon="trending-up" text="İstatistik" />
                </View>
            </Animated.View>

            {/* CTA Buttons */}
            <Animated.View style={[styles.buttonSection, { opacity: buttonFade }]}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(auth)/sign-up')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={Colors.dark.gradient.primary as [string, string]}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="rocket" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Hemen Başla</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(auth)/sign-in')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.secondaryButtonText}>
                        Zaten hesabın var mı?{' '}
                        <Text style={styles.linkText}>Giriş Yap</Text>
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Bottom tagline */}
            <Text style={styles.bottomText}>
                YKS hazırlığında bir adım önde ol 🎯
            </Text>
        </View>
    );
}

function FeaturePill({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.pill}>
            <Ionicons name={icon as any} size={14} color={Colors.dark.primary} />
            <Text style={styles.pillText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgDecoration: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bgGradient1: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        top: -width * 0.5,
        left: -width * 0.25,
    },
    bgGradient2: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width,
        bottom: -width * 0.3,
        right: -width * 0.2,
    },
    particle: {
        position: 'absolute',
        opacity: 0.4,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoContainer: {
        marginBottom: Spacing.lg,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontSize: FontSizes.display,
        fontWeight: FontWeights.extrabold,
        color: Colors.dark.text,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    featureSection: {
        marginBottom: Spacing.xxl,
        gap: Spacing.sm,
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    pillText: {
        fontSize: FontSizes.xs,
        color: Colors.dark.textSecondary,
        fontWeight: FontWeights.medium,
    },
    buttonSection: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.md,
    },
    primaryButton: {
        width: '100%',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.lg,
    },
    primaryButtonText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    secondaryButton: {
        paddingVertical: Spacing.sm,
    },
    secondaryButtonText: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
    },
    linkText: {
        color: Colors.dark.primary,
        fontWeight: FontWeights.semibold,
    },
    bottomText: {
        position: 'absolute',
        bottom: Spacing.xxl,
        fontSize: FontSizes.sm,
        color: Colors.dark.textMuted,
    },
});
