import type { AgencyCtx } from "../agencyTypes";

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

export async function api<T = any>(ctx: AgencyCtx, path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init.method || "GET",
      headers: ctx.authHeaders(),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (res.status === 401) ctx.onUnauthorized();
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, data: { error: ctx.isPolish ? "Błąd połączenia z serwerem." : "Connection error." } as any };
  }
}

export async function downloadFile(ctx: AgencyCtx, path: string, fallbackName: string): Promise<boolean> {
  try {
    const res = await fetch(path, { headers: ctx.authHeaders() });
    if (res.status === 401) ctx.onUnauthorized();
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      ctx.showToast(d.error || (ctx.isPolish ? "Nie udało się pobrać pliku." : "Download failed."));
      return false;
    }
    const cd = res.headers.get("content-disposition") || "";
    const m = /filename="([^"]+)"/.exec(cd);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = m ? m[1] : fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    ctx.showToast(ctx.isPolish ? "Nie udało się pobrać pliku." : "Download failed.");
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
