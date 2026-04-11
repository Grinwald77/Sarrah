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
            <th rowspan="2">${t("group")}</th>

            <th colspan="2">${t("quantity")}</th>
            <th colspan="2">${t("price")}</th>
            <th colspan="4">${t("revenue")}</th>
            <th colspan="3">${t("share")}</th>
        </tr>

        <tr>
            <th>${t("initial")}</th>
            <th>${t("current")}</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>
            <th>Δ</th>
            <th>%</th>

            <th>${t("initial")}</th>
            <th>${t("current")}</th>
            <th>Δ</th>
        </tr>
        `;

        let R0=0, R1=0;
        let r0=[], r1=[];

        // ===== расчет =====
        groups.forEach((g,i)=>{

            let q0 = +g.quantity0 || 0;
            let q1 = +g.quantity1 || 0;
            let p0 = +g.price0 || 0;
            let p1 = +g.price1 || 0;

            r0[i] = q0 * p0;
            r1[i] = q1 * p1;

            R0 += r0[i];
            R1 += r1[i];
        });

        let dR = R1 - R0;

        // ===== строки =====
        groups.forEach((g,i)=>{

            let delta = r1[i] - r0[i];
            let percent = r0[i] ? delta / r0[i] * 100 : 0;

            let s0 = R0 ? r0[i]/R0*100 : 0;
            let s1 = R1 ? r1[i]/R1*100 : 0;
            let ds = s1 - s0;

            html += `
            <tr>

                <td>
                    <input data-field="name" data-i="${i}" value="${g.name}">
                </td>

                <td><input data-field="quantity0" data-i="${i}" value="${g.quantity0 || ""}"></td>
                <td><input data-field="quantity1" data-i="${i}" value="${g.quantity1 || ""}"></td>

                <td><input data-field="price0" data-i="${i}" value="${g.price0 || ""}"></td>
                <td><input data-field="price1" data-i="${i}" value="${g.price1 || ""}"></td>

                <td>${Math.round(r0[i])}</td>
                <td>${Math.round(r1[i])}</td>

                <td class="${delta>=0?'green':'red'}">${Math.round(delta)}</td>
                <td>${percent.toFixed(1)}%</td>

                <td>${s0.toFixed(1)}%</td>
                <td>${s1.toFixed(1)}%</td>

                <td class="${ds>=0?'green':'red'}">${ds.toFixed(1)}</td>

            </tr>
            `;
        });

        // ===== TOTAL =====
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

            <td class="${dR>=0?'green':'red'}">${Math.round(dR)}</td>
            <td>100%</td>

            <td>100%</td>
            <td>100%</td>
            <td>0</td>
        </tr>
        `;

        html += `</table>`;

        document.getElementById("tableBlock").innerHTML = html;

        this.bindInputs();
        this.enablePaste();
    },

    // =========================
    // INPUT → STORE
    // =========================
    bindInputs(){

        document.querySelectorAll("#tableBlock input").forEach(input=>{

            input.addEventListener("input", e=>{

                let i = e.target.dataset.i;
                let field = e.target.dataset.field;

                let groups = Store.get("groups");

                groups[i][field] =
                    field === "name" ? e.target.value : +e.target.value;

                Store.set("groups", groups);
            });
        });
    },

    // =========================
    // 🔥 EXCEL PASTE (ФИКС)
    // =========================
    enablePaste(){

        document.querySelectorAll("#tableBlock input").forEach(input=>{

            input.onpaste = (e)=>{

                let text = e.clipboardData.getData("text");

                if(!text.includes("\n")) return;

                e.preventDefault();

                let rows = text.trim().split("\n");
                let groups = Store.get("groups");

                rows.forEach((row,i)=>{

                    if(i >= groups.length) return;

                    let c = row.split(/\t/);

                    groups[i].name = c[0] || "";
                    groups[i].quantity0 = +c[1] || 0;
                    groups[i].quantity1 = +c[2] || 0;
                    groups[i].price0 = +c[3] || 0;
                    groups[i].price1 = +c[4] || 0;
                });

                // 🔥 ключевой фикс
                setTimeout(()=>{
                    Store.set("groups", groups);
                }, 0);
            };
        });
    }
};
