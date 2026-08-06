import './ChatBubble.css';

interface ChatBubbleProps {
    role: 'user' | 'assistant' | 'model';
    message: string;
}

function ChatBubble({ role, message }: ChatBubbleProps) {
    const isUser = role === 'user';

    return (
        <div className={`chat-bubble-wrapper ${isUser ? 'user' : 'assistant'}`}>
            <div className="chat-bubble">
                {message}
            </div>
        </div>
    );
}

export default ChatBubble;
