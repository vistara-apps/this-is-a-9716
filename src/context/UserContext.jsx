import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService, subscriptionService } from '../services/databaseService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // Check for existing user session
      const savedUser = localStorage.getItem('cinematch_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Check subscription status
        await checkSubscriptionStatus(userData.userId);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async (userId) => {
    try {
      const hasActive = await subscriptionService.hasActiveSubscription(userId);
      setIsPremium(hasActive);
      
      if (hasActive) {
        const subscriptionData = await subscriptionService.getUserSubscription(userId);
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsPremium(false);
    }
  };

  const updateUser = async (userData) => {
    try {
      // Save to database
      const updatedUser = await userService.upsertUser(userData);
      
      // Update local state
      setUser(updatedUser);
      localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
      
      // Check subscription status
      if (updatedUser.user_id) {
        await checkSubscriptionStatus(updatedUser.user_id);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      // Fallback to local storage only
      setUser(userData);
      localStorage.setItem('cinematch_user', JSON.stringify(userData));
      return userData;
    }
  };

  const updatePreferences = async (preferences) => {
    if (!user?.user_id) {
      // Fallback for users without database ID
      const updatedUser = { ...user, preferences };
      setUser(updatedUser);
      localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    try {
      const updatedUser = await userService.updatePreferences(user.user_id, preferences);
      setUser(updatedUser);
      localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Fallback to local update
      const updatedUser = { ...user, preferences };
      setUser(updatedUser);
      localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
  };

  const addToWatchHistory = async (contentId) => {
    if (!user?.user_id) return;
    
    try {
      const updatedUser = await userService.addToWatchHistory(user.user_id, contentId);
      setUser(updatedUser);
      localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  };

  const refreshSubscription = async () => {
    if (!user?.user_id) return;
    await checkSubscriptionStatus(user.user_id);
  };

  const logout = () => {
    setUser(null);
    setSubscription(null);
    setIsPremium(false);
    localStorage.removeItem('cinematch_user');
  };

  return (
    <UserContext.Provider value={{
      user,
      subscription,
      isPremium,
      loading,
      setUser: updateUser,
      updatePreferences,
      addToWatchHistory,
      refreshSubscription,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
