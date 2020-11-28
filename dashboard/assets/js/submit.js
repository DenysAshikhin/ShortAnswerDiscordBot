$('#qofSubmitBtn').on('click', async function () {

    if ($(this).hasClass('disabled'))
        return 1;

    console.log('clicky');

    let guildPrefixVal = $('#guildPrefix').val();
    let userPrefixVal = $('#userPrefix').val();

    // fetch('https://127.0.0.1/formUpdate', {

    console.log(`${url}/formUpdate/serverQualityOfLife`)

    loadingStart($(this), `${url}/formUpdate/serverQualityOfLife`, {
        'key': key,
        'userID': dbUser.id,
        'serverID': dbGuild.id,
        'serverPrefix': guildPrefixVal,
        'userPrefix': userPrefixVal
    })
});

$('#qofUserSubmitBtn').on('click', async function () {

    if ($(this).hasClass('disabled'))
        return 1;

    console.log('clicky');

    let defaultPrefixVal = $('#defaultPrefix').val();
    let suggestions = $('#customSwitch1').prop("checked")
    // fetch('https://127.0.0.1/formUpdate', {

    loadingStart($(this), `${url}/formUpdate/userQualityOfLife`, {
        'key': key,
        'userID': dbUser.id,
        'defaultPrefix': defaultPrefixVal,
        'commandSuggestions': suggestions
    })
});

$('#gamesUserSubmitBtn').on('click', async function () {

    if ($(this).hasClass('disabled'))
        return 1;

    console.log('clicky');

    let ping = !$('#pingSwitch').prop("checked");
    let dm = !$('#dmSwitch').prop("checked");
    let removeGames = [];

    $(".userRemoveGamesList option").each(function () {
        removeGames.push($(this).val());
        $(this).remove();
    });
    // fetch('https://127.0.0.1/formUpdate', {

    loadingStart($(this), `${url}/formUpdate/userGames`, {
        'key': key,
        'userID': dbUser.id,
        'excludePing': ping,
        'excludeDM': dm,
        'removeGames': removeGames
    });

});

$('.playlistUpdateSubmitBtn').on('click', function () {

    if ($(this).hasClass('disabled'))
        return 1;


    let list = $(this).parent().parent().parent().find('ul');

    let playlistTitle = list.attr('playlistTitle');

    list = list.children();

    let newSongList = [];
    let removeSongList = [];

    list.each(function () {

        if (!$(this).hasClass('bg-danger'))
            newSongList.push($(this).attr('songTitle'));
        else {
            removeSongList.push($(this).attr('songTitle'));
            $(this).remove();
        }
        // else
        //     
    })


    console.log(playlistTitle);
    // console.log(list)

    loadingStart($(this), `${url}/formUpdate/playlistUpdate`, {
        'key': key,
        'userID': dbUser.id,
        'playlistTitle': playlistTitle,
        'newSongList': newSongList,
        'removeSongList': removeSongList
    }, {
        text: `Update ${playlistTitle} Playlist    `,
        icon: '<i class="fas fa-music" ></i>'
    });

});


$('.addSongBtn').on('click', function () {

    if ($(this).hasClass('disabled'))
        return 1;

    let inputField = $(this).parent().parent().find('input');
    let songURL = inputField.val();
    let playlistTitle = $(this).attr('playlistTitle');

    // console.log(playlistTitle);
    // console.log(inputField.val());

    loadingStart($(this), `${url}/formUpdate/addSong`, {
        'key': key,
        'userID': dbUser.id,
        'playlistTitle': playlistTitle,
        'songURL': songURL
    }, {
        text: `Add Song`,
        icon: ''
    });
});

const loadingStart = async function (button, url, body, miscellaneous) {

    let buttonText = miscellaneous ? miscellaneous.text : '  Submit   ';
    let buttonIcon = miscellaneous ? miscellaneous.icon : '<i class="fas fa-rocket" ></i>';

    // const loadingCircle= '<span id=spinner class="spinner-border text-dark" role="status" aria-hidden="true">  Loading</span>';
    button.text('');
    button.addClass('spinner-border')


    let response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    button.removeClass('spinner-border')
    //button.find('#spinner').remove();
    button.text(buttonText);
    button.append(buttonIcon);


    console.log(response);
    console.log(await response.json());
    console.log(button.attr('id'));


    if (response.status == 200) {
        //$(`.${button.attr('id')}.validToast`).toast('show')
        button.find('.validToast').toast('show')
    } else {
        //$(`.${button.attr('id')}.failedToast`).toast('show')
        button.find('.failedToast').toast('show')
    }
}

$(".userGamesList").mouseup(function () {

    !$('.userGamesList option:selected').remove().appendTo('.userRemoveGamesList');
    $("option:selected").prop("selected", false)
});

$(".userRemoveGamesList").mouseup(function () {

    !$('.userRemoveGamesList option:selected').remove().appendTo('.userGamesList');
    $("option:selected").prop("selected", false)
});

$('#defaultPrefix').on('input', function () {

    if ($(this)[0].checkValidity()) {

        $(this).removeClass('border border-danger')
    } else {
        $(this).addClass('border border-danger');
    }

    console.log(!$('#qofModule form')[0].checkValidity())

    if (!$('#qofModule form')[0].checkValidity())
        $('#qofUserSubmitBtn').addClass('disabled');
    else
        $('#qofUserSubmitBtn').removeClass('disabled');
});

$('#userPrefix').on('input', function () {

    if ($(this)[0].checkValidity()) {

        $(this).removeClass('border border-danger')
    } else {
        $(this).addClass('border border-danger');
    }

    console.log(!$('#qofModule form')[0].checkValidity())

    if (!$('#qofModule form')[0].checkValidity())
        $('#qofSubmitBtn').addClass('disabled');
    else
        $('#qofSubmitBtn').removeClass('disabled');
});

$('#guildPrefix').on('input', function () {

    if ($(this)[0].checkValidity())
        $(this).removeClass('border border-danger')
    else
        $(this).addClass('border border-danger');


    console.log(!$('#qofModule form')[0].checkValidity())

    if (!$('#qofModule form')[0].checkValidity())
        $('#qofSubmitBtn').addClass('disabled');
    else
        $('#qofSubmitBtn').removeClass('disabled');
});

$('.songCloseBtn').mouseup(function () {

    let container = $(this).parent().parent();
    container.toggleClass('bg-danger');
    container.toggleClass('deco-white');
});


const adminLock = function (arr) {

    if (!admin)

        for (let selector of arr) {
            $(selector).attr('disabled', true);
            $(selector).parent().attr('data-placement', 'top');
            $(selector).parent().attr('data-toggle', 'tooltip');
            $(selector).parent().attr('title', 'Only server administrators can modify modify these values.');
        }
}

adminLock(['#guildPrefix']);

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
})


$(window).on("load", function () {

    let repTable = $('#repTable');
    if (repTable[0])
        repTable.DataTable();

    let youtubeTable = $('#youtubeTable');
    if (youtubeTable[0])
        youtubeTable.DataTable();

    let twitchTable = $('#twitchTable');
    if (twitchTable[0])
        twitchTable.DataTable();

    let imageThankerTable = $('#imageThankerTable');
    if (imageThankerTable[0])
        imageThankerTable.DataTable();

    let linkThankerTable = $('#linkThankerTable');
    if (linkThankerTable[0])
        linkThankerTable.DataTable();

    let blacklistRepTableTab = $('#blacklistedRepRolesTable');
    if (blacklistRepTableTab[0])
        blacklistRepTableTab.DataTable();

    let blacklistRepGiveTableTab = $('#blacklistRepGiveTable');
    if (blacklistRepGiveTableTab[0])
        blacklistRepGiveTableTab.DataTable();

    let repRolesPairTableTable = $('#repRolesPairTableTable');
    if (repRolesPairTableTable[0])
        repRolesPairTableTable.DataTable();

    let rocketLeagueTable = $('#rocketLeagueTable');
    if (rocketLeagueTable[0])
        rocketLeagueTable.DataTable();


    let tables = $('.factionTable');

    for (let table of tables) {

        $(`#${table.id}`).DataTable();
    }



    let orderedLists = $('ul');

    for (let list of orderedLists) {

        Sortable.create(list, {
            animation: 150,
            draggable: '.list-group-item',
            handle: '.list-group-item'
        });
    }
})