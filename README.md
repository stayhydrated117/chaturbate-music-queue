# Music Queue
> Chaturbate music queue app

Keep track of user's song requests so you can focus on all the other types of requests 😉 Pairs well with "song request" tip rewards 🎶

## App Usage

Add the "Music Queue" app to your channel on Chaturbate ([link](https://chaturbate.com/apps2/1/a1960a32-Music-Queue/)).

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


##### `/queue edit <position in queue> <new song name>`

Change the name of a song request in the queue.  Fails if user did not add that song or editing queue setting is disabled.

Example:
```
/queue edit 2 don't fade away by beach fossils
Notice: Song #2 changed from won't fade away by beach fossils to don't fade away by beach fossils
```

##### `/queue clear`

Remove all requests from queue (only room owner permitted, mods permitted with "Mods Can Edit" setting enabled)

Example:
```
/queue clear
Notice: Music queue cleared
```

##### `/queue credit <username> [credits]`
Give a user song request credits. Default credit credit amount is the value of `reqsGivenPerTip` but can be changed by setting the additional `credits` argument. Negative values for `credits` will subtract credits from that user. Set a user's credits to `0` by providing any negative `credits` value larger than or equal to that user's current num of credits (e.g. user has `20` credits. both `/queue credit <user> -20`, and `/queue credit <user> -10000` will set that user's credits to `0`)

Example:
```
/queue give testuser1
Notice: Credits for testuser1 set to 1

/queue give testuser1 3
Notice: Credits for testuser1 set to 4

/queue give testuser1 -10
Notice: Credits for testuser1 set to 0
```

##### `/queue cost`

Display token amount required to request a song

Example:
```
/queue cost
Notice: Tip 100 tokens to request a song
```

### Settings

- Set "Song Request Tip Tokens" to 0 to allow requesting songs without needing to tip
- Allow for multiple song requests to be added per tip by updating "Song Requests per Tip"
- Hide displaying which user the song was added by via setting "Show Who Added the Song Request" to False