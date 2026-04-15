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
    const p = Store.get("periods") || {};
    const typeStr = (p[typeKey]||"Actual") === "Planned" ? t("planned") : t("actual");
    const per  = p[periodKey] || "";
    const year = (p[yearKey]||"").toString().slice(-2);
    return per ? `${typeStr}, ${per} '${year}` : `${typeStr} '${year}`;
}
function sectionMeta(){
    const p   = Store.get("periods") || {};
    const sym = getCurrencySymbol();
    const sc  = getScaleShort();
    const t0  = (p.type0||"Actual") === "Planned" ? t("planned") : t("actual");
    const t1  = (p.type1||"Actual") === "Planned" ? t("planned") : t("actual");
    const p0  = p.period0 ? `${p.period0} '${(p.year0||"").slice(-2)}` : `'${(p.year0||"").slice(-2)}`;
    const p1  = p.period1 ? `${p.period1} '${(p.year1||"").slice(-2)}` : `'${(p.year1||"").slice(-2)}`;
    const parts = [`${t0}–${t1}`, `${p0}–${p1}`];
    if(sym) parts.push(sym);
    if(sc)  parts.push(sc);
    return parts.join(", ");
}

// ─────────────────────────────────────────────
//  KEY PRINCIPLE: inputs write to a _draft cache,
//  Store is updated only on blur or Enter.
//  This prevents re-render mid-typing.
// ─────────────────────────────────────────────

export const TableBlock = {

    _collapsed: {},

    // Draft cache: _draft[ai][gi][field] = value
    // Kept in sync with DOM, flushed to Store on blur/Enter
    _draft: {},

    init(){
        Store.subscribe(() => this.render());
    },

    // ─── Flush draft for one activity to Store ───
    _flush(ai){
        const draft = this._draft[ai];
        if(!draft) return;
        const acts = Store.get("activities");
        if(!acts[ai]) return;
        const groups = acts[ai].groups;

        // activity name
        if(draft._name !== undefined){
            acts[ai].name = draft._name;
        }
        // group fields
        Object.keys(draft).forEach(key => {
            if(key === "_name") return;
            const gi = +key;
            if(!groups[gi]) return;
            Object.keys(draft[gi] || {}).forEach(field => {
                const raw = draft[gi][field];
                groups[gi][field] = field === "name" ? raw : (+raw || 0);
            });
        });

        Store.setActivity(ai, { name: acts[ai].name, groups });
    },

    render(){

        const activities = Store.get("activities");
        if(!activities || !activities.length){
            document.getElementById("tableBlock").innerHTML = "";
            return;
        }

        // Sync draft from Store on render
        this._draft = {};
        activities.forEach((act, ai) => {
            this._draft[ai] = { _name: act.name || "" };
            (act.groups||[]).forEach((g, gi) => {
                this._draft[ai][gi] = { ...g };
            });
        });

        const meta = sectionMeta();
        const col0 = periodLabel("type0","period0","year0");
        const col1 = periodLabel("type1","period1","year1");

        let html = `
        <div class="section-header">
            <div class="section-title">${t("revenueBy")}</div>
            <div class="section-meta">${meta}</div>
            <div class="collapse-all-btns">
                <button class="collapse-all-btn" id="collapseAllBtn">${t("collapseAll")}</button>
                <button class="collapse-all-btn" id="expandAllBtn">${t("expandAll")}</button>
            </div>
        </div>`;

        const grandR    = { R0:0, R1:0 };
        const actTotals = [];

        activities.forEach((act, ai) => {

            const groups    = act.groups || [];
            const single    = !!act.singleFactor;
            const collapsed = !!this._collapsed[ai];

            let R0=0, R1=0, totalQ0=0, totalQ1=0;
            const r0=[], r1=[];

            groups.forEach((g, i) => {
                r0[i] = single ? (+g.revenue0||0) : (+g.quantity0||0)*(+g.price0||0);
                r1[i] = single ? (+g.revenue1||0) : (+g.quantity1||0)*(+g.price1||0);
                R0 += r0[i]; R1 += r1[i];
                if(!single){ totalQ0 += +g.quantity0||0; totalQ1 += +g.quantity1||0; }
            });

            grandR.R0 += R0; grandR.R1 += R1;
            actTotals.push({ name: act.name||`${t("activityName")} ${ai+1}`, R0, R1 });

            const dR    = R1 - R0;
            const dRpct = R0 ? dR/R0*100 : 0;
            const avgP0 = totalQ0 ? R0/totalQ0 : 0;
            const avgP1 = totalQ1 ? R1/totalQ1 : 0;

            const qpCols     = !single ? `<th colspan="2">${t("quantity")}</th><th colspan="2">${t("price")}</th>` : "";
            const colsQP     = !single ? `<th>${col0}</th><th>${col1}</th><th>${col0}</th><th>${col1}</th>` : "";
            const colsRevHdr = `<th>${col0}</th><th>${col1}</th><th>${t("change")}</th><th>${t("changePct")}</th>`;
            const colsShareHdr = `<th>${col0}</th><th>${col1}</th><th>${t("deltaShare")}</th>`;

            const actName  = act.name || "";
            const colIcon  = collapsed ? "+" : "−";
            const bodyDisp = collapsed ? `style="display:none"` : "";

            html += `
            <div class="activity-block" data-ai="${ai}">
                <div class="activity-header">
                    <div class="activity-title-row">
                        <div class="activity-title-text">${t("revenueOf")} ${t("by")}</div>
                        <input
                            class="act-name-inline"
                            data-ai="${ai}"
                            value="${actName}"
                            placeholder="${t("activityName")}…"
                            spellcheck="false"
                            autocomplete="off"
                        >
                        <div class="section-meta">${meta}</div>
                    </div>
                    <div class="activity-controls">
                        <label class="ctrl-label">${t("groupCount")}:</label>
                        <input class="act-groups" type="number" min="1" max="20" data-ai="${ai}" value="${act.groupCount||groups.length}" style="width:44px">
                        <label class="ctrl-checkbox">
                            <input type="checkbox" class="act-single" data-ai="${ai}" ${single?"checked":""}>
                            <span>${t("singleFactor")}</span>
                        </label>
                        <button class="collapse-btn" data-ai="${ai}">
                            <span class="collapse-bracket collapse-bracket-top"></span>
                            <span class="collapse-icon-box">${colIcon}</span>
                            <span class="collapse-bracket collapse-bracket-bot"></span>
                        </button>
                    </div>
                </div>
                <div class="table-body-wrap" ${bodyDisp}>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">${t("group")}</th>
                            ${qpCols}
                            <th colspan="4">${t("revenue")}</th>
                            <th colspan="3">${t("share")}</th>
                        </tr>
                        <tr>${colsQP}${colsRevHdr}${colsShareHdr}</tr>
                    </thead>
                    <tbody>`;

            groups.forEach((g, gi) => {
                const delta = r1[gi] - r0[gi];
                const pct   = r0[gi] ? delta/r0[gi]*100 : 0;
                const s0    = R0 ? r0[gi]/R0*100 : 0;
                const s1    = R1 ? r1[gi]/R1*100 : 0;
                const ds    = s1 - s0;

                // Data-tab-row marks each row for Tab wrap logic
                const rowAttr = `data-ai="${ai}" data-gi="${gi}"`;

                const inputsQP = !single ? `
                    <td><input data-field="quantity0" ${rowAttr} value="${g.quantity0||""}"></td>
                    <td><input data-field="quantity1" ${rowAttr} value="${g.quantity1||""}"></td>
                    <td><input data-field="price0"    ${rowAttr} value="${g.price0||""}"></td>
                    <td><input data-field="price1"    ${rowAttr} value="${g.price1||""}"></td>
                    <td>${fmt(r0[gi])}</td>
                    <td>${fmt(r1[gi])}</td>
                ` : `
                    <td><input data-field="revenue0" ${rowAttr} value="${g.revenue0||""}"></td>
                    <td><input data-field="revenue1" ${rowAttr} value="${g.revenue1||""}"></td>
                `;

                html += `
                <tr data-ai="${ai}" data-gi="${gi}">
                    <td><input data-field="name" ${rowAttr} value="${g.name||""}"></td>
                    ${inputsQP}
                    <td class="${delta>=0?"green":"red"}">${fmt(delta)}</td>
                    <td>${pct.toFixed(1)}%</td>
                    <td>${s0.toFixed(1)}%</td>
                    <td>${s1.toFixed(1)}%</td>
                    <td class="${ds>=0?"green":"red"}">${ds.toFixed(1)}</td>
                </tr>`;
            });

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
            </div>`;
        });

        // ── Grand total ──
        if(activities.length > 1){
            const gdR    = grandR.R1 - grandR.R0;
            const gdRpct = grandR.R0 ? gdR/grandR.R0*100 : 0;

            html += `
            <div class="grand-total-block">
                <div class="section-header" style="margin-bottom:0">
                    <div class="section-title">${t("grandTotal")}</div>
                    <div class="section-meta">${meta}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>${t("activityName")}</th>
                            <th>${col0}</th><th>${col1}</th>
                            <th>${t("change")}</th><th>${t("changePct")}</th>
                            <th>${col0}</th><th>${col1}</th>
                            <th>${t("deltaShare")}</th>
                        </tr>
                    </thead>
                    <tbody>`;

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
                </tr>`;
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
            </div>`;
        }

        document.getElementById("tableBlock").innerHTML = html;

        this.bindControls();
        this.bindInputs();
        this.enablePaste();
        this.bindTabNavigation();
        this.bindCollapseButtons();
    },

    // ── Collapse ──
    bindCollapseButtons(){
        document.querySelectorAll(".collapse-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const ai   = +btn.dataset.ai;
                const wrap = btn.closest(".activity-block").querySelector(".table-body-wrap");
                const icon = btn.querySelector(".collapse-icon-box");
                const isCol = wrap.style.display === "none";
                wrap.style.display = isCol ? "" : "none";
                icon.textContent   = isCol ? "−" : "+";
                this._collapsed[ai] = !isCol;
            };
        });
        document.getElementById("collapseAllBtn")?.addEventListener("click", () => {
            document.querySelectorAll(".table-body-wrap").forEach((w,i) => { w.style.display="none"; this._collapsed[i]=true; });
            document.querySelectorAll(".collapse-icon-box").forEach(ic => ic.textContent="+");
        });
        document.getElementById("expandAllBtn")?.addEventListener("click", () => {
            document.querySelectorAll(".table-body-wrap").forEach((w,i) => { w.style.display=""; this._collapsed[i]=false; });
            document.querySelectorAll(".collapse-icon-box").forEach(ic => ic.textContent="−");
        });
    },

    // ── Controls: groupCount, singleFactor ──
    // act-name-inline: draft on input, flush to Store on blur/Enter only
    bindControls(){

        document.querySelectorAll(".act-name-inline").forEach(el => {
            el.oninput = (e) => {
                const ai = +e.target.dataset.ai;
                if(!this._draft[ai]) this._draft[ai] = {};
                this._draft[ai]._name = e.target.value;
                // update display title live without Store
                const disp = document.querySelector(`.activity-block[data-ai="${ai}"] .activity-name-display`);
                if(disp) disp.textContent = e.target.value;
            };
            const save = (e) => this._flush(+e.target.dataset.ai);
            el.onblur    = save;
            el.onkeydown = (e) => { if(e.key === "Enter"){ save(e); e.preventDefault(); } };
        });

        document.querySelectorAll(".act-groups").forEach(el => {
            el.onchange = (e) => {
                const ai  = +e.target.dataset.ai;
                const n   = Math.min(20, Math.max(1, +e.target.value||1));
                e.target.value = n;
                const act = Store.get("activities")[ai];
                const old = act.groups || [];
                const groups = Array.from({length:n}, (_,i) =>
                    old[i] || { name:`${t("group")} ${i+1}`, quantity0:0, quantity1:0, price0:0, price1:0, revenue0:0, revenue1:0 }
                );
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

    // ── Table inputs: draft on input, flush on blur/Enter ──
    bindInputs(){
        document.querySelectorAll("#tableBlock tbody input").forEach(input => {

            // Update draft silently (no Store, no re-render)
            input.addEventListener("input", e => {
                const ai    = +e.target.dataset.ai;
                const gi    = +e.target.dataset.gi;
                const field = e.target.dataset.field;
                if(!this._draft[ai])     this._draft[ai]    = {};
                if(!this._draft[ai][gi]) this._draft[ai][gi] = {};
                this._draft[ai][gi][field] = e.target.value;
            });

            // Flush to Store on blur
            input.addEventListener("blur", e => {
                this._flush(+e.target.dataset.ai);
            });
        });
    },

    // ── Tab: within row → next input in same row; last in row → first input in next row ──
    bindTabNavigation(){

        // Collect all editable inputs per table row
        const tableBlock = document.getElementById("tableBlock");

        tableBlock.addEventListener("keydown", (e) => {

            const input = e.target;
            if(input.tagName !== "INPUT") return;
            if(e.key !== "Tab" && e.key !== "Enter") return;

            // Find current row
            const row = input.closest("tr");
            if(!row) return;

            const rowInputs = Array.from(row.querySelectorAll("input"));
            const idx       = rowInputs.indexOf(input);

            if(e.key === "Tab"){

                // Flush current activity on tab
                const ai = +input.dataset.ai;
                if(!isNaN(ai)) this._flush(ai);

                if(idx < rowInputs.length - 1){
                    // Next input in same row
                    e.preventDefault();
                    rowInputs[idx+1].focus();
                } else {
                    // Last input in row → first input in next row
                    const nextRow = row.nextElementSibling;
                    if(nextRow){
                        const nextInputs = nextRow.querySelectorAll("input");
                        if(nextInputs.length){
                            e.preventDefault();
                            nextInputs[0].focus();
                        }
                    }
                    // else let natural tab continue
                }

            } else if(e.key === "Enter"){
                e.preventDefault();
                const ai = +input.dataset.ai;
                if(!isNaN(ai)) this._flush(ai);
                // Move to next input in row, or first of next row
                if(idx < rowInputs.length - 1){
                    rowInputs[idx+1].focus();
                } else {
                    const nextRow = row.nextElementSibling;
                    const nextInputs = nextRow?.querySelectorAll("input");
                    if(nextInputs?.length) nextInputs[0].focus();
                }
            }
        });
    },

    // ── Excel paste: row 0 = activity name, rows 1..N = groups ──
    enablePaste(){
        const targets = document.querySelectorAll("#tableBlock tbody input, .act-name-inline");
        targets.forEach(input => {
            input.onpaste = (e) => {
                const text = e.clipboardData.getData("text");
                if(!text.includes("\n")) return;

                e.preventDefault();

                const ai     = +e.target.dataset.ai;
                const acts   = Store.get("activities");
                const act    = acts[ai];
                const single = !!act.singleFactor;
                const rows   = text.trim().split("\n");

                const newName = rows[0].split(/\t/)[0]?.trim() || act.name;

                rows.slice(1).forEach((row, i) => {
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

                setTimeout(() => Store.setActivity(ai, { name: newName, groups: act.groups }), 0);
            };
        });
    }
};
