var Botkit = require('botkit');
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
controller.setupWebserver(1999, function(err, webserver) {
    controller.createWebhookEndpoints(controller.webserver, bot, function() {
        console.log('This bot is online!!!');
    });
});

// this is triggered when a user clicks the send-to-messenger plugin
controller.on('facebook_optin', function(bot, message) {

    bot.reply(message, 'Welcome to my app!');

});

// user said hello
controller.hears(['hello'], 'message_received', function(bot, message) {
    console.log(message);
    saveToFile(message);
    // bot.api.users.info({ user: message.user }, (error, response) => {
    //     let { name, real_name } = response.user;
    //     console.log(name, real_name);
    // })
    bot.reply(message, 'Hey there.');
});



controller.hears('test', 'message_received,facebook_postback', function(bot, message) {
    var attachment = {
        'type': 'template',
        'payload': {
            'template_type': 'generic',
            'elements': [{
                'title': 'Chocolate Cookie',
                'image_url': 'http://cookies.com/cookie.png',
                'subtitle': 'A delicious chocolate cookie',
                'buttons': [{
                    'type': 'postback',
                    'title': 'Eat Cookie',
                    'payload': 'chocolate'
                }]
            }, ]
        }
    };

    bot.reply(message, {
        attachment: attachment,
    });

});

controller.on('facebook_postback', function(bot, message) {
    console.log(message);
    if (message.payload == 'chocolate') {
        bot.reply(message, 'You ate the chocolate cookie!')
    }

});
controller.hears('ask', 'message_received', function(bot, message) {
    bot.startConversation(message, function(err, convo) {

        convo.addMessage('Charmed to meet you, lets get to know your personal info!')

        convo.addQuestion('What is DOB ?', function(res, convo) {
            console.log(res.text);
            console.log(res.question);
            saveToFile(res);
            convo.gotoThread('q2')
        }, {}, 'default')


        convo.addQuestion('what is your email id?', function(res, convo) {
            console.log(res.text);
            console.log(res.question);
            saveToFile(res);
            convo.gotoThread('end')
        }, {}, 'q2')

        convo.addMessage('Okay thank you very much for the valuable info, human.', 'end');
    })
})