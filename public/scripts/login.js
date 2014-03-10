$(document).ready(function(){
  $('#login-form').ajaxForm({
    success: function(response, status, xhr) {
      if (status == 'success') {
        document.getElementById('signin-status').innerHTML = '<div style="color: #5CB85C;">Success!</div>';
        window.location.href = '/home';
      }
    },
    error: function(e) {
      document.getElementById('signin-status').innerHTML = '<div style="color: #D9534F;">Login Failed</div>';
    }
  });
  $('#user-tf').focus();
});