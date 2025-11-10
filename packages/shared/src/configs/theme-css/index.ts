/**
 * CSS 主题导出
 * 将 CSS 文件作为字符串导出供 JavaScript 使用
 */

import baseCSS from './base.css?raw'
import defaultCSS from './default.css?raw'
import graceCSS from './grace.css?raw'
import simpleCSS from './simple.css?raw'
import rainbowCSS from './rainbow.css?raw'
import popartCSS from './popart.css?raw'
import academicCSS from './academic.css?raw'
import technewsCSS from './technews.css?raw'

/**
 * 基础样式 CSS
 */
export const baseCSSContent = baseCSS

/**
 * CSS 主题映射表
 */
export const themeMap = {
  default: defaultCSS,
  grace: graceCSS,
  simple: simpleCSS,
  rainbow: rainbowCSS,
  popart: popartCSS,
  academic: academicCSS,
  technews: technewsCSS,
} as const

export type ThemeName = keyof typeof themeMap
