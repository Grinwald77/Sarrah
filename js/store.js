export const Store = {
    state:{
        groups:[],
        groupCount:5,
        language:"en",

        currency:"USD",
        scale:"units",

        periods:{
            period0:"",
            period1:"",
            type0:"Actual",
            type1:"Actual"
        }
    },

    listeners:[],

    set(key,val){
        this.state[key]=val;
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
