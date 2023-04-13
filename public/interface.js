/* what interface do i need?
welcome instruction
btn for world map

 */
if (document.getElementById('worldmapbtn')) {
    document.getElementById('worldmapbtn').addEventListener('click', function () {
        location.href = "./worldmap.html"
    });
}

if (document.getElementById('enterWorld')) {
    document.getElementById('enterWorld').addEventListener('click', function () {
        console.log('button clicked')
        location.href = './book.html';
    });
}
