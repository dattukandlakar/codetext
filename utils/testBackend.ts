const API_BASE = 'https://social-backend-zid2.onrender.com';

export interface BackendTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
}

/**
 * Test backend connectivity and endpoint availability
 */
export const testBackendConnectivity = async (token: string): Promise<BackendTestResult[]> => {
  const results: BackendTestResult[] = [];
  
  // Test endpoints to check
  const endpoints = [
    { path: '', description: 'Base URL' },
    { path: '/user/upload/story', description: 'Story Upload Endpoint' },
    { path: '/user/story/self', description: 'User Stories Endpoint' },
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const testResult: BackendTestResult = {
      endpoint: `${API_BASE}${endpoint.path}`,
      status: 'error',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE}${endpoint.path}`, {
        method: 'HEAD',
        headers: {
          'token': token,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      testResult.statusCode = response.status;
      testResult.responseTime = Date.now() - startTime;
      
      if (response.ok || response.status === 401 || response.status === 404) {
        // 401/404 are expected for HEAD requests, indicates server is responding
        testResult.status = 'success';
      } else {
        testResult.status = 'error';
        testResult.errorMessage = `HTTP ${response.status}`;
      }
    } catch (error: any) {
      testResult.responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        testResult.status = 'timeout';
        testResult.errorMessage = 'Request timed out';
      } else {
        testResult.status = 'error';
        testResult.errorMessage = error.message || 'Network error';
      }
    }

    results.push(testResult);
  }

  return results;
};

/**
 * Log backend test results to console
 */
export const logBackendTestResults = (results: BackendTestResult[]) => {
  console.log('🌐 Backend Connectivity Test Results:');
  results.forEach((result, index) => {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'timeout' ? '⏱️' : '❌';
    console.log(`  ${statusIcon} ${result.endpoint}`);
    console.log(`     Status: ${result.status}`);
    if (result.statusCode) console.log(`     HTTP Status: ${result.statusCode}`);
    if (result.responseTime) console.log(`     Response Time: ${result.responseTime}ms`);
    if (result.errorMessage) console.log(`     Error: ${result.errorMessage}`);
    if (index < results.length - 1) console.log('');
  });
};

/**
 * Test a simple upload to validate the endpoint
 */
export const testUploadEndpoint = async (token: string): Promise<BackendTestResult> => {
  const startTime = Date.now();
  const testResult: BackendTestResult = {
    endpoint: `${API_BASE}/user/upload/story`,
    status: 'error',
  };

  try {
    // Create a minimal test FormData
    const formData = new FormData();
    formData.append('file', {
      uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      type: 'image/png',
      name: 'test.png',
    } as any);

    const response = await fetch(`${API_BASE}/user/upload/story`, {
      method: 'POST',
      headers: {
        'token': token,
      },
      body: formData,
    });

    testResult.statusCode = response.status;
    testResult.responseTime = Date.now() - startTime;

    if (response.ok) {
      testResult.status = 'success';
    } else {
      testResult.status = 'error';
      const errorText = await response.text();
      testResult.errorMessage = errorText || `HTTP ${response.status}`;
    }
  } catch (error: any) {
    testResult.responseTime = Date.now() - startTime;
    testResult.status = 'error';
    testResult.errorMessage = error.message || 'Network error';
  }

  return testResult;
};