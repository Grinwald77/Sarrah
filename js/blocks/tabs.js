import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){
        const el = document.getElementById("tabsBlock");
        if(!el) return;

        if(!Store.get("built")){
            el.innerHTML = "";
            return;
        }

        const branchCount  = Store.get("branchCount") || 1;
        const branches     = Store.get("branches") || [];
        const activeBranch = Store.get("activeBranch");

        // Only show tabs if more than 1 branch
        if(branchCount <= 1 || branches.length <= 1){
            el.innerHTML = "";
            return;
        }

        // Build tabs: Summary first, then each branch
        let html = `<div class="tabs-bar">`;

        // Summary tab (activeBranch === -1)
        const sumActive = activeBranch === -1;
        html += `<button class="tab-btn ${sumActive ? "tab-active" : ""}" data-branch="-1">
            <span class="tab-icon">Σ</span>
            <span class="tab-label">${t("summary")}</span>
        </button>`;

        // Branch tabs
        branches.forEach((b, i) => {
            const active = activeBranch === i;
            html += `<button class="tab-btn ${active ? "tab-active" : ""}" data-branch="${i}">
                <span class="tab-num">${i + 1}</span>
                <span class="tab-label">${b.name || t("branch") + " " + (i+1)}</span>
            </button>`;
        });

        html += `</div>`;
        el.innerHTML = html;

        // Bind clicks
        el.querySelectorAll(".tab-btn").forEach(btn => {
            btn.onclick = () => {
                const idx = +btn.dataset.branch;
                Store.setActiveBranch(idx);
            };
        });
    }
};
