import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  Linking,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  MapPin,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Briefcase,
  BookOpen,
  Plus,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Github,
  ExternalLink,
  Edit,
  BarChart2
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import TabBar from '@/components/ui/TabBar';
import PostCard from '@/components/home/PostCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/auth-store';
import { usePostStore } from '@/store/post-store';
import { useShowcaseStore } from '@/store/showcase-store';
import { Post, ShowcaseEntry, User as UserType } from '@/types';
import Colors from '@/constants/colors';
import { mapUserFromApi } from '@/utils/mapUserFromApi';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getUserById } from '@/api/user';
import { clearAuthCache } from '@/utils/clearAuthCache';

import { useFollowStore } from '@/store/follow-store';


export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user); // Current logged-in user
  const refreshUserData = useAuthStore(state => state.refreshUserData);
  const { posts } = usePostStore();
  const { entries } = useShowcaseStore();
  const [activeTab, setActiveTab] = useState('about');
  const [profileUser, setProfileUser] = useState<UserType | null>(null); // User whose profile we're viewing
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userShowcases, setUserShowcases] = useState<ShowcaseEntry[]>([]);

  const [loading, setLoading] = useState(true);

  const token: any = useAuthStore((state) => state.token);

  const { toggleFollow, isLoading, isFollowing: isFollowingUser, initializeFollowing, following } = useFollowStore();

  // Animation values
  const progressValue = useRef(new Animated.Value(0)).current;
  const progressPercent = 10; // Example progress percentage

  // Check if viewing own profile
  const isOwnProfile = currentUser && id === currentUser?.id;

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    if (!id || !token) return;

    try {
      setLoading(true);
      
      // If viewing own profile, refresh and use current user data
      if (isOwnProfile) {
        console.log('🔄 Viewing own profile, refreshing user data...');
        await refreshUserData();
        const refreshedUser = useAuthStore.getState().user;
        console.log('📊 Current user data after refresh:', refreshedUser);
        setProfileUser(refreshedUser);
      } else {
        // First try to fetch from API to get complete user data including followers/following
        try {
          const userResponse = await getUserById(token, id);
          
          // Handle different API response structures
          let userData;
          if (userResponse.body) {
            // If response has a body property, use it
            userData = userResponse.body;
          } else if (userResponse.user) {
            // If response has a user property, use it
            userData = userResponse.user;
          } else {
            // Otherwise assume the response itself is the user data
            userData = userResponse;
          }
          
          
          if (!userData) {
            throw new Error('No user data found in API response');
          }
          
          const mappedUser = mapUserFromApi(userData);
          setProfileUser(mappedUser);
        } catch (apiError) {
          console.log('API fetch failed, trying alternative approach:', apiError);
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      setUserPosts(posts.filter(post => post.author?.id === id));
      setUserShowcases(entries.filter(entry => entry.author?.id === id));
      
      // Initialize following state if user is authenticated
      if (token && currentUser) {
        initializeFollowing();
      }
    }, [id, currentUser?.id, posts, entries, token, initializeFollowing])
  );

  useEffect(() => {
    // Animate progress
    Animated.timing(progressValue, {
      toValue: progressPercent / 100,
      duration: 1000,
      useNativeDriver: false
    }).start();

    fetchUserProfile();
  }, [id, posts, entries]);


  const handleBack = () => {
    router.back();
  };

  const handleFollow = async () => {
    if (!profileUser?.id) return;
    
    // Don't allow following yourself
    if (isOwnProfile) {
      Alert.alert('Error', 'You cannot follow yourself!');
      return;
    }
    
    // Get current following status
    const currentlyFollowing = isFollowingUser(profileUser.id);
    const followerDelta = currentlyFollowing ? -1 : 1;
    
    console.log('Handle follow - currently following:', currentlyFollowing, 'delta:', followerDelta);
    
    // Optimistically update the other user's follower count
    const currentFollowerCount = profileUser.followers || 0;
    const newFollowerCount = Math.max(0, currentFollowerCount + followerDelta);
    
    setProfileUser(prev => prev ? {
      ...prev,
      followers: newFollowerCount
    } : null);
    
    try {
      await toggleFollow(profileUser.id);
      console.log('Follow action completed successfully');
      
      // Refresh profile data to get accurate counts from server
      await fetchUserProfile();
      
      // Also refresh auth user data to update their following count
      await refreshUserData();
    } catch (error) {
      // Revert the optimistic update on error
      setProfileUser(prev => prev ? {
        ...prev,
        followers: currentFollowerCount
      } : null);
      console.error('Follow action failed:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const handleMessage = () => {
    router.push(`/messages/${id}`);
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  const handleShowcasePress = (showcase: ShowcaseEntry) => {
    router.push(`/showcase/${showcase.id}`);
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      Alert.alert("Error", "Couldn't open this link");
    });
  };

  const handleViewFollowers = () => {
    router.push('/profile/followers');
  };

  const handleViewFollowing = () => {
    router.push('/profile/following');
  };

  const handleDebugRefresh = async () => {
    console.log('🐛 Debug: Manual refresh triggered');
    await clearAuthCache();
    await refreshUserData();
    await fetchUserProfile();
    Alert.alert('Debug', 'Data refreshed! Check console for details.');
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin size={20} color="#0077B5" />;
      case 'twitter':
        return <Twitter size={20} color="#1DA1F2" />;
      case 'instagram':
        return <Instagram size={20} color="#E1306C" />;
      case 'facebook':
        return <Facebook size={20} color="#4267B2" />;
      case 'github':
        return <Github size={20} color="#333" />;
      default:
        return <ExternalLink size={20} color={Colors.dark.text} />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            {/* Profile Summary Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Profile Summary</Text>
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleEditProfile}
                  >
                    <Plus size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {profileUser?.bio ? (
                <Text style={styles.summaryText}>{profileUser.bio}</Text>
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    {isOwnProfile ? "Add your profile summary" : "No profile summary available"}
                  </Text>
                </View>
              )}
            </View>

            {/* Experience Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Experience</Text>
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleEditProfile}
                  >
                    <Plus size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {profileUser?.experience && profileUser.experience.length > 0 ? (
                profileUser.experience.map((exp, index) => (
                  <View key={index} style={styles.aboutItem}>
                    <Briefcase size={20} color={Colors.dark.tint} />
                    <View style={styles.aboutItemContent}>
                      <Text style={styles.aboutItemTitle}>{exp.position || exp.role}</Text>
                      <Text style={styles.aboutItemSubtitle}>{exp.company}</Text>
                      <Text style={styles.aboutItemDate}>
                        {exp.startYear} - {exp.current ? "Present" : exp.endYear}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    {isOwnProfile ? "Add your work experience" : "No experience listed"}
                  </Text>
                </View>
              )}
            </View>

            {/* Education Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Education</Text>
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleEditProfile}
                  >
                    <Plus size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {profileUser?.education && profileUser.education.length > 0 ? (
                profileUser.education.map((edu, index) => (
                  <View key={index} style={styles.aboutItem}>
                    <BookOpen size={20} color={Colors.dark.tint} />
                    <View style={styles.aboutItemContent}>
                      <Text style={styles.aboutItemTitle}>{edu.institution}</Text>
                      <Text style={styles.aboutItemSubtitle}>{edu.degree}</Text>
                      <Text style={styles.aboutItemDate}>{edu.startYear} - {edu.endYear}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    {isOwnProfile ? "Add your education" : "No education listed"}
                  </Text>
                </View>
              )}
            </View>

            {/* Skills Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Skills</Text>
                {isOwnProfile && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleEditProfile}
                  >
                    <Plus size={20} color={Colors.dark.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {profileUser?.skills && profileUser.skills.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {profileUser.skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>
                    {isOwnProfile ? "Add your skills" : "No skills listed"}
                  </Text>
                </View>
              )}
            </View>

            {/* Contact Information */}
            {(profileUser?.phone || profileUser?.email || profileUser?.website) && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Contact Information</Text>

                {profileUser.email && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactText}>{profileUser.email}</Text>
                  </View>
                )}

                {profileUser.phone && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactText}>{profileUser.phone}</Text>
                  </View>
                )}

                {profileUser.website && (
                  <View style={styles.contactItem}>
                    <Text style={styles.contactText}>{profileUser.website}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Career Illustration */}
            <View style={styles.careerIllustration}>
              <Briefcase size={60} color={Colors.dark.primary} style={{ opacity: 0.2 }} />
              <Text style={styles.careerIllustrationText}>
                Start adding your experience to validate
              </Text>
            </View>
          </View>
        );

      case 'portfolio':
        return (
          <View style={styles.tabContent}>
            {userShowcases.length > 0 ? (
              userShowcases.map(showcase => (
                <ShowcaseCard
                  key={showcase.id}
                  entry={showcase}
                  onPress={() => handleShowcasePress(showcase)}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {isOwnProfile
                    ? "You haven't added any portfolio items yet"
                    : "No portfolio items available"}
                </Text>
                {isOwnProfile && (
                  <Button
                    title="Add Portfolio Item"
                    onPress={() => router.push('/showcase/create')}
                    style={styles.emptyStateButton}
                  />
                )}
              </View>
            )}
          </View>
        );

      case 'posts':
        return (
          <View style={styles.tabContent}>
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPress={() => handlePostPress(post)}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  {isOwnProfile
                    ? "You haven't created any posts yet"
                    : "No posts available"}
                </Text>
                {isOwnProfile && (
                  <Button
                    title="Create Post"
                    onPress={() => router.push('/post/create')}
                    style={styles.emptyStateButton}
                  />
                )}
              </View>
            )}
          </View>
        );

      case 'replies':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                {isOwnProfile
                  ? "You haven't replied to any posts yet"
                  : "No replies available"}
              </Text>
              {isOwnProfile && (
                <Button
                  title="Explore Posts"
                  onPress={() => router.push('/(tabs)')}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Profile",
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: profileUser.name,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
          headerRight: isOwnProfile ? () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={handleDebugRefresh} style={[styles.editButton, { marginRight: 8 }]}>
                <Text style={{ color: Colors.dark.text, fontSize: 12 }}>🔄</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <Edit size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
          ) : undefined,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={profileUser.avatar}
              name={profileUser.name}
              size={80}
              showBorder
            />

            {/* Progress Circle */}
            <View style={styles.progressCircle}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{profileUser.name}</Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={handleEditProfile}>
                  <Edit size={16} color={Colors.dark.subtext} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.userBio}>{profileUser.bio}</Text>

            <View style={styles.metadataContainer}>
              <View style={styles.locationContainer}>
                <MapPin size={14} color={Colors.dark.subtext} />
                <Text style={styles.locationText}>{profileUser.location}</Text>
              </View>

              <View style={styles.joinedContainer}>
                <Calendar size={14} color={Colors.dark.subtext} />
                <Text style={styles.joinedText}>Joined {profileUser.joinedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Social Links */}
        {profileUser.socialLinks && profileUser.socialLinks.length > 0 && (
          <View style={styles.socialLinksContainer}>
            {profileUser.socialLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialIconButton}
                onPress={() => handleSocialLink(link.url)}
              >
                {getSocialIcon(link.platform)}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.profileViewsCard}>
            <BarChart2 size={20} color={Colors.dark.text} />
            <Text style={styles.profileViewsNumber}>{profileUser.profileViews}</Text>
            <Text style={styles.profileViewsText}>Profile Views</Text>
          </View>

          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <View style={styles.followStatsContainer}>
                <TouchableOpacity
                  style={styles.followStatButton}
                  onPress={handleViewFollowers}
                >
                  <Text style={styles.followStatNumber}>{profileUser.followers}</Text>
                  <Text style={styles.followStatLabel}>Followers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.followStatButton}
                  onPress={handleViewFollowing}
                >
                  <Text style={styles.followStatNumber}>{profileUser.following}</Text>
                  <Text style={styles.followStatLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.otherUserContainer}>
                {/* Display followers/following stats for other users */}
                <View style={styles.otherUserFollowStats}>
                  <TouchableOpacity
                    style={styles.otherUserStatButton}
                    onPress={handleViewFollowers}
                  >
                    <Text style={styles.followStatNumber}>{profileUser.followers || 0}</Text>
                    <Text style={styles.followStatLabel}>Followers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.otherUserStatButton}
                    onPress={handleViewFollowing}
                  >
                    <Text style={styles.followStatNumber}>{profileUser.following || 0}</Text>
                    <Text style={styles.followStatLabel}>Following</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Action buttons below stats */}
                <View style={styles.otherUserActionButtons}>
                  <Button
                    title={isFollowingUser(profileUser?.id || '') ? "Following" : "Follow"}
                    onPress={handleFollow}
                    style={styles.otherUserFollowButton}
                    variant={isFollowingUser(profileUser?.id || '') ? "outline" : "primary"}
                    gradient={!isFollowingUser(profileUser?.id || '')}
                    disabled={isLoading}
                  />

                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="outline"
                    style={styles.otherUserMessageButton}
                    leftIcon={<MessageSquare size={16} color={Colors.dark.text} />}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <TabBar
          tabs={[
            { id: 'about', label: 'About' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'posts', label: 'Posts' },
            { id: 'replies', label: 'Replies' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollable
          style={styles.tabBar}
        />

        {renderTabContent()}
      </ScrollView>
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
  editButton: {
    padding: 8,
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  progressCircle: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.dark.background,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.dark.secondary,
  },
  progressText: {
    color: Colors.dark.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  userBio: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  locationText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginLeft: 4,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  joinedText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginLeft: 4,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.dark.border,
    marginHorizontal: 16,
  },
  socialIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  profileViewsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 80,
  },
  profileViewsNumber: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  profileViewsText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  actionButtons: {
    flex: 1,
  },
  otherUserContainer: {
    flex: 1,
  },
  followStatsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 8,
  },
  otherUserFollowStats: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  followStatButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  otherUserStatButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  followStatNumber: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  followStatLabel: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  otherUserActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flex: 1,
    marginRight: 8,
  },
  messageButton: {
    flex: 1,
  },
  otherUserFollowButton: {
    flex: 1,
    height: 44,
  },
  otherUserMessageButton: {
    flex: 1,
    height: 44,
  },
  tabBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tabContent: {
    padding: 16,
  },
  aboutSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutSectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptySection: {
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptySectionText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  aboutItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  aboutItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  aboutItemTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  aboutItemSubtitle: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 2,
  },
  aboutItemDate: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    backgroundColor: Colors.dark.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  contactItem: {
    marginBottom: 10,
  },
  contactText: {
    color: Colors.dark.text,
  },
  careerIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  careerIllustrationText: {
    color: Colors.dark.subtext,
    marginTop: 12,
    fontSize: 14,
  },
  emptyStateContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    width: '80%',
  },
});