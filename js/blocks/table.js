import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups");
        if(!groups || !groups.length) return;

        let html = `
        <table>
        <tr>
            <th rowspan="2">Group</th>

            <th colspan="2">Quantity</th>
            <th colspan="2">Average Price</th>
            <th colspan="3">Revenue</th>
            <th colspan="3">Share</th>
        </tr>

        <tr>
            <th>Initial</th>
            <th>Current</th>

            <th>Initial</th>
            <th>Current</th>

            <th>Initial</th>
            <th>Current</th>
            <th>Δ Revenue</th>

            <th>Initial</th>
            <th>Current</th>
            <th>Δ Share</th>
        </tr>
        `;

        let R0=0, R1=0;

        let r0=[], r1=[];

        // ========= расчет =========
        groups.forEach((g,i)=>{

            let q0 = g.quantity0 || 0;
            let q1 = g.quantity1 || 0;
            let p0 = g.price0 || 0;
            let p1 = g.price1 || 0;

            r0[i] = q0 * p0;
            r1[i] = q1 * p1;

            R0 += r0[i];
            R1 += r1[i];
        });

        let dR = R1 - R0;

        // ========= строки =========
        groups.forEach((g,i)=>{

            let delta = r1[i] - r0[i];

            let s0 = R0 ? r0[i]/R0*100 : 0;
            let s1 = R1 ? r1[i]/R1*100 : 0;
            let ds = s1 - s0;

            html += `
            <tr>
                <td>${g.name}</td>

                <td>${g.quantity0}</td>
                <td>${g.quantity1}</td>

                <td>${g.price0}</td>
                <td>${g.price1}</td>

                <td>${Math.round(r0[i])}</td>
                <td>${Math.round(r1[i])}</td>

                <td class="${delta>=0?'green':'red'}">
                    ${Math.round(delta)}
                </td>

                <td>${s0.toFixed(1)}%</td>
                <td>${s1.toFixed(1)}%</td>

                <td class="${ds>=0?'green':'red'}">
                    ${ds.toFixed(1)} pp
                </td>
            </tr>
            `;
        });

        // ======================
        // ✅ TOTAL ROW (добавлено)
        // ======================

        let totalQ0 = groups.reduce((s,g)=>s+(+g.quantity0||0),0);
        let totalQ1 = groups.reduce((s,g)=>s+(+g.quantity1||0),0);

        let avgP0 = totalQ0 ? R0/totalQ0 : 0;
        let avgP1 = totalQ1 ? R1/totalQ1 : 0;

        html += `
        <tr class="total">
            <td>${t("total")}</td>

            <td>${totalQ0}</td>
            <td>${totalQ1}</td>

            <td>${Math.round(avgP0)}</td>
            <td>${Math.round(avgP1)}</td>

            <td>${Math.round(R0)}</td>
            <td>${Math.round(R1)}</td>

            <td class="${dR>=0?'green':'red'}">
                ${Math.round(dR)}
            </td>

            <td>100%</td>
            <td>100%</td>
            <td>0</td>
        </tr>
        `;

        html += `</table>`;

        document.getElementById("tableBlock").innerHTML = html;
    }
};
