# Build An Alexa Entities Skill
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/header._TTH_.png" />

## Customize the Skill to be Yours

At this point, you should have a working copy of our Celebrity Older or Younger skill.  In order to make it your own, you will need to customize it with data and responses that you create.  Here are the things you will need to change:

1.  **Request different celebrity categories** Rather than asking for any celebrity, you might want to ask for a famous Actor, Director, Musician, or Author. To check if the answer is the correct type, you can use the following function to extract the types from an entity:
    ```js
    function extractTypes(entity) {
        return entity['@type'].map(x => {
            // Only interested in the suffix
            return _.last(x.split(":"));
        });
    }
    ```
    The output can look like: `["Person", "Actor", "Director"]`. They are not changed between different languages, so you can expect the same results for all locales. You can then go to `lambda/gameLogic.js` and add make the following changes:

    1. Create a function `getNextType` that randomly returns one element of `["Actor", "Director", "Musician", "Author"]`.
    2. In the function `toAnswerFormat` add a `nextType` parameter to the result object, with value from the `getNextType` function.
    3. In the exported function (`createResponse`), after constructing the previous answer, check if the new answer has the correct type: `extractTypes(entity).includes(prev.nextType)`.
    4. In `lambda/responses/en.js` (and equivalent for all languages you want to support), add a new message for when the type of the entity is incorrect, and change the `requestNextEntity` function to include the type for the next answer.
        
2.  **Introduce a new challenge** API responses are limited to a fixed depth to avoid very large payloads. Because of this, the responses include IDs that can be further queried to obtain more information. To try this, you can add a new challenge to the game after a number of correct guesses from the user: ask for celebrities who have children born before/after the last answer. The birthdates of children are not included in the entity, but we can get them with new API calls. This is how the an entry of the child property looks for `Quincy Jones`:
    ```json
    "child": [
        {
            "@id": "https://ld.amazonalexa.com/entities/v1/FVVpoDR9IqCDSTmaTHceS5",
            "@type": [
                "entertainment:Director",
                "entertainment:Actor",
                "Person",
                "entertainment:Musician",
                "entertainment:Author"
            ],
            "name": [
                {
                "@language": "en",
                "@value": "Rashida Jones"
                }
            ]
    },
        ...
    ]
    ```
    1.  First, we need to extract the IDs of the children of an entity:
    ```js
    function getChildrenIDs(entity) {
        if (!(child in entity)) {
            return [];
        }
        return entity.child.map(entry => {
            return entity["@id"];
        });
    }
    ```
    1.  We can now use the IDs to make new API calls inside `lambda/gameLogic.js#createResponse` (you will also need to pass handlerInput as an argument if using the code below):
    ```js
    const ids = getChildrenIDs(entity);
    if (ids.length === 0) {
        // Entity has no children, either consider this as a wrong answer or ask for another name
        return {
            message: responses.voice.mainMessages.noChildrenFound(answer),
            shouldContinue: true // Or false, depending on how you want to handle this
        }
    }
    for (id of ids) {
        const headers = {
            'Authorization': `Bearer ${Alexa.getApiAccessToken(handlerInput.requestEnvelope)}`,
            'Accept-Language': Alexa.getLocale(handlerInput.requestEnvelope)
        };
        const response = await axios.get(id, { headers: headers });
        if (isCorrectResponse(response, prevAnswer)) { // This is similar to the current checks, the response is also an entity with type Person
            // Create new correct response message and return it
            return {
                message: responses.voice.mainMessages.correctChildFound(answer, response, prev),
                shouldContinue: true
            }
        }
        return {
            message: responses.voice.mainMessages.noCorrectChildFound(answer, prev),
            shouldContinue: false
        }
    }
    ```
    1.  Implement `isCorrectResponse` in `lambda/gameLogic.js` and create the new responses used above (`noChildFound`, `correctChildFound`, `noCorrectChildFound`) in `lambda/responses/en.js` (and equivalent for other languages you want to support).

3. After you're done editing all of the files necessary, as before, make sure to press **Save**, **Deploy**, and navigate back to the **Test** tab to test your changes.
4. **Once you have customized the skill's data, languages and/or sentences, return to the [Amazon Developer Portal](https://developer.amazon.com/alexa/console/ask) and select your skill from the list.**

5.  **Click on "Distribution" in the top navigation to move on to the publishing and certification of your skill.**


[![Next](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/buttons/button_next_publication._TTH_.png)](./submit-for-certification.md)
