import React, { useState, useEffect } from 'react';
import { HiCheck } from 'react-icons/hi';
import OfferForm from './components/features/OfferForm';
import OfferResults from './components/features/OfferResults';
import OfferDetail from './components/features/OfferDetail';
import OwnerDashboard from './pages/OwnerDashboard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/layout/Header';
import Notification from './components/layout/Notification';
import Button from './components/ui/Button';
import Loader from './components/ui/Loader';
import { submitOfferToOwners, simulateOwnerResponses } from './services/offerService';
import { onAuthStateChanged, signIn, signUp, signOut } from './services/authService';
import { initializeSampleData } from './services/propertyService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './config/firebase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              ...firebaseUser,
              ...userDoc.data()
            });
          } else {
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email, password, rememberMe = true) => {
    const userData = await signIn(email, password, rememberMe);
    setUser(userData);
    showNotification(`Welcome back, ${userData.displayName || userData.name || 'User'}!`, 'success');
  };

  const handleSignUp = async (userData) => {
    const newUser = await signUp(userData);
    setUser(newUser);
    showNotification(`Welcome to the platform, ${newUser.displayName || newUser.name || 'User'}!`, 'success');
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

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="App" style={{ background: 'white', minHeight: '100vh' }}>
        <div className="loading-container" style={{ background: 'white' }}>
          <Loader />
        </div>
      </div>
    );
  }

  // If user is not signed in, show auth views
  if (!user) {
    return (
      <div className="App">
        <header className="app-header no-border">
          <div className="header-content">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Logo" className="header-logo" />
          </div>
        </header>

        <Notification 
          notification={notification} 
          onClose={() => setNotification(null)} 
        />

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
                  <HiCheck size={20} style={{ display: 'inline-block', marginRight: '8px' }} /> Submit Another Offer
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
