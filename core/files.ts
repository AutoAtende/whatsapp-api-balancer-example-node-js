import * as fs from "fs";
import { tokens } from "../config.json";

export enum DBFiles {
  "config" = "config.json",
  "usedTokens" = "usedTokens.json",
  "notUsedTokens" = "notUsedTokens.json",
}

export function checkFiles() {
  // checking for files
  const keys = Object.keys(DBFiles);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const path = DBFiles[key];
    if (path === DBFiles.config) continue;
    fs.writeFile(path, "[]", function (err) {
      if (err) throw err;
      console.log(`${key} is created succesfully.`);
    });
  }
}

export function removeUnAuthToken(token: string) {
  const fileDataRaw = fs.readFileSync(DBFiles.config, "utf-8");
  const fileData: { tokens: string[] } = JSON.parse(fileDataRaw);
  const index = fileData.tokens.findIndex((elem) => elem === token);
  fileData.tokens.splice(index, 1);
  const writeData = JSON.stringify(fileData);
  fs.writeFileSync(DBFiles.config, writeData);
}

function addChannelToUsed(token: string) {
  const fileDataRaw = fs.readFileSync(DBFiles.usedTokens, "utf-8");
  const fileDataJson: string[] = JSON.parse(fileDataRaw);
  fileDataJson.push(token);
  const writeData = JSON.stringify(fileDataJson);
  fs.writeFileSync(DBFiles.usedTokens, writeData);
}

export function getNotUsedChannels(): string[] {
  const fileDataRaw = fs.readFileSync(DBFiles.notUsedTokens, "utf-8");
  const fileData: string[] = JSON.parse(fileDataRaw);
  if (fileData.length === 0) {
    refreshAllTokens();
    return getNotUsedChannels();
  }
  return fileData;
}

function removeChannelFromNotUsed(token: string) {
  const fileDataRaw = fs.readFileSync(DBFiles.notUsedTokens, "utf-8");
  const fileDataJson: string[] = JSON.parse(fileDataRaw);
  if (fileDataJson.length === 0) {
    refreshAllTokens();
    removeChannelFromNotUsed(token);
    return;
  }
  const tokenIndex = fileDataJson.findIndex((elem) => elem === token);
  if (tokenIndex === -1) throw "Channel not found";
  fileDataJson.splice(tokenIndex, 1);
  const writeData = JSON.stringify(fileDataJson);
  fs.writeFileSync(DBFiles.notUsedTokens, writeData);
}

export function moveNotUsedTokenToUsed(token: string) {
  removeChannelFromNotUsed(token);
  addChannelToUsed(token);
}

function refreshAllTokens() {
  const notUsedTokens = JSON.stringify(tokens);
  fs.writeFileSync(DBFiles.notUsedTokens, notUsedTokens);
  const usedTokens = JSON.stringify([]);
  fs.writeFileSync(DBFiles.usedTokens, usedTokens);
}
