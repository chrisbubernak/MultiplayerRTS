$(document).ready(function(){
  $('#login-form').ajaxForm({
    success: function(response, status, xhr) {
      if (status == 'success') {
        window.location.href = '/home';
      }
    },
    error: function(e) {
      console.log('Login Failed');
    }
  });
  $('#user-tf').focus();
});