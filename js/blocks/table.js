import { Store } from '../store.js';

export const TableBlock = {

    init(){
        Store.subscribe(() => this.render());
        this.render();
    },

    render(){

        const el = document.getElementById("tableBlock");
        if(!el) return;

        const groups = Store.get("groups") || [];

        // 👉 нет данных
        if(groups.length === 0){
            el.innerHTML = `
                <div style="color:#777;">
                    Click "Build" to create table
                </div>
            `;
            return;
        }

        let R0 = 0;
        let R1 = 0;

        const r0 = [];
        const r1 = [];

        // ======================
        // расчёт выручки
        // ======================
        groups.forEach((g,i)=>{

            const q0 = Number(g.quantity0) || 0;
            const q1 = Number(g.quantity1) || 0;
            const p0 = Number(g.price0) || 0;
            const p1 = Number(g.price1) || 0;

            r0[i] = q0 * p0;
            r1[i] = q1 * p1;

            R0 += r0[i];
            R1 += r1[i];
        });

        const dR = R1 - R0;

        // ======================
        // таблица
        // ======================
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
            <th>Δ</th>

            <th>Initial</th>
            <th>Current</th>
            <th>Δ</th>
        </tr>
        `;

        // ======================
        // строки
        // ======================
        groups.forEach((g,i)=>{

            const q0 = Number(g.quantity0) || 0;
            const q1 = Number(g.quantity1) || 0;
            const p0 = Number(g.price0) || 0;
            const p1 = Number(g.price1) || 0;

            const delta = r1[i] - r0[i];

            const s0 = R0 ? (r0[i]/R0*100) : 0;
            const s1 = R1 ? (r1[i]/R1*100) : 0;
            const ds = s1 - s0;

            html += `
            <tr>

                <td>
                    <input value="${g.name}" data-i="${i}" data-k="name">
                </td>

                <td>
                    <input value="${q0}" data-i="${i}" data-k="quantity0">
                </td>

                <td>
                    <input value="${q1}" data-i="${i}" data-k="quantity1">
                </td>

                <td>
                    <input value="${p0}" data-i="${i}" data-k="price0">
                </td>

                <td>
                    <input value="${p1}" data-i="${i}" data-k="price1">
                </td>

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
        // итоги
        // ======================
        const totalQ0 = groups.reduce((s,g)=>s+(Number(g.quantity0)||0),0);
        const totalQ1 = groups.reduce((s,g)=>s+(Number(g.quantity1)||0),0);

        const avgP0 = totalQ0 ? R0/totalQ0 : 0;
        const avgP1 = totalQ1 ? R1/totalQ1 : 0;

        html += `
        <tr style="font-weight:bold; background:#eef2ff;">
            <td>Total</td>

            <td>${totalQ0}</td>
            <td>${totalQ1}</td>

            <td>${Math.round(avgP0)}</td>
            <td>${Math.round(avgP1)}</td>

            <td>${Math.round(R0)}</td>
            <td>${Math.round(R1)}</td>

            <td>${Math.round(dR)}</td>

            <td>100%</td>
            <td>100%</td>
            <td>0</td>
        </tr>

        </table>
        `;

        el.innerHTML = html;

        this.bind();
    },

    bind(){

        const groups = Store.get("groups");

        document.querySelectorAll("#tableBlock input").forEach(input=>{

            input.oninput = (e)=>{

                const i = e.target.dataset.i;
                const k = e.target.dataset.k;

                if(!groups[i]) return;

                groups[i][k] = (k === "name")
                    ? e.target.value
                    : Number(e.target.value) || 0;

                Store.set("groups", groups);
            };
        });
    }
};
