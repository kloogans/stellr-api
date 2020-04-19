require("dotenv").config()
const fetch = require("node-fetch")
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const app = express()
const port = 8080
const Twit = require("twit")
const T = new Twit({
  consumer_key: process.env.TW_CONSUMER,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  access_token: process.env.TW_ACCESS_TOKEN,
  access_token_secret: process.env.TW_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000,
  strictSSL: true
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.get("/", (req, res) => {
  res.send("api running")
})

app.get("/twitter", (req, res) => {
  console.log("running")
  T.get(
    "users/lookup",
    { screen_name: req.query.username },
    (err, data, response) => {
      res.send(data[0])
    }
  )
})

app.get("/weather", async (req, res) => {
  const url = `https://api.darksky.net/forecast/${process.env.DARK_SKY_KEY}/27.810300,-82.697240`
  try {
    const data = await fetch(url),
      json = await data.json()
    res.send(json.currently)
  } catch (e) {
    console.error(e)
  }
})

app.get("/twitter/feed", (req, res) => {
  console.log("running")
  T.get(
    "statuses/user_timeline",
    {
      screen_name: req.query.username,
      count: 200,
      include_rts: false,
      exclude_replies: true
    },
    (err, data, response) => {
      data.map(tweet => {
        delete tweet.user
      })
      // console.log(data)
      res.send(data)
    }
  )
})

app.get("/instagram", (req, res) => {
  let instagram_data

  const fetchUser = async () => {
    const url = `https://www.instagram.com/${req.query.username}/?__a=1`
    try {
      const data = await fetch(url)
      const json = await data.json()
      const user = json.graphql.user
      const feed = json.graphql.user.edge_owner_to_timeline_media.edges
      const feedInfo = json.graphql.user.edge_owner_to_timeline_media

      console.log(json)

      let likes = 0,
        comments = 0

      feed.forEach(post => {
        const l = post.node.edge_liked_by.count
        const c = post.node.edge_media_to_comment.count
        likes += l
        comments += c
      })

      const averageLikes = (likes / feed.length).toFixed(0),
        averageComments = (comments / feed.length).toFixed(0),
        totalEngagement = (
          ((Number(averageLikes) + Number(averageComments)) /
            user.edge_followed_by.count) *
          100
        ).toFixed(2)

      instagram_data = {
        user: {
          full_name: user.full_name,
          username: user.username,
          id: user.id,
          profile_picture: user.profile_pic_url_hd,
          link: user.external_url,
          bio: user.biography,
          followed_by: user.edge_followed_by.count,
          following: user.edge_follow.count,
          likes_avg: averageLikes,
          comments_avg: averageComments,
          totalEngagementRate: totalEngagement,
          is_private: user.is_private,
          posts: feed,
          feed_info: {
            posts_count: feedInfo.count,
            end_cursor: feedInfo.page_info.end_cursor
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (req.query.username) {
    fetchUser().then(() => res.send(JSON.stringify(instagram_data)))
  } else {
    instagram_data = {
      message: "You must pass a username query into the URL."
    }
    res.send(JSON.stringify(instagram_data))
  }
})

app.listen(port, () => console.log(`Listening on port ${port}`))
