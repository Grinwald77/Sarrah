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

            <!-- ЛОГО -->
            <div class="logo-block">
                <img src="assets/logo.png" class="logo">
            <div class="logo-text">
            <div class="logo-main">Sarrah BI Model:</div>
            <div class="logo-sub">Revenue & Cost Factor Analysis</div>
        </div>
    </div>

            <!-- БЛОК 1 -->
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

            <!-- БЛОК 2 -->
            <div class="top-group">
                <span class="label">${t("source")}</span>

                <select id="period0"></select>
                <select id="year0"></select>

                <select id="type0">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <!-- БЛОК 3 -->
            <div class="top-group">
                <span class="label">${t("current")}</span>
                
                <select id="period1"></select>
                <select id="year1"></select>

                <select id="type1">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <!-- КНОПКИ -->
            <div class="top-group">
                <button id="buildBtn" class="build-btn">${t("build")}</button>
                <button id="testBtn" class="test-btn">${t("test")}</button>
            </div>

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

        document.getElementById("currency").onchange = e=>{
            Store.set("currency", e.target.value);
        };

        document.getElementById("scale").onchange = e=>{
            Store.set("scale", e.target.value);
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

        // 🔥 ВОТ ГЛАВНЫЙ ФИКС
        document.getElementById("lang").onchange = (e)=>{

            // сохраняем состояние UI
            const ui = {
                groupCount: document.getElementById("groupCount").value,
                periodType: document.getElementById("periodType").value,

                year0: document.getElementById("year0").value,
                year1: document.getElementById("year1").value,

                period0: document.getElementById("period0").value,
                period1: document.getElementById("period1").value,

                type0: document.getElementById("type0").value,
                type1: document.getElementById("type1").value
            };

            Store.set("language", e.target.value);
            applyDir();

            this.render();

            // восстанавливаем значения
            document.getElementById("groupCount").value = ui.groupCount;
            document.getElementById("periodType").value = ui.periodType;

            document.getElementById("year0").value = ui.year0;
            document.getElementById("year1").value = ui.year1;

            this.fillPeriods();

            document.getElementById("period0").value = ui.period0;
            document.getElementById("period1").value = ui.period1;

            document.getElementById("type0").value = ui.type0;
            document.getElementById("type1").value = ui.type1;
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

    const months = {
        en:["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."],
        ru:["Янв.","Фев.","Мар.","Апр.","Май","Июн.","Июл.","Авг.","Сен.","Окт.","Ноя.","Дек."],
        he:["ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"]
    };

    let lang = Store.get("language");

    let list = [];

    const period0 = document.getElementById("period0");
    const period1 = document.getElementById("period1");

    // ===== YEARS =====
    if(type === "years"){

        // ❗ убираем значения
        period0.innerHTML = "";
        period1.innerHTML = "";

        // ❗ делаем неактивным
        period0.disabled = true;
        period1.disabled = true;

        return;
    }

    // 👉 включаем обратно если не years
    period0.disabled = false;
    period1.disabled = false;

    // ===== MONTHS =====
    if(type === "months"){
        list = months[lang];
    }

    // ===== WEEKS =====
    if(type === "weeks"){
        list = Array.from({length:52}, (_,i)=>`W${i+1}`);
    }

    // ===== QUARTERS =====
    if(type === "quarters"){
        list = ["Q1","Q2","Q3","Q4"];
    }

    let html = list.map(x=>`<option>${x}</option>`).join("");

    period0.innerHTML = html;
    period1.innerHTML = html;
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
