let isRequesting = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 20;

const API_URL = "https://your_domain.com/api/deepseek-share";  // 替换为你的实际API地址

function init() {
  console.log("DeepSeek Share Extension initialized");
  
  setTimeout(async () => {
    try {
      // 首先尝试通过特定类名查找
      const selectors = [
        '.bf38813a',
        'form textarea',
        '.chat-input',
        '[class*="chat-input"]',
        '[role="textbox"]',
        '[contenteditable="true"]'
      ];
      
      // 添加备用查找方法
      const findInputElement = () => {
        // 查找包含 @ 符号的 div
        const atSymbolDivs = Array.from(document.querySelectorAll('div')).filter(div => 
          div.textContent.includes('@') && 
          div.children.length === 0 && 
          div.parentElement?.children.length >= 2
        );
        
        // 如果找到 @ 符号的 div，返回其父元素
        if (atSymbolDivs.length > 0) {
          return atSymbolDivs[0].parentElement;
        }
        return null;
      };
      
      // 首先尝试使用选择器
      for (const selector of selectors) {
        try {
          const element = await waitForElement(selector);
          if (element) {
            console.log("Chat interface loaded with selector:", selector);
            const shareButton = createShareButton();
            initializeShareButton(shareButton);
            return;
          }
        } catch (error) {
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }
      
      // 如果选择器都失败了，尝试备用方法
      const inputElement = findInputElement();
      if (inputElement) {
        console.log("Chat interface found using backup method");
        const shareButton = createShareButton();
        initializeShareButton(shareButton);
        return;
      }
      
      throw new Error("无法找到聊天输入框");
    } catch (error) {
      console.error("Failed to initialize share button:", error);
    }
  }, 3000);
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }
      
      requestAnimationFrame(checkElement);
    }
    
    checkElement();
  });
}

function initializeShareButton(shareButton) {
  // 尝试找到输入框容器
  const inputContainer = document.querySelector('.bf38813a');
  if (!inputContainer) {
    console.error("无法找到输入框容器");
    return;
  }

  // 如果找到了容器并且还没有分享按钮
  if (!document.getElementById("deepseek-share-button")) {
    console.log("找到按钮容器，插入分享按钮");
    // 将按钮插入到输入框容器的前面
    inputContainer.parentNode.insertBefore(shareButton, inputContainer);
  }

  // 修改点击事件处理
  shareButton.addEventListener("click", async () => {
    if (isRequesting) return;
    isRequesting = true;
    const originalHTML = shareButton.innerHTML;
    shareButton.innerHTML = '<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>';
    shareButton.style.cursor = "wait";

    try {
      const conversationData = extractConversation();
      const shareId = Math.random().toString(36).substring(2, 12);
      
      const shareData = {
        shareId,
        title: conversationData.conversation.metadata.title || '未命名对话',
        conversation: conversationData.conversation,
        createdAt: new Date().toISOString()
      };
      
      // 发送数据到后端API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData)
      });

      if (!response.ok) {
        throw new Error('保存分享数据失败');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '保存分享数据失败');
      }
      
      // 创建一个模态对话框来显示分享链接
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 480px;
        width: 90%;
        position: relative;
        animation: modalSlideIn 0.3s ease-out;
      `;

      // 添加动画样式
      const style = document.createElement('style');
      style.textContent = `
        @keyframes modalSlideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);

      const shareUrl = chrome.runtime.getURL(`share.html?id=${shareId}`);
      
      modalContent.innerHTML = `
        <div style="position: absolute; right: 16px; top: 16px;">
          <button id="close-share-modal" style="
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: #6B7280;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">分享对话</h3>
          <p style="margin: 0; color: #6B7280; font-size: 14px;">复制以下链接，与他人分享这段对话</p>
        </div>
        <div style="
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        ">
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <input type="text" value="${shareUrl}" readonly style="
              flex: 1;
              padding: 10px 12px;
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              font-size: 14px;
              color: #374151;
              background: white;
            ">
            <button id="copy-share-link" style="
              padding: 10px 16px;
              background: #4F46E5;
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              min-width: 80px;
            ">复制</button>
          </div>
          <p style="margin: 0; color: #6B7280; font-size: 13px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; position: relative; top: 2px; margin-right: 4px;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            链接在浏览器关闭后将失效，请及时保存
          </p>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // 添加复制和关闭功能
      const copyButton = modalContent.querySelector('#copy-share-link');
      const closeButton = modalContent.querySelector('#close-share-modal');
      const input = modalContent.querySelector('input');
      
      copyButton.addEventListener('click', () => {
        input.select();
        document.execCommand('copy');
        copyButton.innerHTML = '已复制 ✓';
        copyButton.style.background = '#059669';
        setTimeout(() => {
          copyButton.innerHTML = '复制';
          copyButton.style.background = '#4F46E5';
        }, 2000);
      });
      
      // 添加按钮悬停效果
      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.opacity = '0.9';
      });
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.opacity = '1';
      });

      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = '#F3F4F6';
      });
      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'none';
      });

      // 点击模态框外部关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });

      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
    } catch (error) {
      console.error("分享失败:", error);
      alert(`分享失败: ${error.message}`);
    } finally {
      shareButton.innerHTML = originalHTML;
      shareButton.style.cursor = "pointer";
      isRequesting = false;
    }
  });
}

function extractConversation() {
  // 使用正确的对话容器类名
  const conversationContainer = document.querySelector('.dad65929');
  if (!conversationContainer) {
    throw new Error("无法找到对话内容容器");
  }

  // 直接获取所有子元素
  const allElements = Array.from(conversationContainer.children);
  console.log("所有子元素:", allElements.map(el => el.className));

  // 过滤掉非消息元素（比如分割线、加载指示器等）
  const messageElements = allElements.filter(element => {
    const classNames = element.className;
    const isValidMessage = classNames === 'fa81' || classNames.includes('f9bf7997 c05b5566');
    console.log("检查元素类名:", classNames, "是否为有效消息:", isValidMessage);
    return isValidMessage;
  });

  if (messageElements.length === 0) {
    throw new Error("无法找到消息元素");
  }

  console.log("找到消息元素数量:", messageElements.length);
  console.log("消息元素:", messageElements.map(el => ({
    className: el.className,
    isUser: el.classList.contains('fa81'),
    hasMarkdown: !!el.querySelector('.ds-markdown.ds-markdown--block'),
    content: el.innerHTML.substring(0, 100) + '...'
  })));

  const messages = [];
  messageElements.forEach((element, index) => {
    // 使用类名判断是否为用户消息
    const isUserMessage = element.classList.contains('fa81');
    console.log(`处理第 ${index + 1} 个消息:`, {
      isUser: isUserMessage,
      className: element.className
    });
    
    if (isUserMessage) {
      // 用户消息
      const markdownContent = element.querySelector('.ds-markdown.ds-markdown--block');
      console.log("用户消息 Markdown 内容:", !!markdownContent);
      const content = markdownContent ? markdownContent.innerHTML : element.innerHTML;
      
      if (content && content.trim()) {
        messages.push({
          role: "user",
          content: content,
          timestamp: new Date().toISOString()
        });
        console.log("成功添加用户消息");
      }
    } else {
      // DeepSeek 消息，需要处理不同类型的内容
      let messageContent = [];
      
      // 处理圆角框内容
      const roundedBoxes = element.querySelectorAll('.a6d716f5');
      console.log("找到圆角框数量:", roundedBoxes.length);
      roundedBoxes.forEach(box => {
        messageContent.push(`<div class="rounded-box">${box.innerHTML}</div>`);
      });
      
      // 处理灰色文本内容
      const grayTexts = element.querySelectorAll('.e1675d8b');
      console.log("找到灰色文本数量:", grayTexts.length);
      grayTexts.forEach(text => {
        messageContent.push(`<div class="gray-text">${text.innerHTML}</div>`);
      });
      
      // 处理 Markdown 内容
      const markdownContents = element.querySelectorAll('.ds-markdown.ds-markdown--block');
      console.log("找到 Markdown 内容数量:", markdownContents.length);
      markdownContents.forEach(markdown => {
        messageContent.push(`<div class="markdown-content">${markdown.innerHTML}</div>`);
      });
      
      // 如果没有找到任何特定内容，使用整个元素的内容
      if (messageContent.length === 0) {
        console.log("未找到特定内容，使用整个元素内容");
        messageContent.push(element.innerHTML);
      }
      
      const content = messageContent.join('\n');
      if (content && content.trim()) {
        messages.push({
          role: "assistant",
          content: content,
          timestamp: new Date().toISOString()
        });
        console.log("成功添加 DeepSeek 消息");
      }
    }
  });

  if (messages.length === 0) {
    throw new Error("未找到任何有效的消息内容");
  }

  console.log("最终提取的消息:", messages.map(m => ({
    role: m.role,
    contentLength: m.content.length,
    preview: m.content.substring(0, 100) + '...'
  })));

  return {
    conversation: {
      messages,
      metadata: {
        title: document.title,
        timestamp: new Date().toISOString()
      }
    }
  };
}

function createShareButton() {
  const button = document.createElement("button");
  button.id = "deepseek-share-button";
  button.className = "share-button";
  button.setAttribute("type", "button");
  button.setAttribute("title", "分享对话");
  
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 10px;
    margin-right: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 14px;
    background-color: #fff;
    color: #4c4c4c;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: var(--ds-font-size-m, 14px);
    line-height: var(--ds-line-height-m, 25px);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 16px; height: 16px; margin-right: 4px;">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
    <span>分享</span>
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#E0E4ED';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#fff';
  });
  
  return button;
}

// 初始化扩展
if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init);
} 