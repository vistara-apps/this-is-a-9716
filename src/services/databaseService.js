import { supabase, TABLES, PREFERENCE_TYPES, INTERACTION_TYPES } from '../config/supabase';

/**
 * User Management Service
 */
export const userService = {
  // Create or update user profile
  async upsertUser(userData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .upsert({
          user_id: userData.userId,
          email: userData.email,
          preferences: userData.preferences || {},
          watch_history: userData.watchHistory || [],
          liked_content: userData.likedContent || [],
          disliked_content: userData.dislikedContent || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Update user preferences
  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  // Add to watch history
  async addToWatchHistory(userId, contentId) {
    try {
      const user = await this.getUser(userId);
      const watchHistory = user?.watch_history || [];
      
      // Add to beginning and limit to 100 items
      const updatedHistory = [contentId, ...watchHistory.filter(id => id !== contentId)].slice(0, 100);

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          watch_history: updatedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding to watch history:', error);
      throw error;
    }
  }
};

/**
 * Content Management Service
 */
export const contentService = {
  // Add content to database
  async addContent(contentData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTENT)
        .upsert({
          content_id: contentData.contentId,
          title: contentData.title,
          description: contentData.description,
          genre: contentData.genre || [],
          release_date: contentData.releaseDate,
          duration: contentData.duration,
          streaming_platforms: contentData.streamingPlatforms || [],
          keywords: contentData.keywords || [],
          mood_tags: contentData.moodTags || [],
          rating: contentData.rating,
          poster_url: contentData.posterUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding content:', error);
      throw error;
    }
  },

  // Search content
  async searchContent(query, filters = {}) {
    try {
      let queryBuilder = supabase
        .from(TABLES.CONTENT)
        .select('*');

      // Apply text search
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${query}}`);
      }

      // Apply genre filter
      if (filters.genre) {
        queryBuilder = queryBuilder.contains('genre', [filters.genre]);
      }

      // Apply mood filter
      if (filters.mood) {
        queryBuilder = queryBuilder.contains('mood_tags', [filters.mood]);
      }

      // Apply duration filter
      if (filters.time) {
        // This would need more complex logic based on time preferences
        // For now, we'll implement basic duration filtering
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }
};

/**
 * User Preferences Service
 */
export const preferencesService = {
  // Record user preference
  async recordPreference(userId, contentId, preferenceType, score = 1) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PREFERENCES)
        .upsert({
          user_id: userId,
          content_id: contentId,
          preference_type: preferenceType,
          score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording preference:', error);
      throw error;
    }
  },

  // Get user preferences
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PREFERENCES)
        .select(`
          *,
          content:content_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  },

  // Get preference analytics for AI recommendations
  async getPreferenceAnalytics(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Analyze preferences to extract patterns
      const genrePreferences = {};
      const moodPreferences = {};
      const likedContent = [];
      const dislikedContent = [];

      preferences.forEach(pref => {
        if (pref.preference_type === PREFERENCE_TYPES.LIKE) {
          likedContent.push(pref.content);
          if (pref.content?.genre) {
            pref.content.genre.forEach(genre => {
              genrePreferences[genre] = (genrePreferences[genre] || 0) + pref.score;
            });
          }
          if (pref.content?.mood_tags) {
            pref.content.mood_tags.forEach(mood => {
              moodPreferences[mood] = (moodPreferences[mood] || 0) + pref.score;
            });
          }
        } else if (pref.preference_type === PREFERENCE_TYPES.DISLIKE) {
          dislikedContent.push(pref.content);
          if (pref.content?.genre) {
            pref.content.genre.forEach(genre => {
              genrePreferences[genre] = (genrePreferences[genre] || 0) - pref.score;
            });
          }
        }
      });

      return {
        genrePreferences,
        moodPreferences,
        likedContent,
        dislikedContent,
        totalInteractions: preferences.length
      };
    } catch (error) {
      console.error('Error getting preference analytics:', error);
      throw error;
    }
  }
};

/**
 * User Interactions Service
 */
export const interactionsService = {
  // Record user interaction
  async recordInteraction(userId, contentId, interactionType, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_INTERACTIONS)
        .insert({
          user_id: userId,
          content_id: contentId,
          interaction_type: interactionType,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording interaction:', error);
      throw error;
    }
  },

  // Get user interactions
  async getUserInteractions(userId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_INTERACTIONS)
        .select(`
          *,
          content:content_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user interactions:', error);
      throw error;
    }
  }
};

/**
 * Subscription Management Service
 */
export const subscriptionService = {
  // Create or update subscription
  async upsertSubscription(userId, subscriptionData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .upsert({
          user_id: userId,
          stripe_customer_id: subscriptionData.stripeCustomerId,
          stripe_subscription_id: subscriptionData.stripeSubscriptionId,
          status: subscriptionData.status,
          plan_id: subscriptionData.planId,
          current_period_start: subscriptionData.currentPeriodStart,
          current_period_end: subscriptionData.currentPeriodEnd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  },

  // Get user subscription
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  },

  // Check if user has active subscription
  async hasActiveSubscription(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      
      return subscription.status === 'active' && periodEnd > now;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
};
