import { useState } from 'react';
import { useRecommendationContext } from '../context/RecommendationContext';
import { generateAIRecommendations } from '../services/aiService';
import { preferencesService, interactionsService } from '../services/databaseService';
import { PREFERENCE_TYPES, INTERACTION_TYPES } from '../config/supabase';

export const useRecommendations = () => {
  const { recommendations, setRecommendations, loading, setLoading } = useRecommendationContext();
  const [error, setError] = useState(null);

  const generateRecommendations = async (userPreferences, filters, isPremium = false, userId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const aiRecommendations = await generateAIRecommendations(
        userPreferences, 
        filters, 
        isPremium, 
        userId
      );
      setRecommendations(aiRecommendations);
    } catch (aiError) {
      console.error('Failed to generate recommendations:', aiError);
      setError('Failed to generate recommendations. Please try again.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const recordPreference = async (userId, contentId, preferenceType, score = 1) => {
    if (!userId || !contentId) return;
    
    try {
      await preferencesService.recordPreference(userId, contentId, preferenceType, score);
      
      // Also record as interaction
      await interactionsService.recordInteraction(
        userId, 
        contentId, 
        preferenceType === PREFERENCE_TYPES.LIKE ? INTERACTION_TYPES.LIKE : INTERACTION_TYPES.DISLIKE,
        { score }
      );
    } catch (error) {
      console.error('Error recording preference:', error);
    }
  };

  const likeRecommendation = async (userId, recommendation) => {
    await recordPreference(userId, recommendation.contentId, PREFERENCE_TYPES.LIKE, 1);
    
    // Update local state to reflect the like
    setRecommendations(prev => 
      prev.map(rec => 
        rec.contentId === recommendation.contentId 
          ? { ...rec, userLiked: true, userDisliked: false }
          : rec
      )
    );
  };

  const dislikeRecommendation = async (userId, recommendation) => {
    await recordPreference(userId, recommendation.contentId, PREFERENCE_TYPES.DISLIKE, 1);
    
    // Update local state to reflect the dislike
    setRecommendations(prev => 
      prev.map(rec => 
        rec.contentId === recommendation.contentId 
          ? { ...rec, userLiked: false, userDisliked: true }
          : rec
      )
    );
  };

  const saveRecommendation = async (userId, recommendation) => {
    await recordPreference(userId, recommendation.contentId, PREFERENCE_TYPES.SAVE, 1);
    
    // Update local state to reflect the save
    setRecommendations(prev => 
      prev.map(rec => 
        rec.contentId === recommendation.contentId 
          ? { ...rec, userSaved: true }
          : rec
      )
    );
  };

  const recordView = async (userId, contentId) => {
    if (!userId || !contentId) return;
    
    try {
      await interactionsService.recordInteraction(
        userId, 
        contentId, 
        INTERACTION_TYPES.VIEW,
        { timestamp: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
    setError(null);
  };

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
    likeRecommendation,
    dislikeRecommendation,
    saveRecommendation,
    recordView,
    clearRecommendations
  };
};
