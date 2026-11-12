import { Calculator, Plus } from "lucide-react";
import React from "react";
import type { AppState } from "../state/useAppState";


export default function RoiCalculatorTab({ app }: { app: AppState }) {
  const {
    avgOrderValue,
    currency,
    currentConvRate,
    handleSaveCurrentToCrm,
    hasRoiAssumptions,
    hourlyRate,
    isPolish,
    monthlyVisitors,
    newTaskHours,
    newTaskTitle,
    projectedLiftPct,
    retainerMonthly,
    scopeSummary,
    scopeTasks,
    setActiveTab,
    setAvgOrderValue,
    setCurrency,
    setCurrentConvRate,
    setHourlyRate,
    setIsAcceptProposalOpen,
    setMonthlyVisitors,
    setNewTaskHours,
    setNewTaskTitle,
    setProjectedLiftPct,
    setRetainerMonthly,
    setScopeTasks,
    viewMode,
    roiStarted,
    setRoiStarted,
  } = app;
  if (!roiStarted) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4" data-testid="roi-empty">
        <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" />
          <span>{isPolish ? "Kosztorys & ROI" : "Quote & ROI"}</span>
        </h2>
        <p className="text-sm text-slate-600">{isPolish ? "Dodaj zadania i stawkę, aby policzyć kosztorys." : "Add tasks and a rate to calculate the quote."}</p>
        <div className="flex flex-wrap items-center gap-2">
          {(["PLN", "GBP", "EUR"] as const).map((curr) => (
            <button key={curr} onClick={() => setCurrency(curr)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${currency === curr ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{curr}</button>
          ))}
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            {isPolish ? `Stawka (${currency}/h)` : `Rate (${currency}/h)`}
            <input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value) || 0)} className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRoiStarted(true)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer">{isPolish ? "Wczytaj zadania ze skanu" : "Load tasks from the scan"}</button>
          <button onClick={() => { setScopeTasks([]); setRoiStarted(true); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer">{isPolish ? "Zacznij od pustej listy" : "Start with an empty list"}</button>
        </div>
      </div>
    );
  }
  return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                    <span>
                      {isPolish
                        ? "Dynamiczny Kalkulator Roboczogodzin i Zwrotu z Inwestycji (ROI)"
                        : "Dynamic Engineering Scope & ROI Calculator"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isPolish
                      ? "Zadania i liczba godzin dopasowują się automatycznie do błędów wykrytych podczas skanu badanej domeny."
                      : "Tasks and engineering hours automatically adapt to the bottlenecks detected on the scanned domain."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(["PLN", "GBP", "EUR"] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        currency === curr ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Business Inputs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agency Pricing Controls */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "1. Parametry Kosztorysu" : "1. Pricing Parameters"}
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPolish ? `Stawka godzinowa inżyniera (${currency}/h)` : `Hourly Engineering Rate (${currency}/h)`}
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={2000}
                      value={hourlyRate}
                      readOnly={viewMode === "client"}
                      onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isPolish ? `Miesięczny abonament monitoringu 24/7 (${currency}/mc)` : `Monthly 24/7 Monitoring Retainer (${currency}/mo)`}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={retainerMonthly}
                      readOnly={viewMode === "client"}
                      onChange={(e) => setRetainerMonthly(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="text-xs text-emerald-800 font-semibold">
                      {isPolish ? "Wyliczona Wycena Jednorazowa (Netto):" : "Calculated One-Off Quote (Net):"}
                    </div>
                    <div className="text-2xl font-mono font-extrabold text-emerald-700 tabular-nums">
                      {scopeSummary.netPrice.toLocaleString()} {currency}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                      {isPolish ? "Brutto (z 23% VAT):" : "Gross (incl. VAT):"} {scopeSummary.grossPrice.toLocaleString()} {currency} · {scopeSummary.totalHours} rbh
                    </div>
                  </div>
                </div>

                {/* Client ROI Simulator Controls */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isPolish ? "2. Symulator Ruchu i Konwersji Klienta" : "2. Client Traffic & Conversion Simulator"}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Odwiedziny / mies." : "Monthly Visitors"}
                      </label>
                      <input
                        type="number"
                        value={monthlyVisitors}
                        onChange={(e) => setMonthlyVisitors(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Konwersja (%)" : "Conversion Rate (%)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConvRate}
                        onChange={(e) => setCurrentConvRate(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? `Śr. wartość klienta (${currency})` : `Avg Lead/Order Value (${currency})`}
                      </label>
                      <input
                        type="number"
                        value={avgOrderValue}
                        onChange={(e) => setAvgOrderValue(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isPolish ? "Wzrost po naprawie (%)" : "Projected Lift (%)"}
                      </label>
                      <input
                        type="number"
                        value={projectedLiftPct}
                        onChange={(e) => setProjectedLiftPct(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{isPolish ? "Obecny przychód z witryny:" : "Current Web Revenue:"}</span>
                      <strong className="font-mono tabular-nums">{scopeSummary.currentMonthlyRev.toLocaleString()} {currency}/mc</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">{isPolish ? "Przychód po optymalizacji:" : "Projected Web Revenue:"}</span>
                      <strong className="font-mono text-emerald-700 tabular-nums">{scopeSummary.projectedMonthlyRev.toLocaleString()} {currency}/mc</strong>
                    </div>
                  </div>
                </div>

                {/* Executive ROI Outcome Card */}
                <div className="bg-[#111A2E] text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {isPolish ? "3. Scenariusz ilustracyjny (nie prognoza)" : "3. Illustrative scenario (not a forecast)"}
                    </div>
                    {hasRoiAssumptions ? (
                    <>
                    <div>
                      <div className="text-xs text-slate-400">{isPolish ? "Wynik przy założeniach wpisanych powyżej:" : "Result under the assumptions entered above:"}</div>
                      <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-0.5 tabular-nums">
                        +{scopeSummary.monthlyGain.toLocaleString()} {currency} / mc
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{isPolish ? "Czas zwrotu przy tych założeniach:" : "Payback under these assumptions:"}</div>
                      <div className="text-2xl font-mono font-extrabold text-white mt-0.5 tabular-nums">
                        {scopeSummary.paybackDays} {isPolish ? "dni" : "days"}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isPolish
                        ? `Przy podanych założeniach (ruch, konwersja, wartość zamówienia, wzrost konwersji) koszt ${scopeSummary.netPrice} ${currency} zwróciłby się po ok. ${scopeSummary.paybackDays} dniach. To rachunek ilustracyjny na wpisanych danych, a nie prognoza wyniku klienta.`
                        : `Under the entered assumptions (traffic, conversion, order value, conversion lift) the ${scopeSummary.netPrice} ${currency} cost would be recovered in about ${scopeSummary.paybackDays} days. This is an illustration based on typed-in inputs, not a forecast of the client's results.`}
                    </p>
                    </>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isPolish ? "Wpisz własne założenia powyżej (ruch, konwersja, wartość zamówienia, wzrost konwersji), aby zobaczyć scenariusz. Bez nich nie pokazujemy żadnych kwot przychodu." : "Enter your own assumptions above (traffic, conversion, order value, conversion lift) to see a scenario. Without them no revenue figures are shown."}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {viewMode === "client" ? (
                      <button
                        onClick={() => setIsAcceptProposalOpen(true)}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        {isPolish ? `Akceptuję Kosztorys (${scopeSummary.netPrice} ${currency}) i Zamawiam` : `Accept Proposal (${scopeSummary.netPrice} ${currency})`}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveCurrentToCrm}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isPolish ? "Zapisz Kosztorys w Panelu Agencji CRM" : "Save Quote to Agency CRM"}
                        </button>
                        <button
                          onClick={() => setActiveTab("reports")}
                          className="w-full py-2 bg-[#1C2A47] hover:bg-[#24375B] text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isPolish ? "Przejdź do Eksportu Oferty PDF / Linku" : "Export Quote in Report / Link"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Engineering Task Breakdown Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isPolish ? "Szczegółowy Kosztorys Roboczogodzin Dopasowany do Błędów Strony" : "Dynamic Engineering Scope & Hours"}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                    {isPolish ? "Suma wybranych godzin:" : "Selected hours:"} {scopeSummary.totalHours} h = {scopeSummary.netPrice} {currency} netto
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">{isPolish ? "Włącz" : "Include"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Zadanie Inżynieryjne" : "Engineering Task"}</th>
                        <th className="py-2.5 px-3">{isPolish ? "Korzyść dla Klienta" : "Client Business Benefit"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Roboczogodziny" : "Hours"}</th>
                        <th className="py-2.5 px-3 text-right">{isPolish ? "Koszt Netto" : "Net Cost"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {scopeTasks.map((task) => (
                        <tr key={task.id} className={task.selected ? "bg-white" : "bg-slate-50/60 opacity-60"}>
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={task.selected}
                              onChange={() =>
                                setScopeTasks((prev) =>
                                  prev.map((t) => (t.id === task.id ? { ...t, selected: !t.selected } : t))
                                )
                              }
                              className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{task.title}</div>
                            {viewMode === "agency" && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{task.technicalScope}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-emerald-800 font-medium">{task.businessBenefit}</td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            {viewMode === "agency" ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScopeTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id ? { ...t, hours: Math.max(0.5, +(t.hours - 0.5).toFixed(1)) } : t
                                      )
                                    )
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-bold">{task.hours}h</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScopeTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id ? { ...t, hours: +(t.hours + 0.5).toFixed(1) } : t
                                      )
                                    )
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold">{task.hours}h</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {Math.round(task.hours * hourlyRate)} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Custom Scope Item (Agency Mode) */}
                {viewMode === "agency" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newTaskTitle.trim()) return;
                      setScopeTasks((prev) => [
                        ...prev,
                        {
                          id: `custom-${Date.now()}`,
                          title: newTaskTitle.trim(),
                          category: "performance",
                          hours: Number(newTaskHours) || 2,
                          selected: true,
                          businessBenefit: isPolish ? "Indywidualna optymalizacja dopasowana do witryny" : "Custom site optimization",
                          technicalScope: isPolish ? "Prace programistyczne wg specyfikacji audytu" : "Custom engineering work",
                        },
                      ]);
                      setNewTaskTitle("");
                    }}
                    className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={isPolish ? "Dodaj własną pozycję do kosztorysu (np. Optymalizacja WooCommerce / WordPress)..." : "Add custom scope item..."}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={newTaskHours}
                      onChange={(e) => setNewTaskHours(Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isPolish ? "Dodaj Zadanie" : "Add Task"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
  );
}
