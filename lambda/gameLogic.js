const _ = require('lodash');
const dayjs = require('dayjs');
const responses = require('./responses');

dayjs.extend(require('dayjs/plugin/isSameOrBefore'));
dayjs.extend(require('dayjs/plugin/relativeTime'));

module.exports.initialize = (attributes) => {
    // Will hold data with the following form:
    // {name: string, birthdate: dayjs.Dayjs, hasDied: boolean, before: boolean, wrong: boolean}
    // before: true indicates that we expect the next answer's birthdate to be before the last one
    // wrong: indicates wether the response was wrong; it is used for apl display
    attributes.previousAnswers = [];
}

module.exports.hasStarted = (handlerInput) => {
    // Look for the "previousAnswers" property to check if the game has started
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return "previousAnswers" in attributes;
}

// Returns whether the next birthdate to be requested should be before or after the current one
function requestNextDateBeforeCurrent(birthdate) {
    // We don't want to force players to extreme cases, e.g. having to name younger and younger
    // celebrities, up to the current year.
    // We separate the game into 3 different zones:
    // Safe zone: [1950, 1990], where the game will randomly pick between before or after
    // Danger zones: [1900, 1950] and [1990, 2005], where the game will still choose between before and after with a
    //               probability that pushes the answer to the safe zone
    // No zones: <1900 or >2005. The game will always choose after for <1900 and before for >2005
    if (birthdate.year() < 1900) {
        return false;
    } 
    if (birthdate.year() < 1950) {
        // Go linearly with probability 0 for before at 1900 and 0.5 at 1950
        const p = (birthdate.year() - 1900) / 100;
        return Math.random() < p;
    } 
    if (birthdate.year() < 1990) {
        return Math.random() < 0.5;
    } 
    if (birthdate.year() < 2005) {
        // Go linearly with probability 0.5 for before at 1990 and 1 at 2005
        const p = 0.5 + (birthdate.year() - 1990) / 30;
        return Math.random() < p;
    }
    return true;
}

// Creates an entry for the session attributes
function toAnswerFormat(entity) {
    const birthdate = dayjs(entity.birthdate["@value"]);
    
    // Some older entities might be missing a deathdate for various reasons
    // If the entity was born more than 120 years ago, we can assume that they are not still alive
    // This only affects the way we format the answers, and having hasDied set to true is the safest option
    const hasDied = 'deathdate' in entity || birthdate.year() < 1900;
    
    return {
        name: entity.name[0]['@value'],
        birthdate: birthdate,
        hasDied: hasDied,
        before: requestNextDateBeforeCurrent(birthdate),
        wrong: false // By default we assume the answer is correct
    };
}

function constructPreviousAnswer(previousAnswers) {
    const prev = _.last(previousAnswers);
    // The birthdate is serialized between answers
    prev.birthdate = dayjs(prev.birthdate);
    return prev;
}

/**
 * Creates an answer from the given entity. Expects the entity to have name and birthdate.
 */
module.exports.createResponse = (entity, attributes) => {
    
    const answer = toAnswerFormat(entity);
    // Check if the birthdate is valid for our use case, i.e. contins year
    if (isNaN(answer.birthdate.year())) {
        return {
            message: responses.voice.basic.entityResolution.missingBirthdate(entity.name[0]["@value"]),
            shouldContinue: true
        };
    }
    const previousAnswers = attributes.previousAnswers;

    if (previousAnswers.length === 0) {
        // First answer of this game
        previousAnswers.push(answer);
        return {
            message: responses.voice.mainMessages.firstEntity(answer),
            shouldContinue: true
        };
    }
    
    // Check if the answer was used previously
    for (let previousAnswer of previousAnswers) {
        if (answer.name === previousAnswer.name) {
            return {
                message: responses.voice.mainMessages.repeatCelebrity(answer),
                shouldContinue: true
            }
        }
    }
    
    const prev = constructPreviousAnswer(previousAnswers);
    previousAnswers.push(answer);
    
    // Check if the new entity's birthdate is as requested.
    if ((prev.before && !answer.birthdate.isSameOrBefore(prev.birthdate)) || 
        (!prev.before && !prev.birthdate.isSameOrBefore(answer.birthdate))) {

        answer.wrong = true;
        return {
            message: responses.voice.mainMessages.wrongAnswer(answer, prev, previousAnswers.length - 2),
            shouldContinue: false
        };
    }
    
    return {
        message: responses.voice.mainMessages.correctAnswer(answer, prev),
        shouldContinue: true
    }
}