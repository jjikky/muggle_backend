const i18n = require("i18n-js");
const en = require("./locales/en");
const ko = require("./locales/ko");

module.exports = i18n;
module.exports.initialize = (locale) => {
    i18n.locale = locale;
    i18n.translations = {en, ko};
    i18n.fallbacks = true
}


