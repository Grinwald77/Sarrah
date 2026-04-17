export const FactorModel = {

    // ΔR_total = q_effect + p_effect + s_effect
    //
    // q_effect = Σ по всем двуфакт. группам: (q1 - q0) * p0
    // p_effect = Σ по всем двуфакт. группам:  q1 * (p1 - p0)
    // s_effect = Σ rev1_single - Σ rev0_single
    //
    // R0_total = R0_multi + R0_single
    // R1_total = R1_multi + R1_single
    // dR       = R1_total - R0_total  ==  q_effect + p_effect + s_effect ✓

    calc(activities){

        let R0_multi  = 0, R1_multi  = 0;
        let R0_single = 0, R1_single = 0;
        let q_effect  = 0, p_effect  = 0;

        let hasMultiActivities  = false;
        let hasSingleActivities = false;

        (activities || []).forEach(act => {
            const groups = act.groups || [];

            if(act.singleFactor){
                hasSingleActivities = true;
                groups.forEach(g => {
                    R0_single += +g.revenue0 || 0;
                    R1_single += +g.revenue1 || 0;
                });

            } else {
                hasMultiActivities = true;
                groups.forEach(g => {
                    const q0 = +g.quantity0 || 0;
                    const q1 = +g.quantity1 || 0;
                    const p0 = +g.price0    || 0;
                    const p1 = +g.price1    || 0;

                    R0_multi += q0 * p0;
                    R1_multi += q1 * p1;

                    q_effect += (q1 - q0) * p0;
                    p_effect +=  q1 * (p1 - p0);
                });
            }
        });

        const s_effect = R1_single - R0_single;

        const R0 = R0_multi + R0_single;
        const R1 = R1_multi + R1_single;
        const dR = R1 - R0;

        return {
            R0, R1, dR,
            q: q_effect,
            p: p_effect,
            s: s_effect,
            R0_multi, R1_multi,
            R0_single, R1_single,
            hasMulti:  hasMultiActivities,
            hasSingle: hasSingleActivities
        };
    }
};
