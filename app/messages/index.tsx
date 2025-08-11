import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Circle,
  CheckCircle2
} from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';

// Mock conversation data
const mockConversations = [
  {
    id: 'conv1',
    user: {
      id: 'user1',
      name: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    },
    lastMessage: {
      text: "Hey, are you available for a quick call?",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
      sentByMe: false
    },
    unreadCount: 1
  },
  {
    id: 'conv2',
    user: {
      id: 'user2',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    },
    lastMessage: {
      text: "Thanks for sharing the document!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      sentByMe: false
    },
    unreadCount: 0
  },
  {
    id: 'conv3',
    user: {
      id: 'user3',
      name: 'Amit Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    },
    lastMessage: {
      text: "Let me know when you're free to discuss the project details.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      sentByMe: true
    },
    unreadCount: 0
  },
  {
    id: 'conv4',
    user: {
      id: 'user4',
      name: 'Neha Gupta',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    },
    lastMessage: {
      text: "I've sent you the design files. Please check and let me know your thoughts.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      sentByMe: false
    },
    unreadCount: 0
  },
  {
    id: 'conv5',
    user: {
      id: 'user5',
      name: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    },
    lastMessage: {
      text: "Are you coming to the tech meetup this weekend?",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      sentByMe: true
    },
    unreadCount: 0
  }
];

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
    sentByMe: boolean;
  };
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => 
        conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  const handleNewMessage = () => {
    router.push('/messages/new');
  };

  const handleConversationPress = (conversationId: string) => {
    // Mark conversation as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              unreadCount: 0,
              lastMessage: { ...conv.lastMessage, isRead: true }
            } 
          : conv
      )
    );
    
    router.push(`/messages/${conversationId}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'now';
    } else if (diffMin < 60) {
      return `${diffMin}m`;
    } else if (diffHour < 24) {
      return `${diffHour}h`;
    } else if (diffDay < 7) {
      return `${diffDay}d`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item.id)}
    >
      <View style={styles.avatarContainer}>
        <Avatar source={item.user.avatar} size={56} />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.lastMessage.timestamp)}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.lastMessage,
              !item.lastMessage.isRead && !item.lastMessage.sentByMe && styles.unreadMessage
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.lastMessage.sentByMe && 'You: '}{item.lastMessage.text}
          </Text>
          
          {item.lastMessage.sentByMe && (
            <View style={styles.readStatus}>
              {item.lastMessage.isRead ? (
                <CheckCircle2 size={16} color={Colors.dark.success} />
              ) : (
                <Circle size={16} color={Colors.dark.subtext} />
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.dark.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor={Colors.dark.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.tint}
            colors={[Colors.dark.tint]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations found</Text>
            {searchQuery ? (
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            ) : (
              <Text style={styles.emptySubtext}>Start a new conversation by tapping the button below</Text>
            )}
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleNewMessage}
      >
        <Edit size={24} color="#fff" />
      </TouchableOpacity>
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
    borderRadius: 100,
    paddingHorizontal: 12,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.dark.text,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.dark.tint,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.card,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conversationContent: {
    marginLeft: 12,
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    color: Colors.dark.subtext,
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    color: Colors.dark.text,
    fontWeight: '500',
  },
  readStatus: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.dark.subtext,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});