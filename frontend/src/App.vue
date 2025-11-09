<template>
  <div id="app">
    <!-- Навигация -->
    <nav class="navbar">
      <div class="nav-brand">
        <div class="logo">💰</div>
        <h1>ФинАгрегатор</h1>
      </div>
      <div class="nav-actions">
        <button class="btn-refresh" @click="refreshData" :disabled="loading">
          🔄 Обновить
        </button>
        <div class="last-update" v-if="lastUpdate">
          Обновлено: {{ formatTime(lastUpdate) }}
        </div>
      </div>
    </nav>

    <main class="main-container">
      <!-- Загрузка -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner-large"></div>
          <p>Загружаем ваши финансовые данные...</p>
        </div>
      </div>

      <!-- Основной контент -->
      <div v-else class="dashboard">
        <!-- Сводка по банкам -->
        <section class="bank-summary-section">
          <h2 class="section-title">🏦 Подключенные банки</h2>
          <div class="bank-cards">
            <div class="bank-card" v-for="bank in banks" :key="bank.name">
              <div class="bank-header">
                <div class="bank-icon">🏦</div>
                <div class="bank-info">
                  <h3>{{ bank.displayName }}</h3>
                  <span class="bank-status connected">Подключен</span>
                </div>
              </div>
              <div class="bank-stats">
                <div class="stat">
                  <span class="stat-label">Счетов:</span>
                  <span class="stat-value">{{ bank.accountsCount }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Баланс:</span>
                  <span class="stat-value">{{ formatCurrency(bank.totalBalance) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Общий баланс -->
        <section class="balance-section">
          <div class="balance-card">
            <div class="balance-header">
              <h2>Общий баланс</h2>
              <div class="balance-trend positive">
                <span>+2.5% за месяц</span>
              </div>
            </div>
            <div class="balance-amount">
              {{ formatCurrency(totalBalance) }}
            </div>
            <div class="balance-breakdown">
              <div class="breakdown-item">
                <span class="label">Доступно:</span>
                <span class="value">{{ formatCurrency(availableBalance) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="label">Заблокировано:</span>
                <span class="value">{{ formatCurrency(blockedBalance) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Счета и карты -->
        <section class="accounts-section">
          <div class="section-header">
            <h2 class="section-title">💳 Счета и карты</h2>
            <div class="section-actions">
              <button class="btn-filter" @click="toggleFilter">
                🔍 Фильтр
              </button>
            </div>
          </div>
          
          <div class="accounts-grid">
            <div 
              v-for="account in filteredAccounts" 
              :key="account.accountId"
              class="account-card"
              :class="getAccountTypeClass(account.accountType)"
            >
              <div class="account-header">
                <div class="account-icon">
                  {{ getAccountIcon(account.accountType) }}
                </div>
                <div class="account-info">
                  <h3>{{ account.nickname || 'Основной счет' }}</h3>
                  <p class="account-number">
                    **** {{ getAccountNumber(account) }}
                  </p>
                </div>
                <div class="account-balance">
                  <div class="balance-amount">
                    {{ formatCurrency(getAccountBalance(account)) }}
                  </div>
                  <span class="currency">{{ account.currency }}</span>
                </div>
              </div>
              
              <div class="account-details">
                <div class="detail-item">
                  <span class="label">Тип:</span>
                  <span class="value">{{ getAccountTypeName(account.accountType) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Статус:</span>
                  <span class="status-badge" :class="account.status.toLowerCase()">
                    {{ getStatusName(account.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">Транзакций:</span>
                  <span class="value">{{ account.transactions ? account.transactions.length : 0 }}</span>
                </div>
              </div>

              <div class="account-actions">
                <button class="btn-action" @click="viewTransactions(account)">
                  📊 Транзакции
                </button>
                <button class="btn-action" @click="viewDetails(account)">
                  ℹ️ Подробнее
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Последние транзакции -->
        <section class="transactions-section" v-if="recentTransactions.length > 0">
          <h2 class="section-title">📋 Последние транзакции</h2>
          <div class="transactions-list">
            <div 
              v-for="transaction in recentTransactions" 
              :key="transaction.transactionId"
              class="transaction-item"
              :class="transaction.creditDebitIndicator.toLowerCase()"
            >
              <div class="transaction-icon">
                {{ getTransactionIcon(transaction) }}
              </div>
              <div class="transaction-details">
                <div class="transaction-info">
                  <h4>{{ transaction.transactionInformation || 'Транзакция' }}</h4>
                  <p class="transaction-date">
                    {{ formatDate(transaction.bookingDateTime) }}
                  </p>
                </div>
                <div class="transaction-amount" :class="transaction.creditDebitIndicator.toLowerCase()">
                  {{ formatTransactionAmount(transaction) }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Аналитика и прогнозы -->
        <section class="analytics-section">
          <div class="analytics-grid">
            <!-- Анализ расходов -->
            <div class="analytics-card">
              <h3>📈 Анализ расходов</h3>
              <div class="spending-categories">
                <div 
                  v-for="category in spendingCategories" 
                  :key="category.name"
                  class="category-item"
                >
                  <div class="category-header">
                    <span class="category-name">{{ category.name }}</span>
                    <span class="category-amount">{{ formatCurrency(category.amount) }}</span>
                  </div>
                  <div class="category-bar">
                    <div 
                      class="category-progress" 
                      :style="{ width: category.percentage + '%' }"
                      :class="category.type"
                    ></div>
                  </div>
                  <span class="category-percentage">{{ category.percentage }}%</span>
                </div>
              </div>
            </div>

            <!-- Финансовые советы -->
            <div class="analytics-card">
              <h3>💡 Советы</h3>
              <div class="advice-list">
                <div class="advice-item" v-for="advice in financialAdvice" :key="advice.id">
                  <div class="advice-icon">{{ advice.icon }}</div>
                  <div class="advice-content">
                    <h4>{{ advice.title }}</h4>
                    <p>{{ advice.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Прогноз на месяц -->
            <div class="analytics-card">
              <h3>🔮 Прогноз на месяц</h3>
              <div class="forecast-content">
                <div class="forecast-item">
                  <span class="forecast-label">Остаток до конца месяца:</span>
                  <span class="forecast-value positive">
                    {{ formatCurrency(monthlyForecast) }}
                  </span>
                </div>
                <div class="forecast-item">
                  <span class="forecast-label">Средние расходы в день:</span>
                  <span class="forecast-value">
                    {{ formatCurrency(dailySpending) }}
                  </span>
                </div>
                <div class="progress-chart">
                  <div class="progress-labels">
                    <span>Использовано</span>
                    <span>{{ monthlyProgress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: monthlyProgress + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Модальное окно транзакций -->
    <div v-if="selectedAccount" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Транзакции счета: {{ selectedAccount.nickname }}</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="transactions-list">
            <div 
              v-for="transaction in selectedAccount.transactions" 
              :key="transaction.transactionId"
              class="transaction-item detailed"
            >
              <div class="transaction-icon">
                {{ getTransactionIcon(transaction) }}
              </div>
              <div class="transaction-details">
                <div class="transaction-main">
                  <h4>{{ transaction.transactionInformation || 'Транзакция' }}</h4>
                  <p class="transaction-date">
                    {{ formatDate(transaction.bookingDateTime) }}
                  </p>
                </div>
                <div class="transaction-meta">
                  <span class="transaction-status" :class="transaction.status.toLowerCase()">
                    {{ getStatusName(transaction.status) }}
                  </span>
                </div>
              </div>
              <div class="transaction-amount" :class="transaction.creditDebitIndicator.toLowerCase()">
                {{ formatTransactionAmount(transaction) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/banks';

export default {
  name: 'App',
  data() {
    return {
      loading: false,
      bankData: null,
      banks: [
        {
          name: 'vbank',
          displayName: 'VBank',
          accountsCount: 0,
          totalBalance: 0
        }
      ],
      selectedAccount: null,
      lastUpdate: null,
      error: null
    }
  },
  computed: {
    totalBalance() {
      if (!this.bankData?.accounts) return 0;
      return this.bankData.accounts.reduce((total, account) => {
        const balance = this.getAccountBalance(account);
        return total + balance;
      }, 0);
    },
    
    availableBalance() {
      return this.totalBalance * 0.85; // Примерное значение
    },
    
    blockedBalance() {
      return this.totalBalance * 0.15; // Примерное значение
    },
    
    filteredAccounts() {
      return this.bankData?.accounts || [];
    },
    
    recentTransactions() {
      if (!this.bankData?.accounts) return [];
      const allTransactions = [];
      this.bankData.accounts.forEach(account => {
        if (account.transactions) {
          account.transactions.forEach(trans => {
            allTransactions.push({
              ...trans,
              accountName: account.nickname
            });
          });
        }
      });
      return allTransactions
        .sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime))
        .slice(0, 5);
    },
    
    spendingCategories() {
      // Анализ категорий трат на основе транзакций
      const categories = {
        'Продукты': { amount: 0, type: 'food' },
        'Транспорт': { amount: 0, type: 'transport' },
        'Развлечения': { amount: 0, type: 'entertainment' },
        'Коммунальные': { amount: 0, type: 'utilities' },
        'Прочее': { amount: 0, type: 'other' }
      };
      
      let totalSpent = 0;
      
      // Анализируем дебетовые транзакции
      this.bankData?.accounts?.forEach(account => {
        account.transactions?.forEach(trans => {
          if (trans.creditDebitIndicator === 'Debit') {
            const amount = parseFloat(trans.amount.amount);
            totalSpent += amount;
            
            // Простая категоризация по тексту транзакции
            const info = trans.transactionInformation?.toLowerCase() || '';
            if (info.includes('магазин') || info.includes('продукт')) {
              categories['Продукты'].amount += amount;
            } else if (info.includes('транспорт') || info.includes('бензин')) {
              categories['Транспорт'].amount += amount;
            } else if (info.includes('кино') || info.includes('ресторан')) {
              categories['Развлечения'].amount += amount;
            } else if (info.includes('коммунал') || info.includes('кварт')) {
              categories['Коммунальные'].amount += amount;
            } else {
              categories['Прочее'].amount += amount;
            }
          }
        });
      });
      
      // Преобразуем в массив и добавляем проценты
      return Object.entries(categories)
        .filter(([_, data]) => data.amount > 0)
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          type: data.type,
          percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0
        }));
    },
    
    financialAdvice() {
      const advice = [];
      
      // Анализируем данные для советов
      const totalSpent = this.spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
      const entertainmentSpent = this.spendingCategories.find(cat => cat.name === 'Развлечения')?.amount || 0;
      
      if (entertainmentSpent > totalSpent * 0.3) {
        advice.push({
          id: 1,
          icon: '🎯',
          title: 'Снизьте развлечения',
          description: 'Более 30% трат уходит на развлечения. Рекомендуем оптимизировать.'
        });
      }
      
      if (this.monthlyForecast < this.totalBalance * 0.1) {
        advice.push({
          id: 2,
          icon: '⚠️',
          title: 'Низкий остаток',
          description: 'К концу месяца останется мало средств. Экономьте.'
        });
      }
      
      // Добавляем общие советы, если мало конкретных
      if (advice.length === 0) {
        advice.push(
          {
            id: 3,
            icon: '💡',
            title: 'Создайте бюджет',
            description: 'Планируйте расходы на месяц для лучшего контроля.'
          },
          {
            id: 4,
            icon: '📊',
            title: 'Анализируйте регулярно',
            description: 'Проверяйте статистику раз в неделю.'
          }
        );
      }
      
      return advice.slice(0, 3);
    },
    
    monthlyForecast() {
      // Простой прогноз: текущий баланс - средние месячные траты
      const monthlySpending = this.spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
      return this.totalBalance - monthlySpending;
    },
    
    dailySpending() {
      const totalSpent = this.spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
      return totalSpent / 30; // Упрощенный расчет
    },
    
    monthlyProgress() {
      // Прогресс месяца (сколько дней прошло)
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Math.round((now.getDate() / daysInMonth) * 100);
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(API_BASE + '/data/vbank');
        this.bankData = response.data;
        this.lastUpdate = new Date();
        
        // Обновляем статистику банка
        if (this.bankData.accounts) {
          this.banks[0].accountsCount = this.bankData.accounts.length;
          this.banks[0].totalBalance = this.totalBalance;
        }
        
        console.log('Data loaded successfully:', this.bankData);
      } catch (error) {
        console.error('Failed to load data:', error);
        this.error = error.response?.data?.error || error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async refreshData() {
      await this.loadData();
    },
    
    getAccountBalance(account) {
      if (!account.balances || account.balances.length === 0) return 0;
      const balance = account.balances[0]; // Берем первый доступный баланс
      return parseFloat(balance.amount.amount);
    },
    
    getAccountNumber(account) {
      if (account.account && account.account.length > 0) {
        const acc = account.account[0];
        const num = acc.identification;
        return num.slice(-4); // Последние 4 цифры
      }
      return '0000';
    },
    
    getAccountIcon(type) {
      const icons = {
        'Personal': '👤',
        'Business': '🏢',
        'Checking': '💳',
        'Savings': '💰'
      };
      return icons[type] || '🏦';
    },
    
    getAccountTypeClass(type) {
      return type.toLowerCase();
    },
    
    getAccountTypeName(type) {
      const names = {
        'Personal': 'Личный',
        'Business': 'Бизнес',
        'Checking': 'Расчетный',
        'Savings': 'Накопительный'
      };
      return names[type] || type;
    },
    
    getStatusName(status) {
      const names = {
        'Enabled': 'Активен',
        'Disabled': 'Неактивен',
        'Booked': 'Проведена',
        'Pending': 'В обработке'
      };
      return names[status] || status;
    },
    
    getTransactionIcon(transaction) {
      const info = transaction.transactionInformation?.toLowerCase() || '';
      if (info.includes('зарплат') || transaction.creditDebitIndicator === 'Credit') return '💰';
      if (info.includes('магазин') || info.includes('продукт')) return '🛒';
      if (info.includes('транспорт') || info.includes('бензин')) return '🚗';
      if (info.includes('ресторан') || info.includes('кафе')) return '🍽️';
      if (info.includes('кино') || info.includes('развлечен')) return '🎬';
      return '💸';
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
      }).format(amount);
    },
    
    formatTransactionAmount(transaction) {
      const amount = parseFloat(transaction.amount.amount);
      const sign = transaction.creditDebitIndicator === 'Credit' ? '+' : '-';
      return `${sign}${this.formatCurrency(amount)}`;
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    
    formatTime(date) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    viewTransactions(account) {
      this.selectedAccount = account;
    },
    
    viewDetails(account) {
      // В будущем можно открыть детальную информацию о счете
      console.log('Account details:', account);
      alert(`Детали счета: ${account.nickname}\nБаланс: ${this.formatCurrency(this.getAccountBalance(account))}`);
    },
    
    closeModal() {
      this.selectedAccount = null;
    },
    
    toggleFilter() {
      // Функциональность фильтрации можно добавить позже
      console.log('Toggle filter');
    }
  }
}
</script>

<style scoped>
/* Основные стили остаются похожими, но добавлены новые компоненты */

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-size: 2rem;
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-refresh {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
}

.last-update {
  font-size: 0.9rem;
  opacity: 0.8;
}

.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Секции */
.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

/* Карты банков */
.bank-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.bank-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border-left: 4px solid #667eea;
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bank-icon {
  font-size: 2rem;
}

.bank-info h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.bank-status.connected {
  color: #27ae60;
  font-size: 0.9rem;
}

.bank-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

/* Баланс */
.balance-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
}

.balance-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.balance-trend.positive {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.balance-amount {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.balance-breakdown {
  display: flex;
  gap: 2rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
}

.breakdown-item .label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.breakdown-item .value {
  font-size: 1.2rem;
  font-weight: 600;
}

/* Счета */
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.account-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.account-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.account-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.account-info {
  flex: 1;
}

.account-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.account-number {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.account-balance {
  text-align: right;
}

.balance-amount {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.currency {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.account-details {
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-item:last-child {
  border-bottom: none;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.enabled {
  background: #d4edda;
  color: #155724;
}

.status-badge.booked {
  background: #d1ecf1;
  color: #0c5460;
}

.account-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-action:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

/* Транзакции */
.transactions-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.3s ease;
}

.transaction-item:hover {
  background: #f8f9fa;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-item.detailed {
  align-items: flex-start;
}

.transaction-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.transaction-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-main h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.transaction-date {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.transaction-meta {
  text-align: right;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.transaction-amount.credit {
  color: #27ae60;
}

.transaction-amount.debit {
  color: #e74c3c;
}

/* Аналитика */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.analytics-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.analytics-card h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
}

/* Категории расходов */
.category-item {
  margin-bottom: 1rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.category-name {
  font-weight: 500;
  color: #2c3e50;
}

.category-amount {
  font-weight: 600;
  color: #2c3e50;
}

.category-bar {
  background: #f8f9fa;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.category-progress {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.category-progress.food { background: #e74c3c; }
.category-progress.transport { background: #3498db; }
.category-progress.entertainment { background: #9b59b6; }
.category-progress.utilities { background: #f39c12; }
.category-progress.other { background: #95a5a6; }

.category-percentage {
  font-size: 0.8rem;
  color: #7f8c8d;
}

/* Советы */
.advice-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.advice-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.advice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.advice-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.advice-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Прогноз */
.forecast-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.forecast-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.forecast-item:last-child {
  border-bottom: none;
}

.forecast-label {
  color: #7f8c8d;
}

.forecast-value {
  font-weight: 600;
  color: #2c3e50;
}

.forecast-value.positive {
  color: #27ae60;
}

.progress-chart {
  margin-top: 1rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.progress-bar {
  background: #f8f9fa;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 10px;
  transition: width 0.3s ease;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

/* Загрузка */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loading-content {
  text-align: center;
}

.spinner-large {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Адаптивность */
@media (max-width: 768px) {
  .main-container {
    padding: 1rem;
  }
  
  .navbar {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .balance-amount {
    font-size: 2rem;
  }
  
  .balance-breakdown {
    flex-direction: column;
    gap: 1rem;
  }
  
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
}
</style>