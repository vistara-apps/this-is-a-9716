import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Header from './components/Header';
import Hero from './components/Hero';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import { UserProvider, useUser } from './context/UserContext';
import { RecommendationProvider } from './context/RecommendationContext';

function AppContent() {
  const { user, loading } = useUser();
  const [currentView, setCurrentView] = useState('hero'); // hero, onboarding, dashboard
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('hero');
      }
    }
  }, [user, loading]);

  const handleStartOnboarding = () => {
    setCurrentView('onboarding');
  };

  const handleOnboardingComplete = (userData) => {
    setCurrentView('dashboard');
  };

  const handleBackToHero = () => {
    setCurrentView('hero');
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading CineMatch AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary">
      <Header 
        currentView={currentView} 
        onBackToHero={handleBackToHero}
        onShowProfile={handleShowProfile}
        user={user}
      />
      
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {currentView === 'hero' && (
          <Hero onStartOnboarding={handleStartOnboarding} />
        )}
        
        {currentView === 'onboarding' && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}
        
        {currentView === 'dashboard' && user && (
          <Dashboard user={user} />
        )}
      </main>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={handleCloseProfile} />
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <RecommendationProvider>
        <AppContent />
      </RecommendationProvider>
    </UserProvider>
  );
}

export default App;
