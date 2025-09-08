import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import RecommendationCard from './RecommendationCard';
import FilterBar from './FilterBar';
import { useRecommendations } from '../hooks/useRecommendations';
import { usePaymentContext } from '../hooks/usePaymentContext';
import { useUser } from '../context/UserContext';
import { Sparkles, Crown, Loader, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user, isPremium } = useUser();
  const [filters, setFilters] = useState({
    mood: '',
    time: '',
    genre: '',
    search: ''
  });
  const { recommendations, loading, generateRecommendations, error } = useRecommendations();
  const { createMockSubscription, paymentLoading } = usePaymentContext();

  useEffect(() => {
    if (user) {
      // Generate initial recommendations with user ID for personalization
      const userId = user.user_id || user.userId;
      generateRecommendations(user.preferences || {}, filters, isPremium, userId);
    }
  }, [user, isPremium]);

  const handleUpgrade = async () => {
    try {
      await createMockSubscription('premium');
      // Recommendations will be regenerated automatically when isPremium changes
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    if (user) {
      const userId = user.user_id || user.userId;
      generateRecommendations(user.preferences || {}, newFilters, isPremium, userId);
    }
  };

  const handleRefresh = () => {
    if (user) {
      const userId = user.user_id || user.userId;
      generateRecommendations(user.preferences || {}, filters, isPremium, userId);
    }
  };

  if (!user) {
    return (
      <div className="py-8 text-center">
        <p className="text-dark-text-secondary">Please complete onboarding to see recommendations.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user.email?.split('@')[0] || 'there'}!
            </h1>
            <p className="text-dark-text-secondary">
              Here are your personalized recommendations
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-2 btn-secondary disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            {!isPremium && (
              <button
                onClick={handleUpgrade}
                disabled={paymentLoading}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                <span>{paymentLoading ? 'Processing...' : 'Upgrade to Premium'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchBar
            value={filters.search}
            onChange={(search) => handleFiltersChange({ ...filters, search })}
            placeholder="Search for movies, shows, or describe what you want to watch..."
          />
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            isPremium={isPremium}
          />
        </div>
      </div>

      {/* Premium Banner */}
      {isPremium && (
        <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center space-x-2 text-yellow-400">
            <Crown className="w-5 h-5" />
            <span className="font-medium">Premium Active</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-sm text-dark-text-secondary mt-1">
            Enjoying advanced AI recommendations and curated lists
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {isPremium ? 'Premium AI Recommendations' : 'AI Recommendations'}
          </h2>
          {loading && <Loader className="w-4 h-4 animate-spin text-primary" />}
        </div>

        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-red-400">Error Loading Recommendations</h3>
            <p className="text-dark-text-secondary mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((item, index) => (
              <RecommendationCard
                key={item.contentId || index}
                item={item}
                isPremium={isPremium}
              />
            ))}
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
            <p className="text-dark-text-secondary mb-4">
              Try adjusting your filters or search terms, or complete your profile preferences
            </p>
            <button
              onClick={handleRefresh}
              className="btn-primary"
            >
              Generate Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
