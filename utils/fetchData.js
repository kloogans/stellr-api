const fetch = require("node-fetch")

exports.fetchMedia = async (id, end) => {
  const url = `https://instagram.com/graphql/query/?query_id=17888483320059182&id=${id}&first=12&after=${end}`

  try {
    const d = await fetch(url)
    const data = await d.json()
    return await data.data.user.edge_owner_to_timeline_media
  } catch (e) {
    return e
  }
}
