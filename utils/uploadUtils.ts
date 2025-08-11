import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

const API_BASE = 'https://social-backend-zid2.onrender.com';

/**
 * Unified upload function for both images and videos
 * Handles proper file type detection, FormData creation, and error handling
 */
export const uploadMedia = async (
  uri: string,
  token: string,
  mediaType: 'image' | 'video',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('Starting media upload:', { uri, mediaType });

    // Validate inputs
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
      throw new Error('Invalid media URI: URI is empty or invalid');
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token: Token is empty or invalid');
    }

    // Verify the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Media file does not exist');
    }

    console.log('File info:', { size: fileInfo.size, exists: fileInfo.exists });

    // Extract file extension safely
    let fileExtension = '';
    let fileName = '';
    let mimeType = '';

    try {
      const uriParts = uri.split('.');
      if (uriParts.length > 1) {
        fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      }
    } catch (e) {
      console.warn('Could not extract file extension from URI:', uri, e);
    }

    // Set MIME type and filename based on media type and extension
    if (mediaType === 'image') {
      switch (fileExtension) {
        case 'png':
          mimeType = 'image/png';
          fileName = `story_${Date.now()}.png`;
          break;
        case 'heic':
        case 'heif':
          mimeType = 'image/heic';
          fileName = `story_${Date.now()}.heic`;
          break;
        case 'webp':
          mimeType = 'image/webp';
          fileName = `story_${Date.now()}.webp`;
          break;
        default:
          mimeType = 'image/jpeg';
          fileName = `story_${Date.now()}.jpg`;
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
        case 'm4v':
          mimeType = 'video/x-m4v';
          fileName = `story_${Date.now()}.m4v`;
          break;
        case 'webm':
          mimeType = 'video/webm';
          fileName = `story_${Date.now()}.webm`;
          break;
        default:
          mimeType = 'video/mp4';
          fileName = `story_${Date.now()}.mp4`;
      }
    }

    // Validate fileName is not undefined/empty
    if (!fileName || fileName.trim() === '') {
      fileName = mediaType === 'image' ? `story_${Date.now()}.jpg` : `story_${Date.now()}.mp4`;
      console.warn('Generated fallback filename:', fileName);
    }

    // Create file object for FormData - React Native compatible format
    const fileObject = {
      uri: uri,
      type: mimeType,
      name: fileName,
    };

    console.log('Uploading file with details:', fileObject);

    // Create FormData with React Native compatible structure
    const formData = new FormData();
    
    // React Native FormData requires this specific structure
    formData.append('media', {
      uri: uri,
      type: mimeType,
      name: fileName,
    } as any);
    
    // Log FormData contents for debugging
    console.log('FormData contents:');
    console.log('  - media field:', { uri, type: mimeType, name: fileName });
    console.log('  - File size:', fileInfo.size ? `${(fileInfo.size / 1024).toFixed(2)}KB` : 'Unknown');
    console.log('  - Backend expects: req.files.media with tempFilePath property');

    // Upload with progress tracking if callback provided
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          console.log('📥 Server response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.response
          });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.response);
              console.log('✅ Upload successful:', result);
              resolve({ success: true, data: result });
            } catch (parseError) {
              console.log('✅ Upload successful (non-JSON response):', xhr.response);
              resolve({ success: true, data: xhr.response });
            }
          } else {
            console.error('❌ Upload failed with status:', xhr.status);
            console.error('❌ Response body:', xhr.response);
            
            // Try to parse error response for better debugging
            try {
              const errorData = JSON.parse(xhr.response);
              console.error('❌ Parsed error:', errorData);
              reject(new Error(`${errorData.message || 'Upload failed'} (Status: ${xhr.status})`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.response}`));
            }
          }
        };

        xhr.onerror = () => {
          console.error('Network error during upload');
          reject(new Error('Network error during upload - please check your connection'));
        };

        xhr.ontimeout = () => {
          console.error('Upload timed out');
          reject(new Error('Upload timed out - please try again'));
        };

        xhr.open('POST', `${API_BASE}/user/upload/story`);
        xhr.setRequestHeader('token', token);
        xhr.timeout = 300000; // 5 minute timeout
        xhr.send(formData);
      });
    } else {
      // Simple fetch for uploads without progress tracking
      const response = await fetch(`${API_BASE}/user/upload/story`, {
        method: 'POST',
        headers: {
          'token': token,
        },
        body: formData,
      });

      console.log('📥 Server response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload error response:', errorText);
        
        // Try to parse error response for better debugging
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Parsed error:', errorData);
          throw new Error(`${errorData.message || 'Upload failed'} (Status: ${response.status})`);
        } catch (e) {
          throw new Error(errorText || `Upload failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      return { success: true, data: result };
    }
  } catch (error) {
    console.error('Media upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

/**
 * Legacy function to maintain compatibility with existing code
 */
export const processAndUploadVideo = async (
  uri: string,
  token: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return uploadMedia(uri, token, 'video', onProgress);
};