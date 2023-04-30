# Chaturbate Music Queue App

Keep track of user song requests

## App Usage

Add the "Music Queue" app to your channel on Chaturbate ([link](https://chaturbate.com/apps2/1/a1960a32-Music-Queue/)). Update the app settings and set "Song Request Tip Tokens" (`tokenAmout` variable in the code) to the appropriate token amount (tycically the same value as what you have the song request tip set to in your tip menu, if you have one). You and other users can then manage the queue with the following commands:

### Commands

##### `/queue`

Show current songs in queue

Example:
```
/queue
Notice: Music Queue:
Notice: 1. Zero by The Smashing Pumpkins
Notice: 2. Starlight by Muse
```

##### `/queue add <song name>`

Add song request to queue (if user is permitted / tipped for request)

Example:
```
/queue add Zero by The Smashing Pumpkins
```

##### `/queue remove <position>`

Remove a song at given position in the queue (only if song was added by that user)

Example:
```
/queue remove 1
Notice: Zero by The Smashing Pumpkins removed from queue
```

##### `/queue clear`

Remove all requests from queue (only room owner permitted, mods permitted with "Mods Can Edit" setting enabled)

```
/queue clear
Notice: Music queue cleared
```

##### `/queue credit <username> [credits]`
Give a user song request credits (optionally include the number of credits to give)

##### `/queue cost`

Display token amount required to request a song

Example:
```
/queue cost
Notice: Tip 100 tokens to request a song
```
