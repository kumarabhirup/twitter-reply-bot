require('dotenv').config()

const Twit = require('twit')
const axios = require('axios')
const { createServer } = require('http')

const JsonDB = require('simple-json-db')
const db = new JsonDB('db.json', { jsonSpaces: 2 })

const { settings } = db.JSON()
const personalUserId = settings?.personal?.id
const personalScreenName = settings?.personal?.screenName
const userIdsToStream = settings?.personal?.userIdsToStream // elon musk - 44196397 // mkbhd - 29873662

const T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function reply(
  tweet = {}, 
  replyText = '', 
  mediaUrls = [], 
  // attachmentUrl = null
) {
  const tweetId = tweet?.id_str
  // const userScreenName = tweet?.user?.screen_name
  // const userScreenNameWithAt = `@${userScreenName}`

  let mediaIds = []
  await asyncForEach(mediaUrls, (async url => {
    let image = await axios.get(url, { responseType: 'arraybuffer' });
    let returnedB64 = Buffer.from(image?.data).toString('base64');

    const postMedia = await T.post('media/upload', { media_data: returnedB64 })
    mediaIds.push(postMedia?.data?.media_id_string)
  }))

  const replyTweet = await T.post('statuses/update', {
    status: `${replyText}`, 
    auto_populate_reply_metadata: true, 
    in_reply_to_status_id: tweetId,
    media_ids: mediaIds,
    // attachment_url: attachmentUrl
  })

  // console.log({ replyTweet })
  return replyTweet
}

async function everythingAsyncHere() {
  const stream = T.stream('statuses/filter', { follow: userIdsToStream })
  
  stream.on('tweet', async function (tweet) {
    // const detailedTweetLookup = await T.get(`/2/tweets/${tweet?.id}`)
    // console.log(JSON.stringify(detailedTweetLookup, null, 2))

    if (
      // Only reply if the tweet is from Elon,
      userIdsToStream?.includes(tweet?.user?.id_str) && 

      // and if the Tweet isn't a reply to you, 
      ![...userIdsToStream, personalUserId].includes(tweet?.in_reply_to_user_id_str) && 

      // and if the tweet doesn't mention you or other targets, 
      !(tweet?.entities?.user_mentions
        ?.map(mentions => mentions?.id_str)
        ?.some(userId => 
          [...userIdsToStream, personalUserId]?.includes(userId)
        )) &&

      // and if less than 4 users are mentioned.
      tweet?.entities?.user_mentions?.length < 4
    ) {
      // console.log({ tweet })

      // Pick random meme from db and reply
      const { memes } = db.JSON()
      const randomTweet = memes?.find(
        meme => !meme?.isSent && (
        meme?.targets?.includes(tweet?.user?.screen_name) || 
        meme?.targets?.includes(tweet?.user?.id_str) ||
        meme?.targets?.includes("*")
      ))

      if (randomTweet) {
        const replyTweet = await reply(
          tweet, 
          randomTweet?.text || "", randomTweet?.mediaUrls
        )

        if (!replyTweet) {
          console.log(`@${tweet?.user?.screen_name} tweeted (https://twitter.com/${tweet?.user?.screen_name}/status/${tweet?.id_str}), reply found in database, but failed to tweet the reply.`)
          return
        }

        // For successful reply, mark meme as 'sent' in the database
        randomTweet.isSent = true
        memes[randomTweet?.id - 1] = randomTweet
        db.set("memes", memes)

        console.log(`@${tweet?.user?.screen_name} tweeted (https://twitter.com/${tweet?.user?.screen_name}/status/${tweet?.id_str}), replied successfully (https://twitter.com/${personalScreenName}/status/${replyTweet?.data?.id_str}).`)
        return

      } else {
        console.log(`@${tweet?.user?.screen_name} tweeted (https://twitter.com/${tweet?.user?.screen_name}/status/${tweet?.id_str}), but no reply found in database.`)
        return
      }
    }

    return
  })
}

everythingAsyncHere()

const server = createServer((_req, res) => {
  res.writeHead(302, {
    Location: `https://twitter.com/${personalScreenName}`
  })

  res.end()
})

server.listen(3000)

console.log(`Listening on port 3000, connected to Twitter user @${personalScreenName}`)

// const fakeTweet = {
//   id_str: '1419887504715489286',
//   user: {
//     screen_name: 'mrwtfdude'
//   }
// }

// [
//   {
//     "id": 1,
//     "mediaUrls": [
//       "https://cms.qz.com/wp-content/uploads/2018/07/meme-featured.jpg"
//     ],
//     "text": "😂",
//     "targets": ["elonmusk", "mrwtfdude"],
//     "isSent": false
//   },
//   {
//     "id": 2,
//     "mediaUrls": [
//       "https://cms.qz.com/wp-content/uploads/2018/07/meme-featured.jpg"
//     ],
//     "text": "",
//     "targets": ["elonmusk", "mrwtfdude"],
//     "isSent": false
//   }
// ]