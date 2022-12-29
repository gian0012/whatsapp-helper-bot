const qrcode = require('qrcode-terminal');
const {performance} = require('perf_hooks');
const {Client, LocalAuth, MessageMedia, Buttons} = require('whatsapp-web.js');
var fs = require('fs');
const process = require('process');

const footer = 'Developed By Γιάν';
const logo = 'https://i.imgur.com/9U1VuLM.png';

const client = new Client({
    puppeteer: {
        args: ["--no-sandbox"], executablePath: "/usr/bin/google-chrome-stable"
    }, authStrategy: new LocalAuth()
});


client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});



client.on('group_join', async (notification) => {
    const joinedUser = await client.getContactById(notification.recipientIds[0])
    const url = await client.getProfilePicUrl(notification.recipientIds[0]);
    const media = await MessageMedia.fromUrl(url ?? logo);
    const chat = await notification.getChat();

    const date = new Date();
    const dateText = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

    const caption = `Welcome @${joinedUser.id.user}(${joinedUser.number})!\n\n Time: ${dateText}`;

    chat.sendMessage(media, {
        caption, mentions: [joinedUser]
    })
});


client.on('group_leave', async (notification) => {
    const leftedUser = await client.getContactById(notification.recipientIds[0])
    const url = await client.getProfilePicUrl(notification.recipientIds[0]);
    const media = await MessageMedia.fromUrl(url ?? 'https://i.imgur.com/9U1VuLM.png');
    const chat = await notification.getChat();

    const date = new Date();
    const dateText = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

    const caption = `Goodbye @${joinedUser.id.user}(${joinedUser.number})!\n\n Time: ${dateText}`;

    chat.sendMessage(media, {
        caption, mentions: [joinedUser]
    })
});


client.on("message", async (message) => {
        const chat = await message.getChat();

        if (chat.isGroup) {

            const admins = chat.isGroup ? chat.groupMetadata.participants.filter(admin => admin.isAdmin).map(admin => admin.id._serialized) : [];

            const isAdmin = chat.isGroup ? admins.includes(message.author) : false

            try {
                const linkObj = JSON.parse(fs.readFileSync('./restrictions/antilink.json', 'utf8'));
                const spamObj = JSON.parse(fs.readFileSync('./restrictions/antispam.json', 'utf8'));
                const travaObj = JSON.parse(fs.readFileSync('./restrictions/antitrava.json', 'utf8'));
                const groupObj = JSON.parse(fs.readFileSync('./restrictions/groupmessage.json', 'utf8'));
                const statsObj = JSON.parse(fs.readFileSync('./stats/stats.json', 'utf8'));
                const floodObj = JSON.parse(fs.readFileSync('./flood/flood.json', 'utf8'));


                statsObj.messages[0] += 1;
                json = JSON.stringify(statsObj, null, 4)
                fs.writeFileSync('./stats/stats.json', json)

                if (!statsObj.users.includes(message.author)) {
                    statsObj.users.push(message.author);
                    json = JSON.stringify(statsObj, null, 4)
                    fs.writeFileSync('./stats/stats.json', json)
                }


                if (message.body === "!menu") {

                    let linkActive = linkObj.status[0] ? "🟢" : "🔴";
                    let spamActive = spamObj.status[0] ? "🟢" : "🔴";
                    let travaActive = travaObj.status[0] ? "🟢" : "🔴";

                    let text = `Menù: \n\n Antilink: ${linkActive}\nAntispam: ${spamActive}\nAntitrava: ${travaActive}`;

                    let buttons = new Buttons(text, [{body: 'Info', id: "Info"},
                            {body: 'Commands ', id: "Commands"}],
                        null, footer)

                    await chat.sendMessage(buttons)
                }


                if (isAdmin) {

                    if (message.body === "!tagall") {

                        let mex = `Tagall:\n`;
                        let text = "";
                        let mentions = []

                        for (let participant of chat.participants) {
                            const contact = await client.getContactById(participant.id._serialized);

                            mentions.push(contact);
                            text += `🔥 @${participant.id.user} \n`;
                        }

                        chat.sendMessage(mex + text, {mentions});
                    }

                    if (message.body === "!ban" && message.hasQuotedMsg) {
                        let repliedMessage = await message.getQuotedMessage();
                        number = []
                        number.push(repliedMessage.id.participant._serialized)
                        await chat.removeParticipants(number)
                        let text = `User banned successfully`;
                        await chat.sendMessage(text)
                    }


                    if (message.body === "!admin" && message.hasQuotedMsg) {
                        let repliedMessage = await message.getQuotedMessage();
                        number = []
                        number.push(repliedMessage.id.participant._serialized)
                        await chat.promoteParticipants(number)
                    }

                    if (message.body === "!dadmin" && message.hasQuotedMsg) {
                        let repliedMessage = await message.getQuotedMessage();
                        number = []
                        number.push(repliedMessage.id.participant._serialized)
                        await chat.demoteParticipants(number)
                    }

                    if (message.body === "!resetlink") {
                        let newLink = await chat.revokeInvite()
                    }


                    if (message.body === "!antilink" && !linkObj.status[0]) {

                        linkObj.status[0] = 1
                        json = JSON.stringify(linkObj, null, 4)
                        fs.writeFileSync('./restrictions/antilink.json', json)

                        let text = `Antilink enabled.`;
                        chat.sendMessage(text)
                    } else {
                        if (message.body == "!antilink" && linkObj.status[0]) {

                            linkObj.status[0] = 0;
                            json = JSON.stringify(linkObj, null, 4)
                            fs.writeFileSync('./restrictions/antilink.json', json)
                            let text = `Antilink disabled.`;
                            chat.sendMessage(text)
                        }
                    }


                    if (message.body == "!antitrava" && !travaObj.status[0]) {
                        travaObj.status[0] = 1
                        json = JSON.stringify(travaObj, null, 4)
                        fs.writeFileSync('./restrictions/antitrava.json', json)
                        let text = `Antitrava enabled.`;
                        chat.sendMessage(text)

                    } else {
                        if (message.body == "!antitrava" && travaObj.status[0]) {
                            travaObj.status[0] = 0;
                            json = JSON.stringify(travaObj, null, 4)
                            const res = fs.writeFileSync('./restrictions/antitrava.json', json)
                            let text = `Antitrava disabled.`;
                            chat.sendMessage(text)
                        }
                    }

                    if (message.body == "!antispam" && !spamObj.status[0]) {
                        spamObj.status[0] = 1
                        json = JSON.stringify(spamObj, null, 4)
                        fs.writeFileSync('./restrictions/antispam.json', json)
                        let text = `Antispam enabled.`;
                        chat.sendMessage(text)

                    } else {
                        if (message.body == "!antispam" && spamObj.status[0]) {
                            spamObj.status[0] = 0;
                            json = JSON.stringify(spamObj, null, 4)
                            const res = fs.writeFileSync('./restrictions/antispam.json', json)
                            let text = `Antispam disabled.`;
                            chat.sendMessage(text)
                        }
                    }

                    const open = groupObj.status[0];

                    if (message.body === "!open" && open) {
                        await chat.setMessagesAdminsOnly(0);
                        groupObj.status[0] = 0;
                        json = JSON.stringify(groupObj, null, 4)
                        fs.writeFileSync('./restrictions/groupmessage.json', json)
                    } else {
                        if (message.body === "!close" && !open) {
                            await chat.setMessagesAdminsOnly(1);
                            groupObj.status[0] = 1;
                            json = JSON.stringify(groupObj, null, 4)
                            fs.writeFileSync('./restrictions/groupmessage.json', json)
                        }
                    }


                    if (message.body === "!daa") {
                        let buttons = new Buttons('Press yes to confirm.', [{body: 'Yes', id: "acceptDaa"},
                                {body: 'No', id: "cancelDaa"}],
                            null, footer)

                        await chat.sendMessage(buttons)
                    }

                    if (message.body === "!closegroup") {
                        let buttons = new Buttons('Press yes to confirm.', [{body: 'Yes', id: "acceptCloseGroup"},
                                {body: 'No', id: "cancelCloseGroup"}],
                            null, footer)

                        await chat.sendMessage(buttons)
                    }


                }


                if (message.body == "!link") {
                    const link = await chat.getInviteCode();

                    let text = `Link: https://chat.whatsapp.com/${link}`;
                    chat.sendMessage(text);

                }

                if (message.body === "!ping") {
                    var startPing = performance.now();
                    let mex = await message.reply('Pong.');
                    var endPing = performance.now();


                    await mex.delete(1);
                    let text = `Ping: ${(Math.round(endPing - startPing))} ms`
                    await message.reply(text)

                }

                if (message.body.startsWith("!add ")) {
                    let number = message.body.slice(5);
                    number = number.includes("@c.us") ? number : `${number}@c.us`;
                    number = number.slice(1);
                        remArray = [];
                    remArray.push(number);
                    chat.addParticipants(remArray);
                }


                if (message.body.length > 30000 && travaObj.status[0]) {
                    message.delete(1);

                    number = []
                    number.push(message.author)
                    await chat.removeParticipants(number);
                }

                const isValidUrl = urlString => {
                    var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
                        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
                        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
                        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
                    return !!urlPattern.test(urlString);
                }

                const link = await chat.getInviteCode();
                if (isValidUrl(message.body) && linkObj.status[0] && message.body.includes('whatsapp') && !isAdmin && !message.body.includes(link)) {
                    message.delete(1);
                    number = []
                    number.push(message.author)
                    await chat.removeParticipants(number);
                }


                if (spamObj.status[0] && !isAdmin) {
                    let interval = 5000;
                    let limit = 1;

                    floodObj.push({
                        message: message,
                        author: message.author,
                        timestamp: Date.now()
                    });

                    const matches = floodObj.filter((m) =>
                        m.author == message.author &&
                        m.message.body == message.body &&
                        m.timestamp > Date.now() - interval
                    );

                    if (matches.length > limit) {
                        return client.sendMessage(message.from, 'error');
                    }


                }

                function getRandomInt(max) {
                    return Math.floor(Math.random() * max);
                }

                if (message.body === "!dado") {
                    const numb = getRandomInt(6);
                    let text = `Dice face extracted: ${numb}`
                    chat.sendMessage(text);

                }


                if (message.selectedButtonId === "Info" || message.body === "!info") {
                    const statsObj = JSON.parse(fs.readFileSync('./stats/stats.json', 'utf8'));

                    let text = `Users registered: ${statsObj.users.length}\n Messages sent: ${statsObj.messages}`
                    chat.sendMessage(text)
                }

                if (message.selectedButtonId === "Comandi" || message.body === "!comandi") {

                    let text = `Commands available:\n\n!tagall\n!ban\n!ping\n!add [number without +]\n!link\n!antilink\n!antispam\n!antitrava\n!open\n!close\n!admin\n!dadmin\n!resetlink\n!dado\n!closegroup`;
                    chat.sendMessage(text)
                }

                if (message.selectedButtonId === "acceptDaa" && isAdmin) {

                    for (let participant of chat.participants) {
                        if (participant.isAdmin && participant.id._serialized !== message.to) {
                            number = []
                            number.push(participant.id._serialized)
                            await chat.demoteParticipants(number)
                        }
                    }
                }

                if (message.selectedButtonId === "cancelDaa" && isAdmin) {
                    message.reply('Operation abort.')
                }

                if (message.selectedButtonId === "acceptCloseGroup" && isAdmin) {
                    for (let participant of chat.participant) {
                        if (participant.id._serialized !== message.to && !participant.isSuperAdmin) {
                            number = [];
                            number.push(participant.id._serialized);
                            await chat.removeParticipants(number);
                        }
                    }
                    chat.leave();
                }

                if (message.selectedButtonId === "cancelCloseGroup" && isAdmin) {
                    message.reply('Operation abort.');
                }
            } catch (err) {
                console.log(err);
            }
        }

    }
)

client.initialize();
