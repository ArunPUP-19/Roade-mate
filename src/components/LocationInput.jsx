import { useState, useEffect, useRef } from 'react';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';
import './LocationInput.css';

const LocationInput = ({ placeholder, value, onChange, className }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from Backend Proxy, with direct OSM fallback
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      
      try {
        const res = await fetch(`http://localhost:5000/api/places/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.predictions && data.predictions.length > 0) {
          const formatted = data.predictions.map(prediction => ({
            place_id: prediction.place_id,
            display_name: prediction.description
          }));
          setSuggestions(formatted);
          return;
        }
      } catch (error) {
        console.warn("Backend unavailable, falling back to client-side OSM:", error);
      }

      // Direct fallback if backend fetch fails
      try {
        const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const osmData = await osmRes.json();
        const formatted = osmData.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name
        }));
        setSuggestions(formatted);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSelect = (placeName) => {
    setQuery(placeName);
    setShowDropdown(false);
    if (onChange) onChange(placeName);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = '';

        // Try backend first
        try {
          const res = await fetch(`http://localhost:5000/api/places/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            address = data.results[0].formatted_address;
          }
        } catch (error) {
          console.warn("Backend unavailable for reverse geocoding:", error);
        }

        // Direct fallback if backend didn't return address
        if (!address) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data && data.display_name) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county;
              const state = data.address.state;
              address = city && state ? `${city}, ${state}` : data.display_name;
            }
          } catch (err) {
            console.error("Client-side reverse geocoding failed:", err);
          }
        }

        if (address) {
          setQuery(address);
          if (onChange) onChange(address);
        } else {
          alert("Could not retrieve address for your location.");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Unable to retrieve your location. Please check browser permissions.");
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="location-input-wrapper" ref={wrapperRef}>
      <MapPin className="location-icon" size={18} />
      <input
        type="text"
        placeholder={placeholder}
        className={`glass-input location-input ${className || ''}`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />
      
      <button 
        type="button" 
        className="locate-btn" 
        onClick={getCurrentLocation}
        title="Use my current location"
      >
        {isLoading ? <Loader2 size={18} className="spin" /> : <LocateFixed size={18} />}
      </button>

      {showDropdown && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.place_id} 
              onClick={() => handleSelect(suggestion.display_name)}
              className="suggestion-item"
            >
              <MapPin size={14} className="suggestion-icon" />
              <span>{suggestion.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;
