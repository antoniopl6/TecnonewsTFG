module.exports.phrases = {
    type: "Type",
    name: "Name",
    birthdate: "Birthdate",
    birthplace: "Birthplace",
    deathdate: "Deathdate",
    deathplace: "Deathplace",
    occupations: "Occupations",
    children: "Children",
    castMemberOf: "Cast member of",
    awards: "Awards",
    authorOf: "Author of",
    directorOf: "Director of",
    bands: "Bands",
    albums: "Albums",
    songs: "Songs"
}

const baseInfo = 'Start by naming a celebrity and I will ask for someone born before or after them. Try to give as many correct answers as you can, but remember that you can\'t use the same celebrity more than once in a game!';
const startRequest = 'To get started, please name a celebrity.';

module.exports.basic = {
    welcome: `Hello, and welcome to Celebrity Older or Younger, the game where you put your knowledge of celebrities’ ages to the test! ${baseInfo} ${startRequest}`,
    goodbye: 'Goodbye!',
    help(prevAnswers) {
        if (prevAnswers.length === 0) return `${baseInfo} ${startRequest}`;
        return `${baseInfo} ${requestNextEntity(prevAnswers[prevAnswers.length - 1])}`;
    },
    error: 'Sorry, I had trouble doing what you asked. Please try again.',
    entityResolution: {
        failed: 'Sorry, I\'m not sure who that is. Can you name another celebrity?',
        non200(name) { return `Sorry, I couldn't find information about ${name}. Can you name another celebrity?`},
        missingBirthdate(name) { return `Sorry, I don't know ${name}'s birthdate. Can you name another celebrity?`}
    }
}

function requestNextEntity(answer) {
    return `Can you name someone born ${answer.before ? "before" : "after"} ${answer.name}?`;
}

function bornOn(answer) {
    return `${answer.name} was born on ${answer.birthdate.format('LL')}`;
}

function ageComparison(answer, prevAnswer) {
    if (answer.birthdate.isSame(prevAnswer.birthdate, 'day')) {
        return `the same day as ${prevAnswer.name}`;
    }
    // Check if we can use 'older' or 'younger' in answers
    // We do not want to use those phrases if the entities are dead to avoid cases
    // like 'Pythagoras is 2533 years older than Brad Pitt'
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = prevAnswer.before ? "older" : "younger";
        return `and is ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} than ${prevAnswer.name}`;
    }
    const comp = prevAnswer.before ? "before" : "after";
    return `${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} ${prevAnswer.name}`;
}

function ageComparisonWrong(answer, prevAnswer) {
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = answer.before ? "younger" : "older";
        return `${answer.name} is ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} than ${prevAnswer.name}`;
    }
    const comp = answer.before ? "after" : "before";
    return `${answer.name} was born ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} ${prevAnswer.name}`;
}

function countCelebrities(guesses) {
    if (guesses === 1) return "1 celebrity";
    return `${guesses} celebrities`;
}

function goodbye(guesses) {
    if (guesses < 3) return "Better luck next time!";
    return "Well done and play again soon!";
}

module.exports.mainMessages = {
    firstEntity(answer) {
        return `Great! ${bornOn(answer)}. ${requestNextEntity(answer)}`;
    },
    correctAnswer(answer, prevAnswer) {
        return `Correct! ${bornOn(answer)}, ${ageComparison(answer, prevAnswer)}. ${requestNextEntity(answer)}`;
    },
    wrongAnswer(answer, prevAnswer, guesses) {
        return `I'm afraid that's incorrect, ${ageComparisonWrong(answer, prevAnswer)}. You guessed ${countCelebrities(guesses)} correctly. ${goodbye(guesses)}`;
    },
    repeatCelebrity(answer) {
        return `Sorry, but you have already used ${answer.name}. Can you name another celebrity?`;
    }
}