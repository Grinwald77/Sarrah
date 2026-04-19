import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TabsBlock = {

    init(){
        Store.subscribe(() => this.render());
    },

    render(){
        const el = document.getElementById("tabsBlock");
        if(!el) return;

        // Don't re-render if actively editing
        if(el.querySelector(".tab-inline-input")) return;

        if(!Store.get("built")){ el.innerHTML = ""; return; }

        const branchCount  = Store.get("branchCount") || 1;
        const branches     = Store.get("branches") || [];
        const activeBranch = Store.get("activeBranch");

        if(branchCount <= 1 || branches.length <= 1){ el.innerHTML = ""; return; }

        let html = `<div class="tabs-bar">`;

        // General tab — div not button, no special key behaviour
        const sumActive = activeBranch === -1;
        html += `<div class="tab-btn ${sumActive?"tab-active":""}" data-branch="-1" role="tab">
            <span class="tab-icon">Σ</span>
            <span class="tab-label">${t("summary")}</span>
        </div>`;

        // Branch tabs
        branches.forEach((b, i) => {
            const active = activeBranch === i;
            const name   = b.name || `${t("branch")} ${i+1}`;
            html += `
            <div class="tab-btn ${active?"tab-active":""}" data-branch="${i}" role="tab">
                <span class="tab-num">${i+1}</span>
                <span class="tab-label" data-branch-idx="${i}">${name}</span>
            </div>`;
        });

        html += `</div>`;
        el.innerHTML = html;

        el.querySelectorAll(".tab-btn").forEach(tab => {
            tab.addEventListener("mousedown", (e) => {
                // Prevent any focus stealing
                e.preventDefault();
            });

            tab.addEventListener("click", (e) => {
                const idx      = +tab.dataset.branch;
                const isActive = Store.get("activeBranch") === idx;

                if(!isActive){
                    Store.setActiveBranch(idx);
                    return;
                }

                // Second click on active branch → edit name
                if(idx >= 0){
                    const label = tab.querySelector(".tab-label[data-branch-idx]");
                    if(label) this._startEdit(label, idx);
                }
            });
        });
    },

    _startEdit(label, idx){
        const current = label.textContent.trim();

        label.textContent = "";
        const input = document.createElement("input");
        input.className   = "tab-inline-input";
        input.value       = current;
        input.style.width = Math.max(80, current.length * 9) + "px";
        label.appendChild(input);

        input.focus();
        input.select();

        let committed = false;

        const commit = () => {
            if(committed) return;
            committed = true;
            const val = input.value.trim() || `${t("branch")} ${idx+1}`;
            label.textContent = val;
            Store.setBranchName(idx, val);
        };

        const revert = () => {
            if(committed) return;
            committed = true;
            label.textContent = current;
            Store.emit();
        };

        // blur = commit (click away or Enter)
        input.addEventListener("blur", commit);

        input.addEventListener("keydown", (e) => {
            if(e.key === "Enter"){
                e.preventDefault();
                input.blur();
            }
            if(e.key === "Escape"){
                input.removeEventListener("blur", commit);
                revert();
            }
            // Stop ALL keys from bubbling — nothing outside should react
            e.stopPropagation();
        });

        input.addEventListener("mousedown", (e) => e.stopPropagation());
        input.addEventListener("click",     (e) => e.stopPropagation());
    }
};
