import './ConversationCard.css';

function ConversationCard({ title }: { title: string }) {
    return(
        <div className='conversation-card'>
            <h2>{title}</h2>
        </div>
    )
};

export default ConversationCard;