document.addEventListener('DOMContentLoaded', () => {
    const shareId = new URLSearchParams(window.location.search).get('id');
    if (!shareId) {
        showError('分享ID不能为空');
        return;
    }

    // 使用chrome.storage.local获取分享数据
    chrome.storage.local.get(['deepseek-shares'], (result) => {
        try {
            const shares = result['deepseek-shares'] || {};
            const shareData = shares[shareId];

            if (!shareData) {
                showError('分享不存在或已过期');
                return;
            }

            showContent(shareData);
        } catch (error) {
            console.error('Failed to fetch share:', error);
            showError('获取分享内容失败');
        }
    });
});

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'block';
    errorEl.textContent = message;
}

function showContent(share) {
    document.getElementById('loading').style.display = 'none';
    const contentEl = document.getElementById('content');
    contentEl.style.display = 'block';

    document.getElementById('title').textContent = share.title;

    const messagesEl = document.getElementById('messages');
    share.conversation.messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`;
        
        const roleEl = document.createElement('div');
        roleEl.className = 'role';
        
        // 移除 SVG，直接显示文本
        if (message.role === 'user') {
            roleEl.textContent = '我';
        } else {
            roleEl.textContent = 'DeepSeek';
        }
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content markdown-content';
        
        // 根据消息类型设置不同的样式
        if (message.role === 'assistant') {
            // 检查内容是否包含特定的类
            if (message.content.includes('a6d716f5')) {
                contentEl.className += ' rounded-box';
            }
            if (message.content.includes('e1675d8b')) {
                contentEl.className += ' gray-text';
            }
        }
        
        // 移除可能存在的 SVG 标签
        let cleanContent = message.content.replace(/<svg[^>]*>.*?<\/svg>/g, '');
        contentEl.innerHTML = cleanContent;
        
        messageEl.appendChild(roleEl);
        messageEl.appendChild(contentEl);
        messagesEl.appendChild(messageEl);
    });

    document.getElementById('timestamp').textContent = 
        `分享时间：${new Date(share.createdAt).toLocaleString('zh-CN')}`;
} 