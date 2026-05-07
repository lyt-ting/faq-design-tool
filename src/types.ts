export type ContactConfig = {
  id: string;
  targetId: string; // 'main' for the main category, or subcategory ID
  title: string;
  desc: string;
};

export type CategoryConfig = {
  id: string; // Internal id for tracking
  name: string;
  icon: string;
  color: string;
  comment: string;
  hasSubcategories: boolean;
  subcategories: { id: string; name: string; icon: string }[];
  contacts: ContactConfig[];
};

export type FaqFile = {
  id: string; // Internal unique ID
  name: string;
  type: 'word' | 'ppt' | 'excel' | 'pdf' | 'other';
  url: string;
};

export type AnswerBlock =
  | { type: 'p'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'hr' }
  | { type: 'img'; src: string; alt: string; title?: string }
  | { type: 'list'; items: string[] };

export type FaqItem = {
  id: string; // generated ex os-flow-001
  category: string; // The main category ID it belongs to
  sub: string;
  middle?: string;
  minor: string;
  question: string;
  answerType: 'text' | 'rich-text';
  answer?: string;
  answerContent?: AnswerBlock[];
  files: FaqFile[];
};
