import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Share, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ExternalLink, Share2, Heart, MessageCircle, Bookmark, Calendar, Tag, User, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useShowcaseStore } from '@/store/showcase-store';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

export default function ShowcaseDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, upvoteEntry, bookmarkEntry, fetchEntryById } = useShowcaseStore();
  const { user } = useAuthStore();
  
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [entry, setEntry] = useState(entries.find(e => e.id === id));
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadEntry();
  }, [id]);
  
  const loadEntry = async () => {
    if (id) {
      setLoading(true);
      const entryData = await fetchEntryById(id as string);
      if (entryData) {
        setEntry(entryData);
      } else {
        // If entry not found, redirect to showcase page
        router.replace('/showcase');
      }
      setLoading(false);
    }
  };
  
  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading showcase...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const handleVisitProject = () => {
    if (entry.links && entry.links.website) {
      Linking.openURL(entry.links.website);
    }
  };
  
  const handleShareProject = async () => {
    try {
      await Share.share({
        message: `Check out this project: ${entry.title} on Startup Showcase`,
      });
    } catch (error) {
      console.error('Error sharing project:', error);
    }
  };
  
  const handleLike = () => {
    if (user) {
      upvoteEntry(entry?.id);
      loadEntry(); // Reload entry to update UI
    }
  };
  
  const handleBookmark = () => {
    if (user) {
      bookmarkEntry(entry?.id);
      loadEntry(); // Reload entry to update UI
    }
  };
  
  const isLiked = entry.upvoters && user ? entry.upvoters.includes(user?.id) : false;
  const isBookmarked = entry.isBookmarked || false;
  
  const upvotersToShow = entry.upvoters && entry.upvoters.length > 0 ? 3 : 0;

  // Helper function to convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{entry.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Image Section */}
        {entry.bannerImages && entry.bannerImages.length > 0 && (
          <View style={styles.bannerSection}>
            <Image 
              source={{ uri: entry.bannerImages[0] }} 
              style={styles.bannerImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.bannerOverlay}
            />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.projectHeader}>
            <View style={styles.titleSection}>
              {entry.logo && (
                <Image 
                  source={{ uri: entry.logo }} 
                  style={styles.logoImage}
                />
              )}
              <View style={styles.titleContainer}>
                <Text style={styles.projectTitle}>{entry.title}</Text>
                {entry.tagline && (
                  <Text style={styles.projectTagline}>{entry.tagline}</Text>
                )}
                {entry.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{entry.category.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              {entry.links && entry.links.website && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleVisitProject}
                >
                  <ExternalLink size={16} color={Colors.dark.text} />
                  <Text style={styles.actionButtonText}>Visit</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleShareProject}
              >
                <Share2 size={16} color={Colors.dark.text} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.submissionInfo}>
              Submitted on {formatDate(entry.createdAt)} • {entry.comments || 0} comments
            </Text>
          </View>
          
          <View style={styles.upvotesSection}>
            <Text style={styles.upvotesTitle}>
              {entry.upvoters ? entry.upvoters.length : 0} upvoters
            </Text>
            
            <View style={styles.upvotersContainer}>
              <View style={styles.upvotersAvatars}>
                {entry.upvoters && entry.upvoters.length > 0 ? (
                  Array(Math.min(upvotersToShow, entry.upvoters.length)).fill(0).map((_, index) => (
                    <View key={index} style={[styles.upvoterAvatar, { marginLeft: index > 0 ? -10 : 0 }]}>
                      <Avatar 
                        size={32} 
                        name={`User ${index + 1}`} 
                        source={`https://i.pravatar.cc/150?img=${index + 10}`} 
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.noUpvotersText}>No upvotes yet</Text>
                )}
                
                {entry.upvoters && entry.upvoters.length > upvotersToShow && (
                  <View style={[styles.upvoterAvatar, styles.moreUpvoters, { marginLeft: -10 }]}>
                    <Text style={styles.moreUpvotersText}>+{entry.upvoters.length - upvotersToShow}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.upvoteActions}>
                <TouchableOpacity 
                  style={[styles.iconButton, isLiked && styles.activeIconButton]}
                  onPress={handleLike}
                >
                  <Heart size={20} color={isLiked ? Colors.dark.error : Colors.dark.text} fill={isLiked ? Colors.dark.error : 'none'} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.iconButton, isBookmarked && styles.activeIconButton]}
                  onPress={handleBookmark}
                >
                  <Bookmark size={20} color={isBookmarked ? Colors.dark.primary : Colors.dark.text} fill={isBookmarked ? Colors.dark.primary : 'none'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Meet the Creator</Text>
            
            <View style={styles.creatorInfo}>
              <Avatar 
                size={48} 
                name={entry.author.name} 
                source={entry.author.avatar} 
              />
              
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{entry.author.name}</Text>
                <TouchableOpacity 
                  style={styles.followButton}
                  onPress={() => console.log('Follow creator')}
                >
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            
            <Text style={styles.descriptionText} numberOfLines={isDescriptionExpanded ? undefined : 3}>
              {entry.description}
            </Text>
            
            {entry.description.length > 120 && (
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <Text style={styles.showMoreButtonText}>
                  {isDescriptionExpanded ? 'Show less' : 'Show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {entry.links?.demoVideo && (
            <View style={styles.videoSection}>
              <Text style={styles.sectionTitle}>Demo Video</Text>
              <View style={styles.videoContainer}>
                <WebView
                  source={{ uri: getEmbedUrl(entry.links.demoVideo) }}
                  style={styles.video}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  allowsFullscreenVideo={true}
                />
              </View>
            </View>
          )}
          
          {entry.problem && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Problem</Text>
              <Text style={styles.detailText}>{entry.problem}</Text>
            </View>
          )}
          
          {entry.solution && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Solution</Text>
              <Text style={styles.detailText}>{entry.solution}</Text>
            </View>
          )}
          
          {entry.revenueModel && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Revenue Model</Text>
              <Text style={styles.detailText}>{entry.revenueModel}</Text>
            </View>
          )}
          
          {entry.images && entry.images.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.sectionTitle}>Showcase Gallery</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.galleryContainer}
              >
                {entry.images.map((image, index) => (
                  <Image 
                    key={index}
                    source={{ uri: image }} 
                    style={styles.galleryImage} 
                  />
                ))}
              </ScrollView>
            </View>
          )}
          
          {entry.bannerImages && entry.bannerImages.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.sectionTitle}>Banner Images</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.galleryContainer}
              >
                {entry.bannerImages.map((image, index) => (
                  <Image 
                    key={index}
                    source={{ uri: image }} 
                    style={styles.bannerImage} 
                  />
                ))}
              </ScrollView>
            </View>
          )}
          
          {entry.links && Object.values(entry.links).some(link => link) && (
            <View style={styles.linksSection}>
              <Text style={styles.sectionTitle}>Project Links</Text>
              
              <View style={styles.linksContainer}>
                {entry.links?.github && (
                  <TouchableOpacity 
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(entry.links?.github || '')}
                  >
                    <Text style={styles.linkButtonText}>GitHub</Text>
                    <ExternalLink size={16} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
                
                {entry.links?.website && (
                  <TouchableOpacity 
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(entry.links?.website || '')}
                  >
                    <Text style={styles.linkButtonText}>Website</Text>
                    <ExternalLink size={16} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
                
                {entry.links?.playstore && (
                  <TouchableOpacity 
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(entry.links?.playstore || '')}
                  >
                    <Text style={styles.linkButtonText}>Play Store</Text>
                    <ExternalLink size={16} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
                
                {entry.links?.appstore && (
                  <TouchableOpacity 
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(entry.links?.appstore || '')}
                  >
                    <Text style={styles.linkButtonText}>App Store</Text>
                    <ExternalLink size={16} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Tag size={14} color={Colors.dark.primary} />
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
          
          
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments</Text>
            
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Avatar 
                  size={36} 
                  name="Shyam Parai" 
                  source="https://i.pravatar.cc/150?img=33" 
                />
                <View style={styles.commentInfo}>
                  <Text style={styles.commentorName}>Shyam Parai</Text>
                  <Text style={styles.commentTime}>2 days ago</Text>
                </View>
              </View>
              
              <Text style={styles.commentText}>
                Are you looking for an investor? I'd love to connect and discuss this further.
              </Text>
              
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.commentAction}>
                  <Heart size={16} color={Colors.dark.subtext} />
                  <Text style={styles.commentActionText}>Like</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.commentAction}>
                  <MessageCircle size={16} color={Colors.dark.subtext} />
                  <Text style={styles.commentActionText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Avatar 
                  size={36} 
                  name="Vaibhav Malpathak" 
                  source="https://i.pravatar.cc/150?img=42" 
                />
                <View style={styles.commentInfo}>
                  <Text style={styles.commentorName}>Vaibhav Malpathak</Text>
                  <Text style={styles.commentTime}>1 week ago</Text>
                </View>
              </View>
              
              <Text style={styles.commentText}>
                This reminds me of my project Appointee. Check it out here: appointee.app
              </Text>
              
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.commentAction}>
                  <Heart size={16} color={Colors.dark.subtext} />
                  <Text style={styles.commentActionText}>Like</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.commentAction}>
                  <MessageCircle size={16} color={Colors.dark.subtext} />
                  <Text style={styles.commentActionText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.addCommentContainer}>
              <Avatar 
                size={36} 
                name={user?.name || "User"} 
                source={user?.avatar} 
              />
              <TouchableOpacity style={styles.addCommentInput}>
                <Text style={styles.addCommentPlaceholder}>Add a comment...</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bannerSection: {
    height: 200,
    width: '100%',
    position: 'relative',
    marginBottom: -50,
    zIndex: 1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  projectHeader: {
    backgroundColor: Colors.dark.background,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2,
    marginBottom: 24,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.dark.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  projectTagline: {
    fontSize: 16,
    color: Colors.dark.subtext,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  actionButtonText: {
    color: Colors.dark.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  submissionInfo: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  upvotesSection: {
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  upvotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  upvotersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upvotersAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoterAvatar: {
    borderWidth: 2,
    borderColor: Colors.dark.cardBackground,
    borderRadius: 20,
  },
  moreUpvoters: {
    width: 32,
    height: 32,
    backgroundColor: Colors.dark.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreUpvotersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noUpvotersText: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  upvoteActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  activeIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  creatorSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorDetails: {
    marginLeft: 12,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  followButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  showMoreButton: {
    marginTop: 8,
  },
  showMoreButtonText: {
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  videoSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  videoContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  video: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  detailText: {
    fontSize: 16,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  mediaSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  galleryContainer: {
    marginTop: 8,
  },
  galleryImage: {
    width: 280,
    height: 180,
    borderRadius: 12,
    marginRight: 12,
  },
  linksSection: {
    marginBottom: 24,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  linkButtonText: {
    color: Colors.dark.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    color: Colors.dark.primary,
    marginLeft: 6,
  },
  commentsSection: {
    marginBottom: 40,
  },
  commentCard: {
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInfo: {
    marginLeft: 12,
  },
  commentorName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.dark.subtext,
  },
  commentText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 12,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginLeft: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addCommentInput: {
    flex: 1,
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
  },
  addCommentPlaceholder: {
    color: Colors.dark.subtext,
  },
});