var TelegramBot = require('node-telegram-bot-api');

var tokenGenerator = require('./token');
var token = tokenGenerator.getToken();

// Setup bot
var bot;

if(process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.IP + bot.token, "");
}
else {
  bot = new TelegramBot(token, { polling: true });
}



// Matches /love
bot.onText(/\/events/, function (msg) {
  var chatId = msg.chat.id;
  var opts = {
      //reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['Yes, you are the bot of my life ❤'],
          ['No, sorry there is another one...']],
        one_time_keyboard: true
      })
    };
    bot.sendMessage(chatId, 'Do you love me?', opts);
});

//Any kind of message
bot.on('message', function (msg) {
  var chatId = msg.chat.id;

  // photo can be: a file path, a stream or a Telegram file_id
  var photo = 'zitrone.jpg';
  bot.sendPhoto(chatId, photo, { caption: 'Zitrone :D' });
});
