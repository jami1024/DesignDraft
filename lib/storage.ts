import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

import type { CreateProjectInput, CreateSourceDocumentInput, PageSuggestion, Project, SourceDocument, UpdateProjectInput } from "@/types";

const DEFAULT_WORKSPACE_DIR = ".workspace";
const PROJECTS_DIR = "projects";
const SHARES_DIR = "shares";
const SKILLS_DIR = "skills";
const PROJECT_METADATA_FILE = "project.json";
const DOCUMENT_METADATA_FILE = "metadata.json";
const DEFAULT_SKILL_ID = "ui-ux-pro-max";

function assertSafePathSegment(value: string, label: string) {
  if (!value || value === "." || value === ".." || value.includes("/") || value.includes("\\")) {
    throw new Error(`Invalid ${label}`);
  }
}

export function getWorkspaceDir() {
  return path.resolve(process.cwd(), process.env.DESIGNDRAFT_WORKSPACE_DIR ?? DEFAULT_WORKSPACE_DIR);
}

export function resolveWorkspacePath(...segments: string[]) {
  const workspaceDir = getWorkspaceDir();
  const resolvedPath = path.resolve(workspaceDir, ...segments);
  const relativePath = path.relative(workspaceDir, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid path outside workspace");
  }

  return resolvedPath;
}

export function getProjectsRootPath() {
  return resolveWorkspacePath(PROJECTS_DIR);
}

export function getProjectPath(projectId: string) {
  assertSafePathSegment(projectId, "projectId");
  return resolveWorkspacePath(PROJECTS_DIR, projectId);
}

export function getProjectMetadataPath(projectId: string) {
  return path.join(getProjectPath(projectId), PROJECT_METADATA_FILE);
}

export function getProjectUploadsPath(projectId: string) {
  return path.join(getProjectPath(projectId), "uploads");
}

export function getProjectExtractedPath(projectId: string) {
  return path.join(getProjectPath(projectId), "extracted");
}

export function getProjectDocumentsPath(projectId: string) {
  return path.join(getProjectPath(projectId), "documents");
}

export function getSourceDocumentPath(projectId: string, documentId: string) {
  assertSafePathSegment(documentId, "documentId");
  return path.join(getProjectDocumentsPath(projectId), documentId);
}

export function getSourceDocumentMetadataPath(projectId: string, documentId: string) {
  return path.join(getSourceDocumentPath(projectId, documentId), DOCUMENT_METADATA_FILE);
}

export function getProjectImagesPath(projectId: string) {
  return path.join(getProjectPath(projectId), "images");
}

export function getProjectSuggestionsPath(projectId: string) {
  return path.join(getProjectPath(projectId), "suggestions");
}

export function getProjectSuggestionsFilePath(projectId: string) {
  return path.join(getProjectSuggestionsPath(projectId), "suggestions.json");
}

export function getProjectPagesPath(projectId: string) {
  return path.join(getProjectPath(projectId), "pages");
}

export function getPagePath(projectId: string, pageId: string) {
  assertSafePathSegment(pageId, "pageId");
  return path.join(getProjectPagesPath(projectId), pageId);
}

export function getPageVersionHtmlPath(projectId: string, pageId: string, versionId: string) {
  assertSafePathSegment(versionId, "versionId");
  return path.join(getPagePath(projectId, pageId), `${versionId}.html`);
}

export function getSharesPath() {
  return resolveWorkspacePath(SHARES_DIR);
}

export function getSkillsPath() {
  return resolveWorkspacePath(SKILLS_DIR);
}

export async function ensureWorkspace() {
  await Promise.all([
    mkdir(getProjectsRootPath(), { recursive: true }),
    mkdir(getSharesPath(), { recursive: true }),
    mkdir(getSkillsPath(), { recursive: true }),
  ]);
}

export async function ensureProjectDirectories(projectId: string) {
  await Promise.all([
    mkdir(getProjectUploadsPath(projectId), { recursive: true }),
    mkdir(getProjectExtractedPath(projectId), { recursive: true }),
    mkdir(getProjectDocumentsPath(projectId), { recursive: true }),
    mkdir(getProjectImagesPath(projectId), { recursive: true }),
    mkdir(getProjectSuggestionsPath(projectId), { recursive: true }),
    mkdir(getProjectPagesPath(projectId), { recursive: true }),
  ]);
}

export async function pathExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export async function writeJsonFile<T>(filePath: string, value: T): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Project name is required");
  }

  await ensureWorkspace();

  const now = new Date().toISOString();
  const project: Project = {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now,
    sourceDocumentIds: [],
    pageIds: [],
    currentSkillId: DEFAULT_SKILL_ID,
  };

  await ensureProjectDirectories(project.id);
  await writeJsonFile(getProjectMetadataPath(project.id), project);

  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const metadataPath = getProjectMetadataPath(projectId);

  if (!(await pathExists(metadataPath))) {
    return null;
  }

  return readJsonFile<Project>(metadataPath);
}

export async function listProjects(): Promise<Project[]> {
  await ensureWorkspace();

  const entries = await readdir(getProjectsRootPath(), { withFileTypes: true });
  const projects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => getProject(entry.name)),
  );

  return projects
    .filter((project): project is Project => project !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  const existingProject = await getProject(projectId);

  if (!existingProject) {
    throw new Error("Project not found");
  }

  const nextName = input.name === undefined ? existingProject.name : input.name.trim();

  if (!nextName) {
    throw new Error("Project name is required");
  }

  const updatedProject: Project = {
    ...existingProject,
    ...input,
    name: nextName,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonFile(getProjectMetadataPath(projectId), updatedProject);

  return updatedProject;
}

export async function deleteProject(projectId: string): Promise<void> {
  await rm(getProjectPath(projectId), { recursive: true, force: true });
}

export async function createSourceDocument(input: CreateSourceDocumentInput): Promise<SourceDocument> {
  const project = await getProject(input.projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const now = new Date().toISOString();
  const document: SourceDocument = {
    id: nanoid(),
    projectId: input.projectId,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    originalPath: input.originalPath,
    extractedTextPath: input.extractedTextPath,
    imagesPaths: input.imagesPaths,
    createdAt: now,
  };

  await writeJsonFile(getSourceDocumentMetadataPath(input.projectId, document.id), document);

  const nextSourceDocumentIds = project.sourceDocumentIds.includes(document.id)
    ? project.sourceDocumentIds
    : [...project.sourceDocumentIds, document.id];

  await updateProject(input.projectId, { sourceDocumentIds: nextSourceDocumentIds });

  return document;
}

export async function getSourceDocument(
  projectId: string,
  documentId: string,
): Promise<SourceDocument | null> {
  const metadataPath = getSourceDocumentMetadataPath(projectId, documentId);

  if (!(await pathExists(metadataPath))) {
    return null;
  }

  return readJsonFile<SourceDocument>(metadataPath);
}

export async function listSourceDocuments(projectId: string): Promise<SourceDocument[]> {
  const documentsPath = getProjectDocumentsPath(projectId);

  if (!(await pathExists(documentsPath))) {
    return [];
  }

  const entries = await readdir(documentsPath, { withFileTypes: true });
  const documents = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => getSourceDocument(projectId, entry.name)),
  );

  return documents
    .filter((document): document is SourceDocument => document !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function savePageSuggestions(
  projectId: string,
  suggestions: PageSuggestion[],
): Promise<PageSuggestion[]> {
  const project = await getProject(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  await writeJsonFile(getProjectSuggestionsFilePath(projectId), suggestions);

  return suggestions;
}

export async function listPageSuggestions(projectId: string): Promise<PageSuggestion[]> {
  const suggestionsPath = getProjectSuggestionsFilePath(projectId);

  if (!(await pathExists(suggestionsPath))) {
    return [];
  }

  return readJsonFile<PageSuggestion[]>(suggestionsPath);
}
