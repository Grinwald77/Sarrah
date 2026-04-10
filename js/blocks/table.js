import { Store } from '../store.js';
import { t } from '../i18n.js';

export const TableBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups");
        if(!groups.length) return;

        let html = `<table>
        <tr>
            <th>${t("group")}</th>
            <th>${t("quantity")} 0</th>
            <th>${t("quantity")} 1</th>
            <th>${t("price")} 0</th>
            <th>${t("price")} 1</th>
            <th>${t("revenue")} 0</th>
            <th>${t("revenue")} 1</th>
        </tr>`;

        groups.forEach((g,i)=>{

            let r0=g.q0*g.p0;
            let r1=g.q1*g.p1;

            html+=`
            <tr>
                <td><input value="${g.name}" data-i="${i}" data-k="name"></td>
                <td><input value="${g.q0}" data-i="${i}" data-k="q0"></td>
                <td><input value="${g.q1}" data-i="${i}" data-k="q1"></td>
                <td><input value="${g.p0}" data-i="${i}" data-k="p0"></td>
                <td><input value="${g.p1}" data-i="${i}" data-k="p1"></td>
                <td>${Math.round(r0)}</td>
                <td>${Math.round(r1)}</td>
            </tr>`;
        });

        html+=`</table>`;

        document.getElementById("tableBlock").innerHTML = html;

        this.bind();
    },

    bind(){

        document.querySelectorAll("#tableBlock input").forEach(inp=>{
            inp.oninput=(e)=>{

                let i=e.target.dataset.i;
                let k=e.target.dataset.k;

                let groups = Store.get("groups");
                groups[i][k] = k==="name" ? e.target.value : +e.target.value;

                Store.set("groups",groups);
            };
        });
    }
};
