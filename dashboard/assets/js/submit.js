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

$('#createPlaylist').on('click', async function () {

    let prompt = window.prompt("Enter the name for the new playlist!", "Playlist Title");

    if (prompt == null || prompt == "") {
        // txt = "User cancelled the prompt.";
    } else {
        let playlistTitle = prompt;
        let response = await loadingStart($(this), `${url}/formUpdate/createPlaylist`, {
            'key': key,
            'userID': dbUser.id,
            'playlistTitle': playlistTitle
        }, {
            text: 'Create New Playlist',
            validToast: `validToastCreatePlaylist`,
            failedToast: `failedToastCreatePlaylist`
        });

        if (response.status == 200) {

            console.log('trying to refresh')
            window.location.reload();
            return 1;
        }
    }
})

$('#gamesUserSubmitBtn').on('click', async function () {


    let list = $(this).parent().parent().parent().parent().find('ul');

    list = list.children();

    let ping = !$('#pingSwitch').prop("checked");
    let dm = !$('#dmSwitch').prop("checked");
    let newGamesList = [];
    let removeGamesList = [];

    list.each(function () {

        if (!$(this).hasClass('bg-danger'))
            newGamesList.push($(this).attr('gameTitle'));
        else {
            removeGamesList.push($(this).attr('gameTitle'));
            $(this).remove();
        }
    });

    loadingStart($(this), `${url}/formUpdate/userGames`, {
        'key': key,
        'userID': dbUser.id,
        'newGamesList': newGamesList,
        'removeGamesList': removeGamesList,
        'excludePing': ping,
        'excludeDM': dm,
    }, {
        text: `Submit`,
        icon: '<i class="fas fa-music" ></i>'
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
    })


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


$('.addSongBtn').on('click', async function () {

    if ($(this).hasClass('disabled'))
        return 1;

    let inputField = $(this).parent().parent().find('input');
    let songURL = inputField.val();
    let playlistTitle = $(this).attr('playlistTitle');

    // console.log(playlistTitle);
    // console.log(inputField.val());

    let finish = await loadingStart($(this), `${url}/formUpdate/addSong`, {
        'key': key,
        'userID': dbUser.id,
        'playlistTitle': playlistTitle,
        'songURL': songURL
    }, {
        text: `Add Song`,
        icon: '',
        validToast: `validToastAddSong${playlistTitle.split(' ').join('-')}`,
        failedToast: `failedToastAddSong${playlistTitle.split(' ').join('-')}`
    });

    if (finish.status == 200) {

        let playlist = $(`#playlistList${playlistTitle.split(' ').join('-')}`);
        console.log(finish);

        let songTitle = await finish.json().songTitle

        let newListItem = `<li class="list-group-item d-inline songItem border-left-0 border-right-0 border-bottom-0 border-top" songTitle="${songTitle}"> 
        <div class="row">
          <div class="span w-90">${songTitle}</div>
          <button class="songCloseBtn close ml-auto my-auto" type="button" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        </div>
      </li>`

        playlist.append(newListItem);
    }

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
    //console.log(button.attr('id'));


    if (miscellaneous) {
        if (miscellaneous.validToast) {

            if (response.status == 200) {
                $(`#${miscellaneous.validToast}`).toast('show');
            } else {
                $(`#${miscellaneous.failedToast}`).toast('show');
            }
        }
    }
    else if (response.status == 200) {
        button.siblings().children('.validToast').toast('show');
    } else {
        button.siblings().children('.failedToast').toast('show');
    }

    return response;
}

// $(".userGamesList").mouseup(function () {

//     !$('.userGamesList option:selected').remove().appendTo('.userRemoveGamesList');
//     $("option:selected").prop("selected", false)
// });

// $(".userRemoveGamesList").mouseup(function () {

//     !$('.userRemoveGamesList option:selected').remove().appendTo('.userGamesList');
//     $("option:selected").prop("selected", false)
// });

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

$('.closeBtn').mouseup(function () {

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