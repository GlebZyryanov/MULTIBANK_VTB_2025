const BankService = require('../services/bankService');

class BankController {
  async getBankData(req, res) {
    try {
      const { bankName } = req.params;
      console.log(`Старт данных для : ${bankName}`);
      
      const bankService = new BankService(bankName);
      
      // 1. Получаем токен
      console.log('Шаг 1: Получение токена авторизации...');
      const accessToken = await bankService.getAuthToken();
      console.log('Токен получен!');
      
      // 2. Получаем согласие
      console.log('Шаг 2: Поулчение согласия...');
      const consentData = await bankService.getConsent(accessToken);
      console.log('Согласие получено!:', consentData.consent_id);
      
      // 3. Получаем счета
      console.log('Шаг3: Получить счета...');
      const accountsData = await bankService.getAccounts(accessToken, consentData.consent_id);
      console.log('Счета получены!:', accountsData.data?.account?.length || 0);
      
      if (!accountsData.data?.account || accountsData.data.account.length === 0) {
        return res.json({
          success: true,
          bank: bankName,
          consentId: consentData.consent_id,
          message: 'Не найдено счетов',
          accounts: []
        });
      }
      
      // 4. Для каждого счета получаем балансы и транзакции
      console.log('Шаг 4: Получаем балансы и тразакции для каждого счета...');
      const accountsWithDetails = await Promise.all(
        accountsData.data.account.map(async (account, index) => {
          console.log(`Обработка аккаунта ${index + 1}/${accountsData.data.account.length}: ${account.accountId}`);
          
          try {
            const balances = await bankService.getAccountBalances(
              accessToken, 
              consentData.consent_id, 
              account.accountId
            );
            
            const transactions = await bankService.getAccountTransactions(
              accessToken,
              consentData.consent_id,
              account.accountId,
              { 
                limit: 10,
                fromDate: '2025-01-01T00:00:00Z',
                toDate: '2025-12-31T23:59:59Z'
              }
            );
            
            return {
              ...account,
              balances: balances.data?.balance || [],
              transactions: transactions.data?.transaction || []
            };
          } catch (error) {
            console.error(`Ошибка в аккаунте ${account.accountId}:`, error.message);
            return {
              ...account,
              balances: [],
              transactions: [],
              error: error.message
            };
          }
        })
      );
      
      console.log('Все балансы и транзакции получены!');
      
      res.json({
        success: true,
        bank: bankName,
        consentId: consentData.consent_id,
        accounts: accountsWithDetails
      });
      
    } catch (error) {
      console.error('Ошибка контроллера:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data || 'Нет доп.деталей'
      });
    }
  }

  async testConnection(req, res) {
    try {
      const { bankName } = req.params;
      console.log(`Тест соединения с  ${bankName}`);
      
      const bankService = new BankService(bankName);
      
      const accessToken = await bankService.getAuthToken();
      const consentData = await bankService.getConsent(accessToken);
      
      res.json({
        success: true,
        message: `успешное подключение к ${bankName}`,
        token: accessToken.substring(0, 20) + '...',
        consentId: consentData.consent_id,
        autoApproved: consentData.auto_approved
      });
      
    } catch (error) {
      console.error('Ошибка тестового соединения:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data || 'Нет доп.деталей'
      });
    }
  }

  // Новый endpoint для получения только счетов
  async getAccountsOnly(req, res) {
    try {
      const { bankName } = req.params;
      const bankService = new BankService(bankName);
      
      const accessToken = await bankService.getAuthToken();
      const consentData = await bankService.getConsent(accessToken);
      const accountsData = await bankService.getAccounts(accessToken, consentData.consent_id);
      
      res.json({
        success: true,
        bank: bankName,
        consentId: consentData.consent_id,
        accounts: accountsData.data?.account || []
      });
      
    } catch (error) {
      console.error('Ошибка получения счетов:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BankController();