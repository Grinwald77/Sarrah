import { Store }       from ‘../store.js’;
import { FactorModel } from ‘../models/factor.js’;
import { t }           from ‘../i18n.js’;

function fmt(v){
return v.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
}
function fmtSigned(v){
const s = Math.abs(v).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
return (v >= 0 ? “+” : “−”) + s;
}
function cls(v){ return v < 0 ? “red” : v > 0 ? “green” : “”; }
function pct(part, total){ return total ? (part / Math.abs(total) * 100) : 0; }

export const AnalysisBlock = {
_checked:   {},   // leafId → bool
_collapsed: {},   // nodeId → bool
_sortDir:   0,    // 0 none  1 asc  -1 desc

```
init(){
    Store.subscribe(()         => this.render());
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

    // ── Build 4-level tree:  factor → branch → activity → group ──
    const EFFECTS = [
        { key:"q", label: t("factorQty")     },
        { key:"p", label: t("factorPrice")    },
        { key:"d", label: t("factorDiscount") },
        { key:"s", label: t("factorSingle")   },
    ];

    // tree: [{ id, label, branches: [{ id, name, activities: [{ id, name, groups: [{ id, name, value }] }] }] }]
    const tree = [];
    EFFECTS.forEach(e => {
        const fid = `f_${e.key}`;
        const fNode = { id: fid, label: e.label, branches: [] };

        d.branches.forEach((br, bi) => {
            const bid = `${fid}_b${bi}`;
            const bName = br.name || `${t("branch")} ${bi+1}`;
            const bNode = { id: bid, name: bName, activities: [] };

            br.activities.forEach((act, ai) => {
                if(e.key === "s" && !act.singleFactor) return;
                if(e.key !== "s" && act.singleFactor)  return;

                const aid = `${bid}_a${ai}`;
                const groups = [];
                act.groups.forEach((g, gi) => {
                    const val = e.key === "s" ? (g.s||0) : (g[e.key]||0);
                    if(val !== 0){
                        groups.push({ id:`${aid}_g${gi}`, name: g.name||`${t("group")} ${gi+1}`, value:val });
                    }
                });
                if(groups.length) bNode.activities.push({ id:aid, name: act.name, groups });
            });

            if(bNode.activities.length) fNode.branches.push(bNode);
        });

        if(fNode.branches.length) tree.push(fNode);
    });

    // Init checkboxes (leaf groups default true)
    tree.forEach(f => f.branches.forEach(b => b.activities.forEach(a =>
        a.groups.forEach(g => { if(this._checked[g.id]===undefined) this._checked[g.id]=true; })
    )));

    // Helpers — sums considering only checked leaves
    const leafSum = (groups) => groups.reduce((s,g) => s + (this._checked[g.id] ? g.value : 0), 0);
    const fullSum = (groups) => groups.reduce((s,g) => s + g.value, 0);
    const actCheckedSum = (act) => leafSum(act.groups);
    const actFullSum    = (act) => fullSum(act.groups);
    const brCheckedSum  = (br)  => br.activities.reduce((s,a) => s + actCheckedSum(a), 0);
    const brFullSum     = (br)  => br.activities.reduce((s,a) => s + actFullSum(a), 0);
    const fCheckedSum   = (f)   => f.branches.reduce((s,b) => s + brCheckedSum(b), 0);
    const fFullSum      = (f)   => f.branches.reduce((s,b) => s + brFullSum(b), 0);

    const grandChecked = tree.reduce((s,f) => s + fCheckedSum(f), 0);

    // Sort icon — bigger
    const si = this._sortDir === 0
        ? `<span class="afs-none">↕</span>`
        : this._sortDir === 1
        ? `<span class="afs-asc">▲</span>`
        : `<span class="afs-desc">▼</span>`;

    // ── Render ──
    let html = `
    <b>${t("analysis")}</b>
    <div class="af-summary">
        <div class="af-sr"><span>${t("revenue")} 0</span><span class="af-sv">${fmt(d.R0)}</span></div>
        <div class="af-sr"><span>${t("revenue")} 1</span><span class="af-sv">${fmt(d.R1)}</span></div>
        <div class="af-sr af-sr-dr"><span>${t("change")}</span><span class="af-sv ${cls(d.dR)}">${fmtSigned(d.dR)}</span></div>
    </div>

    <div class="af-level-controls">
        <button class="af-lvl-btn" data-level="1">${t("level")||"Level"} 1</button>
        <button class="af-lvl-btn" data-level="2">${t("level")||"Level"} 2</button>
        <button class="af-lvl-btn" data-level="3">${t("level")||"Level"} 3</button>
    </div>

    <table class="af-table">
    <thead><tr>
        <th class="af-tc"></th>
        <th class="af-tn">${t("analysis")}</th>
        <th class="af-tv">${t("change")}</th>
        <th class="af-tp" id="afsortbtn">% ${si}</th>
    </tr></thead>
    <tbody>`;

    const renderLeaf = (g) => {
        const checked = this._checked[g.id];
        return `<tr class="af-l4 ${checked?'':'af-dim'}">
            <td>${this._chk(g.id, true)}</td>
            <td class="af-l4n">${g.name}</td>
            <td class="${cls(g.value)}">${fmtSigned(g.value)}</td>
            <td class="${cls(g.value)}">${pct(g.value,d.dR).toFixed(1)}%</td>
        </tr>`;
    };

    tree.forEach(f => {
        const fSum = fCheckedSum(f);
        const fOpen = !this._collapsed[f.id];
        const fChecked = f.branches.every(b =>
            b.activities.every(a => a.groups.every(g => this._checked[g.id])));

        // Level 1 — factor
        html += `<tr class="af-l1">
            <td>${this._chkGroup(f.id, this._collectIds(f), fChecked)}</td>
            <td class="af-l1n">
                <span class="af-pm" data-cid="${f.id}">${fOpen?"−":"+"}</span>
                ${f.label}
            </td>
            <td class="${cls(fSum)}">${fmtSigned(fSum)}</td>
            <td class="${cls(fSum)}">${pct(fSum,d.dR).toFixed(1)}%</td>
        </tr>`;

        if(!fOpen) return;

        f.branches.forEach(b => {
            const bSum = brCheckedSum(b);
            const bOpen = !this._collapsed[b.id];
            const bChecked = b.activities.every(a => a.groups.every(g => this._checked[g.id]));

            if(multiB){
                // Level 2 — branch
                html += `<tr class="af-l2">
                    <td>${this._chkGroup(b.id, this._collectIdsBranch(b), bChecked)}</td>
                    <td class="af-l2n">
                        <span class="af-pm" data-cid="${b.id}">${bOpen?"−":"+"}</span>
                        ${b.name}
                    </td>
                    <td class="${cls(bSum)}">${fmtSigned(bSum)}</td>
                    <td class="${cls(bSum)}">${pct(bSum,d.dR).toFixed(1)}%</td>
                </tr>`;
                if(!bOpen) return;
            }

            b.activities.forEach(a => {
                const aSum = actCheckedSum(a);
                const aOpen = !this._collapsed[a.id];
                const aChecked = a.groups.every(g => this._checked[g.id]);

                // Level 3 — activity
                html += `<tr class="af-l3">
                    <td>${this._chkGroup(a.id, a.groups.map(g=>g.id), aChecked)}</td>
                    <td class="af-l3n">
                        <span class="af-pm" data-cid="${a.id}">${aOpen?"−":"+"}</span>
                        ${a.name}
                    </td>
                    <td class="${cls(aSum)}">${fmtSigned(aSum)}</td>
                    <td class="${cls(aSum)}">${pct(aSum,d.dR).toFixed(1)}%</td>
                </tr>`;

                if(!aOpen) return;

                // Level 4 — groups (sortable)
                let groups = [...a.groups];
                if(this._sortDir ===  1) groups.sort((x,y) => x.value - y.value);
                if(this._sortDir === -1) groups.sort((x,y) => y.value - x.value);

                groups.forEach(g => { html += renderLeaf(g); });
            });
        });
    });

    html += `</tbody>
    <tfoot><tr class="af-foot">
        <td></td>
        <td>${t("total")} (${t("selected")||"selected"})</td>
        <td class="${cls(grandChecked)}">${fmtSigned(grandChecked)}</td>
        <td class="${cls(grandChecked)}">${pct(grandChecked,d.dR).toFixed(1)}%</td>
    </tr></tfoot>
    </table>`;

    el.innerHTML = html;
    this._bind(el);
},

_chk(id, isLeaf){
    const checked = this._checked[id];
    return `<label class="af-chk"><input type="checkbox" data-lid="${id}" ${checked?'checked':''}><span class="af-chkmark"></span></label>`;
},

_chkGroup(gid, ids, checked){
    return `<label class="af-chk"><input type="checkbox" data-gids="${ids.join(',')}" ${checked?'checked':''}><span class="af-chkmark"></span></label>`;
},

_collectIds(f){
    const ids = [];
    f.branches.forEach(b => b.activities.forEach(a =>
        a.groups.forEach(g => ids.push(g.id))));
    return ids;
},

_collectIdsBranch(b){
    const ids = [];
    b.activities.forEach(a => a.groups.forEach(g => ids.push(g.id)));
    return ids;
},

_bind(el){
    // Sort
    el.querySelector("#afsortbtn").addEventListener("click", () => {
        this._sortDir = this._sortDir === 0 ? 1 : this._sortDir === 1 ? -1 : 0;
        this.render();
    });

    // Level buttons — collapse/expand to depth
    el.querySelectorAll(".af-lvl-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const lvl = +btn.dataset.level;
            this._setLevel(lvl);
            this.render();
        });
    });

    // Collapse/expand individual nodes
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
        cb.addEventListener("change", () => {
            this._checked[cb.dataset.lid] = cb.checked;
            this.render();
        });
    });

    // Group checkboxes
    el.querySelectorAll("input[data-gids]").forEach(cb => {
        cb.addEventListener("change", () => {
            cb.dataset.gids.split(",").forEach(id => {
                this._checked[id] = cb.checked;
            });
            this.render();
        });
    });
},

// Set collapse state by depth: 1 = only level 1 visible, etc.
_setLevel(lvl){
    // We need to know all node IDs. Simpler: rebuild collapsed map after render.
    // Quick approach: mark all nodes by their prefix
    // f_X     = level 1
    // f_X_bN  = level 2
    // f_X_bN_aN = level 3
    // (groups are level 4 — leaves, no collapse)
    const all = Object.keys(this._collapsed);
    // Also collect from current state — but we don't have it here.
    // Trick: just clear collapsed for everything, then mark deeper levels collapsed.
    // To do this properly we need tree. Rebuild on next render — for now reset.
    const branches = Store.get("branches") || [];
    const ab = Store.get("activeBranch");
    const isSummary = (Store.get("branchCount")||1) > 1 && ab === -1;
    const bList = isSummary ? branches : (branches[ab] ? [branches[ab]] : []);
    const d = FactorModel.calcDetailed(bList);

    const EFFECTS = ["q","p","d","s"];
    this._collapsed = {};
    EFFECTS.forEach(k => {
        const fid = `f_${k}`;
        // Level >= 2 means factor open; level == 1 means factor collapsed
        if(lvl < 2) this._collapsed[fid] = true;
        d.branches.forEach((br, bi) => {
            const bid = `${fid}_b${bi}`;
            if(lvl < 3) this._collapsed[bid] = true;
            br.activities.forEach((act, ai) => {
                const aid = `${bid}_a${ai}`;
                if(lvl < 4) this._collapsed[aid] = true;
            });
        });
    });
}
```

};
