const axios = require('axios');
const banksConfig = require('../config/banks');

class BankService {
  constructor(bankName) {
    this.bankConfig = banksConfig[bankName];
    this.api = axios.create({
      baseURL: this.bankConfig.baseURL,
      timeout: 10000,
    });
  }

  async getAuthToken() {
    try {
      const response = await this.api.post('/auth/bank-token', null, {
        params: {
          client_id: this.bankConfig.client_id,
          client_secret: this.bankConfig.client_secret
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting auth token:', error.response?.data || error.message);
      throw new Error('Failed to get authentication token');
    }
  }

  async getConsent(accessToken) {
    try {
      const consentData = {
        client_id: `${this.bankConfig.client_id}-1`,
        permissions: ["ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"],
        reason: "Агрегация счетов для финансового агрегатора",
        requesting_bank: this.bankConfig.requesting_bank,
        requesting_bank_name: this.bankConfig.requesting_bank_name
      };

      console.log('Sending consent request:', JSON.stringify(consentData, null, 2));

      const response = await this.api.post('/account-consents/request', consentData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Requesting-Bank': this.bankConfig.requesting_bank,
          'Content-Type': 'application/json'
        }
      });

      console.log('Consent response:', JSON.stringify(response.data, null, 2));
      return response.data;

    } catch (error) {
      console.error('Error getting consent:', error.response?.data || error.message);
      console.error('Full error:', error.response);
      throw new Error(`Failed to get account consent: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getAccounts(accessToken, consentId) {
    try {
      const response = await this.api.get('/accounts', {
        params: {
          client_id: `${this.bankConfig.client_id}-1`
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Consent-Id': consentId,
          'X-Requesting-Bank': this.bankConfig.requesting_bank,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting accounts:', error.response?.data || error.message);
      throw new Error('Failed to get accounts');
    }
  }

  async getAccountBalances(accessToken, consentId, accountId) {
    try {
      const response = await this.api.get(`/accounts/${accountId}/balances`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Consent-Id': consentId,
          'X-Requesting-Bank': this.bankConfig.requesting_bank,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting balances:', error.response?.data || error.message);
      throw new Error('Failed to get account balances');
    }
  }

  async getAccountTransactions(accessToken, consentId, accountId, params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 50
      };

      // Добавить даты только если они переданы
      if (params.fromDate) queryParams.from_booking_date_time = params.fromDate;
      if (params.toDate) queryParams.to_booking_date_time = params.toDate;

      const response = await this.api.get(`/accounts/${accountId}/transactions`, {
        params: queryParams,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Consent-Id': consentId,
          'X-Requesting-Bank': this.bankConfig.requesting_bank,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting transactions:', error.response?.data || error.message);
      throw new Error('Failed to get transactions');
    }
  }
}

module.exports = BankService;