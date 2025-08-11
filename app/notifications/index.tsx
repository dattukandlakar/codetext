import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Briefcase, 
  Calendar, 
  Award,
  Bell
} from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import Colors from '@/constants/colors';

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'like',
    user: {
      id: 'user1',
      name: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    },
    content: 'liked your post',
    targetId: 'post1',
    targetType: 'post',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: '2',
    type: 'comment',
    user: {
      id: 'user2',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    },
    content: 'commented on your post: "This is amazing! Great work!"',
    targetId: 'post1',
    targetType: 'post',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: '3',
    type: 'follow',
    user: {
      id: 'user3',
      name: 'Amit Kumar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    },
    content: 'started following you',
    targetId: 'user3',
    targetType: 'user',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: '4',
    type: 'job',
    user: {
      id: 'company1',
      name: 'TechWave Ventures',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623'
    },
    content: 'posted a new job that matches your skills: "Senior React Native Developer"',
    targetId: 'job1',
    targetType: 'job',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: '5',
    type: 'event',
    user: {
      id: 'company2',
      name: 'Parul University',
      avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1'
    },
    content: 'is hosting an event: "Annual Tech Conference 2023"',
    targetId: 'event1',
    targetType: 'event',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: '6',
    type: 'mention',
    user: {
      id: 'user4',
      name: 'Neha Gupta',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    },
    content: 'mentioned you in a comment: "I think @Vishal would be perfect for this!"',
    targetId: 'post2',
    targetType: 'post',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: '7',
    type: 'showcase',
    user: {
      id: 'user5',
      name: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
    },
    content: 'Your showcase entry "AI-Powered Mobile App" received an award!',
    targetId: 'showcase1',
    targetType: 'showcase',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true
  }
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleNotificationPress = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(item => 
        item.id === notification.id 
          ? { ...item, isRead: true } 
          : item
      )
    );
    
    // Navigate based on notification type
    switch (notification.targetType) {
      case 'post':
        router.push(`/post/${notification.targetId}`);
        break;
      case 'user':
        router.push(`/profile/${notification.targetId}`);
        break;
      case 'job':
        router.push(`/job/${notification.targetId}`);
        break;
      case 'event':
        router.push(`/event/${notification.targetId}`);
        break;
      case 'showcase':
        router.push(`/showcase/${notification.targetId}`);
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color={Colors.dark.error} />;
      case 'comment':
      case 'mention':
        return <MessageCircle size={20} color={Colors.dark.tint} />;
      case 'follow':
        return <UserPlus size={20} color={Colors.dark.success} />;
      case 'job':
        return <Briefcase size={20} color={Colors.dark.warning} />;
      case 'event':
        return <Calendar size={20} color={Colors.dark.info} />;
      case 'showcase':
        return <Award size={20} color="#FFD700" />;
      default:
        return <Bell size={20} color={Colors.dark.tint} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else if (diffDay < 7) {
      return `${diffDay}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconContainer}>
        {getNotificationIcon(item.type)}
      </View>
      
      <Avatar source={item.user.avatar} size={50} />
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.userName}>{item.user.name}</Text> {item.content}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
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
            <Bell size={60} color={Colors.dark.subtext} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>When you get notifications, they'll appear here</Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: `${Colors.dark.tint}10`,
  },
  notificationIconContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  notificationText: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600',
  },
  timestamp: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
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
});