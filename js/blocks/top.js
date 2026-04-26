import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';

export const TopBlock = {

    init(){
        this.render();
    },

    render(){

        const state = Store.state;

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar top-bar-two-rows">

            <div class="top-logo-zone">
                <img src="assets/logo.png" class="logo" alt="Sarrah">
                <div class="logo-text">
                    <div class="logo-main">Sarrah BI Model:</div>
                    <div class="logo-sub">Revenue &amp; Cost Factor Analysis</div>
                </div>
            </div>

            <div class="top-controls-zone">

                <div class="top-row top-row-1">
                    <div class="top-group">
                        <span class="label">${t("language")}</span>
                        <select id="lang">
                            <option value="en">EN</option>
                            <option value="ru">RU</option>
                            <option value="he">HE</option>
                            <option value="de">DE</option>
                            <option value="fr">FR</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("activityType")}</span>
                        <select id="activityType">
                            <option value="activities">${t("activities")}</option>
                            <option value="projects">${t("projects")}</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("factorModel")}</span>
                        <select id="factorModel">
                            <option value="2">${t("twoFactor")}</option>
                            <option value="3">${t("threeFactor")}</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("activityCount")}</span>
                        <input id="activityCount" type="number" min="1" max="5" value="${state.activityCount}" style="width:44px">
                    </div>
                    <div class="top-group">
                        <span class="label">${t("branchCount")}</span>
                        <input id="branchCount" type="number" min="1" max="10" value="${state.branchCount || 1}" style="width:44px">
                    </div>
                    <div class="top-group">
                        <span class="label">${t("periodType")}</span>
                        <select id="periodType">
                            <option value="weeks">${t("weeks")}</option>
                            <option value="months">${t("months")}</option>
                            <option value="quarters">${t("quarters")}</option>
                            <option value="years">${t("years")}</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("currency")}</span>
                        <select id="currency">
                            <option value="USD">$ US Dollar</option>
                            <option value="EUR">€ Euro</option>
                            <option value="ILS">₪ ILS</option>
                            <option value="RUB">₽ Ruble</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("scale")}</span>
                        <select id="scale">
                            <option value="units"></option>
                            <option value="thousands"></option>
                            <option value="millions"></option>
                        </select>
                    </div>
                </div>

                <div class="top-row top-row-2">
                    <div class="top-group">
                        <span class="label">${t("sourcePeriod")}</span>
                        <select id="period0"></select>
                        <select id="year0"></select>
                        <select id="type0">
                            <option value="Actual">${t("actual")}</option>
                            <option value="Planned">${t("planned")}</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <span class="label">${t("current")}</span>
                        <select id="period1"></select>
                        <select id="year1"></select>
                        <select id="type1">
                            <option value="Actual">${t("actual")}</option>
                            <option value="Planned">${t("planned")}</option>
                        </select>
                    </div>
                    <div class="top-group">
                        <button id="buildBtn" class="build-btn">${t("build")}</button>
                        <button id="testBtn" class="test-btn">${t("test")}</button>
                    </div>
                </div>

            </div>

            <div class="top-user-zone" id="topUserZone"></div>

        </div>
        `;

        this.bind();
        this.fillYears();

        document.getElementById("periodType").value = state.periodType || "quarters";
        this.fillPeriods();

        const p = state.periods || {};
        document.getElementById("year0").value  = p.year0  || "2026";
        document.getElementById("year1").value  = p.year1  || "2026";
        if(p.period0) document.getElementById("period0").value = p.period0;
        if(p.period1) document.getElementById("period1").value = p.period1;
        document.getElementById("type0").value  = p.type0  || "Actual";
        document.getElementById("type1").value  = p.type1  || "Actual";

        this.addNavigation();
        this.renderUser();

        document.getElementById("lang").value         = state.language;
        document.getElementById("activityType").value  = state.activityType || "activities";
        document.getElementById("factorModel").value   = state.factorModel  || "2";
        document.getElementById("currency").value      = state.currency || "ILS";
        this.updateScaleLabels(state.currency || "ILS");
        document.getElementById("scale").value         = state.scale    || "units";
    },


    _startMurmuration(){
        if(window.DataCloud){
            window.DataCloud.start('sarrah-murmuration', 96);
        }
    },

    bind(){

        // BUILD — resets all values, builds branches × activities
        document.getElementById("buildBtn").onclick = () => {

            const n  = Math.min(5,  Math.max(1, +document.getElementById("activityCount").value || 1));
            const nb = Math.min(10, Math.max(1, +document.getElementById("branchCount").value   || 1));

            const existingBranches = Store.get("branches") || [];

            const branches = [];
            for(let bi = 0; bi < nb; bi++){
                const prevBranch = existingBranches[bi];
                const activities = [];
                for(let i = 0; i < n; i++){
                    const prev = prevBranch?.activities?.[i];
                    activities.push({
                        name:         prev?.name         || `${t("activityName")} ${i+1}`,
                        groupCount:   5,
                        singleFactor: prev?.singleFactor ?? false,
                        groups:       this._defaultGroups(5)
                    });
                }
                branches.push({
                    name: "",   // empty — tabs render t("branch") N dynamically
                    activities
                });
            }

            // If >1 branch start on Summary tab, else on branch 0
            const activeBranch = nb > 1 ? -1 : 0;

            Store.set("activityCount", n);
            Store.set("branchCount",   nb);
            Store.set("activeBranch",  activeBranch);
            Store.set("built",         true);
            Store.set("branches",      branches);
        };

        // TEST — fill active branch with random data (not summary)
        document.getElementById("testBtn").onclick = () => {
            const branches = Store.get("branches");
            if(!branches || !branches.length) return;

            const ab = Store.get("activeBranch");
            // If on summary, fill all branches
            const toFill = ab === -1 ? branches : [branches[ab]];

            toFill.forEach(branch => {
                (branch.activities || []).forEach(act => {
                    act.groups.forEach(g => {
                        if(act.singleFactor){
                            g.revenue0 = Math.round(Math.random()*900000 + 100000);
                            g.revenue1 = Math.round(Math.random()*900000 + 100000);
                        } else {
                            g.quantity0 = Math.floor(Math.random()*200) + 10;
                            g.quantity1 = Math.floor(Math.random()*200) + 10;
                            g.price0    = Math.round((Math.random()*9000 + 1000) / 10) * 10;
                            g.price1    = Math.round((Math.random()*9000 + 1000) / 10) * 10;
                        }
                    });
                });
            });

            Store.set("branches", branches);
        };

        // LANGUAGE
        document.getElementById("currency").onchange = (e) => {
            Store.state.currency = e.target.value;
            Store._save();
            this.updateScaleLabels(e.target.value);
            if(Store.get("built")) Store.emit();
        };
        document.getElementById("scale").onchange = (e) => {
            Store.state.scale = e.target.value;
            Store._save();
            if(Store.get("built")) Store.emit();
        };

        document.getElementById("activityType").onchange = (e) => {
            Store.state.activityType = e.target.value;
            Store._save();
            if(Store.get("built")) Store.emit();
        };

        document.getElementById("factorModel").onchange = (e) => {
            Store.state.factorModel = e.target.value;
            Store._save();
            if(Store.get("built")) Store.emit();
        };

        document.getElementById("lang").onchange = (e) => {

            const ui = this._captureUI();
            Store.set("language", e.target.value);
            applyDir();
            this.render();
            this._restoreUI(ui);
        };

        // PERIOD TYPE
        document.getElementById("periodType").onchange = () => {
            this.fillPeriods();
            const val = document.getElementById("periodType").value;
            const patch = {
                period0: document.getElementById("period0").value,
                period1: document.getElementById("period1").value
            };
            if(!Store.get("built")){
                Store.state.periodType = val;
                Store.state.periods = { ...Store.state.periods, ...patch };
                Store._save();
            } else {
                Store.set("periodType", val);
                Store.setPeriods(patch);
            }
        };

        document.getElementById("activityCount").onchange = (e) => {
            let n = Math.min(5, Math.max(1, +e.target.value || 1));
            e.target.value = n;
            Store.state.activityCount = n;
            Store._save();
        };

        document.getElementById("branchCount").onchange = (e) => {
            let n = Math.min(10, Math.max(1, +e.target.value || 1));
            e.target.value = n;
            Store.state.branchCount = n;
            Store._save();
        };

        const syncPeriods = () => {
            const patch = {
                period0: document.getElementById("period0").value,
                period1: document.getElementById("period1").value,
                year0:   document.getElementById("year0").value,
                year1:   document.getElementById("year1").value,
                type0:   document.getElementById("type0").value,
                type1:   document.getElementById("type1").value
            };
            if(!Store.get("built")){
                // Silent — just save, no emit, no render
                Store.state.periods = { ...Store.state.periods, ...patch };
                try { localStorage.setItem("bi_state_v3", JSON.stringify(Store.state)); } catch(e){}
            } else {
                Store.setPeriods(patch);
            }
        };

        document.getElementById("year0").onchange   = () => { this.fillPeriods(); syncPeriods(); };
        document.getElementById("year1").onchange   = () => { this.fillPeriods(); syncPeriods(); };
        document.getElementById("period0").onchange = syncPeriods;
        document.getElementById("period1").onchange = syncPeriods;
        document.getElementById("type0").onchange   = syncPeriods;
        document.getElementById("type1").onchange   = syncPeriods;
    },

    updateScaleLabels(currency){
        const sym  = { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[currency] || currency;
        const thds = t("thousands");
        const mlns = t("millions");
        const sel  = document.getElementById("scale");
        if(!sel) return;
        const cur = sel.value;
        sel.options[0].text = sym;
        sel.options[1].text = `${thds} ${sym}`;
        sel.options[2].text = `${mlns} ${sym}`;
        sel.value = cur;
    },

    _defaultGroups(n=5){
        let groups = [];
        for(let i = 0; i < n; i++){
            groups.push({ name:`${t("group")} ${i+1}`, quantity0:0, quantity1:0, price0:0, price1:0, revenue0:0, revenue1:0 });
        }
        return groups;
    },

    _captureUI(){
        return {
            currency:   document.getElementById("currency")?.value,
            scale:      document.getElementById("scale")?.value,
            activityCount: document.getElementById("activityCount").value,
            periodType: document.getElementById("periodType").value,
            year0:      document.getElementById("year0").value,
            year1:      document.getElementById("year1").value,
            period0:    document.getElementById("period0").value,
            period1:    document.getElementById("period1").value,
            type0:      document.getElementById("type0").value,
            type1:      document.getElementById("type1").value
        };
    },

    _restoreUI(ui){
        document.getElementById("activityCount").value = ui.activityCount;
        document.getElementById("periodType").value    = ui.periodType;
        document.getElementById("year0").value         = ui.year0;
        document.getElementById("year1").value         = ui.year1;
        this.fillPeriods();
        document.getElementById("period0").value = ui.period0;
        document.getElementById("period1").value = ui.period1;
        document.getElementById("type0").value   = ui.type0;
        document.getElementById("type1").value   = ui.type1;
        if(ui.currency) document.getElementById("currency").value = ui.currency;
        if(ui.scale)    document.getElementById("scale").value    = ui.scale;
    },

    fillYears(){
        let html = "";
        for(let y = 2016; y <= 2027; y++) html += `<option>${y}</option>`;
        document.getElementById("year0").innerHTML = html;
        document.getElementById("year1").innerHTML = html;
        const p = Store.get("periods") || {};
        if(!p.year0) document.getElementById("year0").value = "2026";
        if(!p.year1) document.getElementById("year1").value = "2026";
    },

    fillPeriods(){

        const type = document.getElementById("periodType").value;
        const lang = Store.get("language");

        const months = {
            en: ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."],
            ru: ["Янв.","Фев.","Мар.","Апр.","Май","Июн.","Июл.","Авг.","Сен.","Окт.","Ноя.","Дек."],
            he: ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"],
            de: ["Jan.","Feb.","Mär.","Apr.","Mai","Jun.","Jul.","Aug.","Sep.","Okt.","Nov.","Dez."],
            fr: ["Jan.","Fév.","Mar.","Avr.","Mai","Jun.","Jul.","Aoû.","Sep.","Oct.","Nov.","Déc."]
        };

        const quarters = {
            en: ["Q1","Q2","Q3","Q4"],
            ru: ["К1","К2","К3","К4"],
            he: ["Q1","Q2","Q3","Q4"],
            de: ["Q1","Q2","Q3","Q4"],
            fr: ["T1","T2","T3","T4"]
        };

        const weekPrefix = { en:"W", ru:"Н", he:"W", de:"W", fr:"S" };

        const period0 = document.getElementById("period0");
        const period1 = document.getElementById("period1");

        if(type === "years"){
            period0.innerHTML = ""; period1.innerHTML = "";
            period0.disabled = true; period1.disabled = true;
            return;
        }

        period0.disabled = false; period1.disabled = false;

        const pfx = weekPrefix[lang] || "W";
        let list = [];
        if(type === "weeks")    list = Array.from({length:52}, (_,i) => `${pfx}${i+1}`);
        if(type === "months")   list = months[lang]   || months.en;
        if(type === "quarters") list = quarters[lang] || quarters.en;

        const prev0 = Store.get("periods")?.period0;
        const prev1 = Store.get("periods")?.period1;

        const html = list.map(x => `<option>${x}</option>`).join("");
        period0.innerHTML = html;
        period1.innerHTML = html;

        // Restore saved value or default to first option
        if(prev0 && [...period0.options].some(o => o.value === prev0)) period0.value = prev0;
        else period0.selectedIndex = 0;
        if(prev1 && [...period1.options].some(o => o.value === prev1)) period1.value = prev1;
        else period1.selectedIndex = 0;
    },

    renderUser(){
        const el = document.getElementById("topUserZone");
        if(!el) return;
        try{
            const user = JSON.parse(localStorage.getItem("sarrah_user"));
            if(!user){ el.innerHTML = ""; return; }
            el.innerHTML = `
                <div class="top-user">
                    <img class="top-user-pic" src="${user.picture||""}" alt="">
                    <span class="top-user-name">${user.name||user.email||""}</span>
                    <button class="top-signout-btn" onclick="(function(){localStorage.removeItem('sarrah_user');window.location.href='index.html';})()">Sign out</button>
                </div>`;
        }catch(e){ el.innerHTML = ""; }
    },

    addNavigation(){
        const elements = document.querySelectorAll("#topBlock input, #topBlock select");
        elements.forEach((el, i) => {
            el.addEventListener("keydown", e => {
                if(e.key === "Enter"){
                    e.preventDefault();
                    elements[i+1]?.focus();
                }
            });
        });
    }
};
