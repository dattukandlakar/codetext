import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import StoryCircle from '@/components/ui/StoryCircle';
import StoryUploadModal from '@/components/ui/StoryUploadModal';
import { Story } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';

interface StoriesSectionProps {
  stories: Story[];
  onStoryPress: (storyId: string, userStories: Story[], storyIndex: number) => void;
  onAddStory: () => void;
  userStories: Story[];
  fetchedStories: Story[];
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
  stories,
  onStoryPress,
  onAddStory,
  userStories,
  fetchedStories = [],
}) => {
  const { user } = useAuthStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'camera' | 'view'>('camera');

  const [isAddingNew, setIsAddingNew] = useState(false); // Track if we're adding a new story

  const safeStories = Array.isArray(stories) ? stories : [];
  const safeFetchedStories = Array.isArray(fetchedStories) ? fetchedStories : [];
  const safeUserStories = Array.isArray(userStories) ? userStories : [];

  const allStories = [...safeStories, ...safeFetchedStories];

  const otherUserStories = allStories.filter(story =>
    story?.user?.id && user?.id && story.user.id !== user.id
  );

  const groupedStories = otherUserStories.reduce((acc, story) => {
    const userId = story.user?.id;
    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const handleUserStoryPress = () => {
    setIsAddingNew(false);
    if (safeUserStories.length > 0) {
      setModalInitialMode('view');
    } else {
      setModalInitialMode('camera');
    }
    setShowUploadModal(true);
  };

  const handleAddNewStory = () => {
    setIsAddingNew(true);
    setModalInitialMode('camera');
    setShowUploadModal(true);
  };

  const handleOtherUserStoryPress = (story: Story) => {
    const userId = story.user?.id;
    if (!userId) return;

    const userStoriesGroup = groupedStories[userId] || [story];
    const storyIndex = userStoriesGroup.findIndex(s => s.id === story.id);

    onStoryPress(story.id, userStoriesGroup, Math.max(0, storyIndex));
  };

  const handleUploadSuccess = () => {
    if (onAddStory) {
      onAddStory();
    }
    setShowUploadModal(false);
    console.log(isAddingNew ? 'New story added!' : 'Story viewed/uploaded successfully!');
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current User's Story */}
        {user && (
          <View style={styles.userStoryWrapper}>
            <TouchableOpacity onPress={handleUserStoryPress} activeOpacity={0.8}>
              <StoryCircle
                imageUrl={user.avatar || ''}
                name={"Your Story"}
                viewed={false}
                hasStories={safeUserStories.length > 0}
                onPress={handleUserStoryPress}
                streak={user.streak}
                storyCount={safeUserStories.length}
                size={70}
              />
            </TouchableOpacity>

            {/* Always show + button to add story */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNewStory}
              activeOpacity={0.7}
            >
              <Plus color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Other Users' Stories */}
        {Object.entries(groupedStories).map(([userId, userStoryGroup]) => {
          const latestStory = userStoryGroup[0];
          if (!latestStory?.user) return null;

          return (
            <View key={userId} style={styles.otherStoryContainer}>
              <StoryCircle
                imageUrl={latestStory.user.avatar || ''}
                name={latestStory.user.name?.split(' ')[0] || 'User'}
                viewed={latestStory.viewed || false}
                hasStories={true}
                onPress={() => handleOtherUserStoryPress(latestStory)}
                streak={latestStory.user.streak}
                storyCount={userStoryGroup.length}
                size={70}
              />
            </View>
          );
        })}

        {/* Empty state */}
        {Object.keys(groupedStories).length === 0 && safeUserStories.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Be the first to share a story!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Story Upload/View Modal */}
      <StoryUploadModal
        visible={showUploadModal}
        onClose={handleCloseModal}
        onSuccess={handleUploadSuccess}
        initialMode={modalInitialMode}
        userStories={safeUserStories}
        followerStories={otherUserStories}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  userStoryWrapper: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary || '#007bff',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  otherStoryContainer: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginLeft: 20,
  },
  emptyStateText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StoriesSection;
