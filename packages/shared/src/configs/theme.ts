import type { IConfigOption } from '../types'
import type { ThemeName } from './theme-css'

// 导出 CSS 主题（新主题系统）
export { baseCSSContent, themeMap, type ThemeName } from './theme-css'

export const themeOptionsMap = {
  'default': {
    label: `经典`,
    value: `default`,
    desc: ``,
  },
  'grace': {
    label: `优雅`,
    value: `grace`,
    desc: `@brzhang`,
  },
  'simple': {
    label: `简洁`,
    value: `simple`,
    desc: `@okooo5km`,
  },
  'rainbow': {
    label: `童趣彩虹`,
    value: `rainbow`,
    desc: `@Welight`,
  },
  'popart': {
    label: `波普艺术`,
    value: `popart`,
    desc: `@Welight`,
  },
  'academic': {
    label: `学术报告`,
    value: `academic`,
    desc: `@Welight`,
  },
  'technews': {
    label: `数字浪潮`,
    value: `technews`,
    desc: `@Welight`,
  },
  'vintage-paper': {
    label: `泛黄纸张`,
    value: `vintage-paper`,
    desc: `@Welight`,
  },
  'dark-stellar': {
    label: `暗夜星辰`,
    value: `dark-stellar`,
    desc: `@Welight`,
  },
  'oxygen': {
    label: `轻氧职场`,
    value: `oxygen`,
    desc: `@Welight`,
  },
}

export const themeOptions: IConfigOption<ThemeName>[] = [
  {
    label: `经典`,
    value: `default`,
    desc: ``,
  },
  {
    label: `优雅`,
    value: `grace`,
    desc: `@brzhang`,
  },
  {
    label: `简洁`,
    value: `simple`,
    desc: `@okooo5km`,
  },
  {
    label: `童趣彩虹`,
    value: `rainbow`,
    desc: `@Welight`,
  },
  {
    label: `波普艺术`,
    value: `popart`,
    desc: `@Welight`,
  },
  {
    label: `学术报告`,
    value: `academic`,
    desc: `@Welight`,
  },
  {
    label: `数字浪潮`,
    value: `technews`,
    desc: `@Welight`,
  },
  {
    label: `泛黄纸张`,
    value: `vintage-paper`,
    desc: `@Welight`,
  },
  {
    label: `暗夜星辰`,
    value: `dark-stellar`,
    desc: `@Welight`,
  },
  {
    label: `轻氧职场`,
    value: `oxygen`,
    desc: `@Welight`,
  },
]
