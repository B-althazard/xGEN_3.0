batch-prompt_img-testing.userscript.md

UserScript Tool: ViolentMonkey
https://violentmonkey.github.io/guide/creating-a-userscript/

userscript use case
The automation of testing prompts and image quality.

UserScript URLs: 
 - 'https://venice.ai/chat'
 - 'https://venice.ai/chat/*'
 
Features:
 - prompt injection (batch)
 - img download + renaming with an unique identifier
 - Starting a new chat
 - Generating Iterations
 - Folder Creation and Sorting
 - UI + activation icon - Right Side, Center Screen
 
Description:
When on the website a floating icon should be available at the right side, centered in the middle.
When the icon is pressed a floating UI should spawn containing the following options:

 - A prompt box where the prompt can be pasted in, include a paste button
 - Prompt_ID_Box
 - Option to choose how many times the same prompt needs to be used
 - Option to choose if the renders are iterations (in the same chat)
 - Option to choose if the renders are uniques (every image has a new chat)
 - Images once rendered need to be downloaded, filename formatted like: 'UniqueID-SequenceNumber-Iteration_or_New.*'
 - Folders are needed to be created with the 'UniqueID' as Folder name and time images need to be moved there.