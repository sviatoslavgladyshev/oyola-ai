import React, { useState, useEffect } from 'react';
import { startBuyerTour, startOwnerTour } from './utils/introTour';
import { HiCheck } from 'react-icons/hi';
import OfferForm from './components/features/OfferForm';
import OfferResults from './components/features/OfferResults';
import OfferDetail from './components/features/OfferDetail';
import CityGrid from './components/features/CityGrid';
import OwnerDashboard from './pages/OwnerDashboard';
import SignIn from './pages/SignIn';
// SignUp removed from auth flow
import Profile from './pages/Profile';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Notification from './components/layout/Notification';
import Button from './components/ui/Button';
import Loader from './components/ui/Loader';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { submitOfferToOwners, simulateOwnerResponses } from './services/offerService';
import { onAuthStateChanged, signIn, signOut, processGoogleRedirectResult, exchangeGmailAuthCode } from './services/authService';
import { initializeSampleData } from './services/propertyService';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db, auth } from './config/firebase';
import { markTutorialCompleted } from './services/userService';
import { getOfferStatusColor, getOfferStatusIcon } from './utils/formatters';
import { getSampleOffers } from './data/offers';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Single auth view: signin (Google handles account creation)
  const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'results', or 'detail'
  const [showPostLoginPrompt, setShowPostLoginPrompt] = useState(false);
  const [shouldRunTour, setShouldRunTour] = useState(false);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [matchingCount, setMatchingCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Expose an imperative hook for intro tour to open the Profile modal
  useEffect(() => {
    window.openProfileModal = () => setShowProfile(true);
    return () => { try { delete window.openProfileModal; } catch (_) {} };
  }, []);

  

  // Check for existing user session and initialize sample data on mount
  useEffect(() => {
    initializeSampleData();
    
    // Handle Gmail OAuth callback (check for code in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      // Handle Gmail OAuth callback
      exchangeGmailAuthCode(code, state)
        .then(async () => {
          // Remove code and state from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // Refresh user data from Firestore to get updated Gmail connection status
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
              if (userDoc.exists()) {
                const userData = {
                  ...currentUser,
                  ...userDoc.data()
                };
                setUser(userData);
              }
            }
          } catch (error) {
            console.error('Error refreshing user data after Gmail connection:', error);
          }
          
          setNotification({
            message: 'Gmail is connected',
            type: 'success'
          });
        })
        .catch((error) => {
          console.error('Failed to exchange Gmail auth code:', error);
          setNotification({
            message: 'Failed to authorize Gmail access: ' + error.message,
            type: 'error'
          });
          // Remove code and state from URL even on error
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
    }
    
    // Complete redirect-based Google sign-in and persist token if present
    processGoogleRedirectResult().catch((e) => console.error('Redirect sign-in processing failed:', e));
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData;
          if (userDoc.exists()) {
            userData = {
              ...firebaseUser,
              ...userDoc.data()
            };
          } else {
            userData = firebaseUser;
          }
          setUser(userData);
          // If role missing, show role selection first
          if (!userDoc.exists() || !userDoc.data()?.role) {
            setView('role-select');
          } else {
            // Route based on role
            if (userDoc.data()?.role === 'owner') {
              // Owner branch below handles view
            } else {
              setView('dashboard');
              setShowPostLoginPrompt(!userData.tutorialCompleted);
            }
          }

          // Load sample offers when user first logs in
          setOffers(prevOffers => {
            if (prevOffers.length === 0) {
              return getSampleOffers({
                id: userData.uid || userData.id || 'buyer-001',
                name: userData.displayName || userData.name || 'User',
                email: userData.email || 'user@example.com',
                phone: userData.phone || ''
              });
            }
            return prevOffers;
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);

          // Load sample offers even if there's an error
          setOffers(prevOffers => {
            if (prevOffers.length === 0) {
              return getSampleOffers({
                id: firebaseUser.uid || 'buyer-001',
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || 'user@example.com',
                phone: ''
              });
            }
            return prevOffers;
          });
        }
      } else {
        setUser(null);
        setOffers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email, password, rememberMe = true) => {
    const userData = await signIn(email, password, rememberMe);
    setUser(userData);
    showNotification(`Welcome back, ${userData.displayName || userData.name || 'User'}!`, 'success');
    if (!userData.role) { setView('role-select'); } else if ((userData.role || 'buyer') !== 'owner') { setView('dashboard'); setShowPostLoginPrompt(!userData.tutorialCompleted); }
  };

  // Sign-up flow removed. Google sign-in will create account when needed.

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

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    showNotification(`Showing properties in ${city.name}, ${city.state}`, 'success');
    setView('form');
  };

  const handleBackToDashboard = () => {
    setSelectedCity(null);
    setView('dashboard');
  };

  const showNotification = (message, type) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Intro.js: lazy-load assets from CDN and start tour

  // Run tour when flagged and view is ready
  useEffect(() => {
    if (!user) return;
    if (!shouldRunTour) return;
    const onTourDone = async () => {
      try {
        await markTutorialCompleted(user.uid);
        setUser((u) => ({ ...u, tutorialCompleted: true }));
        setShowPostLoginPrompt(false);
      } catch (e) {
        console.error('Failed to record tutorial completion', e);
      }
    };
    if (user.role === 'owner' && view !== undefined) {
      startOwnerTour(onTourDone);
      setShouldRunTour(false);
    } else if (user.role !== 'owner' && view === 'dashboard') {
      startBuyerTour(onTourDone);
      setShouldRunTour(false);
    }
  }, [user, view, shouldRunTour]);

  // Serve policy routes before auth gating but after hooks
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (pathname === '/privacy' || pathname === '/privacy.html') {
    return (
      <div className="App">
        <div className="container-single">
          <Privacy />
        </div>
        <Footer />
      </div>
    );
  }
  if (pathname === '/terms' || pathname === '/terms.html') {
    return (
      <div className="App">
        <div className="container-single">
          <Terms />
        </div>
        <Footer />
      </div>
    );
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="App" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="loading-container" style={{ background: '#111827' }}>
          <Loader />
        </div>
      </div>
    );
  }

  // If user is not signed in, show auth views
  if (!user) {
    return (
      <div className="App gradient-bg">
        <header className="app-header no-border">
          <div className="header-content">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="header-logo" />
          </div>
        </header>
        <div className="auth-content">
          <Notification 
            notification={notification} 
            onClose={() => setNotification(null)} 
          />
          <SignIn 
            onSignIn={handleSignIn}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // If user is signed in but role not set yet, show role selection first
  if (user && (!user.role || view === 'role-select')) {
    return (
      <div className="App">
        <Header 
          user={user}
          onSignOut={handleSignOut}
          onOpenProfile={() => setShowProfile(true)}
        />
        <Notification 
          notification={notification} 
          onClose={() => setNotification(null)} 
        />
        <div className="container-single">
          <div className="offer-form-card" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="offer-form-header" style={{ marginBottom: 20 }}>
              <h2>Choose your role</h2>
              <p>This helps us personalize your experience.</p>
            </div>
            <div className="button-group-vertical">
              <Button
                variant="filter"
                onClick={async () => {
                  try {
                    await setDoc(doc(db, 'users', user.uid), { role: 'buyer', updatedAt: new Date().toISOString() }, { merge: true });
                    setUser((u) => ({ ...u, role: 'buyer' }));
                    setView('dashboard');
                    setShowPostLoginPrompt(!(user && user.tutorialCompleted));
                    setShouldRunTour(!(user && user.tutorialCompleted));
                  } catch (e) {
                    console.error('Failed to set role', e);
                    showNotification('Failed to save role. Please try again.', 'error');
                  }
                }}
              >
                🏠 I’m a Buyer
              </Button>
              <Button
                variant="filter"
                onClick={async () => {
                  try {
                    await setDoc(doc(db, 'users', user.uid), { role: 'owner', updatedAt: new Date().toISOString() }, { merge: true });
                    setUser((u) => ({ ...u, role: 'owner' }));
                    // Owner view will render below automatically
                    setShouldRunTour(!(user && user.tutorialCompleted));
                  } catch (e) {
                    console.error('Failed to set role', e);
                    showNotification('Failed to save role. Please try again.', 'error');
                  }
                }}
              >
                🏘️ I’m a Property Owner
              </Button>
            </div>
          </div>
        </div>
        <Footer />
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

        <Notification 
          notification={notification} 
          onClose={() => setNotification(null)} 
        />

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
        <Footer />
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
        view={view}
        onViewChange={setView}
        offersCount={offers.length}
        onLocationChange={(location) => console.log('Location changed to:', location)}
      />

      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {showProfile && (
        <Profile 
          user={user}
          onUpdateUser={handleUpdateUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      <div className="container-single">
        <main className="main-content-single">
          {view === 'dashboard' ? (
            <div className="dashboard-layout">
              {showPostLoginPrompt && (
                <div className="buyer-info-banner" style={{ marginBottom: 16 }}>
                  <div className="banner-icon">👋</div>
                  <div style={{ flex: 1 }}>
                    <strong>Welcome! What would you like to do next?</strong>
                    <p>You can explore cities, start a new offer, or update your profile.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="filter" onClick={() => { setView('form'); setShowPostLoginPrompt(false); }}>Start an offer</Button>
                    <Button variant="filter" onClick={() => { setShowPostLoginPrompt(false); }}>Explore cities</Button>
                    <Button variant="filter" onClick={() => { setShowPostLoginPrompt(false); setShowProfile(true); }}>Open profile</Button>
                  </div>
                </div>
              )}
              <CityGrid onCitySelect={handleCitySelect} />
              <div className="dashboard-form-section">
                <div className="dashboard-two-columns">
                  <div className="dashboard-offers-tracker">
                    <div className="tracker-header">
                      <h3 className="tracker-title">Your Offers</h3>
                      <div className="tracker-stats">
                        <span className="tracker-count">{offers.length}</span>
                        <span className="tracker-label">Total</span>
                      </div>
                    </div>
                    {offers.length > 0 ? (
                      <div className="offers-tracker-list">
                        {offers.map((offer) => {
                          const getProgress = (status) => {
                            switch(status) {
                              case 'sent': return 25;
                              case 'viewed': return 50;
                              case 'accepted': return 100;
                              case 'rejected': return 75;
                              default: return 0;
                            }
                          };
                          const progress = getProgress(offer.status);
                          const offerPercentage = offer.property?.price ? 
                            ((offer.offerAmount / offer.property.price) * 100).toFixed(0) : 'N/A';
                          
                          return (
                            <div key={offer.id} className="offer-tracker-item" onClick={() => handleSelectOffer(offer)}>
                              <div className="offer-tracker-image">
                                {offer.property?.image ? (
                                  <img src={offer.property.image} alt={offer.property.title || 'Property'} />
                                ) : (
                                  <div className="offer-tracker-placeholder">🏠</div>
                                )}
                                <div className="offer-tracker-status" style={{ backgroundColor: getOfferStatusColor(offer.status) }}>
                                  {getOfferStatusIcon(offer.status)}
                                </div>
                              </div>
                              <div className="offer-tracker-info">
                                <div className="offer-tracker-header">
                                  <h4>{offer.property?.title || offer.property?.address || 'Property'}</h4>
                                  <span className="offer-tracker-badge" style={{ color: getOfferStatusColor(offer.status) }}>
                                    {offer.status === 'accepted' ? '✓ Accepted' :
                                     offer.status === 'rejected' ? '✗ Declined' :
                                     offer.status === 'viewed' ? '👁️ Viewed' :
                                     '📤 Sent'}
                                  </span>
                                </div>
                                <p className="offer-tracker-location">📍 {offer.property?.location || offer.property?.city || 'Location'}</p>
                                <div className="offer-tracker-pricing">
                                  <div className="offer-price-info">
                                    <span className="offer-label">Your Offer</span>
                                    <span className="offer-tracker-price">${offer.offerAmount?.toLocaleString() || offer.offerAmount || 'N/A'}</span>
                                  </div>
                                  {offer.property?.price && (
                                    <div className="asking-price-info">
                                      <span className="offer-label">Asking</span>
                                      <span className="asking-price">${offer.property.price.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                                {offer.property?.price && (
                                  <div className="offer-percentage">
                                    <span>{offerPercentage}% of asking price</span>
                                    {offerPercentage < 95 && <span className="below-asking">Below</span>}
                                    {offerPercentage >= 95 && offerPercentage <= 105 && <span className="at-asking">At</span>}
                                    {offerPercentage > 105 && <span className="above-asking">Above</span>}
                                  </div>
                                )}
                                <div className="offer-progress-container">
                                  <div className="offer-progress-bar">
                                    <div 
                                      className="offer-progress-fill" 
                                      style={{ 
                                        width: `${progress}%`,
                                        backgroundColor: getOfferStatusColor(offer.status)
                                      }}
                                    />
                                  </div>
                                  <div className="offer-progress-steps">
                                    <span className={`progress-step ${offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted' || offer.status === 'rejected' ? 'completed' : ''}`}>Sent</span>
                                    <span className={`progress-step ${offer.status === 'viewed' || offer.status === 'accepted' || offer.status === 'rejected' ? 'completed' : ''}`}>Viewed</span>
                                    <span className={`progress-step ${offer.status === 'accepted' ? 'completed' : offer.status === 'rejected' ? 'rejected' : ''}`}>
                                      {offer.status === 'accepted' ? 'Accepted' : offer.status === 'rejected' ? 'Declined' : 'Response'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="offers-tracker-empty">
                        <div className="empty-icon">📋</div>
                        <p>No offers yet</p>
                        <p className="empty-subtext">Submit an offer to track it here</p>
                      </div>
                    )}
                  </div>
                  <div className="dashboard-form-column">
                    <OfferForm user={user} onSubmitOffer={handleSubmitOffer} selectedCity={selectedCity} />
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'form' ? (
            <div className="home-hero">
              <div className="full-bleed" style={{ marginBottom: 20 }}>
                <div className="section-header-row" style={{ padding: '0 20px' }}>
                  <h3>Popular cities</h3>
                  <button className="link-button" onClick={() => setView('dashboard')}>See all →</button>
                </div>
                <div style={{ padding: '0 12px' }}>
                  <CityGrid 
                    onCitySelect={handleCitySelect} 
                    maxItems={20}
                    compact
                    autoRotate
                    rotateIntervalMs={2800}
                    onSeeMore={() => setView('dashboard')}
                  />
                </div>
              </div>

              {selectedCity && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <Button variant="secondary" onClick={handleBackToDashboard}>
                    ← Back to Dashboard
                  </Button>
                </div>
              )}
              <div className="home-columns">
                <div className="home-left">
                  <OfferForm user={user} onSubmitOffer={handleSubmitOffer} selectedCity={selectedCity} />
                </div>
              </div>
            </div>
          ) : view === 'detail' ? (
            <OfferDetail 
              offer={selectedOffer} 
              onBack={handleBackToResults}
              onShowNotification={showNotification}
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
                  <HiCheck size={20} style={{ display: 'inline-block', marginRight: '8px' }} /> Submit Another Offer
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
