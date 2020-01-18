const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

const roleMessage = '631091339366367242';
const embedChannel = '631025282056192000';

const emojis = require('./emojis');

const embed = new Discord.RichEmbed()
  .setColor(65448)
  .setTitle("Role Selection")
  .setDescription("React to this message with the corresponding emoji to select a role. Please only select the roles that apply to you.")
  .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
  .setImage("https://i.kym-cdn.com/entries/icons/original/000/003/980/limesguy.jpg")
  .setAuthor("The Empire", "https://cdn.discordapp.com/embed/avatars/0.png")
  .addField("Melee Dps", `React with ${emojis.meleeDps.full} to select Melee Dps`)
  .addField("Caster Dps", `React with ${emojis.casterDps.full} to select Caster Dps`)
  .addField("Ranged Dps", `React with ${emojis.rangedDps.full} to select Ranged Dps`)
  .addField("Tank", `React with ${emojis.tank.full} to select Tank`)
  .addField("Healer", `React with ${emojis.healer.full} to select Healer`)

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Emit messageReactionAdd and messageReactionRemove for all messages
client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
});

client.on('messageReactionAdd', (messageReaction, user) => {
  let roleName = messageReaction.emoji.name;
  let role = messageReaction.message.guild.roles.find(role => role.name.split(' ').join('').toLowerCase() === roleName.toLowerCase());

  if (messageReaction.message.id === roleMessage) {
    if (role) {
      let member = messageReaction.message.guild.members.find(member => member.id === user.id);
      if (member) {
        member.addRole(role.id);
        console.log(`Successfully added role ${role.name} to ${user.username}`);
      }
    }
  }

  if (messageReaction.emoji.name === '💩') {
    if (!(user.id === '328294679852351488')) return;
    const updateEmbed = new Discord.RichEmbed(messageReaction.message.embeds[0])
      .setColor(65448)
      .setTitle("Role Selection")
      .setDescription("React to this message with the corresponding emoji to select a role. Please only select the roles that apply to you.")
      .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
      .setImage("https://i.kym-cdn.com/entries/icons/original/000/003/980/limesguy.jpg")
      .setAuthor("The Empire", "https://cdn.discordapp.com/embed/avatars/0.png")
    messageReaction.message.edit(updateEmbed);
    messageReaction.remove(user.id);
  }
});

client.on('messageReactionRemove', (messageReaction, user) => {
  let roleName = messageReaction.emoji.name;
  let role = messageReaction.message.guild.roles.find(role => role.name.split(' ').join('').toLowerCase() === roleName.toLowerCase());

  if (messageReaction.message.id === roleMessage) {
    if (role) {
      let member = messageReaction.message.guild.members.find(member => member.id === user.id);
      if (member) {
        if (member.roles.find(r => r.name.split(' ').join('').toLowerCase() === roleName.toLowerCase())) {
          member.removeRole(role.id);
          console.log(`Successfully removed role ${role.name} from ${user.username}`);
        } else {
          console.log(`${user.username} removed the ${roleName} emoji but did not have the role ${role.name}`);
        }
      }
    }
  }
});

client.on('message', async msg => {
  // Only pay attention to the client bot
  if (msg.author.bot) {
    if (!(msg.author.id === client.user.id)) return;
  }

  // Send embed when an admin tells it to
  if (msg.isMemberMentioned(client.user)) {
    if (msg.content.includes("do the thing")) {
      if (msg.member.hasPermission("ADMINISTRATOR")) {
        client.channels.get(embedChannel).send(embed)
        msg.delete();
      } else {
        msg.reply("no thanks.");
      }
    }
  }

  // Add reactions to the embed in order
  if (msg.channel.id === embedChannel) {
    if (msg.embeds[0].title === embed.title) {
      try {
        await msg.react(emojis.meleeDps.id);
        await msg.react(emojis.casterDps.id);
        await msg.react(emojis.rangedDps.id);
        await msg.react(emojis.tank.id);
        await msg.react(emojis.healer.id);
      } catch (error) {
        console.log(error);
      }
    }
  }
});

client.login(config.token);