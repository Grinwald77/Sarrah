import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){
        const el = document.getElementById("tabsBlock");
        if(!el) return;

        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branchCount  = Store.get("branchCount") || 1;
        const branches     = Store.get("branches") || [];
        const activeBranch = Store.get("activeBranch");

        if(branchCount <= 1 || branches.length <= 1){ el.innerHTML = ""; return; }

        let html = `<div class="tabs-bar">`;

        // General tab — not renameable
        const sumActive = activeBranch === -1;
        html += `<button class="tab-btn ${sumActive?"tab-active":""}" data-branch="-1">
            <span class="tab-icon">Σ</span>
            <span class="tab-label">${t("summary")}</span>
        </button>`;

        // Branch tabs
        branches.forEach((b, i) => {
            const active = activeBranch === i;
            const name   = b.name || `${t("branch")} ${i+1}`;
            html += `
            <button class="tab-btn ${active?"tab-active":""}" data-branch="${i}" title="${t("renameBranch")}">
                <span class="tab-num">${i+1}</span>
                <span class="tab-label tab-renameable" data-branch-idx="${i}">${name}</span>
            </button>`;
        });

        html += `</div>`;
        el.innerHTML = html;

        // ── Tab switch on single click ──
        el.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                // Don't switch if we just finished editing
                if(e.target.classList.contains("tab-label-editing")) return;
                Store.setActiveBranch(+btn.dataset.branch);
            });
        });

        // ── Double-click on label → inline edit (Excel style) ──
        el.querySelectorAll(".tab-renameable").forEach(label => {
            label.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                const idx     = +label.dataset.branchIdx;
                const current = label.textContent;

                // Replace span content with input
                label.classList.add("tab-label-editing");
                label.innerHTML = `<input
                    class="tab-inline-input"
                    value="${current}"
                    style="width:${Math.max(60, current.length * 8)}px"
                >`;

                const input = label.querySelector(".tab-inline-input");
                input.focus();
                input.select();

                const save = () => {
                    const val = input.value.trim() || `${t("branch")} ${idx+1}`;
                    label.classList.remove("tab-label-editing");
                    label.textContent = val;
                    Store.setBranchName(idx, val);
                };

                input.onblur   = save;
                input.onkeydown = (e) => {
                    if(e.key === "Enter")  { e.preventDefault(); input.blur(); }
                    if(e.key === "Escape") { input.value = current; input.blur(); }
                    e.stopPropagation();
                };
                input.onclick = (e) => e.stopPropagation();
            });
        });
    }
};
