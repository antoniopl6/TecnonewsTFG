const _ = require('lodash');
const Alexa = require('ask-sdk-core');
const messages = require('../responses');

const entityDisplay = require('./entityDisplay.json');
const startScreen = require('./startScreen.json');

function isAplSupported(handlerInput) {
    const interfaces = Alexa.getSupportedInterfaces(handlerInput.requestEnvelope);
    const aplInterface = interfaces["Alexa.Presentation.APL"];
    return _.get(aplInterface, 'runtime.maxVersion') >= "1.1";
}

function addAplIfSupported(handlerInput, token, document, data) {
    if (isAplSupported(handlerInput)) {
        handlerInput.responseBuilder
            .addDirective({
                "type": "Alexa.Presentation.APL.RenderDocument",
                "token": token,
                "document": document,
                "datasources": {
                    "data": {
                        "type": "object",
                        "properties": data
                    }
                }
            });
    }
}

module.exports.addStartScreen = (handlerInput) => {
    addAplIfSupported(handlerInput, "START", startScreen, {
        startMessage: messages.apl.startPage,
        locale: Alexa.getLocale(handlerInput.requestEnvelope)
    });
}

module.exports.addGameInformation = (handlerInput, attributes, entity) => {
    addAplIfSupported(handlerInput, "GAME_STATE", entityDisplay, {
        name: entity.name[0]['@value'],
        gameState: messages.apl.gameState(attributes.previousAnswers),
        entityInfo: messages.apl.entityInfo(entity),
        locale: Alexa.getLocale(handlerInput.requestEnvelope)
    })
}