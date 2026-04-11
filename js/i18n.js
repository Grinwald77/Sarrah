import { Store } from './store.js';

export const Dict = {

    en:{
        build:"Build",
        test:"Test",

        group:"Group",
        groups:"Groups",

        quantity:"Quantity",
        price:"Average Price",
        revenue:"Revenue",
        share:"Share",

        initial:"Initial",
        current:"Current",
        planned:"Planned",
        past:"Past",
        actual:"Actual",

        change:"Change",
        percent:"Percent",

        total:"Total",

        analysis:"Analysis",

        noData:"No data",

        periodType:"Period Type",
        months:"Months",
        weeks:"Weeks",
        quarters:"Quarters",
        years:"Years",
        sourcePeriod:"Source Period",
        currentPeriod:"Current Period",
        
        // будущие финансы
        directCost:"Direct Cost",
        variableCost:"Variable Cost",
        margin:"Margin",
        profit:"Profit",
        tax:"Tax",
        netProfit:"Net Profit"
    },

    ru:{
        build:"Построить",
        test:"Тест",

        group:"Группа",
        groups:"Группы",

        quantity:"Количество",
        price:"Средняя цена",
        revenue:"Выручка",
        share:"Доля",

        initial:"Исходный",
        current:"Текущий",
        planned:"План",
        past:"Прошлый",
        actual:"Факт",

        change:"Изменение",
        percent:"Процент",

        total:"Итого",

        analysis:"Анализ",

        noData:"Нет данных",


        periodType:"Тип периода",
        
        months:"Месяцы",
        weeks:"Недели",
        quarters:"Кварталы",
        years:"Годы",
        sourcePeriod:"Исходный период",
        currentPeriod:"Текущий период",
        
        // финансы
        directCost:"Прямые затраты",
        variableCost:"Переменные затраты",
        margin:"Маржа",
        profit:"Прибыль",
        tax:"Налог",
        netProfit:"Чистая прибыль"
    },

    he:{
        build:"בנה",
        test:"בדיקה",

        group:"קבוצה",
        groups:"קבוצות",

        quantity:"כמות",
        price:"מחיר ממוצע",
        revenue:"הכנסות",
        share:"חלק",

        initial:"ראשוני",
        current:"נוכחי",
        planned:"מתוכנן",
        past:"עבר",
        actual:"בפועל",

        change:"שינוי",
        percent:"אחוז",

        total:"סה״כ",

        analysis:"ניתוח",

        noData:"אין נתונים",

        periodType:"סוג תקופה",
        months:"חודשים",
        weeks:"שבועות",
        quarters:"רבעונים",
        years:"שנים",
        sourcePeriod:"תקופה מקור",
        currentPeriod:"תקופה נוכחית",
        
        // финансы
        directCost:"עלות ישירה",
        variableCost:"עלות משתנה",
        margin:"מרווח",
        profit:"רווח",
        tax:"מס",
        netProfit:"רווח נקי"
    }
};


// =========================
// TRANSLATION
// =========================
export function t(key){
    const lang = Store.get("language") || "en";
    return Dict[lang]?.[key] || key;
}


// =========================
// RTL SUPPORT
// =========================
export function applyDir(){
    let lang = Store.get("language");
    document.body.dir = (lang==="he") ? "rtl" : "ltr";
}
