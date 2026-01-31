/**
 * 🚀 微信公众号 API 对接模块
 */
class WechatAPI {
    constructor(appId, appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.accessToken = '';
        this.expireTime = 0;
    }

    /**
     * 获取 Access Token (带简单缓存)
     */
    async getAccessToken() {
        // 检查缓存是否有效 (提前 5 分钟刷新)
        if (this.accessToken && Date.now() < this.expireTime - 300000) {
            return this.accessToken;
        }

        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;

        try {
            const response = await requestUrl({ url });
            const data = response.json;

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.expireTime = Date.now() + (data.expires_in * 1000);
                return this.accessToken;
            } else {
                throw new Error(`获取 Token 失败: ${data.errmsg || '未知错误'} (错误码: ${data.errcode})`);
            }
        } catch (error) {
            console.error('WechatAPI Auth Error:', error);
            throw error;
        }
    }

    /**
     * 上传图片到微信素材库 (用于封面，返回 media_id)
     * @param {Blob} blob 图片二进制数据
     */
    async uploadCover(blob) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

        // 注意：微信 API 需要 multipart/form-data
        // 在 Obsidian 环境中发送 multipart 请求稍微有些复杂
        // 通常需要使用 FormData 或手动拼接
        return await this.uploadMultipart(url, blob, 'media');
    }

    /**
     * 上传图片到微信 CDN (用于正文内容，返回 URL)
     * @param {Blob} blob 图片二进制数据
     */
    async uploadImage(blob) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;

        return await this.uploadMultipart(url, blob, 'media');
    }

    /**
     * 创建草稿
     */
    async createDraft(article) {
        const token = await this.getAccessToken();
        const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

        const payload = {
            articles: [article]
        };

        const response = await requestUrl({
            url,
            method: 'POST',
            body: JSON.stringify(payload),
            contentType: 'application/json'
        });

        const data = response.json;
        if (data.item_id || data.article_id) {
            return data;
        } else {
            throw new Error(`创建草稿失败: ${data.errmsg} (${data.errcode})`);
        }
    }

    /**
     * 简化的 multipart 上传实现 (适配 Obsidian requestUrl)
     */
    async uploadMultipart(url, blob, fieldName) {
        // 这是一个技术难点：Obsidian 的 requestUrl 对 FormData 支持有限
        // 我们可能需要使用原生的 fetch
        const formData = new FormData();
        formData.append(fieldName, blob, 'image.jpg');

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.media_id || data.url) {
            return data;
        } else {
            throw new Error(`图片上传失败: ${data.errmsg} (${data.errcode})`);
        }
    }
}

module.exports = WechatAPI;
