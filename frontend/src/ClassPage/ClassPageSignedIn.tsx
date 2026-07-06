import { useState, useEffect } from 'react';
import type { ClassData } from "./ClassPage";
import { supabase } from '../SupabaseClient';
import ConversationCard from './ConversationCard';
import './ClassPage.css'

interface Conversation {
    conversation_id: number,
    student_id: string,
    class_id: number,
    started_at: string
}

function ClassPageSignedIn({ clsData, userName }: { clsData: ClassData | null, userName: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useEffect(() => {
        if (!clsData) return;

        const fetchConversations = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/conversations?class_id=${clsData.class_id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const data: Conversation[] = await response.json();
                    setConversations(data);
                } else {
                    console.error('Failed to fetch conversations:', response.status);
                }
            } catch (e) {
                console.error('Error fetching conversations:', e);
            }
        };

        fetchConversations();
    }, [clsData])

    if (!clsData) {
        return null;
    }

    return(
        <div className='class-page'>
            <h1>{clsData.name}</h1>
            <h3>Welcome to your course, {userName}:</h3>
            <div className='conversations-container'>
                <h2>Your conversations: </h2>
                {conversations.map(cnv => (
                    <ConversationCard key={cnv.conversation_id} title={new Date(cnv.started_at).toLocaleString()}/>
                ))}
            </div>
        </div>
    )
};

export default ClassPageSignedIn;