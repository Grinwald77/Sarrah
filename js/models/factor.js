export const FactorModel = {

    // Принцип трёх факторов:
    // ΔR = q_effect + p_effect + s_effect
    // где:
    //   q_effect = Σ (q1 - q0) * p0          — эффект объёма (по всем двуфакторным группам)
    //   p_effect = Σ q1 * (p1 - p0)           — эффект цены  (по всем двуфакторным группам)
    //   s_effect = Σ(rev1_single) - Σ(rev0_single)  — эффект однофакторных видов
    //
    // Итого: R0_multi + R0_single = R0_total
    //        R1_multi + R1_single = R1_total
    //        dR = q_effect + p_effect + s_effect  (должно сходиться)

    calc(activities){

        let R0_multi = 0, R1_multi = 0;
        let q_effect = 0, p_effect = 0;
        let R0_single = 0, R1_single = 0;

        (activities || []).forEach(act => {
            const groups = act.groups || [];

            if(act.singleFactor){
                // Однофакторная: суммируем выручку напрямую
                groups.forEach(g => {
                    R0_single += +g.revenue0 || 0;
                    R1_single += +g.revenue1 || 0;
                });

            } else {
                // Двуфакторная: считаем по формуле q*p
                groups.forEach(g => {
                    const q0 = +g.quantity0 || 0;
                    const q1 = +g.quantity1 || 0;
                    const p0 = +g.price0    || 0;
                    const p1 = +g.price1    || 0;

                    const r0 = q0 * p0;
                    const r1 = q1 * p1;

                    R0_multi += r0;
                    R1_multi += r1;

                    q_effect += (q1 - q0) * p0;   // эффект объёма
                    p_effect += q1 * (p1 - p0);    // эффект цены
                });
            }
        });

        const s_effect = R1_single - R0_single;

        const R0 = R0_multi + R0_single;
        const R1 = R1_multi + R1_single;
        const dR = R1 - R0;

        // Verification: q_effect + p_effect + s_effect should = dR
        // (rounding aside)

        return {
            R0, R1, dR,
            q: q_effect,
            p: p_effect,
            s: s_effect,
            R0_multi, R1_multi,
            R0_single, R1_single,
            hasMulti:  R0_multi  !== 0 || R1_multi  !== 0,
            hasSingle: R0_single !== 0 || R1_single !== 0
        };
    }
};
