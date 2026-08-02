/**
 * Message Repository — data access for the "Message" table.
 *
 * Currently only used during class deletion (cascading delete of
 * messages → conversations → memberships → class).
 */
import { SupabaseClient } from '@supabase/supabase-js';

export class MessageRepository {
    constructor(private supabase: SupabaseClient) {}

    /** Delete all messages belonging to the given conversation IDs. */
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
