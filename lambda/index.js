/* *
 * Index contains handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * */
const Alexa = require('ask-sdk-core');
// i18n library dependency, we use it below in a localisation interceptor
const i18n = require('i18next');
const AWS = require("aws-sdk");
//DynamoDB adapter
const dynDBAdapter = require('ask-sdk-dynamodb-persistence-adapter');
// We import a language strings object containing all of our strings
const languagesStrings = require('./languages/languagesStrings');
const logic = require('./logic');
const Util = require('./util.js');
const datas = require('./datasources');
const replaceHTML = require('./replaceCharsHTML.js');
//Dynamic url used to retrieve the news from tecnonews
//const urlTecnonews = 'https://www.tecnonews.info/imgfiles/alexa/sample.txt';
const urlTecnonews = 'https://www.tecnonews.info/alexarss.json';
var json;
//APL for multimodals devices
const DOCUMENT_ID_HOME = "Tecnonews";
const DOCUMENT_ID_NEW = "new";
const DOCUMENT_ID_OPEN_NEW_WO_VIDEO = "open_new_wo_video";
const DOCUMENT_ID_OPEN_NEW_VIDEO = "new_and_video_v5";

//Function to handle with special symbols that may cause our skill to fail 
function norm(text) {
    const characterMap = replaceHTML.characterMap();
    const regex = new RegExp(Object.keys(characterMap).join('|'), 'g');
    const regex2 = /&[^;]+;/g;
    //normText = normText.replace(regex, (match) => characterMap[match]);
       return text//.replace(/&/g, "&amp;")
       //.replace(/\\r\\n/g, "<break time=\"0.3s\"/>")
       .replace(regex, (match) => characterMap[match])
       .replace(/\\r\\n/g, "<break time=\"0.15s\"/>")
       .replace(/\\t/g, "")
       .replace(regex2, '');
}
function normNText(text) {
    
       return text.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;")
}
       
       
const PERMISSIONS = ['alexa::profile:name:read', 'alexa::person_id:read']
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_HOME, datas.dataHome());
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        
        const { requestEnvelope, serviceClientFactory } = handlerInput;
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        const consentToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
        if (!consentToken) {
          speakOutput = handlerInput.t('NO_PERMISSIONS');
          return handlerInput.responseBuilder
            .speak(speakOutput)
            .withAskForPermissionsConsentCard(PERMISSIONS)
            .getResponse();
        }
        
        
        const user = await logic.getProfileName(handlerInput);
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        //Welcome speech
        var speakOutput;
        
        if (sessionAttributes.sessionCount === null || !sessionAttributes.sessionCount) {
            if(user.length > 0 && user){
                speakOutput = handlerInput.t('WELCOME_MSG', {user: user});
            }
            else{
                speakOutput = handlerInput.t('WELCOME_MSG_WO_NAME');
                
            }
            //speakOutput += handlerInput.t('PERMISSIONS');
            //return handlerInput.responseBuilder
                //.speak(speakOutput)
                //.withAskForPermissionsConsentCard(PERMISSIONS)
                //.getResponse();
        }
        else {
            if(user.length > 0 && user){
                speakOutput = handlerInput.t('WELCOME_BACK_MSG', {user: user});
            } else {
                speakOutput = handlerInput.t('WELCOME_MSG_WO_NAME');
            }
        }
       

        
        //Instructions for the user
        //if personId is in data base and has info for recommendation return one message, instead other one
        if (sessionAttributes.recList === [] || sessionAttributes.recList.length === 0){
             speakOutput += handlerInput.t('POST_SAY_INTRO_MSG');
        }
        else {
            speakOutput += handlerInput.t('POST_SAY_INTRO_MSG_RECOMMENDATIONS');
        }
    
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
            
    }
};




const NewNewsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'nuevasNoticias';
    },
    handle(handlerInput) {
        var imageUrl = '';
        var title = '';
        var subtitle = '';
        var speakOutput = '';
        var date = '';
        const currIdx = 0;
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const viewedNews = sessionAttributes.viewedNews;
        const lastList = logic.getLastList(json, viewedNews);
        sessionAttributes.lastList = lastList;
        sessionAttributes.currIdx = currIdx;
        
        //If we can retrieve news then say intro speech and the first new
        if (lastList.length > 0){
            const actualNew = json.news[sessionAttributes.lastList[currIdx]];
            speakOutput = handlerInput.t('INTRO');
            sessionAttributes.currList = 'newNews';
            sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, lastList[currIdx]);
            
            title = normNText(actualNew.title);
            subtitle = normNText(actualNew.subtitle);
            imageUrl = actualNew.image;
            date = actualNew.date;
            speakOutput += `${title} <break strength="x-strong"/>`;
            speakOutput += `${subtitle} <break strength="x-strong"/>`;
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_NEW, datas.dataNew(imageUrl, title, subtitle, date));
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
        } else {
            sessionAttributes.currList = '';
            speakOutput += handlerInput.t('NO_NEW_NEWS_AVAIABLE');
        }
        
        sessionAttributes.inOpenState = false;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
                .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const TagNewsIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'abrirCategoria');
    },
    handle(handlerInput) {
        var imageUrl = '';
        var title = '';
        var subtitle = '';
        var date = '';
        var speakOutput = '';
        const tag = Alexa.getSlotValue(handlerInput.requestEnvelope, 'tag');
        const currIdx = 0;
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.currIdx = currIdx;
        
        //if news can be found with the same tag requested then start a list of that tag news
        const tagList = logic.getTagList(tag, json);
        if (tagList.length > 0) {
            sessionAttributes.tagList = tagList;
            sessionAttributes.currList = 'tagNews';
            const actualNew = json.news[tagList[currIdx]];
            sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, tagList[currIdx]);
            title = normNText(actualNew.title);
            subtitle = normNText(actualNew.subtitle);
            imageUrl = actualNew.image;
            date = actualNew.date;
            speakOutput += handlerInput.t('INTRO_TAG', {tag: tag});
            speakOutput += `${title} <break strength="x-strong"/>`;
            speakOutput += `${subtitle} <break strength="x-strong"/>`;
            
            //Set more interest in this tag
            //Search if the interst already exists and get its index, if findIndex returns -1 means this one is not registered yet
            const interestList = sessionAttributes.interests;
            const index = interestList.findIndex( (listVal) => listVal[0] === tag);  
            
            if (index === -1) {
                interestList.push([tag, 1]);
            } else {
                const val = sessionAttributes.interests[index][1];
                interestList[index] = [tag, val + 1];
            }
            interestList.sort((a, b) => b[1] - a[1]);
            sessionAttributes.interests = interestList;
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_NEW, datas.dataNew(imageUrl, title, subtitle, date));
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
        } else {
            sessionAttributes.currList = '';
            speakOutput = handlerInput.t('NO_NEWS_WITH_TAG', {tag: tag});
        }
        
        sessionAttributes.inOpenState = false;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
                .speak(speakOutput)
            .reprompt(speakOutput)
            //.withStandardCard(title, subtitle, imageUrl)
            .getResponse();
    }
};

const RecNewsIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const currIdx = sessionAttributes.currIdx;
        
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'noticiasRecomendadas');
    },
    handle(handlerInput) {
        var imageUrl = '';
        var title = '';
        var subtitle = '';
        var date = '';
        var speakOutput = '';
        const currIdx = 0;
        
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.currIdx = currIdx;
        //speakOutput = languagesStrings.core.recNewsAvaiable(sessionAttributes.recList);
        const recList = sessionAttributes.recList;
        //If there is reccomendated news, then say intro speech and the first new
        if (recList.length > 0){
            speakOutput = handlerInput.t('INTRO');
            var newIdx = sessionAttributes.recList[currIdx][0];
            const actualNew = json.news[newIdx];
            sessionAttributes.currList = 'recNews';
            
            title = normNText(actualNew.title);
            subtitle = normNText(actualNew.subtitle);
            imageUrl = actualNew.image;
            date = actualNew.date
            speakOutput += `${title} <break strength="x-strong"/>`;
            speakOutput += `${subtitle} <break strength="x-strong"/>`;
            
            sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, newIdx);
            //sessionAttributes.recList = logic.getRecList(sessionAttributes.interests, json, sessionAttributes.viewedNews);
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_NEW, datas.dataNew(imageUrl, title, subtitle, date));
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
        }
        else {
            sessionAttributes.currList = '';
            speakOutput += handlerInput.t('NO_REC_NEWS_AVAIABLE');
        }
        
        sessionAttributes.inOpenState = false;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
                .speak(speakOutput)
            .reprompt(speakOutput)
            //.withStandardCard(title, subtitle, imageUrl)
            .getResponse();
    }
};

//Intent to get more info for the current new
const OpenNewIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'openNew'
            && sessionAttributes.currList !== '';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var currIdx = sessionAttributes.currIdx; 
        
        if (sessionAttributes.currList === 'recNews') {
            currIdx = sessionAttributes.recList[currIdx][0];
            //sessionAttributes.recList = logic.deleteFromRecList(sessionAttributes.recList, json, currIdx); //If the new is recommended, delete it from recList
        
        } else if (sessionAttributes.currList === 'tagNews'){
            currIdx = sessionAttributes.tagList[currIdx];
        }
        else if (sessionAttributes.currList === 'newNews'){
            currIdx = sessionAttributes.lastList[currIdx];
        }
        
        
        var speakOutput = '';
        const actualNew = json.news[currIdx];
        const title = normNText(actualNew.title);
        const fulltext = norm(actualNew.fulltext);
        const imageUrl = actualNew.image;
        const date = actualNew.date;
        const video = json.news[currIdx].video;
        speakOutput += `${fulltext} <break strength="x-strong"/>`;
        
        sessionAttributes.interests = logic.setInterest(sessionAttributes.interests, json, currIdx);
        sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, currIdx);
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            var aplDirective;
            if (video !== 'None' && video !== ''){
                aplDirective = datas.createDirectivePayload(DOCUMENT_ID_OPEN_NEW_VIDEO, datas.dataNewOpenVideo(imageUrl, title, fulltext, date, video));
            } else {
                // generate the APL RenderDocument directive that will be returned from your skill
                aplDirective = datas.createDirectivePayload(DOCUMENT_ID_OPEN_NEW_WO_VIDEO, datas.dataNewOpenWoVideo(imageUrl, title, fulltext, date));
            }
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        
        //sessionAttributes.currList = '';
        //sessionAttributes.currIdx = 0;
        sessionAttributes.inOpenState = true;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};






//Intent to skip news
const NextIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NextIntent'
            && sessionAttributes.currList !== '';
    },
    handle(handlerInput) {
        var imageUrl = '';
        var title = '';
        var subtitle = '';
        var date = '';
        var speakOutput = '';
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var currIdx = sessionAttributes.currIdx;
        
        currIdx++;
        if ((sessionAttributes.currList === 'newNews' && currIdx < sessionAttributes.lastList.length)
        || (sessionAttributes.currList === 'recNews' && currIdx < sessionAttributes.recList.length)
        || (sessionAttributes.currList === 'tagNews' && currIdx < sessionAttributes.tagList.length)){
            
            sessionAttributes.currIdx = currIdx;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            if (sessionAttributes.currList === 'recNews') {
                currIdx = sessionAttributes.recList[currIdx][0];
                sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, currIdx);
                
            } else if (sessionAttributes.currList === 'tagNews'){
                currIdx = sessionAttributes.tagList[currIdx];
                sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, currIdx);
            } else if (sessionAttributes.currList === 'newNews'){
                currIdx = sessionAttributes.lastList[currIdx];
                sessionAttributes.viewedNews = logic.setViewedNew(sessionAttributes.viewedNews, json, currIdx);
            }
            
            const actualNew = json.news[currIdx];
            title = normNText(actualNew.title);
            subtitle = normNText(actualNew.subtitle);
            imageUrl = actualNew.image;
            date = actualNew.date;
            speakOutput += `${title} <break strength="x-strong"/>`;
            speakOutput += `${subtitle} <break strength="x-strong"/>`;
            
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                // generate the APL RenderDocument directive that will be returned from your skill
                const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_NEW, datas.dataNew(imageUrl, title, subtitle, date));
                // add the RenderDocument directive to the responseBuilder
                handlerInput.responseBuilder.addDirective(aplDirective);
            }
            
        } else {
            currIdx--;
            const recList = sessionAttributes.recList;
            //If there is reccomendated news, then say intro speech and the first new
            if (recList !== [] || recList.length > 0){
                speakOutput += handlerInput.t('NEXT_FINISH_LIST_REC');
            } else {
                speakOutput += handlerInput.t('NEXT_FINISH_LIST');
            }
        }
        
        sessionAttributes.inOpenState = false;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

//Intent to stop listening news
const StopIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
            ||
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
            && sessionAttributes.currList !== '';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        sessionAttributes.recList = logic.getRecList(sessionAttributes.interests, json, sessionAttributes.viewedNews);
        //var speakOutput = languagesStrings.core.exitAndRecommend(sessionAttributes.recList);
        var speakOutput;
        const recList = sessionAttributes.recList;
        
        //If there is recommended news notify the user
        if (recList === [] || recList.length === 0){
            speakOutput = handlerInput.t('STOP_LISTENING');
        }
        else {
            speakOutput = handlerInput.t('STOP_LISTENING_AND_RECOMMEND');
        }
        
        sessionAttributes.currIdx = 0;
        sessionAttributes.currList = '';
        sessionAttributes.inOpenState = false;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
            // generate the APL RenderDocument directive that will be returned from your skill
            const aplDirective = datas.createDirectivePayload(DOCUMENT_ID_HOME, datas.dataHome());
            // add the RenderDocument directive to the responseBuilder
            handlerInput.responseBuilder.addDirective(aplDirective);
        }
        
        //return LaunchRequestHandler.handle(handlerInput);
        return handlerInput.responseBuilder
          .speak(speakOutput)
          //.reprompt(speakOutput)
          //.withShouldEndSession(null)
            .getResponse();
    }
}

//Intent to repeat new
const RepeatIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent'
            && sessionAttributes.currList !== '';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var currIdx = sessionAttributes.currIdx;
        if (sessionAttributes.currList === 'recNews') {
            currIdx = sessionAttributes.recList[currIdx][0];
        }
        if (sessionAttributes.currList === 'tagNews') {
            currIdx = sessionAttributes.tagList[currIdx];
        }
        if (sessionAttributes.currList === 'newNews') {
            currIdx = sessionAttributes.lastList[currIdx];
        }
        
        var speakOutput = '';
        if (sessionAttributes.inOpenState === false) {
            var title = normNText(json.news[currIdx].title);
            var subtitle = normNText(json.news[currIdx].subtitle);
            speakOutput += `${title} <break strength="x-strong"/>`;
            speakOutput += `${subtitle} <break strength="x-strong"/>`;
        } else {
            var fulltext = norm(json.news[currIdx].fulltext);
            speakOutput += `${fulltext} <break strength="x-strong"/>`;
        }
        
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const recList = sessionAttributes.recList;
        
        var speakOutput;
        
        //Basing on the current status of the user, we can say one help message or another
        if (sessionAttributes.currList === ''){
            if (recList === [] || recList.length === 0) {
                 speakOutput = handlerInput.t('HELP_MSG'); //In case the user has not oppened a list yet and there is no reccomended news
            } else {
                speakOutput = handlerInput.t('HELP_MSG_WITH_REC'); //In case there is recommended news
            }
           
        }
        else {
            if (sessionAttributes.inOpenState === true){
                speakOutput = handlerInput.t('HELP_MSG_OPEN_STATE'); //When the user has opened a new, we notify what he can do
            } else {
                speakOutput = handlerInput.t('HELP_MSG_LIST_STATE'); //In case the user is listening a list of news with no new open
            }
        }


        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
                && sessionAttributes.currList === '';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const speakOutput = handlerInput.t('GOODBYE_MSG');

        return handlerInput.responseBuilder
            .speak(speakOutput)
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
        const speakOutput = handlerInput.t('FALLBACK_MSG');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
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
        const speakOutput = handlerInput.t('REPROMPT_MSG'); 
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
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
        const speakOutput =  handlerInput.t('DEBUG_INTENT');
        //const speakOutput =  handlerInput.t('DEBUG_INTENT', {intentName: intentName});

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
        const speakOutput = handlerInput.t('ERROR_MSG');
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
// This request interceptor will bind a translation function 't' to the handlerInput
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope), //Get the language from the handlerInput to map the correct language in languagesStrings.js
            resources: languagesStrings,
            interpolation: { escapeValue: false, }
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};


const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session?
            await datas.loadMedia();
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            
            console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
            persistentAttributes.currIdx = 0;
            persistentAttributes.currList = '';
            persistentAttributes.tagList = [];
            persistentAttributes.inOpenState = false;
            const interests = persistentAttributes.interests;
            const viewedNews = persistentAttributes.viewedNews;

            if (persistentAttributes.sessionCount === null || !persistentAttributes.sessionCount) { 
                //init values
                persistentAttributes.lastList = logic.getLastList(json, []);
                persistentAttributes.interests = [];
                persistentAttributes.viewedNews = []; 
                persistentAttributes.recList = [];
            }
            else {
                persistentAttributes.recList = logic.getRecList(interests, json, viewedNews)
                persistentAttributes.lastList = logic.getLastList(json, viewedNews);
            }
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
        }
    }
};



const GetJsonFileRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;

        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session?
            //json = await Util.getJsonFromUrl(urlTecnonews);
            const lastDateWeb = await Util.getLastWebUpdate(urlTecnonews);
            const modifiedDateFile = await Util.getLastModifiedDate("news.json");
            //12 hours in miliseconds, so the file in S3 is updated if more than 12 hours have passed
            const hours12 = 432e5;
            
            //if ((lastDateWeb - modifiedDateFile) > hours12) {
            //if ((modifiedDateFile - lastDateWeb) > hours12){
                json = await Util.getJsonFromUrl(urlTecnonews);
                console.log("json index:" + json)
                // In the database, the tags field is stored as a string, so we pass from string to list for each news item
                json = Util.getJsonWTags(json);
                //await Util.putS3Object('news.json', json);
            //}
            //else {
                //json = JSON.parse(await Util.getS3Object("news.json"));
            //}
            
            
            //manual include for testing in template
            //json = require('./template-data.json');
            //json = Util.getJsonWTags(json);
        }
    }
}


const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
            // we make ALL session attributes persistent
            let attributes = {"interests":sessionAttributes.interests, "sessionCount":1, "viewedNews":sessionAttributes.viewedNews};
            console.log('Saving to persistent storage:' + JSON.stringify(attributes));
            attributesManager.setPersistentAttributes(attributes);
            await attributesManager.savePersistentAttributes();
        }
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
        NewNewsIntentHandler,
        TagNewsIntentHandler,
        RecNewsIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        RepeatIntentHandler,
        StopIntentHandler,
        NextIntentHandler,
        OpenNewIntentHandler,
        IntentReflectorHandler
        )
    .addErrorHandlers(
        ErrorHandler
        )
    .addRequestInterceptors(
        LocalisationRequestInterceptor,
        GetJsonFileRequestInterceptor,
        LoadAttributesRequestInterceptor
        )
    .addResponseInterceptors(
        SaveAttributesResponseInterceptor
        )
    .withPersistenceAdapter(
        new dynDBAdapter.DynamoDbPersistenceAdapter({
            tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({apiVersion: 'latest', region: process.env.DYNAMODB_PERSISTENCE_REGION})
        })
    )
    .withCustomUserAgent('tecnonews/v1.0')
    .withApiClient(new Alexa.DefaultApiClient())  
    .lambda();