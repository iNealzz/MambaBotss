require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

// Mappa di ruoli e tag corrispondenti
const ROLE_TAGS = {
    "🐍 MAMBA TEAM": "[MAMBA] ",
    "🐍 MAMBA PROVA": "[M.PROVA] ",
    "🐍 ACADEMY MAMBA": "[ACADEMY] "
};

// Canali trigger per la creazione di stanze vocali
const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 1": "1305304019987730432",
    "🕛 | CREA STANZA 2": "1312813415466532924",
    "🕛 | CREA STANZA 3": "1305301814761226340",
    "🕛 | CREA STANZA 4": "1336485340893941862",
};

// Configurazione Ticket System
const TICKET_CATEGORY_ID = "1103995307341140008";
const TICKET_CHANNEL_ID = "990911592302514226";
const STAFF_ROLES = ["👑FOUNDER", "🔥 ADMIN", "⚙️ MODERATORE"];
const activeTickets = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

// Modifica il nickname quando viene assegnato un ruolo con una tag
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    let baseNick = newMember.user.username;
    let foundTag = "";

    for (const [roleName, tag] of Object.entries(ROLE_TAGS)) {
        const role = newMember.guild.roles.cache.find(r => r.name === roleName);
        if (role && newMember.roles.cache.has(role.id)) {
            foundTag = tag;
            break;
        }
    }

    let newNick = foundTag + baseNick;
    if (newNick !== newMember.nickname) {
        try {
            await newMember.setNickname(newNick);
        } catch (error) {
            console.error(`❌ Errore nel cambio nickname: ${error}`);
        }
    }
});

// Creazione e gestione delle stanze vocali
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = newState.guild;

    if (newState.channel && TRIGGER_CHANNELS[newState.channel.name]) {
        const categoryId = TRIGGER_CHANNELS[newState.channel.name];
        const category = guild.channels.cache.get(categoryId);
        if (!category) return;

        const newChannel = await guild.channels.create({
            name: `${member.user.username} Channel`,
            type: 2,
            parent: category.id
        });
        await member.voice.setChannel(newChannel);
    }

    if (oldState.channel && !newState.channel && oldState.channel.name.endsWith("Channel") && oldState.channel.members.size === 0) {
        await oldState.channel.delete();
    }
});

// Sistema Ticket
client.on('messageCreate', async (message) => {
    if (message.channel.id !== TICKET_CHANNEL_ID || message.author.bot) return;

    if (activeTickets.has(message.author.id)) {
        return message.reply("⚠️ Hai già un ticket aperto. Chiudi il ticket precedente prima di crearne un altro.");
    }

    const guild = message.guild;
    const category = guild.channels.cache.get(TICKET_CATEGORY_ID);
    if (!category) return;

    const ticketChannel = await guild.channels.create({
        name: `ticket-${message.author.username}`,
        type: 0,
        parent: category.id,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: message.author.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            ...STAFF_ROLES.map(roleName => {
                const role = guild.roles.cache.find(r => r.name === roleName);
                return role ? { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] } : null;
            }).filter(Boolean)
        ]
    });

    activeTickets.set(message.author.id, ticketChannel.id);
    message.reply(`✅ Ticket creato: ${ticketChannel}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!chiudi' && message.channel.name.startsWith('ticket-')) {
        if (!activeTickets.has(message.author.id) || activeTickets.get(message.author.id) !== message.channel.id) {
            return message.reply("⚠️ Non hai il permesso di chiudere questo ticket.");
        }

        await message.channel.delete();
        activeTickets.delete(message.author.id);
    }
});

client.login(TOKEN);
