require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

// Mappa di ruoli e tag corrispondenti
const ROLE_TAGS = {
    "🐍 MAMBA TEAM": "[MAMBA] ",
    "🐍 MAMBA PROVA": "[M.PROVA] ",
    "🐍 ACADEMY MAMBA": "[ACADEMY] "
};

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
        GatewayIntentBits.GuildMembers, // NECESSARIO per rilevare i cambiamenti nei ruoli
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

// Modifica il nickname quando viene assegnato un ruolo con una tag
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    console.log(`🔍 Evento attivato per: ${newMember.user.username}`);
    console.log(`👀 Vecchi ruoli: ${oldMember.roles.cache.map(r => r.name).join(', ')}`);
    console.log(`🆕 Nuovi ruoli: ${newMember.roles.cache.map(r => r.name).join(', ')}`);

    let newNick = newMember.nickname || newMember.user.username;

    // Rimuove eventuali tag precedenti solo se non ha un ruolo corrispondente
    for (const tag of Object.values(ROLE_TAGS)) {
        if (newNick.startsWith(tag)) {
            newNick = newNick.replace(tag, '');
        }
    }

    let selectedTag = "";
    for (const [roleName, tag] of Object.entries(ROLE_TAGS)) {
        const role = newMember.guild.roles.cache.find(r => r.name.includes(roleName));
        if (role && newMember.roles.cache.has(role.id)) {
            selectedTag = tag;
            break; // Assicura che venga aggiunto solo il primo tag corrispondente
        }
    }

    if (selectedTag && !newNick.startsWith(selectedTag)) {
        newNick = selectedTag + newNick;
        try {
            await newMember.setNickname(newNick);
            console.log(`✅ Nickname aggiornato per ${newMember.user.username} a ${newNick}`);
        } catch (error) {
            console.error(`❌ Errore nel cambio nickname di ${newMember.user.username}: ${error}`);
        }
    } else {
        console.log(`⚠ Nessuna modifica necessaria per ${newMember.user.username}`);
    }
});

// Creazione e gestione delle stanze vocali
client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    const guild = newState.guild;

    if (newState.channel && TRIGGER_CHANNELS[newState.channel.name]) {
        const categoryId = TRIGGER_CHANNELS[newState.channel.name];
        const category = guild.channels.cache.get(categoryId);

        if (!category) {
            console.error(`❌ Categoria con ID ${categoryId} non trovata!`);
            return;
        }

        const newChannel = await guild.channels.create({
            name: `${member.user.username} Channel`,
            type: 2, // Tipo Voice Channel
            parent: category.id
        });

        await member.voice.setChannel(newChannel);
    }

    if (oldState.channel && !newState.channel && oldState.channel.name.endsWith("Channel") && oldState.channel.members.size === 0) {
        await oldState.channel.delete();
    }
});

client.login(TOKEN);
