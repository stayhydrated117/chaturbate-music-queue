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
