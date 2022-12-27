var selectedCategory;
const amountQuestions = '10';
var questionSet;

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
            // list fetched questions
            listQuestions(data.results);
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

const listQuestions = (questions) => {
    // save fetched set of questions to variable
    questionSet = questions;

    $.each(questionSet, function (index, item) {
        // fill aside list
        var questionListButton = $('<button/>',
            {
                text: 'QUESTION #' + (index + 1),
                id: 'question' + index
            });
        $('#questionList').append(questionListButton);
        $('#question' + index).addClass("btn btn-dark");
        //$('#' + item.id).click({ id: item.id }, categoryButtonClicked); // TODO onclick function
        // TEMP - show list of questions
        var questionText = $('<p/>',
            {
                text: (index + 1) + ") " + decodeHTML(item.question)
            });
        $('#questionsContainer').append(questionText);
    });
}

function showHomepage() {
    // show categories selection and hide all other sections
    $('.categories').removeClass('hidden');
    $('.difficulty').addClass('hidden')
    $('.questions').addClass('hidden');
    // TEMP remove all text with questions
    $('#questionsContainer').empty();
    // clear question list
    $('#questionList > button').remove();
}

function decodeHTML(text) {
    // using temp text area to convert special characters
    var textField = document.createElement("textarea");
    textField.innerHTML = text;
    return textField.value;
}