/**
 * 桌面端桥接工具
 * 负责网页版与桌面版之间的通信
 */

export interface DesktopBridgeOptions {
  scheme?: string
  timeout?: number
  downloadUrl?: string
}

export class DesktopBridge {
  private scheme: string
  private timeout: number
  private downloadUrl: string

  constructor(options: DesktopBridgeOptions = {}) {
    this.scheme = options.scheme || 'welight://'
    this.timeout = options.timeout || 2000
    this.downloadUrl = options.downloadUrl || 'https://waer.ltd/download'
  }

  /**
   * 检测桌面应用是否安装
   */
  async isDesktopAppInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = this.scheme + 'ping'
      
      let isInstalled = false
      let resolved = false
      
      // 监听页面失焦（表示应用已打开）
      const onBlur = () => {
        if (!resolved) {
          isInstalled = true
          resolved = true
          resolve(true)
        }
      }
      
      // 监听页面聚焦（可能表示应用未安装）
      const onFocus = () => {
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve(isInstalled)
          }
        }, 100)
      }
      
      window.addEventListener('blur', onBlur)
      window.addEventListener('focus', onFocus)
      document.body.appendChild(iframe)
      
      setTimeout(() => {
        window.removeEventListener('blur', onBlur)
        window.removeEventListener('focus', onFocus)
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
        if (!resolved) {
          resolved = true
          resolve(isInstalled)
        }
      }, this.timeout)
    })
  }

  /**
   * 在桌面版中打开编辑器
   * @param content - Markdown 内容
   * @param filename - 文件名（可选）
   */
  async openInDesktop(content: string, filename?: string): Promise<boolean> {
    try {
      // 构建 URL 参数
      const params = new URLSearchParams({
        page: 'edit'
      })
      
      // 如果内容不为空，添加内容参数
      if (content.trim()) {
        // 对内容进行 Base64 编码以避免 URL 长度限制和特殊字符问题
        const encodedContent = btoa(encodeURIComponent(content))
        params.set('content', encodedContent)
      }
      
      // 如果有文件名，添加文件名参数
      if (filename) {
        params.set('filename', filename)
      }
      
      const url = `${this.scheme}open?${params.toString()}`
      
      // 尝试打开桌面应用
      window.location.href = url
      
      // 检查是否成功打开（简化版本，直接返回 true）
      // 在实际使用中，可以通过监听页面失焦来判断
      return true
    } catch (error) {
      console.error('Failed to open desktop app:', error)
      return false
    }
  }

  /**
   * 显示下载提示对话框
   */
  showDownloadDialog(): void {
    // 创建模态对话框
    const modal = document.createElement('div')
    modal.className = 'desktop-bridge-modal'
    modal.innerHTML = `
      <div class="desktop-bridge-overlay">
        <div class="desktop-bridge-dialog">
          <div class="desktop-bridge-header">
            <h3>未检测到 Welight 桌面版</h3>
          </div>
          <div class="desktop-bridge-content">
            <p>要在桌面版中编辑，请先下载安装 Welight 桌面版。</p>
            <p>桌面版提供更强大的功能和更好的编辑体验。</p>
          </div>
          <div class="desktop-bridge-actions">
            <button class="desktop-bridge-btn desktop-bridge-btn-primary" onclick="window.open('${this.downloadUrl}', '_blank')">
              下载桌面版
            </button>
            <button class="desktop-bridge-btn desktop-bridge-btn-secondary" onclick="this.closest('.desktop-bridge-modal').remove()">
              取消
            </button>
          </div>
        </div>
      </div>
    `
    
    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .desktop-bridge-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      
      .desktop-bridge-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .desktop-bridge-dialog {
        background: white;
        border-radius: 8px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
      
      .desktop-bridge-header {
        padding: 20px 20px 0;
      }
      
      .desktop-bridge-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
      }
      
      .desktop-bridge-content {
        padding: 15px 20px;
      }
      
      .desktop-bridge-content p {
        margin: 0 0 10px;
        color: #666;
        line-height: 1.5;
      }
      
      .desktop-bridge-content p:last-child {
        margin-bottom: 0;
      }
      
      .desktop-bridge-actions {
        padding: 0 20px 20px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      
      .desktop-bridge-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .desktop-bridge-btn-primary {
        background: #007bff;
        color: white;
      }
      
      .desktop-bridge-btn-primary:hover {
        background: #0056b3;
      }
      
      .desktop-bridge-btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .desktop-bridge-btn-secondary:hover {
        background: #545b62;
      }
      
      @media (prefers-color-scheme: dark) {
        .desktop-bridge-dialog {
          background: #2d2d2d;
        }
        
        .desktop-bridge-header h3 {
          color: #ffffff;
        }
        
        .desktop-bridge-content p {
          color: #cccccc;
        }
      }
    `
    
    document.head.appendChild(style)
    document.body.appendChild(modal)
    
    // 点击遮罩层关闭
    modal.querySelector('.desktop-bridge-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.remove()
        style.remove()
      }
    })
  }

  /**
   * 尝试在桌面版中打开，如果失败则显示下载提示
   * @param content - Markdown 内容
   * @param filename - 文件名（可选）
   */
  async tryOpenInDesktop(content: string, filename?: string): Promise<void> {
    const success = await this.openInDesktop(content, filename)
    
    if (!success) {
      this.showDownloadDialog()
    } else {
      // 延迟检查是否真的打开了桌面应用
      setTimeout(async () => {
        const isInstalled = await this.isDesktopAppInstalled()
        if (!isInstalled) {
          this.showDownloadDialog()
        }
      }, 1000)
    }
  }
}

// 创建默认实例
export const desktopBridge = new DesktopBridge()

// 导出便捷方法
export const openInDesktop = (content: string, filename?: string) => {
  return desktopBridge.tryOpenInDesktop(content, filename)
}
