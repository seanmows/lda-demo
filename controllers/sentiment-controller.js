const common = require('./common');

const { SentimentManager } = require('node-nlp');
const sentiment = new SentimentManager();

exports.getSentiment = (req, res) => {
    return common.controllers(req, res, getDocumentSentiment);
};

/**
 * @typedef {Object} DocumentSentiment
 * @property {array} documents - The sentiment score and ID of each sentence
 * @property {string} errors - The error message if sentiment score could not be computed and ID for those sentences
 */
/**
 * Finds the sentiment for each sentence in a document
 *
 * @param {array} documents - array of sentence id, text and language
 * @param {Object} dict The new words to add to the vocabulary
 * @param {Object} options The options for sentiment analysis
 * @return {DocumentSentiment} - the processed sentiment repsponses
 */
async function getDocumentSentiment(documents, dict, options) {
    let settings = {};
    if (options) {
        settings = options;
    }
    if (settings.sentence) {
        documents = common.getDocumentSentences(documents);
    }
    const responses = [];
    const errors = [];
    for (sentence of documents) {
        let resultText = sentence.text;
        let requestText = sentence.text;
        // filter on search words
        if (settings.search) {
            resultText = findWord(requestText, settings.search);
            if (!resultText) {
                continue;
            } else if (Array.isArray(resultText)) {
                [requestText, resultText] = [resultText, requestText];
            }
        }
        const { score, error } = await getSentenceSentiment(
            requestText,
            sentence.language,
            dict
        );
        if (error) {
            errors.push({ id: sentence.id, msg: error });
        } else {
            responses.push({ id: sentence.id, score, text: resultText });
        }
    }
    return { documents: responses, errors };
}

/**
 * @typedef {Object} SentenceSentiment
 * @property {number} score - The sentiment score
 * @property {string} error - The error message if sentiment score could not be computed
 */
/**
 * Finds the sentiment score of a sentence.
 * @param {string} text - the sentence to be analyzed
 * @param {string} language - the language of the text
 * @param {Object} dict The new words to add to the vocabulary
 * @return {SentenceSentiment} the sentiment score and if text couldn't be analyzed the error msg
 */
async function getSentenceSentiment(text, language = 'en', dict) {
    let score = 0;
    let error = null;
    if (!text) {
        error = 'Empty field';
    }
    // dont repeat work
    let sentimentText = text;
    if (!Array.isArray(text)) {
        sentimentText = common.getContractions(text);
        sentimentText = common.tokenizeSentence(sentimentText);
    }
    const result = await sentiment.process(language, sentimentText, dict);
    score = result.range;
    if (typeof score != 'number') {
        error = 'unable to do sentiment';
    }
    return { score, error };
}

/**
 * Checks to see if sentence contains the given word or words, returns html with highlighted word
 *
 * @param {array} text - the sentence to check
 * @param {string|array} dictionary - the word or array of words to check for
 * @return {string|boolean} the sentence text or false if sentence doesn't contain keywords
 */
function findWord(text, dictionary) {
    if (!Array.isArray(dictionary)) {
        val = text.toLowerCase();
        if (val.indexOf(dictionary) >= 0) {
            const regexp = new RegExp(dictionary, 'gi');
            return text.replace(
                regexp,
                '<span class="highlight">' + dictionary + '</span>'
            );
        } else {
            return false;
        }
    } else {
        newText = common.getContractions(text);
        newText = common.tokenizeSentence(newText);
        const dict = new Set(dictionary);
        for (let val of newText) {
            val = val.toLowerCase();
            if (dict.has(val)) {
                // return tokenize sentence
                return newText;
            }
        }
        return false;
    }
}
