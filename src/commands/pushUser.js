const { Command, Argument } = require('discord-akairo');
const sendmessage = require('../util/sendmessage');
const mps_mod = require('../util/mps_mod');
const apf = require('../util/arg_parse_failure');

class PushUserCommand extends Command {
  constructor() {
    super('pushuser', {
      aliases: ['pushuser', 'push'],
      split: 'quoted',
      userPermissions: (message) => mps_mod(this.client, message),
      channel: 'guild',
      args: [
        {
          id: 'member',
          type: 'queuedMember',
          otherwise: (msg, { failure }) => apf(this.client, msg, 'member', failure)
        },
        {
          id: 'positions',
          type: Argument.compose('required', 'integer'),
          otherwise: (msg, { failure }) => apf(this.client, msg, 'position', failure)
        }
      ]
    });
  }

  async exec(message, args) {
    let ds = this.client.dataSource;
    let server = ds.servers[message.guild.id];
    let channelMonitor = server.channelMonitors[args.member.voice.channelID];

    await channelMonitor.pushBackUserInQueue(args.member.id, args.positions);
    let newPosition = channelMonitor.queue.findIndex(user => user.id === args.member.id) + 1;
    channelMonitor.timeoutUpdateDisplay();
    ds.saveMonitor(channelMonitor.id);

    return sendmessage(message.channel, `${args.member.displayName}'s was pushed ${args.positions} positions in ${channelMonitor.name}, and is now at position ${newPosition}`);
  }
}

module.exports = PushUserCommand;