import { Store } from './store.js';

export const Dict = {

    en:{
        group:"Group",
        quantity:"Quantity",
        price:"Price",
        revenue:"Revenue",
        share:"Share",

        initial:"Initial",
        current:"Current",

        actual:"Actual",
        planned:"Planned",

        currency:"Currency",
        scale:"Scale",

        units:"Units",
        thousands:"Thousands",
        millions:"Millions",

        totalRevenue:"Total Revenue"
    },

    ru:{
        group:"Группа",
        quantity:"Количество",
        price:"Цена",
        revenue:"Выручка",
        share:"Доля",

        initial:"Исходный",
        current:"Текущий",

        actual:"Факт",
        planned:"План",

        currency:"Валюта",
        scale:"Масштаб",

        units:"Единицы",
        thousands:"Тысячи",
        millions:"Миллионы",

        totalRevenue:"Итого выручка"
    },

    he:{
        group:"קבוצה",
        quantity:"כמות",
        price:"מחיר",
        revenue:"הכנסות",
        share:"נתח",

        initial:"תחלתי",
        current:"נוכחי",

        actual:"בפועל",
        planned:"מתוכנן",

        currency:"מטבע",
        scale:"קנה מידה",

        units:"יחידות",
        thousands:"אלפים",
        millions:"מיליונים",

        totalRevenue:"סה״כ הכנסות"
    }
};

export function t(k){
    return Dict[Store.get("language")][k] || k;
}

export function applyDir(){
    let lang = Store.get("language");
    document.body.dir = (lang==="he") ? "rtl" : "ltr";
}
