const _ = require('lodash');
const dayjs = require('dayjs');

function formatSingleAnswer(answer) {
    const sign = answer.wrong ? "❌" : answer.before ? "↓" : "↑";
    const birthdate = dayjs.isDayjs(answer.birthdate) ? answer.birthdate : dayjs(answer.birthdate);
    return `${answer.name}, ${birthdate.format('LL')}  ${sign}`;
}

// Those are the names of the classes from https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entity-classes-and-properties
// They are always present in a 200 response
function getTypes(entity, outputName) {
    const types = entity['@type'].map(x => {
        // Only interested in the suffix
        return _.last(x.split(":"));
    }).join(", ");
    return `<b>${outputName}:</b> ${types}`;
}

function getDate(entity, fieldName, outputName) {
    if (!(fieldName in entity)) {
        return "";
    }
    return `<br><br><b>${outputName}:</b> ${entity[fieldName]['@value']}`;
}

function getSingleValue(entity, fieldName, outputName) {
    if (!(fieldName in entity)) {
        return "";
    }
    return `<br><br><b>${outputName}:</b> ${entity[fieldName].name[0]['@value']}`;
}

function getMultipleValues(entity, fieldName, outputName) {
    if (!(fieldName in entity)) {
        return "";
    }
    const values = entity[fieldName].map(entry => {
        return entry.name[0]['@value'];
    }).join(", ");
    return `<br><br><b>${outputName}:</b> ${values}`;
}

function getNumberAwards(entity, outputName) {
    if (!('totalNumberOfAwards' in entity)) {
        return "";
    }
    const nb = parseInt(entity.totalNumberOfAwards[0]['@value']);
    if (nb) {
        // Do not display 0 awards
        return `<br><br><b>${outputName}:</b> ${entity.totalNumberOfAwards[0]['@value']}`;
    }
    return "";
}

function getSongs(entity, outputName) {
    if (!('artist:recordedSongVersion' in entity)) {
        return "";
    }
    const songs = entity['artist:recordedSongVersion'].map(version => {
        return version.versionOf[0].name[0]['@value'];
    }).join(", ");
    return `<br><br><b>${outputName}:</b> ${songs}`;
}

function additionalInformation(entity, phrases) {
    // Below are properties that belong to other types. We eill only display the first that we find
    // Standard actor data: https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entertainment_actor
    // Some of the data is truncated, e.g. for actors who played in many movies.
    const castMemberOf = getMultipleValues(entity, "entertainment:castMemberOf", phrases.castMemberOf);
    if (castMemberOf.length > 0) return castMemberOf;

    // Standard director data: https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entertainment_director
    const directorOf = getMultipleValues(entity, "entertainment:directorOf", phrases.directorOf);
    if (directorOf.length > 0) return directorOf;

    // Standard musician data: https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entertainment_musician
    // To get the bands the musician played in:
    // const bands = getMultipleValues(entity, "musician:band", phrases.bands);
    const albums = getMultipleValues(entity, "artist:album", phrases.albums);
    const songs = getSongs(entity, phrases.songs);
    const musicianData = albums + songs;
    if (musicianData.length > 0) return musicianData;

    // Standard author data: https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entertainment_author
    const authorOf = getMultipleValues(entity, "entertainment:authorOf", phrases.authorOf);
    return authorOf;
}

module.exports = {
    startPage: "Welcome to Celebrity Older or Younger. Name a celebrity to start!",
    gameState(answers) {
        return answers.map(formatSingleAnswer).join("<br>");
    },
    entityInfo(entity, phrases) {
        // The built-in slot type we are using is Person. However, Person entities can have multiple types, e.g. Actor, Author, etc.
        // We will only display some of the information to keep the screen from overfilling. 
        const types = getTypes(entity, phrases.type);
        // Standard person data: https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#person
        const birthdate = getDate(entity, "birthdate", phrases.birthdate);
        const birthplace = getSingleValue(entity, "birthplace", phrases.birthplace);
        const deathdate = getDate(entity, "deathdate", phrases.deathdate);
        const deathplace = getSingleValue(entity, "deathplace", phrases.deathplace);
        const occupations = getMultipleValues(entity, "occupation", phrases.occupations);

        // To get the name of the entity:
        // const name = `<br><br><b>${phrases.name}</b>: ${entity.name[0]['@value']}`

        // To get the children of the entity:
        // const children = getMultipleValues(entity, "child", phrases.children);

        const awards = getNumberAwards(entity, phrases.awards);

        const extra = additionalInformation(entity, phrases);
        
        return [types, birthdate, birthplace, deathdate, deathplace,
                occupations, awards, extra].join("");
    }
}