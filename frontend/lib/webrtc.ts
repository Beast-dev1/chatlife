/**
 * WebRTC helpers for peer connection, offer/answer, and ICE.
 * Used by useWebRTC; all functions are stateless.
 * STUN server: set NEXT_PUBLIC_STUN_URL in .env.local (e.g. stun:stun.l.google.com:19302).
 */

const DEFAULT_STUN = "stun:stun.l.google.com:19302";

export function getDefaultIceServers(): RTCIceServer[] {
  const url =
    typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_STUN_URL
      : undefined;
  if (typeof url === "string" && url.trim()) {
    return [{ urls: url.trim() }];
  }
  return [{ urls: DEFAULT_STUN }];
}

export function createPeerConnection(iceServers?: RTCIceServer[]): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: iceServers ?? getDefaultIceServers(),
  });
}

export async function createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(
  pc: RTCPeerConnection,
  remoteOffer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit | null | undefined
): Promise<void> {
  if (candidate == null) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.warn("addIceCandidate failed:", err);
  }
}

export async function getLocalStream(
  audio: boolean,
  video: boolean
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: audio ? true : false,
    video: video ? true : false,
  });
}

export function attachTracksToConnection(
  pc: RTCPeerConnection,
  stream: MediaStream
): void {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}
