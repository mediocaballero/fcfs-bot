const AFKChecker = require('./afk_checker');
const sendmessage = require('../util/sendmessage');

class AFKCheckScheduler {
  constructor(client, channelMonitor, interval) {
    this.client = client;
    this.channelMonitor = channelMonitor;
    this.interval = interval;
  }

  async run() {
    try {
      let guild = this.client.guilds.resolve(this.channelMonitor.guildID);
      let server = this.client.dataSource.servers[guild.id];
      let outputChannel = guild.channels.resolve(this.channelMonitor.autoOutput);
      
      if (!this.channelMonitor.queue.length) return;

      const update = (message, data) => {
        let text = `Auto chequeo AFK...\n\n`;
        if (data.recentlyChecked) text += `${data.recentlyChecked} miembro(s) fueron chequeados por AFK y se les saltó:\n`;
		if (data.recentlyCheckedUsers) text += data.recentlyCheckedUsers;
        if (data.notInVC) text += `\n${data.notInVC} miembros(s) no estaban en el canal de voz y se les saltó\n`;
        if (data.notAFK) text += `\n${data.notAFK} miembro(s) reaccionaron al mensaje a tiempo:\n`;
		if (data.notAFKUsers) text += data.notAFKUsers;
        if (data.afk) text += `\n${data.afk} miembro(s) fueron expulsados de la lista:\n`;
		if (data.afkUsers) text += data.afkUsers;

        message.edit(text).catch(err => console.log(`Failed to update in auto check!\n${err.message}`));
      };

      const finalize = (message, data) => {
        let text = `Auto chequeo AFK completo!\n\n`;
        if (data.recentlyChecked) text += `${data.recentlyChecked} miembro(s) fueron chequeados por AFK y se les saltó:\n`;
		if (data.recentlyCheckedUsers) text += data.recentlyCheckedUsers;
        if (data.notInVC) text += `\n${data.notInVC} miembros(s) no estaban en el canal de voz y se les saltó\n`;
        if (data.notAFK) text += `\n${data.notAFK} miembro(s) reaccionaron al mensaje a tiempo:\n`;
		if (data.notAFKUsers) text += data.notAFKUsers;
        if (data.afk) text += `\n${data.afk} miembro(s) fueron expulsados de la lista:\n`;
		if (data.afkUsers) text += data.afkUsers;

        message.edit(text).catch(err => console.log(`Failed to finalize in auto check!\n${err.message}`));
      };

      let resultsMessage = await sendmessage(outputChannel, 'Auto chequeo AFK...');

	  let afkUsers = this.channelMonitor.queue.slice(0, this.channelMonitor.displaySize).filter(user => guild.members.cache.get(user.id).roles.cache.find(role => role.name === "AFK")).length;

	  console.log('AFK users:'+afkUsers+' Checking first '+ (afkUsers+this.channelMonitor.displaySize) +' queue positions');

      let top = this.channelMonitor.queue.slice(0, this.channelMonitor.displaySize+afkUsers).map(user => guild.members.cache.get(user.id));

      let afkChecker = new AFKChecker(this.client, server, this.channelMonitor, top);

      afkChecker.on('update', (data) => {
        update(resultsMessage, data);
      });

      let results = await afkChecker.run();
      finalize(resultsMessage, results);
      afkChecker.removeAllListeners('update');
    } catch (err) {
      console.error(err);
    }
  }

  start() {
    if (this.startTimeout) clearTimeout(this.startTimeout);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    if (this.interval === -1) return;
    let timeUntilNext = this.interval - (Date.now() % this.interval);
    this.startTimeout = setTimeout(() => {
      this.run();
      this.intervalTimer = setInterval(() => {
        this.run();
      }, this.interval);
    }, timeUntilNext);

    return timeUntilNext;
  }

  changeInterval(interval) {
    this.interval = interval;
    return this.start();
  }
}

module.exports = AFKCheckScheduler;
