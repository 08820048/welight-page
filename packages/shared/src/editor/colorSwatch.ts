import type { Extension } from '@codemirror/state'
import { EditorView, gutter, GutterMarker } from '@codemirror/view'

// Simple color string detection per line: hex, rgb/rgba, hsl/hsla
const COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|(?:rgb|hsl)a?\(([^)]*)\)/g

function pad2(n: number) {
  return n.toString(16).padStart(2, '0')
}

function rgbToHex(r: number, g: number, b: number) {
  r = Math.max(0, Math.min(255, Math.round(r)))
  g = Math.max(0, Math.min(255, Math.round(g)))
  b = Math.max(0, Math.min(255, Math.round(b)))
  return `#${pad2(r)}${pad2(g)}${pad2(b)}`
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // s, l given in percentage (0-100)
  s = s / 100
  l = l / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0; let g = 0; let b = 0
  if (hp >= 0 && hp < 1) { r = c; g = x; b = 0 }
  else if (hp < 2) { r = x; g = c; b = 0 }
  else if (hp < 3) { r = 0; g = c; b = x }
  else if (hp < 4) { r = 0; g = x; b = c }
  else if (hp < 5) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const m = l - c / 2
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function normalizeHex(hex: string): string | null {
  const m3 = /^#([0-9a-f]{3})$/i.exec(hex)
  if (m3) {
    const [a, b, c] = m3[1].split('')
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase()
  }
  const m6 = /^#([0-9a-f]{6})$/i.exec(hex)
  if (m6)
    return `#${m6[1]}`.toLowerCase()
  const m8 = /^#([0-9a-f]{8})$/i.exec(hex)
  if (m8)
    return `#${m8[1].slice(0, 6)}`.toLowerCase() // drop alpha
  const m4 = /^#([0-9a-f]{4})$/i.exec(hex)
  if (m4) {
    // #RGBA => expand, then drop alpha
    const [r, g, b] = m4[1].slice(0, 3).split('')
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return null
}

function parseRgbString(str: string): string | null {
  const m = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/.exec(str)
  if (!m)
    return null
  const r = Number(m[1]); const g = Number(m[2]); const b = Number(m[3])
  return rgbToHex(r, g, b)
}

function parseHslString(str: string): string | null {
  const m = /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%/.exec(str)
  if (!m)
    return null
  const h = Number(m[1]); const s = Number(m[2]); const l = Number(m[3])
  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

function colorStringToHex(s: string): string | null {
  s = s.trim()
  if (s.startsWith('#'))
    return normalizeHex(s)
  if (s.startsWith('rgb'))
    return parseRgbString(s)
  if (s.startsWith('hsl'))
    return parseHslString(s)
  // As a last resort, try computed style
  try {
    const el = document.createElement('span')
    el.style.color = s as any
    document.body.appendChild(el)
    const cs = window.getComputedStyle(el).color
    document.body.removeChild(el)
    return parseRgbString(cs)
  }
  catch {
    return null
  }
}

class ColorSwatchMarker extends GutterMarker {
  constructor(readonly color: string, readonly from: number, readonly to: number) { super() }
  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement('div')
    el.className = 'cm-color-swatch'
    el.style.background = this.color
    el.title = this.color
    el.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      openColorPanel(view, this.from, this.to, this.color, el)
    }
    return el
  }
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const h = normalizeHex(hex) || '#000000'
  const r = Number.parseInt(h.slice(1, 3), 16)
  const g = Number.parseInt(h.slice(3, 5), 16)
  const b = Number.parseInt(h.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b); const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
    if (h < 0)
      h += 360
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v }
}

function hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0; let g = 0; let b = 0
  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return rgbToHex(r, g, b)
}

function openColorPanel(view: EditorView, from: number, to: number, current: string, anchorEl: HTMLElement) {
  // 将面板挂在编辑器根节点，确保 baseTheme 样式生效并限定在 CSS 编辑区
  const host = view.dom as HTMLElement
  host.classList.add('cm-editor-color-host')

  // Remove existing panel in this host
  host.querySelectorAll('.cm-color-popup').forEach(n => n.remove())

  // Compute anchor position
  const hostRect = host.getBoundingClientRect()
  const aRect = anchorEl.getBoundingClientRect()
  let left = aRect.right - hostRect.left + 8
  let top = aRect.top - hostRect.top

  // Panel DOM
  const popup = document.createElement('div')
  popup.className = 'cm-color-popup'
  popup.tabIndex = 0

  const svWrap = document.createElement('div')
  svWrap.className = 'sv-wrap'
  const sv = document.createElement('canvas')
  sv.className = 'sv'
  sv.width = 200; sv.height = 130
  const svCursor = document.createElement('div')
  svCursor.className = 'sv-cursor'
  svWrap.appendChild(sv)
  svWrap.appendChild(svCursor)

  const hueWrap = document.createElement('div')
  hueWrap.className = 'hue-wrap'
  const hue = document.createElement('canvas')
  hue.className = 'hue'
  hue.width = 14; hue.height = 130
  const hueCursor = document.createElement('div')
  hueCursor.className = 'hue-cursor'
  hueWrap.appendChild(hue)
  hueWrap.appendChild(hueCursor)

  // 颜色值输入框
  const input = document.createElement('input')
  input.type = 'text'
  input.value = colorStringToHex(current) || '#000000'
  input.className = 'hex-input'
  const hexWrap = document.createElement('div')
  hexWrap.className = 'hex-wrap'
  hexWrap.appendChild(input)

  // 按钮组
  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn-cancel'
  cancelBtn.textContent = '取消'
  const okBtn = document.createElement('button')
  okBtn.className = 'btn-ok'
  okBtn.textContent = '确定'
  const btnBar = document.createElement('div')
  btnBar.className = 'btn-bar'
  btnBar.appendChild(cancelBtn)
  btnBar.appendChild(okBtn)

  // 上方：颜色选择区域（饱和度/亮度 + 色相条）
  const colorPickerArea = document.createElement('div')
  colorPickerArea.className = 'color-picker-area'
  colorPickerArea.appendChild(svWrap)
  colorPickerArea.appendChild(hueWrap)

  // 下方：颜色值和按钮
  const controlsArea = document.createElement('div')
  controlsArea.className = 'controls-area'
  controlsArea.appendChild(hexWrap)
  controlsArea.appendChild(btnBar)

  popup.appendChild(colorPickerArea)
  popup.appendChild(controlsArea)

  // Position with overflow handling - 调整为上下布局的新尺寸
  const panelW = 280; const panelH = 240 // 宽度减小，高度增加以适应上下布局
  if (left + panelW > host.clientWidth)
    left = Math.max(0, aRect.left - hostRect.left - panelW - 8)
  if (top + panelH > host.clientHeight)
    top = Math.max(0, host.clientHeight - panelH - 10)
  popup.style.left = `${left}px`
  popup.style.top = `${top}px`

  host.appendChild(popup)

  // measure and adjust after mount (上下布局可能需要更多垂直空间)
  {
    const pr = popup.getBoundingClientRect()
    const pw = pr.width
    const ph = pr.height
    if (left + pw > host.clientWidth)
      left = Math.max(0, aRect.left - hostRect.left - pw - 8)
    if (top + ph > host.clientHeight)
      top = Math.max(0, host.clientHeight - ph - 10)
    popup.style.left = `${left}px`
    popup.style.top = `${top}px`
  }

  // ---- picker logic ----
  let hsv = (() => {
    const hex = input.value
    const { r, g, b } = hexToRgb(hex)
    return rgbToHsv(r, g, b)
  })()

  function drawSV() {
    const ctx = sv.getContext('2d')!
    ctx.clearRect(0, 0, sv.width, sv.height)
    // base hue
    ctx.fillStyle = `hsl(${hsv.h}, 100%, 50%)`
    ctx.fillRect(0, 0, sv.width, sv.height)
    // white overlay
    let grd = ctx.createLinearGradient(0, 0, sv.width, 0)
    grd.addColorStop(0, '#fff')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, sv.width, sv.height)
    // black overlay
    grd = ctx.createLinearGradient(0, 0, 0, sv.height)
    grd.addColorStop(0, 'rgba(0,0,0,0)')
    grd.addColorStop(1, '#000')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, sv.width, sv.height)
    // cursor - 使用transform居中，所以直接设置位置
    svCursor.style.left = `${hsv.s * sv.width}px`
    svCursor.style.top = `${(1 - hsv.v) * sv.height}px`
  }

  function drawHue() {
    const ctx = hue.getContext('2d')!
    for (let y = 0; y < hue.height; y++) {
      const h = (y / hue.height) * 360
      ctx.fillStyle = `hsl(${h}, 100%, 50%)`
      ctx.fillRect(0, y, hue.width, 1)
    }
    hueCursor.style.top = `${(hsv.h / 360) * hue.height}px`
  }

  function updateHexFromHSV() {
    input.value = hsvToHex(hsv.h, hsv.s, hsv.v)
  }

  function commit(nextHex: string) {
    let next = nextHex
    const rgbaAlpha = /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/i.exec(current)?.[1]
    const hslaAlpha = /hsla\([^,]+,[^,]+%,[^,]+%,\s*([\d.]+)\s*\)/i.exec(current)?.[1]
    const alpha = rgbaAlpha ?? hslaAlpha
    if (alpha != null) {
      const { r, g, b } = hexToRgb(nextHex)
      next = `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    view.dispatch({ changes: { from, to, insert: next } })
  }

  function close() { popup.remove() }

  // events
  const onSV = (ev: MouseEvent) => {
    const rect = sv.getBoundingClientRect()
    const x = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height)
    hsv.s = x / rect.width
    hsv.v = 1 - (y / rect.height)
    drawSV(); updateHexFromHSV()
  }
  const onHue = (ev: MouseEvent) => {
    const rect = hue.getBoundingClientRect()
    const y = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height)
    hsv.h = (y / rect.height) * 360
    drawSV(); drawHue(); updateHexFromHSV()
  }

  const startDrag = (_el: HTMLElement, move: (e: MouseEvent) => void) => {
    const onMove = (e: MouseEvent) => { move(e) }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  sv.addEventListener('mousedown', (e) => { onSV(e); startDrag(sv, onSV) })
  hue.addEventListener('mousedown', (e) => { onHue(e); startDrag(hue, onHue) })

  input.addEventListener('input', () => {
    const hex = colorStringToHex(input.value)
    if (!hex)
      return
    const { r, g, b } = hexToRgb(hex)
    hsv = rgbToHsv(r, g, b)
    drawSV(); drawHue()
  })

  okBtn.addEventListener('click', () => { commit(input.value); close() })
  cancelBtn.addEventListener('click', () => { close() })  // 取消按钮只关闭面板，不修改颜色

  popup.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')
      close()
    if (e.key === 'Enter') { commit(input.value); close() }
  })

  drawSV(); drawHue(); updateHexFromHSV()
  setTimeout(() => popup.focus(), 0)
}

function firstColorInLine(view: EditorView, blockInfo: any): { from: number, to: number, color: string } | null {
  const text = view.state.doc.sliceString(blockInfo.from, blockInfo.from + blockInfo.length)
  COLOR_REGEX.lastIndex = 0
  const m = COLOR_REGEX.exec(text)
  if (!m || m.index == null)
    return null
  const color = m[0]
  const start = blockInfo.from + m.index
  return { from: start, to: start + color.length, color }
}

/**
 * A gutter that shows a color swatch for lines containing a color literal.
 * Clicking the swatch opens a native color picker and updates the literal.
 */
export function colorSwatchGutter(): Extension {
  const colorGutter = gutter({
    class: 'cm-color-gutter',
    lineMarker(view, line) {
      const found = firstColorInLine(view, line)
      if (!found)
        return null
      // Use hex for swatch background if possible
      const hex = colorStringToHex(found.color) || found.color
      return new ColorSwatchMarker(hex, found.from, found.to)
    },
    initialSpacer() {
      return new ColorSwatchMarker('transparent', 0, 0)
    },
  })

  const theme = EditorView.baseTheme({
    '.cm-editor-color-host': { position: 'relative' },
    '.cm-gutter.cm-color-gutter': { width: '20px' },
    '.cm-color-swatch': {
      width: '12px',
      height: '12px',
      borderRadius: '3px',
      border: '1px solid rgba(0,0,0,0.15)',
      boxSizing: 'border-box',
      cursor: 'pointer',
      margin: '0 4px',
    },
    '.cm-color-popup': {
      position: 'absolute',
      zIndex: '50',
      background: 'white',
      color: '#111',
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: '12px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minWidth: '280px',
    },

    // 上方颜色选择区域
    '.cm-color-popup .color-picker-area': {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
    },
    '.cm-color-popup .sv-wrap': { position: 'relative', flexShrink: 0 },
    '.cm-color-popup canvas.sv': {
      display: 'block',
      width: '200px',
      height: '130px',
      borderRadius: '8px',
      border: '1px solid rgba(0,0,0,0.08)',
      cursor: 'crosshair',
    },
    '.cm-color-popup .sv-cursor': {
      position: 'absolute',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      border: '3px solid #fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
    },
    '.cm-color-popup .hue-wrap': { position: 'relative', height: '130px', flexShrink: 0 },
    '.cm-color-popup canvas.hue': {
      display: 'block',
      width: '16px',
      height: '130px',
      borderRadius: '8px',
      border: '1px solid rgba(0,0,0,0.08)',
      cursor: 'pointer',
    },
    '.cm-color-popup .hue-cursor': {
      position: 'absolute',
      left: '-3px',
      width: '22px',
      height: '6px',
      borderRadius: '3px',
      background: '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      transform: 'translateY(-50%)',
    },

    // 下方控制区域
    '.cm-color-popup .controls-area': {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    '.cm-color-popup .hex-wrap': { display: 'flex' },
    '.cm-color-popup .hex-input': {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      fontSize: '14px',
      transition: 'border-color 0.2s ease',
      outline: 'none',
    },
    '.cm-color-popup .hex-input:focus': {
      borderColor: '#3B82F6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    '.cm-color-popup .btn-bar': {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '10px',
    },
    '.cm-color-popup .btn-cancel': {
      flex: 1,
      padding: '10px 16px',
      background: 'transparent',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      color: '#6B7280',
    },
    '.cm-color-popup .btn-cancel:hover': {
      background: '#F9FAFB',
      borderColor: '#D1D5DB',
      color: '#374151',
    },
    '.cm-color-popup .btn-ok': {
      flex: 1,
      padding: '10px 16px',
      background: '#3B82F6',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
    },
    '.cm-color-popup .btn-ok:hover': {
      background: '#2563EB',
    },
  })

  return [colorGutter, theme]
}
