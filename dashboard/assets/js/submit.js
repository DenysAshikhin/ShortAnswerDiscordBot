$('#qofSubmitBtn').on('click', async function () {

    if ($(this).hasClass('disabled'))
        return 1;

    console.log('clicky');

    let guildPrefixVal = $('#guildPrefix').val();
    let userPrefixVal = $('#userPrefix').val();

    // fetch('https://127.0.0.1/formUpdate', {

    console.log(`${url}/formUpdate`)

    loadingStart($(this), `${url}/formUpdate`, {
        'key': key,
        'userID': dbUser.id,
        'serverID': dbGuild.id,
        'serverPrefix': guildPrefixVal,
        'userPrefix': userPrefixVal
    })
});

const loadingStart = async function (button, url, body) {

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
    button.text('  Submit');
    button.prepend('<i class="fas fa-rocket" ></i>');


    console.log(response);
    console.log(await response.json());

    if (response.status == 200) {
        $('#validToast').toast('show')
    } else {
        $('#failedToast').toast('show')
    }
}

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

const adminLock = function (arr) {

    if (!admin)

        for (let selector of arr) {
            console.log($(selector).parent())
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
    
    $('#repTable').DataTable();
    
    let tables = $('.factionTable');

    for (let table of tables) {

        $(`#${table.id}`).DataTable();
    }
})