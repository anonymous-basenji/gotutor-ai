import { Link } from 'react-router-dom';
import './ClassCard.css';

function ClassCard({ classId, classTitle, supervisorName }: { classId: string, classTitle: string, supervisorName: string }) {
    return(
        <Link to={`/class/${classId}`} className='class-card-link'>
            <div className='class-card'>
                <h2>{classTitle}</h2>
                <h3>{supervisorName}</h3>
            </div>
        </Link>
    )
};

export default ClassCard;