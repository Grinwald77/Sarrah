import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
        this.render();
    },

    render(){

        const el = document.getElementById("tableBlock");
        if(!el) return;

        const groups = Store.get("groups") || [];

        if(groups.length === 0){
            el.innerHTML = `<div>${t("noData")}</div>`;
            return;
        }

        let R0=0, R1=0;
        let r0=[], r1=[];

        groups.forEach((g,i)=>{
            let q0 = +g.quantity0||0;
            let q1 = +g.quantity1||0;
            let p0 = +g.price0||0;
            let p1 = +g.price1||0;

            r0[i]=q0*p0;
            r1[i]=q1*p1;

            R0+=r0[i];
            R1+=r1[i];
        });

        let html = `
        <table>
        <tr>
            <th rowspan="2">${t("group")}</th>

            <th colspan="2">${t("quantity")}</th>
            <th colspan="2">${t("price")}</th>
            <th colspan="3">${t("revenue")}</th>
            <th colspan="3">${t("share")}</th>
        </tr>

        <tr>
            <th>${t("initial")}</th>
            <th>${t("current")}</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>
            <th>${t("delta")}</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>
            <th>${t("delta")}</th>
        </tr>
        `;

        groups.forEach((g,i)=>{

            let q0 = +g.quantity0||0;
            let q1 = +g.quantity1||0;
            let p0 = +g.price0||0;
            let p1 = +g.price1||0;

            let delta = r1[i]-r0[i];

            let s0 = R0 ? r0[i]/R0*100 : 0;
            let s1 = R1 ? r1[i]/R1*100 : 0;
            let ds = s1-s0;

            html+=`
            <tr>
                <td><input value="${g.name}" data-i="${i}" data-k="name"></td>

                <td><input value="${q0}" data-i="${i}" data-k="quantity0"></td>
                <td><input value="${q1}" data-i="${i}" data-k="quantity1"></td>

                <td><input value="${p0}" data-i="${i}" data-k="price0"></td>
                <td><input value="${p1}" data-i="${i}" data-k="price1"></td>

                <td>${Math.round(r0[i])}</td>
                <td>${Math.round(r1[i])}</td>

                <td class="${delta>=0?'green':'red'}">${Math.round(delta)}</td>

                <td>${s0.toFixed(1)}%</td>
                <td>${s1.toFixed(1)}%</td>

                <td class="${ds>=0?'green':'red'}">${ds.toFixed(1)} pp</td>
            </tr>`;
        });

        html+=`</table>`;
        el.innerHTML=html;

        this.bind();
    },

    bind(){

        let groups = Store.get("groups");

        document.querySelectorAll("#tableBlock input").forEach(input=>{
            input.oninput = e=>{
                let i=e.target.dataset.i;
                let k=e.target.dataset.k;

                groups[i][k] = (k==="name") ? e.target.value : +e.target.value||0;

                Store.set("groups", groups);
            };
        });
    }
};
