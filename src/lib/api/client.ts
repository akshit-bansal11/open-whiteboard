export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    throw new ApiError(
      res.status,
      typeof body.detail === "string" ? body.detail : "Unknown error",
      typeof body.title === "string" ? body.title : res.statusText,
    )
  }
  return res.json() as Promise<T>
}

export async function apiPost<TBody, TResponse>(
  url: string,
  body: TBody,
): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return handleResponse<TResponse>(res)
}

export async function apiGet<TResponse>(url: string): Promise<TResponse> {
  const res = await fetch(url)
  return handleResponse<TResponse>(res)
}
