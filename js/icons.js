/**
 * icons.js - SVG 图标库
 * 所有图标采用统一风格：24x24视图、stroke-width=1.8、圆角端点
 * 颜色继承父元素 currentColor
 */

const ICONS = {};

// ==================== 账户图标 ====================

// 现金 - 纸币
ICONS.cash = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="5" width="20" height="14" rx="2"/>
  <line x1="2" y1="10" x2="22" y2="10"/>
  <text x="12" y="18" text-anchor="middle" fill="currentColor" font-size="11" font-weight="700">¥</text>
</svg>`;

// 银行卡 - 芯片卡
ICONS.bank = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="4" width="20" height="16" rx="2"/>
  <line x1="2" y1="10" x2="22" y2="10"/>
  <rect x="4" y="12" width="6" height="2" rx="1"/>
  <rect x="12" y="12" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.3"/>
</svg>`;

// 支付宝 - 支付盾牌
ICONS.alipay = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z"/>
  <path d="M8 12l3 3 5-5"/>
  <text x="14" y="16" text-anchor="middle" fill="currentColor" font-size="6" font-weight="700">支</text>
</svg>`;

// 微信 - 对话气泡
ICONS.wechat = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 14c-3.3 0-6-2.2-6-5s2.7-5 6-5h8c3.3 0 6 2.2 6 5s-2.7 5-6 5h-2l-3 3v-3z"/>
  <circle cx="8" cy="9" r="1" fill="currentColor"/>
  <circle cx="12" cy="9" r="1" fill="currentColor"/>
  <circle cx="16" cy="9" r="1" fill="currentColor"/>
</svg>`;

// ==================== 支出分类图标 ====================

// 餐饮 - 碗筷
ICONS.food = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2"/>
  <path d="M6 12v10"/>
  <path d="M18 2v18"/>
  <path d="M14 2v3a4 4 0 0 0 4 4"/>
</svg>`;

// 交通 - 汽车
ICONS.transport = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4l2.5-5A2 2 0 0 1 7.5 5h9a2 2 0 0 1 2 2l2.5 5v4a2 2 0 0 1-2 2"/>
  <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
  <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
  <line x1="8" y1="5" x2="16" y2="5"/>
</svg>`;

// 购物 - 购物袋
ICONS.shopping = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// 住房 - 房子
ICONS.housing = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
  <rect x="11" y="16" width="2" height="6" fill="currentColor" opacity="0.2"/>
</svg>`;

// 娱乐 - 游戏手柄
ICONS.entertainment = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="6" width="20" height="12" rx="2"/>
  <path d="M6 12h4M8 10v4"/>
  <circle cx="16" cy="10" r="1.2" fill="currentColor"/>
  <circle cx="18" cy="12" r="1.2" fill="currentColor"/>
  <circle cx="16" cy="14" r="1.2" fill="currentColor"/>
</svg>`;

// 医院 - 十字
ICONS.hospital = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="3"/>
  <line x1="12" y1="8" x2="12" y2="16"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
  <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.2" rx="0.5"/>
</svg>`;

// 教育 - 毕业帽
ICONS.education = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  <rect x="10" y="15" width="4" height="2" fill="currentColor" opacity="0.2"/>
</svg>`;

// 通讯 - 手机
ICONS.communication = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2" width="14" height="20" rx="2"/>
  <line x1="12" y1="18" x2="12" y2="18"/>
  <line x1="8" y1="6" x2="16" y2="6"/>
  <circle cx="12" cy="17" r="1" fill="currentColor"/>
</svg>`;

// 日用 - 盒子
ICONS.daily = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  <line x1="12" y1="22.08" x2="12" y2="12"/>
  <rect x="9" y="16" width="6" height="2" fill="currentColor" opacity="0.2" rx="0.5"/>
</svg>`;

// ==================== 收入分类图标 ====================

// 工资 - 钱包+美元
ICONS.salary = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 9v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
  <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/>
  <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.2"/>
  <text x="12" y="14" text-anchor="middle" fill="currentColor" font-size="8" font-weight="700">$</text>
</svg>`;

// 奖金 - 钱袋
ICONS.bonus = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 10h16"/>
  <path d="M4 10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2"/>
  <path d="M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
  <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.2"/>
  <text x="12" y="14" text-anchor="middle" fill="currentColor" font-size="8" font-weight="700">$</text>
</svg>`;

// 投资 - 上升趋势
ICONS.investment = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <line x1="22" y1="22" x2="2" y2="22"/>
  <polyline points="18 8 12 14 8 10 2 16"/>
  <polyline points="22 4 18 8 14 4"/>
  <circle cx="18" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
</svg>`;

// 兼职 - 握手的简化
ICONS.parttime = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16.5 6.5l-2 2m-5 5l-2 2m-1-8l-2 2m5-5l-2 2"/>
  <path d="M20.5 9.5l-6 6c-1 1-2.5 1-3.5 0l-3-3c-1-1-1-2.5 0-3.5l6-6c1-1 2.5-1 3.5 0l3 3c1 1 1 2.5 0 3.5z"/>
  <path d="M8.5 16.5l-3 3"/>
  <path d="M16.5 8.5l3-3"/>
</svg>`;

// 其他 - 星星
ICONS.other = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.2"/>
</svg>`;

// ==================== 渲染函数 ====================

/**
 * 获取图标 SVG 字符串
 * @param {string} name - 图标键名
 * @param {string} [className] - 可选 CSS 类名
 * @returns {string} SVG HTML 字符串
 */
function getIcon(name, className) {
  var svg = ICONS[name] || ICONS.other;
  if (className) {
    svg = svg.replace('<svg', '<svg class="' + className + '"');
  }
  return svg;
}