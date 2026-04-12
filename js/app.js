console.log("APP JS START");

import { TopBlock } from './blocks/top.js';
import { TopSecondaryBlock } from './blocks/top-secondary.js';
import { TableBlock } from './blocks/table.js';
import { AnalysisBlock } from './blocks/analysis.js';
import { applyDir } from './i18n.js';

function init(){

    // ✅ store гарантированно создаётся ДО всех init блоков
    window.store = {
        activityName: '',
        groupCount: 5
    };

    TopBlock.init();
    TopSecondaryBlock.init();
    TableBlock.init();
    AnalysisBlock.init();

    applyDir();
}

init();
