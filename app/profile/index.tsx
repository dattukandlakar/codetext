import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Edit2,
  MapPin,
  Briefcase,
  GraduationCap,
  Settings,
  MessageCircle,
  Calendar,
  BarChart2,
  Plus
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import TabBar from '@/components/ui/TabBar';
import { useAuthStore } from '@/store/auth-store';
import { usePostStore } from '@/store/post-store';
import { useShowcaseStore } from '@/store/showcase-store';
import PostCard from '@/components/home/PostCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import Colors from '@/constants/colors';
import Avatar from '@/components/ui/Avatar';
import { mapUserFromApi } from '@/utils/mapUserFromApi';
import { getUser } from '@/api/user';

// Define a User type for your user object
type User = {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  email: string;
  joinedDate: string;
  education: any[];
  experience: any[];
  skills: string[];
  phone: string;
  headline: string;
  website: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  profileViews: number;
  socialLinks: any[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const user = useAuthStore(state => state.user); // Use Zustand user only
  const { posts } = usePostStore();
  const { entries } = useShowcaseStore();
  const [activeTab, setActiveTab] = useState('about');
  // No API call, no local user state, no setUser
  // Use Zustand user for all profile info and rendering
  const token: any = useAuthStore((state) => state.token);
  

  React.useEffect(() => {
    // This effect is no longer needed as user data is managed by Zustand
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSettings = () => {
    router.push('/settings' as any);
  };

  const handleMessage = () => {
    // Would navigate to a direct message with this user
    router.push('/messages/new');
  };

  const handleShare = () => {
    // Would implement share profile functionality
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleShowcasePress = (showcaseId: string) => {
    router.push(`/showcase/${showcaseId}`);
  };

  const handleViewFollowers = () => {
    router.push('/profile/followers');
  };

  const handleViewFollowing = () => {
    router.push('/profile/following');
  };

  // Filter posts by the current user
  const userPosts = user && user.id ? posts.filter(post => post.author?.id === user.id) : [];
  // Filter showcases by the current user
  const userShowcases = user && user.id ? entries.filter(entry => entry.author?.id === user.id) : [];

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            {/* Profile Summary Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Profile Summary</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditProfile}
                >
                  <Plus size={20} color={Colors.dark.primary} />
                </TouchableOpacity>
              </View>

              {user.bio ? (
                <Text style={styles.summaryText}>{user.bio}</Text>
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Add your profile summary</Text>
                </View>
              )}
            </View>

            {/* Experience Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Experience</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditProfile}
                >
                  <Plus size={20} color={Colors.dark.primary} />
                </TouchableOpacity>
              </View>

              {user.experience && user.experience.length > 0 ? (
                user.experience.map((exp, index) => (
                  <View key={exp.id || index} style={styles.experienceItem}>
                    <Briefcase size={20} color={Colors.dark.tint} />
                    <View style={styles.experienceContent}>
                      <Text style={styles.experienceRole}>{exp.position}</Text>
                      <Text style={styles.experienceCompany}>{exp.company}</Text>
                      <Text style={styles.experienceDuration}>
                        {exp.startDate ? new Date(exp.startDate).getFullYear() : exp.startYear} - {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : exp.endYear}
                      </Text>
                      {exp.description && (
                        <Text style={styles.experienceDescription}>
                          {exp.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Add your work experience</Text>
                </View>
              )}
            </View>

            {/* Education Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Education</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditProfile}
                >
                  <Plus size={20} color={Colors.dark.primary} />
                </TouchableOpacity>
              </View>

              {user.education && user.education.length > 0 ? (
                user.education.map((edu, index) => {
                  // Extract start year from startDate
                  const startYear = edu.startDate 
                    ? new Date(edu.startDate).getFullYear() 
                    : edu.startYear?.split('-')[0] || 'N/A';
                  
                  // Determine end year or "Currently Working"
                  const endDisplay = edu.endDate 
                    ? new Date(edu.endDate).getFullYear()
                    : 'Currently Working';

                  return (
                    <View key={edu._id || edu.id || index} style={styles.educationItem}>
                      <GraduationCap size={20} color={Colors.dark.tint} />
                      <View style={styles.educationContent}>
                        <Text style={styles.educationDegree}>
                          {edu.degree} {edu.fos ? `in ${edu.fos}` : ''}
                        </Text>
                        <Text style={styles.educationInstitution}>
                          {edu.name || edu.school}
                        </Text>
                        <Text style={styles.educationYears}>
                          {startYear} - {endDisplay}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Add your education</Text>
                </View>
              )}
            </View>

            {/* Skills Section */}
            <View style={styles.aboutSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.aboutSectionTitle}>Skills</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditProfile}
                >
                  <Plus size={20} color={Colors.dark.primary} />
                </TouchableOpacity>
              </View>

              {user.skills && user.skills.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {user.skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>Add your skills</Text>
                </View>
              )}
            </View>

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
                  onPress={() => handleShowcasePress(showcase.id)}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  You haven't added any portfolio items yet
                </Text>
                <Button
                  title="Add Portfolio Item"
                  onPress={() => router.push('/showcase/create')}
                  style={styles.emptyStateButton}
                />
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
                  onPress={() => handlePostPress(post.id)}
                />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  You haven't created any posts yet
                </Text>
                <Button
                  title="Create Post"
                  onPress={() => router.push('/post/create')}
                  style={styles.emptyStateButton}
                />
              </View>
            )}
          </View>
        );

      case 'replies':
        return (
          <View style={styles.tabContent}>
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                You haven't replied to any posts yet
              </Text>
              <Button
                title="Explore Posts"
                onPress={() => router.push('/(tabs)')}
                style={styles.emptyStateButton}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          headerRight: () => (
            <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
              <Settings size={22} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={user.avatar}
              name={user.name}
              size={80}
              showBorder
            />

            {/* Progress Circle */}
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>10%</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name}</Text>
              <TouchableOpacity onPress={handleEditProfile}>
                <Edit2 size={16} color={Colors.dark.subtext} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userBio}>{user.headline}</Text>

            <View style={styles.metadataContainer}>
              {user.location && (
                <View style={styles.locationContainer}>
                  <MapPin size={14} color={Colors.dark.subtext} />
                  <Text style={styles.locationText}>{user.location}</Text>
                </View>
              )}

              {user.joinedDate && (
                <View style={styles.joinedContainer}>
                  <Calendar size={14} color={Colors.dark.subtext} />
                  <Text style={styles.joinedText}>Joined {user.joinedDate}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Social Links */}
        {user.socialLinks && user.socialLinks.length > 0 && (
          <View style={styles.socialLinksContainer}>
            {user.socialLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialIconButton}
                onPress={() => { }}
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
            <Text style={styles.profileViewsNumber}>{user.profileViews || 0}</Text>
            <Text style={styles.profileViewsText}>Profile Views</Text>
          </View>

          <View style={styles.actionButtons}>
            <View style={styles.followStatsContainer}>
              <TouchableOpacity
                style={styles.followStatButton}
                onPress={handleViewFollowers}
              >
                <Text style={styles.followStatNumber}>{user.followers || 0}</Text>
                <Text style={styles.followStatLabel}>Followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.followStatButton}
                onPress={handleViewFollowing}
              >
                <Text style={styles.followStatNumber}>{user.following || 0}</Text>
                <Text style={styles.followStatLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Message"
              onPress={handleMessage}
              variant="outline"
              style={styles.messageButton}
              leftIcon={<MessageCircle size={18} color={Colors.dark.text} />}
            />
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

// Helper function to get social media icons
const getSocialIcon = (platform: string) => {
  const iconSize = 20;

  switch (platform) {
    case 'linkedin':
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174857.png' }} style={{ width: iconSize, height: iconSize }} />;
    case 'twitter':
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' }} style={{ width: iconSize, height: iconSize }} />;
    case 'instagram':
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' }} style={{ width: iconSize, height: iconSize }} />;
    case 'facebook':
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174848.png' }} style={{ width: iconSize, height: iconSize }} />;
    case 'github':
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/25/25231.png' }} style={{ width: iconSize, height: iconSize }} />;
    default:
      return <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }} style={{ width: iconSize, height: iconSize }} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
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
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  progressText: {
    color: '#fff',
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
  followStatsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  followStatButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
  messageButton: {
    width: '100%',
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
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  experienceContent: {
    marginLeft: 12,
    flex: 1,
  },
  experienceRole: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  experienceCompany: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 2,
  },
  experienceDuration: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  experienceDescription: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  educationContent: {
    marginLeft: 12,
    flex: 1,
  },
  educationDegree: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  educationInstitution: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 2,
  },
  educationYears: {
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
  careerIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  careerIllustrationText: {
    color: Colors.dark.subtext,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
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