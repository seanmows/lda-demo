const TOPIC_CONTAINER = document.querySelector("#topicContainer");
const TOPIC_SENTENCE = document.querySelector("#sentenceTop");
const TOPIC_STOPWORDS = document.querySelector("#topicStopWords");
const TOPIC_VOCAB_CONTAINER = document.querySelector("#vocabContainer");
const TOPIC_APPLY_STOPWORDS = document.querySelector("#applyStopWords");
const FILE_SELECTOR = document.getElementById("file-selector");

/**
 *  Select Input File and run topic modelling
 *  @param {array} data - the data values
 */
FILE_SELECTOR.addEventListener("change", (event) => {
  const fileList = event.target.files;
  const reader = new FileReader();
  reader.readAsText(event.target.files[0]);

  reader.addEventListener("load", (event) => {
    const result = JSON.parse(event.target.result);
    getTopics(result);
  });
});

/**
 *  Gathers and process request body for the server
 *  @param {array} data - the data values
 */
function getTopics(data) {
  const payload = {
    documents: data,
    options: {
      numberTopics: 7,
    },
  };
  sendData("topics", payload, receiveTopicModels);
  TOPIC_BUTTON.classList.add("loading");
}

/**
 *  Recieves response from server and displays topic models on frontend
 *
 *  @param {object} response - response from server
 */
function receiveTopicModels(response) {
  const topics = response.topics;
  const documents = response.topicDocuments;
  const vocab = response.vocab;

  displayVocab(vocab, TOPIC_VOCAB_CONTAINER);
  displayTopicTitle(topics, TOPIC_CONTAINER);
  const counts = {};

  for (let i = 0; i < topics.length; i++) {
    documents[i].documents = documents[i].documents.filter(
      (val) => val.score > 0.05
    );

    // finds sentiment
    const documentArray = [];
    documents[i].documents.map((value, index) => {
      documentArray.push({
        id: value.id,
        language: "en",
        text: value.text,
      });
    });
    const data = {
      documents: documentArray,
    };
    sendData("sentiment", data, receiveTopicSentiment);

    // displays topics results
    function receiveTopicSentiment(scores) {
      const sentimentScore = new Map();
      scores.documents.map((value) => {
        if (value.id !== undefined) {
          sentimentScore.set(value.id, value.score);
        }
      });
      documents[i].documents.map((value, index) => {
        const id = value.id;
        value.sentiment = sentimentScore.get(id) ? sentimentScore.get(id) : 0;
        value.id = id.split("-").length > 1 ? id.split("-")[0] : id;
      });
      displayDocument(documents[i].documents, document, i);
    }
  }

  TOPIC_BUTTON.classList.remove("loading");
}

/**
 * Displays topic title dropdowns
 * @param {array} topics - the array of topics
 * @param {element} container - the parent container to dispaly dropdwon in
 */
function displayTopicTitle(topics, container) {
  const formattedTopic = topics.map((value, index) => {
    return formatTitle({
      text: index.toString() + " : " + value.topicText.replace(/[ ,]+/g, ', '),
      id: "topic-" + index.toString(),
    });
  });
  display(container, formattedTopic.join(""));
}

/**
 * List topic documents cards under the respective topics
 * @param {array} topicDocuments - the array of document objects
 * @param {element} elem - the webpage document to use (document or newWindow)
 * @param {number} topicIndex - the topic index
 *
 */
function displayDocument(topicDocuments, elem, topicIndex) {
  const formattedTopicDocuments = topicDocuments.map((value, index) => {
    return formatDocument(value, sentimentIcon(value.sentiment), true);
  });
  const topicID = "#topic-" + topicIndex.toString();
  const SELECTOR = elem.querySelector(topicID);
  display(SELECTOR, formattedTopicDocuments.join(""));
}

/**
 *  Display the word counts and stop word options for the analyzed text
 *  @param {array} vocab - the arrray of vocab objects
 *  @param {element} container - the arrray of vocab object
 */
function displayVocab(vocab, container) {
  const formattedVocab = vocab.map((value) => {
    return formatVocab(value);
  });
  display(container, formattedVocab.join(""));
}

/**
 *  Formats the list items for each vocab word
 *  @param {object} vocab - the vocab object containing the word, count, speceficity, stopword
 *  @return {array} - returns the aray of formatted list items
 */
function formatVocab(vocab) {
  let button = "";
  return `<div class="item">
         <div class="right floated content">
           ${button}
         </div>
         <div class="content">
          <div class="header">
            ${vocab.word}
          </div>
          count: ${
            vocab.count
          }  |  Topic Specificity: ${vocab.specificity.toFixed(3)}
         </div>
         <div class="left floated content">
         </div>
      </div>`;
}

/**
 *  Formats the docuemnts cards for entry into the dom
 *  @param {object} document - the document object containing the id, score, and text
 *  @param {string} icon - the icon tag to insert
 *  @param {boolean} percent - wether to format the score as a percent
 *  @return {array} - returns the aray of formatted docuemnts
 */
function formatDocument(document, icon, percent) {
  let score = document.score;
  if (score === null) {
    score = 0;
  } else if (percent) {
    score = (score * 100).toFixed(2) + "%";
  } else {
    score = score.toFixed(4);
  }
  return `<div class="ui card">
        <div class="content">
          <div class="meta">
            <span>${icon}</span>
            <span>${document.id}</span>
            <span>${score}</span>
          </div>
          <p>${document.text}</p>
        </div>
      </div>`;
}

/**
 *  Formats document titles for entry into the dom
 *  @param {object} document - the object containing the text and id for the titles
 *  @return {array} - returns the aray of formatted titles
 */
function formatTitle(document) {
  return `<div class="title" >
        <i class="dropdown icon"></i>
        <p class="topic-title" ondblclick="this.contentEditable=true;" onblur="this.contentEditable=false;" contenteditable="false">
          ${document.text}
        </p>
      </div>
      <div class="content">
        <div id='meta-${document.id}'></div>
        <div id='${document.id}'></div>
      </div>`;
}

function display(container, value) {
  container.innerHTML = value;
}

function sendData(type, data, callback) {
  const url = "http://localhost:3000/text/v1/";
  const parameters = {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, cors, *same-origin
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow", // manual, *follow, error
    referrer: "no-referrer", // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  };
  fetch(url + type, parameters)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`HTTP Error ${response.status} - ${response.statusText}`);
    })
    .catch((e) => {
      removeLoader();
      display(
        MESSAGE,
        `<i class="close icon"></i> The server is offline.<br> - ${e}`
      );
    })
    .then(callback);
}

function colorValue(value) {
  const hue = (value + 1) * 60;
  const color = `color:hsla(${hue},100%,50%, 1)`;
  return color;
}
/**
 * Gets correct icon and color for cards
 * @param {number} score - the sentiment score
 * @return {html} - the icon html for cards
 */
function sentimentIcon(score) {
  if (score === null) {
    score = 0;
  }
  const color = colorValue(score);
  if (score > 0.05) {
    return `<i style="${color}; font-size: 1.4em " class="smile outline icon"></i>`;
  } else if (score < -0.05) {
    return `<i style="${color}; font-size: 1.4em " class="frown outline icon"></i>`;
  }
  return `<i style="${color}; font-size: 1.4em " class="meh outline icon"></i>`;
}

