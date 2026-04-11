import { Store } from '../store.js';

export const Periods = {

    generate(type){

        let list = [];
        const lang = Store.get("language") || "en";

        const monthsDict = {
            en:["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."],
            ru:["Янв.","Фев.","Мар.","Апр.","Май","Июн.","Июл.","Авг.","Сен.","Окт.","Ноя.","Дек."],
            he:["ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"]
        };

        const m = monthsDict[lang] || monthsDict.en;

        // YEARS
        if(type === "years"){
            for(let y=2016; y<=2027; y++){
                list.push(String(y));
            }
        }

        // MONTHS
        if(type === "months"){
            for(let y=2016; y<=2027; y++){
                for(let i=0;i<12;i++){
                    list.push(m[i] + " " + y);
                }
            }
        }

        // WEEKS
        if(type === "weeks"){
            for(let y=2016; y<=2027; y++){
                for(let w=1; w<=52; w++){
                    list.push("W" + w + " " + y);
                }
            }
        }

        // QUARTERS
        if(type === "quarters"){
            for(let y=2016; y<=2027; y++){
                for(let q=1; q<=4; q++){
                    list.push("Q" + q + " " + y);
                }
            }
        }

        return list;
    }
};
