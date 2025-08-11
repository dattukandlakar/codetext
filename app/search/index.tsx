import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search, X, ArrowLeft, User, Briefcase, Calendar, FileText } from 'lucide-react-native';
import TabBar from '@/components/ui/TabBar';
import { usePostStore } from '@/store/post-store';
import { useJobStore } from '@/store/job-store';
import { useEventStore } from '@/store/event-store';
import { useShowcaseStore } from '@/store/showcase-store';
import { useAuthStore } from '@/store/auth-store';
import PostCard from '@/components/home/PostCard';
import JobCard from '@/components/jobs/JobCard';
import EventCard from '@/components/events/EventCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import Avatar from '@/components/ui/Avatar';
import Colors from '@/constants/colors';

export default function SearchScreen() {
  const router = useRouter();
  const { posts = [] } = usePostStore();
  const { jobs = [] } = useJobStore();
  const { events = [] } = useEventStore();
  const { entries = [] } = useShowcaseStore();
  const { users = [] } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    all: [],
    people: [],
    posts: [],
    jobs: [],
    events: [],
    showcase: []
  });

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      clearResults();
    }
  }, [searchQuery, activeTab]);

  const performSearch = () => {
    setIsSearching(true);
    
    const query = searchQuery.toLowerCase();
    
    // Search people
    const peopleResults = users.filter(user => 
      (user.name && user.name.toLowerCase().includes(query)) || 
      (user.headline && user.headline.toLowerCase().includes(query))
    );
    
    // Search posts
    const postsResults = posts.filter(post => 
      (post.content && post.content.toLowerCase().includes(query)) || 
      (post.author && post.author.name && post.author.name.toLowerCase().includes(query))
    );
    
    // Search jobs
    const jobsResults = jobs.filter(job => 
      (job.title && job.title.toLowerCase().includes(query)) || 
      (job.company && job.company.toLowerCase().includes(query)) || 
      (Array.isArray(job.skills) && job.skills.some(skill => skill && skill.toLowerCase().includes(query)))
    );
    
    // Search events
    const eventsResults = events.filter(event => 
      (event.title && event.title.toLowerCase().includes(query)) || 
      (event.description && event.description.toLowerCase().includes(query)) || 
      (event.location && event.location.toLowerCase().includes(query))
    );
    
    // Search showcase
    const showcaseResults = entries.filter(entry => 
      (entry.title && entry.title.toLowerCase().includes(query)) || 
      (entry.description && entry.description.toLowerCase().includes(query)) || 
      (Array.isArray(entry.tags) && entry.tags.some(tag => tag && tag.toLowerCase().includes(query)))
    );
    
    // Combine all results for "all" tab
    const allResults = [
      ...peopleResults.map(item => ({ type: 'person', item })),
      ...postsResults.map(item => ({ type: 'post', item })),
      ...jobsResults.map(item => ({ type: 'job', item })),
      ...eventsResults.map(item => ({ type: 'event', item })),
      ...showcaseResults.map(item => ({ type: 'showcase', item }))
    ];
    
    setSearchResults({
      all: allResults,
      people: peopleResults,
      posts: postsResults,
      jobs: jobsResults,
      events: eventsResults,
      showcase: showcaseResults
    });
    
    setIsSearching(false);
  };

  const clearResults = () => {
    setSearchResults({
      all: [],
      people: [],
      posts: [],
      jobs: [],
      events: [],
      showcase: []
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    clearResults();
  };

  const handleBack = () => {
    router.back();
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleJobPress = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleShowcasePress = (showcaseId: string) => {
    router.push(`/showcase/${showcaseId}`);
  };

  const renderAllItem = ({ item }) => {
    switch (item.type) {
      case 'person':
        return renderPersonItem({ item: item.item });
      case 'post':
        return <PostCard post={item.item} onPress={() => handlePostPress(item.item.id)} />;
      case 'job':
        return <JobCard job={item.item} onPress={() => handleJobPress(item.item.id)} />;
      case 'event':
        return <EventCard event={item.item} onPress={() => handleEventPress(item.item.id)} />;
      case 'showcase':
        return <ShowcaseCard entry={item.item} onPress={() => handleShowcasePress(item.item.id)} />;
      default:
        return null;
    }
  };

  const renderPersonItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.personItem}
      onPress={() => handleUserPress(item.id)}
    >
      <Avatar source={item.avatar} size={50} />
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.name}</Text>
        {item.headline && (
          <Text style={styles.personHeadline}>{item.headline}</Text>
        )}
        {item.location && (
          <Text style={styles.personLocation}>{item.location}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getActiveResults = () => {
    switch (activeTab) {
      case 'all':
        return searchResults.all;
      case 'people':
        return searchResults.people;
      case 'posts':
        return searchResults.posts;
      case 'jobs':
        return searchResults.jobs;
      case 'events':
        return searchResults.events;
      case 'showcase':
        return searchResults.showcase;
      default:
        return [];
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim().length > 0 ? (
        <>
          <Search size={60} color={Colors.dark.subtext} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try different keywords or filters</Text>
        </>
      ) : (
        <>
          <Search size={60} color={Colors.dark.subtext} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Search for people, posts, jobs, events, and more</Text>
          <Text style={styles.emptySubtext}>Enter keywords in the search bar above</Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.dark.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.dark.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={performSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color={Colors.dark.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <TabBar
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'people', label: 'People' },
          { id: 'posts', label: 'Posts' },
          { id: 'jobs', label: 'Jobs' },
          { id: 'events', label: 'Events' },
          { id: 'showcase', label: 'Showcase' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scrollable
      />
      
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={getActiveResults()}
          keyExtractor={(item, index) => `${activeTab}-${index}-${item.id || item.item?.id}`}
          renderItem={activeTab === 'all' ? renderAllItem : 
                     activeTab === 'people' ? renderPersonItem : 
                     activeTab === 'posts' ? ({ item }) => <PostCard post={item} onPress={() => handlePostPress(item.id)} /> :
                     activeTab === 'jobs' ? ({ item }) => <JobCard job={item} onPress={() => handleJobPress(item.id)} /> :
                     activeTab === 'events' ? ({ item }) => <EventCard event={item} onPress={() => handleEventPress(item.id)} /> :
                     ({ item }) => <ShowcaseCard entry={item} onPress={() => handleShowcasePress(item.id)} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 100,
    paddingHorizontal: 12,
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
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  personItem: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  personInfo: {
    marginLeft: 12,
    flex: 1,
  },
  personName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  personHeadline: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 4,
  },
  personLocation: {
    color: Colors.dark.subtext,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    marginTop: 12,
  },
});