import { Store } from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t } from '../i18n.js';

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

function cls(v){ return v >= 0 ? "green" : "red"; }

export const AnalysisBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){
        const el = document.getElementById("analysisBlock");

        const activities = Store.get("activities");
        if(!activities || !activities.length){
            el.innerHTML = "";
            return;
        }

        // Pass ALL activities to factor model — it handles both types internally
        const r = FactorModel.calc(activities);

        // Only show if there's something to show
        if(r.R0 === 0 && r.R1 === 0){
            el.innerHTML = "";
            return;
        }

        // Factor check: q + p + s should equal dR
        const factorCheck = r.q + r.p + r.s;
        const diff = Math.abs(factorCheck - r.dR);
        const checkOk = diff < 0.01;

        let rows = `
        <div class="analysis-row">
            <span class="analysis-label">${t("revenue")} ${t("initial")}</span>
            <span class="analysis-val">${fmt(r.R0)}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">${t("revenue")} ${t("current")}</span>
            <span class="analysis-val">${fmt(r.R1)}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">${t("change")}</span>
            <span class="analysis-val ${cls(r.dR)}">${fmt(r.dR)}</span>
        </div>
        <div class="analysis-divider"></div>
        `;

        // Volume effect — only if there are multi-factor activities
        if(r.hasMulti){
            rows += `
            <div class="analysis-row">
                <span class="analysis-label">${t("factorQty")}</span>
                <span class="analysis-val ${cls(r.q)}">${fmt(r.q)}</span>
            </div>
            <div class="analysis-row">
                <span class="analysis-label">${t("factorPrice")}</span>
                <span class="analysis-val ${cls(r.p)}">${fmt(r.p)}</span>
            </div>
            `;
        }

        // Single-factor revenue effect
        if(r.hasSingle){
            rows += `
            <div class="analysis-row">
                <span class="analysis-label">${t("factorSingle")}</span>
                <span class="analysis-val ${cls(r.s)}">${fmt(r.s)}</span>
            </div>
            `;
        }

        // Show factor sum = total change verification
        if((r.hasMulti || r.hasSingle) && (r.hasMulti && r.hasSingle)){
            rows += `
            <div class="analysis-divider"></div>
            <div class="analysis-row">
                <span class="analysis-label" style="font-size:10px;opacity:0.6">
                    ${fmt(r.q)} + ${fmt(r.p)} + ${fmt(r.s)} = ${fmt(factorCheck)}
                    ${checkOk ? "✓" : "≠ "+fmt(r.dR)}
                </span>
                <span class="analysis-val" style="font-size:10px;opacity:0.6">${checkOk?"OK":"!"}</span>
            </div>
            `;
        }

        el.innerHTML = `
        <b>${t("analysis")}</b>
        <div class="analysis-grid">${rows}</div>
        `;
    }
};
