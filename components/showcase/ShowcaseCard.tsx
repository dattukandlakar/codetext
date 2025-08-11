import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { ArrowUp, Heart, MessageSquare, Bookmark } from 'lucide-react-native';
import { ShowcaseEntry } from '@/types';
import { useShowcaseStore } from '@/store/showcase-store';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';

interface ShowcaseCardProps {
  entry: ShowcaseEntry;
  onPress: (entry: ShowcaseEntry) => void;
  compact?: boolean;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ entry, onPress, compact = false }) => {
  const { upvoteEntry, bookmarkEntry } = useShowcaseStore();
  const { user } = useAuthStore();

  const handleUpvote = (e: any) => {
    e.stopPropagation();
    if (user) {
      upvoteEntry(entry?.id);
    }
  };
  
  const handleBookmark = (e: any) => {
    e.stopPropagation();
    if (user) {
      bookmarkEntry(entry?.id);
    }
  };
  
  const isUpvoted = entry.upvoters && user ? entry.upvoters.includes(user?.id) : false;
  const isBookmarked = entry.isBookmarked || false;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(entry)}
      activeOpacity={0.9}
    >
      {entry.images && entry.images.length > 0 && (
        <Image 
          source={{ uri: entry.images[0] }} 
          style={styles.compactCoverImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{entry.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {entry.description}
            </Text>
          </View>
        </View>
        
        {!compact && entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {entry.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
            )}
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[
                styles.statButton,
                isUpvoted && styles.activeStatButton
              ]} 
              onPress={handleUpvote}
            >
              <ArrowUp 
                size={16} 
                color={isUpvoted ? '#fff' : Colors.dark.text} 
              />
              <Text 
                style={[
                  styles.statText,
                  isUpvoted && styles.activeStatText
                ]}
              >
                {entry.upvoters ? entry.upvoters.length : 0}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <MessageSquare size={16} color={Colors.dark.subtext} />
              <Text style={styles.statText}>{entry.comments || 0}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={handleBookmark}
            >
              <Bookmark 
                size={16} 
                color={isBookmarked ? Colors.dark.tint : Colors.dark.subtext} 
                fill={isBookmarked ? Colors.dark.tint : 'transparent'}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.authorContainer}>
            <Image 
              source={{ uri: entry.author?.avatar }} 
              style={styles.authorAvatar} 
            />
            <Text style={styles.authorName}>{entry.author?.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  compactCoverImage: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: Colors.dark.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: `${Colors.dark.tint}20`,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: Colors.dark.tint,
    fontSize: 12,
  },
  moreTagsText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginRight: 12,
  },
  activeStatButton: {
    backgroundColor: Colors.dark.tint,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    color: Colors.dark.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeStatText: {
    color: '#fff',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
});

export default ShowcaseCard;