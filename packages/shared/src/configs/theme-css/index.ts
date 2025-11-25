/**
 * CSS 主题导出
 * 将 CSS 文件作为字符串导出供 JavaScript 使用
 */

import baseCSS from './base.css?raw'
import w001CSS from './w001.css?raw'
import w002CSS from './w002.css?raw'
import w003CSS from './w003.css?raw'
import w004CSS from './w004.css?raw'
import w005CSS from './w005.css?raw'
import w006CSS from './w006.css?raw'
import w007CSS from './w007.css?raw'
import w008CSS from './w008.css?raw'
import w009CSS from './w009.css?raw'
import w010CSS from './w010.css?raw'
import w011CSS from './w011.css?raw'

/**
 * 基础样式 CSS
 */
export const baseCSSContent = baseCSS

/**
 * CSS 主题映射表
 * W001: 经典
 * W002: 优雅
 * W003: 简洁
 * W004: 童趣彩虹
 * W005: 波普艺术
 * W006: 学术报告
 * W007: 数字浪潮
 * W008: 泛黄纸张
 * W009: 暗夜星辰
 * W010: 轻氧职场
 * W011: 极简边框
 */
export const themeMap = {
  W001: w001CSS,
  W002: w002CSS,
  W003: w003CSS,
  W004: w004CSS,
  W005: w005CSS,
  W006: w006CSS,
  W007: w007CSS,
  W008: w008CSS,
  W009: w009CSS,
  W010: w010CSS,
  W011: w011CSS,
} as const

export type ThemeName = keyof typeof themeMap
