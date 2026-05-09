// ─────────────────────────────────────────────
//  Narrative — аналитическая записка
//  Детерминированный алгоритм на шаблонах
// ─────────────────────────────────────────────

function splitSentences(text){
    return text.replace(/([.!?]) ([А-ЯA-Z])/g, "$1\n$2");
}

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
    const p = Math.abs(pct(v, total));
    return (v >= 0 ? "+" : "−") + p.toFixed(1) + "%";
}

// Преобразует период для записки: К1 → 1 кв., Q1 → 1 кв., W1 → 1 нед., Jan. → январе и т.д.
function formatPeriodForText(period, year){
    if(!period) return year ? year + " года" : "";

    // Кварталы: К1, К2, Q1, Q2, T1 и т.д.
    const qMatch = period.match(/^[КQT](\d)$/);
    if(qMatch) return `${qMatch[1]} кв. ${year} года`;

    // Недели: Н1, W1, S1
    const wMatch = period.match(/^[НWS](\d+)$/);
    if(wMatch) return `${wMatch[1]} нед. ${year} года`;

    // Месяцы — русские сокращения в родительный падеж
    const monthMap = {
        "Янв.":"январе", "Фев.":"феврале", "Мар.":"марте", "Апр.":"апреле",
        "Май":"мае", "Июн.":"июне", "Июл.":"июле", "Авг.":"августе",
        "Сен.":"сентябре", "Окт.":"октябре", "Ноя.":"ноябре", "Дек.":"декабре",
        "Jan.":"январе", "Feb.":"феврале", "Mar.":"марте", "Apr.":"апреле",
        "May":"мае", "Jun.":"июне", "Jul.":"июле", "Aug.":"августе",
        "Sep.":"сентябре", "Oct.":"октябре", "Nov.":"ноябре", "Dec.":"декабре",
    };
    if(monthMap[period]) return `${monthMap[period]} ${year} года`;

    return `${period} ${year || ""}`.trim();
}

// Короткое название периода: К1 → 1 кв. 2026
function formatPeriodShort(period, year){
    if(!period) return year || "";
    const qMatch = period.match(/^[КQT](\d)$/);
    if(qMatch) return `${qMatch[1]} кв. ${year}`;
    const wMatch = period.match(/^[НWS](\d+)$/);
    if(wMatch) return `${wMatch[1]} нед. ${year}`;
    const monthMapShort = {
        "Янв.":"янв.", "Фев.":"фев.", "Мар.":"мар.", "Апр.":"апр.",
        "Май":"мае", "Июн.":"июн.", "Июл.":"июл.", "Авг.":"авг.",
        "Сен.":"сен.", "Окт.":"окт.", "Ноя.":"ноя.", "Дек.":"дек.",
        "Jan.":"янв.", "Feb.":"фев.", "Mar.":"мар.", "Apr.":"апр.",
        "May":"май", "Jun.":"июн.", "Jul.":"июл.", "Aug.":"авг.",
        "Sep.":"сен.", "Oct.":"окт.", "Nov.":"ноя.", "Dec.":"дек.",
    };
    if(monthMapShort[period]) return `${monthMapShort[period]} ${year}`;
    return `${period} ${year || ""}`.trim();
}

// Тип периода для текста
function periodType(type){
    return type === "Planned" ? "плановый" : "фактический";
}
function periodTypeShort(type){
    return type === "Planned" ? "план" : "факт";
}

// Размер влияния
function magnitude(pctAbs){
    if(pctAbs >= 60) return "решающее";
    if(pctAbs >= 30) return "значительное";
    if(pctAbs >= 15) return "существенное";
    if(pctAbs >= 5)  return "умеренное";
    return "незначительное";
}

// Шаблоны для каждого фактора
function factorText(key, value, dR, cur, rank){
    const p    = pct(value, dR);
    const pAbs = Math.abs(p);
    const mag  = magnitude(pAbs);
    const val  = fmt(value);
    const pp   = Math.abs(p).toFixed(1);
    const isMain = rank === 0;

    const templates = {
        q: {
            pos: isMain
                ? `Ключевым драйвером роста выручки стало увеличение объёма продаж — +${val} ${cur} (+${pp}% от общего изменения). Рост количества реализованных единиц обеспечил основной прирост результата.`
                : `Рост объёма продаж дополнительно поддержал выручку на ${val} ${cur} (+${pp}%).`,
            neg: isMain
                ? `Главным фактором снижения выручки стало падение объёма продаж — −${val} ${cur} (−${pp}% от общего изменения). Сокращение количества реализованных единиц оказало ${mag} давление на результат.`
                : `Снижение объёма продаж дополнительно сократило выручку на ${val} ${cur} (−${pp}%).`,
        },
        p: {
            pos: isMain
                ? `Рост средних цен стал основным источником увеличения выручки — +${val} ${cur} (+${pp}%). Ценовая динамика оказала ${mag} положительный эффект.`
                : `Повышение средних цен дополнительно увеличило выручку на ${val} ${cur} (+${pp}%).`,
            neg: isMain
                ? `Снижение средних цен оказало ${mag} негативное влияние на выручку — −${val} ${cur} (−${pp}%). Ценовое давление стало ключевым сдерживающим фактором.`
                : `Снижение средних цен уменьшило выручку на ${val} ${cur} (−${pp}%).`,
        },
        d: {
            pos: isMain
                ? `Сокращение скидок обеспечило ${mag} прирост нетто-выручки — +${val} ${cur} (+${pp}%). Снижение дисконта положительно отразилось на финансовом результате.`
                : `Снижение уровня скидок дополнительно поддержало выручку на ${val} ${cur} (+${pp}%).`,
            neg: isMain
                ? `Рост скидок оказал ${mag} отрицательное влияние на нетто-выручку — −${val} ${cur} (−${pp}%). Увеличение дисконта существенно снизило финансовый результат.`
                : `Рост скидок сократил нетто-выручку на ${val} ${cur} (−${pp}%).`,
        },
        s: {
            pos: `Прямое изменение выручки по однофакторным видам деятельности составило +${val} ${cur} (+${pp}%).`,
            neg: `Снижение выручки по однофакторным видам деятельности составило −${val} ${cur} (−${pp}%).`,
        },
    };

    const t = templates[key];
    if(!t) return `Фактор ${key}: ${fmtSigned(value)} ${cur} (${pp}%).`;
    return splitSentences(value >= 0 ? t.pos : t.neg);
}

// Анализ долей выручки
function shareAnalysis(d, cur){
    if(d.R0 === 0 && d.R1 === 0) return "";

    // Collect all groups with their revenues
    const items = [];
    d.branches.forEach((br, bi) => {
        const bName = d.branches.length > 1 ? br.name || `Филиал ${bi+1}` : null;
        br.activities.forEach(act => {
            act.groups.forEach(g => {
                const r0 = act.singleFactor ? (g.r0||0) : (g.r0||0);
                const r1 = act.singleFactor ? (g.r1||0) : (g.r1||0);
                if(r0 === 0 && r1 === 0) return;
                const label = [bName, act.name, g.name].filter(Boolean).join(" / ");
                items.push({ label, r0, r1 });
            });
        });
    });

    if(!items.length) return "";

    const R0 = d.R0, R1 = d.R1;
    if(R0 === 0 || R1 === 0) return "";

    // Sort by r1 share descending
    items.sort((a,b) => b.r1/R1 - a.r1/R1);

    const lines = [];
    lines.push("Структура выручки:");
    lines.push("");

    // Largest contributor
    const top = items[0];
    const topS1 = (top.r1/R1*100).toFixed(1);
    const topS0 = (top.r0/R0*100).toFixed(1);
    const topDelta = (top.r1/R1 - top.r0/R0)*100;
    if(Math.abs(topDelta) < 1){
        lines.push(`Наибольший вклад в выручку вносит ${top.label} — ${topS1}% в отчётном периоде, практически без изменений по сравнению с базовым (${topS0}%).`);
    } else if(topDelta > 0){
        lines.push(`Наибольший вклад в выручку вносит ${top.label} — ${topS1}% в отчётном периоде, что на ${Math.abs(topDelta).toFixed(1)} п.п. выше базового уровня (${topS0}%). Позиции этой группы усилились.`);
    } else {
        lines.push(`Наибольший вклад в выручку вносит ${top.label} — ${topS1}% в отчётном периоде, хотя доля снизилась на ${Math.abs(topDelta).toFixed(1)} п.п. по сравнению с базовым (${topS0}%).`);
    }

    // Biggest change
    const sorted = [...items].sort((a,b) => Math.abs(b.r1/R1 - b.r0/R0) - Math.abs(a.r1/R1 - a.r0/R0));
    const bigChange = sorted[0];
    if(bigChange !== top){
        const bc1 = (bigChange.r1/R1*100).toFixed(1);
        const bc0 = (bigChange.r0/R0*100).toFixed(1);
        const bcd = (bigChange.r1/R1 - bigChange.r0/R0)*100;
        if(bcd > 0.5){
            lines.push(`Наиболее заметно выросла доля ${bigChange.label} — с ${bc0}% до ${bc1}% (+${bcd.toFixed(1)} п.п.), что свидетельствует об усилении её вклада в общий результат.`);
        } else if(bcd < -0.5){
            lines.push(`Наиболее заметно сократилась доля ${bigChange.label} — с ${bc0}% до ${bc1}% (${bcd.toFixed(1)} п.п.), что указывает на снижение её значимости в структуре выручки.`);
        }
    }

    // Others — brief
    const others = items.slice(1).filter(it => it !== bigChange);
    if(others.length){
        const stable = others.filter(it => Math.abs(it.r1/R1 - it.r0/R0)*100 < 1);
        const grew   = others.filter(it => (it.r1/R1 - it.r0/R0)*100 >= 1);
        const fell   = others.filter(it => (it.r1/R1 - it.r0/R0)*100 <= -1);

        if(grew.length){
            const names = grew.map(it => `${it.label} (+${((it.r1/R1 - it.r0/R0)*100).toFixed(1)} п.п.)`).join(", ");
            lines.push(`Долю в структуре выручки нарастили: ${names}.`);
        }
        if(fell.length){
            const names = fell.map(it => `${it.label} (${((it.r1/R1 - it.r0/R0)*100).toFixed(1)} п.п.)`).join(", ");
            lines.push(`Долю в структуре выручки утратили: ${names}.`);
        }
        if(stable.length && stable.length <= 3){
            const names = stable.map(it => it.label).join(", ");
            lines.push(`Без существенных изменений в структуре: ${names}.`);
        }
    }

    return lines.join("\n");
}

export function generateNarrative(d, checkedIds, currency, periods){
    const cur  = { USD:"$", EUR:"€", ILS:"₪", RUB:"₽" }[currency] || currency;
    const p    = periods || {};
    const p0short = formatPeriodShort(p.period0, p.year0);
    const p1short = formatPeriodShort(p.period1, p.year1);
    const p0in    = formatPeriodForText(p.period0, p.year0);
    const p1in    = formatPeriodForText(p.period1, p.year1);
    const p0type  = periodType(p.type0);
    const p1type  = periodType(p.type1);
    const p0sh    = periodTypeShort(p.type0);
    const p1sh    = periodTypeShort(p.type1);

    const lines = [];
    const dR   = d.R1 - d.R0;
    const dPct = d.R0 ? Math.abs(dR / d.R0 * 100) : 0;
    const grew = dR > 0;
    const fell = dR < 0;

    // ── Вводная часть ──
    if(grew){
        lines.push(`По итогам ${p1short} (${p1sh}) выручка составила ${fmt(d.R1)} ${cur} — на ${fmt(dR)} ${cur} или ${dPct.toFixed(1)}% выше ${p0type} показателя ${p0short} (${fmt(d.R0)} ${cur}).`);
    } else if(fell){
        lines.push(`По итогам ${p1short} (${p1sh}) выручка составила ${fmt(d.R1)} ${cur} — на ${fmt(Math.abs(dR))} ${cur} или ${dPct.toFixed(1)}% ниже ${p0type} показателя ${p0short} (${fmt(d.R0)} ${cur}).`);
    } else {
        lines.push(`По итогам ${p1short} (${p1sh}) выручка составила ${fmt(d.R1)} ${cur} — на уровне ${p0type} показателя ${p0short}.`);
    }
    lines.push("");

    // ── Собираем выбранные факторы ──
    const KEYS = ["q","p","d","s"];
    const NAMES = { q:"объёма продаж", p:"средних цен", d:"скидок", s:"однофакторных активностей" };
    const selected = { q:0, p:0, d:0, s:0 };

    d.branches.forEach((br, bi) => {
        br.activities.forEach((act, ai) => {
            act.groups.forEach((g, gi) => {
                const isSingle = act.singleFactor;
                KEYS.forEach(k => {
                    const id = `f_${k}_b${bi}_a${ai}_g${gi}`;
                    if(checkedIds.has(id)){
                        selected[k] += isSingle ? (g.s||0) : (g[k]||0);
                    }
                });
            });
        });
    });

    const activeFactors = KEYS
        .filter(k => selected[k] !== 0)
        .sort((a,b) => Math.abs(selected[b]) - Math.abs(selected[a]));

    if(!activeFactors.length){
        lines.push("Для формирования записки выберите факторы в таблице анализа.");
    } else {
        lines.push(grew ? "Рост выручки обусловлен следующими факторами:" : fell ? "Снижение выручки обусловлено следующими факторами:" : "Факторы изменения выручки:");
        lines.push("");
        activeFactors.forEach((k, i) => {
            lines.push(factorText(k, selected[k], dR, cur, i));
        });
    }

    // ── По филиалам ──
    if(d.branches.length > 1){
        lines.push("");
        lines.push("─".repeat(48));
        lines.push("Детализация по филиалам:");

        d.branches.forEach((br, bi) => {
            const bName = br.name || `Филиал ${bi+1}`;
            const bDR   = br.R1 - br.R0;
            const bPct  = br.R0 ? Math.abs(bDR / br.R0 * 100) : 0;
            const bGrew = bDR > 0;
            lines.push("");
            if(bGrew){
                lines.push(`${bName}: выручка выросла на ${fmt(bDR)} ${cur} (+${bPct.toFixed(1)}%) — с ${fmt(br.R0)} до ${fmt(br.R1)} ${cur}.`);
            } else if(bDR < 0){
                lines.push(`${bName}: выручка снизилась на ${fmt(Math.abs(bDR))} ${cur} (−${bPct.toFixed(1)}%) — с ${fmt(br.R0)} до ${fmt(br.R1)} ${cur}.`);
            } else {
                lines.push(`${bName}: выручка осталась на уровне ${fmt(br.R1)} ${cur}.`);
            }

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
                    const kNames = { q:"Объём", p:"Цена", d:"Скидки", s:"Прямая выручка" };
                    lines.push(`  ${kNames[k]}: ${fmtSigned(brVal)} ${cur}`);
                }
            });
        });
    }

    // ── Анализ долей ──
    const shareText = shareAnalysis(d, cur);
    if(shareText){
        lines.push("");
        lines.push("─".repeat(48));
        lines.push(shareText);
    }

    // ── Итог ──
    const selectedTotal = KEYS.reduce((s,k) => s + selected[k], 0);
    const selectedPct   = d.R0 ? Math.abs(selectedTotal / d.R0 * 100) : 0;
    const remainder     = dR - selectedTotal;

    lines.push("");
    lines.push("─".repeat(48));
    if(activeFactors.length){
        lines.push(`Суммарный эффект выбранных факторов: ${fmtSigned(selectedTotal)} ${cur} (${selectedPct.toFixed(1)}% от базовой выручки).`);
        if(Math.abs(remainder) > 1){
            lines.push(`Прочие факторы (не включены в анализ): ${fmtSigned(remainder)} ${cur}.`);
        }
    }

    return lines.join("\n");
}
