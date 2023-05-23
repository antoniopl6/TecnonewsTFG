/* *
 * This sample demonstrates how to use Alexa Entities to retrieve information about resolved entities
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const apl = require('./apl');
const axios = require('axios').default; // HTTP library
const game = require('./gameLogic');
const responses = require('./responses');

function initializeIfNeeded(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    // Initialize the game state if it is a new session
    // The skill has two possible entry points:
    // * LaunchRequestHandler for a normal start (Alexa, open celebrity older or younger)
    // * HelpIntentHandler for a help start (Alex, ask celebrity older or younger for help)
    if (!game.hasStarted(handlerInput)) {
        game.initialize(attributes);
        apl.addStartScreen(handlerInput);
        handlerInput.attributesManager.setSessionAttributes(attributes);
    }
    return attributes;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        // Load the language for the current locale
        // Because this can be lost between answers, we need to do it in every hadler
        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        
        initializeIfNeeded(handlerInput);
        
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.welcome)
            .reprompt(responses.voice.basic.welcome)
            .getResponse();
    }
};

/* *
 * Checks if a resolution was matched successfully.
 * */ 
function resolutionMatch(resolution) {
    return resolution.authority === 'AlexaEntities'
        && resolution.status.code === 'ER_SUCCESS_MATCH';
}

/* *
 * Extracts the first resolutions that were matched by Alexa Entities
 * */
function getSlotResolutions(slot) {
    return slot.resolutions
        && slot.resolutions.resolutionsPerAuthority
        && slot.resolutions.resolutionsPerAuthority.find(resolutionMatch);
}

/**
 * Handles the user responses.
 */
const CelebrityIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CelebrityIntent';
    },
    async handle(handlerInput) {
        // Set response language
        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        
        const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
        const slot = Alexa.getSlot(handlerInput.requestEnvelope, 'celebrity');
        const matchedResolutions = getSlotResolutions(slot);

        if (matchedResolutions) {
            // It is possible that one match can generate multiple entities.
            // For example, two people might have the same name.
            // The most popular entity is returned first, so we will use that
            const resolvedEntity = matchedResolutions.values[0].value.id;

            // Make a request to Alexa Entities for additional information about the entity
            const headers = {
                'Authorization': `Bearer ${apiAccessToken}`,
                'Accept-Language': Alexa.getLocale(handlerInput.requestEnvelope)
            };
            const response = await axios.get(resolvedEntity, { headers: headers });

            if (response.status === 200) {
                const entity = response.data;
                // You can check the log to see the response format
                console.log(JSON.stringify(entity));
                const attributes = handlerInput.attributesManager.getSessionAttributes();
                
                if ('name' in entity && 'birthdate' in entity) {
                    
                    // All game logic is separated from handlers for clarity
                    const answer = game.createResponse(entity, attributes);
                    handlerInput.attributesManager.setSessionAttributes(attributes);
                    apl.addGameInformation(handlerInput, attributes, entity);
                    
                    if (answer.shouldContinue) {
                        return handlerInput.responseBuilder
                            .speak(answer.message)
                            .reprompt(answer.message)
                            .getResponse();
                    }
                    return handlerInput.responseBuilder
                        .speak(answer.message)
                        .withShouldEndSession(true)
                        .getResponse();
                }
                
                const name = slot.value;
                // Since we received an entity, we will display the information even if it is missing birthdate
                apl.addGameInformation(handlerInput, attributes, entity);
                
                // Missing birthdate for celebrity
                return handlerInput.responseBuilder
                    .speak(responses.voice.basic.entityResolution.missingBirthdate(name))
                    .reprompt(responses.voice.basic.entityResolution.missingBirthdate(name))
                    .getResponse();
            }
            
            const name = slot.value;
            console.log(`Got response with status ${response.status}`);
            
            // Something went wrong with the request
            return handlerInput.responseBuilder
                .speak(responses.voice.basic.entityResolution.non200(name))
                .reprompt(responses.voice.basic.entityResolution.non200(name))
                .getResponse();
        }

        // The name could not be mapped to an entity
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.entityResolution.failed)
            .reprompt(responses.voice.basic.entityResolution.failed)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        
        const attributes = initializeIfNeeded(handlerInput);
        const previousAnswers = attributes.previousAnswers;
        
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.help(previousAnswers))
            .reprompt(responses.voice.basic.help(previousAnswers))
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.goodbye)
            .withShouldEndSession(true)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.error)
            .reprompt(responses.voice.basic.error)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        handlerInput.attributesManager.setSessionAttributes({});
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        responses.setLocale(Alexa.getLocale(handlerInput.requestEnvelope));
        return handlerInput.responseBuilder
            .speak(responses.voice.basic.error)
            .reprompt(responses.voice.basic.error)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CelebrityIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
//    .addErrorHandlers(
//        ErrorHandler)
    .lambda();