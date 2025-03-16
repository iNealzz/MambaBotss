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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} è online!`);
});

// Modifica il nickname quando viene assegnato un ruolo con una tag
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    let newNick = newMember.nickname || newMember.user.username;
    
    for (const [roleName, tag] of Object.entries(ROLE_TAGS)) {
        const role = newMember.guild.roles.cache.find(r => r.name === roleName);
        if (role) {
            const hadRole = oldMember.roles.cache.has(role.id);
            const hasRoleNow = newMember.roles.cache.has(role.id);
            
            if (!hadRole && hasRoleNow) {
                if (!newNick.startsWith(tag)) {
                    newNick = tag + newNick;
                }
            }
        }
    }
    
    try {
        await newMember.setNickname(newNick);
        console.log(`✅ Nickname aggiornato per ${newMember.user.username}`);
    } catch (error) {
        console.error(`❌ Impossibile cambiare nickname per ${newMember.user.username}: ${error}`);
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
