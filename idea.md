# The Idea

## Database
Use sqlite3, main `entries` table format something like
| start_time | end_time     | seconds_difference |
| ---------- | ------------ | ------------- |
| 2023-07-30T00:16:44Z
       | 2023-07-30T00:16:50Z
 | 6       |


and then a view `ms_sums` that is just the sum of the ms_difference columns from `entry`


edit:
sqlite stores dates in integer format, I guess, which represents seconds since 1970, so ms will be seconds difference not ms
