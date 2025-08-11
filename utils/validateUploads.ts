import { testBackendConnectivity, logBackendTestResults, testUploadEndpoint } from './testBackend';
import { debugUploadContext, logUploadDebugInfo } from './debugUpload';

/**
 * Comprehensive upload validation utility
 * Run this to diagnose upload issues
 */
export const validateUploadSetup = async (token: string, testFileUri?: string) => {
  console.log('🔍 Starting Upload Validation...\n');

  // 1. Test backend connectivity
  console.log('1️⃣ Testing Backend Connectivity...');
  const backendResults = await testBackendConnectivity(token);
  logBackendTestResults(backendResults);
  
  const hasConnectivity = backendResults.some(result => result.status === 'success');
  if (!hasConnectivity) {
    console.error('❌ No backend connectivity detected!');
    return false;
  }

  // 2. Test file context if provided
  if (testFileUri) {
    console.log('\n2️⃣ Testing File Context...');
    const debugInfo = await debugUploadContext(testFileUri, token, 'image');
    logUploadDebugInfo(debugInfo, 'image');
    
    if (!debugInfo.fileExists) {
      console.error('❌ Test file does not exist!');
      return false;
    }
  }

  // 3. Test upload endpoint with minimal data
  console.log('\n3️⃣ Testing Upload Endpoint...');
  const uploadTest = await testUploadEndpoint(token);
  console.log(`Upload Test Result: ${uploadTest.status}`);
  if (uploadTest.statusCode) console.log(`HTTP Status: ${uploadTest.statusCode}`);
  if (uploadTest.errorMessage) console.log(`Error: ${uploadTest.errorMessage}`);

  // 4. Provide recommendations
  console.log('\n📋 Recommendations:');
  
  if (uploadTest.status === 'success') {
    console.log('✅ Upload endpoint is working correctly');
  } else if (uploadTest.statusCode === 401) {
    console.log('🔑 Authentication issue - check your token');
  } else if (uploadTest.statusCode === 413) {
    console.log('📁 File too large - try compressing your media');
  } else if (uploadTest.statusCode === 400) {
    console.log('📋 Bad request - check file format and FormData structure');
  } else {
    console.log('🔧 Server error - contact backend team');
  }

  return uploadTest.status === 'success';
};

/**
 * Quick validation for React Native developers
 * Call this in your component to debug upload issues
 */
export const quickUploadDebug = (uri: string, token: string, mediaType: 'image' | 'video') => {
  debugUploadContext(uri, token, mediaType).then(debugInfo => {
    logUploadDebugInfo(debugInfo, mediaType);
    
    // Quick checks
    const issues: string[] = [];
    if (!debugInfo.fileExists) issues.push('File does not exist');
    if (!debugInfo.hasToken) issues.push('No authentication token');
    if (debugInfo.networkConnectivity === false) issues.push('Network connectivity issues');
    if (debugInfo.fileSize && debugInfo.fileSize > 50 * 1024 * 1024) issues.push('File too large (>50MB)');
    
    if (issues.length === 0) {
      console.log('✅ No obvious issues detected');
    } else {
      console.log('⚠️ Issues found:', issues.join(', '));
    }
  });
};