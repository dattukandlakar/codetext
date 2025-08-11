import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Repeat2,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import Avatar from '@/components/ui/Avatar';
import ThreadsImageGallery from '@/components/ui/ThreadsImageGallery';
import FullScreenImageViewer from '@/components/ui/FullScreenImageViewer';
import { Post } from '@/types';
import { usePostStore } from '@/store/post-store';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

const MAX_CONTENT_LENGTH = 150;
const CONTAINER_PADDING = 16;

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  const router = useRouter();
  const { likePost, bookmarkPost, unlikePost, editPost, deletePost } = usePostStore();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLike = () => {
    post.isLiked ? unlikePost(post.id) : likePost(post.id);
  };

  const handleBookmark = () => bookmarkPost(post.id);
  const handleComment = () => router.push(`/post/${post.id}`);
  const handleShare = () => console.log('Share post:', post.id);
  const handleRepost = () => console.log('Repost:', post.id);
  const handleViewProfile = () => router.push(`/profile/${post.author.id}`);
  const handleViewPost = () =>
    onPress ? onPress() : router.push(`/post/${post.id}`);

  const handleImagePress = (imageUri: string, index: number) => {
    setSelectedImageIndex(index);
    setFullScreenVisible(true);
  };

  const handleCloseFullScreen = () => {
    setFullScreenVisible(false);
  };

  const handleMoreMenu = () => {
    setMenuVisible(true);
  };

  const handleEditPost = () => {
    setMenuVisible(false);
    // Navigate to edit post screen with post ID
    router.push({
      pathname: '/post/edit',
      params: { id: post.id }
    });
  };

  const handleDeletePost = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(post.id);
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if the current user is the author of the post
  const isOwnPost = user && post.author && user.id === post.author.id;

  const shouldTruncate = post.content?.length > MAX_CONTENT_LENGTH;
  const displayContent =
    shouldTruncate && !expanded
      ? `${post.content.substring(0, MAX_CONTENT_LENGTH)}...`
      : post.content;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleViewProfile}
          style={styles.authorContainer}
        >
          <Avatar source={post?.author.avatar} size={40} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post?.author.name}</Text>
            <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        {isOwnPost && (
          <TouchableOpacity style={styles.moreButton} onPress={handleMoreMenu}>
            <MoreHorizontal size={20} color={Colors.dark.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content (clickable) */}
      <TouchableOpacity onPress={handleViewPost} activeOpacity={0.9}>
        <Text style={styles.content}>{displayContent}</Text>

        {shouldTruncate && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.showMoreText}>
              {expanded ? 'show less' : '...show more'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Image Gallery - Threads Style */}
      {Array.isArray(post.images) && post.images?.length > 0 && (
        <ThreadsImageGallery
          images={post.images}
          onImagePress={handleImagePress}
          containerPadding={CONTAINER_PADDING}
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Heart
            size={22}
            color={post?.isLiked ? Colors.dark.error : Colors.dark.text}
            fill={post?.isLiked ? Colors.dark.error : 'transparent'}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={22} color={Colors.dark.text} />
          <Text style={styles.actionText}>{post?.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
          <Repeat2 size={22} color={Colors.dark.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={22} color={Colors.dark.text} />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity onPress={handleBookmark}>
          <Bookmark
            size={22}
            color={Colors.dark.text}
            fill={post?.isBookmarked ? Colors.dark.text : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Full-Screen Image Viewer with Swipe */}
      {Array.isArray(post.images) && post.images?.length > 0 && (
        <FullScreenImageViewer
          visible={fullScreenVisible}
          images={post.images}
          initialIndex={selectedImageIndex}
          postId={post.id}
          likes={post.likes}
          comments={post.comments}
          isLiked={post.isLiked}
          onClose={handleCloseFullScreen}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onRepost={handleRepost}
        />
      )}

      {/* Action Sheet Modal for Edit/Delete */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetHandle} />
            </View>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleEditPost}
            >
              <Edit3 size={20} color={Colors.dark.text} />
              <Text style={styles.actionText}>Edit Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionItem, styles.deleteAction]}
              onPress={handleDeletePost}
            >
              <Trash2 size={20} color={Colors.dark.error} />
              <Text style={[styles.actionText, styles.deleteText]}>Delete Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionItem, styles.cancelAction]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: CONTAINER_PADDING,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 16,
  },
  timestamp: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    color: Colors.dark.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  showMoreText: {
    color: Colors.dark.tint,
    fontWeight: '500',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: Colors.dark.text,
    marginLeft: 6,
    fontSize: 14,
  },
  spacer: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // For safe area
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.border,
    borderRadius: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  deleteAction: {
    borderBottomWidth: 0,
  },
  cancelAction: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 8,
  },
  deleteText: {
    color: Colors.dark.error,
  },
  cancelText: {
    color: Colors.dark.subtext,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PostCard;
