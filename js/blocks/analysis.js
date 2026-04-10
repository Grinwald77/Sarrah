import { Store } from '../store.js';
import { FactorModel } from '../models/factor.js';

export const AnalysisBlock = {

    init(){
        Store.subscribe(()=>this.render());
    },

    render(){

        let groups = Store.get("groups") || [];
        if(!groups.length) return;

        let r = FactorModel.calc(groups);

        document.getElementById("analysisBlock").innerHTML = `
        <div style="background:white; padding:10px; border-radius:10px; margin-top:10px;">
            <b>Revenue Factor Analysis</b><br><br>

            Revenue Initial: ${Math.round(r.R0)}<br>
            Revenue Current: ${Math.round(r.R1)}<br>
            Change: ${Math.round(r.dR)}<br><br>

            Quantity Effect: ${Math.round(r.q)}<br>
            Price Effect: ${Math.round(r.p)}
        </div>
        `;
    }
};
