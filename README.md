# Hyde
Static website compiler written in Node.js for Battle of The Hacks hosted by Andreessen Horowitz.

# How to run

### Create Empty Project
Run Hyde init
```
$ node hyde.js init
```
Will create a new directory Hyde_Project, where all files can be added.

### Compile Project
To compile
```
$ node hyde.js compile (desired directory name)
```
### Custom Compile
To use custom directories
```
$ node hyde.js (desired source name) (desired target name)
```


Supports the following languages/pre-processors:
- Markdown
- Jade
- Less
- JSON Variables


Backlog:
- Github webhook
