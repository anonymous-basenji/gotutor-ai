import { useState } from 'react';
import ConversationCard from './ConversationCard';
import './ClassPage.css'

interface Conversation {
    conversationId: string,
    title: string
}

function ClassPageSignedIn({ cls, user, classId }: { cls: string, user: string | null, classId: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    return(
        <div className='class-page'>
            <h1>{cls}</h1>
            <h3>Welcome to your course, {user}:</h3>
            <div className='conversations-container'>
                <h2>Your conversations: </h2>
                {conversations.map(cnv => (
                    <ConversationCard key={cnv.conversationId} title={cnv.title}/>
                ))}
            </div>
        </div>
    )
};

export default ClassPageSignedIn;