// ─────────────────────────────────────────────
//  Narrative — аналитическая записка
//  Детерминированный алгоритм на шаблонах
// ─────────────────────────────────────────────
import { Store } from '../store.js';

function fmt(v){
    return Math.abs(v).toLocaleString("ru-RU", {minimumFractionDigits:0, maximumFractionDigits:0});
}
function fmtSigned(v){
    return (v >= 0 ? "+" : "−") + fmt(v);
}
function pct(part, total){
    return total ? (part / Math.abs(total) * 100) : 0;
}
function fmtPct(v, total){
    const p = pct(v, total);
    return (v >= 0 ? "+" : "−") + Math.abs(p).toFixed(1) + "%";
}

// Направление изменения
function direction(v){
    if(v > 0) return "положительное";
    if(v < 0) return "отрицательное";
    return "нейтральное";
}
function moreOrLess(v){
    return v > 0 ? "больше" : v < 0 ? "меньше" : "столько же";
}
function grewOrFell(v){
    return v > 0 ? "увеличилась" : v < 0 ? "уменьшилась" : "не изменилась";
}
function sign(v){ return v >= 0 ? "+" : ""; }

// Словесное описание размера влияния
function magnitude(pctAbs){
    if(pctAbs >= 50) return "определяющее";
    if(pctAbs >= 20) return "существенное";
    if(pctAbs >= 10) return "значимое";
    if(pctAbs >= 5)  return "умеренное";
    return "незначительное";
}

// Шаблоны по типу эффекта
function narrativeFactor(key, value, dR, currency){
    const p    = pct(value, dR);
    const pAbs = Math.abs(p);
    const mag  = magnitude(pAbs);
    const dir  = direction(value);
    const cur  = currency;
    const val  = fmtSigned(value);
    const pp   = fmtPct(value, dR);

    const templates = {
        q: value >= 0
            ? `Эффект объёма оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Рост количества продаж обеспечил прирост выручки.`
            : `Эффект объёма оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Снижение объёма продаж привело к сокращению выручки.`,
        p: value >= 0
            ? `Эффект цены оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Рост средних цен положительно сказался на выручке.`
            : `Эффект цены оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Снижение средних цен оказало давление на выручку.`,
        d: value >= 0
            ? `Эффект скидок оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Снижение уровня скидок поддержало выручку.`
            : `Эффект скидок оказал ${mag} ${dir} влияние: ${val} ${cur} (${pp}). Увеличение скидок снизило нетто-выручку.`,
        s: value >= 0
            ? `Однофакторные виды деятельности обеспечили прирост выручки: ${val} ${cur} (${pp}).`
            : `Однофакторные виды деятельности снизили выручку: ${val} ${cur} (${pp}).`,
    };
    return templates[key] || `Фактор ${key}: ${val} ${cur} (${pp}).`;
}

// Генерация текста записки
export function generateNarrative(d, checkedIds, currency, periods){
    const cur = { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[currency] || currency;
    const p   = periods || {};
    const p0type   = p.type0 === "Planned" ? "Плановый" : "Фактический";
    const p1type   = p.type1 === "Planned" ? "Плановый" : "Фактический";
    const p0period = [p.period0, p.year0].filter(Boolean).join(" ");
    const p1period = [p.period1, p.year1].filter(Boolean).join(" ");
    const p0label  = [p0type, p0period].filter(Boolean).join(" ");
    const p1label  = [p1type, p1period].filter(Boolean).join(" ");

    const lines = [];

    // ── Вводная часть ──
    const dR   = d.R1 - d.R0;
    const dPct = d.R0 ? dR / d.R0 * 100 : 0;
    lines.push(`Выручка за период ${p1label} составила ${fmt(d.R1)} ${cur}, что на ${fmt(Math.abs(dR))} ${cur} (${Math.abs(dPct).toFixed(1)}%) ${moreOrLess(dR)} по сравнению с ${p0label} (${fmt(d.R0)} ${cur}). В целом выручка ${grewOrFell(dR)}.`);
    lines.push("");

    // ── Собираем выбранные факторы по типу ──
    const KEYS = ["q","p","d","s"];
    const NAMES = { q:"Эффект объёма", p:"Эффект цены", d:"Эффект скидок", s:"Однофакторные активности" };

    // Суммируем по выбранным id
    const selected = { q:0, p:0, d:0, s:0 };
    let hasSelected = false;

    d.branches.forEach((br, bi) => {
        br.activities.forEach((act, ai) => {
            act.groups.forEach((g, gi) => {
                const isSingle = act.singleFactor;
                ["q","p","d","s"].forEach(k => {
                    const id = `f_${k}_b${bi}_a${ai}_g${gi}`;
                    if(checkedIds.has(id)){
                        selected[k] += isSingle ? (g.s||0) : (g[k]||0);
                        hasSelected = true;
                    }
                });
            });
        });
    });

    // Только факторы с ненулевым влиянием среди выбранных
    const activeFactors = KEYS
        .filter(k => selected[k] !== 0)
        .sort((a,b) => Math.abs(selected[b]) - Math.abs(selected[a]));

    if(!activeFactors.length){
        lines.push("Факторы для анализа не выбраны.");
    } else {
        lines.push("Основные факторы изменения выручки:");
        lines.push("");
        activeFactors.forEach(k => {
            lines.push(narrativeFactor(k, selected[k], dR, cur));
        });
    }

    // ── По филиалам ──
    if(d.branches.length > 1){
        lines.push("");
        lines.push("─".repeat(40));
        lines.push("Детализация по филиалам:");

        d.branches.forEach((br, bi) => {
            const brName = br.name || `Филиал ${bi+1}`;
            const brDR   = br.R1 - br.R0;
            const brPct  = br.R0 ? brDR / br.R0 * 100 : 0;
            lines.push("");
            lines.push(`${brName}: выручка ${grewOrFell(brDR)} на ${fmt(Math.abs(brDR))} ${cur} (${fmtSigned(brDR)} ${cur}, ${sign(brDR)}${Math.abs(brPct).toFixed(1)}%).`);

            KEYS.forEach(k => {
                let brVal = 0;
                br.activities.forEach((act, ai) => {
                    act.groups.forEach((g, gi) => {
                        const id = `f_${k}_b${bi}_a${ai}_g${gi}`;
                        if(checkedIds.has(id)){
                            brVal += act.singleFactor ? (g.s||0) : (g[k]||0);
                        }
                    });
                });
                if(brVal !== 0){
                    lines.push(`  ${NAMES[k]}: ${fmtSigned(brVal)} ${cur} (${fmtPct(brVal, dR)})`);
                }
            });
        });
    }

    // ── Итог по выбранным ──
    const selectedTotal = KEYS.reduce((s,k) => s + selected[k], 0);
    const selectedPct   = d.R0 ? selectedTotal / d.R0 * 100 : 0;
    lines.push("");
    lines.push("─".repeat(40));
    lines.push(`Итого по выбранным факторам: ${fmtSigned(selectedTotal)} ${cur} (${sign(selectedPct)}${Math.abs(selectedPct).toFixed(1)}% от базовой выручки).`);

    if(Math.abs(selectedTotal - dR) > 1){
        const remainder = dR - selectedTotal;
        lines.push(`Прочие факторы (не выбраны): ${fmtSigned(remainder)} ${cur}.`);
    }

    return lines.join("\n");
}
