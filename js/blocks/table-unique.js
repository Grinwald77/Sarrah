// ─────────────────────────────────────────────
//  TableUnique — Type 2
//  Multi-factor activity present in only 1 branch
//  Same structure as Multi but single branch
//  Hierarchy: Total → Branch label → Groups
// ─────────────────────────────────────────────
import { t } from '../i18n.js';
import { fmt, periodLabel, groupRevs } from './table-helpers.js';

export function renderTableUnique(activityName, branchName, act, uid){
    const col0 = periodLabel("type0","period0","year0");
    const col1 = periodLabel("type1","period1","year1");

    let totalR0=0, totalR1=0, totalQ0=0, totalQ1=0;
    (act.groups||[]).forEach(g => {
        const { r0, r1 } = groupRevs(g, false);
        totalR0 += r0; totalR1 += r1;
        totalQ0 += +g.quantity0||0; totalQ1 += +g.quantity1||0;
    });
    const dR    = totalR1 - totalR0;
    const dRpct = totalR0 ? dR/totalR0*100 : 0;
    const avgP0 = totalQ0 ? totalR0/totalQ0 : 0;
    const avgP1 = totalQ1 ? totalR1/totalQ1 : 0;

    let html = `<div class="activity-block activity-block-unique" data-uid="${uid}">`;

    html += `
    <div class="activity-header">
        <div class="activity-title-row">
            <div class="activity-title-text">${activityName}</div>
            <div class="section-meta branch-badge">${branchName}</div>
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
    html += `
        <tr class="row-total">
            <td><strong>${t("total")}</strong></td>
            <td>${fmt(totalQ0)}</td><td>${fmt(totalQ1)}</td>
            <td>${fmt(avgP0)}</td><td>${fmt(avgP1)}</td>
            <td>${fmt(totalR0)}</td><td>${fmt(totalR1)}</td>
            <td class="${dR>=0?"green":"red"}">${fmt(dR)}</td>
            <td>${dRpct.toFixed(1)}%</td>
            <td>100%</td><td>100%</td><td>—</td>
        </tr>`;

    // Branch label row
    html += `
        <tr class="row-branch">
            <td>
                <button class="collapse-branch-btn" data-uid="${uid}" data-bi="0">
                    <span class="collapse-icon-sm">−</span>
                </button>
                <strong>${branchName}</strong>
            </td>
            <td>${fmt(totalQ0)}</td><td>${fmt(totalQ1)}</td>
            <td>${fmt(avgP0)}</td><td>${fmt(avgP1)}</td>
            <td>${fmt(totalR0)}</td><td>${fmt(totalR1)}</td>
            <td class="${dR>=0?"green":"red"}">${fmt(dR)}</td>
            <td>${dRpct.toFixed(1)}%</td>
            <td>100%</td><td>100%</td><td>—</td>
        </tr>`;

    // Group rows
    (act.groups||[]).forEach((g, gi) => {
        const { r0, r1 } = groupRevs(g, false);
        const dr    = r1 - r0;
        const drpct = r0 ? dr/r0*100 : 0;
        const s0    = totalR0 ? r0/totalR0*100 : 0;
        const s1    = totalR1 ? r1/totalR1*100 : 0;
        const ds    = s1 - s0;
        html += `
        <tr class="row-group" data-group-row="${uid}-0">
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

    html += `</tbody></table>`;
    html += `</div></div>`;
    return html;
}

export function bindTableUnique(container){
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
