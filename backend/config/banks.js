require('dotenv').config();

const banksConfig = {
  vbank: {
    baseURL: 'https://vbank.open.bankingapi.ru',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    requesting_bank: 'team284',
    requesting_bank_name: 'Team 284 App'
  },
  // Таким же образом потом добавим другие банки
	// И конечно токены хардкодить не нужно

};

module.exports = banksConfig;