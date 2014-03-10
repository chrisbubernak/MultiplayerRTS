$(document).ready(function(){
  //redirect to homepage when cancel button is clicked //
	$('#account-form-btn1').click(function(){ window.location.href = '/';});

	$('#account-form').ajaxForm({
		success	: function(responseText, status, xhr){
			if (status == 'success') {
        console.log('signup was successful');
      }
		},
		error : function(xhr, status, error){
			console.log('ERROR: ' + xhr.responseText);
		}
	});
	$('#name-tf').focus();
})