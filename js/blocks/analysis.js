import { Store }       from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t }           from '../i18n.js';

function getScaleDiv(){
    const s = Store.get("scale");
    if(s === "thousands") return 1000;
    if(s === "millions")  return 1000000;
    return 1;
}
function fmt(v){
    const val = v / getScaleDiv();
    return val.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
}
function fmtSigned(v){
    const val = v / getScaleDiv();
    const str = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
    return (v >= 0 ? "+" : "−") + str;
}
function colorCls(v){ return v < 0 ? "red" : v > 0 ? "green" : ""; }

// Summary row (label + value)
function sumRow(label, value, colored = false){
    const cls = colored ? colorCls(value) : "";
    const val = colored ? fmtSigned(value) : fmt(value);
    return `<div class="analysis-row">
        <span class="analysis-label">${label}</span>
        <span class="analysis-val ${cls}">${val}</span>
    </div>`;
}

// Render detail rows for one effect type across activities/groups
// items: [{ label, value }]
function detailSection(title, items, colorize = true){
    if(!items.length) return "";
    const rows = items.map(it => `
        <div class="analysis-detail-row">
            <span class="analysis-detail-label">${it.label}</span>
            <span class="analysis-detail-val ${colorize ? colorCls(it.value) : ""}">${fmtSigned(it.value)}</span>
        </div>`).join("");
    return `
    <div class="analysis-detail-block">
        <div class="analysis-detail-title">${title}</div>
        ${rows}
    </div>`;
}

export const AnalysisBlock = {

    init(){
        Store.subscribe(()      => this.render());
        Store.subscribeAnalysis(() => this.render());
    },

    render(){
        const el = document.getElementById("analysisBlock");
        if(!el) return;
        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branches     = Store.get("branches") || [];
        const branchCount  = Store.get("branchCount") || 1;
        const activeBranch = Store.get("activeBranch");
        const isSummary    = branchCount > 1 && activeBranch === -1;
        const multipleB    = branchCount > 1;

        // Determine which branches to analyse
        let branchesForAnalysis = [];
        if(isSummary){
            branchesForAnalysis = branches;
        } else {
            const b = branches[activeBranch];
            if(b) branchesForAnalysis = [b];
        }

        if(!branchesForAnalysis.length){ el.innerHTML = ""; return; }

        // Use detailed calc
        const d = FactorModel.calcDetailed(branchesForAnalysis);

        if(d.R0 === 0 && d.R1 === 0){ el.innerHTML = ""; return; }

        // ── Top summary ──
        let html = `
        <div class="analysis-grid">
            ${sumRow(t("revenue") + " " + t("initial"), d.R0)}
            ${sumRow(t("revenue") + " " + t("current"), d.R1)}
            ${sumRow(t("change"), d.dR, true)}
            <div class="analysis-divider"></div>
            ${d.hasMulti  ? sumRow(t("factorQty"),   d.q, true) : ""}
            ${d.hasMulti  ? sumRow(t("factorPrice"),  d.p, true) : ""}
            ${d.hasSingle ? sumRow(t("factorSingle"), d.s, true) : ""}
        </div>`;

        // ── Drill-down ──
        // Build flat list of detail items per effect type
        const qItems = [], pItems = [], sItems = [];

        d.branches.forEach(br => {
            const showBranch = multipleB;
            const brPrefix   = showBranch ? `${br.name} / ` : "";

            br.activities.forEach(act => {
                if(!act.singleFactor){
                    act.groups.forEach(g => {
                        const label = `${brPrefix}${act.name} / ${g.name || t("group")}`;
                        if(g.q !== 0) qItems.push({ label, value: g.q });
                        if(g.p !== 0) pItems.push({ label, value: g.p });
                    });
                } else {
                    act.groups.forEach(g => {
                        const label = `${brPrefix}${act.name} / ${g.name || t("group")}`;
                        if(g.s !== 0) sItems.push({ label, value: g.s });
                    });
                }
            });
        });

        // Only show drill-down if there are multiple items
        if(qItems.length > 1 || pItems.length > 1 || sItems.length > 1){
            html += `<div class="analysis-drilldown">`;
            if(qItems.length > 1) html += detailSection(t("factorQty"),   qItems);
            if(pItems.length > 1) html += detailSection(t("factorPrice"),  pItems);
            if(sItems.length > 1) html += detailSection(t("factorSingle"), sItems);
            html += `</div>`;
        }

        el.innerHTML = `<b>${t("analysis")}</b>${html}`;
    }
};
