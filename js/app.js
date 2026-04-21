import { Store }         from './store.js';
import { TopBlock }      from './blocks/top.js';
import { TabsBlock }     from './blocks/tabs.js';
import { TableBlock }    from './blocks/table.js';
import { AnalysisBlock } from './blocks/analysis.js';
import { applyDir }      from './i18n.js';

function init(){
    TopBlock.init();
    TabsBlock.init();
    TableBlock.init();
    AnalysisBlock.init();
    applyDir();
}

init();
