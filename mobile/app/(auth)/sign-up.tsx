import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleSignUp = async () => {
        setError('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Lütfen tüm alanları doldurun.');
            shake();
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            shake();
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            shake();
            return;
        }

        setIsLoading(true);
        try {
            await signUp(name.trim(), email.trim().toLowerCase(), password);
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            setError(err.message || 'Kayıt olurken bir hata oluştu.');
            shake();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Hesap Oluştur 🚀</Text>
                    <Text style={styles.subtitle}>
                        Birkaç saniyede hesabını oluştur ve çalışmaya başla
                    </Text>
                </View>

                {/* Form */}
                <Animated.View
                    style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}
                >
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={18} color={Colors.dark.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>İsim</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Adın Soyadın"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-posta</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@email.com"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Şifre</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="En az 6 karakter"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={Colors.dark.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Şifre Tekrar</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Şifreni tekrar gir"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                            />
                            {confirmPassword.length > 0 && (
                                <Ionicons
                                    name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={password === confirmPassword ? Colors.dark.success : Colors.dark.error}
                                />
                            )}
                        </View>
                    </View>

                    {/* Password strength indicator */}
                    {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthBar}>
                                <View
                                    style={[
                                        styles.strengthFill,
                                        {
                                            width: `${Math.min(100, (password.length / 12) * 100)}%`,
                                            backgroundColor:
                                                password.length < 6
                                                    ? Colors.dark.error
                                                    : password.length < 10
                                                        ? Colors.dark.warning
                                                        : Colors.dark.success,
                                        },
                                    ]}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.strengthText,
                                    {
                                        color:
                                            password.length < 6
                                                ? Colors.dark.error
                                                : password.length < 10
                                                    ? Colors.dark.warning
                                                    : Colors.dark.success,
                                    },
                                ]}
                            >
                                {password.length < 6 ? 'Zayıf' : password.length < 10 ? 'Orta' : 'Güçlü'}
                            </Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={Colors.dark.gradient.primary as [string, string]}
                            style={styles.submitGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitText}>Kayıt Ol</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <TouchableOpacity
                    style={styles.footerLink}
                    onPress={() => router.push('/(auth)/sign-in')}
                >
                    <Text style={styles.footerText}>
                        Zaten hesabın var mı?{' '}
                        <Text style={styles.footerLinkText}>Giriş Yap</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xxl,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: FontSizes.xxxl,
        fontWeight: FontWeights.bold,
        color: Colors.dark.text,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
        lineHeight: 22,
    },
    form: {
        gap: Spacing.md,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    errorText: {
        flex: 1,
        fontSize: FontSizes.sm,
        color: Colors.dark.error,
    },
    inputGroup: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
        color: Colors.dark.textSecondary,
        marginLeft: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        height: 52,
    },
    input: {
        flex: 1,
        fontSize: FontSizes.md,
        color: Colors.dark.text,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.dark.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: FontSizes.xs,
        fontWeight: FontWeights.medium,
    },
    submitButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginTop: Spacing.sm,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    submitText: {
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
        color: '#FFFFFF',
    },
    footerLink: {
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        fontSize: FontSizes.md,
        color: Colors.dark.textSecondary,
    },
    footerLinkText: {
        color: Colors.dark.primary,
        fontWeight: FontWeights.semibold,
    },
});
