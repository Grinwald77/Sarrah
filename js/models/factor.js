export const FactorModel = {

    // ΔR_total = q_effect + p_effect + s_effect
    //
    // q_effect = Σ over all multi-factor groups: (q1 - q0) * p0
    // p_effect = Σ over all multi-factor groups:  q1 * (p1 - p0)
    // s_effect = Σ rev1_single - Σ rev0_single
    //
    // R0_total = R0_multi + R0_single
    // R1_total = R1_multi + R1_single
    // dR       = R1_total - R0_total  ==  q_effect + p_effect + s_effect ✓

    // activities: flat array (single branch or all branches flattened)
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
                    const q0 = +g.quantity0 || 0, q1 = +g.quantity1 || 0;
                    const p0 = +g.price0    || 0, p1 = +g.price1    || 0;
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
            q: q_effect, p: p_effect, s: s_effect,
            R0_multi, R1_multi, R0_single, R1_single,
            hasMulti: hasMultiActivities, hasSingle: hasSingleActivities
        };
    },

    // Detailed breakdown: per branch → activity → group
    // branches: [{ name, activities[] }]
    // Returns detailed structure for rendering
    calcDetailed(branches){
        const result = {
            // Top-level totals
            R0: 0, R1: 0, dR: 0,
            q: 0, p: 0, s: 0,
            hasMulti: false, hasSingle: false,

            // Per-branch breakdown
            branches: []
        };

        branches.forEach(branch => {
            const branchDetail = {
                name: branch.name,
                R0: 0, R1: 0, dR: 0,
                q: 0, p: 0, s: 0,
                hasMulti: false, hasSingle: false,
                activities: []
            };

            (branch.activities || []).forEach(act => {
                const actDetail = {
                    name:         act.name,
                    singleFactor: !!act.singleFactor,
                    R0: 0, R1: 0, dR: 0,
                    q: 0, p: 0, s: 0,
                    groups: []
                };

                (act.groups || []).forEach(g => {
                    const gDetail = { name: g.name };

                    if(act.singleFactor){
                        const r0 = +g.revenue0 || 0;
                        const r1 = +g.revenue1 || 0;
                        const s  = r1 - r0;
                        gDetail.r0 = r0; gDetail.r1 = r1;
                        gDetail.s  = s;
                        actDetail.R0 += r0; actDetail.R1 += r1; actDetail.s += s;
                        branchDetail.hasSingle = true;
                        result.hasSingle = true;
                    } else {
                        const q0 = +g.quantity0 || 0, q1 = +g.quantity1 || 0;
                        const p0 = +g.price0    || 0, p1 = +g.price1    || 0;
                        const r0 = q0 * p0, r1 = q1 * p1;
                        const q  = (q1 - q0) * p0;
                        const p  = q1 * (p1 - p0);
                        gDetail.r0 = r0; gDetail.r1 = r1;
                        gDetail.q  = q;  gDetail.p  = p;
                        actDetail.R0 += r0; actDetail.R1 += r1;
                        actDetail.q  += q;  actDetail.p  += p;
                        branchDetail.hasMulti = true;
                        result.hasMulti = true;
                    }

                    actDetail.dR = actDetail.R1 - actDetail.R0;
                    actDetail.groups.push(gDetail);
                });

                branchDetail.R0 += actDetail.R0; branchDetail.R1 += actDetail.R1;
                branchDetail.q  += actDetail.q;  branchDetail.p  += actDetail.p;
                branchDetail.s  += actDetail.s;
                branchDetail.dR  = branchDetail.R1 - branchDetail.R0;
                branchDetail.activities.push(actDetail);
            });

            result.R0 += branchDetail.R0; result.R1 += branchDetail.R1;
            result.q  += branchDetail.q;  result.p  += branchDetail.p;
            result.s  += branchDetail.s;
            result.dR  = result.R1 - result.R0;
            result.branches.push(branchDetail);
        });

        return result;
    }
};
