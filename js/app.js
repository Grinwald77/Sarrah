import { Store }         from './store.js';
import { TopBlock }      from './blocks/top.js';
import { TabsBlock }     from './blocks/tabs.js';
import { TableGeneral }  from './blocks/table-general.js';
import { TableBlock }    from './blocks/table.js';
import { AnalysisBlock } from './blocks/analysis.js';
import { applyDir }      from './i18n.js';

function init(){
    TopBlock.init();
    TabsBlock.init();
    Store.subscribe(() => {
        if(Store.get('branchCount') > 1 && Store.get('activeBranch') === -1){
            TableGeneral.render();
        }
    });
    TableBlock.init();
    AnalysisBlock.init();
    applyDir();
}

init();
