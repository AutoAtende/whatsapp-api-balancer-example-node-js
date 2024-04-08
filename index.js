const { Channel } = require("./core/channel");
const config = require("./config.json");
const {
  moveNotUsedTokenToUsed,
  getNotUsedChannels,
  removeUnAuthToken,
  checkFiles,
  DBFiles,
} = require("./core/files");
const { CSVModule } = require("./core/csv_module");
const path = require("path");
const fs = require("fs")

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const csv_module = new CSVModule();

async function selectRandomChannel() {
  // get random channel
  const tokens = getNotUsedChannels(); // get not used tokens from file
  const randomIndex = randomIntFromInterval(0, tokens.length - 1); // random index of array
  const channel = new Channel(tokens[randomIndex]); // create instance of channel
  try {
    await channel.checkHealth(); //check channel status
  } catch (e) {
    if (e === 401) {
      // if channel not auth - remove him from tokens array in config and try new
      console.log(`Token ${tokens[randomIndex]} - unauth. Remove from config file.`)
      removeUnAuthToken(tokens[randomIndex]);
      return await selectRandomChannel();
    }
  }
  moveNotUsedTokenToUsed(channel.token);
  return channel;
}

async function timeOutCheckPhone(phone) {
  try {
    const channel = await selectRandomChannel();
    const phoneStatus = await channel.checkPhone(phone); // check phone in wa. if valid - exist
    const timeOfComplete = new Date();
    console.log(
      `${channel.token} check phone: ${phone}, in time: ${timeOfComplete}. Result: ${phoneStatus}`
    );
    csv_module.writeCSV({phone, status: phoneStatus}, "./result.csv")
  } catch (e) {
    console.log(e);
  }
}

async function massCheckPhones(phones) {
  let delay = 0;
  for (let i = 0; i < phones.length; i++) {
    const randomDelay = randomIntFromInterval(config.minDelay, config.maxDelay); // random delay between checks
    delay += randomDelay;
    try {
      setTimeout(timeOutCheckPhone, delay, phones[i]); // set delayed check
    } catch (e) {
      console.log(e);
    }
  }
}

async function init() {
  try {
    if (config.tokens.length === 0)
      throw "Not found valid tokens! (check config.json)";
    if(fs.existsSync(DBFiles.phones))
    checkFiles();
    const phones = csv_module.getPhonesFromCSV(path.resolve("./phones.csv"));
    await massCheckPhones(phones);
  } catch (e) {
    console.log(e);
  }
}

init().then(() => console.log("Started"));
