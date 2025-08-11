import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import AppHeader from '@/components/layout/AppHeader';
import PostCard from '@/components/home/PostCard';
import StoriesSection from '@/components/home/StoriesSection';
import TabBar from '@/components/ui/TabBar';
import { StoryViewer } from '@/components/ui/StoryViewer';
import { usePostStore } from '@/store/post-store';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';
import { getUser, followingUserStory } from '@/api/user';
import { mapUserFromApi } from '@/utils/mapUserFromApi';
import { Story } from '@/types';

const HomeScreen = () => {
  const router = useRouter();
  const { posts, stories, fetchPosts, fetchStories, isLoading, addStory } = usePostStore();
  const { user, token, updateUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('latest');
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStories, setCurrentStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [fetchedStories, setFetchedStories] = useState<Story[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (token) {
        try {
          // Step 1: Fetch user data first
          console.log('Fetching user data...');
          const userResponse = await getUser(token);
          
          // Handle both response formats
          if (userResponse && userResponse.success && userResponse.body) {
            // Standard API response format
            console.log('User response (standard format):', userResponse.body);
            const mappedUser = mapUserFromApi(userResponse.body);
            updateUser(mappedUser);
          } else if (userResponse && userResponse._id) {
            // Direct user object (fallback)
            console.log('User response (direct format):', userResponse);
            const mappedUser = mapUserFromApi(userResponse);
            updateUser(mappedUser);
          } else {
            throw new Error('Invalid user response format');
          }
          
          console.log('User data updated successfully');
          
          // Step 2: Fetch posts and stories in parallel
          await Promise.all([
            fetchPosts(activeTab as 'latest' | 'trending'),
            fetchStories(),
            fetchFollowingStories()
          ]);
          
          console.log('All data fetched successfully');
          
        } catch (err) {
          // Don't proceed to fetch posts/stories if user fetch fails
          console.error('Error fetching initial data:', err);
        }
      } else {
        console.log('No token available');
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFollowingStories = async () => {
    try {
      console.log('Fetching following user stories...');
      const response = await followingUserStory(token);
      const rawStories = response || [];

      const patchedStories: Story[] = rawStories.map((story: any) => ({
        id: story._id,
        url: story.url,
        type: story.type,
        viewed: false,
        totalStories: 1,
        createdAt: story.createdAt,
        user: {
          id: story.userId._id,
          name: story.userId.name,
          avatar: story.userId.profileImage || '', // fallback if null
          streak: story.userId.streak || 0, // Set default if not available
        },
      }));

      console.log('Fetched stories:', patchedStories.length);
      setFetchedStories(patchedStories);
    } catch (err) {
      console.error('Error fetching following stories:', err);
      setFetchedStories([]); // Set empty array on error
    }
  };

  const loadData = async () => {
    await Promise.all([
      fetchPosts(activeTab as 'latest' | 'trending'),
      fetchStories(),
      fetchFollowingStories()
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    if (token) {
      try {
        console.log('Refreshing data...');
        const userResponse = await getUser(token);
        
        if (userResponse && userResponse.body) {
          const mappedUser = mapUserFromApi(userResponse.body);
          updateUser(mappedUser);
          console.log('User data refreshed');
          
          await Promise.all([
            fetchPosts(activeTab as 'latest' | 'trending'),
            fetchStories(),
            fetchFollowingStories()
          ]);
          console.log('All data refreshed');
        }
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    } 
    
    setRefreshing(false);
  };

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);
    await fetchPosts(tabId as 'latest' | 'trending');
  };

  const handleStoryPress = (storyId: string, userStories: Story[], storyIndex: number) => {
    console.log('Story pressed:', storyId, 'Index:', storyIndex, 'Total stories:', userStories.length);
    
    if (userStories && userStories.length > 0) {
      setCurrentStories(userStories);
      setCurrentStoryIndex(Math.max(0, storyIndex)); // Ensure index is not negative
      setShowStoryViewer(true);
    } else {
      console.error('No stories found for user');
    }
  };

  const handleAddStory = async () => {
    // This will be handled by the StoryUploadModal in StoriesSection
    // The modal will handle image selection and upload
    // After upload, refresh stories
    console.log('Adding new story...');
    await Promise.all([
      fetchStories(),
      fetchFollowingStories()
    ]);
  };

  const handleStoryViewerClose = () => {
    console.log('Story viewer closed');
    setShowStoryViewer(false);
  };

  const handleStoryComplete = (storyId: string) => {
    // Mark story as viewed in the store
    console.log('Story completed:', storyId);
    // TODO: Implement API call to mark story as viewed
  };

  const handleLikeStory = (storyId: string) => {
    // Handle story like
    console.log('Story liked:', storyId);
    // TODO: Implement API call to like story
  };

  const handleReplyToStory = (storyId: string, message: string) => {
    // Handle story reply
    console.log('Reply to story:', storyId, message);
    // TODO: Implement API call to reply to story
  };

  const handleCreatePost = () => {
    router.push('/post/create');
  };

  // Ensure stories is always an array
  const safeStories = Array.isArray(stories) ? stories : [];
  
  // Filter stories to get only the current user's stories
  const userStories = user ? safeStories.filter(story => 
    story?.user?.id && user?.id && story.user.id === user.id
  ) : [];

  const renderHeader = () => (
    <>
      <StoriesSection
        stories={safeStories}
        userStories={userStories}
        fetchedStories={fetchedStories}
        onStoryPress={handleStoryPress}
        onAddStory={handleAddStory}
      />
      <TabBar
        tabs={[
          { id: 'latest', label: 'Latest' },
          { id: 'trending', label: 'Trending' },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        style={styles.tabBar}
      />
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <AppHeader 
          title="Home"
        />
        
        <FlatList
          data={Array.isArray(posts) ? posts : []}
          keyExtractor={(item) => item?.id || `post_${Date.now()}_${Math.random()}`}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.dark.primary}
              colors={[Colors.dark.primary]}
            />
          }
        />
        
        <TouchableOpacity 
          style={[styles.fab, { 
            bottom: (Platform.OS === 'ios' ? 100 : 76) + insets.bottom 
          }]}
          onPress={handleCreatePost}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Story Viewer */}
      <StoryViewer
        visible={showStoryViewer}
        stories={currentStories}
        initialStoryIndex={currentStoryIndex}
        onClose={handleStoryViewerClose}
        onStoryComplete={handleStoryComplete}
        onLikeStory={handleLikeStory}
        onReplyToStory={handleReplyToStory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  tabBar: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});


export default HomeScreen;