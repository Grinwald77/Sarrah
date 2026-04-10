export const FactorModel = {

    calc(groups){

        let R0=0, R1=0;
        let q=0, p=0;

        groups.forEach(g=>{

            let q0 = g.quantity0 || 0;
            let q1 = g.quantity1 || 0;
            let p0 = g.price0 || 0;
            let p1 = g.price1 || 0;

            let r0 = q0 * p0;
            let r1 = q1 * p1;

            R0 += r0;
            R1 += r1;

            q += (q1 - q0) * p0;
            p += q1 * (p1 - p0);
        });

        return {
            R0,
            R1,
            dR: R1 - R0,
            q,
            p
        };
    }
};
