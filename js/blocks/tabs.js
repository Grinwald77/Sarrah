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

        this._bindTabs(el);
    },

    _bindTabs(el){
        // Track clicks per label for "second click on active = edit"
        el.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                if(this._editing) return;

                const idx = +btn.dataset.branch;
                const isActive = Store.get("activeBranch") === idx;

                if(!isActive){
                    // First click — just switch
                    Store.setActiveBranch(idx);
                    return;
                }

                // Already on this tab — check if click was on the label text
                const label = btn.querySelector(".tab-label[data-branch-idx]");
                if(label && idx >= 0){
                    this._startEdit(label, idx);
                }
            });
        });
    },

    _startEdit(label, idx){
        if(this._editing) return;
        this._editing = true;

        const current = label.textContent.trim();

        // Replace label text with input
        label.textContent = "";
        const input = document.createElement("input");
        input.className = "tab-inline-input";
        input.value = current;
        input.style.width = Math.max(70, current.length * 9) + "px";
        label.appendChild(input);
        input.focus();
        input.select();

        let done = false;
        const save = () => {
            if(done) return;
            done = true;
            this._editing = false;
            const val = input.value.trim() || `${t("branch")} ${idx+1}`;
            Store.setBranchName(idx, val);
        };
        const cancel = () => {
            if(done) return;
            done = true;
            this._editing = false;
            Store.emit();
        };

        input.onblur    = save;
        input.onkeydown = (e) => {
            if(e.key === "Enter")  { e.preventDefault(); save(); }
            if(e.key === "Escape") { input.onblur = null; cancel(); }
            e.stopPropagation();
        };
        input.onclick = (e) => e.stopPropagation();
    }
};
