const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Тестовый endpoint для проверки подключения
router.get('/test/:bankName', bankController.testConnection);

// Получить только счета (без деталей)
router.get('/accounts/:bankName', bankController.getAccountsOnly);

// Основной endpoint для получения всех данных
router.get('/data/:bankName', bankController.getBankData);

module.exports = router;