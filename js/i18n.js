import { Store } from './store.js';

export const Dict = {

    en:{
        language:"Language",
        groups:"Groups",
        group:"Group",

        periodType:"Period",
        months:"Months",
        weeks:"Weeks",
        quarters:"Quarters",
        years:"Years",

        source:"Source",
        current:"Current",

        actual:"Actual",
        planned:"Planned",
        past:"Past",

        quantity:"Quantity",
        price:"Price",
        revenue:"Revenue",
        analysis:"Analysis",

        build:"Build",
        test:"Test",
        total:"Total"
    },

    ru:{
        language:"Язык",
        groups:"Группы",
        group:"Группа",

        periodType:"Период",
        months:"Месяцы",
        weeks:"Недели",
        quarters:"Кварталы",
        years:"Годы",

        source:"Исходный",
        current:"Текущий",

        actual:"Факт",
        planned:"План",
        past:"Прошлый",

        quantity:"Количество",
        price:"Цена",
        revenue:"Выручка",
        analysis:"Анализ",

        build:"Построить",
        test:"Тест",
        total:"Итого"
    },

    he:{
        language:"שפה",
        groups:"קבוצות",
        group:"קבוצה",

        periodType:"תקופה",
        months:"חודשים",
        weeks:"שבועות",
        quarters:"רבעונים",
        years:"שנים",

        source:"מקור",
        current:"נוכחי",

        actual:"בפועל",
        planned:"מתוכנן",
        past:"עבר",

        quantity:"כמות",
        price:"מחיר",
        revenue:"הכנסות",
        analysis:"ניתוח",

        build:"בנה",
        test:"בדיקה",
        total:"סה״כ"
    }
};

export function t(k){
    return Dict[Store.get("language")][k] || k;
}

export function applyDir(){
    let lang = Store.get("language");
    document.body.dir = (lang==="he") ? "rtl" : "ltr";
}
