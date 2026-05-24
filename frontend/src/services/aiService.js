import api from "./api";

export const attendeeChatAPI = async (message) => {
  const res = await api.post(`/ai/attendee-chat`, {
    message
  });

  return res.data;
};

export const organizerCopilotAPI = async (
  message,
  organizerId
) => {
  const res = await api.post(`/ai/organizer-copilot`, {
    message,
    organizerId
  });

  return res.data;
};