Name:
```
Music Queue
```

Version:
```
0.1.1
```

Summary:
```
Automatically add song requests to a queue 🎶
```

Description:
```
Keeping track of song requests can be difficult (was it in a tip note? maybe written in chat at one point but is now lost in a sea of very polite, non-demanding chat messages?). Music Queue keeps track of users' song requests by adding them to a list so it's easy for you as the broadcaster to always know what song to play next.

There are 3 ways a song can be added to the queue (each can be enabled/disabled):
- include the song request in the tip note
- send a chat message with the song request immediately after tipping
- use the `/queue add <song name>` command (more info below)

Common Commands:

/queue
  - Show the queue

/queue next
  - Move the queue forward to the next song, display that song's name in chat, and remove it from the queue.

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
  - Only usable by room owner or mods along with the "Mods Can Edit the Queue" setting enabled
  - Example:
    /queue next
    Notice: The next song is Zero by The Smashing Pumpkins  (added by stayhydrated117)

/queue add <song name>
  - Adds a song request to the queue
  - Fails if user does not satisfy credit requirements (i.e. they have not tipped to request a song yet)
  - Example:
    /queue add won't fade away by beach fossils
    Notice: won't fade away by beach fossils added to queue (#2)

/queue edit <position in queue> <new song name>
  - Change the name of a song request in the queue
  - Fails if user did not add that song or editing queue setting is disabled
  - Example:
    /queue edit 2 don't fade away by beach fossils
    Notice: Song #2 changed from won't fade away by beach fossils to don't fade away by beach fossils

/queue remove <position in queue>
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
  /queue credit @stayhydrated117 12
  Notice: stayhydrated117 now has 12 song request credits

/queue cost
  - Display token amount required to request a song
  - Example:
  /queue cost
  Notice: Tip 100 tokens to request a song

Settings:
- Set "Song Request Tip Tokens" to 0 to allow requesting songs without needing to tip
- Allow for multiple song requests to be added per tip by updating "Song Requests per Tip"
- Hide displaying which user the song was added by via setting "Show Who Added the Song Request" to False

More documentation: https://github.com/stayhydrated117/chaturbate-music-queue
```
