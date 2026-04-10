export const FinanceModel = {
    calc(groups){

        return groups.map(g=>{
            let revenue0 = g.q0*g.p0;
            let revenue1 = g.q1*g.p1;

            let cost0 = g.q0*(g.c0||0);
            let cost1 = g.q1*(g.c1||0);

            return {
                ...g,
                revenue0,
                revenue1,
                cost0,
                cost1,
                margin0: revenue0 - cost0,
                margin1: revenue1 - cost1
            };
        });

    }
};
