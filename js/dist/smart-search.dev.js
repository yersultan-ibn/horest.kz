"use strict";

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true,
        });
    } else {
        obj[key] = value;
    }
    return obj;
}

function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof(obj) {
            return typeof obj;
        };
    } else {
        _typeof = function _typeof(obj) {
            return obj &&
                typeof Symbol === "function" &&
                obj.constructor === Symbol &&
                obj !== Symbol.prototype ?
                "symbol" :
                typeof obj;
        };
    }
    return _typeof(obj);
}

var _match = function _match(pattern, text, offset, options) {
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

var _find = function _find(pattern, text, options) {
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

var _score = function _score(entryResults) {
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

var _getFieldString = function _getFieldString(entry, field) {
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

var _forEachObject = function _forEachObject(object, fn) {
    var _locals = [];

    (function _private(object) {
        for (var key in object) {
            _locals.push(key);

            if (_typeof(object[key]) === "object") {
                _private(object[key]);
            } else {
                fn([].concat(_locals));
            }

            _locals.pop();
        }
    })(object);
};

var _search = function _search(entries, patterns, fields, options) {
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
            var fieldResults = {
                field: field.join("."),
                patterns: [],
            };
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

var _buildOptions = function _buildOptions(options) {
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

var sanitizeArray = function sanitizeArray(array, caseSensitive) {
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
        typeof fields === "string" ? _defineProperty({}, fields, true) : fields;

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
    if (!str) return null; // If we're running a case-insensitive search, smallify str.

    if (!didYouMean.caseSensitive) {
        str = str.toLowerCase();
    } // Calculate the initial value (the threshold) if present.

    var thresholdRelative =
        didYouMean.threshold === null ? null : didYouMean.threshold * str.length,
        thresholdAbsolute = didYouMean.thresholdAbsolute,
        winningVal;
    if (thresholdRelative !== null && thresholdAbsolute !== null)
        winningVal = Math.min(thresholdRelative, thresholdAbsolute);
    else if (thresholdRelative !== null) winningVal = thresholdRelative;
    else if (thresholdAbsolute !== null) winningVal = thresholdAbsolute;
    else winningVal = null; // Get the edit distance to each option. If the closest one is less than 40% (by default) of str's length,
    // then return it.

    var winner,
        candidate,
        testCandidate,
        val,
        i,
        len = list.length;

    for (i = 0; i < len; i++) {
        // Get item.
        candidate = list[i]; // If there's a key, get the candidate value out of the object.

        if (key) {
            candidate = candidate[key];
        } // Gatekeep.

        if (!candidate) {
            continue;
        } // If we're running a case-insensitive search, smallify the candidate.

        if (!didYouMean.caseSensitive) {
            testCandidate = candidate.toLowerCase();
        } else {
            testCandidate = candidate;
        } // Get and compare edit distance.

        val = getEditDistance(str, testCandidate, winningVal); // If this value is smaller than our current winning value, OR if we have no winning val yet (i.e. the
        // threshold option is set to null, meaning the caller wants a match back no matter how bad it is), then
        // this is our new winner.

        if (winningVal === null || val < winningVal) {
            winningVal = val; // Set the winner to either the value or its object, depending on the returnWinningObject option.

            if (key && didYouMean.returnWinningObject) winner = list[i];
            else winner = candidate; // If we're returning the first match, return it now.

            if (didYouMean.returnFirstMatch) return winner;
        }
    } // If we have a winner, return it.

    return winner || didYouMean.nullResultValue;
} // Set default options.

didYouMean.threshold = 0.4;
didYouMean.thresholdAbsolute = 20;
didYouMean.caseSensitive = false;
didYouMean.nullResultValue = null;
didYouMean.returnWinningObject = null;
didYouMean.returnFirstMatch = false; // Expose.
// In node...

if (typeof module !== "undefined" && module.exports) {
    module.exports = didYouMean;
} // Otherwise...
else {
    window.didYouMean = didYouMean;
}

var MAX_INT = Math.pow(2, 32) - 1; // We could probably go higher than this, but for practical reasons let's not.

function getEditDistance(a, b, max) {
    // Handle null or undefined max.
    max = max || max === 0 ? max : MAX_INT;
    var lena = a.length;
    var lenb = b.length; // Fast path - no A or B.

    if (lena === 0) return Math.min(max + 1, lenb);
    if (lenb === 0) return Math.min(max + 1, lena); // Fast path - length diff larger than max.

    if (Math.abs(lena - lenb) > max) return max + 1; // Slow path.

    var matrix = [],
        i,
        j,
        colMin,
        minJ,
        maxJ; // Set up the first row ([0, 1, 2, 3, etc]).

    for (i = 0; i <= lenb; i++) {
        matrix[i] = [i];
    } // Set up the first column (same).

    for (j = 0; j <= lena; j++) {
        matrix[0][j] = j;
    } // Loop over the rest of the columns.

    for (i = 1; i <= lenb; i++) {
        colMin = MAX_INT;
        minJ = 1;
        if (i > max) minJ = i - max;
        maxJ = lenb + 1;
        if (maxJ > max + i) maxJ = max + i; // Loop over the rest of the rows.

        for (j = 1; j <= lena; j++) {
            // If j is out of bounds, just put a large value in the slot.
            if (j < minJ || j > maxJ) {
                matrix[i][j] = max + 1;
            } // Otherwise do the normal Levenshtein thing.
            else {
                // If the characters are the same, there's no change in edit distance.
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } // Otherwise, see if we're substituting, inserting or deleting.
                else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Substitute
                        Math.min(
                            matrix[i][j - 1] + 1, // Insert
                            matrix[i - 1][j] + 1
                        )
                    ); // Delete
                }
            } // Either way, update colMin.

            if (matrix[i][j] < colMin) colMin = matrix[i][j];
        } // If this column's minimum is greater than the allowed maximum, there's no point
        // in going on with life.

        if (colMin > max) return max + 1;
    } // If we made it this far without running into the max, then return the final matrix value.

    return matrix[lenb][lena];
}

// _______________________Выводим цены на товарах и делаем динимический_______________________________

var span4 = document.querySelectorAll(".span4");

var formatter = function formatter(priceSum) {
    var mn = 0;
    var price = priceSum.toString();

    for (var ij = price.length; ij > 0; ij--) {
        if (mn % 3 == 0) {
            price = [price.slice(0, ij), " ", price.slice(ij)].join("");
        }

        mn++;
    }

    return price;
}; // ___________

var span5_price_main = document.querySelector(".span5");
data4.forEach(function(z) {
    if (span5_price_main != null) {
        var span5_price = span5_price_main.querySelector("h3");

        if (span5_price != null) {
            var url_name = window.location.href
                .split("/")
                .pop()
                .split("#")[0]
                .split("?")[0];

            if (url_name == z.link) {
                span5_price.innerHTML = "\u043E\u0442 ".concat(
                    formatter(z.price),
                    " \u20B8"
                );
            }
        }
    }
}); // ______________________________________________________________________________

var list = [];
data4.forEach(function(a) {
    var list2 = a.title.split(" ");
    list2.forEach(function(b) {
        list.push(b);
    });
});
document
    .querySelector(".search_button")
    .addEventListener("click", function(e) {
        var reversed = false;
        var info = document.querySelector("#txtSearch").value;
        var patterns = info.split(" ");
        console.log(patterns);
        var fields = {
            title: true,
            code: true,
        };
        var searchedWord = document.querySelector("#txtSearch").value;

        if (localStorage.getItem("searched-word") === null) {
            localStorage.setItem("searched-word", JSON.stringify(searchedWord));
        } else {
            localStorage.removeItem("searched-word");
            localStorage.setItem("searched-word", JSON.stringify(searchedWord));
        }

        startSearch();

        function startSearch() {
            var results = smartSearch(data4, patterns, fields);
            var sorted = [];
            results.filter(function(a) {
                if (a.score < 2) {
                    sorted.push(a.entry);
                    return a.entry;
                }
            });
            document.querySelector("#txtSearch").value = "";

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
                        var patternsLastEl = patterns.length - 1;
                        var newLastElement = patterns[patternsLastEl].slice(
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
                        var _patternsLastEl = patterns.length - 1;

                        var _newLastElement = patterns[_patternsLastEl].slice(
                            0,
                            patterns[_patternsLastEl].length - 1
                        );

                        patterns.pop();

                        if (_newLastElement.length != 0) {
                            patterns.push(_newLastElement);
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
        var reversed = false;

        if (e.key === "Enter") {
            var startSearch = function startSearch() {
                var results = smartSearch(data4, patterns, fields);
                var sorted = [];
                results.filter(function(a) {
                    if (a.score < 2) {
                        sorted.push(a.entry);
                        return a.entry;
                    }
                });
                document.querySelector("#txtSearch").value = "";

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
                            var patternsLastEl = patterns.length - 1;
                            var newLastElement = patterns[patternsLastEl].slice(
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
                            var _patternsLastEl2 = patterns.length - 1;

                            var _newLastElement2 = patterns[_patternsLastEl2].slice(
                                0,
                                patterns[_patternsLastEl2].length - 1
                            );

                            patterns.pop();

                            if (_newLastElement2.length != 0) {
                                patterns.push(_newLastElement2);
                            }

                            startSearch();
                        }
                    }
                }
            };

            var info = document.querySelector("#txtSearch").value;
            var patterns = info.split(" ");
            console.log(patterns);
            var fields = {
                title: true,
                code: true,
            };
            var searchedWord = document.querySelector("#txtSearch").value;

            if (localStorage.getItem("searched-word") === null) {
                localStorage.setItem("searched-word", JSON.stringify(searchedWord));
            } else {
                localStorage.removeItem("searched-word");
                localStorage.setItem("searched-word", JSON.stringify(searchedWord));
            }

            startSearch();
        }
    });

function errorMsg() {
    iziToast.warning({
        title: "",
        message: "По такому запросу продуктов не найдено",
    });
} // _______________________________________________________________________________

data4.forEach(function(e) {
    if (
        e.link == window.location.href.split("/").pop().split("#")[0].split("?")[0]
    ) {
        // localStorage.setItem('viewedURL', JSON.stringify(array_URL));
        // Get the existing data
        var existing = localStorage.getItem("viewedURL"); // If no existing data, create an array
        // Otherwise, convert the localStorage string to an array

        existing = existing ? existing.split(",") : [];
        existing.push(e.link); // if (existing.some(item => item == e.link)) {}
        // console.log(existing.some(item => item == e.link));
        // console.log(existing);
        // existing.some(s => {
        // return e.link == s ? 0 : existing.push(e.link);
        // });
        // Save back to localStorage

        localStorage.setItem("viewedURL", existing.toString());
        display_Viewed_Items(existing);
    }
});