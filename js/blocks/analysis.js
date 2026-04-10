import { Store } from '../store.js';
import { FactorModel } from '../models/factor.js';
import { t } from '../i18n.js';

export const AnalysisBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups");
        if(!groups.length) return;

        let r = FactorModel.calc(groups);

        document.getElementById("analysisBlock").innerHTML = `
        <b>${t("analysis")}</b><br><br>

        ${t("revenue")} ${t("initial")}: ${Math.round(r.R0)}<br>
        ${t("revenue")} ${t("current")}: ${Math.round(r.R1)}<br>
        ${t("change")}: ${Math.round(r.dR)}<br><br>

        ${t("quantity")}: ${Math.round(r.q)}<br>
        ${t("price")}: ${Math.round(r.p)}
        `;
    }
};
