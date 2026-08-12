import './ChatBubble.css';

interface ChatBubbleProps {
    role: 'user' | 'assistant' | 'model';
    message: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
}

function ChatBubble({ role, message, attachmentUrl, attachmentName, attachmentType }: ChatBubbleProps) {
    const isUser = role === 'user';
    const isImage = attachmentType?.startsWith('image/') || (attachmentUrl && /\.(png|jpe?g|gif|webp|svg)$/i.test(attachmentUrl));

    return (
        <div className={`chat-bubble-wrapper ${isUser ? 'user' : 'assistant'}`}>
            <div className="chat-bubble">
                {attachmentUrl && (
                    <div className="chat-attachment-container">
                        {isImage ? (
                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-image-link">
                                <img src={attachmentUrl} alt={attachmentName || 'Attachment'} className="chat-attachment-image" />
                            </a>
                        ) : (
                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="chat-attachment-file-link">
                                <span className="file-icon">📄</span>
                                <span className="file-name">{attachmentName || 'Download File'}</span>
                            </a>
                        )}
                    </div>
                )}
                {message && <div className="chat-message-text">{message}</div>}
            </div>
        </div>
    );
}

export default ChatBubble;
