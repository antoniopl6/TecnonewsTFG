/**
 * Personalization Utility provides person details and personalized prompts
 **/
'use strict';

const EMPTY = "";
const AWS = require('aws-sdk');
/**
 * 
 * @param handlerInput Get PersonalizedPrompt from Id else default to Empty
 * @returns  Person's name in a response using alexa:name tag
 * example: <alexa:name type="first" personId="amzn1.ask.person.ABCDEF..."/>
 */
const getProfileName  = (handlerInput) => {
    if (getPerson(handlerInput)) {
        const name = getPersonalizedPromptFromId(handlerInput);
        return name;
    }
    return handleFallback();
}
/**
 * Get person from requestEnvelope if personalization enabled.
 * 
 */
const getPerson = (handlerInput) => { return handlerInput.requestEnvelope.context.System.person };

/**
 * Get person Id from requestEnvelope if personalization enabled.
 */
const getPersonId = (handlerInput) => { return getPerson(handlerInput).personId };

/**
 * Handle fallback logic incase person not found.
 */
const handleFallback = () => { return EMPTY }

/**
 * Get personalized greeting from person Id.
 * Refer: https://developer.amazon.com/en-US/docs/alexa/custom-skills/add-personalized-greetings-or-prompts.html
 */
const getPersonalizedPromptFromId = (handlerInput) => {
    return `<alexa:name type="first" personId="${getPersonId(handlerInput)}"/>`
}

//Function to check if the value is in the given list and get the index
function getIndexInList(list, value) {
   return list.findIndex( (listVal) => listVal === value);        
}


/**
 * Given interests list and json file of news returns the recommended list (list of pairs of index and value)
**/
const getRecList = (interests, json, viewedNews) => {
    var recList = [];

    for (let i = 0; i < json.news.length ; i++){
        var interestVal = 0;
        //Check if the new is already seen, if not, we can recommend it if there are some interests related to the new's tags
        
        if (getIndexInList(viewedNews, json.news[i].id) === -1){

            for(let j = 0; j < json.news[i].tags.length; j++){
                const index = interests.findIndex( (listVal) => listVal[0] === json.news[i].tags[j]);  

                if (index !== -1) {
                    interestVal += interests[index][1];
                }
            
            }
            
            if (interestVal !== 0) {
                recList.push([i, interestVal]);
            }
        }
    }
    recList.sort((a, b) => b[1] - a[1]);
    return recList;
}

//Sets interests for the user
const setInterest = (interests, json, idx) => {
    for (let i = 0; i < json.news[idx].tags.length; i++){
            //Search if the interst already exists and get its index, if findIndex returns -1 means this one is not registered yet
            const index = interests.findIndex( (listVal) => listVal[0] === json.news[idx].tags[i]);  
            
            if (index === -1) {
                interests.push([json.news[idx].tags[i], 1]);
            }
            else {
                const val = interests[index][1];
                interests[index] = [interests[index][0], val + 1];
            }

        }
        
        interests.sort((a, b) => b[1] - a[1]);
        return interests;
}

//Set as seen new, so it will not be recommended
const setViewedNew = (viewedNews, json, idx) => {
    const idNew = json.news[idx].id;
    //Check if the new opened is allready on viewedNews
    const index = getIndexInList(viewedNews, idNew);
    if (index === -1){
        viewedNews.push(idNew);
    }
    return viewedNews;
}

//Given his index, delete new from recList
const deleteFromRecList = (recList, json, idx) => {
    const idNew = json.news[idx].id;
    //Check the index where is the new
    const index = recList.findIndex( (recNew) => recNew[0] === idNew );
    recList.pop(index);
    return recList;
}

//Gets news list that have the tag requested
const getTagList = (tag, json) => {
    var tagList = [];
    for (let i = 0; i < json.news.length; i++){
        const index = json.news[i].tags.findIndex( (tagVal) => tagVal.toLowerCase() === tag.toLowerCase());
        if(index !== -1){
            tagList.push(i);
        }
    }
    return tagList;
}
/**
 * Export the list of needed for clients to use
 **/
module.exports = {
    getProfileName,
    getPersonId,
    getPerson,
    getRecList,
    setInterest,
    setViewedNew,
    deleteFromRecList,
    getTagList
};