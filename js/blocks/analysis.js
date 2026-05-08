import { Store }       from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t }           from '../i18n.js';

function fmt(v){
    return v.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
}
function fmtSigned(v){
    const s = Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
    return (v >= 0 ? "+" : "−") + s;
}
function cls(v){ return v < 0 ? "red" : v > 0 ? "green" : ""; }
function pct(part, total){ return total ? (part / Math.abs(total) * 100) : 0; }

export const AnalysisBlock = {
    _checked:   {},   // id → bool
    _collapsed: {},   // id → bool
    _sortDir:   0,    // 0 none  1 asc  -1 desc

    init(){
        Store.subscribe(()      => this.render());
        Store.subscribeAnalysis(() => this.render());
    },

    render(){
        const el = document.getElementById("analysisBlock");
        if(!el) return;
        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branches    = Store.get("branches") || [];
        const branchCount = Store.get("branchCount") || 1;
        const ab          = Store.get("activeBranch");
        const isSummary   = branchCount > 1 && ab === -1;
        const multiB      = branchCount > 1;

        const bList = isSummary ? branches : (branches[ab] ? [branches[ab]] : []);
        if(!bList.length){ el.innerHTML = ""; return; }

        const d = FactorModel.calcDetailed(bList);
        if(d.R0 === 0 && d.R1 === 0){ el.innerHTML = ""; return; }

        // ── Build factor-first structure ──
        // factors[effectKey] = { label, branches[bi] = { name, groups[{id,label,value}] } }
        const EFFECTS = [
            { key:"q", label: t("factorQty")      },
            { key:"p", label: t("factorPrice")     },
            { key:"d", label: t("factorDiscount")  },
            { key:"s", label: t("factorSingle")    },
        ];

        const factors = {};
        EFFECTS.forEach(e => { factors[e.key] = { label: e.label, branches: [] }; });

        d.branches.forEach((br, bi) => {
            const bname = br.name || `${t("branch")} ${bi+1}`;
            EFFECTS.forEach(e => {
                const groups = [];
                br.activities.forEach(act => {
                    if(e.key === "s" && !act.singleFactor) return;
                    if(e.key !== "s" && act.singleFactor)  return;
                    act.groups.forEach(g => {
                        const val = e.key === "s" ? (g.s||0) : (g[e.key]||0);
                        if(val !== 0){
                            const id = `${e.key}_b${bi}_${act.name}_${g.name||""}`;
                            groups.push({ id, label:`${act.name} / ${g.name||t("group")}`, value:val });
                        }
                    });
                });
                if(groups.length) factors[e.key].branches.push({ name:bname, bi, groups });
            });
        });

        // Init checkboxes
        Object.values(factors).forEach(f => f.branches.forEach(br =>
            br.groups.forEach(g => { if(this._checked[g.id]===undefined) this._checked[g.id]=true; })
        ));

        // Checked total
        let checkedTotal = 0;
        Object.values(factors).forEach(f => f.branches.forEach(br =>
            br.groups.forEach(g => { if(this._checked[g.id]) checkedTotal += g.value; })
        ));

        // Sort icon
        const si = this._sortDir === 0
            ? `<span class="afs-none">↕</span>`
            : this._sortDir === 1
            ? `<span class="afs-asc">▲</span>`
            : `<span class="afs-desc">▼</span>`;

        // ── HTML ──
        let html = `
        <b>${t("analysis")}</b>
        <div class="af-summary">
            <div class="af-sr"><span>${t("revenue")} 0</span><span class="af-sv">${fmt(d.R0)}</span></div>
            <div class="af-sr"><span>${t("revenue")} 1</span><span class="af-sv">${fmt(d.R1)}</span></div>
            <div class="af-sr af-sr-dr"><span>${t("change")}</span><span class="af-sv ${cls(d.dR)}">${fmtSigned(d.dR)}</span></div>
        </div>
        <table class="af-table">
        <thead><tr>
            <th class="af-tc"></th>
            <th class="af-tn">${t("analysis")}</th>
            <th class="af-tv">${t("change")}</th>
            <th class="af-tp" id="afsortbtn">% ${si}</th>
        </tr></thead>
        <tbody>`;

        EFFECTS.forEach(e => {
            const f = factors[e.key];
            if(!f.branches.length) return;

            const fid  = `f_${e.key}`;
            const fcol = f.branches.reduce((s,b) => s + b.groups.reduce((ss,g)=>ss+g.value,0), 0);
            const fchecked = f.branches.reduce((s,b) => s + b.groups.filter(g=>this._checked[g.id]).reduce((ss,g)=>ss+g.value,0), 0);
            const fopen = !this._collapsed[fid];

            // Factor row (level 1)
            html += `<tr class="af-l1">
                <td>${this._checkBox(fid, f.branches.flatMap(b=>b.groups))}</td>
                <td class="af-l1n">
                    <span class="af-pm" data-cid="${fid}">${fopen?"−":"+"}</span>
                    ${f.label}
                </td>
                <td class="${cls(fchecked)}">${fmtSigned(fchecked)}</td>
                <td class="${cls(fchecked)}">${pct(fchecked,d.dR).toFixed(1)}%</td>
            </tr>`;

            if(!fopen) return;

            f.branches.forEach((br, bri) => {
                const bid   = `${fid}_b${bri}`;
                const bcol  = br.groups.reduce((s,g)=>s+g.value,0);
                const bchecked = br.groups.filter(g=>this._checked[g.id]).reduce((s,g)=>s+g.value,0);
                const bopen = !this._collapsed[bid];

                if(multiB){
                    // Branch row (level 2)
                    html += `<tr class="af-l2">
                        <td>${this._checkBox(bid, br.groups)}</td>
                        <td class="af-l2n">
                            <span class="af-pm" data-cid="${bid}">${bopen?"−":"+"}</span>
                            ${br.name}
                        </td>
                        <td class="${cls(bchecked)}">${fmtSigned(bchecked)}</td>
                        <td class="${cls(bchecked)}">${pct(bchecked,d.dR).toFixed(1)}%</td>
                    </tr>`;
                    if(!bopen) return;
                }

                // Sort groups (level 3)
                let groups = [...br.groups];
                if(this._sortDir ===  1) groups.sort((a,b) => a.value - b.value);
                if(this._sortDir === -1) groups.sort((a,b) => b.value - a.value);

                groups.forEach(g => {
                    html += `<tr class="af-l3 ${this._checked[g.id]?'':'af-dim'}">
                        <td>${this._checkBox(g.id, [g])}</td>
                        <td class="af-l3n">${g.label}</td>
                        <td class="${cls(g.value)}">${fmtSigned(g.value)}</td>
                        <td class="${cls(g.value)}">${pct(g.value,d.dR).toFixed(1)}%</td>
                    </tr>`;
                });
            });
        });

        html += `</tbody>
        <tfoot><tr class="af-foot">
            <td></td>
            <td>${t("total")} (${t("selected")||"selected"})</td>
            <td class="${cls(checkedTotal)}">${fmtSigned(checkedTotal)}</td>
            <td class="${cls(checkedTotal)}">${pct(checkedTotal,d.dR).toFixed(1)}%</td>
        </tr></tfoot>
        </table>`;

        el.innerHTML = html;
        this._bind(el, d);
    },

    // Green checkbox HTML
    _checkBox(id, groups){
        const allChecked = groups.every(g => this._checked[g.id !== undefined ? g.id : id]);
        // For group-level checkbox id IS the group id
        const isLeaf = groups.length === 1 && groups[0].id === id;
        const dataAttr = isLeaf ? `data-lid="${id}"` : `data-gid="${id}" data-ids="${groups.map(g=>g.id).join(',')}"`;
        return `<label class="af-chk"><input type="checkbox" ${dataAttr} ${allChecked?'checked':''}><span class="af-chkmark"></span></label>`;
    },

    _bind(el, d){
        // Sort
        el.querySelector("#afsortbtn").addEventListener("click", () => {
            this._sortDir = this._sortDir === 0 ? 1 : this._sortDir === 1 ? -1 : 0;
            this.render();
        });

        // Collapse/expand — ONLY the ± button
        el.querySelectorAll("[data-cid]").forEach(pm => {
            pm.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = pm.dataset.cid;
                this._collapsed[id] = !this._collapsed[id];
                this.render();
            });
        });

        // Leaf checkboxes
        el.querySelectorAll("input[data-lid]").forEach(cb => {
            cb.addEventListener("change", (e) => {
                e.stopPropagation();
                this._checked[cb.dataset.lid] = cb.checked;
                this.render();
            });
        });

        // Group checkboxes (level 1 or 2)
        el.querySelectorAll("input[data-ids]").forEach(cb => {
            cb.addEventListener("change", (e) => {
                e.stopPropagation();
                cb.dataset.ids.split(",").forEach(id => { this._checked[id] = cb.checked; });
                this.render();
            });
        });
    }
};
