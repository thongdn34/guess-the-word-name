// Simple test script for the API endpoint
// Run with: node test-api.js

const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: 'test-room-123',
        language: 'vi'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.wordA && data.wordB) {
      console.log('✅ API test passed - received word pair:', data);
    } else {
      console.log('❌ API test failed - invalid response format');
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testAPI();
