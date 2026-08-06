import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

export class MessageRepository {
    constructor(private supabase: SupabaseClient) {}

    async findByConversationId(conversationId: number | string) {
        const { data, error } = await this.supabase
            .from('Message')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Failed to fetch messages:', error);
            throw new AppError('Failed to fetch messages', 500);
        }

        return data || [];
    }

    async create(conversationId: number | string, role: 'user' | 'assistant', content: string) {
        const { data, error } = await this.supabase
            .from('Message')
            .insert([{
                conversation_id: conversationId,
                role,
                content,
                timestamp: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Failed to insert message:', error);
            throw new AppError('Failed to save message', 500);
        }

        return data;
    }

    async deleteByConversationIds(conversationIds: (number | string)[]) {
        const { error } = await this.supabase
            .from('Message')
            .delete()
            .in('conversation_id', conversationIds);

        if (error) {
            throw error;
        }
    }
}
