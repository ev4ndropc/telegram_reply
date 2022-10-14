require('dotenv').config()
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input")
const fs = require("fs");
const { NewMessageEvent, NewMessage } = require("telegram/events");
const moment = require("moment")

const express = require('express');
const { getParticipants } = require('telegram/client/chats');
const { users } = require('telegram/client');
const app = express()
app.use(express.static('public'))

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
let stringSession = new StringSession(process.env.STRING_SESSION);

const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});


(async () => {
    console.log("Loading interactive example...");
    await client.start({
        phoneNumber: async () => await input.text("Por favor, digite seu número no telegram: "),
        password: async () => await input.text("Por favor, insira sua senha no telegram: "),
        phoneCode: async () =>
            await input.text("Por favor, digite o código que você recebeu: "),
        onError: (err) => console.log(err),
    });
    console.log("Agora você está conectado.");
    fs.writeFileSync('./session.text', client.session.save())
    console.log(client.session.save())

    async function handler(event) {
        var finish_time = 1666234800 * 1000
        var now = moment().unix()

        if (now < finish_time) {
            let config = fs.readFileSync('./config.json', 'utf8')
            config = JSON.parse(config)
            
            var target = config.filter(target => {
                var user_id = ''

                if(event.message.peerId.userId) {
                    user_id = String(event.message.peerId.userId.value)
                }else if(event.message.peerId.channelId) {
                    user_id = String(event.message.peerId?.channelId?.value)
                }else if(event.message.peerId.chatId) {
                    user_id = String(event.message.peerId?.chatId?.value)
                }
                
                if (user_id.includes(target.alvo_id)) {
                    return target
                }
            })
            

            if(target.length > 0) {
                
                target[0].enviar_para.forEach(async final => {
                    try {
                        await client.sendMessage(final, { message: event.message })
                    } catch (error) {
                        console.log(error)
                    }
                })

            }

        } else {
            return null
        }
    }
    client.addEventHandler(handler, new NewMessage({
        incoming: true
    }));

})();


app.get('/chat/:username', async (req, res) => {
    const { username } = req.params
    try {
        const data = await client.getPeerId(username)
        return res.send(data)
        
    } catch (error) {
        return res.send('Username inválido')
    }
})

app.get('/cron', (req, res) => {
    res.status(200).json({ ok: true })
})

app.listen(3000, () => {
    console.log(`Servidor iniciado na porta: ${process.env.PORT}`)
})
