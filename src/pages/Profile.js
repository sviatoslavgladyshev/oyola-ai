import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { updateProfile, changePassword } from '../services/authService';

const Profile = ({ user, onUpdateUser, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.displayName || user.name || '',
    phone: user.phone || '',
    bio: user.bio || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await updateProfile(formData);
      onUpdateUser(updatedUser);
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      showNotification('Password changed successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>👤 My Profile</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {notification && (
          <div className={`profile-notification ${notification.type}`}>
            {notification.type === 'success' ? '✅' : '⚠️'} {notification.message}
          </div>
        )}

        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📋 Profile
          </button>
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Security
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' ? (
            <div className="profile-section">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || user.name || user.email} />
                  ) : (
                    <span className="avatar-initial">
                      {(user.displayName || user.name || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="profile-info">
                  <h3>{user.displayName || user.name || user.email}</h3>
                  <p>{user.email}</p>
                  <span className="role-badge">{user.role === 'buyer' ? '🏠 Buyer' : '🏘️ Owner'}</span>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-card">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Active Offers</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Properties Viewed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="stat-label">Member Since</span>
                </div>
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={user.email}
                    disabled
                  />
                  <small className="helper-text">Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    className="form-textarea"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows="4"
                  />
                </div>

                <div className="profile-actions">
                  {isEditing ? (
                    <>
                      <Button variant="primary" onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                      </Button>
                      <Button variant="reset" onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: user.displayName || user.name || '', phone: user.phone || '', bio: user.bio || '' });
                      }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" onClick={() => setIsEditing(true)}>
                      ✏️ Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="security-section">
              <h3>🔐 Change Password</h3>
              <p className="section-description">
                Keep your account secure by using a strong password
              </p>

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    required
                    minLength="6"
                    placeholder="••••••••"
                  />
                  <small className="helper-text">Minimum 6 characters</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="profile-actions">
                  <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? '⏳ Updating...' : '🔒 Update Password'}
                  </Button>
                </div>
              </form>

              <div className="security-info">
                <h4>💡 Security Tips</h4>
                <ul>
                  <li>Use a unique password for this account</li>
                  <li>Include a mix of letters, numbers, and symbols</li>
                  <li>Avoid common words or personal information</li>
                  <li>Change your password regularly</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

