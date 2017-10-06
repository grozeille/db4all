define("ace/mode/hql_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
'use strict';

var oop = require('../lib/oop');
var TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

var HqlHighlightRules = function() {

    var keywords = (
            'ALL|ALTER|AND|ARRAY|AS|AUTHORIZATION|BETWEEN|BIGINT|BINARY|BOOLEAN|'+
            'BOTH|BY|CASE|CAST|CHAR|COLUMN|CONF|CREATE|CROSS|CUBE|CURRENT|CURRENT_DATE|'+
            'CURRENT_TIMESTAMP|CURSOR|DATABASE|DATE|DECIMAL|DELETE|DESCRIBE|DISTINCT|'+
            'DOUBLE|DROP|ELSE|END|EXCHANGE|EXISTS|EXTENDED|EXTERNAL|FALSE|FETCH|FLOAT|'+
            'FOLLOWING|FOR|FROM|FULL|FUNCTION|GRANT|GROUP|GROUPING|HAVING|IF|IMPORT|IN|'+
            'INNER|INSERT|INT|INTERSECT|INTERVAL|INTO|IS|JOIN|LATERAL|LEFT|LESS|LIKE|'+
            'LOCAL|MACRO|MAP|MORE|NONE|NOT|NULL|OF|ON|OR|ORDER|OUT|OUTER|OVER|PARTIALSCAN|'+
            'PARTITION|PERCENT|PRECEDING|PRESERVE|PROCEDURE|RANGE|READS|REDUCE|REVOKE|'+
            'RIGHT|ROLLUP|ROW|ROWS|SELECT|SET|SMALLINT|TABLE|TABLESAMPLE|THEN|TIMESTAMP|'+
            'TO|TRANSFORM|TRIGGER|TRUE|TRUNCATE|UNBOUNDED|UNION|UNIQUEJOIN|UPDATE|USER|'+
            'USING|UTC_TMESTAMP|VALUES|VARCHAR|WHEN|WHERE|WINDOW|WITH'
    );

    var builtinConstants = (
        'true|false'
    );

    var builtinFunctions = (
        'round|bround|floor|ceil|rand|exp|ln|log10|log2|log|pow|sqrt|bin|hex|unhex|'+
        'conv|abs|pmod|sin|asin|cos|acos|tan|atan|degrees|radians|positive|negative|'+
        'sign|e|pi|factorial|cbrt|shiftleft|shiftright|shiftrightunsigned|greatest|least|width_bucket|'+
        'size|map_keys|map_values|array_contains|sort_array|binary|cast|'+
        'from_unixtime|unix_timestamp|unix_timestamp|unix_timestamp|to_date|'+
        'year|quarter|month|day|hour|minute|second|weekofyear|extract|datediff|'+
        'date_add|date_sub|from_utc_timestamp|to_utc_timestamp|current_date|'+
        'current_timestamp|add_months|last_day|next_day|trunc|months_between|date_format|'+
        'ascii|base64|character_length|chr|concat|context_ngrams|concat_ws|concat_ws|'+
        'decode|elt|encode|field|find_in_set|format_number|get_json_object|in_file|instr|'+
        'length|locate|lower|lpad|ltrim|ngrams|octet_length|parse_url|printf|'+
        'regexp_extract|regexp_replace|repeat|replace|reverse|rpad|rtrim|sentences|'+
        'space|split|str_to_map|substr|substr|substring_index|translate|trim|unbase64|'+
        'upper|initcap|levenshtein|soundex|'+
        'hash|current_user|logged_in_user|current_database|md5|sha1|sha|crc32|sha2|aes_encrypt|aes_decrypt|version|'+
        'count|sum|avg|min|max|variance|var_samp|stddev_pop|stddev_samp|covar_pop|'+
        'covar_samp|corr|percentile|percentile|percentile_approx|percentile_approx|'+
        'regr_avgx|regr_avgy|regr_count|regr_intercept|regr_r2|regr_slope|regr_sxx|'+
        'regr_sxy|regr_syy|histogram_numeric|collect_set|collect_list|ntile'
    );

    var dataTypes = (
        'TINYINT|SMALLINT|INT|BIGINT|BOOLEAN|FLOAT|DOUBLE|DOUBLE PRECISION|STRING|BINARY|TIMESTAMP|DECIMAL|DECIMAL|DATE|VARCHAR|CHAR'
    );

    var keywordMapper = this.createKeywordMapper({
        'support.function': builtinFunctions,
        'keyword': keywords,
        'constant.language': builtinConstants,
        'storage.type': dataTypes
    }, 'identifier', true);

    this.$rules = {
        'start' : [ {
            token : 'comment',
            regex : '--.*$'
        },  {
            token : 'comment',
            start : '/\\*',
            end : '\\*/'
        }, {
            token : 'string',           // ' string
            regex : '".*?"'
        }, {
            token : 'string',           // ' string
            regex : '\'.*?\''
        }, {
            token : 'string',           // ` string (apache drill)
            regex : '`.*?`'
        }, {
            token : 'constant.numeric', // float
            regex : '[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b'
        }, {
            token : keywordMapper,
            regex : '[a-zA-Z_$][a-zA-Z0-9_$]*\\b'
        }, {
            token : 'keyword.operator',
            regex : '\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|='
        }, {
            token : 'paren.lparen',
            regex : '[\\(]'
        }, {
            token : 'paren.rparen',
            regex : '[\\)]'
        }, {
            token : 'text',
            regex : '\\s+'
        } ]
    };
    this.normalizeRules();

    this.$id = 'ace/mode/hql';
};

oop.inherits(HqlHighlightRules, TextHighlightRules);

exports.HqlHighlightRules = HqlHighlightRules;
});
