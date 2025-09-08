import React, { useState, useEffect } from 'react';
import { Heart, X, Bookmark, Star, Clock, Calendar, Play, Crown, ThumbsDown, ExternalLink } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useRecommendations } from '../hooks/useRecommendations';

const RecommendationCard = ({ item, isPremium, variant = 'default' }) => {
  const { user, isPremium: userIsPremium, addToWatchHistory } = useUser();
  const { likeRecommendation, dislikeRecommendation, saveRecommendation, recordView } = useRecommendations();
  
  const [isLiked, setIsLiked] = useState(item.userLiked || false);
  const [isDisliked, setIsDisliked] = useState(item.userDisliked || false);
  const [isSaved, setIsSaved] = useState(item.userSaved || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(item.userLiked || false);
    setIsDisliked(item.userDisliked || false);
    setIsSaved(item.userSaved || false);
  }, [item]);

  const handleLike = async () => {
    if (!user?.user_id && !user?.userId) return;
    
    setIsLoading(true);
    try {
      const userId = user.user_id || user.userId;
      await likeRecommendation(userId, item);
      setIsLiked(true);
      setIsDisliked(false);
    } catch (error) {
      console.error('Error liking recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user?.user_id && !user?.userId) return;
    
    setIsLoading(true);
    try {
      const userId = user.user_id || user.userId;
      await dislikeRecommendation(userId, item);
      setIsDisliked(true);
      setIsLiked(false);
    } catch (error) {
      console.error('Error disliking recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.user_id && !user?.userId) return;
    
    setIsLoading(true);
    try {
      const userId = user.user_id || user.userId;
      await saveRecommendation(userId, item);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async () => {
    if (user?.user_id || user?.userId) {
      const userId = user.user_id || user.userId;
      await recordView(userId, item.contentId);
      await addToWatchHistory(item.contentId);
    }
    
    // Here you could open a modal or navigate to a detail page
    console.log('View details for:', item.title);
  };

  const isCompact = variant === 'compact';

  return (
    <div className="card overflow-hidden group hover:scale-105 transition-transform duration-200">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
        {item.posterUrl ? (
          <img 
            src={item.posterUrl} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-gray-600" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`p-2 rounded-full backdrop-blur-md ${
              isLiked ? 'bg-green-500 text-white' : 'bg-black/50 text-white hover:bg-green-500'
            } transition-colors duration-200 disabled:opacity-50`}
          >
            <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`p-2 rounded-full backdrop-blur-md ${
              isSaved ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-blue-500'
            } transition-colors duration-200 disabled:opacity-50`}
          >
            <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleDislike}
            disabled={isLoading}
            className={`p-2 rounded-full backdrop-blur-md ${
              isDisliked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-red-500'
            } transition-colors duration-200 disabled:opacity-50`}
          >
            <ThumbsDown className="w-4 h-4" fill={isDisliked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/70 text-yellow-400 px-2 py-1 rounded-full text-sm">
            <Star className="w-3 h-3" fill="currentColor" />
            <span>{item.rating}</span>
          </div>
        )}

        {/* Premium Badge */}
        {userIsPremium && item.isPremiumRecommendation && (
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span>Premium</span>
          </div>
        )}
        
        {/* Free user viewing premium content */}
        {!userIsPremium && item.isPremiumRecommendation && (
          <div className="absolute bottom-2 left-2 bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Crown className="w-3 h-3" />
            <span>Premium</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
        
        {/* Metadata */}
        <div className="flex items-center space-x-4 text-sm text-dark-text-secondary mb-3">
          {item.year && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{item.year}</span>
            </div>
          )}
          {item.duration && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{item.duration}</span>
            </div>
          )}
        </div>

        {/* Genres */}
        {item.genres && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.genres.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-800 text-xs rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-dark-text-secondary line-clamp-3 mb-3">
          {item.description}
        </p>

        {/* Streaming Platforms */}
        {item.streamingPlatforms && item.streamingPlatforms.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-dark-text-secondary">Available on:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.streamingPlatforms.slice(0, 3).map((platform, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                >
                  {platform}
                </span>
              ))}
              {item.streamingPlatforms.length > 3 && (
                <span className="px-2 py-1 bg-gray-800 text-xs rounded-full">
                  +{item.streamingPlatforms.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Match Score */}
        {item.matchScore && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-dark-text-secondary">AI Match:</span>
              <div className="flex items-center space-x-1">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                    style={{ width: `${item.matchScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-primary">{item.matchScore}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          {!userIsPremium && item.isPremiumRecommendation ? (
            <button className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1">
              <Crown className="w-4 h-4" />
              <span>Upgrade to View</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleDislike}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 ${
                  isDisliked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm">Pass</span>
              </button>
              <button 
                onClick={handleViewDetails}
                className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Details</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
