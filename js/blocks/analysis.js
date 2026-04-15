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

export const AnalysisBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){

        const activities = Store.get("activities");
        if(!activities || !activities.length){
            document.getElementById("analysisBlock").innerHTML = "";
            return;
        }

        // Separate multi-factor groups and single-factor revenue totals
        let multiGroups   = [];
        let singleR0 = 0, singleR1 = 0;

        activities.forEach(act => {
            if(act.singleFactor){
                (act.groups||[]).forEach(g => {
                    singleR0 += +g.revenue0 || 0;
                    singleR1 += +g.revenue1 || 0;
                });
            } else {
                multiGroups = multiGroups.concat(act.groups || []);
            }
        });

        const hasAny = multiGroups.length > 0 || singleR0 || singleR1;
        if(!hasAny){
            document.getElementById("analysisBlock").innerHTML = "";
            return;
        }

        const r = FactorModel.calc(multiGroups, { R0: singleR0, R1: singleR1 });

        const dCls = r.dR >= 0 ? "green" : "red";
        const qCls = r.q  >= 0 ? "green" : "red";
        const pCls = r.p  >= 0 ? "green" : "red";
        const sCls = r.s  >= 0 ? "green" : "red";

        // Check factor sum = dR (rounding guard)
        const factorSum = r.q + r.p + (r.hasSingle ? r.s : 0);

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
            <span class="analysis-val ${dCls}">${fmt(r.dR)}</span>
        </div>
        <div class="analysis-divider"></div>
        `;

        if(multiGroups.length > 0){
            rows += `
            <div class="analysis-row">
                <span class="analysis-label">${t("factorQty")}</span>
                <span class="analysis-val ${qCls}">${fmt(r.q)}</span>
            </div>
            <div class="analysis-row">
                <span class="analysis-label">${t("factorPrice")}</span>
                <span class="analysis-val ${pCls}">${fmt(r.p)}</span>
            </div>
            `;
        }

        if(r.hasSingle){
            rows += `
            <div class="analysis-row">
                <span class="analysis-label">${t("factorSingle")}</span>
                <span class="analysis-val ${sCls}">${fmt(r.s)}</span>
            </div>
            `;
        }

        document.getElementById("analysisBlock").innerHTML = `
        <b>${t("analysis")}</b>
        <div class="analysis-grid">${rows}</div>
        `;
    }
};
