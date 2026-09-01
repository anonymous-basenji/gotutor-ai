import { Link } from 'react-router';
import './ConversationCard.css';

interface ConversationCardProps {
    title: string;
    conversationId: number | string;
    canDelete?: boolean;
    onDelete?: (e: React.MouseEvent) => void;
}

function ConversationCard({ title, conversationId, canDelete, onDelete }: ConversationCardProps) {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(e);
        }
    };

    return (
        <Link to={`/conversation/${conversationId}`} className='conversation-card-link'>
            <div className='conversation-card'>
                <h2>{title}</h2>
                {canDelete && (
                    <button 
                        className='remove-student-btn' 
                        onClick={handleDeleteClick}
                        title='Delete conversation'
                        aria-label='Delete conversation'
                    >
                        ✕
                    </button>
                )}
            </div>
        </Link>
    );
}

export default ConversationCard;
