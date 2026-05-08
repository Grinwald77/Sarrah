import { Store }       from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t }           from '../i18n.js';

function fmt(v){
    return v.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
}
function fmtSigned(v){
    const s = Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
    return (v >= 0 ? "+" : "\u2212") + s;
}
function cls(v){ return v < 0 ? "red" : v > 0 ? "green" : ""; }
function pct(part, total){ return total ? (part / Math.abs(total) * 100) : 0; }

export const AnalysisBlock = {
    _checked:   {},
    _collapsed: {},
    _sortDir:   0,

    init(){
        Store.subscribe(()         => this.render());
        Store.subscribeAnalysis(() => this.render());
    },

    render(){
        try { this._render(); }
        catch(e){
            const el = document.getElementById("analysisBlock");
            if(el) el.innerHTML = `<div style="color:red;padding:8px;font-size:11px">${e.message}</div>`;
        }
    },

    _render(){
        const el = document.getElementById("analysisBlock");
        if(!el) return;
        if(!Store.get("built")){ el.innerHTML = ""; el.style.display = "none"; return; }
        el.style.display = "";

        const branches    = Store.get("branches") || [];
        const branchCount = Store.get("branchCount") || 1;
        const ab          = Store.get("activeBranch");
        const isSummary   = branchCount > 1 && ab === -1;
        const multiB      = branchCount > 1;

        const bList = isSummary ? branches : (branches[ab] ? [branches[ab]] : []);
        if(!bList.length){ el.innerHTML = ""; el.style.display = "none"; return; }

        const d = FactorModel.calcDetailed(bList);
        if(d.R0 === 0 && d.R1 === 0){ el.innerHTML = ""; el.style.display = "none"; return; }

        // Build tree: factor -> branch -> activity -> group
        const EFFECTS = [
            { key:"q", label: t("factorQty")      },
            { key:"p", label: t("factorPrice")     },
            { key:"d", label: t("factorDiscount")  },
            { key:"s", label: t("factorSingle")    },
        ];

        const tree = [];
        EFFECTS.forEach(e => {
            const fid = "f_" + e.key;
            const fNode = { id: fid, label: e.label, branches: [] };
            d.branches.forEach((br, bi) => {
                const bid = fid + "_b" + bi;
                const bName = br.name || (t("branch") + " " + (bi+1));
                const bNode = { id: bid, name: bName, activities: [] };
                br.activities.forEach((act, ai) => {
                    if(e.key === "s" && !act.singleFactor) return;
                    if(e.key !== "s" &&  act.singleFactor) return;
                    const aid = bid + "_a" + ai;
                    const groups = [];
                    act.groups.forEach((g, gi) => {
                        const val = e.key === "s" ? (g.s||0) : (g[e.key]||0);
                        if(val !== 0) groups.push({ id: aid + "_g" + gi, name: g.name || (t("group") + " " + (gi+1)), value: val });
                    });
                    if(groups.length) bNode.activities.push({ id: aid, name: act.name, groups });
                });
                if(bNode.activities.length) fNode.branches.push(bNode);
            });
            if(fNode.branches.length) tree.push(fNode);
        });

        if(!tree.length){ el.innerHTML = ""; el.style.display = "none"; return; }

        // Init checkboxes
        tree.forEach(f => f.branches.forEach(b => b.activities.forEach(a =>
            a.groups.forEach(g => { if(this._checked[g.id] === undefined) this._checked[g.id] = true; })
        )));

        // Sum helpers
        const gChecked = (g)  => this._checked[g.id] ? g.value : 0;
        const aChecked = (a)  => a.groups.reduce((s,g) => s + gChecked(g), 0);
        const bChecked = (b)  => b.activities.reduce((s,a) => s + aChecked(a), 0);
        const fChecked = (f)  => f.branches.reduce((s,b) => s + bChecked(b), 0);
        const aFull    = (a)  => a.groups.reduce((s,g) => s + g.value, 0);
        const bFull    = (b)  => b.activities.reduce((s,a) => s + aFull(a), 0);
        const fFull    = (f)  => f.branches.reduce((s,b) => s + bFull(b), 0);
        const grandChecked = tree.reduce((s,f) => s + fChecked(f), 0);

        // Sort icon
        const si = this._sortDir === 0
            ? '<span class="afs-none">\u2195</span>'
            : this._sortDir === 1
            ? '<span class="afs-asc">\u25b2</span>'
            : '<span class="afs-desc">\u25bc</span>';

        const lvlLabel = t("level") || "Level";
        // Dynamic period labels from Store
        const periods   = Store.get("periods") || {};
        const p0type    = periods.type0 === "Planned" ? t("planned") : t("actual");
        const p1type    = periods.type1 === "Planned" ? t("planned") : t("actual");
        const p0period  = periods.period0 ? periods.period0 + " " + (periods.year0||"") : (periods.year0||"");
        const p1period  = periods.period1 ? periods.period1 + " " + (periods.year1||"") : (periods.year1||"");
        const p0label   = p0type + (p0period ? " " + p0period.trim() : "");
        const p1label   = p1type + (p1period ? " " + p1period.trim() : "");
        const currency  = { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[Store.get("currency")||"ILS"] || "";
        const scaleTxt  = Store.get("scale") === "thousands" ? t("thousands") : Store.get("scale") === "millions" ? t("millions") : "";
        const unitLabel = [scaleTxt, currency].filter(Boolean).join(" ");
        const metaLabel = [p0label, "—", p1label, unitLabel ? "| " + unitLabel : ""].filter(Boolean).join(" ");

        let html = \`
        <b>\${t("analysis")}</b>
        <div class="af-meta">\${metaLabel}</div>
        <div class="af-summary">
            <div class="af-sr"><span>\${p0label}</span><span class="af-sv">\${fmt(d.R0)}</span></div>
            <div class="af-sr"><span>\${p1label}</span><span class="af-sv">\${fmt(d.R1)}</span></div>
            <div class="af-sr af-sr-dr"><span>\${t("change")}</span><span class="af-sv \${cls(d.dR)}">\${fmtSigned(d.dR)}</span></div>
        </div>\`;
        html = \`
        <b>\${t("analysis")}</b>
        <div class="af-meta">\${metaLabel}</div>
        <div class="af-summary">
            <div class="af-sr"><span>\${p0label}</span><span class="af-sv">\${fmt(d.R0)}</span></div>
            <div class="af-sr"><span>\${p1label}</span><span class="af-sv">\${fmt(d.R1)}</span></div>
            <div class="af-sr af-sr-dr"><span>\${t("change")}</span><span class="af-sv \${cls(d.dR)}">\${fmtSigned(d.dR)}</span></div>
        </div>\`;
        <div class="af-level-controls">
            <button class="af-lvl-btn" data-level="1">${lvlLabel} 1</button>
            <button class="af-lvl-btn" data-level="2">${lvlLabel} 2</button>
            <button class="af-lvl-btn" data-level="3">${lvlLabel} 3</button>
            <button class="af-lvl-btn" data-level="4">${lvlLabel} 4</button>
        </div>
        <table class="af-table">
        <thead><tr>
            <th class="af-tc"></th>
            <th class="af-tn">${t("analysis")}</th>
            <th class="af-tv">${t("change")}</th>
            <th class="af-tp" id="afsortbtn">% ${si}</th>
        </tr></thead>
        <tbody>`;

        tree.forEach(f => {
            const fSum  = fChecked(f);
            const fOpen = !this._collapsed[f.id];
            const fAllCh = f.branches.every(b => b.activities.every(a => a.groups.every(g => this._checked[g.id])));
            const fIds   = f.branches.flatMap(b => b.activities.flatMap(a => a.groups.map(g => g.id)));

            html += `<tr class="af-l1">
                <td>${this._chkHtml(fIds, fAllCh)}</td>
                <td class="af-l1n"><span class="af-pm" data-cid="${f.id}">${fOpen ? "\u2212" : "+"}</span>${f.label}</td>
                <td class="${cls(fSum)}">${fmtSigned(fSum)}</td>
                <td class="${cls(fSum)}">${pct(fSum, d.dR).toFixed(1)}%</td>
            </tr>`;

            if(!fOpen) return;

            f.branches.forEach(b => {
                const bSum  = bChecked(b);
                const bOpen = !this._collapsed[b.id];
                const bAllCh = b.activities.every(a => a.groups.every(g => this._checked[g.id]));
                const bIds   = b.activities.flatMap(a => a.groups.map(g => g.id));

                if(multiB){
                    html += `<tr class="af-l2">
                        <td>${this._chkHtml(bIds, bAllCh)}</td>
                        <td class="af-l2n"><span class="af-pm" data-cid="${b.id}">${bOpen ? "\u2212" : "+"}</span>${b.name}</td>
                        <td class="${cls(bSum)}">${fmtSigned(bSum)}</td>
                        <td class="${cls(bSum)}">${pct(bSum, d.dR).toFixed(1)}%</td>
                    </tr>`;
                    if(!bOpen) return;
                }

                b.activities.forEach(a => {
                    const aSum  = aChecked(a);
                    const aOpen = !this._collapsed[a.id];
                    const aAllCh = a.groups.every(g => this._checked[g.id]);
                    const aIds   = a.groups.map(g => g.id);

                    html += `<tr class="af-l3">
                        <td>${this._chkHtml(aIds, aAllCh)}</td>
                        <td class="af-l3n"><span class="af-pm" data-cid="${a.id}">${aOpen ? "\u2212" : "+"}</span>${a.name}</td>
                        <td class="${cls(aSum)}">${fmtSigned(aSum)}</td>
                        <td class="${cls(aSum)}">${pct(aSum, d.dR).toFixed(1)}%</td>
                    </tr>`;

                    if(!aOpen) return;

                    let groups = [...a.groups];
                    if(this._sortDir ===  1) groups.sort((x,y) => x.value - y.value);
                    if(this._sortDir === -1) groups.sort((x,y) => y.value - x.value);

                    groups.forEach(g => {
                        html += `<tr class="af-l4 ${this._checked[g.id] ? "" : "af-dim"}">
                            <td>${this._chkHtml([g.id], this._checked[g.id])}</td>
                            <td class="af-l4n">${g.name}</td>
                            <td class="${cls(g.value)}">${fmtSigned(g.value)}</td>
                            <td class="${cls(g.value)}">${pct(g.value, d.dR).toFixed(1)}%</td>
                        </tr>`;
                    });
                });
            });
        });

        html += `</tbody>
        <tfoot><tr class="af-foot">
            <td></td>
            <td>${t("total")} (${t("selected") || "selected"})</td>
            <td class="${cls(grandChecked)}">${fmtSigned(grandChecked)}</td>
            <td class="${cls(grandChecked)}">${pct(grandChecked, d.dR).toFixed(1)}%</td>
        </tr></tfoot>
        </table>`;

        el.innerHTML = html;
        this._bind(el, tree, bList);
    },

    _chkHtml(ids, checked){
        const idsStr = ids.join(",");
        return `<label class="af-chk"><input type="checkbox" data-ids="${idsStr}" ${checked ? "checked" : ""}><span class="af-chkmark"></span></label>`;
    },

    _bind(el, tree, bList){
        el.querySelector("#afsortbtn").addEventListener("click", () => {
            this._sortDir = this._sortDir === 0 ? 1 : this._sortDir === 1 ? -1 : 0;
            this.render();
        });

        el.querySelectorAll(".af-lvl-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const lvl = +btn.dataset.level;
                this._collapsed = {};
                tree.forEach(f => {
                    if(lvl < 2) this._collapsed[f.id] = true;
                    f.branches.forEach(b => {
                        if(lvl < 3) this._collapsed[b.id] = true;
                        b.activities.forEach(a => {
                            if(lvl < 4) this._collapsed[a.id] = true;
                        });
                    });
                });
                this.render();
            });
        });

        el.querySelectorAll("[data-cid]").forEach(pm => {
            pm.addEventListener("click", e => {
                e.stopPropagation();
                const id = pm.dataset.cid;
                this._collapsed[id] = !this._collapsed[id];
                this.render();
            });
        });

        el.querySelectorAll("input[data-ids]").forEach(cb => {
            cb.addEventListener("change", () => {
                cb.dataset.ids.split(",").forEach(id => { this._checked[id] = cb.checked; });
                this.render();
            });
        });
    }
};
