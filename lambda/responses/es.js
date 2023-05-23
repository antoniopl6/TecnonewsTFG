module.exports.phrases = {
    type: "Tipo",
    name: "Nombre",
    birthdate: "Fecha de nacimiento",
    birthplace: "Lugar de nacimiento",
    deathdate: "Fecha de defunción",
    deathplace: "Lugar de defunción",
    occupations: "Profesión",
    children: "Hijos",
    castMemberOf: "Miembro del elenco de",
    awards: "Premios",
    authorOf: "Autor de ",
    directorOf: "Director de",
    bands: "Grupos musicales",
    albums: "Álbumes",
    songs: "Canciones"
}

const baseInfo = 'Comienza por nombrar una celebridad y te preguntaré por una persona que haya nacido antes o después de ella. Intenta acertar tantas veces como puedas, ¡pero recuerda que no puedes decir la misma persona más de una vez por partida!';
const startRequest = 'Para comenzar, menciona el nombre de alguna celebridad.';

module.exports.basic = {
    welcome: `Hola y bienvenido a Celebridad Mayor o Menor, el juego en el que pondrás a prueba tus conocimientos sobre la edad de las celebridades. ${baseInfo} ${startRequest}`,
    goodbye: '¡Hasta luego!',
    help(prevAnswers) {
        if (prevAnswers.length === 0) return `${baseInfo} ${startRequest}`;
        return `${baseInfo} ${requestNextEntity(prevAnswers[prevAnswers.length - 1])}`;
    },
    error: 'Lo siento, no entendí lo que has dicho. Por favor, intenta de nuevo.',
    entityResolution: {
        failed: 'Lo siento, no se quién es esa persona. ¿Puedes mencionar otra celebridad?',
        non200(name) { return `Lo siento, no pude encontrar información sobre ${name}. ¿Puedes mencionar otra celebridad?`},
        missingBirthdate(name) { return `Lo siento, no conozco la fecha de nacimiento de ${name}. ¿Puedes mencionar otra celebridad?`}
    }
}

function requestNextEntity(answer) {
    return `¿Puedes nombrar a alguien que haya nacido ${answer.before ? "antes" : "después"} de ${answer.name}?`;
}

function bornOn(answer) {
    return `${answer.name} nació el ${answer.birthdate.format('LL')}`;
}

function ageComparison(answer, prevAnswer) {
    if (answer.birthdate.isSame(prevAnswer.birthdate, 'day')) {
        return `el mismo día que ${prevAnswer.name}`;
    }
    // Check if we can use 'older' or 'younger' in answers
    // We do not want to use those phrases if the entities are dead to avoid cases
    // like 'Pythagoras is 2533 years older than Brad Pitt'
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = prevAnswer.before ? "mayor" : "menor";
        return `y es ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} que ${prevAnswer.name}`;
    }
    const comp = prevAnswer.before ? "antes" : "después";
    return `${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} que ${prevAnswer.name}`;
}

function ageComparisonWrong(answer, prevAnswer) {
    if (!answer.hasDied && !prevAnswer.hasDied) {
        const comp = answer.before ? "menor" : "mayor";
        return `${answer.name} es ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} que ${prevAnswer.name}`;
    }
    const comp = answer.before ? "después" : "antes";
    return `${answer.name} nació ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} de ${prevAnswer.name}`;
}

function countCelebrities(guesses) {
    if (guesses === 1) return "1 celebridad";
    return `${guesses} celebridades`;
}

function goodbye(guesses) {
    if (guesses < 3) return "¡Más suerte para la próxima!";
    return "¡Bien hecho y vuelve a jugar pronto!";
}

module.exports.mainMessages = {
    firstEntity(answer) {
        return `¡Genial! ${bornOn(answer)}. ${requestNextEntity(answer)}`;
    },
    correctAnswer(answer, prevAnswer) {
        return `¡Correcto! ${bornOn(answer)}, ${ageComparison(answer, prevAnswer)}. ${requestNextEntity(answer)}`;
    },
    wrongAnswer(answer, prevAnswer, guesses) {
        return `Me temo que es incorrecto, ${ageComparisonWrong(answer, prevAnswer)}. Has adivinado ${countCelebrities(guesses)} correctamente. ${goodbye(guesses)}`;
    },
    repeatCelebrity(answer) {
        return `Lo siento, pero ya has dicho antes el nombre de ${answer.name}.  ¿Puedes mencionar otra celebridad?`;
    }
}