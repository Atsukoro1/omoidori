using UnityEngine;
using UnityEngine.UIElements;
using UnityEngine.Networking;
using WebSocketSharp;
using System.Collections.Concurrent;
using System.Collections;

public class ChatController : MonoBehaviour
{
    [System.Serializable]
    public class WebsocketResponse
    {
        public string type;
        public string data;
    }

    [System.Serializable]
    private struct EmotionMarker
    {
        public string emotion;
        public int position;
    }

    // Main character
    public GameObject mainCharacter;

    // UI Elements
    private UIDocument uiDocument;
    private VisualElement root;
    private Button sendButton;
    private TextField messageContentInput;
    private VisualElement responseContainer;
    private Label response;

    // WebSocket
    private WebSocket websocketInstance;
    private string websocketAddr = "ws://127.0.0.1:8080";

    // Audio
    private AudioSource audioSource;

    // Thread-safe queue for main thread actions
    private readonly ConcurrentQueue<System.Action> mainThreadQueue = new ConcurrentQueue<System.Action>();

    // Last message for processing emotion markers
    private string lastResponseMessage;

    private void Awake()
    {
        uiDocument = GetComponent<UIDocument>();
    }

    private void Start()
    {
        InitWebSocket();

        var lipSyncObject = GameObject.Find("LipSync");
        audioSource = lipSyncObject.GetComponent<AudioSource>();
        audioSource.loop = false;
    }

    private void Update()
    {
        while (mainThreadQueue.TryDequeue(out var action))
        {
            action?.Invoke();
        }
    }

    private string CleanTextFromEmotionTags(string textWithTags)
    {
        string pattern = @"<.*?>";
        return System.Text.RegularExpressions.Regex.Replace(textWithTags, pattern, string.Empty);
    }

    private void ShowResponseChatBoxMessage(string message)
    {
        string cleanMessage = CleanTextFromEmotionTags(message);
        responseContainer.RemoveFromClassList("hidden");
        response.text = cleanMessage;
    }

    private void HideResponseChatBox()
    {
        responseContainer.AddToClassList("hidden");
        response.text = "";
    }

    private void OnEnable()
    {
        root = uiDocument.rootVisualElement;
        sendButton = root.Q<Button>("MessageTextCTAButton");
        messageContentInput = root.Q<TextField>("MessageTextInput");
        responseContainer = root.Q<VisualElement>("ResponseContainer");
        response = root.Q<Label>("Response");

        sendButton.clicked += OnSendButtonClick;
        messageContentInput.RegisterCallback<ChangeEvent<string>>(OnTextChange);
    }

    private void OnDisable()
    {
        if (websocketInstance != null && websocketInstance.IsAlive)
        {
            websocketInstance.Close();
        }
    }

    private string currentMessage;
    private void OnTextChange(ChangeEvent<string> evt)
    {
        currentMessage = evt.newValue;
    }

    private void OnSendButtonClick()
    {
        if (!string.IsNullOrEmpty(currentMessage))
        {
            if (websocketInstance != null && websocketInstance.IsAlive)
            {
                websocketInstance.Send(currentMessage);
            }

            mainThreadQueue.Enqueue(() =>
            {
                HideResponseChatBox();
                currentMessage = "";
                messageContentInput.value = "";
            });
        }
    }

    private void InitWebSocket()
    {
        websocketInstance = new WebSocket(websocketAddr);

        websocketInstance.OnMessage += (sender, e) =>
        {
            if (!e.IsPing)
            {
                OnWebSocketMessage(e.Data);
            }
        };

        websocketInstance.OnOpen += (sender, e) =>
        {
            mainThreadQueue.Enqueue(() => Debug.Log("WebSocket connected"));
        };

        websocketInstance.OnError += (sender, e) =>
        {
            mainThreadQueue.Enqueue(() => Debug.LogError($"WebSocket error: {e.Message}"));
        };

        websocketInstance.OnClose += (sender, e) =>
        {
            mainThreadQueue.Enqueue(() => Debug.Log("WebSocket disconnected"));
        };

        websocketInstance.Connect();
    }

    private void OnWebSocketMessage(string content)
    {
        var response = JsonUtility.FromJson<WebsocketResponse>(content);

        if (response.type == "message")
        {
            mainThreadQueue.Enqueue(() =>
            {
                Debug.Log($"New message: {response.data}");

                string rawMessage = response.data;
                lastResponseMessage = response.data;

                ShowResponseChatBoxMessage(rawMessage);
            });
        }
        else if (response.type == "new_audio")
        {
            mainThreadQueue.Enqueue(() =>
            {
                StartCoroutine(DownloadAndPlayAudio(response.data));
            });
        };
    }

    private void ChangeEmotion(string emotion)
    {
        EmotionController emotionController = mainCharacter.GetComponent<EmotionController>();

        if (emotionController == null)
        {
            Debug.LogError("EmotionController not found on main character!");
            return;
        }

        emotionController.SetDefaultEmotion();

        switch (emotion.ToLower())
        {
            case "smug": emotionController.SetSmugEmotion(); break;
            case "scared": emotionController.SetScaredEmotion(); break;
            case "blushing": emotionController.SetBlushingEmotion(); break;
            case "annoyed": emotionController.SetAnnoyedEmotion(); break;
            case "confused": emotionController.SetConfusedEmotion(); break;
            case "surprised": emotionController.SetSurprisedEmotion(); break;
            case "happy": emotionController.SetHappyEmotion(); break;
            case "default": emotionController.SetDefaultEmotion(); break;
            default:
                Debug.LogWarning($"Unknown emotion: {emotion}");
                break;
        }
    }

    private IEnumerator DownloadAndPlayAudio(string audioUrl)
    {
        Debug.Log($"Downloading audio from: {audioUrl}");

        using (UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(audioUrl, AudioType.MPEG))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                AudioClip clip = DownloadHandlerAudioClip.GetContent(www);
                audioSource.clip = clip;
                audioSource.Play();
                Debug.Log("Playing downloaded audio");

                string rawMessage = lastResponseMessage;
                StartCoroutine(ProcessEmotionMarkers(rawMessage));
                StartCoroutine(ReturnToDefaultAfterAudio());
            }
            else
            {
                Debug.LogError($"Audio download failed: {www.error}");
            }
        }
    }

    private IEnumerator ProcessEmotionMarkers(string textWithMarkers)
    {
        var emotionMarkers = ParseEmotionMarkers(textWithMarkers);

        yield return new WaitUntil(() => audioSource.isPlaying);

        float audioLength = audioSource.clip.length;

        foreach (var marker in emotionMarkers)
        {
            float triggerTime = (marker.position / (float)textWithMarkers.Length) * audioLength;

            while (audioSource.time < triggerTime && audioSource.isPlaying)
            {
                yield return null;
            }

            if (audioSource.isPlaying)
            {
                ChangeEmotion(marker.emotion);
            }
        }
    }

    private System.Collections.Generic.List<EmotionMarker> ParseEmotionMarkers(string text)
    {
        var markers = new System.Collections.Generic.List<EmotionMarker>();
        int currentIndex = 0;

        while (currentIndex < text.Length)
        {
            int startMarker = text.IndexOf("<", currentIndex);
            if (startMarker == -1) break;

            int endMarker = text.IndexOf(">", startMarker);
            if (endMarker == -1) break;

            string emotion = text.Substring(startMarker + 1, endMarker - startMarker - 1);
            markers.Add(new EmotionMarker
            {
                emotion = emotion,
                position = startMarker
            });

            currentIndex = endMarker + 1;
        }

        return markers;
    }

    private IEnumerator ReturnToDefaultAfterAudio()
    {
        yield return new WaitWhile(() => audioSource.isPlaying);

        ChangeEmotion("default");
        Debug.Log("Audio finished - returned to default emotion");
    }
}