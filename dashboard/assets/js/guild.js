$('.tabs a, #sidebarExtension header').on('click', function () {

    $('.tabs a').removeClass('active');
    console.log($(this).attr('id'))
    setModule($(this).attr('id'));
});

const setModule = function (name) {

    console.log(`#${name}Module`)
    $('.module').hide();
    $(`#${name}Module`).show();
    $(`#${name}`).addClass('active');
}

setModule('overview');