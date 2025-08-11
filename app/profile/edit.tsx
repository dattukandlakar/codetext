import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  Mail,
  Phone,
  Link,
  Plus,
  Trash2
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth-store';
import { User as UserType } from '@/types';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapUserFromApi } from '@/utils/mapUserFromApi';
import { getUser, updateUserProfile, uploadProfileImage } from '@/api/user';
import Toast from 'react-native-toast-message';


interface Education {
  _id?: string;
  id?: string;
  name: string;
  school?: string;
  degree: string;
  field?: string;
  fos?: string; // field of study
  startYear: string | number;
  endYear: string | number;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
}

interface Experience {
  id?: string;
  company: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { updateUser, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form states initialized from Zustand user
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [coverImage, setCoverImage] = useState(user?.coverImage || '');
  const [education, setEducation] = useState(user?.education || []);
  const [experience, setExperience] = useState(user?.experience || []);
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const token:any = useAuthStore((state) => state.token);

  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images.'
        );
      }
    }
  };

  // Fetch user data from API
  useEffect(() => {
     fetchUserData(); // This line is removed as per the edit hint
  }, [coverImage, avatar]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
 
     const body = await getUser(token);
    
      
      const mapped = mapUserFromApi(body);
      updateUser(mapped);
      setName(mapped.name);
      setHeadline(mapped.headline || '');
      setBio(mapped.bio || '');
      setLocation(mapped.location || '');
      setEmail(mapped.email || '');
      setPhone(mapped.phone || '');
      setWebsite(mapped.website || '');
      setAvatar(mapped.avatar || '');
      setCoverImage(mapped.coverImage || '');
      setEducation(mapped.education || []);
      setExperience(mapped.experience || []);
      setSkills(mapped.skills || []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!name || !email) {
      Toast.show({
        type: 'error',
        text1: `Missing Information`,
        text2: 'Please fill in all required fields.',
      });
      return;
    }
    
    // Validate education entries
    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      if (!edu.name || !edu.name.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Education entry missing institution',
          text2: `Please fill in the institution for education entry #${i + 1}.`,
        });
        return;
      }
      if (!edu.startYear || !edu.startYear.toString().trim()) {
        Toast.show({
          type: 'error',
          text1: 'Education entry missing start year',
          text2: `Please fill in the start year for education entry #${i + 1}.`,
        });
        return;
      }
      if (!edu.current && (!edu.endYear || !edu.endYear.toString().trim())) {
        Toast.show({
          type: 'error',
          text1: 'Education entry missing end year',
          text2: `Please fill in the end year for education entry #${i + 1} or mark it as current.`,
        });
        return;
      }
    }

    // Validate experience entries
    for (let i = 0; i < experience.length; i++) {
      const exp = experience[i];
      if (!exp.company || !exp.company.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Experience entry missing company',
          text2: `Please fill in the company for experience entry #${i + 1}.`,
        });
        return;
      }
      if (!exp.startDate || !exp.startDate.toString().trim()) {
        Toast.show({
          type: 'error',
          text1: 'Experience entry missing start date',
          text2: `Please fill in the start date for experience entry #${i + 1}.`,
        });
        return;
      }
      if (!exp.current && (!exp.endDate || !exp.endDate.toString().trim())) {
        Toast.show({
          type: 'error',
          text1: 'Experience entry missing end date',
          text2: `Please fill in the end date for experience entry #${i + 1} or mark it as current.`,
        });
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      const formattedEducation = education?.map(({ id, _id, ...edu }) => {
        // Format dates as Date objects for backend
        let startYear = null;
        let endYear = null;
        
        if (edu.startYear) {
          if (edu.startYear instanceof Date) {
            startYear = edu.startYear;
          } else if (edu.startYear.toString().includes('T')) {
            // If it's ISO date string
            startYear = new Date(edu.startYear);
          } else {
            // If it's just a year string, create Date object for January 1st of that year
            const year = parseInt(edu.startYear.toString());
            if (!isNaN(year)) {
              startYear = new Date(year, 0, 1); // January 1st of the year
            }
          }
        }
        
        if (edu.current) {
          endYear = null; // Don't send endYear for current education
        } else if (edu.endYear) {
          if (edu.endYear instanceof Date) {
            endYear = edu.endYear;
          } else if (edu.endYear.toString().includes('T')) {
            endYear = new Date(edu.endYear);
          } else {
            // If it's just a year string, create Date object for December 31st of that year
            const year = parseInt(edu.endYear.toString());
            if (!isNaN(year)) {
              endYear = new Date(year, 11, 31); // December 31st of the year
            }
          }
        }
        
        const formattedEdu = {
          institution: edu.name || edu.school || '',
          degree: edu.degree || '',
          field: edu.field || edu.fos || '', // Use field or fos
          current: edu.current || false
        };
        
        if (startYear) formattedEdu.startYear = startYear;
        if (endYear) formattedEdu.endYear = endYear;
        
        return formattedEdu;
      });
      
      const formattedExperience = experience.map(({ id, ...exp }) => {
        // Format dates as Date objects for backend
        let startDate = null;
        let endDate = null;
        
        if (exp.startDate) {
          if (exp.startDate instanceof Date) {
            startDate = exp.startDate;
          } else if (exp.startDate.toString().includes('T')) {
            startDate = new Date(exp.startDate);
          } else if (exp.startDate.toString().includes('/')) {
            // Handle MM/YYYY format
            const parts = exp.startDate.toString().split('/');
            if (parts.length === 2) {
              const month = parseInt(parts[0]) - 1; // Month is 0-indexed
              const year = parseInt(parts[1]);
              if (!isNaN(month) && !isNaN(year)) {
                startDate = new Date(year, month, 1);
              }
            }
          } else {
            // If it's just a year string
            const year = parseInt(exp.startDate.toString());
            if (!isNaN(year)) {
              startDate = new Date(year, 0, 1); // January 1st of the year
            }
          }
        }
        
        if (exp.current) {
          endDate = null; // Don't send endDate for current experience
        } else if (exp.endDate) {
          if (exp.endDate instanceof Date) {
            endDate = exp.endDate;
          } else if (exp.endDate.toString().includes('T')) {
            endDate = new Date(exp.endDate);
          } else if (exp.endDate.toString().includes('/')) {
            // Handle MM/YYYY format
            const parts = exp.endDate.toString().split('/');
            if (parts.length === 2) {
              const month = parseInt(parts[0]) - 1;
              const year = parseInt(parts[1]);
              if (!isNaN(month) && !isNaN(year)) {
                // Last day of the month
                endDate = new Date(year, month + 1, 0);
              }
            }
          } else {
            // If it's just a year string
            const year = parseInt(exp.endDate.toString());
            if (!isNaN(year)) {
              endDate = new Date(year, 11, 31); // December 31st of the year
            }
          }
        }
        
        const formattedExp = {
          company: exp.company || '',
          position: exp.position || '',
          current: exp.current || false,
          description: exp.description || ''
        };
        
        if (startDate) formattedExp.startDate = startDate;
        if (endDate) formattedExp.endDate = endDate;
        
        return formattedExp;
      });

      // Debug skills before sending
      console.log('Skills being sent:', skills);
      console.log('Skills type:', typeof skills);
      console.log('Skills length:', skills?.length);
      
      // Ensure skills is a clean array of strings
      const formattedSkills = skills.filter(skill => skill && skill.trim()).map(skill => skill.trim());
      
      console.log('Formatted skills:', formattedSkills);

      const profileData = {
        name,
        headline,
        bio,
        location,
        email,
        phone,
        website,
        education: formattedEducation,
        experience: formattedExperience,
        skills: formattedSkills // Use formatted skills
      };
      
      // Debug the entire payload
      console.log('Profile data being sent:', JSON.stringify(profileData, null, 2));
      
      const updatedData = await updateUserProfile(token, profileData);
      
      // Debug the response
      console.log('Response from backend:', updatedData);
      
      fetchUserData();
      Toast.show({
        type: 'success',
        text1: 'Profile Updated!',
        text2: 'Your changes have been saved successfully.',
        position: 'top',
      });
      
      setTimeout(() => {
        router.back();
      }, 1000)
    } catch (error) {
      console.error('Save profile error:', error);
      let errorMessage = 'Failed to update profile';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Toast.show({
        type: 'error',
        text1: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async (isProfilePhoto: boolean = true) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: isProfilePhoto ? [1, 1] : [16, 9], // Square for profile, landscape for cover
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri, isProfilePhoto);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string, isProfilePhoto: boolean) => {
    try {
      setIsUploadingImage(true);

      const response = await uploadProfileImage(token, imageUri);
     
      // FIX: Use response.body.profileImage
      const newImageUrl = response?.body?.profileImage || '';
      if (newImageUrl) {
        if (isProfilePhoto) {
          setAvatar(newImageUrl);
          updateUser({ ...user, avatar: newImageUrl }); // Only update avatar
          mapUserFromApi(response)
        } else {
          setCoverImage(newImageUrl);
          updateUser({ ...user, coverImage: newImageUrl }); // Only update coverImage
          mapUserFromApi(response)
        }
        Toast.show({
          type: 'success',
          text1: 'Image Uploaded!',
          text2: `${isProfilePhoto ? 'Profile' : 'Cover'} photo updated successfully.`,
          position: 'top',
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'No image returned from server.',
        });
      }
    } catch (error) {
      let errorMessage = 'Failed to upload image';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: errorMessage,
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const showImagePickerOptions = (isProfilePhoto: boolean) => {
    Alert.alert(
      `Change ${isProfilePhoto ? 'Profile' : 'Cover'} Photo`,
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => takePhoto(isProfilePhoto),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage(isProfilePhoto),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async (isProfilePhoto: boolean = true) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: isProfilePhoto ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri, isProfilePhoto);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChangeCoverPhoto = () => {
    showImagePickerOptions(false);
  };

  const handleChangeProfilePhoto = () => {
    showImagePickerOptions(true);
  };

  const handleAddEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        name: '',
        school: '',
        degree: '',
        field: '',
        fos: '',
        startYear: '',
        endYear: '',
        current: false
      }
    ]);
  };

  const handleUpdateEducation = (index: number, field: string, value: string | boolean) => {
    const updatedEducation = [...education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setEducation(updatedEducation);
  };

  const handleRemoveEducation = (index: number) => {
    const updatedEducation = [...education];
    updatedEducation.splice(index, 1);
    setEducation(updatedEducation);
  };

  const handleAddExperience = () => {
    setExperience([
      ...experience,
      {
        id: Date.now().toString(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }
    ]);
  };

  const handleUpdateExperience = (index: number, field: string, value: string | boolean) => {
    const updatedExperience = [...experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    setExperience(updatedExperience);
  };

  const handleRemoveExperience = (index: number) => {
    const updatedExperience = [...experience];
    updatedExperience.splice(index, 1);
    setExperience(updatedExperience);
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    
    // Add validation and debugging
    console.log('Adding skill:', trimmedSkill);
    console.log('Current skills:', skills);
    
    if (!trimmedSkill) {
      Toast.show({
        type: 'error',
        text1: 'Empty Skill',
        text2: 'Please enter a skill name.',
      });
      return;
    }
    
    if (skills.includes(trimmedSkill)) {
      Toast.show({
        type: 'error',
        text1: 'Duplicate Skill',
        text2: 'This skill is already added.',
      });
      return;
    }
    
    const updatedSkills = [...skills, trimmedSkill];
    console.log('Updated skills:', updatedSkills);
    
    setSkills(updatedSkills);
    setNewSkill('');
    
    Toast.show({
      type: 'success',
      text1: 'Skill Added!',
      text2: `${trimmedSkill} has been added to your skills.`,
    });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    console.log('Removing skill:', skillToRemove);
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    console.log('Skills after removal:', updatedSkills);
    setSkills(updatedSkills);
    
    Toast.show({
      type: 'success',
      text1: 'Skill Removed!',
      text2: `${skillToRemove} has been removed from your skills.`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loader overlay while saving or uploading */}
      {(isLoading || isUploadingImage) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>
            {isUploadingImage ? 'Uploading image...' : 'Saving profile...'}
          </Text>
        </View>
      )}

      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.coverPhotoContainer}>
          <Image
            source={{ uri: coverImage || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80' }}
            style={styles.coverPhoto}
          />
          <TouchableOpacity
            style={styles.changeCoverButton}
            onPress={handleChangeCoverPhoto}
            disabled={isUploadingImage}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
          {isUploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.profilePhotoContainer}>
          <Image
            source={{ uri: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1760&q=80' }}
            style={styles.profilePhoto}
          />
          <TouchableOpacity
            style={styles.changeProfileButton}
            onPress={handleChangeProfilePhoto}
            disabled={isUploadingImage}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
          {isUploadingImage && (
            <View style={styles.profileUploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Full Name *"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.dark.subtext} />}
          />

          <Input
            label="Headline"
            placeholder="e.g. Software Engineer at Tech Company"
            value={headline}
            onChangeText={setHeadline}
            leftIcon={<Briefcase size={20} color={Colors.dark.subtext} />}
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Input
            label="Location"
            placeholder="e.g. Bangalore, India"
            value={location}
            onChangeText={setLocation}
            leftIcon={<MapPin size={20} color={Colors.dark.subtext} />}
          />

          <Text style={styles.sectionTitle}>Contact Information</Text>

          <Input
            label="Email *"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.dark.subtext} />}
          />

          <Input
            label="Phone"
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={Colors.dark.subtext} />}
          />

          <Input
            label="Website"
            placeholder="Enter your website URL"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            leftIcon={<Link size={20} color={Colors.dark.subtext} />}
          />

          <Text style={styles.sectionTitle}>Education</Text>

          {education?.map((edu, index) => {
            try {
              if (!edu) throw new Error(`Education entry at index ${index} is undefined`);
              if (typeof edu !== 'object') throw new Error(`Education entry at index ${index} is not an object`);
              
              // Get the start year for display
              const getStartYear = () => {
                if (edu.startDate) {
                  return new Date(edu.startDate).getFullYear().toString();
                }
                return edu.startYear ? edu.startYear.toString() : '';
              };

              // Get the end year for display
              const getEndYear = () => {
                if (edu.current) return 'Present';
                if (edu.endDate === null || edu.endDate === undefined) return 'Present';
                if (edu.endDate) {
                  return new Date(edu.endDate).getFullYear().toString();
                }
                return edu.endYear ? edu.endYear.toString() : '';
              };

              return (
                <View key={edu._id || edu.id || index} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Education #{index + 1}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveEducation(index)}
                    >
                      <Trash2 size={20} color={Colors.dark.error} />
                    </TouchableOpacity>
                  </View>
                  <Input
                    label="Institution"
                    placeholder="e.g. Stanford University"
                    value={edu.name || edu.school || ''}
                    onChangeText={(value) => handleUpdateEducation(index, 'name', value)}
                    leftIcon={<GraduationCap size={20} color={Colors.dark.subtext} />}
                  />
                  <Input
                    label="Degree"
                    placeholder="e.g. Bachelor's"
                    value={edu.degree || ''}
                    onChangeText={(value) => handleUpdateEducation(index, 'degree', value)}
                  />
                  <Input
                    label="Field of Study"
                    placeholder="e.g. Computer Science"
                    value={edu.field || edu.fos || ''}
                    onChangeText={(value) => handleUpdateEducation(index, 'field', value)}
                  />
                  <View style={styles.rowContainer}>
                    <Input
                      label="Start Year"
                      placeholder="YYYY"
                      value={getStartYear()}
                      onChangeText={(value) => handleUpdateEducation(index, 'startYear', value)}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                    <Input
                      label="End Year"
                      placeholder={edu.current || edu.endDate === null ? "Present" : "YYYY"}
                      value={getEndYear()}
                      onChangeText={(value) => handleUpdateEducation(index, 'endYear', value)}
                      keyboardType="numeric"
                      style={styles.halfInput}
                      editable={!edu.current && edu.endDate !== null}
                    />
                  </View>
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        (edu.current || edu.endDate === null) && styles.checkboxActive
                      ]}
                      onPress={() => {
                        const isCurrentlyActive = edu.current || edu.endDate === null;
                        handleUpdateEducation(index, 'current', !isCurrentlyActive);
                        if (!isCurrentlyActive) {
                          // If setting to current, clear endYear and set endDate to null
                          handleUpdateEducation(index, 'endYear', '');
                          handleUpdateEducation(index, 'endDate', null);
                        }
                      }}
                    >
                      {(edu.current || edu.endDate === null) && <View style={styles.checkboxInner} />}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>I am currently studying here</Text>
                  </View>
                </View>
              );
            } catch (err) {
              return (
                <View key={index} style={{ padding: 10, backgroundColor: '#fee', borderRadius: 8, marginBottom: 8 }}>
                  <Text style={{ color: 'red' }}>Error in education entry #{index + 1}: {err instanceof Error ? err.message : String(err)}</Text>
                  <Text selectable style={{ fontSize: 12, color: '#333' }}>{JSON.stringify(edu)}</Text>
                </View>
              );
            }
          })}

          <Button
            title="Add Education"
            onPress={handleAddEducation}
            variant="outline"
            leftIcon={<Plus size={20} color={Colors.dark.tint} />}
            style={styles.addButton}
          />

          <Text style={styles.sectionTitle}>Experience</Text>

          {experience.map((exp, index) => (
            <View key={exp.id || index} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Experience #{index + 1}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveExperience(index)}
                >
                  <Trash2 size={20} color={Colors.dark.error} />
                </TouchableOpacity>
              </View>

              <Input
                label="Company"
                placeholder="e.g. Google"
                value={exp.company}
                onChangeText={(value) => handleUpdateExperience(index, 'company', value)}
                leftIcon={<Briefcase size={20} color={Colors.dark.subtext} />}
              />

              <Input
                label="Position"
                placeholder="e.g. Software Engineer"
                value={exp.position || ''}
                onChangeText={(value) => handleUpdateExperience(index, 'position', value)}
              />

              <View style={styles.rowContainer}>
                <Input
                  label="Start Date"
                  placeholder="MM/YYYY"
                  value={exp.startDate || ''}
                  onChangeText={(value) => handleUpdateExperience(index, 'startDate', value)}
                  style={styles.halfInput}
                />

                <Input
                  label="End Date"
                  placeholder={exp.current ? "Present" : "MM/YYYY"}
                  value={exp.current ? "Present" : exp.endDate || ''}
                  onChangeText={(value) => handleUpdateExperience(index, 'endDate', value)}
                  style={styles.halfInput}
                  editable={!exp.current}
                />
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    exp.current && styles.checkboxActive
                  ]}
                  onPress={() => handleUpdateExperience(index, 'current', !exp.current)}
                >
                  {exp.current && <View style={styles.checkboxInner} />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>I am currently working here</Text>
              </View>

              <Input
                label="Description"
                placeholder="Describe your responsibilities and achievements"
                value={exp.description || ''}
                onChangeText={(value) => handleUpdateExperience(index, 'description', value)}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            </View>
          ))}

          <Button
            title="Add Experience"
            onPress={handleAddExperience}
            variant="outline"
            leftIcon={<Plus size={20} color={Colors.dark.tint} />}
            style={styles.addButton}
          />

          <Text style={styles.sectionTitle}>Skills</Text>

          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity
                  style={styles.removeSkillButton}
                  onPress={() => handleRemoveSkill(skill)}
                >
                  <Trash2 size={16} color={Colors.dark.text} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Input
            label="Add Skill"
            placeholder="Enter a skill (e.g. JavaScript, React)"
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={handleAddSkill}
            returnKeyType="done"
          />
          
          <Button
            title="Add Skill"
            onPress={handleAddSkill}
            variant="outline"
            leftIcon={<Plus size={20} color={Colors.dark.tint} />}
            style={styles.addSkillButton}
            disabled={!newSkill.trim()}
          />

          <Button
            title="Save Profile"
            onPress={handleSave}
            gradient
            style={styles.saveButton}
            disabled={isUploadingImage}
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
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  coverPhotoContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  changeCoverButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.dark.background,
  },
  changeProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  itemContainer: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: Colors.dark.tint,
    backgroundColor: Colors.dark.tint,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    backgroundColor: Colors.dark.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillText: {
    color: Colors.dark.text,
    marginRight: 8,
  },
  removeSkillButton: {
    padding: 2,
  },
  addSkillButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileUploadingOverlay: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 12,
  },
});