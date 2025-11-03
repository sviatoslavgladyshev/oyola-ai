import React, { useState, useEffect, useRef } from 'react';
import { HiChevronDown, HiUser, HiChartBar, HiCog, HiLogout, HiSearch, HiDocumentText, HiPresentationChartBar, HiLocationMarker, HiMenu, HiX, HiPlus, HiTable, HiEye, HiEyeOff } from 'react-icons/hi';
import { loadInitialLocations, searchLocations, filterLoadedLocations } from '../../utils/locationSearch';
import ThemeSwitcher from '../ui/ThemeSwitcher';

const Header = ({ user, onSignOut, onOpenProfile, onSearch, view, onViewChange, offersCount, onLocationChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userMenuRef = useRef(null);
  const locationMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tabsCollapsed, setTabsCollapsed] = useState(false);

  // Detect scroll to convert header to pill
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50); // Trigger pill style after 50px scroll
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const closeMobileMenu = () => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setShowMobileMenu(false);
      setIsClosingMenu(false);
    }, 300); // Match animation duration
  };

  const handleSignOut = () => {
    setShowDropdown(false);
    if (showMobileMenu) {
      closeMobileMenu();
    }
    onSignOut();
  };

  const handleOpenProfile = () => {
    setShowDropdown(false);
    if (showMobileMenu) {
      closeMobileMenu();
    }
    onOpenProfile();
  };

  const handleViewChange = (newView) => {
    if (onViewChange) {
      onViewChange(newView);
    }
    if (showMobileMenu) {
      closeMobileMenu();
    }
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
    if (isMobile) {
      // Trigger closing animation on mobile
      setIsClosingModal(true);
      setTimeout(() => {
        setShowLocationDropdown(false);
        setLocationSearch('');
        setSearchResults([]);
        setIsClosingModal(false);
      }, 300); // Match animation duration
    } else {
      // Desktop: close immediately
      setShowLocationDropdown(false);
      setLocationSearch('');
      setSearchResults([]);
    }
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleCloseLocationDropdown = () => {
    if (isMobile) {
      // Trigger closing animation on mobile
      setIsClosingModal(true);
      setTimeout(() => {
        setShowLocationDropdown(false);
        setLocationSearch('');
        setSearchResults([]);
        setSelectedState(null);
        setIsClosingModal(false);
      }, 300); // Match animation duration
    } else {
      // Desktop: close immediately
      setShowLocationDropdown(false);
      setLocationSearch('');
      setSearchResults([]);
      setSelectedState(null);
    }
  };

  const handleBackToStates = () => {
    setSelectedState(null);
    setLocationSearch('');
  };

  const handleSelectAllCitiesInState = (state) => {
    setLocation(`All cities in ${state}`);
    if (isMobile) {
      // Trigger closing animation on mobile
      setIsClosingModal(true);
      setTimeout(() => {
        setShowLocationDropdown(false);
        setSelectedState(null);
        setLocationSearch('');
        setIsClosingModal(false);
      }, 300); // Match animation duration
    } else {
      // Desktop: close immediately
      setShowLocationDropdown(false);
      setSelectedState(null);
      setLocationSearch('');
    }
    if (onLocationChange) {
      onLocationChange(`All cities in ${state}`);
    }
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

  // Filter locations based on selected state or search
  const getDisplayLocations = () => {
    if (locationSearch) {
      return searchResults;
    }
    if (selectedState) {
      return allCities.filter(loc => loc.value.endsWith(`, ${selectedState}`));
    }
    // Show all cities by default (popular cities)
    return allCities;
  };

  const filteredLocations = getDisplayLocations();

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

  // Mobile Header Layout
  if (isMobile) {
    return (
      <>
        <header className={`app-header mobile-header ${isScrolled ? 'header-pill' : ''}`}>
          {searchExpanded ? (
            <div className="mobile-header-row mobile-header-search-expanded">
              {/* Expanded Search Bar */}
              <form className="mobile-search-form-expanded" onSubmit={handleSearchSubmit}>
                <HiSearch className="mobile-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="mobile-search-input-expanded"
                  autoFocus
                />
                <button 
                  type="button"
                  className="mobile-search-close"
                  onClick={() => setSearchExpanded(false)}
                  aria-label="Close search"
                >
                  <HiX size={18} />
                </button>
              </form>
            </div>
          ) : (
            <div className="mobile-header-row">
              {/* Hamburger Menu */}
              <button 
                className="mobile-menu-button"
                onClick={() => {
                  if (showMobileMenu) {
                    closeMobileMenu();
                  } else {
                    setShowMobileMenu(true);
                  }
                }}
                aria-label="Menu"
              >
                {showMobileMenu ? <HiX size={24} /> : <HiMenu size={24} />}
              </button>
              
              {/* Logo in Center */}
              <div className="mobile-header-center">
                <a href="/" aria-label="logo" id="logo-link">
                  <div aria-hidden="true" className="flex">
                    <div className="logo-circle"></div>
                    <div className="logo-bar"></div>
                  </div>
                  <span className="logo-text">Oyola AI</span>
                </a>
              </div>
              
              {/* Search Button */}
              <button 
                className="mobile-search-button"
                onClick={() => setSearchExpanded(true)}
                aria-label="Search"
              >
                <HiSearch size={22} />
              </button>
            </div>
          )}
        </header>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <>
            <div className={`mobile-menu-overlay ${isClosingMenu ? 'closing' : ''}`} onClick={closeMobileMenu} />
            <div className={`mobile-menu-drawer ${isClosingMenu ? 'closing' : ''}`}>
              <div className="mobile-menu-content">
                {/* User Profile Section */}
                {user && (
                  <div className="mobile-menu-user">
                    <div className="user-avatar large">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || user.name || user.email} />
                      ) : (
                        <span className="avatar-initial">
                          {(user.displayName || user.name || user.email || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mobile-menu-user-info">
                      <strong>{user.displayName || user.name || user.email}</strong>
                      <span>{user.email}</span>
                      <span className="mobile-user-role">{user.role === 'owner' ? 'Property Owner' : 'Buyer'}</span>
                    </div>
                  </div>
                )}

                <div className="mobile-menu-divider" />

                {/* Location Selector */}
                <div className="mobile-menu-section">
                  <div className="mobile-menu-label">Location</div>
                  <button 
                    className="mobile-menu-location"
                    onClick={() => {
                      setShowLocationDropdown(true);
                      closeMobileMenu();
                    }}
                  >
                    <HiLocationMarker size={20} />
                    <span>{location}</span>
                    <HiChevronDown size={18} className="ml-auto" />
                  </button>
                </div>

                <div className="mobile-menu-divider" />

                {/* Navigation Items */}
                {user && user.role !== 'owner' && onViewChange && (
                  <>
                    <div className="mobile-menu-section">
                      <div className="mobile-menu-label">Navigate</div>
                      <button 
                        className={`mobile-menu-item ${view === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleViewChange('dashboard')}
                      >
                        <HiLocationMarker size={20} />
                        <span>Dashboard</span>
                      </button>
                      <button 
                        className={`mobile-menu-item ${view === 'form' ? 'active' : ''}`}
                        onClick={() => handleViewChange('form')}
                      >
                        <HiDocumentText size={20} />
                        <span>Submit Offer</span>
                      </button>
                      <button 
                        className={`mobile-menu-item ${view === 'results' || view === 'detail' ? 'active' : ''}`}
                        onClick={() => handleViewChange('results')}
                        disabled={!offersCount || offersCount === 0}
                      >
                        <HiPresentationChartBar size={20} />
                        <span>My Offers {offersCount > 0 && `(${offersCount})`}</span>
                      </button>
                      <button 
                        className={`mobile-menu-item ${view === 'handsontable' ? 'active' : ''}`}
                        onClick={() => handleViewChange('handsontable')}
                      >
                        <HiTable size={20} />
                        <span>Data Table</span>
                      </button>
                    </div>
                    
                    <div className="mobile-menu-divider" />
                  </>
                )}

                {/* Account Menu Items */}
                <div className="mobile-menu-section">
                  <div className="mobile-menu-label">Account</div>
                  <button className="mobile-menu-item" onClick={handleOpenProfile}>
                    <HiUser size={20} />
                    <span>My Profile</span>
                  </button>
                  <button className="mobile-menu-item">
                    <HiChartBar size={20} />
                    <span>Dashboard</span>
                  </button>
                  <button className="mobile-menu-item">
                    <HiCog size={20} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="mobile-menu-divider" />

                {/* Theme Switcher */}
                <div className="mobile-menu-item-theme">
                  <ThemeSwitcher />
                </div>

                <div className="mobile-menu-divider" />

                {/* Sign Out */}
                <button className="mobile-menu-item danger" onClick={handleSignOut}>
                  <HiLogout size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Location Dropdown - repositioned for mobile */}
        {showLocationDropdown && (
          <div className={`mobile-location-modal ${isClosingModal ? 'closing' : ''}`}>
            <div className="mobile-modal-header">
              {selectedState && !locationSearch && (
                <button 
                  className="mobile-modal-back"
                  onClick={handleBackToStates}
                >
                  <HiChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
              )}
              <h3>{selectedState && !locationSearch ? selectedState : 'Select Location'}</h3>
              <button 
                className="mobile-modal-close"
                onClick={handleCloseLocationDropdown}
              >
                <HiX size={24} />
              </button>
            </div>
            <div className="location-dropdown-header">
              {!selectedState && !locationSearch && (
                <>
                  <button 
                    className="location-dropdown-item auto-detect"
                    onClick={handleAutoLocation}
                    disabled={isDetectingLocation}
                  >
                    <HiLocationMarker size={18} />
                    <span>{isDetectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
                  </button>
                  <div className="dropdown-divider" />
                </>
              )}
              <div className="location-search-wrapper">
                <HiSearch size={16} className="location-search-icon" />
                <input
                  type="text"
                  className="location-search-input"
                  placeholder={selectedState ? "Search cities..." : "Search locations..."}
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
              ) : selectedState && !locationSearch ? (
                // Show cities in selected state
                <>
                  <button
                    className={`location-dropdown-item highlight ${location === `All cities in ${selectedState}` ? 'active' : ''}`}
                    onClick={() => handleSelectAllCitiesInState(selectedState)}
                  >
                    <strong>All cities in {selectedState}</strong>
                  </button>
                  <div className="dropdown-divider" />
                  {filteredLocations.map((loc, index) => (
                    <button
                      key={`${loc.value}-${index}`}
                      className={`location-dropdown-item ${location === loc.value ? 'active' : ''}`}
                      onClick={() => handleLocationChange(loc.value)}
                    >
                      {loc.value.split(', ')[0]}
                    </button>
                  ))}
                </>
              ) : (
                // Show popular cities list only
                <>
                  <button
                    className={`location-dropdown-item ${location === 'All Locations' ? 'active' : ''}`}
                    onClick={() => handleLocationChange('All Locations')}
                  >
                    All Locations
                  </button>
                  <div className="dropdown-divider" />
                  {filteredLocations.length > 0 ? (
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
                </>
              )}
              {filteredLocations.length === 0 && locationSearch && (
                <div className="location-no-results">
                  No locations found
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Header Layout
  return (
    <>
    <header className={`app-header desktop-header ${isScrolled ? 'header-pill' : ''}`}>
      <div className="header-content">
        {/* Left Section: Brand */}
        <div className="header-left-group">
          <a href="/" aria-label="logo" id="logo-link" className="header-logo-link">
            <div aria-hidden="true" className="flex">
              <div className="logo-circle"></div>
              <div className="logo-bar"></div>
            </div>
            <span className="logo-text">Oyola AI</span>
          </a>
        </div>
        
        {/* Center Section: Location + Search */}
        <div className="header-center">
          <div className="search-location-group">
            <div className="location-selector" ref={locationMenuRef}>
              <button 
                className="location-button"
                onClick={() => {
                  setShowLocationDropdown(!showLocationDropdown);
                  setShowDropdown(false);
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
                      {!selectedState && !locationSearch && (
                        <>
                          <button 
                            className="location-dropdown-item auto-detect"
                            onClick={handleAutoLocation}
                            disabled={isDetectingLocation}
                          >
                            <HiLocationMarker size={18} />
                            <span>{isDetectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
                          </button>
                          <div className="dropdown-divider" />
                        </>
                      )}
                      <div className="location-search-wrapper">
                        <HiSearch size={16} className="location-search-icon" />
                        <input
                          type="text"
                          className="location-search-input"
                          placeholder={selectedState ? "Search cities..." : "Search locations..."}
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
                      ) : selectedState && !locationSearch ? (
                        <>
                          <button
                            className={`location-dropdown-item highlight ${location === `All cities in ${selectedState}` ? 'active' : ''}`}
                            onClick={() => handleSelectAllCitiesInState(selectedState)}
                          >
                            <strong>All cities in {selectedState}</strong>
                          </button>
                          <div className="dropdown-divider" />
                          {filteredLocations.map((loc, index) => (
                            <button
                              key={`${loc.value}-${index}`}
                              className={`location-dropdown-item ${location === loc.value ? 'active' : ''}`}
                              onClick={() => handleLocationChange(loc.value)}
                            >
                              {loc.value.split(', ')[0]}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          <button
                            className={`location-dropdown-item ${location === 'All Locations' ? 'active' : ''}`}
                            onClick={() => handleLocationChange('All Locations')}
                          >
                            All Locations
                          </button>
                          <div className="dropdown-divider" />
                          <div className="location-list-header">Popular Cities</div>
                          {filteredLocations.length > 0 ? (
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
                        </>
                      )}
                      {filteredLocations.length === 0 && locationSearch && (
                        <div className="location-no-results">
                          No locations found
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
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
        </div>

        {/* Right Section: Navigation & Actions */}
        <div className="header-right-group">
          {user && user.role !== 'owner' && onViewChange && (
            <div className={`header-nav-tabs ${tabsCollapsed ? 'collapsed' : ''}`}>
              <button 
                className={`header-nav-button ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleViewChange('dashboard')}
                title="Dashboard"
              >
                <HiLocationMarker size={18} />
                {!tabsCollapsed && <span className="nav-text">Dashboard</span>}
              </button>
              <button 
                className={`header-nav-button ${view === 'results' || view === 'detail' ? 'active' : ''}`}
                onClick={() => handleViewChange('results')}
                disabled={!offersCount || offersCount === 0}
                title={`My Offers ${offersCount > 0 ? `(${offersCount})` : ''}`}
              >
                <HiPresentationChartBar size={18} />
                {!tabsCollapsed && <span className="nav-text">Offers {offersCount > 0 && `(${offersCount})`}</span>}
              </button>
              <button 
                className={`header-nav-button ${view === 'handsontable' ? 'active' : ''}`}
                onClick={() => handleViewChange('handsontable')}
                title="Data Table"
              >
                <HiTable size={18} />
                {!tabsCollapsed && <span className="nav-text">Table</span>}
              </button>
              <button 
                className="header-nav-collapse-toggle"
                onClick={() => setTabsCollapsed(!tabsCollapsed)}
                title={tabsCollapsed ? "Show tabs" : "Hide tabs"}
                aria-label={tabsCollapsed ? "Show navigation tabs" : "Hide navigation tabs"}
              >
                {tabsCollapsed ? (
                  <HiEye size={18} />
                ) : (
                  <HiEyeOff size={18} />
                )}
              </button>
            </div>
          )}
          
          {user && user.role !== 'owner' && onViewChange && (
            <button 
              className={`add-offer-button ${view === 'form' ? 'active' : ''}`}
              onClick={() => handleViewChange('form')}
            >
              <HiPlus size={18} />
              <span>Add Offer</span>
            </button>
          )}
          
          <div className="header-actions">
            {user && (
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-menu-trigger" 
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                    setShowLocationDropdown(false);
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
                      <div className="dropdown-item-theme">
                        <ThemeSwitcher />
                      </div>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={handleSignOut}>
                        <HiLogout size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;

