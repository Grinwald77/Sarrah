export const Store = {

    state: (() => {
        let saved = localStorage.getItem("bi_state_v4");
        if(saved){
            try{
                const parsed = JSON.parse(saved);
                parsed.built = false;   // always reset built on page load
                return parsed;
            }catch(e){}
        }
        return {
            activities:    [],
            activityCount: 2,
            built:         false,   // always false on fresh page load

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

    // Two listener lists — lets analysis subscribe separately from table
    _listeners:         [],
    _analysisListeners: [],

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

    setActivity(idx, patch){
        let acts = [...this.state.activities];
        acts[idx] = { ...acts[idx], ...patch };
        this.state.activities = acts;
        this._save();
        this.emit();
    },

    // Used by _flushSilent — saves data + notifies ONLY analysis, not table
    // Prevents table re-render on every keystroke
    flushNotifyAnalysis(){
        this._save();
        this._analysisListeners.forEach(fn => fn(this.state));
    },

    _save(){
        try{ localStorage.setItem("bi_state_v4", JSON.stringify(this.state)); }catch(e){}
    },

    subscribe(fn){
        this._listeners.push(fn);
    },

    subscribeAnalysis(fn){
        this._analysisListeners.push(fn);
    },

    emit(){
        this._listeners.forEach(fn => fn(this.state));
        this._analysisListeners.forEach(fn => fn(this.state));
    }
};
