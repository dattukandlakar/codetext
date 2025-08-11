# Story Upload API Integration Test

## Overview
The story upload functionality has been successfully integrated into the React Native app with support for both photos and videos. Here's what was implemented:

## Components Created/Modified

### 1. API Functions (`api/user.ts`)
- Added `uploadStory(token: string, mediaUri: string, mediaType: 'image' | 'video')` function
- Added `getUserStories(token: string)` function to fetch user's own stories
- Uses FormData to upload images and videos to `https://social-backend-zid2.onrender.com/user/upload/story`
- Fetches user stories from `https://social-backend-zid2.onrender.com/user/story/self`
- Automatically sets correct MIME types and file extensions based on media type
- Includes proper error handling and token authentication

### 2. StoryUploadModal Component (`components/ui/StoryUploadModal.tsx`)
- Enhanced modal component for story upload with photo and video support
- Features:
  - **Photos**: Camera capture and gallery selection
  - **Videos**: Video recording and gallery selection (max 15 seconds)
  - Media preview before upload
  - Loading states during upload
  - Permission handling for camera and media library
  - Proper error handling and user feedback
  - Organized UI with separate sections for photos and videos

### 3. StoriesSection Integration (`components/home/StoriesSection.tsx`)
- Integrated StoryUploadModal into existing stories section
- Modal opens when user taps "Your Activity" story circle (if no stories exist)
- Handles upload success callbacks

### 4. Post Store Updates (`store/post-store.ts`)
- Updated `fetchStories()` to use real API endpoint `/user/story/self`
- Updated `addStory()` to refresh stories from API after upload
- Combines user stories with mock stories for complete story feed
- Includes proper error handling and fallback to mock data

### 5. Home Page Updates (`app/(tabs)/index.tsx`)
- Removed direct ImagePicker usage
- Now uses the modal-based approach for better UX

## API Endpoint Details

**Endpoint:** `POST https://social-backend-zid2.onrender.com/user/upload/story`

**Headers:**
- `token`: JWT authentication token
- `Content-Type`: multipart/form-data (automatically set by FormData)

**Body:**
- `media`: Image or video file (FormData)

**Example cURL for Image:**
```bash
curl --location 'https://social-backend-zid2.onrender.com/user/upload/story' \
--header 'token: YOUR_JWT_TOKEN' \
--form 'media=@"path/to/image.jpg"'
```

**Example cURL for Video:**
```bash
curl --location 'https://social-backend-zid2.onrender.com/user/upload/story' \
--header 'token: YOUR_JWT_TOKEN' \
--form 'media=@"path/to/video.mp4"'
```

**Example cURL for Fetching User Stories:**
```bash
curl --location 'https://social-backend-zid2.onrender.com/user/story/self' \
--header 'token: YOUR_JWT_TOKEN'
```

## Testing the Integration

### 1. Manual Testing Steps:
1. Open the app and navigate to the Home tab
2. Look for the "Your Activity" story circle (first circle in stories section)
3. If you have no stories, you'll see a "+" icon
4. Tap on the story circle to open the upload modal
5. Choose from the available options:
   - **Photos**: Camera or Gallery
   - **Videos**: Record or Select Video
6. Select or capture your media
7. Preview the media and tap "Upload Story"
8. Verify the upload completes successfully

### 2. Expected Behavior:
- Modal should open with organized sections for photos and videos
- Photo options: Camera and Gallery
- Video options: Record (max 15 seconds) and Select Video
- Media selection should work with proper permissions
- Preview should show image or video placeholder
- Upload should show loading state
- Success message should appear on completion
- Modal should close and stories should refresh
- User's own stories should be fetched from API and displayed
- Stories should update automatically after successful upload

### 3. Error Handling:
- Permission denied scenarios
- Network errors during upload
- Invalid image formats
- Authentication token issues

## Technical Implementation Details

### FormData Structure:
```javascript
const formData = new FormData();
formData.append('media', {
  uri: mediaUri,
  name: mediaType === 'image' ? 'story.jpg' : 'story.mp4',
  type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
} as any);
```

### Permission Handling:
- Camera permissions for taking photos
- Media library permissions for selecting from gallery
- Graceful fallback with user-friendly error messages

### Media Processing:
- **Photos**: Aspect ratio: 9:16 (story format), Quality: 0.8
- **Videos**: Aspect ratio: 9:16 (story format), Max duration: 15 seconds, Quality: 0.8
- Allows editing before upload for both media types

## Dependencies Used:
- `expo-image-picker`: For camera and gallery access
- `lucide-react-native`: For UI icons
- Existing auth store for token management
- Existing color constants for consistent theming

## Future Enhancements:
1. Add story filters and effects
2. Support for video stories
3. Story expiration handling
4. Story analytics
5. Story reactions and replies 