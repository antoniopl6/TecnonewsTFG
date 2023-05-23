module.exports.phrases = {
    type: "Type",
    name: "Nom",
    birthdate: "Date de naissance",
    birthplace: "Lieu de naissance",
    deathdate: "Date de décès",
    deathplace: "Lieu de décès",
    occupations: "Professions",
    children: "Enfants",
    castMemberOf: "Membre de la distribution de",
    awards: "Prix",
    authorOf: "Auteur de",
    directorOf: "Réalisateur de",
    bands: "Groupes musicaux",
    albums: "Albums",
    songs: "Chansons"
}

const baseInfo = 'Commencez par donner le nom d’une célébrité et je vous demanderai de nommer une personne née avant ou après elle. Essayez de donner le plus de bonnes réponses possibles mais souvenez vous que vous ne pouvez utiliser une même célébrité qu\'une seule fois par partie!';
const startRequest = 'Pour commencer, veuillez nommer une célébrité.';

module.exports.basic = {
    welcome: `Bonjour, et bienvenu à Célébrité plus âgée ou plus jeune, où nous allons mettre à l’épreuve vos connaissances sur l’âge des célébrités! ${baseInfo} ${startRequest}`,
    goodbye: 'Au revoir!',
    help(prevAnswers) {
        if (prevAnswers.length === 0) return `${baseInfo} ${startRequest}`;
        return `${baseInfo} ${requestNextEntity(prevAnswers[prevAnswers.length - 1])}`;
    },
    error: 'Désolée, j\'ai du mal à comprendre ce que vous me demandez. Veuillez réessayer.',
    entityResolution: {
        failed: 'Désolée, je ne sais pas qui c\'est. Pouvez-vous nommer une autre personne célèbre?',
        non200(name) { return `Désolée, je n'ai pas trouvé d'information sur ${name}. Pouvez-vous nommer une autre personne célèbre?`},
        missingBirthdate(name) { return `Désolée, je ne connais pas la date de naissance de ${name}. Pouvez-vous nommer une autre personne célèbre?`}
    }
}

function requestNextEntity(answer) {
    return `Pouvez-vous nommer une personne née ${answer.before ? "avant" : "après"} ${answer.name}?`;
}

function bornOn(answer) {
    return `La date de naissance de ${answer.name} est le ${answer.birthdate.format('LL')}`;
}

function ageComparison(answer, prevAnswer) {
    if (answer.birthdate.isSame(prevAnswer.birthdate, 'day')) {
        return `le même jour que ${prevAnswer.name}`;
    }
    const comp = prevAnswer.before ? "avant" : "après";
    return `c'est à dire ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} celle de ${prevAnswer.name}`;
}

function ageComparisonWrong(answer, prevAnswer) {
    const comp = answer.before ? "après" : "avant";
    return `La date de naissance de ${answer.name} est ${answer.birthdate.from(prevAnswer.birthdate, true)} ${comp} ${prevAnswer.name}`;
}

function countCelebrities(guesses) {
    if (guesses === 1) return "1 réponse correcte";
    return `${guesses} réponses correctes`;
}

function goodbye(guesses) {
    if (guesses < 3) return "La prochaine fois sera la bonne!";
    return "Bravo, à bientôt pour une autre partie!";
}

module.exports.mainMessages = {
    firstEntity(answer) {
        return `Bravo! ${bornOn(answer)}. ${requestNextEntity(answer)}`;
    },
    correctAnswer(answer, prevAnswer) {
        return `Correct! ${bornOn(answer)}, ${ageComparison(answer, prevAnswer)}. ${requestNextEntity(answer)}`;
    },
    wrongAnswer(answer, prevAnswer, guesses) {
        return `Malheureusement c'est une mauvaise réponse, ${ageComparisonWrong(answer, prevAnswer)}. Vous avez donné ${countCelebrities(guesses)}. ${goodbye(guesses)}`;
    },
    repeatCelebrity(answer) {
        return `Désolée, mais vous avez déjà utilisé ${answer.name}. Pouvez-vous nommer une autre personne célèbre?`;
    }
}