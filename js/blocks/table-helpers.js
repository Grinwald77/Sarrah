// ─────────────────────────────────────────────
//  Shared helpers for all table modules
// ─────────────────────────────────────────────
import { Store } from '../store.js';
import { t }     from '../i18n.js';

export function getScaleDiv(){
    const s = Store.get("scale");
    if(s === "thousands") return 1000;
    if(s === "millions")  return 1000000;
    return 1;
}
export function getCurrencySymbol(){
    return { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[Store.get("currency")] || "";
}
export function getScaleShort(){
    const s = Store.get("scale");
    if(s === "thousands") return t("thousands");
    if(s === "millions")  return t("millions");
    return "";
}
export function fmt(v){
    const val = v / getScaleDiv();
    return val.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
}
export function periodLabel(typeKey, periodKey, yearKey){
    const p = Store.get("periods") || {};
    const typeStr = (p[typeKey]||"Actual") === "Planned" ? t("planned") : t("actual");
    const per  = p[periodKey] || "";
    const year = p[yearKey]   || "";
    const period = per ? `${per}, ${year}` : year;
    return `<span class="th-type">${typeStr}</span><span class="th-period">${period}</span>`;
}
export function periodLabelText(typeKey, periodKey, yearKey){
    const p = Store.get("periods") || {};
    const typeStr = (p[typeKey]||"Actual") === "Planned" ? t("planned") : t("actual");
    const per  = p[periodKey] || "";
    const year = p[yearKey]   || "";
    return per ? `${typeStr} ${per}, ${year}` : `${typeStr} ${year}`;
}
export function sectionMeta(){
    const sym = getCurrencySymbol();
    const sc  = getScaleShort();
    const col0 = periodLabelText("type0","period0","year0");
    const col1 = periodLabelText("type1","period1","year1");
    let meta = `${col0} — ${col1}`;
    const unit = [sc, sym].filter(Boolean).join(" ");
    if(unit) meta += ` | ${unit}`;
    return meta;
}

// Compute rev for a group
export function groupRevs(g, single){
    const r0 = single ? (+g.revenue0||0) : (+g.quantity0||0)*(+g.price0||0);
    const r1 = single ? (+g.revenue1||0) : (+g.quantity1||0)*(+g.price1||0);
    return { r0, r1 };
}

// Factor analysis for an activities array
// Returns { R0, R1, dR, dRpct, qEffect, pEffect, sEffect }
export function calcFactors(activities){
    let R0=0, R1=0, qEffect=0, pEffect=0, sEffect=0;
    activities.forEach(act => {
        const single = !!act.singleFactor;
        (act.groups||[]).forEach(g => {
            const { r0, r1 } = groupRevs(g, single);
            R0 += r0; R1 += r1;
            if(!single){
                const q0=+g.quantity0||0, q1=+g.quantity1||0;
                const p0=+g.price0||0,   p1=+g.price1||0;
                qEffect += (q1 - q0) * p0;
                pEffect += q1 * (p1 - p0);
            } else {
                sEffect += r1 - r0;
            }
        });
    });
    const dR    = R1 - R0;
    const dRpct = R0 ? dR/R0*100 : 0;
    return { R0, R1, dR, dRpct, qEffect, pEffect, sEffect };
}

// Render factor analysis HTML block
export function renderFactors(activities, t_fn){
    const f = calcFactors(activities);
    const hasMulti   = activities.some(a => !a.singleFactor);
    const hasSingle  = activities.some(a =>  a.singleFactor);
    const sign = v => v >= 0 ? "green" : "red";
    return `
    <div class="analysis-block">
        <div class="analysis-title">${t_fn("analysis")}</div>
        <div class="analysis-row">
            <span class="analysis-label">${t_fn("revenueOf")} 0</span>
            <span class="analysis-value">${fmt(f.R0)}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">${t_fn("revenueOf")} 1</span>
            <span class="analysis-value">${fmt(f.R1)}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">ΔR</span>
            <span class="analysis-value ${sign(f.dR)}">${fmt(f.dR)} (${f.dRpct.toFixed(1)}%)</span>
        </div>
        ${hasMulti ? `
        <div class="analysis-row">
            <span class="analysis-label">${t_fn("factorQty")}</span>
            <span class="analysis-value ${sign(f.qEffect)}">${fmt(f.qEffect)}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">${t_fn("factorPrice")}</span>
            <span class="analysis-value ${sign(f.pEffect)}">${fmt(f.pEffect)}</span>
        </div>` : ""}
        ${hasSingle ? `
        <div class="analysis-row">
            <span class="analysis-label">${t_fn("factorSingle")}</span>
            <span class="analysis-value ${sign(f.sEffect)}">${fmt(f.sEffect)}</span>
        </div>` : ""}
    </div>`;
}
