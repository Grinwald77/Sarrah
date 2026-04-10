import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';
import { Periods } from '../utils/periods.js';

export const TopBlock = {

    init(){
        this.render();
    },

    render(){

        const state = Store.state;

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar">

            <div>
                Groups<br>
                <input id="groupCount" value="${state.groupCount}">
            </div>

            <div>
                Period Type<br>
                <select id="periodType">
                    <option value="months">Months</option>
                    <option value="weeks">Weeks</option>
                    <option value="quarters">Quarters</option>
                    <option value="years">Years</option>
                </select>
            </div>

            <div>
                Source Period<br>
                <select id="period0"></select>
                <select id="type0">
                    <option value="Actual">Actual</option>
                    <option value="Planned">Planned</option>
                    <option value="Past">Past</option>
                </select>
            </div>

            <div>
                Current Period<br>
                <select id="period1"></select>
                <select id="type1">
                    <option value="Actual">Actual</option>
                    <option value="Planned">Planned</option>
                    <option value="Past">Past</option>
                </select>
            </div>

            <div>
                Language<br>
                <select id="lang">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="he">HE</option>
                </select>
            </div>

            <div style="align-self:end;">
                <button id="buildBtn">${t("build")}</button>
            </div>

        </div>
        `;

        this.bind();
        this.fillPeriods();
    },

    bind(){

        // BUILD MODEL
        document.getElementById("buildBtn").onclick = () => {

            let n = +document.getElementById("groupCount").value || 1;

            let groups = [];

            for(let i=0;i<n;i++){
                groups.push({
                    name: `${t("group")} ${i+1}`,

                    quantity0:0,
                    quantity1:0,

                    price0:0,
                    price1:0,

                    // 🔥 финансы (задел)
                    directCost0:0,
                    directCost1:0,
                    variableRate0:0,
                    variableRate1:0
                });
            }

            Store.set("groupCount", n);
            Store.set("groups", groups);
        };

        // LANGUAGE
        document.getElementById("lang").onchange = (e)=>{
            Store.set("language", e.target.value);
            applyDir();
            this.render();
        };

        // PERIOD TYPE CHANGE
        document.getElementById("periodType").onchange = ()=>{
            this.fillPeriods();
        };

        // PERIOD SELECTION
        document.getElementById("period0").onchange = this.updatePeriods;
        document.getElementById("period1").onchange = this.updatePeriods;
        document.getElementById("type0").onchange = this.updatePeriods;
        document.getElementById("type1").onchange = this.updatePeriods;
    },

    fillPeriods(){

        let type = document.getElementById("periodType").value;

        let list = Periods.generate(type);

        let html = list.map(x=>`<option>${x}</option>`).join("");

        document.getElementById("period0").innerHTML = html;
        document.getElementById("period1").innerHTML = html;

        // по умолчанию следующий период
        if(list.length > 1){
            document.getElementById("period1").selectedIndex = 1;
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
