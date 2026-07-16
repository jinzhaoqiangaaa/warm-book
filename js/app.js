/**
 * app.js - 应用主逻辑，协调所有模块
 * 负责: 初始化、导航切换、首页/记账/预算/分析/设置页面的渲染与交互
 * 依赖: i18n.js, data.js, components.js, charts.js
 */

const App = {
  // ==================== 状态管理 ====================
  currentPage: 'home',
  currentRecordType: 'expense',   // expense | income
  selectedCategory: null,
  selectedAccount: null,
  editingTransaction: null,
  currentAnalysisPeriod: 'month', // week | month | year

  // 快速记账状态
  quickAmount: '0',
  quickCategory: null,
  quickCategories: [],

  // ==================== 初始化 ====================
  async init() {
    try {
      // 1. 初始化国际化
      initI18n();
      // 2. 打开数据库并初始化默认数据
      await initAppData();
      // 3. 绑定底部导航事件
      this.bindNavEvents();
      // 4. 绑定头部语言切换
      this.bindHeaderEvents();
      // 5. 渲染首页
      await this.renderHome();
      // 6. 隐藏加载动画
      var loader = document.getElementById('loading-screen');
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(function () { loader.style.display = 'none'; }, 400);
      }
      // 7. 渲染底部导航文字
      this.updateNavText();
    } catch (e) {
      console.error('Init failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  },

  // ==================== 导航切换 ====================
  switchPage(page) {
    this.currentPage = page;
    // 隐藏所有section，显示目标section
    var sections = document.querySelectorAll('#app-content > section');
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.remove('active');
    }
    var target = document.getElementById(page + '-page');
    if (target) target.classList.add('active');

    // 更新底部nav激活状态
    var navBtns = document.querySelectorAll('#bottom-nav .nav-btn');
    for (var j = 0; j < navBtns.length; j++) {
      navBtns[j].classList.remove('active');
    }
    var activeBtn = document.querySelector('[data-target="' + page + '-page"]');
    if (activeBtn) activeBtn.classList.add('active');

    // 根据page调用对应render方法
    switch (page) {
      case 'home':
        this.renderHome();
        break;
      case 'record':
        this.renderRecord();
        break;
      case 'budget':
        this.renderBudget();
        break;
      case 'analysis':
        this.renderAnalysis();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }

    // 更新头部标题
    var titleEl = document.querySelector('.app-title span[data-i18n="app.name"]');
    if (titleEl) {
      titleEl.textContent = page === 'home' ? t('home_title') : '';
    }
  },

  // 更新导航栏文字（国际化）
  updateNavText() {
    var navBtns = document.querySelectorAll('#bottom-nav .nav-btn');
    var labels = [
      t('nav_home'),
      t('nav_record'),
      t('nav_budget'),
      t('nav_analysis'),
      t('nav_settings')
    ];
    for (var i = 0; i < navBtns.length; i++) {
      var labelEl = navBtns[i].querySelector('.nav-label');
      if (labelEl && labels[i]) {
        labelEl.textContent = labels[i];
      }
    }
    // 更新语言切换按钮
    var langLabel = document.getElementById('current-lang-label');
    if (langLabel) {
      langLabel.textContent = I18N.currentLang === 'zh' ? '中/EN' : 'EN/中';
    }
  },

  // ==================== 首页 ====================
  async renderHome() {
    try {
      // 1. 获取本月统计数据
      var now = new Date();
      var stats = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);

      // 获取分类信息，用于交易列表显示
      var categories = await getCategories();
      var categoryMap = {};
      for (var ci = 0; ci < categories.length; ci++) {
        categoryMap[categories[ci].id] = categories[ci];
      }
      var accounts = await getAccounts();
      var accountMap = {};
      for (var ai = 0; ai < accounts.length; ai++) {
        accountMap[accounts[ai].id] = accounts[ai];
      }

      // 2. 获取最近20条交易记录
      var transactions = await getTransactions({ limit: 20 });

      // 为交易记录附加分类和账户信息
      for (var ti = 0; ti < transactions.length; ti++) {
        transactions[ti].category = categoryMap[transactions[ti].categoryId] || null;
        transactions[ti].account = accountMap[transactions[ti].accountId] || null;
      }

      // 3. 渲染到page-inner
      var pageInner = document.querySelector('#home-page .page-inner');
      if (!pageInner) return;

      var html = '';

      // 概览卡片
      html += '<div class="home-summary">' + Components.renderHomeSummary(stats) + '</div>';

      // 最近记录标题
      html += '<div class="section-title" style="padding:12px 16px 8px;">' + t('home_recent') + '</div>';

      // 交易列表
      html += '<div class="home-transactions">' + Components.renderTransactionList(transactions) + '</div>';

      // 快速记账浮动按钮
      html += Components.renderQuickRecordButton();

      pageInner.innerHTML = html;

      // 4. 更新头部标题
      var titleEl = document.querySelector('.app-title span[data-i18n="app.name"]');
      if (titleEl) {
        titleEl.textContent = t('home_title');
      }
    } catch (e) {
      console.error('renderHome failed:', e);
    }
  },

  // ==================== 记账页面 ====================
  async renderRecord() {
    try {
      var type = this.currentRecordType;
      var categories = await getCategories(type);
      var accounts = await getAccounts();
      var container = document.querySelector('#record-page .page-inner');
      if (!container) return;

      container.innerHTML = Components.renderRecordPage(type, categories, accounts);

      // 如果是编辑模式，填充数据
      if (this.editingTransaction) {
        var trans = this.editingTransaction;
        // 设置类型
        this.currentRecordType = trans.type;
        // 设置分类
        this.selectedCategory = trans.categoryId;
        // 设置账户
        this.selectedAccount = trans.accountId;
        // 填充金额
        var amountInput = document.getElementById('amount-input');
        var amountDisplay = document.getElementById('amount-display');
        if (amountInput) amountInput.value = trans.amount;
        if (amountDisplay) amountDisplay.textContent = trans.amount.toFixed(2);
        // 填充日期
        var dateInput = document.getElementById('record-date');
        if (dateInput) dateInput.value = trans.date;
        // 填充时间
        var timeInput = document.getElementById('record-time');
        if (timeInput) timeInput.value = trans.time || toTimeStr();
        // 填充备注
        var noteInput = document.getElementById('record-note');
        if (noteInput) noteInput.value = trans.note || '';
        // 重新渲染以更新UI状态
        container.innerHTML = Components.renderRecordPage(trans.type, categories, accounts);
        // 重新填充
        if (amountInput) {
          amountInput = document.getElementById('amount-input');
          amountInput.value = trans.amount;
        }
        if (amountDisplay) {
          amountDisplay = document.getElementById('amount-display');
          amountDisplay.textContent = trans.amount.toFixed(2);
        }
        dateInput = document.getElementById('record-date');
        if (dateInput) dateInput.value = trans.date;
        timeInput = document.getElementById('record-time');
        if (timeInput) timeInput.value = trans.time || toTimeStr();
        noteInput = document.getElementById('record-note');
        if (noteInput) noteInput.value = trans.note || '';
      }

      // 设置默认选中
      this.selectedCategory = this.selectedCategory || (categories.length > 0 ? categories[0].id : null);
      this.selectedAccount = this.selectedAccount || (accounts.length > 0 ? accounts[0].id : null);

      // 应用选中状态
      this._applyCategorySelection();
      this._applyAccountSelection();

      // 绑定事件
      this.bindRecordEvents(container, categories, accounts);
    } catch (e) {
      console.error('renderRecord failed:', e);
    }
  },

  // 绑定记账页面事件
  bindRecordEvents(container, categories, accounts) {
    var self = this;

    // 金额显示区点击 -> 显示输入框
    var amountDisplay = container.querySelector('.amount-display');
    if (amountDisplay) {
      amountDisplay.addEventListener('click', function () {
        var input = document.getElementById('amount-input');
        if (input) {
          input.style.display = 'block';
          input.focus();
        }
      });
    }

    // 金额输入
    var amountInput = container.querySelector('#amount-input');
    if (amountInput) {
      amountInput.addEventListener('input', function () {
        var val = parseFloat(this.value) || 0;
        var display = document.getElementById('amount-display');
        if (display) display.textContent = val.toFixed(2);
      });
    }

    // 保存按钮
    var saveBtn = container.querySelector('.btn-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        self.saveTransaction();
      });
    }
  },

  // 切换记账类型
  switchRecordType(type) {
    this.currentRecordType = type;
    this.selectedCategory = null;
    this.editingTransaction = null;
    this.renderRecord();
  },

  // 选择分类
  selectCategory(categoryId) {
    this.selectedCategory = categoryId;
    this._applyCategorySelection();
  },

  // 应用分类选中状态的DOM更新
  _applyCategorySelection() {
    var items = document.querySelectorAll('.category-item');
    for (var i = 0; i < items.length; i++) {
      if (Number(items[i].dataset.id) === Number(this.selectedCategory)) {
        items[i].classList.add('selected');
      } else {
        items[i].classList.remove('selected');
      }
    }
  },

  // 选择账户
  selectAccount(accountId) {
    this.selectedAccount = accountId;
    this._applyAccountSelection();
  },

  // 应用账户选中状态的DOM更新
  _applyAccountSelection() {
    var items = document.querySelectorAll('.account-card');
    for (var i = 0; i < items.length; i++) {
      if (Number(items[i].dataset.id) === Number(this.selectedAccount)) {
        items[i].classList.add('selected');
      } else {
        items[i].classList.remove('selected');
      }
    }
  },

  // 聚焦金额输入框
  focusAmountInput() {
    var input = document.getElementById('amount-input');
    if (input) {
      input.style.display = 'block';
      input.focus();
    }
  },

  // 更新金额显示
  updateAmountDisplay(value) {
    var display = document.getElementById('amount-display');
    if (display) {
      var val = parseFloat(value) || 0;
      display.textContent = val.toFixed(2);
    }
  },

  // 更新记录日期
  updateRecordDate(value) {
    // 日期已通过input直接保存，无需额外操作
  },

  // 更新记录备注
  updateRecordNote(value) {
    // 备注已通过input直接保存，无需额外操作
  },

  // 保存交易记录
  async saveTransaction() {
    try {
      // 收集表单数据
      var amountInput = document.getElementById('amount-input');
      var dateInput = document.getElementById('record-date');
      var timeInput = document.getElementById('record-time');
      var noteInput = document.getElementById('record-note');

      var amount = parseFloat(amountInput ? amountInput.value : 0);
      var date = dateInput ? dateInput.value : toDateStr();
      var time = timeInput ? timeInput.value : toTimeStr();
      var note = noteInput ? noteInput.value : '';

      // 验证：金额必须大于0
      if (!amount || amount <= 0) {
        Components.showToast(t('record_amount'), 'warning');
        return;
      }
      // 验证：已选分类
      if (!this.selectedCategory) {
        Components.showToast(t('record_category'), 'warning');
        return;
      }
      // 验证：已选账户
      if (!this.selectedAccount) {
        Components.showToast(t('record_account'), 'warning');
        return;
      }

      var data = {
        type: this.currentRecordType,
        amount: amount,
        categoryId: Number(this.selectedCategory),
        accountId: Number(this.selectedAccount),
        date: date,
        time: time,
        note: note
      };

      if (this.editingTransaction) {
        // 更新已有记录
        await updateTransaction(this.editingTransaction.id, data);
        Components.showToast(t('common_success'));
      } else {
        // 新增记录
        await addTransaction(data);
        Components.showToast(t('common_success'));
      }

      // 清空状态
      this.editingTransaction = null;
      this.selectedCategory = null;
      this.selectedAccount = null;

      // 切换到首页
      this.switchPage('home');
    } catch (e) {
      console.error('saveTransaction failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  },

  // 编辑交易记录
  async editTransaction(id) {
    try {
      // 1. 获取所有交易记录（由于getTransactions返回列表）
      var transactions = await getTransactions({ limit: 9999 });
      var trans = null;
      for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].id === id) {
          trans = transactions[i];
          break;
        }
      }
      if (!trans) {
        Components.showToast(t('common_error'), 'error');
        return;
      }

      // 2. 设置编辑状态
      this.editingTransaction = trans;
      this.currentRecordType = trans.type;
      this.selectedCategory = trans.categoryId;
      this.selectedAccount = trans.accountId;

      // 3. 切换到记账页面
      this.switchPage('record');
    } catch (e) {
      console.error('editTransaction failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  },

  // 删除交易记录
  async deleteTransaction(id) {
    Components.showConfirm(t('record_confirm_delete'), async () => {
      try {
        await deleteTransaction(id);
        Components.showToast(t('common_success'));
        // 如果当前在首页，刷新
        if (this.currentPage === 'home') {
          this.renderHome();
        }
      } catch (e) {
        console.error('deleteTransaction failed:', e);
        Components.showToast(t('common_error'), 'error');
      }
    });
  },

  // ==================== 预算页面 ====================
  async renderBudget() {
    try {
      var now = new Date();
      var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

      // 1. 获取预算进度
      var progress = await getBudgetProgress(month);

      // 2. 获取分类预算列表
      var budgets = await getBudgets(month);

      // 获取分类信息
      var categories = await getCategories('expense');
      var categoryMap = {};
      for (var ci = 0; ci < categories.length; ci++) {
        categoryMap[categories[ci].id] = categories[ci];
      }

      // 获取本月支出数据，计算每个分类的实际支出
      var startDate = month + '-01';
      var endDate = getLastDayOfMonth(month);
      var transactions = await getTransactionsByDateRange(startDate, endDate, { type: 'expense' });

      var spentByCategory = {};
      for (var ti = 0; ti < transactions.length; ti++) {
        var catId = transactions[ti].categoryId;
        if (!spentByCategory[catId]) spentByCategory[catId] = 0;
        spentByCategory[catId] += transactions[ti].amount;
      }

      // 合并预算和支出数据
      var budgetList = [];
      for (var bi = 0; bi < budgets.length; bi++) {
        var b = budgets[bi];
        var catInfo = categoryMap[b.categoryId] || {};
        budgetList.push({
          id: b.id,
          categoryId: b.categoryId,
          categoryName: catInfo.name || t('cat_other'),
          categoryIcon: catInfo.icon || '📌',
          amount: b.amount,
          spent: Math.round((spentByCategory[b.categoryId] || 0) * 100) / 100
        });
      }

      // 3. 渲染
      var container = document.querySelector('#budget-page .page-inner');
      if (!container) return;

      var html = '';

      // 预算总览
      html += '<div class="budget-overview">' + Components.renderBudgetOverview(progress) + '</div>';

      // 预算列表标题
      html += '<div class="section-title" style="padding:12px 16px 8px;">' + t('budget_category') + '</div>';

      // 预算列表
      html += '<div class="budget-list-wrap">' + Components.renderBudgetList(budgetList) + '</div>';

      // 设置预算按钮
      html += '<div style="padding:16px;text-align:center;">';
      html += '<button class="btn-set-budget" onclick="App.showSetBudgetModal()" style="padding:10px 32px;background:#E8734A;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">' + t('budget_set') + '</button>';
      html += '</div>';

      container.innerHTML = html;
    } catch (e) {
      console.error('renderBudget failed:', e);
    }
  },

  // 显示设置预算弹窗
  async showSetBudgetModal() {
    try {
      var now = new Date();
      var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

      // 获取总预算
      var budgets = await getBudgets(month);
      var totalBudget = 0;
      for (var i = 0; i < budgets.length; i++) {
        if (budgets[i].categoryId === 'total') {
          totalBudget = budgets[i].amount;
          break;
        }
        totalBudget += budgets[i].amount;
      }

      var modalHtml = '<div class="modal-header">';
      modalHtml += '<h3 class="modal-title">' + t('budget_set') + '</h3>';
      modalHtml += '</div>';
      modalHtml += '<div class="modal-body">';
      modalHtml += '<div class="budget-input-wrap">';
      modalHtml += '<span class="budget-input-prefix">' + t('common_currency') + '</span>';
      modalHtml += '<input type="number" id="total-budget-input" class="budget-input" value="' + (totalBudget > 0 ? totalBudget : '') + '" placeholder="0.00" step="0.01" min="0">';
      modalHtml += '</div>';
      modalHtml += '</div>';
      modalHtml += '<div class="modal-footer">';
      modalHtml += '<button class="btn-cancel" onclick="Components.closeModal()">' + t('common_cancel') + '</button>';
      modalHtml += '<button class="btn-confirm" onclick="App.saveTotalBudget()">' + t('common_save') + '</button>';
      modalHtml += '</div>';

      Components.showModal(modalHtml);
    } catch (e) {
      console.error('showSetBudgetModal failed:', e);
    }
  },

  // 保存总预算
  async saveTotalBudget() {
    try {
      var input = document.getElementById('total-budget-input');
      if (!input) return;
      var amount = parseFloat(input.value);
      if (isNaN(amount) || amount < 0) {
        Components.showToast(t('common_error'), 'error');
        return;
      }

      var now = new Date();
      var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

      // 检查是否已有total预算
      var budgets = await getBudgets(month);
      var found = false;
      for (var i = 0; i < budgets.length; i++) {
        if (budgets[i].categoryId === 'total') {
          await updateBudget(budgets[i].id, { amount: amount });
          found = true;
          break;
        }
      }
      if (!found) {
        await addBudget({ month: month, categoryId: 'total', amount: amount });
      }

      Components.closeModal();
      Components.showToast(t('common_success'));
      this.renderBudget();
    } catch (e) {
      console.error('saveTotalBudget failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  },

  // 编辑分类预算
  async editBudgetCategory(categoryId) {
    try {
      var now = new Date();
      var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

      var categories = await getCategories('expense');
      var category = null;
      for (var ci = 0; ci < categories.length; ci++) {
        if (categories[ci].id === categoryId) {
          category = categories[ci];
          break;
        }
      }
      if (!category) return;

      // 查找已有预算
      var budgets = await getBudgets(month);
      var currentBudget = 0;
      var budgetId = null;
      for (var bi = 0; bi < budgets.length; bi++) {
        if (budgets[bi].categoryId === categoryId) {
          currentBudget = budgets[bi].amount;
          budgetId = budgets[bi].id;
          break;
        }
      }

      // 显示编辑弹窗
      var modalHtml = Components.renderBudgetModal(category, currentBudget);

      var wrapper = document.createElement('div');
      wrapper.innerHTML = modalHtml;
      var modal = wrapper.firstChild;
      document.body.appendChild(modal);

      requestAnimationFrame(function () {
        modal.classList.add('modal-show');
      });

      // 保存按钮
      var self = this;
      var saveBtn = modal.querySelector('.btn-confirm');
      if (saveBtn) {
        saveBtn.onclick = async function () {
          var input = document.getElementById('budget-amount-input');
          if (!input) return;
          var amount = parseFloat(input.value);
          if (isNaN(amount) || amount < 0) amount = 0;

          if (budgetId) {
            await updateBudget(budgetId, { amount: amount });
          } else {
            await addBudget({ month: month, categoryId: categoryId, amount: amount });
          }

          Components.closeModal();
          Components.showToast(t('common_success'));
          self.renderBudget();
        };
      }

      // 关闭按钮
      var closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.onclick = function () { Components.closeModal(); };
      }
    } catch (e) {
      console.error('editBudgetCategory failed:', e);
    }
  },

  // 保存分类预算
  async saveBudget(categoryId) {
    // 此方法已由 editBudgetCategory 内联处理
  },

  // ==================== 分析页面 ====================
  async renderAnalysis() {
    try {
      var period = this.currentAnalysisPeriod;
      var now = new Date();

      // 根据周期获取统计数据
      var stats = null;
      var trendLabels = [];
      var expenseTrend = [];
      var incomeTrend = [];

      if (period === 'week') {
        stats = await getWeeklyStats(now);
        // 构建每日标签
        var weekRange = getWeekRange(now);
        var dayNames = I18N.currentLang === 'zh'
          ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // 确保每天都有数据
        var dailyMap = {};
        for (var di = 0; di < stats.dailyData.length; di++) {
          dailyMap[stats.dailyData[di].date] = stats.dailyData[di];
        }
        var d = new Date(weekRange.start);
        for (var wi = 0; wi < 7; wi++) {
          var dateStr = toDateStr(d);
          trendLabels.push(dayNames[wi]);
          var dayData = dailyMap[dateStr];
          expenseTrend.push(dayData ? dayData.expense : 0);
          incomeTrend.push(dayData ? dayData.income : 0);
          d.setDate(d.getDate() + 1);
        }
      } else if (period === 'month') {
        stats = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);
        // 月度按日（使用15天作为简化展示）
        var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        var startDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
        var endDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(daysInMonth).padStart(2, '0');
        var allTrans = await getTransactionsByDateRange(startDate, endDate);
        var dailyExpenseMap = {};
        var dailyIncomeMap = {};
        for (var mt = 0; mt < allTrans.length; mt++) {
          var day = allTrans[mt].date.split('-')[2];
          if (!dailyExpenseMap[day]) { dailyExpenseMap[day] = 0; dailyIncomeMap[day] = 0; }
          if (allTrans[mt].type === 'expense') dailyExpenseMap[day] += allTrans[mt].amount;
          else dailyIncomeMap[day] += allTrans[mt].amount;
        }
        for (var mi = 1; mi <= daysInMonth; mi++) {
          var dayKey = String(mi).padStart(2, '0');
          trendLabels.push(mi + '');
          expenseTrend.push(Math.round((dailyExpenseMap[dayKey] || 0) * 100) / 100);
          incomeTrend.push(Math.round((dailyIncomeMap[dayKey] || 0) * 100) / 100);
        }
      } else if (period === 'year') {
        stats = await getYearlyStats(now.getFullYear());
        // 月度标签
        for (var yi = 0; yi < 12; yi++) {
          trendLabels.push(getMonthName(yi + 1));
          var monthData = stats.monthlyData[yi];
          expenseTrend.push(monthData ? monthData.expense : 0);
          incomeTrend.push(monthData ? monthData.income : 0);
        }
      }

      // 获取分类信息
      var categories = await getCategories();
      var categoryMap = {};
      for (var cmi = 0; cmi < categories.length; cmi++) {
        categoryMap[categories[cmi].id] = categories[cmi];
      }

      // 构建分类占比数据
      var expenseByCategory = [];
      var incomeByCategory = [];
      if (stats && stats.byCategory) {
        for (var bci = 0; bci < stats.byCategory.length; bci++) {
          var catInfo = categoryMap[stats.byCategory[bci].categoryId] || {};
          var catData = {
            name: catInfo.name || t('cat_other'),
            value: stats.byCategory[bci].amount,
            icon: catInfo.icon || '📌',
            color: Charts.COLORS[bci % Charts.COLORS.length]
          };
          if (stats.byCategory[bci].type === 'expense') {
            expenseByCategory.push(catData);
          } else {
            incomeByCategory.push(catData);
          }
        }
      }

      // 排序：按金额降序
      expenseByCategory.sort(function (a, b) { return b.value - a.value; });
      incomeByCategory.sort(function (a, b) { return b.value - a.value; });

      // 计算报告摘要
      var totalExpense = stats ? stats.expense : 0;
      var totalIncome = stats ? stats.income : 0;
      var days = 1;
      if (period === 'week') days = 7;
      else if (period === 'month') days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      else if (period === 'year') days = (now.getMonth() + 1) * 30 + now.getDate();
      var avgDaily = totalExpense / Math.max(days, 1);

      var maxCategory = '-';
      if (expenseByCategory.length > 0) {
        maxCategory = expenseByCategory[0].name;
      }

      // 渲染
      var container = document.querySelector('#analysis-page .page-inner');
      if (!container) return;

      var html = '';

      // 周期切换标签
      html += Components.renderPeriodTabs(period);

      // 报告摘要
      html += Components.renderReportSummary({
        totalExpense: totalExpense,
        totalIncome: totalIncome,
        avgDaily: Math.round(avgDaily * 100) / 100,
        maxCategory: maxCategory
      });

      // 支出分析（饼图）
      html += '<div class="chart-section">';
      html += '<div class="section-title">' + t('analysis_expense') + '</div>';
      html += '<canvas id="expense-pie-chart"></canvas>';
      html += '</div>';

      // 收支趋势（折线图）
      html += '<div class="chart-section">';
      html += '<div class="section-title">' + t('analysis_trend') + '</div>';
      html += '<canvas id="trend-line-chart"></canvas>';
      html += '</div>';

      // 消费排行
      html += '<div class="ranking-section">';
      html += Components.renderRankingList(expenseByCategory, totalExpense);
      html += '</div>';

      // 消费建议
      html += Components.renderAdvice({
        stats: { avgDaily: Math.round(avgDaily * 100) / 100 },
        byCategory: expenseByCategory,
        totalExpense: totalExpense,
        totalIncome: totalIncome
      });

      container.innerHTML = html;

      // 绑定周期切换事件
      this._bindAnalysisPeriodEvents(container);

      // 延迟绘制图表，确保DOM就绪
      var self = this;
      setTimeout(function () {
        // 绘制饼图
        Charts.drawPieChart('expense-pie-chart', expenseByCategory, {
          title: '',
          showLegend: true,
          showPercent: true
        });

        // 绘制趋势折线图
        Charts.drawLineChart('trend-line-chart', {
          labels: trendLabels,
          datasets: [
            { name: t('record_expense'), values: expenseTrend, color: '#E8734A' },
            { name: t('record_income'), values: incomeTrend, color: '#4CAF50' }
          ]
        }, {
          title: '',
          fill: true,
          showDots: true
        });
      }, 100);

    } catch (e) {
      console.error('renderAnalysis failed:', e);
    }
  },

  // 绑定分析页面的周期切换事件
  _bindAnalysisPeriodEvents(container) {
    var tabs = container.querySelectorAll('.period-tab');
    var self = this;
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var period = this.dataset.period || this.textContent.toLowerCase().indexOf(t('analysis_week')) >= 0 ? 'week'
          : this.textContent.toLowerCase().indexOf(t('analysis_month')) >= 0 ? 'month' : 'year';
        self.switchAnalysisPeriod(period);
      });
    }
  },

  // 切换分析周期
  switchAnalysisPeriod(period) {
    this.currentAnalysisPeriod = period;
    this.renderAnalysis();
  },

  // ==================== 设置页面 ====================
  async renderSettings() {
    try {
      var container = document.querySelector('#settings-page .page-inner');
      if (!container) return;

      container.innerHTML = Components.renderSettingsPage({
        lang: I18N.currentLang,
        lockEnabled: localStorage.getItem('warmbook_lock') === 'true',
        version: '1.0.0'
      });

      this.bindSettingsEvents(container);
    } catch (e) {
      console.error('renderSettings failed:', e);
    }
  },

  // 绑定设置页面事件
  bindSettingsEvents(container) {
    // 语言切换
    var langItem = container.querySelector('.settings-item[onclick*="toggleLanguage"]');
    if (langItem) {
      langItem.addEventListener('click', function () {
        App.switchLanguage();
      });
    }

    // 应用锁toggle
    var lockToggle = container.querySelector('input[onchange*="toggleLock"]');
    if (lockToggle) {
      lockToggle.addEventListener('change', function () {
        localStorage.setItem('warmbook_lock', this.checked ? 'true' : 'false');
        Components.showToast(t('common_success'));
      });
    }

    // 导出数据
    var exportItem = container.querySelector('.settings-item[onclick*="exportData"]');
    if (exportItem) {
      exportItem.addEventListener('click', function () {
        App.exportData();
      });
    }

    // 导入数据
    var importItem = container.querySelector('.settings-item[onclick*="importData"]');
    if (importItem) {
      importItem.addEventListener('click', function () {
        App.importData();
      });
    }

    // 清除数据
    var clearItem = container.querySelector('.settings-item[onclick*="clearData"]');
    if (clearItem) {
      clearItem.addEventListener('click', function () {
        App.clearData();
      });
    }
  },

  // ==================== 语言切换 ====================
  switchLanguage() {
    var newLang = I18N.currentLang === 'zh' ? 'en' : 'zh';
    switchLang(newLang);
    // 更新按钮文字
    this.updateNavText();
    // 重新渲染当前页面
    this.switchPage(this.currentPage);
  },

  // toggleLanguage（与switchLanguage一致，用于settings组件的onclick）
  toggleLanguage() {
    this.switchLanguage();
  },

  // toggleLock
  toggleLock(checked) {
    localStorage.setItem('warmbook_lock', checked ? 'true' : 'false');
    Components.showToast(t('common_success'));
  },

  // ==================== 数据导出/导入/清除 ====================

  // 导出数据
  async exportData() {
    try {
      var data = await exportAllData();
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'warmbook_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Components.showToast(t('common_success'));
    } catch (e) {
      console.error('exportData failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  },

  // 导入数据
  importData() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    var self = this;
    input.onchange = async function (e) {
      var file = e.target.files[0];
      if (!file) return;
      try {
        var text = await file.text();
        await importAllData(text);
        Components.showToast(t('common_success'));
        self.renderHome();
      } catch (err) {
        console.error('importData failed:', err);
        Components.showToast(t('common_error'), 'error');
      }
    };
    input.click();
  },

  // 清除数据
  clearData() {
    var self = this;
    Components.showConfirm(t('settings_clear_confirm'), async function () {
      // 清除IndexedDB
      indexedDB.deleteDatabase(DB_NAME);
      // 清除localStorage
      localStorage.clear();
      Components.showToast(t('common_success'));
      // 重新初始化
      await self.init();
    });
  },

  // ==================== 事件绑定 ====================
  bindNavEvents() {
    var self = this;
    var navBtns = document.querySelectorAll('#bottom-nav .nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.dataset.target;
          if (!target) return;
          // 从 "home-page" 提取 "home"
          var page = target.replace('-page', '');
          self.switchPage(page);
        });
      })(navBtns[i]);
    }
  },

  bindHeaderEvents() {
    var self = this;
    var langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        self.switchLanguage();
      });
    }
  },

  // ==================== 快速记账 ====================

  async openQuickRecord() {
    try {
      // 重置状态
      this.quickAmount = '0';
      this.quickCategory = null;

      // 获取支出分类
      var categories = await getCategories('expense');
      this.quickCategories = categories;

      // 默认选中第一个分类
      if (categories.length > 0) {
        this.quickCategory = categories[0].id;
      }

      // 渲染数字键盘
      var numpadEl = document.getElementById('quick-numpad');
      if (numpadEl) {
        numpadEl.innerHTML = Components.renderQuickNumpad();
      }

      // 渲染分类
      var catEl = document.getElementById('quick-categories');
      if (catEl) {
        catEl.innerHTML = Components.renderQuickCategories(categories, this.quickCategory);
      }

      // 更新金额显示
      this.updateQuickAmountDisplay();

      // 显示面板
      var overlay = document.getElementById('quick-record-overlay');
      var panel = document.getElementById('quick-record-panel');
      if (overlay) overlay.style.display = 'block';
      if (panel) {
        panel.style.display = 'block';
        requestAnimationFrame(function () {
          panel.classList.add('show');
        });
      }
    } catch (e) {
      console.error('openQuickRecord failed:', e);
    }
  },

  closeQuickRecord() {
    var overlay = document.getElementById('quick-record-overlay');
    var panel = document.getElementById('quick-record-panel');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(function () {
        panel.style.display = 'none';
      }, 300);
    }
    if (overlay) {
      overlay.style.display = 'none';
    }
    // 重置状态
    this.quickAmount = '0';
    this.quickCategory = null;
  },

  pressQuickKey(key) {
    var amount = this.quickAmount;

    if (key === '⌫') {
      // 删除键
      if (amount.length > 1) {
        amount = amount.slice(0, -1);
      } else {
        amount = '0';
      }
    } else if (key === '.') {
      // 小数点
      if (!amount.includes('.')) {
        amount += '.';
      }
    } else {
      // 数字键
      if (amount === '0') {
        amount = key;
      } else if (amount.replace('.', '').length < 8) {
        // 最多8位数字
        amount += key;
      }
    }

    this.quickAmount = amount;
    this.updateQuickAmountDisplay();
  },

  updateQuickAmountDisplay() {
    var display = document.getElementById('quick-amount-display');
    if (display) {
      display.textContent = this.quickAmount;
    }
  },

  selectQuickCategory(categoryId) {
    this.quickCategory = categoryId;
    // 更新UI选中状态
    var items = document.querySelectorAll('.quick-cat-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var id = parseInt(item.dataset.id);
      item.classList.toggle('selected', id === categoryId);
    }
  },

  async saveQuickRecord() {
    try {
      var amount = parseFloat(this.quickAmount);
      if (!amount || amount <= 0) {
        Components.showToast('请输入金额', 'warning');
        return;
      }
      if (!this.quickCategory) {
        Components.showToast('请选择分类', 'warning');
        return;
      }

      // 获取默认账户（第一个）
      var accounts = await getAccounts();
      var accountId = accounts.length > 0 ? accounts[0].id : 1;

      var now = new Date();
      var data = {
        type: 'expense',
        amount: amount,
        categoryId: this.quickCategory,
        accountId: accountId,
        date: toDateStr(now),
        time: toTimeStr(now),
        note: ''
      };

      await addTransaction(data);
      Components.showToast(t('common_success'));

      // 关闭面板并刷新首页
      this.closeQuickRecord();
      this.renderHome();
    } catch (e) {
      console.error('saveQuickRecord failed:', e);
      Components.showToast(t('common_error'), 'error');
    }
  }
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
