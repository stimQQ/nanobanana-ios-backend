export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'premium';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type GenerationType = 'text-to-image' | 'image-to-image';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TransactionType = 'subscription' | 'purchase' | 'usage' | 'refund' | 'initial';
export type Language = 'en' | 'cn' | 'jp' | 'kr' | 'de' | 'fr';

export interface User {
  id: string;
  apple_id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  credits: number;
  free_attempts: number;
  subscription_tier: SubscriptionTier;
  subscription_expires_at?: Date;
  language_code: Language;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  apple_transaction_id?: string;
  tier: SubscriptionTier;
  price: number;
  credits_per_month: number;
  images_per_month: number;
  status: PaymentStatus;
  purchased_at: Date;
  expires_at: Date;
  auto_renew: boolean;
  created_at: Date;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  price: number;
  credits: number;
  images: number;
  name: string;
  description: string;
  apple_product_id: string;
}

export interface ImageGeneration {
  id: string;
  user_id: string;
  prompt: string;
  input_images?: string[];
  output_image_url?: string;
  generation_type: GenerationType;
  credits_used: number;
  status: GenerationStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  related_id?: string;
  balance_after: number;
  created_at: Date;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  apple_transaction_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  receipt_data?: string;
  created_at: Date;
}

export interface UploadedImage {
  id: string;
  user_id: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  public_url?: string;
  created_at: Date;
}

// API Request/Response Types
export interface AuthRequest {
  apple_id_token: string;
  user_info?: {
    email?: string;
    display_name?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  input_images?: string[];
  generation_type: GenerationType;
}

export interface GenerateImageResponse {
  success: boolean;
  generation_id?: string;
  image_url?: string;
  credits_used?: number;
  remaining_credits?: number;
  error?: string;
}

export interface SubscriptionRequest {
  tier: SubscriptionTier;
  receipt_data: string;
  transaction_id: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  credits_added?: number;
  error?: string;
}

export interface UploadImageRequest {
  file: File;
  purpose?: string;
}

export interface UploadImageResponse {
  success: boolean;
  image_url?: string;
  image_id?: string;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}