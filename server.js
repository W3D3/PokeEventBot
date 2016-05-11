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

var picturePrefix = "https://media.bisafans.de/6b7d4b6/pokemon/artwork/";

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

    var getCurrentEventsQuery = 'SELECT *, DATE_FORMAT(startdate,"%d %b %Y") as fstartdate, DATE_FORMAT(enddate,"%d %b %Y") as fenddate FROM pokemon_event AS pe INNER JOIN pokemon AS p INNER JOIN verteiler AS V ON pe.pokemon_id = p.id AND pe.verteiler_id = v.id WHERE pe.enddate >= CURDATE() ORDER BY enddate ASC;'

    connection.query(getCurrentEventsQuery, function(err, rows, fields) {
        if (err) throw err;

        for (i = 0; i < rows.length; i++) {
            var line = [];
            line[0] = "✳️ " + rows[i].name + " | bis " + rows[i].fenddate + " 📅";
            pokemon[i] = line;
        };
        console.log('Active Events: ', rows[0]);
        databaseOutput = rows;

        console.log(pokemon);
        var opts = {
            //reply_to_message_id: msg.message_id,
            reply_markup: JSON.stringify({
                keyboard: pokemon,
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

    if (resp !== "")
    {
        for (i = 0; i < pokemon.length; i++) {
            if (pokemon[i] == msg.text) {
                bot.sendMessage(chatId, "Details for (Active Event) " + resp + "\n" + databaseOutput[i].fstartdate + " ➡️ " + databaseOutput[i].fenddate);
                //var picURL = 'http://pokeapi.co/media/sprites/pokemon/' + databaseOutput[i].pokemon_id + '.png';
                var picURL = picturePrefix + databaseOutput[i].pokemon_id + '.png';
                var pic = request(picURL);
                var info = "🌐 ID: " + databaseOutput[i].pokemon_id + "\n🐾 Name: " + databaseOutput[i].name + "\n🎚 Level: " + databaseOutput[i].level + "\n 🎁 " + databaseOutput[i].description;
                var sentPic = bot.sendPhoto(chatId, pic, {caption: info});
                //var info = bot.sendMessage(chatId, "🌐 ID: " + databaseOutput[i].pokemon_id + "\n🐾 Name: " + databaseOutput[i].name + "\n🎚 Level: " + databaseOutput[i].level);
            }
        };

    } else {
        bot.sendMessage(chatId, "Please enter something!");
    }
});
