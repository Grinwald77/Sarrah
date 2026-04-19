import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    _editing: false,  // guard against re-render during edit

    init(){
        Store.subscribe(() => {
            if(this._editing) return;  // don't re-render while user is typing
            this.render();
        });
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

        // General tab
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
            <button class="tab-btn ${active?"tab-active":""}" data-branch="${i}">
                <span class="tab-num">${i+1}</span>
                <span class="tab-label tab-renameable" data-branch-idx="${i}">${name}</span>
            </button>`;
        });

        html += `</div>`;
        el.innerHTML = html;

        // Single click → switch branch
        el.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                if(this._editing) return;
                Store.setActiveBranch(+btn.dataset.branch);
            });
        });

        // Double click → rename inline (Excel style)
        el.querySelectorAll(".tab-renameable").forEach(label => {
            label.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();

                const idx     = +label.dataset.branchIdx;
                const current = label.textContent.trim();

                // First switch to this branch silently (no emit)
                Store.state.activeBranch = idx;
                Store._save();

                this._editing = true;

                // Replace label with input
                label.innerHTML = `<input
                    class="tab-inline-input"
                    value="${current}"
                    style="width:${Math.max(70, current.length * 9)}px"
                >`;

                const input = label.querySelector(".tab-inline-input");
                input.focus();
                input.select();

                const save = () => {
                    this._editing = false;
                    const val = input.value.trim() || `${t("branch")} ${idx+1}`;
                    // Restore label text
                    label.innerHTML = val;
                    // Save to store and re-render
                    Store.setBranchName(idx, val);
                };

                const cancel = () => {
                    this._editing = false;
                    label.innerHTML = current;
                    Store.emit();  // re-render to restore state
                };

                input.addEventListener("blur",    save, { once: true });
                input.addEventListener("keydown", (e) => {
                    if(e.key === "Enter")  { e.preventDefault(); input.blur(); }
                    if(e.key === "Escape") { input.removeEventListener("blur", save); cancel(); }
                    e.stopPropagation();
                });
                input.addEventListener("click", (e) => e.stopPropagation());
            });
        });
    }
};
