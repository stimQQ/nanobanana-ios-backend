import { supabaseAdmin } from '@/lib/supabase/client';
import { TransactionType } from '@/lib/types/database';
import { CREDITS_PER_GENERATION } from '@/lib/config/subscriptions';

export async function checkUserCredits(userId: string, requiredCredits: number): Promise<{
  hasCredits: boolean;
  currentCredits: number;
  freeAttempts: number;
}> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('credits, free_attempts')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { hasCredits: false, currentCredits: 0, freeAttempts: 0 };
  }

  const hasCredits = user.credits >= requiredCredits || user.free_attempts > 0;

  return {
    hasCredits,
    currentCredits: user.credits,
    freeAttempts: user.free_attempts,
  };
}

export async function deductCredits(
  userId: string,
  amount: number,
  transactionType: TransactionType,
  description?: string,
  relatedId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current user credits
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits, free_attempts')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, newBalance: 0, error: 'User not found' };
    }

    let newCredits = user.credits;
    let newFreeAttempts = user.free_attempts;
    let creditsDeducted = amount;

    // Check if user has free attempts
    if (user.free_attempts > 0) {
      newFreeAttempts = Math.max(0, user.free_attempts - 1);
      creditsDeducted = 0; // No credits deducted when using free attempts
    } else if (user.credits >= amount) {
      newCredits = user.credits - amount;
    } else {
      return {
        success: false,
        newBalance: user.credits,
        error: 'Insufficient credits',
      };
    }

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        credits: newCredits,
        free_attempts: newFreeAttempts,
      })
      .eq('id', userId);

    if (updateError) {
      return { success: false, newBalance: user.credits, error: 'Failed to update credits' };
    }

    // Record transaction (only if credits were actually deducted)
    if (creditsDeducted > 0) {
      await supabaseAdmin.from('credit_transactions').insert({
        user_id: userId,
        amount: -creditsDeducted,
        transaction_type: transactionType,
        description,
        related_id: relatedId,
        balance_after: newCredits,
      });
    }

    return { success: true, newBalance: newCredits };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, newBalance: 0, error: 'Failed to deduct credits' };
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  transactionType: TransactionType,
  description?: string,
  relatedId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current user credits
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, newBalance: 0, error: 'User not found' };
    }

    const newCredits = user.credits + amount;

    // Update user credits
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (updateError) {
      return { success: false, newBalance: user.credits, error: 'Failed to update credits' };
    }

    // Record transaction
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      transaction_type: transactionType,
      description,
      related_id: relatedId,
      balance_after: newCredits,
    });

    return { success: true, newBalance: newCredits };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, newBalance: 0, error: 'Failed to add credits' };
  }
}

export function getCreditsForGenerationType(type: 'text-to-image' | 'image-to-image'): number {
  return CREDITS_PER_GENERATION[type];
}