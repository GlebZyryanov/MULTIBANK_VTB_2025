const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bankRoutes = require('./routers/bankRoutes');
require('./models/database'); // Инициализация БД

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/banks', bankRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Financial Aggregator API',
    endpoints: {
      test: '/api/banks/test/vbank',
      accounts: '/api/banks/accounts/vbank',
      data: '/api/banks/data/vbank',
      health: '/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что то не так!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Test connection: http://localhost:${PORT}/api/banks/test/vbank`);
  console.log(`  Accounts only: http://localhost:${PORT}/api/banks/accounts/vbank`);
  console.log(`  Full data: http://localhost:${PORT}/api/banks/data/vbank`);
});