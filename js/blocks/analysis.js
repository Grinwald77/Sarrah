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

        // collect all groups for factor model
        let allGroups = [];
        activities.forEach(act => {
            if(!act.singleFactor){
                allGroups = allGroups.concat(act.groups || []);
            }
        });

        if(!allGroups.length){
            document.getElementById("analysisBlock").innerHTML = "";
            return;
        }

        const r = FactorModel.calc(allGroups);

        const dCls  = r.dR  >= 0 ? "green" : "red";
        const qCls  = r.q   >= 0 ? "green" : "red";
        const pCls  = r.p   >= 0 ? "green" : "red";

        document.getElementById("analysisBlock").innerHTML = `
        <b>${t("analysis")}</b>
        <div class="analysis-grid">
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
            <div class="analysis-row">
                <span class="analysis-label">${t("factorQty")}</span>
                <span class="analysis-val ${qCls}">${fmt(r.q)}</span>
            </div>
            <div class="analysis-row">
                <span class="analysis-label">${t("factorPrice")}</span>
                <span class="analysis-val ${pCls}">${fmt(r.p)}</span>
            </div>
        </div>
        `;
    }
};
