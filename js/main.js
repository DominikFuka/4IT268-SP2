const AMOUNT_QUESTIONS = '10';
var questionSet;

var selectedCategory;
var selectedDifficulty;
var currQIndex = 0;

$(document).ready(() => {
    // show categories as buttons when site loads
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://opentdb.com/api_category.php');
    xhr.addEventListener('load', () => {
        // get all available categories
        const data = JSON.parse(xhr.responseText);
        // create a button with onClick that returns its id
        $.each(data.trivia_categories, function (index, item) {
            var categoryNameButton = $('<button/>',
                {
                    text: item.name,
                    id: item.id
                });
            $('.categoriesContainer').append(categoryNameButton);
            $('#' + item.id).addClass('btn btn-warning');
            $('#' + item.id).click({ id: item.id }, categoryButtonClicked);
        });
    });
    xhr.addEventListener('error', function (e) {
        console.error('XHR error', e);
    });
    xhr.send();

    // disable homepage btn to show current page
    $('#homepageBtn').prop('disabled', true);
});

const initQuiz = (questions) => {
    // clear quiz questions and question list before generating a new quiz
    $('#questions').empty();
    $('#questionList > button').remove();
    // setup session storage variable to keep track of how many questions were answered and how many correctly
    sessionStorage.setItem('answeredCount', '0');
    sessionStorage.setItem('quizCorrectCount', '0');
    console.log(sessionStorage.getItem('quizCorrectCount'));
    // save fetched set of questions to variable
    questionSet = [...questions];
    // create aside quiz navigation with questions
    createQuizNav();
    // create all questions in HTML
    createQuestions();
    // show first question
    currQIndex = 0;
    showQuestion(currQIndex);
}

const finishQuiz = () => {
    // clear data from result screen
    $('.resultScreen span').empty();
    // generate data in hidden end result screen
    $('#selCat').append($('#' + selectedCategory).text());
    $('#selDiff').append(selectedDifficulty);
    $('#qCount').append(AMOUNT_QUESTIONS);

    $('#corrAnsCount').append(sessionStorage.getItem('quizCorrectCount'));
    $('#incorrAnsCount').append(Number(AMOUNT_QUESTIONS) - Number(sessionStorage.getItem('quizCorrectCount')));
    let quizPercent = 100 * Number(sessionStorage.getItem('quizCorrectCount')) / Number(AMOUNT_QUESTIONS);
    quizPercent = Math.round((quizPercent + Number.EPSILON) * 100) / 100;
    $('#corrAnsPercQuiz').append(quizPercent + ' %');

    let overallPercent = 100 * Number(localStorage.getItem('correctAnsCount')) / (Number(localStorage.getItem('correctAnsCount')) + Number(localStorage.getItem('incorrectAnsCount')));
    overallPercent = Math.round((overallPercent + Number.EPSILON) * 100) / 100;
    $('#corrAnsPercOverall').append(overallPercent + ' %');

    // create button to show result screen in quiz nav above questions
    $('#questionList').prepend('<button type="button" class="btn btn-warning" onclick="showResultScreenBtnClick()">Show results</button>');

    // open modal with congratulations (Bootstrap)
    $('#congratsModal').modal('show');
}

const createQuizNav = () => {
    $.each(questionSet, function (index, item) {
        // fill aside list
        var questionListButton = $('<button/>',
            {
                text: 'QUESTION #' + (index + 1),
                id: 'question' + index
            });
        $('#questionList').append(questionListButton);
        $('#question' + index).addClass('btn btn-dark');
        $('#question' + index).click({ goToIdx: index }, jumpToQuestion);
    });
}

const createQuestions = () => {
    for (let index = 0; index < AMOUNT_QUESTIONS; index++) {
        // append question to quiz section
        $('#questions').append('\
            <section class="questionContainer" id="questionContainer' + index + '">\
                <h1>Question #' + (index + 1) + '</h1>\
                <div class="questionNav">\
                    <button type="button" class="btn btn-secondary btn-prev-q" onclick="prevQBtnClicked(this.id)">&#8592; Previous</button>\
                    <button id="nextQBtn" type="button" class="btn btn-secondary btn-next-q" onclick="nextQBtnClicked(this.id)">Next &#8594;</button>\
                </div>\
                <p class="questionText">' + decodeHTML(questionSet[index].question) + '</p>\
                <form id="answersContainer' + index + '" class="answersContainer" method="post"></form>\
            </section>\
        ');
        // answers form according to type
        if (questionSet[index].type == 'multiple') {
            createMultipleAnswers(index);
        } else if (questionSet[index].type == 'boolean') {
            createBooleanAnswers(index);
        }
    }
}

const showQuestion = (index) => {
    // enable back all other question buttons and disable button for current question and show current question
    $.each(questionSet, function (index, item) {
        $('#questionList > #question' + index).prop('disabled', false);
        $('#questionContainer' + index).addClass('hidden');
    });
    $('#questionList > #question' + index).prop('disabled', true);
    $('#questionContainer' + index).removeClass('hidden');
    // check if it is first or last question to disable nav buttons
    $('.btn-prev-q').prop('disabled', index == 0);
    $('.btn-next-q').prop('disabled', index == questionSet.length - 1);
}

const createMultipleAnswers = (idx) => {
    // get other answers and add correct to them
    let answers = [...questionSet[idx].incorrect_answers];
    answers.push(questionSet[idx].correct_answer);
    // mix them up
    shuffleAnswers(answers);
    // show answers
    $.each(answers, function (index, item) {
        // add Bootstrap structure for each radio answer
        $('#answersContainer' + idx).append('\
            <div class="form-check">\
                <input class="form-check-input" type="radio" name="answerRadio" value="' + item + '" id="ansCont' + idx + 'A' + (index + 1) + '" onchange="checkAnswer(this.value)">\
                <label class="form-check-label" for="ansCont' + idx + 'A' + (index + 1) + '">' + item + '</label>\
            </div>');
    });
}

const createBooleanAnswers = (idx) => {
    // show answers - add Bootstrap structure for with btn-styled radio
    $('#answersContainer' + idx).append('\
        <div class="trueFalseContainer">\
            <div class="form-check">\
                <input class="btn-check" type="radio" name="answerRadio" value="True" id="ansCont' + idx + 'A0" autocomplete="off" onchange="checkAnswer(this.value)">\
                <label class="btn btn-success btn-answer" for="ansCont' + idx + 'A0">TRUE</label>\
            </div>\
            <div class="form-check">\
                <input class="btn-check" type="radio" name="answerRadio" value="False" id="ansCont' + idx + 'A1" autocomplete="off" onchange="checkAnswer(this.value)">\
                <label class="btn btn-danger btn-answer" for="ansCont' + idx + 'A1">FALSE</label>\
            </div>\
        </div>');
}

function checkAnswer(answer) {
    // lock the form so responses can't be changed
    $('#answersContainer' + currQIndex + ' input').prop('disabled', true);
    // check if answer was correct and react accordingly 
    let isAnsCorrect = (answer == decodeHTML(questionSet[currQIndex].correct_answer));
    if (isAnsCorrect) {
        // answer is correct, mark the question in the list
        $('#question' + currQIndex).css('color', 'lightgreen');
        // increase number of correct answers in local storage
        incrCorrectAnsCount();
    } else {
        // answer is wrong, mark the question in the list
        $('#question' + currQIndex).css('color', 'red');
        // increase number of incorrect answers in local storage
        incrIncorrectAnsCount();
    }
    // show popup above answers and hide it shortly after
    ansResultPopup(isAnsCorrect);

    // option to show correct answer for incorrectly answered questions
    if (!isAnsCorrect) {
        createCorrectAnsBtn();
    }

    // increase answered questions count in session storage
    let ansCount = Number(sessionStorage.getItem('answeredCount')) + 1;
    sessionStorage.setItem('answeredCount', ansCount);
    // check if all was answered
    if (sessionStorage.getItem('answeredCount') == AMOUNT_QUESTIONS) {
        finishQuiz();
    }

    // update success ratio
    showQuizSuccessRatio();
}

const showQuizSuccessRatio = () => {
    // calculate success ratio
    let ansCount = Number(sessionStorage.getItem('answeredCount'));
    if (ansCount == 0) {
        // TODO set text to gray color
    } else {
        let ratio = 100 * Number(sessionStorage.getItem('quizCorrectCount')) / ansCount;
        $('#quizSuccessRatio').text(Math.round((ratio + Number.EPSILON) * 100) / 100 + ' % answered correctly');
        // TODO set text color according to score
    }
}

const incrCorrectAnsCount = () => {
    // local storage variable for overall count
    if (localStorage.getItem('correctAnsCount') != null) {
        // variable already exists, increase value
        let count = Number(localStorage.getItem('correctAnsCount')) + 1;
        // set value
        localStorage.setItem('correctAnsCount', count);
    } else {
        localStorage.setItem('correctAnsCount', '1');
    }
    // session storage variable for current quiz - already set to 0 in initQuiz
    let quizCount = Number(sessionStorage.getItem('quizCorrectCount')) + 1;
    sessionStorage.setItem('quizCorrectCount', quizCount);
}

const incrIncorrectAnsCount = () => {
    if (localStorage.getItem('incorrectAnsCount') != null) {
        // variable already exists, increase value
        let count = Number(localStorage.getItem('incorrectAnsCount')) + 1;
        // set value
        localStorage.setItem('incorrectAnsCount', count);
    } else {
        localStorage.setItem('incorrectAnsCount', '1');
    }
}

const ansResultPopup = (result) => {
    // alert div using Bootstrap
    let resultMsg = $('<div class="alert resultPopup"></div>');
    if (result) {
        resultMsg.text('CORRECT!');
        resultMsg.addClass('alert-success');
    } else {
        resultMsg.text('INCORRECT');
        resultMsg.addClass('alert-danger');
    }
    $('#answersContainer' + currQIndex).before(resultMsg);
    $('.resultPopup').alert();
    // slide up closing animation for alert after 1.5 sec
    window.setTimeout(function () {
        $('.resultPopup').slideUp(500, function () {
            $(this).remove();
        });
    }, 1500);
}

const createCorrectAnsBtn = () => {
    // show button for correct answer
    let ansBtn = $('<button id="showAnsBtn' + currQIndex + '" type="button" class="btn btn-info correctAndBtn" onclick="showAnsBtnClick()">Show correct answer</button>')
    // append behind answers
    $('#answersContainer' + currQIndex).after(ansBtn);
}

function jumpToQuestion(param) {
    // update current index
    currQIndex = param.data.goToIdx;
    // jump to clicked question
    showQuestion(currQIndex);
}

const hideCongratsModal = () => {
    $('#congratsModal').modal('hide');
}

/* --- HELPER FUNCTIONS --- */

function decodeHTML(text) {
    // using temp text area to convert special characters
    var textField = document.createElement('textarea');
    textField.innerHTML = text;
    return textField.value;
}

/** Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleAnswers(answerArray) {
    for (let i = answerArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answerArray[i], answerArray[j]] = [answerArray[j], answerArray[i]];
    }
}

/* --- ONCLICK FUNCTIONS --- */

function newQuizSameSettingsBtnClick() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://opentdb.com/api.php?amount=' + AMOUNT_QUESTIONS + '&category=' + selectedCategory + '&difficulty=' + selectedDifficulty);
    xhr.addEventListener('load', () => {
        const data = JSON.parse(xhr.responseText);
        if (data.response_code == '0') {
            // hide result screen and show quiz container
            $('.resultScreen').addClass('hidden');
            $('.quiz').removeClass('hidden');
            // initialize quiz
            initQuiz(data.results);
        }
    });
    xhr.addEventListener('error', function (e) {
        console.error('XHR error', e);
    });
    xhr.send();
}

function hideResultScreen() {
    // hide result screen and go back to quiz
    $('.resultScreen').addClass('hidden');
    $('.quiz').removeClass('hidden');
}

function showResultScreenBtnClick() {
    // hide modal
    hideCongratsModal();
    // show result screen
    $('.quiz').addClass('hidden');
    $('.resultScreen').removeClass('hidden');
}

function showAnsBtnClick() {
    // remove button that was clicked
    $('#showAnsBtn' + currQIndex).remove();
    // create alert div with correct answer
    let correctAnsAlert = $('<div class="alert alert-info correctAnsPopup">Correct answer was: <b>' + decodeHTML(questionSet[currQIndex].correct_answer) + '</b></div>');
    // attach it behind answers
    $('#answersContainer' + currQIndex).after(correctAnsAlert);
}

function homepageBtnClicked() {
    // show categories selection and hide all other sections
    $('.categories').removeClass('hidden');
    $('.difficulty').addClass('hidden')
    $('.quiz').addClass('hidden');
    $('.resultScreen').addClass('hidden');
    // disable homepage btn to mark current page
    $('#homepageBtn').prop('disabled', true);
}

function prevQBtnClicked(btnId) {
    // set current index of question according to nav button
    currQIndex--;
    // show new question
    showQuestion(currQIndex);
}

function nextQBtnClicked(btnId) {
    // set current index of question according to nav button
    currQIndex++;
    // show new question
    showQuestion(currQIndex);
}

function categoryButtonClicked(param) {
    // set selected category
    selectedCategory = param.data.id;
    // show difficulty selection
    $('.categories').addClass('hidden');
    $('.difficulty').removeClass('hidden');
    // enable homepage btn since homepage is no longer current visible page
    $('#homepageBtn').prop('disabled', false);
}

function difficultyButtonClicked(difficulty) {
    // set selected difficulty for result screen
    selectedDifficulty = difficulty;
    // load questions from selected category of selected difficulty 
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://opentdb.com/api.php?amount=' + AMOUNT_QUESTIONS + '&category=' + selectedCategory + '&difficulty=' + difficulty);
    xhr.addEventListener('load', () => {
        const data = JSON.parse(xhr.responseText);
        if (data.response_code == '0') {
            // hide difficulty and show quiz container
            $('.difficulty').addClass('hidden');
            $('.quiz').removeClass('hidden');
            // initialize quiz
            initQuiz(data.results);
        } else if (data.response_code == '1') {
            // alert element
            let errorMsg = $('<div id="alertNotEnoughQuestions" class="alert alert-danger"></div>').text('Sorry, not enough questions in selected category and difficulty yet. Please select another difficulty.');
            // pop up alert above difficulty buttons
            $('.difficulty > h1').after(errorMsg);
            $('#alertNotEnoughQuestions').alert();
            // slide up closing animation for alert after 5 sec
            window.setTimeout(function () {
                $('#alertNotEnoughQuestions').slideUp(500, function () {
                    $(this).remove();
                });
            }, 6000);
        }
    });
    xhr.addEventListener('error', function (e) {
        console.error('XHR error', e);
    });
    xhr.send();
}