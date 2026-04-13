export const Store = {

    state: (() => {

        let saved = localStorage.getItem("bi_state_v2");

        if(saved){
            try{ return JSON.parse(saved); }catch(e){}
        }

        return {
            activities: [],          // массив видов деятельности
            activityCount: 2,        // сколько видов деятельности (1-5)

            language:   "en",
            currency:   "ILS",
            scale:      "units",
            periodType: "quarters",

            periods:{
                period0: "Q1",
                period1: "Q1",
                year0:   "2026",
                year1:   "2026",
                type0:   "Actual",
                type1:   "Actual"
            }
        };

    })(),

    listeners:[],

    set(key, val){
        this.state[key] = val;
        this._save();
        this.emit();
    },

    get(key){
        return this.state[key];
    },

    setPeriods(patch){
        this.state.periods = { ...this.state.periods, ...patch };
        this._save();
        this.emit();
    },

    // обновить один вид деятельности (по индексу)
    setActivity(idx, patch){
        let acts = [...this.state.activities];
        acts[idx] = { ...acts[idx], ...patch };
        this.state.activities = acts;
        this._save();
        this.emit();
    },

    // обновить группы внутри вида деятельности
    setActivityGroups(idx, groups){
        let acts = [...this.state.activities];
        acts[idx] = { ...acts[idx], groups };
        this.state.activities = acts;
        this._save();
        this.emit();
    },

    _save(){
        localStorage.setItem("bi_state_v2", JSON.stringify(this.state));
    },

    subscribe(fn){
        this.listeners.push(fn);
    },

    emit(){
        this.listeners.forEach(fn => fn(this.state));
    }
};
