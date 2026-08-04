import { SupabaseClient } from '@supabase/supabase-js';

export class MessageRepository {
    constructor(private supabase: SupabaseClient) {}

    async deleteByConversationIds(conversationIds: number[]) {
        const { error } = await this.supabase
            .from('Message')
            .delete()
            .in('conversation_id', conversationIds);

        if (error) {
            throw error;
        }
    }
}
