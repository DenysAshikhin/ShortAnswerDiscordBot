$('#generalSubmitBtn').on('click', function () {

    console.log('clicky');

    let guildPrefix = $('#guildPrefix').val();

    fetch('http://127.0.0.1:34444', {
        method: "POST",
        body: guildPrefix
    });

});