import { Store } from '../store.js';
import { t } from '../i18n.js';

function getDiv(){
    let s = Store.get("scale");
    if(s==="thousands") return 1000;
    if(s==="millions") return 1000000;
    return 1;
}

function getSymbol(){
    return {
        USD:"$",
        EUR:"€",
        ILS:"₪",
        RUB:"₽"
    }[Store.get("currency")] || "";
}

function getScaleShort(){
    let s = Store.get("scale");
    if(s==="thousands") return "Thnds";
    if(s==="millions") return "Mln";
    return "";
}

function formatNum(v){
    return (v / getDiv()).toFixed(2);
}

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups");
        if(!groups || !groups.length) return;

        let p = Store.get("periods") || {};

        let left = `${p.period0} ${p.year0}`;
        let right = `${p.period1} ${p.year1}`;

        let type = `${t(p.type0)}-${t(p.type1)}`;

        let title = `
        <div class="table-title">
            ${t("revenue")} 
            (${left} – ${right}, ${type}, ${getSymbol()} ${getScaleShort()})
        </div>
        `;

        let html = title + `<table>`;

        let R0=0, R1=0;

        groups.forEach(g=>{
            let r0 = (+g.quantity0||0)*(+g.price0||0);
            let r1 = (+g.quantity1||0)*(+g.price1||0);
            R0+=r0; R1+=r1;
        });

        html += `
        <tr>
            <th>${t("group")}</th>
            <th>${t("revenue")} 0</th>
            <th>${t("revenue")} 1</th>
            <th>Δ</th>
        </tr>
        `;

        groups.forEach(g=>{

            let r0 = (+g.quantity0||0)*(+g.price0||0);
            let r1 = (+g.quantity1||0)*(+g.price1||0);
            let d = r1-r0;

            html += `
            <tr>
                <td>${g.name}</td>
                <td>${formatNum(r0)}</td>
                <td>${formatNum(r1)}</td>
                <td class="${d>=0?'green':'red'}">${formatNum(d)}</td>
            </tr>
            `;
        });

        html += `
        <tr class="total">
            <td>${t("totalRevenue")} (${getSymbol()} ${getScaleShort()})</td>
            <td>${formatNum(R0)}</td>
            <td>${formatNum(R1)}</td>
            <td>${formatNum(R1-R0)}</td>
        </tr>
        `;

        html += `</table>`;

        document.getElementById("tableBlock").innerHTML = html;
    }
};
