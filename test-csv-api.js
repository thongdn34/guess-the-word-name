// Test script for the new CSV-based API
// Run with: node test-csv-api.js

const testCSVAPI = async () => {
  try {
    console.log('Testing CSV-based word generation API...');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: 'test-room-123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    
    if (data.wordA && data.wordB) {
      console.log('✅ CSV API test passed - received word pair:', data);
      console.log(`   Word A: "${data.wordA}"`);
      console.log(`   Word B: "${data.wordB}"`);
    } else {
      console.log('❌ CSV API test failed - invalid response format');
    }
  } catch (error) {
    console.error('❌ CSV API test failed:', error.message);
  }
};

testCSVAPI();
