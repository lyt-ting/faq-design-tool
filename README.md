# FAQ 與分類設定產生器 (FAQ Category Configurator)

FAQ 與分類設定產生器是一個高效的網頁應用程式，專為 IT 服務台與知識庫維運設計。它透過直覺的圖形化介面，讓維運人員能夠輕鬆管理問題分類、子分類、聯絡窗口及 FAQ 清單，並支援即時預覽與一鍵匯出標準化交付文件。

## 📖 專案概述 (Project Overview)

本專案旨在解決 FAQ 系統設定繁瑣的問題。透過「所見即所得 (WYSIWYG)」的編輯模式，維運人員可直接觀察設定變更對前台的影響。系統支援匯入既有文件進行二次編輯，並能一鍵產生包含畫面截圖與 JSON 設定碼的 Word 交接文件，大幅提升開發與管理效率。

## ✨ 核心功能模組

### 1. 首頁與匯入 (HomePane)
* **新建專案：** 從零開始建立配置。
* **文件匯入：** 支援上傳 `.docx` 檔案，利用 `mammoth` 解析內容，自動還原分類、聯絡資訊與 FAQ 結構。

### 2. 編輯器區塊 (EditorPane)
* **大類別設定：** 管理 ID、名稱、Icon (Lucide)、主色調 (Hex) 及開發備註。
* **子類別管理：** 支援動態增刪，可靈活開啟/關閉子分類階層。
* **聯絡窗口設定：** 依據是否有子分類，自動切換綁定邏輯（大類別 vs 子類別獨立窗口）。
* **FAQ 編列：** 動態新增問題與內文，支援依據子分類進行篩選配置。

### 3. 即時預覽區塊 (PreviewPane)
* **高擬真渲染：** 實時呈現編輯結果。
* **互動體驗：** 支援層級展開、子類別高亮顯示（採用 15% 透明度主色調），並具備自動過濾顯示功能。

### 4. 匯出產出物 (ExportButton)
* **一鍵匯出：** 利用 `html-to-image` 截取預覽畫面，結合 `docx` 套件產出技術規格書。
* **交付內容：** 包含畫面截圖、JSON 設定碼（按分類整理的 categories、contacts、FAQ 資料），供 IT 人員直接匯入使用。

## 🛠 技術規格 (Technical Specifications)

* **核心框架：** React 18 + TypeScript + Vite
* **樣式排版：** Tailwind CSS + 自定義 `faq-preview.css`
* **圖示庫：** Lucide React
* **處理套件：** * `docx` (Word 生成)
    * `html-to-image` (畫面截圖)
    * `mammoth` (Word 解析與匯入)
* **動畫效果：** TailwindCSS 內建 Transition/Animate

## 📊 資料結構 (Types)

```typescript
// 聯絡窗口配置
export type ContactConfig = {
  id: string;
  targetId: string; // 'main' 或 對應子類別 ID
  title: string;
  desc: string;
};

// 分類與子分類配置
export type CategoryConfig = {
  id: string;
  name: string;
  icon: string;
  color: string;
  comment: string;
  hasSubcategories: boolean;
  subcategories: { id: string; name: string; icon: string }[];
  contacts: ContactConfig[];
};

// 問答項目
export type FaqItem = {
  id: string;
  sub: string; // 隸屬的子分類 ID
  title: string;
  content: string;
};