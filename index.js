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
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let price = parseFloat(data.price);

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
  const token = 'fKiJCknhSPWZ_-OYYTUOm5:APA91bHgHkQ_5MbMRkv9UbAzNzMziDT1ARB-m-l1lzNChPnCxmn-oKOzU3FzuxUaHBrw2BnY-QUI3-xiv5DepVUP_gIBJikUIB3BV1qmvFBcaexY8NJJWy4'; // Geçerli FCM tokeni
  const btcPrice = await fetchBtcPrice();

  if (btcPrice) {
    await sendPushNotification(token, btcPrice);
  } else {
    console.error('Could not fetch BTC price.');
  }
};

setInterval(() => {
  sendBtcNotification();
}, 5 *  1000); 

const port = process.env.PORT || 3000;  // Eğer Heroku'dan bir port gelmezse, lokal port 3000'i kullan


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});