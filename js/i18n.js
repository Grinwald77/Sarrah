import { Store } from './store.js';

export const Dict = {
    en:{ build:"Build", group:"Group", quantity:"Quantity", price:"Price", revenue:"Revenue", analysis:"Analysis" },
    ru:{ build:"Построить", group:"Группа", quantity:"Количество", price:"Цена", revenue:"Выручка", analysis:"Анализ" },
    he:{ build:"בנה", group:"קבוצה", quantity:"כמות", price:"מחיר", revenue:"הכנסות", analysis:"ניתוח" }
};

export function t(k){
    return Dict[Store.get("language")][k] || k;
}

export function applyDir(){
    let lang = Store.get("language");
    document.body.dir = (lang==="he") ? "rtl" : "ltr";
}
