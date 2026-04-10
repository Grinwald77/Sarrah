import { Store } from '../store.js';

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

        let qEffect = 0;
        let pEffect = 0;

        // ========= строки =========
        groups.forEach
