const DOC_EXTENSION_PATTERN = /\.(cls|mac|int|inc|csp)$/i;

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function encodePathPart(value: string): string {
  return encodeURIComponent(value);
}

export function ensureClassDocumentName(className: string): string {
  return DOC_EXTENSION_PATTERN.test(className) ? className : `${className}.cls`;
}

export function ensureRoutineDocumentName(routineName: string): string {
  return DOC_EXTENSION_PATTERN.test(routineName) ? routineName : `${routineName}.mac`;
}

export function v1(namespace: string, path = ""): string {
  return `v1/${encodePathPart(namespace)}${path}`;
}

export function v2(namespace: string, path = ""): string {
  return `v2/${encodePathPart(namespace)}${path}`;
}

export function apiVersion(version: string, namespace: string, path = ""): string {
  return `${version}/${encodePathPart(namespace)}${path}`;
}

export function docPath(docName: string): string {
  return `/doc/${encodePathPart(docName)}`;
}
