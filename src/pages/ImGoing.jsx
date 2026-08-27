import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import { CheckCircle2, Loader2 } from 'lucide-react';
import './Forms.css';

const ImGoing = () => {
  const navigate = useNavigate();
  const [startingLocation, setStartingLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(2);
  const [vehicleType, setVehicleType] = useState('4 wheeler');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [yourSplit, setYourSplit] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startingLocation || !destination || !date || !time) {
      alert('Please fill out all required fields (Starting location, Destination, Date, and Time).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/trips', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders() 
        },
        body: JSON.stringify({
          startingLocation,
          destination,
          date,
          time,
          seatsAvailable: parseInt(seatsAvailable),
          vehicleDetails: `${vehicleType} - ${vehicleName} (${vehicleNumber})`,
          totalCost: totalCost ? parseInt(totalCost) : null,
          yourSplit: yourSplit ? parseInt(yourSplit) : null,
          negotiable
        })
      });

      if (res.status === 401 || res.status === 403) {
        alert('Your session has expired. Please log in again.');
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccessMessage('Your trip has been published successfully!');
        setTimeout(() => {
          // Navigate to Find Trip search to see the published trip
          navigate('/find-trip');
        }, 1500);
      } else {
        alert(data.message || data.error || 'Failed to publish trip.');
      }
    } catch (err) {
      console.error('Error submitting trip:', err);
      alert('Could not connect to the backend server. Please make sure server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container form-page animate-fade-in">
      <div className="form-container glass-panel">
        <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Offer a Ride</h2>
        <p className="text-center text-muted mb-8">
          Already travelling? Offer your empty seats and share travel expenses.
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
              <label>Time *</label>
              <input 
                type="time" 
                className="glass-input" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Available Seats</label>
              <input 
                type="number" 
                min="1" 
                max="8" 
                value={seatsAvailable}
                onChange={(e) => setSeatsAvailable(e.target.value)}
                className="glass-input" 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <select 
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="glass-input"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <option value="2 wheeler" style={{ color: 'black' }}>2 Wheeler</option>
                <option value="4 wheeler" style={{ color: 'black' }}>4 Wheeler</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Name</label>
              <input 
                type="text" 
                placeholder="e.g., Honda City" 
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="glass-input" 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input 
                type="text" 
                placeholder="e.g., TN 38 AA 1234" 
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="glass-input" 
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Trip Total Cost</label>
              <input 
                type="number" 
                min="0"
                placeholder="e.g., 500" 
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="glass-input" 
              />
            </div>
            <div className="form-group">
              <label>Your Split</label>
              <input 
                type="number" 
                min="0"
                placeholder="e.g., 250" 
                value={yourSplit}
                onChange={(e) => setYourSplit(e.target.value)}
                className="glass-input" 
              />
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="checkbox" 
              id="negotiable"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="negotiable" style={{ marginBottom: 0 }}>Negotiable</label>
          </div>
          
          <button 
            type="submit" 
            className="glass-button btn-primary w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Publishing...
              </>
            ) : (
              'Publish Trip'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImGoing;
