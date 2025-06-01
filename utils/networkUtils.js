// Utility functions to help diagnose and fix network issues
import NetInfo from '@react-native-community/netinfo';

// Check if the device has internet connectivity
export const checkInternetConnection = async () => {
  try {
    if (false) {
      return navigator.onLine;
    }
    
    // For mobile platforms, use NetInfo with additional timeout
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetInfo timeout')), 3000)
      );
      
      const netInfoPromise = NetInfo.fetch()
        .then(state => state.isConnected && state.isInternetReachable);
      
      // Race between NetInfo check and timeout
      return await Promise.race([netInfoPromise, timeoutPromise])
        .catch(() => true); // If it times out, assume connected
    } catch (netInfoError) {
      console.error('NetInfo error:', netInfoError);
      
      // Fallback to fetch check if NetInfo fails
      try {
        const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { 
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000)
        });
        return response.ok;
      } catch (_) {
        // Last resort - assume we're online to let the app try
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return true; // Assume online if check fails
  }
};

// Test connectivity to a specific API endpoint
export const testApiConnectivity = async (endpoint) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout
    
    const response = await fetch(endpoint, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'User-Agent': 'P2PSkillX-App'
      },
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`Connectivity test to ${endpoint} failed:`, error);
    return false;
  }
};

// Test OpenRouter API connectivity with multiple endpoints
export const testOpenRouterConnectivity = async () => {
  const endpoints = [
    'https://openrouter.ai/api',
    'https://api.openrouter.ai/api',
    'https://status.openrouter.ai' // Separate status domain if available
  ];
  
  // Try simpler endpoints
  for (const endpoint of endpoints) {
    try {
      const isReachable = await testApiConnectivity(endpoint);
      if (isReachable) {
        console.log(`Successfully connected to ${endpoint}`);
        return true;
      }
    } catch (error) {
      console.error(`Error testing connectivity to ${endpoint}:`, error);
    }
  }
  
  // If all direct tests fail, try a POST request with minimal data
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'P2PSkillXMobileApp/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 401; // 401 means the API is reachable but unauthorized
  } catch (error) {
    console.error('Final connectivity test failed:', error);
    return false;
  }
};

// Get detailed network information for diagnostics
export const getNetworkInfo = async () => {
  try {
    if (false) {
      return {
        isConnected: navigator.onLine,
        connectionType: 'unknown',
        details: {
          isConnectionExpensive: false
        }
      };
    }
    
    try {
      const state = await Promise.race([
        NetInfo.fetch(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NetInfo timeout')), 3000))
      ]);
      
      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        details: state.details || {}
      };
    } catch (error) {
      // Return basic info if NetInfo times out
      return {
        isConnected: true,
        connectionType: 'unknown',
        details: {
          errorMessage: error.message
        }
      };
    }
  } catch (error) {
    console.error('Error fetching network info:', error);
    return {
      isConnected: true,
      error: error.message
    };
  }
};

// Get some basic debugging info
export const getDebugInfo = () => {
  return {
    platform: 'unknown',
    version: 'unknown',
    isSimulator: false,
    constants: {},
    timestamp: new Date().toISOString()
  };
};

// Log network information to help with debugging
export const logNetworkInfo = async () => {
  try {
    const hasInternet = await checkInternetConnection();
    const hasApiAccess = await testOpenRouterConnectivity();
    const debugInfo = getDebugInfo();
    
    console.log('=== NETWORK DIAGNOSTICS ===');
    console.log('Internet connection:', hasInternet ? 'CONNECTED' : 'DISCONNECTED');
    console.log('OpenRouter API access:', hasApiAccess ? 'AVAILABLE' : 'UNAVAILABLE');
    console.log('Device info:', JSON.stringify(debugInfo));
    console.log('===========================');
    
    return {
      hasInternet,
      hasApiAccess,
      debugInfo
    };
  } catch (error) {
    console.error('Error running network diagnostics:', error);
    return {
      hasInternet: false,
      hasApiAccess: false,
      error: error.message
    };
  }
}; 