import { Link } from 'react-router';
import { supabase } from '../../lib/SupabaseClient';
import './ClassCard.css';

function ClassCard({ 
    classId, 
    classTitle, 
    supervisorName, 
    isSupervisor, 
    onDeleteRefresh 
}: { 
    classId: string, 
    classTitle: string, 
    supervisorName: string, 
    isSupervisor?: boolean, 
    onDeleteRefresh?: () => void 
}) {

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm(`Are you sure you want to delete the class "${classTitle}"? This will permanently delete all student conversations, messages, and class data.`)) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/delete-class`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ class_id: classId })
                });

                if (response.ok) {
                    if (onDeleteRefresh) onDeleteRefresh();
                } else {
                    const errData = await response.json();
                    console.error('Failed to delete class:', errData.error || response.status);
                    alert(errData.error || 'Failed to delete class');
                }
            } catch (err) {
                console.error('Error deleting class:', err);
                alert('An error occurred while deleting the class.');
            }
        }
    };

    return(
        <Link to={`/class/${classId}`} className='class-card-link'>
            <div className='class-card'>
                <h2>{classTitle}</h2>
                <h3>{supervisorName}</h3>
                {isSupervisor && (
                    <button 
                        className="delete-class-btn" 
                        onClick={handleDeleteClick} 
                        title="Delete class"
                    >
                        ×
                    </button>
                )}
            </div>
        </Link>
    )
}

export default ClassCard;
