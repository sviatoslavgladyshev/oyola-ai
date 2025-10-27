import React, { useState } from 'react';
import { HiChevronDown, HiUser, HiChartBar, HiCog, HiLogout } from 'react-icons/hi';

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
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="header-logo" />
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

