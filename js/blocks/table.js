import { Store } from '../store.js';
import { t } from '../i18n.js';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function getScaleDiv(){
    const s = Store.get("scale");
    if(s === "thousands") return 1000;
    if(s === "millions")  return 1000000;
    return 1;
}

function getCurrencySymbol(){
    return { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[Store.get("currency")] || "";
}

function getScaleShort(){
    const s = Store.get("scale");
    if(s === "thousands") return t("thousands").slice(0,4)+".";
    if(s === "millions")  return t("millions").slice(0,4)+".";
    return "";
}

function fmt(v){
    const val = v / getScaleDiv();
    return val.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
}

function periodLabel(typeKey, periodKey, yearKey){
    const p      = Store.get("periods") || {};
    const type   = p[typeKey] || "Actual";
    const per    = p[periodKey] || "";
    const year   = (p[yearKey] || "").toString().slice(-2);
    const typeStr = type === "Planned" ? t("planned") : t("actual");
    return per ? `${typeStr}, ${per} '${year}` : `${typeStr}, ${p[yearKey] || ""}`;
}

function sectionMeta(){
    const p   = Store.get("periods") || {};
    const sym = getCurrencySymbol();
    const sc  = getScaleShort();
    const t0  = p.type0 === "Planned" ? t("planned") : t("actual");
    const t1  = p.type1 === "Planned" ? t("planned") : t("actual");
    const p0  = p.period0 ? `${p.period0} '${(p.year0||"").slice(-2)}` : (p.year0||"");
    const p1  = p.period1 ? `${p.period1} '${(p.year1||"").slice(-2)}` : (p.year1||"");
    const parts = [`${t0}–${t1}`, `${p0}–${p1}`];
    if(sym) parts.push(sym);
    if(sc)  parts.push(sc);
    return parts.join(", ");
}

// ─────────────────────────────────────────────
//  TableBlock
// ─────────────────────────────────────────────

export const TableBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){

        const activities = Store.get("activities");
        if(!activities || !activities.length){
            document.getElementById("tableBlock").innerHTML = "";
            return;
        }

        const meta = sectionMeta();
        const col0 = periodLabel("type0","period0","year0");
        const col1 = periodLabel("type1","period1","year1");

        let html = `
        <div class="section-header">
            <div class="section-title">${t("revenueBy")}</div>
            <div class="section-meta">${meta}</div>
        </div>
        `;

        const grandR = { R0:0, R1:0 };
        const actTotals = [];

        // ── Per-activity blocks ──
        activities.forEach((act, ai) => {

            const groups = act.groups || [];
            const single = !!act.singleFactor;

            let R0=0, R1=0, totalQ0=0, totalQ1=0;
            const r0=[], r1=[];

            groups.forEach((g, i) => {
                r0[i] = single ? (+g.revenue0||0) : (+g.quantity0||0) * (+g.price0||0);
                r1[i] = single ? (+g.revenue1||0) : (+g.quantity1||0) * (+g.price1||0);
                R0 += r0[i]; R1 += r1[i];
                if(!single){ totalQ0 += +g.quantity0||0; totalQ1 += +g.quantity1||0; }
            });

            grandR.R0 += R0; grandR.R1 += R1;
            actTotals.push({ ai, name: act.name||`${t("activityName")} ${ai+1}`, R0, R1 });

            const dR    = R1 - R0;
            const dRpct = R0 ? dR/R0*100 : 0;
            const avgP0 = totalQ0 ? R0/totalQ0 : 0;
            const avgP1 = totalQ1 ? R1/totalQ1 : 0;

            // thead second row - column labels depend on single vs multi
            const colsQP = !single ? `
                <th>${col0}</th><th>${col1}</th>
                <th>${col0}</th><th>${col1}</th>` : "";

            const colsRevHeader = `
                <th>${col0}</th><th>${col1}</th>
                <th>${t("change")}</th><th>${t("changePct")}</th>`;

            const colsShareHeader = `
                <th>${t("share")} ${col0}</th>
                <th>${t("share")} ${col1}</th>
                <th>Δ ${t("share")}</th>`;

            // thead first row colspan
            const qpCols  = !single ? `<th colspan="2">${t("quantity")}</th><th colspan="2">${t("price")}</th>` : "";

            html += `
            <div class="activity-block" data-ai="${ai}">
                <div class="activity-header">
                    <div class="activity-header-left">
                        <div class="activity-title">${t("revenueOf")} ${t("by")} <span class="activity-name-display">${act.name||""}</span></div>
                        <div class="section-meta">${meta}</div>
                    </div>
                    <div class="activity-controls">
                        <label class="ctrl-label">${t("activityName")}:</label>
                        <input class="act-name" data-ai="${ai}" value="${act.name||""}">
                        <label class="ctrl-label">${t("groupCount")}:</label>
                        <input class="act-groups" type="number" min="1" max="20" data-ai="${ai}" value="${act.groupCount||groups.length}" style="width:44px">
                        <label class="ctrl-checkbox">
                            <input type="checkbox" class="act-single" data-ai="${ai}" ${single?"checked":""}>
                            <span>${t("singleFactor")}</span>
                        </label>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">${t("group")}</th>
                            ${qpCols}
                            <th colspan="4">${t("revenue")}</th>
                            <th colspan="3">${t("share")}</th>
                        </tr>
                        <tr>${colsQP}${colsRevHeader}${colsShareHeader}</tr>
                    </thead>
                    <tbody>
            `;

            groups.forEach((g, gi) => {
                const delta = r1[gi] - r0[gi];
                const pct   = r0[gi] ? delta/r0[gi]*100 : 0;
                const s0    = R0 ? r0[gi]/R0*100 : 0;
                const s1    = R1 ? r1[gi]/R1*100 : 0;
                const ds    = s1 - s0;

                const inputsQP = !single ? `
                    <td><input data-field="quantity0" data-ai="${ai}" data-gi="${gi}" value="${g.quantity0||""}"></td>
                    <td><input data-field="quantity1" data-ai="${ai}" data-gi="${gi}" value="${g.quantity1||""}"></td>
                    <td><input data-field="price0"    data-ai="${ai}" data-gi="${gi}" value="${g.price0||""}"></td>
                    <td><input data-field="price1"    data-ai="${ai}" data-gi="${gi}" value="${g.price1||""}"></td>
                    <td class="num">${fmt(r0[gi])}</td>
                    <td class="num">${fmt(r1[gi])}</td>
                ` : `
                    <td><input data-field="revenue0" data-ai="${ai}" data-gi="${gi}" value="${g.revenue0||""}"></td>
                    <td><input data-field="revenue1" data-ai="${ai}" data-gi="${gi}" value="${g.revenue1||""}"></td>
                `;

                html += `
                <tr>
                    <td><input data-field="name" data-ai="${ai}" data-gi="${gi}" value="${g.name||""}"></td>
                    ${inputsQP}
                    <td class="${delta>=0?"green":"red"}">${fmt(delta)}</td>
                    <td class="num">${pct.toFixed(1)}%</td>
                    <td class="num">${s0.toFixed(1)}%</td>
                    <td class="num">${s1.toFixed(1)}%</td>
                    <td class="${ds>=0?"green":"red"}">${ds.toFixed(1)}</td>
                </tr>
                `;
            });

            // activity total
            const totalQPcells = !single
                ? `<td>${totalQ0}</td><td>${totalQ1}</td><td>${Math.round(avgP0)}</td><td>${Math.round(avgP1)}</td><td>${fmt(R0)}</td><td>${fmt(R1)}</td>`
                : `<td>${fmt(R0)}</td><td>${fmt(R1)}</td>`;

            html += `
                    </tbody>
                    <tfoot>
                        <tr class="total">
                            <td>${t("total")} (${getCurrencySymbol()} ${getScaleShort()})</td>
                            ${totalQPcells}
                            <td class="${dR>=0?"green":"red"}">${fmt(dR)}</td>
                            <td>${dRpct.toFixed(1)}%</td>
                            <td>100%</td><td>100%</td><td>0</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            `;
        });

        // ── Grand total (only if >1 activity) ──
        if(activities.length > 1){
            const gdR    = grandR.R1 - grandR.R0;
            const gdRpct = grandR.R0 ? gdR/grandR.R0*100 : 0;

            html += `
            <div class="grand-total-block">
                <div class="section-header">
                    <div class="section-title">${t("grandTotal")}</div>
                    <div class="section-meta">${meta}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>${t("activityName")}</th>
                            <th>${col0}</th><th>${col1}</th>
                            <th>${t("change")}</th><th>${t("changePct")}</th>
                            <th>${t("share")} ${col0}</th>
                            <th>${t("share")} ${col1}</th>
                            <th>Δ ${t("share")}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            actTotals.forEach(({ name, R0, R1 }) => {
                const d    = R1 - R0;
                const dpct = R0 ? d/R0*100 : 0;
                const s0   = grandR.R0 ? R0/grandR.R0*100 : 0;
                const s1   = grandR.R1 ? R1/grandR.R1*100 : 0;
                const ds   = s1 - s0;
                html += `
                <tr>
                    <td>${name}</td>
                    <td>${fmt(R0)}</td><td>${fmt(R1)}</td>
                    <td class="${d>=0?"green":"red"}">${fmt(d)}</td>
                    <td>${dpct.toFixed(1)}%</td>
                    <td>${s0.toFixed(1)}%</td>
                    <td>${s1.toFixed(1)}%</td>
                    <td class="${ds>=0?"green":"red"}">${ds.toFixed(1)}</td>
                </tr>
                `;
            });

            html += `
                    </tbody>
                    <tfoot>
                        <tr class="total">
                            <td>${t("grandTotal")} (${getCurrencySymbol()} ${getScaleShort()})</td>
                            <td>${fmt(grandR.R0)}</td><td>${fmt(grandR.R1)}</td>
                            <td class="${gdR>=0?"green":"red"}">${fmt(gdR)}</td>
                            <td>${gdRpct.toFixed(1)}%</td>
                            <td>100%</td><td>100%</td><td>0</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            `;
        }

        document.getElementById("tableBlock").innerHTML = html;

        this.bindControls();
        this.bindInputs();
        this.enablePaste();
        this.addTabNavigation();
    },

    bindControls(){

        document.querySelectorAll(".act-name").forEach(el => {
            el.oninput = (e) => {
                const ai = +e.target.dataset.ai;
                Store.setActivity(ai, { name: e.target.value });
                const disp = document.querySelector(`.activity-block[data-ai="${ai}"] .activity-name-display`);
                if(disp) disp.textContent = e.target.value;
            };
        });

        document.querySelectorAll(".act-groups").forEach(el => {
            el.onchange = (e) => {
                const ai  = +e.target.dataset.ai;
                const n   = Math.min(20, Math.max(1, +e.target.value || 1));
                e.target.value = n;
                const act = Store.get("activities")[ai];
                const old = act.groups || [];
                const groups = [];
                for(let i = 0; i < n; i++){
                    groups.push(old[i] || { name:`${t("group")} ${i+1}`, quantity0:0, quantity1:0, price0:0, price1:0, revenue0:0, revenue1:0 });
                }
                Store.setActivity(ai, { groupCount: n, groups });
            };
        });

        document.querySelectorAll(".act-single").forEach(el => {
            el.onchange = (e) => {
                const ai = +e.target.dataset.ai;
                Store.setActivity(ai, { singleFactor: e.target.checked });
            };
        });
    },

    bindInputs(){
        document.querySelectorAll("#tableBlock tbody input").forEach(input => {
            input.addEventListener("input", e => {
                const ai    = +e.target.dataset.ai;
                const gi    = +e.target.dataset.gi;
                const field = e.target.dataset.field;
                const acts  = Store.get("activities");
                const group = acts[ai].groups[gi];
                group[field] = field === "name" ? e.target.value : +e.target.value;
                Store.setActivity(ai, { groups: acts[ai].groups });
            });
        });
    },

    enablePaste(){
        document.querySelectorAll("#tableBlock tbody input").forEach(input => {
            input.onpaste = (e) => {
                const text = e.clipboardData.getData("text");
                if(!text.includes("\n")) return;
                e.preventDefault();
                const ai    = +e.target.dataset.ai;
                const acts  = Store.get("activities");
                const act   = acts[ai];
                const single = !!act.singleFactor;
                text.trim().split("\n").forEach((row, i) => {
                    if(i >= act.groups.length) return;
                    const c = row.split(/\t/);
                    const g = act.groups[i];
                    g.name = c[0] || "";
                    if(single){
                        g.revenue0 = +c[1]||0; g.revenue1 = +c[2]||0;
                    } else {
                        g.quantity0 = +c[1]||0; g.quantity1 = +c[2]||0;
                        g.price0    = +c[3]||0; g.price1    = +c[4]||0;
                    }
                });
                setTimeout(() => Store.setActivity(ai, { groups: act.groups }), 0);
            };
        });
    },

    addTabNavigation(){
        const inputs = document.querySelectorAll("#tableBlock tbody input");
        inputs.forEach((el, i) => {
            el.addEventListener("keydown", e => {
                if(e.key === "Enter"){ e.preventDefault(); inputs[i+1]?.focus(); }
            });
        });
    }
};
