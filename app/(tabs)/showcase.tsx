import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  ImageBackground
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  X, 
  Camera, 
  Link, 
  Tag, 
  Upload,
  ChevronDown,
  Trophy,
  ArrowUp,
  Search,
  Filter
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '@/components/layout/AppHeader';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import TabBar from '@/components/ui/TabBar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useShowcaseStore } from '@/store/showcase-store';
import { useAuthStore } from '@/store/auth-store';
import { ShowcaseEntry } from '@/types';
import Colors from '@/constants/colors';

const MONTHS = ['April 25', 'March 25', 'Feb 25', 'Jan 25', 'Dec 24', 'Nov 24'];

export default function ShowcaseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { entries, fetchEntries, addEntry, isLoading } = useShowcaseStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeMonth, setActiveMonth] = useState(MONTHS[0]);
  const [sortOption, setSortOption] = useState('Latest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Derived state for my entries
  const [myEntries, setMyEntries] = useState<ShowcaseEntry[]>([]);
  const [featuredEntries, setFeaturedEntries] = useState<ShowcaseEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter entries created by the current user
    if (user && entries.length > 0) {
      setMyEntries(entries.filter(entry => entry.author?.id === user?.id));
      
      // Get featured entries (first 3 with most upvotes)
      const featured = [...entries]
        .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        .slice(0, 3);
      setFeaturedEntries(featured);
    }
  }, [entries, user]);

  const loadData = async () => {
    await fetchEntries();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEntryPress = (entry: ShowcaseEntry) => {
    router.push(`/showcase/${entry?.id}`);
  };
  
  const handleCreateShowcase = () => {
    router.push('/showcase/create');
  };

  const renderMonthTabs = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.monthTabsContainer}
        contentContainerStyle={styles.monthTabsContent}
      >
        {MONTHS.map((month) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthTab,
              activeMonth === month && styles.activeMonthTab
            ]}
            onPress={() => setActiveMonth(month)}
          >
            <Text 
              style={[
                styles.monthTabText,
                activeMonth === month && styles.activeMonthTabText
              ]}
            >
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderShowcaseBanner = () => {
    return (
      <TouchableOpacity 
        style={styles.bannerContainer}
        activeOpacity={0.9}
        onPress={() => Alert.alert('Startup Showcase', 'Submit your ideas by 25th April to participate in the showcase and win exciting prizes!')}
      >
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' }}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 16 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <Trophy size={24} color="#FFD700" />
                <Text style={styles.bannerTitle}>Startup Showcase</Text>
              </View>
              <Text style={styles.bannerSubtitle}>Submit your ideas by 25th April</Text>
              
              <View style={styles.prizeContainer}>
                <View style={styles.prizeItem}>
                  <Text style={styles.prizeRank}>🥇</Text>
                  <Text style={styles.prizeAmount}>₹15,000</Text>
                </View>
                <View style={styles.prizeItem}>
                  <Text style={styles.prizeRank}>🥈</Text>
                  <Text style={styles.prizeAmount}>₹10,000</Text>
                </View>
                <View style={styles.prizeItem}>
                  <Text style={styles.prizeRank}>🥉</Text>
                  <Text style={styles.prizeAmount}>₹5,000</Text>
                </View>
              </View>
              
              <Text style={styles.bannerNote}>Next top 22 win ₹1,000 each</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const renderEntriesHeader = () => {
    return (
      <View style={styles.entriesHeader}>
        <Text style={styles.entriesTitle}>112 Entries</Text>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortButtonText}>{sortOption}</Text>
          <ChevronDown size={16} color={Colors.dark.text} />
        </TouchableOpacity>
        
        {showSortOptions && (
          <View style={styles.sortOptionsContainer}>
            {['Latest', 'Popular', 'Random'].map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.sortOption}
                onPress={() => {
                  setSortOption(option);
                  setShowSortOptions(false);
                }}
              >
                <Text 
                  style={[
                    styles.sortOptionText,
                    sortOption === option && styles.activeSortOptionText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <ScrollView 
            style={styles.tabContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.dark.tint}
                colors={[Colors.dark.tint]}
              />
            }
          >
            {/* Search and Filter Bar */}
            <View style={styles.searchFilterContainer}>
              <TouchableOpacity 
                style={styles.searchBar}
                onPress={() => router.push('/search')}
              >
                <Search size={18} color={Colors.dark.subtext} />
                <Text style={styles.searchPlaceholder}>Search showcases...</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={18} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            
            {renderMonthTabs()}
            {renderShowcaseBanner()}
            
            {renderEntriesHeader()}
            
            {entries.map((entry) => (
              <ShowcaseCard 
                key={entry?.id}
                entry={entry} 
                onPress={() => handleEntryPress(entry)} 
              />
            ))}
          </ScrollView>
        );
      
      case 'my':
        return (
          <ScrollView 
            style={styles.tabContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.dark.tint}
                colors={[Colors.dark.tint]}
              />
            }
          >
            {myEntries && myEntries.length > 0 ? (
              <>
                <View style={styles.myShowcasesHeader}>
                  <Text style={styles.sectionTitle}>My Showcases</Text>
                  <TouchableOpacity onPress={handleCreateShowcase}>
                    <Text style={styles.createText}>+ Create New</Text>
                  </TouchableOpacity>
                </View>
                
                {myEntries.map(entry => (
                  <ShowcaseCard 
                    key={entry?.id}
                    entry={entry} 
                    onPress={() => handleEntryPress(entry)} 
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80' }}
                  style={styles.emptyStateImage}
                />
                <Text style={styles.emptyStateTitle}>No Showcases Yet</Text>
                <Text style={styles.emptyStateText}>
                  Share your projects, ideas, or designs with the community
                </Text>
                <Button
                  title="Create Showcase"
                  onPress={handleCreateShowcase}
                  gradient
                  style={styles.createButton}
                />
              </View>
            )}
          </ScrollView>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader 
        title="Showcase"
        showCreatePost={false}
      />
      
      <TabBar
        tabs={[
          { id: 'all', label: 'All Showcases' },
          { id: 'my', label: 'My Showcases' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {renderTabContent()}
      
      <TouchableOpacity 
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={handleCreateShowcase}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  listContent: {
    padding: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchPlaceholder: {
    color: Colors.dark.subtext,
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    padding: 10,
  },
  myShowcasesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateText: {
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    width: '80%',
  },
  fab: {
    position: 'absolute',
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
  // Month tabs styles
  monthTabsContainer: {
    marginBottom: 16,
  },
  monthTabsContent: {
    paddingRight: 16,
  },
  monthTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginRight: 8,
    backgroundColor: Colors.dark.card,
  },
  activeMonthTab: {
    backgroundColor: Colors.dark.tint,
  },
  monthTabText: {
    color: Colors.dark.text,
    fontWeight: '500',
  },
  activeMonthTabText: {
    color: '#fff',
  },
  // Banner styles
  bannerContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bannerContent: {
    width: '100%',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  prizeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  prizeItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  prizeRank: {
    fontSize: 20,
    marginBottom: 4,
  },
  prizeAmount: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bannerNote: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  // Entries header styles
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  entriesTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  sortButtonText: {
    color: Colors.dark.text,
    marginRight: 4,
  },
  sortOptionsContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
    width: 120,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sortOptionText: {
    color: Colors.dark.text,
  },
  activeSortOptionText: {
    color: Colors.dark.tint,
    fontWeight: '500',
  },
});