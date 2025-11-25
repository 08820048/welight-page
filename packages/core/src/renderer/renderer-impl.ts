import type { IOpts, RendererAPI } from '@welight/shared/types'
import type { RendererObject, Tokens } from 'marked'
import type { ReadTimeResults } from 'reading-time'
import frontMatter from 'front-matter'
import hljs from 'highlight.js/lib/core'
import { marked } from 'marked'
import readingTime from 'reading-time'
import { markedAlert, markedFootnotes, markedMarkup, markedPlantUML, markedRuby, markedSlider, markedToc, MDKatex } from '../extensions'
import { COMMON_LANGUAGES, highlightAndFormatCode } from '../utils/languages'

Object.entries(COMMON_LANGUAGES).forEach(([name, lang]) => {
  hljs.registerLanguage(name, lang)
})

export { hljs }

marked.setOptions({
  breaks: true,
})
marked.use(markedSlider())

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, `&amp;`) // 转义 &
    .replace(/</g, `&lt;`) // 转义 <
    .replace(/>/g, `&gt;`) // 转义 >
    .replace(/"/g, `&quot;`) // 转义 "
    .replace(/'/g, `&#39;`) // 转义 '
    .replace(/`/g, `&#96;`) // 转义 `
}

function buildAddition(): string {
  return `
    <style>
      .preview-wrapper pre::before {
        position: absolute;
        top: 0;
        right: 0;
        color: #ccc;
        text-align: center;
        font-size: 0.8em;
        padding: 5px 10px 0;
        line-height: 15px;
        height: 15px;
        font-weight: 600;
      }
    </style>
  `
}

function buildFootnoteArray(footnotes: [number, string, string][]): string {
  return footnotes
    .map(([index, title, link]) =>
      link === title
        ? `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code>: <i style="word-break: break-all">${title}</i><br/>`
        : `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code> ${title}: <i style="word-break: break-all">${link}</i><br/>`,
    )
    .join(`\n`)
}

function transform(legend: string | undefined, text: string | null, title: string | null): string {
  if (!legend) {
    return text || title || ``
  }
  const options = legend.split(`-`)
  for (const option of options) {
    if (option === `alt` && text) {
      return text
    }
    if (option === `title` && title) {
      return title
    }
  }
  return ``
}

const macCodeSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130">
    <ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)" />
    <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)" />
    <ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)" />
  </svg>
`.trim()

interface ParseResult {
  yamlData: Record<string, any>
  markdownContent: string
  readingTime: ReadTimeResults
}

function parseFrontMatterAndContent(markdownText: string): ParseResult {
  try {
    const parsed = frontMatter(markdownText)
    const yamlData = parsed.attributes
    const markdownContent = parsed.body

    const readingTimeResult = readingTime(markdownContent)

    return {
      yamlData: yamlData as Record<string, any>,
      markdownContent,
      readingTime: readingTimeResult,
    }
  }
  catch (error) {
    console.error(`Error parsing front-matter:`, error)
    return {
      yamlData: {},
      markdownContent: markdownText,
      readingTime: readingTime(markdownText),
    }
  }
}

export function initRenderer(opts: IOpts = {}): RendererAPI {
  const footnotes: [number, string, string][] = []
  let footnoteIndex: number = 0
  let codeIndex: number = 0
  const listOrderedStack: boolean[] = []
  const listCounters: number[] = []

  function getOpts(): IOpts {
    return opts
  }

  /**
   * 生成带 CSS 类的内容（新主题系统）
   * @param styleLabel CSS 类名标识
   * @param content 内容
   * @param tagName HTML 标签名（可选）
   */
  function styledContent(styleLabel: string, content: string, tagName?: string): string {
    const tag = tagName ?? styleLabel
    const className = `md-${styleLabel.replace(/_/g, `-`)}`
    const headingAttr = /^h\d$/.test(tag) ? ` data-heading="true"` : ``
    return `<${tag} class="${className}"${headingAttr}>${content}</${tag}>`
  }

  function addFootnote(title: string, link: string): number {
    // 检查是否已经存在相同的链接
    const existingFootnote = footnotes.find(([, , existingLink]) => existingLink === link)
    if (existingFootnote) {
      return existingFootnote[0] // 返回已存在的脚注索引
    }

    // 如果不存在，创建新的脚注
    footnotes.push([++footnoteIndex, title, link])
    return footnoteIndex
  }

  function reset(newOpts: Partial<IOpts>): void {
    footnotes.length = 0
    footnoteIndex = 0
    setOptions(newOpts)
  }

  function setOptions(newOpts: Partial<IOpts>): void {
    opts = { ...opts, ...newOpts }
    // 新主题系统：扩展不再需要 styles 参数
    marked.use(markedAlert())
    marked.use(MDKatex({ nonStandard: true }, true))
    marked.use(markedMarkup())
  }

  function buildReadingTime(readingTime: ReadTimeResults): string {
    if (!opts.countStatus) {
      return ``
    }
    if (!readingTime.words) {
      return ``
    }
    return `
      <blockquote class="md-blockquote">
        <p class="md-blockquote-p">字数 ${readingTime?.words}，阅读大约需 ${Math.ceil(readingTime?.minutes)} 分钟</p>
      </blockquote>
    `
  }

  const buildFootnotes = () => {
    if (!footnotes.length) {
      return ``
    }

    return (
      styledContent(`h4`, `引用链接`)
      + styledContent(`footnotes`, buildFootnoteArray(footnotes), `p`)
    )
  }

  const renderer: RendererObject = {
    heading({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens)
      const tag = `h${depth}`

      // 为 h1 添加 SVG 背景装饰
      if (depth === 1) {
        const svgBackground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"><path d="m458.3 27.2-5.7-.4c-14.7-1.6-29.2-3.5-45.8-5-27.2-3.2-52 1-93.8-4.1-4.8-.5-1.6 1.1-22 1.1-40-.1-108-6-151.2-10.5-27.7-3.1-57.2-4.7-83.4 4.8l-4.2 2.1q-10.6-.3-21.1 1.7c-1.5.3-2.5 1.4-3.6 2.4-1.9 2 1 4.9-2.4 5.9-1.7.6-3.6.9-4.9 2.2-1 1-.9 2.7-1.9 3.8-.5.7-1.5 1.3-1.3 2.2s1.8.6 2.4 1q.4.4.8 1.1 1 .9 1.8 2.1.7 1.3 2.4 1.5c.5.3 6.6.8 4.1 1.3-11.2 2.1-7.1.6-16.6 1-.9 0-2 .3-2.4 1.2-.9 2.1 1.7 5-.8 6.5-2 .6-1.6 2.8-1.6 4.4 0 2-.5 3.3-.5 5.2 0 1.4.5 2.7.6 4 .3 3 .5 4.3 5.2 5.9q2.1.4 2.9 1.9c.4 1.1.2 2.2.4 3.3.6 4.6 4.9 1.4 5.3 5.6q.4 1.7-.5 2.2-1.1.3-1.6 1.2c-.6 1.3.4 3.3 0 4.6s-1.4 2.7 0 3.8c.7.7 2.3 1 2.5 1.4.2.9-3.5.9-2.9 3.7.2 1.7-1.1 2.3-2.8 3-1.3.6-2.5 1-2.7 2.1 0 1.3 0 2.9.8 4 2.5 2 6.1 2.9 9.1 4 1.8 1.5 6.4 2.6-.4 6.4-9.1.1-9.6-.5-11.6 2.7-1.2 2-.6 4.6-.6 6.9 0 1.9.7 3.8.9 5.7.6 3.5 2.3 2.5 4.1 3.5 1.2.7 1.9 1.9 0 1.5s-4.1.2-4 2.4q.2 1.3.2 2.5c-.4 1.6-2.2 1.8-.7 6.1.7 1.6 1.3 3.5 2.8 4.2 1.3.6 3 .2 4.2.9 1.1.5 2.1 2.4 1.5 3.6-.4.6-1.4.6-2.1.8-2 .6-2.2 2.5-4.5 2-2.6-.2-2.5 1.2-1.3 3.2q1 1.7 2.9 1.9c7.2 1.1 14.6 2.7 21.9 2.1q3.6.4 7.1.6c63 5.4 59.3 5.3 71.2 5.5 2.1-.9-1.2-6.7 2.7-8.1 7.5-2.4 13.4 7.6 20.8 6.5 3.4-.5.9-6.5 4.3-5 5.5 2.4 11.1 5.6 16.9 8.1q1.4.5 2.9.5 17.2 0 34.6-.9c3-.3.7-4.4 4.2-4.8 6.8-1 19.1 5 22.5 1.8 1.4-1.2.7-3.6 3.3-3.3 3.3.3 6.1 2.1 9.3 1.6 5.3-.8 10.6-2.4 16-2.7 24.2-.3 45.9-6.1 70.1-9 25.8-.6 34.1-.5 59.4-5h1.4c.8.2 1.6.1 4.8 0 18.5-.3 17.4 1.2 20.2-.3.8-.6 1.1-1.2 1.9-1.2 3.2 0 8.1.6 15.4.6 1.6 0 3.4.2 4.8-.7 1.2-1 .9-2 3.2-2 10.2.1 11.6 0 12.5-.6s.5-1.8-.5-2.1c-9.5-1-22.9-.2-28.3-.8-1.1 0-1.6-1.7-.8-2.4 3.5-3.6 7.1-3.8 12.5-4.1q2.8-.2 5.3-.9c4-1.4 1.7-2.9-1.6-3-3.8-.3-8.4.4-12-1.4q-.7-.6-.3-1.7 19.8-1.5 39.8-.9 3.5-.1 4.9-2.5h1c3.3 0 5.1-2.2 5.6-4.6q.7-.2.8-.9v-4.4c.4-.5.4-1.5-1-1.6-.8-.4-3.3-.4-4.2-.4-1.3-.1-1.3-.2-1.5 0l-9-.4c.3-.9.4-1.7 1.4-1.9 1.3-.3 3.5 0 4.5-1 .7-.7 1.2-1.7 2.3-1.8 5.2-.5 6.8-.1 8.1-1.5.8-.9 1.9-2.2 1.7-3.2q-.2-.6.3-.4c3.4-.3 9.5 0 10.9-.8 1-.5.8-1.7 0-2.1l-.3-.1h-.2c-1.4-.4-3.1 0-4.5-.3q-.6-.2-.2-1.1.5-1.5-1-2c-3.5-.4-6.8.5-10.4.4-3.3 0-7.1.8-10.3-.2-.2 0-.8-.2-.7-.4 0-.3.9-.3 1.9-.3 1.4 0 3.4-1.1 1.9-2.4q-.7-.4-1.5-.4h-4.6q1 0 1.1-.3h1c.7 0 1.2-.9.9-1.5l.2-.5q0-.4-.3-.7l-.6-.3c-.9-.5-9.5.8-16.8-.2l1.8-.2c1-.1 3-.4 3.2-1.3 0-2.9 0-1.7-.3-3.8.4-.4 1.4-1.1.9-1.5-.6-.5-3.4-1.5-4.2-1.5 1.5-.5 2.9 0 4.4-.4q4.9-.5 9.8-.6c1.3 0 1.2-1.8 0-2h-.4c7.9-.6 10.5-.2 11-1.8.3-2-2.3-1.6-3.4-1.9q-.2-.2 0-.5 1.8-2.2-.2-3c-5.1-1-10.4-.8-15.5-1.6l.1-.1 1.5-.1q5.2-.3 10.3-1c.9-.2 2.1-.5 2.2-1.5 0-.8-.7-1.3-1.2-1.8-.7-.8 0-2.7-1-3.4q-.9-.7-2.1-.7l-9.1-.5q0-.4-.3-.8 3.2-.1 6.4-.6l10.1-.2c1.5.4 3.4.4 6.5 0 2 0 4.2.6 6-.1 2.7-1.2-1.4-6.1 2.3-5.9l7.7-.1q2.2-.1 3.2-2c.5-.9 1-2.2 0-3q-1-.7-2.6-.9-1.6-.4-.4-.6c1.2-.2 3.1-.1 3.4-1.7q.3-1.6.5-3.1c.4-1.9 1.4-3.4 1.3-5.3-.4-2.8 0-5.9-1.7-8.1-1-1-2.8-.9-4.4-1.1l-7.1-.7c-8.3-.6-13.6-.5-21.8-1.2Z" fill="rgb(0, 0, 0)" class="md-h1-svg-path"></path></svg>`
        return styledContent(tag, svgBackground + text)
      }

      return styledContent(tag, text)
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      const isFigureImage = text.includes(`<figure`) && text.includes(`<img`)
      const isEmpty = text.trim() === ``
      if (isFigureImage || isEmpty) {
        return text
      }
      return styledContent(`p`, text)
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens)
      // 新主题系统：blockquote 内的 p 标签由 CSS 选择器 `blockquote p` 控制
      return styledContent(`blockquote`, text)
    },

    code({ text, lang = `` }: Tokens.Code): string {
      if (lang.startsWith(`mermaid`)) {
        clearTimeout(codeIndex)
        codeIndex = setTimeout(async () => {
          // 优先使用全局 CDN 的 mermaid
          if (typeof window !== `undefined` && (window as any).mermaid) {
            const mermaid = (window as any).mermaid
            await mermaid.run()
          }
          else {
            // 回退到动态导入（开发环境）
            const mermaid = await import(`mermaid`)
            await mermaid.default.run()
          }
        }, 0) as any as number
        return `<pre class="mermaid">${text}</pre>`
      }
      const langText = lang ? lang.split(` `)[0] : `plaintext`
      const isLanguageRegistered = hljs.getLanguage(langText)
      const language = isLanguageRegistered ? langText : `plaintext`

      const highlighted = highlightAndFormatCode(text, language, hljs, !!opts.isShowLineNumber)

      const span = `<span class="mac-sign" style="padding: 10px 14px 0;">${macCodeSvg}</span>`
      // 如果语言未注册，添加 data-language-pending 属性和原始代码文本用于后续动态加载
      let pendingAttr = ``
      if (!isLanguageRegistered && langText !== `plaintext`) {
        const escapedText = text.replace(/"/g, `&quot;`)
        pendingAttr = ` data-language-pending="${langText}" data-raw-code="${escapedText}" data-show-line-number="${opts.isShowLineNumber}"`
      }
      const code = `<code class="language-${langText}"${pendingAttr}>${highlighted}</code>`

      return `<pre class="hljs code__pre">${span}${code}</pre>`
    },

    codespan({ text }: Tokens.Codespan): string {
      const escapedText = escapeHtml(text)
      return styledContent(`codespan`, escapedText, `code`)
    },

    list({ ordered, items, start = 1 }: Tokens.List) {
      listOrderedStack.push(ordered)
      listCounters.push(Number(start))

      const html = items
        .map(item => this.listitem(item))
        .join(``)

      listOrderedStack.pop()
      listCounters.pop()

      return styledContent(
        ordered ? `ol` : `ul`,
        html,
      )
    },

    // 2. listitem：从栈顶取 ordered + counter，计算 prefix 并自增
    listitem(token: Tokens.ListItem) {
      const ordered = listOrderedStack[listOrderedStack.length - 1]
      const idx = listCounters[listCounters.length - 1]!

      // 准备下一个
      listCounters[listCounters.length - 1] = idx + 1

      const prefix = ordered ? `${idx}` : `✓`

      // 渲染内容：优先 inline，fallback 去掉 <p> 包裹
      let content: string
      try {
        content = this.parser.parseInline(token.tokens)
      }
      catch {
        content = this.parser
          .parse(token.tokens)
          .replace(/^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/, `$1`)
      }

      // 输出带可控前缀元素，便于主题按需美化或隐藏
      return styledContent(
        `listitem`,
        `<span class=\"md-list-prefix\">${prefix}</span>${content}`,
        `li`,
      )
    },

    image({ href, title, text }: Tokens.Image): string {
      const subText = styledContent(`figcaption`, transform(opts.legend, text, title))
      return `<figure><img src="${href}" title="${title}" alt="${text}"/>${subText}</figure>`
    },

    link({ href, title, text, tokens }: Tokens.Link): string {
      const parsedText = this.parser.parseInline(tokens)
      if (/^https?:\/\/mp\.weixin\.qq\.com/.test(href)) {
        return `<a href="${href}" title="${title || text}">${parsedText}</a>`
      }
      if (href === text) {
        return parsedText
      }
      if (opts.citeStatus) {
        const ref = addFootnote(title || text, href)
        return `<a href="${href}" title="${title || text}">${parsedText}<sup>[${ref}]</sup></a>`
      }
      return `<a href="${href}" title="${title || text}">${parsedText}</a>`
    },

    strong({ tokens }: Tokens.Strong): string {
      return styledContent(`strong`, this.parser.parseInline(tokens))
    },

    em({ tokens }: Tokens.Em): string {
      return styledContent(`em`, this.parser.parseInline(tokens))
    },

    table({ header, rows }: Tokens.Table): string {
      const headerRow = header
        .map((cell) => {
          const text = this.parser.parseInline(cell.tokens)
          return styledContent(`th`, text)
        })
        .join(``)
      const body = rows
        .map((row) => {
          const rowContent = row
            .map(cell => this.tablecell(cell))
            .join(``)
          return styledContent(`tr`, rowContent)
        })
        .join(``)
      return `
        <section style="max-width: 100%; overflow: auto">
          <table class="preview-table">
            <thead>${headerRow}</thead>
            <tbody>${body}</tbody>
          </table>
        </section>
      `
    },

    tablecell(token: Tokens.TableCell): string {
      const text = this.parser.parseInline(token.tokens)
      return styledContent(`td`, text)
    },

    hr(_: Tokens.Hr): string {
      return styledContent(`hr`, ``)
    },
  }

  marked.use({ renderer })
  // 新主题系统：扩展不再需要 styles 参数
  marked.use(markedMarkup())
  marked.use(markedToc())
  marked.use(markedSlider())
  marked.use(markedAlert({}))
  marked.use(MDKatex({ nonStandard: true }, true))
  marked.use(markedFootnotes())
  marked.use(markedPlantUML({
    inlineSvg: true, // 启用SVG内嵌，适用于微信公众号
  }))
  marked.use(markedRuby())

  return {
    buildAddition,
    buildFootnotes,
    setOptions,
    reset,
    parseFrontMatterAndContent,
    buildReadingTime,
    createContainer(content: string) {
      return styledContent(`container`, content, `section`)
    },
    getOpts,
  }
}
