const axios = require('axios');

const chatbotApi = 'http://localhost:3007/query';

const sessionId = `test-multi-${Date.now()}`;

async function testMultiPassengerBooking() {
  console.log('🧪 Testing Multi-Passenger Booking Flow with Pickup/Dropoff Selection');
  console.log('━'.repeat(80));
  console.log(`Session ID: ${sessionId}\n`);

  try {
    // Step 1: Search for trips
    console.log('📍 Step 1: Searching for trips (HCMC → Da Lat tomorrow)');
    let response = await axios.post(chatbotApi, {
      sessionId,
      message: 'I want to book a trip from Ho Chi Minh City to Da Lat tomorrow for 3 passengers',
    });
    console.log('Response:', response.data.data.response.text);
    console.log('');

    // Wait for search to process
    await new Promise((r) => setTimeout(r, 2000));

    // Step 2: View available trips
    console.log('📍 Step 2: Getting available trips');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: 'What trips do you have available?',
    });
    console.log('Response:', response.data.data.response.text.substring(0, 200));
    if (response.data.data.response.actions && response.data.data.response.actions[0]) {
      console.log(
        'Available trips count:',
        response.data.data.response.actions[0].data?.length || 'N/A'
      );
    }
    console.log('');

    // Wait a bit
    await new Promise((r) => setTimeout(r, 1000));

    // Step 3: Select a trip and 3 seats using action data
    console.log('📍 Step 3: Selecting trip and 3 seats');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: 'I want to book 3 seats',
      actionData: {
        type: 'seat_selection',
        seats: ['A1', 'A2', 'A3'],
      },
    });
    console.log('Response:', response.data.data.response.text);
    console.log(
      'Actions:',
      response.data.data.response.actions ? response.data.data.response.actions[0]?.type : 'None'
    );
    console.log('');

    await new Promise((r) => setTimeout(r, 1000));

    // Step 4: Select pickup point
    console.log('📍 Step 4: Selecting pickup point');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: 'Select first pickup point',
      actionData: {
        type: 'pickup_selection',
        selectedPoint: {
          point_id: 1,
          name: 'Ben Xe Mien Dong',
          address: '292 Dinh Bo Linh, Ho Chi Minh',
          time: new Date().toISOString(),
        },
      },
    });
    console.log('Response:', response.data.data.response.text);
    console.log('');

    await new Promise((r) => setTimeout(r, 1000));

    // Step 5: Select dropoff point
    console.log('📍 Step 5: Selecting dropoff point');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: 'Select dropoff point',
      actionData: {
        type: 'dropoff_selection',
        selectedPoint: {
          point_id: 2,
          name: 'Da Lat Bus Station',
          address: 'Phan Dinh Phung, Da Lat',
          time: new Date().toISOString(),
        },
      },
    });
    console.log('Response:', response.data.data.response.text);
    console.log('');

    await new Promise((r) => setTimeout(r, 1000));

    // Step 6: Provide passenger info - provide all 3 passengers
    console.log('📍 Step 6: Providing passenger information for all 3 passengers');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: `Passenger 1: Nguyen Van A, Phone: 0912345678, Email: a@example.com
      Passenger 2: Tran Thi B, Phone: 0987654321, Email: b@example.com  
      Passenger 3: Le Van C, Phone: 0923456789, Email: c@example.com`,
    });
    console.log('Response:', response.data.data.response.text);
    console.log('');

    await new Promise((r) => setTimeout(r, 1000));

    // Step 7: Check logs to see if all 3 passengers were extracted
    console.log('📍 Step 7: Attempting to complete booking');
    response = await axios.post(chatbotApi, {
      sessionId,
      message: 'Complete my booking',
    });
    console.log('Response:', response.data.data.response.text);

    if (response.data.data.response.actions && response.data.data.response.actions[0]) {
      console.log(
        'Booking confirmation:',
        JSON.stringify(response.data.data.response.actions[0].data, null, 2).substring(0, 500)
      );
    }

    console.log('\n✅ Test completed! Check docker logs for detailed info.');
    console.log('Look for logs containing:');
    console.log('  - "Handling seat selection action"');
    console.log('  - "Handling pickup selection action"');
    console.log('  - "Handling dropoff selection action"');
    console.log('  - "Number of passengers needed: 3"');
    console.log('  - "About to create booking with:"');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testMultiPassengerBooking();
