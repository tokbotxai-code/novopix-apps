import { Check } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function ChecklistTab({ app }: { app: AppState }) {
  const {
    checklistFilter,
    filteredChecklist,
    handleToggleChecklist,
    isPolish,
    setChecklistFilter,
  } = app;
  return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading">
                    {isPolish ? "Interaktywna Lista Kontrolna Wdrożenia (Dopasowana do Domeny)" : "Dynamic Optimization Checklist"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isPolish ? "Odznaczaj ukończone zadania podczas prac wdrożeniowych dla klienta." : "Check off completed tasks during client remediation."}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "all", label: isPolish ? "Wszystkie" : "All" },
                    { id: "pending", label: isPolish ? "Do wdrożenia" : "Pending" },
                    { id: "checked", label: isPolish ? "Ukończone" : "Completed" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setChecklistFilter(f.id as "all" | "pending" | "checked")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        checklistFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredChecklist.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => handleToggleChecklist(act.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      act.status === "checked"
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
                          act.status === "checked" ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                        }`}
                      >
                        {act.status === "checked" && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${act.status === "checked" ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{act.description}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">{app.roiAllowed ? act.impact : act.impact.replace(/^[\d.,]+h\s*·\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
  );
}
