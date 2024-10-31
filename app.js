/*************  ✨ Codeium Command 🌟  *************/
const express = require('express');
const { Redis } = require('@upstash/redis');
const app = express();
const port = process.env.PORT || 4000;

const client = new Redis({
  url: 'https://top-aardvark-24334.upstash.io',
  token: 'AV8OAAIjcDFlMDY4NDkxNzVlMzE0NTM2ODg2YmVkM2Q3ZDk0NTgxOHAxMA',
});

// Adjust the import based on the export type in worker.js
const { worker } = require('./worker'); // Use this if you exported worker as { worker }
// const worker = require('./worker'); // Use this if you exported worker as the default

async function pollMessages() {
  try {
    const messages = await client.lrange("sync-tasks", 0, -1); 
    if (messages.length) {
      messages.forEach(message => {
        console.log(`Received message: ${JSON.stringify(message)}`);
        worker();  // Call the worker function
      });
      await client.del("sync-tasks"); 
    }
  } catch (error) {
    console.error("Error polling messages:", error);
  }
}

setInterval(pollMessages, 30000); // Add interval to reload every 30 seconds
app.get('/worker', (req, res) => {
  pollMessages();
  res.status(200).send('Worker is running in the background');
});

app.get('/worker', (req, res) => {
  res.status(200).send('Worker is running in the background');
app.listen(port, () => {
  console.log(`Worker web service listening on port ${port}`);
});

app.listen(port, () => {
  console.log(`Worker web service listening on port ${port}`);
});


/******  958b3661-eca0-4e29-a609-86c90432a6ca  *******/