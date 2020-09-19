const { Command } = require('discord-akairo');
const mps_mod = require('../util/mps_mod');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');
const AFKChecker = require('../struct/afk_checker');

class AfkCheckTopCommand extends Command {
  constructor() {
    super('afkchecktop', {
      aliases: ['afkchecktop'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: message => mps_mod(this.client, message),
      args: [
        {
          id: 'monitorChannel',
          type: 'monitorChannel',
          otherwise: (msg, { failure }) => apf(this.client, msg, 'monitorChannel', failure)
        }
      ]
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];

    let channelMonitor = args.monitorChannel;

    if (!channelMonitor.queue.length) {
      return sendmessage(message.channel, `Error: there are no members in queue in ${args.monitorChannel.name}`);
    }

    const update = (message, data) => {
      let text = `Mass AFK-checking...\n\n`;
      if (data.recentlyChecked) text += `${data.recentlyChecked} member(s) were recently afk-checked and were skipped over:\n`;
      if (data.recentlyCheckedUsers) text += data.recentlyCheckedUsers;
      if (data.notInVC) text += `\n\n${data.notInVC} member(s) were not actually in the voice channel and were skipped over:\n`;
      if (data.notAFK) text += `\n\n${data.notAFK} member(s) reacted to the message in time:\n`;
      if (data.notAFKUsers) text += data.notAFKUsers;
      if (data.afk) text += `\n\n${data.afk} member(s) were booted from the queue:\n`;
      if (data.afkUsers) text += data.afkUsers;

      message.edit(text).catch(err => console.log(`Failed to update in mass check!\n${err.message}`));
    };

    const finalize = (message, data) => {
      let text = `Mass AFK-checking complete!\n\n`;
      if (data.recentlyChecked) text += `${data.recentlyChecked} member(s) were recently afk-checked and were skipped over:\n`;
      if (data.recentlyCheckedUsers) text += data.recentlyCheckedUsers;
      if (data.notInVC) text += `\n\n${data.notInVC} member(s) were not actually in the voice channel and were skipped over:\n`;
      if (data.notAFK) text += `\n\n${data.notAFK} member(s) reacted to the message in time:\n`;
      if (data.notAFKUsers) text += data.notAFKUsers;
      if (data.afk) text += `\n\n${data.afk} member(s) were booted from the queue:\n`;
      if (data.afkUsers) text += data.afkUsers;

      message.edit(text).catch(err => console.log(`Failed to finalize in mass check!\n${err.message}`));
    };

    let resultsMessage = await sendmessage(message.channel, 'Mass AFK-checking...');

	let afkUsers = channelMonitor.queue.slice(0, channelMonitor.displaySize).filter(user => message.guild.members.cache.get(user.id).roles.cache.find(role => role.name === "AFK")).length;

    console.log('AFK users:'+afkUsers+' Checking first '+ (afkUsers+channelMonitor.displaySize) +' queue positions');

    let top = channelMonitor.queue.slice(0, channelMonitor.displaySize+afkUsers).map(user => message.guild.members.cache.get(user.id));

    let afkChecker = new AFKChecker(this.client, server, channelMonitor, top);

    afkChecker.on('update', (data) => {
      update(resultsMessage, data);
    });

    let results = await afkChecker.run();
    finalize(resultsMessage, results);
    afkChecker.removeAllListeners('update');

    return;
  }
}

module.exports = AfkCheckTopCommand;