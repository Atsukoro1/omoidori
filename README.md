![Omoidori banner](./assets/header_image.png "Omoidori banner")</br>
# Project OMOIDORI (思い 取り)
Virtual AI assistant through Discord

TODOs in short time:

- [x] Therapist-like approach
- [x] Remember things about user (context)
- [] Better handling of long time memories with vector DB
- [] User activity awareness (only ideas)
    - [] Wakatime api
    - [] Apple healthkit (to my apple watch) - too hard probs won't do this
    - [] Discord status (if user logs on after long time - it will welcome him to spark up conversation)
    - [] Detect what is user doing and make something with it - remember it maybe?
- [] Program to detect desktop activity **very time consuming idea probs wont do** - also would need web server in order to work
- [] Caching of some things in order to save money on prooompting :3
- [x] Vector database for message saving
- [] Rabbit MQ instead of cron set to minute to deliver perfectly timed messages
- [x] Logging to be perfectly aware of what's happening inside (in case it fails - for debugging)
- [] usage of MCP instead of classic tooling? :3

TODOs in the long run: 
- I want to make something like Neuro sama with face and voice features but I lack hardware and will be very expensive to do it 
in cloud so the features are here: 

- [] Voice recognition (maybe mood recognition and responding in the same matter)
- [x] Voice responses
- [x] Some model that will move as it will speak, at least to look like it's something speaking with you (this will make it to not be Discord bot anymore lol but nevermind) Is done partially, it does respond to emotions but does not have any additional body movement 

VIBE CODING AT IT'S FINEST
This project is made with DeepSeek, just had a quick *ADHD moment* idea and really had to make it reality :D
please don't look into the code, I'm retarded
-- Edit - It's not quick ADHD idea anymore, I'm working on it for more than 2 weeks xd and without AI rn and I think the code is pretty decent - yay
-- Edit (4/19/2025) It surprised me that it's a pretty decent project right now :O Just waiting for the hardware and I will make it run locally :D

## How it works right now
This is primarily for me to later see this and remember how it works

### Communication between Unity frontend and the AI engine
Those two programs communicate over websocket consisting being structured as this
```json
{
    type: 'message',
    date: 'Hello what's up'
}
```
1. Type - Can be message (Incoming text message from the AI) or new_audio (new audio AI voice ready to be download and played on the client)
2. Data - If type message, it is textual message, otherwise it's audio url to download from

### AI processing of the messages

#### Conversation-aware context
1. Every call to an AI includes previous (10-15) messages for the assistant to new message better (short time memory).
2. Every call has system prompt including previous messages from vector database (is queried using the current new message to find similar text messages), this is used for a long time memory. 
3. In the system prompt, there are always stuff from the `context.ts` file mentioning all things assistant needs to know to behave as it should be (persona, example responses, how not and do respond). Used for assistant self-awareness.

#### Emotions in chat messages
Textual model includes emotions in angle brackets (<>) to specify emotions. Example message would look like this: "<\default> Hello, I'm Omoidori what are you doing right now?<\blushing>".

#### Creating voice messages
Assistant also makes/generates a voice recording of the message (voice tone is determined by the emotions mentioned in previous paragraph - Emotions in chat messages). This recording is then saved in data directory of this project.

### Unity displaying the messages in action

