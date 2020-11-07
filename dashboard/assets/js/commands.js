$('.categories li')[0].classList.add('active');
var lastActive = 'games';


$('#searchBox').on('input', function (e) {

    // console.log('called 1')

    if (e.target.value.length == 0) {
        setCategory({ category: lastActive });
        return 1;
    }

    $(`#noResults`).hide();
    $('.commands li').hide();
    $('.categories li').removeClass('active');

    const options = {
        isCaseSensitive: false,
        findAllMatches: true,
        includeMatches: false,
        includeScore: true,
        useExtendedSearch: false,
        minMatchCharLength: 3,
        shouldSort: true,
        threshold: 0.45,
        location: 0,
        distance: 100,
        keys: [
            "title"
        ]
    }

    let fuse = new Fuse(searchCommands, options)

    let result = fuse.search(e.target.value);

    if (result.length != 0)

        for (foundCommand of result) {

            let exactCommand = $(`#${foundCommand.item.title}`);
            exactCommand.show();
        }
    else
        $(`#noResults`).show();
});



const setCategory = function (category) {

    //console.log('called 2')

    //$('.categories li').removeClass('active');

    $(`#noResults`).hide();

    // const selected = params.category ? $(`#${params.category}`) : $(this);
    // // lastActive = selected.attr('id')
    // // selected.addClass('active');
    // // selected.children().show();

    // const category = selected[0].id

    const catToShow = $(`.commands .${category}`);

    $('.commands li').hide();
    catToShow.show();

    // catToShow[0].style.borderTopWidth = "1px";
}
//setCategory({ category: lastActive });


const setSubsection = function(){



}

$('.categoryItem').on('click', setSubsection);


const setCategory1 = function (params) {

    // console.log('called 3')


    console.log($(this).parent().parent().parent().attr('exactcategory'));


    let exactCategory = $(this).parent().parent().parent().attr('exactcategory');
    setCategory(exactCategory );

    // $('.categories li').removeClass('active');

    // $(`#noResults`).hide();

    // const selected = params.category ? $(`#${params.category}`) : $(this);
    // lastActive = selected.attr('id')
    // selected.addClass('active');
    // selected.children().show();

    // const category = selected[0].id

    // const catToShow = $(`.commands .${category}`);

    // $('.commands li').hide();
    // catToShow.show();

    // // catToShow[0].style.borderTopWidth = "1px";
}
$('.categoryButton').on('click', setCategory1);




$(`#gamesCategoryButton`).click();
setCategory('games')