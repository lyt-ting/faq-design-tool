import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { CategoryConfig, FaqItem } from '../types';

interface ExportButtonProps {
  category: CategoryConfig;
  faqs: FaqItem[];
  previewId: string; // The ID of the preview element to capture
}

const createCodeTable = (jsonText: string) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "aaaaaa" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "aaaaaa" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: jsonText.split('\n').map(line => 
              new Paragraph({
                children: [
                   new TextRun({ text: line || " ", font: "Courier New", size: 20 })
                ]
              })
            )
          })
        ]
      })
    ]
  });
};

export const ExportButton: React.FC<ExportButtonProps> = ({ category, faqs, previewId }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const missingMiddle = faqs.some(f => !f.middle || f.middle.trim() === '');
    if (missingMiddle) {
      alert("匯出失敗：每筆問答項目的「中分類」為必填欄位，請確認皆已填寫。");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Generate formatted JSON for Categories
      const mappedCategory: any = {
        id: "留空",
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.hasSubcategories ? "group" : undefined,
        dataFile: "留空",
        _comment: category.comment || undefined,
      };
      
      if (category.hasSubcategories && category.subcategories.length > 0) {
        mappedCategory.children = category.subcategories.map(s => ({
          id: "留空",
          name: s.name,
          icon: s.icon,
          color: category.color,
          dataFile: "留空"
        }));
      }

      // 2. Generate formatted JSON for Contacts
      const mappedContact = (category.contacts || []).reduce((acc, contact) => {
        let key = `大分類_${category.name}(id)`;
        if (contact.targetId !== 'main') {
          const sub = category.subcategories?.find(s => s.id === contact.targetId);
          if (sub) {
            key = `子分類_${sub.name}(id)`;
          }
        }
        acc[key] = {
           title: contact.title,
           desc: contact.desc
        };
        return acc;
      }, {} as any);

      // 3. Capture Preview Image
      const previewEl = document.getElementById(previewId);
      let imgData = "";
      let imgWidth = 600;
      let imgHeight = 800;
      if (previewEl) {
        try {
          // Simply capture the element as it is currently displayed on screen
          const hiddenAncestors: { el: HTMLElement, oldDisplay: string, oldPosition: string, oldTop: string, oldLeft: string, oldOpacity: string }[] = [];
          
          let currentEl: HTMLElement | null = previewEl;
          while (currentEl && currentEl !== document.body) {
            const style = window.getComputedStyle(currentEl);
            if (style.display === 'none') {
              hiddenAncestors.push({
                el: currentEl,
                oldDisplay: currentEl.style.display,
                oldPosition: currentEl.style.position,
                oldTop: currentEl.style.top,
                oldLeft: currentEl.style.left,
                oldOpacity: currentEl.style.opacity
              });
              currentEl.style.display = 'block';
              currentEl.style.position = 'absolute';
              currentEl.style.top = '-9999px';
              currentEl.style.left = '-9999px';
              currentEl.style.opacity = '0';
            }
            currentEl = currentEl.parentElement;
          }

          const width = previewEl.clientWidth;
          const height = previewEl.clientHeight;
          
          imgData = await toPng(previewEl, { 
            quality: 0.8,
            pixelRatio: 1.5,
            backgroundColor: '#ffffff',
            canvasWidth: width * 1.5,
            canvasHeight: height * 1.5,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left',
              margin: '0',
              padding: '0'
            },
            fontEmbedCSS: '',
            skipFonts: true
          });
          
          // Restore ancestors
          for (const ancestor of hiddenAncestors) {
            ancestor.el.style.display = ancestor.oldDisplay;
            ancestor.el.style.position = ancestor.oldPosition;
            ancestor.el.style.top = ancestor.oldTop;
            ancestor.el.style.left = ancestor.oldLeft;
            ancestor.el.style.opacity = ancestor.oldOpacity;
          }
          
          imgWidth = 600;
          imgHeight = (height * imgWidth) / (width || 600);
          
          // 若圖片太高，等比例縮小以確保能塞進 Word 單頁
          if (imgHeight > 850) {
            const scale = 850 / imgHeight;
            imgHeight = 850;
            imgWidth = imgWidth * scale;
          }
        } catch (e) {
          console.warn("Failed to capture main preview image:", e);
        }
      }

      // 3.5 Capture Advanced Question Previews
      const advancedImages: { id: string, title: string, data: string, w: number, h: number }[] = [];
      for (const faq of faqs) {
        if (faq.answerType === 'rich-text') {
           const el = document.getElementById(`faq-preview-${faq.id}`);
           if (el) {
             try {
               const hiddenAncestors: { el: HTMLElement, oldDisplay: string, oldPosition: string, oldTop: string, oldLeft: string, oldOpacity: string }[] = [];
               
               let currentEl: HTMLElement | null = el;
               while (currentEl && currentEl !== document.body) {
                 const style = window.getComputedStyle(currentEl);
                 if (style.display === 'none') {
                   hiddenAncestors.push({
                     el: currentEl,
                     oldDisplay: currentEl.style.display,
                     oldPosition: currentEl.style.position,
                     oldTop: currentEl.style.top,
                     oldLeft: currentEl.style.left,
                     oldOpacity: currentEl.style.opacity
                   });
                   currentEl.style.display = 'block';
                   currentEl.style.position = 'absolute';
                   currentEl.style.top = '-9999px';
                   currentEl.style.left = '-9999px';
                   currentEl.style.opacity = '0';
                 }
                 currentEl = currentEl.parentElement;
               }

               const width = el.clientWidth;
               const height = el.clientHeight;
               
               const faqImgData = await toPng(el, { 
                 quality: 0.8,
                 pixelRatio: 1.5,
                 backgroundColor: '#ffffff',
                 canvasWidth: width * 1.5,
                 canvasHeight: height * 1.5,
                 style: {
                   transform: 'scale(1)',
                   transformOrigin: 'top left',
                   margin: '0',
                   padding: '0'
                 },
                 fontEmbedCSS: '',
                 skipFonts: true
               });
               
               for (const ancestor of hiddenAncestors) {
                 ancestor.el.style.display = ancestor.oldDisplay;
                 ancestor.el.style.position = ancestor.oldPosition;
                 ancestor.el.style.top = ancestor.oldTop;
                 ancestor.el.style.left = ancestor.oldLeft;
                 ancestor.el.style.opacity = ancestor.oldOpacity;
               }
               
               let w = 600;
               let h = (height * w) / (width || 600);
               
               if (h > 850) {
                 const scale = 850 / h;
                 h = 850;
                 w = w * scale;
               }

               advancedImages.push({
                 id: faq.id,
                 title: faq.question || '未命名的問題',
                 data: faqImgData,
                 w,
                 h
               });
             } catch (e) {
               console.warn(`Failed to capture advanced image for faq ${faq.id}:`, e);
             }
           }
        }
      }

      // 4. Create Document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              new Paragraph({
                text: "FAQ 資料匯出結果 (供 IT 匯入使用)",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: "本文件包含最新的分類設定、聯絡窗口設定與所有新增的問答 JSON，以及預覽截圖。",
                spacing: { after: 400 }
              }),
              new Paragraph({ text: "1. 畫面預覽圖", heading: HeadingLevel.HEADING_2 }),
              ...(imgData ? [
                new Paragraph({
                  children: [
                    // @ts-ignore
                    new ImageRun({
                      data: imgData.replace(/^data:image\/(png|jpeg);base64,/, ""),
                      transformation: { width: imgWidth, height: imgHeight },
                    })
                  ],
                  spacing: { after: 400 }
                })
              ] : [
                new Paragraph({ text: "(無法取得預覽圖)", spacing: { after: 400 }})
              ]),
              
              new Paragraph({ text: "2. categories.json 設定", heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: "請將以下設定複製至 categories.json 的陣列中，並補上必要的 ID 與 dataFile 路徑。", spacing: { after: 200 } }),
              createCodeTable(JSON.stringify([mappedCategory], null, 4)),
              new Paragraph({ text: " ", spacing: { after: 400 } }),

              new Paragraph({ text: "3. contacts.json 設定", heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: "若有聯絡窗口，請將以下物件合併至 contacts.json 中 (記得將外層 key 改為正確的大/小分類 ID)。", spacing: { after: 200 } }),
              createCodeTable(JSON.stringify(mappedContact, null, 4)),
              new Paragraph({ text: " ", spacing: { after: 400 } }),

              new Paragraph({ text: "4. 問答內容 JSON (請存為對應的 dataFile, 例 faq_xx.json)", heading: HeadingLevel.HEADING_2 }),
              ...(category.hasSubcategories ? (() => {
                  const groupedFaqs: Record<string, any[]> = {};
                  for (const faq of faqs) {
                    const subName = faq.sub || '綜合 (無選擇子類別)';
                    if (!groupedFaqs[subName]) groupedFaqs[subName] = [];
                    const { category: cat, sub, middle, ...rest } = faq;
                    groupedFaqs[subName].push({
                      id: rest.id,
                      category: sub ? `${category.name}(${sub})` : category.name || cat,
                      sub: middle,
                      minor: rest.minor,
                      question: rest.question,
                      answerType: rest.answerType,
                      answer: rest.answer,
                      answerContent: rest.answerContent,
                      files: rest.files
                    });
                  }
                  return Object.keys(groupedFaqs).flatMap(subName => [
                    new Paragraph({ text: `● 適用於子分類：${subName}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }),
                    createCodeTable(JSON.stringify(groupedFaqs[subName], null, 4)),
                    new Paragraph({ text: " ", spacing: { after: 300 } })
                  ]);
              })() : [
                  createCodeTable(JSON.stringify(faqs.map(faq => {
                    const { category: cat, sub, middle, ...rest } = faq;
                    return {
                      id: rest.id,
                      category: category.name || cat,
                      sub: middle,
                      minor: rest.minor,
                      question: rest.question,
                      answerType: rest.answerType,
                      answer: rest.answer,
                      answerContent: rest.answerContent,
                      files: rest.files
                    };
                  }), null, 4)),
                  new Paragraph({ text: " ", spacing: { after: 400 } })
              ]),
              
              ...(advancedImages.length > 0 ? [
                new Paragraph({ text: "5. 進階問答樣式確認截圖", heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: "以下為本次新增之進階問答的畫面截圖，供確認樣式與排版使用。", spacing: { after: 200 } }),
                ...advancedImages.flatMap(img => [
                  new Paragraph({ text: `[${img.id}] ${img.title}`, heading: HeadingLevel.HEADING_3 }),
                  new Paragraph({
                    children: [
                      // @ts-ignore
                      new ImageRun({
                        data: img.data.replace(/^data:image\/(png|jpeg);base64,/, ""),
                        transformation: { width: img.w, height: img.h },
                      })
                    ],
                    spacing: { after: 400 }
                  })
                ]),
                new Paragraph({ text: " " })
              ] : [])
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `FAQ_Export_${category.name || 'Untitled'}.docx`);

    } catch (err) {
      console.error(err);
      alert('匯出失敗，請查看主控台。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className={`px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-sky-400 transition-all border border-sky-600 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            匯出中...
        </>
      ) : (
        <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            匯出 Word 檔
        </>
      )}
    </button>
  );
};
