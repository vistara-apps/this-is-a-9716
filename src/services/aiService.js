import OpenAI from 'openai';
import { preferencesService, contentService, interactionsService } from './databaseService';
import { getMockRecommendations } from '../data/mockData';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || 'demo-key',
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
});

export const generateAIRecommendations = async (userPreferences, filters, isPremium = false, userId = null) => {
  try {
    // Get user's preference analytics if userId is provided
    let preferenceAnalytics = null;
    if (userId) {
      try {
        preferenceAnalytics = await preferencesService.getPreferenceAnalytics(userId);
      } catch (error) {
        console.warn('Could not fetch preference analytics:', error);
      }
    }

    // Try to get AI recommendations first
    let recommendations = [];
    try {
      const prompt = createRecommendationPrompt(userPreferences, filters, isPremium, preferenceAnalytics);
      
      const completion = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "You are CineMatch AI, an expert movie and TV show recommendation engine. Generate personalized recommendations based on user preferences and interaction history. Always respond with valid JSON containing an array of recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from AI');

      // Parse the JSON response
      const aiRecommendations = JSON.parse(response);
      
      // Validate and format the recommendations
      recommendations = aiRecommendations.map(item => ({
        contentId: generateContentId(item.title, item.year),
        title: item.title || 'Unknown Title',
        description: item.description || 'No description available',
        year: item.year || null,
        duration: item.duration || null,
        genres: item.genres || [],
        rating: item.rating || null,
        matchScore: item.matchScore || Math.floor(Math.random() * 30) + 70,
        posterUrl: item.posterUrl || null,
        isPremiumRecommendation: isPremium && item.isPremiumRecommendation,
        streamingPlatforms: item.streamingPlatforms || [],
        keywords: extractKeywords(item.title, item.description, item.genres),
        moodTags: item.moodTags || []
      }));

      // Store content in database for future reference
      if (userId) {
        await Promise.all(recommendations.map(async (rec) => {
          try {
            await contentService.addContent({
              contentId: rec.contentId,
              title: rec.title,
              description: rec.description,
              genre: rec.genres,
              releaseDate: rec.year ? `${rec.year}-01-01` : null,
              duration: rec.duration,
              streamingPlatforms: rec.streamingPlatforms,
              keywords: rec.keywords,
              moodTags: rec.moodTags,
              rating: rec.rating,
              posterUrl: rec.posterUrl
            });
          } catch (error) {
            // Content might already exist, ignore error
            console.debug('Content already exists or error storing:', error);
          }
        }));
      }
      
    } catch (error) {
      console.warn('AI recommendation failed, falling back to mock data:', error);
      // Fallback to mock recommendations
      recommendations = getMockRecommendations(userPreferences, filters, isPremium);
    }

    // Record interaction if userId is provided
    if (userId && recommendations.length > 0) {
      try {
        await interactionsService.recordInteraction(
          userId,
          'recommendation_request',
          'view',
          {
            filters,
            recommendationCount: recommendations.length,
            isPremium
          }
        );
      } catch (error) {
        console.warn('Could not record interaction:', error);
      }
    }

    return recommendations;
    
  } catch (error) {
    console.error('AI recommendation failed:', error);
    // Final fallback to mock data
    return getMockRecommendations(userPreferences, filters, isPremium);
  }
};

// Generate a unique content ID based on title and year
const generateContentId = (title, year) => {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${cleanTitle}-${year || 'unknown'}`;
};

// Extract keywords from title, description, and genres
const extractKeywords = (title, description, genres) => {
  const keywords = new Set();
  
  // Add genres as keywords
  genres.forEach(genre => keywords.add(genre.toLowerCase()));
  
  // Extract keywords from title
  const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  titleWords.forEach(word => keywords.add(word));
  
  // Extract keywords from description (first 100 chars)
  const descWords = description.toLowerCase().substring(0, 100).split(/\s+/).filter(word => word.length > 4);
  descWords.slice(0, 5).forEach(word => keywords.add(word)); // Limit to 5 words
  
  return Array.from(keywords);
};

const createRecommendationPrompt = (userPreferences, filters, isPremium, preferenceAnalytics = null) => {
  let prompt = `Generate 6 movie and TV show recommendations for a user with these preferences:

User Preferences:
- Favorite Genres: ${userPreferences.genres?.join(', ') || 'Various'}
- Preferred Moods: ${userPreferences.moods?.join(', ') || 'Various'}
- Time Preferences: ${userPreferences.timePreferences?.join(', ') || 'Any'}

Current Filters:
- Mood: ${filters.mood || 'Any'}
- Time: ${filters.time || 'Any'}
- Genre: ${filters.genre || 'Any'}
- Search: ${filters.search || 'None'}`;

  // Add preference analytics if available
  if (preferenceAnalytics && preferenceAnalytics.totalInteractions > 0) {
    prompt += `

User Interaction History:
- Total Interactions: ${preferenceAnalytics.totalInteractions}
- Top Liked Genres: ${Object.entries(preferenceAnalytics.genrePreferences)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([genre, _]) => genre)
      .join(', ') || 'None'}
- Preferred Moods: ${Object.entries(preferenceAnalytics.moodPreferences)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([mood, _]) => mood)
      .join(', ') || 'None'}
- Recently Liked Content: ${preferenceAnalytics.likedContent
      .slice(0, 3)
      .map(content => content?.title)
      .filter(Boolean)
      .join(', ') || 'None'}

IMPORTANT: Use this interaction history to provide more personalized recommendations that align with the user's demonstrated preferences.`;
  }

  prompt += `

${isPremium ? `
This is a PREMIUM user, so provide:
- More niche and sophisticated recommendations
- Hidden gems and critically acclaimed content
- International and indie films/shows
- Detailed analysis of why each recommendation matches their taste
- Higher quality, curated suggestions
- Content from smaller streaming platforms or film festivals
` : `
This is a FREE user, so provide:
- Popular and mainstream recommendations
- Well-known titles from major streaming platforms
- Accessible content that's easy to find
- Mix of recent releases and established favorites
`}

Return a JSON array of 6 recommendations with this exact structure:
[
  {
    "title": "Movie/Show Title",
    "description": "Brief engaging description (2-3 sentences)",
    "year": 2023,
    "duration": "1h 45m" or "45m/episode",
    "genres": ["Genre1", "Genre2"],
    "rating": 8.5,
    "matchScore": 85,
    "posterUrl": null,
    "isPremiumRecommendation": ${isPremium},
    "streamingPlatforms": ["Netflix", "Hulu"],
    "moodTags": ["feel-good", "suspenseful"]
  }
]

Focus on variety and ensure each recommendation genuinely matches the user's stated preferences and interaction history. Make the match scores realistic (70-95 range) based on how well each recommendation aligns with their preferences.`;

  return prompt;
};
