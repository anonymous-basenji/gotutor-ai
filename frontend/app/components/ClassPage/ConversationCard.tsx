import { Link } from 'react-router';
import './ConversationCard.css';

function ConversationCard({ title, conversationId }: { title: string, conversationId: number | string }) {
    return(
        <Link to={`/conversation/${conversationId}`} className='conversation-card-link'>
            <div className='conversation-card'>
                <h2>{title}</h2>
            </div>
        </Link>
    )
}

export default ConversationCard;
