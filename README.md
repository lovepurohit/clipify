# Go shared clipboard


## Description
This is a go shared clipboard which will run a server and open a UI. On the UI, it will show the clips which user will save.
The UI will only be accessible on local network.
The script will clear the DB or whatever that it is using to store the clipboard data when it exits

To run it in docker, use `--network host` to use host network instead of bridge network


## Phase 1
1. It will run on one machine.
2. UI will be exposed on local network i.e., same WIFI, etc
3. Script can use SQLite to store clips send to script.
4. Should expose two endpoints for backend
   1. list-clips => Use to list all the clips in descending order
   2. add-clips => add a new clip
5. When exit, clear the clips.