$(function () {
    $('[data-toggle="tooltip"]').tooltip();
})


$( "#commandList" ).hover(
    function() {
      $(this).addClass('shadow-sm').css('cursor', 'pointer'); 
    }, function() {
      $(this).removeClass('shadow-sm');
    }


    // function() {
    //     $(this).addClass('temp').css({'cursor': 'pointer', 'box-shadow': '5px 10px inset'}); 
    //   }, function() {
    //     $(this).removeClass('temp');
    //   }

  );