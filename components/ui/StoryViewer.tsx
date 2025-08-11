import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
  ActivityIndicator,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Volume2, VolumeX } from 'lucide-react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Story {
  id: string;
  url: string;
  type: 'image' | 'video';
  user: User;
}

interface StoryViewerProps {
  visible: boolean;
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  onStoryComplete?: (storyId: string) => void;
  onLikeStory?: (storyId: string) => void;
  onReplyToStory?: (storyId: string, message: string) => void;
}

const Colors = {
  dark: { primary: '#007AFF' },
};

export const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  stories,
  initialStoryIndex,
  onClose,
  onStoryComplete,
  onLikeStory,
  onReplyToStory,
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showActions, setShowActions] = useState(true); // Changed to true by default
  const [isLiked, setIsLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList<Story>>(null);

  const currentStory = stories[currentStoryIndex];

  useEffect(() => {
    const configureAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
        });
      } catch (error) {
        console.log('Failed to configure audio session:', error);
      }
    };

    if (visible) {
      configureAudioSession();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setCurrentStoryIndex(initialStoryIndex);
      resetStoryState(initialStoryIndex);
      // Use setTimeout to ensure the FlatList is rendered before scrolling
      setTimeout(() => {
        if (flatListRef.current && initialStoryIndex > 0) {
          flatListRef.current.scrollToIndex({
            index: initialStoryIndex,
            animated: false,
          });
        }
      }, 100); // Small delay to ensure proper rendering
    }
  }, [visible, initialStoryIndex]);

  useEffect(() => {
    if (!visible || !currentStory) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    setProgress(0);

    if (currentStory.type === 'image' && !isPaused && !isLoading) {
      const duration = 5000;
      const interval = 50;

      timerRef.current = setTimeout(() => {
        handleNext();
      }, duration);

      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + interval / duration;
          return newProgress >= 1 ? 1 : newProgress;
        });
      }, interval);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentStoryIndex, isPaused, visible, isLoading, currentStory]);

  const handleVideoPlaybackStatusUpdate = (status: AVPlaybackStatus, storyId: string) => {
    if (!status.isLoaded) {
      if (isLoading === false) setIsLoading(true);
      return;
    }

    if (stories[currentStoryIndex]?.id !== storyId) return;

    if (isLoading === true) setIsLoading(false);

    if (status.durationMillis && status.positionMillis) {
      const newProgress = status.positionMillis / status.durationMillis;
      setProgress(newProgress);
    }

    if (status.didJustFinish) {
      if (onStoryComplete) {
        onStoryComplete(storyId);
      }
      handleNext();
    }
  };

  const resetStoryState = (storyIndex: number) => {
    const newStory = stories[storyIndex];
    const shouldShowLoading =
      newStory?.type === 'video' || (newStory?.type === 'image' && !loadedImages.has(newStory.url));

    setIsLoading(shouldShowLoading);
    setIsPaused(false);
    setShowActions(true); // Keep actions visible
    setProgress(0);
    setIsLiked(false);
    setShowReplyInput(false);
    setReplyText('');
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentStoryIndex(nextIndex);
      resetStoryState(nextIndex);
    } else {
      onClose();
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      videoRefs.current[currentStory.id]?.playAsync();
    } else {
      videoRefs.current[currentStory.id]?.pauseAsync();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1;
      flatListRef.current?.scrollToIndex({
        index: prevIndex,
        animated: true,
      });
      setCurrentStoryIndex(prevIndex);
      resetStoryState(prevIndex);
    }
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl));
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    Alert.alert('Error', 'Failed to load image');
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    if (onLikeStory) {
      onLikeStory(currentStory.id);
    }
  };

  const handleReply = () => {
    setShowReplyInput(true);
    setIsPaused(true);
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      if (onReplyToStory) {
        onReplyToStory(currentStory.id, replyText.trim());
      }
      setReplyText('');
      setShowReplyInput(false);
      setIsPaused(false);
    }
  };
    
  const renderStoryContent = ({ item, index }: { item: Story; index: number }) => {
    const isCurrentStory = index === currentStoryIndex;
      
    return (
      <View style={styles.storyContainer}>
        {item.type === 'video' ? (
          <Video
            ref={(ref) => {
              videoRefs.current[item.id] = ref;
            }}
            source={{ uri: item.url }}
            style={styles.mediaContent}
            resizeMode={ResizeMode.CONTAIN} // Changed from COVER to CONTAIN to prevent excessive zoom
            shouldPlay={isCurrentStory && !isPaused && visible}
            isLooping={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={(status) =>
              handleVideoPlaybackStatusUpdate(status, item.id)
            }
            useNativeControls={false}
            onError={(error) => {
              console.log('Video error:', error);
              if (isCurrentStory) {
                setIsLoading(false);
              }
              Alert.alert('Error', 'Failed to load video');
            }}
          />
        ) : (
          <Image
            source={{ uri: item.url }}
            style={styles.mediaContent}
            onLoad={() => handleImageLoad(item.url)}
            onError={handleImageError}
            resizeMode="contain" // Changed from contain to fit properly
          />
        )}
          
        {/* Loading overlay for current story */}
        {isLoading && isCurrentStory && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              {item.type === 'video' ? 'Loading video...' : 'Loading image...'}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, idx) => (
            <View key={idx} style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      idx < currentStoryIndex
                        ? '100%'
                        : idx === currentStoryIndex
                        ? `${progress * 100}%`
                        : '0%',
                    opacity: idx <= currentStoryIndex ? 1 : 0.3,
                  },
                ]}
              />
            </View>
          ))}
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: currentStory.user.avatar }}
              style={styles.userAvatar}
            />
            <Text style={styles.userName}>{currentStory.user.name}</Text>
          </View>
          {currentStory.type === 'video' && (
            <TouchableOpacity onPress={handleToggleMute} style={styles.muteButton}>
              {isMuted ? (
                <VolumeX size={20} color="#fff" />
              ) : (
                <Volume2 size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stories FlatList */}
        <FlatList
          ref={flatListRef}
          data={stories}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderStoryContent}
          getItemLayout={(_, idx) => ({
            length: screenWidth,
            offset: screenWidth * idx,
            index: idx,
          })}
          onMomentumScrollEnd={({ nativeEvent }) => {
            const newIndex = Math.round(nativeEvent.contentOffset.x / screenWidth);
            if (newIndex !== currentStoryIndex) {
              setCurrentStoryIndex(newIndex);
              resetStoryState(newIndex);
            }
          }}
          scrollEventThrottle={16}
        />
        
        {/* Overlay for tap navigation */}
        <View style={styles.overlayNavigation}>
          <TouchableOpacity
            style={styles.navTapArea}
            onPress={handlePrevious}
            disabled={currentStoryIndex === 0 || isPaused || showReplyInput}
            activeOpacity={0}
          />
          <TouchableOpacity
            style={styles.navTapArea}
            onPress={handleNext}
            disabled={isPaused || showReplyInput}
            activeOpacity={0}
          />
        </View>

        {/* Actions Overlay - Now always visible when showActions is true */}
        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Heart
                size={24}
                color={isLiked ? '#ff3040' : '#fff'}
                fill={isLiked ? '#ff3040' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <MessageCircle size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handlePause}>
              <Text style={styles.actionText}>{isPaused ? '▶️' : '⏸️'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Reply to story..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: replyText.trim() ? 1 : 0.5 },
              ]}
              onPress={handleSendReply}
              disabled={!replyText.trim()}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Pause Indicator */}
        {isPaused && (
          <View style={styles.pauseIndicator}>
            <Text style={styles.pauseText}>⏸️</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  muteButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  progressContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  storyContainer: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000',
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  mediaContent: {
    width: "100%",
    height: "100%",
  },
  overlayNavigation: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  navTapArea: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 8,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 12,
    flexDirection: 'column',
    gap: 16,
    zIndex: 15, // Increased z-index to ensure visibility
  },
  actionButton: {
    padding: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 20,
  },
  replyContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 15, // Increased z-index to ensure visibility
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 80,
    paddingRight: 12,
  },
  sendButton: {
    padding: 8,
    backgroundColor: Colors.dark.primary,
    borderRadius: 20,
    marginLeft: 8,
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pauseText: {
    fontSize: 24,
  },
});