import { icons } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import { CategoryConfig, FaqItem, AnswerBlock } from '../types';
import '../styles/faq-preview.css';

interface PreviewPaneProps {
  category: CategoryConfig;
  faqs: FaqItem[];
  isMobile: boolean;
}

const LucideIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const pascalName = (name || '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  const Icon = (icons as any)[pascalName] || (icons as any)[name] || icons.Circle;
  return <Icon className={className} style={style} />;
};

export const PreviewPane: React.FC<PreviewPaneProps> = ({ category, faqs, isMobile }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [activeSubcategory, setActiveSubcategory] = useState<string>('main');

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (category.hasSubcategories && category.subcategories?.length > 0) {
      setActiveSubcategory(category.subcategories[0].id);
    } else {
      setActiveSubcategory('main');
    }
  }, [category.hasSubcategories, category.subcategories]);

  const cssVars = {
    '--faq-accent': category.color || '#64748b',
    '--hover-color': category.color || '#64748b',
    '--active-bg': category.color || '#64748b',
    '--sub-active-bg': `${category.color || '#64748b'}26`,
    '--sub-active-text': category.color || '#64748b',
  } as React.CSSProperties;

  const groupedFaqs = useMemo(() => {
    const grouped: Record<string, Record<string, FaqItem[]>> = {};
    faqs.forEach(item => {
      const middle = item.middle || '其他主題';
      const minor = item.minor || '問題';
      if (!grouped[middle]) grouped[middle] = {};
      if (!grouped[middle][minor]) grouped[middle][minor] = [];
      grouped[middle][minor].push(item);
    });
    return grouped;
  }, [faqs]);

  // Render Rich Text Block
  const renderRichBlock = (block: AnswerBlock, index: number) => {
    switch (block.type) {
      case 'p':
        return <p key={index} className="mb-2 text-slate-600 whitespace-pre-wrap">{block.text}</p>;
      case 'h4':
        return <h4 key={index} className="font-bold text-slate-800 mt-4 mb-2">{block.text}</h4>;
      case 'hr':
        return <hr key={index} className="my-3 border-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${category.color}, transparent)`, opacity: 0.6 }} />;
      case 'list':
        return (
          <div key={index} className="mb-3">
            {block.items.map((it, i) => (
              <div key={i} className="mb-1 ml-4 flex gap-2 text-slate-600">
                <strong style={{ color: category.color }}>‧</strong>
                {it}
              </div>
            ))}
          </div>
        );
      case 'img':
        return (
          <div key={index} className="flex flex-col mb-4">
            {block.title && <div className="font-bold text-slate-800 mb-2">{block.title}</div>}
            <div className="w-full bg-slate-100 rounded-md flex items-center justify-center p-4 border border-slate-200" style={{ minHeight: '150px' }}>
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <LucideIcon name="image" className="w-8 h-8" />
                <span className="text-sm">{block.alt || block.src} (Preview)</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`faq-preview-wrapper ${isMobile ? 'mobile-view' : ''}`} style={cssVars}>
      {/* Mobile Header */}
      <div className="preview-header-mobile" style={{ display: isMobile ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center' }}>
         <div className="flex items-center gap-3">
             <div className="rounded-lg shadow-md p-2 flex items-center justify-center" style={{ backgroundColor: category.color || '#3b82f6' }}>
                 <LucideIcon name="message-circle" className="text-white w-5 h-5" />
             </div>
             <span className="font-extrabold text-slate-900 text-lg">FAQ Hub</span>
         </div>
         <button className="p-2 text-slate-600" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
           <LucideIcon name={isSidebarOpen ? "x" : "menu"} className="w-6 h-6 text-slate-600" />
         </button>
      </div>

      {isMobile && isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-slate-900/20 z-40" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`preview-sidebar ${isSidebarOpen || !isMobile ? 'open' : ''}`}>
        {!isMobile && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
              <LucideIcon name="message-circle" className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">FAQ Hub</h1>
              <p className="text-xs text-slate-500">內部常見FAQ知識庫</p>
            </div>
          </div>
        )}

        <div>
          {category.hasSubcategories ? (
            <div className="category-group expanded">
              <button 
                className="category-btn active"
                onClick={() => setActiveSubcategory('main')}
              >
                <div className="flex items-center gap-2">
                  <LucideIcon name={category.icon} className="w-5 h-5" />
                  <span className="font-bold">{category.name || '分類名稱'}</span>
                </div>
                <LucideIcon name="chevron-down" className="w-4 h-4" />
              </button>
              <div className="category-group-content">
                {category.subcategories.map((sub, index) => (
                  <button 
                    key={`${sub.id}-${index}`} 
                    className={`category-btn sub-item mt-1 ${activeSubcategory === sub.id ? 'active' : ''}`}
                    onClick={() => setActiveSubcategory(sub.id)}
                  >
                    <LucideIcon name={sub.icon} className="w-4 h-4" />
                    <span>{sub.name || '子分類'}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button className="category-btn active">
              <div className="flex items-center gap-2">
                <LucideIcon name={category.icon} className="w-5 h-5" />
                <span className="font-bold">{category.name || '分類名稱'}</span>
              </div>
            </button>
          )}
        </div>

        {category.contacts && category.contacts
          .filter(contact => contact.targetId === (activeSubcategory || 'main'))
          .map((contact, idx) => {
          return (
            <div key={contact.id || idx} className="contact-card mb-4" style={{ position: 'relative' }}>
              <div className="contact-card-indicator" />
              <h4 className="contact-title">
                <LucideIcon name="phone-call" className="w-4 h-4" style={{ color: category.color }} />
                {contact.title || '聯絡窗口標題'}
              </h4>
              <p className="contact-desc">{contact.desc || '聯絡窗口說明...'}</p>
            </div>
          );
        })}
      </aside>

      {/* Main Content */}
      <main className="preview-main">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 mt-4 space-y-6">
            <div className="relative group w-full"> 
              <LucideIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="在 全站首頁 中搜尋..."
                className="w-full h-14 pl-12 pr-6 rounded-2xl border border-slate-200 bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-slate-700"
                readOnly
              />
            </div>
            
            <div className="flex items-center gap-3 overflow-hidden mt-6">
              <span className="font-black text-slate-400 uppercase tracking-tighter mr-1 shrink-0 text-xs">分類導覽</span>
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1 no-scrollbar">
                <button className="px-5 py-2 rounded-full font-bold transition-all shrink-0 text-xs text-white" style={{ backgroundColor: category.color }}>全部</button>
                {Object.keys(groupedFaqs).map(sub => (
                  <button key={sub} className="px-5 py-2 rounded-full font-bold transition-all shrink-0 text-xs bg-white text-slate-500 border border-slate-200">{sub}</button>
                ))}
              </div>
            </div>
          </div>

          {Object.entries(groupedFaqs).map(([sub, minorGroups]) => (
            <section key={sub} className="mb-8">
              <div className="faq-section-header">
                <h3>{sub}</h3>
              </div>
              
              {Object.entries(minorGroups).map(([minor, items]) => (
                <div key={minor} className="mb-6">
                  <h4 className="flex items-center gap-2 mb-4 text-slate-500 font-medium">
                    <LucideIcon name="tag" className="w-4 h-4" /> {minor}
                  </h4>
                  
                  {items.map((item, idx) => (
                    <article key={`${item.id}-${idx}`} id={`faq-preview-${item.id}`} className="faq-card active">
                      <button className="faq-card-button">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="faq-minor-tag" 
                              style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                            >
                              {item.minor}
                            </span>
                            <span className="faq-question-text" style={{ color: category.color, fontWeight: 'bold' }}>
                              {item.question || '（尚未輸入問題）'}
                            </span>
                          </div>
                        </div>
                        <LucideIcon name="chevron-down" className="w-5 h-5 mt-1" style={{ color: category.color }} />
                      </button>
                      
                      <div className="faq-answer-pane">
                        {item.answerType === 'rich-text' && item.answerContent ? (
                          item.answerContent.map((block, idx) => renderRichBlock(block, idx))
                        ) : (
                          <div className="whitespace-pre-wrap text-slate-600">{item.answer || '（尚未輸入回答）'}</div>
                        )}

                        {item.files && item.files.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-200">
                             <div className="flex items-center gap-2 mb-3 text-slate-500 font-medium text-sm">
                               <LucideIcon name="paperclip" className="w-4 h-4" /> 附件檔案
                             </div>
                             {item.files.map((file, idx) => {
                               const isPdf = file.type === 'pdf';
                               const isWord = file.type === 'word';
                               const isPpt = file.type === 'ppt';
                               const isExcel = file.type === 'excel';
                               const iconName = isPdf || isWord ? 'file-text' : isPpt ? 'presentation' : isExcel ? 'file-spreadsheet' : 'file';
                               const fColor = isPdf ? '#ef4444' : isExcel ? '#22c55e' : isWord ? '#3b82f6' : isPpt ? '#f59e0b' : '#64748b';

                               return (
                                 <div key={idx} className="faq-file-item group">
                                   <div className="flex items-center gap-3">
                                     <div className="faq-file-icon-wrapper">
                                       <LucideIcon name={iconName} className="w-5 h-5" style={{ color: fColor }} />
                                     </div>
                                     <span className="font-medium text-sm text-slate-700">{file.name || '未命名檔案'}</span>
                                   </div>
                                   <LucideIcon name="download" className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                                 </div>
                               )
                             })}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </section>
          ))}
          
          {faqs.length === 0 && (
            <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl text-slate-500">
              請在左側新增問答，預覽將即時顯示在此。
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
