const express = require('express');
const app = express();
const { worker } = require('./worker');

app.get('/worker', async (req, res) => {
  try {
    await worker();
    res.status(200).send('Worker ran successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error running worker');
  }
});

app.listen(3000, () => {
  console.log('Worker web service listening on port 3000');
});