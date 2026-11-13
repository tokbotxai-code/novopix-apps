// Zrzut całej strony (telefon) z zaznaczonymi elementami, które nie przeszły automatycznych kontroli dostępności.
// Dane pochodzą z Google Lighthouse (audyt full-page-screenshot + pozycje węzłów), bez uruchamiania przeglądarki na naszym serwerze.
import type { VisualData, VisualMark } from "../src/utils/visualTypes";

const MAX_IMAGE_CHARS = 1_300_000;
const MAX_MARKS = 30;
const MAX_PER_KIND = 8;

export function extractVisual(lighthouse: any): VisualData | null {
  try {
    const fps = lighthouse?.audits?.["full-page-screenshot"]?.details;
    const shot = fps?.screenshot;
    if (!shot?.data || typeof shot.data !== "string" || !shot.width || !shot.height || shot.data.length > MAX_IMAGE_CHARS) return null;
    const nodes: Record<string, any> = fps.nodes || {};
    const refs: { id: string }[] = lighthouse?.categories?.accessibility?.auditRefs || [];
    const marks: VisualMark[] = [];
    const perKind: Record<string, number> = {};
    const seen = new Set<string>();
    const collect = (item: any, id: string, title: string) => {
      const lhId = item?.node?.lhId;
      const r = lhId ? nodes[lhId] : null;
      if (!r || !(r.width > 0) || !(r.height > 0) || r.top >= shot.height || seen.has(lhId + id)) return;
      if ((perKind[id] || 0) >= MAX_PER_KIND || marks.length >= MAX_MARKS) return;
      seen.add(lhId + id);
      perKind[id] = (perKind[id] || 0) + 1;
      marks.push({ kind: id, title, top: Math.max(0, r.top), left: Math.max(0, r.left), width: Math.min(r.width, shot.width), height: Math.min(r.height, shot.height - Math.max(0, r.top)) });
    };
    for (const ref of refs) {
      const a = lighthouse.audits?.[ref.id];
      if (!a || a.scoreDisplayMode === "notApplicable" || a.scoreDisplayMode === "manual" || a.score === null || a.score >= 1) continue;
      for (const it of a.details?.items || []) {
        collect(it, ref.id, String(a.title || ref.id));
        for (const sub of it?.subItems?.items || []) collect(sub, ref.id, String(a.title || ref.id));
      }
    }
    return { image: shot.data, width: shot.width, height: shot.height, marks };
  } catch {
    return null;
  }
}
