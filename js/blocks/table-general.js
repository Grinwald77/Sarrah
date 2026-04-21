// ─────────────────────────────────────────────
//  TableGeneral — General tab coordinator
//  Analyses all branches, routes to correct
//  table type for each activity group
// ─────────────────────────────────────────────
import { Store }  from '../store.js';
import { t }      from '../i18n.js';
import { sectionMeta } from './table-helpers.js';
import { renderTableMulti,  bindTableMulti  } from './table-multi.js';
import { renderTableUnique, bindTableUnique } from './table-unique.js';
import { renderTableSingle, bindTableSingle } from './table-single.js';

export const TableGeneral = {

    render(){
        const el = document.getElementById("tableBlock");
        if(!el) return;

        if(!Store.get("built")){
            el.innerHTML = `
            <div class="empty-placeholder">
                <div class="empty-placeholder-icon">⬆</div>
                <div class="empty-placeholder-text">${t("placeholder")}</div>
            </div>`;
            return;
        }

        const branches = Store.get("branches") || [];
        if(!branches.length){ el.innerHTML = ""; return; }

        const meta = sectionMeta();

        // ── Step 1: Collect multi-factor activities by exact name ──
        // Map<name, [{ branchIdx, branchName, act }]>
        const multiMap = new Map();
        const singleData = []; // [{ branchName, activities[] }]

        branches.forEach((branch, bi) => {
            const branchName = branch.name || `${t("branch")} ${bi+1}`;
            const singleActs = [];

            (branch.activities||[]).forEach(act => {
                if(act.singleFactor){
                    singleActs.push(act);
                } else {
                    const name = act.name || `${t("activityName")} ${bi+1}`;
                    if(!multiMap.has(name)) multiMap.set(name, []);
                    multiMap.get(name).push({ branchName, act });
                }
            });

            if(singleActs.length){
                singleData.push({ branchName, activities: singleActs });
            }
        });

        // ── Step 2: Build HTML ──
        let html = `
        <div class="section-header">
            <div class="section-title">${t("revenueBy")}</div>
            <div class="section-meta">${meta}</div>
        </div>`;

        let uid = 0;

        // Multi-factor tables (type 1 or type 2)
        multiMap.forEach((entries, actName) => {
            if(entries.length > 1){
                // Type 1: activity in multiple branches
                const branchData = entries.map(({ branchName, act }) => ({
                    branchName,
                    activities: [act]
                }));
                html += renderTableMulti(actName, branchData, `m${uid++}`);
            } else {
                // Type 2: activity in only one branch
                const { branchName, act } = entries[0];
                html += renderTableUnique(actName, branchName, act, `u${uid++}`);
            }
        });

        // Single-factor table (type 3)
        if(singleData.length){
            html += renderTableSingle(singleData, `s${uid++}`);
        }

        el.innerHTML = html;

        // ── Step 3: Bind all collapse buttons ──
        bindTableMulti(el);
        bindTableUnique(el);
        bindTableSingle(el);
    }
};
