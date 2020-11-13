$('#qofSubmitBtn').on('click', async function () {

    console.log('clicky');

    let guildPrefixVal = $('#guildPrefix').val();
    let userPrefixVal = $('#userPrefix').val();

    // fetch('https://127.0.0.1/formUpdate', {

    console.log(`${url}/formUpdate`)

    let response = await fetch(`${url}/formUpdate`, {
        method: "POST",
        body: JSON.stringify({
            'key': key,
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

    console.log(response);
    console.log(await response.json());
});