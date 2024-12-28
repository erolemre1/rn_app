const fetch = require('node-fetch');
const admin = require('firebase-admin');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const serviceAccountBase64 = process.env.SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
app.use(bodyParser.json());
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY;

let currentToken = null;

// Token kaydetmek için endpoint
app.post('/register-token', (req, res) => {
  const { token } = req.body;


  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  currentToken = token;
  console.log('Token registered:', token);

  res.status(200).json({ message: 'Token registered successfully.' });
});

app.get('/token', (req, res) => {
  res.json({ token: currentToken });
});

const fetchBtcPrice = async () => {
  try {
    const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD', {
      headers: {
        'Authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const price = data.USD;

    const formattedPrice = price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formattedPrice;
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

const sendBtcNotificationToLast = async () => {
  const btcPrice = await fetchBtcPrice();

  if (btcPrice && currentToken) {
    await sendPushNotification(currentToken, btcPrice);
  } else {
    console.error('No token found or BTC price could not be fetched.');
  }
};

setInterval(() => {
  sendBtcNotificationToLast();
}, 15 * 1000); 
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
