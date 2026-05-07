import React, { useState } from 'react';
import { Monitor, Smartphone, icons, ChevronLeft, ChevronRight } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '1. 認識主要介面',
      desc: '系統分為「分類設定」與「問答編輯」兩個主要區域。您可以隨時在頂部標籤切換頁籤。',
      mock: (
        <div className="flex w-full h-[300px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
           <div className="w-1/2 bg-white flex flex-col">
             <div className="relative mx-2 mt-2">
                {/* Highlight tabs */}
                <div className="absolute -inset-1 border-4 border-amber-400 rounded-lg animate-pulse z-10 pointer-events-none" />
                <div className="flex gap-4 px-2 pt-2 pb-1 border-b relative z-20 bg-white bg-opacity-80">
                  <span className="font-bold text-sky-600 border-b-2 border-sky-500 pb-1">分類設定</span>
                  <span className="text-slate-400 pb-1">問答編輯</span>
                </div>
             </div>
             <div className="p-4 space-y-4">
               <div className="space-y-2">
                 <div className="h-3 w-16 bg-slate-200 rounded" />
                 <div className="h-8 w-full bg-slate-50 border border-slate-200 rounded flex items-center px-2 text-xs text-slate-400">#0ea5e9</div>
               </div>
               <div className="space-y-2">
                 <div className="h-3 w-20 bg-slate-200 rounded" />
                 <div className="h-8 w-full bg-slate-50 border border-slate-200 rounded flex items-center px-2 text-xs text-slate-400">資訊服務台</div>
               </div>
             </div>
           </div>
           <div className="w-1/2 bg-slate-50 flex items-center justify-center p-4">
             <div className="w-full h-full bg-white rounded shadow-sm flex items-center justify-center text-slate-400 font-medium">
                即時預覽區
             </div>
           </div>
        </div>
      )
    },
    {
      title: '2. 分類設定 與 Lucide 圖示',
      desc: '在分類設定中，您可以指定「圖示」。請至 Lucide 官網，搜尋喜歡的圖案後，複製其英文名稱（如 monitor）填入即可。',
      mock: (
        <div className="w-full h-[300px] bg-white rounded-lg border border-slate-200 p-6 flex flex-col items-center justify-center space-y-6 relative">
          <div className="w-full max-w-sm space-y-1 relative pr-20">
             <div className="absolute -inset-4 border-4 border-amber-400 rounded-xl animate-pulse z-10 pointer-events-none" />
             <label className="text-sm font-bold text-slate-700 relative z-20">分類圖示 (Lucide Icon)</label>
             <input type="text" value="monitor" readOnly className="w-full p-2 border border-slate-300 rounded-lg text-slate-500 relative z-20" />
             <div className="absolute right-0 top-6 w-16 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-sky-500 z-20">
               <Monitor size={24} />
             </div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
             <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-sky-600 underline">👉 點此前往 Lucide 官網挑選</a>
          </div>
        </div>
      )
    },
    {
      title: '3. 問答編輯 與 拖曳排序',
      desc: '在「問答編輯」中，您可以新增題目、編輯回答，並且使用按鈕將題目上下移動來排序。',
      mock: (
        <div className="w-full h-[300px] bg-slate-50 rounded-lg border border-slate-200 p-6 overflow-hidden relative flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm relative">
             <span className="font-bold text-slate-700 text-sm z-20 relative">問題 1 (q-001)</span>
             <div className="relative">
               <div className="absolute -inset-1 border-4 border-amber-400 rounded-lg animate-pulse z-10 pointer-events-none" />
               <button className="px-3 py-1 bg-sky-500 text-white rounded text-sm relative z-20">+ 新增問答</button>
             </div>
          </div>
          
          <div className="bg-white border text-left border-slate-200 shadow-sm rounded-xl p-3 flex flex-col gap-2 relative">
             <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-center gap-1 z-20">
                 <div className="absolute -inset-1 border-4 border-amber-400 rounded-lg animate-pulse z-10 pointer-events-none" />
                 <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400 relative z-20">▲</div>
                 <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400 relative z-20">▼</div>
             </div>
             <div className="flex items-center gap-2 ml-10">
               <span className="font-bold text-slate-700 text-sm">如何重設密碼？</span>
             </div>
             <div className="text-sm text-slate-500 ml-10 mt-2 bg-slate-50 p-2 rounded">
                 請點擊...
             </div>
          </div>
        </div>
      )
    },
    {
      title: '4. 回答內容：一般文字 vs 進階圖文',
      desc: '回答內容可選「一般純文字」快速輸入；或啟用「進階圖文」來加入多個文字段落、重點文字 (可用 **粗體** 或 [[高亮文字色]])，甚至插入輔助圖片。',
      mock: (
        <div className="w-full h-[300px] bg-slate-50 flex items-center justify-center gap-4 p-6 rounded-lg border border-slate-200">
           <div className="w-1/2 h-full bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3 shadow-sm relative">
             <div className="flex items-center justify-between">
               <span className="font-bold text-slate-700 text-sm">一般純文字</span>
             </div>
             <div className="flex-1 bg-slate-50 border border-slate-200 rounded flex flex-col p-3">
               <div className="h-2 w-full bg-slate-200 rounded mb-2" />
               <div className="h-2 w-3/4 bg-slate-200 rounded" />
             </div>
           </div>
           
           <div className="w-1/2 h-full bg-white border-2 border-sky-400 rounded-lg p-4 flex flex-col gap-3 shadow-sm relative">
             <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">進階模式</div>
             <div className="flex items-center justify-between mt-1">
               <span className="font-bold text-slate-700 text-sm">進階圖文</span>
             </div>
             <div className="flex flex-col gap-2 flex-1 overflow-hidden">
               <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-500 flex flex-wrap gap-1 items-center">
                 <span>輸入</span><span className="bg-slate-200 px-1 rounded text-slate-700 font-bold">**重點**</span><span>與</span><span className="text-sky-500 font-bold">[[高亮]]</span>
               </div>
               <div className="flex-1 min-h-[60px] border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                 <Monitor size={16} className="mb-1 opacity-50"/>
                 <span className="text-[10px]">圖片</span>
               </div>
             </div>
           </div>
        </div>
      )
    },
    {
      title: '5. 匯出與提交',
      desc: '當一切設定與預覽皆符合預期時，請點擊右上角的「匯出 Word 檔」。產出的文件內將包含對應的 JSON 設定與預覽圖片，可直接提供給開發人員。',
      mock: (
        <div className="w-full h-[300px] bg-slate-100 rounded-lg border border-slate-200 flex flex-col">
           <div className="h-16 bg-white border-b flex justify-between items-center px-6 relative">
              <span className="font-bold text-slate-500">FAQ 建置工具</span>
              <div className="relative">
                <div className="absolute -inset-1 border-4 border-amber-400 rounded-lg animate-pulse z-10 pointer-events-none" />
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 relative z-20">
                   匯出 Word 檔
                </button>
              </div>
           </div>
           <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Monitor size={32} />
                 </div>
                 <p className="font-bold text-slate-700">就這麼簡單！</p>
                 <p className="text-sm text-slate-500">隨時都可以回到首頁透過「匯入舊檔」接續編輯</p>
              </div>
           </div>
        </div>
      )
    }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white z-10">
          <h2 className="text-2xl font-extrabold text-slate-800">建置工具操作說明</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="p-8 pb-4 flex flex-col gap-6">
           <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold text-sky-600">{current.title}</h3>
              <p className="text-slate-600">{current.desc}</p>
           </div>
           
           {/* Mock UI Showcase */}
           <div className="mt-4 shadow-inner ring-1 ring-slate-200 rounded-xl overflow-hidden">
             {current.mock}
           </div>
        </div>

        {/* Footer / Controls */}
        <div className="p-6 pt-4 flex justify-between items-center">
           <div className="flex gap-2">
             {steps.map((_, i) => (
               <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-sky-500' : 'w-2 bg-slate-200'}`} />
             ))}
           </div>
           <div className="flex gap-3">
             <button 
               onClick={() => setStep(s => Math.max(0, s - 1))} 
               disabled={step === 0}
               className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1 ${step === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
             >
               <ChevronLeft size={16} /> 上一步
             </button>
             {step < steps.length - 1 ? (
               <button 
                 onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} 
                 className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-600 flex items-center gap-1"
               >
                 下一步 <ChevronRight size={16} />
               </button>
             ) : (
               <button 
                 onClick={onClose} 
                 className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600"
               >
                 開始使用
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
