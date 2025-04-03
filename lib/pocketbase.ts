import PocketBase from 'pocketbase';

// Initialize PocketBase with default settings
const pb = new PocketBase('http://localhost:8090');

// Add error logging to help troubleshoot connection issues
pb.beforeSend = function(url, options) {
  options.signal = AbortSignal.timeout(30000); // 30 seconds timeout
  return { url, options };
};

export default pb; 