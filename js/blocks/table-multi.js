// ─────────────────────────────────────────────
//  TableMulti — Type 1
//  Multi-factor activity present in >1 branches
//  Hierarchy: Total row → Branch rows → Group rows
//  Each level collapsible independently
// ─────────────────────────────────────────────
import { t } from '../i18n.js';
import { fmt, periodLabel, groupRevs, renderFactors } from './table-helpers.js';

// activityName: string
// branchData: [{ branchName, activities: [act] }]
//   (activities is array of 1 — the matching activity from that branch)
// Returns HTML string
export function renderTableMulti(activityName, branchData, uid){
    const col0 = periodLabel("type0","period0","year0");
    const col1 = periodLabel("type1","period1","year1");

    // Compute totals across all branches
    let totalR0=0, totalR1=0, totalQ0=0, totalQ1=0;
    branchData.forEach(({ activities }) => {
        activities.forEach(act => {
            (act.groups||[]).forEach(g => {
                const { r0, r1 } = groupRevs(g, false);
                totalR0 += r0; totalR1 += r1;
                totalQ0 += +g.quantity0||0;
                totalQ1 += +g.quantity1||0;
            });
        });
    });
    const totalDR    = totalR1 - totalR0;
    const totalDRpct = totalR0 ? totalDR/totalR0*100 : 0;
    const grandShare0 = 100, grandShare1 = 100; // total is 100% of itself

    // All activities flat for factor analysis
    const allActivities = branchData.flatMap(b => b.activities);

    let html = `<div class="activity-block activity-block-multi" data-uid="${uid}">`;

    // Section header
    html += `
    <div class="activity-header">
        <div class="activity-title-row">
            <div class="activity-title-text">${activityName}</div>
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
                <th colspan="2">${t("quantity")}</th>
                <th colspan="2">${t("price")}</th>
                <th colspan="4">${t("revenue")}</th>
                <th colspan="3">${t("share")}</th>
            </tr>
            <tr>
                <th>${col0}</th><th>${col1}</th>
                <th>${col0}</th><th>${col1}</th>
                <th>${col0}</th><th>${col1}</th>
                <th>${t("change")}</th><th>${t("changePct")}</th>
                <th>${col0}</th><th>${col1}</th><th>${t("deltaShare")}</th>
            </tr>
        </thead>
        <tbody>`;

    // Total row
    const avgP0 = totalQ0 ? totalR0/totalQ0 : 0;
    const avgP1 = totalQ1 ? totalR1/totalQ1 : 0;
    html += `
        <tr class="row-total">
            <td><strong>${t("total")}</strong></td>
            <td>${fmt(totalQ0)}</td><td>${fmt(totalQ1)}</td>
            <td>${fmt(avgP0)}</td><td>${fmt(avgP1)}</td>
            <td>${fmt(totalR0)}</td><td>${fmt(totalR1)}</td>
            <td class="${totalDR>=0?"green":"red"}">${fmt(totalDR)}</td>
            <td>${totalDRpct.toFixed(1)}%</td>
            <td>100%</td><td>100%</td><td>—</td>
        </tr>`;

    // Branch rows
    branchData.forEach(({ branchName, activities }, bi) => {
        let bR0=0, bR1=0, bQ0=0, bQ1=0;
        activities.forEach(act => {
            (act.groups||[]).forEach(g => {
                const { r0, r1 } = groupRevs(g, false);
                bR0 += r0; bR1 += r1;
                bQ0 += +g.quantity0||0; bQ1 += +g.quantity1||0;
            });
        });
        const bDR    = bR1 - bR0;
        const bDRpct = bR0 ? bDR/bR0*100 : 0;
        const bS0    = totalR0 ? bR0/totalR0*100 : 0;
        const bS1    = totalR1 ? bR1/totalR1*100 : 0;
        const bDS    = bS1 - bS0;
        const bAvgP0 = bQ0 ? bR0/bQ0 : 0;
        const bAvgP1 = bQ1 ? bR1/bQ1 : 0;

        html += `
        <tr class="row-branch" data-branch-row="${uid}-${bi}">
            <td>
                <button class="collapse-branch-btn" data-uid="${uid}" data-bi="${bi}">
                    <span class="collapse-icon-sm">−</span>
                </button>
                <strong>${branchName}</strong>
            </td>
            <td>${fmt(bQ0)}</td><td>${fmt(bQ1)}</td>
            <td>${fmt(bAvgP0)}</td><td>${fmt(bAvgP1)}</td>
            <td>${fmt(bR0)}</td><td>${fmt(bR1)}</td>
            <td class="${bDR>=0?"green":"red"}">${fmt(bDR)}</td>
            <td>${bDRpct.toFixed(1)}%</td>
            <td>${bS0.toFixed(1)}%</td><td>${bS1.toFixed(1)}%</td>
            <td class="${bDS>=0?"green":"red"}">${bDS.toFixed(1)}</td>
        </tr>`;

        // Group rows for this branch
        activities.forEach(act => {
            (act.groups||[]).forEach((g, gi) => {
                const { r0, r1 } = groupRevs(g, false);
                const dr    = r1 - r0;
                const drpct = r0 ? dr/r0*100 : 0;
                const s0    = totalR0 ? r0/totalR0*100 : 0;
                const s1    = totalR1 ? r1/totalR1*100 : 0;
                const ds    = s1 - s0;
                html += `
                <tr class="row-group" data-group-row="${uid}-${bi}">
                    <td class="indent">${g.name||`${t("group")} ${gi+1}`}</td>
                    <td>${fmt(+g.quantity0||0)}</td><td>${fmt(+g.quantity1||0)}</td>
                    <td>${fmt(+g.price0||0)}</td><td>${fmt(+g.price1||0)}</td>
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
    html += renderFactors(allActivities, t);
    html += `</div></div>`;
    return html;
}

// Bind collapse buttons for multi tables
export function bindTableMulti(container){
    // Collapse all levels button
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

    // Collapse branch rows
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
