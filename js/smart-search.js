"use strict";

var _match = function(pattern, text, offset, options) {
    var insertions = 0;
    var matchIndexes = [];
    var iPattern = 0;
    for (var iText = offset; iText < text.length; iText++) {
        if (text[iText] === pattern[iPattern]) {
            matchIndexes.push(iText);
            if (++iPattern === pattern.length) {
                return {
                    insertions: insertions,
                    matchIndexes: matchIndexes,
                };
            }
        } else if (matchIndexes.length) {
            insertions++;
            if (options.maxInsertions > -1 && insertions > options.maxInsertions) {
                return null;
            }
        }
    }
    return null;
};
var _find = function(pattern, text, options) {
    var match = false;
    var insertions = null;
    var matchIndexes = null;
    var iPattern = 0;
    if (options.caseSensitive === false) {
        pattern = pattern.toLowerCase();
        text = text.toLowerCase();
    }
    for (var iText = 0; iText < text.length; iText++) {
        if (text[iText] === pattern[iPattern]) {
            var res = _match(pattern, text, iText, options);
            if (res && (match === false || res.insertions <= insertions)) {
                if (match === false || res.insertions < insertions) {
                    match = true;
                    insertions = res.insertions;
                    matchIndexes = res.matchIndexes;
                } else {
                    matchIndexes = matchIndexes.concat(res.matchIndexes);
                }
            }
        }
    }
    if (match) {
        return {
            value: pattern,
            insertions: insertions,
            matchIndexes: matchIndexes,
        };
    }
    return null;
};

var _score = function(entryResults) {
    var patternsMinInsertions = {};
    var patternsMinMatchIndex = {};
    entryResults.forEach(function(fieldResults) {
        fieldResults.patterns.forEach(function(pattern) {
            if (
                patternsMinInsertions[pattern.value] === undefined ||
                pattern.insertions < patternsMinInsertions[pattern.value]
            ) {
                patternsMinInsertions[pattern.value] = pattern.insertions;
                patternsMinMatchIndex[pattern.value] = pattern.matchIndexes;
            }
        });
    });
    var minInsertions = 0;
    var minMatchIndex = [];
    for (var pattern in patternsMinInsertions) {
        if (patternsMinInsertions.hasOwnProperty(pattern)) {
            minInsertions += patternsMinInsertions[pattern];
            minMatchIndex = minMatchIndex.concat(patternsMinMatchIndex[pattern]);
        }
    }
    return minInsertions + minMatchIndex.sort()[0] / 1000;
};

var _getFieldString = function(entry, field) {
    var path = field;
    var current = entry;
    for (var i = 0; i < path.length; i++) {
        if (current[path[i]] === undefined) {
            return null;
        } else {
            current = current[path[i]];
        }
    }
    if (typeof current !== "string") {
        return null;
    }
    return current;
};

var _forEachObject = function(object, fn) {
    var _locals = [];

    (function _private(object) {
        for (var key in object) {
            _locals.push(key);
            if (typeof object[key] === "object") {
                _private(object[key]);
            } else {
                fn([].concat(_locals));
            }
            _locals.pop();
        }
    })(object);
};

var _search = function(entries, patterns, fields, options) {
    var results = [];
    entries.forEach(function(entry) {
        var match = false;
        var entryMatch = [];
        var entryResults = [];
        _forEachObject(fields, function(field) {
            var fieldString = _getFieldString(entry, field);
            if (fieldString === null) {
                return;
            }
            var fieldMatch = [];
            var fieldResults = { field: field.join("."), patterns: [] };
            patterns.forEach(function(pattern) {
                var res = _find(pattern, fieldString, options);
                if (res) {
                    fieldResults.patterns.push(res);
                    fieldMatch.push(pattern);
                    if (entryMatch.indexOf(pattern) === -1) {
                        entryMatch.push(pattern);
                    }
                }
            });
            if (fieldMatch.length === patterns.length) {
                entryResults.push(fieldResults);
                match = true;
            } else if (
                options.fieldMatching === false &&
                fieldResults.patterns.length > 0
            ) {
                entryResults.push(fieldResults);
            }
        });
        if (
            (options.fieldMatching === true && match === true) ||
            (options.fieldMatching === false && entryMatch.length === patterns.length)
        ) {
            results.push({
                entry: entry,
                info: entryResults,
                score: _score(entryResults),
            });
        }
    });
    return results;
};

var _buildOptions = function(options) {
    var defaultOptions = {
        caseSensitive: false,
        fieldMatching: false,
        maxInsertions: -1,
    };
    if (options === undefined) {
        return defaultOptions;
    }
    for (var option in defaultOptions) {
        if (options[option] !== undefined) {
            defaultOptions[option] = options[option];
        }
    }
    return defaultOptions;
};

var sanitizeArray = function(array, caseSensitive) {
    if (array === undefined || array.length === undefined || array.length === 0) {
        return [];
    }
    var values = {};
    var newArray = [];
    array.forEach(function(elem) {
        if (typeof elem !== "string") {
            return;
        }
        var element = !caseSensitive ? elem.toLowerCase() : elem;
        if (element && element in values === false) {
            values[element] = true;
            newArray.push(element);
        }
    });
    return newArray;
};

function smartSearch(entries, patterns, fields, options) {
    options = _buildOptions(options);
    patterns = sanitizeArray([].concat(patterns), options.caseSensitive);
    fields =
        typeof fields === "string" ? {
            [fields]: true,
        } :
        fields;
    if (entries.length === 0 || patterns.length === 0) {
        return;
    }
    var results = _search(entries, patterns, fields, options);
    results.sort(function(a, b) {
        return a.score - b.score;
    });
    return results;
}

function didYouMean(str, list, key) {
    if (!str) return null;

    // If we're running a case-insensitive search, smallify str.
    if (!didYouMean.caseSensitive) {
        str = str.toLowerCase();
    }

    // Calculate the initial value (the threshold) if present.
    var thresholdRelative =
        didYouMean.threshold === null ? null : didYouMean.threshold * str.length,
        thresholdAbsolute = didYouMean.thresholdAbsolute,
        winningVal;
    if (thresholdRelative !== null && thresholdAbsolute !== null)
        winningVal = Math.min(thresholdRelative, thresholdAbsolute);
    else if (thresholdRelative !== null) winningVal = thresholdRelative;
    else if (thresholdAbsolute !== null) winningVal = thresholdAbsolute;
    else winningVal = null;

    // Get the edit distance to each option. If the closest one is less than 40% (by default) of str's length,
    // then return it.
    var winner,
        candidate,
        testCandidate,
        val,
        i,
        len = list.length;
    for (i = 0; i < len; i++) {
        // Get item.
        candidate = list[i];
        // If there's a key, get the candidate value out of the object.
        if (key) {
            candidate = candidate[key];
        }
        // Gatekeep.
        if (!candidate) {
            continue;
        }
        // If we're running a case-insensitive search, smallify the candidate.
        if (!didYouMean.caseSensitive) {
            testCandidate = candidate.toLowerCase();
        } else {
            testCandidate = candidate;
        }
        // Get and compare edit distance.
        val = getEditDistance(str, testCandidate, winningVal);
        // If this value is smaller than our current winning value, OR if we have no winning val yet (i.e. the
        // threshold option is set to null, meaning the caller wants a match back no matter how bad it is), then
        // this is our new winner.
        if (winningVal === null || val < winningVal) {
            winningVal = val;
            // Set the winner to either the value or its object, depending on the returnWinningObject option.
            if (key && didYouMean.returnWinningObject) winner = list[i];
            else winner = candidate;
            // If we're returning the first match, return it now.
            if (didYouMean.returnFirstMatch) return winner;
        }
    }

    // If we have a winner, return it.
    return winner || didYouMean.nullResultValue;
}

// Set default options.
didYouMean.threshold = 0.4;
didYouMean.thresholdAbsolute = 20;
didYouMean.caseSensitive = false;
didYouMean.nullResultValue = null;
didYouMean.returnWinningObject = null;
didYouMean.returnFirstMatch = false;

// Expose.
// In node...
if (typeof module !== "undefined" && module.exports) {
    module.exports = didYouMean;
}
// Otherwise...
else {
    window.didYouMean = didYouMean;
}

var MAX_INT = Math.pow(2, 32) - 1; // We could probably go higher than this, but for practical reasons let's not.
function getEditDistance(a, b, max) {
    // Handle null or undefined max.
    max = max || max === 0 ? max : MAX_INT;

    var lena = a.length;
    var lenb = b.length;

    // Fast path - no A or B.
    if (lena === 0) return Math.min(max + 1, lenb);
    if (lenb === 0) return Math.min(max + 1, lena);

    // Fast path - length diff larger than max.
    if (Math.abs(lena - lenb) > max) return max + 1;

    // Slow path.
    var matrix = [],
        i,
        j,
        colMin,
        minJ,
        maxJ;

    // Set up the first row ([0, 1, 2, 3, etc]).
    for (i = 0; i <= lenb; i++) {
        matrix[i] = [i];
    }

    // Set up the first column (same).
    for (j = 0; j <= lena; j++) {
        matrix[0][j] = j;
    }

    // Loop over the rest of the columns.
    for (i = 1; i <= lenb; i++) {
        colMin = MAX_INT;
        minJ = 1;
        if (i > max) minJ = i - max;
        maxJ = lenb + 1;
        if (maxJ > max + i) maxJ = max + i;
        // Loop over the rest of the rows.
        for (j = 1; j <= lena; j++) {
            // If j is out of bounds, just put a large value in the slot.
            if (j < minJ || j > maxJ) {
                matrix[i][j] = max + 1;
            }

            // Otherwise do the normal Levenshtein thing.
            else {
                // If the characters are the same, there's no change in edit distance.
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                // Otherwise, see if we're substituting, inserting or deleting.
                else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Substitute
                        Math.min(
                            matrix[i][j - 1] + 1, // Insert
                            matrix[i - 1][j] + 1
                        )
                    ); // Delete
                }
            }

            // Either way, update colMin.
            if (matrix[i][j] < colMin) colMin = matrix[i][j];
        }

        // If this column's minimum is greater than the allowed maximum, there's no point
        // in going on with life.
        if (colMin > max) return max + 1;
    }
    // If we made it this far without running into the max, then return the final matrix value.
    return matrix[lenb][lena];
}

// if (typeof exports !== 'undefined') {
//     if (typeof module !== 'undefined' && module.exports) {
//         exports = module.exports = smartSearch;
//     }
//     exports.smartSearch = smartSearch;
// } else if (angular) {
//     angular
//         .module('ngSmartSearch', [])
//         .filter('smartSearch', function() {
//             return smartSearch;
//         });
// } else {
//     window.smartSearch = smartSearch;
// }

const data4 = [
    // _____________________________________Плиты электрические____________________________________________
    {
        link: "plita-elektricheskaya-epk-27n.html",
        title: "Плита электрическая ЭПК-27Н",
        desc: "Плита электрическая двухконфорочная без жарочного шкафа ЭПК-27Н настольная предназначена для тепловой обработки пищевых продуктов (варка, жарка, разогрев, в функциональных и других емкостях).",
        img: "https://abat.ru/upload/iblock/818/0up3i0f33z7ux5s0784f6v8gtye9uncm.jpg",
        price: 202500,
        code: "71000000107",
    },
	
    {
        link: "plita-elektricheskaya-epk-47n.html",
        title: "Плита электрическая ЭПК-47Н",
        desc: "Плита электрическая четырехконфорочная без жарочного шкафа ЭПК-47Н настольная предназначена для тепловой обработки пищевых продуктов (варка, жарка, разогрев, в функциональных и других емкостях).",
        img: "https://abat.ru/upload/iblock/359/xdlryy29fvakfyupct47e24dvn6qcpti.jpg",
        price: 326500,
        code: "71000000093",
    },
    {
        link: "plita-elektricheskaya-epk-47zhsh-krash.html",
        title: "Плита электрическая ЭПК-47ЖШ (краш)",
        desc: "Плита электрическая четырехконфорочная с жарочным шкафом ЭПК-47ЖШ предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелко штучных кулинарных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/cf7/pbftvt6vpynqbqh5ic8w53cpcm9us0ro.jpg",
        price: 522000,
        code: "71000000492",
    },
    {
        link: "plita-elektricheskaya-epk-47zhsh.html",
        title: "Плита электрическая ЭПК-47ЖШ",
        desc: "Плита электрическая четырехконфорочная с жарочным шкафом ЭПК-47ЖШ предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелко штучных кулинарных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/cf7/pbftvt6vpynqbqh5ic8w53cpcm9us0ro.jpg",
        price: 599500,
        code: "71000000259",
    },
    {
        link: "plita-elektricheskaya-epk-67p.html",
        title: "Плита электрическая ЭПК-67П",
        desc: "Плита электрическая шестиконфорочная ЭПК-67П на подставке предназначена для тепловой обработки пищевых продуктов (варка, жарка, разогрев, в функциональных и других емкостях).",
        img: "https://abat.ru/upload/iblock/3da/038h66078yxq7vck40gyoeeunxbgz0vn.jpg",
        price: 470000,
        code: "71000000939",
    },
    {
        link: "plita-elektricheskaya-ep-2zhsh.html",
        title: "Плита электрическая ЭП-2ЖШ",
        desc: "Плита электрическая двухконфорочная с жарочным шкафом ЭП-2ЖШ предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/c90/o9ltn2pkmeklzsqk8q6zbxkgy7vhz2pt.jpg",
        price: 412500,
        code: "71000000948",
    },
    {
        link: "plita-elektricheskaya-epk-48p.html",
        title: "Плита электрическая ЭПК-48П",
        desc: "Плита электрическая четырехконфорочная ЭПК-48П на подставке предназначена для тепловой обработки пищевых продуктов (варка, жарка, разогрев, в функциональных и других емкостях).",
        img: "https://abat.ru/upload/iblock/c48/c14bkei46edkyfl3ounkahhcxthgith7.jpg",
        price: 422500,
        code: "71000000949",
    },
    {
        link: "plita-elektricheskaya-epk-48zhsh-k-2-1.html",
        title: "Плита электрическая ЭПК-48ЖШ-К-2/1",
        desc: "Плита электрическая четырехконфорочная без жарочного шкафа ЭП-4П на подставке предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/910/kws9h75wf99g7xszaqci45ai3t5pfmbo.jpg",
        price: 739000,
        code: "71000000950",
    },
    {
        link: "plita-elektricheskaya-ep-4p.html",
        title: "Плита электрическая ЭП-4П",
        desc: "Плита электрическая четырехконфорочная с жарочным шкафом ЭПК-48ЖШ-К-2/1 с возможностью принудительной циркуляции воздуха (конвекцией) и увлажнением предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелко штучных кулинарных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/20c/8szllzrqf3qlkdcy1gga5k92eqhhsdcr.jpg",
        price: 361500,
        code: "71000000301",
    },
    {
        link: "plita-elektricheskaya-ep-4zhsh.html",
        title: "Плита электрическая ЭП-4ЖШ",
        desc: "Плита электрическая четырехконфорочная с жарочным шкафом ЭП-4ЖШ предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/c80/xyu9cznmn33nw9i587ft0u8s9gmkuqwd.jpg",
        price: 535500,
        code: "71000000944",
    },
    {
        link: "plita-elektricheskaya-ep-4zhsh-e.html",
        title: "Плита электрическая ЭП-4ЖШ-Э",
        desc: "Плита электрическая четырехконфорочная с эмалированным жарочным шкафом ЭП-4ЖШ-Э предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/c80/xyu9cznmn33nw9i587ft0u8s9gmkuqwd.jpg",
        price: 561500,
        code: "71000001944",
    },
    {
        link: "plita-elektricheskaya-ep-4zhsh-01.html",
        title: "Плита электрическая ЭП-4ЖШ-01",
        desc: "Плита электрическая четырехконфорочная с жарочным шкафом ЭП-4ЖШ-01 предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/c80/xyu9cznmn33nw9i587ft0u8s9gmkuqwd.jpg",
        price: 594500,
        code: "71000000953",
    },
    {
        link: "plita-elektricheskaya-ep-6p.html",
        title: "Плита электрическая ЭП-6П",
        desc: "Плита электрическая шестиконфорочная без жарочного шкафа ЭП-6П на подставке предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/fbe/d3iwap6kb1wrl8oykozm538s1d1sngq8.jpg",
        price: 485500,
        code: "71000000945",
    },
    {
        link: "plita-elektricheskaya-ep-6zhsh.html",
        title: "Плита электрическая ЭП-6ЖШ",
        desc: "Плита электрическая шестиконфорочная с жарочным шкафом ЭП-6ЖШ предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/efd/f6epr6f367962ud18tezhikyyu6i7x3s.jpg",
        price: 717000,
        code: "71000000942",
    },
    {
        link: "plita-elektricheskaya-ep-6zhsh-e.html",
        title: "Плита электрическая ЭП-6ЖШ-Э",
        desc: "Плита электрическая шестиконфорочная с эмалированным жарочным шкафом ЭП-6ЖШ-Э предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/efd/f6epr6f367962ud18tezhikyyu6i7x3s.jpg",
        price: 736500,
        code: "71000000942",
    },
    {
        link: "plita-elektricheskaya-ep-6zhsh-01.html",
        title: "Плита электрическая ЭП-6ЖШ-01",
        desc: "Плита электрическая шестиконфорочная с жарочным шкафом ЭП-6ЖШ-01 предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/efd/f6epr6f367962ud18tezhikyyu6i7x3s.jpg",
        price: 756000,
        code: "71000000956",
    },
    {
        link: "plita-elektricheskaya-epk-48zhsh-k-2-1.html",
        title: "Плита электрическая ЭП-6ЖШ-К-2/1",
        desc: "Плита электрическая шестиконфорочная с жарочным шкафом ЭП-6ЖШ-01 предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелко штучных кулинарных изделий.",
        img: "https://abat.ru/upload/iblock/efd/f6epr6f367962ud18tezhikyyu6i7x3s.jpg",
        price: 739000,
        code: "71000000950",
    },
    {
        link: "plita_812oh_01.html",
        title: "Плита электрическая 812ОН-01",
        desc: "Плита электрическая 812ОН-01 <b>с 2-мя конфорками и открытым стендом с полкой </b>  предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания и торговли. Модель оснащена полкой, на которой можно хранить посуду и кухонные принадлежности. ",
        img: "/images/products/plita/1.jpg",
        price: 38303,
        code: "8201",
    },
    {
        link: "plita_812oh.html",
        title: "Плита электрическая 812ОН ",
        desc: "Плита электрическая   812ОН <b>с 2-мя конфорками и открытым инвентарным шкафом </b> предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания и торговли. Модель оснащена открытым шкафом, в котором можно хранить посуду и кухонные принадлежности.  ",
        img: "/images/products/plita/2.jpg",
        price: 46327,
        code: "8202",
    },
    {
        link: "plita_722.html",
        title: "Плита электрическая 722ДН",
        desc: "Плита электрическая  722ДН <b>с 2-мя конфорками и нейтральным шкафом</b> предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания, пищевой промышленности и торговли. Плита оснащена нейтральным шкафом с дверцей, в котором можно хранить посуду и кухонные принадлежности.",
        img: "/images/products/plita/12.jpg",
        price: 46864,
        code: "8203",
    },
    {
        link: "plita_8040.html",
        title: "Плита электрическая 8040 ",
        desc: "Плита электрическая  8040 <b>с 4-мя конфорками и и открытым стендом с полкой </b>предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания, пищевой промышленности и торговли. Столешница и лицевая панель выполнены из нержавеющей стали AISI 304, боковые и задние стенки покрыты порошковой краской.",
        img: "/images/products/plita/4.jpg",
        price: 62425,
        code: "8204",
    },
    {
        link: "plita_812sh.html",
        title: "Плита электрическая 812Ш",
        desc: "Плита электрическая  812Ш <b>с 2-мя конфорками и духовым шкафом</b> предназначена для приготовления различных блюд в наплитной посуде, выпечки пирогов, пиццы и кексов на предприятиях общественного питания и торговли. Модель оснащена функцией автоматического поддержания в духовой камере заданного температурного режима.",
        img: "/images/products/plita/3.jpg",
        price: 67792,
        code: "8205",
    },
    {
        link: "plita_814oh.html",
        title: "Плита электрическая 814OH",
        desc: "Плита электрическая 814ОН <b>с 4-мя конфорками и открытым инвентарным шкафом</b> предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания и торговли. Модель оснащена открытым шкафом, в котором можно хранить посуду и кухонные принадлежности. ",
        img: "/images/products/plita/5.jpg",
        price: 77092,
        code: "8206",
    },

    {
        link: "plita_150.html",
        title: "Плита электрическая 724Ш",
        desc: "Плита электрическая 724Ш <b>с 4-мя конфорками и духовым шкафом</b> предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания, пищевой промышленности и торговли.",
        img: "/images/products/plita/9.jpg",
        price: 90330,
        code: "8207",
    },

    {
        link: "plita_814sh.html",
        title: "Плита электрическая 814Ш",
        desc: "Плита электрическая 814Ш <b>с 4-мя конфорками и духовым шкафом</b> предназначена для приготовления различных блюд в наплитной посуде, выпечки пирогов, пиццы и кексов на предприятиях общественного питания и торговли. Модель оснащена функцией автоматического поддержания в духовой камере заданного температурного режима.",
        img: "/images/products/plita/6.jpg",
        price: 90150,
        code: "8208",
    },
    {
        link: "plita_7240.html",
        title: "Плита электрическая 7260",
        desc: "Плита электрическая  7260  <b>с 6-ю конфорками и открытым стендом с полкой </b>предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания, пищевой промышленности и торговли.",
        img: "/images/products/plita/10.jpg",
        price: 105710,
        code: "8209",
    },
    {
        link: "plita_8060.html",
        title: "Плита электрическая 8060",
        desc: "Плита электрическая 8060 <b>с 6-ю конфорками и открытым стендом с полкой </b>предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания и торговли. Модель оснащена полкой, на которой можно хранить посуду и кухонные принадлежности. ",
        img: "/images/products/plita/7.jpg",
        price: 108395,
        code: "8210",
    },
    {
        link: "plita_724shk.html",
        title: "Плита электрическая 726ШК",
        desc: "Плита электрическая 726ШК <b>с 6-ю конфорками, духовым шкафом и вместительным нейтральным шкафом </b>предназначена для приготовления различных блюд в наплитной посуде на предприятиях общественного питания, пищевой промышленности и торговли. ",
        img: "/images/products/plita/11.jpg",
        price: 129859,
        code: "8211",
    },
    {
        link: "plita_806sh.html",
        title: "Плита электрическая 806Ш",
        desc: "Плита электрическая 806Ш <b>с 6-ю конфорками, духовым шкафом и вместительным нейтральным шкафом </b>предназначена для приготовления первых, вторых, третьих блюд в наплитной посуде, а также для жарки полуфабрикатов из мяса, рыбы, овощей и выпечки мелкоштучных кулинарных изделий.",
        img: "/images/products/plita/8.jpg",
        price: 143630,
        code: "8212",
    },
// _____________________________________Тестомесы____________________________________________
{
		link: "spiralnyy-testomes-tms-120sp-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-120СП-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/ccd/uq0y710owaqe1y6032nruvz3yfv0oebq.jpg",
        price: 4044500,
        code: "41000019580",
    },
	{
		link: "spiralnyy-testomes-tms-20nn-1r-serii-light.html",
        title: "Спиральный тестомес ТМС-20НН-1Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 569500,
        code: "41000000049",
    },
	{
		link: "spiralnyy-testomes-tms-20nn-2r-serii-light.html",
        title: "Спиральный тестомес ТМС-20НН-2Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 649500,
        code: "41000000024",
    },
	{
		link: "spiralnyy-testomes-tms-20nn-1ts-serii-chef.html",
        title: "Спиральный тестомес ТМС-20НН-1Ц серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/e0b/k8l898w6yx01nd313b5ugezca6lm8q52.jpg",
        price: 681500,
        code: "41000019537",
    },
	{
		link: "spiralnyy-testomes-tms-20nn-2ts-serii-chef.html",
        title: "Спиральный тестомес ТМС-20НН-2Ц серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/4de/8i7xbkddb0x2upe04scznior06xqqx1l.jpg",
        price: 765500,
        code: "41000018972",
    },
	{
		link: "spiralnyy-testomes-tms-20nn-mts-serii-chef.html",
        title: "Спиральный тестомес ТМС-20НН-МЦ серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/411/bh4n97ptpptpztdpdz4cmklpp5mgla96.jpg",
        price: 845500,
        code: "41000018973",
    },
	{
		link: "spiralnyy-testomes-tms-30nn-1r-serii-light.html",
        title: "Спиральный тестомес ТМС-30НН-1Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 635000,
        code: "41000000033",
    },
	{
		link: "spiralnyy-testomes-tms-30nn-2r-serii-light.html",
        title: "Спиральный тестомес ТМС-30НН-2Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 699500,
        code: "41000000023",
    },
	{
		link: "spiralnyy-testomes-tms-30nn-1ts-serii-chef.html",
        title: "Спиральный тестомес ТМС-30НН-1Ц серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/1f2/3281ob0v4hnrzmb4xc7f918oznfbajyg.jpg",
        price: 741500,
        code: "41000019538",
    },
	
	{
		link: "spiralnyy-testomes-tms-30nn-2ts-serii-chef.html",
        title: "Спиральный тестомес ТМС-30НН-2Ц серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/1f2/3281ob0v4hnrzmb4xc7f918oznfbajyg.jpg",
        price: 795000,
        code: "41000018850",
    },
	{
		link: "spiralnyy-testomes-tms-30nn-mts-serii-chef.html",
        title: "Спиральный тестомес ТМС-30НН-МЦ серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/f78/yvuzv481tc9vqtafk9ac9p4u9aopeddt.jpg",
        price: 875000,
        code: "41000018849",
    },
	{
		link: "spiralnyy-testomes-tms-40nn-1r-serii-light.html",
        title: "Спиральный тестомес ТМС-40НН-1Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 695000,
        code: "41000000030",
    },
	{
		link: "spiralnyy-testomes-tms-40nn-2r-serii-light.html",
        title: "Спиральный тестомес ТМС-40НН-2Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
        price: 729500,
        code: "41000019571",
    },
	{
		link: "spiralnyy-testomes-tms-40nn-2ts-serii-chef.html",
        title: "Спиральный тестомес ТМС-40НН-2Ц серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/30b/8xavuvmlzwtuvjw6bdb9a0xfocs310rs.jpg",
        price: 1025000,
        code: "41000019654",
    },
	{
		link: "spiralnyy-testomes-tms-40nn-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-40НН-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/48c/kopinznosesvm158r8zlb7k0bzn6s3h5.jpg",
        price: 1050000,
        code: "41000006621",
    },
	{
		link: "spiralnyy-testomes-tms-60nn-1r-serii-light.html",
        title: "Спиральный тестомес ТМС-60НН-1Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/f68/jkfq738nbhrzfygg375z97hlbdkv59ap.jpg",
        price: 695000,
        code: "41000000031",
    },
	{
		link: "spiralnyy-testomes-tms-60nn-2r-serii-light.html",
        title: "Спиральный тестомес ТМС-60НН-2Р серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/f68/jkfq738nbhrzfygg375z97hlbdkv59ap.jpg",
        price: 790500,
        code: "41000006785",
    },
	{
		link: "spiralnyy-testomes-tms-60nn-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-60НН-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/4ad/k0oyjb9nxc98loo48l7mr7367sqas5z1.jpg",
        price: 1495000,
        code: "41000019557",
    },
	{
		link: "spiralnyy-testomes-tms-80nn-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-80НН-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/4ad/k0oyjb9nxc98loo48l7mr7367sqas5z1.jpg",
        price: 1575000,
        code: "41000019563",
    },
	{
		link: "spiralnyy-testomes-tms-100nn-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-100НН-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/cdd/cdv9l1zdx7l8xy5xnfpz48tdh5az7sa1.jpg",
        price: 2250000,
        code: "41000019568",
    },
	{
		link: "spiralnyy-testomes-tms-120nn-2p-serii-chef.html",
        title: "Спиральный тестомес ТМС-120НН-2П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/20d/61gt2767bduf77hbsnggrcqfb3oz5yn6.jpg",
        price: 2325500,
        code: "41000019559",
    },
	
// _____________________________________Лиофильные камеры____________________________________________
{
		link: "lf-06p-serii-chef.html",
        title: "ЛФ-06П серии CHEF",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/5e7/l1vt5hogfd6s9xzfbatr8tpvu6gqdf7j.jpg",
        price: 1995000,
        code: "11000012892",
    },
	{
		link: "lf-06-serii-light.html",
        title: "ЛФ-06 серии LIGHT",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "https://abat.ru/upload/iblock/d28/5ma95fn8ajj3orox2k7jss3bb6mhce9k.jpg",
        price: 1775000,
        code: "11000012381",
    },
// _____________________________________Ротационные печи____________________________________________
	{
        link: "pech-rotatsionnaya-rpsh-18-8-6shr-serii-expert-razbornaya-konstruktsiya.html",
        title: "Печь ротационная РПШ-18-8-6ШР серии EXPERT",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/d10/xnx8umwc4k9so1hzcdkwjpfgr4o022l2.jpg",
        price: 6882750,
        code: "21000006779",
    },
	{
        link: "pech-rotatsionnaya-rpsh-16-6-4-serii-expert.html",
        title: "Печь ротационная РПШ-16-6-4 серии EXPERT",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/6ab/dcbfg7b14a8jqlkqdaktiw16eo3ktj2i.jpg",
        price: 5618650,
        code: "21000802458",
    },
	{
        link: "pech-rotatsionnaya-rpsh-18-8-6lr-serii-light-razbornaya-konstruktsiya.html",
        title: "Печь ротационная РПШ-18-8-6ЛР серии LIGHT",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/7b4/jevdry5f2o5vf440jsig4f2v9qz14c4j.jpg",
        price: 6216000,
        code: "21000003076",
    },
	{
        link: "pech-rotatsionnaya-rpsh-16-2-1l-serii-light-v-komplekte-tshg-16-2-1.html",
        title: "Печь ротационная РПШ-16-2/1Л серии LIGHT (в комплекте ТШГ-16-2/1)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/7b4/jevdry5f2o5vf440jsig4f2v9qz14c4j.jpg",
        price: 3908350,
        code: "21000003089",
    },
	{
        link: "pech-rotatsionnaya-rpsh-16-2-1l-serii-light-v-komplekte-tshg-16-01.html",
        title: "Печь ротационная РПШ-16-2/1Л серии LIGHT(в комплекте ТШГ-16-01)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/7b4/jevdry5f2o5vf440jsig4f2v9qz14c4j.jpg",
        price: 3973250,
        code: "21000005309",
    },
	{
        link: "rpsh-18-8-6mr-razbornaya-konstruktsiya.html",
        title: "Печь ротационная РПШ-18-8-6МР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/098/zdoodw91sk7ebivqezuaiz9a058rz43q.jpg",
        price: 6636000,
        code: "21000802457",
    },
	{
        link: "pech-rotatsionnayarpsh-16-2-1m-v-komplekte-tshg-16-2-1.html",
        title: "Печь ротационная РПШ-16-2/1М (в комплекте ТШГ-16-2/1)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/098/zdoodw91sk7ebivqezuaiz9a058rz43q.jpg",
        price: 4216750,
        code: "21000802453",
    },
	{
        link: "pech-rotatsionnayarpsh-16-2-1m-v-komplekte-tshg-16-01.html",
        title: "Печь ротационная РПШ-16-2/1М (в комплекте ТШГ-16-01)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/098/zdoodw91sk7ebivqezuaiz9a058rz43q.jpg",
        price: 4284400,
        code: "21000007412",
    },
	{
        link: "shkaf-rasstoechnyy-shrt-18p.html",
        title: "Шкаф расстоечный ШРТ-18П",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/5f8/5x01i8ay3ulfh2o82eimh71yb21khe9c.jpg",
        price: 1380500,
        code: "21000003056",
    },
	{
        link: "shkaf-rasstoechnyy-shrt-18m.html",
        title: "Шкаф расстоечный ШРТ-18М",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/4da/3896fza58mkrb22621wb44jv6gu9aw7d.jpg",
        price: 1280000,
        code: "21000807850",
    },
	{
        link: "shkaf-rasstoechnyy-shrt-16p.html",
        title: "Шкаф расстоечный ШРТ-16П",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/d1f/69ostqyd0ukz8mx1r89b13l5xd31t8qz.jpg",
        price: 1154000,
        code: "21000807860",
    },
	{
        link: "shkaf-rasstoechnyy-shrt-16m-dva-stekla.html",
        title: "Шкаф расстоечный ШРТ-16М (два стекла)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/c4b/h1i9lcjlbn1q3jvwdxhdcc57srq4majq.jpg",
        price: 961500,
        code: "21000002757",
    },
// _____________________________________Пищеварочные котлы____________________________________________
	{
        link: "kotel-pishchevarochnyy-kpem-100-omp-v.html",
        title: "Котел пищеварочный КПЭМ-100-ОМП-В",
        desc: "Котел пищеварочный высокотемпературный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-100-ОМП-В предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/34b/m86kvimbt6eyzofvc9uts1eixqv9a8oi.jpg",
        price: 4197500,
        code: "11000015456",
    },
	{
        link: "kotle-pishchevarochnyy-kpem-60-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-60-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/49e/8cep8lcewptamcv4whypwnzssg1lhg68.jpg",
        price: 3836500,
        code: "11000019713",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-100-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/330/n6u43oxmuabkq3osgkj5g6sobw0q64b6.jpg",
        price: 4086500,
        code: "11000019715",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-160-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/63a/131sf8zwf9rkp0t2qeo267wssil9t77k.jpg",
        price: 4283500,
        code: "11000019717",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-200-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-200-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/517/09npsazdr3ia1075tn99oh5fuepax0oq.jpg",
        price: 4712500,
        code: "11000019856",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-250-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/cb9/ucmdmu747e3dz0tmq1kg3m9w6kwc3plm.jpg",
        price: 4825000,
        code: "11000019721",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-omp-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-350-ОМП со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/bcf/y10cvf70cv0iwjq1iayin6n55d96n9st.jpg",
        price: 5065000,
        code: "11000019854",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-omp.html",
        title: "Котел пищеварочный КПЭМ-60-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/937/gma7x044jqvlq8i1q8r4h18ach3dipz1.jpg",
        price: 3770000,
        code: "11000018914",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omp.html",
        title: "Котел пищеварочный КПЭМ-100-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/fd8/kvtmy18us5elnqiyu56vyd2fu3cryran.jpg",
        price: 4023500,
        code: "11000019700",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omp.html",
        title: "Котел пищеварочный КПЭМ-160-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/62d/csd6ir0re12hs39crffdxok04mfyyxh2.jpg",
        price: 4222500,
        code: "11000019517",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-200-omp.html",
        title: "Котел пищеварочный КПЭМ-200-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/965/xzg8v5vm1xsipdw5itvbu40sbw2sb16z.jpg",
        price: 4646500,
        code: "11000019726",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-omp.html",
        title: "Котел пищеварочный КПЭМ-250-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/722/6g9c7dnuzd4e2wxiptmap0s03q2t82ln.jpg",
        price: 4760000,
        code: "11000018915",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-omp.html",
        title: "Котел пищеварочный КПЭМ-350-ОМП",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/8de/fv97d0vm51gz32c8pgm4zle7lvkqtbqc.jpg",
        price: 4979000,
        code: "11000018916",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-60-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/394/b4z0r22dl27t9gp4sss6qqaoq0xk64cx.jpg",
        price: 3116000,
        code: "11000019317",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-kotel-pishchevarochnyy-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-100-Котел пищеварочный ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/df6/e5ahl8tsw6jgatq3ayejyafj06gteslb.jpg",
        price: 3350000,
        code: "11000019727",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-160-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/8f9/lf02x7y0shbf09ful7z57mmvwxtzg1mc.jpg",
        price: 3469000,
        code: "11000019176",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-200-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-200-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/20d/qw8mk6h7ypvw7ff0tps4tv7xt6trxurx.jpg",
        price: 3865500,
        code: "11000019729",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-250-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/135/0coq9xgv8qumxsjx8hayuokcivuxdsx0.jpg",
        price: 4221000,
        code: "11000018929",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-350-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/de1/hdicrgvm8wufp811wd43qslphegagaxu.jpg",
        price: 4418000,
        code: "11000019567",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-500-om2-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-500-ОМ2 со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/c11/m7v8ldzgdsf7xsp6evjmpga6wdfdxp69.jpg",
        price: 9655000,
        code: "11000006538",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-om2.html",
        title: "Котел пищеварочный КПЭМ-60-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/d4e/pr5god6u6qgobmrtfyol9u3k3gx8jqj6.jpg",
        price: 3063000,
        code: "11000018909",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-om2.html",
        title: "Котел пищеварочный КПЭМ-100-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/30d/b7ppegu9b08fho6e25t20yx6vmu2eg1b.jpg",
        price: 3295500,
        code: "11000019707",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-om2.html",
        title: "Котел пищеварочный КПЭМ-160-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/5b6/95qec88ftvt8vxtqlvtzznv0vwqwyigz.jpg",
        price: 3415000,
        code: "11000018908",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-200-om2.html",
        title: "Котел пищеварочный КПЭМ-200-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/68d/itc9f2dzu4jiz1wba3tfqswehjyho69p.jpg",
        price: 3805000,
        code: "11000019728",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-om2.html",
        title: "Котел пищеварочный КПЭМ-250-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/176/zo7qc66xr2wh5gvryls7tjlwrr1y860p.jpg",
        price: 4122000,
        code: "11000018910",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-om2.html",
        title: "Котел пищеварочный КПЭМ-350-ОМ2",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/189/4z4qfrz2b7lm96digpvilylrl14xs6er.jpg",
        price: 4283500,
        code: "11000018913",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-o-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-160-О со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/ace/5au49uf4m3r2zcp9f0zgzp3d1qh3t0su.jpg",
        price: 2430285,
        code: "11000006514",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-o-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-250-О со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/b8e/4xczmdmlbe6ruhveg0lm1r6m9thgv2tj.jpg",
        price: 2826000,
        code: "11000006515",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-o-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-350-О со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/18c/gzlv29ii1qx1ae24jd9tmw28raj333mr.jpg",
        price: 3127000,
        code: "11000012198",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-o.html",
        title: "Котел пищеварочный КПЭМ-60-О",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/8d3/wrr51giq0976pvn0m88e46yczlii6024.jpg",
        price: 1906000,
        code: "11000001662",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-o.html",
        title: "Котел пищеварочный КПЭМ-100-О",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/80b/m2q0dnqm2nde5f4r6wl9g6wkf1qgl7t0.jpg",
        price: 2179000,
        code: "11000019842",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-o.html",
        title: "Котел пищеварочный КПЭМ-160-О",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/10b/olemq7wxpv45c57z1nqck40h1mlfjsoq.jpg",
        price: 2285500,
        code: "11000001663",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-o.html",
        title: "Котел пищеварочный КПЭМ-250-О",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/a9a/dhfss12ugj67wow20hko0iuckbvx8i4z.jpg",
        price: 2762000,
        code: "11000019161",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-350-o.html",
        title: "Котел пищеварочный КПЭМ-350-О",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/f49/t4mr79xjoxdcle401ddnkklyutiyzg12.jpg",
        price: 2997000,
        code: "11000001603",
    },
	{
        link: "kotel-pishchevarochnyy-kpgm-100-or-gazovyy.html",
        title: "Котел пищеварочный КПГМ-100-ОР (газовый)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/0ac/5hbskta3ntnw4ga6vx1bfc6wfb5m4fa8.jpg",
        price: 1557500,
        code: "11000010323",
    },
	{
        link: "kotel-pishchevarochnyy-kpgm-60-omr-gazovyy.html",
        title: "Котел пищеварочный КПГМ-60-ОМР (газовый)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/833/trglwo8l36g1ae7v9nalviufqjpkiu8n.jpg",
        price: 2216000,
        code: "11000019653",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-omr-vk.html",
        title: "Котел пищеварочный КПЭМ-60-ОМР-ВК",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/c94/s3ofe3pgjdvjdqo6n7gw69m33qlehwae.jpg",
        price: 2180500,
        code: "11000006650",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omr-vk.html",
        title: "Котел пищеварочный КПЭМ-100-ОМР-ВК",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/5f3/tq5xn6k46ntgljdgs2wdwi9ao0vjy2xl.jpg",
        price: 2474500,
        code: "11000019730",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omr-vk.html",
        title: "Котел пищеварочный КПЭМ-160-ОМР-ВК",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/909/700i9g2xpxg2xpy5dbh9rs5f15m3ifta.jpg",
        price: 2547500,
        code: "11000006649",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-omr-v.html",
        title: "Котел пищеварочный КПЭМ-60-ОМР-В",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/f80/s6ngmhpuwrs3p0o81spkvs6apnd5mv41.jpg",
        price: 2031675,
        code: "11000006646",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omr-v.html",
        title: "Котел пищеварочный КПЭМ-100-ОМР-В",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/d08/s481rf6n34m7g5e3oend3vonu4okzg3b.jpg",
        price: 2323000,
        code: "11000006645",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omr-v.html",
        title: "Котел пищеварочный КПЭМ-160-ОМР-В",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/4c1/gpdgbkpu0x7wr231ob5wue60f32bzxrr.jpg",
        price: 2474500,
        code: "11000018859",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-omr-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-60-ОМР со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/853/g71ujhplcdrebq2rghgjml1jf7smsh38.jpg",
        price: 1702050,
        code: "11000019724",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omr-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-100-ОМР со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/582/jx7i080yq7e03721vjpynx75dpvruosl.jpg",
        price: 1832370,
        code: "11000019725",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omr-so-slivnym-kranom.html",
        title: "Котел пищеварочный КПЭМ-160-ОМР со сливным краном",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/fc8/v55f86pfk1hesprmsz1wncylu8mfaidb.jpg",
        price: 1911500,
        code: "11000019712",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-omr.html",
        title: "Котел пищеварочный КПЭМ-60-ОМР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/357/1ieae0m7x8c821fqa1q4f4dwwa26v22q.jpg",
        price: 1628945,
        code: "11000019423",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-omr.html",
        title: "Котел пищеварочный КПЭМ-100-ОМР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/863/chwi3nlt2umfk0ukyz5xmsequcm9a8qh.jpg",
        price: 1768500,
        code: "11000019425",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-omr.html",
        title: "Котел пищеварочный КПЭМ-160-ОМР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/9de/ucpr2me9xcys88socakjt74wqdkrhpxl.jpg",
        price: 1810000,
        code: "11000019426",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-or.html",
        title: "Котел пищеварочный КПЭМ-60-ОР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/9de/ucpr2me9xcys88socakjt74wqdkrhpxl.jpg",
        price: 854000,
        code: "11000019158",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-or.html",
        title: "Котел пищеварочный КПЭМ-100-ОР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/6d8/3o7cufhis4lpq0ezvl6cf76zhtujz44r.jpg",
        price: 1048000,
        code: "11000019160",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-or.html",
        title: "Котел пищеварочный КПЭМ-160-ОР",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/56e/6doevktcfl0fxabh5t4d29t7j8h7z8yq.jpg",
        price: 1131500,
        code: "11000019159",
    },
	{
        link: "kotel-pishchevarochnyy-kpgm-60-9t-gazovyy.html",
        title: "Котел пищеварочный КПГМ-60/9T (газовый)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/3d0/a5fku7pgadlnqs2jc5j19iec8me8xxva.jpg",
        price: 1372500,
        code: "11000006287",
    },
	{
        link: "kotel-pishchevarochnyy-kpgm-100-9t-gazovyy.html",
        title: "Котел пищеварочный КПГМ-100/9T (газовый)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/fec/999o426zd0lue2zejkkxxrtty4ma1aua.jpg",
        price: 1554500,
        code: "11000006463",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-7t-litso-nerzh-.html",
        title: "Котел пищеварочный КПЭМ-60/7Т (лицо нерж.)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/f1f/eyktbdk737kk4124etnx63lui6uh7g8t.jpg",
        price: 872500,
        code: "11000013392",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-9t-litso-nerzh-.html",
        title: "Котел пищеварочный КПЭМ-60/9Т (лицо нерж.)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/15a/07svmuaany9e1d97bntgnbj74d9xu45c.jpg",
        price: 865000,
        code: "11000013393",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-9t-litso-nerzh-.html",
        title: "Котел пищеварочный КПЭМ-100/9Т (лицо нерж.)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/9c7/gmyt5e6vrmvkh2ysaqkxqjhu9fzo6d49.jpg",
        price: 1041000,
        code: "11000013394",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-9t-litso-nerzh-.html",
        title: "Котел пищеварочный КПЭМ-160/9Т (лицо нерж.)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/9c7/gmyt5e6vrmvkh2ysaqkxqjhu9fzo6d49.jpg",
        price: 1059000,
        code: "11000013395",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-9t-litso-nerzh-.html",
        title: "Котел пищеварочный КПЭМ-250/9Т (лицо нерж.)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/cca/1kijclw8jabcgzywagzydhjcdx2o1549.jpg",
        price: 1179500,
        code: "11000013396",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-7t.html",
        title: "Котел пищеварочный КПЭМ-60/7Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/e77/c51xgn1inx6qkx1p2kbw5pk2da3i45ny.jpg",
        price: 912500,
        code: "11000009839",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60-9t.html",
        title: "Котел пищеварочный КПЭМ-60/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/40d/jy0yofafgb79eleujnj8zld2472yxcx9.jpg",
        price: 904500,
        code: "11000009837",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-100-9t.html",
        title: "Котел пищеварочный КПЭМ-100/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/37e/24z01m2o1chsidfalmw4ruoe6w104lvy.jpg",
        price: 1088500,
        code: "11000009838",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160-9t.html",
        title: "Котел пищеварочный КПЭМ-160/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/37e/24z01m2o1chsidfalmw4ruoe6w104lvy.jpg",
        price: 1107000,
        code: "11000009851",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-200-9t.html",
        title: "Котел пищеварочный КПЭМ-200/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/6fe/7pr0q0g1au4dbghou7vbfdb2rsxpow5r.jpg",
        price: 1167000,
        code: "11000019427",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250-9t.html",
        title: "Котел пищеварочный КПЭМ-250/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/6fe/7pr0q0g1au4dbghou7vbfdb2rsxpow5r.jpg",
        price: 1233000,
        code: "11000007907",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250.html",
        title: "Котел пищеварочный КПЭМ-250",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/ee1/7ingzjhminrvjaau3zytau91anhlwxic.jpg",
        price: 1467235,
        code: "11000012139",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-400t.html",
        title: "Котел пищеварочный КПЭМ-400Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/196/d20afoq09vi2gndn95he55wlei8c3v3t.jpg",
        price: 1917500,
        code: "11000009871",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-400tm.html",
        title: "Котел пищеварочный КПЭМ-400ТМ",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/ee1/7ingzjhminrvjaau3zytau91anhlwxic.jpg",
        price: 2728000,
        code: "11000019569",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-500tm.html",
        title: "Котел пищеварочный КПЭМ-500ТМ",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/ee1/7ingzjhminrvjaau3zytau91anhlwxic.jpg",
        price: 3053500,
        code: "11000015819",
    },
	{
        link: "kotel-pishchevarochnyy-kpdm-250-dizel-gaz.html",
        title: "Котел пищеварочный КПДМ-250 (дизель/газ)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/c3f/52f95f7nu637d294n5aqnm2teapserl9.jpg",
        price: 3550000,
        code: "11000019693",
    },
	{
        link: "kotel-pishchevarochnyy-kpdm-500-dizel-gaz.html",
        title: "Котел пищеварочный КПДМ-500 (дизель/газ)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/ac1/moz3kr7iaelo7pkvmv6a8q7e14lnqj7p.jpg",
        price: 4583500,
        code: "11000019698",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-160p-parovoy.html",
        title: "Котел пищеварочный КПЭМ-160П (паровой)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/1e7/91dxcp15qce1wmk804qu7q0yedpm6vp1.jpg",
        price: 1027000,
        code: "11000019162",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-250p-parovoy.html",
        title: "Котел пищеварочный КПЭМ-250П (паровой)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/1e7/91dxcp15qce1wmk804qu7q0yedpm6vp1.jpg",
        price: 1175000,
        code: "11000011225",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-400p-parovoy.html",
        title: "Котел пищеварочный КПЭМ-400П (паровой)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/1e7/91dxcp15qce1wmk804qu7q0yedpm6vp1.jpg",
        price: 1425000,
        code: "11000011224",
    },
	{
        link: "komplekt-parovarochnyy-kp-60.html",
        title: "Комплект пароварочный КП-60",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/b4c/io21bibc1xlharbdnp33bn3xflpqxtsp.jpg",
        price: 60500,
        code: "11000000879",
    },
	{
        link: "komplekt-parovarochnyy-kp-100.html",
        title: "Комплект пароварочный КП-100",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/b4c/io21bibc1xlharbdnp33bn3xflpqxtsp.jpg",
        price: 101000,
        code: "11000000880",
    },
	
	{
        link: "komplekt-parovarochnyy-kp-160.html",
        title: "Комплект пароварочный КП-160",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/b4c/io21bibc1xlharbdnp33bn3xflpqxtsp.jpg",
        price: 119000,
        code: "11000000881",
    },
	{
        link: "kotel-pishchevarochnyy-kpem-60a-avtoklav.html",
        title: "Котел пищеварочный КПЭМ-60А (автоклав)",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/d7b/723m8h41jqcd6zj9f717fhgoymdjlhnh.jpg",
        price: 2017770,
        code: "11000006662",
    },
	{
        link: "mernik-60-l.html",
        title: "Мерник 60 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 3000,
        code: "10000014664",
    },
	{
        link: "mernik-100-l.html",
        title: "Мерник 100 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 3600,
        code: "10000017118",
    },
	{
        link: "mernik-160-l.html",
        title: "Мерник 160 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 4500,
        code: "10000017119",
    },
	{
        link: "mernik-200-l.html",
        title: "Мерник 200 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 4500,
        code: "10000020682",
    },
	{
        link: "mernik-250-l.html",
        title: "Мерник 250 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 4750,
        code: "10000017117",
    },
	{
        link: "mernik-350-l.html",
        title: "Мерник 350 л",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 5000,
        code: "10000017120",
    },
	{
        link: "mernik-60-l-dlya-kpem-60-7t-kpem-60-9t.html",
        title: "Мерник 60 л для КПЭМ-60/7Т, КПЭМ-60/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 1805,
        code: "11001025552",
    },
	{
        link: "mernik-100-l-dlya-kpem-100-9t.html",
        title: "Мерник 100 л для КПЭМ-100/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 2530,
        code: "11001025550",
    },
	{
        link: "mernik-160-l-dlya-kpem-160-9t.html",
        title: "Мерник 160 л для КПЭМ-160/9Т",
        desc: "Котел пищеварочный электрический с функциями опрокидывания, перемешивания и охлаждения КПЭМ-60-ОМП предназначен для приготовления бульонов, соусов, десертов, вторых и третьих блюд. Продукты могут приготавливаться как с перемешиванием, так и без перемешивания.",
        img: "https://abat.ru/upload/iblock/2f2/ah0x18m8fisqg030lc6dx9es0rn9oiwn.PNG",
        price: 3335,
        code: "11001025551",
    },
	
// _____________________________________Пароконвектоматы____________________________________________
	{
        link: "parokonvektomat-pka-6-1-3p.html",
        title: "Пароконвектомат ПКА 6-1/3П",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/a07/4p9cg7xbb05nqtt6yx4n6r3r3qqb3f4c.jpg",
        price: 705000,
        code: "11000009870",
    },
	{
        link: "parokonvektomat-pka-6-1-2p.html",
        title: "Пароконвектомат ПКА 6-1/2П",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/4c5/a1tlp02ch9zks0yzohztnznpa9pq29kd.jpg",
        price: 917000,
        code: "11000019101",
    },
	{
        link: "parokonvektomat-pka-6-2-3p.html",
        title: "Пароконвектомат ПКА 6-2/3П",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/554/ye1otaqlvbk9upgduf28etmxj8bpj0ig.jpg",
        price: 979000,
        code: "11000018855",
    },
	{
        link: "parokonvektomat-pka-10-2-3p.html",
        title: "Пароконвектомат ПКА 10-2/3П",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/b2d/1zvk303d8ggd5zmfy4di57te6lkhqo6h.jpg",
        price: 1164500,
        code: "11000018854",
    },
	{
        link: "parokonvektomat-pka-6-2-3p-01.html",
        title: "Пароконвектомат ПКА 6-2/3П-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/faf/sb7h4r8l13xtrk34j8ynq2d5inkjdivo.jpg",
        price: 1317000,
        code: "11000018858",
    },
	{
        link: "parokonvektomat-pka-6-1-2v.html",
        title: "Пароконвектомат ПКА 6-1/2В",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/287/cnbxgf72b8omkl5kxxu4pxwmo1y215jr.jpg",
        price: 847000,
        code: "11000019113",
    },
	{
        link: "parokonvektomat-pka-6-2-3v.html",
        title: "Пароконвектомат ПКА 6-2/3В",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/554/ye1otaqlvbk9upgduf28etmxj8bpj0ig.jpg",
        price: 895000,
        code: "11000011036",
    },
	{
        link: "parokonvektomat-pka-6-1-1pm2.html",
        title: "Пароконвектомат ПКА 6-1/1ПМ2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/c70/yhxauydk0to8rk0gu99e24gw20qj8eyj.jpg",
        price: 1702500,
        code: "11000019451",
    },
	{
        link: "parokonvektomat-pka-10-1-1pm2.html",
        title: "Пароконвектомат  ПКА 10-1/1ПМ2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/f78/1dh3p3bskeafyqfgh0bmdjvz1xekj1ta.jpg",
        price: 1949000,
        code: "11000019449",
    },
	{
        link: "pka-6-1-1pp2.html",
        title: "Пароконвектомат ПКА 6-1/1ПП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/3f3/d7jl2n1zo2evlms0h5np1e7z4pdsyvii.jpg",
        price: 2458500,
        code: "11000007069",
    },
	{
        link: "parokonvektomat-pka-10-1-1pp2.html",
        title: "Пароконвектомат  ПКА 10-1/1ПП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/8ed/1kbm5j9q80nbn02slubvjlzxoj8686o6.jpg",
        price: 2951550,
        code: "11000009757",
    },
	{
        link: "parokonvektomat-pka-20-1-1pp2.html",
        title: "Пароконвектомат  ПКА 20-1/1ПП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/4da/yfmy7xbd6d6w18agog0qrcvxdcwvpeph.jpg",
        price: 4754000,
        code: "11000005228",
    },
	{
        link: "parokonvektomat-pka-20-1-1pp2-bez-telezhki.html",
        title: "Пароконвектомат  ПКА 20-1/1ПП2 (без тележки)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/4da/yfmy7xbd6d6w18agog0qrcvxdcwvpeph.jpg",
        price: 4516000,
        code: "11000005229",
    },
	{
        link: "parokonvektomat-pka-6-1-1pm2-01.html",
        title: "Пароконвектомат  ПКА 6-1/1ПМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/f4e/h6f7suammi5m56l0j9neo9hs2ywu22up.jpg",
        price: 1859000,
        code: "11000018943",
    },
	{
        link: "parokonvektomat-pka-10-1-1pm2-01.html",
        title: "Пароконвектомат  ПКА 10-1/1ПМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/acf/pkbx181whg1qdn8l1osd3co25s0q1cbu.jpg",
        price: 2128500,
        code: "11000018918",
    },
	{
        link: "parokonvektomat-pka-20-1-1pm2-01.html",
        title: "Пароконвектомат  ПКА 20-1/1ПМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/c1c/1i0suhq7kgpanhsjewxsn3971ehg8yt3.jpg",
        price: 3895500,
        code: "11000019444",
    },
	{
        link: "parokonvektomat-pka-20-1-1pm2.html",
        title: "Пароконвектомат ПКА 20-1/1ПМ2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/b43/ax62t2hzmn36to081g74jx7secwa0vqg.jpg",
        price: 3642000,
        code: "11000019445",
    },
	{
        link: "parokonvektomat-pka-6-1-1pmf2-morskoy.html",
        title: "Пароконвектомат ПКА 6-1/1ПМФ2 (морской)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/fe2/tfds8q0t0ttfxk9hmesn391jmr7m6k9t.jpg",
        price: 1948500,
        code: "11000015964",
    },
	{
        link: "parokonvektomat-pka-10-1-1pmf2-morskoy.html",
        title: "Пароконвектомат ПКА 10-1/1ПМФ2 (морской)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/b01/3k0ud5kghe3a0y4pnikldkaikvezrxh8.jpg",
        price: 2133000,
        code: "11000015891",
    },
	{
        link: "parokonvektomat-pka-20-1-1pmf2-morskoy.html",
        title: "Пароконвектомат ПКА 20-1/1ПМФ2 (морской)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/5cc/h7bl3srgxev84gl7hki6cj5kmcvpei6r.jpg",
        price: 4394000,
        code: "11000035637",
    },
	{
        link: "parokonvektomat-pka-6-1-1vm2-litso-nerzh.html",
        title: "Пароконвектомат ПКА 6-1/1ВМ2 (лицо нерж.)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/789/2500jqg1e9hma5n9asm8qpml7wfufcqo.jpg",
        price: 1390500,
        code: "11000035623",
    },
	{
        link: "parokonvektomat-pka-10-1-1vm2-litso-nerzh.html",
        title: "Пароконвектомат ПКА 10-1/1ВМ2 (лицо. нерж)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/259/owry2zb5mpx6ycp8kz8joocv4kjhi0rr.jpg",
        price: 1534500,
        code: "11000035562",
    },
	{
        link: "parokonvektomat-pka-6-1-1vp2.html",
        title: "Пароконвектомат ПКА 6-1/1ВП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/3f3/d7jl2n1zo2evlms0h5np1e7z4pdsyvii.jpg",
        price: 2303500,
        code: "11000011195",
    },
	{
        link: "parokonvektomat-pka-10-1-1vp2.html",
        title: "Пароконвектомат ПКА 10-1/1ВП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/8ed/1kbm5j9q80nbn02slubvjlzxoj8686o6.jpg",
        price: 2612000,
        code: "11000010402",
    },
	{
        link: "parokonvektomat-pka-20-1-1vp2.html",
        title: "Пароконвектомат ПКА 20-1/1ВП2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/4da/yfmy7xbd6d6w18agog0qrcvxdcwvpeph.jpg",
        price: 4301000,
        code: "11000011253",
    },
	{
        link: "parokonvektomat-pka-6-1-1vm2-01.html",
        title: "Пароконвектомат ПКА 6-1/1ВМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/506/2cw34sj57xltjb7pucw6t14390kapoa5.jpg",
        price: 1662000,
        code: "11000019107",
    },
	{
        link: "parokonvektomat-pka-10-1-1vm2-01.html",
        title: "Пароконвектомат ПКА 10-1/1ВМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/09f/6fr933nda8i5a5i1pg9af2l9l5gkc87k.jpg",
        price: 1888500,
        code: "11000019106",
    },
	{
        link: "parokonvektomat-pka-20-1-1vm2-01.html",
        title: "Пароконвектомат ПКА 20-1/1ВМ2-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/c1c/1i0suhq7kgpanhsjewxsn3971ehg8yt3.jpg",
        price: 3598500,
        code: "11000005513",
    },
	{
        link: "parokonvektomat-pka-6-1-1vm2.html",
        title: "Пароконвектомат ПКА 6-1/1ВМ2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/638/0oggw32gc10ole79mfyqktsbjo5d9b90.jpg",
        price: 1526000,
        code: "11000019175",
    },
	{
        link: "parokonvektomat-pka-10-1-1vm2.html",
        title: "Пароконвектомат ПКА 10-1/1ВМ2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/dfe/4261isxpied58uf5roid5krixhynbpku.jpg",
        price: 1684500,
        code: "11000019265",
    },
	{
        link: "parokonvektomat-pka-6-1-1pm2-litso-nerzh.html",
        title: "Пароконвектомат ПКА 6-1/1ПМ2 (лицо нерж.)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/789/2500jqg1e9hma5n9asm8qpml7wfufcqo.jpg",
        price: 1551000,
        code: "11000035634",
    },
	{
        link: "parokonvektomat-pka-10-1-1pm2-litso-nerzh.html",
        title: "Пароконвектомат  ПКА 10-1/1ПМ2 (лицо нерж.)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/259/owry2zb5mpx6ycp8kz8joocv4kjhi0rr.jpg",
        price: 1775100,
        code: "11000035572",
    },
	{
        link: "rasstoechnyy-shkaf-dlya-parokonvektomata-shrt-10-1-1m2.html",
        title: "Расстоечный шкаф для пароконвектомата ШРТ 10-1/1М2",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/5e9/z30xw73x1kophkdpfu8xqyg68r14xm70.jpg",
        price: 402000,
        code: "21000807851",
    },
	{
        link: "podstavka-ptp-20.html",
        title: "Подставка ПТП-20",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/3c8/058ucd42amz1b16l2anaqfdydwn2c684.jpg",
        price: 44000,
        code: "11000026521",
    },
	{
        link: "parokonvektomat-pka-10-2-3p-01.html",
        title: "Пароконвектомат ПКА 10-2/3П-01",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/19a/q7ehxybye0co40y0hdqfet7cpqdamwue.jpg",
        price: 1483500,
        code: "11000018860",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-6-2-3.html",
        title: "Подставка под пароконвектомат ПК-6-2/3",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/d4e/d4cbirxw7juhun32njetffuuk2jc7cah.jpg",
        price: 128000,
        code: "11000160517",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-6-13.html",
        title: "Подставка под пароконвектомат ПК-6-2/3",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/5bd/lw9l6248s0g2fytqcrjuzvyr8zcpmqq4.jpg",
        price: 118000,
        code: "11000008419",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-8-02.html",
        title: "Подставка ПК-8-02",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/2ad/jyonlo5o46c0hqo810gomkvv8nwtsgc0.jpg",
        price: 108000,
        code: "11000009828",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-6m.html",
        title: "Подставка под пароконвектомат ПК-6М",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/8a9/309g395suh4b2wfrynjj0z3ro0fupt6l.jpg",
        price: 131000,
        code: "11000002326",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-6ms.html",
        title: "Подставка под пароконвектомат ПК-6МС",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/8a9/309g395suh4b2wfrynjj0z3ro0fupt6l.jpg",
        price: 177000,
        code: "11000019617",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-6mf.html",
        title: "Подставка под пароконвектомат ПК-6МФ",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/8a9/309g395suh4b2wfrynjj0z3ro0fupt6l.jpg",
        price: 205000,
        code: "11000019710",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-10m.html",
        title: "Подставка под пароконвектомат ПК-10М",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/fb8/tl10l3283s7lwqrki5wkzdxgdzj1o8j3.jpg",
        price: 144500,
        code: "11000002329",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-10ms.html",
        title: "Подставка под пароконвектомат ПК-10МС",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/fb8/tl10l3283s7lwqrki5wkzdxgdzj1o8j3.jpg",
        price: 184500,
        code: "11000019616",
    },
	{
        link: "podstavka-pod-parokonvektomat-pk-10mf.html",
        title: "Подставка под пароконвектомат ПК-10МФ",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/26c/hooa3bnn0nf5a052fu56d3kcj1pylg2o.jpg",
        price: 228500,
        code: "11000019711",
    },
	{
        link: "zont-vytyazhnoy-zvv-600p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-600П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/35e/r8sqh553nn83ahcxu0yu0dp2rdv4lrg0.jpg",
        price: 391000,
        code: "21000005678",
    },
	{
        link: "zont-vytyazhnoy-zvv-600.html",
        title: "Зонт вытяжной ЗВВ-600",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/308/652b3ym99m572vgmiqtltac7xzdra4p1.jpg",
        price: 131000,
        code: "21000080608",
    },
	{
        link: "zont-vytyazhnoy-zvv-700p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-700П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/35e/r8sqh553nn83ahcxu0yu0dp2rdv4lrg0.jpg",
        price: 402000,
        code: "21000004662",
    },
	{
        link: "zont-vytyazhnoy-zvv-700.html",
        title: "Зонт вытяжной ЗВВ-700",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/308/652b3ym99m572vgmiqtltac7xzdra4p1.jpg",
        price: 135000,
        code: "21000080700",
    },
	{
        link: "zont-vytyazhnoy-zvv-800p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-800П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/d1a/hvujep713a026itm6lbyrdxi97f45hsf.jpg",
        price: 612500,
        code: "21000002816",
    },
	{
        link: "zont-vytyazhnoy-zvv-800.html",
        title: "Зонт вытяжной ЗВВ-800",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 180000,
        code: "21000001627",
    },
	{
        link: "zont-vytyazhnoy-zvv-900.html",
        title: "Зонт вытяжной ЗВВ-900",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 181000,
        code: "21000080801",
    },
	{
        link: "zhidkoe-moyushchee-sredstvo-abat-pw-5-l.html",
        title: "Жидкое моющее средство Abat PW (5 л)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/2bf/65wtmi6okc92tl0o5df0i0uhf3ltj8lp.png",
        price: 13500,
        code: "12000137052",
    },
	{
        link: "zhidkoe-opolaskivayushchee-sredstvo-abat-pr-5-l.html",
        title: "Жидкое ополаскивающее средство Abat PR (5 л)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/7be/abex6jcm5capqve4ju6n9lgu78vu6jet.png",
        price: 11250,
        code: "12000137053",
    },
	{
        link: "zhidkoe-moyushchee-sredstvo-abat-pw-r-5-l.html",
        title: "Жидкое моющее средство Abat PW&R (5 л)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/551/mz979prv3p0x7g6mjqa5tp7x8a45zzkg.png",
        price: 13000,
        code: "12000137054",
    },
	
	{
        link: "zhidkoe-sredstvo-dlya-dekaltsinatsii-boylera-abat-decalc-5-l.html",
        title: "Жидкое средство для декальцинации бойлера Abat Decalc (5 л)",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/88e/dud7y0hynujg23iifnvbfy009gb3z781.png",
        price: 12250,
        code: "12000137117",
    },
	
// _____________________________________Конвекционные печи____________________________________________
	{
		link: "konvektsionnaya-pech-kep-6p-01.html",
        title: "Конвекционная печь КЭП-6П-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/efd/uqux803f8wla5ss8g8ie5wnw8kku0px2.jpg",
        price: 1502750,
        code: "11000015889",
	},
	{
		link: "konvektsionnaya-pech-kep-10p-01.html",
        title: "Конвекционная печь КЭП-10П-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/942/fnvy9lov0kj17cln9lyyn7u06fto7sw6.jpg",
        price: 1861750,
        code: "11000019108",
	},
	{
		link: "konvektsionnaya-pech-kep-16p-01.html",
        title: "Конвекционная печь КЭП-16П-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e4c/iwwavb0rk7s101z9fcxv4b6ai6mlyo7r.png",
        price: 2885000,
        code: "11000010518",
	},
	{
		link: "konvektsionnaya-pech-kep-16.html",
        title: "Конвекционная печь КЭП-16",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8e8/0am45oay644vqq7jp5c3uir463dy8dxn.jpg",
        price: 2438500,
        code: "11000027030",
	},
	{
		link: "konvektsionnaya-pech-kep-10p.html",
        title: "Конвекционная печь КЭП-10П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/760/c2wk9sk5mtg9c5jc03o18pshpdg778p0.jpg",
        price: 1336500,
        code: "11000026897",
	},
	{
		link: "konvektsionnaya-pech-kep-10.html",
        title: "Конвекционная печь КЭП-10",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/eac/zyr0flzqe0f08mf3db7nf4zkmoh9nxvy.jpg",
        price: 1266000,
        code: "11000009760",
	},
	{
		link: "konvektsionnaya-pech-kep-10e.html",
        title: "Конвекционная печь КЭП-10Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/7d1/w3tyx8y67s3som9nb5d4t0b5ehn6kd8e.jpg",
        price: 1212000,
        code: "11000019527",
	},
	{
		link: "konvektsionnaya-pech-kep-6p.html",
        title: "Конвекционная печь КЭП-6П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/4da/fr1dnzb4jfxra7lebjczk2cg25d3shrb.jpg",
        price: 1047500,
        code: "11000026896",
	},
	{
		link: "konvektsionnaya-pech-kep-6.html",
        title: "Конвекционная печь КЭП-6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/fad/vaw5vxffyny20vt1823c73vwtkea13nt.jpg",
        price: 985000,
        code: "11000009758",
	},
	{
		link: "konvektsionnaya-pech-kep-6e.html",
        title: "Конвекционная печь КЭП-6Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/abb/fv1d3989ut6xmqd83pw4djevinv3lal2.jpg",
        price: 920500,
        code: "11000019526",
	},
	{
		link: "konvektsionnaya-pech-kep-4pm-01.html",
        title: "Конвекционная печь КЭП-4ПМ-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ab6/zbndvcsqgouu1a6ofvmhz8f3bg0hiv1v.jpg",
        price: 1182500,
        code: "11000021075",
	},
	{
		link: "konvektsionnaya-pech-kep-4pm.html",
        title: "Конвекционная печь КЭП-4ПМ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/987/jlzdjqaespdfnnh72o9q13ih1c1jv8sh.jpg",
        price: 977500,
        code: "11000011075",
	},
	{
		link: "konvektsionnaya-pech-kep-4.html",
        title: "Конвекционная печь КЭП-4",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d8c/yh21tla9swqxtqkc2j3ww5mutmg53vti.jpg",
        price: 686500,
        code: "11000009279",
	},
	{
		link: "konvektsionnaya-pech-kep-4p.html",
        title: "Конвекционная печь КЭП-4П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/552/h95ebaixux5jrwnn5buqku6a0m286rwb.jpg",
        price: 730500,
        code: "11000008926",
	},
	{
		link: "konvektsionnaya-pech-kep-3.html",
        title: "Конвекционная печь КЭП-3",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e29/ea6u5b4rt056gy7kpwc9rr2dctxt26aa.jpg",
        price: 487500,
        code: "11000010020",
	},
	{
		link: "konvektsionnaya-pech-kep-4e.html",
        title: "Конвекционная печь КЭП-4Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ea1/0ez5yz1ctluo6k132pf2wehds285fgh6.jpg",
        price: 662000,
        code: "11000009803",
	},
	{
		link: "konvektsionnaya-pech-kpp-4p.html",
        title: "Конвекционная печь КПП-4П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/35b/a0bh1zxunm0ea8o9xdywbnd25x21olh1.jpg",
        price: 546000,
        code: "11000009802",
	},
	{
		link: "konvektsionnaya-pech-kpp-4e.html",
        title: "Конвекционная печь КПП-4Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d1e/sg8xjb0zanxr09vhidm6h3yhod02qsrj.jpg",
        price: 443500,
        code: "11000009820",
	},
	{
		link: "konvektsionnaya-pech-kpp-4m.html",
        title: "Конвекционная печь КПП-4М",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/b8e/60yqxxx1930wmp95p8z4pw5qne2t7k05.jpg",
        price: 354200,
        code: "11000011324",
	},
	{
		link: "konvektsionnaya-pech-kpp-4em.html",
        title: "Конвекционная печь КПП-4ЭМ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/224/ihnglnbr5jjob2vt648wgs1kjon8pptv.jpg",
        price: 298000,
        code: "11000011323",
	},
	{
		link: "konvektsionnaya-pech-pke-4e-krash.html",
        title: "Конвекционная печь ПКЭ-4Э (краш)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/0c5/h8kx781d27tme2qlcjtcnwb968obpnoa.jpg",
        price: 288750,
        code: "21000000181",
	},
	{
		link: "konvektsionnaya-pech-kpp-4-1-2p.html",
        title: "Конвекционная печь КПП-4-1/2П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/281/n1fsfeo4m9i61b16jia1xtgyybzwa4p3.jpg",
        price: 517000,
        code: "11000009817",
	},
	{
		link: "konvektsionnaya-pech-kpp-4-1-2e.html",
        title: "Конвекционная печь КПП-4-1/2Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/7a6/ezaisbt0l0q9hy0oftzpocps4zcn45xs.jpg",
        price: 420500,
        code: "11000009822",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-12m.html",
        title: "Шкаф расстоечный ШРТ-12М",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e67/ewkdwcaq1jz8u93joijuyc1cfhkkjvo8.jpg",
        price: 474500,
        code: "21000002843",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-12em.html",
        title: "Шкаф расстоечный ШРТ-12ЭМ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/f99/7e7t25227i7wu429e96h1csj6o5zxnnv.jpg",
        price: 404250,
        code: "21000002980",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-12.html",
        title: "Шкаф расстоечный ШРТ-12",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/76e/xm96l3ibefjoxe7mvkrti0st0529jorb.jpg",
        price: 445500,
        code: "21000807854",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-12e.html",
        title: "Шкаф расстоечный ШРТ-12Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/f99/7e7t25227i7wu429e96h1csj6o5zxnnv.jpg",
        price: 376000,
        code: "21000807855",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8.html",
        title: "Шкаф расстоечный ШРТ-8",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/1a9/h0d6clifsyww2218o58x7343wlxvu9or.jpg",
        price: 322500,
        code: "21000807848",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8e.html",
        title: "Шкаф расстоечный ШРТ-8Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a09/gkp2vo010o6zg3qorffjoktyzicsxisy.jpg",
        price: 261000,
        code: "21000009818",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8-01.html",
        title: "Шкаф расстоечный ШРТ-8-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/457/3bnxneyuk5tmrwmm1hrf6j3e9kw3zld4.jpg",
        price: 303000,
        code: "21000011227",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8-01e.html",
        title: "Шкаф расстоечный ШРТ-8-01Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/990/0arh2mhwpdyu3lcug5renz7okaogg0ch.jpg",
        price: 248000,
        code: "21000009922",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8-02.html",
        title: "Шкаф расстоечный ШРТ-8-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/99c/yrkbdvd5bzrsdlvbd6pstvv5ftpusj6x.jpg",
        price: 294500,
        code: "21000009869",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-8-02e.html",
        title: "Шкаф расстоечный ШРТ-8-02Э",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/99c/yrkbdvd5bzrsdlvbd6pstvv5ftpusj6x.jpg",
        price: 234000,
        code: "21000009923",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-4-02.html",
        title: "Шкаф расстоечный ШРТ-4-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/4e4/vbncnwu5jhj4wlbnrc4c712yeev25mni.jpg",
        price: 263500,
        code: "21000009836",
	},
	{
		link: "podstavka-pk-10-6-4.html",
        title: "Подставка ПК-10-6/4",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/170/82l1rnw4ddtkmh86v377idd147t7z4ha.jpg",
        price: 137500,
        code: "11000019249",
	},
	{
		link: "podstavka-pk-6-6-4.html",
        title: "Подставка ПК-6-6/4",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9e1/2qim4c4f24grj0j3gwpst4ya1v1qmqtc.jpg",
        price: 128000,
        code: "11000019494",
	},
	{
		link: "podstavka-pk-8.html",
        title: "Подставка ПК-8",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/416/aa5ag3jr1gqqwtmv35pnu1mxqook1qyo.jpg",
        price: 129000,
        code: "11000009835",
	},
	{
		link: "podstavka-pk-8-01.html",
        title: "Подставка ПК-8-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c60/jwpw1o1eahioj48cstupuh2ll9tcgo0b.jpg",
        price: 125000,
        code: "11000009819",
	},
	{
		link: "konvektsionnaya-pech-kep-16p.html",
        title: "Конвекционная печь КЭП-16П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/615/y7vxhbmpn5dihhbo8g136amz5svl7vm5.jpg",
        price: 2636800,
        code: "11000019141",
	},
// _____________________________________Дегидраторы____________________________________________
	{
		link: "shkaf-sushilnyy-shs-32-1-01-degidrator.html",
        title: "Шкаф сушильный ШС-32-1-01 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9f7/mxxg7y1b1ug08fb7pfw6cuc7lybqeoys.jpg",
        price: 683500,
        code: "71000000383",
	},
	{
		link: "shkaf-sushilnyy-shs-32-1-03-degidrator.html",
        title: "Шкаф сушильный ШС-32-1-03 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/92d/nbieew5tnon32v1j5kdzmo74fl5niabs.jpg",
        price: 752500,
        code: "71000000384",
	},
	{
		link: "shkaf-sushilnyy-shs-32-2v-01-degidrator.html",
        title: "Шкаф сушильный ШС-32-2В-01 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/3f2/avbffz5iaqh984r99gz3s86unxdhr0v2.jpg",
        price: 802500,
        code: "71000000382",
	},
	{
		link: "shkaf-sushilnyy-shs-32-2v-03-degidrator.html",
        title: "Шкаф сушильный ШС-32-2В-03 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/af2/gftwq6enda3z5crx1uboh7pt6u9svxwc.jpg",
        price: 837500,
        code: "71000000379",
	},
	{
		link: "shkaf-sushilnyy-shs-32-2g-01-degidrator.html",
        title: "Шкаф сушильный ШС-32-2Г-01 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bde/zdv2db9l59o82jxfje1w3uayicjlmh8k.jpg",
        price: 1250000,
        code: "71000000381",
	},
	{
		link: "shkaf-sushilnyy-shs-32-2g-03-degidrator.html",
        title: "Шкаф сушильный ШС-32-2Г-03 (дегидратор)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/702/rn904uhbuqr03zrohi6vzhkdrv59fl1h.jpg",
        price: 1295000,
        code: "71000000380",
	},
// _____________________________________Печи для пиццы____________________________________________
{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400.html",
        title: "Конвейерная печь для пиццы ПЭК-400",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/183/9rzsk7og7fbe6ttnsqj4z6z4upzb0ho8.jpg",
        price: 1886450,
        code: "21000801141",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400-modul-dlya-ustanovki-v-2-3-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-400 (модуль для установки в 2, 3 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/0d6/8f063mhek49halg135qdf402fy32qwce.jpg",
        price: 1840600,
        code: "21000801149",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400-s-dvertsey.html",
        title: "Конвейерная печь для пиццы ПЭК-400 с дверцей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/0cb/j9lgj0v1rq1u3m9j03bgc6erzrhutey8.jpg",
        price: 1989950,
        code: "21000002104",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400-s-dvertsey-modul-dlya-ustanovki-v-2-3-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-400 с дверцей (модуль для установки в 2, 3 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/885/8cf9jj2hk3jong6rd0ju4mkisupf6jt7.jpg",
        price: 1946200,
        code: "21000002106",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400p.html",
        title: "Конвейерная печь для пиццы ПЭК-400П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/3d5/9kocpwliu9v0d6e9i4ol3msgtpgie0u0.jpg",
        price: 1998700,
        code: "21000003142",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400p-modul-dlya-ustanovki-v-2-3-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-400П (модуль для установки в 2, 3 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8c0/5xlgtg2nho44raz19s29ysl093yi4jpv.jpg",
        price: 1953900,
        code: "21000003144",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400p-s-dvertsey.html",
        title: "Конвейерная печь для пиццы ПЭК-400П с дверцей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ad2/fu6cdwu0kobvpbsnjs7z2tjc0jt3h0vl.jpg",
        price: 2102750,
        code: "21000003146",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-400p-s-dvertsey-modul-dlya-ustanovki-v-2-3-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-400П с дверцей (модуль для установки в 2, 3 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8fe/g039nsn4j84fb9bnqqlgkv488vs4ebhb.jpg",
        price: 2059000,
        code: "21000003148",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-600.html",
        title: "Конвейерная печь для пиццы ПЭК-600",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/cd8/6wxhiltw3983x3hii0rzb7sm83gmqdqp.jpg",
        price: 2795100,
        code: "21000002875",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-600-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-600 (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/029/q61827c86xnp64kfowgste1mbi8hxbtz.jpg",
        price: 2605900,
        code: "21000003093",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-600-s-dvertsey.html",
        title: "Конвейерная печь для пиццы ПЭК-600 с дверцей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/84c/qh5o7uo05ft6h92akf327qzxf1p1zhe6.jpg",
        price: 2854600,
        code: "21000003092",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-600-s-dvertsey-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-600 с дверцей (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/39f/vksejckuc6pcbb2110pgc09yfb98cpk0.jpg",
        price: 2659500,
        code: "21000003095",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800.html",
        title: "Конвейерная печь для пиццы ПЭК-800",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ce9/rjo08bwnnqzzbfw34ntkpnuyl5gjdnwh.jpg",
        price: 3356250,
        code: "21000002738",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-800 (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/273/7oz8f96yho634bmdcith6fwti36wg1ce.jpg",
        price: 3275900,
        code: "21000001775",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-s-dvertsey.html",
        title: "Конвейерная печь для пиццы ПЭК-800 с дверцей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/70d/axs1els2u05ho30i21h815avf1cs4lbt.jpg",
        price: 3458750,
        code: "21000001771",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-s-dvertsey-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-800 с дверцей (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5bb/pcssb1ppv3mtv9tj07izili9gm6z5z2k.jpg",
        price: 3382000,
        code: "21000001776",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-2.html",
        title: "Конвейерная печь для пиццы ПЭК-800/2",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/2cd/a4peg7t8euaful5rvboi25b2wnagf1l0.jpg",
        price: 3731200,
        code: "21000003136",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-2-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-800/2 (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/25b/ct8t28kyp0jam2xedliwuodz1b3b6do6.jpg",
        price: 3654500,
        code: "21000003140",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-2-s-dvertsey.html",
        title: "Конвейерная печь для пиццы ПЭК-800/2 с дверцей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ba7/31edr9x9p9labslryrnzla8shbzp8uyq.jpg",
        price: 3834700,
        code: "21000003138",
	},
	{
		link: "konveyernaya-pech-dlya-pitstsy-pek-800-2-s-dvertsey-modul-dlya-ustanovki-v-2-yarusa.html",
        title: "Конвейерная печь для пиццы ПЭК-800/2 с дверцей (модуль для установки в 2 яруса)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/362/gzurspc28aewvimsp44v4x2fj8ia73d9.jpg",
        price: 3754900,
        code: "21000003141",
	},
	{
		link: "podstavka-pp-400.html",
        title: "Подставка ПП-400",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/144/ve0qch5qlqo0quzcf2ok0ll1w47gicfu.jpg",
        price: 186000,
        code: "21000801146",
	},
	{
		link: "podstavka-pp-400-01.html",
        title: "Подставка ПП-400-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/03c/wm0hcx0f87lkb7kxqtnyr207qybfdurx.jpg",
        price: 122850,
        code: "21000801150",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-1.html",
        title: "Печь электрическая для пиццы ПЭП-1",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/23a/10p6cha2qyl7ml8e2ds9sjfwc502qsri.jpg",
        price: 302300,
        code: "21000801136",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-1-01-glukhaya-dvertsa.html",
        title: "Печь электрическая для пиццы ПЭП-1-01 (глухая дверца)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9ad/vog4tbck7ck9xhz4jajpesmxnfrrw62v.jpg",
        price: 232250,
        code: "21000001754",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-2.html",
        title: "Печь электрическая для пиццы ПЭП-2",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/905/910mz6u4rr81m9ay5uwlzv3rro6tceuo.jpg",
        price: 358500,
        code: "21000801122",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-4.html",
        title: "Печь электрическая для пиццы ПЭП-4",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9e6/8well7g4632adgufnpp4ob5o8ahoxkt4.jpg",
        price: 475000,
        code: "21000801124",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-4kh2.html",
        title: "Печь электрическая для пиццы ПЭП-4х2",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/780/um7xnomvzdh90e6khhv1jaax7dy40968.jpg",
        price: 840000,
        code: "21000801123",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-6-01-s-kryshey.html",
        title: "Печь электрическая для пиццы ПЭП-6-01 (с крышей)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/290/qvnz2xmhxi0mh9qhv1i54j45qljjycx1.jpg",
        price: 540500,
        code: "21000008354",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-6-bez-kryshi.html",
        title: "Печь электрическая для пиццы ПЭП-6 (без крыши)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/560/e0gframmv3f843ddscgoa93uromalf2m.jpg",
        price: 518000,
        code: "21000002337",
	},
	{
		link: "pech-elektricheskaya-dlya-pitstsy-pep-6kh2-dvukhyarusnaya-na-podstavke.html",
        title: "Печь электрическая для пиццы ПЭП-6х2 (двухярусная на подставке)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/2a3/sq3ufddfilu4ldez3hupbh8akwi3atcs.jpg",
        price: 1114000,
        code: "21000801138",
	},
	{
		link: "podstavka-pp-2.html",
        title: "Подставка ПП-2",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bf5/zx9xe058k3tml75cy5f16e62bd8svilb.jpg",
        price: 63500,
        code: "21000001475",
	},
	{
		link: "podstavka-pp-4.html",
        title: "Подставка ПП-2",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bf5/zx9xe058k3tml75cy5f16e62bd8svilb.jpg",
        price: 73000,
        code: "21000001459",
	},
	{
		link: "podstavka-pp-6.html",
        title: "Подставка ПП-6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/38d/5wk4egvvidaap1m9sjt237t32ohia3r7.jpg",
        price: 80500,
        code: "21000002355",
	},
	{
		link: "podstavka-pp-6-01.html",
        title: "Подставка ПП-6-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/aa3/q1rg7r03vsn9ojy5q0prp7h0zsrpol3z.jpg",
        price: 77500,
        code: "21000002354",
	},
// _____________________________________Подовые пекарские шкафы____________________________________________
{
		link: "podovaya-pech-eshp-1-01kp-3en-super.html",
        title: "Подовая печь ЭШП-1-01КП 3EN Super",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/3f8/kq5q67echdky92vuju10w4ce9kgmxfit.jpg",
        price: 1380000,
        code: "21000005328",
	},
	{
		link: "podovaya-pech-eshp-2-01kp-3en-super.html",
        title: "Подовая печь ЭШП-2-01КП 3EN Super",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a64/bqc07c60llqpialzz940sfahxplqr449.jpg",
        price: 2589750,
        code: "21000005357",
	},
	{
		link: "podovaya-pech-eshp-3-01kp-3en-super.html",
        title: "Подовая печь ЭШП-3-01КП 3EN Super",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ff4/ypjpdgu0l2rabqie1d43zerz29bpgth1.jpg",
        price: 3549750,
        code: "21000002737",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-6-eshp-super.html",
        title: "Шкаф расстоечный ШРТ-6-ЭШП Super",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/1b3/bibdkpn8oqsd2o99bp1subdx5pccde6v.png",
        price: 1158675,
        code: "21000005756",
	},
	{
		link: "podovaya-pech-eshp-3-01kp-320-c-nerzh-kamera.html",
        title: "Подовая печь ЭШП-3-01КП (320 °C) нерж. камера",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/79b/fvhsn7tk3ul364w4zd49pxboabh6thtu.jpg",
        price: 1683500,
        code: "21000801148",
	},
	{
		link: "podovaya-pech-eshp-3-01-320-c-nerzh-kamera.html",
        title: "Подовая печь ЭШП-3-01 (320 °C) нерж. камера",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6b9/tgut73gapi39qo21bqvlf6627hzr47bn.jpg",
        price: 1536500,
        code: "21001801142",
	},
	{
		link: "podovaya-pech-eshp-3kp-320-c.html",
        title: "Подовая печь ЭШП-3КП (320 °C)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/79b/fvhsn7tk3ul364w4zd49pxboabh6thtu.jpg",
        price: 1568175,
        code: "21000801152",
	},
	{
		link: "podovaya-pech-eshp-3-320-c.html",
        title: "Подовая печь ЭШП-3 (320 °C)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6b9/tgut73gapi39qo21bqvlf6627hzr47bn.jpg",
        price: 1391500,
        code: "21000801151",
	},
	{
		link: "podovaya-pech-eshp-3-01-270-c-nerzh-kamera.html",
        title: "Подовая печь ЭШП-3-01 (270 °C) нерж. камера",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6b9/tgut73gapi39qo21bqvlf6627hzr47bn.jpg",
        price: 1252000,
        code: "21000801142",
	},
	{
		link: "podovaya-pech-gsh-2-gazovyy.html",
        title: "Подовая печь ГШ-2 газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d25/24oot6901wkyhiib4678dgoeu7jpw0mt.jpg",
        price: 1093500,
        code: "21000001844",
	},
	{
		link: "podovaya-pech-gsh-1-gazovyy.html",
        title: "Подовая печь ГШ-1 газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e85/q2cscfelk46rwvplx72dxc9hdmv8b1tb.jpg",
        price: 627500,
        code: "21000802034",
	},
	{
		link: "podovaya-pech-esh-1k.html",
        title: "Подовая печь ЭШ-1К",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5eb/mm5ugapv689fk1fhykmzp6a4w21h2y87.jpg",
        price: 458500,
        code: "21000019533",
	},
	{
		link: "podovaya-pech-esh-2k.html",
        title: "Подовая печь ЭШ-2К",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/267/0wyygf11e5ub9qpzlpl81qkqzzon2uhj.jpg",
        price: 782000,
        code: "21010080180",
	},
	{
		link: "podovaya-pech-esh-3k.html",
        title: "Подовая печь ЭШ-3К",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/267/0wyygf11e5ub9qpzlpl81qkqzzon2uhj.jpg",
        price: 1084000,
        code: "21010080177",
	},
	{
		link: "podovaya-pech-esh-4k.html",
        title: "Подовая печь ЭШ-4К",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e5f/o058vqy8kgh65zfnqum32a4bwv6bf45c.jpg",
        price: 1386000,
        code: "21010080178",
	},
	{
		link: "modul-podovoy-pechi-esh-1k-s-kryshey.html",
        title: "Модуль подовой печи ЭШ-1К с крышей",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a32/koidzt62zpc02zhssm35icfsia9do56t.jpg",
        price: 376500,
        code: "21000106502",
	},
	{
		link: "modul-podovoy-pechi-esh-1k-bez-kryshi.html",
        title: "Модуль подовой печи ЭШ-1К без крыши",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/745/qinbwyimjio7roim1yurts3b365fmwpx.jpg",
        price: 353500,
        code: "21008075039",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-4-esh-01-s-kryshey.html",
        title: "Шкаф расстоечный ШРТ 4-ЭШ-01 (с крышей)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bcd/o6tztni1yisxvb3oonumzhwmm124kfzb.jpg",
        price: 427500,
        code: "21001801216",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-4-esh.html",
        title: "Шкаф расстоечный ШРТ 4-ЭШ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9b8/yo6ztreb0xaythq09nitznymepbwm043.jpg",
        price: 389500,
        code: "21000801216",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-6-esh.html",
        title: "Шкаф расстоечный ШРТ 6-ЭШ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e62/ej7rhek0spm3r0rl21h2kvul782cw4w5.jpg",
        price: 457000,
        code: "21000801830",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-6-esh-01-s-kryshey-i-podstavkoy.html",
        title: "Шкаф расстоечный ШРТ 6-ЭШ-01 (с крышей и подставкой)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/56a/ilbbmtuqlp1o1bbo26hd65hcedg1qlsf.jpg",
        price: 567500,
        code: "21000011830",
	},
	{
		link: "zont-vytyazhnoy-vstraivaemyy-zvv-1500p-s-parokondensatorom.html",
        title: "Зонт вытяжной встраиваемый ЗВВ-1500П с пароконденсатором",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/76d/2wkyzaz5qcsc152qhrh70f11afxddl23.png",
        price: 742000,
        code: "21000003116",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-6-6-8.html",
        title: "Шкаф расстоечный ШРТ-6-6/8",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/37b/n2o4a2ean8p1z8w7juahzar52igqyvgh.jpg",
        price: 607500,
        code: "21000807862",
	},
	{
		link: "shkaf-rasstoechnyy-shrt-6-6-8k.html",
        title: "Шкаф расстоечный ШРТ-6-6/8К",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/37b/n2o4a2ean8p1z8w7juahzar52igqyvgh.jpg",
        price: 534600,
        code: "21000807863",
	},
// _____________________________________Контактные грили____________________________________________
{
		link: "ako-30n.html",
        title: "АКО-30Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/f3b/unpsqvhmxdcjij4p7pg08r14aktauqee.jpg",
        price: 174370,
        code: "21000001696",
	},
	{
		link: "gril-lavovyy-elektricheskiy-egl-40-1n-01.html",
        title: "Гриль лавовый электрический ЭГЛ-40/1Н-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c94/5qymbbm6h86mqizmnx9k1q1308oeack4.jpg",
        price: 399500,
        code: "21000011593",
	},
	{
		link: "gril-lavovyy-elektricheskiy-egl-40-1n-00.html",
        title: "Гриль лавовый электрический ЭГЛ-40/1Н-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9ec/bjfncbk34wmt2fdufb1r7gna24gfjm62.jpg",
        price: 424500,
        code: "21000011592",
	},
	
// _____________________________________Кипятильники____________________________________________
{
		link: "kipyatilnik-kve-15.html",
        title: "Кипятильник КВЭ-15",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d4f/vauwxk2t4n472dg2di9qu8f1fred3f2o.jpg",
        price: 93000,
        code: "41000002602",
	},
	{
		link: "kipyatilnik-kve-30.html",
        title: "Кипятильник КВЭ-30",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6c8/9y7yylm4xrg4954m647mhq3d99eqe18q.jpg",
        price: 104000,
        code: "41000002601",
	},
	{
		link: "kipyatilnik-ken-50.html",
        title: "Кипятильник КЭН-50",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/af6/c2ofen78e3a9cxc29tkvhwlearuui213.jpg",
        price: 232500,
        code: "21000019587",
	},
	{
		link: "kipyatilnik-ken-100.html",
        title: "Кипятильник КЭН-100",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/af6/c2ofen78e3a9cxc29tkvhwlearuui213.jpg",
        price: 256000,
        code: "21000019588",
	},
// _____________________________________Газовые плиты____________________________________________
{
		link: "plita-gazovaya-pgk-27n.html",
        title: "Плита газовая ПГК-27Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/546/ftiqf17p439vvsq6qgsvwvxjqzv0zb72.jpg",
        price: 341500,
        code: "21000801318",
	},
	{
		link: "plita-gazovaya-pgk-47n.html",
        title: "Плита газовая ПГК-47Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/706/nfq4w94g09vsz60hoj12bmmydlnx2cjj.jpg",
        price: 579000,
        code: "21000801317",
	},
	{
		link: "plita-gazovaya-pgk-49p.html",
        title: "Плита газовая ПГК-49П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/706/nfq4w94g09vsz60hoj12bmmydlnx2cjj.jpg",
        price: 694575,
        code: "21000802166",
	},
	{
		link: "plita-gazovaya-pgk-49zhsh.html",
        title: "Плита газовая ПГК-49ЖШ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5f7/61dcqzpthhhg1h0c182nzbywqmqsp7oz.jpg",
        price: 1018500,
        code: "21000801314",
	},
	{
		link: "plita-gazovaya-pgk-69p.html",
        title: "Плита газовая ПГК-69П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8e8/0cpofhktmv94k86mb69u83ifjlu623lm.jpg",
        price: 980700,
        code: "21000802167",
	},
	{
		link: "plita-gazovaya-pgk-69zhsh.html",
        title: "Плита газовая ПГК-69ЖШ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c44/kjth75bhtwma1ofoxcta7pep63gta3b7.jpg",
        price: 1357125,
        code: "21000801699",
	},
// _____________________________________Настольные витрины____________________________________________
{
		link: "vitrina-teplovaya-vtn-70.html",
        title: "Витрина тепловая ВТН-70",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/393/huygp5dvpa8hqo3ib8ppz18hpygcq1bt.jpg",
        price: 394500,
        code: "21000807725",
	},
	
// _____________________________________Плиты табуреты____________________________________________
{
		link: "plita-gazovaya-pgk-15p-vok.html",
        title: "Плита газовая ПГК-15П-ВОК",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6cf/3pod9kibnz9xg1pr0p8luv7liolzp3lm.jpg",
        price: 287000,
        code: "21000002741",
	},
	{
		link: "plita-gazovaya-pgk-15p-.html",
        title: "Плита газовая ПГК-15П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/45f/s1we43mflvura0dem0jwwkva5978ksf0.jpg",
        price: 253000,
        code: "21000001909",
	},
		
// _____________________________________Шкафы тепловые передвижные____________________________________________
	{
		link: "teplovoy-shkaf-peredvizhnoy-ptsh-16-1-1.html",
        title: "Тепловой шкаф передвижной ПТШ-16-1-1",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8c6/3owh7vuulz3brnzq1u1k63poh50edcv9.jpg",
        price: 700000,
        code: "21000011790",
	},
	
// _____________________________________Аксессуары____________________________________________
	{
		link: "telezhka-dlya-parokonvektomata-tp-20-1-1.html",
        title: "Тележка для пароконвектомата ТП 20-1/1",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d50/yzg1v51dkiepcporpfgr09cvm2c131n3.jpg",
        price: 286500,
        code: "11000008706",
	},
	{
		link: "spitsa-sgt-20.html",
        title: "Спица СГТ-20",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/96b/g6i2f15983ialxq56gz4gf16hpe0pz1m.jpg",
        price: 26500,
        code: "11000008688",
	},
	{
		link: "filtr-sistema-brita-1001943-purity-c-150.html",
        title: "Фильтр система Brita 1001943 PURITY C 150",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/753/xdlz1fqlzk7usy75jih0d3eiycmkkyzj.jpg",
        price: 101250,
        code: "12001006748",
	},
	{
		link: "reshetka-dlya-kur-gril-rkg-6.html",
        title: "Решетка для кур-гриль РКГ-6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8c1/qvz8dtmje1jx12m8yrtgggmbdfqp6w1i.jpg",
        price: 17000,
        code: "11000019271",
	},
	{
		link: "reshetka-dlya-kur-gril-rkg-9.html",
        title: "Решетка для кур-гриль РКГ-9",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/4fd/fnggvlxgbi2bge0g20tyn900av4cufjq.jpg",
        price: 23000,
        code: "11000007317",
	},
// _____________________________________Индукционные плиты____________________________________________
	{
		link: "induktsionnaya-plita-kip-29p-3-5.html",
        title: "Индукционная плита КИП-29П-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d3a/awffpjacddvyewtxgld732pscxsqv5tq.jpg",
        price: 388000,
        code: "71000019984",
	},
	{
		link: "induktsionnaya-plita-kip-29p-3-5-01.html",
        title: "Индукционная плита КИП-29П-3,5-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/dac/kiry0422h2iwjnalgn1wbmv1g7qv0e2m.jpg",
        price: 410000,
        code: "71000019985",
	},	
	{
		link: "induktsionnaya-plita-kip-29p-5-0.html",
        title: "Индукционная плита КИП-29П-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d3a/awffpjacddvyewtxgld732pscxsqv5tq.jpg",
        price: 434500,
        code: "71000019532",
	},		
	{
		link: "induktsionnaya-plita-kip-29p-5-0-01.html",
        title: "Индукционная плита КИП-29П-5,0-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/dac/kiry0422h2iwjnalgn1wbmv1g7qv0e2m.jpg",
        price: 456000,
        code: "71000019531",
	},			
	{
		link: "induktsionnaya-plita-kip-49p-3-5.html",
        title: "Индукционная плита КИП-49П-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/600/321ebsm2u3z4w9fhpklskllddrv5ixgq.jpg",
        price: 721500,
        code: "71000019406",
	},			
	{
		link: "induktsionnaya-plita-kip-49p-3-5-01.html",
        title: "Индукционная плита КИП-49П-3,5-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/949/sqzhcfxhtwreg8e5pvht4rcq5z9v95jj.jpg",
        price: 747500,
        code: "71000019980",
	},		
	{
		link: "induktsionnaya-plita-kip-49p-5-0.html",
        title: "Индукционная плита КИП-49П-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/600/321ebsm2u3z4w9fhpklskllddrv5ixgq.jpg",
        price: 841500,
        code: "71000019982",
	},		
	{
		link: "induktsionnaya-plita-kip-49p-5-0-01.html",
        title: "Индукционная плита КИП-49П-5,0-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/949/sqzhcfxhtwreg8e5pvht4rcq5z9v95jj.jpg",
        price: 877000,
        code: "71000019983",
	},			
	{
		link: "induktsionnaya-plita-kip-69p-3-5.html",
        title: "Индукционная плита КИП-69П-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/7b5/46t1p8x4o7wmj0nkuc044hsbspco2xu2.jpg",
        price: 946500,
        code: "71000019580",
	},			
	{
		link: "induktsionnaya-plita-kip-69p-3-5-01.html",
        title: "Индукционная плита КИП-69П-3,5-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/37f/cpwwrs0uwly00vefy345piu114zmm80p.jpg",
        price: 995500,
        code: "71000019579",
	},			
	{
		link: "induktsionnaya-plita-kip-69p-5-0.html",
        title: "Индукционная плита КИП-69П-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/7b5/46t1p8x4o7wmj0nkuc044hsbspco2xu2.jpg",
        price: 1197000,
        code: "71000019581",
	},		
	{
		link: "induktsionnaya-plita-kip-69p-5-0-01.html",
        title: "Индукционная плита КИП-69П-5,0-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/37f/cpwwrs0uwly00vefy345piu114zmm80p.jpg",
        price: 1257000,
        code: "71000019582",
	},		
	{
		link: "induktsionnaya-plita-kip-2p-sdvoennyy-induktor-ego.html",
        title: "Индукционная плита КИП-2П (сдвоенный индуктор EGO)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/eb5/rbzx7k4xt3s9x2mxcnebmt53l70b701m.jpg",
        price: 587000,
        code: "71000019400",
	},		
	{
		link: "induktsionnaya-plita-kip-2p-01-sdvoennyy-induktor-ego.html",
        title: "Индукционная плита КИП-2П-01 (сдвоенный индуктор EGO)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/b0c/knmuqj34k65y92lvdd4ng4i1b95lmei6.jpg",
        price: 647500,
        code: "71000005867",
	},			
	{
		link: "induktsionnaya-plita-kip-27n-3-5.html",
        title: "Индукционная плита КИП-27Н-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5e6/q2mhlq3qdpz87j5w9vw94vwjaquhp7s6.jpg",
        price: 376500,
        code: "71000019569",
	},			
	{
		link: "induktsionnaya-plita-kip-27n-5-0.html",
        title: "Индукционная плита КИП-27Н-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5e6/q2mhlq3qdpz87j5w9vw94vwjaquhp7s6.jpg",
        price: 423000,
        code: "71000019572",
	},		
	{
		link: "induktsionnaya-plita-kip-47n-3-5.html",
        title: "Индукционная плита КИП-47Н-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c90/2sbhuf3l97fsh7iugs0fw6m6oxpsaaza.jpg",
        price: 624500,
        code: "71000019568",
	},			
	{
		link: "induktsionnaya-plita-kip-47n-5-0.html",
        title: "Индукционная плита КИП-47Н-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c90/2sbhuf3l97fsh7iugs0fw6m6oxpsaaza.jpg",
        price: 740500,
        code: "71000019570",
	},			
	{
		link: "induktsionnaya-plita-kip-2n-sdvoennyy-induktor-ego.html",
        title: "Индукционная плита КИП-2Н (сдвоенный индуктор EGO)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/522/7c2h7h4au02lhrelddgk7od0vd61q1fp.jpg",
        price: 458000,
        code: "71000019415",
	},				
	{
		link: "induktsionnaya-plita-kip-27n-sdvoennyy-induktor-ego.html",
        title: "Индукционная плита КИП-27Н (сдвоенный индуктор EGO)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/990/rnbfn5jfuj4dp6axte85y4e1zuj3jend.jpg",
        price: 516000,
        code: "71000019409",
	},					
	{
		link: "induktsionnaya-plita-kip-47n-sdvoennyy-induktor-ego.html",
        title: "Индукционная плита КИП-47Н (сдвоенный индуктор EGO)",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/501/npzvp1dmn0x4y8q40tnpps0xqz4qjqv4.jpg",
        price: 886500,
        code: "71000019410",
	},						
	{
		link: "modul-nizhniy-mn-02.html",
        title: "Модуль нижний МН-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/01d/cq3433lutw7pz1kp0vtxvq284r8qwmkc.jpg",
        price: 66000,
        code: "11000001144",
	},							
	{
		link: "modul-nizhniy-mn-04.html",
        title: "Модуль нижний МН-04",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/cff/4ba1j05o8y225wdnozpfgzrtlz4fp3dq.jpg",
        price: 75000,
        code: "71000005035",
	},							
	{
		link: "induktsionnaya-plita-kip-25n-3-5.html",
        title: "Индукционная плита КИП-25Н-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/0d6/l4ndg14ux598p55yfa63i12wlfi90ujp.jpg",
        price: 385000,
        code: "71000019992",
	},							
	{
		link: "induktsionnaya-plita-kip-25n-5-0.html",
        title: "Индукционная плита КИП-25Н-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/0d6/l4ndg14ux598p55yfa63i12wlfi90ujp.jpg",
        price: 430500,
        code: "71000019993",
	},							
	{
		link: "induktsionnaya-plita-kip-35n-3-5.html",
        title: "Индукционная плита КИП-35Н-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/737/zu61v0cl2b997s190zaspkxktyua0i6g.jpg",
        price: 547500,
        code: "71000019994",
	},						
	{
		link: "induktsionnaya-plita-kip-35n-5-0.html",
        title: "Индукционная плита КИП-35Н-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/737/zu61v0cl2b997s190zaspkxktyua0i6g.jpg",
        price: 600000,
        code: "71000019995",
	},					
	{
		link: "modul-nizhniy-mn-25.html",
        title: "Модуль нижний МН-25",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/2a9/tyhililvt7b8afyjph01nwh68wemrpy0.jpg",
        price: 57500,
        code: "71000019996",
	},				
	{
		link: "modul-nizhniy-mn-35.html",
        title: "Модуль нижний МН-35",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/82d/s939m71yxtok7tbudpnptk8izmpr1aow.jpg",
        price: 67500,
        code: "71000019997",
	},				
	{
		link: "induktsionnaya-plita-kip-1n-5-0.html",
        title: "Индукционная плита КИП-1Н-5,0",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/33c/9gnp5v20ggz3vwxszbn8550b2la64c11.jpg",
        price: 197500,
        code: "71000019634",
	},				
	{
		link: "induktsionnaya-plita-kip-1n-3-5.html",
        title: "Индукционная плита КИП-1Н-3,5",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/33c/9gnp5v20ggz3vwxszbn8550b2la64c11.jpg",
        price: 170000,
        code: "71000019635",
	},				
	{
		link: "induktsionnaya-plita-kip-1n-3-5vok.html",
        title: "Индукционная плита КИП-1Н-3,5ВОК",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/09c/tr87akbt2uk7xjz8z4v07129r1mr6gzk.jpg",
        price: 182000,
        code: "71000020001",
	},				
	{
		link: "induktsionnaya-plita-kip-1n-5-0vok.html",
        title: "Индукционная плита КИП-1Н-5,0ВОК",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/4b6/6c8amg0h9hhynupqhfv23v5sznrb39bs.jpg",
        price: 213500,
        code: "71000020002",
	},
	
// _____________________________________Тепловые линии 700, 900____________________________________________
	{
        link: "apparat-kontaktnoy-obrabotki-ako-80-2n-s-01.html",
        title: "Аппарат контактной обработки АКО-80/2Н-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/cc7/s18bl8jt61bizhiw0xnxysw86ekgbch3.jpg",
        price: 482000,
        code: "21000001751",
    },	
	{
		link: "gril-lavovyy-elektricheskiy-egl-40-1n-00.html",
        title: "Гриль лавовый электрический ЭГЛ-40/1Н-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/9ec/bjfncbk34wmt2fdufb1r7gna24gfjm62.jpg",
        price: 424500,
        code: "21000011592",
	},
	{
		link: "gril-lavovyy-elektricheskiy-egl-40-1n-01.html",
        title: "Гриль лавовый электрический ЭГЛ-40/1Н-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c94/5qymbbm6h86mqizmnx9k1q1308oeack4.jpg",
        price: 399500,
        code: "21000011593",
	},					
	{
		link: "modul-nizhniy-mn-02.html",
        title: "Модуль нижний МН-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/01d/cq3433lutw7pz1kp0vtxvq284r8qwmkc.jpg",
        price: 66000,
        code: "11000001144",
	},	
						
	{
		link: "modul-nizhniy-mn-03.html",
        title: "Модуль нижний МН-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5e8/8s6m0ldlnmm4lpy6bt0lvuosj3hhswpu.jpg",
        price: 98880,
        code: "11000001162",
	},						
	{
		link: "frityurnitsa-gfk-40-1n-gazovaya.html",
        title: "Фритюрница ГФК-40.1Н газовая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ce4/qniilgbxivogsh8dlogs23yoaetla07x.jpg",
        price: 595500,
        code: "21000802025",
	},						
	{
		link: "frityurnitsa-gfk-40-2n-gazovaya.html",
        title: "Фритюрница ГФК-40.2Н газовая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/43f/wpdy87w8q9zvevyw103i5aaxzifiwpqu.jpg",
        price: 840500,
        code: "21000001965",
	},							
	{
		link: "gazovarka-gvk-40-1n.html",
        title: "Газоварка ГВК-40/1Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c92/8djhkewstavs7dxxo9zk5679oqqvm7hi.jpg",
        price: 376000,
        code: "21000802002",
	},								
	{
		link: "marmit-gazovyy-gmk-40n.html",
        title: "Мармит газовый ГМК-40Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/eeb/ausxbfj61xkudnucn25vgsiurgvs7kmz.jpg",
        price: 359000,
        code: "21000802020",
	},								
	{
		link: "lavovyy-gril-glk-40n-gazovyy.html",
        title: "Лавовый гриль ГЛК-40Н газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/065/1omvjc8x0dl61nxmkjgix0fq2v4fxf13.jpg",
        price: 345500,
        code: "21000801589",
	},									
	{
		link: "gril-gk-40n-gazovyy.html",
        title: "Гриль ГК-40Н газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bf9/t9m4p5wlxm6poeumlrrlwm956c5hg2km.jpg",
        price: 316500,
        code: "21000802022",
	},										
	{
		link: "apparat-kontaktnoy-obrabotki-gako-40-1n-ch-00-gazovyy.html",
        title: "Аппарат контактной обработки ГАКО-40/1Н-Ч-00 газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c2f/oyqbfu2nbewy4cumr6k3ly0a7g0bqzu4.jpg",
        price: 370000,
        code: "21000802000",
	},											
	{
		link: "apparat-kontaktnoy-obrabotki-gako-40-1n-ch-01-gazovyy.html",
        title: "Аппарат контактной обработки ГАКО-40/1Н-Ч-01 газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a61/6tnb7oazvruudrtbwr3ftrddbrczpfcq.jpg",
        price: 370000,
        code: "21000802030",
	},												
	{
		link: "apparat-kontaktnoy-obrabotki-gako-40-1n-ch-02-gazovyy.html",
        title: "Аппарат контактной обработки ГАКО-40/1Н-Ч-02 газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/39e/bmqz906b94amz0nzwqfn048paym04u2s.jpg",
        price: 370000,
        code: "21000004547",
	},												
	{
		link: "apparat-kontaktnoy-obrabotki-gako-80-2n-ch-00.html",
        title: "Аппарат контактной обработки ГАКО-80/2Н-Ч-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c00/vtk50mp1kvekprim8ojn1z8e7nytuz88.jpg",
        price: 637500,
        code: "21000801587",
	},												
	{
		link: "apparat-kontaktnoy-obrabotki-gako-80-2n-ch-01.html",
        title: "Аппарат контактной обработки ГАКО-80/2Н-Ч-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/70c/teqnw22t5uhj5xapng2l5s1s6eajmgzx.jpg",
        price: 637500,
        code: "21000002716",
	},													
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-2n-ch-02.html",
        title: "Аппарат контактной обработки АКО-80/2Н-Ч-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ade/9dsyx5yowhxuiew7fokap420uebfgnma.jpg",
        price: 637500,
        code: "21000002717",
	},															
	{
		link: "rabochaya-poverkhnost-rpk-40n.html",
        title: "Рабочая поверхность РПК-40Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e92/087c4mzjm5ayjwov2uc5ta9ytqa9n0yd.jpg",
        price: 117000,
        code: "21000000548",
	},																
	{
		link: "frityurnitsa-efk-40-1n-elektricheskaya.html",
        title: "Фритюрница ЭФК-40/1Н электрическая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e30/nj55zn7i6rcbmw4kj32s60apugs5i574.jpg",
        price: 374000,
        code: "21000000543",
	},																	
	{
		link: "frityurnitsa-efk-40-2n-elektricheskaya.html",
        title: "Фритюрница ЭФК-40/2Н электрическая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/4bb/c7mrumapc1weibt46nhjbedz7ydtnd3b.jpg",
        price: 414000,
        code: "21000000542",
	},																		
	{
		link: "frityurnitsa-efk-80-2n-elektricheskaya.html",
        title: "Фритюрница ЭФК-80/2Н электрическая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/828/qg5cug9bkfduw9su4yuw7x4u09fmo6w6.jpg",
        price: 607200,
        code: "21000080402",
	},																		
	{
		link: "elektrovarka-evk-40-1n-s-korzinami-gn-1-3.html",
        title: "Электроварка ЭВК-40/1Н с корзинами GN 1/3",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/b40/vh7umgb0nwd6bdzbyq0zukqhcykkb0ll.jpg",
        price: 422500,
        code: "21000000818",
	},																			
	{
		link: "elektrovarka-evk-40-1n-s-korzinami-gn-1-6.html",
        title: "Электроварка ЭВК-40/1Н с корзинами GN 1/6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/028/ktel2xg8zvif58t4r72kbsjste1an2a1.jpg",
        price: 487775,
        code: "21000001871",
	},																				
	{
		link: "elektrovarka-evk-80-2n-s-korzinami-gn-1-3.html",
        title: "Электроварка ЭВК-80/2Н с корзинами GN 1/3",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a94/yp8rgc70mrg37lqk6fog1vjuoy7wrw14.jpg",
        price: 728000,
        code: "21000001738",
	},																				
	{
		link: "elektrovarka-evk-80-2n-s-korzinami-gn-1-6.html",
        title: "Электроварка ЭВК-80/2Н с корзинами GN 1/6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ce2/lz5lwpm0vswzcd7fzpgq97ga1hrl33yg.jpg",
        price: 859945,
        code: "21000001872",
	},																					
	{
		link: "apparat-kontaktnoy-obrabotki-ako-40-1n-s-00.html",
        title: "Аппарат контактной обработки АКО-40/1Н-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/044/gbvcgkp9vuiifslojghnznam3o8aiy6m.jpg",
        price: 287000,
        code: "21000001739",
	},																					
	{
		link: "apparat-kontaktnoy-obrabotki-ako-40-1n-s-01.html",
        title: "Аппарат контактной обработки АКО-40/1Н-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/549/7tmu5ui4boai603l7023yeszf7eug9a4.jpg",
        price: 287000,
        code: "21000001740",
	},																					
	{
		link: "apparat-kontaktnoy-obrabotki-ako-40-1n-s-02.html",
        title: "Аппарат контактной обработки АКО-40/1Н-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/3a8/caqvyb9zfo0it1d81nao9eu1oruocym3.jpg",
        price: 287000,
        code: "21000001741",
	},																					
	{
		link: "apparat-kontaktnoy-obrabotki-ako-40-1n-ch-00.html",
        title: "Аппарат контактной обработки АКО-40/1Н-Ч-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/044/gbvcgkp9vuiifslojghnznam3o8aiy6m.jpg",
        price: 295500,
        code: "21000000541",
	},																					
	{
		link: "marmit-emk-40n.html",
        title: "Мармит ЭМК-40Н",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/99f/wrmwpgwiaihf08dm11f5771sj2zwjkyi.jpg",
        price: 266500,
        code: "21000000545",
	},																						
	{
		link: "apparat-kontaktnoy-obrabotki-ako-40-1n-ch-02.html",
        title: "Аппарат контактной обработки АКО-40/1Н-Ч-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/3a8/caqvyb9zfo0it1d81nao9eu1oruocym3.jpg",
        price: 295500,
        code: "21000003916",
	},																						
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-1n-s-00.html",
        title: "Аппарат контактной обработки АКО-80/1Н-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/184/uno1bw7uvu1sx66ytvd3rt6bv9ota138.jpg",
        price: 406500,
        code: "21000001742",
	},																							
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-1n-s-01.html",
        title: "Аппарат контактной обработки АКО-80/1Н-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e11/pwqqz3mj4yhftr4zw8r48rx22w7c58j6.jpg",
        price: 406500,
        code: "21000001743",
	},																							
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-1n-s-02.html",
        title: "Аппарат контактной обработки АКО-80/1Н-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/e98/1vqaw9le5c7lfv0hd4rrn7mrtdbnsw1j.jpg",
        price: 406500,
        code: "21000001749",
	},																								
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-2n-ch-00.html",
        title: "Аппарат контактной обработки АКО-80/2Н-Ч-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8b1/ayrtebswqom3abrrpl7s8c31tossu07b.jpg",
        price: 501500,
        code: "21000080401",
	},																								
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-2n-ch-01.html",
        title: "Аппарат контактной обработки АКО-80/2Н-Ч-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/cc7/s18bl8jt61bizhiw0xnxysw86ekgbch3.jpg",
        price: 501500,
        code: "21000008868",
	},																								
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-2n-s-00.html",
        title: "Аппарат контактной обработки АКО-80/2Н-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/8b1/ayrtebswqom3abrrpl7s8c31tossu07b.jpg",
        price: 482000,
        code: "21000001750",
	},																									
	{
		link: "apparat-kontaktnoy-obrabotki-ako-80-2n-s-02.html",
        title: "Аппарат контактной обработки АКО-80/2Н-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/cc7/s18bl8jt61bizhiw0xnxysw86ekgbch3.jpg",
        price: 482000,
        code: "21000001752",
	},																										
	{
		link: "frityurnitsa-gfk-90-2p-gazovaya.html",
        title: "Фритюрница ГФК-90.2П газовая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/5fb/ss0vt5tqkcb36u0j8j2u2afo0tph2p8x.jpg",
        price: 1265000,
        code: "21000000808",
	},																										
	{
		link: "gazovarka-gvk-90-2p.html",
        title: "Газоварка ГВК-90/2П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/7c6/a3iyasx23447pz97nfcjivaj40r4ej78.jpg",
        price: 775500,
        code: "21000802032",
	},																											
	{
		link: "lavovyy-gril-glk-90p.html",
        title: "Лавовый гриль ГЛК-90П",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/1b4/lbk91fpfzy39kfyowfv1yhcbd6xoyer8.jpg",
        price: 690500,
        code: "21000802028",
	},																													
	{
		link: "gril-gk-90p-gazovyy.html",
        title: "Гриль ГК-90П газовый",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/84d/b6etlljh6k8kxp8jonj01x9lss9379wx.jpg",
        price: 651500,
        code: "21000802031",
	},																														
	{
		link: "apparat-kontaktnoy-obrabotki-gako-90-1p-s-00.html",
        title: "Аппарат контактной обработки ГАКО-90/1П-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/bda/wfvde8t8i36f8b1v67al4ec8nfdq4i2k.jpg",
        price: 740000,
        code: "21000802001",
	},																															
	{
		link: "apparat-kontaktnoy-obrabotki-gako-90-1p-s-01.html",
        title: "Аппарат контактной обработки ГАКО-90/1П-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/fec/t7xyeerdqsd0vgx816u37nuvlufj83j1.jpg",
        price: 740000,
        code: "21000003080",
	},																																
	{
		link: "apparat-kontaktnoy-obrabotki-gako-90-1p-s-02.html",
        title: "Аппарат контактной обработки ГАКО-90/1П-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/902/44bccknyii1qhqjlu0c0wzy89y2abhm8.jpg",
        price: 740000,
        code: "21000003081",
	},																																
	{
		link: "frityurnitsa-efk-90-2p-elektrchieskaya.html",
        title: "Фритюрница ЭФК-90/2П электрическая",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/d17/dohkcv3py4htv5fymh8blxdaxprrvfer.jpg",
        price: 644050,
        code: "21000801049",
	},																																
	{
		link: "elektrovarka-evk-90-2p-s-korzinami-gn-1-3.html",
        title: "Электроварка ЭВК-90/2П с корзинами GN 1/3",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a91/d5ktqpcc2180tgp49l5tuft9u042693i.jpg",
        price: 787500,
        code: "21000001753",
	},																																	
	{
		link: "elektrovarka-evk-90-2p-s-korzinami-gn-1-6.html",
        title: "Электроварка ЭВК-90/2П с корзинами GN 1/6",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/23e/e5jdq36miug9ik3db19en1botezb9ak2.jpg",
        price: 919050,
        code: "21000001873",
	},																																		
	{
		link: "marmit-emk-90-2p-elektricheskiy.html",
        title: "Мармит ЭМК-90/2П электрический",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6f3/e8z21gx537t3y95fo24o8ymo0mm5r3gp.jpg",
        price: 467000,
        code: "21000001694",
	},																																		
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1p-s-00.html",
        title: "Аппарат контактной обработки АКО-90/1П-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a04/h8id7c0uaxipgjoe15suxy32fsasv46g.jpg",
        price: 498500,
        code: "21000801052",
	},																																			
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1p-s-01.html",
        title: "Аппарат контактной обработки АКО-90/1П-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/ed2/1n15m9wu1f3f28b5s9j32op5chy49lkf.jpg",
        price: 498500,
        code: "21000002765",
	},																																			
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1p-s-02.html",
        title: "Аппарат контактной обработки АКО-90/1П-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/c0d/4nlustp1i4ds6y69dfvcj5b6k07vjvc5.jpg",
        price: 498500,
        code: "21000002766",
	},																																			
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1kp-s-00.html",
        title: "Аппарат контактной обработки АКО-90/1КП-С-00",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/a5c/bt9b3wrhjiv5s8o4rsesk5x40bttgtp8.jpg",
        price: 437000,
        code: "21000801808",
	},																																			
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1kp-s-01.html",
        title: "Аппарат контактной обработки АКО-90/1КП-С-01",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/6c4/b96j5djxc7fx2t4dkr4xz59ljc46cgp6.jpg",
        price: 437000,
        code: "21000802308",
	},																																				
	{
		link: "apparat-kontaktnoy-obrabotki-ako-90-1kp-s-02.html",
        title: "Аппарат контактной обработки АКО-90/1КП-С-02",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "https://abat.ru/upload/iblock/51c/sm2konlbrxjw039ecsa7vqpac0l8xjv7.jpg",
        price: 437000,
        code: "21000002807",
	},		
	
    // _____________________________________Жарочные поверхности____________________________________________
    {
        link: "zhar_sg470.html",
        title: "Жарочная поверхность СГ-4/7О ",
        desc: "Облицовка жарочной поверхности Rada ПЖЭС-СГ-4/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "/images/products/zhar/1.jpg",
        price: 56520,
        code: "8213",
    },
    {
        link: "zhar_sg47h.html",
        title: "Жарочная поверхность СГ-4/7Н",
        desc: "Корпус жарочной поверхности Rada ПЖЭС-СГ-4/7Н выполнен из нержавеющей стали AISI 304. Черная конструкционная углеродистая сталь, из которой сделана рабочая поверхность, обладает повышенными теплопроводными свойствами и устойчивостью к деформациям. ",
        img: "/images/products/zhar/2.jpg",
        price: 62600,
        code: "8214",
    },
    {
        link: "zhar_sg870.html.html",
        title: "Жарочная поверхность СГ-8/7О",
        desc: "Облицовка жарочной поверхности СК-8/7О выполнена из нержавеющей стали AISI 304, каркас и полка покрыты порошковой краской. Комбинированная поверхность – гладкая + рифленая. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры.",
        img: "/images/products/zhar/3.jpg",
        price: 85859,
        code: "8215",
    },
    {
        link: "zhar_sg87h.html",
        title: "Жарочная поверхность СГ-8/7H",
        desc: "Корпус жарочной поверхности СК-8/7Н выполнен из нержавеющей стали AISI 304. Комбинированная поверхность – гладкая + рифленая. Дно прибора изготовлено из толстолистового материала, что обеспечивает равномерность распределения температуры. ",
        img: "/images/products/zhar/4.jpg",
        price: 98200,
        code: "8216",
    },

    // _____________________________________Сковороды электрические____________________________________________
    
	{
        link: "skovoroda-gsk-80-0-27-40-gazovaya.html",
        title: "Сковорода ГСК-80-0,27-40 газовая",
        desc: "Сковорода газовая кухонная типа ГСК предназначена для жарки продуктов основ ным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в соста ве технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 100-340 С. Нагрев осуществляется горелкой, равномерно распределяющей тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство очистки и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Боковая и задняя обшивки изготовлены из крашенного оцинкованного металла. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/6e5/scgf4mrntndbvm1xyinejcg667424n1n.jpg",
        price: 871500,
        code: "21000802005",
    },
	{
        link: "skovoroda-esk-80-0-27-40-ch-elektricheskaya.html",
        title: "Сковорода ЭСК-80-0,27-40-Ч электрическая",
        desc: "Сковорода электрическая ЭСК-80-0,27-40-Ч предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/dd6/ob9wxfk95ny2992jdtu94whz7lrpp07a.jpg",
        price: 682890,
        code: "21000002806",
    },
	{
        link: "skovoroda-esk-80-0-27-40-k-elektricheskaya.html",
        title: "Сковорода ЭСК-80-0,27-40-К электрическая",
        desc: "Сковорода электрическая ЭСК-80-0,27-40-К  предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/dd6/ob9wxfk95ny2992jdtu94whz7lrpp07a.jpg",
        price: 752325,
        code: "21000001615",
    },
	{
        link: "skovoroda-esk-80-0-27-40-elektricheskaya.html",
        title: "Сковорода ЭСК-80-0,27-40 электрическая",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 10 мм. Позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/bb1/lh09fv4qtjtg9y3d8f80t2b61kg5reos.jpg",
        price: 712425,
        code: "21000001591",
    },
	{
        link: "skovoroda-gsk-90-0-27-40-gazovaya.html",
        title: "Сковорода ГСК-90-0,27-40 газовая",
        desc: "Сковорода газовая кухонная типа ГСК предназначена для жарки продуктов основ ным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в соста ве технологических линий Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 100-340 С. Нагрев осуществляется горелкой, равномерно распределяющей тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство очистки и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Боковая и задняя обшивки изготовлены из крашенного оцинкованного металла. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/c6c/vas0u0j6dyr5u263p15xc1hxwey2h00w.jpg",
        price: 911925,
        code: "21000802006",
    },
	{
        link: "skovoroda-gsk-90-0-47-70-gazovaya.html",
        title: "Сковорода ГСК-90-0,47-70 газовая",
        desc: "Сковорода газовая кухонная типа ГСК предназначена для жарки продуктов основ ным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в соста ве технологических линий Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 100-340 С. Нагрев осуществляется горелкой, равномерно распределяющей тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство очистки и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Боковая и задняя обшивки изготовлены из крашенного оцинкованного металла. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/c6c/vas0u0j6dyr5u263p15xc1hxwey2h00w.jpg",
        price: 1005900,
        code: "21000802007",
    },
	{
        link: "skovoroda-gsk-90-0-67-120-gazovaya.html",
        title: "Сковорода ГСК-90-0,67-120 газовая",
        desc: "Сковорода газовая кухонная типа ГСК предназначена для жарки продуктов основ ным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в соста ве технологических линий Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 100-340 С. Нагрев осуществляется горелкой, равномерно распределяющей тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство очистки и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Боковая и задняя обшивки изготовлены из крашенного оцинкованного металла. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/3d4/5o54mpdy67b4cbc7i88b9i8vddzgrkq8.jpg",
        price: 1500490,
        code: "21000802023",
    },
	{
        link: "skovoroda-gsk-90-0-67-150-gazovaya.html",
        title: "Сковорода ГСК-90-0,67-150 газовая",
        desc: "Сковорода газовая кухонная типа ГСК предназначена для жарки продуктов основ ным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в соста ве технологических линий Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 100-340 С. Нагрев осуществляется горелкой, равномерно распределяющей тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство очистки и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Боковая и задняя обшивки изготовлены из крашенного оцинкованного металла. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/3d4/5o54mpdy67b4cbc7i88b9i8vddzgrkq8.jpg",
        price: 1479500,
        code: "21000802033",
    },
	{
        link: "skovoroda-esk-90-0-27-40.html",
        title: "Сковорода ЭСК-90-0,27-40",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 10 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/30d/vulu2vb3an0jinnm31t0yz93fizz18yo.jpg",
        price: 735525,
        code: "21000001586",
    },
	{
        link: "skovoroda-esk-90-0-27-40-k-s-kompozitnym-dnom.html",
        title: "Сковорода ЭСК-90-0,27-40-К с композитным дном",
        desc: "Сковорода электрическая ЭСК-90-0,27-40-К с композитным дном предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/847/jplh54iarpc90v7h2p4k0cu813s46yip.jpg",
        price: 783240,
        code: "21000001616",
    },
	{
        link: "skovoroda-esk-90-0-27-40-ch.html",
        title: "Сковорода ЭСК-90-0,27-40-Ч",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 15 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/847/jplh54iarpc90v7h2p4k0cu813s46yip.jpg",
        price: 683000,
        code: "21000801585",
    },
	{
        link: "skovoroda-esk-90-0-47-70.html",
        title: "Сковорода ЭСК-90-0,47-70",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 15 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/30d/vulu2vb3an0jinnm31t0yz93fizz18yo.jpg",
        price: 854700,
        code: "21000005862",
    },
	{
        link: "skovoroda-esk-90-0-47-70-ch.html",
        title: "Сковорода ЭСК-90-0,47-70-Ч",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 15 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/30d/vulu2vb3an0jinnm31t0yz93fizz18yo.jpg",
        price: 807850,
        code: " 21000001626",
    },
	{
        link: "skovoroda-esk-90-0-67-120.html",
        title: "Сковорода ЭСК-90-0,67-120",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 15 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/463/gv0f1qvikccb3cepny6g4ao4w1ltpkv5.jpg",
        price: 1169000,
        code: "21000001614",
    },
	{
        link: "skovoroda-esk-90-0-67-150.html",
        title: "Сковорода ЭСК-90-0,67-150",
        desc: "Сковорода электрическая универсальная кухонная типа ЭСК предназначена для жарки продуктов основным способом, пассерования овощей, тушения, а также припускания мясных, рыбных и овощных изделий на предприятиях общественного питания самостоятельно или в составе технологических линий. Сковорода имеет плавную регулировку температуры жарочной поверхности в диапазоне 20-270 С. Нагрев осуществляется ТЭНами, равномерно распределяющими тепло по поверхности чаши. Дно чаши толщиной 15 мм позволяет надежно удерживать тепло в режиме приготовления. Сковорода снабжена механизмом подъема и опускания чаши, что обеспечивает удобство опорожнения и обслуживания сковороды. Крышка предотвращает потерю тепла и фиксируется в любом положении. Сковорода имеет регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/c2e/g0m76rmvaqsq2d13ly4fno0r8wibh0gv.jpg",
        price: 1237000,
        code: "21000001640",
    },
	{
        link: "skovoroda_87.html",
        title: "Сковорода электрическая 28/7",
        desc: "Электрическая сковорода 8/7 предназначена для жарения, тушения, припускания различных блюд и пассирования овощей в кафе, ресторанах, столовых предприятий и школ, а также в крупных супермаркетах. Верхняя, передняя панель и панель управления выполнены из нержавеющей стали, задняя и боковые панели - из крашеного металла, чаша - из черной конструкционной углеродистой стали с повышенными теплопроводными свойствами и устойчивостью к деформации и нержавеющей стали.",
        img: "/images/products/skovoroda/2.jpg",
        price: 126640,
        code: "8224",
    },

    {
        link: "skovoroda_12.html",
        title: "Сковорода электрическая 12/7Н ",
        desc: "Электрическая сковорода 12/7Н предназначена для жарки и тушения мясных, рыбных и овощных блюд. Модель отлично подойдет для приготовления пищи на предприятиях общественного питания, таких как кафе, рестораны и столовые. Удобная система очистки, дополненная душирующим устройством, проста в эксплуатации и не требует дополнительных затрат.",
        img: "/images/products/skovoroda/1.jpg",
        price: 160890,
        code: "8225",
    },

    // _____________________________________Фритюрницы____________________________________________
    {
        link: "frityurnitsa-elektricheskaya-nastolnaya-efk-20-1-3n.html",
        title: "Фритюрница электрическая настольная ЭФК-20-1/3Н",
        desc: "Состоит из каркаса, ванны, корзины и панели управления. Ванна цельнотянутая, из нержавеющей стали. Автоматическое поддержание температуры. Аварийный термовыключатель. Регулируемые по высоте ножки.",
        img: "https://abat.shop/uploads/shop/products/large/62bb4e8c818b8f07a1431c7dba73ce60.jpg",
        price: 114000,
        code: "21000801238",
    },
	{
        link: "frityurnitsa-elektricheskaya-nastolnaya-efk-30-1-2n.html",
        title: "Фритюрница электрическая настольная ЭФК-30-1/2Н",
        desc: "Состоит из каркаса, ванны, корзины и панели управления. Ванна цельнотянутая, из нержавеющей стали. Автоматическое поддержание температуры. Аварийный термовыключатель. Регулируемые по высоте ножки.",
        img: "https://abat.shop/uploads/shop/products/large/3621ff1fb79c054431f21edb2ed262fa.jpg",
        price: 123500,
        code: "21000801240",
    },
	{
        link: "avtomaticheskaya-frityurnitsa-efk-35l.html",
        title: "Автоматическая фритюрница ЭФК-35Л",
        desc: "Состоит из каркаса, ванны, корзины и панели управления. Ванна цельнотянутая, из нержавеющей стали. Автоматическое поддержание температуры. Аварийный термовыключатель. Регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/8eb/q97wuhp8depmrl691194agv914t3c341.jpg",
        price: 3198150,
        code: "11000000410",
    },
	{
        link: "avtomaticheskaya-frityurnitsa-efk-70l.html",
        title: "Автоматическая фритюрница ЭФК-70Л",
        desc: "Состоит из каркаса, ванны, корзины и панели управления. Ванна цельнотянутая, из нержавеющей стали. Автоматическое поддержание температуры. Аварийный термовыключатель. Регулируемые по высоте ножки.",
        img: "https://abat.ru/upload/iblock/a93/smn0sw7558d8ntx91goi7b0t3gkz5jrv.jpg",
        price: 4019500,
        code: "11000000412",
    },
	{
        link: "fryer_sg470.html",
        title: "Фритюрница электрическая 4/7О",
        desc: "Фритюрница 4/7О тепловой предназначена для приготовления блюд в большом объёме масла на предприятиях общественного питания и торговли. Фритюрница электрическая ФЭС-8/7О относится к разряду профессионального кухонного оборудования. Предназначена для жарки во фритюре картофеля, рыбы и других кулинарных и кондитерских изделий.",
        img: "/images/products/fryer/1.jpg",
        price: 79240,
        code: "8226",
    },
    {
        link: "fryer_sg47h.html",
        title: "Фритюрница электрическая 4/7Н",
        desc: "Фритюрница 4/7Н тепловой предназначена для приготовления блюд в большом объёме масла на предприятиях общественного питания и торговли. Фритюрница электрическая ФЭС-8/7О относится к разряду профессионального кухонного оборудования. Предназначена для жарки во фритюре картофеля, рыбы и других кулинарных и кондитерских изделий. ",
        img: "/images/products/fryer/2.jpg",
        price: 94620,
        code: "8227",
    },
    {
        link: "fryer_sg870.html",
        title: "Фритюрница электрическая 8/7О",
        desc: "Фритюрница 8/7О тепловой предназначена для приготовления блюд в большом объёме масла на предприятиях общественного питания и торговли. Фритюрница электрическая ФЭС-8/7О относится к разряду профессионального кухонного оборудования. Предназначена для жарки во фритюре картофеля, рыбы и других кулинарных и кондитерских изделий.",
        img: "/images/products/fryer/3.jpg",
        price: 105890,
        code: "8228",
    },
    {
        link: "fryer_sg87h.html",
        title: "Фритюрница электрическая 8/7H",
        desc: "Фритюрница 8/7H тепловой предназначена для приготовления блюд в большом объёме масла на предприятиях общественного питания и торговли. Фритюрница электрическая ФЭС-8/7H относится к разряду профессионального кухонного оборудования. Предназначена для жарки во фритюре картофеля, рыбы и других кулинарных и кондитерских изделий.",
        img: "/images/products/fryer/4.jpg",
        price: 94620,
        code: "8229",
    },

    // _____________________________________Мармиты вторых блюд____________________________________________
    {
        link: "marmit_sg470.html",
        title: "Мармит вторых блюд 4/7O",
        desc: "Мармит электрический 2-х блюд 4/7О используется для кратковременного сохранения в горячем состоянии вторых блюд, гарниров, соусов. Набор гастроемкостей с крышками и ручками – 3 шт Мармиты выполняются в стационарном (напольном) варианте и могут использоваться на предприятиях общественного питания как самостоятельное изделие, а также в составе тепловой линии. Мармит работает в двух режимах: в режиме парового и водяного подогрева. ",
        img: "/images/products/marmit/1.jpg",
        price: 51155,
        code: "8239",
    },

    {
        link: "marmit_sg47h.html",
        title: "Мармит вторых блюд 4/7H",
        desc: "Мармит электрический 2-х блюд 4/7Н используется для кратковременного сохранения в горячем состоянии вторых блюд, гарниров, соусов. Набор гастроемкостей с крышками и ручками – 3 шт Мармиты выполняются в стационарном (напольном) варианте и могут использоваться на предприятиях общественного питания как самостоятельное изделие, а также в составе тепловой линии. Мармит работает в двух режимах: в режиме парового и водяного подогрева. ",
        img: "/images/products/marmit/2.jpg",
        price: 56345,
        code: "8240",
    },
    {
        link: "marmit_sg870.html",
        title: "Мармит вторых блюд 8/7O",
        desc: "Мармит электрический 2-х блюд 8/7О используется для кратковременного сохранения в горячем состоянии вторых блюд, гарниров, соусов.  Мармиты выполняются в стационарном (напольном) варианте и могут использоваться на предприятиях общественного питания как самостоятельное изделие, а также в составе тепловой линии. Мармит работает в двух режимах: в режиме парового и водяного подогрева. ",
        img: "/images/products/marmit/3.jpg",
        price: 79240,
        code: "8241",
    },
    {
        link: "marmit_sg87h.html",
        title: "Мармит вторых блюд 8/7H",
        desc: "Мармит электрический 2-х блюд 8/7H используется для кратковременного сохранения в горячем состоянии вторых блюд, гарниров, соусов. Мармиты выполняются в стационарном (напольном) варианте и могут использоваться на предприятиях общественного питания как самостоятельное изделие, а также в составе тепловой линии. Мармит работает в двух режимах: в режиме парового и водяного подогрева. ",
        img: "/images/products/marmit/4.jpg",
        price: 88000,
        code: "8242",
    },

    // _____________________________________Жарочные шкафы____________________________________________
         {
    link: "shkaf-zharochnyy-shzhg-1.html",
    title: "Шкаф жарочный ШЖГ-1",
    desc: "Шкаф жарочный газовый типа ШЖГ-1 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/f88/kgac6wscu36bo0kyjmz4qw19jjsz9z7c.jpg",
    price: 471975,
    code: "21000802004",
  },

  {
    link: "shkaf-zharochnyy-shzhg-2.html",
    title: "Шкаф жарочный ШЖГ-2",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/a3b/6v8pvlbvj9skkk1x4ebafv9ojm0elxqa.jpg",
    price: 858900,
    code: "21000802021",
  },

  {
    link: "shkaf-zharochnyy-shzhg-3.html",
    title: "Шкаф жарочный ШЖГ-3",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/db4/wgpfo13u6zp2i0yjycblku1p2bvdat31.jpg",
    price: 1262100,
    code: "21000802024",
  },

  {
    link: "zharochnyy-shkaf-shzhe-1.html",
    title: "Жарочный шкаф ШЖЭ-1",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/2be/o6jwpxskqf6hyd54296048my41iacy3f.jpg",
    price: 296500,
    code: "71000000175",
  },

  {
    link: "zharochnyy-shkaf-shzhe-1-e.html",
    title: "Жарочный шкаф ШЖЭ-1-Э",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/53d/jpfexloylj8z236qwr1r9ithqtdaz3q2.jpg",
    price: 331500,
    code: "71000000161",
  },


  {
    link: "zharochnyy-shkaf-shzhe-1-01.html",
    title: "Жарочный шкаф ШЖЭ-1-01",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/b95/ny0dufbhmmbv98r23gz433e47ddzjqnb.jpg",
    price: 360500,
    code: "71000000298",
  },
  {
    link: "zharochnyy-shkaf-shzhe-1-k-2-1-konvektsiya.html",
    title: "Жарочный шкаф ШЖЭ-1-К-2/1 (конвекция)",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/992/en77ycnhov9y1pl8fwhpoz7jcnwmip6j.jpg",
    price: 539500,
    code: "71000000158",
  },
  {
    link: "zharochnyy-shkaf-shzhe-2.html",
    title: "Жарочный шкаф ШЖЭ-2",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/3dd/g6agnildse5dcq1zgrf9sc3ipta2onev.jpg",
    price: 503500,
    code: "71000000167",
  },
  {
    link: "zharochnyy-shkaf-shzhe-2-e.html",
    title: "Жарочный шкаф ШЖЭ-2-Э",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/809/eizkvp1ksr4tp3swvlhii9tpzz7yf5ge.jpg",
    price: 579000,
    code: "71000000162",
  },
  {
    link: "zharochnyy-shkaf-shzhe-2-k-2-1.html",
    title: "Жарочный шкаф ШЖЭ-2-К-2/1",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/ee1/zh7y5k5phn9zj6lqzoaqrhsz1c1baa3j.jpg",
    price: 930000,
    code: " 71000000159",
  },
  {
    link: "zharochnyy-shkaf-shzhe-3-e.html",
    title: "Жарочный шкаф ШЖЭ-3-Э",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/148/7xkfcy20r8wqjeefdj11nzzwviuyyno4.jpg",
    price: 808000,
    code: "71000001615",
  },
  {
    link: "zharochnyy-shkaf-shzhe-3.html",
    title: "Жарочный шкаф ШЖЭ-3",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/148/7xkfcy20r8wqjeefdj11nzzwviuyyno4.jpg",
    price: 703500,
    code: "71000000109",
  },
  {
    link: "zharochnyy-shkaf-shzhe-3-e.html",
    title: "Жарочный шкаф ШЖЭ-3-Э",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/8fb/znbklii06e2zm4y95a32kqvcfpgzgv7l.jpg",
    price: 808000,
    code: "71000001615",
  },
  {
    link: "zharochnyy-shkaf-shzhe-3-01.html",
    title: "Жарочный шкаф ШЖЭ-3-01",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/61b/j2lyoo6ovk00lhkwt9iovg1nhxrnqx2v.jpg",
    price: 883000,
    code: "71000000300",
  },
  {
    link: "zharochnyy-shkaf-shzhe-3-k-2-1.html",
    title: "Жарочный шкаф ШЖЭ-3-К-2/1",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/148/7xkfcy20r8wqjeefdj11nzzwviuyyno4.jpg",
    price: 1259000,
    code: "71000000160",
  },
  {
    link: "zharochnyy-shkaf-shzhe-2-01.html",
    title: "Жарочный шкаф ШЖЭ-2-01",
    desc: "Шкаф жарочный газовый типа ШЖГ-2 предназначен для жарки полуфабрикатов из мяса, рыбы, овощей, выпечки мелкоштучных мучных изделий и запекания творожных блюд на предприятиях общественного питания самостоятельно или в составе технологических линий.",
    img: "https://abat.ru/upload/iblock/3dd/g6agnildse5dcq1zgrf9sc3ipta2onev.jpg",
    price: 649500,
    code: "71000000299",
  },
	{
        link: "shkaf_921.html",
        title: "Шкаф жарочный 921",
        desc: "Жарочный шкаф предназначен для жарки и запекания широкого спектра блюд на предприятиях общественного питания и в крупных супермаркетах. Каркас шкафа изготовлен из квадратной трубы 20х20х2 мм, фронтальная часть и крыша прибора - из нержавеющей стали AISI 304, боковины - из окрашенной порошковой краской стали, подставка - из квадратной трубы 40х40 мм, оснащена полкой из окрашенной порошковой краской стали.  ",
        img: "/images/products/shkaf/1.jpg",
        price: 50540,
        code: "8221",
    },

    {
        link: "shkaf_922.html",
        title: "Шкаф жарочный 922",
        desc: "Шкаф жарочный 922 предназначен для жарки и запекания широкого спектра блюд на предприятиях общественного питания и в крупных супермаркетах. Каркас шкафа изготовлен из квадратной трубы 20х20х2 мм, фронтальная часть и крыша прибора - из нержавеющей стали AISI 304, боковины - из окрашенной порошковой краской стали, подставка - из квадратной трубы 40х40 мм, оснащена полкой из окрашенной порошковой краской стали.  ",
        img: "/images/products/shkaf/2.jpg",
        price: 86390,
        code: "8222",
    },
    {
        link: "shkaf_923.html",
        title: "Шкаф жарочный 923",
        desc: "Жарочный трёхсекционный шкаф 923 предназначен для жарки и запекания мясных, рыбных и овощных блюд на предприятиях общественного питания. Предусмотрено использование стандартных гастроемкостей 1хGN 2/1 или 2хGN1/1 (для каждой секции).",
        img: "/images/products/shkaf/3.jpg",
        price: 118770,
        code: "8223",
    },

    // _____________________________________Расстоечные шкафы____________________________________________
    {
        link: "proofing_10h.html",
        title: "Шкаф расстоечный 10Н",
        desc: "Шкаф расстоечный 10Н используется на производствах хлебобулочных и кондитерских изделий при расстойке теста. Шкаф можно использовать с пароконвектоматами и конвекционными печами. Модель предусматривает установку противиней и гастроемкостей.Для удобства использования шкафа внутри имеется встроенная подсветка, которая поможет определить степень расстойки теста для дальнейшего приготовления.",
        img: "/images/products/proofing/1.jpg",
        price: 70475,
        code: "8221",
    },

    // _____________________________________Салат бары____________________________________________
    {
        link: "salatbar_neutral.html",
        title: "Салат бар нейтральный",
        desc: "Передвижные салат-бары предназначены для хранения, демонстрации и раздачи блюд. Оснащены складывающимися направляющими для подносов с двух сторон. Верхняя полка в каждой модели защищена декоративным ограждением и имеет в комплекте подсветку.",
        img: "/images/products/salatbar/2.jpg",
        price: 81290,
        code: "8251",
    },
    {
        link: "salatbar_teplovoi.html",
        title: "Салат бар тепловой",
        desc: "Передвижные салат-бары предназначены для хранения, демонстрации и раздачи блюд. Оснащены складывающимися направляющими для подносов с двух сторон. Верхняя полка в каждой модели защищена декоративным ограждением и имеет в комплекте подсветку.",
        img: "/images/products/salatbar/1.jpg",
        price: 125660,
        code: "8252",
    },
    {
        link: "salatbar_holod.html",
        title: "Салат бар охлаждаемый",
        desc: "Передвижные салат-бары предназначены для хранения, демонстрации и раздачи блюд. Оснащены складывающимися направляющими для подносов с двух сторон. Верхняя полка в каждой модели защищена декоративным ограждением и имеет в комплекте подсветку.",
        img: "/images/products/salatbar/3.jpg",
        price: 154770,
        code: "8253",
    },

    // _____________________________________Линии раздачи Вега____________________________________________
    {
        link: "prilavok_uglovoi_vnutrenniy.html",
        title: "Прилавок угловой внутренний",
        desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
        img: "/images/products/linii/products/7.jpg",
        price: 52588,
        code: "8261",
    },
    {
        link: "prilavok_uglovoi_vneshniy.html",
        title: "Прилавок угловой внешний",
        desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. ",
        img: "/images/products/linii/products/8.jpg",
        price: 53840,
        code: "8262",
    },
    {
        link: "prilavok_neutral.html",
        title: "Прилавок нейтральный",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования. ",
        img: "/images/products/linii/products/9.jpg",
        price: 68550,
        code: "8263",
    },
    {
        link: "kassovaya_cabina.html",
        title: "Кассовая кабина",
        desc: "Кассовая кабина предназначен для временного поддержания в горячем виде супов, бульонов и каш. Расположенная на высоте тележек полка с конфорками позволяет легко перемещать тяжелую наплитную посуду для хранения на мармит. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона конфорок отделена от посетителей перегородкой из стекла, предохраняя пищу от внешних воздействий. ",
        img: "/images/products/linii/products/5.jpg",
        price: 76128,
        code: "8264",
    },
    {
        link: "prilavok_dlya_podnosov.html",
        title: "Прилавок для подносов",
        desc: "Прилавок предназначен для раздачи столовых приборов и подносов. В комплектацию входит 6 перфорированных стаканов для столовых приборов.  ",
        img: "/images/products/linii/products/6.jpg",
        price: 107430,
        code: "8265",
    },
    {
        link: "dispenser.html",
        title: "Диспенсер-подогреватель",
        desc: "Диспенсер-подогреватель для тарелок предназначен для нагрева и длительного сохранения в тёплом состоянии тарелок, используемых для раздачи горячей пищи на предприятиях общественного питания самостоятельно или в составе технологической линии раздачи. Две шахты, единовременная загрузка 40-50 тарелок в каждую. Диспенсер-подогреватель комплектуется двумя крышками, которые служат более быстрому нагреву и поддержанию температуры тарелок. ",
        img: "/images/products/linii/products/1.jpg",
        price: 118951,
        code: "8266",
    },
    {
        link: "marmit_pervyh_blyud.html",
        title: "Мармит первых блюд",
        desc: "Мармит первых блюд предназначен для временного поддержания в горячем виде супов, бульонов и каш. Расположенная на высоте тележек полка с конфорками позволяет легко перемещать тяжелую наплитную посуду для хранения на мармит. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона конфорок отделена от посетителей перегородкой из стекла, предохраняя пищу от внешних воздействий. ",
        img: "/images/products/linii/products/4.jpg",
        price: 148501,
        code: "8267",
    },
    {
        link: "marmit_vtoryh_blyud.html",
        title: "Мармит вторых блюд",
        desc: "Мармит вторых блюд предназначен для демонстрации, кратковременного хранения и раздачи посетителям вторых блюд и соусов в горячем состоянии. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона с гастроёмкостями отделена от посетителей перегородкой из стекла (противокашлевым экраном), предохраняя пищу от внешних воздействий. Мармит комплектуется гастроёмкостями. ",
        img: "/images/products/linii/products/3.jpg",
        price: 207600,
        code: "8268",
    },
    {
        link: "prilavok_open.html",
        title: "Прилавок-витрины охлаждаемый",
        desc: "Прилавок охлажденный открытый предназначен для кратковременного хранения, демонстрации и раздачи холодных закусок и напитков. Рабочая температура прилавка устанавливается с помощью электронного терморегулятора. Над прилавком располагается двухъярусная стеклянная полка, усиленная нержавеющим швеллером, на которой размещаются порционные блюда.  Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
        img: "/images/products/linii/products/10.jpg",
        price: 220618,
        code: "8269",
    },
    {
        link: "marmit_universal.html",
        title: "Мармит универсальный",
        desc: "Мармит универсальный для первых и вторых блюд предназначен для демонстрации, кратковременного хранения и раздачи посетителям супов, бульонов, каш, а также вторых блюд и соусов в горячем состоянии. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона с конфоркой и гастроёмкостями отделена от посетителей перегородкой из стекла (проивокашлевым экраном). Мармит комплектуется гастроёмостями. ",
        img: "/images/products/linii/products/2.jpg",
        price: 230718,
        code: "8270",
    },
    {
        link: "prilavok_closed.html",
        title: "Прилавок-витрина охлаждаемый",
        desc: "Прилавок охлаждаемый предназначен для кратковременного хранения, демонстрации и раздачи предварительно охлажденных закусок, салатов, фруктов и напитков. Витрина оснащена подсветкой, электронным терморегулятором температуры и автоматических режимом оттаивания. Витрина открывается с внутренней и внешней стороны (покупателя и персонала). В качестве боковых стенок применяются стеклопакеты, которые эффективнее поддерживают температурный режим в витрине.  ",
        img: "/images/products/linii/products/11.jpg",
        price: 341071,
        code: "8271",
    },

    // _____________________________________Линии раздачи Мастер____________________________________________
    {
        link: "prilavok_dlya_podnosov_1_master.html",
        title: "Прилавок для подносов ПП-1/6",
        desc: "Прилавок предназначен для раздачи столовых приборов и подносов. В комплектацию входит 6 перфорированных стаканов для столовых приборов.  ",
        img: "/images/products/linii/products/19.jpg",
        price: 56844,
        code: "8272",
    },

    {
        link: "kassovaya_cabina_master.html",
        title: "Кассовая кабина",
        desc: "Кассовая кабина предназначен для временного поддержания в горячем виде супов, бульонов и каш. Расположенная на высоте тележек полка с конфорками позволяет легко перемещать тяжелую наплитную посуду для хранения на мармит. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона конфорок отделена от посетителей перегородкой из стекла, предохраняя пищу от внешних воздействий. ",
        img: "/images/products/linii/products/17.jpg",
        price: 77127,
        code: "8273",
    },

    {
        link: "prilavok_dlya_podnosov_2_master.html",
        title: "Прилавок для подносов ПП-2/6",
        desc: "Прилавок предназначен для раздачи столовых приборов и подносов. В комплектацию входит 6 перфорированных стаканов для столовых приборов.  ",
        img: "/images/products/linii/products/18.jpg",
        price: 81677,
        code: "8274",
    },

    {
        link: "prilavok_neutral_master.html",
        title: "Прилавок нейтральный",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/12.jpg",
        price: 84392,
        code: "8275",
    },

    {
        link: "marmit_pervyh_blyud_master.html",
        title: "Мармит первых блюд",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/16.jpg",
        price: 107181,
        code: "8276",
    },

    {
        link: "prilavok_s_polkoi_master.html",
        title: "Прилавок нейтральный с полкой",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/20.jpg",
        price: 108433,
        code: "8277",
    },

    {
        link: "dispenser_master.html",
        title: "Диспенсер-подогреватель",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/13.jpg",
        price: 112488,
        code: "8278",
    },

    {
        link: "marmit_vtoryh_blyud_master.html",
        title: "Мармит вторых блюд",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/15.jpg",
        price: 172287,
        code: "8279",
    },

    {
        link: "prilavok_opened_master.html",
        title: "Прилавок охлаждаемый открытый",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также для установки дополнительного оборудования. В нейтральном столе выделены две розетки для подключения дополнительного оборудования.",
        img: "/images/products/linii/products/21.jpg",
        price: 172536,
        code: "8280",
    },

    {
        link: "marmit_universal_master.html",
        title: "Мармит универсальный",
        desc: "Мармит универсальный для первых и вторых блюд предназначен для демонстрации, кратковременного хранения и раздачи посетителям супов, бульонов, каш, а также вторых блюд и соусов в горячем состоянии. Над мармитом расположена двухъярусная полка, на которой размещаются порционные блюда. Зона с конфоркой и гастроёмкостями отделена от посетителей перегородкой из стекла (проивокашлевым экраном). Мармит комплектуется гастроёмостями.  ",
        img: "/images/products/linii/products/14.jpg",
        price: 209101,
        code: "8281",
    },

    {
        link: "prilavok_closed_master.html",
        title: "Прилавок-витрина охлаждаемый закрытый",
        desc: "Прилавок охлаждаемый предназначен для кратковременного хранения, демонстрации и раздачи предварительно охлажденных закусок, салатов, фруктов и напитков. Витрина оснащена подсветкой, электронным терморегулятором температуры и автоматических режимом оттаивания. Витрина открывается с внутренней и внешней стороны (покупателя и персонала). В качестве боковых стенок применяются стеклопакеты, которые эффективнее поддерживают температурный режим в витрине. Рабочая температура прилавка устанавливается с помощью электронного терморегулятора.  ",
        img: "/images/products/linii/products/23.jpg",
        price: 285226,
        code: "8282",
    },

    // _____________________________________Линии раздачи Школьник____________________________________________
    {
        link: "prilavok_dlya_podnosov_1_school.html",
        title: "Прилавок для подносов ПП-1/6",
        desc: "Прилавок предназначен для раздачи хлеба, столовых приборов и подносов. В комплектацию прилавка входят стаканы с перфорацией для столовых приборов. Внизу расположен инвентарный шкаф. ",
        img: "/images/products/linii/products/29.jpg",
        price: 53904,
        code: "8291",
    },

    {
        link: "kassovaya_cabina_school.html",
        title: "Кассовая кабина",
        desc: "Кассовый прилавок предназначен для установки кассового аппарата и работы кассира. Предусмотрено угловое размещение кассира, которое создаёт дополнительные удобства в работе: кассир находится вполоборота к клиенту, у кассира появляется место для размещения не только кассового аппарата, но и компьютера и комфортной работы с ним (пространство для рук). В столешнице находятся отверстия с заглушками для вывода проводов кассового оборудования.",
        img: "/images/products/linii/products/27.jpg",
        price: 60805,
        code: "8292",
    },

    {
        link: "prilavok_dlya_podnosov_2_school.html",
        title: "Прилавок для подносов ПП-2/6",
        desc: "Прилавок предназначен для раздачи хлеба, столовых приборов и подносов. В комплектацию прилавка входят стаканы с перфорацией для столовых приборов. Внизу расположен инвентарный шкаф. ",
        img: "/images/products/linii/products/28.jpg",
        price: 62777,
        code: "8293",
    },

    {
        link: "prilavok_neutral_school.html",
        title: "Прилавок нейтральный",
        desc: "Прилавок нейтральный предназначен для раздачи готовых блюд, горячих и холодных напитков, десертов, а также установки дополнительного оборудования. В нейтральном столе выведены две розетки для подключения дополнительного оборудования. ",
        img: "/images/products/linii/products/30.jpg",
        price: 83483,
        code: "8294",
    },

    {
        link: "marmit_pervyh_blyud_school.html",
        title: "Мармит первых блюд",
        desc: "Мармит первых блюд предназначен для временного поддержания в горячем виде супов, бульонов и каш. Расположенная на высоте тележек полка с конфорками позволяет легко перемещать тяжёлую наплитную посуду для хранения на мармит. Над мармитом расположена полка, на которой размещаются порционные блюда.",
        img: "/images/products/linii/products/26.jpg",
        price: 99425,
        code: "8295",
    },
    {
        link: "marmit_vtoryh_blyud_school.html",
        title: "Мармит вторых блюд",
        desc: "Мармит вторых блюд предназначен для демонстрации, кратковременного хранения и раздачи посетителям вторых блюд и соусов в горячем состоянии. Над мармитом расположена двухуровневая полка, на которой размещаются порционные блюда. Мармит комплектуется гастроёмкостями.",
        img: "/images/products/linii/products/25.jpg",
        price: 153162,
        code: "8296",
    },
    {
        link: "prilavok_opened_school.html",
        title: "Прилавок-витрина охлаждаемый открытый",
        desc: "Прилавок охлаждаемый открытый предназначен для кратковременного хранения, демонстрации и раздачи холодных закусок и напитков. Рабочая температура прилавка устанавливается с помощью механического регулятора. ",
        img: "/images/products/linii/products/31.jpeg",
        price: 172536,
        code: "8297",
    },

    {
        link: "marmit_universal_school.html",
        title: "Мармит универсальный",
        desc: "Мармит универсальный первых и вторых блюд предназначен для демонстрации, кратковременного хранения и раздачи посетителям супов, бульонов, каш, а также вторых блюд и соусов в горячем состоянии. Над мармитом расположена двухуровневая полка, на которой размещаются порционные блюда. Мармит комплектуется гастроёмкостями.",
        img: "/images/products/linii/products/24.jpeg",
        price: 187018,
        code: "8298",
    },

    {
        link: "prilavok_closed_school.html",
        title: "Прилавок-витрина охлаждаемый закрытый",
        desc: "Прилавок охлаждаемый предназначен для кратковременного хранения, демонстрации и раздачи предварительно охлаждённых закусок, салатов, фруктов и напитков. Витрина оснащена подсветкой, электронным терморегулятором и автоматическим режимом оттаивания. Витрина открывается с внутренней и внешней стороны (покупателя и персонала). В качестве боковых стенок применяются стеклопакеты, которые эффективно поддерживают температурный режим в витрине. Рабочая температура прилавка устанавливается с помощью электронного терморегулятора. ",
        img: "/images/products/linii/products/32.jpg",
        price: 282234,
        code: "8299",
    },

// _____________________________________Линии раздачи Аста____________________________________________
{
    link: "prilavok-dlya-stolovykh-priborov-pspkh-70km.html",
    title: "Прилавок для столовых приборов ПСПХ-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/71b/k80nrzmcfr47x73ngqlkky1vac52omer.jpg",
    price: 196500,
    code: "21000802696",
},
{
    link: "prilavok-dlya-stolovykh-priborov-psp-70km.html",
    title: "Прилавок для столовых приборов ПСП-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/d5e/kkikvmv7j73r9rlsqhmtn0yn8ggqjsnk.jpg",
    price: 181000,
    code: "21000802690",
},
{
    link: "prilavok-dlya-podogreva-tarelok-pte-70km-80.html",
    title: "Прилавок для подогрева тарелок ПТЭ-70КМ-80",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/10b/7l8q6jr6yoyk904sdzicplmy9tfsmkyd.jpg",
    price: 391050,
    code: "21000807546",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/72c/hum4h46llkucngb0jxahae4yr2o5fx61.jpg",
    price: 520000,
    code: "21000802820",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-01-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-01-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/76b/xbruoawa6gzqwe092zry5jmffif5vog5.jpg",
    price: 595500,
    code: "21000802821",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-02-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-02-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/ce8/n26819buqppxmshel5yfcw9zug1hl244.jpg",
    price: 549000,
    code: "21000802822",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-03-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-03-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/419/9ngx0o7pykojiw12nv25exk3bpltkrc3.jpg",
    price: 626000,
    code: "21000802823",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-s-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-С-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/ec7/fs82ng3b1qxwkt9p26n05kco4a0x5yuj.jpg",
    price: 980500,
    code: "21000001020",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-s-01-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-С-01-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/8b3/nn56669fh8def6w7git8g907or2qmdkc.jpg",
    price: 1120500,
    code: "21000001021",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-s-02-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-С-02-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/87c/q8bd550macin71y0l7dxvrg1x07z8jf0.jpg",
    price: 1115500,
    code: "21000001022",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-s-03-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-С-03-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/7e4/emn76dtnc3wu681jb4nkfsba3aibbeyu.jpg",
    price: 1268000,
    code: "21000001023",
},

{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70km-s-01-ok.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70КМ-С-01-ОК",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b73/mh87h4vs70bit3t2efxwzvvmmdkneu3a.jpg",
    price: 1457000,
    code: "21000804962",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70km-02.html",
    title: "Прилавок-витрина тепловой ПВТ-70КМ-02",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/635/b9nreb9aafgm2z2areacn8ueltph2t3p.jpg",
    price: 489500,
    code: "21000807561",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70km.html",
    title: "Прилавок-витрина тепловой ПВТ-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/4f1/adtu1psc2uiuz122g11z1921y5g7n33x.jpg",
    price: 792000,
    code: "21000802090",
},
{
    link: "prilavok-vitrina-neytralnyy-pvn-70km.html",
    title: "Прилавок-витрина нейтральный ПВН-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/d3f/f8zbc5hpm4adv5tpi5somrttdwkhdit8.jpg",
    price: 681500,
    code: "21000002733",
},
{
    link: "marmit-pmes-70km.html",
    title: "Мармит ПМЭС-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/ea9/h3f17s2rcvbbu5pbvlbgudsgb0dw2ooa.jpg",
    price: 391050,
    code: "21000802692",
},
{
    link: "marmit-pmes-70km-01.html",
    title: "Мармит ПМЭС-70КМ-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/237/7re0td6ejij2zdgtx4ti7z6iz0lsyc6p.jpg",
    price: 458700,
    code: "21000802012",
},
{
    link: "marmit-pmes-70km-60.html",
    title: "Мармит ПМЭС-70КМ-60",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/691/w0ffqne9cpfv2vhaqqzgjktuibyjc468.jpg",
    price: 534600,
    code: "21000802107",
},
{
    link: "marmit-pmes-70km-80.html",
    title: "Мармит ПМЭС-70КМ-80",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b89/ckkwky0gpippnrobgxmlwvt372kw1jnj.jpg",
    price: 628650,
    code: "21000802111",
},
{
    link: "marmit-emk-70kmu.html",
    title: "Мармит ЭМК-70КМУ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/458/qs8uwuh46sh4b9erkg1y5ywjr2hempta.jpg",
    price: 729500,
    code: "21001802093",
},
{
    link: "marmit-emk-70kmsh.html",
    title: "Мармит ЭМК-70КМШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/6b2/m6f48cw38ljs7cgww12jr0o237z3t35e.jpg",
    price: 877800,
    code: "21001807527",
},
{
    link: "marmit-emk-70km-s-podogrevaemymi-polkami.html",
    title: "Мармит ЭМК-70КМ с подогреваемыми полками",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/691/w0ffqne9cpfv2vhaqqzgjktuibyjc468.jpg",
    price: 653750,
    code: "21000802500",
},
{
    link: "marmit-emk-70km-01-s-podogrevaemymi-polkami.html",
    title: "Мармит ЭМК-70КМ-01 с подогреваемыми полками",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b89/ckkwky0gpippnrobgxmlwvt372kw1jnj.jpg",
    price: 796950,
    code: "21000802501",
},
{
    link: "marmit-emk-70km.html",
    title: "Мармит ЭМК-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/691/w0ffqne9cpfv2vhaqqzgjktuibyjc468.jpg",
    price: 604000,
    code: "21001802693",
},
{
    link: "marmit-emk-70km-01.html",
    title: "Мармит ЭМК-70КМ-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b89/ckkwky0gpippnrobgxmlwvt372kw1jnj.jpg",
    price: 717200,
    code: "21001802009",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70km.html",
    title: "Прилавок для горячих напитков ПГН-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/117/2ytg6qd7t3inqhbs5ppd5153kc2kcvnk.jpg",
    price: 342000,
    code: "21000802694",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70km-01.html",
    title: "Прилавок для горячих напитков ПГН-70КМ-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/118/t772pf320o5jgrob9e08lan4m5z1d77a.jpg",
    price: 395500,
    code: "21000802015",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70km-02.html",
    title: "Прилавок для горячих напитков ПГН-70КМ-02",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/a1e/2if7na32rzx9m2sl1pi6y0lsp3fq2vaf.jpg",
    price: 275010,
    code: "21000802017",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70km-03.html",
    title: "Прилавок для горячих напитков ПГН-70КМ-03",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/635/b9nreb9aafgm2z2areacn8ueltph2t3p.jpg",
    price: 326510,
    code: "21000802018",
},
{
    link: "kassovaya-kabina-kk-70km.html",
    title: "Кассовая кабина КК-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/600/33gdchlqsd3c7l3toeu3afclntrnei54.jpg",
    price: 252350,
    code: "21000802695",
},
{
    link: "modul-neytralnyy-povorotnyy-mn-70km.html",
    title: "Модуль нейтральный поворотный МН-70КМ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/600/33gdchlqsd3c7l3toeu3afclntrnei54.jpg",
    price: 252350,
    code: "21000803570",
},
{
    link: "modul-neytralnyy-povorotnyy-mp-45km-vneshniy.html",
    title: "Модуль нейтральный поворотный МП-45КМ (внешний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/901/pggy7l7v8kv3ekkz3epvez6x97eyktsb.jpg",
    price: 185915,
    code: "21000801867",
},
{
    link: "modul-neytralnyy-povorotnyy-mp-90km-vneshniy.html",
    title: "Модуль нейтральный поворотный МП-90КМ (внешний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/a50/z1szr94hmm5fl2zco7e1xdeki3hw0nvk.jpg",
    price: 210120,
    code: "21000801864",
},
{
    link: "modul-neytralnyy-povorotnyy-mp-45km-01-vnutrenniy.html",
    title: "Модуль нейтральный поворотный МП-45КМ-01 (внутренний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/e95/aisisz8xsz70giy50b7vwit2l2ej41tk.jpg",
    price: 168500,
    code: "21000802092",
},
{
    link: "modul-neytralnyy-povorotnyy-mp-90km-01-vnutrenniy.html",
    title: "Модуль нейтральный поворотный МП-90КМ-01 (внутренний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/1f7/op4eydzxkos06w0n250wz10jwidb1if8.jpg",
    price: 220000,
    code: "21000802091",
},

// _____________________________________Линии раздачи Hot line____________________________________________
{
    link: "prilavok-dlya-stolovykh-priborov-psp-70kh.html",
    title: "Прилавок для столовых приборов ПСП-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/61f/cr0ss9m36qlc2obeg1kvyv68zqxeswnc.jpg",
    price: 191000,
    code: "21000001850",
},
{
    link: "prilavok-dlya-stolovykh-priborov-pspkh-70kh.html",
    title: "Прилавок для столовых приборов ПСПХ-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/16a/lyfua3x3sxs1ap9kgfay488oqw4bfaqt.jpg",
    price: 308000,
    code: "21000001852",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-s-01-ok.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-С-01-ОК",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/132/jhc57xddu6qug9k1gyyzv6fc0qpiy0b9.jpg",
    price: 1458000,
    code: "21000005391",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-s-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-С-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/163/oxq0fu1ac3uzb769lgteqija5ttg7wts.jpg",
    price: 1106500,
    code: "21000009703",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-s-01-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-С-01-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/dd8/krh458q57gnu8yoc3szw6wh69jupl12i.jpg",
    price: 1230500,
    code: "21000001968",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-s-02-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-С-02-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/367/e8df6chf0npgeo2u3ke58vfv2pb6jonn.jpg",
    price: 1005000,
    code: "21000002981",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-03-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-03-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/e66/n48ughw391g5t3mcyk2zdtalel7uzpdc.jpg",
    price: 783000,
    code: "21000002712",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-04-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-04-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/e66/n48ughw391g5t3mcyk2zdtalel7uzpdc.jpg",
    price: 628000,
    code: "21000003039",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-05-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-05-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/e51/91gs26xdlvicxj4w3lhjrla90stix3i5.jpg",
    price: 701000,
    code: "21000003041",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-02-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-02-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/fca/e2utnbv89w5tw50gpbgef2d17rr0tvkj.jpg",
    price: 710500,
    code: "21000002814",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-06-nsh.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-06",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b67/vtlm3l0p21kx06k4hoc8zjguemxaug2m.jpg",
    price: 679000,
    code: "21000003129",
},
{
    link: "prilavok-dlya-kholodnykh-zakusok-pvv-n-70kh-07-nsh.html",
    title: "Прилавок для холодных закусок ПВВ(Н)-70Х-07-НШ",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/92c/npyl9a5hb28jjfom3zel4rqkcg1d039n.jpg",
    price: 751500,
    code: "21000003045",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/f57/ddw1imhmq1956guq7c2n4u1y184l69e4.jpg",
    price: 816000,
    code: "21000002879",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-01.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b25/qlf1nytwo0i0ds29bkpk2jrnam2cr7cm.jpg",
    price: 909500,
    code: "21000004519",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-02.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-02",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/89c/g52snj7z5f4lcr84hlgmo2l3ylr0k4wg.jpg",
    price: 495500,
    code: "21000003118",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-03.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-03",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/a68/nhwpug8adhphtb27h1ki9jwlgj4i8zhr.jpg",
    price: 557000,
    code: "21000003120",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-04.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-04",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/468/gyw8ch6j2xoze016tbawn700b0djyebd.jpg",
    price: 592500,
    code: "21000003122",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-05.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-05",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/752/n9fynesphe5um2ty6k2xyr8caknj1m7e.jpg",
    price: 671500,
    code: "21000003125",
},
{
    link: "prilavok-vitrina-teplovoy-pvt-70kh-07.html",
    title: "Прилавок-витрина тепловой ПВТ-70Х-07",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/bb7/lfqiet3ukccqo2iv6n6a7ekfaq5p8mxc.jpg",
    price: 712000,
    code: "21000003131",
},
{
    link: "prilavok-marmit-elektricheskiy-pmes-70kh.html",
    title: "Прилавок-мармит электрический ПМЭС-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/233/4z864j7iwmag1do05477c724n0noj3l0.jpg",
    price: 439000,
    code: "21000009702",
},
{
    link: "marmit-elektricheskiy-emk-70kh.html",
    title: "Мармит электрический ЭМК-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/34d/737e65g3of1xsh4vkgk0fmr9tdpbqext.png",
    price: 688510,
    code: "21000001927",
},
{
    link: "marmit-elektricheskiy-emk-70kh-s-podogrevaemoy-polkoy.html",
    title: "Мармит электрический ЭМК-70Х с подогреваемой полкой",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/7d6/jc1qdasd68b4pjopt72ryhusm3oj80sx.jpg",
    price: 759000,
    code: "21000002880",
},
{
    link: "marmit-elektricheskiy-emk-70kh-01.html",
    title: "Мармит электрический ЭМК-70Х-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/d69/5cs970yyq7bhhho5vuvba8t88zhp651c.jpg",
    price: 772750,
    code: "21000002721",
},
{
    link: "marmit-elektricheskiy-emk-70kh-02.html",
    title: "Мармит электрический ЭМК-70Х-02",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/e02/m7yw9uxtcdi5ivguzl4esxnnlaty1do2.jpg",
    price: 708950,
    code: "21000009701",
},
{
    link: "marmit-elektricheskiy-emk-70kh-03.html",
    title: "Мармит электрический ЭМК-70Х-03",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/a24/zj5r9tickcz5ztdceoxwd979k55qnqms.jpg",
    price: 796950,
    code: "21000001918",
},
{
    link: "marmit-elektricheskiy-emku-70kh.html",
    title: "Мармит электрический ЭМКУ-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/4bf/hwat4fnqy811afe8aw6c565wt4q1h375.jpg",
    price: 799500,
    code: "21000007100",
},
{
    link: "marmit-elektricheskiy-emku-70kh-01.html",
    title: "Мармит электрический ЭМКУ-70Х-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/2ca/1v7hx5zo60ri6rqnuaojsk17nir40arg.jpg",
    price: 844500,
    code: "21000007037",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh.html",
    title: "Прилавок для горячих напитков ПГН-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/89c/g52snj7z5f4lcr84hlgmo2l3ylr0k4wg.jpg",
    price: 299000,
    code: "21000001845",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh-01.html",
    title: "Прилавок для горячих напитков ПГН-70Х-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/a68/nhwpug8adhphtb27h1ki9jwlgj4i8zhr.jpg",
    price: 346000,
    code: "21000001916",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh-02.html",
    title: "Прилавок для горячих напитков ПГН-70Х-02",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/430/2tssh1rv7xjqyaxnc4ugv9eisfieihbm.jpg",
    price: 387500,
    code: "21000002787",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh-03.html",
    title: "Прилавок для горячих напитков ПГН-70Х-03",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/752/n9fynesphe5um2ty6k2xyr8caknj1m7e.jpg",
    price: 474000,
    code: "21000007017",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh-04.html",
    title: "Прилавок для горячих напитков ПГН-70Х-04",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/c89/en5b969yl48tesu0yeztqc6fi2zndlmf.jpg",
    price: 438000,
    code: "21000002771",
},
{
    link: "prilavok-dlya-goryachikh-napitkov-pgn-70kh-05.html",
    title: "Прилавок для горячих напитков ПГН-70Х-05",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/ba1/b7cv3r8grbx1d73gvw0krhphhdr0p99x.png",
    price: 528500,
    code: "21000002791",
},
{
    link: "kabina-kassovaya-kk-70kh.html",
    title: "Кабина кассовая КК-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/7e9/6hcf32zra8utcai6lixvnc79kut49i16.jpg",
    price: 264000,
    code: "21000001645",
},
{
    link: "modul-neytralnyy-mn-70kh.html",
    title: "Модуль нейтральный МН-70Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/682/8yup325sjndadoox8mp2pral9glp49q0.jpg",
    price: 165000,
    code: "21000001966",
},
{
    link: "modul-neytralnyy-mn-45kh.html",
    title: "Модуль нейтральный МН-45Х",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/1a4/niu08vmdf7qh5rpng42jjuug9heed1oa.jpg",
    price: 168500,
    code: "21000002188",
},
{
    link: "modul-neytralnyy-mn-45kh-01.html",
    title: "Модуль нейтральный МН-45Х-01",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/0b2/pu23t0bolfkdkfh735sih38kjffcsury.jpg",
    price: 160500,
    code: "21000002128",
},
{
    link: "modul-neytralnyy-mp-90kh-vneshniy.html",
    title: "Модуль нейтральный МП-90Х (внешний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/3b4/3kz11ogca9ak2k5joa7c6k7rc7ivfzrn.jpg",
    price: 207000,
    code: "21000003068",
},
{
    link: "modul-neytralnyy-mp-90kh-01-vnutrenniy.html",
    title: "Модуль нейтральный МП-90Х-01 (внутренний)",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/b1c/fk07tekrpj2fqh7i705rfwmcpx7kydn9.jpg",
    price: 226500,
    code: "21000001991",
},
{
    link: "prilavok-dlya-podogreva-tarelok-pte-70kh-80.html",
    title: "Прилавок для подогрева тарелок ПТЭ-70Х-80",
    desc: "Прилавки угловые изготавливаются в двух видах и типоразмер: внешние угловые прилавки (45 и 90 градусов) и внутренние угловые прилавки (45 и 90 градусов). Эти элементы позволяют проектировать и исполнять гибкие формы для расстановки линии в зависимости от заявленных к использованию площадей клиента. Сочетает в себе гибкость конфигурации, высокое качество комплектующих и уникальные конструкторские решения. ",
    img: "https://abat.ru/upload/iblock/64c/c3wyrxx7rqb07srj834elvhe4r0raiil.jpg",
    price: 402050,
    code: "21000001767",
},

    // _____________________________________Столы из нержавейки____________________________________________
    {
        link: "stol_polka_sploshnaya.html",
        title: "Стол разделочный, полка сплошная",
        desc: "Столещница и полка стола разделочно-производственного изготовлены из нержавейки t=0,5 AISI 430, столешница усилена с внутренней стороны листом ламинированной древесностружечной плиты (ЛДСП), что увеличивает прочность и исключает прогиб столешницы.Каркас оцинкованный, стойки-уголок",
        img: "/images/products/neutral/stol/main/7.jpg",
        price: 26080,
        code: "2507",
    },

    {
        link: "stol_opened.html",
        title: "Стол, нержавеющая сталь, открытый",
        desc: "Стол открытый предназначен для разделывания и обработки пищевых продуктов, а также для установки кухонного оборудования в предприятиях общественного питания, магазинах, заготовочных предприятиях.",
        img: "/images/products/neutral/stol/main/1.jpg",
        price: 22680,
        code: "2501",
    },
    {
        link: "stol_polka_reshetka.html",
        title: "Стол разделочный, полка-решетка",
        desc: "Столы разделочно-производственные предназначены для разделывания и обработки пищевых продуктов, а также для установки кухонного оборудования в предприятиях общественного питания, магазинах, заготовочных предприятиях.",
        img: "/images/products/neutral/stol/main/8.jpg",
        price: 26080,
        code: "2508",
    },
    {
        link: "stol_tumba_truba.html",
        title: "Стол разделочно-производственный, стойки - труба",
        desc: "Столешница и полка стола изготовлены из нержавейки t=0,5 AISI 430, столешница стола усилена ЛДСП t=16мм; стойки - труба d=40, t=1,0, каркас оцинкованный.",
        img: "/images/products/neutral/stol/main/12.jpg",
        price: 43515,
        code: "2511",
    },
    {
        link: "stol_tumba_kupe.html",
        title: "Стол-тумба купе",
        desc: "Столы-тумбы купе (СТК) предназначены для использования в качестве профессионального стола и предназначены для разделки и последующей обработки пищевых продуктов. Благодаря наличию закрытого объема, столы-тумбы купе обеспечивают аккуратный внешний вид кухни и используются для хранения посуды, инвентаря, столовых приборов и сухих продуктов.",
        img: "/images/products/neutral/stol/main/9.jpg",
        price: 82970,
        code: "2509",
    },

    {
        link: "stol_closed.html",
        title: "Стол, нержавеющая сталь, закрытый",
        desc: "Стол закрытый предназначен для использования в качестве профессионального стола, а также для хранения посуды и кухонного инвентаря в предприятиях общественного питания, магазинах, заготовочных предприятиях.",
        img: "/images/products/neutral/stol/main/2.jpg",
        price: 83970,
        code: "2502",
    },

    {
        link: "obvalochnyi_stol.html",
        title: "Обвалочный стол",
        desc: "Обвалочные столы изготавливаются из нержавеющей стали, имеющей доступ к контакту с продуктами. Каркас сварной. Регулируемые по высоте ножки. Для столов длиной от 1400 мм в средней части стола для усиления конструкции устанавливаются дополнительные ножки.",
        img: "/images/products/neutral/stol/main/6.jpg",
        price: 119465,
        code: "2506",
    },
    {
        link: "stol_for_fish.html",
        title: "Стол для чистки рыбы",
        desc: "Столы для чистки рыбы изготавливаются из нержавеющей стали, имеющей доступ к контакту с продуктами. Каркас сварной. Регулируемые по высоте ножки. На столешнице слева от ванны располагается отверстие для крепления душ-стойки (или смесителя). Душирующее устройство и гофросифон для ванны входят в комплект поставки.",
        img: "/images/products/neutral/stol/main/5.jpg",
        price: 354470,
        code: "2505",
    },
    
    {
        link: "sso-1.html",
        title: "Стол для сбора отходов ССО-1",
        desc: "Столы ССО предназначены для сбора отходов в производственных помещениях предприятий общественного питания",
        img: "https://abat.ru/upload/iblock/0b9/aoi17keng1j47hs3s8p8z29cwuem12th.jpg",
        price: 112125,
        code: "1881",
    },
    {
        link: "sso-4.html",
        title: "Стол для сбора отходов ССО-4",
        desc: "Столы ССО предназначены для сбора отходов в производственных помещениях предприятий общественного питания",
        img: "https://abat.ru/upload/iblock/0b9/aoi17keng1j47hs3s8p8z29cwuem12th.jpg",
        price: 140300,
        code: "1883",
    },
    {
        link: "sso-4-karkas-krashenyy.html",
        title: "Стол для сбора отходов ССО-4 (каркас крашеный)",
        desc: "Столы ССО предназначены для сбора отходов в производственных помещениях предприятий общественного питания",
        img: "https://abat.ru/upload/iblock/51f/iabbtygqqfwzolaomsr0uvx9833lirkt.jpg",
        price: 110310,
        code: "1884",
    },
    {
        link: "skm-7-2.html",
        title: "Стол для кофемашины СКМ-7-2",
        desc: "Стол для кофемашины типа СКМ-7 (далее стол) предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования.",
        img: "https://abat.ru/upload/iblock/901/jflb42mhxkkeezrctcv4l0s8m4bokkwl.jpg",
        price: 408640,
        code: "1885",
    },
    {
        link: "stk-2d.html",
        title: "Стол-тумба купе СТК-2Д",
        desc: "Стол-тумба купе СТК-2Д предназначен для хранения кухонной утвари или продуктов питания в упаковке и напитков.",
        img: "https://abat.ru/upload/iblock/7dc/pb396quj4ew1d0j2ozhrled54dyvat0r.jpg",
        price: 317850,
        code: "1886",
    },
    {
        link: "pk-40-01.html",
        title: "Подтоварник кухонный ПК-40-01",
        desc: "Подтоварник кухонный предназначен ПК-40-01 для установки алюминиевых котлов с пищей на предприятиях общественного питания.",
        img: "https://abat.ru/upload/iblock/165/xuv7uqh9kyr0ogabrd11i05np71a6ry6.jpg",
        price: 41975,
        code: "1888",
    },
    {
        link: "pk-40.html",
        title: "Подтоварник кухонный ПК-40",
        desc: "Подтоварник кухонный предназначен ПК-40 предназначен для установки алюминиевых котлов с пищей на предприятиях общественного питания.",
        img: "https://abat.ru/upload/iblock/6a3/4hm9r3v355qga4221b2qfd2my20ax0ck.jpg",
        price: 29325,
        code: "1889",
    },
    {
        link: "pmp-40.html",
        title: "Подставка межплитная ПМП-40",
        desc: "Подставка межплитная ПМП-40 предназначена для установки в тепловых линиях 700 и 900 серий",
        img: "https://abat.ru/upload/iblock/cac/v46d20b6rsrv4ob1lumpy6crvjsml7uj.jpg",
        price: 46575,
        code: "1890",
    },
    {
        link: "pmp-40-01.html",
        title: "Подставка межплитная ПМП-40-01",
        desc: "Подставка межплитная ПМП-40-01 предназначена для установки в тепловых линиях 700 и 900 серий.",
        img: "https://abat.ru/upload/iblock/cac/v46d20b6rsrv4ob1lumpy6crvjsml7uj.jpg",
        price: 43125,
        code: "1891",
    },
    {
        link: "pk-6-2.html",
        title: "Подтоварник кухонный ПК-6-2",
        desc: "Подтоварник кухонный предназначен ПК-6-2 предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования.",
        img: "https://abat.ru/upload/iblock/fd4/ydh74b5f4smf95aibvf2dvtq3b8vqoqm.jpg",
        price: 82085,
        code: "1892",
    },
    {
        link: "pk-6-5.html",
        title: "Подтоварник кухонный ПК-6-5",
        desc: "Подтоварник кухонный предназначен ПК-6-5 предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования.",
        img: "https://abat.ru/upload/iblock/fd4/ydh74b5f4smf95aibvf2dvtq3b8vqoqm.jpg",
        price: 95350,
        code: "1893",
    },
    {
        link: "pk-7-5.html",
        title: "Подтоварник кухонный ПК-7-5",
        desc: "Подтоварник кухонный предназначен ПК-7-5 предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования.",
        img: "https://abat.ru/upload/iblock/d70/r8spa7egbskfc22610k9m8tfk29s275x.jpg",
        price: 105000,
        code: "1894",
    },
    {
        link: "lkhb-16.html",
        title: "Лоток для хлеба ЛХБ-16",
        desc: "Лоток для хлеба ЛХБ-16 для хранения, транспортировки и реализации хлебобулочных и кондитерских изделий. Устанавливается в шкаф распашной для хлеба ШРХ-6-1РН",
        img: "https://abat.ru/upload/iblock/f14/us6h74hc02uuj7mjkh7ec2guup3aabsa.jpg",
        price: 20000,
        code: "1897",
    },
    {
        link: "skr-7-2.html",
        title: "Стол кондитерский разборный СКР-7-2",
        desc: "Стол кондитерский разборный СКР-7-2 предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования для выполнения работ, связанных с приготовлением кулинарных и мучных изделий.",
        img: "https://abat.ru/upload/iblock/84f/yhbvhig4l4r5tt5h0o09trajbqla91xz.jpg",
        price: 199000,
        code: "2257",
    },
    {
        link: "skr-7-1.html",
        title: "Стол кондитерский разборный СКР-7-1",
        desc: "Стол кондитерский разборный СКР-7-1 предназначен для использования на предприятиях общественного питания в качестве вспомогательного оборудования для выполнения работ, связанных с приготовлением кулинарных и мучных изделий.",
        img: "https://abat.ru/upload/iblock/84f/yhbvhig4l4r5tt5h0o09trajbqla91xz.jpg",
        price: 175000,
        code: "2258",
    },

    // _____________________________________Мойки из нержавейки____________________________________________
    {
        link: "moika_1_sekcionnaya.html",
        title: "Мойка односекционная",
        desc: "Емкость мойки изготовлена из нержавейки t=0,6 AISI 304, гофросифон для слива воды в комплекте, каркас, стойки-уголок оцинкованный t=1,0. Мойки без отверстия под смеситель. ",
        img: "/images/products/neutral/moika/main/7.jpg",
        price: 23870,
        code: "2557",
    },

    {
        link: "vanna_rukomoinik.html",
        title: "Ванна-рукомойник",
        desc: "Ванна-рукомойник предназначена для использования на предприятиях общественного питания для мытья, дезинфекции и ополаскивания посуды.",
        img: "/images/products/neutral/moika/main/9.jpg",
        price: 29890,
        code: "2559",
    },
    {
        link: "vanna_moechnaya.html",
        title: "Ванна моечная",
        desc: "Емкость ванны моечной ВМ изготовлена из нержавейки t=0,6 AISI 304, гофросифон для слива воды, каркас оцинкованный, стойки-уголок.",
        img: "/images/products/neutral/moika/main/8.jpg",
        price: 31625,
        code: "2558",
    },
    {
        link: "moika_udlinennaya.html",
        title: "Мойка односекционная удлиненная",
        desc: "Мойка предназначена для использования в моечном отделении предприятия общественного питания для мытья, дезинфекции и ополаскивания использованной посуды. ",
        img: "/images/products/neutral/moika/main/1.jpg",
        price: 45880,
        code: "2551",
    },

    {
        link: "moika_2_sekcionnaya.html",
        title: "Мойка двухсекционная",
        desc: "Емкость мойки изготовлена из нержавейки t=0,6 AISI 304, гофросифон для слива воды, каркас, стойки-уголок оцинкованный t=1,0. Мойки без отверстия под смеситель. ",
        img: "/images/products/neutral/moika/main/2.jpg",
        price: 45685,
        code: "2552",
    },

    {
        link: "moika_2_sekcionnaya_s_bortom.html",
        title: "Мойка с бортом двухсекционная",
        desc: "Емкость изготовлена из нержавейки t=0,6 AISI 304, гофросифон для слива воды, с отверстием под смеситель, Каркас, стойки-уголок оцинкованный t=1,0.",
        img: "/images/products/neutral/moika/main/6.jpg",
        price: 52545,
        code: "2556",
    },
    {
        link: "moika_s_rabochei_poverhnostiyu.html",
        title: "Мойка с рабочей поверхностью",
        desc: "Столешница мойки с рабочей поверхностью МРП изготовлена из нержавейки t=0,5мм AISI 430 и усилена ЛДСП t=16мм, каркас оцинкованный, стойки-уголок.",
        img: "/images/products/neutral/moika/main/3.jpg",
        price: 53340,
        code: "2553",
    },

    {
        link: "dushevoi_poddon.html",
        title: "Душевой поддон для мойки туш",
        desc: "Душевой поддон для мойки туш предназначен для мойки туш в предприятиях общественного питания и торговли, мясоперерабатывающих и заготовочных предприятиях.",
        img: "/images/products/neutral/moika/main/12.jpg",
        price: 54315,
        code: "2561",
    },
    {
        link: "moika_3_sekcionnaya.html",
        title: "Мойка трехсекционная",
        desc: "Мойка предназначена для использования в моечном отделении предприятия общественного питания для мытья, дезинфекции и ополаскивания использованной посуды. ",
        img: "/images/products/neutral/moika/main/5.jpg",
        price: 69215,
        code: "2555",
    },
    {
        link: "stol_tumba_kupe_moika.html",
        title: "Стол-тумба купе, с мойкой",
        desc: "Все детали стола тумбы-купе с мойкой изготовлены из нержавеющей стали AISI 430. Детали разной толщины. Мойка изготовлена из из нержавеющей стали AISI 304. Гофросифон для слива воды и пробка для мойки в комплекте. Мойка без отверстия под смеситель.",
        img: "/images/products/neutral/stol/main/10.jpg",
        price: 97050,
        code: "2562",
    },
    {
        link: "stol_s_moikoi.html",
        title: "Стол с мойкой",
        desc: "Столы изготавливаются из нерж. стали, имеющей доступ к контакту с продуктами. Каркас сварной. Ножки регулируются по высоте. Отступ задних ножек от края столешницы - 100 мм. В нижней части обвязка из профильной трубы 40х40 мм с четырех сторон. Расстояние от пола до обвязки 370 мм.",
        img: "/images/products/neutral/stol/main/3.jpg",
        price: 123330,
        code: "2563",
    },
    {
        link: "rukomoinik_s_pedal.html",
        title: "Рукомойник с педальным приводом",
        desc: "Рукомойники изготовливаются из нержавеющей стали, имеющей доступ к контакту с продуктами. Каркас сварной. Регулируемые по высоте ножки. Отступ задних ножек от края столешницы - 50 мм. Рукомойники комплектуются надежным итальянским горизонтальным педальным смесителем.",
        img: "/images/products/neutral/moika/main/10.jpg",
        price: 167895,
        code: "2560",
    },
    {
        link: "vmp-6-1-5rch.html",
        title: "Ванна моечная односекционная ВМП-6-1-5РЧ (каркас крашеный)",
        desc: "Цельнотянутая ванна ВМП-6-1-5РЧ предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/bd2/pg0b1hd13umt7bxb1w80k0nrfo8s5yv4.jpg",
        price: 123750,
        code: "1858",
    },
    {
        link: "vmp-6-1-5rn-s-polkoy.html",
        title: "Ванна моечная односекционная ВМП-6-1-5РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-6-1-5РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/eb7/sqv407n1g0kegyaz9kwpt5nyge101fos.jpg",
        price: 142500,
        code: "1859",
    },
    {
        link: "vmp-6-2-5rch.html",
        title: "Ванна моечная двухсекционная ВМП-6-2-5РЧ (каркас крашеный)",
        desc: "Цельнотянутая ванна ВМП-6-2-5РЧ предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/99a/gyw73p4a7wps97d4wcfeypbd1tirfbsw.jpg",
        price: 218700,
        code: "1860",
    },
    {
        link: "vmp-6-2-5rn-s.html",
        title: "Ванна моечная двухсекционная ВМП-6-2-5РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-6-2-5РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/2c4/f61lkhurqppsvczt54xcg900yxbv6mue.jpg",
        price: 250000,
        code: "1861",
    },
    {
        link: "vmp-6-3-5rch.html",
        title: "Ванна моечная трехсекционная ВМП-6-3-5РЧ (каркас крашеный)",
        desc: "Цельнотянутая ванна ВМП-6-3-5РЧ предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/4cb/gnd03vslr3omdo7vq2xi9diweh1m3k98.jpg",
        price: 312500,
        code: "1862",
    },
    {
        link: "vmp-6-3-5rn-s.html",
        title: "Ванна моечная трехсекционная ВМП-6-3-5РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-6-3-5РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/6bb/pnuhjzs213ixuvke4gd6nw55x0uunn33.jpg",
        price: 346250,
        code: "1863",
    },
    {
        link: "vmp-7-1-5rn-s.html",
        title: "Ванна моечная односекционная ВМП-7-1-5РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-7-1-5РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/83b/egbnc5mghng0qxip88wikcy77zpjuhem.jpg",
        price: 144750,
        code: "1864",
    },
    {
        link: "vmp-7-1-6rn-s.html",
        title: "Ванна моечная односекционная ВМП-7-1-6РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-7-1-6РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/83b/egbnc5mghng0qxip88wikcy77zpjuhem.jpg",
        price: 175375,
        code: "1865",
    },
    {
        link: "vmp-7-2-5rn-s.html",
        title: "Ванна моечная двухсекционная ВМП-7-2-5РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-7-2-5РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/2c4/f61lkhurqppsvczt54xcg900yxbv6mue.jpg",
        price: 262500,
        code: "1866",
    },
    {
        link: "vmp-7-2-6rn-s.html",
        title: "Ванна моечная двухсекционная ВМП-7-2-6РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-7-2-6РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/2c4/f61lkhurqppsvczt54xcg900yxbv6mue.jpg",
        price: 303000,
        code: "1867",
    },
    {
        link: "vmp-7-3-6rn-s.html",
        title: "Ванна моечная трехсекционная ВМП-7-3-6РН (с полкой)",
        desc: "Цельнотянутая ванна ВМП-7-3-6РН предназначена для мойки посуды на предприятии общественного питания.",
        img: "https://abat.ru/upload/iblock/6bb/pnuhjzs213ixuvke4gd6nw55x0uunn33.jpg",
        price: 430750,
        code: "1869",
    },
    {
        link: "vmp-7-1.html",
        title: "Ванны котломоечные типа ВМП-7-1",
        desc: "Сварная ванна ВМП-7-1 предназначена для мытья ручным способом котлов, крупногабаритной посуды и инвентаря на предприятиях общественного питания.",
        img: "https://abat.ru/upload/iblock/ba4/cruqolkf94enhpi1kptq9suctgtalj2u.jpg",
        price: 185325,
        code: "1870",
    },
    {
        link: "vmp-9-1.html",
        title: "Ванны котломоечные типа ВМП-9-1",
        desc: "Сварная ванна ВМП-9-1 предназначена для мытья ручным способом котлов, крупногабаритной посуды и инвентаря на предприятиях общественного питания.",
        img: "https://abat.ru/upload/iblock/b36/ilkfpre0p03f2j1kg9i385syrkq3k134.jpg",
        price: 232760,
        code: "1871",
    },
    {
        link: "smo-6-3-rch.html",
        title: "Стол для мойки овощей СМО-6-3 РЧ (каркас крашеный)",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/a80/kfosya2yjq33pvz2vj6h5mqz3k9196fs.jpg",
        price: 150400,
        code: "1872",
    },
    {
        link: "smo-6-3-rn.html",
        title: "Стол для мойки овощей СМО-6-3 РН",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/534/y936dhej1v244r8c9fxsglitps8e5nuq.jpg",
        price: 186500,
        code: "1873",
    },
    {
        link: "smo-6-4-rch.html",
        title: "Стол для мойки овощей СМО-6-4 РЧ (каркас крашеный)",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/b7d/1ysbd5vx5gp87sir26wv5iu8ybt09fl2.jpg",
        price: 161450,
        code: "1874",
    },
    {
        link: "smo-6-4-rn.html",
        title: "Стол для мойки овощей СМО-6-4 РН",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/499/11vq0u6jd4hupmrty41u515ope9m0y01.jpg",
        price: 198600,
        code: "1875",
    },
    {
        link: "smo-6-7-rch.html",
        title: "Стол для мойки овощей СМО-6-7 РЧ (каркас крашеный)",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/248/6sl15atjwkgyv2xcd8v6te1ktlu3j1sd.jpg",
        price: 244500,
        code: "1876",
    },
    {
        link: "smo-6-7-rn.html",
        title: "Стол для мойки овощей СМО-6-7 РН",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/491/71uga3aauw0rdy6qepmg4wmtub9945lb.jpg",
        price: 290450,
        code: "1877",
    },
    {
        link: "smo-7-7-rch.html",
        title: "Стол для мойки овощей СМО-7-7 РЧ (каркас крашеный)",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания.  ",
        img: "https://abat.ru/upload/iblock/248/6sl15atjwkgyv2xcd8v6te1ktlu3j1sd.jpg",
        price: 246500,
        code: "1878",
    },
    {
        link: "smo-7-7-rn.html",
        title: "Стол для мойки овощей СМО-7-7 РН",
        desc: "Столы для мойки овощей СМО предназначены для использования в качестве вспомогательного оборудования на предприятиях общественного питания",
        img: "https://abat.ru/upload/iblock/491/71uga3aauw0rdy6qepmg4wmtub9945lb.jpg",
        price: 322900,
        code: "1879",
    },
    {
        link: "spso-7-5.html",
        title: "Стол предмоечный и сбора отходов СПСО-7-5",
        desc: "Стол предмоечный и сбора отходов СПСО-7-5 представляет собой стол с отверстием для пищевых отходов и вваренную мойку для предварительной очистки грязной посуды перед установкой ее в посудомоечную машину. Устанавливается перед посудомоечной машиной.",
        img: "https://abat.ru/upload/iblock/5d9/3hbqkfmkd6loym88knq4hcxow8h6lzkv.jpg",
        price: 201650,
        code: "1880",
    },

    // _____________________________________Cтеллажи из нержавейки____________________________________________
    {
        link: "stellazh_sploshnye_polki.html",
        title: "Стеллаж со сплошными полками",
        desc: "Стеллаж предназначен для хранения кухонного инвентаря, посуды, продуктов на предприятиях общественного питания, магазинах, заготовительных предприятиях, холодных, горячих цехах. Изделия сборно-разборные и поставляются в двух упаковках.",
        img: "/images/products/neutral/stellazh/main/4.jpg",
        price: 27755,
        code: 2574,
    },
    {
        link: "stellazh_reshetchatyi.html",
        title: "Стеллажи решетчатые",
        desc: "Полки стеллажей решетчатых С-Р с округлыми отверстиями из нержавейки t=0,5 AISI 430",
        img: "/images/products/neutral/stellazh/main/3.jpg",
        price: 31645,
        code: 2573,
    },
    {
        link: "stellazh_universal.html",
        title: "Стеллаж универсальный",
        desc: "Полки стеллажа универсального СУ изготовлены из нержавейки t=0,5 AISI 430, 1 сплошная, 2 решетчатые, 2 полки для тарелок, каркас оцинкованный, стойки-уголок",
        img: "/images/products/neutral/stellazh/main/1.jpg",
        price: 44410,
        code: 2571,
    },
    {
        link: "stellazh_dlya_tarelok.html",
        title: "Стеллаж для тарелок",
        desc: "Стеллаж предназначен для размещения, хранения и сушки в естественных условиях стандартных суповых и десертных тарелок различных диаметров.",
        img: "/images/products/neutral/stellazh/main/2.jpg",
        price: 50890,
        code: 2572,
    },

    // _____________________________________Полки и подставки из нержавейки____________________________________________
    {
        link: "polka_nastennaya.html",
        title: "Полка настенная",
        desc: "Полка настенная предназначена для хранения и временной расстановки посуды и кухонного инвентаря на предприятиях общественного питания, магазинах, заготовительных предприятиях.",
        img: "/images/products/neutral/podstavka/main/8.jpg",
        price: 6850,
        code: "2588",
    },

    {
        link: "polka_nastennaya_reshetchataya.html",
        title: "Полка настенная решетчатая",
        desc: "Полка настенная решетчатая ПН-Р предназначена для хранения и временной расстановки посуды и кухонного инвентаря в предприятиях общественного питания, магазинах, заготовочных предприятиях.",
        img: "/images/products/neutral/podstavka/main/7.jpg",
        price: 7052,
        code: "2587",
    },
    {
        link: "podstavka_dlya_kuhonnovo_inventarya.html",
        title: "Подставка для кухонного инвентаря",
        desc: "Подставки для кухонного инвентаря предназначены для использования на предприятиях общественного питания, а также на продуктовых складах и магазинах, для временного складирования кухонного инвентаря и продуктов питания. Могут служить подставкой под котлы с первыми блюдами.",
        img: "/images/products/neutral/podstavka/main/1.jpg",
        price: 9790,
        code: "2581",
    },
    {
        link: "polka_kuhonnaya_dlya_dosok.html",
        title: "Полка кухонная для досок / для крышек",
        desc: "Полка кухонная для крышек ПКК предназначена для сушки и хранения крышек кастрюль и баков в моечных отделениях, горячих цехах.Полка для разделочных досок ПКД предназначена для хранения разделочных досок. Полка ПКД аналогична по конструкции с полкой для крышек, но имеет более широкие ячейки.",
        img: "/images/products/neutral/podstavka/main/4.jpg",
        price: 10690,
        code: "2584",
    },
    {
        link: "polka_nastennaya_dlya_tarelok.html",
        title: "Полка настенная для тарелок",
        desc: "Полка состоит из кассеты для тарелок и поддона. Кассета представляет собой решетку из прутка, в ячейки которой помещают тарелки. В поддоне предусмотрен небольшой уклон, обеспечивающий сток жидкости, поступающей с мокрой посуды к сливному отверстию.",
        img: "/images/products/neutral/podstavka/main/6.jpg",
        price: 19770,
        code: "2586",
    },
    {
        link: "polka_nastennaya_poluotkrytaya.html",
        title: "Полка настенная полуоткрытая",
        desc: "Полка настенная полуоткрытая ПНП предназначена для открытого хранения и демонстрации продуктов, требующих постоянной вентиляции, а также наиболее часто используемой посуды и инвентаря.",
        img: "/images/products/neutral/podstavka/main/5.jpg",
        price: 22350,
        code: "2585",
    },
    {
        link: "podstavka_zakrytaya_kupe.html",
        title: "Полка закрытая купе",
        desc: "Полка закрытая кухонная купе (ПЗК) предназначена для длительного хранения продуктов, инвентаря и посуды в закрытом объеме.",
        img: "/images/products/neutral/podstavka/main/3.jpg",
        price: 49745,
        code: "2583",
    },
    {
        link: "podstavka_dlya_parokonvektomata.html",
        title: "Подставка для пароконвектомата",
        desc: "Подставка для пароконвектомата имеет направляющие, позволяющие разместить в ней 14 гастроемкостей типа GN-1/1 или 28 гастроемкостей GN-1/2. Также подставка имеет полку, на которую можно положить необходимые предметы.",
        img: "/images/products/neutral/podstavka/main/2.jpg",
        price: 92915,
        code: "2582",
    },
// _____________________________________Ферментаторы____________________________________________
{
    link: "fermentator-ft-40p.html",
    title: "Ферментатор ФТ-40П",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/188/1zr4xmbqd2rrqxo5cto94t81zctkkahk.jpg",
    price: 3536500,
    code: "11000005516",
},
{
    link: "fermentator-ft-100p.html",
    title: "Ферментатор ФТ-100П",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/702/je2f4gk1aci4sr1zu8617dtly7fd3oab.png",
    price: 4048000,
    code: "11000005518",
},
{
    link: "fermentator-ft-40.html",
    title: "Ферментатор ФТ-40",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/67c/ojt9j3rbycs5t5sf30vkztq61f06lq4i.jpg",
    price: 3048000,
    code: "11000005512",
},
{
    link: "fermentator-ft-100.html",
    title: "Ферментатор ФТ-100",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/702/je2f4gk1aci4sr1zu8617dtly7fd3oab.png",
    price: 3564500,
    code: "11000005511",
},
// _____________________________________Тележки для транспортировки____________________________________________
    {
        link: "telezhka_shpilka.html",
        title: "Тележка-шпилька для противней 14 уровней",
        desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
        img: "/images/products/neutral/telezhka/main/1.jpg",
        price: 79080,
        code: "2591",
    },
    {
        link: "telezhka_zakrytaya.html",
        title: "Тележка закрытая для транспортировки мясных полуфабрикатов",
        desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
        img: "/images/products/neutral/telezhka/main/6.jpg",
        price: 129785,
        code: "2592",
    },
    {
        link: "tshg-8.html",
        title: "Тележка-шпилька для подносов ТШГ-8",
        desc: "Тележка-шпилька для подносов ТШГ-8 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 8 противней 430х550 мм",
        img: "https://abat.ru/upload/iblock/809/d1lcbdmd8p31wxpdpelh4sg5k87tyr69.jpg",
        price: 134000,
        code: "1836",
    },
    {
        link: "tshg-8-01.html",
        title: "Тележка-шпилька передвижная ТШГ-8-01",
        desc: "Тележка-шпилька ТШГ является вспомогательным оборудованием для предприятий общественного питания и используется в качестве межоперационного транспортного средства.",
        img: "https://abat.ru/upload/iblock/137/e5r51sk3jy8a3zg2e73to3c9m0c126ah.jpg",
        price: 126250,
        code: "1837",
    },
    {
        link: "tshg-10.html",
        title: "Тележка-шпилька для подносов ТШГ-10",
        desc: "Тележка-шпилька для подносов ТШГ-10 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 10 противней 430х550 мм",
        img: "https://abat.ru/upload/iblock/32e/47653dme3fxzi59h1q5xe3v1w3xs4c5k.jpg",
        price: 148000,
        code: "1838",
    },
    {
        link: "tshg-12.html",
        title: "Тележка-шпилька для подносов ТШГ-12",
        desc: "Тележка-шпилька для подносов ТШГ-12 является вспомогательным оборудованием для предприятий общественного питания и используется для сбора, хранения и транспортировки до 12 подносов 350х600 мм.",
        img: "https://abat.ru/upload/iblock/576/5ksvqs3txcfwm8aj1ajykkxsijvuzige.jpg",
        price: 148350,
        code: "1839",
    },
    {
        link: "tshg-15.html",
        title: "Тележка-шпилька для противней ТШГ-15",
        desc: "Тележка-шпилька для противней ТШГ-15 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 15 противней 330х460 мм.",
        img: "https://abat.ru/upload/iblock/383/5a1hjje70sep0ipons9mu7wb00bq80hq.jpg",
        price: 140000,
        code: "1840",
    },
    {
        link: "tshg-15kh2.html",
        title: "Тележка-шпилька для противней ТШГ-15х2",
        desc: "Тележка-шпилька для противней ТШГ-15х2 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 30 (15х2) противней 320х435 мм.",
        img: "https://abat.ru/upload/iblock/05a/9dve4oppbqybyboz0s4cpw55p5gnn1c2.jpg",
        price: 224250,
        code: "1841",
    },
    {
        link: "tshg-10-1-1.html",
        title: "Тележка-шпилька для гастроемкостей ТШГ-10-1/1",
        desc: "Тележка-шпилька ТШГ-10-1/1 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 10 гастроемкостей GN 1/1.",
        img: "https://abat.ru/upload/iblock/191/qdwb3ljxtq5syrwdcioaf6jdudukxo5v.jpg",
        price: 113850,
        code: "1842",
    },
    {
        link: "tshg-14-1-1.html",
        title: "Тележка-шпилька для гастроемкостей ТШГ-14-1/1",
        desc: "Тележка-шпилька ТШГ-14-1/1 является вспомогательным оборудованием для предприятий общественного питания и используется для установки и транспортировки до 14 гастроемкостей типоразмера GN 1/1.",
        img: "https://abat.ru/upload/iblock/1d0/05rznfqq6azajzoko2e3bl1ho1zy1ngn.jpg",
        price: 132500,
        code: "1843",
    },
    {
        link: "ts-80.html",
        title: "Тележка сервировочная ТС-80",
        desc: "Тележка сервировочная ТС-80 является вспомогательным оборудованием для предприятий общественного питания и используется в качестве межоперационного транспортного средства по сервировке столов.",
        img: "https://abat.ru/upload/iblock/af4/ld61oa352dw359s30sd6ko0s34m6dstk.jpg",
        price: 154500,
        code: "1852",
    },
    {
        link: "ts-100.html",
        title: "Тележка для сбора посуды ТС-100",
        desc: "Тележка сервировочная ТС-100 является вспомогательным оборудованием для предприятий общественного питания и используется в качестве межоперационного транспортного средства при уборке посуды со столов.",
        img: "https://abat.ru/upload/iblock/7cb/5zt0ptt5nqs9j5detgvgmdjgqit1arof.jpg",
        price: 223500,
        code: "1853",
    },
    {
        link: "tst-100-model-2019-goda.html",
        title: "Тележка для сушки тарелок ТСТ-100 - модель 2019 года",
        desc: "Тележка для сушки тарелок ТСТ-100 используется в качестве межоперационного транспортного средства для перевозки тарелок на предприятиях общественного питания.",
        img: "https://abat.ru/upload/iblock/e1e/d42cnp6xgbfenqxc6lqhtqb21h2qs02x.jpg",
        price: 214500,
        code: "1854",
    },
    {
        link: "tg-6-1.html",
        title: "Тележка грузовая ТГ-6-1",
        desc: "Тележка грузовая ТГ-6-1 предназначена для использования на предприятиях общественного питания в качестве вспомогательного оборудования для транспортировки продуктов питания или кухонной утвари между производственными цехами.",
        img: "https://abat.ru/upload/iblock/c43/i2kgckem1deaocu58evjt8w503me0zsj.jpg",
        price: 126850,
        code: "1855",
    },
    {
        link: "tg-7-2.html",
        title: "Тележка грузовая ТГ-7-2",
        desc: "Тележка грузовая ТГ-7-2 предназначена для использования на предприятиях общественного питания в качестве вспомогательного оборудования для транспортировки продуктов питания или кухонной утвари между производственными цехами.",
        img: "https://abat.ru/upload/iblock/c43/i2kgckem1deaocu58evjt8w503me0zsj.jpg",
        price: 127995,
        code: "1856",
    },
    {
        link: "tg-8-3.html",
        title: "Тележка грузовая ТГ-8-3",
        desc: "Тележка грузовая ТГ-8-3 предназначена для использования на предприятиях общественного питания в качестве вспомогательного оборудования для транспортировки продуктов питания или кухонной утвари между производственными цехами.",
        img: "https://abat.ru/upload/iblock/c43/i2kgckem1deaocu58evjt8w503me0zsj.jpg",
        price: 143090,
        code: "1857",
    },
// _____________________________________Тестораскаточные машины____________________________________________
{
    link: "testoraskatochnaya-mashina-trm-320-.html",
    title: "Тестораскаточная машина ТРМ-320",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/1e1/lcwemh2i12gxuomqi2ydalhj54xtsw9l.jpg",
    price: 765500,
    code: "41000000119",
},
{
    link: "testoraskatochnaya-mashina-trm-420.html",
    title: "Тестораскаточная машина ТРМ-420",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/a45/x23r6uxbkr4auzsb29d1dbgawc3f909j.jpg",
    price: 856000,
    code: "41000000120",
},
{
    link: "testoraskatochnaya-mashina-trm-520.html",
    title: "Тестораскаточная машина ТРМ-520",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/bc1/iqsuiv9nk3xz5jyl0rtk1h6vrft1cmtg.jpg",
    price: 919500,
    code: "41000000121",
},
{
    link: "mashina-testoraskatochnaya-trm-500-850.html",
    title: "Машина тестораскаточная ТРМ-500/850",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/f96/asakb2tnlp7ic73fqz8v5g5rrd7jsps0.jpg",
    price: 2054500,
    code: "41000000079",
},
{
    link: "mashina-testoraskatochnaya-trm-500-1000.html",
    title: "Машина тестораскаточная ТРМ-500/1000",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/4ed/khhlewonbxa24bbp4hqggonoqyk9cfv3.png",
    price: 2079500,
    code: "41000000134",
},
{
    link: "mashina-testoraskatochnaya-trm-500-1200.html",
    title: "Машина тестораскаточная ТРМ-500/1200",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/49f/olv18db5e4k4bq3nwexl2a3tu3g2om7c.png",
    price: 2099500,
    code: "41000000069",
},
{
    link: "nasadka-lapsherezka-lr-2.html",
    title: "Насадка-лапшерезка ЛР-2",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/99f/q1jucoqw862rre72wvyyp7qadgr2gemw.jpg",
    price: 188000,
    code: "41000000301",
},
{
    link: "nasadka-lapsherezka-lr-4.html",
    title: "Насадка-лапшерезка ЛР-4",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/99f/q1jucoqw862rre72wvyyp7qadgr2gemw.jpg",
    price: 188000,
    code: "41000000189",
},
{
    link: "nasadka-lapsherezka-lr-6.html",
    title: "Насадка-лапшерезка ЛР-6",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/99f/q1jucoqw862rre72wvyyp7qadgr2gemw.jpg",
    price: 188000,
    code: "41000000302",
},
{
    link: "nasadka-lapsherezka-lr-12.html",
    title: "Насадка-лапшерезка ЛР-12",
    desc: "Тележки используется для транспортировки противней и гастроемкостей GN1/1 (325х530 мм).",
    img: "https://abat.ru/upload/iblock/99f/q1jucoqw862rre72wvyyp7qadgr2gemw.jpg",
    price: 188000,
    code: "41000000302",
},
// _____________________________________Кондитерское оборудование____________________________________________
{
    link: "tsentrifuga-dlya-yaits-tsdya-1500.html",
    title: "Центрифуга для яиц ЦДЯ-1500",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/fe0/osamy1f84bqqo03o4llhxwadqcy23ktl.jpg",
    price: 1600000,
    code: "41000000304",
},
{
    link: "kotel-dlya-plavleniya-shokolada-kpsh-150.html",
    title: "Котел для плавления шоколада КПШ-150",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/44e/3qn5bsgpa8f8pihw0m5ify0zxl1ioefc.jpg",
    price: 2635000,
    code: "11000012513",
},
{
    link: "melanzher-dlya-shokolada-nastolnyy-msh-07.html",
    title: "Меланжер для шоколада настольный МШ-07",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/04b/0x9mzhdgnhzu1tkamw27f65aqoumsthr.jpg",
    price: 1185000,
    code: "11000009913",
},
// _____________________________________Лиофильные камеры____________________________________________
{
    link: "lf-06p-serii-chef.html",
    title: "ЛФ-06П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/5e7/l1vt5hogfd6s9xzfbatr8tpvu6gqdf7j.jpg",
    price: 1995000,
    code: "11000012892",
},
{
    link: "lf-06-serii-light.html",
    title: "ЛФ-06 серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/d28/5ma95fn8ajj3orox2k7jss3bb6mhce9k.jpg",
    price: 1775000,
    code: "11000012381",
},
// _____________________________________Тестомесы____________________________________________
{
    link: "spiralnyy-testomes-tms-120sp-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-120СП-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/ccd/uq0y710owaqe1y6032nruvz3yfv0oebq.jpg",
    price: 4044500,
    code: "41000019580",
},
{
    link: "spiralnyy-testomes-tms-20nn-1r-serii-light.html",
    title: "Спиральный тестомес ТМС-20НН-1Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 569500,
    code: "41000000049",
},
{
    link: "spiralnyy-testomes-tms-20nn-2r-serii-light.html",
    title: "Спиральный тестомес ТМС-20НН-2Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 649500,
    code: "41000000024",
},
{
    link: "spiralnyy-testomes-tms-20nn-1ts-serii-chef.html",
    title: "Спиральный тестомес ТМС-20НН-1Ц серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/e0b/k8l898w6yx01nd313b5ugezca6lm8q52.jpg",
    price: 681500,
    code: "41000019537",
},
{
    link: "spiralnyy-testomes-tms-20nn-2ts-serii-chef.html",
    title: "Спиральный тестомес ТМС-20НН-2Ц серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/4de/8i7xbkddb0x2upe04scznior06xqqx1l.jpg",
    price: 765500,
    code: "41000018972",
},
{
    link: "spiralnyy-testomes-tms-20nn-mts-serii-chef.html",
    title: "Спиральный тестомес ТМС-20НН-МЦ серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/411/bh4n97ptpptpztdpdz4cmklpp5mgla96.jpg",
    price: 845500,
    code: "41000018973",
},
{
    link: "spiralnyy-testomes-tms-30nn-1r-serii-light.html",
    title: "Спиральный тестомес ТМС-30НН-1Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 635000,
    code: "41000000033",
},
{
    link: "spiralnyy-testomes-tms-30nn-2r-serii-light.html",
    title: "Спиральный тестомес ТМС-30НН-2Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 699500,
    code: "41000000023",
},
{
    link: "spiralnyy-testomes-tms-30nn-1ts-serii-chef.html",
    title: "Спиральный тестомес ТМС-30НН-1Ц серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/1f2/3281ob0v4hnrzmb4xc7f918oznfbajyg.jpg",
    price: 741500,
    code: "41000019538",
},

{
    link: "spiralnyy-testomes-tms-30nn-2ts-serii-chef.html",
    title: "Спиральный тестомес ТМС-30НН-2Ц серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/1f2/3281ob0v4hnrzmb4xc7f918oznfbajyg.jpg",
    price: 795000,
    code: "41000018850",
},
{
    link: "spiralnyy-testomes-tms-30nn-mts-serii-chef.html",
    title: "Спиральный тестомес ТМС-30НН-МЦ серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/f78/yvuzv481tc9vqtafk9ac9p4u9aopeddt.jpg",
    price: 875000,
    code: "41000018849",
},
{
    link: "spiralnyy-testomes-tms-40nn-1r-serii-light.html",
    title: "Спиральный тестомес ТМС-40НН-1Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 695000,
    code: "41000000030",
},
{
    link: "spiralnyy-testomes-tms-40nn-2r-serii-light.html",
    title: "Спиральный тестомес ТМС-40НН-2Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/2e3/ejij8r4djqla4t1krhmajuycdxvixquu.jpg",
    price: 729500,
    code: "41000019571",
},
{
    link: "spiralnyy-testomes-tms-40nn-2ts-serii-chef.html",
    title: "Спиральный тестомес ТМС-40НН-2Ц серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/30b/8xavuvmlzwtuvjw6bdb9a0xfocs310rs.jpg",
    price: 1025000,
    code: "41000019654",
},
{
    link: "spiralnyy-testomes-tms-40nn-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-40НН-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/48c/kopinznosesvm158r8zlb7k0bzn6s3h5.jpg",
    price: 1050000,
    code: "41000006621",
},
{
    link: "spiralnyy-testomes-tms-60nn-1r-serii-light.html",
    title: "Спиральный тестомес ТМС-60НН-1Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/f68/jkfq738nbhrzfygg375z97hlbdkv59ap.jpg",
    price: 695000,
    code: "41000000031",
},
{
    link: "spiralnyy-testomes-tms-60nn-2r-serii-light.html",
    title: "Спиральный тестомес ТМС-60НН-2Р серии LIGHT",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/f68/jkfq738nbhrzfygg375z97hlbdkv59ap.jpg",
    price: 790500,
    code: "41000006785",
},
{
    link: "spiralnyy-testomes-tms-60nn-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-60НН-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/4ad/k0oyjb9nxc98loo48l7mr7367sqas5z1.jpg",
    price: 1495000,
    code: "41000019557",
},
{
    link: "spiralnyy-testomes-tms-80nn-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-80НН-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/4ad/k0oyjb9nxc98loo48l7mr7367sqas5z1.jpg",
    price: 1575000,
    code: "41000019563",
},
{
    link: "spiralnyy-testomes-tms-100nn-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-100НН-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/cdd/cdv9l1zdx7l8xy5xnfpz48tdh5az7sa1.jpg",
    price: 2250000,
    code: "41000019568",
},
{
    link: "spiralnyy-testomes-tms-120nn-2p-serii-chef.html",
    title: "Спиральный тестомес ТМС-120НН-2П серии CHEF",
    desc: "Тележки изготавливаются из нержавеющей стали , имеющий доступ к контакту с продуктами. Каркас сварной. В основании 4 колеса диаметром 100 мм. (2 колеса с тормозом).",
    img: "https://abat.ru/upload/iblock/20d/61gt2767bduf77hbsnggrcqfb3oz5yn6.jpg",
    price: 2325500,
    code: "41000019559",
},

{
    link: "dough_mixer.html",
    title: "Тестомес HS20 л",
    desc: "Тестомес HS20 предназначен для замеса дрожжевого и крутого теста на предприятиях общественного питания, в кондитерских и пекарнях. За счет спиральной формы месильного органа процесс замеса происходит быстрее и качественнее. Крышка дежи, выполненная в виде решетки, обеспечивает визуальный контроль за процессом, а также позволяет добавлять ингредиенты, не останавливая процесс замешивания теста.",
    img: "/images/products/mixer/3.jpg",
    price: 166670,
    code: "8383",
},
    // _____________________________________Подвесы для туш____________________________________________
    {
        link: "kruk_dlya_tush.html",
        title: "Крюк для подвеса туш",
        desc: "Крюк для подвеса туш предназначен для подвешивания, а также транспортировки по трубчатым подвесным путям, туш и полутуш в предприятиях общественного питания и торговли, мясоперерабатывающих и заготовочных предприятиях.",
        img: "/images/products/neutral/podvec/main/3.jpg",
        price: 3452,
        code: "2793",
    },
    {
        link: "podves_stacionarnyi.html",
        title: "Подвес для мытья туш стационарный",
        desc: "Подвес для мытья туш стационарный предназначен для подвешивания на крюках туш и полутуш в предприятиях общественного питания и торговли, мясоперерабатывающих и заготовочных предприятиях.",
        img: "/images/products/neutral/podvec/main/2.jpg",
        price: 999,
        code: "000",
    },
    {
        link: "podves_dlya_tush.html",
        title: "Подвес для туш, 2 перекладины, 2 вертикальных опоры",
        desc: "Подвес для туш предназначен для подвешивания на крюках туш и полутуш в предприятиях общественного питания и торговли, мясоперерабатывающих и заготовочных предприятиях.",
        img: "/images/products/neutral/podvec/main/1.jpg",
        price: 174995,
        code: "2791",
    },

// _____________________________________Посудомоечные машины____________________________________________
{
    link: "mpk-130-65.html",
    title: "Машина котломоечная МПК-130-65",
    desc: "Машина котломоечная типа МПК-130-65 предназначена для мытья различного кухонного инвентаря на предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/8a5/eqn6lqwhhkvibq1lopxc1b1qhlu4jwsl.jpg",
    price: 3591500,
    code: "1436",
},
{
    link: "mpk-65-65.html",
    title: "Машина котломоечная МПК-65-65",
    desc: "Машина котломоечная типа МПК-65-65 предназначена для мытья различного кухонного инвентаря на предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/103/k0c3b5ne3qel6cdl0hegpjl1x4iwzpk4.jpg",
    price: 2083500,
    code: "1437",
},
{
    link: "mpt-1700-pravaya.html",
    title: "Туннельная посудомоечная машина МПТ-1700 (правая)",
    desc: "Туннельная посудомоечная машина МПТ-1700 предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания. Выпускается в правом (движение посуды справа налево) и левом (движении посуды слева направо) исполнении.",
    img: "https://abat.ru/upload/iblock/4dc/25jdpgolm840ti6qr4bgliae2vava279.jpg",
    price: 2660000,
    code: "1438",
},
{
    link: "mpt-1700-levaya.html",
    title: "Туннельная посудомоечная машина МПТ-1700 (левая)",
    desc: "Туннельная посудомоечная машина МПТ-1700 предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания. Выпускается в правом (движение посуды справа налево) и левом (движении посуды слева направо) исполнении.",
    img: "https://abat.ru/upload/iblock/4dc/25jdpgolm840ti6qr4bgliae2vava279.jpg",
    price: 2660000,
    code: "1439",
},
{
    link: "mpt-1700-01-pravaya.html",
    title: "Туннельная посудомоечная машина МПТ-1700-01 (правая)",
    desc: "Туннельная посудомоечная машина МПТ-1700-01 с теплообменником предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/8ae/yzd66z4ra9rdmg3xg38uj6dpw0ldhe31.jpg",
    price: 2874500,
    code: "1440",
},
{
    link: "mpt-1700-01-levaya.html",
    title: "Туннельная посудомоечная машина МПТ-1700-01 (левая)",
    desc: "Туннельная посудомоечная машина МПТ-1700-01 с теплообменником предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/8ae/yzd66z4ra9rdmg3xg38uj6dpw0ldhe31.jpg",
    price: 2874500,
    code: "1441",
},
{
    link: "mpt-2000-pravaya.html",
    title: "Туннельная посудомоечная машина МПТ-2000 (правая)",
    desc: "Туннельная посудомоечная машина МПТ-2000 предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/729/0dua88rnbvfqwyqmqrwcls5frxhk3jc1.jpg",
    price: 3370500,
    code: "1442",
},
{
    link: "mpt-2000-levaya.html",
    title: "Туннельная посудомоечная машина МПТ-2000 (левая)",
    desc: "Туннельная посудомоечная машина МПТ-2000 предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/729/0dua88rnbvfqwyqmqrwcls5frxhk3jc1.jpg",
    price: 3370500,
    code: "1443",
},
{
    link: "mpk-700k.html",
    title: "Купольная посудомоечная машина МПК-700К",
    desc: "Купольная посудомоечная машина МПК-700К предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/370/mf2nunwed1tclqgyemfv0t31jyf9n5mn.jpg",
    price: 1183470,
    code: "1444",
},
{
    link: "mpk-700k-01.html",
    title: "Купольная посудомоечная машина МПК-700К-01",
    desc: "Купольная посудомоечная машина МПК-700К-01 предназначена для мытья тарелок, стаканов, чашек, столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/832/q5j24yqayqyzinpn661q9aia0i2lpoij.jpg",
    price: 1076350,
    code: "1445",
},
{
    link: "mpk-700k-04.html",
    title: "Купольная посудомоечная машина МПК-700К-04",
    desc: "Купольная посудомоечная машина МПК-700К-04 с функцией стерилизации посуды предназначена для мытья тарелок, стаканов, чашек и столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/080/g3cpo1gbm45wggae39fasp78n2das47u.jpg",
    price: 1222610,
    code: "1446",
},
{
    link: "mpk-1100k.html",
    title: "Купольная посудомоечная машина МПК-1100К",
    desc: "Купольная посудомоечная машина МПК-1100К предназначена для мытья тарелок, стаканов, чашек и столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/d62/sv0ewks5v2yiim6npdwzmt9x323pz3i0.jpg",
    price: 1232395,
    code: "1447",
},
{
    link: "mpk-1400k.html",
    title: "Купольная посудомоечная машина МПК-1400К",
    desc: "Купольная посудомоечная машина МПК-1400К предназначена для мытья тарелок, стаканов, чашек и столовых приборов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/ae2/w3kudoaivb22jjwcwo6hqa5r4jd8osc9.jpg",
    price: 1715000,
    code: "1448",
},
{
    link: "mpk-400f.html",
    title: "Стаканомоечная машина МПК-400Ф",
    desc: "Для мытья стаканов, бокалов, чашек, небольших тарелок и столовых приборов на небольших предприятиях общественного питания",
    img: "https://abat.ru/upload/iblock/ae1/e9zkvmcnim606eo35jtnuaexrw0ssp69.jpg",
    price: 692500,
    code: "1449",
},
{
    link: "mpk-500f.html",
    title: "Фронтальная посудомоечная машина МПК-500Ф",
    desc: "Фронтальная посудомоечная машина МПК-500Ф производительностью 500 тарелок в час предназначена для мытья тарелок, стаканов, столовых приборов, подносов, чашек с применением жидкого моющего и ополаскивающего средства.",
    img: "https://abat.ru/upload/iblock/ee8/7djsz0wetr7jumn3qsvjkqw0l51b97ku.jpg",
    price: 705000,
    code: "1450",
},
{
    link: "mpk-500f-01-230.html",
    title: "Фронтальная посудомоечная машина МПК-500Ф-01-230",
    desc: "Фронтальная посудомоечная машина МПК-500Ф-01-230 производительностью 500 тарелок в час предназначена для мытья тарелок, стаканов, столовых приборов, подносов, чашек с применением жидкого моющего и ополаскивающего средства.",
    img: "https://abat.ru/upload/iblock/26f/mowsvgzf37j92y2pab5rn252sj0o6j53.jpg",
    price: 762500,
    code: "1451",
},
{
    link: "mpk-500f-01.html",
    title: "Фронтальная посудомоечная машина МПК-500Ф-01",
    desc: "Фронтальная посудомоечная машина МПК-500Ф-01 производительностью 500 тарелок в час предназначена для мытья тарелок, стаканов, столовых приборов, подносов, чашек с применением жидкого моющего и ополаскивающего средства.",
    img: "https://abat.ru/upload/iblock/26f/mowsvgzf37j92y2pab5rn252sj0o6j53.jpg",
    price: 754500,
    code: "1452",
},
{
    link: "mpk-500f-02.html",
    title: "Фронтальная посудомоечная машина МПК-500Ф-02",
    desc: "Фронтальная посудомоечная машина МПК-500Ф-02 производительностью 500 тарелок в час предназначена для мытья тарелок, стаканов, столовых приборов, подносов, чашек с применением жидкого моющего и ополаскивающего средства.",
    img: "https://abat.ru/upload/iblock/ee8/7djsz0wetr7jumn3qsvjkqw0l51b97ku.jpg",
    price: 733000,
    code: "1453",
},
{
    link: "spmp-7-4-s-dushem.html",
    title: "Предмоечный стол СПМП-7-4 с душем",
    desc: "Предмоечный стол для туннельных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/626/v6psrormomerhfdvmswf52e5fjsa4bi4.jpg",
    price: 331100,
    code: "1454",
},
{
    link: "spmr-6-2.html",
    title: "Раздаточный стол СПМР-6-2",
    desc: "Раздаточный стол для туннельных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/c3f/yx0i93ill1afkgm3qpvbic3i2bit1rz9.jpg",
    price: 119500,
    code: "1455",
},
{
    link: "spmp-6-0.html",
    title: "Предмоечный стол СПМП-6-0",
    desc: "Предмоечный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/162/36n4emzwacz9f62tq7jestz60qjxkgu0.jpg",
    price: 293150,
    code: "1456",
},
{
    link: "spmp-6-1.html",
    title: "Предмоечный стол СПМП-6-1",
    desc: "Предмоечный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/9b4/68kvk7k4mp9wzqldh5d1sb12mt01etxz.jpg",
    price: 216775,
    code: "1457",
},
{
    link: "spmp-6-3.html",
    title: "Предмоечный стол СПМП-6-3",
    desc: "Предмоечный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/d30/cl8kaxssxvm0wxct08lac3ngtxi4z0kk.jpg",
    price: 357500,
    code: "1458",
},
{
    link: "spmp-6-5.html",
    title: "Предмоечный стол СПМП-6-5",
    desc: "Предмоечный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/9be/i3tzt736f5s74w96mghewqijf7u5kmkw.jpg",
    price: 392700,
    code: "1459",
},
{
    link: "spmp-6-7.html",
    title: "Предмоечный стол СПМП-6-7",
    desc: "Предмоечный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/f72/anrcrk6y464w0u0kczbsoiw5mmffxxz9.jpg",
    price: 434500,
    code: "1460",
},
{
    link: "spmr-6-1.html",
    title: "Раздаточный стол СПМР-6-1",
    desc: "Раздаточный стол для купольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/773/x823gck0cdo3zr30e53vacb5a3ee6bjy.jpg",
    price: 103400,
    code: "1461",
},
{
    link: "spmr-6-5.html",
    title: "Раздаточный стол СПМР-6-5",
    desc: "Раздаточный стол для ткупольных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/688/dh8ootldqbrc4ujgkux9tdt49h9hmmj9.jpg",
    price: 129250,
    code: "1462",
},
{
    link: "spmf-6-1.html",
    title: "Предмоечный стол СПМФ-6-1",
    desc: "Предмоечный стол для стаканомоечных машин",
    img: "https://abat.ru/upload/iblock/8ef/sjg93uifscrry6g1pnp8lu7m4zpgtzdp.jpg",
    price: 314050,
    code: "1463",
},
{
    link: "spmf-7-1.html",
    title: "Предмоечный стол СПМФ-7-1",
    desc: "Предмоечный стол для фронтальных посудомоечных машин",
    img: "https://abat.ru/upload/iblock/57b/hggv519usylmqdz4d3qd2cbjumrtwqs8.jpg",
    price: 320850,
    code: "1464",
},
{
    link: "pfpm-6-1.html",
    title: "Подставка ПФПМ-6-1",
    desc: "Подставка ПФПМ-6-1 предназначена для установки фронтальных посудомоечных машин МПК-500Ф, МПК-500Ф-01, МПК-500Ф-02, МПК-500Ф-01-230 на столешницу и размещения кассет размером 500х500 мм на полках.",
    img: "https://abat.ru/upload/iblock/99f/hlrab4njwqy0hnjg8vv3u39kquh5e9h9.jpg",
    price: 74000,
    code: "1465",
},
{
    link: "pfpm-5-1.html",
    title: "Подставка ПФПМ-5-1",
    desc: "Подставка ПФПМ-5-1 предназначена для установки стаканомоечной машины МПК-400Ф на столешницу и размещения кассет размером 400х400 мм на полках.",
    img: "https://abat.ru/upload/iblock/f23/93lb32chm82ls50d380rq2ci09kcfhwq.jpg",
    price: 67500,
    code: "1466",
},
{
    link: "mpt-2000k-pravaya.html",
    title: "Туннельная посудомоечная машина МПТ-2000К (правая)",
    desc: "Машина посудомоечная туннельная МПТ-2000К с пальчиковым конвейером предназначена для мытья тарелок, стаканов, чашек, столовых приборов, подносов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/589/d8158cgaplc1nzv9hs9ih5n537ey4uhk.jpg",
    price: 8200000,
    code: "2470",
},
{
    link: "mpt-2000k-levaya.html",
    title: "Туннельная посудомоечная машина МПТ-2000К (левая)",
    desc: "Машина посудомоечная туннельная МПТ-2000К с пальчиковым конвейером предназначена для мытья тарелок, стаканов, чашек, столовых приборов, подносов на малых и средних предприятиях общественного питания.",
    img: "https://abat.ru/upload/iblock/589/d8158cgaplc1nzv9hs9ih5n537ey4uhk.jpg",
    price: 8200000,
    code: "2471",
},
{
    link: "spmp-7-7.html",
    title: "Предмоечный стол СПМП-7-7",
    desc: "",
    img: "https://abat.ru/upload/iblock/631/15gg25n5oqu8o8pofpr70b5n04uzk1rf.jpg",
    price: 418800,
    code: "2484",
},
// _____________________________________Аксессуары для посудомоечных машин____________________________________________
{
    link: "tp-20-1-1.html",
    title: "Тележка для пароконвектомата ТП 20-1/1",
    desc: "Тележка передвижная ТП-20-1/1 является вспомогательным оборудованием, вмещает 20 гастроемкостей, размером GN 1/1, и используется для их транспортировки и установки в 20-ти уровневом пароконвектомате ПКА-20-1/1 ПП..",
    img: "https://abat.ru/upload/iblock/d50/yzg1v51dkiepcporpfgr09cvm2c131n3.jpg",
    price: 286500,
    code: "1774",
},
{
    link: "shs-20-1-1.html",
    title: "Шпилька станционарная ШС-20-1/1",
    desc: "Шпилька станционарная ШС-20-1/1",
    img: "https://abat.ru/upload/iblock/449/zapz0dss8d4grywtbctlc5gifp4r3u3f.jpg",
    price: 166500,
    code: "1775",
},
{
    link: "400kh400-mm.html",
    title: "Держатель бокалов к корзине нейтральной (для стаканов и чашек)",
    desc: "Держатель бокалов к корзине нейтральной (для стаканов и чашек) 400х400 мм",
    img: "https://abat.ru/upload/iblock/430/up7olb5wbw7yey7g3wfwik5fdsg54kdi.jpg",
    price: 4290,
    code: "1779",
},
{
    link: "400kh400-mm2.html",
    title: "Корзина нейтральная (для стаканов и чашек)",
    desc: "Корзина нейтральная (для стаканов и чашек) 400х400 мм",
    img: "https://abat.ru/upload/iblock/c01/urs12jwoxfnd9dcwimk7tg681101d5xg.jpg",
    price: 6600,
    code: "1780",
},
{
    link: "syemnyy-derzhatel-65.html",
    title: "Съёмный держатель №65",
    desc: "Съёмный держатель №65 - 2 шт (для противней, подносов и гастроемкостей глубиной до 65 мм)",
    img: "https://abat.ru/upload/iblock/c96/mcvxmhumhqa32f58vs4g1rg77ju4sve1.jpg",
    price: 36850,
    code: "1781",
},
{
    link: "syemnyy-derzhatel-40.html",
    title: "Съёмный держатель №40",
    desc: "Съёмный держатель №40 - 2 шт (для противней, подносов и гастроемкостей глубиной до 40 мм)",
    img: "https://abat.ru/upload/iblock/df2/0wjywvm31m8r7w5xff4v3nftlchkf48z.jpg",
    price: 37950,
    code: "1782",
},
{
    link: "syemnyy-derzhatel-20.html",
    title: "Съёмный держатель №20",
    desc: "Съёмный держатель №20 - 2 шт (для противней, подносов и гастроемкостей глубиной до 20 мм)",
    img: "https://abat.ru/upload/iblock/e6e/crxdwjup1xkz29tu9nr0dtmn6f4h06ck.jpg",
    price: 39050,
    code: "1783",
},
{
    link: "500kh500-mm.html",
    title: "Корзина для тарелок 500х500 мм",
    desc: "Корзина для тарелок 500х500 мм",
    img: "https://abat.ru/upload/iblock/56b/ynwr2py20nyty6acj2ow6jmfp95wlxlg.jpg",
    price: 10175,
    code: "1784",
},
{
    link: "500kh500-mm2.html",
    title: "Корзина нейтральная (для стаканов и чашек)",
    desc: "Корзина нейтральная (для стаканов и чашек) 500х500 мм",
    img: "https://abat.ru/upload/iblock/a88/34kt0zht19gqdnplgbg702j1afg808op.jpg",
    price: 10175,
    code: "1785",
},
{
    link: "kassete-500kh500-mm.html",
    title: "Рамка к нейтральной кассете",
    desc: "Рамка к нейтральной кассете 500х500 мм",
    img: "https://abat.ru/upload/iblock/a06/leijk53pw7c7t26aqrl4k80p9r7iajlk.jpg",
    price: 10175,
    code: "1786",
},
{
    link: "stakan-dlya-stolovykh-priborov.html",
    title: "Стакан для столовых приборов",
    desc: "Стакан для столовых приборов",
    img: "https://abat.ru/upload/iblock/2f0/tstcc91xqkdxi9tq9bo1ysohseqe3nx0.jpg",
    price: 1265,
    code: "1787",
},
{
    link: "protiven-600kh800-mm.html",
    title: "Противень 600х800 мм",
    desc: "Противень 600х800 мм",
    img: "https://abat.ru/upload/iblock/2b6/tp1drm8zmbdrdwy64zn1nld45rj55q1g.jpg",
    price: 22780,
    code: "1789",
},
// _____________________________________Моющие средства для посудомоечных машин____________________________________________
{
    link: "gw-5-l.html",
    title: "Жидкое моющее средство Abat GW (5 л)",
    desc: "Жидкое щелочное концентрированное моющее средство для стаканомоечных машин Abat GW предназначено для бережной обработки и регулярной очистки хрупкой посуды.",
    img: "https://abat.ru/upload/iblock/2de/fv7o92q3x4f6gm98j887ebx1gt6zxgy5.png",
    price: 12750,
    code: "1017",
},
{
    link: "gr-5-l.html",
    title: "Жидкое ополаскивающее средство Abat GR (5 л)",
    desc: "Жидкое кислотное концентрированное ополаскивающее средство для стаканомоечных машин Abat GW предназначено для бережной обработки и регулярной очистки хрупкой посуды.",
    img: "https://abat.ru/upload/iblock/f0a/j8zer0z3a2bw1yo4koogccaerb92ge5p.png",
    price: 11000,
    code: "1018",
},
{
    link: "dw-5-l.html",
    title: "Жидкое моющее средство Abat DW (5 л)",
    desc: "Концентрированное жидкое щелочное моющее средство DW предназначено для мытья различных видов посуды в посудомоечных машинах.",
    img: "https://abat.ru/upload/iblock/682/0qrct40jo6pdeut5tuhsroohfkjebh35.png",
    price: 11250,
    code: "1019",
},
{
    link: "dw-al-5-l.html",
    title: "Жидкое моющее средство Abat DW / AL (5 л)",
    desc: "Концентрированное жидкое щелочное моющее средство DW / AL предназначено для мытья различных видов посуды в посудомоечных машинах.",
    img: "https://abat.ru/upload/iblock/dbc/niki68tf62zgeta1ovdbzf30y1uxli9d.png",
    price: 15000,
    code: "1020",
},
{
    link: "dw-anticaramel-5-l.html",
    title: "Жидкое моющее средство Abat DW/AntiCaramel (5 л)",
    desc: "Жидкое моющее средство Abat DW/AntiCaramel (5 л) предназначено для мытья стеклянной, фарфоровой посуды, а также посуды из нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/ea9/62coaezu23sg84v3ohi929gapvz1xkx4.png",
    price: 12250,
    code: "1021",
},
{
    link: "dr-5-l.html",
    title: "Жидкое ополаскивающее средство Abat DR (5 л)",
    desc: "Кислотное ополаскивающее средство DR предназначено для ополаскивания посуды в посудомоечных машинах различного типа.",
    img: "https://abat.ru/upload/iblock/445/ifz0foi7khs82n6y0xwbs16la8jdru2m.png",
    price: 12750,
    code: "1022",
},
{
    link: "dez-alco-5-l.html",
    title: "Дезинфицирующее средство Abat Dez Alco (5 л)",
    desc: "Предназначено для антисептической обработки рук персонала, а также поверхностей.",
    img: "https://abat.ru/upload/iblock/54c/f0flqx48v81njfhdziq7xysba3foxk7a.jpg",
    price: 15500,
    code: "1023",
},
{
    link: "dez-chlor-5-l.html",
    title: "Дезинфицирующее средство Abat Dez Chlor (5 л)",
    desc: "Предназначено для обработки производственных и складских помещений, а также мест общего пользования, пищевого технологического оборудования, тары, инвентаря, посуды и других твердых поверхностей.",
    img: "https://abat.ru/upload/iblock/12c/ueofd6sbfmi0gvpxla3lt0n06drgjv4n.jpg",
    price: 15500,
    code: "1024",
},
{
    link: "tabletki-2-v-1-s.html",
    title: "Abat PW&R tabs (100 шт) - моющие таблетки 2 в 1 с ополаскивающим эффектом",
    desc: "Моющие таблетки 2 в 1 Abat PW&R tabs (100 шт) с ополаскивающим эффектом предназначены для очистки поверхности камеры пароконвектоматов и конвекционных печей, оснащенных функцией автоматической мойки таблетками.",
    img: "https://abat.ru/upload/iblock/d3f/63ehq9m1tpocdnxeuhbj50gnh88xxn4s.png",
    price: 35000,
    code: "2223",
},
    // _____________________________________Вентиляционные зонты____________________________________________
    {
        link: "zont-vytyazhnoy-zvv-4-6-4p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-4-6/4П с пароконденсатором",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/c29/cyks1k7eqsozro1x41ri9w219ya6siap.jpg",
        price: 455400,
        code: "21000002118",
    },
    {
        link: "zont-vytyazhnoy-zvv-4-6-4pm-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-4-6/4ПМ с пароконденсатором",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/910/dbqa4a87sx5uqwfou4hhwc11mk82uqkb.jpg",
        price: 445000,
        code: "21000002842",
    },
    {
        link: "zont-vytyazhnoy-zvv-4-6-4.html",
        title: "Зонт вытяжной ЗВВ-4-6/4",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 177500,
        code: "21000080802",
    },
    {
        link: "zont-vytyazhnoy-zvv-6-6-4m.html",
        title: "Зонт вытяжной ЗВВ-6-6/4М",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/727/f0zji9px81qzddilp5dollfkq4f5z5u0.jpg",
        price: 192150,
        code: "21000004663",
    },
    {
        link: "zont-vytyazhnoy-zvv-10-6-4m.html",
        title: "Зонт вытяжной ЗВВ-10-6/4М",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/727/f0zji9px81qzddilp5dollfkq4f5z5u0.jpg",
        price: 187000,
        code: "21000004655",
    },
    {
        link: "zont-vytyazhnoy-zvv-6-6-4.html",
        title: "Зонт вытяжной ЗВВ-6-6/4",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 183000,
        code: "21000080803",
    },
    {
        link: "zont-vytyazhnoy-zve-800-2p.html",
        title: "Зонт вытяжной ЗВЭ-800-2П",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/da3/oxz7dh7s4jo3jux117tdmw7a7zvre66j.jpg",
        price: 273650,
        code: "21000180422",
    },
    {
        link: "zont-vytyazhnoy-zve-900-2p.html",
        title: "Зонт вытяжной ЗВЭ-900-2П",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/e8b/9fb021gwn07jxg5vvbrdkeuhj4c99txu.jpg",
        price: 301600,
        code: "21000180839",
    },
    {
        link: "zont-vytyazhnoy-zve-900-1-5p.html",
        title: "Зонт вытяжной ЗВЭ-900-1,5П",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/029/pm7vi1ue413vq1zormou885k7n6gckl0.jpg",
        price: 249600,
        code: "21000180838",
    },
    {
        link: "zont-vytyazhnoy-zve-900-4-o.html",
        title: "Зонт вытяжной ЗВЭ-900-4-О",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/c7f/ia5zcqr3u1iyia42f0cg1z4rfn6xf3t6.jpg",
        price: 475150,
        code: "221000802403",
    },
    {
        link: "zont-pritochno-vytyazhnoy-zpv-900-1-5p.html",
        title: "Зонт приточно-вытяжной ЗПВ-900-1,5П",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/a39/18zbhp6ymb9pj8oblkgi4jrzioconssz.jpg",
        price: 265850,
        code: "21000007877",
    },
    {
        link: "zont-pritochno-vytyazhnoy-zpv-1100-2-o.html",
        title: "Зонт приточно-вытяжной ЗПВ-1100-2-О",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/476/mr7dnywluk33gzaae29l005warlv8yo8.jpg",
        price: 375700,
        code: "21001801170",
    },
    {
        link: "zont-vytyazhnoy-zvv-700v.html",
        title: "Зонт вытяжной ЗВВ-700В",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "https://abat.ru/upload/iblock/308/652b3ym99m572vgmiqtltac7xzdra4p1.jpg",
        price: 135000,
        code: "21000012221",
    },
    {
        link: "zont_vytyazhnoi.html",
        title: "Зонт вентиляционный вытяжной",
        desc: "Зонт вентиляционный пристенный вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "/images/products/zont/2.jpg",
        price: 54554,
        code: "2695",
    },
    {
        link: "zont_pritochnyi.html",
        title: "Зонт вентиляционный приточно-вытяжной",
        desc: "Зонт вентиляционный пристенный приточно-вытяжной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "/images/products/zont/1.jpg",
        price: 57535,
        code: "2696",
    },
    {
        link: "zont_nastennyi.html",
        title: "Зонт вентиляционный настенный",
        desc: "Зонт вентиляционный настенный предназначен для очистки воздуха на кухне от масла, жира, дыма и водяных паров. Зонт должен подключаться к вытяжной вентиляционной системе предприятия, где он установлен.",
        img: "/images/products/zont/4.jpg",
        price: 58195,
        code: "2691",
    },
    {
        link: "zont_type2.html",
        title: "Зонт вентиляционный островной тип 2",
        desc: "Зонт вентиляционный островной тип 2 предназначен для очистки воздуха на кухне от масла, жира, дыма и водяных паров. Зонт должен подключаться к вытяжной вентиляционной системе предприятия, где он установлен. Изделие подвешивается к потолку над тепловыводящим оборудованием.",
        img: "/images/products/zont/6.jpg",
        price: 78390,
        code: "2693",
    },
    {
        link: "zont_ostrovnoi.html",
        title: "Зонт вентиляционный островной",
        desc: "Зонт вентиляционный островной используется для очистки воздуха от паров жира, масла, влаги и подачи чистого воздуха в зону рабочего места. Устанавливается в кулинарных и кондитерских цехах, собственных производствах предприятий торговли над тепловым оборудованием.",
        img: "/images/products/zont/3.jpg",
        price: 80193,
        code: "2692",
    },
    {
        link: "zont_type1.html",
        title: "Зонт вентиляционный островной тип 1",
        desc: "Зонт вентиляционный островной предназначен для очистки воздуха на кухне от масла, жира, дыма и водяных паров. Зонт должен подключаться к вытяжной вентиляционной системе предприятия, где он установлен. Изделие подвешивается к потолку над тепловыводящим оборудованием. ",
        img: "/images/products/zont/5.jpg",
        price: 81670,
        code: "2694",
    },
    
	{
        link: "zont-vytyazhnoy-zvv-600p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-600П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/35e/r8sqh553nn83ahcxu0yu0dp2rdv4lrg0.jpg",
        price: 391000,
        code: "21000005678",
    },
	{
        link: "zont-vytyazhnoy-zvv-600.html",
        title: "Зонт вытяжной ЗВВ-600",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/308/652b3ym99m572vgmiqtltac7xzdra4p1.jpg",
        price: 131000,
        code: "21000080608",
    },
	{
        link: "zont-vytyazhnoy-zvv-700p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-700П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/35e/r8sqh553nn83ahcxu0yu0dp2rdv4lrg0.jpg",
        price: 402000,
        code: "21000004662",
    },
	{
        link: "zont-vytyazhnoy-zvv-700.html",
        title: "Зонт вытяжной ЗВВ-700",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/308/652b3ym99m572vgmiqtltac7xzdra4p1.jpg",
        price: 135000,
        code: "21000080700",
    },
	{
        link: "zont-vytyazhnoy-zvv-800p-s-parokondensatorom.html",
        title: "Зонт вытяжной ЗВВ-800П с пароконденсатором",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/d1a/hvujep713a026itm6lbyrdxi97f45hsf.jpg",
        price: 612500,
        code: "21000002816",
    },
	{
        link: "zont-vytyazhnoy-zvv-800.html",
        title: "Зонт вытяжной ЗВВ-800",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 180000,
        code: "21000001627",
    },
	{
        link: "zont-vytyazhnoy-zvv-900.html",
        title: "Зонт вытяжной ЗВВ-900",
        desc: "Программируемый бойлерный пароконвектомат ПКА 6-1/1ПП2<br>• современное решение для вашей кухни, исключающее многие традиционные этапы из процесса приготовления и позволяющее готовить большое количество высококачественных блюд за короткий промежуток времени со значительной экономией средств.",
        img: "https://abat.ru/upload/iblock/1f3/kms31c5pruu69zcrvo6fdz85ncsgoxmx.jpg",
        price: 181000,
        code: "21000080801",
    },

    // _____________________________________Холодильные шкафы____________________________________________
    {
        link: "shkhs-0-5-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,5 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,5 краш. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 394500,
        code: "71000002410",
    },
    {
        link: "shkhs-0-5-01-nerzh.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,5-01 нерж",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,5-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 514000,
        code: "71000002411",
    },
    {
        link: "shkhs-0-5-02-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,5-02 краш.",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,5-02 краш. с нижним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 441000,
        code: "71000002455",
    },
    {
        link: "shkhs-0-7-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,7 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,7 с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 466500,
        code: "71000002415",
    },
    {
        link: "shkhs-0-7-01-nerzh.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,7-01 нерж",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,7-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 574500,
        code: "71000002414",
    },
    {
        link: "shkhs-0-7-02-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,7-02 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,7-02 с нижним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 548000,
        code: "71000002456",
    },
    {
        link: "shkhs-0-7-03-nerzh.html",
        title: "Шкаф холодильный среднетемпературный ШХс-0,7-03 нерж",
        desc: "Шкаф холодильный среднетемпературный ШХс-0,7-03 с нижним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/979/2du8ant9xp87t5z10bsvdmyj8opls1ft.jpg",
        price: 582000,
        code: "71000002485",
    },
    {
        link: "shkhs-1-0-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-1,0 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-1,0 краш. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 588500,
        code: "71000002462",
    },
    {
        link: "shkhs-1-4-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-1,4 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-1,4 краш. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 661500,
        code: "71000002420",
    },
    {
        link: "shkhs-1-4-01-nerzh.html",
        title: "Шкаф холодильный среднетемпературный ШХс-1,4-01 нерж",
        desc: "Шкаф холодильный среднетемпературный ШХс-1,4-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/4d4/bdm6s703km2s7tnsuznfvshu1prcvn9g.jpg",
        price: 804500,
        code: "71000002416",
    },
    {
        link: "shkhs-1-4-02-krash.html",
        title: "Шкаф холодильный среднетемпературный ШХс-1,4-02 краш",
        desc: "Шкаф холодильный среднетемпературный ШХс-1,4-02 краш. с нижним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/913/bqntmmb64en8d8ysqnyrgtjk5t00341v.jpg",
        price: 720500,
        code: "71000002457",
    },
    {
        link: "shkh-0-5-krash.html",
        title: "Шкаф холодильный универсальный ШХ-0,5 краш",
        desc: "Шкаф холодильный универсальный ШХ-0,5 краш. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 512000,
        code: "71000002421",
    },
    {
        link: "shkhs-1-4-03-nerzh.html",
        title: "Шкаф холодильный среднетемпературный ШХс-1,4-03 нерж",
        desc: "Шкаф холодильный среднетемпературный ШХс-1,4-03 нерж. с нижним расположением агрегата предназначен для кратковременного хранения и охлаждения пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/fa8/cfbookotlyq9bvi7i6rjvtujg37vv75u.jpg",
        price: 868500,
        code: "71000002486",
    },
    {
        link: "shkh-0-5-01-nerzh.html",
        title: "Шкаф холодильный универсальный ШХ-0,5-01 нерж",
        desc: "Шкаф холодильный универсальный ШХ-0,5-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 548500,
        code: "71000002422",
    },
    {
        link: "shkh-0-5-02-krash.html",
        title: "Шкаф холодильный универсальный ШХ-0,5-02 краш",
        desc: "Шкаф холодильный универсальный ШХ-0,5-02 краш. с нижним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 464500,
        code: "71000002406",
    },
    {
        link: "shkh-0-7-krash.html",
        title: "Шкаф холодильный универсальный ШХ-0,7 краш",
        desc: "Шкаф холодильный универсальный ШХ-0,7 с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 546000,
        code: "71000002405",
    },
    {
        link: "shkh-0-7-01-nerzh.html",
        title: "Шкаф холодильный универсальный ШХ-0,7-01 нерж",
        desc: "Шкаф холодильный универсальный ШХ-0,7-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 608000,
        code: "71000002404",
    },
    {
        link: "shkh-0-7-02-krash.html",
        title: "Шкаф холодильный универсальный ШХ-0,7-02 краш",
        desc: "Шкаф холодильный универсальный ШХ-0,7-02 с нижним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 574000,
        code: "71000004761",
    },
    {
        link: "shkh-1-0-krash.html",
        title: "Шкаф холодильный универсальный ШХ-1,0 краш",
        desc: "Шкаф холодильный универсальный ШХ-1,0 краш. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 712000,
        code: "71000002461",
    },
    {
        link: "shkh-1-4-krash.html",
        title: "Шкаф холодильный универсальный ШХ-1,4 краш",
        desc: "Шкаф холодильный универсальный ШХ-1,4 краш. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 780500,
        code: "71000001126",
    },
    {
        link: "shkh-1-4-01-nerzh.html",
        title: "Шкаф холодильный универсальный ШХ-1,4-01 нерж",
        desc: "Шкаф холодильный универсальный ШХ-1,4-01 нерж. с верхним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/4d4/bdm6s703km2s7tnsuznfvshu1prcvn9g.jpg",
        price: 865500,
        code: "71000002407",
    },
    {
        link: "shkh-1-4-02-krash.html",
        title: "Шкаф холодильный универсальный ШХ-1,4-02 краш",
        desc: "Шкаф холодильный универсальный ШХ-1,4-02 краш. с нижним расположением агрегата предназначен для кратковременного хранения, охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/913/bqntmmb64en8d8ysqnyrgtjk5t00341v.jpg",
        price: 745000,
        code: "71000002403",
    },
    {
        link: "shkhn-0-5-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,5 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,5 краш. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 534000,
        code: "71000002425",
    },
    {
        link: "shkhn-0-5-01-nerzh.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,5-01 нерж",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,5-01 нерж. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 594500,
        code: "71000002428",
    },
    {
        link: "shkhn-0-5-02-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,5-02 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,5-02 краш. с нижним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 538500,
        code: "71000002427",
    },
    {
        link: "shkhn-0-7-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,7 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,7 с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/389/hzc902si5tn7waia9fota0tbip83lc05.jpg",
        price: 591500,
        code: "71000002408",
    },
    {
        link: "shkhn-0-7-01-nerzh.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,7-01 нерж",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,7-01 нерж. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/0a4/7khz3ssbqrd9kygf8mqabhjzldjg6frp.jpg",
        price: 660500,
        code: "71000002412",
    },
    {
        link: "shkhn-0-7-02-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-0,7-02 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-0,7-02 с нижним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/72d/zm35ycafdt1lrphkcsps2yidc2zwqbwx.jpg",
        price: 629000,
        code: "71000002451",
    },
    {
        link: "shkhn-1-0-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-1,0 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-1,0 краш. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 798500,
        code: "71000002463"
    },
    {
        link: "shkhn-1-4-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-1,4 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-1,4 краш. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c27/1gh7f0jxu26oy3hunw3so9ixegl93seu.jpg",
        price: 899500,
        code: "71000002409",
    },
    {
        link: "shkhn-1-4-01-nerzh.html",
        title: "Шкаф холодильный низкотемпературный ШХн-1,4-01 нерж",
        desc: "Шкаф холодильный низкотемпературный ШХн-1,4-01 нерж. с верхним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/4d4/bdm6s703km2s7tnsuznfvshu1prcvn9g.jpg",
        price: 951500,
        code: "71000002413",
    },
    {
        link: "shkhn-1-4-02-krash.html",
        title: "Шкаф холодильный низкотемпературный ШХн-1,4-02 краш",
        desc: "Шкаф холодильный низкотемпературный ШХн-1,4-02 краш. с нижним расположением агрегата предназначен для охлаждения и замораживания пищевых продуктов и напитков на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/913/bqntmmb64en8d8ysqnyrgtjk5t00341v.jpg",
        price: 889000,
        code: "71000002453",
    },
// _____________________________________Холодильные столы____________________________________________
    {
        link: "skhs-70-1-dver.html",
        title: "Стол холодильный среднетемпературный СХС-70 (1 дверь)",
        desc: "Стол охлаждаемый среднетемпературный гастронормированный СХС-70 предназначен для хранения полуфабрикатов мяса и рыбы, или других скоропортящихся продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/fe3/54aldqjmq1os9gxn2r7b6n2kw1ctw067.jpg",
        price: 397525,
        code: "24100011000",
    },
    {
        link: "skhn-70-1-dver.html",
        title: "Стол холодильный низкотемпературный СХН-70 (1 дверь)",
        desc: "Стол холодильный низкотемпературный СХН-70 предназначен для хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/fe3/54aldqjmq1os9gxn2r7b6n2kw1ctw067.jpg",
        price: 458370,
        code: "24100111000",
    },
    {
        link: "skhs-60-01-so-2-dveri.html",
        title: "Стол холодильный среднетемпературный СХС-60-01-СО (2 двери)",
        desc: "Стол холодильный среднетемпературный СХС-60-01-СО с охлаждаемой столешницей предназначен хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/504/wvravi0djbj6x99vdzz8z916ajhuyn60.jpg",
        price: 535535,
        code: "24011011100",
    },
    {
        link: "skhs-60-01-2-dveri.html",
        title: "Стол холодильный среднетемпературный СХС-60-01 (2 двери)",
        desc: "Стол холодильный среднетемпературный СХС-60-01 предназначен хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/504/wvravi0djbj6x99vdzz8z916ajhuyn60.jpg",
        price: 454510,
        code: "24010011100",
    },
    {
        link: "skhn-60-01-2-dveri.html",
        title: "Стол холодильный низкотемпературный СХН-60-01 (2 двери)",
        desc: "Стол холодильный низкотемпературный СХН-60-01 предназначен для хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/781/fdgujnr7fy075loz39fq9n187bcec9hk.jpg",
        price: 502805,
        code: "24010111100",
    },
    {
        link: "skhs-70-01-2-dveri-ranee-skhs-70-011.html",
        title: "Стол холодильный среднетемпературный СХС-70-01 (2 двери)",
        desc: "Стол охлаждаемый среднетемпературный гастронормированный СХС-70-01 предназначен для хранения полуфабрикатов мяса и рыбы, или других скоропортящихся продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/3c7/1cs586tf8zwl3pfio46wgzwfsmsh83f9.jpg",
        price: 476015,
        code: "24110011100",
    },
    {
        link: "skhn-70-01-2-dveri-ranee-skhn-70-011.html",
        title: "Стол холодильный низкотемпературный СХН-70-01 (2 двери)",
        desc: "Стол холодильный низкотемпературный СХН-70-01 предназначен для хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/57b/o101t9017h5p95182mnbfe0a0jbjtzhj.jpg",
        price: 547235,
        code: "24110111100",
    },
    {
        link: "skhs-70-01p-dlya-pitstsy-2-dveri-gn-1-4-8-sht.html",
        title: "Стол холодильный среднетемпературный СХС-70-01П для пиццы (2 двери, GN 1/4 - 8 шт)",
        desc: "Стол холодильный СХС-70-01П - среднетемпературный гастронормированный стол для пиццы. Предназначен для хранения полуфабрикатов для пиццы, а также готовой пиццы. Может использоваться как самостоятельно, так и в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/870/dhwhkyz7qgx3e8lf5an37i4csl60be49.jpg",
        price: 610360,
        code: "71010802473",
    },
    {
        link: "skhs-80-01p-dlya-pitstsy-2-dveri-gn-1-4-8-sht.html",
        title: "Стол холодильный среднетемпературный СХС-80-01П для пиццы (2 двери, GN 1/4 - 8 шт)",
        desc: "Стол холодильный СХС-80-01П - среднетемпературный гастронормированный стол для пиццы. Предназначен для хранения полуфабрикатов для пиццы, а также готовой пиццы. Может использоваться как самостоятельно, так и в составе технологических линий.",
        img: "https://abat.ru/upload/iblock/870/dhwhkyz7qgx3e8lf5an37i4csl60be49.jpg",
        price: 623645,
        code: "71010802454",
    },
    {
        link: "skhs-60-02-3-dveri.html",
        title: "Стол холодильный среднетемпературный СХС-60-02 (3 двери)",
        desc: "Стол холодильный среднетемпературный СХС-60-02 предназначен для хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/73f/8ag6lk2a0q035tgrji2lfhiub3vgqb5y.jpg",
        price: 546035,
        code: "24020011110",
    },
    {
        link: "skhs-70-02-3-dveri-ranee-skhs-70-021.html",
        title: "Стол холодильный среднетемпературный СХС-70-02 (3 двери)",
        desc: "Стол холодильный среднетемпературный СХС-70-02 предназначен для хранения полуфабрикатов мяса и рыбы, или других скоропортящихся продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/a48/6vmsv7zloxyu1r4c1nzi4r7yjeczz5sh.jpg",
        price: 567730,
        code: "24120011110",
    },
    {
        link: "skhn-70-02-3-dveri-ranee-skhn-70-021.html",
        title: "Стол холодильный низкотемпературный СХН-70-02 (3 двери)",
        desc: "Стол холодильный низкотемпературный СХН-70-02 предназначен для хранения пищевых продуктов. Может использоваться как самостоятельно, так и встраиваться в барные стойки.",
        img: "https://abat.ru/upload/iblock/a48/6vmsv7zloxyu1r4c1nzi4r7yjeczz5sh.jpg",
        price: 630855,
        code: "24120111110",
    },
    {
        link: "stol-s-okhlazhdaemoy-stoleshnitsey-pvv-n-70so.html",
        title: "Стол с охлаждаемой столешницей ПВВ(Н)-70СО",
        desc: "Стол охлаждаемый ПВВ(Н)-70СО предназначен для разделки полуфабрикатов мяса и рыбы. Используется на предприятиях общественного питания самостоятельно или в составе технологической линии.",
        img: "https://abat.ru/upload/iblock/273/fr1o36pd99s0fk1735kznv3gtv0zshow.jpg",
        price: 398475,
        code: "71001080625",
    },
    {
        link: "stol-s-okhlazhdaemoy-stoleshnitsey-pvv-n-70so-kupe.html",
        title: "Стол с охлаждаемой столешницей ПВВ(Н)-70СО купе",
        desc: "Стол охлаждаемый ПВВ(Н)-70СО купе предназначен для разделки полуфабрикатов мяса и рыбы. Используется на предприятиях общественного питания самостоятельно или в составе технологической линии.",
        img: "https://abat.ru/upload/iblock/6ff/c7jk7fl2w6d64nxtxnxbhdfhcy6amjp3.jpg",
        price: 425670,
        code: "71001080600",
    },
    {
        link: "skhs-70n-dver-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (дверь) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/900/9ruiti9n5lkij65j42mlbf8ynmucot5r.jpg",
        price: 408000,
        code: "25100011000",
    },
    {
        link: "skhs-70n-yashchiki-1-2-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (ящики 1/2) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/f78/s5ixyf659d9a5qyl3mrpv80a79bhea97.jpg",
        price: 456500,
        code: "25100013000",
    },
    {
        link: "skhs-70n-yashchik-1-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (ящик 1) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/e34/lph5dmyh5czlm2a00xebe1wz9whxzte2.jpg",
        price: 425000,
        code: "25100014000",
    },
    {
        link: "skhs-70n-dver-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (дверь) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/049/ac718yjou07ccjnq0mbwfbxjbm0e33o9.jpg",
        price: 407000,
        code: "25100021000",
    },
    {
        link: "skhs-70n-yashchiki-1-2-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (ящики 1/2) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/b4b/66ezbo51mscfzm8qz3hd05286n314wn1.jpg",
        price: 455000,
        code: "25100023000",
    },
    {
        link: "skhs-70n-yashchik-1-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н (ящик 1) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/774/ny6lljnshoxa0tv1m10tzo9n17hqr2l9.jpg",
        price: 423000,
        code: "25100024000",
    },
    {
        link: "skhs-70n-01-dver-dver-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, дверь) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/d7f/jkjcwbsi1u7ldybi8kl1zr9s10yz8f5j.jpg",
        price: 475000,
        code: "25110011100",
    },
    {
        link: "skhs-70n-01-dver-yashchiki-1-2-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, ящики 1/2) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/a9a/63yp8fekxkfpu0rvgp8vybvtcy2l8mih.jpg",
        price: 523500,
        code: "25110011300",
    },
    {
        link: "skhs-70n-01-dver-yashchik-1-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, ящик 1) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/a1a/l4sn2gbdtrfqg4wbf8zfaavrgm7pkbi8.jpg",
        price: 523500,
        code: "25110011400",
    },
    {
        link: "skhs-70n-01-dver-dver-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, дверь) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/02e/1uxq1ueb13snj08egurhphqbg6lqfu92.jpg",
        price: 473500,
        code: "25110021100",
    },
    {
        link: "skhs-70n-01-dver-yashchiki-1-2-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, ящики 1/2) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/337/04i0skgp4e1204v2hdzpes7gcygsg3x2.jpg",
        price: 521500,
        code: "25110021300",
    },
    {
        link: "skhs-70n-01-dver-yashchik-1-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-01 (дверь, ящик 1) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/367/lkwmxhvh2r6fgwanemfsb62u4yhfsx18.jpg",
        price: 489500,
        code: "25110021400",
    },
    {
        link: "skhs-70n-02-dver-dver-dver-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, дверь, дверь) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/787/47hcloz8d9lay6obkzkcdyzppkso0tyf.jpg",
        price: 628500,
        code: "25120011110",
    },
    {
        link: "skhs-70n-02-dver-dver-yashchiki-1-2-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, дверь, ящики 1/2) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/d17/limb3v6lofggmjn1arc2hmkvm0r4atrz.jpg",
        price: 676500,
        code: "25120011130",
    },
    {
        link: "skhs-70n-02-dver-yashchiki-1-2-yashchik-1-s-bortom.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, ящики 1/2, ящик 1) с бортом",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/235/tu1249slyfbx2t7pkagp725iumk7493j.jpg",
        price: 692500,
        code: "25120011340",
    },
    {
        link: "skhs-70n-02-dver-dver-dver-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, дверь, дверь) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/d55/oj0npbl8pgnhemy18s7nje0bjuocqdt0.jpg",
        price: 627000,
        code: "25120021110",
    },
    {
        link: "skhs-70n-02-dver-dver-yashchiki-1-2-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, дверь, ящики 1/2) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/778/48xoc3f3ryqea4iv5wjxr3qoqx93knu3.jpg",
        price: 675000,
        code: "25120021130",
    },
    {
        link: "skhs-70n-02-dver-yashchiki-1-2-yashchik-1-bez-borta.html",
        title: "Стол холодильный среднетемпературный СХС-70Н-02 (дверь, ящики 1/2, ящик 1) без борта",
        desc: "Стол холодильный среднетемпературный СХС-70Н-02 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/1b0/1kzvo0zt14aa5kmrap0x11p9pvt6gehq.jpg",
        price: 691000,
        code: "25120021340",
    },
    {
        link: "skhn-70n-01-dver-dver-s-bortom.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, дверь) с бортом",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/d7f/jkjcwbsi1u7ldybi8kl1zr9s10yz8f5j.jpg",
        price: 528000,
        code: "25110111100",
    },
    {
        link: "skhn-70n-01-dver-yashchik-1-2-s-bortom.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, ящик 1/2) с бортом",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/a9a/63yp8fekxkfpu0rvgp8vybvtcy2l8mih.jpg",
        price: 576500,
        code: "25110111300",
    },
    {
        link: "skhn-70n-01-dver-yashchik-1-s-bortom.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, ящик 1) с бортом",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/a1a/l4sn2gbdtrfqg4wbf8zfaavrgm7pkbi8.jpg",
        price: 544500,
        code: "25110111400",
    },
    {
        link: "skhn-70n-01-dver-dver-bez-borta.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, дверь) без борта",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/02e/1uxq1ueb13snj08egurhphqbg6lqfu92.jpg",
        price: 526500,
        code: "25110121100",
    },
    {
        link: "skhn-70n-01-dver-yashchik-1-2-bez-borta.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, ящик 1/2) без борта",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/337/04i0skgp4e1204v2hdzpes7gcygsg3x2.jpg",
        price: 574500,
        code: "25110121300",
    },
    {
        link: "skhn-70n-01-dver-yashchik-1-bez-borta.html",
        title: "Стол холодильный низкотемпературный СХН-70Н-01 (дверь, ящик 1) без борта",
        desc: "Стол холодильный низкотемпературный СХН-70Н-01 с нижним расположением агрегата предназначен для кратковременного хранения пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/367/lkwmxhvh2r6fgwanemfsb62u4yhfsx18.jpg",
        price: 542500,
        code: "25110121400",
    },

    // _____________________________________Льдогенераторы____________________________________________
    {
        link: "lg-60-20g-01.html",
        title: "Льдогенератор ЛГ-60/20Г-01 (водяное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-60/20Г-01 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/e78/00nys112gj81smb1bcsztjddind6afhz.jpg",
        price: 1061440,
        code: "71000019529",
    },
    {
        link: "lg-60-20g-02.html",
        title: "Льдогенератор ЛГ-60/20Г-02 (воздушное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-60/20Г-02 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/cbc/8mugvt4f4rxevtvh0p5nh11v12hpf4ev.jpg",
        price: 1061440,
        code: "71000019528",
    },
    {
        link: "lg-90-30g-01.html",
        title: "Льдогенератор ЛГ-90/30Г-01 (водяное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-90/30Г-01 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/e78/00nys112gj81smb1bcsztjddind6afhz.jpg",
        price: 1184490,
        code: "71000019500",
    },
    {
        link: "lg-90-30g-02.html",
        title: "Льдогенератор ЛГ-90/30Г-02 (воздушное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-90/30Г-02 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/cbc/8mugvt4f4rxevtvh0p5nh11v12hpf4ev.jpg",
        price: 1184490,
        code: "71000019505",
    },
    {
        link: "lg-150-40g-01.html",
        title: "Льдогенератор ЛГ-150/40Г-01 (водяное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-150/40Г-01 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/c96/s7b7g5odjb6g1s7dvh7ghtcy1rkyy87j.jpg",
        price: 1387255,
        code: "71000019548",
    },
    {
        link: "lg-150-40g-02.html",
        title: "Льдогенератор ЛГ-150/40Г-02 (воздушное охлаждение)",
        desc: "Льдогенератор гранулированного льда ЛГ-150/40Г-02 предназначен для производства гранулированного льда, применяемого для длительного охлаждения свежей рыбы и мяса, свежих фруктов и овощей, подачи шампанского и вин, оформления блюд в отелях, барах и ресторанах.",
        img: "https://abat.ru/upload/iblock/cbc/8mugvt4f4rxevtvh0p5nh11v12hpf4ev.jpg",
        price: 1387255,
        code: "71000019552",
    },
    {
        link: "lg-24-06k-01.html",
        title: "Льдогенератор ЛГ-24/06К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-24/06К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/2f6/xpzvfyi9dnqhz9req0anh4iwypweg6w2.jpg",
        price: 487500,
        code: "71000019405",
    },
    {
        link: "lg-24-06k-02.html",
        title: "Льдогенератор ЛГ-24/06К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-24/06К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/8e8/5qlvr2zfw8u6kiytbjasr1bfr5my24gm.jpg",
        price: 487500,
        code: "71000019494",
    },
    {
        link: "lg-24-06k-03.html",
        title: "Льдогенератор ЛГ-24/06К-03 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-24/06К-03 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/2f6/xpzvfyi9dnqhz9req0anh4iwypweg6w2.jpg",
        price: 503435,
        code: "71000019537",
    },
    {
        link: "lg-24-06k-04.html",
        title: "Льдогенератор ЛГ-24/06К-04 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-24/06К-04 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/8e8/5qlvr2zfw8u6kiytbjasr1bfr5my24gm.jpg",
        price: 503435,
        code: "71000019538",
    },
    {
        link: "lg-37-15k-01.html",
        title: "Льдогенератор ЛГ-37/15К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-37/15К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/866/kuylz0w7tyvfclwqvwyrthzhog3y63vi.jpg",
        price: 570000,
        code: "71000019403",
    },
    {
        link: "lg-37-15k-02.html",
        title: "Льдогенератор ЛГ-37/15К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-37/15К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/167/m897y3b3f0vydi1997hubsxj5wphdta3.jpg",
        price: 570000,
        code: "71000019437",
    },
    {
        link: "lg-46-15k-01.html",
        title: "Льдогенератор ЛГ-46/15К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-46/15К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/bf3/aylyle1l2n6kf6lh787xd29owjnx67qy.jpg",
        price: 595000,
        code: "71000019438",
    },
    {
        link: "lg-46-15k-02.html",
        title: "Льдогенератор ЛГ-46/15К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-46/15К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/797/viqdzx50xepin5zm1ahzuq8169e99s8q.jpg",
        price: 595000,
        code: "71000019447",
    },
    {
        link: "lg-46-25k-01.html",
        title: "Льдогенератор ЛГ-46/25К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-46/25К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/2a3/d6v80usrcismtvyiq5mxbh67qaz9bpeg.jpg",
        price: 601500,
        code: "71000019490",
    },
    {
        link: "lg-46-25k-02.html",
        title: "Льдогенератор ЛГ-46/25К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-46/25К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/967/k4ktgdvhw9yylzw3ggexpshis3f2kdf9.jpg",
        price: 601500,
        code: "71000019491",
    },
    {
        link: "lg-64-40k-01.html",
        title: "Льдогенератор ЛГ-64/40К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-64/40К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/949/k2kn83oscey1019ea7brg50xtq2zlg6j.jpg",
        price: 864025,
        code: "71000009996",
    },
    {
        link: "lg-64-40k-02.html",
        title: "Льдогенератор ЛГ-64/40К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-64/40К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/967/k4ktgdvhw9yylzw3ggexpshis3f2kdf9.jpg",
        price: 864025,
        code: "71000019556",
    },
    {
        link: "lg-80-40k-01.html",
        title: "Льдогенератор ЛГ-80/40К-01 (водяное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-80/40К-01 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/949/k2kn83oscey1019ea7brg50xtq2zlg6j.jpg",
        price: 910570,
        code: "71000019576",
    },
    {
        link: "lg-80-40k-02.html",
        title: "Льдогенератор ЛГ-80/40К-02 (воздушное охлаждение)",
        desc: "Льдогенератор кубикового льда ЛГ-80/40К-02 предназначен для приготовления кубиков льда в кафе, барах, ресторанах, отелях для быстрого охлаждения напитков.",
        img: "https://abat.ru/upload/iblock/967/k4ktgdvhw9yylzw3ggexpshis3f2kdf9.jpg",
        price: 910570,
        code: "71000019577",
    },
    {
        link: "lg-250ch-01.html",
        title: "Льдогенератор ЛГ-250Ч-01 (водяное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-250Ч-01 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/e61/gn1u308vkp5qg7st2mennex72711h7yi.jpg",
        price: 1701000,
        code: "71000019493",
    },
    {
        link: "lg-250ch-02.html",
        title: "Льдогенератор ЛГ-250Ч-02 (воздушное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-250Ч-02 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/315/tq9dye4tqp1mm9t01v6g0vp97aegf3uf.jpg",
        price: 1701000,
        code: "71000019499",
    },
    {
        link: "lg-400ch-01.html",
        title: "Льдогенератор ЛГ-400Ч-01 (водяное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-400Ч-01 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/ee1/wipij4enfahffxgq7a348a0jtj73cig7.jpg",
        price: 1902000,
        code: "71000019411",
    },
    {
        link: "lg-400ch-02.html",
        title: "Льдогенератор ЛГ-400Ч-02 (воздушное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-400Ч-02 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/334/g9b3jlva068tragju5sjqayynfdkgild.jpg",
        price: 1902000,
        code: "71000019446",
    },
    {
        link: "lg-620ch-01.html",
        title: "Льдогенератор ЛГ-620Ч-01 (водяное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-620Ч-01 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/ee1/wipij4enfahffxgq7a348a0jtj73cig7.jpg",
        price: 2442000,
        code: "71000019443",
    },
    {
        link: "lg-620ch-02.html",
        title: "Льдогенератор ЛГ-620Ч-02 (воздушное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-620Ч-02 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/334/g9b3jlva068tragju5sjqayynfdkgild.jpg",
        price: 2442000,
        code: "71000019492",
    },
    {
        link: "lg-1200ch-01.html",
        title: "Льдогенератор ЛГ-1200Ч-01 (водяное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-1200Ч-01 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/ca9/s9hihojihv5uknh9p09d311hf4xn7nrj.jpg",
        price: 4453000,
        code: "71000019498",
    },
    {
        link: "lg-1200ch-02.html",
        title: "Льдогенератор ЛГ-1200Ч-02 (воздушное охлаждение)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-1200Ч-02 предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности",
        img: "https://abat.ru/upload/iblock/e2f/qxxfft9bbqocvoeotdrdvyermy55s6di.jpg",
        price: 4453000,
        code: "71000019511",
    },
    {
        link: "lg-1200ch-03.html",
        title: "Льдогенератор ЛГ-1200Ч-03 (выносной холод - для сплит-систем)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-1200Ч-03 (выносной холод - для сплит-систем) предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности.",
        img: "https://abat.ru/upload/iblock/204/gcziqo5hublswwijsdjztua3urzn3p2b.jpg",
        price: 3150080,
        code: "71000019551",
    },
    {
        link: "bunker-bn-2-100.html",
        title: "Бункер БН-2-100",
        desc: "Бункер-накопитель БН-2-100 для сбора и хранения льда при эксплуатации со льдогенераторами чешуйчатого льда типа ЛГ-400Ч",
        img: "https://abat.ru/upload/iblock/0f1/ljsvnrg21yjvwr4t2kgbv03j0q6fzao5.jpg",
        price: 649000,
        code: "71000019456",
    },
    {
        link: "bunker-b-300.html",
        title: "Бункер Б-300",
        desc: "Бункер Б-300 предназначен для сбора, накопления и хранения льда, вырабатываемого льдогенераторами чешуйчатого льда типа ЛГ-250, ЛГ-400, ЛГ-620.",
        img: "https://abat.ru/upload/iblock/9dc/fmdsvsr4fc7aqxceywd234bc3x3k0jkt.jpg",
        price: 388500,
        code: "71000019991",
    },
    {
        link: "bunker-b-400.html",
        title: "Бункер Б-400",
        desc: "Бункер Б-400 предназначен для сбора, накопления и хранения льда, вырабатываемого льдогенераторами чешуйчатого льда типа ЛГ-250Ч, ЛГ-400Ч, ЛГ-620Ч.",
        img: "https://abat.ru/upload/iblock/a7d/te0wd134b3t7z8ydam5635zcf5bog86e.jpg",
        price: 459500,
        code: "71000019412",
    },
    {
        link: "bunker-b-400-bez-kryshki.html",
        title: "Бункер Б-400 (без крышки)",
        desc: "Бункер Б-400 (без крышки) предназначен для сбора, накопления и хранения льда, вырабатываемого льдогенераторами чешуйчатого льда ЛГ-1200Ч-01, ЛГ-1200Ч-02.",
        img: "https://abat.ru/upload/iblock/9dc/fmdsvsr4fc7aqxceywd234bc3x3k0jkt.jpg",
        price: 436000,
        code: "71000019601",
    },
    {
        link: "lg-1200ch-04.html",
        title: "Льдогенератор ЛГ-1200Ч-04 (выносной холод - централизованная подача хладагента)",
        desc: "Льдогенератор чешуйчатого льда ЛГ-1200Ч-04 (выносной холод - централизованная подача хладагента) предназначен для производства льда чешуйчатого типа, применяемого при производстве полуфабрикатов и колбасных изделий, для хранения овощей, фруктов, мяса, рыбы, для охлаждения напитков и приготовления холодной воды на предприятиях общественного питания, торговли, мясоперерабатывающей и рыбоперерабатывающей промышленности.",
        img: "https://abat.ru/upload/iblock/204/gcziqo5hublswwijsdjztua3urzn3p2b.jpg",
        price: 3150080,
        code: "71000019618",
    },

    // _____________________________________Настольные витрины____________________________________________
    {
        link: "vkhn-70.html",
        title: "Витрина холодильная ВХН-70",
        desc: "Витрина холодильная настольная типа ВХН-70 предназначена для демонстрации и поддержания в охлажденном состоянии различных продуктов, холодных закусок и третьих блюд.",
        img: "https://abat.ru/upload/iblock/23c/7d8yy8qm82ysj9sadktndnvvwyvbutks.jpg",
        price: 668350,
        code: "21000807728",
    },
    {
        link: "vkhn-70-01.html",
        title: "Витрина холодильная ВХН-70-01",
        desc: "Витрина холодильная настольная типа ВХН-70-01 предназначена для демонстрации и поддержания в охлажденном состоянии различных продуктов, холодных закусок и третьих блюд.",
        img: "https://abat.ru/upload/iblock/73a/brklxv2cp4yec7q1u6t5add6aa4w0cry.jpg",
        price: 584500,
        code: "21000807729",
    },
    {
        link: "vtn-70.html",
        title: "Витрина тепловая ВТН-70",
        desc: "Витрина тепловая настольная типа ВТН 70 предназначена для демонстрации и поддержания в горячем состоянии (при заданной температуре) пищевых продуктов на тарелках или в функциональных емкостях и реализации их потребителю.",
        img: "https://abat.ru/upload/iblock/393/huygp5dvpa8hqo3ib8ppz18hpygcq1bt.jpg",
        price: 394500,
        code: "21000807725",
    },
    {
        link: "vnn-70.html",
        title: "Витрина нейтральная ВНН-70",
        desc: "Витрина нейтральная настольная типа ВНН-70 предназначена для кратковременного хранения пищевых продуктов на тарелках или в функциональных емкостях и реализации их потребителю",
        img: "https://abat.ru/upload/iblock/33a/pbd821vr3x9grncma9e1v7u63cur560d.jpg",
        price: 290950,
        code: "21000807726",
    },

    // _____________________________________Холодильные камеры____________________________________________
    {
        link: "shokk-201.html",
        title: "Камера шоковой заморозки ШОКК-201",
        desc: "Камера шоковой заморозки ШОКК-201 предназначена для быстрого охлаждения и замораживания различных пищевых продуктов и полуфабрикатов для дальнейшего их хранения на низкотемпературных складах предприятий общественного питания.",
        img: "https://abat.ru/upload/iblock/ca1/6xbwo52unwsthpegp227zfvofuqm4j8a.jpg",
        price: 9995000,
        code: "71000019608",
    },
    {
        link: "shokk-202.html",
        title: "Камера шоковой заморозки ШОКК-202",
        desc: "Камера шоковой заморозки ШОКК-202 предназначена для быстрого охлаждения и замораживания различных пищевых продуктов и полуфабрикатов для дальнейшего их хранения на низкотемпературных складах предприятий общественного питания",
        img: "https://abat.ru/upload/iblock/dd5/7pq86tfpe8xeoainvkgpu135bapzj22z.jpg",
        price: 14550000,
        code: "71000019605",
    },
    {
        link: "shokk-203.html",
        title: "Камера шоковой заморозки ШОКК-203",
        desc: "Камера шоковой заморозки ШОКК-203 предназначена для быстрого охлаждения и замораживания различных пищевых продуктов и полуфабрикатов для дальнейшего их хранения на низкотемпературных складах предприятий общественного питания.",
        img: "https://abat.ru/upload/iblock/b63/741zwh7zhlnrfomnk3jrsvl9tsbuww1r.jpg",
        price: 19750000,
        code: "71000019609",
    },

    // _____________________________________Шкафы шоковой заморозки____________________________________________
    {
        link: "shok-20-1-1m.html",
        title: "ШОК-20-1/1М",
        desc: "Аппарат шоковой заморозки ШОК-20-1/1М предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/4d4/t3hssd39qcyeg6m54sby7laxhradmvgm.jpg",
        price: 3512000,
        code: "71000019416",
    },
    {
        link: "shok-40-01.html",
        title: "ШОК-40-01",
        desc: "Аппарат шоковой заморозки ШОК-40-01 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/2ad/o5cb5fh7lzy6y1tr5foymsf7jr5mapmr.jpg",
        price: 6785000,
        code: "71000019522",
    },
    {
        link: "shok-40.html",
        title: "ШОК-40",
        desc: "Аппарат шоковой заморозки ШОК-40 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/2ad/o5cb5fh7lzy6y1tr5foymsf7jr5mapmr.jpg",
        price: 6440000,
        code: "71000019512",
    },
    {
        link: "shok-20-1-1t-01.html",
        title: "ШОК-20-1/1Т-01",
        desc: "Аппарат шоковой заморозки ШОК-20-1/1Т-01 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/69b/gjs516s5il3hpbd3bmmg4x3esmlyz0yf.jpg",
        price: 3464500,
        code: "71000019477",
    },
    {
        link: "shok-20-1-1t.html",
        title: "ШОК-20-1/1Т",
        desc: "Аппарат шоковой заморозки ШОК-20-1/1Т предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/733/32ny3t9cga1xfocfdhpdiijdvwbi1ww2.jpg",
        price: 3117000,
        code: "71000000961",
    },
    {
        link: "shok-20-1-1.html",
        title: "ШОК-20-1/1",
        desc: "Аппарат шоковой заморозки ШОК-20-1/1 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/7e1/nijat9m5zu55xnr05tcc6i7a1pu99fci.jpg",
        price: 2492500,
        code: "71000000960",
    },
    {
        link: "shok-10-1-1.html",
        title: "ШОК-10-1/1",
        desc: "Аппарат шоковой заморозки ШОК-10-1/1 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/259/9ccx4uvlg2oog93oc59ffvrksrbyc7y7.jpg",
        price: 1822000,
        code: "71010801129",
    },
    {
        link: "shok-6-1-1.html",
        title: "ШОК-6-1/1",
        desc: "Аппарат шоковой заморозки ШОК-6-1/1 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/9b9/t1d7sqzz6dw9vqd48jeyoyv04qi9nhw1.jpg",
        price: 1441485,
        code: "71010801130",
    },
    {
        link: "shok-4-1-1.html",
        title: "ШОК-4-1/1",
        desc: "Аппарат шоковой заморозки ШОК-4-1/1 предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли",
        img: "https://abat.ru/upload/iblock/e2b/fu9dbbsoiuk4c3788ehoqkx5js3p20li.jpg",
        price: 1243000,
        code: "71010801135",
    },
    {
        link: "shok-10-1-1-serii-light.html",
        title: "ШОК-10-1/1 серии LIGHT",
        desc: "Аппарат шоковой заморозки ШОК-10-1/1 серии LIGHT предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/963/wwas92qaob6xza1f2fpj415km0s8cf8s.jpg",
        price: 1313250,
        code: "71000098419",
    },
    {
        link: "shok-6-1-1-serii-light.html",
        title: "ШОК-6-1/1 серии LIGHT",
        desc: "Аппарат шоковой заморозки ШОК-6-1/1 серии LIGHT предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c3a/i5f0gukptopyll6nvs0a865kh5jw2e9h.jpg",
        price: 1096950,
        code: "71000098420",
    },
    {
        link: "shok-5-1-1-serii-light.html",
        title: "ШОК-5-1/1 серии LIGHT",
        desc: "Аппарат шоковой заморозки ШОК-5-1/1 серии LIGHT предназначен для быстрого охлаждения, замораживания и дальнейшего хранения различных пищевых продуктов на предприятиях общественного питания и торговли.",
        img: "https://abat.ru/upload/iblock/c3a/i5f0gukptopyll6nvs0a865kh5jw2e9h.jpg",
        price: 1070000,
        code: "71000098421",
    },

    // _____________________________________Гастроемкости из нержавейки____________________________________________
    {
        link: "gastroemkost-gn-1-3-20.html",
        title: "Гастроемкость GN-1/3-20",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/537/1j6csn8cjgew5x3ekw5cpby9cj0lu2ek.jpg",
        price: 4500,
        code: "12000002185",
    },
    {
        link: "gastroemkost-gn-1-3-40.html",
        title: "Гастроемкость GN-1/3-40",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/774/ppnsnb30vdy4qwo2hmrrl0j6b0hnzuay.jpg",
        price: 6500,
        code: "12000025317",
    },
    {
        link: "gastroemkost-gn-1-2-20.html",
        title: "Гастроемкость GN-1/2-20",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/fa7/1akum22fmjlrggxgfwlra2s9pvnynjvb.jpg",
        price: 5000,
        code: "12000020376",
    },
    {
        link: "gastroemkost-gn-1-1-20.html",
        title: "Гастроемкость GN-1/1-20",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/bb1/8b5kfqpqlm6yrotzd6n1q03glnm20ejm.jpg",
        price: 8500,
        code: "21000808175",
    },
    {
        link: "gastroemkost-gn-1-1-40.html",
        title: "Гастроемкость GN-1/1-40",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/bb1/8b5kfqpqlm6yrotzd6n1q03glnm20ejm.jpg",
        price: 10750,
        code: "21000073652",
    },
    {
        link: "gastroemkost-gn-1-1-65.html",
        title: "Гастроемкость GN-1/1-65",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "https://abat.ru/upload/iblock/d25/wfdtnxfxadbqdx67efnau66lpzr2reww.jpg",
        price: 12000,
        code: "21000007867",
    },
    {
        link: "container_1_1.html",
        title: "Гастроемкость GN 1/1",
        desc: "Гастроемкость 1/1 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "/images/products/container/1.png",
        price: 1935,
        code: "8341",
    },
    {
        link: "container_1_2.html",
        title: "Гастроемкость GN 1/2",
        desc: "Гастроемкость 1/2 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "/images/products/container/2.png",
        price: 1290,
        code: "8342",
    },
    {
        link: "container_1_3.html",
        title: "Гастроемкость GN 1/3",
        desc: "Гастроемкость 1/3 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "/images/products/container/3.png",
        price: 1161,
        code: "8343",
    },
    {
        link: "container_1_4.html",
        title: "Гастроемкость GN 1/4",
        desc: "Гастроемкость 1/4 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "/images/products/container/4.png",
        price: 1122,
        code: "8344",
    },
    {
        link: "container_1_6.html",
        title: "Гастроемкость GN 1/6",
        desc: "Гастроемкость 1/6 из нержавеющей стали используется для приготовления различных блюд на профессиональной кухне. Гастроемкости из нержавеющей стали используются в качестве емкости для теста в расстоечных шкафах, демонстрации и кратковременного хранения блюд на линиях раздачи, глубокой заморозки, охлаждения и последующего хранения продуктов, полуфабрикатов и мороженого в различном холодильном оборудовании, а также для транспортировки и хранения продуктов.",
        img: "/images/products/container/5.png",
        price: 1032,
        code: "8345",
    },
    {
        link: "container_cap.html",
        title: "Крышка от гастроёмкости GN",
        desc: "Крышки из нержавеющей стали  предназначены для совместного использования с гастроемкостями разных размеров. Модель выполнена с вырезами под ручки гастроемкости. Крышка имеет собственную ручку для удобства использования.",
        img: "/images/products/container/9.jpg",
        price: 361,
        code: "8346",
    },

    // _____________________________________Гастроемкости перфорированные____________________________________________
    {
        link: "container_1_1_perforated.html",
        title: "Гастроемкость перфорированная GN 1/1",
        desc: "Гастроемкость перфорированная 1/1 из нержавеющей стали — это специальные пищевые лотки с многочисленными отверстиями на дне, предназначены для термической обработки продуктов на пару, бланширования, процеживания и сушки. Гастроемкость перфорированная подойдет для варки блюд на пару и в пароконвектомате. Пар равномерно распределяется по всему объему рабочей камеры и продукты готовятся быстрее. Также используется при выпечке хлебобулочных и кондитерских изделий.",
        img: "/images/products/container/6.png",
        price: 3225,
        code: "8351",
    },
    {
        link: "container_1_2_perforated.html",
        title: "Гастроемкость перфорированная GN 1/2",
        desc: "Гастроемкость 1/2 из нержавеющей стали — это специальные пищевые лотки с многочисленными отверстиями на дне, предназначены для термической обработки продуктов на пару, бланширования, процеживания и сушки. Гастроемкость перфорированная подойдет для варки блюд на пару и в пароконвектомате. Пар равномерно распределяется по всему объему рабочей камеры и продукты готовятся быстрее. Также используется при выпечке хлебобулочных и кондитерских изделий.",
        img: "/images/products/container/7.png",
        price: 2838,
        code: "8352",
    },
    {
        link: "container_1_3_perforated.html",
        title: "Гастроемкость перфорированная GN 1/3",
        desc: "Гастроемкость 1/2 из нержавеющей стали — это специальные пищевые лотки с многочисленными отверстиями на дне, предназначены для термической обработки продуктов на пару, бланширования, процеживания и сушки. Гастроемкость перфорированная подойдет для варки блюд на пару и в пароконвектомате. Пар равномерно распределяется по всему объему рабочей камеры и продукты готовятся быстрее. Также используется при выпечке хлебобулочных и кондитерских изделий.",
        img: "/images/products/container/8.png",
        price: 2709,
        code: "8353",
    },
    {
        link: "container_cap.html",
        title: "Крышка от гастроёмкости GN",
        desc: "Крышки из нержавеющей стали  предназначены для совместного использования с гастроемкостями разных размеров. Модель выполнена с вырезами под ручки гастроемкости. Крышка имеет собственную ручку для удобства использования.",
        img: "/images/products/container/9.jpg",
        price: 361,
        code: "8346",
    },

    // _____________________________________Формы из нержавейки____________________________________________
    {
        link: "container_5.html",
        title: "Форма нержавейка 5 деления",
        desc: "Форма разделенная 5 деления изготовлена из высококачеиственной нержавеющей стали. Многоразовые и перерабатываемые, уменьшают отходы и экологически чистые. Отлично подходит для школы, детского сада, компании, ресторана, кемпинга, пикников, внутреннего или наружного использования.",
        img: "/images/products/container/11.png",
        price: 1187,
        code: "8361",
    },
    {
        link: "container_4.html",
        title: "Форма нержавейка 4 деления",
        desc: "Форма разделенная 4 деления изготовлена из высококачеиственной нержавеющей стали. Многоразовые и перерабатываемые, уменьшают отходы и экологически чистые. Отлично подходит для школы, детского сада, компании, ресторана, кемпинга, пикников, внутреннего или наружного использования.",
        img: "/images/products/container/10.png",
        price: 1187,
        code: "8362",
    },
    {
        link: "container_2.html",
        title: "Форма нержавейка 2 деления",
        desc: "Форма разделенная 2 деления изготовлена из высококачеиственной нержавеющей стали. Многоразовые и перерабатываемые, уменьшают отходы и экологически чистые. Отлично подходит для школы, детского сада, компании, ресторана, кемпинга, пикников, внутреннего или наружного использования.",
        img: "/images/products/container/9.png",
        price: 1122,
        code: "8363",
    },
    {
        link: "container_cap_shape.html",
        title: "Крышка для формы из нержавейки",
        desc: " Крышки для формы  предназначены для совместного использования с формами из нержавейки разных размеров. Крышки для формы предотвращают попадание грязи внутрь и выветривание продуктов.",
        img: "/images/products/container/12.png",
        price: 323,
        code: "8364",
    },
// _____________________________________Планетарные миксеры____________________________________________
{
    link: "mixer_7.html",
    title: "Миксер планетарный B7 л",
    desc: "Миксер планетарный B7 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "/images/products/mixer/1.jpg",
    price: 70830,
    code: "8382",
},
{
    link: "mixer_15.html",
    title: "Миксер планетарный B15 л",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "/images/products/mixer/2.jpg",
    price: 116660,
    code: "8382",
},
{
    link: "planetarnyy-mikser-mpl-40.html",
    title: "Планетарный миксер МПЛ-40",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/6d6/1muk0zouqa6squg1d8nxybn7ics2fhr6.jpg",
    price: 1800000,
    code: "41000000047",
},
{
    link: "mikser-planetarnyy-mpl-60.html",
    title: "Планетарный миксер МПЛ-60",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/f02/en2ic82961l2ejdcn0ve5d5fuobe996o.jpg",
    price: 2060000,
    code: "41000019529",
},
{
    link: "nasadka-lopatka-dlya-mpl-40.html",
    title: "Насадка ЛОПАТКА для МПЛ-40",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/633/n0bx2zjm8nv8ekfs3b9xfmer1v52uuj7.jpg",
    price: 110000,
    code: "41000017325",
},
{
    link: "nasadka-venchik-s-tonkimi-prutyami-dlya-mpl-40.html",
    title: "Насадка ВЕНЧИК С ТОНКИМИ ПРУТЬЯМИ для МПЛ-40",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/8d0/6oe33gnw9mfriojfkqqqnv1xked3354l.jpg",
    price: 92000,
    code: "41000000089",
},
{
    link: "nasadka-venchik-s-tonkimi-prutyami-dlya-mpl-60.html",
    title: "Насадка ВЕНЧИК С ТОНКИМИ ПРУТЬЯМИ для МПЛ-60",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/8d0/6oe33gnw9mfriojfkqqqnv1xked3354l.jpg",
    price: 112000,
    code: "41000017216",
},
{
    link: "nasadka-venchik-s-tolstymi-prutyami-dlya-mpl-40.html",
    title: "Насадка ВЕНЧИК С ТОЛСТЫМИ ПРУТЬЯМИ для МПЛ-40",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/8d0/6oe33gnw9mfriojfkqqqnv1xked3354l.jpg",
    price: 109500,
    code: "41000000087",
},
{
    link: "nasadka-venchik-s-tolstymi-prutyami-dlya-mpl-60.html",
    title: "Насадка ВЕНЧИК С ТОЛСТЫМИ ПРУТЬЯМИ для МПЛ-60",
    desc: "Миксер планетарный B15 предназначен для замешивания теста различных сортов. Представленное оборудование FIMAR также позволяет готовить пюре и соусы, взбивать кремы и муссы. Каждый миксер обладает длительным сроком службы, благодаря прочной конструкции, окрашенной особой, стойкой к механическим воздействиям краской. Детали, непосредственно соприкасающиеся с продуктами, выполнены из гигиеничного материала - нержавеющей стали.",
    img: "https://abat.ru/upload/iblock/8db/jrf5worzmxwy5spss9igmz7t9nv08sln.jpg",
    price: 109500,
    code: "41000020413",
},
// _____________________________________Мясорубки____________________________________________
{
link: "myasorubka-mep-300n-01.html",
title: "Мясорубка МЭП-300Н-01",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/03b/mtb6ns7owaf7pgmr2elrvwqxv0qpqqwb.jpg",
price: 418500,
code: "41000019457",
},
{
link: "myasorubka-mep-300n.html",
title: "Мясорубка МЭП-300Н",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/928/yu8rhbz561cqz0o48r5bgwz8jnc4jgk2.jpg",
price: 455000,
code: "41000008950",
},
{
link: "myasorubka-mep-300.html",
title: "Мясорубка МЭП-300",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/7dc/ferv1lqhuikys5dmx2eva6y385vf2d2z.jpg",
price: 499500,
code: "41000008927",
},
// _____________________________________Овощерезки____________________________________________
{
link: "mashina-ovoshcherezatelnaya-mko-50.html",
title: "Машина овощерезательная МКО-50",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/2c5/2ttco4ghoryxfhb2r2kf75pwvzqbe4p8.jpg",
price: 399500,
code: "41000009877",
},
// ______________________________________Картофелечистки___________________________________________
{
link: "mashina-kartofeleochistitelnaya-mkk-150.html",
title: "Машина картофелеочистительная МКК-150",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/029/s7cfr1v07qjjznjslxf67g32vnf6fcbk.jpg",
price: 394450,
code: "41000009878",
},
{
link: "mashina-kartofeleochistitelnaya-kukhonnaya-tipa-mkk-150-01.html",
title: "Машина картофелеочистительная кухонная типа МКК-150-01",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/74a/cvize4ldhk1spbmbo0wdvl969dbwxei5.jpg",
price: 437500,
code: "41000209878",
},
{
link: "mashina-kartofeleochistitelnaya-mkk-150-01-cubitron.html",
title: "Машина картофелеочистительная кухонная типа МКК-150-01 Cubitron",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/74a/cvize4ldhk1spbmbo0wdvl969dbwxei5.jpg",
price: 491000,
code: "41000309878",
},
{
link: "mashina-kartofeleochistitelnaya-kukhonnaya-tipa-mkk-300.html",
title: "Машина картофелеочистительная кухонная типа МКК-300",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/029/s7cfr1v07qjjznjslxf67g32vnf6fcbk.jpg",
price: 414000,
code: "41000009884",
},
{
link: "mashina-kartofeleochistitelnaya-kukhonnaya-tipa-mkk-300-01.html",
title: "Машина картофелеочистительная кухонная типа МКК-300-01",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/74a/cvize4ldhk1spbmbo0wdvl969dbwxei5.jpg",
price: 455000,
code: "41000209884",
},
{
link: "mashina-kartofeleochistitelnaya-mkk-300-01-cubitron.html",
title: "Машина картофелеочистительная МКК-300-01 Cubitron",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/74a/cvize4ldhk1spbmbo0wdvl969dbwxei5.jpg",
price: 514500,
code: "41000309884",
},
{
link: "mashina-kartofeleochistitelnaya-kukhonnaya-tipa-mkk-500-01.html",
title: "Машина картофелеочистительная кухонная типа МКК-500-01",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/9f0/nyeq9p9b9qpm18gb4jnjf6sodnod4mlk.jpg",
price: 608000,
code: "41000009887",
},
{
link: "mashina-kartofeleochistitelnaya-mkk-500-01-cubitron.html",
title: "Машина картофелеочистительная кухонная типа МКК-500-01 Cubitron",
desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
img: "https://abat.ru/upload/iblock/9f0/nyeq9p9b9qpm18gb4jnjf6sodnod4mlk.jpg",
price: 651000,
code: "41000209887",
},
// _____________________________________Массажеры для мяса____________________________________________
{
    link: "massazher-marinator-dlya-myasa-mm-50.html",
    title: "Массажер (Маринатор) для мяса ММ-50",
    desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
    img: "https://abat.ru/upload/iblock/e0c/922wlkmdp044zig29ofex2w8ar9aeqlu.jpg",
    price: 1184000,
    code: "11000018394",
},
{
    link: "massazher-marinator-dlya-myasa-mm-50v-vakuumnyy.html",
    title: "Массажер (Маринатор) для мяса ММ-50В вакуумный",
    desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
    img: "https://abat.ru/upload/iblock/a19/p3k5gqtg25vlquch5n51sebq8lswhyw4.jpg",
    price: 1302500,
    code: "11000018402",
},
// _____________________________________Слайсеры____________________________________________
{
        link: "slicer.html",
        title: "Слайсер 250ES-10",
        desc: "Слайсер  250ES-10 — полуавтоматическое профессиональное устройство для нарезки тонкими аккуратными ломтиками мяса, колбасных изделий, сыра, фруктов, овощей и других продуктов питания. ",
        img: "/images/products/mixer/4.jpg",
        price: 79165,
        code: "8384",
    },

// _____________________________________Блендеры____________________________________________
{
        link: "blender.html",
        title: "Блендер CB-767",
        desc: "Профессиональный блендер CB-767 позволяет Вам без проблем приготовить коктейли любой сложности. Устройство идеально подходит как для домашнего использования, так и для коммерческих учреждений таких как кафе, бары, рестораны и ночные клубы. Аппарат достаточно прост в использовании и чрезвычайно легко чистится. Кувшин объёмом в 2 литра с узким основанием отлично подходит для любых коктейлей. ",
        img: "/images/products/mixer/5.jpg",
        price: 16590,
        code: "8385",
    },
];



// _______________________Выводим цены на товарах и делаем динимический_______________________________
const span4 = document.querySelectorAll(".span4");

var formatter1 = function(priceSum) {
    let mn = 0;
    let price = priceSum.toString();
    for (let ij = price.length; ij > 0; ij--) {
        if (mn % 3 == 0) {
            price = [price.slice(0, ij), " ", price.slice(ij)].join("");
        }
        mn++;
    }
    return price;
};

// ___________
const span5_price_main = document.querySelector(".span5");

data4.forEach(function(z) {
    if (span5_price_main != null) {
        const span5_price = span5_price_main.querySelector("h3");
        if (span5_price != null) {
            var url_name = window.location.href
                .split("/")
                .pop()
                .split("#")[0]
                .split("?")[0];
            if (url_name == z.link) {
                span5_price.innerHTML = `от ${formatter1(z.price)} ₸`;
            }
        }
    }
});

// ______________________________________header dinamic view________________________________________

const header_container = document.querySelector(".super_container");
header_container.innerHTML = `
    <header class="header">

    <div class="header_main">

        <div class="header_menu">

        
        <div class="header_menu_items">
        
        
        <a class="go_back" onclick="history.back()">
            <img class="go_back_img" src="/images/left-arrow.png" alt="">
        </a>
                <div class="topLogo">
                    <div class="logo_container">
                        <div class="logo">
                            <a href="index.html"><img src="images/logo.png"></a>
                        </div>
                    </div>
                </div>
                <div class="topMenu">
                    <ul class="standard_dropdown main_nav_dropdown">
                        <li><a href="index.html">Главная<i class="fas fa-chevron-down"></i></a></li>
                        <li>
                            <a href="design.html">3D Дизайн<i class="fas fa-chevron-down"></i></a>

                        </li>
                        <li>
                            <a href="delivery.html">Доставка<i class="fas fa-chevron-down"></i></a>

                        </li>
                        <li>
                            <a href="about.html">О нас<i class="fas fa-chevron-down"></i></a>

                        </li>
                        <li>
                            <a href="otzyvy.php">Отзывы<i class="fas fa-chevron-down"></i></a>

                        </li>
                        <li>
                            <a href="contact.html"><img class="ikonka1" src="images/icon.png">Контакты<i class="fas fa-chevron-down"></i></a>
                        </li>
                    </ul>
                </div>
                <!-- ___________________Burger menu start_______________________ -->
                
                <div class="wrapper" id="wrapper2">
                    <div id="select_wrap" class="select_wrap">
                        <ul class="default_option">
                            <li>
                                <a>
                                    <div class="option">
                                        <div class="coccoc-alo-phone coccoc-alo-green coccoc-alo-show">
                                            <div class="coccoc-alo-ph-circle"></div>
                                            <div class="coccoc-alo-ph-circle-fill"></div>
                                            <div class="coccoc-alo-ph-img-circle"></div>
                                        </div>
                                        <a class="tel-title-main" href="tel:87273449900"><span class="tel-title">Алматы</span><span class="tel-number">8(727) <span class="tel-number-2"> 344-99-00 </span> </span></a>
                                    </div>
                                </a>
                            </li>
                        </ul>
                        <ul class="select_ul">
                            <li class="almaty-contact-list">
                                    <div class="option">
                                    <div><span class="tel-title">Алматы</span> <div class="tel-number-main"> <a href="tel:87273449900"> <span class="tel-number">8(727) <span class="tel-number-2"> 344-99-00 </span> </span> </a> <a href="tel:87012667700"> <span class="tel-number">8(701) <span class="tel-number-2"> 266-77-00 </span> </span> </a> </div></a> </div>
                                    </div>
                            </li>
                            <li>
                                    <div class="option">
                                        <div><span class="tel-title">Астана</span> <div class="tel-number-main"> <a href="tel:87172279900"> <span class="tel-number">8(7172) <span class="tel-number-2"> 27-99-00 </span> </span> </a> <a href="tel:87172279900"> <span class="tel-number">8(701) <span class="tel-number-2"> 511-22-00 </span> </span> </a> </div></a> </div>
                                    </div>
                            </li>
                            <li>
                                    <div class="option">
                                        <div><span class="tel-title">Шымкент</span><div class="tel-number-main"> <a href="tel:87252399900"> <span class="tel-number">8(7252) <span class="tel-number-2"> 39-99-00 </span> </span> </a> <a href="tel:87019447700"> <span class="tel-number">8(701) <span class="tel-number-2"> 944-77-00 </span> </span> </a> </div> </div>
                                    </div>
                            </li>
                        </ul>
                    </div>
                </div>
                
                
                <!--<div class="burger_container">
                    <a class="nav-button ml-auto mr-4">
                        <span id="nav-icon3">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        </span>
                    </a>
                </div>-->
            </div>
            <div class="fixed-top dineuron-menu">
                <div class="flex-center p-5">
                    <ul class="nav flex-column">
                        <li class="nav-item delay-1"><a class="nav-link" href="index.html">Главная</a></li>
                        <li class="nav-item delay-2"><a class="nav-link" href="catalog.html">Товары</a></li>
                        <li class="nav-item delay-3"><a class="nav-link" href="design.html">3D Дизайн</a></li>
                        <li class="nav-item delay-4"><a class="nav-link" href="delivery.html">Доставка</a></li>
                        <li class="nav-item delay-5"><a class="nav-link" href="about.html">О нас</a></li>
                        <li class="nav-item delay-6"><a class="nav-link" href="otzyvy.php">Отзывы</a></li>
                        <li class="nav-item delay-7"><a class="nav-link" href="contact.html">Контакты</a></li>
                    </ul>
                </div>
            </div>
            <!-- ___________________Burger menu end_______________________ -->
        </div>
    </div>

    <nav class="main_nav">

        <div class="row">
            <div class="col header2_content">

                <div class="main_nav_content d-flex flex-row">

                    <div id="cat_menu_container" class="cat_menu_container cart-btn-le">
                            <div class="cat_menu_title d-flex flex-row align-items-center justify-content-start">
                                <div id="nav-icon3-2" class="cat_burger">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div class="cat_menu_text ">Товары</div>
                            </div>
                    </div>

                    <div class="search-input-box">
                        <input class="super-input" type="text" placeholder="Я ищу...">
                        <span id="search_button" class="search_button">
                            <img src="/images/search_img.png" alt="">
                        </span>
                    </div>
                    
                    <div class="basket_contacts">
                        <div class="wrapper" id="wrapper1">
                            <div id="select_wrap" class="select_wrap">
                                <ul class="default_option">
                                    <li>
                                        <a>
                                            <div class="option">
                                                <div class="coccoc-alo-phone coccoc-alo-green coccoc-alo-show">
                                                    <div class="coccoc-alo-ph-circle"></div>
                                                    <div class="coccoc-alo-ph-circle-fill"></div>
                                                    <div class="coccoc-alo-ph-img-circle"></div>
                                                </div>
                                                <a style="gap: 24px" class="tel-title-main" href="tel:87273449900"><span class="tel-title">Алматы</span><span class="tel-number">8(727) <span class="tel-number-2"> 344-99-00 </span> </span></a>
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                                <ul class="select_ul">
                                    <li class="almaty-contact-list">
                                            <div class="option">
                                            <div><span class="tel-title">Алматы</span> <div class="tel-number-main"> <a href="tel:87273449900"> <span class="tel-number">8(727) <span class="tel-number-2"> 344-99-00 </span> </span> </a> <a href="tel:87012667700"> <span class="tel-number">8(701) <span class="tel-number-2"> 266-77-00 </span> </span> </a> </div></a> </div>
                                            </div>
                                    </li>
                                    <li>
                                            <div class="option">
                                                <div><span class="tel-title">Астана</span> <div class="tel-number-main"> <a href="tel:87172279900"> <span class="tel-number">8(7172) <span class="tel-number-2"> 27-99-00 </span> </span> </a> <a href="tel:87172279900"> <span class="tel-number">8(701) <span class="tel-number-2"> 511-22-00 </span> </span> </a> </div></a> </div>
                                            </div>
                                    </li>
                                    <li>
                                            <div class="option">
                                                <div><span class="tel-title">Шымкент</span><div class="tel-number-main"> <a href="tel:87252399900"> <span class="tel-number">8(7252) <span class="tel-number-2"> 39-99-00 </span> </span> </a> <a href="tel:87019447700"> <span class="tel-number">8(701) <span class="tel-number-2"> 944-77-00 </span> </span> </a> </div> </div>
                                            </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <span class="cart-icon image-icon">
                            <strong>
                                <span class="badge badge-notify my-cart-badge">
                                    <div class="label-place"></div>
                                </span>
                            </strong>
                        </span>
                    </div>
                </div>

                <div class="menu_trigger_container ml-auto">
                    <div class="menu_trigger d-flex flex-row align-items-center justify-content-end">
                        <div class="menu_burger">
                            <div class="menu_trigger_text">menu</div>
                            <div class="cat_burger menu_burger_inner"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </nav>
</header>

<!--_____________________________________________________________________________-->

            <div class="menu_bar_footer">
                <a href="index.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/home.png" alt="home"></div>
                    <span>Главная</span>
                </a>
                <!-- <a href="products.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/list.png" alt="list"></div>
                    <span>Товары</span>
                </a> -->
                <!--<a href="design.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/design.png" alt="design"></div>
                    <span>Дизайн</span>
                </a>-->
                <a href="delivery.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/box3.png" alt="box3"></div>
                    <span>Доставка</span>
                </a>
                <a href="about.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/information.png" alt="information"></div>
                    <span>О&nbspнас</span>
                </a>
                <a href="otzyvy.php" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/review.png" alt="review"></div>
                    <span>Отзывы</span>
                </a>
                <a href="contact.html" class="menu_block">
                    <div class="menu_block_child"><img src="/images/mobile_footer_menu/telephone.png" alt="telephone"></div>
                    <span>Контакты</span>
                </a>
            </div>
    `;



// _______________________Вывод 4 товара в слайдер_______________________________

if (document.querySelector(".products_of_the_day") != null) {



    function updateLocalStorage() {
        let randomObjects = [];
        for (let i = 0; i < 4; i++) {
            let randomIndex = Math.floor(Math.random() * data4.length);
            randomObjects.push(data4[randomIndex]);
        }
        localStorage.setItem("randomObjects", JSON.stringify(randomObjects));
    }

    function displayObjects() {
        let randomObjects = JSON.parse(localStorage.getItem("randomObjects"));
        let html = "";
        for (let i = 0; i < randomObjects.length; i++) {
            html += `
            <li>
            <div class="ProductCardV category-page-list__product" role="button" tabindex="0">
                <a class="category-page-list__item-link" role="link" tabindex="0" href="${randomObjects[i].link}">
                    <div class="ProductCardV__ImgWrapper">
                        <div class="LazyImage ProductCardV__Img --loaded">
                            <div style="padding-bottom: 100%;"></div><img alt="" aria-hidden="true" class="LazyImage__Placeholder" src="${randomObjects[i].img}">
                        </div>
                    </div>
                    <div class="ProductCardV__TitleAndPaymentWrapper">
                        <div class="ProductCardV__TitleWrapper">
                            <p class="Typography ProductCardV__Title --loading Typography__Body Typography__Body_Bold">${randomObjects[i].title}</p>
                        </div>
                        <div class="ProductCardV__PaymentWrapper">
                            <div class="ProductCardV__PricesWrapper">
                            <div>
                            <p class="Typography ProductCardV__OldPrice Typography__Caption Typography__Caption_Strikethrough">${formatter1(Math.floor(randomObjects[i].price * 1.1))} ₸</p>
                        </div>
                            <div>
                                    <p class="Typography ProductCardV__Price ProductCardV__Price_WithOld Typography__Subtitle">от ${formatter1(randomObjects[i].price)} ₸</p>
                                </div>
                                
                                <div class="mobile_card_button">
                                    <button id="fly" class="product_cart_button fly viewList_product_card add_item btn btn-large btn-primary" data-id="${randomObjects[i].code}" data-title="<a href='${randomObjects[i].link}'>${randomObjects[i].title}</a>" data-price="${randomObjects[i].price}" data-quantity="1" data-img="${randomObjects[i].img}">
                                                    <img class="basket" src="">&nbsp; В корзину
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>
        
            </div></li>
        `;
        }
        document.querySelector(".products_of_the_day_child").innerHTML = html;
    }

    function checkLastUpdate() {
        let lastUpdate = localStorage.getItem("lastUpdate");
        let currentTime = new Date().getTime();
        let timeDifference = currentTime - lastUpdate;
        if (!lastUpdate || timeDifference > 86400000) {
            updateLocalStorage();
            localStorage.setItem("lastUpdate", currentTime);
        }
    }

    checkLastUpdate();
    displayObjects();
    setInterval(checkLastUpdate, 86400000);
}
// ____________________Slick.js (Товар дня)______________________

$(".products_of_the_day_child").slick({
    dots: true,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
});



// _______________________Вывод 4 товара в слайдер_______________________________







// ______________________________________________________________________________






let list = [];
data4.forEach(function(a) {
    let list2 = a.title.split(" ");
    list2.forEach(function(b) {
        list.push(b);
    });
});

$(".search-input-box").click(function(e) {
    let reversed = false;
    let info = document.querySelector(".super-input").value;

    var patterns = info.split(" ");
    console.log(patterns);

    var fields = { title: true, code: true };
    let searchedWord = document.querySelector(".super-input").value;
    if (localStorage.getItem("searched-word") === null) {
        localStorage.setItem("searched-word", JSON.stringify(searchedWord));
    } else {
        localStorage.removeItem("searched-word");
        localStorage.setItem("searched-word", JSON.stringify(searchedWord));
    }

    startSearch();

    function startSearch() {
        var results = smartSearch(data4, patterns, fields);
        let sorted = [];
        results.filter(function(a) {
            if (a.score < 2) {
                sorted.push(a.entry);
                return a.entry;
            }
        });

        document.querySelector(".super-input").value = ``;

        if (localStorage.getItem("searched-cards") === null) {
            localStorage.setItem("searched-cards", JSON.stringify(sorted));
        } else {
            localStorage.removeItem("searched-cards");
            localStorage.setItem("searched-cards", JSON.stringify(sorted));
        }

        var filename = window.location.href
            .split("/")
            .pop()
            .split("#")[0]
            .split("?")[0];
        if (sorted.length > 0) {
            window.location.href = "search.html";
        } else {
            if (reversed == false) {
                patterns.reverse();
                reversed = true;
                if (didYouMean(patterns[patterns.length - 1], list) != null) {
                    patterns = didYouMean(patterns[patterns.length - 1], list);
                    // startSearch()

                    startSearch();
                } else {
                    let patternsLastEl = patterns.length - 1;
                    let newLastElement = patterns[patternsLastEl].slice(
                        0,
                        patterns[patternsLastEl].length - 1
                    );
                    patterns.pop();
                    if (newLastElement.length != 0) {
                        patterns.push(newLastElement);
                    }
                    startSearch();
                }
            } else {
                patterns.reverse();
                reversed = false;
                if (didYouMean(patterns[patterns.length - 1], list) != null) {
                    patterns = didYouMean(patterns[patterns.length - 1], list);

                    startSearch();
                } else {
                    let patternsLastEl = patterns.length - 1;
                    let newLastElement = patterns[patternsLastEl].slice(
                        0,
                        patterns[patternsLastEl].length - 1
                    );
                    patterns.pop();
                    if (newLastElement.length != 0) {
                        patterns.push(newLastElement);
                    }

                    startSearch();
                }
            }
        }
    }
});

document
    .querySelector(".super-input")
    .addEventListener("keypress", function(e) {
        let reversed = false;
        if (e.key === "Enter") {
            let info = document.querySelector(".super-input").value;

            var patterns = info.split(" ");
            console.log(patterns);

            var fields = { title: true, code: true };
            let searchedWord = document.querySelector(".super-input").value;
            if (localStorage.getItem("searched-word") === null) {
                localStorage.setItem("searched-word", JSON.stringify(searchedWord));
            } else {
                localStorage.removeItem("searched-word");
                localStorage.setItem("searched-word", JSON.stringify(searchedWord));
            }

            startSearch();

            function startSearch() {
                var results = smartSearch(data4, patterns, fields);

                let sorted = [];
                results.filter(function(a) {
                    if (a.score < 2) {
                        sorted.push(a.entry);
                        return a.entry;
                    }
                });

                document.querySelector(".super-input").value = ``;

                if (localStorage.getItem("searched-cards") === null) {
                    localStorage.setItem("searched-cards", JSON.stringify(sorted));
                } else {
                    localStorage.removeItem("searched-cards");
                    localStorage.setItem("searched-cards", JSON.stringify(sorted));
                }

                var filename = window.location.href
                    .split("/")
                    .pop()
                    .split("#")[0]
                    .split("?")[0];
                if (sorted.length > 0) {
                    window.location.href = "search.html";
                } else {
                    if (reversed == false) {
                        patterns.reverse();
                        reversed = true;
                        if (didYouMean(patterns[patterns.length - 1], list) != null) {
                            patterns = didYouMean(patterns[patterns.length - 1], list);

                            startSearch();
                        } else {
                            let patternsLastEl = patterns.length - 1;
                            let newLastElement = patterns[patternsLastEl].slice(
                                0,
                                patterns[patternsLastEl].length - 1
                            );
                            patterns.pop();
                            if (newLastElement.length != 0) {
                                patterns.push(newLastElement);
                            }
                            startSearch();
                        }
                    } else {
                        patterns.reverse();
                        reversed = false;
                        if (didYouMean(patterns[patterns.length - 1], list) != null) {
                            patterns = didYouMean(patterns[patterns.length - 1], list);

                            startSearch();
                        } else {
                            let patternsLastEl = patterns.length - 1;
                            let newLastElement = patterns[patternsLastEl].slice(
                                0,
                                patterns[patternsLastEl].length - 1
                            );
                            patterns.pop();
                            if (newLastElement.length != 0) {
                                patterns.push(newLastElement);
                            }

                            startSearch();
                        }
                    }
                }
            }
        }
    });

function errorMsg() {
    iziToast.warning({
        title: "",
        message: "По такому запросу продуктов не найдено",
    });
}

// _______________________________________________________________________________

data4.forEach(function(e) {
    if (
        e.link == window.location.href.split("/").pop().split("#")[0].split("?")[0]
    ) {
        // localStorage.setItem('viewedURL', JSON.stringify(array_URL));

        // Get the existing data
        let existing = localStorage.getItem("viewedURL");

        // If no existing data, create an array
        // Otherwise, convert the localStorage string to an array
        existing = existing ? existing.split(",") : [];

        existing.push(e.link);

        // Save back to localStorage
        localStorage.setItem("viewedURL", existing.toString());

        display_Viewed_Items(existing);
    }
});

function display_Viewed_Items(array) {
    let span9_VI = document.querySelectorAll(".span9")[1];
    let main_VI = document.createElement("div");
    main_VI.innerHTML = `
            <h4 class="section-h4 section-title _anim-items _anim-no-hide _active">Просмотренные товары:</h4>
            <div class="softt">
                <hr class="soft">
            </div>
    `;
    let flexiselDemo5_VI = document.createElement("ul");
    flexiselDemo5_VI.setAttribute("id", "flexiselDemo5");

    array.map((a) => {
        data4.forEach(function(e) {
            if (e.link == a) {
                flexiselDemo5_VI.innerHTML += `
                    <li class="sm-card nbs-flexisel1-item" style="width: 253.667px;">
                        <a href="${e.link}">
                            <div class="sm-card-inner">
                                <div class="sm-card-inner-wrap">
                                    <div class="sm-card-img">
                                        <img src="${e.img}" alt="${e.title}">
                                    </div>
                                    <div class="sm-card-title">
                                        <h5 class="pop">${e.title}</h5>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </li>
                `;
            }
        });
    });
    main_VI.appendChild(flexiselDemo5_VI);
    if (span9_VI != null) {
        span9_VI.appendChild(main_VI);
    }
}

function devAJs() {
    const allItems = document.querySelectorAll('.itemall1');
    const allSub = document.querySelectorAll('.sub-menu');
    const childSub = document.querySelectorAll('.drop13dd');
    const btn = document.querySelector('.cart-btn-le').addEventListener('click', () => {
        document.querySelector('.side-bar12').classList.toggle('sidebaractive');
    })

    function hiddenAllElement() {
        allSub.forEach(item => {
            item.classList.add('hidden_sub');
            item.classList.remove('active_sub');
        })
        allItems.forEach(item => {
            item.classList.remove('active33');
        })
        childSub.forEach(item => {
            item.classList.remove('rotate');
        })
    }

    function showElement() {
        allItems.forEach((item, num) => {
            item.addEventListener('mouseenter', () => {
                hiddenAllElement();
                allSub[num].classList.remove('hidden_sub');
                allSub[num].classList.add('active_sub');
                allItems[num].classList.add('active33');
                if (item.classList.contains('active33')) {
                    item.firstElementChild.lastElementChild.classList.add('rotate');
                } else {
                    item.firstElementChild.lastElementChild.classList.remove('rotate');
                }
            })
        })
    }

    showElement();

    const catContainer = document.querySelector('.cat_menu_container');

    catContainer.addEventListener('click', () => {
        catContainer.classList.toggle('active');
    })



}
devAJs();