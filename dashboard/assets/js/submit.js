$('#generalSubmitBtn').on('click', function () {

    console.log('clicky');

    let guildPrefixVal = $('#guildPrefix').val();
    let userPrefixVal = $('#userPrefix').val();

    // fetch('https://127.0.0.1/formUpdate', {
    
    console.log(`${url}/formUpdate`)

    fetch(`${url}/formUpdate`, {
        method: "POST",
        body: JSON.stringify({
            'userID': dbUser.id,
            'serverID': dbGuild.id,
            'serverPrefix': guildPrefixVal,
            'userPrefix': userPrefixVal
        }),
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

});