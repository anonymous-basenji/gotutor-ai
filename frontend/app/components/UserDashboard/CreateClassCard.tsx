import { useState } from 'react';
import './CreateClassCard.css';

interface CreateClassCardProps {
    onCreate: (className: string) => Promise<void> | void;
}

function CreateClassCard({ onCreate }: CreateClassCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!className.trim()) return;

        setLoading(true);
        try {
            await onCreate(className);
            setClassName('');
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to create class:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <div className='create-class-card placeholder' onClick={() => setIsEditing(true)}>
                <div className='plus-icon'>+</div>
                <h3>Create New Class</h3>
            </div>
        );
    }

    return (
        <div className='create-class-card active'>
            <form onSubmit={handleSubmit}>
                <h3>New Class Details</h3>
                <input
                    type='text'
                    className='class-input'
                    placeholder='Enter class name...'
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                />
                <div className='card-actions'>
                    <button type='button' className='cancel-btn' onClick={() => setIsEditing(false)} disabled={loading}>
                        Cancel
                    </button>
                    <button type='submit' className='submit-btn' disabled={loading || !className.trim()}>
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateClassCard;
