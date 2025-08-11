import { FFmpegKit } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

const API_BASE = 'https://social-backend-zid2.onrender.com';

export const processAndUploadVideo = async (
  uri: string,
  token: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('Starting video upload process for:', uri);

    // 1. Verify the video file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Video file does not exist');
    }

    // 2. Create compressed version (if needed)
    let finalUri = uri;
    const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
    
    if (fileSizeMB > 5) { // Only compress if >5MB
      console.log('Compressing video...');
      const outputUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.mp4`;
      
      const command = `-i ${uri} -vf scale=-2:720 -b:v 2M -preset fast ${outputUri}`;
      const session = await FFmpegKit.execute(command);
      
      if ((await session.getReturnCode()).isValueError()) {
        throw new Error('Video compression failed');
      }
      
      finalUri = outputUri;
    }

    // 3. Prepare upload
    const filename = finalUri.split('/').pop() || `video_${Date.now()}.mp4`;
    const formData = new FormData();
    formData.append('media', {
      uri: finalUri,
      name: filename,
      type: 'video/mp4',
    } as any);

    // 4. Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve({
              success: true,
              data: JSON.parse(xhr.response)
            });
          } catch (e) {
            resolve({ success: true, data: xhr.response });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));

      xhr.open('POST', `${API_BASE}/user/upload/story`);
      xhr.setRequestHeader('token', token);
      xhr.timeout = 300000; // 5 minute timeout
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};