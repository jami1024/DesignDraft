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
