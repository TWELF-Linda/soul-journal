# 🌸 心靈日記 SoulNote

AI 身心靈日記 + 娛樂紀錄 App，跨裝置免費使用。

## ✨ 功能

- 🤖 **AI 每日提問** — Claude AI 每天生成3個不同問題引導你反思
- 📝 **日記總結** — AI 根據回答生成溫柔的日記總結，含情緒標記
- 🎫 **票根式娛樂紀錄** — 以票根形式呈現，點擊展開完整資訊
- 🎭 **6種內建類型** — Anime、Book、Drama、Musical、Movie、Variety Show
- ✏️ **自訂類型與欄位** — 可建立 Concert、Podcast 等任意類型，自由增刪欄位
- 📷 **圖片上傳** — 透過 Imgur 免費上傳封面/海報至雲端
- ☁️ **跨裝置同步** — 透過 GitHub Gist 免費同步所有資料（含自訂類型）
- 📊 **統計分析** — 心情走勢圖、娛樂品味分析、AI月度報告

## 🎫 娛樂紀錄功能說明

### 票根清單
- 每筆紀錄以票根形式呈現：封面/海報 + 鋸齒撕線 + 標題、類型、日期
- 評分顯示於票根右上角（★★★★☆）
- 點擊票根展開完整資訊，再點收起

### 自訂類型
1. 篩選列點「＋ 自訂類型」
2. 設定名稱、圖示（16種）、顏色（8種）、預設欄位
3. 建立後立即可使用，並同步至雲端

### 自訂欄位
- 新增/編輯紀錄時，展開「編輯此類型的欄位」
- 可改名、新增、刪除欄位，變更會套用到該類型的所有後續紀錄

## 🚀 部署步驟（5分鐘完成）

### 第一步：Fork 此專案
點右上角 **Fork** 按鈕，複製到你的 GitHub 帳號。

### 第二步：啟用 GitHub Pages
1. 進入你 Fork 的 repo → **Settings**
2. 左側選 **Pages**
3. Source 選 **GitHub Actions**
4. 等幾分鐘，App 自動部署完成

### 第三步：取得免費 API Keys

#### Claude API Key（AI 日記功能）
前往 [console.anthropic.com](https://console.anthropic.com)，建立帳號取得 Key（新帳號有免費額度）

#### Imgur Client ID（圖片上傳）
前往 [api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)，Authorization type 選 **Anonymous usage**

#### GitHub Token（跨裝置同步）
前往 [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token，勾選 **gist** 權限

### 第四步：開啟你的 App
網址：`https://你的帳號.github.io/soul-journal`

點右上角 ⚙️ 設定，填入 API Keys → 點 ☁️ 同步，Gist ID 自動建立

### 第五步：跨裝置使用
任何裝置開啟同一網址，填入同樣的 Token 和 Gist ID，資料自動同步！

## 本地開發

```bash
npm install
npm run dev
```

## 技術架構

| 功能 | 技術 | 費用 |
|------|------|------|
| 部署 | GitHub Pages | 免費 |
| AI 日記 | Anthropic Claude API | 按量付費 |
| 圖片上傳 | Imgur API | 免費 |
| 資料同步 | GitHub Gist API | 免費 |
| 前端框架 | React + Vite | 免費 |
