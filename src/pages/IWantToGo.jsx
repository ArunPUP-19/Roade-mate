import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import { CheckCircle2, Loader2 } from 'lucide-react';
import './Forms.css';

const IWantToGo = () => {
  const navigate = useNavigate();
  const [startingLocation, setStartingLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startingLocation || !destination || !date) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders() 
        },
        body: JSON.stringify({
          startingLocation,
          destination,
          date,
          preferredTime
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Your ride request has been published!');
        setTimeout(() => {
          navigate('/find-trip');
        }, 1500);
      } else {
        alert(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Could not connect to the backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container form-page animate-fade-in">
      <div className="form-container glass-panel">
        <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Request a Ride</h2>
        <p className="text-center text-muted mb-8">
          Can't find a trip? Let people know where you need to go.
        </p>

        {successMessage && (
          <div className="success-banner mb-6">
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
        )}
        
        <form className="trip-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Starting Location *</label>
            <LocationInput 
              placeholder="e.g., Coimbatore" 
              value={startingLocation}
              onChange={setStartingLocation}
            />
          </div>
          
          <div className="form-group">
            <label>Destination *</label>
            <LocationInput 
              placeholder="e.g., Tiruppur" 
              value={destination}
              onChange={setDestination}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input 
                type="date" 
                className="glass-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Preferred Time</label>
              <input 
                type="time" 
                className="glass-input" 
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="glass-button btn-secondary w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Submitting Request...
              </>
            ) : (
              'Publish Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IWantToGo;
