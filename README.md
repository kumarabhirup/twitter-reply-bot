# Twitter Reply Bot

A bot that automatically replies with funny memes everytime Elon Musk tweets.

## To run the bot

- [Create](https://developer.twitter.com/en/apps) a Twitter app

- Put Twitter app credentials in `.env.sample` & rename it to `.env`.

- Find your Twitter User ID [here](https://commentpicker.com/twitter-id.php).

- Put your User ID & Twitter Username in settings by changing `settings.personal` in `db.json`.

- Add target User IDs by changing `settings.userIdsToStream` in `db.json`. These are User IDs of people you will be replying with memes to.

> Examples: Elon Musk - 44196397, MKBHD - 29873662

- Add your own memes with updated id (increment it by 1 and maintain the sequence), you may also add Image/Video URLs, tweet text, and target usernames (use `*` to target all target User IDs). Keep `isSent` to `false` when adding a new meme else it won't be tweeted.

- Run the below commands to start the bot.

```
npm i
npm start
```

# 📝 License

**MIT © [Kumar Abhirup](https://www.twitter.com/kumar_abhirup)**

_Follow me 👋 **on Twitter**_ → [![Twitter](https://img.shields.io/twitter/follow/kumar_abhirup.svg?style=social&label=@kumar_abhirup)](https://twitter.com/kumar_abhirup/)
