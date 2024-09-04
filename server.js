const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const app = express();
const port = process.env.PORT || 3000; // Render will use port from environment variables

app.use(cors());
app.use(express.json());

const sessionFilePath = path.join(__dirname, 'whatsapp-session.json');
const qrCodeFilePath = path.join(__dirname, 'qr-code.png');
let client;

// Initialize WhatsApp client with session data if available
if (fs.existsSync(sessionFilePath)) {
  console.log('Session file exists, loading session data');
  try {
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
    client = new Client({ session: sessionData });
  } catch (error) {
    console.error('Error loading session data:', error);
    client = new Client(); // Initialize a new client if session data is corrupted
  }
} else {
  console.log('No session file found, initializing new client');
  client = new Client();
}

// Handle QR code generation
client.on('qr', async (qr) => {
  try {
    // Generate QR code image and save it
    await promisify(qrcode.toFile)(qrCodeFilePath, qr);
    console.log('QR code image saved');
  } catch (error) {
    console.error('Error generating QR code image:', error);
  }
});

client.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

client.on('authenticated', (session) => {
  console.log('Client is authenticated');
  console.log('Session data:', session);

  if (session && typeof session === 'object') {
    try {
      fs.writeFileSync(sessionFilePath, JSON.stringify(session));
      console.log('Session data saved successfully');
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  } else {
    console.error('Session data is undefined or not an object');
  }
});

client.on('disconnected', () => {
  console.log('Client has been disconnected');
});

client.initialize();

// Endpoint to retrieve QR code image
app.get('/qr-code', (req, res) => {
  if (fs.existsSync(qrCodeFilePath)) {
    res.sendFile(qrCodeFilePath);
  } else {
    res.status(404).send('QR code image not found');
  }
});

// Endpoint to send a WhatsApp reminder
app.post('/sendReminder', async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).send('Phone number and message are required');
  }

  try {
    const chat = await client.getChatById(`${phone}@c.us`);
    await chat.sendMessage(message);
    res.status(200).send('Reminder sent successfully!');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Failed to send reminder.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// const express = require('express');
// const { Client } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const port = process.env.PORT || 3000; // Render will use port from environment variables

// app.use(cors());
// app.use(express.json());

// const sessionFilePath = path.join(__dirname, 'whatsapp-session.json');

// // Initialize WhatsApp client with session data if available
// let client;

// if (fs.existsSync(sessionFilePath)) {
//   console.log('Session file exists at:', sessionFilePath);
//   try {
//     const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
//     client = new Client({ session: sessionData });
//   } catch (error) {
//     console.error('Error loading session data:', error);
//     client = new Client(); // Initialize a new client if session data is corrupted
//   }
// } else {
//   console.log('No session file found, initializing new client');
//   client = new Client();
// }

// client.on('qr', (qr) => {
//   qrcode.generate(qr, { small: true });
//   console.log('Scan the QR code to authenticate with WhatsApp.');
// });

// client.on('ready', () => {
//   console.log('WhatsApp client is ready!');
// });

// client.on('authenticated', (session) => {
//   console.log('Client is authenticated');
//   console.log('Session data:', session);

//   if (session && typeof session === 'object') {
//     try {
//       fs.writeFileSync(sessionFilePath, JSON.stringify(session));
//       console.log('Session data saved successfully');
//     } catch (error) {
//       console.error('Error saving session data:', error);
//     }
//   } else {
//     console.error('Session data is undefined or not an object');
//   }
// });

// client.on('disconnected', () => {
//   console.log('Client has been disconnected');
// });

// client.initialize();

// // Endpoint to send a WhatsApp reminder
// app.post('/sendReminder', async (req, res) => {
//   const { phone, message } = req.body;

//   if (!phone || !message) {
//     return res.status(400).send('Phone number and message are required');
//   }

//   try {
//     const chat = await client.getChatById(`${phone}@c.us`);
//     await chat.sendMessage(message);
//     res.status(200).send('Reminder sent successfully!');
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).send('Failed to send reminder.');
//   }
// });

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });
