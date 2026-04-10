import { Store } from '../store.js';

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups") || [];
        if(!groups.length) return;

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

        let R0=0, R1=0;
        let r0=[], r1=[];

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

        groups.forEach((g,i)=>{

            let q0 = g.quantity0 || 0;
            let q1 = g.quantity1 || 0;
            let p0 = g.price0 || 0;
            let p1 = g.price1 || 0;

            let delta = r1[i] - r0[i];

            let s0 = R0 ? r0[i]/R0*100 : 0;
            let s1 = R1 ? r1[i]/R1*100 : 0;
            let ds = s1 - s0;

            html += `
            <tr>
                <td><input value="${g.name}" data-i="${i}" data-k="name"></td>

                <td><input value="${q0}" data-i="${i}" data-k="quantity0"></td>
                <td><input value="${q1}" data-i="${i}" data-k="quantity1"></td>

                <td><input value="${p0}" data-i="${i}" data-k="price0"></td>
                <td><input value="${p1}" data-i="${i}" data-k="price1"></td>

                <td>${Math.round(r0[i])}</td>
                <td>${Math.round(r1[i])}</td>

                <td style="color:${delta>=0?'green':'red'}">${Math.round(delta)}</td>

                <td>${s0.toFixed(1)}%</td>
                <td>${s1.toFixed(1)}%</td>

                <td style="color:${ds>=0?'green':'red'}">${ds.toFixed(1)} pp</td>
            </tr>
            `;
        });

        let totalQ0 = groups.reduce((s,g)=>s+(g.quantity0||0),0);
        let totalQ1 = groups.reduce((s,g)=>s+(g.quantity1||0),0);

        let avgP0 = totalQ0 ? R0/totalQ0 : 0;
        let avgP1 = totalQ1 ? R1/totalQ1 : 0;

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

        document.getElementById("tableBlock").innerHTML = html;

        this.bind();
    },

    bind(){

        document.querySelectorAll("#tableBlock input").forEach(inp=>{

            inp.oninput = (e)=>{

                let i = e.target.dataset.i;
                let k = e.target.dataset.k;

                let groups = Store.get("groups");

                groups[i][k] = k==="name"
                    ? e.target.value
                    : +e.target.value || 0;

                Store.set("groups", groups);
            };
        });
    }
};
