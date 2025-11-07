import { markedAlert, MDKatex } from '@welight/core'
import { prefix } from '@welight/shared/configs'
// 直接导入供本文件内部使用
import {
  checkImage,
  createTable,
  downloadFile,
  formatDoc,
  removeLeft,
  sanitizeTitle,
  toBase64,
} from '@welight/shared/utils'

import juice from 'juice'
import { Marked } from 'marked'

// 导出新的统一存储 API
export {
  LocalEngine,
  RestfulEngine,
  type StorageEngine,
  store,
} from './storage'

// 重新导出供外部使用
export {
  checkImage,
  createTable,
  downloadFile,
  formatDoc,
  removeLeft,
  sanitizeTitle,
  toBase64,
}

// 导出新主题系统需要的函数
export {
  modifyHtmlContent,
  postProcessHtml,
  renderMarkdown,
} from '@welight/core/utils'

export function addPrefix(str: string) {
  return `${prefix}__${str}`
}

/**
 * 导出原始 Markdown 文档
 * @param {string} doc - 文档内容
 * @param {string} title - 文档标题
 */
export function downloadMD(doc: string, title: string = `untitled`) {
  const safeTitle = sanitizeTitle(title)
  downloadFile(doc, `${safeTitle}.md`, `text/markdown;charset=utf-8`)
}

/**
 * 获取 HTML 内容
 * @returns {string} HTML 字符串
 */
export function getHtmlContent(): string {
  const element = document.querySelector(`#output`)!
  return element.innerHTML
}

/**
 * 导出 HTML 生成内容
 */
export async function exportHTML(title: string = `untitled`) {
  const htmlStr = getHtmlContent()
  const stylesToAdd = await getStylesToAdd()

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${sanitizeTitle(title)}</title>
  ${stylesToAdd}
</head>
<body>
  <div style="width: 750px; margin: auto; padding: 20px;">
    ${htmlStr}
  </div>
</body>
</html>`

  downloadFile(fullHtml, `${sanitizeTitle(title)}.html`, `text/html`)
}

/**
 * 生成无样式 HTML
 * @param raw - 原始 Markdown 内容
 * @returns string
 */
export async function generatePureHTML(raw: string): Promise<string> {
  const markedInstance = new Marked()
  markedInstance.use(markedAlert({ withoutStyle: true }))
  markedInstance.use(
    MDKatex({ nonStandard: true }, false),
  )
  const pureHtml = await markedInstance.parse(raw)
  return pureHtml
}

/**
 * 导出无样式 HTML 文件
 * @param raw - 原始 Markdown 内容
 * @param title - 文档标题
 */
export async function exportPureHTML(raw: string, title: string = `untitled`) {
  const safeTitle = sanitizeTitle(title)

  const pureHtml = await generatePureHTML(raw)

  downloadFile(pureHtml, `${safeTitle}.html`, `text/html`)
}

/**
 * 导出 PDF 文档（新主题系统）
 * @param {string} title - 文档标题
 */
export async function exportPDF(title: string = `untitled`) {
  const htmlStr = getHtmlContent()
  const stylesToAdd = await getStylesToAdd()
  const safeTitle = sanitizeTitle(title)

  // 创建新窗口用于打印
  const printWindow = window.open(``, `_blank`)
  if (!printWindow) {
    console.error(`无法打开打印窗口`)
    return
  }

  // 写入HTML内容，包含主题样式和自定义页眉页脚
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      ${stylesToAdd}
      <style>
        /* 强制打印背景颜色和图片 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* 打印页面设置 */
        @page {
          @top-center {
            content: "${safeTitle}";
            font-size: 12px;
            color: #666;
          }
          @bottom-left {
            content: "微信 Markdown 编辑器";
            font-size: 10px;
            color: #999;
          }
          @bottom-right {
            content: "第 " counter(page) " 页，共 " counter(pages) " 页";
            font-size: 10px;
            color: #999;
          }
        }

        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div style="width: 100%; max-width: 750px; margin: auto;">
        ${htmlStr}
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()

  // 等待内容加载完成后自动打开打印对话框
  printWindow.onload = () => {
    printWindow.print()
    // 打印完成后关闭窗口
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }
}

export function solveWeChatImage() {
  const clipboardDiv = document.getElementById(`output`)!
  const images = clipboardDiv.getElementsByTagName(`img`)

  Array.from(images).forEach((image) => {
    const width = image.getAttribute(`width`)
    const height = image.getAttribute(`height`)

    if (width) {
      image.removeAttribute(`width`)
      // 如果是纯数字，添加 px 单位；否则保持原值
      image.style.width = /^\d+$/.test(width) ? `${width}px` : width
    }

    if (height) {
      image.removeAttribute(`height`)
      // 如果是纯数字，添加 px 单位；否则保持原值
      image.style.height = /^\d+$/.test(height) ? `${height}px` : height
    }
  })
}

async function getHljsStyles(): Promise<string> {
  const hljsLink = document.querySelector(`#hljs`) as HTMLLinkElement
  if (!hljsLink)
    return ``

  try {
    const response = await fetch(hljsLink.href)
    const cssText = await response.text()
    return `<style>${cssText}</style>`
  }
  catch (error) {
    console.warn(`Failed to fetch highlight.js styles:`, error)
    return ``
  }
}

function getThemeStyles(): string {
  const themeStyle = document.querySelector(`#md-theme`) as HTMLStyleElement

  if (!themeStyle || !themeStyle.textContent) {
    console.warn('[getThemeStyles] 未找到主题样式')
    return ``
  }

  // 移除 #output 作用域前缀，因为复制后的 HTML 不在 #output 容器中
  let cssContent = themeStyle.textContent
  // 将 "#output h1" 替换为 "h1"，"#output .class" 替换为 ".class" 等
  // 同时处理换行和多个空格的情况
  cssContent = cssContent.replace(/#output\s+/g, '')
  // 处理选择器开头的 #output（如果没有后续内容）
  cssContent = cssContent.replace(/^#output\s*/gm, '')

  const styleContent = `<style>${cssContent}</style>`
  return styleContent
}

function mergeCss(html: string): string {
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
  })
}

function modifyHtmlStructure(htmlString: string): string {
  const tempDiv = document.createElement(`div`)
  tempDiv.innerHTML = htmlString

  // 移动 `li > ul` 和 `li > ol` 到 `li` 后面
  tempDiv.querySelectorAll(`li > ul, li > ol`).forEach((originalItem) => {
    originalItem.parentElement!.insertAdjacentElement(`afterend`, originalItem)
  })

  return tempDiv.innerHTML
}

/**
 * 将复杂嵌套列表转换为简单缩进文本结构（公众号最佳实践）
 * - 仅在复制为“公众号格式”时对 #output 临时 DOM 生效
 * - 顶层使用 •，子级使用 ◦，每级缩进 4 个 NBSP
 * - 保留行内样式/格式（strong/em/code/a...），移除 .md-list-prefix
 * - 跳过代码块中的列表
 */
function convertComplexListsToSimple(container: HTMLElement) {
  const nbsp = (lv: number) => '&nbsp;'.repeat(lv * 4)
  const isRootList = (el: Element) => !el.parentElement?.closest('ul,ol')
  const roots = Array.from(container.querySelectorAll<HTMLElement>('ul,ol'))
    .filter(list => !list.closest('pre,code') && isRootList(list))

  const collect = (listEl: HTMLElement, level: number, out: HTMLElement[]) => {
    const listTag = listEl.tagName.toLowerCase()
    const isOrdered = listTag === 'ol'
    let idx = isOrdered ? Number.parseInt(listEl.getAttribute('start') || '1', 10) : 0

    Array.from(listEl.children).forEach((child) => {
      const tag = child.tagName.toLowerCase()

      if (tag === 'li') {
        // 子列表（先记录，后处理，保证“先文本，后子列表”）
        const subLists = Array.from(child.querySelectorAll(':scope > ul, :scope > ol')) as HTMLElement[]

        // 取 li 的“行内内容”：克隆后去掉子列表与自定义前缀
        const c = child.cloneNode(true) as HTMLElement
        c.querySelectorAll('ul,ol,.md-list-prefix').forEach(n => n.remove())

        // 展开单个 p 包裹，避免不必要的块级换行
        let inner = c.innerHTML
        if (c.childElementCount === 1 && c.firstElementChild && c.firstElementChild.tagName.toLowerCase() === 'p') {
          inner = (c.firstElementChild as HTMLElement).innerHTML
        }

        // 生成一行 div
        const line = document.createElement('div')
        line.setAttribute('data-wx-line', '')
        line.setAttribute('style', 'margin:5px 0;')
        const bullet = isOrdered ? `${idx++}.` : (level === 0 ? '•' : '◦')
        line.innerHTML = `${nbsp(level)}${bullet} ${inner}`
        out.push(line)

        // 递归处理子列表（顺序：先文本，后子列表）
        subLists.forEach(sub => collect(sub, level + 1, out))
      }
      else if (tag === 'ul' || tag === 'ol') {
        // 兼容 modifyHtmlStructure 将子列表移出 li 的情况
        collect(child as HTMLElement, level + 1, out)
      }
    })
  }

  roots.forEach((list) => {
    const lines: HTMLElement[] = []
    collect(list, 0, lines)

    // 用一个容器包裹转好的行，继承原 ul/ol 的视觉（优先使用已内联样式；否则回退到计算样式）
    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-wx-list', '')
    let wrapperStyle = list.getAttribute('style') || ''
    // 移除背景/边框/圆角等，仅保留 margin/padding，彻底去除“背景框效果”
    if (wrapperStyle) {
      wrapperStyle = wrapperStyle
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .filter((rule) => {
          const prop = rule.split(':')[0].trim().toLowerCase()
          return prop.startsWith('margin') || prop.startsWith('padding')
        })
        .join(';')
    }
    if (!wrapperStyle) {
      const cs = window.getComputedStyle(list)
      const get = (p: string) => cs.getPropertyValue(p)
      const parts: string[] = []
      ;(['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'] as const)
        .forEach((p) => {
          const v = get(p)
          if (v && v !== '0px')
            parts.push(`${p}:${v}`)
        })
      wrapperStyle = parts.join(';')
    }
    if (wrapperStyle)
      wrapper.setAttribute('style', wrapperStyle)

    lines.forEach(l => wrapper.appendChild(l))
    list.replaceWith(wrapper)
  })
}

function createEmptyNode(): HTMLElement {
  const node = document.createElement(`p`)
  node.style.fontSize = `0`
  node.style.lineHeight = `0`
  node.style.margin = `0`
  node.innerHTML = `&nbsp;`
  return node
}

/**
 * 公众号样式兼容补丁（仅复制到公众号时注入）
 * - 避免列表内 strong/em 触发换行
 * - 降级 .md-list-prefix 的布局以兼容不支持 inline-flex 的编辑器
 */
function getWeChatCompatStyles(): string {
  return `<style>
  /* 列表/简化结构内的强调元素强制保持内联展示 */
  ul li strong, ol li strong, ul li b, ol li b,
  .list .content strong, .list .content b,
  div[data-wx-line] strong, div[data-wx-line] b { display: inline; font-weight: 700; }
  ul li em, ol li em, ul li i, ol li i,
  .list .content em, .list .content i,
  div[data-wx-line] em, div[data-wx-line] i { display: inline; font-style: italic; }

  /* 避免块级 p 导致换行（简化结构中的 p 也内联化） */
  ul li > p, ol li > p, .list .content > p,
  div[data-wx-line] > p { display: inline; margin: 0; padding: 0; }

  /* 前缀圆徽标：在部分编辑器降级 inline-flex 为 inline-block，避免换行 */
  .md-list-prefix { display: inline-block !important; text-align: center; vertical-align: top; }
  </style>`
}

/**
 * DOM 级纠正：展开列表项内的段落，移除多余换行
 */
function normalizeListInlineForWeChat(container: HTMLElement) {
  // 展开 li > p、.list .content > p
  const ps = container.querySelectorAll<HTMLElement>('ul li > p, ol li > p, .list .content > p')
  ps.forEach((p) => {
    // 仅在 p 内没有块级元素时展开
    if (!p.querySelector('p,div,ul,ol,pre,table,blockquote')) {
      const frag = document.createDocumentFragment()
      while (p.firstChild) frag.appendChild(p.firstChild)
      p.replaceWith(frag)
    }
  })

  // 移除列表项内部多余的 <br>
  container.querySelectorAll('ul li br, ol li br, .list .content br').forEach((br) => {
    const parent = br.parentElement
    if (parent && !parent.closest('pre, code'))
      br.remove()
  })
}

/**
 * 获取需要添加的样式
 * @returns {Promise<string>} 样式字符串
 */
async function getStylesToAdd(): Promise<string> {
  const themeStyles = getThemeStyles()
  const hljsStyles = await getHljsStyles()
  const compatStyles = getWeChatCompatStyles()
  return [themeStyles, hljsStyles, compatStyles].filter(Boolean).join(``)
}

export async function processClipboardContent(primaryColor: string) {
  const clipboardDiv = document.getElementById(`output`)!

  const stylesToAdd = await getStylesToAdd()

  if (stylesToAdd) {
    clipboardDiv.innerHTML = stylesToAdd + clipboardDiv.innerHTML
  }

  // 先合并 CSS 和修改 HTML 结构
  clipboardDiv.innerHTML = modifyHtmlStructure(mergeCss(clipboardDiv.innerHTML))

  // 列表：转换为简单缩进文本结构（公众号最佳实践）
  convertComplexListsToSimple(clipboardDiv)

  // 处理样式和颜色变量
  clipboardDiv.innerHTML = clipboardDiv.innerHTML
    .replace(/([^-])top:(.*?)em/g, `$1transform: translateY($2em)`)
    .replace(/hsl\(var\(--foreground\)\)/g, `#3f3f3f`)
    .replace(/var\(--blockquote-background\)/g, `#f7f7f7`)
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/--md-primary-color:.+?;/g, ``)
    .replace(
      /<span class="nodeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      `<span class="nodeLabel"$1>$2</span>`,
    )
    .replace(
      /<span class="edgeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      `<span class="edgeLabel"$1>$2</span>`,
    )

  // 列表内联兼容修复：避免 bold/italic 触发换行
  normalizeListInlineForWeChat(clipboardDiv)

  // 处理图片大小
  solveWeChatImage()

  // 添加空白节点用于兼容 SVG 复制
  const beforeNode = createEmptyNode()
  const afterNode = createEmptyNode()
  clipboardDiv.insertBefore(beforeNode, clipboardDiv.firstChild)
  clipboardDiv.appendChild(afterNode)

  // 兼容 Mermaid
  const nodes = clipboardDiv.querySelectorAll(`.nodeLabel`)
  nodes.forEach((node) => {
    const parent = node.parentElement!
    const xmlns = parent.getAttribute(`xmlns`)!
    const style = parent.getAttribute(`style`)!
    const section = document.createElement(`section`)
    section.setAttribute(`xmlns`, xmlns)
    section.setAttribute(`style`, style)
    section.innerHTML = parent.innerHTML

    const grand = parent.parentElement!

    // 清空父元素
    grand.innerHTML = ``
    grand.appendChild(section)
  })

  // fix: mermaid 部分文本颜色被 stroke 覆盖
  clipboardDiv.innerHTML = clipboardDiv.innerHTML
    .replace(
      /<tspan([^>]*)>/g,
      `<tspan$1 style="fill: #333333 !important; color: #333333 !important; stroke: none !important;">`,
    )
}
