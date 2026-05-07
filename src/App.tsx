import React, { useState } from 'react';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { InstructionsModal } from './components/InstructionsModal';
import { ExportButton } from './components/ExportButton';
import { HomePane } from './components/HomePane';
import { CategoryConfig, FaqItem } from './types';
import { Smartphone, Monitor, PencilRuler } from 'lucide-react';

export default function App() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'home' | 'category' | 'faq'>('home');

  const [category, setCategory] = useState<CategoryConfig>({
    id: 'user-created',
    name: '資訊技術',
    icon: 'monitor',
    color: '#3b82f6',
    comment: '測試',
    hasSubcategories: false,
    subcategories: [],
    contacts: [
      {
        id: 'contact-001',
        targetId: 'main',
        title: '資訊服務台',
        desc: '系統故障、密碼重設請撥內線 #1234。'
      }
    ]
  });

  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      id: 'q-001',
      category: 'it',
      sub: '',
      middle: '常見問題',
      minor: '系統登入',
      question: '忘記密碼該如何處理？',
      answerType: 'text',
      answer: '請至系統首頁點擊「忘記密碼」，我們將發送驗證信至您的信箱。',
      files: []
    }
  ]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <header className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex justify-between items-center px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-inner">
            <PencilRuler size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            FAQ 設計小幫手
          </h1>
        </div>

        <div className="flex gap-4 items-center">
            
          <ExportButton category={category} faqs={faqs} previewId="faq-preview-container" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {activeTab === 'home' ? (
           <HomePane setActiveTab={setActiveTab} setCategory={setCategory} setFaqs={setFaqs} onInstructionsClick={() => setShowInstructions(true)} />
        ) : (
          <>
            {/* Left pane: Editor */}
            <div className={`${activeTab === 'category' ? 'w-full md:w-1/2 lg:w-[45%]' : 'w-full'} h-full bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-all duration-300`}>
              <EditorPane 
                category={category} setCategory={setCategory} 
                faqs={faqs} setFaqs={setFaqs} 
                onInstructionsClick={() => setShowInstructions(true)} 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* Right pane: Preview */}
            <div className={`flex-1 h-full bg-slate-100 flex-col relative animate-in fade-in zoom-in-95 duration-300 ${activeTab === 'category' ? 'flex' : 'hidden'}`}>
              <div className="flex justify-center p-4">
                <div className="flex bg-slate-200 shadow-sm rounded-lg p-1">
                  <button 
                    onClick={() => setDeviceMode('desktop')} 
                    className={`px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors text-sm font-medium ${deviceMode === 'desktop' ? 'bg-white text-sky-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Monitor className="w-4 h-4" /> 網頁版
                  </button>
                  <button 
                    onClick={() => setDeviceMode('mobile')} 
                    className={`px-4 py-1.5 rounded-md flex items-center gap-2 transition-colors text-sm font-medium ${deviceMode === 'mobile' ? 'bg-white text-sky-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Smartphone className="w-4 h-4" /> 手機版
                  </button>
                </div>
              </div>

              <div className="flex-1 px-4 md:px-8 pb-8 flex items-center justify-center overflow-hidden">
                {/* Wrapper for the device container to allow taking snapshot */}
                <div 
                   id="faq-preview-container" 
                   className={`bg-white shadow-xl overflow-hidden transition-all duration-300 mx-auto ${
                     deviceMode === 'mobile' 
                      ? 'w-[375px] h-[812px] rounded-[3rem] border-[12px] border-slate-800 ring-4 ring-slate-100/50' 
                      : 'w-full max-w-5xl h-full rounded-2xl border border-slate-200 ring-4 ring-white/50'
                   }`}
                >
                  <PreviewPane category={category} faqs={faqs} isMobile={deviceMode === 'mobile'} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
    </div>
  );
}
