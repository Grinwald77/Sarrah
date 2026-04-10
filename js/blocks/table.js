import { Store } from '../store.js';
import { t } from '../i18n.js';
import { FinanceModel } from '../models/finance.js';

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups");
        if(!groups || !groups.length) return;

        const { rows, totals } = FinanceModel.calculate(groups);

        let html = `
        <table>
        <tr>
            <th>${t("group")}</th>

            <th>Quantity 0</th>
            <th>Quantity 1</th>

            <th>Price 0</th>
            <th>Price 1</th>

            <th>Revenue 0</th>
            <th>Revenue 1</th>

            <th>Share %</th>

            <th>Direct Cost 0</th>
            <th>Direct Cost 1</th>

            <th>Variable % 0</th>
            <th>Variable % 1</th>

            <th>Variable Cost 0</th>
            <th>Variable Cost 1</th>

            <th>Margin 0</th>
            <th>Margin 1</th>

            <th>Profit 0</th>
            <th>Profit 1</th>
        </tr>
        `;

        rows.forEach((g,i)=>{

            let share = totals.revenue0
                ? (g.revenue0 / totals.revenue0 * 100).toFixed(1)
                : 0;

            html += `
            <tr>
                <td><input value="${g.name}" data-i="${i}" data-k="name"></td>

                <td><input value="${g.quantity0}" data-i="${i}" data-k="quantity0"></td>
                <td><input value="${g.quantity1}" data-i="${i}" data-k="quantity1"></td>

                <td><input value="${g.price0}" data-i="${i}" data-k="price0"></td>
                <td><input value="${g.price1}" data-i="${i}" data-k="price1"></td>

                <td>${Math.round(g.revenue0)}</td>
                <td>${Math.round(g.revenue1)}</td>

                <td>${share}%</td>

                <td><input value="${g.directCost0}" data-i="${i}" data-k="directCost0"></td>
                <td><input value="${g.directCost1}" data-i="${i}" data-k="directCost1"></td>

                <td><input value="${g.variableRate0}" data-i="${i}" data-k="variableRate0"></td>
                <td><input value="${g.variableRate1}" data-i="${i}" data-k="variableRate1"></td>

                <td>${Math.round(g.variableCost0)}</td>
                <td>${Math.round(g.variableCost1)}</td>

                <td>${Math.round(g.margin0)}</td>
                <td>${Math.round(g.margin1)}</td>

                <td>${Math.round(g.profit0)}</td>
                <td>${Math.round(g.profit1)}</td>
            </tr>
            `;
        });

        // 🔥 ИТОГОВАЯ СТРОКА (ВСЕ ПОКАЗАТЕЛИ)
        html += `
        <tr style="font-weight:bold; background:#eef2ff;">
            <td>Total</td>

            <td></td>
            <td></td>

            <td></td>
            <td></td>

            <td>${Math.round(totals.revenue0)}</td>
            <td>${Math.round(totals.revenue1)}</td>

            <td>100%</td>

            <td>${Math.round(totals.directCost0)}</td>
            <td>${Math.round(totals.directCost1)}</td>

            <td></td>
            <td></td>

            <td>${Math.round(totals.variableCost0)}</td>
            <td>${Math.round(totals.variableCost1)}</td>

            <td>${Math.round(totals.margin0)}</td>
            <td>${Math.round(totals.margin1)}</td>

            <td>${Math.round(totals.profit0)}</td>
            <td>${Math.round(totals.profit1)}</td>
        </tr>
        </table>
        `;

        document.getElementById("tableBlock").innerHTML = html;

        this.bind();
    },

    bind(){

        document.querySelectorAll("#tableBlock input").forEach(inp=>{

            inp.oninput = (e)=>{

                let i = e.target.dataset.i;
                let k = e.target.dataset.k;

                let groups = Store.get("groups");

                if(k === "name"){
                    groups[i][k] = e.target.value;
                } else {
                    groups[i][k] = +e.target.value || 0;
                }

                Store.set("groups", groups);
            };

        });
    }
};
