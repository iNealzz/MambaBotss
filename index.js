require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

// Canali trigger per la creazione di stanze vocali
const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 1": "1305304019987730432", // VOCALI
    "🕛 | CREA STANZA 2": "1312813415466532924", // MAMBA  
    "🕛 | CREA STANZA 3": "1305301814761226340", // STREAMZONE
    "🕛 | CREA STANZA 4": "1336485340893941862", // VALORANT
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

// Creazione e gestione delle stanze vocali
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = newState.guild;

    if (newState.channel && TRIGGER_CHANNELS[newState.channel.name]) {
        const categoryId = TRIGGER_CHANNELS[newState.channel.name];
        const category = guild.channels.cache.get(categoryId);
        if (!category) return console.error(`❌ Categoria con ID ${categoryId} non trovata!`);

        // Controlla se l'utente ha già un canale attivo
        let existingChannel = guild.channels.cache.find(
            ch => ch.type === 2 && ch.name.includes(member.user.username) && ch.parentId === categoryId
        );

        if (!existingChannel) {
            existingChannel = await guild.channels.create({
                name: `${member.user.username} Channel`,
                type: 2,
                parent: categoryId
            });
        }

        await member.voice.setChannel(existingChannel);
    }

    // Elimina il canale se è vuoto
    if (oldState.channel && oldState.channel.members.size === 0 && oldState.channel.name.endsWith("Channel")) {
        await oldState.channel.delete();
    }
});

client.login(TOKEN);
