export const Store = {

    state:{
        groups:[],
        groupCount:5,

        language:"en",

        // 💰 валюта и масштаб
        currency:"ILS",
        scale:"units",

        // 📊 тип периода по умолчанию
        periodType:"quarters",

        // 📅 периоды (дефолт Q1 2026)
        periods:{
            period0:"Q1",
            period1:"Q1",

            year0:"2026",
            year1:"2026",

            type0:"Actual",
            type1:"Actual"
        }
    },

    listeners:[],

    set(key,val){
        this.state[key] = val;
        this.emit();
    },

    get(key){
        return this.state[key];
    },

    subscribe(fn){
        this.listeners.push(fn);
    },

    emit(){
        this.listeners.forEach(fn=>fn(this.state));
    }
};
