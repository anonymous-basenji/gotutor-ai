import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/SupabaseClient';
import UserBadge from '../UserBadge/UserBadge';
import ChatBubble from './ChatBubble';
import './ConversationPage.css';

interface MessageItem {
    id: string | number;
    role: 'user' | 'assistant';
    content: string;
}

interface ConversationPageProps {
    conversationId: string;
}

function ConversationPage({ conversationId }: ConversationPageProps) {
    const [inputValue, updateInputValue] = useState('');
    const [chatHistory, updateChatHistory] = useState<MessageItem[]>([]);
    const [isLoading, setLoadingStatus] = useState(false);
    const [error, setError] = useState('');
    const [conversationTitle, setConversationTitle] = useState('Conversation');

    const streamingMessageRef = useRef('');
    const chatHistoryRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    const fetchConversationDetail = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.title) {
                    setConversationTitle(data.title);
                    document.title = `${data.title} - GoTutor.ai`;
                }
            }
        } catch (e) {
            console.error('Error fetching conversation detail:', e);
        }
    };

    const fetchMessages = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                const mapped: MessageItem[] = data.map((msg: any) => ({
                    id: msg.message_id || msg.id || Math.random(),
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                }));
                updateChatHistory(mapped);
            } else {
                console.error('Failed to fetch messages:', res.status);
            }
        } catch (e) {
            console.error('Error fetching conversation messages:', e);
        }
    };

    useEffect(() => {
        fetchConversationDetail();
        fetchMessages();
    }, [conversationId]);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading || !inputValue.trim()) return;

        const userText = inputValue.trim();
        updateInputValue('');
        setError('');
        setLoadingStatus(true);
        streamingMessageRef.current = '';

        const userMessage: MessageItem = {
            id: Date.now(),
            role: 'user',
            content: userText,
        };

        const assistantPlaceholderId = Date.now() + 1;
        const initialHistory = [...chatHistory, userMessage];
        
        updateChatHistory([
            ...initialHistory,
            { id: assistantPlaceholderId, role: 'assistant', content: '...' }
        ]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: userText })
            });

            if (!response.ok || !response.body) {
                const errJson = await response.json().catch(() => ({}));
                const fullErrorMsg = errJson.error || `An error occurred and your response could not be completed (Code: ${response.status})`;
                console.error('[Streaming Error Dump] Backend HTTP Status:', response.status, 'Body:', errJson);
                throw new Error(fullErrorMsg);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    const jsonStr = trimmed.replace(/^data:\s*/, '');
                    if (jsonStr === '[DONE]') break;

                    try {
                        const json = JSON.parse(jsonStr);
                        if (json.title) {
                            setConversationTitle(json.title);
                            document.title = `${json.title} - GoTutor.ai`;
                        }
                        if (json.text) {
                            const chunkText = json.text;
                            streamingMessageRef.current += chunkText;

                            updateChatHistory(prev => {
                                const newHistory = [...prev];
                                const lastIdx = newHistory.length - 1;
                                if (lastIdx >= 0 && newHistory[lastIdx].id === assistantPlaceholderId) {
                                    newHistory[lastIdx] = {
                                        ...newHistory[lastIdx],
                                        content: streamingMessageRef.current,
                                    };
                                }
                                return newHistory;
                            });
                        }
                    } catch (err) {
                        // ignore JSON parse error
                    }
                }
            }
        } catch (e: any) {
            console.error('[Streaming Failure Dump] Detailed error object:', e);
            setError(e.message || 'An error occurred and your response could not be completed.');
            updateChatHistory(prev => prev.filter(m => m.id !== assistantPlaceholderId));
        } finally {
            setLoadingStatus(false);
        }
    };

    return (
        <div className='conversation-page'>
            <div className='conversation-top-bar'>
                <div className='top-bar-left'>
                    <button className='chat-back-btn' onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <span className='conversation-title'>{conversationTitle}</span>
                </div>
                <UserBadge />
            </div>

            <div className='conversation-main-content'>
                <div className='chat-history' ref={chatHistoryRef}>
                    {chatHistory.length === 0 ? (
                        <div className='no-messages-notice'>
                            <p>No messages yet. Ask a question to get started!</p>
                        </div>
                    ) : (
                        chatHistory.map(chatBubble => (
                            <ChatBubble 
                                key={chatBubble.id} 
                                role={chatBubble.role} 
                                message={chatBubble.content}
                            />
                        ))
                    )}
                </div>

                {error && <div className='error-banner'>{error}</div>}

                <form className='submit-form' onSubmit={handleSubmit}>
                    <input 
                        name='chat-input' 
                        className='chat-input' 
                        type='text' 
                        placeholder='Chat with GoTutor AI...' 
                        value={inputValue} 
                        onChange={(e) => updateInputValue(e.target.value)}
                        disabled={isLoading}
                    />
                    <button className='submit-btn' type='submit' disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? '...' : 'Send'}
                    </button>
                </form>

                <div className='disclaimer'>
                    <p><strong>Chats are not private. Do not enter private/confidential information.</strong></p>
                </div>
            </div>
        </div>
    );
}

export default ConversationPage;
