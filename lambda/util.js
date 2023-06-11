/**
 * Util js provide utilities to access S3 storage and external APIs
 **/
 
const AWS = require('aws-sdk');
var https = require('https');
const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4',
    region: process.env.S3_PERSISTENCE_REGION
});

function getS3PreSignedUrl(s3ObjectKey) {

    const bucketName = process.env.S3_PERSISTENCE_BUCKET;
    const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: s3ObjectKey,
        Expires: 60*1 // the Expires is capped for 1 minute
    });
    console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
    return s3PreSignedUrl;

}

/**
 * Put one object in S3 storage, specifically in the Media folder with text/plain format
 * Input: The key name of the file, The file on text string
 * Output: none
 **/
async function putS3Object(keyName, file)  {
        var params = {
            Bucket : process.env.S3_PERSISTENCE_BUCKET,
            Key : keyName,
            Body : JSON.stringify(file),
            ContentType: "text/plain"
        };
        //resolve the asyncronous process and don't record callbacks (not needed)
        s3SigV4Client.putObject(params).promise(); 
    return;
    
}

/**
 * Get one object from S3 storage
 * Input: The key name of the file in Media folder
 * Output: String from the file
 **/
async function getS3Object(keyName)  {
        var params = {
            Bucket : process.env.S3_PERSISTENCE_BUCKET,
            Key : keyName
        };
        //resolve the asyncronous process and don't record callbacks (not needed)
        const data = await s3SigV4Client.getObject(params).promise();
        return data.Body.toString('utf-8');
    
}

/**
 * Get one image from S3 storage
 * Input: The key name of the file in Media folder
 * Output: Image url
 **/
 
async function getS3Image(keyName)  {
    const bucketName = process.env.S3_PERSISTENCE_BUCKET;
    const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: "Media/" + keyName
    });
    return s3PreSignedUrl;
}

/**
 * Returns the last modified date of a file in S3
 * Input: The key name of the file in Media folder
 * Output: Last modified date
 * Note: The last modification date of an object will be carried out by consulting the headers of the object that is passed as a parameter.
 * The headers of an object in S3 are metadata associated with it.
 * There is a series of metadata that can be useful, these are, among others, the size of the object, its type or the most recent modification date.
 * In this case, it is interesting to consult the latter.
 **/
async function getLastModifiedDate(keyName) {
        var params = {
            Bucket : process.env.S3_PERSISTENCE_BUCKET,
            Key : keyName
        };
        var date;
        await s3SigV4Client.headObject(params, function (error, response) {
        if(error) {
            console.log(error);
        } else {
            date = response.LastModified; //Last modified date
        }
        }).promise();
        return date;
}
function jsonEscape(str)  {
    return str.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t").replace(/""/g, '"');
}

//Deletes html tags and \\n in final of the string to make a valid json
function deleteHTMLTags(jsonString) {
  // Search for HTML tags using a regular expression
  var regex = /<[^>]*>/g;
  
  // Replace HTML tags with an empty string
  var jsonNoHTML = jsonString.replace(regex, '');
  
  //regex = /\\n$/;
  //jsonNoHTML = jsonNoHTML.replace(regex, '');
  const closingBraceIndex = jsonNoHTML.lastIndexOf('}');
  jsonNoHTML = jsonNoHTML.substring(0, closingBraceIndex + 1);
  return jsonNoHTML;
}

//Given url from external API, returns the string txt parsed in a JSON from this API. Otherwise returns an error
const getJsonFromUrl = async (txtUrl) =>  new Promise((resolve, reject) => {
    https.get(txtUrl, (response) => {
        let txtFetch = '';
        response.on('data', chunk => {
            txtFetch += chunk;
        });
        
        //When all the data is fetched return the result parsed with JSON format
        response.on('end', () => {
            //Remove all characters before first {, becouse ebd puts some spaces and new lines before the json of news
            txtFetch = txtFetch.substring(txtFetch.indexOf("{"));
            //parse Json and escape it, so new lines, tabs and returns get ok for json format
            console.log("json cogido:" + deleteHTMLTags(jsonEscape(txtFetch)))
            resolve(JSON.parse(deleteHTMLTags(jsonEscape(txtFetch))));
        });
        
        
    }).on('error', error => {
            reject(error);
    });
    
})

//Given url from external API, returns the last modified date from the head headers
const getLastWebUpdate = async (url) =>  new Promise((resolve, reject) => {
    https.request(url, { method: 'HEAD' }, (response) => {
        resolve(new Date(response.headers["last-modified"]));
    }).on('error', error => {
            reject(error);
    }).end();
})

const getJsonWTags = (json) => {
    const news = json.news;
    news.forEach(newJ => {
        //obtain tags for each new in text format
        const tagsStr = newJ.tags;
        // Convert tags str into list
        const tagsList = tagsStr.split(' ');
        const filteredStrings = tagsList.filter((str) => str !== null && str !== "");
        // Update the tag camp with a list of tags
        newJ.tags = filteredStrings;
    });
    
   return json;
}


module.exports = {
    getS3PreSignedUrl,
    putS3Object,
    getS3Image,
    getS3Object,
    getLastModifiedDate,
    getJsonFromUrl,
    getLastWebUpdate,
    getJsonWTags
};