import React, { useRef } from 'react';
import { BookOpen, PlusCircle, Upload, FileText } from 'lucide-react';
import { CategoryConfig, FaqItem } from '../types';
import mammoth from 'mammoth';

interface HomePaneProps {
  setActiveTab: (tab: 'home' | 'category' | 'faq') => void;
  setCategory: React.Dispatch<React.SetStateAction<CategoryConfig>>;
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
  onInstructionsClick: () => void;
}

export const HomePane: React.FC<HomePaneProps> = ({ setActiveTab, setCategory, setFaqs, onInstructionsClick }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      // Extract JSON inside arrays/objects
      // The word document has categories.json array, contacts.json object, and faqs.json array
      // It looks like:
      // [
      //    { ...category... }
      // ]
      // { ...contact... }
      // [
      //    { ...faq1... },
      //    { ...faq2... }
      // ]
      
      const jsonBlocks = [];
      let currentIdx = 0;
      
      // Naive parsing: try to find [... ] and { ... }
      // Use regex to carefully extract json blocks
      const parseJsonMultiple = (str: string) => {
        const blocks: any[] = [];
        let cur = "";
        let inString = false;
        let bracketCount = 0;
        let squareCount = 0;
        let started = false;

        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '"' && str[i - 1] !== '\\') inString = !inString;

          if (!inString) {
            if (char === '{') { bracketCount++; started = true; }
            if (char === '}') { bracketCount--; }
            if (char === '[') { squareCount++; started = true; }
            if (char === ']') { squareCount--; }
          }

          if (started) {
            cur += char;
            if (bracketCount === 0 && squareCount === 0) {
              try {
                blocks.push(JSON.parse(cur));
              } catch (e) {
                // Ignore parsing errors for partial/malformed text
              }
              cur = "";
              started = false;
            }
          }
        }
        return blocks;
      };

      const blocks = parseJsonMultiple(text);
      
      if (blocks.length >= 2) {
        let catList: any[] = [];
        let contact: any = null;
        let faqList: any[] = [];

        catList = Array.isArray(blocks[0]) ? blocks[0] : [blocks[0]];
        
        for (let i = 1; i < blocks.length; i++) {
          if (Array.isArray(blocks[i])) {
            faqList.push(...blocks[i]);
          } else if (contact === null && i === 1) {
            contact = blocks[i];
          }
        }

        const catData = catList[0];
        if (catData) {
          const subCatsRaw = catData.children || catData.subCategories || catData.subcategories || [];
          const subCats = subCatsRaw.map((sub: any, i: number) => ({
             ...sub,
             id: (!sub.id || sub.id === '留空') ? `sub-${Date.now()}-${i}` : sub.id
          }));
          
          const newContacts: any[] = [];
          if (contact && typeof contact === 'object' && !Array.isArray(contact)) {
            Object.entries(contact).forEach(([key, val]: [string, any], idx) => {
               if (typeof val === 'object' && val !== null) {
                 let targetId = 'main';
                 if (key.includes('子分類_')) {
                    const subMatch = key.match(/子分類_(.*?)\(id\)/) || key.match(/子分類_(.*?)_英文ID留空/) || key.match(/子分類_(.*)/);
                    const parsedSubName = subMatch ? subMatch[1] : '';
                    const matchedSub = subCats.find((s: any) => s.name === parsedSubName);
                    if (matchedSub) {
                      targetId = matchedSub.id;
                    } else if (subCats.length > 0) {
                      // Fallback: match by index or just grab first if names mismatch but we know it's a sub
                      targetId = subCats[0].id;
                    }
                 } else if (key.includes('大分類_')) {
                    targetId = 'main';
                 }
                 
                 newContacts.push({
                    id: `contact-imported-${idx}`,
                    targetId,
                    title: val.title || '',
                    desc: val.desc ? val.desc : (Array.isArray(val.items) ? val.items.map((it: any) => `${it.label || ''} ${it.value || ''}`).join('\n').trim() : '')
                 });
               }
            });
          }

          const newCategory: CategoryConfig = {
            id: catData.id || 'imported',
            name: catData.label || catData.name || '',
            icon: catData.icon || 'monitor',
            color: catData.color || '#3b82f6',
            comment: catData.comment || '',
            hasSubcategories: !!(subCats && subCats.length > 0),
            subcategories: subCats,
            contacts: newContacts
          };
          
          setCategory(newCategory);
        }

        if (faqList && faqList.length > 0) {
           const newFaqs: FaqItem[] = faqList.map((f: any, i: number) => {
             let parsedSub = '';
             if (f.category && typeof f.category === 'string') {
               const match = f.category.match(/[(（]([^)）]+)[)）]/);
               if (match) {
                 parsedSub = match[1];
               }
             }
             return {
              id: (!f.id || f.id === '留空') ? `q-${Date.now()}-${i+1}` : f.id,
              category: catData?.name || catData?.label || 'default',
              sub: parsedSub,
              middle: f.sub || '',
              minor: f.minor || '',
              question: f.question || '',
              answerType: f.answerType || 'text',
              answer: f.answer || '',
              answerContent: f.answerContent || [],
              files: f.files || []
             };
           });
           setFaqs(newFaqs);
        }
        
        alert("匯入成功！");
        setActiveTab('category');
      } else {
        alert("無法從檔案中解析完整的設定內容，請確認匯入的 Word 檔案格式是否正確。");
      }
    } catch (e) {
      console.error(e);
      alert("讀取檔案失敗：" + e);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-12 bg-slate-50 relative"
      style={{
        backgroundImage: 'url(bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">歡迎使用 FAQ 設計小幫手</h1>
          <p className="text-lg text-slate-500">輕鬆管理、編輯並匯出您的常見問題設定</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 操作說明 */}
          <button 
            onClick={onInstructionsClick}
            className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 group"
          >
            <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">操作說明</h3>
            <p className="text-sm text-slate-500">了解如何使用分類設定與問答編輯，包含 Lucide Icon 的使用方式</p>
          </button>

          {/* 從0開始 */}
          <button 
            onClick={() => setActiveTab('category')}
            className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:indigo-300 transition-all duration-200 group"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
              <PlusCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">從 0 開始</h3>
            <p className="text-sm text-slate-500">建立全新的分類與問答項目</p>
          </button>

          {/* 匯入舊檔 */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:emerald-300 transition-all duration-200 group relative"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">匯入舊檔</h3>
            <p className="text-sm text-slate-500">匯入之前設定並匯出的 Word 檔案即可接續編輯</p>
            <input 
              type="file" 
              accept=".docx" 
              ref={fileInputRef} 
              onChange={handleImportWord} 
              className="hidden" 
            />
          </button>
        </div>
      </div>
    </div>
  );
};
