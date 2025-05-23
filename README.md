# Project OMOIDORI (思い 取り)
Virtual AI assistant

## Notice
The frontend for this project is not public because some of the assets I used are paid and I do not want to mess with git in my Unity project and exclude/include stuff, if you want the frontend just ask me on any platform

## Showcase
Small showcase of how Omoidori works
![Showcase](./engine/assets/showcase.png "Showcase of the chat with omoidori")</br>

## How it works right now
This is primarily for me to later see this and remember how it works

### Structure of the whole thing
The whole thing consists of tho parts
1. AI engine - this project, currently written in Typescript
2. Unity frontend - The whole "game" coded in C# displaying all the data coming from the engine (messages, emotions, voice, etc...)

### Communication between Unity and Engine
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
