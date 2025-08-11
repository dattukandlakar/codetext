import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';
import { User } from '@/types';

// Mock following data
const mockFollowing: User[] = [
  {
    id: '6',
    name: 'Arjun Reddy',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'Product Manager | Tech Enthusiast',
    isFollowing: true,
  },
  {
    id: '7',
    name: 'Meera Singh',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'Data Scientist | AI Researcher',
    isFollowing: true,
  },
  {
    id: '8',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'Backend Developer | Cloud Expert',
    isFollowing: true,
  },
  {
    id: '9',
    name: 'Ananya Desai',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'UX Researcher | Design Thinker',
    isFollowing: true,
  },
  {
    id: '10',
    name: 'Rajesh Khanna',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'DevOps Engineer | Infrastructure Specialist',
    isFollowing: true,
  }
];

export default function FollowingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate API call to fetch following
    setTimeout(() => {
      setFollowing(mockFollowing);
      setLoading(false);
    }, 1000);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleToggleFollow = (userId: string) => {
    setFollowing(prevFollowing => 
      prevFollowing.map(followedUser => 
        followedUser.id === userId 
          ? { ...followedUser, isFollowing: !followedUser.isFollowing }
          : followedUser
      )
    );
  };

  const filteredFollowing = searchQuery
    ? following.filter(followedUser => 
        followedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (followedUser.bio && followedUser.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : following;

  const renderFollowingItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.followingItem}
      onPress={() => handleViewProfile(item.id)}
    >
      <Avatar 
        source={item.avatar} 
        name={item.name} 
        size={50} 
      />
      
      <View style={styles.followingInfo}>
        <Text style={styles.followingName}>{item.name}</Text>
        {item.bio && <Text style={styles.followingBio}>{item.bio}</Text>}
      </View>
      
      <Button 
        title={item.isFollowing ? "Following" : "Follow"}
        onPress={() => handleToggleFollow(item.id)}
        variant={item.isFollowing ? "outline" : "primary"}
        size="small"
        style={styles.followButton}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Following",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.dark.subtext} />
        <TouchableOpacity 
          style={styles.searchInput}
          onPress={() => {/* Open search modal */}}
        >
          <Text style={styles.searchPlaceholder}>Search following...</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading following...</Text>
        </View>
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You are not following anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFollowing}
          renderItem={renderFollowingItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
  },
  searchPlaceholder: {
    color: Colors.dark.subtext,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  followingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followingName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  followingBio: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  followButton: {
    minWidth: 100,
  },
});