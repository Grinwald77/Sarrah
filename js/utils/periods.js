export const Periods = {

    generate(type){

        let list = [];

        // ГОДЫ
        if(type === "years"){
            for(let y=2016; y<=2027; y++){
                list.push(String(y));
            }
        }

        // МЕСЯЦЫ
        if(type === "months"){
            const m = ["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."];
            for(let y=2016; y<=2027; y++){
                for(let i=0;i<12;i++){
                    list.push(m[i]+" "+y);
                }
            }
        }

        // НЕДЕЛИ
        if(type === "weeks"){
            for(let y=2016; y<=2027; y++){
                for(let w=1; w<=52; w++){
                    list.push("Week "+w+" "+y);
                }
            }
        }

        // КВАРТАЛЫ
        if(type === "quarters"){
            for(let y=2016; y<=2027; y++){
                for(let q=1; q<=4; q++){
                    list.push("Q"+q+" "+y);
                }
            }
        }

        return list;
    }
};
