import { Store } from './store.js';

export const Dict = {

    en:{
        build:"Build",
        test:"Test",
        group:"Group",
        groups:"Groups",

        periodType:"Period Type",
        sourcePeriod:"Source Period",
        currentPeriod:"Current Period",

        actual:"Actual",
        planned:"Planned",
        past:"Past",

        quantity:"Quantity",
        price:"Average Price",
        revenue:"Revenue",
        change:"Change",
        share:"Share",

        initial:"Initial",
        current:"Current",

        total:"Total",
        noData:"No data yet — click Build",

        analysis:"Revenue Analysis",

        delta:"Δ",
        contribution:"Contribution",

        weeks:"Weeks",
        months:"Months",
        quarters:"Quarters",
        years:"Years"
    },

    ru:{
        build:"Построить",
        test:"Тест",
        group:"Группа",
        groups:"Группы",

        periodType:"Тип периода",
        sourcePeriod:"Исходный период",
        currentPeriod:"Текущий период",

        actual:"Факт",
        planned:"План",
        past:"Прошлый",

        quantity:"Количество",
        price:"Средняя цена",
        revenue:"Выручка",
        change:"Изменение",
        share:"Доля",

        initial:"Исходный",
        current:"Текущий",

        total:"Итого",
        noData:"Нет данных — нажмите Построить",

        analysis:"Анализ выручки",

        delta:"Δ",
        contribution:"Вклад",

        weeks:"Недели",
        months:"Месяцы",
        quarters:"Кварталы",
        years:"Годы"
    },

    he:{
        build:"בנה",
        test:"בדיקה",
        group:"קבוצה",
        groups:"קבוצות",

        periodType:"סוג תקופה",
        sourcePeriod:"תקופה מקורית",
        currentPeriod:"תקופה נוכחית",

        actual:"בפועל",
        planned:"מתוכנן",
        past:"עבר",

        quantity:"כמות",
        price:"מחיר ממוצע",
        revenue:"הכנסות",
        change:"שינוי",
        share:"נתח",

        initial:"מקורי",
        current:"נוכחי",

        total:"סה״כ",
        noData:"אין נתונים — לחץ בנה",

        analysis:"ניתוח הכנסות",

        delta:"Δ",
        contribution:"תרומה",

        weeks:"שבועות",
        months:"חודשים",
        quarters:"רבעונים",
        years:"שנים"
    }
};

export function t(key){
    const lang = Store.get("language");
    return Dict[lang]?.[key] || key;
}

export function applyDir(){
    const lang = Store.get("language");
    document.body.dir = (lang === "he") ? "rtl" : "ltr";
}
