const common = require('./common');
const LDA = require('lda-topic-model');

exports.getTopicModels = (req, res) => {
    return common.controllers(req, res, getDocumentTopic);
};

/**
 * @typedef {Object} LdaTopics
 * @property {array} topics - The topics words
 * @property {array} topicDocuments - The sentences associtated with every topic
 * @property {array} vocab - The word counts of all the words
 */
/**
 * Finds the topics and assigns sentences to the topics
 *
 * @param {array} documents - array of sentence id, text and language
 * @param {Object} dict The new stopWords to add to the vocabulary
 * @param {Object} options The options for LDA topic modelling
 * @return {LdaTopics} - the topics, words and sentences
 */
async function getDocumentTopic(documents, dict, options) {
    let settings = {};
    if (options) {
        settings = options;
    }
    settings.numberTopics = settings.numberTopics ? settings.numberTopics : 10;
    settings.sweeps = settings.sweeps ? settings.sweeps : 200;
    if (settings.sentence) {
        documents = common.getDocumentSentences(documents);
    }
    for (const val of documents) {
        if (typeof val.text !== 'string' || val.text === '') {
            val.text = '';
            continue;
        }
        val.text = common.getContractions(val.text);
    }
    settings.language = documents[0].language ? documents[0].language : 'en';
    const lda = new LDA(settings, documents);
    return {
        topics: lda.getTopicWords(),
        topicDocuments: lda.getDocuments(),
        vocab: lda.getVocab()
    };
}
