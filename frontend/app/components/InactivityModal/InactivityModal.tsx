import './InactivityModal.css';

interface InactivityModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStaySignedIn: () => void;
  onSignOut: () => void;
}

export function InactivityModal({
  isOpen,
  secondsRemaining,
  onStaySignedIn,
  onSignOut,
}: InactivityModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="inactivity-modal-overlay">
      <div className="inactivity-modal-card">
        <div className="inactivity-modal-icon">⏰</div>
        <h2>Are you still there?</h2>
        <p>You have been inactive for a while. For your security, you will be automatically signed out in:</p>
        
        <div className="inactivity-timer-display">
          {formattedTime}
        </div>

        <div className="inactivity-modal-actions">
          <button className="inactivity-btn-primary" onClick={onStaySignedIn}>
            Stay Signed In
          </button>
          <button className="inactivity-btn-secondary" onClick={onSignOut}>
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default InactivityModal;
