export const Store = {

    state:{
        groups:[],
        groupCount:5,
        language:"en"
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
        this.listeners.forEach(fn => fn());
    }
};
