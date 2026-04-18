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
    if(s === "thousands") return t("thousands");
    if(s === "millions")  return t("millions");
    return "";
}
function fmt(v){
    const val = v / getScaleDiv();
    return val.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
}
// Two-line th: type bold top, period smaller bottom
function periodLabel(typeKey, periodKey, yearKey){
    const p = Store.get("periods") || {};
    const typeStr = (p[typeKey]||"Actual") === "Planned" ? t("planned") : t("actual");
    const per  = p[periodKey] || "";
    const year = p[yearKey]   || "";
    const period = per ? `${per}, ${year}` : year;
    return `<span class="th-type">${typeStr}</span><span class="th-period">${period}</span>`;
}
// Plain text for meta line (no HTML tags)
function periodLabelText(typeKey, periodKey, yearKey){
    const p = Store.get("periods") || {};
    const typeStr = (p[typeKey]||"Actual") === "Planned" ? t("planned") : t("actual");
    const per  = p[periodKey] || "";
    const year = p[yearKey]   || "";
    return per ? `${typeStr} ${per}, ${year}` : `${typeStr} ${year}`;
}
// "Actual W52, 2025 — Planned W1, 2026 | Thousands ₪"
function sectionMeta(){
    const p   = Store.get("periods") || {};
    const sym = getCurrencySymbol();
    const sc  = getScaleShort();
    const col0 = periodLabelText("type0","period0","year0");
    const col1 = periodLabelText("type1","period1","year1");
    let meta = `${col0} — ${col1}`;
    const unit = [sc, sym].filter(Boolean).join(" ");
    if(unit) meta += ` | ${unit}`;
    return meta;
}

// ─────────────────────────────────────────────
//  TableBlock
//
//  INPUT ARCHITECTURE:
//  - oninput  → updates _draft only (NO Store, NO re-render)
//  - onblur   → calls _flushSilent (writes to Store._state directly,
//               NO emit, NO re-render)
//  - Store.emit() only on: Build, Test, groupCount change,
//    singleFactor toggle, paste
//  - This breaks the render loop completely
// ─────────────────────────────────────────────

export const TableBlock = {

    _collapsed: {},
    _draft: {},          // [ai][gi][field] or [ai]._name
    _rendering: false,   // re-entrancy guard

    init(){
        Store.subscribe(() => {
            if(this._rendering) return;
            this.render();
        });
        // Show placeholder immediately on page load
        this.render();
    },

    // Write draft → Store._state WITHOUT triggering emit/render
    _flushSilent(ai){
        const draft = this._draft[ai];
        if(!draft) return;

        const acts = Store.state.activities;
        if(!acts || !acts[ai]) return;

        if(draft._name !== undefined){
            acts[ai].name = draft._name;
        }

        const groups = acts[ai].groups || [];
        Object.keys(draft).forEach(key => {
            if(key === "_name") return;
            const gi = +key;
            if(!groups[gi]) return;
            const fields = draft[gi] || {};
            Object.keys(fields).forEach(field => {
                const raw = fields[field];
                groups[gi][field] = field === "name" ? raw : (parseFloat(raw) || 0);
            });
        });

        // Save + notify analysis only (no table re-render)
        Store.flushNotifyAnalysis();
    },

    render(){
        if(!Store.get("built")){
            document.getElementById("tableBlock").innerHTML = `
            <div class="empty-placeholder">
                <div class="empty-placeholder-icon">⬆</div>
                <div class="empty-placeholder-text">${t("placeholder")}</div>
            </div>`;
            return;
        }

        const branches     = Store.get("branches") || [];
        const branchCount  = Store.get("branchCount") || 1;
        const activeBranch = Store.get("activeBranch");
        const isSummary    = branchCount > 1 && activeBranch === -1;

        // Get activities for current view
        let activities = [];
        if(isSummary){
            // Summary: aggregate all branches into virtual activities
            activities = this._aggregateBranches(branches);
        } else {
            activities = branches[activeBranch]?.activities || [];
        }

        if(!activities || !activities.length){
            document.getElementById("tableBlock").innerHTML = `
            <div class="empty-placeholder">
                <div class="empty-placeholder-icon">⬆</div>
                <div class="empty-placeholder-text">${t("placeholder")}</div>
            </div>`;
            return;
        }

        this._rendering = true;
        // Always start fully expanded on each full render
        this._collapsed = {};

        // Rebuild draft from Store
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
            // single: inputs ARE rev0/rev1 columns, so header = col0|col1 then change|%
            // multi:  inputs are qty/price, revenue is computed, so header = col0|col1|change|%
            const colsRevHdr   = `<th>${col0}</th><th>${col1}</th><th>${t("change")}</th><th>${t("changePct")}</th>`;
            const colsShareHdr = `<th>${col0}</th><th>${col1}</th><th>${t("deltaShare")}</th>`;
            // single colspan: group(1) + rev0+rev1(2) + change+%(2) + share×3(3) = 8 cols total
            // Revenue group header: in single covers only the 2 direct input cols
            const revColspan = single ? "2" : "4";

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
                            value="${actName.replace(/"/g,'&quot;')}"
                            placeholder="${t("activityName")}…"
                            spellcheck="false"
                            autocomplete="off"
                            tabindex="0"
                        >
                        <div class="section-meta">${meta}</div>
                    </div>
                    <div class="activity-controls">
                        <label class="ctrl-label">${t("groupCount")}:</label>
                        <input class="act-groups" type="number" min="1" max="20" data-ai="${ai}"
                            value="${act.groupCount||groups.length}" style="width:44px" tabindex="-1">
                        <label class="ctrl-checkbox">
                            <input type="checkbox" class="act-single" data-ai="${ai}" ${single?"checked":""} tabindex="-1">
                            <span>${t("singleFactor")}</span>
                        </label>
                        <button class="collapse-btn" data-ai="${ai}" tabindex="-1">
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
                            <th colspan="${revColspan}">${t("revenue")}</th>
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
                const da    = `data-ai="${ai}" data-gi="${gi}"`;

                const ro = isSummary ? 'readonly tabindex="-1"' : '';
                const inputsQP = !single ? `
                    <td><input data-field="quantity0" ${da} ${ro} value="${g.quantity0||""}"></td>
                    <td><input data-field="quantity1" ${da} ${ro} value="${g.quantity1||""}"></td>
                    <td><input data-field="price0"    ${da} ${ro} value="${g.price0||""}"></td>
                    <td><input data-field="price1"    ${da} ${ro} value="${g.price1||""}"></td>
                    <td class="num">${fmt(r0[gi])}</td>
                    <td class="num">${fmt(r1[gi])}</td>
                ` : `
                    <td><input data-field="revenue0" ${da} ${ro} value="${g.revenue0||""}"></td>
                    <td><input data-field="revenue1" ${da} ${ro} value="${g.revenue1||""}"></td>
                `;

                html += `
                <tr data-ai="${ai}" data-gi="${gi}">
                    <td><input data-field="name" ${da} ${isSummary?'readonly tabindex="-1"':''} value="${(g.name||"").replace(/"/g,'&quot;')}"></td>
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

        // Grand total
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

        this._rendering = false;

        this._bindAll();
    },


    // ── Aggregate all branches for Summary tab ──
    // Each activity summed across branches (same index = same activity)
    _aggregateBranches(branches){
        if(!branches.length) return [];
        const first = branches[0].activities || [];
        const result = first.map((act, ai) => ({
            name:         act.name,
            groupCount:   act.groupCount,
            singleFactor: act.singleFactor,
            groups: (act.groups || []).map((g, gi) => {
                // Sum this group across all branches
                let q0=0, q1=0, p0Sum=0, p1Sum=0, rev0=0, rev1=0, pCount=0;
                branches.forEach(b => {
                    const bg = b.activities?.[ai]?.groups?.[gi];
                    if(!bg) return;
                    if(act.singleFactor){
                        rev0 += +bg.revenue0 || 0;
                        rev1 += +bg.revenue1 || 0;
                    } else {
                        q0 += +bg.quantity0 || 0;
                        q1 += +bg.quantity1 || 0;
                        // Weighted average price: total_revenue / total_qty
                        p0Sum += (+bg.quantity0||0) * (+bg.price0||0);
                        p1Sum += (+bg.quantity1||0) * (+bg.price1||0);
                        pCount++;
                    }
                });
                if(act.singleFactor){
                    return { ...g, revenue0: rev0, revenue1: rev1 };
                } else {
                    const avgP0 = q0 ? p0Sum / q0 : 0;
                    const avgP1 = q1 ? p1Sum / q1 : 0;
                    return { ...g, quantity0: q0, quantity1: q1, price0: Math.round(avgP0), price1: Math.round(avgP1) };
                }
            })
        }));
        return result;
    },

    // ── Bind everything after render ──
    _bindAll(){
        this._bindCollapseButtons();
        this._bindControls();
        this._bindDataInputs();
        this._bindTabNavigation();
        this._bindPaste();
    },

    // ── Collapse ──
    _bindCollapseButtons(){
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
            document.querySelectorAll(".table-body-wrap").forEach((w,i) => {
                w.style.display = "none"; this._collapsed[i] = true;
            });
            document.querySelectorAll(".collapse-icon-box").forEach(ic => ic.textContent = "+");
        });
        document.getElementById("expandAllBtn")?.addEventListener("click", () => {
            document.querySelectorAll(".table-body-wrap").forEach((w,i) => {
                w.style.display = ""; this._collapsed[i] = false;
            });
            document.querySelectorAll(".collapse-icon-box").forEach(ic => ic.textContent = "−");
        });
    },

    // ── Activity-level controls (groupCount, singleFactor, name) ──
    _bindControls(){

        // Name: draft on input, flushSilent on blur, full emit on Enter
        document.querySelectorAll(".act-name-inline").forEach(el => {
            el.addEventListener("focus", (e) => { e.target.select(); });
            el.oninput = (e) => {
                const ai = +e.target.dataset.ai;
                if(!this._draft[ai]) this._draft[ai] = {};
                this._draft[ai]._name = e.target.value;
            };
            el.onblur = (e) => {
                this._flushSilent(+e.target.dataset.ai);
                this._recalcGrandTotal();
            };
            el.onkeydown = (e) => {
                if(e.key === "Enter"){
                    e.preventDefault();
                    this._flushSilent(+e.target.dataset.ai);
                    // focus first input in the first row of this activity
                    const ai    = +e.target.dataset.ai;
                    const block = document.querySelector(`.activity-block[data-ai="${ai}"]`);
                    const first = block?.querySelector("tbody input");
                    first?.focus();
                }
            };
        });

        // Group count — triggers full re-render (structural change)
        document.querySelectorAll(".act-groups").forEach(el => {
            el.onchange = (e) => {
                const ai  = +e.target.dataset.ai;
                const n   = Math.min(20, Math.max(1, +e.target.value||1));
                e.target.value = n;
                this._flushSilent(ai); // save current values first
                const act = Store.get("activities")[ai];
                const old = act.groups || [];
                const groups = Array.from({length:n}, (_,i) =>
                    old[i] || { name:`${t("group")} ${i+1}`, quantity0:0, quantity1:0, price0:0, price1:0, revenue0:0, revenue1:0 }
                );
                Store.setActivity(ai, { groupCount: n, groups }); // emits → re-render
            };
        });

        // Single-factor toggle — only works after BUILD
        document.querySelectorAll(".act-single").forEach(el => {
            el.onchange = (e) => {
                const ai       = +e.target.dataset.ai;
                const goSingle = e.target.checked;

                if(!Store.get("built")) return; // ignore before BUILD

                this._flushSilent(ai); // save current draft first

                const act    = Store.get("activities")[ai];
                const groups = (act.groups || []).map(g => {
                    const ng = { ...g };
                    if(goSingle){
                        // multi → single: compute revenue from qty*price if revenue is zero
                        if(!ng.revenue0 && ng.quantity0 && ng.price0)
                            ng.revenue0 = (+ng.quantity0||0) * (+ng.price0||0);
                        if(!ng.revenue1 && ng.quantity1 && ng.price1)
                            ng.revenue1 = (+ng.quantity1||0) * (+ng.price1||0);
                    } else {
                        // single → multi: zero out qty and price (meaningless from single)
                        ng.quantity0 = 0; ng.quantity1 = 0;
                        ng.price0    = 0; ng.price1    = 0;
                    }
                    return ng;
                });

                Store.setActivity(ai, { singleFactor: goSingle, groups });
                // Store.emit triggers full render which rebuilds grand total
            };
        });
    },

    // ── Data inputs: draft + live DOM recalc, NO Store on input/blur ──
    _bindDataInputs(){
        document.querySelectorAll("#tableBlock tbody input").forEach(input => {

            // Select all on focus — easy value replacement
            input.addEventListener("focus", (e) => {
                e.target.select();
            });

            // oninput → update draft + recalc row and totals live
            input.oninput = (e) => {
                const ai    = +e.target.dataset.ai;
                const gi    = +e.target.dataset.gi;
                const field = e.target.dataset.field;
                if(!this._draft[ai])     this._draft[ai]    = {};
                if(!this._draft[ai][gi]) this._draft[ai][gi] = {};
                this._draft[ai][gi][field] = e.target.value;
                // Live-update computed cells for this activity
                this._recalcActivity(ai);
                this._recalcGrandTotal();
            };

            // onblur → flushSilent (no emit, no re-render)
            input.onblur = (e) => {
                this._flushSilent(+e.target.dataset.ai);
            };
        });
    },

    // ── Live recalc: read draft, update computed DOM cells ──
    _recalcActivity(ai){
        const block  = document.querySelector(`.activity-block[data-ai="${ai}"]`);
        if(!block) return;

        const acts   = Store.get("activities");
        const act    = acts[ai];
        if(!act) return;
        const single = !!act.singleFactor;
        const draft  = this._draft[ai] || {};
        const groups = act.groups || [];

        let R0=0, R1=0, totalQ0=0, totalQ1=0;
        const r0=[], r1=[];

        groups.forEach((g, gi) => {
            const d = draft[gi] || {};
            if(single){
                r0[gi] = parseFloat(d.revenue0 ?? g.revenue0) || 0;
                r1[gi] = parseFloat(d.revenue1 ?? g.revenue1) || 0;
            } else {
                const q0 = parseFloat(d.quantity0 ?? g.quantity0) || 0;
                const q1 = parseFloat(d.quantity1 ?? g.quantity1) || 0;
                const p0 = parseFloat(d.price0    ?? g.price0)    || 0;
                const p1 = parseFloat(d.price1    ?? g.price1)    || 0;
                r0[gi] = q0 * p0;
                r1[gi] = q1 * p1;
                totalQ0 += q0; totalQ1 += q1;
            }
            R0 += r0[gi]; R1 += r1[gi];
        });

        const dR    = R1 - R0;
        const dRpct = R0 ? dR / R0 * 100 : 0;
        const avgP0 = totalQ0 ? R0 / totalQ0 : 0;
        const avgP1 = totalQ1 ? R1 / totalQ1 : 0;

        // Update per-row computed cells
        block.querySelectorAll("tbody tr[data-gi]").forEach(row => {
            const gi = +row.dataset.gi;
            if(isNaN(gi)) return;

            const delta = r1[gi] - r0[gi];
            const pct   = r0[gi] ? delta / r0[gi] * 100 : 0;
            const s0    = R0 ? r0[gi] / R0 * 100 : 0;
            const s1    = R1 ? r1[gi] / R1 * 100 : 0;
            const ds    = s1 - s0;

            // Computed revenue cells (only in multi-factor mode)
            if(!single){
                const cells = row.querySelectorAll("td.num");
                if(cells[0]) cells[0].textContent = fmt(r0[gi]);
                if(cells[1]) cells[1].textContent = fmt(r1[gi]);
            }

            // Delta, %, shares — always last 5 tds (non-input)
            const allTds = Array.from(row.querySelectorAll("td"));
            const last5  = allTds.slice(-5);
            if(last5[0]){ last5[0].textContent = fmt(delta); last5[0].className = delta>=0 ? "green" : "red"; }
            if(last5[1]){ last5[1].textContent = pct.toFixed(1)+"%"; last5[1].className = ""; }
            if(last5[2]){ last5[2].textContent = s0.toFixed(1)+"%";  last5[2].className = ""; }
            if(last5[3]){ last5[3].textContent = s1.toFixed(1)+"%";  last5[3].className = ""; }
            if(last5[4]){ last5[4].textContent = ds.toFixed(1);       last5[4].className = ds>=0 ? "green" : "red"; }
        });

        // Update total row (tfoot)
        const tfoot = block.querySelector("tfoot tr.total");
        if(tfoot){
            const tds = Array.from(tfoot.querySelectorAll("td"));
            // Find the delta td (has green/red class)
            if(!single){
                // cols: name | q0 | q1 | avgP0 | avgP1 | R0 | R1 | dR | dRpct | 100% | 100% | 0
                if(tds[1]) tds[1].textContent = totalQ0;
                if(tds[2]) tds[2].textContent = totalQ1;
                if(tds[3]) tds[3].textContent = Math.round(avgP0);
                if(tds[4]) tds[4].textContent = Math.round(avgP1);
                if(tds[5]) tds[5].textContent = fmt(R0);
                if(tds[6]) tds[6].textContent = fmt(R1);
                if(tds[7]){ tds[7].textContent = fmt(dR); tds[7].className = dR>=0 ? "green" : "red"; }
                if(tds[8]) tds[8].textContent  = dRpct.toFixed(1)+"%";
            } else {
                // cols: name | R0 | R1 | dR | dRpct | 100% | 100% | 0
                if(tds[1]) tds[1].textContent = fmt(R0);
                if(tds[2]) tds[2].textContent = fmt(R1);
                if(tds[3]){ tds[3].textContent = fmt(dR); tds[3].className = dR>=0 ? "green" : "red"; }
                if(tds[4]) tds[4].textContent  = dRpct.toFixed(1)+"%";
            }
        }
    },


    // ── Recalc grand total table from current draft + store ──
    _recalcGrandTotal(){
        const gtBlock = document.querySelector(".grand-total-block");
        if(!gtBlock) return;

        const activities = Store.get("activities");
        if(!activities || activities.length < 2) return;

        const grandR = { R0:0, R1:0 };
        const rows   = [];

        activities.forEach((act, ai) => {
            const single = !!act.singleFactor;
            const draft  = this._draft[ai] || {};
            const groups = act.groups || [];
            let R0=0, R1=0;

            groups.forEach((g, gi) => {
                const d = draft[gi] || {};
                if(single){
                    R0 += parseFloat(d.revenue0 ?? g.revenue0) || 0;
                    R1 += parseFloat(d.revenue1 ?? g.revenue1) || 0;
                } else {
                    const q0 = parseFloat(d.quantity0 ?? g.quantity0) || 0;
                    const q1 = parseFloat(d.quantity1 ?? g.quantity1) || 0;
                    const p0 = parseFloat(d.price0    ?? g.price0)    || 0;
                    const p1 = parseFloat(d.price1    ?? g.price1)    || 0;
                    R0 += q0 * p0;
                    R1 += q1 * p1;
                }
            });

            grandR.R0 += R0;
            grandR.R1 += R1;

            // Get current name from draft or store
            const name = (draft._name !== undefined ? draft._name : act.name) || (t("activityName")+" "+(ai+1));
            rows.push({ name, R0, R1 });
        });

        const gdR    = grandR.R1 - grandR.R0;
        const gdRpct = grandR.R0 ? gdR / grandR.R0 * 100 : 0;

        // Update tbody rows
        const tbodyRows = Array.from(gtBlock.querySelectorAll("tbody tr"));
        tbodyRows.forEach((row, i) => {
            if(!rows[i]) return;
            const { name, R0, R1 } = rows[i];
            const d    = R1 - R0;
            const dpct = R0 ? d / R0 * 100 : 0;
            const s0   = grandR.R0 ? R0 / grandR.R0 * 100 : 0;
            const s1   = grandR.R1 ? R1 / grandR.R1 * 100 : 0;
            const ds   = s1 - s0;

            const tds = Array.from(row.querySelectorAll("td"));
            if(tds[0]) tds[0].textContent = name;
            if(tds[1]) tds[1].textContent = fmt(R0);
            if(tds[2]) tds[2].textContent = fmt(R1);
            if(tds[3]){ tds[3].textContent = fmt(d);          tds[3].className = d>=0  ? "green" : "red"; }
            if(tds[4]) tds[4].textContent  = dpct.toFixed(1)+"%";
            if(tds[5]) tds[5].textContent  = s0.toFixed(1)+"%";
            if(tds[6]) tds[6].textContent  = s1.toFixed(1)+"%";
            if(tds[7]){ tds[7].textContent = ds.toFixed(1);   tds[7].className = ds>=0 ? "green" : "red"; }
        });

        // Update tfoot total row
        const tfootTds = Array.from(gtBlock.querySelectorAll("tfoot td"));
        if(tfootTds[1]) tfootTds[1].textContent = fmt(grandR.R0);
        if(tfootTds[2]) tfootTds[2].textContent = fmt(grandR.R1);
        if(tfootTds[3]){ tfootTds[3].textContent = fmt(gdR); tfootTds[3].className = gdR>=0 ? "green" : "red"; }
        if(tfootTds[4]) tfootTds[4].textContent  = gdRpct.toFixed(1)+"%";
    },

    // ── Tab / Enter navigation ──
    // Tab:   next input in row → wrap to first input of next row
    // Enter: same as Tab
    // act-name-inline → Enter → first cell of first row (handled in _bindControls)
    _bindTabNavigation(){

        const block = document.getElementById("tableBlock");

        block.addEventListener("keydown", (e) => {
            const el = e.target;
            if(el.tagName !== "INPUT") return;
            if(e.key !== "Tab" && e.key !== "Enter") return;

            // Skip controls (act-groups etc)
            if(!el.dataset.field && !el.classList.contains("act-name-inline")) return;

            // act-name-inline Enter is handled separately in _bindControls
            if(el.classList.contains("act-name-inline") && e.key === "Enter") return;

            const row = el.closest("tr");
            if(!row) return;

            // Only inputs with data-field (editable data cells)
            const rowInputs = Array.from(row.querySelectorAll("input[data-field]"));
            const idx = rowInputs.indexOf(el);

            if(idx === -1) return; // not a data cell

            e.preventDefault();

            if(e.shiftKey && e.key === "Tab"){
                // Backwards
                if(idx > 0){
                    rowInputs[idx-1].focus();
                } else {
                    const prevRow = row.previousElementSibling;
                    const prevInputs = prevRow ? Array.from(prevRow.querySelectorAll("input[data-field]")) : [];
                    if(prevInputs.length) prevInputs[prevInputs.length-1].focus();
                }
                return;
            }

            // Forward
            if(idx < rowInputs.length - 1){
                rowInputs[idx+1].focus();
            } else {
                // Last input in row → first input in next row
                const nextRow = row.nextElementSibling;
                const nextInputs = nextRow ? Array.from(nextRow.querySelectorAll("input[data-field]")) : [];
                if(nextInputs.length){
                    nextInputs[0].focus();
                }
                // else natural tab (leaves table)
            }
        });
    },

    // ── Excel paste ──
    _bindPaste(){
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

                // Paste triggers full re-render which rebuilds grand total
                Store.setActivity(ai, { name: newName, groups: act.groups });
            };
        });
    }
};
