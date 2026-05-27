import { icons } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { CategoryConfig, FaqItem, AnswerBlock } from '../types';

interface EditorPaneProps {
  category: CategoryConfig;
  setCategory: React.Dispatch<React.SetStateAction<CategoryConfig>>;
  faqs: FaqItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
  onInstructionsClick: () => void;
  activeTab: 'home' | 'category' | 'faq';
  setActiveTab: (tab: 'home' | 'category' | 'faq') => void;
}

const JsonTextarea: React.FC<{ faq: any, category: any, onChange: (parsed: any) => void }> = ({ faq, category, onChange }) => {
  const [localText, setLocalText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const mappedFaq = (() => {
    const { category: cat, sub, middle, ...rest } = faq;
    return {
      id: rest.id,
      category: category.hasSubcategories && sub ? `${category.name}(${sub})` : category.name || cat,
      sub: middle,
      minor: rest.minor,
      question: rest.question,
      answerType: rest.answerType,
      answer: rest.answer,
      answerContent: rest.answerContent,
      files: rest.files
    };
  })();

  const jsonString = JSON.stringify(mappedFaq, null, 2);

  return (
    <textarea 
       className="absolute inset-0 w-full h-full p-4 text-[10px] font-mono text-emerald-400 bg-transparent resize-none outline-none leading-relaxed"
       value={isFocused ? localText : jsonString}
       onFocus={() => {
         setLocalText(jsonString);
         setIsFocused(true);
       }}
       onBlur={() => {
         setIsFocused(false);
         try {
           const parsed = JSON.parse(localText);
           onChange(parsed);
         } catch(err) {
           // Invalid JSON on blur, just ignore and revert to previous state
         }
       }}
       onChange={(e) => {
         setLocalText(e.target.value);
         try {
           const parsed = JSON.parse(e.target.value);
           onChange(parsed);
         } catch(err) {
           // Invalid JSON on edit mid-typing, keep previous state
         }
       }}
    />
  );
};

export const EditorPane: React.FC<EditorPaneProps> = ({ category, setCategory, faqs, setFaqs, onInstructionsClick, activeTab, setActiveTab }) => {
  const Icons = icons as any;

  const [paneWidths, setPaneWidths] = useState<{pane2: number | string, pane3: number | string}>({ pane2: '33.33%', pane3: '33.33%' });
  const [dragEnabledSubcat, setDragEnabledSubcat] = useState<number | null>(null);
  const [dragEnabledBlock, setDragEnabledBlock] = useState<string | null>(null);
  const dragRef = useRef<{ type: 'pane2' | 'pane3', startX: number, startWidth: number } | null>(null);

  const [collapsedFaqs, setCollapsedFaqs] = useState<Record<number, boolean>>({});

  const toggleFaqCollapse = (index: number) => {
    setCollapsedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const collapseAll = () => {
    const all: Record<number, boolean> = {};
    faqs.forEach((_, i) => {
      all[i] = true;
    });
    setCollapsedFaqs(all);
  };

  const expandAll = () => {
    setCollapsedFaqs({});
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { type, startX, startWidth } = dragRef.current;
      const deltaX = startX - e.clientX; 
      
      if (type === 'pane2') {
        const newWidth = Math.max(150, startWidth + deltaX);
        setPaneWidths(prev => ({ ...prev, pane2: newWidth }));
      } else if (type === 'pane3') {
        const newWidth = Math.max(200, startWidth + deltaX);
        setPaneWidths(prev => ({ ...prev, pane3: newWidth }));
      }
    };
    
    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, type: 'pane2' | 'pane3') => {
    e.preventDefault();
    const pane = e.currentTarget.nextElementSibling as HTMLElement;
    if (pane) {
      dragRef.current = { type, startX: e.clientX, startWidth: pane.getBoundingClientRect().width };
      document.body.style.cursor = 'col-resize';
    }
  };

  const uniqueMiddleCategories = Array.from(new Set(faqs.map(f => f.middle).filter(Boolean)));
  const uniqueMinorCategories = Array.from(new Set(faqs.map(f => f.minor).filter(Boolean)));

  const updateCat = (key: keyof CategoryConfig, val: any) => setCategory(prev => ({ ...prev, [key]: val }));

  const addSubcategory = () => {
    updateCat('subcategories', [...category.subcategories, { id: `sub-${Date.now()}`, name: '', icon: 'circle' }]);
  };
  const updateSubcategory = (index: number, key: string, val: string) => {
    const newSubs = [...category.subcategories];
    newSubs[index] = { ...newSubs[index], [key]: val };
    updateCat('subcategories', newSubs);
  };
  const removeSubcategory = (index: number) => {
    updateCat('subcategories', category.subcategories.filter((_, i) => i !== index));
  };

  const reindexFaqs = (faqsList: FaqItem[]) => {
    return faqsList.map((f, i) => ({
      ...f,
      id: `q-${String(i + 1).padStart(3, '0')}`
    }));
  };

  const addFaq = () => {
    const newId = `default`; // will be overridden by reindex
    const newFaq: FaqItem = {
      id: newId,
      category: category.name || 'default',
      sub: category.hasSubcategories && category.subcategories.length > 0 ? category.subcategories[0].name : '',
      middle: '',
      minor: '',
      question: '',
      answerType: 'text',
      answer: '',
      answerContent: [],
      files: []
    };
    setFaqs(reindexFaqs([...faqs, newFaq]));
  };

  const insertFaqAfter = (index: number) => {
    const newId = `default`;
    const newFaq: FaqItem = {
      id: newId,
      category: category.name || 'default',
      sub: category.hasSubcategories && category.subcategories.length > 0 ? category.subcategories[0].name : '',
      middle: '',
      minor: '',
      question: '',
      answerType: 'text',
      answer: '',
      answerContent: [],
      files: []
    };
    const newFaqs = [...faqs];
    newFaqs.splice(index + 1, 0, newFaq);
    setFaqs(reindexFaqs(newFaqs));
  };
  const updateFaq = (index: number, key: keyof FaqItem, val: any) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [key]: val };
    setFaqs(newFaqs); // no reindex needed
  };
  const removeFaq = (index: number) => {
    setFaqs(reindexFaqs(faqs.filter((_, i) => i !== index)));
  };

  const addFaqFile = (faqIndex: number) => {
    const newFaqs = [...faqs];
    newFaqs[faqIndex].files.push({ id: `file-${Date.now()}`, name: '', type: 'pdf', url: '' });
    setFaqs(newFaqs);
  };
  const updateFaqFile = (faqIndex: number, fileIndex: number, key: string, val: string) => {
    const newFaqs = [...faqs];
    newFaqs[faqIndex].files[fileIndex] = { ...newFaqs[faqIndex].files[fileIndex], [key]: val };
    setFaqs(newFaqs);
  };
  const removeFaqFile = (faqIndex: number, fileIndex: number) => {
    const newFaqs = [...faqs];
    newFaqs[faqIndex].files = newFaqs[faqIndex].files.filter((_, i) => i !== fileIndex);
    setFaqs(newFaqs);
  };

  const addRichBlock = (faqIndex: number, type: 'p' | 'img' | 'hr') => {
    const newFaqs = [...faqs];
    let block: AnswerBlock;
    if (type === 'hr') block = { type: 'hr' };
    else if (type === 'img') block = { type: 'img', src: '', alt: '' };
    else block = { type: 'p', text: '' };
    newFaqs[faqIndex].answerContent = [...(newFaqs[faqIndex].answerContent || []), block];
    setFaqs(newFaqs);
  };

  const toggleFormat = (faqIdx: number, blockIdx: number, listIdx: number | null, tagStart: string, tagEnd: string, elementId: string) => {
    const el = document.getElementById(elementId) as HTMLTextAreaElement | HTMLInputElement;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const currentVal = el.value;

    let newVal = currentVal;
    let newStart = start;
    let newEnd = end;
    
    const selText = currentVal.substring(start, end);
    const beforeSel = currentVal.substring(Math.max(0, start - tagStart.length), start);
    const afterSel = currentVal.substring(end, end + tagEnd.length);

    if (selText.startsWith(tagStart) && selText.endsWith(tagEnd) && selText.length >= tagStart.length + tagEnd.length) {
        // Strip inside selection
        newVal = currentVal.substring(0, start) + selText.substring(tagStart.length, selText.length - tagEnd.length) + currentVal.substring(end);
        newEnd = end - tagStart.length - tagEnd.length;
    } else if (beforeSel === tagStart && afterSel === tagEnd) {
        // Strip outside selection
        newVal = currentVal.substring(0, start - tagStart.length) + selText + currentVal.substring(end + tagEnd.length);
        newStart = start - tagStart.length;
        newEnd = end - tagStart.length;
    } else {
        // Add format
        newVal = currentVal.substring(0, start) + tagStart + selText + tagEnd + currentVal.substring(end);
        newStart = start + tagStart.length;
        newEnd = end + tagStart.length;
    }
    
    const newFaqs = [...faqs];
    const b = newFaqs[faqIdx].answerContent![blockIdx];
    if (listIdx !== null && b.type === 'list') {
       b.items[listIdx] = newVal;
    } else if (b.type === 'p' || b.type === 'h4') {
       b.text = newVal;
    }
    setFaqs(newFaqs);
    
    setTimeout(() => {
       el.focus();
       el.setSelectionRange(newStart, newEnd);
    }, 0);
  };
  const updateRichBlock = (faqIndex: number, blockIndex: number, key: string, val: string) => {
    const newFaqs = [...faqs];
    const content = newFaqs[faqIndex].answerContent || [];
    content[blockIndex] = { ...content[blockIndex], [key]: val } as any;
    newFaqs[faqIndex].answerContent = content;
    setFaqs(newFaqs);
  };
  const removeRichBlock = (faqIndex: number, blockIndex: number) => {
    const newFaqs = [...faqs];
    if (newFaqs[faqIndex].answerContent) {
      newFaqs[faqIndex].answerContent = newFaqs[faqIndex].answerContent!.filter((_, i) => i !== blockIndex);
    }
    setFaqs(newFaqs);
  };

  const moveFaqUp = (idx: number) => {
    if (idx === 0) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[idx - 1];
    newFaqs[idx - 1] = newFaqs[idx];
    newFaqs[idx] = temp;
    setFaqs(reindexFaqs(newFaqs));
  };

  const moveFaqDown = (idx: number) => {
    if (idx === faqs.length - 1) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[idx + 1];
    newFaqs[idx + 1] = newFaqs[idx];
    newFaqs[idx] = temp;
    setFaqs(reindexFaqs(newFaqs));
  };

  const dragBlockRef = useRef<{ faqIdx: number, blockIdx: number } | null>(null);
  const dragOverBlockRef = useRef<{ faqIdx: number, blockIdx: number } | null>(null);

  const handleDragStartBlock = (faqIdx: number, blockIdx: number) => {
    dragBlockRef.current = { faqIdx, blockIdx };
  };

  const handleDragEnterBlock = (faqIdx: number, blockIdx: number) => {
    dragOverBlockRef.current = { faqIdx, blockIdx };
    const dragItem = dragBlockRef.current;
    if (dragItem && dragItem.faqIdx === faqIdx && dragItem.blockIdx !== blockIdx) {
      const newFaqs = [...faqs];
      const content = [...newFaqs[faqIdx].answerContent!];
      const draggedContent = content[dragItem.blockIdx];
      content.splice(dragItem.blockIdx, 1);
      content.splice(blockIdx, 0, draggedContent);
      newFaqs[faqIdx].answerContent = content;
      setFaqs(newFaqs);
      dragBlockRef.current = { faqIdx, blockIdx };
    }
  };

  const dragSubcategoryRef = useRef<number | null>(null);

  const handleDragStartSubcat = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragSubcategoryRef.current = index;
    // slightly transparent when dragging
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnterSubcat = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const dragIdx = dragSubcategoryRef.current;
    if (dragIdx !== null && dragIdx !== index) {
      const newSubs = [...category.subcategories];
      const draggedSub = newSubs[dragIdx];
      newSubs.splice(dragIdx, 1);
      newSubs.splice(index, 0, draggedSub);
      updateCat('subcategories', newSubs);
      dragSubcategoryRef.current = index;
    }
  };

  const handleDragEndSubcat = (e: React.DragEvent<HTMLDivElement>) => {
    dragSubcategoryRef.current = null;
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
  };

  const handleDragOverSubcat = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processRichText = (text: string, isList: boolean = false) => {
    if (!text) return '';
    let processed = text;
    // Theme bold
    processed = processed.replace(/\[\[(.*?)\]\]/g, `<strong style="color: ${category.color || 'var(--faq-accent)'} !important;">$1</strong>`);
    // General bold
    processed = processed.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`);
    // URLs
    processed = processed.replace(/(https?:\/\/[^\s]+)/g, `<a href="$1" target="_blank" class="text-sky-600 hover:underline break-all" style="text-decoration: underline;">$1</a>`);
    // Newlines -> <br>
    if (isList) {
       processed = processed.replace(/\n/g, '<br />');
    } else {
       processed = processed.replace(/\n/g, '<br style="content: \'\'; display: block; margin: 0.5rem 0;" />');
    }
    return processed;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`font-bold pb-2 border-b-2 text-lg transition-colors ${activeTab === 'home' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            首頁
          </button>
          <button 
            onClick={() => setActiveTab('category')} 
            className={`font-bold pb-2 border-b-2 text-lg transition-colors ${activeTab === 'category' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            分類設定
          </button>
          <button 
            onClick={() => setActiveTab('faq')} 
            className={`font-bold pb-2 border-b-2 text-lg transition-colors ${activeTab === 'faq' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            問答編輯
          </button>
        </div>
        <button onClick={onInstructionsClick} className="text-sm px-3 py-1 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 font-medium">操作說明</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {activeTab === 'category' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <h3 className="font-bold text-slate-700 text-lg border-b border-slate-200 pb-2">1. 分類與外觀設定</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">分類名稱</label>
            <input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" value={category.name} onChange={e => updateCat('name', e.target.value)} placeholder="例：資訊技術" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">主題色 (hex)</label>
            <div className="flex gap-2">
              <input type="color" className="p-1 h-10 w-10 border border-slate-300 rounded cursor-pointer" value={category.color} onChange={e => updateCat('color', e.target.value)} />
              <input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" value={category.color} onChange={e => updateCat('color', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-600 mb-1">
             Icon 名稱 (請參考 <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer" className="text-sky-500 underline">Lucide</a>)
           </label>
           <input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" value={category.icon} onChange={e => updateCat('icon', e.target.value)} placeholder="例：monitor" />
        </div>
      </section>

      <section className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-700 text-lg">2. 子類別設定</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-slate-600">包含子類別？</span>
            <input type="checkbox" checked={category.hasSubcategories} onChange={e => updateCat('hasSubcategories', e.target.checked)} className="w-4 h-4 text-sky-600 rounded" />
          </label>
        </div>

        {category.hasSubcategories && (
          <div className="space-y-3">
            {category.subcategories.map((sub, i) => (
              <div 
                key={`${sub.id}-${i}`} 
                className="flex gap-2 items-center bg-white p-3 rounded border border-slate-200 focus-within:border-sky-500"
                draggable={dragEnabledSubcat === i}
                onDragStart={(e) => handleDragStartSubcat(e, i)}
                onDragEnter={(e) => handleDragEnterSubcat(e, i)}
                onDragEnd={(e) => { setDragEnabledSubcat(null); handleDragEndSubcat(e); }}
                onDragOver={handleDragOverSubcat}
              >
                <div 
                   className="flex flex-col gap-1 text-slate-300 mr-1 cursor-grab active:cursor-grabbing p-2 -ml-2"
                   onMouseEnter={() => setDragEnabledSubcat(i)}
                   onMouseLeave={() => setDragEnabledSubcat(null)}
                >
                   <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                   <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                   <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                </div>
                <input type="text" placeholder="子類別名稱" className="flex-1 p-2 border border-slate-300 rounded text-sm cursor-text outline-none focus:border-sky-500" value={sub.name} onChange={e => updateSubcategory(i, 'name', e.target.value)} />
                <input type="text" placeholder="Icon 名稱" className="w-32 p-2 border border-slate-300 rounded text-sm cursor-text outline-none focus:border-sky-500" value={sub.icon} onChange={e => updateSubcategory(i, 'icon', e.target.value)} />
                <button onClick={() => removeSubcategory(i)} className="p-2 text-red-500 hover:bg-red-50 rounded font-medium text-sm">刪除</button>
              </div>
            ))}
            <button onClick={addSubcategory} className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300">+ 新增子類別</button>
          </div>
        )}
      </section>

      <section className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-700 text-lg">3. 聯絡窗口</h3>
        </div>
        
        <div className="space-y-4">
          {category.contacts?.map((contact, i) => {
            const baseTargets = [{ id: 'main', name: `大分類: ${category.name || '未命名'}` }];
            if (category.hasSubcategories && (category.subcategories?.length || 0) > 0) {
              baseTargets.push(...(category.subcategories || []).map(sub => ({ id: sub.id, name: `子分類: ${sub.name || '未命名'}` })));
            }
            
            if (!baseTargets.find(t => t.id === contact.targetId)) {
              baseTargets.push({ id: contact.targetId, name: contact.targetId === 'main' ? `大分類: ${category.name || '未命名'}` : '(未知分類)' });
            }

            const availableTargets = baseTargets.filter(t => t.id === contact.targetId || !category.contacts.find(c => c.targetId === t.id));

            return (
              <div key={contact.id} className="space-y-3 p-4 bg-white border border-slate-200 rounded relative group">
                <button onClick={() => updateCat('contacts', category.contacts.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">刪除</button>
                <div className="pr-10">
                  <label className="block text-sm font-medium text-slate-600 mb-1">目標分類</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    value={contact.targetId}
                    onChange={e => {
                      const newContacts = [...category.contacts];
                      newContacts[i].targetId = e.target.value;
                      updateCat('contacts', newContacts);
                    }}
                  >
                    {availableTargets.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">標題</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded text-sm" value={contact.title} onChange={e => {
                      const newContacts = [...category.contacts];
                      newContacts[i].title = e.target.value;
                      updateCat('contacts', newContacts);
                    }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">人員說明</label>
                  <textarea className="w-full p-2 border border-slate-300 rounded text-sm" rows={2} value={contact.desc} onChange={e => {
                      const newContacts = [...category.contacts];
                      newContacts[i].desc = e.target.value;
                      updateCat('contacts', newContacts);
                    }} />
                </div>
              </div>
            );
          })}
          
          {(() => {
            const baseTargets = [{ id: 'main', name: `大分類: ${category.name || '未命名'}` }];
            if (category.hasSubcategories && (category.subcategories?.length || 0) > 0) {
              baseTargets.push(...(category.subcategories || []).map(sub => ({ id: sub.id, name: `子分類: ${sub.name || '未命名'}` })));
            }
            
            const availableTargets = baseTargets.filter(t => !(category.contacts || []).find(c => c.targetId === t.id));
            
            if (availableTargets.length === 0) return null;
            
            return (
              <button 
                onClick={() => {
                  const newContacts = [...(category.contacts || []), {
                    id: `contact-${Date.now()}`,
                    targetId: availableTargets[0].id,
                    title: '新聯絡窗口',
                    desc: ''
                  }];
                  updateCat('contacts', newContacts);
                }}
                 className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300 block w-full text-center"
               >
                 + 新增聯絡窗口
               </button>
            );
          })()}
        </div>
      </section>
      </div>
        )}

        {activeTab === 'faq' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="mb-0 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="font-bold text-slate-700 text-lg">4. 問答項目編列</h3>
          {faqs.length > 0 && (
            <div className="flex gap-2">
              <button onClick={expandAll} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors shadow-sm">全部展開</button>
              <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors shadow-sm">全部收合</button>
            </div>
          )}
        </div>

        <div className="space-y-6" style={{ '--pane2-width': typeof paneWidths.pane2 === 'number' ? `${paneWidths.pane2}px` : paneWidths.pane2, '--pane3-width': typeof paneWidths.pane3 === 'number' ? `${paneWidths.pane3}px` : paneWidths.pane3 } as React.CSSProperties}>
          {faqs.length === 0 && (
            <div className="flex justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
              <button onClick={addFaq} className="px-4 py-2 bg-sky-500 text-white rounded shadow-sm font-medium hover:bg-sky-600">
                + 新增第一個問答
              </button>
            </div>
          )}
          {faqs.map((faq, i) => (
            <div 
               key={`${faq.id}-${i}`} 
               className="bg-white border text-left border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col group/faq relative"
            >
               <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-1">
                   <div className="flex flex-col">
                     <button onClick={() => moveFaqUp(i)} disabled={i === 0} className={`text-slate-400 hover:text-slate-600 ${i === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}>
                       <Icons.ChevronUp size={16} />
                     </button>
                     <button onClick={() => moveFaqDown(i)} disabled={i === faqs.length - 1} className={`text-slate-400 hover:text-slate-600 ${i === faqs.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}>
                       <Icons.ChevronDown size={16} />
                     </button>
                   </div>
                   <span className="font-bold text-slate-700 text-sm ml-2">問題 {i + 1} <span className="opacity-50">({faq.id})</span></span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => toggleFaqCollapse(i)} className="text-xs text-amber-700 bg-amber-100/50 hover:bg-amber-100 font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1" title={collapsedFaqs[i] ? "已收合" : "已展開"}>
                      {collapsedFaqs[i] ? <><Icons.ChevronRight size={14} /> 收合</> : <><Icons.ChevronDown size={14} /> 展開</>}
                    </button>
                    <button onClick={() => insertFaqAfter(i)} className="text-xs text-sky-600 bg-sky-50 hover:bg-sky-100 font-medium px-3 py-1.5 rounded transition-colors">+ 新增下一題</button>
                    <button onClick={() => removeFaq(i)} className="text-xs text-red-500 bg-red-50 hover:bg-red-100 font-medium px-3 py-1.5 rounded transition-colors">刪除此題</button>
                 </div>
               </div>
               
               {collapsedFaqs[i] ? (
                 <div className="p-4 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleFaqCollapse(i)}>
                    <div className="flex gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-sky-600">{category.hasSubcategories && faq.sub ? `[${faq.sub}]` : (category.name || '未設定分類')}</span>
                      {faq.middle && <span>/ {faq.middle}</span>}
                      {faq.minor && <span>/ {faq.minor}</span>}
                    </div>
                    <div className="font-bold text-slate-800 line-clamp-1 truncate">{faq.question || <span className="text-slate-400 italic font-normal">未填寫題目...</span>}</div>
                 </div>
               ) : (
                <div className="flex flex-col 2xl:flex-row divide-y 2xl:divide-y-0 relative border-t border-slate-200">
                  {/* 1. 問答項目編列 */}
                 <div className="flex-1 p-5 space-y-4 text-sm min-w-0">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">1</div>問答項目編列</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-slate-600 mb-1">大分類 (子分類)</label>
                        {category.hasSubcategories && category.subcategories.length > 0 ? (
                          <select className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" value={faq.sub} onChange={e => updateFaq(i, 'sub', e.target.value)}>
                            {category.subcategories.map((s, idx) => <option key={`${s.id}-${idx}`} value={s.name}>{s.name || '未命名'}</option>)}
                          </select>
                        ) : (
                          <input type="text" readOnly disabled className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500" value={category.name || '尚未設定'} />
                        )}
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-slate-600 mb-1">中分類 <span className="text-red-500">*</span></label>
                        <input 
                           type="text" 
                           list={`middle-cat-list-${i}`}
                           className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" 
                           value={faq.middle || ''} 
                           onChange={e => updateFaq(i, 'middle', e.target.value)} 
                           placeholder="必填，請輸入中分類"
                        />
                        <datalist id={`middle-cat-list-${i}`}>
                           {uniqueMiddleCategories.map((m, mIdx) => <option key={mIdx} value={m as string} />)}
                        </datalist>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-slate-600 mb-1">小分類</label>
                        <input 
                           type="text" 
                           list={`minor-cat-list-${i}`}
                           className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none" 
                           value={faq.minor} 
                           onChange={e => updateFaq(i, 'minor', e.target.value)} 
                           placeholder="自填小分類" 
                        />
                        <datalist id={`minor-cat-list-${i}`}>
                           {uniqueMinorCategories.map((m, mIdx) => <option key={mIdx} value={m as string} />)}
                        </datalist>
                      </div>
                    </div>

                    <div>
                       <label className="block text-slate-600 mb-1 text-base font-bold">題目 (Question)</label>
                       <input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none text-base font-medium text-slate-800" value={faq.question} onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="請輸入問題..." />
                    </div>

                    <div className="pt-2">
                       <label className="block text-slate-600 mb-2 font-bold">回答類型</label>
                       <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="text" checked={faq.answerType === 'text'} onChange={() => updateFaq(i, 'answerType', 'text')} className="w-4 h-4 text-sky-500" /> 一般文字</label>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" value="rich-text" checked={faq.answerType === 'rich-text'} onChange={() => updateFaq(i, 'answerType', 'rich-text')} className="w-4 h-4 text-sky-500" /> 進階圖文</label>
                       </div>
                    </div>

                    {faq.answerType === 'text' ? (
                       <div>
                         <label className="block text-slate-600 mb-1">回答內容 (支援換行)</label>
                         <textarea className="w-full p-2 border border-slate-300 rounded focus:border-sky-500 outline-none text-slate-700" rows={5} value={faq.answer || ''} onChange={e => updateFaq(i, 'answer', e.target.value)} placeholder="請輸入回答..." />
                       </div>
                    ) : (
                       <div className="border border-slate-200 p-4 rounded bg-slate-50 space-y-4">
                         <label className="block text-slate-600 font-bold">進階回答區塊</label>
                         {(faq.answerContent || []).map((block, bIdx) => (
                            <div 
                               key={bIdx} 
                               className="pl-8 p-3 bg-white border border-slate-200 rounded relative group focus-within:border-sky-500"
                               draggable={dragEnabledBlock === `${i}-${bIdx}`}
                               onDragStart={() => handleDragStartBlock(i, bIdx)}
                               onDragEnter={() => handleDragEnterBlock(i, bIdx)}
                               onDragOver={(e) => e.preventDefault()}
                               onDragEnd={(e) => { setDragEnabledBlock(null); dragBlockRef.current = null; dragOverBlockRef.current = null; }}
                            >
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-8 cursor-grab text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center rounded-l"
                                onMouseEnter={() => setDragEnabledBlock(`${i}-${bIdx}`)}
                                onMouseLeave={() => setDragEnabledBlock(null)}
                              >
                                <Icons.GripVertical size={16} />
                              </div>
                              <button onClick={() => removeRichBlock(i, bIdx)} className="absolute top-2 right-2 text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">刪除</button>
                              {block.type === 'p' ? (
                                <div className="border border-slate-300 rounded overflow-hidden">
                                  <div className="bg-slate-100 px-2 flex items-center gap-1 border-b border-slate-300">
                                    <span className="text-xs text-slate-500 font-medium mr-2 py-1.5">段落 (p)</span>
                                    <button onClick={() => toggleFormat(i, bIdx, null, '**', '**', `faq-${i}-p-${bIdx}`)} className="text-sm px-2 py-1 hover:bg-slate-200 rounded font-bold text-slate-700" title="粗體">B</button>
                                    <button onClick={() => toggleFormat(i, bIdx, null, `[[`, ']]', `faq-${i}-p-${bIdx}`)} className="text-sm px-2 py-1 hover:bg-slate-200 rounded font-bold" style={{ color: category.color || '#64748b' }} title="變色 (主題色)">
                                      <icons.Paintbrush size={14} />
                                    </button>
                                  </div>
                                  <textarea id={`faq-${i}-p-${bIdx}`} className="w-full p-2 focus:bg-sky-50 outline-none text-sm text-slate-700 relative z-0 block border-0 resize-y" rows={2} value={block.text} onChange={e => updateRichBlock(i, bIdx, 'text', e.target.value)} placeholder="輸入段落內容..." />
                                </div>
                              ) : block.type === 'hr' ? (
                                <div>
                                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded inline-block mb-2 font-medium">分隔線 (hr)</span>
                                  <div className="h-2 w-full bg-slate-100 rounded border border-slate-200"></div>
                                </div>
                              ) : block.type === 'img' ? (
                                <div>
                                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded inline-block mb-2 font-medium">圖片標示 (img)</span>
                                  <div className="flex gap-2 relative z-0">
                                    <input type="text" placeholder="標題(選填)" className="w-1/3 p-2 border border-slate-300 rounded focus:border-sky-500 outline-none text-sm" value={block.title || ''} onChange={e => updateRichBlock(i, bIdx, 'title', e.target.value)} />
                                    <input type="text" placeholder="圖片路徑 (例: assets/img/...)" className="w-2/3 p-2 border border-slate-300 rounded focus:border-sky-500 outline-none text-sm" value={block.src} onChange={e => updateRichBlock(i, bIdx, 'src', e.target.value)} />
                                  </div>
                                </div>
                              ) : block.type === 'list' ? (
                                <div>
                                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded inline-block mb-2 font-medium">列表清單 (list)</span>
                                  <div className="space-y-2 relative z-0">
                                    {(block.items || []).map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex gap-2 items-center">
                                        <span className="text-slate-400">•</span>
                                        <div className="flex-1 border border-slate-300 rounded overflow-hidden flex flex-col focus-within:border-sky-500 transition-colors">
                                          <div className="bg-slate-50 flex items-center gap-1 border-b border-slate-200 px-1 py-0.5">
                                            <button onClick={() => toggleFormat(i, bIdx, itemIdx, '**', '**', `faq-${i}-list-${bIdx}-${itemIdx}`)} className="text-xs px-2 py-0.5 hover:bg-slate-200 rounded font-bold text-slate-700">B</button>
                                            <button onClick={() => toggleFormat(i, bIdx, itemIdx, `[[`, ']]', `faq-${i}-list-${bIdx}-${itemIdx}`)} className="text-xs px-2 py-0.5 hover:bg-slate-200 rounded font-bold" style={{ color: category.color || '#64748b' }} title="變色 (主題色)">
                                              <icons.Paintbrush size={12} />
                                            </button>
                                          </div>
                                          <input id={`faq-${i}-list-${bIdx}-${itemIdx}`} type="text" className="w-full p-2 outline-none text-sm flex-1 bg-white" placeholder="列表項目內容..." value={item} onChange={(e) => {
                                            const newFaqs = [...faqs];
                                            const b = newFaqs[i].answerContent![bIdx];
                                            if (b.type === 'list') {
                                              b.items[itemIdx] = e.target.value;
                                              setFaqs(newFaqs);
                                            }
                                          }} />
                                        </div>
                                        <button onClick={() => {
                                            const newFaqs = [...faqs];
                                            const b = newFaqs[i].answerContent![bIdx];
                                            if (b.type === 'list') {
                                              b.items = b.items.filter((_, idx) => idx !== itemIdx);
                                              setFaqs(newFaqs);
                                            }
                                        }} className="text-red-500 text-xs px-2 hover:bg-red-50 rounded">X</button>
                                      </div>
                                    ))}
                                    <button onClick={() => {
                                        const newFaqs = [...faqs];
                                        const b = newFaqs[i].answerContent![bIdx];
                                        if (b.type === 'list') {
                                            if (!b.items) b.items = [];
                                            b.items.push('');
                                            setFaqs(newFaqs);
                                        }
                                    }} className="text-xs text-sky-600 px-2 py-1 hover:bg-sky-50 rounded">＋新增項目</button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                         ))}
                         <div className="flex gap-2">
                           <button onClick={() => addRichBlock(i, 'p')} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium shadow-sm transition-colors">+ 段落</button>
                           <button onClick={() => {
                              const newFaqs = [...faqs];
                              newFaqs[i].answerContent = [...(newFaqs[i].answerContent || []), { type: 'list', items: [''] }];
                              setFaqs(newFaqs);
                           }} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium shadow-sm transition-colors">+ 列表</button>
                           <button onClick={() => addRichBlock(i, 'hr')} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium shadow-sm transition-colors">+ 分區橫線</button>
                           <button onClick={() => addRichBlock(i, 'img')} className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium shadow-sm transition-colors">+ 圖片</button>
                         </div>
                       </div>
                    )}

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <label className="flex items-center gap-2 text-slate-600 font-bold mb-3"><div className="w-1 h-4 bg-slate-300 rounded-full"></div>附件檔案</label>
                      <div className="space-y-2">
                        {faq.files.map((file, fIdx) => (
                          <div key={`${file.id}-${fIdx}`} className="flex gap-2 items-center bg-slate-50 p-2 border border-slate-200 rounded">
                             <select className="p-1.5 border border-slate-300 rounded text-sm bg-white focus:border-sky-500 outline-none" value={file.type} onChange={e => updateFaqFile(i, fIdx, 'type', e.target.value)}>
                               <option value="pdf">PDF</option>
                               <option value="word">Word</option>
                               <option value="excel">Excel</option>
                               <option value="ppt">PPT</option>
                             </select>
                             <input type="text" placeholder="顯示名稱" className="flex-1 p-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" value={file.name} onChange={e => updateFaqFile(i, fIdx, 'name', e.target.value)} />
                             <input type="text" placeholder="完整檔名 (.pdf/.doc)/路徑" className="flex-1 p-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" value={file.url} onChange={e => updateFaqFile(i, fIdx, 'url', e.target.value)} />
                             <button onClick={() => removeFaqFile(i, fIdx)} className="text-red-500 hover:bg-red-50 px-2 py-1.5 rounded text-sm font-medium transition-colors">移除</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addFaqFile(i)} className="mt-2 text-xs text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded hover:bg-sky-100 font-medium transition-colors shadow-sm">+ 新增附件</button>
                    </div>
                 </div>

                 {/* Divider 1 */}
                 <div 
                   className="hidden 2xl:flex w-2 bg-slate-100 hover:bg-sky-400 cursor-col-resize shrink-0 transition-colors items-center justify-center relative z-10 group border-x border-slate-200"
                   onMouseDown={(e) => handleMouseDown(e, 'pane2')}
                 >
                   <div className="flex gap-[2px]">
                     <div className="w-[1px] h-6 bg-slate-300 group-hover:bg-white/60"></div>
                     <div className="w-[1px] h-6 bg-slate-300 group-hover:bg-white/60"></div>
                   </div>
                 </div>

                 {/* 2. 此題目的預覽 */}
                 <div className="w-full 2xl:w-[var(--pane2-width)] shrink-0 p-5 bg-slate-50 flex flex-col">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</div>此題目的預覽
                    </h4>
                    <div className="flex-1 faq-preview-wrapper min-h-[300px] !flex-col" style={{
                      '--faq-accent': category.color || '#64748b',
                      '--hover-color': category.color || '#64748b',
                      '--active-bg': category.color || '#64748b',
                      '--sub-active-bg': `${category.color || '#64748b'}26`,
                      '--sub-active-text': category.color || '#64748b',
                    } as React.CSSProperties}>
                      
                       <div className="w-full p-4">
                         {faq.middle && (
                           <div className="faq-section-header mb-6">
                             <h3>{faq.middle}</h3>
                           </div>
                         )}

                         {faq.minor && (
                           <h4 className="flex items-center gap-2 mb-4 text-slate-500 font-medium">
                             <Icons.Tag className="w-4 h-4" /> {faq.minor}
                           </h4>
                         )}
                        
                         <article className="faq-card active m-0 shadow-sm border border-slate-200">
                           <div className="faq-card-button cursor-default pointer-events-none">
                             <div className="flex flex-col gap-2 flex-1">
                               <div className="flex items-center gap-2">
                                 <span 
                                   className="faq-minor-tag" 
                                   style={{ backgroundColor: `${category.color || '#64748b'}1a`, color: category.color || '#64748b' }}
                                 >
                                   {faq.minor || '小分類'}
                                 </span>
                                 <span className="faq-question-text" style={{ color: category.color || '#64748b', fontWeight: 'bold' }}>
                                   {faq.question || '（尚未輸入問題）'}
                                 </span>
                               </div>
                             </div>
                             <Icons.ChevronDown className="w-5 h-5 mt-1" style={{ color: category.color || '#64748b' }} />
                           </div>
                         
                         <div className="faq-answer-pane" style={{ display: 'block' }}>
                           {faq.answerType === 'rich-text' && faq.answerContent ? (
                             faq.answerContent.map((block, idx) => {
                               switch (block.type) {
                                 case 'p':
                                   return <div key={idx} className="mb-2 text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{__html: processRichText(block.text || "")}}></div>;
                                 case 'h4':
                                   return <div key={idx} className="font-bold text-slate-800 mt-4 mb-2" dangerouslySetInnerHTML={{__html: processRichText(block.text || "")}}></div>;
                                 case 'hr':
                                   return <div key={idx} className="my-6" style={{ height: '1px', backgroundImage: `linear-gradient(to right, transparent, ${category.color || '#64748b'}, transparent)`, opacity: 0.6 }}></div>;
                                 case 'list':
                                   return (
                                     <div key={idx} className="mb-3">
                                       {(block.items || []).map((it, i) => {
                                         const isNumeric = /^\\d+\\./.test(it.trim());
                                         return (
                                           <div key={i} className="mb-1.5 ml-4 flex gap-1 text-slate-600">
                                             {!isNumeric && <strong style={{ color: category.color || '#64748b' }}>‧</strong>}
                                             <span className={isNumeric ? "ml-[-0.5rem]" : ""} dangerouslySetInnerHTML={{__html: processRichText(it || "", true)}}></span>
                                            </div>
                                         )
                                       })}
                                     </div>
                                   );
                                 case 'img':
                                   return (
                                     <div key={idx} className="flex flex-col mb-4">
                                       {block.title && <div className="font-bold text-slate-800 mb-2">{block.title}</div>}
                                       <div className="w-full bg-slate-100 rounded-md flex items-center justify-center p-4 border border-slate-200" style={{ minHeight: '150px' }}>
                                         <div className="flex flex-col items-center gap-2 text-slate-400">
                                           <Icons.Image className="w-8 h-8" />
                                           <span className="text-sm">{block.alt || block.src || 'Preview...'}</span>
                                         </div>
                                       </div>
                                     </div>
                                   );
                                 default:
                                   return null;
                               }
                             })
                           ) : (
                             <div className="whitespace-pre-wrap text-slate-600 leading-relaxed">{faq.answer || '（尚未輸入回答）'}</div>
                           )}
                           
                           {faq.files && faq.files.length > 0 && (
                             <div className="mt-6 pt-4 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-3 text-slate-500 font-medium text-sm">
                                  <Icons.Paperclip className="w-4 h-4" /> 附件檔案
                                </div>
                                {faq.files.map((file, idx) => {
                                  const isPdf = file.type === 'pdf';
                                  const isWord = file.type === 'word';
                                  const isPpt = file.type === 'ppt';
                                  const isExcel = file.type === 'excel';
                                  const fColor = isPdf ? '#ef4444' : isExcel ? '#22c55e' : isWord ? '#3b82f6' : isPpt ? '#f59e0b' : '#64748b';
                                  
                                  let FileIcon = Icons.FileText;
                                  if (isPpt) FileIcon = Icons.Presentation;
                                  if (isExcel) FileIcon = Icons.FileSpreadsheet;
                                  if (!isPdf && !isWord && !isPpt && !isExcel) FileIcon = Icons.File;

                                  return (
                                    <div key={idx} className="faq-file-item group mb-2 last:mb-0">
                                      <div className="flex items-center gap-3">
                                        <div className="faq-file-icon-wrapper">
                                          <FileIcon className="w-5 h-5" style={{ color: fColor }} />
                                        </div>
                                        <span className="font-medium text-sm text-slate-700">{file.name || '未命名檔案'}</span>
                                      </div>
                                      <Icons.Download className="w-4 h-4 text-slate-300" />
                                    </div>
                                  )
                                })}
                             </div>
                           )}
                         </div>
                       </article>
                       </div>

                    </div>
                 </div>

                 {/* Divider 2 */}
                 <div 
                   className="hidden 2xl:flex w-2 bg-slate-100 hover:bg-sky-400 cursor-col-resize shrink-0 transition-colors items-center justify-center relative z-10 group border-l border-slate-200 border-r border-slate-800"
                   onMouseDown={(e) => handleMouseDown(e, 'pane3')}
                 >
                   <div className="flex gap-[2px]">
                     <div className="w-[1px] h-6 bg-slate-300 group-hover:bg-slate-400"></div>
                     <div className="w-[1px] h-6 bg-slate-300 group-hover:bg-slate-400"></div>
                   </div>
                 </div>

                 {/* 3. JSON 預覽與匯出 */}
                 <div className="w-full 2xl:w-[var(--pane3-width)] shrink-0 p-5 bg-slate-900 flex flex-col">
                    <h4 className="font-bold text-white mb-2 flex items-center justify-between">
                       <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs">3</div>JSON 預覽</span>
                        <button onClick={() => {
                          const { category: cat, sub, middle, ...rest } = faq;
                          const mappedFaq = {
                            id: rest.id,
                            category: category.hasSubcategories && sub ? `${category.name}(${sub})` : category.name || cat,
                            sub: middle,
                            minor: rest.minor,
                            question: rest.question,
                            answerType: rest.answerType,
                            answer: rest.answer,
                            answerContent: rest.answerContent,
                            files: rest.files
                          };
                          navigator.clipboard.writeText(JSON.stringify(mappedFaq, null, 2))
                        }} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors uppercase tracking-wider font-bold">Copy JSON</button>
                     </h4>
                     <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 mt-2 min-h-[300px]">
                        <JsonTextarea 
                          faq={faq} 
                          category={category}
                          onChange={(parsed) => {
                               const newFaqs = [...faqs];
                               newFaqs[i] = {
                                 ...newFaqs[i],
                                 minor: parsed.minor !== undefined ? parsed.minor : newFaqs[i].minor,
                                 middle: parsed.sub !== undefined ? parsed.sub : newFaqs[i].middle,
                                 question: parsed.question !== undefined ? parsed.question : newFaqs[i].question,
                                 answerType: parsed.answerType !== undefined ? parsed.answerType : newFaqs[i].answerType,
                                 answer: parsed.answer !== undefined ? parsed.answer : newFaqs[i].answer,
                                 answerContent: parsed.answerContent !== undefined ? parsed.answerContent : newFaqs[i].answerContent,
                                 files: parsed.files !== undefined ? parsed.files : newFaqs[i].files,
                               };
                               const catRaw = parsed.category || '';
                               const match = catRaw.match(/[(（]([^)）]+)[)）]/);
                               if (match) {
                                  newFaqs[i].sub = match[1];
                               } else {
                                  newFaqs[i].sub = '';
                               }
                               // Do not call setFaqs instantly every keystroke if it gets slow, but in React it's usually fine for small JSON
                               setFaqs(newFaqs);
                          }}
                        />
                    </div>
                 </div>
               </div>
               )}
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
               <div className="text-slate-400 mb-3 flex justify-center"><Icons.MessageCircle className="w-12 h-12 opacity-50" /></div>
               <p className="text-sm font-medium text-slate-600 mb-4">目前尚無問答資料</p>
               <button onClick={addFaq} className="px-5 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-sky-600 transition-colors">+ 立即新增第一筆問答</button>
            </div>
          )}
        </div>
      </section>
      </div>
        )}

      </div>
    </div>
  );
};
