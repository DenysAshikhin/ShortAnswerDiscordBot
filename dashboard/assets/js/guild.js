$('.tabs a, #sidebarExtension header').on('click', function () {

    $('.tabs a').removeClass('active');

    setModule($(this).attr('id'));

});

const setModule = function (name) {

    $('.module').hide();
    $(`#${name}Module`).show();
    $(`#${name}`).addClass('active');
}

setModule('overview');