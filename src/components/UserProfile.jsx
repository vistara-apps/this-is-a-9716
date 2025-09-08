import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { usePaymentContext } from '../hooks/usePaymentContext';
import { preferencesService, interactionsService } from '../services/databaseService';
import { SUBSCRIPTION_PLANS } from '../services/stripeService';
import { 
  User, 
  Settings, 
  Crown, 
  Heart, 
  ThumbsDown, 
  Bookmark, 
  Clock, 
  CreditCard,
  Edit3,
  Save,
  X
} from 'lucide-react';

const UserProfile = ({ onClose }) => {
  const { user, subscription, isPremium, updatePreferences, logout } = useUser();
  const { createMockSubscription, manageSubscription, cancelSubscription, paymentLoading } = usePaymentContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState({});
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEditedPreferences(user.preferences || {});
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    try {
      const [preferences, interactions] = await Promise.all([
        preferencesService.getUserPreferences(user.user_id),
        interactionsService.getUserInteractions(user.user_id, 50)
      ]);

      const stats = {
        totalLikes: preferences.filter(p => p.preference_type === 'like').length,
        totalDislikes: preferences.filter(p => p.preference_type === 'dislike').length,
        totalSaved: preferences.filter(p => p.preference_type === 'save').length,
        totalInteractions: interactions.length,
        recentActivity: interactions.slice(0, 10)
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(editedPreferences);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      await createMockSubscription('premium');
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await manageSubscription();
    } catch (error) {
      console.error('Error managing subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await cancelSubscription();
      } catch (error) {
        console.error('Error canceling subscription:', error);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              <p className="text-dark-text-secondary text-sm">
                {user.email || 'Anonymous User'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Subscription Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Subscription</span>
            </h3>
            
            {isPremium ? (
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-yellow-400 mb-1">
                      <Crown className="w-4 h-4" />
                      <span className="font-medium">Premium Active</span>
                    </div>
                    <p className="text-sm text-dark-text-secondary">
                      {subscription?.current_period_end && 
                        `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleManageSubscription}
                      className="btn-secondary text-sm"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Manage
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                      disabled={paymentLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">Free Plan</h4>
                    <p className="text-sm text-dark-text-secondary">
                      Basic AI recommendations
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                    disabled={paymentLoading}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade - ${SUBSCRIPTION_PLANS.PREMIUM.price}/mo
                  </button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-sm text-dark-text-secondary mb-2">Premium features:</p>
                  <ul className="text-sm text-dark-text-secondary space-y-1">
                    {SUBSCRIPTION_PLANS.PREMIUM.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Activity Stats</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 text-green-400 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">Liked</span>
                  </div>
                  <p className="text-xl font-bold">{userStats.totalLikes}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 text-red-400 mb-1">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Disliked</span>
                  </div>
                  <p className="text-xl font-bold">{userStats.totalDislikes}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 text-blue-400 mb-1">
                    <Bookmark className="w-4 h-4" />
                    <span className="text-sm font-medium">Saved</span>
                  </div>
                  <p className="text-xl font-bold">{userStats.totalSaved}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 text-purple-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-xl font-bold">{userStats.totalInteractions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preferences</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary text-sm"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </>
                )}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Favorite Genres</label>
                  <input
                    type="text"
                    value={editedPreferences.genres?.join(', ') || ''}
                    onChange={(e) => setEditedPreferences({
                      ...editedPreferences,
                      genres: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                    })}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                    placeholder="Action, Comedy, Drama..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Moods</label>
                  <input
                    type="text"
                    value={editedPreferences.moods?.join(', ') || ''}
                    onChange={(e) => setEditedPreferences({
                      ...editedPreferences,
                      moods: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                    })}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                    placeholder="Feel-good, Suspenseful, Romantic..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Time Preferences</label>
                  <input
                    type="text"
                    value={editedPreferences.timePreferences?.join(', ') || ''}
                    onChange={(e) => setEditedPreferences({
                      ...editedPreferences,
                      timePreferences: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
                    placeholder="Under 30 minutes, 1-2 hours, Binge-worthy..."
                  />
                </div>
                
                <button
                  onClick={handleSavePreferences}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-dark-text-secondary">Genres:</span>
                  <p className="text-sm">{user.preferences?.genres?.join(', ') || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-dark-text-secondary">Moods:</span>
                  <p className="text-sm">{user.preferences?.moods?.join(', ') || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-dark-text-secondary">Time:</span>
                  <p className="text-sm">{user.preferences?.timePreferences?.join(', ') || 'Not set'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={logout}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
