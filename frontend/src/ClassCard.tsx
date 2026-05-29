import './ClassCard.css';

function ClassCard({ classTitle, supervisorName }: { classTitle: string, supervisorName: string }) {
    return(
        <div className='class-card'>
            <h2>{classTitle}</h2>
            <h3>{supervisorName}</h3>
        </div>
    )
};

export default ClassCard;