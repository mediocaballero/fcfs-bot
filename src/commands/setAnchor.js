const { Command } = require('discord-akairo');
const mps_helper = require('../util/mps_helper');
const sendmessage = require('../util/sendmessage');
const apf = require('../util/arg_parse_failure');
const role_utils= require('../util/role_utils');

class SetAnchorCommand extends Command {
  constructor() {
    super('anchor', {
      aliases: ['anchor', 'ancla'],
      split: 'quoted',
      channel: 'guild',
      userPermissions: message => mps_helper(this.client, message),
      args: [
        {
          id: 'member',
          type: (message, phrase) => {
            let member;
            if (!phrase) return Flag.fail({ reason: 'missingArg' });

            member = this.client.commandHandler.resolver.type('member')(message, phrase);
            
			if (!member) return Flag.fail({ reason: 'notAMember', phrase: phrase });

            return member;
          },otherwise: (msg, { failure }) => apf(this.client, msg, 'member', failure)
        },
      ]
    });
  }

  async exec(message, args) {
    // let ds = this.client.dataSource;
    // let server = ds.servers[message.guild.id];
	const ANCHOR_ROLE = message.guild.roles.cache.find(role => role.name === "ancla");
	let newStatus = args.member.roles.cache.has(ANCHOR_ROLE.id)?'inactivo':'activo';
	
    role_utils.switchAnchorRole(message.guild, args.member.displayName)

    sendmessage(message.channel, `Cambiado el estado de ancla para ${args.member.displayName} a ${newStatus}!`);
  }
}

module.exports = SetAnchorCommand;