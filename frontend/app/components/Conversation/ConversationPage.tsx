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
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
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
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const streamingMessageRef = useRef('');
    const chatHistoryRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const navigate = useNavigate();

    const handleStopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoadingStatus(false);
    };

    const fetchConversationDetail = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const currentUserId = session?.user?.id;

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data) {
                    if (data.title) {
                        setConversationTitle(data.title);
                        document.title = `${data.title} - GoTutor.ai`;
                    }
                    if (data.student_id && currentUserId) {
                        setIsReadOnly(data.student_id !== currentUserId);
                    }
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
                const mapped: MessageItem[] = await Promise.all(data.map(async (msg: any) => {
                    let url = msg.attachment_url;
                    if (url && !url.startsWith('http')) {
                        const { data: signedData } = await supabase.storage
                            .from('chat-attachments')
                            .createSignedUrl(url, 604800);
                        if (signedData?.signedUrl) {
                            url = signedData.signedUrl;
                        }
                    }
                    return {
                        id: msg.message_id || msg.id || Math.random(),
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content,
                        attachment_url: url,
                        attachment_name: msg.attachment_name,
                        attachment_type: msg.attachment_type,
                    };
                }));
                updateChatHistory(mapped);
                setTimeout(() => {
                    if (chatHistoryRef.current) {
                        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
                    }
                }, 50);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`File "${file.name}" exceeds the 50MB size limit.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setError('');
            setSelectedFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading || isReadOnly || (!inputValue.trim() && !selectedFile)) return;

        const userText = inputValue.trim();
        setError('');
        setLoadingStatus(true);
        streamingMessageRef.current = '';

        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;
        let attachmentType: string | undefined;

        if (selectedFile) {
            attachmentName = selectedFile.name;
            attachmentType = selectedFile.type;
            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `attachments/${conversationId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadErr } = await supabase.storage.from('chat-attachments').upload(filePath, selectedFile);
            if (uploadErr) {
                console.error('Failed to upload attachment:', uploadErr);
                setError('Failed to upload file attachment.');
                setLoadingStatus(false);
                return;
            }

            const { data: signedUrlData, error: signedUrlErr } = await supabase.storage
                .from('chat-attachments')
                .createSignedUrl(filePath, 604800);

            if (signedUrlData?.signedUrl) {
                attachmentUrl = signedUrlData.signedUrl;
            } else {
                console.warn('createSignedUrl failed, falling back to getPublicUrl:', signedUrlErr);
                const { data: publicUrlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
                attachmentUrl = publicUrlData?.publicUrl;
            }
        }

        updateInputValue('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        const userMessage: MessageItem = {
            id: Date.now(),
            role: 'user',
            content: userText,
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            attachment_type: attachmentType,
        };

        const assistantPlaceholderId = Date.now() + 1;
        const initialHistory = [...chatHistory, userMessage];
        
        updateChatHistory([
            ...initialHistory,
            { id: assistantPlaceholderId, role: 'assistant', content: 'Thinking...' }
        ]);

        setTimeout(() => {
            if (chatHistoryRef.current) {
                chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
            }
        }, 50);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content: userText,
                    attachment_url: attachmentUrl,
                    attachment_name: attachmentName,
                    attachment_type: attachmentType,
                }),
                signal: controller.signal,
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
            const isAborted = e.name === 'AbortError' || controller.signal.aborted;
            if (isAborted) {
                console.log('[Streaming Aborted by User]');
                if (!streamingMessageRef.current) {
                    updateChatHistory(prev => prev.filter(m => m.id !== assistantPlaceholderId));
                }
            } else {
                console.error('[Streaming Failure Dump] Detailed error object:', e);
                setError(e.message || 'An error occurred and your response could not be completed.');
                updateChatHistory(prev => prev.filter(m => m.id !== assistantPlaceholderId));
            }
        } finally {
            abortControllerRef.current = null;
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
                                attachmentUrl={chatBubble.attachment_url}
                                attachmentName={chatBubble.attachment_name}
                                attachmentType={chatBubble.attachment_type}
                            />
                        ))
                    )}
                </div>

                {error && <div className='error-banner'>{error}</div>}

                {isReadOnly && (
                    <div className='read-only-banner'>
                        <span>🔒 Read-Only Mode: You are viewing a student's conversation. Sending messages is disabled.</span>
                    </div>
                )}

                {selectedFile && (
                    <div className="file-preview-badge">
                        <img src="/attachment-svgrepo-com.svg" alt="Attachment" className="attachment-icon-small" />
                        <span>{selectedFile.name}</span>
                        <button type="button" className="remove-file-btn" onClick={() => setSelectedFile(null)}>✕</button>
                    </div>
                )}

                <form className='submit-form' onSubmit={handleSubmit}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelect} 
                    />
                    <button 
                        type="button" 
                        className="attachment-btn" 
                        title="Attach file" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading || isReadOnly}
                    >
                        <img src="/attachment-svgrepo-com.svg" alt="Attach" className="attachment-icon" />
                    </button>
                    <input 
                        name='chat-input' 
                        className='chat-input' 
                        type='text' 
                        placeholder={isReadOnly ? "Read-only mode: Only the conversation owner can send messages" : "Chat with GoTutor AI..."} 
                        value={inputValue} 
                        onChange={(e) => updateInputValue(e.target.value)}
                        disabled={isLoading || isReadOnly}
                    />
                    {isLoading ? (
                        <button 
                            className='submit-btn stop-btn' 
                            type='button' 
                            onClick={handleStopStreaming}
                            title="Stop response"
                        >
                            ⏹ Stop
                        </button>
                    ) : (
                        <button 
                            className='submit-btn' 
                            type='submit' 
                            disabled={isReadOnly || (!inputValue.trim() && !selectedFile)}
                        >
                            Send
                        </button>
                    )}
                </form>

                <div className='disclaimer'>
                    <p><strong>Chats are not private. Your supervisor can read your chat messages. Do not enter private/confidential information.</strong></p>
                </div>
            </div>
        </div>
    );
}

export default ConversationPage;
