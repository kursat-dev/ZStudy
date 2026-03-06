import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__
    ? 'http://localhost:3000/api'
    : 'https://your-production-url.vercel.app/api';

class ApiService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    async init() {
        this.accessToken = await SecureStore.getItemAsync('accessToken');
        this.refreshToken = await SecureStore.getItemAsync('refreshToken');
    }

    async setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
    }

    async clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle token expiry — attempt refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                const retryResponse = await fetch(url, { ...options, headers });
                return retryResponse.json();
            }
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Bir hata oluştu');
        }

        return data;
    }

    private async refreshAccessToken(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (!response.ok) {
                await this.clearTokens();
                return false;
            }

            const data = await response.json();
            if (data.success) {
                await this.setTokens(data.data.accessToken, data.data.refreshToken);
                return true;
            }

            await this.clearTokens();
            return false;
        } catch {
            await this.clearTokens();
            return false;
        }
    }

    // Auth
    async register(name: string, email: string, password: string) {
        return this.request<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    }

    async login(email: string, password: string) {
        return this.request<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getProfile() {
        return this.request<any>('/auth/me');
    }

    // Videos
    async getVideos(page = 1, limit = 20) {
        return this.request<any>(`/videos?page=${page}&limit=${limit}`);
    }

    async getVideo(id: string) {
        return this.request<any>(`/videos/${id}`);
    }

    async createVideo(youtubeUrl: string) {
        return this.request<any>('/videos', {
            method: 'POST',
            body: JSON.stringify({ youtubeUrl }),
        });
    }

    async toggleFavorite(id: string) {
        return this.request<any>(`/videos/${id}/favorite`, {
            method: 'PATCH',
        });
    }

    async deleteVideo(id: string) {
        return this.request<any>(`/videos/${id}`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiService();
export default api;
