var TelegramBot = require('node-telegram-bot-api');
var request = require('request');

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
var databaseOutput;
var pokemon = [];

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
bot.onText(/\/current/, function(currentMsg) {
    var chatId = currentMsg.chat.id;

    var getCurrentEventsQuery = 'SELECT *, DATE_FORMAT(enddate,"%d %b %Y") as formateddate FROM pokemon_event AS pe INNER JOIN pokemon AS p INNER JOIN verteiler AS V ON pe.pokemon_id = p.id AND pe.verteiler_id = v.id WHERE pe.enddate >= CURDATE() ORDER BY enddate DESC;'


    connection.query(getCurrentEventsQuery, function(err, rows, fields) {
        if (err) throw err;

        for (i = 0; i < rows.length; i++) {
            pokemon[i] = "✳️ " + rows[i].name + " | bis " + rows[i].formateddate + " 📅";
        };
        console.log('Active Events: ', rows[0]);
        databaseOutput = rows;

        console.log(pokemon);
        var opts = {
            //reply_to_message_id: msg.message_id,
            reply_markup: JSON.stringify({
                keyboard: [pokemon],
                one_time_keyboard: true,
            })
        };
        bot.sendMessage(chatId, 'Select an event to get more info.', opts);



    });
});

//Active Events Information
bot.onText(/✳️ [a-zA-Z]+/, function(msg, match) {
    var chatId = msg.chat.id;
    var resp = match;
    console.log(msg);

    if (resp !== "") {
        bot.sendMessage(chatId, "Details for: " + resp);

        for (i = 0; i < pokemon.length; i++) {
            if (pokemon[i] == msg.text) {
                var picURL = 'http://pokeapi.co/media/sprites/pokemon/' + databaseOutput[i].pokemon_id + '.png';
                var pic = request(picURL);
                bot.sendPhoto(chatId, pic);
                bot.sendMessage(chatId, "🌐 ID: " + databaseOutput[i].pokemon_id + "\n🐾 Name: " + databaseOutput[i].name + "\n🎚 Level: " + databaseOutput[i].level);
            }
        };

    } else {
        bot.sendMessage(chatId, "Please enter something!");
    }
});
