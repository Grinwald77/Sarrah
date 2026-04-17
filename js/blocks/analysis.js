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

function cls(v){ return v >= 0 ? "green" : "red"; }

function row(label, value, colored = false){
    return `
    <div class="analysis-row">
        <span class="analysis-label">${label}</span>
        <span class="analysis-val ${colored ? cls(value) : ""}">${colored ? fmtSigned(value) : fmt(value)}</span>
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

        const activities = Store.get("activities");
        if(!activities || !activities.length){
            el.innerHTML = "";
            return;
        }

        const r = FactorModel.calc(activities);

        // Don't render if no data at all
        if(r.R0 === 0 && r.R1 === 0 && !r.hasMulti && !r.hasSingle){
            el.innerHTML = "";
            return;
        }

        // ── Итоговые суммы ──
        let html = `
        ${row(t("revenue") + " " + t("initial"),  r.R0)}
        ${row(t("revenue") + " " + t("current"),  r.R1)}
        ${row(t("change"),                         r.dR,  true)}
        ${divider()}`;

        // ── Факторы ──
        // Всегда показываем все три фактора если есть хотя бы один вид деятельности
        if(r.hasMulti){
            html += `
            ${row(t("factorQty"),   r.q, true)}
            ${row(t("factorPrice"), r.p, true)}`;
        }

        if(r.hasSingle){
            html += `
            ${row(t("factorSingle"), r.s, true)}`;
        }

        // ── Строка верификации: сумма факторов = ΔR ──
        if(r.hasMulti || r.hasSingle){
            const factorSum = r.q + r.p + r.s;
            const ok = Math.abs(factorSum - r.dR) < 0.01;

            // Parts for formula display
            const parts = [];
            if(r.hasMulti)  parts.push(`${t("factorQty")}: ${fmtSigned(r.q)}`);
            if(r.hasMulti)  parts.push(`${t("factorPrice")}: ${fmtSigned(r.p)}`);
            if(r.hasSingle) parts.push(`${t("factorSingle")}: ${fmtSigned(r.s)}`);

            html += `
            ${divider()}
            <div class="analysis-row analysis-check">
                <span class="analysis-label">${parts.join(" + ")}</span>
                <span class="analysis-val ${ok ? "green" : "red"}">${fmtSigned(factorSum)} ${ok ? "✓" : "≠ "+fmt(r.dR)}</span>
            </div>`;
        }

        el.innerHTML = `
        <b>${t("analysis")}</b>
        <div class="analysis-grid">${html}</div>
        `;
    }
};
