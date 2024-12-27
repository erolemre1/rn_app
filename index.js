const fetch = require('node-fetch');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// Firebase service account key (base64 encoded) from environment variable
const serviceAccountBase64 = process.env.SERVICE_ACCOUNT_KEY;

// Decode base64 and parse JSON for the Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

// Initialize Firebase Admin SDK with the service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Fetch Bitcoin price from CoinGecko API
const fetchBtcPrice = async () => {
  try {
    const response = await fetch('https://api-gcp.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let price = data.bitcoin.usd;

    // Format price to 2 decimal places
    price = price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return price;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return null;
  }
};

// Send a push notification via Firebase Cloud Messaging
const sendPushNotification = async (token, btcPrice) => {
  const message = {
    notification: {
      title: 'BTC Price Update',
      body: `Current Bitcoin price: $${btcPrice}`,
    },
    token: token,  // FCM token for the recipient device
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Function to fetch BTC price and send notification
const sendBtcNotification = async () => {
  const token = process.env.FCM_TOKEN;  // Get FCM token from environment variable
  const btcPrice = await fetchBtcPrice();

  if (btcPrice) {
    await sendPushNotification(token, btcPrice);
  } else {
    console.error('Could not fetch BTC price.');
  }
};

// Send BTC notification every 5 minutes (300,000 ms)
setInterval(() => {
  sendBtcNotification();
}, 15 * 1000); 

// Define the port for the server (Heroku uses process.env.PORT)
const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
