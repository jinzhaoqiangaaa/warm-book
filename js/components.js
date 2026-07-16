/**
 * components.js - UI 组件模块
 * PWA 记账应用的所有 UI 渲染函数
 * 所有函数返回 HTML 字符串或直接操作 DOM
 * 依赖: i18n.js (t, formatMoney, formatDate), data.js (App 全局对象)
 */

const Components = {

  // ==================== 首页组件 ====================

  /**
   * 渲染首页概览卡片：本月支出、收入、结余
   * @param {Object} stats - {income, expense, balance}
   * @returns {string} HTML 字符串
   */
  renderHomeSummary(stats) {
    var income = stats.income || 0;
    var expense = stats.expense || 0;
    var balance = stats.balance || 0;

    var balanceClass = balance >= 0 ? 'balance-positive' : 'balance-negative';

    var html = '<div class="summary-card">';
    html += '<div class="summary-grid">';

    // 本月支出
    html += '<div class="summary-item">';
    html += '<div class="summary-label">' + t('home_month_expense') + '</div>';
    html += '<div class="summary-amount expense-amount">' + formatMoney(expense) + '</div>';
    html += '</div>';

    // 本月收入
    html += '<div class="summary-item">';
    html += '<div class="summary-label">' + t('home_month_income') + '</div>';
    html += '<div class="summary-amount income-amount">' + formatMoney(income) + '</div>';
    html += '</div>';

    // 本月结余
    html += '<div class="summary-item">';
    html += '<div class="summary-label">' + t('home_month_balance') + '</div>';
    html += '<div class="summary-amount ' + balanceClass + '">' + formatMoney(balance) + '</div>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    return html;
  },

  /**
   * 渲染交易记录列表
   * @param {Array} transactions - [{id, type, amount, category, account, date, note}]
   * @returns {string} HTML 字符串
   */
  renderTransactionList(transactions) {
    if (!transactions || transactions.length === 0) {
      return this.renderEmptyState('📝', t('home_no_records'));
    }

    var html = '<div class="transaction-list">';

    for (var i = 0; i < transactions.length; i++) {
      var trans = transactions[i];
      var iconKey = trans.category ? trans.category.icon : 'other';
      var catName = trans.category ? trans.category.name : '';
      var accName = trans.account ? trans.account.name : '';
      var detailParts = [];
      if (catName) detailParts.push(catName);
      if (accName) detailParts.push(accName);
      if (trans.note) detailParts.push(trans.note);
      var detailStr = detailParts.join(' \u00B7 ');

      // 显示时间
      var timeStr = trans.time || '';

      var amountClass = trans.type === 'income' ? 'income-amount' : 'expense-amount';
      var prefix = trans.type === 'income' ? '+' : '-';

      html += '<div class="transaction-item" onclick="App.editTransaction(' + trans.id + ')">';
      html += '  <div class="transaction-icon">' + getIcon(iconKey) + '</div>';
      html += '  <div class="transaction-info">';
      html += '    <div class="t-name">' + (catName || t('cat_other')) + '</div>';
      html += '    <div class="t-detail">' + detailStr + '</div>';
      html += '  </div>';
      html += '  <div class="transaction-right">';
      html += '    <div class="transaction-amount ' + amountClass + '">' + prefix + formatMoney(trans.amount) + '</div>';
      html += '    <div class="transaction-time">' + timeStr + '</div>';
      html += '  </div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /**
   * 渲染日期分组标题
   * @param {string} dateStr - 日期字符串 YYYY-MM-DD
   * @returns {string} HTML 字符串
   */
  renderDateHeader(dateStr) {
    if (!dateStr) return '';

    var today = toDateStr(new Date());
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = toDateStr(yesterday);

    var displayText = '';
    if (dateStr === today) {
      displayText = t('record_today');
    } else if (dateStr === yesterdayStr) {
      displayText = I18N.currentLang === 'zh' ? '昨天' : 'Yesterday';
    } else {
      displayText = formatDate(dateStr);
    }

    // 附加星期信息
    var parts = dateStr.split('-');
    var dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var dayNames = I18N.currentLang === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var html = '<div class="date-header">';
    html += '<span class="date-text">' + displayText + '</span>';
    html += '<span class="date-weekday">' + dayNames[dateObj.getDay()] + '</span>';
    html += '</div>';

    return html;
  },

  // ==================== 记账页面组件 ====================

  /**
   * 渲染记账页面
   * @param {string} type - 'expense' | 'income'
   * @param {Array} categories - 分类列表 [{id, name, icon, type}]
   * @param {Array} accounts - 账户列表 [{id, name, icon, type}]
   * @returns {string} HTML 字符串
   */
  renderRecordPage(type, categories, accounts) {
    var isExpense = type === 'expense';
    var todayStr = toDateStr(new Date());
    var nowTimeStr = toTimeStr(new Date());

    var html = '<div class="record-page">';

    // 1. 支出/收入切换按钮
    html += '<div class="type-toggle">';
    html += '<button class="toggle-btn ' + (isExpense ? 'active expense-active' : '') + '" onclick="App.switchRecordType(\'expense\')">' + t('record_expense') + '</button>';
    html += '<button class="toggle-btn ' + (!isExpense ? 'active income-active' : '') + '" onclick="App.switchRecordType(\'income\')">' + t('record_income') + '</button>';
    html += '</div>';

    // 2. 金额输入区
    html += '<div class="amount-section">';
    html += '<div class="amount-display" onclick="App.focusAmountInput()">';
    html += '<span class="amount-prefix">' + (isExpense ? '-' : '+') + '</span>';
    html += '<span class="amount-value" id="amount-display">0.00</span>';
    html += '</div>';
    html += '<input type="number" id="amount-input" class="amount-input" placeholder="' + t('record_amount') + '" step="0.01" min="0" oninput="App.updateAmountDisplay(this.value)" style="display:none;">';
    html += '</div>';

    // 3. 分类选择区
    html += '<div class="category-section">';
    html += '<div class="section-title">' + t('record_category') + '</div>';
    html += '<div class="category-grid">';

    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      html += '<div class="category-item" data-id="' + cat.id + '" onclick="App.selectCategory(' + cat.id + ')">';
      html += '<div class="category-icon">' + getIcon(cat.icon) + '</div>';
      html += '<div class="category-name">' + cat.name + '</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    // 4. 表单区
    html += '<div class="form-section">';

    // 账户选择（水平滚动）
    html += '<div class="account-selector-wrap">';
    html += '<div class="section-title">' + t('record_account') + '</div>';
    html += '<div class="account-selector">';

    for (var j = 0; j < accounts.length; j++) {
      var acc = accounts[j];
      html += '<div class="account-card" data-id="' + acc.id + '" onclick="App.selectAccount(' + acc.id + ')">';
      html += '<span class="account-icon">' + getIcon(acc.icon) + '</span>';
      html += '<span class="account-name">' + acc.name + '</span>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';

    // 日期和时间（一行两列）
    html += '<div class="form-row-datetime">';
    html += '<div class="form-col">';
    html += '<label class="form-label">' + t('record_date') + '</label>';
    html += '<input type="date" id="record-date" class="form-input" value="' + todayStr + '">';
    html += '</div>';
    html += '<div class="form-col">';
    html += '<label class="form-label">' + (I18N.currentLang === 'zh' ? '时间' : 'Time') + '</label>';
    html += '<input type="time" id="record-time" class="form-input" value="' + nowTimeStr + '">';
    html += '</div>';
    html += '</div>';

    // 备注输入
    html += '<div class="form-row">';
    html += '<label class="form-label">' + t('record_note') + '</label>';
    html += '<input type="text" id="record-note" class="form-input" placeholder="' + t('record_note') + '" maxlength="100">';
    html += '</div>';

    html += '</div>';

    // 5. 保存按钮
    html += '<button class="btn-save" onclick="App.saveTransaction()">' + t('record_save') + '</button>';

    html += '</div>';

    return html;
  },

  // ==================== 预算页面组件 ====================

  /**
   * 渲染预算总览
   * @param {Object} progress - {budget, spent, remaining, percentage}
   * @returns {string} HTML 字符串
   */
  renderBudgetOverview(progress) {
    var html = '';

    // 如果没有设置预算
    if (!progress || progress.budget <= 0) {
      html += '<div class="budget-empty">';
      html += '<div class="empty-icon">💰</div>';
      html += '<p>' + t('budget_no_budget') + '</p>';
      html += '<button class="btn-set-budget" onclick="App.showSetBudgetModal()">' + t('budget_set') + '</button>';
      html += '</div>';
      return html;
    }

    var pct = Math.min(progress.percentage, 100);
    var overClass = progress.percentage > 100 ? ' over' : '';
    var remainClass = progress.remaining >= 0 ? 'remaining-positive' : 'remaining-negative';

    // 预算总览卡片
    html += '<div class="budget-overview">';
    html += '<div class="budget-title">' + t('budget_month') + '</div>';
    html += '<div class="budget-amount">' + formatMoney(progress.budget) + '</div>';
    html += '<div class="budget-progress-bar">';
    html += '<div class="budget-progress-fill' + overClass + '" style="width:' + pct + '%"></div>';
    html += '</div>';
    html += '<div class="budget-percentage">' + Math.round(progress.percentage) + '%</div>';
    html += '</div>';

    // 预算统计 3 列
    html += '<div class="budget-stats">';
    html += '<div class="budget-stat-item">';
    html += '<div class="budget-stat-label">' + t('budget_remaining') + '</div>';
    html += '<div class="budget-stat-value ' + remainClass + '">' + formatMoney(progress.remaining) + '</div>';
    html += '</div>';
    html += '<div class="budget-stat-item">';
    html += '<div class="budget-stat-label">' + t('budget_used') + '</div>';
    html += '<div class="budget-stat-value">' + formatMoney(progress.spent) + '</div>';
    html += '</div>';
    html += '<div class="budget-stat-item">';
    html += '<div class="budget-stat-label">' + t('budget_total') + '</div>';
    html += '<div class="budget-stat-value">' + formatMoney(progress.budget) + '</div>';
    html += '</div>';
    html += '</div>';

    return html;
  },

  /**
   * 渲染分类预算列表
   * @param {Array} budgets - [{categoryId, amount, spent, categoryName, categoryIcon}]
   * @returns {string} HTML 字符串
   */
  renderBudgetList(budgets) {
    if (!budgets || budgets.length === 0) {
      return this.renderEmptyState('📋', t('budget_no_budget'));
    }

    var html = '<div class="budget-list">';

    for (var i = 0; i < budgets.length; i++) {
      var item = budgets[i];
      var pct = item.amount > 0 ? Math.round((item.spent / item.amount) * 100) : 0;
      var fillWidth = Math.min(pct, 100);
      var statusLabel = '';
      var statusClass = '';

      if (pct >= 100) {
        statusLabel = t('budget_overspent');
        statusClass = 'status-overspent';
      } else if (pct >= 80) {
        statusLabel = t('budget_warning');
        statusClass = 'status-warning';
      } else {
        statusLabel = t('budget_safe');
        statusClass = 'status-safe';
      }

      html += '<div class="budget-item" onclick="App.editBudgetCategory(' + item.categoryId + ')">';
      html += '  <div class="budget-item-left">';
      html += '    <span class="budget-item-icon">' + getIcon(item.categoryIcon || 'other') + '</span>';
      html += '    <span class="budget-item-name">' + (item.categoryName || '') + '</span>';
      html += '  </div>';
      html += '  <div class="budget-item-center">';
      html += '    <div class="budget-item-bar">';
      html += '      <div class="budget-item-fill';
      if (pct >= 100) html += ' fill-over';
      else if (pct >= 80) html += ' fill-warning';
      html += '" style="width:' + fillWidth + '%"></div>';
      html += '    </div>';
      html += '    <span class="budget-item-pct">' + pct + '%</span>';
      html += '  </div>';
      html += '  <div class="budget-item-right">';
      html += '    <span class="budget-status ' + statusClass + '">' + statusLabel + '</span>';
      html += '  </div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /**
   * 渲染预算编辑弹窗
   * @param {Object} category - {id, name, icon}
   * @param {number} currentBudget - 当前预算金额
   * @returns {string} HTML 字符串
   */
  renderBudgetModal(category, currentBudget) {
    var displayValue = currentBudget > 0 ? currentBudget.toFixed(2) : '';

    var html = '<div class="modal-overlay" onclick="Components.closeModal()">';
    html += '<div class="modal-content" onclick="event.stopPropagation()">';

    // 头部
    html += '<div class="modal-header">';
    html += '<h3 class="modal-title">' + t('budget_category') + '</h3>';
    html += '<button class="modal-close" onclick="Components.closeModal()">&times;</button>';
    html += '</div>';

    // 分类信息
    html += '<div class="modal-category-info">';
    html += '<span class="modal-cat-icon">' + getIcon(category.icon || 'other') + '</span>';
    html += '<span class="modal-cat-name">' + (category.name || '') + '</span>';
    html += '</div>';

    // 金额输入
    html += '<div class="modal-body">';
    html += '<div class="budget-input-wrap">';
    html += '<span class="budget-input-prefix">' + t('common_currency') + '</span>';
    html += '<input type="number" id="budget-amount-input" class="budget-input" value="' + displayValue + '" placeholder="0.00" step="0.01" min="0">';
    html += '</div>';
    html += '</div>';

    // 保存按钮
    html += '<div class="modal-footer">';
    html += '<button class="btn-cancel" onclick="Components.closeModal()">' + t('common_cancel') + '</button>';
    html += '<button class="btn-confirm" onclick="App.saveBudget(' + category.id + ')">' + t('common_save') + '</button>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    return html;
  },

  // ==================== 分析页面组件 ====================

  /**
   * 渲染分析页面的周期切换标签
   * @param {string} activePeriod - 'week' | 'month' | 'year'
   * @returns {string} HTML 字符串
   */
  renderPeriodTabs(activePeriod) {
    var periods = [
      { key: 'week', label: t('analysis_week') },
      { key: 'month', label: t('analysis_month') },
      { key: 'year', label: t('analysis_year') }
    ];

    var html = '<div class="period-tabs">';

    for (var i = 0; i < periods.length; i++) {
      var p = periods[i];
      var activeClass = p.key === activePeriod ? ' active' : '';
      html += '<button class="period-tab' + activeClass + '" onclick="App.switchAnalysisPeriod(\'' + p.key + '\')">' + p.label + '</button>';
    }

    html += '</div>';
    return html;
  },

  /**
   * 渲染报告摘要卡片 (2x2 grid)
   * @param {Object} stats - {totalExpense, totalIncome, avgDaily, maxCategory}
   * @returns {string} HTML 字符串
   */
  renderReportSummary(stats) {
    var html = '<div class="report-summary">';

    // 总支出
    html += '<div class="report-card">';
    html += '<div class="report-card-label">' + t('analysis_total_expense') + '</div>';
    html += '<div class="report-card-value expense-amount">' + formatMoney(stats.totalExpense || 0) + '</div>';
    html += '</div>';

    // 总收入
    html += '<div class="report-card">';
    html += '<div class="report-card-label">' + t('analysis_total_income') + '</div>';
    html += '<div class="report-card-value income-amount">' + formatMoney(stats.totalIncome || 0) + '</div>';
    html += '</div>';

    // 日均支出
    html += '<div class="report-card">';
    html += '<div class="report-card-label">' + t('analysis_avg_daily') + '</div>';
    html += '<div class="report-card-value">' + formatMoney(stats.avgDaily || 0) + '</div>';
    html += '</div>';

    // 最大支出类目
    html += '<div class="report-card">';
    html += '<div class="report-card-label">' + t('analysis_max_category') + '</div>';
    html += '<div class="report-card-value">' + (stats.maxCategory || '-') + '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  /**
   * 渲染消费排行榜
   * @param {Array} byCategory - [{name, amount, icon}]
   * @param {number} totalExpense - 总支出
   * @returns {string} HTML 字符串
   */
  renderRankingList(byCategory, totalExpense) {
    if (!byCategory || byCategory.length === 0) {
      return this.renderEmptyState('📊', t('analysis_no_data'));
    }

    // 按金额降序排列
    var sorted = byCategory.slice().sort(function (a, b) {
      return b.amount - a.amount;
    });

    var html = '<div class="ranking-list">';

    for (var i = 0; i < sorted.length; i++) {
      var item = sorted[i];
      var pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
      var rankClass = i < 3 ? 'rank-top' : 'rank-normal';

      html += '<div class="ranking-item ' + rankClass + '">';
      html += '  <span class="ranking-num">' + (i + 1) + '</span>';
      html += '  <span class="ranking-icon">' + getIcon(item.icon || 'other') + '</span>';
      html += '  <span class="ranking-name">' + item.name + '</span>';
      html += '  <span class="ranking-amount">' + formatMoney(item.amount) + '</span>';
      html += '</div>';
      html += '<div class="ranking-bar">';
      html += '  <div class="ranking-fill" style="width:' + pct + '%"></div>';
      html += '  <span class="ranking-pct">' + pct + '%</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /**
   * 渲染消费建议
   * @param {Object} report - {stats, byCategory, totalExpense}
   * @returns {string} HTML 字符串
   */
  renderAdvice(report) {
    if (!report) {
      return '';
    }

    var adviceList = [];
    var stats = report.stats || {};
    var byCategory = report.byCategory || [];
    var totalExpense = report.totalExpense || 0;
    var totalIncome = report.totalIncome || 0;
    var avgDaily = stats.avgDaily || 0;
    var balance = totalIncome - totalExpense;

    // 按金额降序排列分类
    var sorted = byCategory.slice().sort(function (a, b) {
      return b.amount - a.amount;
    });

    // 建议逻辑：餐饮占比 > 30%
    if (sorted.length > 0 && totalExpense > 0) {
      var foodItem = null;
      for (var i = 0; i < sorted.length; i++) {
        var name = (sorted[i].name || '').toLowerCase();
        if (name.indexOf('food') >= 0 || name.indexOf('餐饮') >= 0) {
          foodItem = sorted[i];
          break;
        }
      }
      if (foodItem) {
        var foodPct = Math.round((foodItem.amount / totalExpense) * 100);
        if (foodPct > 30) {
          adviceList.push({
            icon: '🍜',
            text: I18N.currentLang === 'zh'
              ? '餐饮消费占比' + foodPct + '%，建议适当控制外出就餐频次'
              : 'Food spending is ' + foodPct + '% of total, consider reducing dining out'
          });
        }
      }

      // 最高支出类目超过 40%
      var topItem = sorted[0];
      var topPct = Math.round((topItem.amount / totalExpense) * 100);
      if (topPct > 40) {
        var isFoodAdvice = false;
        for (var a = 0; a < adviceList.length; a++) {
          if (adviceList[a].text.indexOf(topItem.name) >= 0 || adviceList[a].text.indexOf('food') >= 0 || adviceList[a].text.indexOf('餐饮') >= 0) {
            if (topItem.name.indexOf('food') >= 0 || topItem.name.indexOf('餐饮') >= 0) {
              isFoodAdvice = true;
            }
          }
        }
        if (!isFoodAdvice) {
          adviceList.push({
            icon: '⚠️',
            text: I18N.currentLang === 'zh'
              ? topItem.name + '类目支出' + formatMoney(topItem.amount) + '，占比' + topPct + '%，建议关注'
              : topItem.name + ' spending is ' + formatMoney(topItem.amount) + ' (' + topPct + '%), pay attention'
          });
        }
      }

      // 检查是否有某类目异常高（超过日均的7倍以上）
      if (sorted.length >= 2) {
        var secondItem = sorted[1];
        var ratio = topItem.amount / (secondItem.amount || 1);
        if (ratio > 5 && topItem.amount > avgDaily * 7) {
          adviceList.push({
            icon: '🔍',
            text: I18N.currentLang === 'zh'
              ? topItem.name + '支出显著高于其他类目，建议检查是否有异常消费'
              : topItem.name + ' spending is significantly higher than other categories, check for anomalies'
          });
        }
      }
    }

    // 收支平衡建议
    if (balance > 0) {
      var saveRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
      adviceList.push({
        icon: '✅',
        text: I18N.currentLang === 'zh'
          ? '本月结余' + formatMoney(balance) + '，储蓄率' + saveRate + '%，继续保持！'
          : 'Monthly surplus is ' + formatMoney(balance) + ', savings rate ' + saveRate + '%, keep it up!'
      });
    } else if (balance < 0 && totalIncome > 0) {
      adviceList.push({
        icon: '📉',
        text: I18N.currentLang === 'zh'
          ? '本月支出超出收入' + formatMoney(Math.abs(balance)) + '，建议控制消费节奏'
          : 'Spending exceeded income by ' + formatMoney(Math.abs(balance)) + ', consider cutting expenses'
      });
    } else if (totalIncome === 0 && totalExpense > 0) {
      adviceList.push({
        icon: '💡',
        text: I18N.currentLang === 'zh'
          ? '本月暂无收入记录，请注意收支平衡'
          : 'No income recorded this period, keep an eye on your balance'
      });
    }

    // 日均支出建议
    if (avgDaily > 0 && stats.prevAvgDaily && stats.prevAvgDaily > 0) {
      var growthRate = Math.round(((avgDaily - stats.prevAvgDaily) / stats.prevAvgDaily) * 100);
      if (growthRate > 20) {
        adviceList.push({
          icon: '📈',
          text: I18N.currentLang === 'zh'
            ? '日均支出较上期增长' + growthRate + '%，注意消费节奏'
            : 'Daily average spending increased ' + growthRate + '% compared to last period'
        });
      } else if (growthRate < -20) {
        adviceList.push({
          icon: '🎉',
          text: I18N.currentLang === 'zh'
            ? '日均支出较上期减少' + Math.abs(growthRate) + '%，消费控制得当！'
            : 'Daily average spending decreased ' + Math.abs(growthRate) + '% compared to last period'
        });
      }
    }

    // 如果没有生成任何建议，给一个通用正面反馈
    if (adviceList.length === 0) {
      adviceList.push({
        icon: '👍',
        text: I18N.currentLang === 'zh'
          ? '本月收支状况良好，继续保持！'
          : 'Good financial status this period, keep it up!'
      });
    }

    // 限制最多5条
    if (adviceList.length > 5) {
      adviceList = adviceList.slice(0, 5);
    }

    // 渲染 HTML
    var html = '<div class="advice-section">';
    html += '<div class="section-title">' + t('analysis_advice') + '</div>';

    for (var j = 0; j < adviceList.length; j++) {
      var advice = adviceList[j];
      html += '<div class="advice-card">';
      html += '<span class="advice-icon">' + advice.icon + '</span>';
      html += '<span class="advice-text">' + advice.text + '</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ==================== 设置页面组件 ====================

  /**
   * 渲染设置页面
   * @param {Object} settings - {lang, lockEnabled, version}
   * @returns {string} HTML 字符串
   */
  renderSettingsPage(settings) {
    var lang = settings.lang || 'zh';
    var lockEnabled = settings.lockEnabled || false;
    var version = settings.version || 'v1.0.0';
    var langDisplay = lang === 'zh' ? '中文' : 'English';

    var html = '<div class="settings-page">';

    // 组1: 通用
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + t('settings_title') + '</div>';

    // 语言
    html += '<div class="settings-item" onclick="App.toggleLanguage()">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">🌐</span>';
    html += '<span class="settings-item-label">' + t('settings_language') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<span class="settings-item-value">' + langDisplay + '</span>';
    html += '<span class="settings-item-arrow">›</span>';
    html += '</div>';
    html += '</div>';

    // 应用锁
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">🔒</span>';
    html += '<span class="settings-item-label">' + t('settings_lock') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<label class="toggle-switch">';
    html += '<input type="checkbox" ' + (lockEnabled ? 'checked' : '') + ' onchange="App.toggleLock(this.checked)">';
    html += '<span class="toggle-slider"></span>';
    html += '</label>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    // 组2: 数据管理
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + t('settings_data') + '</div>';

    // 导出数据
    html += '<div class="settings-item" onclick="App.exportData()">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">📤</span>';
    html += '<span class="settings-item-label">' + t('settings_export') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<span class="settings-item-arrow">›</span>';
    html += '</div>';
    html += '</div>';

    // 导入数据
    html += '<div class="settings-item" onclick="App.importData()">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">📥</span>';
    html += '<span class="settings-item-label">' + t('settings_import') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<span class="settings-item-arrow">›</span>';
    html += '</div>';
    html += '</div>';

    // 清除数据（红色）
    html += '<div class="settings-item settings-item-danger" onclick="App.clearData()">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">🗑️</span>';
    html += '<span class="settings-item-label">' + t('settings_clear') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<span class="settings-item-arrow">›</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    // 组3: 关于
    html += '<div class="settings-group">';
    html += '<div class="settings-group-title">' + t('settings_about') + '</div>';

    // 版本
    html += '<div class="settings-item">';
    html += '<div class="settings-item-left">';
    html += '<span class="settings-item-icon">ℹ️</span>';
    html += '<span class="settings-item-label">' + t('settings_version') + '</span>';
    html += '</div>';
    html += '<div class="settings-item-right">';
    html += '<span class="settings-item-value">' + version + '</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    html += '</div>';
    return html;
  },

  // ==================== 通用组件 ====================

  /**
   * Toast 消息提示
   * @param {string} message - 消息文本
   * @param {string} type - 'success'(绿) | 'error'(红) | 'warning'(橙)
   */
  showToast(message, type) {
    type = type || 'success';

    // 移除已有的 toast
    var existing = document.querySelector('.toast');
    if (existing) {
      existing.remove();
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    requestAnimationFrame(function () {
      toast.classList.add('toast-show');
    });

    // 2 秒后自动消失
    setTimeout(function () {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  },

  /**
   * 确认对话框
   * @param {string} message - 提示消息
   * @param {Function} onConfirm - 确认回调
   */
  showConfirm(message, onConfirm) {
    var html = '<div class="modal-overlay" onclick="Components.closeModal()">';
    html += '<div class="confirm-dialog" onclick="event.stopPropagation()">';
    html += '<div class="confirm-message">' + message + '</div>';
    html += '<div class="confirm-actions">';
    html += '<button class="btn-cancel" onclick="Components.closeModal()">' + t('common_cancel') + '</button>';
    html += '<button class="btn-confirm" id="confirm-ok-btn">' + t('common_confirm') + '</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // 注入到 body
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var modal = wrapper.firstChild;
    document.body.appendChild(modal);

    // 绑定确认按钮事件
    var confirmBtn = document.getElementById('confirm-ok-btn');
    if (confirmBtn && typeof onConfirm === 'function') {
      confirmBtn.onclick = function () {
        Components.closeModal();
        onConfirm();
      };
    }
  },

  /**
   * 模态弹窗（通用）
   * @param {string} contentHtml - 弹窗内容 HTML
   */
  showModal(contentHtml) {
    var html = '<div class="modal-overlay" onclick="Components.closeModal()">';
    html += '<div class="modal-content" onclick="event.stopPropagation()">';
    html += '<button class="modal-close" onclick="Components.closeModal()">&times;</button>';
    html += contentHtml;
    html += '</div>';
    html += '</div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var modal = wrapper.firstChild;
    document.body.appendChild(modal);

    // 添加显示动画
    requestAnimationFrame(function () {
      modal.classList.add('modal-show');
    });
  },

  /**
   * 关闭模态弹窗
   */
  closeModal() {
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < overlays.length; i++) {
      overlays[i].classList.add('modal-hide');
      (function (overlay) {
        setTimeout(function () {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      })(overlays[i]);
    }
  },

  /**
   * 渲染空状态
   * @param {string} icon - emoji 图标
   * @param {string} text - 提示文字
   * @returns {string} HTML 字符串
   */
  renderEmptyState(icon, text) {
    var html = '<div class="empty-state">';
    html += '<div class="empty-icon" style="font-size:48px;">' + icon + '</div>';
    html += '<div class="empty-text" style="color:#999;font-size:14px;">' + text + '</div>';
    html += '</div>';
    return html;
  },

  // ==================== 快速记账组件 ====================

  /**
   * 渲染首页快速记账浮动按钮
   * @returns {string} HTML 字符串
   */
  renderQuickRecordButton() {
    return '<button class="quick-record-btn" onclick="App.openQuickRecord()" aria-label="快速记账">+</button>';
  },

  /**
   * 渲染快速记账数字键盘
   * @returns {string} HTML 字符串
   */
  renderQuickNumpad() {
    var keys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];
    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var actionClass = (key === '⌫') ? ' action' : '';
      html += '<button class="quick-num-btn' + actionClass + '" onclick="App.pressQuickKey(\'' + key + '\')">' + key + '</button>';
    }
    return html;
  },

  /**
   * 渲染快速记账分类列表
   * @param {Array} categories - 分类列表
   * @param {number} selectedId - 当前选中的分类ID
   * @returns {string} HTML 字符串
   */
  renderQuickCategories(categories, selectedId) {
    var html = '';
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var selectedClass = (cat.id === selectedId) ? ' selected' : '';
      html += '<div class="quick-cat-item' + selectedClass + '" data-id="' + cat.id + '" onclick="App.selectQuickCategory(' + cat.id + ')">';
      html += '<div class="cat-icon-wrap">' + getIcon(cat.icon) + '</div>';
      html += '<div class="cat-name">' + cat.name + '</div>';
      html += '</div>';
    }
    return html;
  }
};
