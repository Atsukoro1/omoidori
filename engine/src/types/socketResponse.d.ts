interface SocketResponse {
    type: 'message' | 'new_audio';
    data?: string;
}