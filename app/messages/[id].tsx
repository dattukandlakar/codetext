import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  ArrowLeft, 
  Send,
  Image as ImageIcon,
  Mic,
  Phone,
  Video,
  MoreVertical,
  CheckCircle2,
  Circle
} from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';

// Mock conversation data
const mockUsers = {
  user1: {
    id: 'user1',
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  user2: {
    id: 'user2',
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    isOnline: false,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  user3: {
    id: 'user3',
    name: 'Amit Kumar',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  user4: {
    id: 'user4',
    name: 'Neha Gupta',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  user5: {
    id: 'user5',
    name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
};

const mockMessages = {
  conv1: [
    {
      id: 'm1',
      text: "Hey, how are you doing?",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm2',
      text: "I'm good, thanks! Just working on a new project.",
      timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm3',
      text: "That sounds interesting! What kind of project?",
      timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm4',
      text: "It's a mobile app for a startup. Using React Native and some cool new APIs.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm5',
      text: "Nice! I've been wanting to learn React Native. How's the experience so far?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm6',
      text: "It's great! The cross-platform capabilities are really powerful.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm7',
      text: "Hey, are you available for a quick call?",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: false
    }
  ],
  conv2: [
    {
      id: 'm1',
      text: "Hi Priya, I wanted to share this document with you.",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm2',
      text: "Thanks for sharing the document!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    }
  ],
  conv3: [
    {
      id: 'm1',
      text: "Hello! I saw your profile and I'm interested in discussing a potential collaboration.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm2',
      text: "Hi Amit, that sounds great! What kind of collaboration are you thinking about?",
      timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm3',
      text: "I'm working on a new web platform and I think your design skills would be perfect for it.",
      timestamp: new Date(Date.now() - 1.2 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm4',
      text: "Let me know when you're free to discuss the project details.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    }
  ],
  conv4: [
    {
      id: 'm1',
      text: "Hi, I need some help with the design for my new app.",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm2',
      text: "Sure, I'd be happy to help! What kind of app is it?",
      timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm3',
      text: "It's a fitness tracking app with social features.",
      timestamp: new Date(Date.now() - 3.2 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm4',
      text: "I've sent you the design files. Please check and let me know your thoughts.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    }
  ],
  conv5: [
    {
      id: 'm1',
      text: "Hey Vikram, are you going to the tech conference next month?",
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm2',
      text: "Yes, I've already registered! Are you planning to go?",
      timestamp: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm3',
      text: "Great! I just registered too. We should meet up there.",
      timestamp: new Date(Date.now() - 5.2 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    },
    {
      id: 'm4',
      text: "Definitely! I'm looking forward to the AI and ML sessions.",
      timestamp: new Date(Date.now() - 5.1 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: false,
      isRead: true
    },
    {
      id: 'm5',
      text: "Are you coming to the tech meetup this weekend?",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sentByMe: true,
      isRead: true
    }
  ]
};

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sentByMe: boolean;
  isRead: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const flatListRef = useRef<FlatList<Message> | null>(null);

  useEffect(() => {
    if (id) {
      // Get the conversation user
      const conversationId = id as string;
      const userId = conversationId.replace('conv', '');
      const userObj = mockUsers[`user${userId}` as keyof typeof mockUsers];
      setOtherUser(userObj);
      
      // Get messages
      const messagesArray = mockMessages[conversationId as keyof typeof mockMessages] || [];
      setMessages(messagesArray);
      
      // Mark all messages as read
      if (messagesArray) {
        setMessages(messagesArray.map(msg => 
          msg.sentByMe ? msg : { ...msg, isRead: true }
        ));
      }
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage: Message = {
      id: `m${messages.length + 1}`,
      text: messageText,
      timestamp: new Date().toISOString(),
      sentByMe: true,
      isRead: false
    };
    
    setMessages([...messages, newMessage]);
    setMessageText('');
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffMin < 24 * 60) {
      return `${Math.floor(diffMin / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isFirstInGroup = index === 0 || 
      messages[index - 1].sentByMe !== item.sentByMe;
    
    const isLastInGroup = index === messages.length - 1 || 
      messages[index + 1].sentByMe !== item.sentByMe;
    
    return (
      <View 
        style={[
          styles.messageContainer,
          item.sentByMe ? styles.sentMessage : styles.receivedMessage,
          isFirstInGroup && (item.sentByMe ? styles.firstSentMessage : styles.firstReceivedMessage),
          isLastInGroup && (item.sentByMe ? styles.lastSentMessage : styles.lastReceivedMessage)
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{formatTimestamp(item.timestamp)}</Text>
          {item.sentByMe && (
            <View style={styles.readStatus}>
              {item.isRead ? (
                <CheckCircle2 size={12} color={Colors.dark.success} />
              ) : (
                <Circle size={12} color={Colors.dark.subtext} />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!otherUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: () => (
            <TouchableOpacity 
              style={styles.headerTitle}
              onPress={() => router.push(`/profile/${otherUser.id}`)}
            >
              <Avatar source={otherUser.avatar} size={36} />
              <View style={styles.headerTitleText}>
                <Text style={styles.headerName}>{otherUser.name}</Text>
                <Text style={styles.headerStatus}>
                  {otherUser.isOnline ? 'Online' : `Last seen ${formatLastSeen(otherUser.lastSeen)}`}
                </Text>
              </View>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction}>
                <Phone size={22} color={Colors.dark.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <Video size={22} color={Colors.dark.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <MoreVertical size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <ImageIcon size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.dark.subtext}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          
          {messageText.trim() ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Send size={24} color={Colors.dark.tint} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Mic size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    marginLeft: 10,
  },
  headerName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: `${Colors.dark.tint}30`,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.card,
  },
  firstSentMessage: {
    borderTopRightRadius: 16,
  },
  lastSentMessage: {
    borderBottomRightRadius: 16,
  },
  firstReceivedMessage: {
    borderTopLeftRadius: 16,
  },
  lastReceivedMessage: {
    borderBottomLeftRadius: 16,
  },
  messageText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginRight: 4,
  },
  readStatus: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    color: Colors.dark.text,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  micButton: {
    padding: 8,
  },
});