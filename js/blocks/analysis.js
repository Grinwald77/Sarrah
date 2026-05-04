import { Store }       from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t }           from '../i18n.js';

function fmt(v){
    return v.toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
}
function fmtSigned(v){
    const str = Math.abs(v).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:2 });
    return (v >= 0 ? "+" : "−") + str;
}
function colorCls(v){ return v < 0 ? "red" : v > 0 ? "green" : ""; }
function pct(part, total){ return total ? (part / Math.abs(total) * 100) : 0; }

// Build flat list of factor rows from detailed data
function buildFactorRows(d, multipleB){
    const rows = [];

    d.branches.forEach(br => {
        const brPrefix = multipleB ? `${br.name} / ` : "";

        br.activities.forEach(act => {
            if(!act.singleFactor){
                act.groups.forEach(g => {
                    const label = `${brPrefix}${act.name} / ${g.name || t("group")}`;
                    if(g.q !== 0) rows.push({ key:"q", label, value: g.q, effect: t("factorQty") });
                    if(g.p !== 0) rows.push({ key:"p", label, value: g.p, effect: t("factorPrice") });
                    if(g.d)       rows.push({ key:"d", label, value: g.d, effect: t("factorDiscount") });
                });
            } else {
                act.groups.forEach(g => {
                    const label = `${brPrefix}${act.name} / ${g.name || t("group")}`;
                    if(g.s !== 0) rows.push({ key:"s", label, value: g.s, effect: t("factorSingle") });
                });
            }
        });
    });

    return rows;
}

export const AnalysisBlock = {
    _checked: {},   // uid → bool
    _sortDir: 0,    // 0=none, 1=asc, -1=desc
    _rows: [],

    init(){
        Store.subscribe(()      => this.render());
        Store.subscribeAnalysis(() => this.render());
    },

    render(){
        const el = document.getElementById("analysisBlock");
        if(!el) return;
        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branches     = Store.get("branches") || [];
        const branchCount  = Store.get("branchCount") || 1;
        const activeBranch = Store.get("activeBranch");
        const isSummary    = branchCount > 1 && activeBranch === -1;
        const multipleB    = branchCount > 1;

        let branchesForAnalysis = [];
        if(isSummary){ branchesForAnalysis = branches; }
        else { const b = branches[activeBranch]; if(b) branchesForAnalysis = [b]; }

        if(!branchesForAnalysis.length){ el.innerHTML = ""; return; }

        const d = FactorModel.calcDetailed(branchesForAnalysis);
        if(d.R0 === 0 && d.R1 === 0){ el.innerHTML = ""; return; }

        // Build rows
        const rows = buildFactorRows(d, multipleB);
        this._rows = rows;

        // Init checkboxes — default all checked
        rows.forEach((r, i) => {
            const uid = `f${i}`;
            if(this._checked[uid] === undefined) this._checked[uid] = true;
        });

        // Sort
        let displayRows = [...rows.map((r,i) => ({...r, uid:`f${i}`}))];
        if(this._sortDir === 1)  displayRows.sort((a,b) => a.value - b.value);
        if(this._sortDir === -1) displayRows.sort((a,b) => b.value - a.value);

        // Checked total
        const checkedTotal = displayRows
            .filter(r => this._checked[r.uid])
            .reduce((s,r) => s + r.value, 0);

        const sortIcon = ['↕','↑','↓'][this._sortDir === 0 ? 0 : this._sortDir === 1 ? 1 : 2];

        let html = `
        <b>${t("analysis")}</b>
        <div class="af-summary">
            <div class="af-sum-row"><span>${t("revenue")} ${t("initial")}</span><span>${fmt(d.R0)}</span></div>
            <div class="af-sum-row"><span>${t("revenue")} ${t("current")}</span><span>${fmt(d.R1)}</span></div>
            <div class="af-sum-row af-sum-dr"><span>${t("change")}</span><span class="${colorCls(d.dR)}">${fmtSigned(d.dR)}</span></div>
        </div>

        <table class="af-table">
            <thead>
                <tr>
                    <th class="af-th-check"></th>
                    <th class="af-th-name">${t("factorQty").replace(" effect","")}</th>
                    <th class="af-th-val">${t("change")}</th>
                    <th class="af-th-pct af-sortable" onclick="window._afSort()">
                        % ${sortIcon}
                    </th>
                </tr>
            </thead>
            <tbody>`;

        // Group by effect type — collapsible
        const groups = {};
        displayRows.forEach(r => {
            if(!groups[r.effect]) groups[r.effect] = [];
            groups[r.effect].push(r);
        });

        Object.entries(groups).forEach(([effect, items]) => {
            const effectTotal = items.reduce((s,r) => s + r.value, 0);
            const effectPct   = pct(effectTotal, d.dR);
            const gid = `g_${effect.replace(/\s/g,'_')}`;
            const allChecked  = items.every(r => this._checked[r.uid]);

            html += `
            <tr class="af-group-header" onclick="window._afToggleGroup('${gid}')">
                <td><input type="checkbox" class="af-check-group" data-gid="${gid}"
                    ${allChecked ? "checked" : ""}
                    onclick="event.stopPropagation();window._afCheckGroup('${gid}',this.checked)"
                ></td>
                <td class="af-group-name">
                    <span class="af-arrow" id="arr_${gid}">▶</span>
                    ${effect}
                </td>
                <td class="${colorCls(effectTotal)}">${fmtSigned(effectTotal)}</td>
                <td class="${colorCls(effectTotal)}">${effectPct.toFixed(1)}%</td>
            </tr>`;

            items.forEach(r => {
                const rowPct = pct(r.value, d.dR);
                html += `
            <tr class="af-detail-row" data-gid="${gid}" style="display:none">
                <td><input type="checkbox" class="af-check" data-uid="${r.uid}"
                    ${this._checked[r.uid] ? "checked" : ""}
                    onclick="window._afCheck('${r.uid}',this.checked)"
                ></td>
                <td class="af-detail-name">${r.label}</td>
                <td class="${colorCls(r.value)}">${fmtSigned(r.value)}</td>
                <td class="${colorCls(r.value)}">${rowPct.toFixed(1)}%</td>
            </tr>`;
            });
        });

        const checkedPct = pct(checkedTotal, d.dR);
        html += `
            </tbody>
            <tfoot>
                <tr class="af-total-row">
                    <td></td>
                    <td>${t("total")} (${t("selected")||"selected"})</td>
                    <td class="${colorCls(checkedTotal)}">${fmtSigned(checkedTotal)}</td>
                    <td class="${colorCls(checkedTotal)}">${checkedPct.toFixed(1)}%</td>
                </tr>
            </tfoot>
        </table>`;

        el.innerHTML = html;

        // Global handlers
        window._afSort = () => {
            this._sortDir = this._sortDir === 0 ? 1 : this._sortDir === 1 ? -1 : 0;
            this.render();
        };
        window._afCheck = (uid, checked) => {
            this._checked[uid] = checked;
            this.render();
        };
        window._afCheckGroup = (gid, checked) => {
            document.querySelectorAll(`[data-gid="${gid}"][data-uid]`).forEach(el => {
                this._checked[el.dataset.uid] = checked;
            });
            this.render();
        };
        window._afToggleGroup = (gid) => {
            const rows = document.querySelectorAll(`tr[data-gid="${gid}"]`);
            const arr  = document.getElementById(`arr_${gid}`);
            const open = rows[0]?.style.display !== "none";
            rows.forEach(r => r.style.display = open ? "none" : "");
            if(arr) arr.textContent = open ? "▶" : "▼";
        };
    }
};
