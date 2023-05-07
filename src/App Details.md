Name:
```
Music Queue
```

Version:
```
0.0.4
```

Summary:
```
Keeps track of user's song requests so you can focus on all the other types of requests 😉
Pairs well with "song request" tip rewards 🎶
```

Description:
```
If you allow users to request songs on your streams, then you already know how difficult it can be to locate where the user actually wrote their request (was it in the tip note? maybe written in chat at one point but is now lost in a sea of very polite, non-demanding chat messages? perhaps they tipped but then got distracted). The Music Queue keeps track of users' song requests by automatically adding them to a queue so it's easy for you as the broadcaster to always know what song to play next.

As the broadcaster the main command you'll use is:

/queue next

This will move the queue forward to the next song, display that song's name in chat, and remove it from the queue.

There are a few ways user song requests can be added to the queue (each of which can be enabled/disabled through app settings):
- user includes the song request in the tip note when tipping to request a song
- user uses the `/queue add <song name>` command
- user sends a chat message with the song request immediately after tipping

Full List of Commands:

/queue
  - Show the current songs in queue.
  - Example:
    /queue
    Notice: Music Queue:
    Notice: 1. Zero by The Smashing Pumpkins (added by stayhydrated117)
    Notice: 2. fail forever - when saints go machine (added anonymously)

/queue next
  - Moves queue forward one song.
  - Example:
    /queue next
    Notice: The next song is Zero by The Smashing Pumpkins  (added by stayhydrated117)

/queue add <song name>
  - Adds a song request to the queue
  - Fails if user does not satisfy credit requirements (i.e. they have not tipped to request a song yet)
  - Example:
    /queue add don't fade away by beach fossils
    Notice: don't fade away by beach fossils added to queue

/queue remove <position>
  - Remove a song at given position in the queue
  - Fails when user attempts to remove a song they did not add
  - Will not give the user back their song request credit
  - Example:
    /queue remove 2
    Notice: don't fade away by beach fossils (added by stayhydrated117) removed from queue

/queue clear
  - Remove all requests from queue
  - Fails if user is not a mod or if the "Mods Can Edit Queue" setting is not enabled
  - Example:
    /queue clear
    Notice: Music queue cleared

/queue credit <username> [credits]
  - Check a user's song request credits
  - Optionally include the number of credits to give that user
  - Fails when a user who is not a mod attempts to modify credits or view another user's credits
  - Example:

/queue cost
  - Display token amount required to request a song

Settings:
- Set "Song Request Tip Tokens" to 0 to allow requesting songs without needing to tip
- Allow for multiple song requests to be added per tip by updating "Song Requests per Tip"
- Hide displaying which user the song was added by via setting "Show Who Added the Song Request" to False
- Limit how many requests a user can have in the queue at once by  lowering "Maximum Song Requests per User"

More documentation: https://github.com/stayhydrated117/chaturbate-music-queue
```