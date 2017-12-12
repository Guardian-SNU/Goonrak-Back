const send_response = function(response, status, message, data) {
    if (data == null) {
        data = [];
    }

    let success = (status == 200);

    return response.status(status).json({
        'resultcode': status,
        'success': success,
        'message': message,
        'data': data,
    });
};

module.exports = {
    send_response: send_response,
};
