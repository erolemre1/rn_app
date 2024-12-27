const fetch = require('node-fetch');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const serviceAccountBase64 = process.env.SERVICE_ACCOUNT_KEY;

const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const fetchBtcPrice = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let price = data.bitcoin.usd;

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

const sendPushNotification = async (token, btcPrice) => {
  const message = {
    notification: {
      title: 'BTC Price Update',
      body: `Current Bitcoin price: $${btcPrice}`,
    },
    token: token, 
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const sendBtcNotification = async () => {
  const token = process.env.FCM_TOKEN;  
  const btcPrice = await fetchBtcPrice();

  if (btcPrice) {
    await sendPushNotification(token, btcPrice);
  } else {
    console.error('Could not fetch BTC price.');
  }
};

setInterval(() => {
  sendBtcNotification();
}, 15 * 1000); 

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
