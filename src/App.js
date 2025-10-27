import React, { useState, useEffect } from 'react';
import OfferForm from './components/OfferForm';
import OfferResults from './components/OfferResults';
import OfferDetail from './components/OfferDetail';
import OwnerDashboard from './components/OwnerDashboard';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Header from './components/Header';
import Button from './components/Button';
import { submitOfferToOwners, simulateOwnerResponses } from './services/offerService';
import { getCurrentUser, signIn, signUp, signOut } from './services/authService';
import { initializeSampleData } from './services/propertyService';

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('signin'); // 'signin' or 'signup'
  const [view, setView] = useState('form'); // 'form', 'results', or 'detail'
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [matchingCount, setMatchingCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Check for existing user session and initialize sample data on mount
  useEffect(() => {
    initializeSampleData();
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleSignIn = async (email, password) => {
    const userData = await signIn(email, password);
    setUser(userData);
    showNotification(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleSignUp = async (userData) => {
    const newUser = await signUp(userData);
    setUser(newUser);
    showNotification(`Welcome to the platform, ${newUser.name}!`, 'success');
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setOffers([]);
    setView('form');
    showNotification('Signed out successfully', 'success');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleSubmitOffer = async (formData) => {
    try {
      // Submit offer to matching property owners
      const result = await submitOfferToOwners(formData);
      
      // Simulate some owner responses for demo purposes
      const offersWithResponses = simulateOwnerResponses(result.offers);
      
      setOffers(offersWithResponses);
      setMatchingCount(result.matchingCount);
      
      // Show success notification
      showNotification(result.message, 'success');
      
      // Switch to results view
      setView('results');
      
    } catch (error) {
      showNotification(error.message || 'Failed to submit offers. Please try again.', 'error');
    }
  };

  const handleNewOffer = () => {
    setView('form');
    setOffers([]);
    setMatchingCount(0);
    setSelectedOffer(null);
  };

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
    setView('detail');
  };

  const handleBackToResults = () => {
    setSelectedOffer(null);
    setView('results');
  };

  const showNotification = (message, type) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // If user is not signed in, show auth views
  if (!user) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>🏡 Automated Property Offer Platform</h1>
            <p>Enter your criteria and we'll automatically find properties and contact owners with your offer</p>
          </div>
        </header>

        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close" 
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        )}

        {authView === 'signin' ? (
          <SignIn 
            onSignIn={handleSignIn}
            onSwitchToSignUp={() => setAuthView('signup')}
          />
        ) : (
          <SignUp 
            onSignUp={handleSignUp}
            onSwitchToSignIn={() => setAuthView('signin')}
          />
        )}
      </div>
    );
  }

  // User is signed in - show appropriate dashboard
  // Property owners see owner dashboard
  if (user.role === 'owner') {
    return (
      <div className="App">
        <Header 
          user={user}
          onSignOut={handleSignOut}
          onOpenProfile={() => setShowProfile(true)}
        />

        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close" 
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        )}

        {showProfile && (
          <Profile 
            user={user}
            onUpdateUser={handleUpdateUser}
            onClose={() => setShowProfile(false)}
          />
        )}

        <div className="container-single">
          <OwnerDashboard 
            user={user}
            onShowNotification={showNotification}
          />
        </div>
      </div>
    );
  }

  // Buyers see offer submission interface
  return (
    <div className="App">
      <Header 
        user={user}
        onSignOut={handleSignOut}
        onOpenProfile={() => setShowProfile(true)}
      />

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : '⚠️'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close" 
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {showProfile && (
        <Profile 
          user={user}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      <div className="container-single">
        <div className="view-switcher">
          <Button
            variant={view === 'form' ? 'primary' : 'reset'}
            onClick={() => setView('form')}
          >
            📝 Submit New Offer
          </Button>
          <Button
            variant={view === 'results' || view === 'detail' ? 'primary' : 'reset'}
            onClick={() => setView('results')}
            disabled={offers.length === 0}
          >
            📊 View My Offers ({offers.length})
          </Button>
        </div>

        <main className="main-content-single">
          {view === 'form' ? (
            <OfferForm user={user} onSubmitOffer={handleSubmitOffer} />
          ) : view === 'detail' ? (
            <OfferDetail 
              offer={selectedOffer} 
              onBack={handleBackToResults}
            />
          ) : (
            <>
              <OfferResults 
                offers={offers} 
                matchingProperties={matchingCount}
                onSelectOffer={handleSelectOffer}
              />
              <div className="new-offer-section">
                <Button variant="primary" onClick={handleNewOffer}>
                  🎯 Submit Another Offer
                </Button>
              </div>
            </>
          )}
        </main>

        <div className="info-banner">
          <h3>🤖 How It Works</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Enter Your Criteria</h4>
                <p>Specify property type, location, budget, and offer details</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Automatic Matching</h4>
                <p>Our system finds all properties matching your requirements</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Contact Owners</h4>
                <p>We automatically reach out to all property owners with your offer</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Track Responses</h4>
                <p>Monitor which owners view, accept, or decline your offer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
