import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';

export const TopBlock = {

    init(){
        this.render();
    },

    render(){

        const state = Store.state;

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar">

            <!-- 🔥 LOGO -->
            <div class="logo-block">
                <img src="logo.png" class="logo">
                <div>
                    <div class="logo-text">Sarrah BI</div>
                    <div class="logo-sub">
                        Model Sarrah BI: Revenue & Cost Factor Analysis
                    </div>
                </div>
            </div>

            <!-- НАСТРОЙКИ -->
            <div class="top-group">
                <span class="label">${t("language")}</span>
                <select id="lang">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="he">HE</option>
                </select>

                <span class="label">${t("groups")}</span>
                <input id="groupCount" value="${state.groupCount}">

                <span class="label">${t("periodType")}</span>
                <select id="periodType">
                    <option value="months">${t("months")}</option>
                    <option value="weeks">${t("weeks")}</option>
                    <option value="quarters">${t("quarters")}</option>
                    <option value="years">${t("years")}</option>
                </select>

                <span class="label">${t("currency")}</span>
                <select id="currency">
                    <option value="USD">$</option>
                    <option value="EUR">€</option>
                    <option value="ILS">₪</option>
                    <option value="RUB">₽</option>
                </select>

                <span class="label">${t("scale")}</span>
                <select id="scale">
                    <option value="units">${t("units")}</option>
                    <option value="thousands">${t("thousands")}</option>
                    <option value="millions">${t("millions")}</option>
                </select>
            </div>

            <!-- SOURCE -->
            <div class="top-group">
                <span class="label">${t("source")}</span>

                <select id="period0"></select>
                <select id="year0"></select>

                <select id="type0">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <!-- CURRENT -->
            <div class="top-group">
                <span class="label">${t("current")}</span>

                <select id="period1"></select>
                <select id="year1"></select>

                <select id="type1">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <!-- BUTTONS -->
            <div class="top-group">
                <button id="buildBtn" class="build-btn">${t("build")}</button>
                <button id="testBtn" class="test-btn">${t("test")}</button>
            </div>

        </div>
        `;

        this.bind();
        this.fillYears();

        document.getElementById("periodType").value = Store.get("periodType");

        this.fillPeriods();
        this.restoreSelections();

        document.getElementById("lang").value = state.language;

        this.addNavigation();
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
            if(!groups.length) return;

            groups.forEach(g=>{
                g.quantity0 = Math.floor(Math.random()*10)+1;
                g.quantity1 = Math.floor(Math.random()*10)+1;
                g.price0 = Math.floor(Math.random()*10000)+1000;
                g.price1 = Math.floor(Math.random()*10000)+1000;
            });

            Store.set("groups", groups);
        };

        document.getElementById("lang").onchange = (e)=>{
            this.updatePeriods();
            Store.set("language", e.target.value);
            applyDir();
            this.render();
        };

        document.getElementById("currency").onchange = e=>{
            Store.set("currency", e.target.value);
        };

        document.getElementById("scale").onchange = e=>{
            Store.set("scale", e.target.value);
        };

        document.getElementById("periodType").onchange = (e)=>{
            Store.set("periodType", e.target.value);
            this.fillPeriods();
        };

        document.getElementById("period0").onchange = ()=>this.updatePeriods();
        document.getElementById("period1").onchange = ()=>this.updatePeriods();
        document.getElementById("year0").onchange = ()=>this.updatePeriods();
        document.getElementById("year1").onchange = ()=>this.updatePeriods();
        document.getElementById("type0").onchange = ()=>this.updatePeriods();
        document.getElementById("type1").onchange = ()=>this.updatePeriods();
    },

    restoreSelections(){

        let p = Store.get("periods");

        document.getElementById("period0").value = p.period0;
        document.getElementById("period1").value = p.period1;

        document.getElementById("year0").value = p.year0;
        document.getElementById("year1").value = p.year1;

        document.getElementById("type0").value = p.type0;
        document.getElementById("type1").value = p.type1;
    },

    fillYears(){

        let years = [];
        for(let y=2016; y<=2027; y++){
            years.push(y);
        }

        let html = years.map(y=>`<option>${y}</option>`).join("");

        document.getElementById("year0").innerHTML = html;
        document.getElementById("year1").innerHTML = html;

        document.getElementById("year0").value = Store.get("periods").year0;
        document.getElementById("year1").value = Store.get("periods").year1;
    },

    fillPeriods(){

        let type = document.getElementById("periodType").value;

        let list = [];

        if(type==="months") list = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        if(type==="weeks") list = Array.from({length:52},(_,i)=>`W${i+1}`);
        if(type==="quarters") list = ["Q1","Q2","Q3","Q4"];
        if(type==="years") list = ["Year"];

        let html = list.map(x=>`<option>${x}</option>`).join("");

        document.getElementById("period0").innerHTML = html;
        document.getElementById("period1").innerHTML = html;
    },

    updatePeriods(){

        Store.set("periods", {
            period0: document.getElementById("period0").value,
            period1: document.getElementById("period1").value,
            year0: document.getElementById("year0").value,
            year1: document.getElementById("year1").value,
            type0: document.getElementById("type0").value,
            type1: document.getElementById("type1").value
        });
    },

    addNavigation(){

        const elements = document.querySelectorAll(
            "#topBlock input, #topBlock select"
        );

        elements.forEach((el,i)=>{
            el.addEventListener("keydown", e=>{
                if(e.key === "Enter"){
                    e.preventDefault();
                    elements[i+1]?.focus();
                }
            });
        });
    }
};
