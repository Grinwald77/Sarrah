import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';

export const TopBlock = {

    init(){ this.render(); },

    render(){

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar">
            <input id="groupCount" value="${Store.get("groupCount")}">

            <select id="lang">
                <option value="en">EN</option>
                <option value="ru">RU</option>
                <option value="he">HE</option>
            </select>

            <button id="build">${t("build")}</button>
        </div>
        `;

        this.bind();
    },

    bind(){

        document.getElementById("build").onclick=()=>{

            let n=+document.getElementById("groupCount").value||1;
            Store.set("groupCount",n);

            let groups=[];
            for(let i=0;i<n;i++){
                groups.push({
                    name:`${t("group")} ${i+1}`,
                    q0:0,q1:0,p0:0,p1:0
                });
            }

            Store.set("groups",groups);
        };

        document.getElementById("lang").onchange=(e)=>{
            Store.set("language",e.target.value);
            applyDir();
            this.render();
        };
    }
};
