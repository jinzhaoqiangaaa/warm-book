/**
 * charts.js - 基于 Canvas 的图表绘制模块（不依赖外部库）
 * 用于财务分析页面的可视化图表
 * 包含: 饼图(环形图)、柱状图、折线图、预算进度图
 */

const Charts = {
  // 设备像素比适配
  dpr: window.devicePixelRatio || 1,

  // 颜色方案（暖色调）
  COLORS: [
    '#E8734A', '#F5A623', '#FF6B9D', '#8BC34A', '#00BCD4',
    '#9C27B0', '#795548', '#607D8B', '#E91E63', '#3F51B5',
    '#FF5722', '#CDDC39', '#009688', '#FFC107', '#673AB7'
  ],

  // ==================== 初始化Canvas高清适配 ====================

  /**
   * 初始化Canvas高清适配
   * @param {HTMLCanvasElement} canvas - canvas元素
   * @param {number} width - CSS显示宽度
   * @param {number} height - CSS显示高度
   * @returns {CanvasRenderingContext2D} 2D渲染上下文
   */
  initCanvas(canvas, width, height) {
    var dpr = this.dpr;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  },

  // ==================== 饼图（环形图） ====================

  /**
   * 绘制饼图（环形图）- 用于分类占比
   * @param {string} canvasId - canvas元素的id
   * @param {Array} data - [{name, value, color, icon}]
   * @param {Object} options - 配置项 {title, showLegend, showPercent}
   */
  drawPieChart(canvasId, data, options) {
    options = options || {};
    var showLegend = options.showLegend !== false;
    var showPercent = options.showPercent !== false;

    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // 获取父容器宽度，自适应
    var container = canvas.parentElement;
    var canvasWidth = Math.min(container ? container.clientWidth : 320, 400);
    var legendHeight = 0;
    if (showLegend && data && data.length > 0) {
      legendHeight = Math.ceil(data.length / 4) * 28 + 10;
    }
    var titleHeight = options.title ? 30 : 0;
    var canvasHeight = canvasWidth + legendHeight + titleHeight;

    var ctx = this.initCanvas(canvas, canvasWidth, canvasHeight);

    // 无数据时显示灰色空心圆 + "暂无数据"
    if (!data || data.length === 0) {
      var centerX = canvasWidth / 2;
      var centerY = (canvasHeight - legendHeight) / 2;
      var outerR = Math.min(canvasWidth, canvasHeight - legendHeight) * 0.3;
      var innerR = outerR * 0.65;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = '#EEEEEE';
      ctx.fill();
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('analysis_no_data'), centerX, centerY);
      return;
    }

    // 计算总值
    var total = 0;
    for (var i = 0; i < data.length; i++) {
      total += data[i].value || 0;
    }

    // 绘制标题
    if (options.title) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(options.title, canvasWidth / 2, 8);
    }

    // 环形图参数
    var chartAreaHeight = canvasHeight - legendHeight - titleHeight;
    var centerX = canvasWidth / 2;
    var centerY = titleHeight + chartAreaHeight / 2;
    var outerRadius = Math.min(canvasWidth, chartAreaHeight) * 0.3;
    var innerRadius = outerRadius * 0.65;
    var gapAngle = 2 * Math.PI / 180; // 2度间隔

    // 绘制扇区
    var startAngle = -Math.PI / 2; // 从顶部开始
    for (var j = 0; j < data.length; j++) {
      var item = data[j];
      var sliceAngle = (item.value / total) * (Math.PI * 2 - gapAngle * data.length);
      if (sliceAngle <= 0) continue;

      var color = item.color || this.COLORS[j % this.COLORS.length];

      // 绘制扇区
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 在扇区中间显示百分比文字（扇区足够大时）
      if (showPercent && (item.value / total) > 0.05) {
        var midAngle = startAngle + sliceAngle / 2;
        var textR = (outerRadius + innerRadius) / 2;
        var tx = centerX + Math.cos(midAngle) * textR;
        var ty = centerY + Math.sin(midAngle) * textR;
        var pct = Math.round((item.value / total) * 100);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pct + '%', tx, ty);
      }

      startAngle += sliceAngle + gapAngle;
    }

    // 中心显示总值
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatMoney(total), centerX, centerY - 8);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.fillText(t('common_total'), centerX, centerY + 12);

    // 绘制图例
    if (showLegend) {
      var legendStartY = canvasHeight - legendHeight + 8;
      var legendItemWidth = canvasWidth / 4;
      for (var k = 0; k < data.length; k++) {
        var legend = data[k];
        var col = k % 4;
        var row = Math.floor(k / 4);
        var lx = col * legendItemWidth + 12;
        var ly = legendStartY + row * 28;
        var lcolor = legend.color || this.COLORS[k % this.COLORS.length];

        // 色块
        ctx.fillStyle = lcolor;
        ctx.beginPath();
        ctx.arc(lx + 5, ly + 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // 图标（如有）
        var textStartX = lx + 14;
        if (legend.icon) {
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(legend.icon, textStartX, ly + 6);
          textStartX += 18;
        }

        // 名称
        var pctStr = '(' + Math.round((legend.value / total) * 100) + '%)';
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        var maxTextWidth = legendItemWidth - (textStartX - lx) - 5;
        var nameText = legend.name || '';
        // 如果名称太长，截断
        var nameWidth = ctx.measureText(nameText + pctStr).width;
        if (nameWidth > maxTextWidth) {
          nameText = nameText.substring(0, 4) + '..';
        }
        ctx.fillText(nameText + pctStr, textStartX, ly + 6);
      }
    }
  },

  // ==================== 柱状图 ====================

  /**
   * 绘制柱状图 - 用于每日/每月收支对比
   * @param {string} canvasId - canvas元素的id
   * @param {Object} data - {labels: [], datasets: [{name, values, color}]}
   * @param {Object} options - 配置项 {title, showValue}
   */
  drawBarChart(canvasId, data, options) {
    options = options || {};
    var showValue = options.showValue !== false;

    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var container = canvas.parentElement;
    var canvasWidth = Math.min(container ? container.clientWidth : 320, 500);
    var legendHeight = data && data.datasets && data.datasets.length > 1 ? 30 : 0;
    var titleHeight = options.title ? 30 : 0;
    var valueTopSpace = showValue ? 20 : 0;
    var canvasHeight = 260 + legendHeight + titleHeight;

    var ctx = this.initCanvas(canvas, canvasWidth, canvasHeight);

    if (!data || !data.labels || data.labels.length === 0) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('analysis_no_data'), canvasWidth / 2, canvasHeight / 2);
      return;
    }

    var labels = data.labels;
    var datasets = data.datasets || [];
    var chartLeft = 50;
    var chartRight = 20;
    var chartTop = titleHeight + 10;
    var chartBottom = 40;
    var chartWidth = canvasWidth - chartLeft - chartRight;
    var chartHeight = canvasHeight - chartTop - chartBottom - valueTopSpace - legendHeight;

    // 计算最大值
    var maxVal = 0;
    for (var d = 0; d < datasets.length; d++) {
      for (var v = 0; v < datasets[d].values.length; v++) {
        if (datasets[d].values[v] > maxVal) {
          maxVal = datasets[d].values[v];
        }
      }
    }
    // 留20%空间
    var yMax = maxVal * 1.2;
    if (yMax <= 0) yMax = 100;

    // 绘制标题
    if (options.title) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(options.title, canvasWidth / 2, 8);
    }

    // 绘制Y轴网格线（5条）
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 1;
    for (var gi = 0; gi <= 4; gi++) {
      var yVal = (yMax / 4) * gi;
      var y = chartTop + chartHeight - (chartHeight * gi / 4);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(canvasLeft + chartWidth, y);
      ctx.stroke();
      ctx.fillText(this._formatShortNum(yVal), chartLeft - 8, y);
    }

    // 绘制X轴标签
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var groupWidth = chartWidth / labels.length;
    var barCount = datasets.length;
    var groupPadding = groupWidth * 0.15;
    var barGap = 3;
    var barWidth = (groupWidth - groupPadding * 2 - barGap * (barCount - 1)) / barCount;
    if (barWidth < 8) barWidth = 8;

    for (var li = 0; li < labels.length; li++) {
      var groupX = chartLeft + li * groupWidth + groupPadding;

      // 绘制每组的柱子
      for (var di = 0; di < datasets.length; di++) {
        var ds = datasets[di];
        var val = ds.values[li] || 0;
        var barH = (val / yMax) * chartHeight;
        var bx = groupX + di * (barWidth + barGap);
        var by = chartTop + chartHeight - barH;

        // 圆角顶部矩形
        var radius = Math.min(4, barWidth / 2);
        this._drawRoundTopRect(ctx, bx, by, barWidth, barH, radius);
        ctx.fillStyle = ds.color || this.COLORS[di % this.COLORS.length];
        ctx.fill();

        // 显示数值
        if (showValue && val > 0) {
          ctx.font = '10px sans-serif';
          ctx.fillStyle = ds.color || '#333333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(this._formatShortNum(val), bx + barWidth / 2, by - 3);
        }
      }

      // X轴标签
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#999999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[li], chartLeft + li * groupWidth + groupWidth / 2, chartTop + chartHeight + 8);
    }

    // 底部图例
    if (datasets.length > 1) {
      var legendY = canvasHeight - legendHeight + 8;
      var legendTotalWidth = 0;
      var legendItems = [];
      for (var ldi = 0; ldi < datasets.length; ldi++) {
        legendItems.push({ name: datasets[ldi].name, color: datasets[ldi].color || this.COLORS[ldi % this.COLORS.length] });
        legendTotalWidth += ctx.measureText(datasets[ldi].name).width + 30;
      }
      var legendStartX = (canvasWidth - legendTotalWidth) / 2;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (var lii = 0; lii < legendItems.length; lii++) {
        var litem = legendItems[lii];
        ctx.fillStyle = litem.color;
        ctx.beginPath();
        ctx.arc(legendStartX + 6, legendY + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666666';
        ctx.fillText(litem.name, legendStartX + 16, legendY + 6);
        legendStartX += ctx.measureText(litem.name).width + 30;
      }
    }
  },

  // ==================== 折线图 ====================

  /**
   * 绘制折线图 - 用于收支趋势
   * @param {string} canvasId - canvas元素的id
   * @param {Object} data - {labels: [], datasets: [{name, values, color}]}
   * @param {Object} options - 配置项 {title, fill, showDots}
   */
  drawLineChart(canvasId, data, options) {
    options = options || {};
    var doFill = options.fill !== false;
    var showDots = options.showDots !== false;

    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var container = canvas.parentElement;
    var canvasWidth = Math.min(container ? container.clientWidth : 320, 500);
    var legendHeight = data && data.datasets && data.datasets.length > 1 ? 30 : 0;
    var titleHeight = options.title ? 30 : 0;
    var canvasHeight = 260 + legendHeight + titleHeight;

    var ctx = this.initCanvas(canvas, canvasWidth, canvasHeight);

    if (!data || !data.labels || data.labels.length === 0) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('analysis_no_data'), canvasWidth / 2, canvasHeight / 2);
      return;
    }

    var labels = data.labels;
    var datasets = data.datasets || [];
    var chartLeft = 50;
    var chartRight = 20;
    var chartTop = titleHeight + 10;
    var chartBottom = 40;
    var chartWidth = canvasWidth - chartLeft - chartRight;
    var chartHeight = canvasHeight - chartTop - chartBottom - legendHeight;

    // 计算最大值
    var maxVal = 0;
    for (var d = 0; d < datasets.length; d++) {
      for (var v = 0; v < datasets[d].values.length; v++) {
        if (datasets[d].values[v] > maxVal) {
          maxVal = datasets[d].values[v];
        }
      }
    }
    var yMax = maxVal * 1.2;
    if (yMax <= 0) yMax = 100;

    // 绘制标题
    if (options.title) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(options.title, canvasWidth / 2, 8);
    }

    // 绘制Y轴网格线（5条）
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 1;
    for (var gi = 0; gi <= 4; gi++) {
      var yVal = (yMax / 4) * gi;
      var y = chartTop + chartHeight - (chartHeight * gi / 4);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(canvasLeft + chartWidth, y);
      ctx.stroke();
      ctx.fillText(this._formatShortNum(yVal), chartLeft - 8, y);
    }

    // X轴标签
    var pointSpacing = labels.length > 1 ? chartWidth / (labels.length - 1) : chartWidth;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var li = 0; li < labels.length; li++) {
      var px = labels.length > 1 ? chartLeft + li * pointSpacing : chartLeft + chartWidth / 2;
      ctx.fillText(labels[li], px, chartTop + chartHeight + 8);
    }

    // 绘制每条数据线
    for (var di = 0; di < datasets.length; di++) {
      var ds = datasets[di];
      var color = ds.color || this.COLORS[di % this.COLORS.length];
      var values = ds.values;
      var points = [];

      // 计算数据点坐标
      for (var vi = 0; vi < values.length; vi++) {
        var px2 = labels.length > 1 ? chartLeft + vi * pointSpacing : chartLeft + chartWidth / 2;
        var py = chartTop + chartHeight - (values[vi] / yMax) * chartHeight;
        points.push({ x: px2, y: py });
      }

      if (points.length < 2) {
        // 只有一个点，画圆点
        if (points.length === 1 && showDots) {
          ctx.beginPath();
          ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
        continue;
      }

      // 绘制渐变填充区域
      if (doFill) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, chartTop + chartHeight);
        ctx.lineTo(points[0].x, points[0].y);
        // 贝塞尔平滑曲线
        for (var si = 0; si < points.length - 1; si++) {
          var cpx1 = (points[si].x + points[si + 1].x) / 2;
          var cpy1 = points[si].y;
          var cpx2 = (points[si].x + points[si + 1].x) / 2;
          var cpy2 = points[si + 1].y;
          ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, points[si + 1].x, points[si + 1].y);
        }
        ctx.lineTo(points[points.length - 1].x, chartTop + chartHeight);
        ctx.closePath();

        var gradient = ctx.createLinearGradient(0, chartTop, 0, chartTop + chartHeight);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '05');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // 绘制平滑曲线
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var ci = 0; ci < points.length - 1; ci++) {
        var cx1 = (points[ci].x + points[ci + 1].x) / 2;
        var cy1 = points[ci].y;
        var cx2 = (points[ci].x + points[ci + 1].x) / 2;
        var cy2 = points[ci + 1].y;
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, points[ci + 1].x, points[ci + 1].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 绘制数据点
      if (showDots) {
        for (var pi = 0; pi < points.length; pi++) {
          ctx.beginPath();
          ctx.arc(points[pi].x, points[pi].y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // 底部图例
    if (datasets.length > 1) {
      var legendY = canvasHeight - legendHeight + 8;
      var legendTotalWidth = 0;
      var legendItems = [];
      for (var ldi = 0; ldi < datasets.length; ldi++) {
        legendItems.push({ name: datasets[ldi].name, color: datasets[ldi].color || this.COLORS[ldi % this.COLORS.length] });
        legendTotalWidth += ctx.measureText(datasets[ldi].name).width + 30;
      }
      var legendStartX = (canvasWidth - legendTotalWidth) / 2;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (var lii = 0; lii < legendItems.length; lii++) {
        var litem = legendItems[lii];
        ctx.fillStyle = litem.color;
        ctx.beginPath();
        ctx.arc(legendStartX + 6, legendY + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666666';
        ctx.fillText(litem.name, legendStartX + 16, legendY + 6);
        legendStartX += ctx.measureText(litem.name).width + 30;
      }
    }
  },

  // ==================== 预算进度图（水平条形图） ====================

  /**
   * 绘制预算进度图（水平条形图）
   * @param {string} canvasId - canvas元素的id
   * @param {Array} data - [{name, budget, spent, icon}]
   */
  drawBudgetChart(canvasId, data) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var container = canvas.parentElement;
    var canvasWidth = Math.min(container ? container.clientWidth : 320, 500);
    var titleHeight = 0;
    var rowHeight = 52;
    var padding = 10;
    var canvasHeight = padding * 2 + (data ? data.length : 0) * rowHeight;

    // 最小高度
    if (canvasHeight < 80) canvasHeight = 80;

    var ctx = this.initCanvas(canvas, canvasWidth, canvasHeight);

    if (!data || data.length === 0) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#AAAAAA';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('analysis_no_data'), canvasWidth / 2, canvasHeight / 2);
      return;
    }

    var barAreaLeft = 80;
    var barAreaRight = 60;
    var barWidth = canvasWidth - barAreaLeft - barAreaRight;

    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var y = padding + i * rowHeight;
      var barY = y + 22;
      var barH = 18;
      var budget = item.budget || 0;
      var spent = item.spent || 0;
      var pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      var isOver = spent > budget;
      var color = isOver ? '#E53935' : this.COLORS[i % this.COLORS.length];

      // 分类名（左）
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var labelText = item.icon ? item.icon + ' ' : '';
      labelText += item.name || '';
      var maxLabelWidth = barAreaLeft - 15;
      while (ctx.measureText(labelText).width > maxLabelWidth && labelText.length > 2) {
        labelText = labelText.substring(0, labelText.length - 1);
      }
      ctx.fillText(labelText, 8, barY + barH / 2);

      // 预算条底色（灰色）
      this._drawRoundRect(ctx, barAreaLeft, barY, barWidth, barH, 6);
      ctx.fillStyle = '#EEEEEE';
      ctx.fill();

      // 实际支出填充
      var fillWidth = budget > 0 ? (spent / budget) * barWidth : 0;
      if (fillWidth > barWidth) fillWidth = barWidth;
      if (fillWidth > 0) {
        this._drawRoundRect(ctx, barAreaLeft, barY, fillWidth, barH, 6);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // 超支部分用红色条纹覆盖（如果有超支）
      if (isOver && budget > 0) {
        var overWidth = ((spent - budget) / budget) * barWidth;
        if (overWidth + barWidth > canvasWidth - barAreaRight - barAreaLeft) {
          overWidth = canvasWidth - barAreaRight - barAreaLeft - barWidth;
        }
        if (overWidth > 0) {
          ctx.fillStyle = 'rgba(229, 57, 53, 0.5)';
          ctx.fillRect(barAreaLeft + fillWidth, barY, overWidth, barH);
        }
      }

      // 右侧百分比
      var pctValue = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      var pctText = pctValue + '%';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = isOver ? '#E53935' : '#666666';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(pctText, canvasWidth - barAreaRight + 40, barY + barH / 2);
    }
  },

  // ==================== 辅助方法 ====================

  /**
   * 绘制圆角顶部矩形（柱子用）
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 左上角x
   * @param {number} y - 左上角y（顶部）
   * @param {number} w - 宽度
   * @param {number} h - 高度
   * @param {number} r - 圆角半径
   */
  _drawRoundTopRect(ctx, x, y, w, h, r) {
    if (h <= 0) return;
    r = Math.min(r, w / 2, h);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /**
   * 绘制完整圆角矩形
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} r
   */
  _drawRoundRect(ctx, x, y, w, h, r) {
    if (w <= 0 || h <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /**
   * 格式化简短数字（用于Y轴标签）
   * @param {number} num
   * @returns {string}
   */
  _formatShortNum(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(1);
  }
};
