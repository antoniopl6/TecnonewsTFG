//This file contains all the speech that Alexa says to the user based on the intention. 
//It is posible to add several languages to the skill and the code will chose the one that the user has configured in his device.

module.exports = {
    es: {
        translation: {
            WELCOME_MSG: `Bienvenido a Tecnonews {{user}}! `,
            WELCOME_MSG_WO_NAME: `Bienvenido a Tecnonews! `,
            WELCOME_BACK_MSG: 'Bienvenido de vuelta a <lang xml:lang="en-US">Tecnonews</lang>, {{user}}. ',
            NO_PERMISSIONS: 'Bienvenido a Tecnonews! Puedes seguir utilizando esta skill y escuchar las noticias mas recientes, pero para ofrecerte respuestas personalizadas Tecnonews necesita acceso a tu nombre completo y a la personalización de perfil. Por favor, ve a la pantalla de inicio en tu aplicación Alexa y otorga los permisos.',
            PERMISSIONS: 'Para ofrecerte respuestas personalizadas Tecnonews necesita acceso a tu nombre completo y a la personalización de perfil. Por favor, ve a la pantalla de inicio en tu aplicación Alexa y otorga los permisos.',
            
            INTRO: 'Va a escuchar una serie de noticias, puedes pasarlas diciendo pasa o dejar de escucharlas diciendo para. También puedes escuchar por completo una noticia diciendo: Alexa, abre la noticia. ',
            INTRO_TAG: 'Va a escuchar una serie de noticias sobre {{tag}}, puedes pasarlas diciendo pasa o dejar de escucharlas diciendo para. También puedes escuchar por completo una noticia diciendo: Alexa, abre la noticia. ',
            MISSING_DATA: 'Parece que aun no hay información suficiente para recomendarte noticias, puedes probar a escuchar las noticias más recientes diciendo: Alexa, dame las noticias más recientes. ',
            POST_SAY_INTRO_MSG_RECOMMENDATIONS: `Parece que hay noticias que pueden ser de tu interès, puedes escucharlas o si prefieres, puedes oir las noticias más recientes. `,
            POST_SAY_INTRO_MSG: `Hay nuevas noticias en <lang xml:lang="en-US">Tecnonews</lang>. Puedes escucharlas diciendo: Alexa, dame las noticias mas recientes. `,
            
            NO_NEW_NEWS_AVAIABLE: `Lo sentimos, actualmente no hay noticias disponibles. Prueba a intentarlo más tarde`,
            NO_NEWS_WITH_TAG: 'Lo siento, no se han podido obtener noticias sobre {{tag}}. ',
            NO_REC_NEWS_AVAIABLE: `Parece que aún no hay información suficiente para recomendarte noticias, puedes probar a escuchar las noticias más recientes diciendo: Alexa, dame las noticias más recientes. `,
            
            NEXT_FINISH_LIST_REC: `Has acabado de escuchar la lista de noticias. Puedes probar a escuchar las últimas noticias, o las que podrían ser de tu interès. `,
            NEXT_FINISH_LIST: `Has acabado de escuchar la lista de noticias. Puedes probar a escuchar las últimas noticias, o las de un tema en concreto. `,
            
            STOP_LISTENING_AND_RECOMMEND: `¡Hay nuevas noticias que pueden interesarte!, ¿quieres escuchar las noticias más recientes o las de tu interés?`,
            STOP_LISTENING: 'Saliendo de las noticias, puedes volver a escuchar las noticias más recientes o las de un tema en concreto.',
            
            HELP_MSG_WITH_REC: 'Puedes escuchar noticias más recientes diciendo: Alexa, dame las noticias más recientes. O también escuchar las recomendadas diciendo: Alexa, dame mis noticias recomendadas. ',
            HELP_MSG: 'Puedes oir las nuevas noticias, diciendo Dame las noticias más recientes. O las de un tema en concreto diciendo por ejemplo: Alexa, dame las noticias sobre <lang xml:lang="en-US">software</lang>. ',
            HELP_MSG_OPEN_STATE: 'Puedes volver a escuchar la noticia diciendo: Alexa, repite. O salir de esta diciendo: Cancelar.',
            HELP_MSG_LIST_STATE: 'Puedes seguir escuchando más noticias diciendo: Siguiente. O dejar de escucharlas diciendo: Para. También puedes volver a escuchar la noticia que se has escuchado diciendo: Alexa, repite. Para oír por completo la noticia que acabas de escuchar puedes decir: Alexa, abre la noticia.',
            
            GOODBYE_MSG: 'Hasta pronto! ',
            ERROR_MSG: 'Ha habido un error con tu petición. Por favor, intentalo de nuevo.',
            FALLBACK_MSG: 'Lo siento, no puedo entender lo que acabas de decir. Inténtalo de nuevo. ',
            
            REPROMPT_MSG: 'Si no sabes como continuar intenta pedir ayuda. Si quieres salir de la aplicación solo dí Salir. Qué quieres hacer? ',
            
            DEBUG_INTENT: `Lo siendo, no puedo procesar tu petición en este momento. Para obtener ayuda prueba a decir: Alexa, ayuda.`
            //DEBUG_INTENT: `You just triggered {{intentName}}`
            
        }
    }
}

