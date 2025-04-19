interface SocketResponse {
    type: 'message' | 'new_audio' | 'emotion';
    data?: string;
}