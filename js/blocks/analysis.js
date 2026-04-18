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

function fmtSigned(v){
    const val = v / getScaleDiv();
    const str = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
    return (v >= 0 ? "+" : "−") + str;
}

function row(label, value, colored = false){
    const colorCls = colored ? (value < 0 ? "red" : value > 0 ? "green" : "") : "";
    const display  = colored ? fmtSigned(value) : fmt(value);
    return `
    <div class="analysis-row">
        <span class="analysis-label">${label}</span>
        <span class="analysis-val ${colorCls}">${display}</span>
    </div>`;
}

function divider(){ return `<div class="analysis-divider"></div>`; }

export const AnalysisBlock = {

    init(){
        Store.subscribe(() => this.render());
        Store.subscribeAnalysis(() => this.render());
    },

    render(){
        const el = document.getElementById("analysisBlock");

        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branches     = Store.get("branches") || [];
        const branchCount  = Store.get("branchCount") || 1;
        const activeBranch = Store.get("activeBranch");
        const isSummary    = branchCount > 1 && activeBranch === -1;

        let activities = [];
        if(isSummary){
            // Flatten all branches' activities for factor analysis
            branches.forEach(b => { activities = activities.concat(b.activities || []); });
        } else {
            activities = branches[activeBranch]?.activities || [];
        }

        if(!activities || !activities.length){ el.innerHTML = ""; return; }

        const r = FactorModel.calc(activities);

        if(r.R0 === 0 && r.R1 === 0 && !r.hasMulti && !r.hasSingle){
            el.innerHTML = ""; return;
        }

        let html = `
        ${row(t("revenue") + " " + t("initial"), r.R0)}
        ${row(t("revenue") + " " + t("current"), r.R1)}
        ${row(t("change"),                        r.dR, true)}
        ${divider()}`;

        if(r.hasMulti){
            html += `
            ${row(t("factorQty"),   r.q, true)}
            ${row(t("factorPrice"), r.p, true)}`;
        }

        if(r.hasSingle){
            html += `
            ${row(t("factorSingle"), r.s, true)}`;
        }

        el.innerHTML = `
        <b>${t("analysis")}</b>
        <div class="analysis-grid">${html}</div>
        `;
    }
};
