// ─────────────────────────────────────────────
//  TableSingle — Type 3
//  All single-factor activities from all branches
//  Hierarchy: Total → Branch → Activity/Group
// ─────────────────────────────────────────────
import { t } from '../i18n.js';
import { fmt, periodLabel, groupRevs } from './table-helpers.js';

// branchData: [{ branchName, activities: [singleFactor acts] }]
export function renderTableSingle(branchData, uid){
    const col0 = periodLabel("type0","period0","year0");
    const col1 = periodLabel("type1","period1","year1");

    // Grand total
    let totalR0=0, totalR1=0;
    branchData.forEach(({ activities }) => {
        activities.forEach(act => {
            (act.groups||[]).forEach(g => {
                totalR0 += +g.revenue0||0;
                totalR1 += +g.revenue1||0;
            });
        });
    });
    const totalDR    = totalR1 - totalR0;
    const totalDRpct = totalR0 ? totalDR/totalR0*100 : 0;

    // All activities flat for factor analysis
    const allActivities = branchData.flatMap(b => b.activities);

    let html = `<div class="activity-block activity-block-single" data-uid="${uid}">`;

    html += `
    <div class="activity-header">
        <div class="activity-title-row">
            <div class="activity-title-text">${t("factorSingle")}</div>
        </div>
        <div class="activity-controls">
            <button class="collapse-btn collapse-all-levels" data-uid="${uid}">
                <span class="collapse-bracket collapse-bracket-top"></span>
                <span class="collapse-icon-box">−</span>
                <span class="collapse-bracket collapse-bracket-bot"></span>
            </button>
        </div>
    </div>`;

    html += `<div class="table-body-wrap" data-body="${uid}">`;
    html += `<table>
        <thead>
            <tr>
                <th rowspan="2" class="col-name">${t("group")}</th>
                <th colspan="4">${t("revenue")}</th>
                <th colspan="3">${t("share")}</th>
            </tr>
            <tr>
                <th>${col0}</th><th>${col1}</th>
                <th>${t("change")}</th><th>${t("changePct")}</th>
                <th>${col0}</th><th>${col1}</th><th>${t("deltaShare")}</th>
            </tr>
        </thead>
        <tbody>`;

    // Grand total row
    html += `
        <tr class="row-total">
            <td><strong>${t("total")}</strong></td>
            <td>${fmt(totalR0)}</td><td>${fmt(totalR1)}</td>
            <td class="${totalDR>=0?"green":"red"}">${fmt(totalDR)}</td>
            <td>${totalDRpct.toFixed(1)}%</td>
            <td>100%</td><td>100%</td><td>—</td>
        </tr>`;

    // Branch rows
    branchData.forEach(({ branchName, activities }, bi) => {
        let bR0=0, bR1=0;
        activities.forEach(act => {
            (act.groups||[]).forEach(g => {
                bR0 += +g.revenue0||0;
                bR1 += +g.revenue1||0;
            });
        });
        const bDR    = bR1 - bR0;
        const bDRpct = bR0 ? bDR/bR0*100 : 0;
        const bS0    = totalR0 ? bR0/totalR0*100 : 0;
        const bS1    = totalR1 ? bR1/totalR1*100 : 0;
        const bDS    = bS1 - bS0;

        html += `
        <tr class="row-branch" data-branch-row="${uid}-${bi}">
            <td>
                <button class="collapse-branch-btn" data-uid="${uid}" data-bi="${bi}">
                    <span class="collapse-icon-sm">−</span>
                </button>
                <strong>${branchName}</strong>
            </td>
            <td>${fmt(bR0)}</td><td>${fmt(bR1)}</td>
            <td class="${bDR>=0?"green":"red"}">${fmt(bDR)}</td>
            <td>${bDRpct.toFixed(1)}%</td>
            <td>${bS0.toFixed(1)}%</td><td>${bS1.toFixed(1)}%</td>
            <td class="${bDS>=0?"green":"red"}">${bDS.toFixed(1)}</td>
        </tr>`;

        // Activity/group rows for this branch
        activities.forEach(act => {
            (act.groups||[]).forEach((g, gi) => {
                const r0 = +g.revenue0||0;
                const r1 = +g.revenue1||0;
                const dr    = r1 - r0;
                const drpct = r0 ? dr/r0*100 : 0;
                const s0    = totalR0 ? r0/totalR0*100 : 0;
                const s1    = totalR1 ? r1/totalR1*100 : 0;
                const ds    = s1 - s0;
                const label = [act.name, g.name].filter(Boolean).join(" / ") || `${t("group")} ${gi+1}`;
                html += `
                <tr class="row-group" data-group-row="${uid}-${bi}">
                    <td class="indent">${label}</td>
                    <td>${fmt(r0)}</td><td>${fmt(r1)}</td>
                    <td class="${dr>=0?"green":"red"}">${fmt(dr)}</td>
                    <td>${drpct.toFixed(1)}%</td>
                    <td>${s0.toFixed(1)}%</td><td>${s1.toFixed(1)}%</td>
                    <td class="${ds>=0?"green":"red"}">${ds.toFixed(1)}</td>
                </tr>`;
            });
        });
    });

    html += `</tbody></table>`;
    html += `</div></div>`;
    return html;
}

export function bindTableSingle(container){
    container.querySelectorAll(".collapse-all-levels").forEach(btn => {
        btn.addEventListener("click", () => {
            const uid  = btn.dataset.uid;
            const body = container.querySelector(`[data-body="${uid}"]`);
            const icon = btn.querySelector(".collapse-icon-box");
            const isCollapsed = body.style.display === "none";
            body.style.display = isCollapsed ? "" : "none";
            icon.textContent   = isCollapsed ? "−" : "+";
        });
    });
    container.querySelectorAll(".collapse-branch-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const uid  = btn.dataset.uid;
            const bi   = btn.dataset.bi;
            const icon = btn.querySelector(".collapse-icon-sm");
            const rows = container.querySelectorAll(`[data-group-row="${uid}-${bi}"]`);
            const isCollapsed = rows.length && rows[0].style.display === "none";
            rows.forEach(r => r.style.display = isCollapsed ? "" : "none");
            icon.textContent = isCollapsed ? "−" : "+";
        });
    });
}
