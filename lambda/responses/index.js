const aplGeneral = require('./apl');
const dayjs = require('dayjs');

dayjs.extend(require('dayjs/plugin/localizedFormat'));

module.exports.apl = {
    gameState: aplGeneral.gameState,
    startPage: null,
    entityInfo: null
}
module.exports.voice = {
    standardInteractions: null,
    mainMessages: null
}

function loadDE() {
    require('dayjs/locale/de');
    dayjs.locale('de');
    return require('./de');
}

function loadFR() {
    require('dayjs/locale/fr');
    dayjs.locale('fr');
    return require('./fr');
}

function loadIT() {
    require('dayjs/locale/it');
    dayjs.locale('it');
    return require('./it');
}

function loadES() {
    require('dayjs/locale/es');
    dayjs.locale('es');
    return require('./es');
}

function loadEN() {
    dayjs.locale('en');
    return require('./en');
}

module.exports.setLocale = locale => {
    var utterances;
    switch (locale.substring(0,2)) {
        case "de": utterances = loadDE(); break;
        case "fr": utterances = loadFR(); break;
        case "it": utterances = loadIT(); break;
        case "es": utterances = loadES(); break;
        default: utterances = loadEN();
    }
    module.exports.voice.basic = utterances.basic;
    module.exports.voice.mainMessages = utterances.mainMessages;
    module.exports.apl.startPage = utterances.basic.welcome;
    module.exports.apl.entityInfo = entity => aplGeneral.entityInfo(entity, utterances.phrases)
}