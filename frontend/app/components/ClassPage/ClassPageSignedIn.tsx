import { useState, useEffect } from 'react';
import type { ClassData, ClassMember } from "../../routes/class.$classId";
import { supabase } from '../../lib/SupabaseClient';
import { useNavigate } from 'react-router';
import UserBadge from '../../components/UserBadge/UserBadge';
import ConversationCard from './ConversationCard';
import AddStudentForm from './AddStudentForm';
import './ClassPage.css'

interface Conversation {
    conversation_id: number;
    student_id: string;
    class_id: number;
    started_at: string;
}

function ClassPageSignedIn({ clsData, userName, isSupervisor, currUserId, onRefresh }: { clsData: ClassData | null, userName: string, isSupervisor: boolean, currUserId?: string, onRefresh?: () => void }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [supervisors, setSupervisors] = useState<ClassMember[]>([]);
    const [students, setStudents] = useState<ClassMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<ClassMember | null>(null);
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
                setConversations(data);
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
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/remove-student`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ class_id: clsData?.class_id, student_id: student.user_id })
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

    if (!clsData) {
        return null;
    }

    return(
        <div className='class-page'>
            <UserBadge />
            <div className='class-page-header'>
                <h1>{clsData.name}</h1>
                <h3>Welcome to your course, {userName}{isSupervisor && " (Supervisor)"}</h3>
                <button className="back-btn" onClick={() => navigate('/user-dashboard')}>← Back to Dashboard</button>
            </div>
            
            <div className='class-page-layout'>
                <div className='conversations-container'>
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
                    
                    {conversations.map(cnv => (
                        <ConversationCard key={cnv.conversation_id} title={new Date(cnv.started_at).toLocaleString()}/>
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
                                return (
                                    <div 
                                        key={member.user_id} 
                                        className={`member-card supervisor-card ${isSupervisor ? 'clickable' : ''} ${isSelected ? 'active-card' : ''}`}
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
                                    </div>
                                );
                            })}
                            {supervisors.length === 0 && <p className='no-members-msg'>No supervisors assigned.</p>}
                        </div>
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
                            <AddStudentForm classId={clsData.class_id} onSuccess={onRefresh} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClassPageSignedIn;
