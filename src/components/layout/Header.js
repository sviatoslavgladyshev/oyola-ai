import React, { useState, useEffect, useRef } from 'react';
import { HiChevronDown, HiUser, HiChartBar, HiCog, HiLogout, HiSearch, HiDocumentText, HiPresentationChartBar, HiLocationMarker } from 'react-icons/hi';
import { loadInitialLocations, searchLocations, filterLoadedLocations } from '../../utils/locationSearch';

const Header = ({ user, onSignOut, onOpenProfile, onSearch, view, onViewChange, offersCount, onLocationChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const userMenuRef = useRef(null);
  const locationMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const locations = loadInitialLocations();
    setAllCities(locations);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu if clicking outside
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      
      // Close location menu if clicking outside
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
        setLocationSearch('');
        setSearchResults([]);
      }
    };

    // Add event listener when any dropdown is open
    if (showDropdown || showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showLocationDropdown]);

  const handleSignOut = () => {
    setShowDropdown(false);
    onSignOut();
  };

  const handleOpenProfile = () => {
    setShowDropdown(false);
    onOpenProfile();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setShowLocationDropdown(false);
    setLocationSearch('');
    setSearchResults([]);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleCloseLocationDropdown = () => {
    setShowLocationDropdown(false);
    setLocationSearch('');
    setSearchResults([]);
  };

  // Debounced search effect
  useEffect(() => {
    if (!locationSearch) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Check loaded cities and states first (instant)
    const loadedResults = filterLoadedLocations(allCities, locationSearch);
    
    if (loadedResults.length > 0) {
      setSearchResults(loadedResults);
      setIsSearching(false);
      return;
    }

    // Debounce the dynamic search
    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      const results = searchLocations(locationSearch);
      setSearchResults(results);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer);
  }, [locationSearch, allCities]);

  const filteredLocations = locationSearch ? searchResults : allCities;

  const handleAutoLocation = () => {
    setIsDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd use reverse geocoding here
          // For now, we'll simulate by picking a location based on coordinates
          // Find the closest city (simplified - in production use proper geocoding)
          // For now, just pick a default based on common US locations
          const simulatedLocation = 'New York, New York';
          setLocation(simulatedLocation);
          setShowLocationDropdown(false);
          setIsDetectingLocation(false);
          if (onLocationChange) {
            onLocationChange(simulatedLocation);
          }
        },
        (error) => {
          console.error('Error detecting location:', error);
          setIsDetectingLocation(false);
          alert('Unable to detect your location. Please select manually.');
        }
      );
    } else {
      setIsDetectingLocation(false);
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="header-logo" />
        </div>
        
        <div className="location-selector" ref={locationMenuRef}>
          <button 
            className="location-button"
            onClick={() => {
              setShowLocationDropdown(!showLocationDropdown);
              setShowDropdown(false); // Close user menu when opening location menu
            }}
          >
            <HiLocationMarker size={18} />
            <span className="location-text">{location}</span>
            <HiChevronDown size={16} className="location-arrow" />
          </button>

          {showLocationDropdown && (
            <>
              <div className="dropdown-overlay" onClick={handleCloseLocationDropdown} />
              <div className="location-dropdown">
                <div className="location-dropdown-header">
                  <button 
                    className="location-dropdown-item auto-detect"
                    onClick={handleAutoLocation}
                    disabled={isDetectingLocation}
                  >
                    <HiLocationMarker size={18} />
                    <span>{isDetectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                  <div className="dropdown-divider" />
                  <div className="location-search-wrapper">
                    <HiSearch size={16} className="location-search-icon" />
                    <input
                      type="text"
                      className="location-search-input"
                      placeholder="Search cities, states, or zip codes..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="location-list">
                  {isSearching ? (
                    <div className="location-searching">
                      <span>Searching...</span>
                    </div>
                  ) : filteredLocations.length > 0 ? (
                    filteredLocations.map((loc, index) => (
                      <button
                        key={`${loc.value}-${index}`}
                        className={`location-dropdown-item ${location === loc.value ? 'active' : ''}`}
                        onClick={() => handleLocationChange(loc.value)}
                      >
                        {loc.value}
                      </button>
                    ))
                  ) : (
                    <div className="location-no-results">
                      No locations found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="header-center">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <HiSearch className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
          </form>
        </div>
        
        {user && user.role !== 'owner' && onViewChange && (
          <div className="header-nav">
            <button 
              className={`header-nav-button ${view === 'form' ? 'active' : ''}`}
              onClick={() => onViewChange('form')}
            >
              <HiDocumentText size={20} />
              <span>Submit Offer</span>
            </button>
            <button 
              className={`header-nav-button ${view === 'results' || view === 'detail' ? 'active' : ''}`}
              onClick={() => onViewChange('results')}
              disabled={!offersCount || offersCount === 0}
            >
              <HiPresentationChartBar size={20} />
              <span>My Offers {offersCount > 0 && `(${offersCount})`}</span>
            </button>
          </div>
        )}
        
        {user && (
          <div className="header-right">
            <div className="user-menu" ref={userMenuRef}>
              <button 
                className="user-menu-trigger" 
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowLocationDropdown(false); // Close location menu when opening user menu
                }}
              >
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || user.name || user.email} />
                  ) : (
                    <span className="avatar-initial">
                      {(user.displayName || user.name || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.displayName || user.name || user.email}</span>
                </div>
                <span className="dropdown-arrow"><HiChevronDown size={18} /></span>
              </button>

              {showDropdown && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <strong>{user.displayName || user.name || user.email}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={handleOpenProfile}>
                      <HiUser size={18} />
                      <span>My Profile</span>
                    </button>
                    <button className="dropdown-item">
                      <HiChartBar size={18} />
                      <span>My Offers</span>
                    </button>
                    <button className="dropdown-item">
                      <HiCog size={18} />
                      <span>Settings</span>
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleSignOut}>
                      <HiLogout size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

