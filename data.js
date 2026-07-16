/**
 * data.js - 基于 IndexedDB 的数据管理模块
 * 数据库名: WarmBookDB, 版本: 1
 * 包含4个对象仓库: transactions, accounts, budgets, categories
 */

// ==================== 全局常量 ====================
const DB_NAME = 'WarmBookDB';
const DB_VERSION = 1;
const STORES = ['transactions', 'accounts', 'budgets', 'categories'];

// ==================== 默认数据 ====================

/** 默认账户数据 */
const DEFAULT_ACCOUNTS = [
  { id: 1, name: '现金', icon: '💵', type: 'cash', balance: 0 },
  { id: 2, name: '银行卡', icon: '💳', type: 'bank', balance: 0 },
  { id: 3, name: '支付宝', icon: '🔵', type: 'alipay', balance: 0 },
  { id: 4, name: '微信', icon: '🟢', type: 'wechat', balance: 0 },
  { id: 5, name: '其他', icon: '📱', type: 'other', balance: 0 },
];

/** 默认支出分类（10个常用） */
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 1, name: '餐饮', icon: '🥘', type: 'expense', sortOrder: 1 },
  { id: 2, name: '交通', icon: '🚗', type: 'expense', sortOrder: 2 },
  { id: 3, name: '购物', icon: '🛍️', type: 'expense', sortOrder: 3 },
  { id: 4, name: '住房', icon: '🏠', type: 'expense', sortOrder: 4 },
  { id: 5, name: '娱乐', icon: '🎮', type: 'expense', sortOrder: 5 },
  { id: 6, name: '医疗', icon: '💊', type: 'expense', sortOrder: 6 },
  { id: 7, name: '教育', icon: '📚', type: 'expense', sortOrder: 7 },
  { id: 8, name: '通讯', icon: '📱', type: 'expense', sortOrder: 8 },
  { id: 9, name: '日用', icon: '🧴', type: 'expense', sortOrder: 9 },
  { id: 10, name: '其他', icon: '📌', type: 'expense', sortOrder: 10 },
];

/** 默认收入分类（5个常用） */
const DEFAULT_INCOME_CATEGORIES = [
  { id: 11, name: '工资', icon: '💰', type: 'income', sortOrder: 1 },
  { id: 12, name: '奖金', icon: '🏆', type: 'income', sortOrder: 2 },
  { id: 13, name: '投资', icon: '📈', type: 'income', sortOrder: 3 },
  { id: 14, name: '兼职', icon: '💼', type: 'income', sortOrder: 4 },
  { id: 15, name: '其他', icon: '📌', type: 'income', sortOrder: 5 },
];

// ==================== 数据库操作 ====================

/**
 * 打开/创建 IndexedDB 数据库
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('打开数据库失败:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建 transactions 对象仓库
      if (!db.objectStoreNames.contains('transactions')) {
        const transStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transStore.createIndex('date', 'date', { unique: false });
        transStore.createIndex('accountId', 'accountId', { unique: false });
        transStore.createIndex('categoryId', 'categoryId', { unique: false });
        transStore.createIndex('type', 'type', { unique: false });
      }

      // 创建 accounts 对象仓库
      if (!db.objectStoreNames.contains('accounts')) {
        const accStore = db.createObjectStore('accounts', { keyPath: 'id' });
        accStore.createIndex('type', 'type', { unique: false });
      }

      // 创建 budgets 对象仓库
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id', autoIncrement: true });
        budgetStore.createIndex('month', 'month', { unique: false });
        budgetStore.createIndex('categoryId', 'categoryId', { unique: false });
      }

      // 创建 categories 对象仓库
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

/**
 * 执行通用数据库读写操作
 * @param {string} storeName - 对象仓库名
 * @param {'readonly'|'readwrite'} mode - 事务模式
 * @param {Function} callback - 操作回调，接收 store 对象
 * @returns {Promise<any>}
 */
async function withStore(storeName, mode, callback) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      if (result && result.onsuccess !== undefined) {
        result.onsuccess = (e) => resolve(e.target.result);
        result.onerror = (e) => reject(e.target.error);
      }
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error(`操作 ${storeName} 失败:`, error);
    throw error;
  }
}

/**
 * 执行跨多个对象仓库的事务
 * @param {string[]} storeNames - 对象仓库名数组
 * @param {'readonly'|'readwrite'} mode - 事务模式
 * @param {Function} callback - 操作回调，接收 tx 和 stores 对象
 * @returns {Promise<any>}
 */
async function withTransaction(storeNames, mode, callback) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const stores = {};
      storeNames.forEach(name => {
        stores[name] = tx.objectStore(name);
      });
      callback(tx, stores, resolve, reject);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('事务操作失败:', error);
    throw error;
  }
}

// ==================== 生成工具函数 ====================

/**
 * 生成唯一ID
 * @returns {number}
 */
function generateId() {
  return Date.now();
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function toDateStr(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当月 YYYY-MM 格式
 * @param {Date} date
 * @returns {string}
 */
function toMonthStr(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 获取指定月份的最后一天日期
 * @param {string} month - 格式 YYYY-MM
 * @returns {string} 格式 YYYY-MM-DD
 */
function getLastDayOfMonth(month) {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

// ==================== 事务 CRUD 函数 ====================

/**
 * 添加交易记录，同时更新对应账户余额
 * @param {Object} data - 交易数据
 * @returns {Promise<Object>} 创建的交易记录
 */
async function addTransaction(data) {
  try {
    return await withTransaction(['transactions', 'accounts'], 'readwrite', (tx, stores, resolve, reject) => {
      const getAccReq = stores.accounts.get(Number(data.accountId));
      getAccReq.onerror = () => reject(getAccReq.error);

      getAccReq.onsuccess = () => {
        const account = getAccReq.result;
        if (!account) {
          reject(new Error('账户不存在: ' + data.accountId));
          return;
        }

        // 更新账户余额
        if (data.type === 'income') {
          account.balance += data.amount;
        } else {
          account.balance -= data.amount;
        }
        stores.accounts.put(account);

        // 创建交易记录
        const transaction = {
          accountId: Number(data.accountId),
          categoryId: Number(data.categoryId),
          type: data.type,
          amount: data.amount,
          date: data.date || toDateStr(),
          note: data.note || '',
          createdAt: new Date().toISOString(),
        };

        const addReq = stores.transactions.add(transaction);
        addReq.onsuccess = () => resolve({ ...transaction, id: addReq.result });
        addReq.onerror = () => reject(addReq.error);
      };
    });
  } catch (error) {
    console.error('添加交易记录失败:', error);
    throw error;
  }
}

/**
 * 获取交易记录列表（支持筛选和排序）
 * @param {Object} params - 查询参数
 * @param {string} [params.type] - 类型 income/expense
 * @param {string} [params.startDate] - 开始日期
 * @param {string} [params.endDate] - 结束日期
 * @param {number} [params.accountId] - 账户ID
 * @param {number} [params.categoryId] - 分类ID
 * @param {number} [params.limit] - 限制条数
 * @returns {Promise<Object[]>}
 */
async function getTransactions(params = {}) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];

        // 按类型筛选
        if (params.type) {
          results = results.filter(t => t.type === params.type);
        }
        // 按账户筛选
        if (params.accountId !== undefined) {
          results = results.filter(t => t.accountId === Number(params.accountId));
        }
        // 按分类筛选
        if (params.categoryId !== undefined) {
          results = results.filter(t => t.categoryId === Number(params.categoryId));
        }
        // 按日期范围筛选
        if (params.startDate) {
          results = results.filter(t => t.date >= params.startDate);
        }
        if (params.endDate) {
          results = results.filter(t => t.date <= params.endDate);
        }

        // 按日期降序、创建时间降序排列
        results.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        // 限制条数
        if (params.limit) {
          results = results.slice(0, params.limit);
        }

        resolve(results);
      };

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('获取交易记录失败:', error);
    throw error;
  }
}

/**
 * 更新交易记录，同步更新账户余额
 * @param {number} id - 交易ID
 * @param {Object} data - 更新的数据
 * @returns {Promise<void>}
 */
async function updateTransaction(id, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts'], 'readwrite');
      const transStore = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');

      const getReq = transStore.get(id);
      getReq.onerror = () => reject(getReq.error);

      getReq.onsuccess = () => {
        const old = getReq.result;
        if (!old) {
          reject(new Error('交易记录不存在: ' + id));
          return;
        }

        // 回滚旧账户余额
        const getOldAccReq = accStore.get(old.accountId);
        getOldAccReq.onerror = () => reject(getOldAccReq.error);

        getOldAccReq.onsuccess = () => {
          const oldAccount = getOldAccReq.result;
          if (oldAccount) {
            if (old.type === 'income') {
              oldAccount.balance -= old.amount;
            } else {
              oldAccount.balance += old.amount;
            }
            accStore.put(oldAccount);
          }

          // 应用新账户余额
          const newAccountId = data.accountId !== undefined ? Number(data.accountId) : old.accountId;
          const getNewAccReq = accStore.get(newAccountId);
          getNewAccReq.onerror = () => reject(getNewAccReq.error);

          getNewAccReq.onsuccess = () => {
            const newAccount = getNewAccReq.result;
            if (!newAccount) {
              reject(new Error('账户不存在: ' + newAccountId));
              return;
            }

            const newAmount = data.amount !== undefined ? data.amount : old.amount;
            const newType = data.type || old.type;

            if (newType === 'income') {
              newAccount.balance += newAmount;
            } else {
              newAccount.balance -= newAmount;
            }
            accStore.put(newAccount);

            // 更新交易记录
            const updated = {
              ...old,
              accountId: newAccountId,
              categoryId: data.categoryId !== undefined ? Number(data.categoryId) : old.categoryId,
              type: newType,
              amount: newAmount,
              date: data.date || old.date,
              note: data.note !== undefined ? data.note : old.note,
              id: id,
            };

            const putReq = transStore.put(updated);
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
          };
        };
      };

      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('更新交易记录失败:', error);
    throw error;
  }
}

/**
 * 删除交易记录，同步回滚账户余额
 * @param {number} id - 交易ID
 * @returns {Promise<void>}
 */
async function deleteTransaction(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts'], 'readwrite');
      const transStore = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');

      const getReq = transStore.get(id);
      getReq.onerror = () => reject(getReq.error);

      getReq.onsuccess = () => {
        const trans = getReq.result;
        if (!trans) {
          reject(new Error('交易记录不存在: ' + id));
          return;
        }

        // 回滚账户余额
        const getAccReq = accStore.get(trans.accountId);
        getAccReq.onerror = () => reject(getAccReq.error);

        getAccReq.onsuccess = () => {
          const account = getAccReq.result;
          if (account) {
            if (trans.type === 'income') {
              account.balance -= trans.amount;
            } else {
              account.balance += trans.amount;
            }
            accStore.put(account);
          }

          const delReq = transStore.delete(id);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        };
      };

      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('删除交易记录失败:', error);
    throw error;
  }
}

/**
 * 按日期范围获取交易记录
 * @param {string} startDate - 开始日期 YYYY-MM-DD
 * @param {string} endDate - 结束日期 YYYY-MM-DD
 * @param {Object} [options] - 额外筛选选项
 * @param {string} [options.type] - 类型 income/expense
 * @param {number} [options.accountId] - 账户ID
 * @returns {Promise<Object[]>}
 */
async function getTransactionsByDateRange(startDate, endDate, options = {}) {
  try {
    const params = { startDate, endDate, ...options };
    return await getTransactions(params);
  } catch (error) {
    console.error('按日期范围获取交易记录失败:', error);
    throw error;
  }
}

// ==================== 账户 CRUD 函数 ====================

/**
 * 添加账户
 * @param {Object} data - 账户数据
 * @returns {Promise<Object>} 创建的账户
 */
async function addAccount(data) {
  try {
    return await withStore('accounts', 'readwrite', (store) => {
      const account = {
        id: data.id !== undefined ? Number(data.id) : generateId(),
        name: data.name,
        icon: data.icon || '💰',
        type: data.type || 'other',
        balance: data.balance || 0,
      };
      const req = store.add(account);
      // 覆盖默认的 onsuccess 以返回完整对象
      req._customResolve = account;
      return req;
    });
  } catch (error) {
    console.error('添加账户失败:', error);
    throw error;
  }
}

/**
 * 获取所有账户
 * @returns {Promise<Object[]>}
 */
async function getAccounts() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('获取账户列表失败:', error);
    throw error;
  }
}

/**
 * 更新账户
 * @param {number} id - 账户ID
 * @param {Object} data - 更新的数据
 * @returns {Promise<void>}
 */
async function updateAccount(id, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');

      const getReq = store.get(Number(id));
      getReq.onerror = () => reject(getReq.error);

      getReq.onsuccess = () => {
        const account = getReq.result;
        if (!account) {
          reject(new Error('账户不存在: ' + id));
          return;
        }

        const updated = { ...account, ...data, id: Number(id) };
        if (data.balance !== undefined) updated.balance = data.balance;
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('更新账户失败:', error);
    throw error;
  }
}

/**
 * 删除账户
 * @param {number} id - 账户ID
 * @returns {Promise<void>}
 */
async function deleteAccount(id) {
  try {
    await withStore('accounts', 'readwrite', (store) => store.delete(Number(id)));
  } catch (error) {
    console.error('删除账户失败:', error);
    throw error;
  }
}

/**
 * 获取账户余额
 * @param {number} id - 账户ID
 * @returns {Promise<number>} 账户余额
 */
async function getAccountBalance(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const request = store.get(Number(id));

      request.onsuccess = () => {
        const account = request.result;
        resolve(account ? account.balance : 0);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('获取账户余额失败:', error);
    throw error;
  }
}

// ==================== 预算 CRUD 函数 ====================

/**
 * 添加预算
 * @param {Object} data - 预算数据
 * @param {string} data.month - 月份 YYYY-MM
 * @param {number} data.categoryId - 分类ID
 * @param {number} data.amount - 预算金额
 * @returns {Promise<Object>} 创建的预算
 */
async function addBudget(data) {
  try {
    return await withStore('budgets', 'readwrite', (store) => {
      const budget = {
        month: data.month,
        categoryId: Number(data.categoryId),
        amount: data.amount,
        createdAt: new Date().toISOString(),
      };
      const req = store.add(budget);
      return req;
    });
  } catch (error) {
    console.error('添加预算失败:', error);
    throw error;
  }
}

/**
 * 获取预算列表
 * @param {string} [month] - 月份 YYYY-MM，可选筛选
 * @returns {Promise<Object[]>}
 */
async function getBudgets(month) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');

      let request;
      if (month) {
        const index = store.index('month');
        request = index.getAll(month);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('获取预算列表失败:', error);
    throw error;
  }
}

/**
 * 更新预算
 * @param {number} id - 预算ID
 * @param {Object} data - 更新的数据
 * @returns {Promise<void>}
 */
async function updateBudget(id, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readwrite');
      const store = tx.objectStore('budgets');

      const getReq = store.get(Number(id));
      getReq.onerror = () => reject(getReq.error);

      getReq.onsuccess = () => {
        const budget = getReq.result;
        if (!budget) {
          reject(new Error('预算不存在: ' + id));
          return;
        }

        const updated = { ...budget, ...data, id: Number(id) };
        if (data.amount !== undefined) updated.amount = data.amount;
        if (data.month) updated.month = data.month;
        if (data.categoryId !== undefined) updated.categoryId = Number(data.categoryId);

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('更新预算失败:', error);
    throw error;
  }
}

/**
 * 删除预算
 * @param {number} id - 预算ID
 * @returns {Promise<void>}
 */
async function deleteBudget(id) {
  try {
    await withStore('budgets', 'readwrite', (store) => store.delete(Number(id)));
  } catch (error) {
    console.error('删除预算失败:', error);
    throw error;
  }
}

/**
 * 获取指定月份的预算
 * @param {string} month - 月份 YYYY-MM
 * @returns {Promise<Object[]>}
 */
async function getBudgetByMonth(month) {
  try {
    return await getBudgets(month);
  } catch (error) {
    console.error('获取月份预算失败:', error);
    throw error;
  }
}

// ==================== 分类 CRUD 函数 ====================

/**
 * 获取所有分类
 * @param {string} [type] - 类型 income/expense，可选筛选
 * @returns {Promise<Object[]>}
 */
async function getCategories(type) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');

      let request;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = request.result || [];
        // 按 sortOrder 排序
        results.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    throw error;
  }
}

/**
 * 添加分类
 * @param {Object} data - 分类数据
 * @returns {Promise<Object>} 创建的分类
 */
async function addCategory(data) {
  try {
    return await withStore('categories', 'readwrite', (store) => {
      const category = {
        id: data.id !== undefined ? Number(data.id) : generateId(),
        name: data.name,
        icon: data.icon || '📌',
        type: data.type || 'expense',
        sortOrder: data.sortOrder || 99,
      };
      const req = store.add(category);
      return req;
    });
  } catch (error) {
    console.error('添加分类失败:', error);
    throw error;
  }
}

/**
 * 更新分类
 * @param {number} id - 分类ID
 * @param {Object} data - 更新的数据
 * @returns {Promise<void>}
 */
async function updateCategory(id, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');

      const getReq = store.get(Number(id));
      getReq.onerror = () => reject(getReq.error);

      getReq.onsuccess = () => {
        const category = getReq.result;
        if (!category) {
          reject(new Error('分类不存在: ' + id));
          return;
        }

        const updated = { ...category, ...data, id: Number(id) };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      tx.oncomplete = () => db.close();
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    throw error;
  }
}

/**
 * 删除分类
 * @param {number} id - 分类ID
 * @returns {Promise<void>}
 */
async function deleteCategory(id) {
  try {
    await withStore('categories', 'readwrite', (store) => store.delete(Number(id)));
  } catch (error) {
    console.error('删除分类失败:', error);
    throw error;
  }
}

// ==================== 统计函数 ====================

/**
 * 获取月度统计
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Promise<{income: number, expense: number, balance: number, byCategory: Object[]}>}
 */
async function getMonthlyStats(year, month) {
  try {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = `${monthStr}-01`;
    const endDate = getLastDayOfMonth(monthStr);

    const transactions = await getTransactionsByDateRange(startDate, endDate);

    let income = 0;
    let expense = 0;
    const byCategory = {};

    for (const trans of transactions) {
      if (trans.type === 'income') {
        income += trans.amount;
      } else {
        expense += trans.amount;
      }

      if (!byCategory[trans.categoryId]) {
        byCategory[trans.categoryId] = { categoryId: trans.categoryId, type: trans.type, amount: 0, count: 0 };
      }
      byCategory[trans.categoryId].amount += trans.amount;
      byCategory[trans.categoryId].count += 1;
    }

    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      byCategory: Object.values(byCategory).map(c => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
      })),
    };
  } catch (error) {
    console.error('获取月度统计失败:', error);
    throw error;
  }
}

/**
 * 获取本周日期范围
 * @param {Date|string} date - 日期
 * @returns {{start: string, end: string}} 周一到周日
 */
function getWeekRange(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDay(); // 0=周日
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: toDateStr(monday),
    end: toDateStr(sunday),
  };
}

/**
 * 获取周度统计
 * @param {Date|string} date - 周内任意日期
 * @returns {Promise<{income: number, expense: number, balance: number, dailyData: Object[], byCategory: Object[]}>}
 */
async function getWeeklyStats(date) {
  try {
    const { start, end } = getWeekRange(date);
    const transactions = await getTransactionsByDateRange(start, end);

    let income = 0;
    let expense = 0;
    const byCategory = {};
    const dailyData = {};

    for (const trans of transactions) {
      if (trans.type === 'income') {
        income += trans.amount;
      } else {
        expense += trans.amount;
      }

      // 分类汇总
      if (!byCategory[trans.categoryId]) {
        byCategory[trans.categoryId] = { categoryId: trans.categoryId, type: trans.type, amount: 0, count: 0 };
      }
      byCategory[trans.categoryId].amount += trans.amount;
      byCategory[trans.categoryId].count += 1;

      // 按日汇总
      if (!dailyData[trans.date]) {
        dailyData[trans.date] = { date: trans.date, income: 0, expense: 0 };
      }
      if (trans.type === 'income') {
        dailyData[trans.date].income += trans.amount;
      } else {
        dailyData[trans.date].expense += trans.amount;
      }
    }

    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      dailyData: Object.values(dailyData)
        .map(d => ({
          date: d.date,
          income: Math.round(d.income * 100) / 100,
          expense: Math.round(d.expense * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byCategory: Object.values(byCategory).map(c => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
      })),
    };
  } catch (error) {
    console.error('获取周度统计失败:', error);
    throw error;
  }
}

/**
 * 获取年度统计
 * @param {number} year - 年份
 * @returns {Promise<{income: number, expense: number, balance: number, monthlyData: Object[], byCategory: Object[]}>}
 */
async function getYearlyStats(year) {
  try {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const transactions = await getTransactionsByDateRange(startDate, endDate);

    let income = 0;
    let expense = 0;
    const byCategory = {};
    const monthlyData = {};

    // 初始化12个月
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      monthlyData[key] = { month: key, income: 0, expense: 0 };
    }

    for (const trans of transactions) {
      if (trans.type === 'income') {
        income += trans.amount;
      } else {
        expense += trans.amount;
      }

      // 分类汇总
      if (!byCategory[trans.categoryId]) {
        byCategory[trans.categoryId] = { categoryId: trans.categoryId, type: trans.type, amount: 0, count: 0 };
      }
      byCategory[trans.categoryId].amount += trans.amount;
      byCategory[trans.categoryId].count += 1;

      // 月度汇总
      const monthKey = trans.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        if (trans.type === 'income') {
          monthlyData[monthKey].income += trans.amount;
        } else {
          monthlyData[monthKey].expense += trans.amount;
        }
      }
    }

    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      monthlyData: Object.values(monthlyData).map(m => ({
        month: m.month,
        income: Math.round(m.income * 100) / 100,
        expense: Math.round(m.expense * 100) / 100,
      })),
      byCategory: Object.values(byCategory).map(c => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
      })),
    };
  } catch (error) {
    console.error('获取年度统计失败:', error);
    throw error;
  }
}

/**
 * 获取预算进度
 * @param {string} month - 月份 YYYY-MM
 * @returns {Promise<{budget: number, spent: number, remaining: number, percentage: number}>}
 */
async function getBudgetProgress(month) {
  try {
    const budgets = await getBudgets(month);
    const startDate = `${month}-01`;
    const endDate = getLastDayOfMonth(month);

    const transactions = await getTransactionsByDateRange(startDate, endDate, { type: 'expense' });

    // 计算总预算和总支出
    let budget = 0;
    for (const b of budgets) {
      budget += b.amount;
    }

    let spent = 0;
    for (const t of transactions) {
      spent += t.amount;
    }

    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

    return {
      budget: Math.round(budget * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentage,
    };
  } catch (error) {
    console.error('获取预算进度失败:', error);
    throw error;
  }
}

// ==================== 初始化函数 ====================

/**
 * 初始化应用数据 - 检查首次运行，插入默认账户和分类数据
 * @returns {Promise<void>}
 */
async function initAppData() {
  try {
    const db = await openDB();
    db.close();

    // 检查是否已有账户数据
    const accounts = await getAccounts();
    if (accounts.length === 0) {
      for (const account of DEFAULT_ACCOUNTS) {
        await addAccount(account);
      }
      console.log('[WarmBook] 默认账户已创建');
    }

    // 检查是否已有分类数据
    const categories = await getCategories();
    if (categories.length === 0) {
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      for (const category of allCategories) {
        await addCategory(category);
      }
      console.log('[WarmBook] 默认分类已创建');
    }

    console.log('[WarmBook] 数据初始化完成');
  } catch (error) {
    console.error('初始化应用数据失败:', error);
    throw error;
  }
}

// ==================== 导出/导入数据 ====================

/**
 * 导出所有数据为 JSON 字符串
 * @returns {Promise<string>} JSON 字符串
 */
async function exportAllData() {
  try {
    const transactions = await getTransactions();
    const accounts = await getAccounts();
    const budgets = await getBudgets();
    const categories = await getCategories();

    const data = {
      version: DB_VERSION,
      exportTime: new Date().toISOString(),
      transactions,
      accounts,
      budgets,
      categories,
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('导出数据失败:', error);
    throw error;
  }
}

/**
 * 从 JSON 字符串导入数据（清空后导入）
 * @param {string} jsonStr - JSON 字符串
 * @returns {Promise<void>}
 */
async function importAllData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    if (!data.transactions || !data.accounts || !data.categories) {
      throw new Error('数据格式无效，缺少必要字段');
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES, 'readwrite');
      const stores = {};
      STORES.forEach(name => {
        stores[name] = tx.objectStore(name);
      });

      // 清空所有存储
      STORES.forEach(name => {
        stores[name].clear();
      });

      // 导入账户数据
      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          stores.accounts.put(account);
        }
      }

      // 导入分类数据
      if (data.categories && Array.isArray(data.categories)) {
        for (const category of data.categories) {
          stores.categories.put(category);
        }
      }

      // 导入预算数据
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const budget of data.budgets) {
          stores.budgets.put(budget);
        }
      }

      // 导入交易记录
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const trans of data.transactions) {
          stores.transactions.put(trans);
        }
      }

      tx.oncomplete = () => {
        db.close();
        console.log('[WarmBook] 数据导入完成');
        resolve();
      };
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('导入数据失败:', error);
    throw error;
  }
}
