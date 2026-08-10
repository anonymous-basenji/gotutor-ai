import { useState, useEffect } from 'react';
import type { ClassData, ClassMember } from "../../routes/class.$classId";
import { supabase } from '../../lib/SupabaseClient';
import { useNavigate } from 'react-router';
import UserBadge from '../../components/UserBadge/UserBadge';
import ConversationCard from './ConversationCard';
import AddStudentForm from './AddStudentForm';
import './ClassPage.css'

interface Conversation {
    conversation_id: number | string;
    title?: string;
    student_id: string;
    class_id: number | string;
    started_at: string;
}

function ClassPageSignedIn({ clsData, userName, isSupervisor, currUserId, onRefresh }: { clsData: ClassData | null, userName: string, isSupervisor: boolean, currUserId?: string, onRefresh?: () => void }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [supervisors, setSupervisors] = useState<ClassMember[]>([]);
    const [students, setStudents] = useState<ClassMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<ClassMember | null>(null);
    const [isEditingClassName, setIsEditingClassName] = useState<boolean>(false);
    const [newClassName, setNewClassName] = useState<string>('');
    const navigate = useNavigate();

    const fetchConversations = async (studentId?: string) => {
        if (!clsData) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const url = studentId 
            ? `${import.meta.env.VITE_BACKEND_URL}/conversations?class_id=${clsData.class_id}&student_id=${studentId}`
            : `${import.meta.env.VITE_BACKEND_URL}/conversations?class_id=${clsData.class_id}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data: Conversation[] = await response.json();
                const sorted = [...data].sort((a, b) => {
                    const timeA = a.started_at ? new Date(a.started_at).getTime() : Number(a.conversation_id) || 0;
                    const timeB = b.started_at ? new Date(b.started_at).getTime() : Number(b.conversation_id) || 0;
                    return timeB - timeA;
                });
                setConversations(sorted);
            } else {
                console.error('Failed to fetch conversations:', response.status);
            }
        } catch (e) {
            console.error('Error fetching conversations:', e);
        }
    };

    useEffect(() => {
        if (!clsData) return;
        setSupervisors(clsData.supervisors);
        setStudents(clsData.students);

        if (!isSupervisor) {
            setSelectedMember(null);
            fetchConversations();
        } else {
            const selfMember = clsData.supervisors.find(s => s.user_id === currUserId);
            if (selfMember) {
                setSelectedMember(selfMember);
                fetchConversations(selfMember.user_id);
            } else {
                setSelectedMember(null);
                setConversations([]);
            }
        }
    }, [clsData, isSupervisor, currUserId]);

    const handleMemberClick = (member: ClassMember) => {
        if (!isSupervisor) return;
        setSelectedMember(member);
        fetchConversations(member.user_id);
    };

    const handleRemoveClick = async (e: React.MouseEvent, student: ClassMember) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to remove ${student.name} from this class?`)) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/remove-user`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ class_id: clsData?.class_id, user_id: student.user_id, role: 'student' })
                });

                if (response.ok) {
                    if (selectedMember?.user_id === student.user_id) {
                        setSelectedMember(null);
                        setConversations([]);
                    }
                    if (onRefresh) onRefresh();
                } else {
                    console.error('Failed to remove student');
                }
            } catch (err) {
                console.error('Error removing student:', err);
            }
        }
    };

    const handleLeaveClass = async () => {
        if (!currUserId || !clsData) return;
        if (window.confirm("Are you sure you want to leave this class?")) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/remove-user`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ class_id: clsData.class_id, user_id: currUserId, role: 'supervisor' })
                });

                if (response.ok) {
                    navigate('/user-dashboard');
                } else {
                    const errData = await response.json().catch(() => null);
                    alert(errData?.error || 'Failed to leave class');
                }
            } catch (err) {
                console.error('Error leaving class:', err);
            }
        }
    };

    const handleRenameClass = async(newClass: string) => {
        if(!currUserId || !clsData || !newClass.trim()) return;
        if(window.confirm(`Are you sure you want to rename this class to "${newClass.trim()}"?`)) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/rename-class`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ class_id: clsData.class_id, new_name: newClass.trim() })
                });

                if(response.ok) {
                    window.alert(`Class successfully renamed to "${newClass.trim()}".`);
                    setIsEditingClassName(false);
                    if (onRefresh) onRefresh();
                } else {
                    const errData = await response.json().catch(() => null);
                    window.alert(errData?.error || 'An error occurred trying to rename your class. Are you a supervisor?');
                }
            } catch(err) {
                console.error('Error renaming class:', err);
            }
        }
    };

    const handleCreateConvo = async () => {
        if (!clsData) return;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ class_id: clsData.class_id })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.conversation_id) {
                    navigate(`/conversation/${data.conversation_id}`);
                }
            } else {
                console.error('Failed to create conversation:', response.status);
            }
        } catch (e) {
            console.error('Error creating conversation:', e);
        }
    };

    if (!clsData) {
        return null;
    }

    return(
        <div className='class-page'>
            <UserBadge />
            <div className='class-page-header'>
                {!isEditingClassName ? (
                    <div className='class-title-container'>
                        <h1>{clsData.name}</h1>
                        {isSupervisor && (
                            <button 
                                className='edit-class-title-btn' 
                                type='button' 
                                aria-label='Edit class title'
                                onClick={() => {
                                    setNewClassName(clsData.name);
                                    setIsEditingClassName(true);
                                }}
                            >
                                <img src='/edit-pencil-01-svgrepo-com.svg' alt='Edit class title' />
                            </button>
                        )}
                    </div>
                ) : (
                    <form 
                        className='class-title-container-editing'
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleRenameClass(newClassName);
                        }}
                    >
                        <input 
                            type='text' 
                            className='new-class-name-input'
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder='Enter new class name...'
                            autoFocus
                            required
                        />
                        <button type='submit' className='rename-submit-btn' disabled={!newClassName.trim()}>
                            Enter
                        </button>
                        <button 
                            type='button' 
                            className='edit-class-title-btn' 
                            aria-label='Close edit mode'
                            onClick={() => setIsEditingClassName(false)}
                        >
                            <img src='/close-sm-svgrepo-com.svg' alt='Close edit mode' />
                        </button>
                    </form>
                )}
                <h3>Welcome to your course, {userName}{isSupervisor && " (Supervisor)"}</h3>
                <button className="class-page-back-btn" onClick={() => navigate('/user-dashboard')} aria-label="Back to Dashboard">
                    ←<span className="back-btn-text"> Back to Dashboard</span>
                </button>
            </div>
            
            <div className='class-page-layout'>
                <div className='conversations-container'>
                    <div className='conversations-container-header'>
                        {isSupervisor && !selectedMember ? (
                            <h2>Select a student or supervisor to view their conversations:</h2>
                        ) : (
                            <h2>
                                {isSupervisor && selectedMember 
                                    ? `Conversations for ${selectedMember.name}${selectedMember.user_id === currUserId ? " (You)" : ""}:` 
                                    : 'Your conversations:'
                                }
                            </h2>
                        )}

                        <button className='new-convo-button' onClick={() => handleCreateConvo()}>+ New</button>
                    </div>
                    
                    {conversations.map(cnv => (
                        <ConversationCard 
                            key={cnv.conversation_id} 
                            conversationId={cnv.conversation_id} 
                            title={cnv.title || "New Conversation"}
                        />
                    ))}
                    
                    {(!isSupervisor || selectedMember) && conversations.length === 0 && (
                        <p className='no-conversations-msg'>No conversations started yet.</p>
                    )}
                </div>
                
                <div className='members-container'>
                    <div className='members-section'>
                        <h2>Supervisors</h2>
                        <div className='members-list'>
                            {supervisors.map(member => {
                                const isSelected = selectedMember?.user_id === member.user_id;
                                const isSelf = member.user_id === currUserId;
                                const canClick = isSupervisor && isSelf;
                                return (
                                    <div 
                                        key={member.user_id} 
                                        className={`member-card supervisor-card ${canClick ? 'clickable' : ''} ${isSelected ? 'active-card' : ''}`}
                                        onClick={() => canClick && handleMemberClick(member)}
                                    >
                                        <div className='member-avatar'>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className='member-details'>
                                            <p className='member-name'>
                                                {member.name}{isSelf && " (You)"}
                                            </p>
                                            <p className='member-email'>{member.email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {supervisors.length === 0 && <p className='no-members-msg'>No supervisors assigned.</p>}
                        </div>
                        {isSupervisor && (
                            <>
                                <AddStudentForm classId={clsData.class_id} role="supervisor" onSuccess={onRefresh} />
                                <button className="leave-class-btn" onClick={handleLeaveClass}>
                                    Leave this class
                                </button>
                            </>
                        )}
                    </div>

                    <div className='members-section'>
                        <h2>Students</h2>
                        <div className='members-list'>
                            {students.map(member => {
                                const isSelected = selectedMember?.user_id === member.user_id;
                                return (
                                    <div 
                                        key={member.user_id} 
                                        className={`member-card student-card ${isSupervisor ? 'clickable' : ''} ${isSelected ? 'active-card' : ''}`}
                                        onClick={() => handleMemberClick(member)}
                                    >
                                        <div className='member-avatar'>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className='member-details'>
                                            <p className='member-name'>
                                                {member.name}{member.user_id === currUserId && " (You)"}
                                            </p>
                                            <p className='member-email'>{member.email}</p>
                                        </div>
                                        {isSupervisor && (
                                            <button 
                                                className='remove-student-btn' 
                                                onClick={(e) => handleRemoveClick(e, member)}
                                                title='Remove student'
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {students.length === 0 && <p className='no-members-msg'>No students in this class.</p>}
                        </div>
                        {isSupervisor && (
                            <AddStudentForm classId={clsData.class_id} role="student" onSuccess={onRefresh} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClassPageSignedIn;
