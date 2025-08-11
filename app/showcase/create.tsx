import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Award, 
  Upload, 
  Tag, 
  Link, 
  Plus, 
  X, 
  Lightbulb,
  Briefcase,
  FileText,
  Image as ImageIcon,
  ChevronLeft
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useShowcaseStore } from '@/store/showcase-store';
import { useAuthStore } from '@/store/auth-store';
import Colors from '@/constants/colors';
import Button from '@/components/ui/Button';

export default function CreateShowcase() {
  const router = useRouter();
  const { addEntry } = useShowcaseStore();
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [tagline, setTagline] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [demoVideoLink, setDemoVideoLink] = useState('');
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [logo, setLogo] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState('app');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (tags.length === 0) newErrors.tags = 'At least one tag is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePickImage = async (imageType = 'image') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (imageType === 'banner') {
          setBannerImages([...bannerImages, result.assets[0].uri]);
        } else if (imageType === 'logo') {
          setLogo(result.assets[0].uri);
        } else {
          setImages([...images, result.assets[0].uri]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (imageType === 'logo') {
        setLogo('https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=80&w=2070&auto=format&fit=crop');
      } else {
        setImages([...images, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop']);
      }
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleRemoveBannerImage = (index: number) => {
    const newBannerImages = [...bannerImages];
    newBannerImages.splice(index, 1);
    setBannerImages(newBannerImages);
  };

  const handleCreateShowcase = () => {
    if (!validateForm()) return;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a showcase');
      return;
    }
    
    // Use placeholder images if none selected (for demo purposes)
    const finalImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop'];
    
    const links: Record<string, string> = {};
    if (websiteLink) links.website = websiteLink;
    if (demoVideoLink) links.demoVideo = demoVideoLink;
    
    addEntry({
      id: `showcase-${Date.now()}`,
      title,
      description,
      images: finalImages,
      tags,
      upvotes: 0,
      comments: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      },
      links,
      upvoters: [],
      subtitle,
      tagline,
      problem,
      solution,
      revenueModel,
      bannerImages,
      logo,
      category
    });
    
    Alert.alert('Success', 'Your showcase has been created!', [
      { text: 'OK', onPress: () => router.push('/showcase') }
    ]);
  };

  const categories = [
    { id: 'app', label: 'App', icon: <Briefcase size={20} color={Colors.dark.text} /> },
    { id: 'idea', label: 'Idea', icon: <Lightbulb size={20} color={Colors.dark.text} /> },
    { id: 'design', label: 'Design', icon: <ImageIcon size={20} color={Colors.dark.text} /> },
    { id: 'article', label: 'Article', icon: <FileText size={20} color={Colors.dark.text} /> },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Showcase</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Logo Upload</Text>
            <Text style={styles.sectionSubtitle}>Upload your project logo</Text>
            
            <View style={styles.logoSection}>
              {logo ? (
                <View style={styles.logoContainer}>
                  <Image source={{ uri: logo }} style={styles.logoImage} />
                  <TouchableOpacity 
                    style={styles.removeLogoButton}
                    onPress={() => setLogo('')}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.addLogoButton}
                  onPress={() => handlePickImage('logo')}
                >
                  <Upload size={24} color={Colors.dark.subtext} />
                  <Text style={styles.addLogoText}>Add Logo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.sectionTitle}>Showcase Images *</Text>
            <Text style={styles.sectionSubtitle}>Upload images of your project</Text>
            
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScrollView}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addImageButton}
            onPress={() => handlePickImage('image')}
          >
            <Upload size={32} color={Colors.dark.subtext} />
            <Text style={styles.addImageText}>Add Image</Text>
          </TouchableOpacity>
        </ScrollView>
        {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

        <Text style={styles.sectionTitle}>Banner Images</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScrollView}
        >
          {bannerImages.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => handleRemoveBannerImage(index)}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addImageButton}
            onPress={() => handlePickImage('banner')}
          >
            <Upload size={32} color={Colors.dark.subtext} />
            <Text style={styles.addImageText}>Add Banner Image</Text>
          </TouchableOpacity>
        </ScrollView>
          </View>
          
          <View style={styles.categorySelector}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.activeCategoryButton
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  {cat.icon}
                  <Text style={[
                    styles.categoryText,
                    category === cat.id && styles.activeCategoryText
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Title *</Text>
            <View style={[styles.inputContainer, errors.title && styles.inputError]}>
              <Award size={20} color={Colors.dark.subtext} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Mango AI"
                placeholderTextColor={Colors.dark.subtext}
                value={title}
                onChangeText={setTitle}
              />
            </View>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tagline *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. ChatGPT, but for Noobs"
                placeholderTextColor={Colors.dark.subtext}
                value={tagline}
                onChangeText={setTagline}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <View style={[styles.textAreaContainer, errors.description && styles.inputError]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your project, what problem it solves, and how it works..."
                placeholderTextColor={Colors.dark.subtext}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Problem</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="What problem does your project solve?"
                placeholderTextColor={Colors.dark.subtext}
                value={problem}
                onChangeText={setProblem}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Solution</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="How does your project solve this problem?"
                placeholderTextColor={Colors.dark.subtext}
                value={solution}
                onChangeText={setSolution}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Revenue Model</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="How do you plan to monetize this project?"
                placeholderTextColor={Colors.dark.subtext}
                value={revenueModel}
                onChangeText={setRevenueModel}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Demo Video Link</Text>
            <View style={styles.inputContainer}>
              <Link size={20} color={Colors.dark.subtext} />
              <TextInput
                style={styles.input}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.dark.subtext}
                value={demoVideoLink}
                onChangeText={setDemoVideoLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags *</Text>
            <View style={[styles.tagsInputContainer, errors.tags && styles.inputError]}>
              <Tag size={20} color={Colors.dark.subtext} style={styles.tagIcon} />
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag and press +"
                placeholderTextColor={Colors.dark.subtext}
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Plus size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
            
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <X size={16} color={Colors.dark.text} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Project Links</Text>
          <Text style={styles.sectionSubtitle}>Add links to your project (optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <View style={styles.inputContainer}>
              <Link size={20} color={Colors.dark.subtext} />
              <TextInput
                style={styles.input}
                placeholder="https://yourproject.com"
                placeholderTextColor={Colors.dark.subtext}
                value={websiteLink}
                onChangeText={setWebsiteLink}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          
          <Button 
            title="Create Showcase" 
            onPress={handleCreateShowcase} 
            style={styles.submitButton}
            gradient
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    padding: 16,
  },
  imagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.dark.subtext,
    fontSize: 14,
    marginBottom: 12,
  },
  imagesScrollView: {
    marginBottom: 8,
  },
  imageContainer: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 160,
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.dark.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    color: Colors.dark.subtext,
    marginTop: 8,
  },
  categorySelector: {
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeCategoryButton: {
    backgroundColor: `${Colors.dark.primary}20`,
    borderColor: Colors.dark.primary,
  },
  categoryText: {
    color: Colors.dark.text,
    marginTop: 4,
    fontSize: 12,
  },
  activeCategoryText: {
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    marginLeft: 8,
    fontSize: 16,
  },
  textAreaContainer: {
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  textArea: {
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 120,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingLeft: 12,
  },
  tagIcon: {
    marginRight: 8,
  },
  tagInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  addTagButton: {
    backgroundColor: Colors.dark.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.dark.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    color: Colors.dark.text,
    marginRight: 6,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  logoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  removeLogoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLogoButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.dark.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  addLogoText: {
    color: Colors.dark.subtext,
    fontSize: 12,
    marginTop: 4,
  },
});
