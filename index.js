require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    throw new Error('❌ ERRORE: Il token non è stato trovato nelle variabili d\'ambiente!');
}

// Canali vocali trigger e categorie corrispondenti
const TRIGGER_CHANNELS = {
    "🕛 | CREA STANZA 3": "1305301814761226340", // STREAMZONE
    "🕛 | CREA STANZA 1": "1305304019987730432", // VOCALI
    "🕛 | CREA STANZA 4": "1336485340893941862", // VALORANT
    "🕛 | CREA STANZA 2": "1312813415466532924", // MAMBA
};

// Crea il client con gli intent necessari
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = member.guild;

    // L'utente è entrato in un canale trigger
    if (newState.channel && TRIGGER_CHANNELS[newState.channel.name]) {
        const categoryId = TRIGGER_CHANNELS[newState.channel.name];
        const category = guild.channels.cache.get(categoryId);

        if (!category) {
            console.error(`❌ Categoria con ID ${categoryId} non trovata!`);
            return;
        }

        // Creazione del nuovo canale vocale
        const newChannel = await guild.channels.create({
            name: `${member.user.username} Channel`,
            type: 2, // Tipo 2 indica un canale vocale
            parent: categoryId
        });

        // Sposta l'utente nel nuovo canale
        await member.voice.setChannel(newChannel);
    }

    // Controllo se un canale creato è vuoto e va eliminato
    if (oldState.channel && oldState.channel.name.endsWith("Channel")) {
        if (oldState.channel.members.size === 0) {
            await oldState.channel.delete();
        }
    }
});

console.log(`🔍 DEBUG - Token Caricato: ${TOKEN ? 'OK' : 'ERRORE'}`);

client.login(TOKEN);
