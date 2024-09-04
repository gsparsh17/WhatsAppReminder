const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Render will use port from environment variables

app.use(cors());
app.use(express.json());

const sessionFilePath = path.join(__dirname, 'whatsapp-session.json');

// Initialize WhatsApp client with session data if available
let client;

if (fs.existsSync(sessionFilePath)) {
  // Load session data from file
  const sessionData = require(sessionFilePath);
  client = new Client({ session: sessionData });
} else {
  // Initialize client without session data
  client = new Client();
}

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code to authenticate with WhatsApp.');
});

client.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

client.on('authenticated', (session) => {
  console.log('Client is authenticated');
  // Save session data to a file
  fs.writeFileSync(sessionFilePath, JSON.stringify(session));
});

client.on('disconnected', () => {
  console.log('Client has been disconnected');
});

client.initialize();

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
