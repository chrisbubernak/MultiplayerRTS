$(document).ready(function(){
  $('#login-form').ajaxForm({
    success: function(response, status, xhr) {
      if (status == 'success') {
        document.getElementById('signin-status').innerHTML = '<div style="color: #5CB85C;">Success!</div>';
        window.location.href = '/lobby';
      }
    },
    error: function(response, status, e) {
      console.log(response)
      document.getElementById('signin-status').innerHTML = '<div style="color: #D9534F;">Login Failed: ' + response.responseText + '</div>';
    }
  });
  $('#user-tf').focus();
});