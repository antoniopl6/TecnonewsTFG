module.exports.phrases = {
    type: "Tipo",
    name: "Nome",
    birthdate: "Data di nascita",
    birthplace: "Luogo di nascita",
    deathdate: "Data di morte",
    deathplace: "Luogo d morte",
    occupations: "Professioni",
    children: "Figli",
    castMemberOf: "Parte del cast di",
    awards: "Premi",
    authorOf: "Autore di",
    directorOf: "Direttore di",
    bands: "Gruppo musicale",
    albums: "Album",
    songs: "Canzoni"
}

const baseInfo = 'Inizia nominando una celebrità e chiederò qualcuno nato prima o dopo di loro. Cerca di dare il maggior numero di risposte corrette possibile, ma ricorda che non puoi usare la stessa celebrità più di una volta in una partita!';
const startRequest = 'Per iniziare, dimmi il nome di una persona famosa.';

module.exports.basic = {
    welcome: `Benvenuto a Celebrità più vecchia o più giovane, il gioco che metterà alla prova la tua conoscenza dell'età delle persone famose! ${baseInfo} ${startRequest}`,
    goodbye: 'Ciao!',
    help(prevAnswers) {
        if (prevAnswers.length === 0) return `${baseInfo} ${startRequest}`;
        return `${baseInfo} ${requestNextEntity(prevAnswers[prevAnswers.length - 1])}`;
    },
    error: 'Mi dispiace, ma non capisco quello che mi hai chiesto. Riprova di nuovo.',
    entityResolution: {
        failed: 'Mi dispiace ma non so chi sia. Puoi provare con il nome di un\'altra persona famosa?',
        non200(name) { return `Mi dispiace ma non ho trovato informazioni su ${name}. Puoi provare con il nome di un'altra persona famosa?`},
        missingBirthdate(name) { return `Mi dispiace, ma non conosco la data di nascita di ${name}. Puoi provare con il nome di un'altra persona famosa?`}
    }
}

function requestNextEntity(answer) {
    return `Puoi dirmi il nome di qualcuno nato ${answer.before ? "prima" : "dopo"} di ${answer.name}?`;
}

function bornOn(answer) {
    return `La data di nascita di ${answer.name} è ${answer.birthdate.format('LL')}`;
}

function ageComparison(answer, prevAnswer) {
    if (answer.birthdate.isSame(prevAnswer.birthdate, 'day')) {
        return `nello stesso giorno di ${prevAnswer.name}`;
    }
    // Check if we can use 'older' or 'younger' in answers
    // We do not want to use those phrases if the entities are dead to avoid cases
    // like 'Pythagoras is 2533 years older than Brad Pitt'
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = prevAnswer.before ? "vecchia" : "giovane";
        return `. Questa persona è di ${answer.birthdate.from(prevAnswer.birthdate, true)} più ${comp} di ${prevAnswer.name}`;
    }
    const comp = prevAnswer.before ? "prima" : "dopo";
    return `${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} di ${prevAnswer.name}`;
}

function ageComparisonWrong(answer, prevAnswer) {
    // As we do not know the gender of the person, we have to avoid using the name as the subject
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = answer.before ? "giovane" : "vecchia";
        return `Questa persona è ${answer.birthdate.from(prevAnswer.birthdate, true)} più ${comp} di ${prevAnswer.name}`;
    }
    const comp = answer.before ? "dopo" : "prima";
    return `Questa persona è nata ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} di ${prevAnswer.name}`;
}

function countCelebrities(guesses) {
    if (guesses === 1) return "1 persona famosa";
    return `${guesses} persone famose`;
}

function goodbye(guesses) {
    if (guesses < 3) return "Avrai più fortuna la prossima volta! ";
    return "Torna a giocare presto!";
}

module.exports.mainMessages = {
    firstEntity(answer) {
        return `Ottimo! ${bornOn(answer)}. ${requestNextEntity(answer)}`;
    },
    correctAnswer(answer, prevAnswer) {
        return `Corretto! ${bornOn(answer)}, ${ageComparison(answer, prevAnswer)}. ${requestNextEntity(answer)}`;
    },
    wrongAnswer(answer, prevAnswer, guesses) {
        return `Mi dispiace, ma la risposta è sbagliata, ${ageComparisonWrong(answer, prevAnswer)}. Hai indovinato ${countCelebrities(guesses)} correttamente. ${goodbye(guesses)}`;
    },
    repeatCelebrity(answer) {
        return `Mi dispiace ma hai già usato il nome di ${answer.name}. Puoi provare con il nome di un'altra persona famosa?`;
    }
}