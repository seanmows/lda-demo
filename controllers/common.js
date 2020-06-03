/**
 * Main controller for POST request to text API
 *
 * @param {request} req - request
 * @param {response} res - respose
 * @param {function} callback - function to run
 * @return {response} - the response
 */
async function controllers(req, res, callback) {
    const body = req.body;
    // for searching
    const query = req.query.keyword;
    if (isBodyCorrect(body)) {
        const { documents, dictionary, options } = body;
        if (query !== undefined) {
            options.search = query;
        }
        const result = await callback(documents, dictionary, options);
        return result.error >= documents.length
            ? res.status(400).json(result)
            : res.status(200).json(result);
    }
    return res.status(400).json({ errors: 'Incomplete Information' });
}

/**
 * Checks to make sure body contains a document paramter
 *
 * @param {*} data the body of the request
 * @return {boolean} returns true if body contains document key
 */
function isBodyCorrect(data) {
    if (data.documents && Array.isArray(data.documents)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Takes a sentence and returns an array of word stems
 *
 * @param {array} wordArray - sentence to stem
 * @param {string} [language='english'] - language to stem in
 * @return {array} array of word stems
 */
function stemming(wordArray, language = 'en') {
    const snowball = require('node-snowball');
    return snowball.stemword(wordArray, language);
}

/**
 * Tokenize sentence into words
 *
 * @param {string} text
 * @return {array} array of words
 */
function tokenizeSentence(text) {
    const { WordPunctTokenizer } = require('natural');
    const tokenizer = new WordPunctTokenizer();
    return tokenizer.tokenize(text);
}

/**
 * Checks to see if keyword is contained within array elements
 *
 * @param {array} arr - an array of strings
 * @param {string} keyword - the keyword to check for
 * @return {boolean} - returns true if the array contains keyword, flase otherwise
 */
function isKeywordInArray(arr, keyword) {
    for (val of arr) {
        if (val.indexOf(keyword) >= 0) {
            return true;
        }
    }
    return false;
}
/**
 * Expands Contractions (couldn't to could not)
 *
 * @param {string} text
 * @return {string} - the expanded text
 */
function getContractions(text) {
    const contractions = require('expand-contractions');
    return contractions.expand(text);
}

/**
 * Splits paragraphs into sentences
 *
 * @param {string} text
 * @return {arrray} - arrray of sentences
 */
function getSentences(text) {
    return text.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g);
}

/**
 * Splits incomming documents into sentences
 *
 * @param {*} documents - array of sentence id, text and language
 * @return {array} - updated array of sentence id, text and language
 */
function getDocumentSentences(documents) {
    for (const val of documents) {
        if (typeof val.text !== 'string' || val.text.trim() === '') {
            val.text = '';
            continue;
        }
        val.text = val.text.trim();
        const sentences = getSentences(val.text);
        if (sentences == null) {
            continue;
        } else {
            sentences.map(val => {
                val = val.trim();
                if (val.length > 1) {
                    return val;
                }
            });
        }
        const id = val.id;
        if (sentences.length > 1) {
            val.text = sentences[0];
            val.id = id + '-0';
        }
        for (let i = 1; i < sentences.length; i++) {
            documents.push({
                id: id + '-' + i.toString(),
                text: sentences[i],
                language: val.language
            });
        }
    }
    return documents;
}

module.exports = {
    controllers,
    stemming,
    tokenizeSentence,
    isKeywordInArray,
    getContractions,
    getSentences,
    getDocumentSentences
};
