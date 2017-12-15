var Botkit = require('botkit');
var validator = require('validator');
var moment = require('moment');
var fs = require('fs');
const token = 'EAAHlZBhj45pIBAJnyL6PjNa7rmZAQbUAEZBQynWtutAFHbRnEwZBJldjSIZA19zHjivZB8ITsgU9dZAe7XASnG3r9ZBOz7RubXmZB6A28qGb9pxXv9iktRXd7iQRkTyXnU2BUCUZAaM8yaZBVtnPZBARyQEMPe38c3UsCBn0nMDik3w8PQZDZD';
var controller = Botkit.facebookbot({
    access_token: token,
    verify_token: 'chat-bot-test',
    receive_via_postback: true,
})

function saveToFile(item) {
    fs.exists('myjsonfile.json', function(exists) {
        if (exists) {
            console.log("yes file exists");
            fs.readFile('myjsonfile.json', function readFileCallback(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    var json = JSON.stringify(item);
                    fs.appendFile('myjsonfile.json', json);
                }
            });
        } else {
            console.log("file not exists")
            var json = JSON.stringify(item);
            fs.writeFile('myjsonfile.json', json);
        }
    });
}

var bot = controller.spawn({});

// if you are already using Express, you can use your own server instance...
// see "Use BotKit with an Express web server"
controller.setupWebserver(2000, function(err, webserver) {
    controller.createWebhookEndpoints(controller.webserver, bot, function() {
        console.log('This bot is online!!!');
    });
});

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function(bot, message) {

    bot.reply(message, 'Welcome to my app!');

});

// user said hello
controller.hears(['^hello', '^hi'], 'message_received', function(bot, message) {
    controller.storage.users.all(function(err, all_user_data) {
        console.dir(all_user_data);
    });
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            var name = user.name;
            bot.reply(message, 'Your name is ' + user.name);
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.addMessage(name + ', I do not know your email ID and DOB yet!')
                    convo.addQuestion(name + ', What is your email Id ?', function(res, convo) {
                        var emailFlag = validator.isEmail(res.text);
                        saveToFile(res);
                        if (emailFlag) {
                            convo.gotoThread('q1')
                        } else {
                            convo.addMessage(name + ', email ID which you have entred is in wrong format.')
                            convo.gotoThread('default')
                        }
                    }, {}, 'default')

                    convo.addQuestion('What is DOB ? example format : mm/dd/yyyy', function(res, convo) {
                        var dateFlag = moment(res.text, 'M/D/YYYY', true).isValid();
                        saveToFile(res);
                        if (dateFlag)
                            convo.gotoThread('end')
                        else {
                            convo.addMessage(name + ', DOB which you have entred is in wrong format.')
                            convo.gotoThread('q1')
                        }
                    }, {}, 'q1')

                    convo.addMessage('Okay thank you very much for the valuable info.', 'end');
                }
            });
        } else {
            var userName, passowrd, emailId, DOB;
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know you yet! kindly login with your credentials');
                    convo.addQuestion('Enter your User Name ', function(res, convo) {
                        saveToFile(res);
                        userName = res.text;
                        convo.gotoThread('q1')
                    }, { 'key': 'userName' }, 'default')

                    convo.addQuestion(' Enter password', function(res, convo) {
                        passowrd = res.text;
                        saveToFile(res);
                        convo.gotoThread('q2')
                    }, { 'key': 'passowrd' }, 'q1')

                    convo.addQuestion(' What is your email Id ?', function(res, convo) {
                        var emailFlag = validator.isEmail(res.text);
                        saveToFile(res);
                        if (emailFlag) {
                            emailId = res.text;
                            convo.gotoThread('q3');
                        } else {
                            convo.say('email ID which you have entred is in wrong format.')
                            convo.gotoThread('q2');
                        }
                    }, { 'key': 'email' }, 'q2')

                    convo.addQuestion(' What is DOB ? example format : m/d/yyyy', function(res, convo) {
                        var dateFlag = moment(res.text, 'M/D/YYYY', true).isValid();
                        saveToFile(res);
                        if (dateFlag) {
                            DOB = res.text;
                            convo.gotoThread('end')
                        } else {
                            convo.say(' DOB which you have entred is in wrong format.')
                            convo.gotoThread('q3')
                        }
                    }, { 'key': 'DOB' }, 'q3')

                    convo.addMessage('Okay thank you very much for the valuable info.', 'end')
                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('userName');
                                user.passowrd = convo.extractResponse('passowrd');
                                user.email = convo.extractResponse('email');
                                user.DOB = convo.extractResponse('DOB');
                                controller.storage.users.save(user, function(err, id) {
                                    if (err)
                                        console.log(err);
                                });
                            });
                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            console.log('Done');
                        }
                    });
                }
            });
        }
    });
});