/* what interface do i need?
welcome instruction
btn for world map

 */


if (document.getElementById('enterWorldBtn')) {
    document.getElementById('enterWorldBtn').addEventListener('click', function () {
        console.log('button clicked')
        location.href = './book.html';
    });
}
