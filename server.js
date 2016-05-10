var TelegramBot = require('node-telegram-bot-api');

var tokenGenerator = require('./token');
var token = tokenGenerator.getToken();

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    port: '8889',
    user: 'pokemonuser',
    password: tokenGenerator.getDatabasePassword(),
    database: 'pokemonevents'
});

connection.connect();

// Setup bot
var bot;

if (process.env.NODE_ENV === 'production') {
    bot = new TelegramBot(token);
    bot.setWebHook(process.env.IP + bot.token, "");
} else {
    bot = new TelegramBot(token, {
        polling: true
    });
};

// Matches /current
bot.onText(/\/current/, function(msg) {
    var chatId = msg.chat.id;
    var pokemon = [];

    var getCurrentEventsQuery = 'SELECT *, DATE_FORMAT(enddate,"%d %b %Y") as formateddate FROM pokemon_event AS pe INNER JOIN pokemon AS p INNER JOIN verteiler AS V ON pe.pokemon_id = p.id AND pe.verteiler_id = v.id WHERE pe.enddate >= CURDATE() ORDER BY enddate DESC;'
        //   connection.query('SELECT * FROM pokemon_event AS pe INNER JOIN pokemon AS p INNER JOIN verteiler AS V ON pe.pokemon_id = p.id AND pe.verteiler_id = v.id WHERE pe.enddate >= CURDATE();', function(err, rows, fields) {
        //     if (err) throw err;
        // });'SELECT * FROM pokemon WHERE id in (SELECT `pokemon_id` FROM `pokemon_event` WHERE enddate >= CURDATE())'

    connection.query(getCurrentEventsQuery, function(err, rows, fields) {
        if (err) throw err;

        for (i = 0; i < rows.length; i++) {
            pokemon[i] = "✳️ " + rows[i].name + " | bis " + rows[i].formateddate + " 📅";
        };
        console.log('Active Events: ', rows[0]);

        console.log(pokemon);
        var opts = {
            //reply_to_message_id: msg.message_id,
            reply_markup: JSON.stringify({
                keyboard: [pokemon],
                one_time_keyboard: true,
            })
        };
        console.log(opts);

        //bot.sendMessage(chatId, 'Do you love me?');
        var photo = 'assets/718.png';
        //bot.sendPhoto(chatId, photo, opts);
        bot.sendMessage(chatId, 'Select an event to get more info.', opts);

        bot.onText(/✳️ [a-zA-Z]+/, function(msg, match) {
            var resp = match;

            if (resp !== "") {
                bot.sendMessage(chatId, "Details for: " + resp);
            } else {
                bot.sendMessage(chatId, "Please enter something!");
            }
        });
    });
});

//Any kind of message
// bot.on('message', function(msg) {
//     var chatId = msg.chat.id;
//
//     // photo can be: a file path, a stream or a Telegram file_id
//     var photo = 'http://www.greenchu.de/sprites/icons/718.png';
//     bot.sendPhoto(chatId, photo, {
//         caption: 'Zitrone :D'
//     });
// });
