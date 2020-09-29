# Mangadex bot

[![telegram chat](https://img.shields.io/badge/telegram-chat-blue.svg)](https://t.me/joinchat/C3fG501tOFdVUSaOqxDigA) [![Mangadex bot](https://img.shields.io/badge/mangadex-bot-blue.svg)](https://t.me/mymanga_bot)

## Features

- Mark as read
- Sharing manga and chapters in other chats
- Inline search
- Mangadex manga links detector (bot will send manga description after you send him a link)
- Instant reading via Instant View technology
- Favorite list
- Reading list
- Share manga and chapter outside telegram

## In progress

- Gets updates (RSS) for favorite manga in separate chat
- Mangadex MDList sync (only in bot)
- Login to mangadex via bot to get direct access to MDlist, automatic reading tracking on MD, other...

## Commands

Use `/index` or `/search` to access mangadex search page or `/search <manga title>` to search some manga on mangadex.  

Other commands and features are still in development.  

## Inline mode

<img src="https://i.imgur.com/5i5LiOs.png" height="400"><img src="https://i.imgur.com/UC5Dfg9.png" height="400">

## Tips

- I recommend to use Official Telegram app for [Android](https://telegram.org/dl/android) or [iOS](https://telegram.org/dl/ios) instead of [X version](https://play.google.com/store/apps/details?id=org.thunderdog.challegram&hl=en), Telegram beta is ok too. Because in X version (for Android, i don't have iOS device, so idk) pictures have worse quality than in Official one (for Android, i don't have iOS device, so idk, and yes, X version is official too, but it's _a slick experimental Telegram client based on TDLib._ [Here](https://telegram.org/apps#telegram-database-library-tdlib)).

## Contribution

I'd recommend to use these aliases to work with project:
```bash
alias dc='docker-compose'
alias dcd='docker-compose -f docker-compose.dev.yml'
alias dcdlogs='docker-compose -f docker-compose.dev.yml logs -f --tail="100"'
```

### Install dependencies

Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).  
To run project in dev mode with hot reload use command
```bash
// alias
dcd up -d

// no alias
docker-compose -f docker-compose.dev.yml up -d
```
By doing this you'll start container with nodemon inside it that will restart application when it'll detect changes.  
Now you have 2 options:

1. run typescript watcher, that'll watch changes in src directory and compile project to dist folder which is watched by nodemon.
```bash
yarn watch-ts
```
2. use vscode debugger to attach to container, start compilation in the background and you can debug application now. (Or use keyboard shortcut: `CTRL + F5` or `CMD + SHIFT + D` on mac)

To access logs:
```bash
// alias
dcdlogs

// no alias
docker-compose -f docker-composer.dev.yml logs -f
```

To stop project
```bash
// alias
dcd down

// no alias
docker-compose -f docker-composer.dev.yml down
```

To start project in production mode
```bash
// alias
dc up -d

// no alias
docker-compose up -d
```