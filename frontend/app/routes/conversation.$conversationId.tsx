import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { MetaFunction } from 'react-router';
import { UserContext } from '../lib/UserProvider';
import SignedOut from '../components/SignedOut';
import ConversationPage from '../components/Conversation/ConversationPage';

export const meta: MetaFunction = () => [
  { title: "Conversation — GoTutor.ai" },
  { name: "description", content: "Chat with GoTutor.ai assistant." },
];

export default function ConversationRoute() {
    const { conversationId } = useParams<{ conversationId: string }>();
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();
    const user = userCtx?.user;

    if (userCtx?.loading) {
        return <div className="loading-screen">Loading conversation...</div>;
    }

    if (!user) {
        return <SignedOut nav={navigate} />;
    }

    if (!conversationId) {
        return <div>Invalid conversation ID</div>;
    }

    return (
        <ConversationPage conversationId={conversationId} />
    );
}
