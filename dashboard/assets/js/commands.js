$('.categories li')[0].classList.add('active');
var lastActiveCategory = 'games';
var lastActiveSubCategory = 'Faction';
var lastActiveCategoryElement;
var lastActiveSubCategoryElement;

$('#searchBox').on('input', function (e) {

    // console.log('called 1')

    if (e.target.value.length == 0) {
        setCategory(lastActiveCategory, lastActiveSubCategory);
        if (lastActiveCategoryElement.hasClass('collapsed'))
            lastActiveCategoryElement.click();
        lastActiveSubCategoryElement.click();
        return 1;
    }

    $(`#noResults`).hide();
    $('.commandCard').hide();
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

        for (let i = result.length - 1; i > 0; i--) {
            let foundCommand = result[i];

            let exactCommand = $(`#${foundCommand.item.title}`);
            exactCommand.parent().prepend(exactCommand);
            exactCommand.show();
        }
    else
        $(`#noResults`).show();
});


const setCategory = function (category, subCategory) {

    //console.log('called 2')

    $(`#noResults`).hide();

    const catToShow = $(`.list-group-item.${category}.${subCategory}`);

    $('.commands li').hide();
    catToShow.show();
}


const setSubsection = function () {

    // console.log('clicky setSubSection')
    $(`#noResults`).hide();
    $('.categoryItem').removeClass('active');
    $('.commandCard').hide();
    const selected = $(this);
    selected.addClass('active');

    lastActiveSubCategoryElement = selected;

    const exactCategory = selected.attr('exactcategory');
    lastActiveCategory = exactCategory;
    const subCategory = selected.attr('subCategory').split(' ').join('-pp-');
    lastActiveSubCategory = subCategory;

    const foundCommands = $(`.${exactCategory}.${subCategory}`);
    foundCommands.show();
}
//setSubsection('games', 'Faction');

$('.categoryItem').on('click', setSubsection);


const setCategory1 = function (params) {

    //console.log('called 3')

    let exactCategory = $(this).parent().parent().parent().attr('exactcategory');
    lastActiveCategoryElement = $(this);
    //setCategory(exactCategory);

    let subCategoryList = $(this).parent().parent().next().find('.categoryItem')[0];
    lastActiveSubCategoryElement = subCategoryList;
    subCategoryList.click();
}
$('.categoryButton').on('click', setCategory1);

$(`#gamesCategoryButton`).click();