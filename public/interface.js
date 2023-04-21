/* what interface do i need?
welcome instruction
btn for world map

 */

//index page
if (document.getElementById('enterIntroBtn')) {

    document.getElementById('enterIntroBtn').addEventListener('click', function () {

        let introDiv = document.getElementById("intro");
        introDiv.style.display = "none";

        let quoteDiv = document.getElementById("quote");
        quoteDiv.style.display = 'block';

    });
}
if (document.getElementById('enterInstructionBtn')) {


    document.getElementById('enterInstructionBtn').addEventListener('click', function () {

        console.log('heading to instruction page');

        let quoteDiv = document.getElementById("quote");
        quoteDiv.style.display = 'none';

        let instructionDiv = document.getElementById('instruction');
        instructionDiv.style.display = 'block';

    });

}

if (document.getElementById('enterWorldBtn')) {


    document.getElementById('enterWorldBtn').addEventListener('click', function () {
        console.log('entering world')
        location.href = './book.html';
    })

}


//book page

if (window.location.pathname.endsWith('book.html')) {


    document.getElementById('submitCommentBtn').addEventListener('click', function () {
        let dataJSON = JSON.parse(localStorage.getItem('/comment.json'));
        console.log(dataJSON);

        let comment = document.getElementById("comment");
        let commenter = document.getElementById("commenter");
        let d = new Date
        let dformat = [d.getMonth() + 1,
        d.getDate(),
        d.getFullYear()].join('/') + ' ' +
            [d.getHours(),
            d.getMinutes(),
            d.getSeconds()].join(':');

        let data = {
            "commenter": commenter.value,
            "comment": comment.value,
            "time": dformat,
        }
        console.log(data);

    });
}