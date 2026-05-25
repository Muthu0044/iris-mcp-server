import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { AppConfig } from "../config/env.js";
import type { Logger } from "../utils/logger.js";
import { IrisError, mapUnknownError } from "./errors.js";
import { apiVersion, docPath, ensureClassDocumentName, ensureRoutineDocumentName, normalizeBaseUrl } from "./endpoints.js";

type AtelierStatus = {
  errors?: unknown[];
  summary?: string;
};

type AtelierEnvelope<T> = {
  status?: AtelierStatus;
  console?: string[];
  result?: T;
};

type AtelierContent<T> = {
  content: T;
};

export type AtelierDocument = {
  name: string;
  db: string;
  ts: string;
  cat: string;
  status: string;
  enc: boolean;
  content: string[];
};

export type AtelierDocumentDescriptor = {
  name: string;
  cat: string;
  ts: string;
  db: string;
  gen?: boolean;
};

export type CompileResult = {
  console: string[];
  result: unknown;
};

export type SearchResult = {
  console: string[];
  results: unknown;
};

export class AtelierClient {
  private readonly http: AxiosInstance;
  private readonly namespace: string;
  private readonly apiVersion: string;
  private readonly maxRetries: number;
  private readonly logger: Logger;

  constructor(config: AppConfig, logger: Logger) {
    this.namespace = config.IRIS_NAMESPACE;
    this.apiVersion = config.IRIS_API_VERSION;
    this.maxRetries = config.IRIS_MAX_RETRIES;
    this.logger = logger;
    this.http = axios.create({
      baseURL: normalizeBaseUrl(config.IRIS_BASE_URL),
      timeout: config.IRIS_REQUEST_TIMEOUT_MS,
      auth: {
        username: config.IRIS_USERNAME,
        password: config.IRIS_PASSWORD
      },
      headers: {
        Accept: "application/json"
      }
    });
  }

  async getNamespace(): Promise<unknown> {
    const response = await this.request<AtelierEnvelope<AtelierContent<unknown>>>({
      method: "GET",
      url: apiVersion(this.apiVersion, this.namespace)
    });
    return this.unwrapContent(response);
  }

  async listClasses(options: { package?: string; limit?: number }): Promise<AtelierDocumentDescriptor[]> {
    const response = await this.request<AtelierEnvelope<AtelierContent<AtelierDocumentDescriptor[]>>>({
      method: "GET",
      url: apiVersion(this.apiVersion, this.namespace, "/docnames")
    });

    const docs = this.unwrapContent(response).filter((doc) => {
      const isClass = doc.cat === "CLS" || doc.name.toLowerCase().endsWith(".cls");
      const matchesPackage = options.package ? doc.name.toLowerCase().startsWith(`${options.package.toLowerCase()}.`) : true;
      return isClass && matchesPackage;
    });

    return typeof options.limit === "number" ? docs.slice(0, options.limit) : docs;
  }

  async getClass(className: string): Promise<AtelierDocument> {
    const docName = ensureClassDocumentName(className);
    const response = await this.request<AtelierEnvelope<AtelierDocument>>({
      method: "GET",
      url: apiVersion(this.apiVersion, this.namespace, docPath(docName)),
      params: {
        format: "udl"
      }
    });
    return this.unwrapDocument(response);
  }

  async saveClass(className: string, content: string): Promise<AtelierDocument> {
    const docName = ensureClassDocumentName(className);
    return this.saveDocument(docName, content);
  }

  async compileClass(className: string): Promise<CompileResult> {
    const docName = ensureClassDocumentName(className);
    const response = await this.request<AtelierEnvelope<unknown>>({
      method: "POST",
      url: apiVersion(this.apiVersion, this.namespace, "/action/compile"),
      params: {
        flags: "cuk"
      },
      headers: {
        "Content-Type": "application/json"
      },
      data: [docName]
    });

    this.assertEnvelopeOk(response);
    return {
      console: response.console ?? [],
      result: response.result ?? {}
    };
  }

  async getRoutine(routineName: string): Promise<AtelierDocument> {
    const docName = ensureRoutineDocumentName(routineName);
    const response = await this.request<AtelierEnvelope<AtelierDocument>>({
      method: "GET",
      url: apiVersion(this.apiVersion, this.namespace, docPath(docName))
    });
    return this.unwrapDocument(response);
  }

  async saveRoutine(routineName: string, content: string): Promise<AtelierDocument> {
    return this.saveDocument(ensureRoutineDocumentName(routineName), content);
  }

  async searchText(options: {
    query: string;
    documents?: string;
    regex?: boolean;
    includeSystem?: boolean;
    includeGenerated?: boolean;
    max?: number;
    wholeWord?: boolean;
    caseSensitive?: boolean;
    wildcards?: boolean;
  }): Promise<SearchResult> {
    const response = await this.request<AtelierEnvelope<unknown>>({
      method: "GET",
      url: apiVersion(this.apiVersion, this.namespace, "/action/search"),
      params: {
        query: options.query,
        documents: options.documents ?? "*.cls,*.mac,*.int,*.inc",
        regex: options.regex === undefined ? 0 : Number(options.regex),
        sys: Number(options.includeSystem ?? false),
        gen: Number(options.includeGenerated ?? false),
        max: options.max ?? 200,
        word: Number(options.wholeWord ?? false),
        case: Number(options.caseSensitive ?? true),
        wild: Number(options.wildcards ?? false)
      }
    });

    this.assertEnvelopeOk(response);
    return {
      console: response.console ?? [],
      results: response.result ?? []
    };
  }

  async getNamespaceMetadata(): Promise<unknown> {
    return this.getNamespace();
  }

  async getDocumentIndex(documentName: string): Promise<unknown> {
    const response = await this.request<AtelierEnvelope<AtelierContent<unknown[]>>>({
      method: "POST",
      url: apiVersion(this.apiVersion, this.namespace, "/action/index"),
      headers: {
        "Content-Type": "application/json"
      },
      data: [documentName]
    });
    return this.unwrapContent(response);
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    let attempt = 0;
    const started = Date.now();

    while (true) {
      try {
        const response = await this.http.request<T>(config);
        this.logger.debug(
          {
            endpoint: config.url,
            method: config.method,
            statusCode: response.status,
            durationMs: Date.now() - started
          },
          "IRIS request completed"
        );
        return response.data;
      } catch (error) {
        const mapped = mapUnknownError(error);
        if (attempt < this.maxRetries && this.canRetry(mapped)) {
          attempt += 1;
          continue;
        }

        this.logger.error(
          {
            endpoint: config.url,
            method: config.method,
            statusCode: mapped.statusCode,
            durationMs: Date.now() - started,
            err: mapped,
            details: mapped.details
          },
          "IRIS request failed"
        );
        throw mapped;
      }
    }
  }

  private canRetry(error: IrisError): boolean {
    return error.code === "IRIS_TIMEOUT" || error.statusCode === 502 || error.statusCode === 503 || error.statusCode === 504;
  }

  private async saveDocument(docName: string, content: string): Promise<AtelierDocument> {
    const response = await this.request<AtelierEnvelope<AtelierDocument>>({
      method: "PUT",
      url: apiVersion(this.apiVersion, this.namespace, docPath(docName)),
      params: {
        ignoreConflict: 1
      },
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        enc: false,
        content: content.split(/\r?\n/)
      }
    });
    return this.unwrapDocument(response);
  }

  private unwrapContent<T>(envelope: AtelierEnvelope<AtelierContent<T>>): T {
    this.assertEnvelopeOk(envelope);
    if (!envelope.result || !("content" in envelope.result)) {
      throw new IrisError("IRIS_RESPONSE_SHAPE", "IRIS response did not include result.content", { details: envelope });
    }
    return envelope.result.content;
  }

  private unwrapDocument(envelope: AtelierEnvelope<AtelierDocument>): AtelierDocument {
    this.assertEnvelopeOk(envelope);
    if (!envelope.result) {
      throw new IrisError("IRIS_RESPONSE_SHAPE", "IRIS response did not include a document result", { details: envelope });
    }
    if (envelope.result.status) {
      throw new IrisError("IRIS_DOCUMENT_ERROR", envelope.result.status, { details: envelope.result });
    }
    return envelope.result;
  }

  private assertEnvelopeOk(envelope: AtelierEnvelope<unknown>): void {
    const errors = envelope.status?.errors ?? [];
    const summary = envelope.status?.summary ?? "";
    if (errors.length > 0 || summary) {
      throw new IrisError("IRIS_STATUS_ERROR", summary || "IRIS returned status errors", { details: envelope.status });
    }
  }
}
