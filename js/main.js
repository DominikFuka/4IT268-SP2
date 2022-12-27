var selectedCategory;
const amountQuestions = '10';

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

    // skryti 
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
                $("#alertNotEnoughQuestions").slideUp(500, function() {
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
    console.log(questions);
    $.each(questions, function (index, item) {
        var questionText = $('<p/>',
            {
                text: index + 1 + ") " + decodeHTML(item.question)
            });
        $('#questionsContainer').append(questionText);
    });
}

function showHomepage() {
    $('.categories').removeClass('hidden');
    $('.difficulty').addClass('hidden')
    $('.questions').addClass('hidden');
    $('#questionsContainer').empty();
}

function decodeHTML(text) {
    var textField = document.createElement("textarea");
    textField.innerHTML = text;
    return textField.value;
}