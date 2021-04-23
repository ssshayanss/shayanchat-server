$('#passwordEyeIcon').click(function (e) { 
    e.preventDefault();
    const password = $('#password')[0];
    if(password.type === 'password') {
        e.target.className = 'fa fa-eye eyeIcon';
        password.type = 'text';
    } else {
        e.target.className = 'fa fa-eye-slash eyeIcon';
        password.type = 'password';
    }
});

$('#confirmPasswordEyeIcon').click(function (e) { 
    e.preventDefault();
    const confirmPassword = $('#confirmPassword')[0];
    if(confirmPassword.type === 'password') {
        e.target.className = 'fa fa-eye eyeIcon';
        confirmPassword.type = 'text';
    } else {
        e.target.className = 'fa fa-eye-slash eyeIcon';
        confirmPassword.type = 'password';
    }
});

function validateReq (data) {
    if(data.password === '') return { success: false, message: 'رمزعبور را وارد کنید' };
    else if(data.password.length<8) return { success: false, message: 'رمزعبور باید بیشتر از 8 کاراکتر باشد' };
    else if(data.confirmPassword === '') return { success: false, message: 'رمزعبور را تکرار کنید' };
    else if(data.confirmPassword !== data.password) return { success: false, message: 'رمزعبور و تکرار آن یکسان نیست' };
    else return { success: true };
};

$('#forgetPasswordForm').submit(function (e) { 
    e.preventDefault();
    const password = $('#password').val().trim();
    const confirmPassword = $('#confirmPassword').val().trim();
    const { success, message } = validateReq({ password, confirmPassword });
    if(!success) {
        $('#alertMessage').attr('class', 'card-wrapper alert alert-danger');
        $('#alertMessage').html(message);    
    } else {
        const token = window.location.pathname.split('/')[2];
        $.ajax({
            type: 'POST',
            method: 'POST',
            url: `/reset-password/${token}`,
            data: JSON.stringify({ password }),
            contentType: 'application/json'
        })
        .done(response => {
            $('#card').attr('class', 'd-none'); 
            $('#alertMessage').attr('class', 'card-wrapper alert alert-success');
            $('#alertMessage').html(response.message);
        })
        .fail(error => {
            if(error.responseJSON.type === 'accessDenied') $('#card').attr('class', 'd-none'); 
            $('#alertMessage').attr('class', 'card-wrapper alert alert-danger');
            $('#alertMessage').html(error.responseJSON.message);
        });
    }
});

$(document).ajaxStart(function(){
    $('#sendButton')[0].disabled = 'disabled';
});

$(document).ajaxStop(function(){
    $('#sendButton')[0].disabled = null;
});