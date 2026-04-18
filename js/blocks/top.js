import { Store } from '../store.js';
import { t, applyDir } from '../i18n.js';

export const TopBlock = {

    init(){
        this.render();
    },

    render(){

        const state = Store.state;

        document.getElementById("topBlock").innerHTML = `
        <div class="top-bar">

            <div class="logo-block">
                <canvas id="sarrah-murmuration" width="68" height="68"></canvas>
                <div class="logo-text">
                    <div class="logo-main">Sarrah BI Model:</div>
                    <div class="logo-sub">Revenue &amp; Cost Factor Analysis</div>
                </div>
            </div>

            <div class="top-group">
                <span class="label">${t("language")}</span>
                <select id="lang">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                    <option value="he">HE</option>
                </select>

                <span class="label">${t("activityCount")}</span>
                <input id="activityCount" type="number" min="1" max="5" value="${state.activityCount}" style="width:44px">

                <span class="label">${t("periodType")}</span>
                <select id="periodType">
                    <option value="months">${t("months")}</option>
                    <option value="weeks">${t("weeks")}</option>
                    <option value="quarters">${t("quarters")}</option>
                    <option value="years">${t("years")}</option>
               </select>

                <span class="label">${t("currency")}</span>
                <select id="currency">
                    <option value="USD">$</option>
                    <option value="EUR">€</option>
                    <option value="ILS">₪</option>
                    <option value="RUB">₽</option>
                </select>

                <span class="label">${t("scale")}</span>
                <select id="scale">
                    <option value="units">${t("units")}</option>
                    <option value="thousands">${t("thousands")}</option>
                    <option value="millions">${t("millions")}</option>
                </select>
            </div>

            <div class="top-group">
                <span class="label">${t("source")}</span>
                <select id="period0"></select>
                <select id="year0"></select>
                <select id="type0">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <div class="top-group">
                <span class="label">${t("current")}</span>
                <select id="period1"></select>
                <select id="year1"></select>
                <select id="type1">
                    <option value="Actual">${t("actual")}</option>
                    <option value="Planned">${t("planned")}</option>
                </select>
            </div>

            <div class="top-group">
                <button id="buildBtn" class="build-btn">${t("build")}</button>
                <button id="testBtn" class="test-btn">${t("test")}</button>
            </div>

        </div>
        `;

        this.bind();
        this.fillYears();
        this._startMurmuration();

        document.getElementById("periodType").value = state.periodType || "quarters";
        this.fillPeriods();

        const p = state.periods || {};
        document.getElementById("year0").value  = p.year0  || "2026";
        document.getElementById("year1").value  = p.year1  || "2026";
        if(p.period0) document.getElementById("period0").value = p.period0;
        if(p.period1) document.getElementById("period1").value = p.period1;
        document.getElementById("type0").value  = p.type0  || "Actual";
        document.getElementById("type1").value  = p.type1  || "Actual";

        this.addNavigation();

        document.getElementById("lang").value     = state.language;
        document.getElementById("currency").value = state.currency || "ILS";
        document.getElementById("scale").value    = state.scale    || "units";
    },


    _startMurmuration(){
        const canvas = document.getElementById('sarrah-murmuration');
        if(!canvas || canvas._murInit) return;
        canvas._murInit = true;
        const x = canvas.getContext('2d');
        const W=68,H=68,CX=34,CY=34;
        const SAFE=Math.min(W,H)*0.5*0.90;
        const MAX_PERSP=1.4/(1.4-0.97*0.6);
        const MAX_SZ=2.3*MAX_PERSP*1.1;
        const R=(SAFE-MAX_SZ)*0.78;
        const FORM_AMP=0.32;
        const N=600;
        const orbs=[];
        const PHI=Math.PI*(3-Math.sqrt(5));
        for(let i=0;i<N;i++){
            const yN=1-(i/(N-1))*2;
            const rad=Math.sqrt(1-yN*yN);
            const th=PHI*i;
            const rr=(0.30+Math.pow(Math.random(),0.5)*0.67);
            orbs.push({bx:Math.cos(th)*rad*rr,by:yN*rr,bz:Math.sin(th)*rad*rr,
                cph:Math.random()*Math.PI*2,sz:0.8+Math.random()*0.7,
                spark:0,sparkCool:Math.random()*300});
        }
        function hsl(h,s,l){
            h=((h%1)+1)%1;
            const a=s*Math.min(l,1-l);
            const f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
            return [f(0)*255|0,f(8)*255|0,f(4)*255|0];
        }
        let t=0,rotY=0;
        function formDeform(nx,ny,nz,t){
            const a=Math.sin(nx*1.5+ny*0.9-nz*1.1+t*0.7);
            const b=Math.sin(nx*0.8-ny*1.6+nz*0.6+t*0.55+1.7);
            const c2=Math.sin(-nx*1.2+ny*0.7+nz*1.4+t*0.85+3.3);
            const d=Math.sin(nx*2.1+ny*1.8+nz*1.5+t*0.45+5.1);
            return 1+FORM_AMP*(a*0.45+b*0.35+c2*0.30+d*0.20);
        }
        function frame(){
            if(!document.getElementById('sarrah-murmuration')) return;
            t+=0.018; rotY+=0.0035;
            x.fillStyle='rgba(0,0,0,0.28)';
            x.fillRect(0,0,W,H);
            const cosY=Math.cos(rotY),sinY=Math.sin(rotY);
            const cosX=Math.cos(rotY*0.5),sinX=Math.sin(rotY*0.5);
            const draw=[];
            const gb=1+Math.sin(t*0.35)*0.04;
            for(let i=0;i<N;i++){
                const o=orbs[i];
                const t1=t*1.3,t2=t*1.0,t3=t*1.6;
                let dx=Math.sin(t1+o.by*2.8+o.bz*2.1)*0.13+Math.sin(t2*1.7+o.bz*2.6)*0.08;
                let dy=Math.cos(t1*1.1+o.bx*2.6+o.bz*2.3)*0.13+Math.sin(t3+o.bx*2.2)*0.08;
                let dz=Math.sin(t2*1.2+o.bx*3.0+o.by*2.0)*0.13+Math.cos(t1*1.3+o.by*2.4)*0.08;
                let nx=o.bx+dx,ny=o.by+dy,nz=o.bz+dz;
                const len=Math.sqrt(nx*nx+ny*ny+nz*nz);
                if(len>0.001){
                    const ux=nx/len,uy=ny/len,uz=nz/len;
                    const sr=formDeform(ux,uy,uz,t)*gb;
                    const ml=sr*0.97;
                    if(len>ml){const k=ml/len;nx*=k;ny*=k;nz*=k;}
                }
                let rx1=nx*cosY+nz*sinY;
                let rz1=-nx*sinY+nz*cosY;
                let ry1=ny*cosX-rz1*sinX;
                let rz2=ny*sinX+rz1*cosX;
                const persp=1.4/(1.4-rz2*0.6);
                let sx=CX+rx1*R*persp,sy=CY+ry1*R*persp;
                const wave=Math.sin(o.bx*2.4+o.by*2.0+o.bz*2.2-t*2.2+o.cph*0.3);
                const w=(wave+1)*0.5;
                let hue=0.62+w*0.44,sat=0.92,lig=0.48+w*0.13;
                o.sparkCool--;
                if(o.sparkCool<0&&Math.random()<0.002){o.spark=1;o.sparkCool=400+Math.random()*600;}
                if(o.spark>0.01){hue=hue*(1-o.spark*0.85)+0.13*o.spark*0.85;sat=1;lig+=o.spark*0.38;o.spark*=0.92;}
                const [rC,gC,bC]=hsl(hue,sat,Math.min(0.88,lig));
                const depth=(rz2+1)*0.5;
                const sz=o.sz*persp*(0.55+depth*0.55);
                const alpha=0.5+depth*0.5;
                const ddx=sx-CX,ddy=sy-CY,dist=Math.sqrt(ddx*ddx+ddy*ddy);
                const maxD=SAFE-sz;
                if(dist>maxD&&dist>0){const k=maxD/dist;sx=CX+ddx*k;sy=CY+ddy*k;}
                draw.push({sx,sy,sz,rC,gC,bC,alpha,depth,spark:o.spark});
            }
            draw.sort((a,b)=>a.depth-b.depth);
            for(let i=0;i<draw.length;i++){
                const d=draw[i];
                const g=x.createRadialGradient(d.sx,d.sy,0,d.sx,d.sy,d.sz);
                g.addColorStop(0,`rgba(${d.rC},${d.gC},${d.bC},${d.alpha})`);
                g.addColorStop(0.6,`rgba(${d.rC},${d.gC},${d.bC},${d.alpha*0.4})`);
                g.addColorStop(1,`rgba(${d.rC},${d.gC},${d.bC},0)`);
                x.fillStyle=g;
                x.beginPath();
                x.arc(d.sx,d.sy,d.sz,0,Math.PI*2);
                x.fill();
            }
            requestAnimationFrame(frame);
        }
        x.fillStyle='#000';
        x.fillRect(0,0,W,H);
        frame();
    },

    bind(){

        // BUILD — always resets all values, always 5 groups per activity
        document.getElementById("buildBtn").onclick = () => {

            let n = Math.min(5, Math.max(1, +document.getElementById("activityCount").value || 1));

            // Preserve structure (name, singleFactor) but RESET all numeric data
            let existing = Store.get("activities") || [];

            let activities = [];
            for(let i = 0; i < n; i++){
                let prev = existing[i];
                activities.push({
                    name:         prev?.name         || `${t("activityName")} ${i+1}`,
                    groupCount:   5,
                    singleFactor: prev?.singleFactor ?? false,
                    groups:       this._defaultGroups(5)   // always 5 fresh empty groups
                });
            }

            Store.set("activityCount", n);
            Store.set("built", true);
            Store.set("activities", activities);
        };

        // TEST
        document.getElementById("testBtn").onclick = () => {

            let activities = Store.get("activities");
            if(!activities || !activities.length) return;

            activities.forEach(act => {
                act.groups.forEach(g => {
                    if(act.singleFactor){
                        g.revenue0 = Math.round(Math.random()*900000 + 100000);
                        g.revenue1 = Math.round(Math.random()*900000 + 100000);
                    } else {
                        g.quantity0 = Math.floor(Math.random()*200) + 10;
                        g.quantity1 = Math.floor(Math.random()*200) + 10;
                        g.price0    = Math.round((Math.random()*9000 + 1000) / 10) * 10;
                        g.price1    = Math.round((Math.random()*9000 + 1000) / 10) * 10;
                    }
                });
            });

            Store.set("activities", activities);
        };

        // LANGUAGE
        document.getElementById("lang").onchange = (e) => {

            const ui = this._captureUI();
            Store.set("language", e.target.value);
            applyDir();
            this.render();
            this._restoreUI(ui);
        };

        // PERIOD TYPE
        document.getElementById("periodType").onchange = () => {
            this.fillPeriods();
            const val = document.getElementById("periodType").value;
            const patch = {
                period0: document.getElementById("period0").value,
                period1: document.getElementById("period1").value
            };
            if(!Store.get("built")){
                Store.state.periodType = val;
                Store.state.periods = { ...Store.state.periods, ...patch };
                Store._save();
            } else {
                Store.set("periodType", val);
                Store.setPeriods(patch);
            }
        };

        document.getElementById("currency").onchange = (e) => {
            if(!Store.get("built")){ Store.state.currency = e.target.value; Store._save(); }
            else Store.set("currency", e.target.value);
        };
        document.getElementById("scale").onchange = (e) => {
            if(!Store.get("built")){ Store.state.scale = e.target.value; Store._save(); }
            else Store.set("scale", e.target.value);
        };

        document.getElementById("activityCount").onchange = (e) => {
            // Just save the value — do NOT build. Build only on BUILD button.
            let n = Math.min(5, Math.max(1, +e.target.value || 1));
            e.target.value = n;
            Store.state.activityCount = n;   // silent, no emit
            try { localStorage.setItem("bi_state_v3", JSON.stringify(Store.state)); } catch(ex){}
        };

        const syncPeriods = () => {
            const patch = {
                period0: document.getElementById("period0").value,
                period1: document.getElementById("period1").value,
                year0:   document.getElementById("year0").value,
                year1:   document.getElementById("year1").value,
                type0:   document.getElementById("type0").value,
                type1:   document.getElementById("type1").value
            };
            if(!Store.get("built")){
                // Silent — just save, no emit, no render
                Store.state.periods = { ...Store.state.periods, ...patch };
                try { localStorage.setItem("bi_state_v3", JSON.stringify(Store.state)); } catch(e){}
            } else {
                Store.setPeriods(patch);
            }
        };

        document.getElementById("year0").onchange   = () => { this.fillPeriods(); syncPeriods(); };
        document.getElementById("year1").onchange   = () => { this.fillPeriods(); syncPeriods(); };
        document.getElementById("period0").onchange = syncPeriods;
        document.getElementById("period1").onchange = syncPeriods;
        document.getElementById("type0").onchange   = syncPeriods;
        document.getElementById("type1").onchange   = syncPeriods;
    },

    _defaultGroups(n=5){
        let groups = [];
        for(let i = 0; i < n; i++){
            groups.push({ name:`${t("group")} ${i+1}`, quantity0:0, quantity1:0, price0:0, price1:0, revenue0:0, revenue1:0 });
        }
        return groups;
    },

    _captureUI(){
        return {
            currency:   document.getElementById("currency")?.value,
            scale:      document.getElementById("scale")?.value,
            activityCount: document.getElementById("activityCount").value,
            periodType: document.getElementById("periodType").value,
            year0:      document.getElementById("year0").value,
            year1:      document.getElementById("year1").value,
            period0:    document.getElementById("period0").value,
            period1:    document.getElementById("period1").value,
            type0:      document.getElementById("type0").value,
            type1:      document.getElementById("type1").value
        };
    },

    _restoreUI(ui){
        document.getElementById("activityCount").value = ui.activityCount;
        document.getElementById("periodType").value    = ui.periodType;
        document.getElementById("year0").value         = ui.year0;
        document.getElementById("year1").value         = ui.year1;
        this.fillPeriods();
        document.getElementById("period0").value = ui.period0;
        document.getElementById("period1").value = ui.period1;
        document.getElementById("type0").value   = ui.type0;
        document.getElementById("type1").value   = ui.type1;
        if(ui.currency) document.getElementById("currency").value = ui.currency;
        if(ui.scale)    document.getElementById("scale").value    = ui.scale;
    },

    fillYears(){
        let html = "";
        for(let y = 2016; y <= 2027; y++) html += `<option>${y}</option>`;
        document.getElementById("year0").innerHTML = html;
        document.getElementById("year1").innerHTML = html;
        const p = Store.get("periods") || {};
        if(!p.year0) document.getElementById("year0").value = "2026";
        if(!p.year1) document.getElementById("year1").value = "2026";
    },

    fillPeriods(){

        const type = document.getElementById("periodType").value;
        const lang = Store.get("language");

        const months = {
            en:["Jan.","Feb.","Mar.","Apr.","May","Jun.","Jul.","Aug.","Sep.","Oct.","Nov.","Dec."],
            ru:["Янв.","Фев.","Мар.","Апр.","Май","Июн.","Июл.","Авг.","Сен.","Окт.","Ноя.","Дек."],
            he:["ינו׳","פבר׳","מרץ","אפר׳","מאי","יונ׳","יול׳","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"]
        };

        const period0 = document.getElementById("period0");
        const period1 = document.getElementById("period1");

        if(type === "years"){
            period0.innerHTML = ""; period1.innerHTML = "";
            period0.disabled = true; period1.disabled = true;
            return;
        }

        period0.disabled = false; period1.disabled = false;

        let list = [];
        if(type === "months")   list = months[lang] || months.en;
        if(type === "weeks")    list = Array.from({length:52}, (_,i) => `W${i+1}`);
        if(type === "quarters") list = ["Q1","Q2","Q3","Q4"];

        const prev0 = Store.get("periods")?.period0;
        const prev1 = Store.get("periods")?.period1;

        const html = list.map(x => `<option>${x}</option>`).join("");
        period0.innerHTML = html;
        period1.innerHTML = html;

        if(prev0) period0.value = prev0;
        if(prev1) period1.value = prev1;
    },

    addNavigation(){
        const elements = document.querySelectorAll("#topBlock input, #topBlock select");
        elements.forEach((el, i) => {
            el.addEventListener("keydown", e => {
                if(e.key === "Enter"){
                    e.preventDefault();
                    elements[i+1]?.focus();
                }
            });
        });
    }
};
