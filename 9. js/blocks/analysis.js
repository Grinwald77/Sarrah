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

        R0: ${Math.round(r.R0)}<br>
        R1: ${Math.round(r.R1)}<br>
        Δ: ${Math.round(r.dR)}<br><br>

        Quantity: ${Math.round(r.q)}<br>
        Price: ${Math.round(r.p)}
        `;
    }
};
