export const Store = {

    state: (() => {
        let saved = localStorage.getItem("bi_state_v5");
        if(saved){
            try{
                const parsed = JSON.parse(saved);
                parsed.built = false;
                parsed.branches = [];
                parsed.activeBranch = 0;
                return parsed;
            }catch(e){}
        }
        return {
            // ── Branches ──
            branches:      [],       // [{ name, activities[] }]
            branchCount:   1,
            activeBranch:  0,        // 0 = Summary (when >1 branch), else branch index

            // ── Legacy single-branch compat ──
            activityCount: 2,
            built:         false,

            language:   "en",
            currency:   "ILS",
            scale:      "units",
            periodType: "quarters",

            periods:{
                period0: "Q1", period1: "Q1",
                year0:   "2026", year1:  "2026",
                type0:   "Actual", type1: "Actual"
            }
        };
    })(),

    _listeners:         [],
    _analysisListeners: [],

    set(key, val){
        this.state[key] = val;
        this._save();
        this.emit();
    },

    get(key){ return this.state[key]; },

    setPeriods(patch){
        this.state.periods = { ...this.state.periods, ...patch };
        this._save();
        this.emit();
    },

    // Set activity within active branch
    setActivity(idx, patch){
        const ab = this.state.activeBranch;
        const branches = this.state.branches;
        if(!branches[ab]) return;
        let acts = [...branches[ab].activities];
        acts[idx] = { ...acts[idx], ...patch };
        branches[ab].activities = acts;
        this._save();
        this.emit();
    },

    // Set branch name
    setBranchName(bi, name){
        if(this.state.branches[bi]){
            this.state.branches[bi].name = name;
            this._save();
            this.emit();
        }
    },

    // Switch active branch
    setActiveBranch(idx){
        this.state.activeBranch = idx;
        this._save();
        this.emit();
    },

    // Get activities for currently active branch (or empty for summary)
    getActivities(){
        const s = this.state;
        const branches = s.branches || [];
        if(!branches.length) return [];
        // Summary tab = index -1, shown when branchCount > 1
        if(s.branchCount > 1 && s.activeBranch === -1) return [];
        return branches[s.activeBranch]?.activities || [];
    },

    // Get all branches' activities for summary calculation
    getAllBranchActivities(){
        return (this.state.branches || []).map(b => b.activities || []);
    },

    flushNotifyAnalysis(){
        this._save();
        this._analysisListeners.forEach(fn => fn(this.state));
    },

    _save(){
        try{ localStorage.setItem("bi_state_v5", JSON.stringify(this.state)); }catch(e){}
    },

    subscribe(fn){ this._listeners.push(fn); },
    subscribeAnalysis(fn){ this._analysisListeners.push(fn); },

    emit(){
        this._listeners.forEach(fn => fn(this.state));
        this._analysisListeners.forEach(fn => fn(this.state));
    }
};
