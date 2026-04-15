export const FactorModel = {

    // multiGroups  — группы из многофакторных видов деятельности
    // singleRevenue — { R0, R1 } из однофакторных (просто сумма выручек)
    calc(multiGroups, singleRevenue){ 

        let R0_multi=0, R1_multi=0;
        let q=0, p=0;

        multiGroups.forEach(g => {
            const q0 = +g.quantity0 || 0;
            const q1 = +g.quantity1 || 0;
            const p0 = +g.price0    || 0;
            const p1 = +g.price1    || 0;

            const r0 = q0 * p0;
            const r1 = q1 * p1;

            R0_multi += r0;
            R1_multi += r1;

            q += (q1 - q0) * p0;       // эффект объёма
            p += q1 * (p1 - p0);        // эффект цены
        });

        const sR0 = singleRevenue?.R0 || 0;
        const sR1 = singleRevenue?.R1 || 0;
        const s   = (sR1 - sR0);       // эффект однофакторных видов

        const R0 = R0_multi + sR0;
        const R1 = R1_multi + sR1;

        return {
            R0, R1,
            dR: R1 - R0,
            q,          // volume effect (multi only)
            p,          // price effect (multi only)
            s,          // single-factor revenue effect
            hasSingle: sR0 !== 0 || sR1 !== 0
        };
    }
};
