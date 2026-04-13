import { Store } from './store.js';

export const Dict = {

    en:{
        // top bar
        language:       "Language",
        activityCount:  "Activities",
        periodType:     "Period",
        currency:       "Currency",
        scale:          "Scale",
        source:         "Source",
        current:        "Current",
        build:          "Build",
        test:           "Test",

        // period types
        months:         "Months",
        weeks:          "Weeks",
        quarters:       "Quarters",
        years:          "Years",

        // scale
        units:          "Units",
        thousands:      "Thousands",
        millions:       "Millions",

        // period labels
        actual:         "Actual",
        planned:        "Planned",

        // table columns
        group:          "Group",
        quantity:       "Qty",
        price:          "Price",
        revenue:        "Revenue",
        share:          "Share",
        initial:        "Initial",
        change:         "Δ",
        changePct:      "%",

        // activity block
        activityName:   "Activity name",
        groupCount:     "Groups",
        singleFactor:   "Single-factor",

        // section titles
        revenueBy:      "Revenue by activities",
        revenueOf:      "Revenue",
        by:             "by",

        // totals
        total:          "Total",
        totalRevenue:   "Total Revenue",
        grandTotal:     "Grand Total",

        // analysis
        analysis:       "Factor Analysis",
        factorQty:      "Volume effect",
        factorPrice:    "Price effect",
    },

    ru:{
        language:       "Язык",
        activityCount:  "Виды деят.",
        periodType:     "Период",
        currency:       "Валюта",
        scale:          "Масштаб",
        source:         "Источник",
        current:        "Текущий",
        build:          "Построить",
        test:           "Тест",

        months:         "Месяцы",
        weeks:          "Недели",
        quarters:       "Кварталы",
        years:          "Годы",

        units:          "Единицы",
        thousands:      "Тысячи",
        millions:       "Миллионы",

        actual:         "Факт",
        planned:        "План",

        group:          "Группа",
        quantity:       "Кол-во",
        price:          "Цена",
        revenue:        "Выручка",
        share:          "Доля",
        initial:        "Исходный",
        change:         "Δ",
        changePct:      "%",

        activityName:   "Вид деятельности",
        groupCount:     "Групп",
        singleFactor:   "Однофакторная",

        revenueBy:      "Выручка по видам деятельности",
        revenueOf:      "Выручка",
        by:             "по",

        total:          "Итого",
        totalRevenue:   "Итого выручка",
        grandTotal:     "Общий итог",

        analysis:       "Факторный анализ",
        factorQty:      "Эффект объёма",
        factorPrice:    "Эффект цены",
    },

    he:{
        language:       "שפה",
        activityCount:  "פעילויות",
        periodType:     "תקופה",
        currency:       "מטבע",
        scale:          "קנה מידה",
        source:         "מקור",
        current:        "נוכחי",
        build:          "בנה",
        test:           "בדיקה",

        months:         "חודשים",
        weeks:          "שבועות",
        quarters:       "רבעונים",
        years:          "שנים",

        units:          "יחידות",
        thousands:      "אלפים",
        millions:       "מיליונים",

        actual:         "בפועל",
        planned:        "מתוכנן",

        group:          "קבוצה",
        quantity:       "כמות",
        price:          "מחיר",
        revenue:        "הכנסות",
        share:          "נתח",
        initial:        "ראשוני",
        change:         "Δ",
        changePct:      "%",

        activityName:   "סוג פעילות",
        groupCount:     "קבוצות",
        singleFactor:   "חד-גורמי",

        revenueBy:      "הכנסות לפי פעילויות",
        revenueOf:      "הכנסות",
        by:             "לפי",

        total:          "סה״כ",
        totalRevenue:   "סה״כ הכנסות",
        grandTotal:     "סה״כ כולל",

        analysis:       "ניתוח גורמים",
        factorQty:      "השפעת נפח",
        factorPrice:    "השפעת מחיר",
    }
};

export function t(k){
    const lang = Store.get("language") || "en";
    return (Dict[lang] && Dict[lang][k]) ?? (Dict.en[k] ?? k);
}

export function applyDir(){
    const lang = Store.get("language");
    document.body.dir = (lang === "he") ? "rtl" : "ltr";
}
