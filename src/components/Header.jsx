import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Film, Settings, User, Crown } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Header = ({ currentView, onBackToHero, onShowProfile }) => {
  const { user, isPremium } = useUser();

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-800">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={onBackToHero}
          >
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">CineMatch AI</h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {user && currentView === 'dashboard' && (
              <>
                {/* Premium Badge */}
                {isPremium && (
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                    <Crown className="w-4 h-4" />
                    <span>Premium</span>
                  </div>
                )}
                
                {/* User Info */}
                <button
                  onClick={onShowProfile}
                  className="flex items-center space-x-2 text-sm text-dark-text-secondary hover:text-dark-text-primary transition-colors p-2 rounded-lg hover:bg-gray-800"
                >
                  <User className="w-4 h-4" />
                  <span>{user.email || 'Profile'}</span>
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
            
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
