import { Store } from '../store.js';

export const TableBlock = {

    init(){

        // подписка
        Store.subscribe(() => {
            TableBlock.render();
        });

        // первый рендер
        TableBlock.render();
    },

    render(){

        const el = document.getElementById("tableBlock");

        if(!el){
            console.error("tableBlock NOT FOUND");
            return;
        }

        let groups = Store.get("groups") || [];

        console.log("TABLE RENDER", groups);

        // 👉 если нет данных
        if(!groups.length){
            el.innerHTML = `
                <div style="padding:10px; color:#777;">
                    No data yet — click Build
                </div>
            `;
            return;
        }

        let html = `
        <table>
        <tr>
            <th>Group</th>
            <th>Q0</th>
            <th>Q1</th>
            <th>P0</th>
            <th>P1</th>
            <th>R0</th>
            <th>R1</th>
            <th>Δ</th>
        </tr>
        `;

        let R0=0, R1=0;

        let r0=[], r1=[];

        groups.forEach((g,i)=>{

            let q0 = g.quantity0 || 0;
            let q1 = g.quantity1 || 0;
            let p0 = g.price0 || 0;
            let p1 = g.price1 || 0;

            r0[i] = q0*p0;
            r1[i] = q1*p1;

            R0 += r0[i];
            R1 += r1[i];
        });

        groups.forEach((g,i)=>{

            let delta = r1[i] - r0[i];

            html += `
            <tr>
                <td>${g.name}</td>
                <td>${g.quantity0}</td>
                <td>${g.quantity1}</td>
                <td>${g.price0}</td>
                <td>${g.price1}</td>
                <td>${Math.round(r0[i])}</td>
                <td>${Math.round(r1[i])}</td>
                <td>${Math.round(delta)}</td>
            </tr>
            `;
        });

        html += `
        <tr style="font-weight:bold;">
            <td>Total</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>${Math.round(R0)}</td>
            <td>${Math.round(R1)}</td>
            <td>${Math.round(R1-R0)}</td>
        </tr>
        </table>
        `;

        el.innerHTML = html;
    }
};
