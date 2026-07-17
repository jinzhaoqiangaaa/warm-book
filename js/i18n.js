/**
 * i18n.js - 国际化模块
 * 支持中文和英文切换，使用 localStorage 持久化语言设置
 */

const I18N = {
  currentLang: 'zh',

  zh: {
    // 导航
    nav_home: '首页',
    nav_record: '记账',
    nav_budget: '预算',
    nav_analysis: '分析',
    nav_settings: '设置',

    // 首页
    home_title: '暖记',
    home_month_expense: '本月支出',
    home_month_income: '本月收入',
    home_month_balance: '本月结余',
    home_recent: '最近记录',
    home_no_records: '暂无记录',
    home_empty: '开始记一笔吧',
    home_search: '搜索记录',
    home_filter_all: '全部',
    home_edit: '编辑',
    home_menu_delete: '删除记录',

    // 记账
    record_title: '记一笔',
    record_expense: '支出',
    record_income: '收入',
    record_amount: '金额',
    record_category: '分类',
    record_account: '账户',
    record_date: '日期',
    record_note: '备注',
    record_save: '保存',
    record_delete: '删除',
    record_edit: '编辑',
    record_confirm_delete: '确定删除这条记录吗？',
    record_today: '今天',

    // 分类
    cat_food: '餐饮',
    cat_transport: '交通',
    cat_shopping: '购物',
    cat_housing: '住房',
    cat_entertainment: '娱乐',
    cat_medical: '医疗',
    cat_education: '教育',
    cat_communication: '通讯',
    cat_daily: '日用',
    cat_other: '其他',
    cat_salary: '工资',
    cat_bonus: '奖金',
    cat_investment: '投资',
    cat_parttime: '兼职',

    // 预算
    budget_title: '预算管理',
    budget_month: '月预算',
    budget_set: '设置预算',
    budget_remaining: '剩余预算',
    budget_used: '已使用',
    budget_total: '总预算',
    budget_edit: '编辑预算',
    budget_overspent: '超支',
    budget_category: '分类预算',
    budget_alert: '预算提醒',
    budget_safe: '预算充足',
    budget_warning: '预算紧张',
    budget_no_budget: '未设置预算',

    // 分析
    analysis_title: '财务分析',
    analysis_week: '本周',
    analysis_month: '本月',
    analysis_year: '本年',
    analysis_expense: '支出分析',
    analysis_income: '收入分析',
    analysis_trend: '收支趋势',
    analysis_comparison: '同比分析',
    analysis_ranking: '消费排行',
    analysis_advice: '消费建议',
    analysis_no_data: '暂无数据',
    analysis_weekly_report: '周报',
    analysis_monthly_report: '月报',
    analysis_yearly_report: '年报',
    analysis_total_expense: '总支出',
    analysis_total_income: '总收入',
    analysis_avg_daily: '日均支出',
    analysis_max_category: '最大支出类目',

    // 设置
    settings_title: '设置',
    settings_language: '语言',
    settings_currency: '货币',
    settings_security: '安全设置',
    settings_lock: '应用锁',
    settings_data: '数据管理',
    settings_export: '导出数据',
    settings_import: '导入数据',
    settings_clear: '清除数据',
    settings_clear_confirm: '确定要清除所有数据吗？此操作不可撤销！',
    settings_about: '关于',
    settings_version: '版本',
    settings_backup: '数据备份',
    settings_restore: '数据恢复',

    // 通用
    common_confirm: '确定',
    common_cancel: '取消',
    common_save: '保存',
    common_delete: '删除',
    common_edit: '编辑',
    common_add: '添加',
    common_total: '总计',
    common_all: '全部',
    common_success: '操作成功',
    common_error: '操作失败',
    common_currency: '¥',
    common_month: '月',
    common_year: '年',
  },

  en: {
    // 导航
    nav_home: 'Home',
    nav_record: 'Record',
    nav_budget: 'Budget',
    nav_analysis: 'Analysis',
    nav_settings: 'Settings',

    // 首页
    home_title: 'WarmBook',
    home_month_expense: 'Monthly Expense',
    home_month_income: 'Monthly Income',
    home_month_balance: 'Monthly Balance',
    home_recent: 'Recent Records',
    home_no_records: 'No records yet',
    home_empty: 'Start recording',
    home_search: 'Search records',
    home_filter_all: 'All',
    home_edit: 'Edit',
    home_menu_delete: 'Delete Record',

    // 记账
    record_title: 'New Record',
    record_expense: 'Expense',
    record_income: 'Income',
    record_amount: 'Amount',
    record_category: 'Category',
    record_account: 'Account',
    record_date: 'Date',
    record_note: 'Note',
    record_save: 'Save',
    record_delete: 'Delete',
    record_edit: 'Edit',
    record_confirm_delete: 'Delete this record?',
    record_today: 'Today',

    // 分类
    cat_food: 'Food',
    cat_transport: 'Transport',
    cat_shopping: 'Shopping',
    cat_housing: 'Housing',
    cat_entertainment: 'Entertainment',
    cat_medical: 'Medical',
    cat_education: 'Education',
    cat_communication: 'Telecom',
    cat_daily: 'Daily',
    cat_other: 'Other',
    cat_salary: 'Salary',
    cat_bonus: 'Bonus',
    cat_investment: 'Investment',
    cat_parttime: 'Part-time',

    // 预算
    budget_title: 'Budget',
    budget_month: 'Monthly Budget',
    budget_set: 'Set Budget',
    budget_remaining: 'Remaining',
    budget_used: 'Used',
    budget_total: 'Total Budget',
    budget_edit: 'Edit Budget',
    budget_overspent: 'Overspent',
    budget_category: 'Category Budget',
    budget_alert: 'Budget Alert',
    budget_safe: 'Within Budget',
    budget_warning: 'Budget Tight',
    budget_no_budget: 'No Budget Set',

    // 分析
    analysis_title: 'Analysis',
    analysis_week: 'This Week',
    analysis_month: 'This Month',
    analysis_year: 'This Year',
    analysis_expense: 'Expense Analysis',
    analysis_income: 'Income Analysis',
    analysis_trend: 'Trend',
    analysis_comparison: 'YoY Comparison',
    analysis_ranking: 'Spending Rank',
    analysis_advice: 'Advice',
    analysis_no_data: 'No data',
    analysis_weekly_report: 'Weekly',
    analysis_monthly_report: 'Monthly',
    analysis_yearly_report: 'Yearly',
    analysis_total_expense: 'Total Expense',
    analysis_total_income: 'Total Income',
    analysis_avg_daily: 'Daily Average',
    analysis_max_category: 'Top Category',

    // 设置
    settings_title: 'Settings',
    settings_language: 'Language',
    settings_currency: 'Currency',
    settings_security: 'Security',
    settings_lock: 'App Lock',
    settings_data: 'Data',
    settings_export: 'Export Data',
    settings_import: 'Import Data',
    settings_clear: 'Clear Data',
    settings_clear_confirm: 'Clear all data? This cannot be undone!',
    settings_about: 'About',
    settings_version: 'Version',
    settings_backup: 'Backup',
    settings_restore: 'Restore',

    // 通用
    common_confirm: 'Confirm',
    common_cancel: 'Cancel',
    common_save: 'Save',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_add: 'Add',
    common_total: 'Total',
    common_all: 'All',
    common_success: 'Success',
    common_error: 'Error',
    common_currency: '$',
    common_month: 'Month',
    common_year: 'Year',
  },
};

// ==================== 国际化功能函数 ====================

/**
 * 获取翻译文本
 * @param {string} key - 翻译键名
 * @returns {string} 对应语言的文本，找不到则返回键名
 */
function t(key) {
  const lang = I18N.currentLang;
  const dict = I18N[lang];
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  // 回退到中文
  if (I18N.zh && I18N.zh[key] !== undefined) {
    return I18N.zh[key];
  }
  // 最终回退到键名本身
  return key;
}

/**
 * 切换语言并更新 localStorage
 * @param {string} lang - 语言代码 'zh' 或 'en'
 */
function switchLang(lang) {
  if (lang !== 'zh' && lang !== 'en') {
    console.warn('不支持的语言: ' + lang + '，默认使用中文');
    lang = 'zh';
  }
  I18N.currentLang = lang;
  try {
    localStorage.setItem('warmbook_lang', lang);
  } catch (e) {
    console.warn('无法保存语言偏好到 localStorage:', e);
  }
  console.log('[WarmBook] 语言已切换为: ' + (lang === 'zh' ? '中文' : 'English'));
}

/**
 * 从 localStorage 读取语言偏好并初始化
 */
function initI18n() {
  try {
    const savedLang = localStorage.getItem('warmbook_lang');
    if (savedLang === 'en' || savedLang === 'zh') {
      I18N.currentLang = savedLang;
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language || navigator.userLanguage || 'zh';
      if (browserLang.startsWith('en')) {
        I18N.currentLang = 'en';
      } else {
        I18N.currentLang = 'zh';
      }
      localStorage.setItem('warmbook_lang', I18N.currentLang);
    }
  } catch (e) {
    console.warn('无法读取 localStorage，使用默认语言:', e);
    I18N.currentLang = 'zh';
  }
  console.log('[WarmBook] 当前语言: ' + I18N.currentLang);
}

/**
 * 格式化金额（根据当前语言添加货币符号）
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额字符串，如 ¥1,234.56 或 $1,234.56
 */
function formatMoney(amount) {
  if (amount === undefined || amount === null) return '';
  const num = Number(amount);
  if (isNaN(num)) return '';

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (I18N.currentLang === 'zh') {
    return '¥' + formatted;
  } else {
    return '$' + formatted;
  }
}

/**
 * 格式化日期（根据当前语言使用不同格式）
 * 中文: X月X日（如 7月16日）
 * 英文: Mon DD（如 Jul 16）
 * @param {string} dateStr - 日期字符串，格式 YYYY-MM-DD
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  if (I18N.currentLang === 'zh') {
    return `${month}月${day}日`;
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day}`;
  }
}

/**
 * 获取本周日期范围（周一到周日）
 * @param {Date|string} date - 日期对象或日期字符串 YYYY-MM-DD
 * @returns {{start: string, end: string}} 返回周一起始和周日结束的 YYYY-MM-DD 字符串
 */
function getWeekRange(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  return {
    start: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
    end: `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`,
  };
}

/**
 * 获取月份名称（根据当前语言）
 * @param {number} month - 月份 (1-12)
 * @returns {string} 月份名称，如 "一月" 或 "January"
 */
function getMonthName(month) {
  if (month < 1 || month > 12) return '';

  const zhMonths = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ];

  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (I18N.currentLang === 'zh') {
    return zhMonths[month - 1];
  } else {
    return enMonths[month - 1];
  }
}

// ==================== 自动初始化 ====================
initI18n();
