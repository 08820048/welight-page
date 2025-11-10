/**
 * 主题应用工具
 * 负责将主题样式应用到页面
 */

import type { ThemeName } from '@welight/shared/configs'
import type { CSSVariableConfig } from './cssVariables'
import { baseCSSContent, themeMap } from '@welight/shared/configs'
import { processCSS } from './cssProcessor'
import { wrapCSSWithScope } from './cssScopeWrapper'
import { generateCSSVariables } from './cssVariables'
import { getThemeInjector } from './themeInjector'

export interface ThemeConfig {
  themeName: string // 主题名称
  customCSS?: string // 用户自定义 CSS
  variables: CSSVariableConfig
}

/**
 * 应用主题
 * @param config - 主题配置
 */
export async function applyTheme(config: ThemeConfig): Promise<void> {
  // 1. 生成 CSS 变量
  const variablesCSS = generateCSSVariables(config.variables)

  // 2. 构建主题 CSS（模拟旧系统的合并行为）
  let themeCSS = themeMap.default // 默认主题作为基础

  // 3. 如果不是 default 主题，叠加主题特定样式
  if (config.themeName !== `default`) {
    const specificThemeCSS = themeMap[config.themeName as ThemeName]
    if (specificThemeCSS) {
      themeCSS = `${themeCSS}\n\n${specificThemeCSS}`
    }
  }

  // 4. 添加用户自定义 CSS
  if (config.customCSS) {
    themeCSS = `${themeCSS}\n\n${config.customCSS}`
  }

  // 5. 给主题 CSS 添加作用域（只影响 #output 预览区域）
  const scopedThemeCSS = wrapCSSWithScope(themeCSS, `#output`)

  // 6. 拼接完整 CSS
  let mergedCSS = [
    variablesCSS, // CSS 变量（全局）
    baseCSSContent, // 基础样式（全局）
    scopedThemeCSS, // 主题样式（限制在 #output）
  ].filter(Boolean).join(`\n\n`)

  // 7. 使用 PostCSS 处理 CSS（简化 calc() 表达式等）
  mergedCSS = await processCSS(mergedCSS)

  console.log(mergedCSS, 'mergedCSS')

  // 8. 注入到页面
  const injector = getThemeInjector()
  injector.inject(mergedCSS)

  // 9. 处理特殊主题的额外元素（如 vintage-paper 的 SVG 滤镜）
  handleSpecialThemeElements(config.themeName)
}

/**
 * 处理特殊主题需要的额外元素
 * @param themeName - 主题名称
 */
function handleSpecialThemeElements(themeName: string): void {
  // 移除之前的特殊元素
  removeSpecialThemeElements()

  if (themeName === 'vintage-paper') {
    // 为 vintage-paper 主题添加 SVG 滤镜
    addVintagePaperSVGFilter()
  }
}

/**
 * 移除特殊主题元素
 */
function removeSpecialThemeElements(): void {
  const existingSVG = document.querySelector('#vintage-paper-svg-filter')
  if (existingSVG) {
    existingSVG.remove()
  }
}

/**
 * 添加 vintage-paper 主题的 SVG 滤镜
 */
function addVintagePaperSVGFilter(): void {
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgElement.id = 'vintage-paper-svg-filter'
  svgElement.style.display = 'none'
  svgElement.style.position = 'absolute'

  svgElement.innerHTML = `
    <defs>
      <filter id="wavy2">
        <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="1"></feTurbulence>
        <feDisplacementMap in="SourceGraphic" scale="20"></feDisplacementMap>
      </filter>
    </defs>
  `

  document.body.appendChild(svgElement)
}
