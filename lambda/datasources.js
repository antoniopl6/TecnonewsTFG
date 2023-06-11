/**
 * File containing APL datasources
 * 
**/
const Util = require('./util.js');

//Images used for the skill, stored in S3
var white_background;
var logotecnonews;
var background_green;
var playButtonImage;
var closeButtonImage;

const dataHome = () => { 
    return {
    "headlineTemplateData": {
        "type": "object",
        "objectId": "headlineSample",
        "properties": {
            "backgroundImage": {
                "contentDescription": null,
                "smallSourceUrl": null,
                "largeSourceUrl": null,
                "sources": [
                    {
                        "url": white_background,
                        "size": "large"
                    }
                ]
            },
            "textContent": {
                "primaryText": {
                    "type": "Text",
                    "text": "Bienvenido a Tecnonews!"
                }
            },
            "logoUrl": logotecnonews,
            "hintText": "Puedes probar a escuchar las noticias más recientes..."
        }
    }
};
};

const dataNew = (imgURL, title, subtitle, date) =>  {
    return {
    "simpleTextTemplateData": {
        "type": "object",
        "properties": {
            "backgroundImage": background_green,
            "foregroundImageLocation": "top",
            "foregroundImageSource": imgURL,
            "headerTitle": "",
            "headerSubtitle": "",
            "hintText": "Prueba, \"Alexa, siguiente noticia\" o \"Alexa, abrela\"",
            "headerAttributionImage": logotecnonews,
            "primaryText": subtitle,
            "textAlignment": "start",
            "titleText": title,
            "date": date
        }
    }
    };
};

const dataNewOpenWoVideo = (imgURL, title, fulltext, date) =>  {
    return {
    "simpleTextTemplateData": {
        "type": "object",
        "properties": {
            "backgroundImage": background_green,
            "foregroundImageLocation": "left",
            "foregroundImageSource": imgURL,
            "headerTitle": "",
            "headerSubtitle": "",
            "hintText": "Prueba, \"Alexa, para\"",
            "headerAttributionImage": logotecnonews,
            "primaryText": fulltext,
            "textAlignment": "start",
            "titleText": title,
            "date": date
        }
    }
    };
};
const dataNewOpenVideo = (imgURL, title, fulltext, date, video) =>  {
    return {
    "simpleTextTemplateData": {
        "type": "object",
        "properties": {
            "backgroundImage": background_green,
            "foregroundImageLocation": "left",
            "foregroundImageSource": imgURL,
            "headerTitle": "",
            "headerSubtitle": "",
            "hintText": "Prueba, \"Alexa, para\"",
            "headerAttributionImage": logotecnonews,
            "primaryText": fulltext,
            "textAlignment": "start",
            "titleText": title,
            "videos": [
                video
            ],
            "playButtonImage": playButtonImage,
            "closeButtonImage": closeButtonImage
        }
    }
};
};
//Function to access apl documents, given the datasource and the filename
const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

//Loads media to be used for the APLs
const loadMedia = async () => {
    white_background = await Util.getS3Image("white_background.jpg");
    logotecnonews = await Util.getS3Image("logotecnonews.png");
    background_green = await Util.getS3Image("background-green.png");
    playButtonImage = await Util.getS3Image("play_button.png");
    closeButtonImage = await Util.getS3Image("close_button.png");
    return;
};

module.exports = {
    dataHome,
    createDirectivePayload,
    dataNew,
    dataNewOpenWoVideo,
    dataNewOpenVideo,
    loadMedia
};