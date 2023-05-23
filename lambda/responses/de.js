module.exports.phrases = {
    type: "Typ",
    name: "Name",
    birthdate: "Geburtsdatum",
    birthplace: "Geburtsort",
    deathdate: "Todesdatum",
    deathplace: "Todesort",
    occupations: "Beruf",
    children: "Kinder",
    castMemberOf: "Besetzung in",
    awards: "Preise",
    authorOf: "Autor von",
    directorOf: "Direktor von",
    bands: "Musikgruppe",
    albums: "Alben",
    songs: "Songs"
}

const baseInfo = 'Beginne das Spiel, indem du einen beliebigen Namen sagst und ich werde dich nach einer Person fragen, die vorher oder nachher geboren wurde. Versuche möglichst viele korrekte Antworten zu geben, aber denke daran, dass man jeden Namen nur einmal im Spiel nennen darf!';
const startRequest = 'Um anzufangen, sage mir den Namen einer berühmten Persönlichkeit.';

module.exports.basic = {
    welcome: `Hallo und herzlich willkommen zu dem Spiel Promi älter oder jünger! Bei diesem Spiel kannst du dein Wissen über das Alter von Promis auf die Probe stellen. ${baseInfo} ${startRequest}`,
    goodbye: 'Tschüss!',
    help(prevAnswers) {
        if (prevAnswers.length === 0) return `${baseInfo} ${startRequest}`;
        return `${baseInfo} ${requestNextEntity(prevAnswers[prevAnswers.length - 1])}`;
    },
    error: 'Es tut mir leid, das habe ich leider nicht verstanden. Probiere es bitte erneut.',
    entityResolution: {
        failed: 'Es tut mir leid, ich weiß leider nicht wer das ist. Kannst du mir eine andere berühmte Persönlichkeit sagen?',
        non200(name) { return `Es tut mir leid, ich konnte leider keine Informationen über ${name} finden. Kannst du mir eine andere berühmte Persönlichkeit sagen?`},
        missingBirthdate(name) { return `Es tut mir leid, ich kenne das Geburtsdatum von ${name} leider nicht. Kannst du mir eine andere berühmte Persönlichkeit sagen?`}
    }
}

function requestNextEntity(answer) {
    return `Kannst du mir jemanden Persönlichkeit nennen, die ${answer.before ? "vor" : "nach"} ${answer.name} geboren wurde?`;
}

function bornOn(answer) {
    return `${answer.name} wurde am ${answer.birthdate.format('LL')} geboren`;
}

function ageComparison(answer, prevAnswer) {
    if (answer.birthdate.isSame(prevAnswer.birthdate, 'day')) {
        return `am gleichen Tag ${prevAnswer.name}`;
    }
    // Check if we can use 'older' or 'younger' in answers
    // We do not want to use those phrases if the entities are dead to avoid cases
    // like 'Pythagoras is 2533 years older than Brad Pitt'
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = prevAnswer.before ? "älter" : "jünger";
        return `nud ist ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} als ${prevAnswer.name}`;
    }
    const comp = prevAnswer.before ? "vor" : "nach";
    return `${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} ${prevAnswer.name}`;
}

function ageComparisonWrong(answer, prevAnswer) {
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = answer.before ? "jünger" : "älter";
        return `${answer.name} ist ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} als ${prevAnswer.name}`;
    }
    const comp = answer.before ? "nach" : "vor";
    return `${answer.name} wurde ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} ${prevAnswer.name} geboren`;
}

function countCelebrities(guesses) {
    if (guesses === 1) return "1 Persönlichkeit";
    return `${guesses} Persönlichkeiten`;
}

function goodbye(guesses) {
    if (guesses < 3) return "Beim nächsten Mal klappt es besser!";
    return "Gut gemacht und bis zur nächsten Runde!";
}

module.exports.mainMessages = {
    firstEntity(answer) {
        return `Sehr gut! ${bornOn(answer)}. ${requestNextEntity(answer)}`;
    },
    correctAnswer(answer, prevAnswer) {
        return `Korrekt! ${bornOn(answer)}, ${ageComparison(answer, prevAnswer)}. ${requestNextEntity(answer)}`;
    },
    wrongAnswer(answer, prevAnswer, guesses) {
        return `Das ist leider nicht richtig, ${ageComparisonWrong(answer, prevAnswer)}. Du hast ${countCelebrities(guesses)} richtig beantwortet. ${goodbye(guesses)}`;
    },
    repeatCelebrity(answer) {
        return `Es tut mir leid, aber du hast den Namen von ${answer.name} bereits zuvor genannt. Kannst du mir eine andere berühmte Persönlichkeit sagen?`;
    }
}