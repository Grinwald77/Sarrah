import { Store }       from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t }           from '../i18n.js';

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
function colorCls(v){ return v < 0 ? "red" : v > 0 ? "green" : ""; }

function sumRow(label, value, colored = false){
    const cls = colored ? colorCls(value) : "";
    const val = colored ? fmtSigned(value) : fmt(value);
    return `<div class="analysis-row">
        <span class="analysis-label">${label}</span>
        <span class="analysis-val ${cls}">${val}</span>
    </div>`;
}

// Build collapsible tree for one effect type
// effectKey: 'q' | 'p' | 's'
// branches: detailed branch data from calcDetailed
function effectTree(title, effectKey, branches, multipleB, uid){
    // Collect total for this effect across all branches
    let total = 0;
    branches.forEach(br => {
        br.activities.forEach(act => {
            if(effectKey === 's' && act.singleFactor){
                act.groups.forEach(g => { total += g.s || 0; });
            } else if(effectKey !== 's' && !act.singleFactor){
                act.groups.forEach(g => { total += g[effectKey] || 0; });
            }
        });
    });

    if(total === 0) return "";

    let html = `
    <div class="af-effect" data-uid="${uid}">
        <div class="af-effect-header" onclick="this.parentNode.classList.toggle('af-open')">
            <span class="af-toggle">▶</span>
            <span class="af-effect-title">${title}</span>
            <span class="af-effect-total ${colorCls(total)}">${fmtSigned(total)}</span>
        </div>
        <div class="af-effect-body">`;

    branches.forEach((br, bi) => {
        let brTotal = 0;
        const brActivities = [];

        br.activities.forEach(act => {
            let actTotal = 0;
            const actGroups = [];

            if(effectKey === 's' && act.singleFactor){
                act.groups.forEach(g => {
                    const v = g.s || 0;
                    if(v !== 0){ actTotal += v; actGroups.push({ name: g.name, value: v }); }
                });
            } else if(effectKey !== 's' && !act.singleFactor){
                act.groups.forEach(g => {
                    const v = g[effectKey] || 0;
                    if(v !== 0){ actTotal += v; actGroups.push({ name: g.name, value: v }); }
                });
            }

            if(actTotal !== 0){
                brTotal += actTotal;
                brActivities.push({ name: act.name, total: actTotal, groups: actGroups });
            }
        });

        if(brTotal === 0) return;

        const brId = `${uid}-b${bi}`;
        if(multipleB){
            html += `
            <div class="af-branch" data-uid="${brId}">
                <div class="af-branch-header" onclick="this.parentNode.classList.toggle('af-open')">
                    <span class="af-toggle">▶</span>
                    <span class="af-branch-name">${br.name || t("branch") + " " + (bi+1)}</span>
                    <span class="af-branch-total ${colorCls(brTotal)}">${fmtSigned(brTotal)}</span>
                </div>
                <div class="af-branch-body">`;
        }

        brActivities.forEach((act, ai) => {
            const actId = `${brId}-a${ai}`;
            html += `
            <div class="af-activity" data-uid="${actId}">
                <div class="af-activity-header" onclick="this.parentNode.classList.toggle('af-open')">
                    <span class="af-toggle">▶</span>
                    <span class="af-activity-name">${act.name}</span>
                    <span class="af-activity-total ${colorCls(act.total)}">${fmtSigned(act.total)}</span>
                </div>
                <div class="af-activity-body">`;

            act.groups.forEach(g => {
                html += `
                <div class="af-group-row">
                    <span class="af-group-name">${g.name || t("group")}</span>
                    <span class="af-group-val ${colorCls(g.value)}">${fmtSigned(g.value)}</span>
                </div>`;
            });

            html += `</div></div>`;
        });

        if(multipleB){
            html += `</div></div>`;
        }
    });

    html += `</div></div>`;
    return html;
}

export const AnalysisBlock = {

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
        if(isSummary){
            branchesForAnalysis = branches;
        } else {
            const b = branches[activeBranch];
            if(b) branchesForAnalysis = [b];
        }

        if(!branchesForAnalysis.length){ el.innerHTML = ""; return; }

        const d = FactorModel.calcDetailed(branchesForAnalysis);
        if(d.R0 === 0 && d.R1 === 0){ el.innerHTML = ""; return; }

        // Summary — no duplicate effect rows, trees go right after dR
        let trees = "";
        const totalGroups = branchesForAnalysis.reduce((n, br) =>
            n + (br.activities||[]).reduce((m, act) => m + (act.groups||[]).length, 0), 0);

        if(totalGroups >= 1){
            trees += `<div class="af-trees">`;
            if(d.hasMulti){
                trees += effectTree(t("factorQty"),   "q", d.branches, multipleB, "q");
                trees += effectTree(t("factorPrice"),  "p", d.branches, multipleB, "p");
            }
            if(d.hasSingle){
                trees += effectTree(t("factorSingle"), "s", d.branches, multipleB, "s");
            }
            trees += `</div>`;
        }

        let html = `
        <div class="analysis-grid">
            ${sumRow(t("revenue") + " " + t("initial"), d.R0)}
            ${sumRow(t("revenue") + " " + t("current"), d.R1)}
            ${sumRow(t("change"), d.dR, true)}
        </div>
        ${trees}`;

        el.innerHTML = `<b>${t("analysis")}</b>${html}`;
    }
};
