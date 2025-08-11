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

// Mock followers data
const mockFollowers: User[] = [
  {
    id: '2',
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'UX Designer | Creative Thinker',
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'Frontend Developer | React Enthusiast',
    isFollowing: false,
  },
  {
    id: '4',
    name: 'Amit Kumar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'Mobile Developer | Flutter Expert',
    isFollowing: true,
  },
  {
    id: '5',
    name: 'Neha Gupta',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    bio: 'UI Designer | Illustrator',
    isFollowing: false,
  }
];

export default function FollowersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate API call to fetch followers
    setTimeout(() => {
      setFollowers(mockFollowers);
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
    setFollowers(prevFollowers => 
      prevFollowers.map(follower => 
        follower.id === userId 
          ? { ...follower, isFollowing: !follower.isFollowing }
          : follower
      )
    );
  };

  const filteredFollowers = searchQuery
    ? followers.filter(follower => 
        follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (follower.bio && follower.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : followers;

  const renderFollowerItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.followerItem}
      onPress={() => handleViewProfile(item.id)}
    >
      <Avatar 
        source={item.avatar} 
        name={item.name} 
        size={50} 
      />
      
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>{item.name}</Text>
        {item.bio && <Text style={styles.followerBio}>{item.bio}</Text>}
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
          headerTitle: "Followers",
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
          <Text style={styles.searchPlaceholder}>Search followers...</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFollowers}
          renderItem={renderFollowerItem}
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
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  followerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followerName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  followerBio: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  followButton: {
    minWidth: 100,
  },
});