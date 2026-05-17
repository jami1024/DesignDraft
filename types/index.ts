export type IsoDateString = string;

export type Complexity = "low" | "medium" | "high";

export type PageVersionSource =
  | "initial-generation"
  | "selection-optimization"
  | "chat-optimization"
  | "rollback";

export type Project = {
  id: string;
  name: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  sourceDocumentIds: string[];
  pageIds: string[];
  currentSkillId: string;
  textInput?: string;
};

export type SourceDocument = {
  id: string;
  projectId: string;
  originalFileName: string;
  mimeType: string;
  originalPath: string;
  extractedTextPath: string;
  imagesPaths?: string[];
  createdAt: IsoDateString;
};

export type DesignRegister = "brand" | "product";

export type PageSuggestion = {
  id: string;
  projectId: string;
  name: string;
  purpose: string;
  audience: string;
  modules: string[];
  recommendedSkillIds: string[];
  visualDirection: string;
  complexity: Complexity;
  register?: DesignRegister;
  designRules?: string;
};

export type GeneratedPage = {
  id: string;
  projectId: string;
  suggestionId: string;
  name: string;
  currentVersionId: string;
  versionIds: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type PageVersion = {
  id: string;
  pageId: string;
  versionNumber: number;
  htmlPath: string;
  previewPath: string;
  createdAt: IsoDateString;
  changeSummary: string;
  skillSnapshot: string[];
  source: PageVersionSource;
};

export type SelectionOptimizationRequest = {
  projectId: string;
  pageId: string;
  versionId: string;
  selectedElementHtml: string;
  selectedElementPath: string;
  selectedElementText?: string;
  userInstruction: string;
};

export type ShareLink = {
  id: string;
  shareToken: string;
  projectId: string;
  pageId: string;
  versionId: string;
  passwordHash?: string;
  expiresAt: IsoDateString;
  createdAt: IsoDateString;
  accessCount: number;
  isRevoked: boolean;
};

export type ChatAttachment = {
  name: string;
  url: string;
  type: "image" | "file";
  size?: string;
};

export type DesignDirection = {
  id: string;
  name: string;
  description: string;
  palette: string[];
  colorStrategy: string;
  typography: {
    display: string;
    body: string;
  };
  register: DesignRegister;
  visualCharacteristics: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  suggestions?: PageSuggestion[];
  designDirections?: DesignDirection[];
  generatedVersion?: number;
  attachments?: ChatAttachment[];
  timestamp: number;
};

export type ProjectDesignMemory = {
  version: 1;
  palette: {
    colors: string[];
    colorStrategy?: string;
  };
  typography: {
    families: string[];
    display?: string;
    body?: string;
    mono?: string;
  };
  register?: DesignRegister;
  visualCharacteristics: string[];
  pageContributions: ProjectDesignMemoryPageEntry[];
  updatedAt: IsoDateString;
};

export type ProjectDesignMemoryPageEntry = {
  pageId: string;
  pageName: string;
  register?: DesignRegister;
  visualDirection: string;
  extractedAt: IsoDateString;
};

export type CreateProjectInput = {
  name: string;
};

export type UpdateProjectInput = Partial<Pick<Project, "name" | "textInput" | "sourceDocumentIds" | "pageIds" | "currentSkillId">>;

export type CreateSourceDocumentInput = {
  projectId: string;
  originalFileName: string;
  mimeType: string;
  originalPath: string;
  extractedTextPath: string;
  imagesPaths?: string[];
};
