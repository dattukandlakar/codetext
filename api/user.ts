// api/user.ts
 const API_BASE = 'https://social-backend-zid2.onrender.com';

export async function getUser(token: string) {
  const res = await fetch(`${API_BASE}/user/getUser`, {
    method: 'GET',
    headers: {
      token: token,
      'Content-Type': 'application/json',
    },
    
  });
  if (!res.ok) throw new Error(await res.text());
  const response = await res.json();
  console.log('getUser response:', response.body.education);
  console.log('getUser response:', response.body.experience);
  return response.body;
}

export async function updateUserProfile(token: string, profileData: any) {
  const res = await fetch(`${API_BASE}/user/update`, {
    method: 'POST',
    headers: {
      token: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getUserById(token: string, userId: string) {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    method: 'GET',
    headers: {
      token: token,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const response = await res.json();
  return response;
}

export async function uploadProfileImage(token: string, imageUri: string) {

  const formData = new FormData();

  formData.append('image', {
    uri: imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  } as any);
  formData.append('profileImage', {
    uri: imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_BASE}/user/uploadProfileImage`, {
    method: 'POST',
    headers: {
      token: token,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Fixed uploadStory function with proper video handling
export async function uploadStory(
  token: string,
  mediaUri: string,
  mediaType: 'image' | 'video'
) {
  try {
    if (typeof mediaUri !== 'string' || !mediaUri || mediaUri.trim() === '') {
      throw new Error('Invalid media URI: URI is empty or invalid');
    }

    console.log('Starting upload with URI:', mediaUri);

    // ✅ CRITICAL: For React Native, we need to create a proper file object
    // The issue is likely in how FormData handles video files vs images
    
    const formData = new FormData();

    let fileExtension = 'jpg';
    let mimeType = 'image/jpeg';
    let fileName: string;

    // Extract file extension
    const uriParts = mediaUri.split('.');
    if (uriParts.length > 1) {
      fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    }

    if (mediaType === 'image') {
      switch (fileExtension) {
        case 'png':
          mimeType = 'image/png';
          fileName = `story_${Date.now()}.png`;
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          fileName = `story_${Date.now()}.jpg`;
          break;
        case 'heic':
          mimeType = 'image/heic';
          fileName = `story_${Date.now()}.heic`;
          break;
        default:
          mimeType = 'image/jpeg';
          fileName = `story_${Date.now()}.jpg`;
      }
    } else {
      // ✅ FIXED: Better video MIME type handling
      switch (fileExtension) {
        case 'mp4':
          mimeType = 'video/mp4';
          fileName = `story_${Date.now()}.mp4`;
          break;
        case 'mov':
          mimeType = 'video/quicktime';
          fileName = `story_${Date.now()}.mov`;
          break;
        case 'avi':
          mimeType = 'video/x-msvideo';
          fileName = `story_${Date.now()}.avi`;
          break;
        case 'm4v':
          mimeType = 'video/x-m4v';
          fileName = `story_${Date.now()}.m4v`;
          break;
        default:
          // ✅ IMPORTANT: Default to mp4 for unknown video formats
          mimeType = 'video/mp4';
          fileName = `story_${Date.now()}.mp4`;
      }
    }

    // ✅ CRITICAL FIX: Proper file object creation for React Native
    const fileObject = {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    };

    console.log('File object being uploaded:', fileObject);

    // Use consistent field name 'file' which matches backend expectation
    formData.append('file', fileObject as any);

    console.log('Uploading story with:', {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
      mediaType
    });

    const response = await fetch(`${API_BASE}/user/upload/story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // ✅ CRITICAL: Don't set Content-Type for multipart/form-data
        // Let the browser/RN set the boundary automatically
      },
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      throw new Error(errorText || `HTTP ${response.status}: Failed to upload story`);
    }

    const result = await response.json();
    console.log('Upload success:', result);
    return result;

  } catch (error) {
    console.error('Story upload error:', error);
    throw error;
  }
}

// ✅ Alternative video upload method with base64 encoding
export async function uploadStoryWithBase64(
  token: string,
  mediaUri: string,
  mediaType: 'image' | 'video'
) {
  try {
    console.log('Base64 upload method - Starting with:', { mediaUri, mediaType });

    if (typeof mediaUri !== 'string' || !mediaUri || mediaUri.trim() === '') {
      throw new Error('Invalid media URI: URI is empty or invalid');
    }

    // ✅ For videos that fail with FormData, try base64 encoding
    // This is especially useful for camera-captured videos
    
    let base64Data: string;
    let mimeType: string;
    
    if (mediaType === 'video') {
      // Note: You'll need to install expo-file-system for this to work
      // import * as FileSystem from 'expo-file-system';
      
      // For now, let's try a different approach with proper file handling
      const fileExtension = mediaUri.split('.').pop()?.toLowerCase() || 'mp4';
      
      switch (fileExtension) {
        case 'mov':
          mimeType = 'video/quicktime';
          break;
        case 'avi':
          mimeType = 'video/x-msvideo';
          break;
        default:
          mimeType = 'video/mp4';
      }
    } else {
      const fileExtension = mediaUri.split('.').pop()?.toLowerCase() || 'jpg';
      mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    }

    // ✅ Try sending as JSON payload instead of FormData
    const payload = {
      mediaUri: mediaUri,
      mediaType: mediaType,
      mimeType: mimeType,
      fileName: `story_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
    };

    const response = await fetch(`${API_BASE}/user/upload/story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Base64 upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Base64 upload error response:', errorText);
      throw new Error(errorText || `HTTP ${response.status}: Failed to upload story`);
    }

    const result = await response.json();
    console.log('Base64 upload success:', result);
    return result;
  } catch (error) {
    console.error('Base64 story upload error:', error);
    throw error;
  }
}

// ✅ Video-specific upload function with better error handling
// export async function uploadVideoStory(
//   token: string,
//   mediaUri: string
// ) {
//   try {
//     console.log('Video-specific upload - Starting with:', mediaUri);

//     if (typeof mediaUri !== 'string' || !mediaUri || mediaUri.trim() === '') {
//       throw new Error('Invalid video URI');
//     }

//     const formData = new FormData();
    
//     // ✅ Simplified video handling
//     const timestamp = Date.now();
//     const fileExtension = mediaUri.split('.').pop()?.toLowerCase() || 'mp4';
    
//     let mimeType: string;
//     switch (fileExtension) {
//       case 'mov':
//         mimeType = 'video/quicktime';
//         break;
//       case 'm4v':
//         mimeType = 'video/x-m4v';
//         break;
//       default:
//         mimeType = 'video/mp4';
//     }

//     const videoFile = {
//       uri: mediaUri,
//       type: mimeType,
//       name: `video_story_${timestamp}.${fileExtension}`,
//     };

//     console.log('Video file object:', videoFile);

//     // ✅ Try multiple field names for video uploads
//     formData.append('video', videoFile as any);
//     formData.append('media', videoFile as any);
//     formData.append('file', videoFile as any);
    
//     // ✅ Add video-specific metadata
//     formData.append('mediaType', 'video');
//     formData.append('contentType', mimeType);
//     formData.append('fileType', fileExtension);

//     const response = await fetch(`${API_BASE}/user/upload/story`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         // ✅ Some servers need explicit multipart header for videos
//         // 'Content-Type': 'multipart/form-data', // Uncomment if needed
//       },
//       body: formData,
//     });

//     console.log('Video upload response status:', response.status);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('Video upload error:', errorText);
//       throw new Error(errorText || `Failed to upload video story`);
//     }

//     const result = await response.json();
//     console.log('Video upload success:', result);
//     return result;

//   } catch (error) {
//     console.error('Video story upload error:', error);
//     throw error;
//   }
// }

export async function uploadStoryAlternative(
  token: string,
  mediaUri: string,
  mediaType: 'image' | 'video'
) {
  try {
    console.log('Alternative upload method - Starting with:', { mediaUri, mediaType });

    if (typeof mediaUri !== 'string' || !mediaUri || mediaUri.trim() === '') {
      throw new Error('Invalid media URI: URI is empty or invalid');
    }

    const formData = new FormData();

    // ✅ Safer file extension extraction
    let fileExtension = '';
    let fileName = '';
    let mimeType = '';

    try {
      const uriParts = mediaUri.split('.');
      if (uriParts.length > 1) {
        fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      }
    } catch (e) {
      console.warn('Could not extract file extension from URI:', mediaUri);
    }

    // ✅ Set defaults and handle different file types
    if (mediaType === 'image') {
      switch (fileExtension) {
        case 'png':
          mimeType = 'image/png';
          fileName = `story_${Date.now()}.png`;
          break;
        case 'heic':
          mimeType = 'image/heic';
          fileName = `story_${Date.now()}.heic`;
          break;
        default:
          mimeType = 'image/jpeg';
          fileName = `story_${Date.now()}.jpg`;
          fileExtension = 'jpg';
      }
    } else {
      switch (fileExtension) {
        case 'mov':
          mimeType = 'video/quicktime';
          fileName = `story_${Date.now()}.mov`;
          break;
        case 'avi':
          mimeType = 'video/x-msvideo';
          fileName = `story_${Date.now()}.avi`;
          break;
        default:
          mimeType = 'video/mp4';
          fileName = `story_${Date.now()}.mp4`;
          fileExtension = 'mp4';
      }
    }

    // ✅ Try using 'file' instead of 'media' as field name
    const fileObject = {
      uri: mediaUri,
      type: mimeType,
      name: fileName,
    };

    console.log('Alternative method - File object:', fileObject);

    // Use consistent field name 'file' which matches backend expectation
    formData.append('file', fileObject as any);

    // ✅ Try different header approach
    const response = await fetch(`${API_BASE}/user/upload/story`, {
      method: 'POST',
      headers: {
        'token': token, // Some APIs expect 'token' instead of 'Authorization'
        'Accept': 'application/json',
      },
      body: formData,
    });

    console.log('Alternative upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alternative upload error response:', errorText);
      throw new Error(errorText || `HTTP ${response.status}: Failed to upload story`);
    }

    const result = await response.json();
    console.log('Alternative upload success:', result);
    return result;
  } catch (error) {
    console.error('Alternative story upload error:', error);
    throw error;
  }
}


export async function uploadVideoStory(token: string, mediaUri: string) {
  try {
    console.log('Preparing video upload:', mediaUri);

    // Create FormData
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = mediaUri.split('/').pop() || `video_${Date.now()}.mp4`;
    
    // Determine MIME type based on extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let mimeType = 'video/mp4';
    if (ext === 'mov') mimeType = 'video/quicktime';
    if (ext === 'avi') mimeType = 'video/x-msvideo';
    if (ext === 'm4v') mimeType = 'video/x-m4v';

    // Add the video file to FormData
    formData.append('video', {
      uri: mediaUri,
      name: filename,
      type: mimeType,
    } as any);

    // Add any additional metadata
    formData.append('mediaType', 'video');
    formData.append('uploadedAt', Date.now().toString());

    console.log('Sending video upload request...');
    
    const response = await fetch(`${API_BASE}/user/upload/story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Note: Don't set Content-Type header - let React Native set it with the correct boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video upload failed:', errorText);
      throw new Error(errorText || 'Video upload failed');
    }

    const result = await response.json();
    console.log('Video upload successful:', result);
    return result;
    
  } catch (error) {
    console.error('Video upload error:', error);
    throw error;
  }
}


export async function followingUserStory(token:any) {
  try {
    const response = await fetch(`${API_BASE}/user/story`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': token 
      }
    });

    const data = await response.json();

    return data.body;
  } catch (err: any) {
    throw new Error(err.message || "Failed to fetch user story.");
  }
}



