var selectedCategory;
const amountQuestions = '10';
var questionSet;
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
            $('#' + item.id).addClass("btn btn-warning");
            $('#' + item.id).click({ id: item.id }, categoryButtonClicked);
        });
    });
    xhr.addEventListener('error', function (e) {
        console.error('XHR error', e);
    });
    xhr.send();
});

function categoryButtonClicked(param) {
    // set selected category
    selectedCategory = param.data.id;
    // show difficulty selection
    $('.categories').addClass('hidden');
    $('.difficulty').removeClass('hidden');
}

function difficultyButtonClicked(difficulty) {
    // load 10 questions from selected category of selected difficulty 
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://opentdb.com/api.php?amount=' + amountQuestions + '&category=' + selectedCategory + '&difficulty=' + difficulty);
    xhr.addEventListener('load', () => {
        const data = JSON.parse(xhr.responseText);
        // TODO - questions only listed now
        if (data.response_code == "0") {
            // hide difficulty and show questions container
            $('.difficulty').addClass("hidden");
            $('.questions').removeClass("hidden");
            // initialize quiz
            initQuiz(data.results);
        } else if (data.response_code == "1") {
            // alert element
            let errorMsg = $('<div id="alertNotEnoughQuestions" class="alert alert-danger"></div>').text('Sorry, not enough questions in selected category and difficulty yet. Please select another difficulty.');
            // pop up alert above difficulty buttons
            $('.difficulty > h1').after(errorMsg);
            $("#alertNotEnoughQuestions").alert();
            // slide up closing animation for alert after 5 sec
            window.setTimeout(function () {
                $("#alertNotEnoughQuestions").slideUp(500, function () {
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

const listQuestions = () => {
    $.each(questionSet, function (index, item) {
        // fill aside list
        var questionListButton = $('<button/>',
            {
                text: 'QUESTION #' + (index + 1),
                id: 'question' + index
            });
        $('#questionList').append(questionListButton);
        $('#question' + index).addClass("btn btn-dark");
        $('#question' + index).click({ goToIdx: index }, jumpToQuestion);
    });
}

const showQuestion = (index) => {
    // enable back all other question buttons and disable button for current question
    $.each(questionSet, function (index, item) {
        $('#questionList > #question' + index).prop('disabled', false);
    });
    $('#questionList > #question' + index).prop('disabled', true);
    // check if it is first or last question
    $('#prevQBtn').prop('disabled', index == 0);
    $('#nextQBtn').prop('disabled', index == questionSet.length - 1);
    // show text of current question
    $('.questionText').text(decodeHTML(questionSet[index].question));
    // set question number in heading
    $('#questionHeading').text('QUESTION #' + (index + 1));
}

const initQuiz = (questions) => {
    // save fetched set of questions to variable
    questionSet = questions;
    // create aside list
    listQuestions();
    // show first question
    currQIndex = 0;
    showQuestion(currQIndex);
}

function questionNavButtonClicked(btnId) {
    // set current index of question according to nav button
    if (btnId == 'nextQBtn') {
        currQIndex++;
    } else if (btnId == 'prevQBtn') {
        currQIndex--;
    }
    // show new question
    showQuestion(currQIndex);
}

function jumpToQuestion(param) {
    // update current index
    currQIndex = param.data.goToIdx;
    // jump to clicked question
    showQuestion(currQIndex);
}

function showHomepage() {
    // show categories selection and hide all other sections
    $('.categories').removeClass('hidden');
    $('.difficulty').addClass('hidden')
    $('.questions').addClass('hidden');
    // clear question list
    $('#questionList > button').remove();
}

function decodeHTML(text) {
    // using temp text area to convert special characters
    var textField = document.createElement("textarea");
    textField.innerHTML = text;
    return textField.value;
}