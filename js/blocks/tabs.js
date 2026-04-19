import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){
        const el = document.getElementById("tabsBlock");
        if(!el) return;

        // Don't re-render if an input is currently active inside tabsBlock
        if(el.querySelector(".tab-inline-input")) return;

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
                <span class="tab-label" data-branch-idx="${i}">${name}</span>
            </button>`;
        });

        html += `</div>`;
        el.innerHTML = html;

        // Single click → switch; click on already-active → edit
        el.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx      = +btn.dataset.branch;
                const isActive = Store.get("activeBranch") === idx;

                if(!isActive){
                    Store.setActiveBranch(idx);
                    return;
                }

                // Click on active branch label → start editing
                if(idx >= 0){
                    const label = btn.querySelector(".tab-label[data-branch-idx]");
                    if(label) this._startEdit(el, label, idx);
                }
            });
        });
    },

    _startEdit(container, label, idx){
        const current = label.textContent.trim();

        // Swap label text for input in-place
        label.textContent = "";
        const input = document.createElement("input");
        input.className = "tab-inline-input";
        input.value     = current;
        input.style.width = Math.max(80, current.length * 9) + "px";
        label.appendChild(input);

        // Focus without triggering blur immediately
        setTimeout(() => { input.focus(); input.select(); }, 0);

        let committed = false;

        const commit = () => {
            if(committed) return;
            committed = true;
            const val = input.value.trim() || `${t("branch")} ${idx+1}`;
            // Restore label before store update to avoid flicker
            label.textContent = val;
            Store.setBranchName(idx, val);
        };

        const revert = () => {
            if(committed) return;
            committed = true;
            label.textContent = current;
            // No store update needed — just re-render
            Store.emit();
        };

        // blur (click away OR Enter) → save
        // Escape → cancel
        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (e) => {
            if(e.key === "Enter")  { e.preventDefault(); input.blur(); }
            if(e.key === "Escape") {
                input.removeEventListener("blur", commit);
                revert();
            }
            e.stopPropagation();
        });
        // Prevent click inside input from bubbling to btn
        input.addEventListener("click",    (e) => e.stopPropagation());
        input.addEventListener("mousedown", (e) => e.stopPropagation());
        // Prevent button from reacting to Space key while input is focused
        input.addEventListener("keyup",    (e) => e.stopPropagation());
        input.addEventListener("keypress", (e) => e.stopPropagation());
    }
};
