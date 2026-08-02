export function createApiClient(token: string) {
  const headers = (extra?: Record<string, string>) => ({
    Authorization: `Bearer ${token}`,
    ...extra,
  });

  async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async function post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async function put<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async function del<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  return { get, post, put, del };
}
