const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const token = '7291288644:AAGtKXABZ57GOj1Jxq1WelMZuAitlSN8At4';
const webAppUrl = 'https://legendary-bombolone-18e5fd.netlify.app';
const activationPassword = '548935'; // Пароль для активации

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(bodyParser.json());
app.use(cors());

let currentCoefficients = generateRandomCoefficients(); // Инициализация случайных коэффициентов

// Хранение языка, выбранного пользователем
const userLanguage = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Dilni tanlang:', {
            reply_markup: {
                keyboard: [
                    [{ text: 'Oʻzbekcha' }, { text: 'Türkçe' }]
                ],
                one_time_keyboard: true
            }
        });

        bot.once('message', async (msg) => {
            const chosenLanguage = msg.text.toLowerCase();

            if (chosenLanguage.includes('узбек') || chosenLanguage.includes('oʻzbek')) {
                userLanguage[chatId] = 'uzbek';
                await bot.sendMessage(chatId, 'Endi siz signal olishingiz mumkin', {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });
            } else if (chosenLanguage.includes('турецкий') || chosenLanguage.includes('türkçe')) {
                userLanguage[chatId] = 'turkish';
                await bot.sendMessage(chatId, 'Aktivasyon tamamlandı! Artık sinyal alabilirsiniz', {
                    reply_markup: {
                        remove_keyboard: true
                    }
                });
            } else {
                await bot.sendMessage(chatId, 'Dilni tanlagan tilni tanlang: Oʻzbekcha yoki Türkçe / Dilni tanlagan tilni tanlang: Oʻzbekcha yoki Türkçe');
            }

            await bot.sendMessage(chatId, 'faollashtirish parolingizni kiriting: / aktivasyon şifrenizi girin', {
                reply_markup: {
                    force_reply: true
                }
            });
        });
    } else if (text === activationPassword) {
        const lang = userLanguage[chatId] || 'uzbek'; // По умолчанию узбекский
        const activationMessage = lang === 'uzbek' ? 'Aktivasyon tamamlandı! Artık sinyal alabilirsiniz' : 'Aktivasyon tamamlandı! Artık sinyal alabilirsiniz';

        await bot.sendMessage(chatId, activationMessage, {
            reply_markup: {
                keyboard: [
                    [{ text: 'SİNYAL AL / SIGNAL OLISH', web_app: { url: webAppUrl + '/form' } }]
                ]
            }
        });

        await bot.sendMessage(chatId, 'Davom etish uchun "SIGNAL QABUL QILISh" tugmasini bosing. / Devam etmek için "SİNYALİ AL" düğmesine tıklayın.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'SİNYAL AL / SIGNAL OLISH', web_app: { url: webAppUrl } }]
                ]
            }
        });
    } else {
        const lang = userLanguage[chatId] || 'uzbek'; // По умолчанию узбекский
        const errorMessage = lang === 'uzbek' ? 'Yanlış şifre. Lütfen tekrar deneyin.' : 'Yanlış şifre. Lütfen tekrar deneyin.';

        await bot.sendMessage(chatId, errorMessage);
    }
});

app.post('/web-data', async (req, res) => {
    const { queryId } = req.body;

    try {
        // Обновляем текущие коэффициенты на случайные
        currentCoefficients = generateRandomCoefficients();

        // Ответ на запрос от веб-приложения с информацией
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Коэффициенты обновлены',
            input_message_content: {
                message_text: `Коэффициенты обновлены на (${currentCoefficients[0]}X - ${currentCoefficients[1]}X)`
            }
        });

        return res.status(200).json({});
    } catch (e) {
        console.error('Ошибка при обновлении коэффициентов:', e);
        return res.status(500).json({ error: 'Ошибка при обновлении коэффициентов' });
    }
});

// Функция для генерации случайных коэффициентов
function generateRandomCoefficients() {
    const coefficient1 = (Math.random() * 5 + 1).toFixed(2); // Генерируем случайное число от 1 до 6 с двумя знаками после запятой
    const coefficient2 = (Math.random() * 5 + 1).toFixed(2); // Генерируем случайное число от 1 до 6 с двумя знаками после запятой
    return [coefficient1, coefficient2];
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
