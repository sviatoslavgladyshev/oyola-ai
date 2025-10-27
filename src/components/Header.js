import React, { useState } from 'react';

const Header = ({ user, onSignOut, onOpenProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = () => {
    setShowDropdown(false);
    onSignOut();
  };

  const handleOpenProfile = () => {
    setShowDropdown(false);
    onOpenProfile();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>🏡 Automated Property Offer Platform</h1>
          <p>Enter your criteria and we'll automatically find properties and contact owners with your offer</p>
        </div>
        
        {user && (
          <div className="header-right">
            <div className="user-menu">
              <button 
                className="user-menu-trigger" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} />
                  ) : (
                    <span className="avatar-initial">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role === 'buyer' ? '🏠 Buyer' : '🏘️ Owner'}</span>
                </div>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showDropdown && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={handleOpenProfile}>
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>
                    <button className="dropdown-item">
                      <span>📊</span>
                      <span>My Offers</span>
                    </button>
                    <button className="dropdown-item">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleSignOut}>
                      <span>🚪</span>
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

