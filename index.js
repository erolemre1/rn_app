const fetch = require('node-fetch'); // Fetch'i import etmelisiniz
const admin = require('firebase-admin');

// Firebase Admin SDK ile kimlik doğrulama
const serviceAccount = require('./serviceAccountKey.json');  // JSON dosyanızın yolu

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Binance API'den BTC fiyatını almak (fetch ile)

const fetchBtcPrice = async () => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let price = parseFloat(data.price);

    // Sayıyı istediğiniz formata dönüştür
    price = price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return price; // Formatlanmış fiyatı döndürüyoruz
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return null;
  }
};

// FCM token'ını kullanarak push bildirim gönderme
const sendPushNotification = async (token, btcPrice) => {
  const message = {
    notification: {
      title: 'BTC Price Update',
      body: `Current Bitcoin price: $${btcPrice}`,
    },
    token: token,  // Geçerli FCM token'ı
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// FCM token'ı ve BTC fiyatını alıp bildirim gönderme
const sendBtcNotification = async () => {
  const token = 'fKiJCknhSPWZ_-OYYTUOm5:APA91bHgHkQ_5MbMRkv9UbAzNzMziDT1ARB-m-l1lzNChPnCxmn-oKOzU3FzuxUaHBrw2BnY-QUI3-xiv5DepVUP_gIBJikUIB3BV1qmvFBcaexY8NJJWy4'; // Geçerli token
  const btcPrice = await fetchBtcPrice();

  if (btcPrice) {
    await sendPushNotification(token, btcPrice);
  } else {
    console.error('Could not fetch BTC price.');
  }
};

// 5 dakikada bir BTC fiyatını al ve bildirim gönder
setInterval(() => {
  sendBtcNotification();
}, 5 * 1000); // 5 dakika = 5 * 60 * 1000 ms
