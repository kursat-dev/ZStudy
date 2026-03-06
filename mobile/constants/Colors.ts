export const Colors = {
    dark: {
        primary: '#6C5CE7',
        primaryLight: '#A29BFE',
        primaryDark: '#5A4BD1',
        secondary: '#00CECA',
        secondaryLight: '#55EFC4',

        background: '#0A0A1A',
        surface: '#141428',
        surfaceLight: '#1E1E3A',
        surfaceHighlight: '#2A2A4A',

        text: '#FFFFFF',
        textSecondary: '#A0A0C0',
        textMuted: '#6B6B8D',
        textInverse: '#0A0A1A',

        success: '#00B894',
        warning: '#FDCB6E',
        error: '#FF6B6B',
        info: '#74B9FF',

        border: '#2A2A4A',
        borderLight: '#1E1E3A',

        gradient: {
            primary: ['#6C5CE7', '#A29BFE'],
            dark: ['#0A0A1A', '#141428'],
            card: ['#1E1E3A', '#141428'],
            accent: ['#6C5CE7', '#00CECA'],
        },

        shadow: 'rgba(0, 0, 0, 0.3)',
        overlay: 'rgba(0, 0, 0, 0.6)',

        tabBar: '#0F0F24',
        tabBarBorder: '#1E1E3A',
        tabBarActive: '#6C5CE7',
        tabBarInactive: '#6B6B8D',
    },
    light: {
        primary: '#6C5CE7',
        primaryLight: '#A29BFE',
        primaryDark: '#5A4BD1',
        secondary: '#00CECA',
        secondaryLight: '#55EFC4',

        background: '#F8F9FE',
        surface: '#FFFFFF',
        surfaceLight: '#F0F1FA',
        surfaceHighlight: '#E8E9F5',

        text: '#1A1A2E',
        textSecondary: '#6B6B8D',
        textMuted: '#A0A0C0',
        textInverse: '#FFFFFF',

        success: '#00B894',
        warning: '#FDCB6E',
        error: '#FF6B6B',
        info: '#74B9FF',

        border: '#E8E9F5',
        borderLight: '#F0F1FA',

        gradient: {
            primary: ['#6C5CE7', '#A29BFE'],
            dark: ['#F8F9FE', '#FFFFFF'],
            card: ['#FFFFFF', '#F8F9FE'],
            accent: ['#6C5CE7', '#00CECA'],
        },

        shadow: 'rgba(0, 0, 0, 0.08)',
        overlay: 'rgba(0, 0, 0, 0.3)',

        tabBar: '#FFFFFF',
        tabBarBorder: '#E8E9F5',
        tabBarActive: '#6C5CE7',
        tabBarInactive: '#A0A0C0',
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const FontSizes = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
};

export const FontWeights = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};
