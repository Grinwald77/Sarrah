export const FinanceModel = {

    calculate(groups){

        let totals = {
            revenue0:0,
            revenue1:0,
            directCost0:0,
            directCost1:0,
            variableCost0:0,
            variableCost1:0
        };

        let rows = groups.map(g=>{

            let revenue0 = g.quantity0 * g.price0;
            let revenue1 = g.quantity1 * g.price1;

            let directCost0 = g.quantity0 * g.directCost0;
            let directCost1 = g.quantity1 * g.directCost1;

            let variableCost0 = revenue0 * (g.variableRate0 || 0);
            let variableCost1 = revenue1 * (g.variableRate1 || 0);

            totals.revenue0 += revenue0;
            totals.revenue1 += revenue1;

            totals.directCost0 += directCost0;
            totals.directCost1 += directCost1;

            totals.variableCost0 += variableCost0;
            totals.variableCost1 += variableCost1;

            return {
                ...g,
                revenue0,
                revenue1,
                directCost0,
                directCost1,
                variableCost0,
                variableCost1
            };
        });

        // итоговые показатели
        totals.margin0 = totals.revenue0 - totals.directCost0;
        totals.margin1 = totals.revenue1 - totals.directCost1;

        totals.profit0 = totals.margin0 - totals.variableCost0;
        totals.profit1 = totals.margin1 - totals.variableCost1;

        totals.tax0 = totals.profit0 * 0.2;
        totals.tax1 = totals.profit1 * 0.2;

        totals.netProfit0 = totals.profit0 - totals.tax0;
        totals.netProfit1 = totals.profit1 - totals.tax1;

        return {rows, totals};
    }
};
