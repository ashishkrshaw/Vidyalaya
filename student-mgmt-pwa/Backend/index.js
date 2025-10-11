const express = require('express');
const cors = require('cors');
const statsRouter = require('./routes/stats');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/stats', statsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
