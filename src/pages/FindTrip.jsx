import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import LocationInput from '../components/LocationInput';
import TripCard from '../components/TripCard';
import './Forms.css';
import './FindTrip.css';

const FindTrip = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTrips = async (searchFrom = from, searchTo = to, searchDate = date) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const queryParams = new URLSearchParams();
      if (searchFrom) queryParams.append('from', searchFrom);
      if (searchTo) queryParams.append('to', searchTo);
      if (searchDate) queryParams.append('date', searchDate);

      const res = await fetch(`http://localhost:5000/api/trips?${queryParams.toString()}`);
      const data = await res.json();

      if (data.trips) {
        setTrips(data.trips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all available trips initially
  useEffect(() => {
    fetchTrips('', '', '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips(from, to, date);
  };


  return (
    <div className="container find-trip-page animate-fade-in">
      <div className="search-section glass-panel">
        <h2 className="text-2xl font-bold mb-4 text-center text-gradient">Find a Trip</h2>
        <p className="text-center text-muted mb-6">
          Search for existing trips that match your route.
        </p>
        
        <form className="trip-form" onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label>Starting Location</label>
              <LocationInput 
                placeholder="Where from?" 
                value={from}
                onChange={setFrom}
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <LocationInput 
                placeholder="Where to?" 
                value={to}
                onChange={setTo}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date (Optional)</label>
              <input 
                type="date" 
                className="glass-input" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group flex items-center justify-center pt-6">
              <button type="submit" className="glass-button btn-primary w-full">
                {isLoading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                Search Trips
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="results-section">
        <h3 className="text-xl font-bold mb-4">
          Available Trips {trips.length > 0 ? `(${trips.length})` : ''}
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-muted">Loading matching trips...</div>
        ) : trips.length > 0 ? (
          <div className="trips-grid">
            {trips.map(trip => (
              <TripCard 
                key={trip.id} 
                trip={trip}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel text-center py-8 text-muted">
            No matching trips found. Try publishing a ride request!
          </div>
        )}
      </div>
    </div>
  );
};

export default FindTrip;
