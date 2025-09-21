import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  ImageGeneration,
  GenerateImageRequest,
  GenerateImageResponse,
  SubscriptionRequest,
  SubscriptionResponse,
  CreditTransaction,
  Subscription,
} from '@/lib/types/database';

interface ApiError {
  success: false;
  error: string;
  code?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: typeof window !== 'undefined' ? '' : 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async login(appleIdToken: string): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/api/auth/apple', {
      apple_id_token: appleIdToken,
    });
    const { user, token } = response.data;
    this.setToken(token);
    return { user, token };
  }

  async loginWithGoogle(credential: string, userInfo: { name: string; email: string; picture?: string }): Promise<{ user: User; token: string; isNewUser?: boolean }> {
    const response = await this.client.post('/api/auth/google', {
      credential,
      ...userInfo,
    });
    const { user, token, isNewUser } = response.data;
    this.setToken(token);
    return { user, token, isNewUser };
  }

  async loginDev(email?: string, name?: string): Promise<{ user: User; token: string }> {
    const response = await this.client.post('/api/auth/dev', {
      email: email || 'test@example.com',
      name: name || 'Test User',
    });
    const { user, token } = response.data;
    this.setToken(token);
    return { user, token };
  }

  async logout() {
    this.clearToken();
  }

  // User endpoints
  async getProfile(): Promise<User> {
    const response = await this.client.get('/api/user/profile');
    return response.data.user;
  }

  async updateProfile(data: Partial<Pick<User, 'display_name' | 'language_code'>>): Promise<User> {
    const response = await this.client.put('/api/user/profile', data);
    return response.data.user;
  }

  async getCredits(): Promise<{ credits: number; free_attempts: number }> {
    const response = await this.client.get('/api/user/credits');
    return response.data;
  }

  async getCreditHistory(limit = 20, offset = 0): Promise<{
    transactions: CreditTransaction[];
    total: number;
  }> {
    const response = await this.client.get('/api/user/credits/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  // Image generation endpoints
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const response = await this.client.post('/api/generate/image', request);
    return response.data;
  }

  async getGenerations(params?: {
    limit?: number;
    offset?: number;
    status?: 'completed' | 'processing' | 'failed';
  }): Promise<{
    generations: ImageGeneration[];
    total: number;
  }> {
    const response = await this.client.get('/api/user/generations', { params });
    return response.data;
  }

  async deleteGeneration(id: string): Promise<void> {
    await this.client.delete('/api/user/generations', {
      params: { id },
    });
  }

  async uploadImage(file: File): Promise<{ image_url: string; image_id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Subscription endpoints
  async getSubscriptionStatus(): Promise<{
    subscription: Subscription | null;
    available_plans: any[];
  }> {
    const response = await this.client.get('/api/subscription/status');
    return response.data;
  }

  async purchaseSubscription(data: SubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await this.client.post('/api/subscription/purchase', data);
    return response.data;
  }

  // Chat message endpoints
  async getChatMessages(params?: {
    session_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    messages: any[];
    session_id: string;
    total: number;
  }> {
    const response = await this.client.get('/api/chat/messages', { params });
    return response.data;
  }

  async saveChatMessage(message: {
    message_type: 'user' | 'assistant' | 'system';
    content?: string;
    prompt?: string;
    image_url?: string;
    input_images?: string[];
    generation_type?: 'text-to-image' | 'image-to-image';
    generation_id?: string;
    credits_used?: number;
    error_message?: string;
    metadata?: any;
    session_id?: string;
  }): Promise<{
    message: any;
    session_id: string;
  }> {
    const response = await this.client.post('/api/chat/messages', message);
    return response.data;
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    await this.client.delete('/api/chat/messages', {
      params: { session_id: sessionId },
    });
  }

  async getChatSessions(): Promise<{
    sessions: any[];
    total: number;
  }> {
    const response = await this.client.get('/api/chat/sessions');
    return response.data;
  }

  async createChatSession(): Promise<{
    session_id: string;
    message: any;
  }> {
    const response = await this.client.post('/api/chat/sessions');
    return response.data;
  }

  // Health check
  async checkHealth(): Promise<{ status: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }

  async checkStatus(): Promise<{
    api: boolean;
    database: boolean;
    storage: boolean;
  }> {
    const response = await this.client.get('/api/status');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiError };