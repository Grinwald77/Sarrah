export const FactorModel = {
    calc(groups){

        let R0=0,R1=0,q=0,p=0;

        groups.forEach(g=>{
            let r0=g.q0*g.p0;
            let r1=g.q1*g.p1;

            R0+=r0;
            R1+=r1;

            q+=(g.q1-g.q0)*g.p0;
            p+=g.q1*(g.p1-g.p0);
        });

        return {R0,R1,dR:R1-R0,q,p};
    }
};
