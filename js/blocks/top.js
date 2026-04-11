import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';
import { Periods } from '../utils/periods.js';

export const TopBlock = {

    init(){
        this.render();
    },

    render(){

        const state = Store.state;
        const periods = Store.get("periods") || {};

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar">

            <!-- 🔥 ЯЗЫК ПЕРВЫЙ -->
            <div>
                Language<br>
                <select id="lang">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="he">HE</option>
                </select>
            </div>

            <div>
                ${t("groups")}<br>
                <input id="groupCount" value="${state.groupCount}">
            </div>

            <div>
                ${t("periodType")}<br>
                <select id="periodType">
                    <option value="months">${t("months")}</option>
                    <option value="weeks">${t("weeks")}</option>
                    <option value="quarters">${t("quarters")}</option>
                    <option value="years">${t("years")}</option>
                </select>
            </div>

            <div>
                ${t("sourcePeriod")}<br>
                <select id="period0"></select>
                <select id="type0">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                    <option value="Past">${t("past")}</option>
                </select>
            </div>

            <div>
                ${t("currentPeriod")}<br>
                <select id="period1"></select>
                <select id="type1">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                    <option value="Past">${t("past")}</option>
                </select>
            </div>

            <div style="align-self:end; display:flex; gap:8px;">
                <button id="buildBtn" class="build-btn">${t("build")}</button>
                <button id="testBtn" class="test-btn">${t("test")}</button>
            </div>

        </div>
        `;

        this.bind();

        // 🔥 заполняем периоды
        this.fillPeriods();

        // 🔥 восстанавливаем значения
        document.getElementById("lang").value = state.language;
        document.getElementById("periodType").value = periods.type || "months";

        if(periods.period0) document.getElementById("period0").value = periods.period0;
        if(periods.period1) document.getElementById("period1").value = periods.period1;
        if(periods.type0) document.getElementById("type0").value = periods.type0;
        if(periods.type1) document.getElementById("type1").value = periods.type1;
    },

    bind(){

        document.getElementById("buildBtn").onclick = () => {

            let n = +document.getElementById("groupCount").value || 1;

            let groups = [];

            for(let i=0;i<n;i++){
                groups.push({
                    name: `${t("group")} ${i+1}`,
                    quantity0:0,
                    quantity1:0,
                    price0:0,
                    price1:0
                });
            }

            Store.set("groupCount", n);
            Store.set("groups", groups);
        };

        document.getElementById("testBtn").onclick = () => {

            let groups = Store.get("groups");
            if(!groups || !groups.length) return;

            groups.forEach(g=>{
                g.quantity0 = Math.floor(Math.random()*10)+1;
                g.quantity1 = Math.floor(Math.random()*10)+1;
                g.price0 = Math.floor(Math.random()*10000)+1000;
                g.price1 = Math.floor(Math.random()*10000)+1000;
            });

            Store.set("groups", groups);
        };

        // 🔥 СМЕНА ЯЗЫКА БЕЗ СБРОСА
        document.getElementById("lang").onchange = (e)=>{

            // сохраняем текущие значения
            this.updatePeriods();

            Store.set("language", e.target.value);
            applyDir();

            this.render(); // перерисовка без потери данных
        };

        document.getElementById("periodType").onchange = ()=>{
            this.fillPeriods();
        };

        document.getElementById("period0").onchange = ()=>this.updatePeriods();
        document.getElementById("period1").onchange = ()=>this.updatePeriods();
        document.getElementById("type0").onchange = ()=>this.updatePeriods();
        document.getElementById("type1").onchange = ()=>this.updatePeriods();
    },

    fillPeriods(){

        let type = document.getElementById("periodType").value;
        let list = Periods.generate(type);

        let html = list.map(x=>`<option>${x}</option>`).join("");

        document.getElementById("period0").innerHTML = html;
        document.getElementById("period1").innerHTML = html;

        // 🔥 если нет сохраненных — ставим 2026
        let periods = Store.get("periods");

        if(!periods){
            let index2026 = list.findIndex(x => x.endsWith("2026"));

            if(index2026 !== -1){
                document.getElementById("period0").selectedIndex = index2026;
                document.getElementById("period1").selectedIndex =
                    index2026 + 1 < list.length ? index2026 + 1 : index2026;
            }
        }

        this.updatePeriods();
    },

    updatePeriods(){

        const p0 = document.getElementById("period0").value;
        const p1 = document.getElementById("period1").value;

        const t0 = document.getElementById("type0").value;
        const t1 = document.getElementById("type1").value;

        Store.set("periods", {
            period0: p0,
            period1: p1,
            type0: t0,
            type1: t1
        });
    }
};
