const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const bot = new TelegramBot('7637469255:AAFBthW1KsfgQGWg0GTOQeDe5GAhQOOU6zs', { polling: true }); // api бота
//const needchannelid = "-1002366112090"; // сюда нужно вставить id чата с каналом постов
const needchannelid = "-1002435725660";
const usersFile = 'users.json';
function initializeUsersFile() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([]));
    }
}
initializeUsersFile();
function getUsers() {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function addUser(chatId) {
    const users = getUsers();
    if (!users.includes(chatId)) {
        users.push(chatId);
        saveUsers(users);
    }
}

function removeUser(chatId) {
    const users = getUsers();
    const updatedUsers = users.filter(id => id !== chatId);
    saveUsers(updatedUsers);
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendPhoto(chatId, './images/1.jpg', {caption: "Stay Informed, Stay Ahead with The Times!",reply_markup: {
        inline_keyboard: [
            [{ text: 'Go To News', url: 'https://t.me/The_TimesNews' }],
            [{ text: 'Offer news', url: 'https://t.me/TR_808' }]
        ]
    } })
    bot.sendPhoto(chatId, './images/2.jpg', {caption: "Tories lead by 14 points after Farage climbdown", reply_markup:{
        inline_keyboard: [
            [{ text: 'Go to news', url: 'https://t.me/The_TimesNews' }],
            [{ text: 'Offer news', url: 'https://t.me/TR_808' }]
        ]
    } })
    addUser(chatId);
    bot.sendMessage(chatId, 'Вы успешно подписались на рассылку! Для отмены подписки, введите: /unsubscribe.'); // 
});

/*
bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;
    addUser(chatId);
    bot.sendMessage(chatId, 'Вы успешно подписались на рассылку!');
});
*/
bot.onText(/\/unsubscribe/, (msg) => {
    const chatId = msg.chat.id;
    removeUser(chatId);
    bot.sendMessage(chatId, 'Вы успешно отписались от рассылки!');
});

async function sendMessageToUsers(channelMessage) {
    const users = getUsers();
    const maxMessagesPerSecond = 20; // Лимит сообщений
    const delay = 1000 / maxMessagesPerSecond; // Задержка между сообщениями

    let sentCount = 0;

    for (const userId of users) {
        try {
            if (channelMessage.text) {
                await bot.sendMessage(userId, channelMessage.text);
            } else if (channelMessage.photo) {
                const photoId = channelMessage.photo[channelMessage.photo.length - 1].file_id; // Последняя версия фото — наибольшее качество
                await bot.sendPhoto(userId, photoId, { caption: channelMessage.caption || '' });
            } else if (channelMessage.video) {
                const videoId = channelMessage.video.file_id;
                await bot.sendVideo(userId, videoId, { caption: channelMessage.caption || '' });
            } else if (channelMessage.document) {
                const documentId = channelMessage.document.file_id;
                await bot.sendDocument(userId, documentId, { caption: channelMessage.caption || '' });
            }
            await bot.sendMessage(userId, 'Please, hop on our original channel!', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Go to news', url: 'https://t.me/The_TimesNews' }],
                        [{ text: 'Offer news', url: 'https://t.me/TR_808' }]
                    ]
                }
            });

            sentCount++;
        } catch (error) {
            console.error(`Ошибка при отправке сообщения пользователю ${userId}:`, error.message);
        }

        // Задержка между сообщениями
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log(`Всего отправлено сообщений: ${sentCount}`);
}

bot.on('channel_post', async (msg) => {
    if (msg.chat.id == needchannelid)
    {
        console.log(`Получено сообщение из канала ${msg.chat.id}: ${msg.message_id}`);
        await sendMessageToUsers(msg);
    }
});
