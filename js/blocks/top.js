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

            <div>
                <span class="label">${t("language")}</span>
                <select id="lang">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="he">HE</option>
                </select>
            </div>

            <div>
                <span class="label">${t("groups")}</span>
                <input id="groupCount" value="${state.groupCount}">
            </div>

            <div>
                <span class="label">${t("periodType")}</span>
                <select id="periodType">
                    <option value="months">${t("months")}</option>
                    <option value="weeks">${t("weeks")}</option>
                    <option value="quarters">${t("quarters")}</option>
                    <option value="years">${t("years")}</option>
                </select>
            </div>

            <div>
                <span class="label">${t("source")}</span>
                <select id="year0"></select>
                <select id="period0"></select>
                <select id="type0">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                    <option value="Past">${t("past")}</option>
                </select>
            </div>

            <div>
                <span class="label">${t("current")}</span>
                <select id="year1"></select>
                <select id="period1"></select>
                <select id="type1">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                    <option value="Past">${t("past")}</option>
                </select>
            </div>

            <button id="buildBtn" class="build-btn">${t("build")}</button>
            <button id="testBtn" class="test-btn">${t("test")}</button>

        </div>
        `;

        this.bind();
        this.fillYears();
        this.fillPeriods();
        this.addNavigation();

        document.getElementById("lang").value = state.language;
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
            Store.set("language", e.target.value);
            applyDir();
            this.render();
        };

        document.getElementById("periodType").onchange = ()=>{
            this.fillPeriods();
        };

        document.getElementById("year0").onchange = ()=>this.fillPeriods();
        document.getElementById("year1").onchange = ()=>this.fillPeriods();
    },

    fillYears(){

        let years = [];
        for(let y=2016; y<=2027; y++){
            years.push(y);
        }

        let html = years.map(y=>`<option>${y}</option>`).join("");

        document.getElementById("year0").innerHTML = html;
        document.getElementById("year1").innerHTML = html;

        document.getElementById("year0").value = 2026;
        document.getElementById("year1").value = 2026;
    },

    fillPeriods(){

        let type = document.getElementById("periodType").value;
        let year = document.getElementById("year0").value;

        const months = {
            en:["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."],
            ru:["Янв.","Фев.","Мар.","Апр.","Май","Июн.","Июл.","Авг.","Сен.","Окт.","Ноя.","Дек."],
            he:["ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"]
        };

        let lang = Store.get("language");

        let list = [];

        if(type === "months"){
            list = months[lang].map(m => m + " " + year);
        }

        if(type === "weeks"){
            list = Array.from({length:52}, (_,i)=>`W${i+1} ${year}`);
        }

        if(type === "quarters"){
            list = ["Q1","Q2","Q3","Q4"].map(q => q + " " + year);
        }

        if(type === "years"){
            list = [year];
        }

        let html = list.map(x=>`<option>${x}</option>`).join("");

        document.getElementById("period0").innerHTML = html;
        document.getElementById("period1").innerHTML = html;
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
