import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    _editing: false,

    init(){
        Store.subscribe(() => {
            if(this._editing) return;
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

        const sumActive = activeBranch === -1;
        html += `<button class="tab-btn ${sumActive?"tab-active":""}" data-branch="-1">
            <span class="tab-icon">Σ</span>
            <span class="tab-label">${t("summary")}</span>
        </button>`;

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
            btn.addEventListener("click", () => {
                if(this._editing) return;
                Store.setActiveBranch(+btn.dataset.branch);
            });
        });

        // Double click → rename
        el.querySelectorAll(".tab-renameable").forEach(label => {
            label.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if(this._editing) return;  // already editing

                const idx     = +label.dataset.branchIdx;
                const current = label.textContent.trim();

                // Switch to this branch silently
                Store.state.activeBranch = idx;
                Store._save();

                this._editing = true;

                // Replace with input
                label.textContent = "";
                const input = document.createElement("input");
                input.className = "tab-inline-input";
                input.value = current;
                input.style.width = Math.max(70, current.length * 9) + "px";
                label.appendChild(input);

                input.focus();
                input.select();

                // One save function, called exactly once
                let saved = false;
                const save = () => {
                    if(saved) return;
                    saved = true;
                    this._editing = false;
                    const val = input.value.trim() || `${t("branch")} ${idx+1}`;
                    Store.setBranchName(idx, val);
                    // render() will be called by Store.emit() inside setBranchName
                };

                input.onblur    = save;
                input.onkeydown = (e) => {
                    if(e.key === "Enter"){
                        e.preventDefault();
                        save();
                    }
                    if(e.key === "Escape"){
                        saved = true;  // prevent blur from saving
                        this._editing = false;
                        Store.emit();  // re-render with original name
                    }
                    e.stopPropagation();
                };
                input.onclick = (e) => e.stopPropagation();
            });
        });
    }
};
