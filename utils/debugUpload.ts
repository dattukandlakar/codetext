import * as FileSystem from 'expo-file-system';

export interface DebugInfo {
  fileExists: boolean;
  fileSize?: number;
  fileSizeFormatted?: string;
  fileExtension?: string;
  mimeType?: string;
  uri: string;
  hasToken: boolean;
  tokenLength?: number;
  networkConnectivity?: boolean;
}

/**
 * Debug utility to help diagnose upload issues
 * Provides detailed information about the file and upload context
 */
export const debugUploadContext = async (
  uri: string,
  token: string,
  mediaType: 'image' | 'video'
): Promise<DebugInfo> => {
  const debug: DebugInfo = {
    fileExists: false,
    uri,
    hasToken: !!token && token.trim().length > 0,
    tokenLength: token?.length || 0,
  };

  try {
    // Check if file exists and get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    debug.fileExists = fileInfo.exists;
    
    if (fileInfo.exists && fileInfo.size) {
      debug.fileSize = fileInfo.size;
      debug.fileSizeFormatted = formatFileSize(fileInfo.size);
    }

    // Extract file extension
    try {
      const uriParts = uri.split('.');
      if (uriParts.length > 1) {
        debug.fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      }
    } catch (e) {
      console.warn('Could not extract file extension:', e);
    }

    // Determine MIME type
    if (debug.fileExtension) {
      debug.mimeType = getMimeType(debug.fileExtension, mediaType);
    }

    // Test network connectivity (simple ping)
    try {
      const response = await fetch('https://social-backend-zid2.onrender.com/ping', {
        method: 'HEAD',
        timeout: 5000,
      });
      debug.networkConnectivity = response.ok;
    } catch (e) {
      debug.networkConnectivity = false;
    }

  } catch (error) {
    console.error('Debug context error:', error);
  }

  return debug;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMimeType(extension: string, mediaType: 'image' | 'video'): string {
  if (mediaType === 'image') {
    switch (extension) {
      case 'png': return 'image/png';
      case 'heic':
      case 'heif': return 'image/heic';
      case 'webp': return 'image/webp';
      default: return 'image/jpeg';
    }
  } else {
    switch (extension) {
      case 'mov': return 'video/quicktime';
      case 'avi': return 'video/x-msvideo';
      case 'm4v': return 'video/x-m4v';
      case 'webm': return 'video/webm';
      default: return 'video/mp4';
    }
  }
}

/**
 * Log detailed debug information to console
 */
export const logUploadDebugInfo = (debugInfo: DebugInfo, mediaType: 'image' | 'video') => {
  console.log('🔍 Upload Debug Information:');
  console.log('  File exists:', debugInfo.fileExists);
  console.log('  File size:', debugInfo.fileSizeFormatted || 'Unknown');
  console.log('  File extension:', debugInfo.fileExtension || 'Unknown');
  console.log('  MIME type:', debugInfo.mimeType || 'Unknown');
  console.log('  Media type:', mediaType);
  console.log('  URI:', debugInfo.uri);
  console.log('  Has token:', debugInfo.hasToken);
  console.log('  Token length:', debugInfo.tokenLength);
  console.log('  Network connectivity:', debugInfo.networkConnectivity);
  
  // Warnings and recommendations
  if (!debugInfo.fileExists) {
    console.warn('⚠️ File does not exist at the provided URI');
  }
  
  if (!debugInfo.hasToken) {
    console.warn('⚠️ No authentication token provided');
  }
  
  if (debugInfo.fileSize && debugInfo.fileSize > 50 * 1024 * 1024) {
    console.warn('⚠️ File is very large (>50MB), upload may fail or timeout');
  }
  
  if (debugInfo.networkConnectivity === false) {
    console.warn('⚠️ Network connectivity issues detected');
  }
};