const EventEmitter = require('events');

class AFKChecker extends EventEmitter {
  constructor(client, server, channelMonitor, users) {
    super();

    this.client = client;
    this.server = server;
    this.channelMonitor = channelMonitor;
    this.users = users;
    this.lastEmit = 0;
  }

  async runSingle(userToCheck) {
    let guild = this.client.guilds.resolve(this.server.id);
    let voiceState = guild.members.cache.get(userToCheck.id).voice;
	let extratime = (this.channelMonitor.queue.length - this.channelMonitor.queue.findIndex(user => user.id === userToCheck.id))*1000;
	await new Promise(resolve => setTimeout(resolve, extratime));

    if ((Date.now() - this.channelMonitor.lastAfkChecked[userToCheck.id]) < 60000) {
      this.recentlyChecked++;
      this.recentlyCheckedUsers.push(userToCheck.displayName);
      this.emitIfSafe();
      return;
    }
    this.channelMonitor.lastAfkChecked[userToCheck.id] = Date.now() + this.channelMonitor.afkCheckDuration;
    
    let mentionMessage = '**[CHEQUEO AFK]**\nReacciona con el pulgar hacia arriba a este mensaje si no estás AFK para mantener tu posición en la lista de espera';
    await userToCheck.send(mentionMessage).then(msg => {
      msg.react('👍')
        .catch(err => {
          console.log(`Fallo en reaccionar al mensaje!\n${err.message}`);
        });

      const filter = (reaction, user) => {
          return ['👍'].includes(reaction.emoji.name) && user.id === userToCheck.id;
      };

      let halfwayTimer = setTimeout(() => {
        userToCheck.send('AVISO! Ha pasado ya la mitad de la duración del chequeo AFK! Reacciona ahora para mantener tu posición en la lista!')
          .catch(err => {
            console.log(`Fallo al enviar el mensaje a mitad de tiempo de chequeo AFK!\n${err.message}`);
          });
      }, this.channelMonitor.afkCheckDuration / 2);

      return msg.awaitReactions(filter, { max: 1, time: this.channelMonitor.afkCheckDuration, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

            if (reaction.emoji.name === '👍') {
              msg.edit('**[CHEQUEO AFK]**\nGracias! Se mantendrá tu posición en la lista!.')
                .catch(err => console.log(`Fallo al editar el mensaje!\n${err.message}`));
              clearTimeout(halfwayTimer);
              this.notAFK++;
              this.notAFKUsers.push(userToCheck.displayName);
              this.emitIfSafe();
              this.channelMonitor.lastAfkChecked[userToCheck.id] = Date.now();
              return;
            }
        })
        .catch(collected => {
          //voiceState.kick().catch(err => console.error(`Failed to kick user!\n${err.message}`));
          //this.channelMonitor.removeUserFromQueue(userToCheck.id);
		  this.channelMonitor.pushBackUserInQueue(userToCheck.id, 20);
          this.afk++;
          this.afkUsers.push(userToCheck.displayName);
          this.emitIfSafe();
          msg.reply('Has fallado por no reaccionar al mensaje a tiempo. Se te ha empujado hacia el final de la lista.')
            .catch(err => console.log(`Failed to send missed check message!\n${err.message}`));
          return;
        });
    }).catch(err => {
      if (err.code === 50007) {
        voiceState.kick();
      }
      console.log(`Failed to send AFK check message to user ${userToCheck.id}!\n${err.message}`);
    });
  }

  async run() {
    let guild = this.client.guilds.resolve(this.server.id);

    let members = this.users.reverse().map(user => guild.members.cache.get(user.id));

    let actuallyInVC = members.filter(member => (member.voice && member.voice.channelID === this.channelMonitor.id));

    this.recentlyChecked = 0;
    this.notInVC = this.users.length - actuallyInVC.length;
    this.notAFK = 0;
    this.afk = 0;

    this.recentlyCheckedUsers = [];
    this.notInVCUsers = [];
    this.notAFKUsers = [];
    this.afkUsers = [];
	

    let promises = actuallyInVC.map(user => this.runSingle(user));
    await Promise.all(promises);

    return {
      recentlyChecked: this.recentlyChecked,
      notInVC: this.notInVC,
      notAFK: this.notAFK,
      afk: this.afk,
      recentlyCheckedUsers: this.recentlyCheckedUsers,
      notInVCUsers: this.notInVCUsers,
      notAFKUsers: this.notAFKUsers,
      afkUsers: this.afkUsers
    };
  }

  emitIfSafe() {
    if (Date.now() - this.lastEmit < 10000) return;
    if (this.emitTimer) return;
    this.emitTimer = setTimeout(() => {
      this.emitNow();
    }, 10000);
  }

  emitNow() {
    this.emitTimer = null;
    this.emit('update', {
      recentlyChecked: this.recentlyChecked,
      notInVC: this.notInVC,
      notAFK: this.notAFK,
      afk: this.afk
    });
  }
}

module.exports = AFKChecker;
