const express = require('express')
const app = express()
const port = process.env.PORT || 4000;
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

app.listen(port, () => {
  console.log(`Worker web service listening on port ${port}`);
});