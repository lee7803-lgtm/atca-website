const DEFAULT_API_BASE_URL = "http://localhost:5001";

export type ApiRequestOptions = Omit<RequestInit, "method" | "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") ||
    DEFAULT_API_BASE_URL
  );
}

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (
      typeof options.body === "string" ||
      options.body instanceof FormData ||
      options.body instanceof Blob ||
      options.body instanceof ArrayBuffer
    ) {
      body = options.body;
    } else {
      headers.set("content-type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    headers,
    body,
  });

  const responseBody = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      `ITCA API request failed with status ${response.status}`,
      response.status,
      responseBody,
    );
  }

  return responseBody as TResponse;
}

export const apiClient = {
  get: <TResponse>(path: string, options?: ApiRequestOptions) =>
    request<TResponse>("GET", path, options),
  post: <TResponse>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<TResponse>("POST", path, { ...options, body }),
  put: <TResponse>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<TResponse>("PUT", path, { ...options, body }),
  patch: <TResponse>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => request<TResponse>("PATCH", path, { ...options, body }),
  delete: <TResponse>(path: string, options?: ApiRequestOptions) =>
    request<TResponse>("DELETE", path, options),
};
